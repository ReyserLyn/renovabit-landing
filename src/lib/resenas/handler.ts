/**
 * Orquestador puro del formulario de reseñas.
 *
 * Reutiliza la infraestructura del formulario de contacto: validación de origen
 * (`@/lib/contact/origin`), Turnstile (`@/lib/contact/turnstile`), límite de
 * envíos (`@/lib/contact/ratelimit`) y el envío/simulación de correos
 * (`@/lib/contact/resend`, con la misma bandera `CONTACT_DEV_SIMULATE_EMAIL`).
 * Lo propio de reseñas: persistencia en D1, subida de la foto a R2 y las dos
 * plantillas de correo.
 *
 * Orden de defensas: origen, límite de envíos, honeypot/trampa de tiempo,
 * Turnstile (fail-closed) y validación. La reseña se guarda antes de enviar los
 * correos: si el correo falla, la reseña ya está a salvo en el panel.
 */

import * as v from "valibot";
import { getServicioById, RESENA_SERVICIO_OTRO } from "@/data/resenas-servicios";
import { createDb } from "@/db/client";
import { type NuevaResena, resenas } from "@/db/schema";
import type { FetchLike } from "@/lib/contact/fetch";
import { clientIp } from "@/lib/contact/handler";
import { contactAllowedHosts, isAllowedOrigin } from "@/lib/contact/origin";
import { allowRequest, type RateLimitEnv } from "@/lib/contact/ratelimit";
import { type ResendEnv, sendEmail } from "@/lib/contact/resend";
import { verifyTurnstile } from "@/lib/contact/turnstile";
import { type R2BucketLike, type UploadFotoResult, uploadResenaFoto } from "@/lib/resenas/r2";
import {
	fieldErrors,
	RESENA_FIELD_KEYS,
	RESENA_HONEYPOT_FIELD,
	RESENA_MIN_FILL_MS,
	RESENA_TS_FIELD,
	RESENA_TURNSTILE_FIELD,
	type ResenaFieldErrors,
	resenaSchema,
} from "@/lib/resenas/schema";
import { renderResenaNotificationEmail, renderResenaThankYouEmail } from "@/lib/resenas/templates";

const DEFAULT_INBOX = "contacto@renovabit.com";
const MAX_USER_AGENT_LENGTH = 300;
const DEFAULT_ORIGEN = "qr";
const FOTO_MESSAGE = "La foto debe ser un JPG, PNG o WebP real de hasta 5 MB.";

/** `import.meta.env.PROD` lo reemplaza Vite en build; en Bun (tests) es undefined. */
const IS_PRODUCTION_DEFAULT = import.meta.env.PROD === true;

export interface ResenasEnv extends RateLimitEnv, ResendEnv {
	TURNSTILE_SECRET_KEY?: string;
	CONTACT_INBOX?: string;
	DB?: D1Database;
	MEDIA?: R2BucketLike;
}

export interface ResenasLog extends Pick<Console, "info" | "warn" | "error"> {}

export type SendEmailFn = typeof sendEmail;

/** Inserta la reseña ya normalizada; inyectable para testear sin D1. */
export type InsertResenaFn = (values: NuevaResena) => Promise<void>;

/** Sube la foto y devuelve su clave; inyectable para testear sin R2. */
export type UploadFotoFn = (file: File) => Promise<UploadFotoResult>;

export interface ResenasDeps {
	isProduction?: boolean;
	fetch?: FetchLike;
	sendEmail?: SendEmailFn;
	insertResena?: InsertResenaFn;
	uploadFoto?: UploadFotoFn;
	/** Reloj en milisegundos; inyectable para la trampa de tiempo. */
	now?: () => number;
	log?: ResenasLog;
}

export interface ResenasRequest {
	formData: FormData;
	headers: Headers;
	env: ResenasEnv;
	/** Hostname de la petición (minúsculas, sin puerto). Lo resuelve el endpoint. */
	hostname?: string;
	deps?: ResenasDeps;
}

export type ResenaResult =
	| { status: 200; body: { ok: true } }
	| { status: 400; body: { ok: false; code: "campos"; fieldErrors: ResenaFieldErrors } }
	| { status: 403; body: { ok: false; code: "verificacion" } }
	| { status: 429; body: { ok: false; code: "limite" } }
	| { status: 500; body: { ok: false; code: "envio" } };

function readText(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === "string" ? value : "";
}

function readConsentimiento(formData: FormData): boolean {
	const value = readText(formData, "consentimiento").toLowerCase();
	return value === "on" || value === "true" || value === "1";
}

function readFoto(formData: FormData): File | undefined {
	const value = formData.get("foto");
	return value instanceof File && value.size > 0 ? value : undefined;
}

function readResenaInput(formData: FormData) {
	return {
		nombre: readText(formData, "nombre"),
		empresa: readText(formData, "empresa"),
		servicio_id: readText(formData, "servicio_id"),
		servicio_detalle: readText(formData, "servicio_detalle"),
		estrellas: readText(formData, "estrellas"),
		comentario: readText(formData, "comentario"),
		contacto: readText(formData, "contacto"),
		consentimiento: readConsentimiento(formData),
		foto: readFoto(formData),
	};
}

/**
 * Hash del cliente para moderación: sha256 de IP + user-agent con un prefijo de
 * proyecto. Nunca se guarda la IP cruda.
 */
export async function hashClientIp(ip: string, userAgent: string): Promise<string> {
	const payload = new TextEncoder().encode(`renovabit:resenas:${ip}:${userAgent}`);
	const digest = await crypto.subtle.digest("SHA-256", payload);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function resolveServicio(
	id: string,
	detalle: string,
): Pick<NuevaResena, "servicio" | "servicio_id" | "servicio_detalle"> {
	if (id === RESENA_SERVICIO_OTRO.id) {
		return {
			servicio: detalle || getServicioById(id)?.label || "Otro",
			servicio_id: id,
			servicio_detalle: detalle || null,
		};
	}
	return {
		servicio: getServicioById(id)?.label ?? id,
		servicio_id: id,
		servicio_detalle: null,
	};
}

function defaultInsertResena(env: ResenasEnv): InsertResenaFn {
	return async (values) => {
		if (!env.DB) throw new Error("El binding DB no está configurado.");
		await createDb(env.DB).insert(resenas).values(values);
	};
}

export async function processResena(request: ResenasRequest): Promise<ResenaResult> {
	const { formData, headers, env, hostname } = request;
	const deps = request.deps ?? {};
	const isProduction = deps.isProduction ?? IS_PRODUCTION_DEFAULT;
	const now = deps.now ?? Date.now;
	const log = deps.log ?? console;
	const allowedHosts = contactAllowedHosts(isProduction);

	// Origen (anti-CSRF): los clientes sin cabecera `Origin` siguen permitidos,
	// Turnstile y el límite de envíos son la barrera real.
	const origin = headers.get("origin");
	if (!isAllowedOrigin(origin, allowedHosts)) {
		log.warn(`[resenas] Origen no permitido: ${origin ?? "(sin cabecera Origin)"}`);
		return { status: 403, body: { ok: false, code: "verificacion" } };
	}

	// Límite de envíos sobre el binding propio de reseñas.
	const ip = clientIp(headers);
	const allowed = await allowRequest(env, `resenas:${ip}`, {
		binding: env.RESENAS_RATE_LIMITER,
		bindingName: "RESENAS_RATE_LIMITER",
		scope: "resenas",
		log,
	});
	if (!allowed) {
		log.warn("[resenas] Límite de envíos alcanzado.");
		return { status: 429, body: { ok: false, code: "limite" } };
	}

	// Honeypot: se responde éxito falso para no delatar la defensa.
	if (readText(formData, RESENA_HONEYPOT_FIELD).trim() !== "") {
		log.info("[resenas] Envío descartado por el campo trampa.");
		return { status: 200, body: { ok: true } };
	}

	// Trampa de tiempo: un envío humano no tarda menos de 3 segundos.
	const ts = Number(readText(formData, RESENA_TS_FIELD));
	if (!Number.isFinite(ts) || now() - ts < RESENA_MIN_FILL_MS) {
		log.info("[resenas] Envío descartado por la trampa de tiempo.");
		return { status: 400, body: { ok: false, code: "campos", fieldErrors: {} } };
	}

	const verification = await verifyTurnstile(
		{
			token: readText(formData, RESENA_TURNSTILE_FIELD),
			secret: env.TURNSTILE_SECRET_KEY,
			remoteip: ip,
			hostname,
		},
		{ fetch: deps.fetch, allowedHostnames: allowedHosts, isProduction, log },
	);
	if (!verification.ok) {
		log.warn(`[resenas] Turnstile rechazó el envío (${verification.reason}).`);
		return { status: 403, body: { ok: false, code: "verificacion" } };
	}

	const parsed = v.safeParse(resenaSchema, readResenaInput(formData));
	if (!parsed.success) {
		const errors = fieldErrors(parsed);
		const failedFields = RESENA_FIELD_KEYS.filter((key) => errors[key]).join(", ");
		log.info(`[resenas] Validación fallida: ${failedFields}`);
		return { status: 400, body: { ok: false, code: "campos", fieldErrors: errors } };
	}
	const data = parsed.output;

	// Foto opcional: la validación real es por magic bytes en `r2.ts`.
	let fotoKey: string | null = null;
	if (data.foto) {
		const upload =
			deps.uploadFoto ?? ((file: File) => uploadResenaFoto(file, { bucket: env.MEDIA, log }));
		const uploaded = await upload(data.foto);
		if (uploaded.ok) {
			fotoKey = uploaded.key;
		} else if (uploaded.reason === "bucket") {
			// Problema de infraestructura: la reseña vale más que la foto.
			log.warn("[resenas] La reseña se guarda sin foto (R2 no disponible).");
		} else {
			log.info(`[resenas] Foto rechazada (${uploaded.reason}).`);
			return {
				status: 400,
				body: { ok: false, code: "campos", fieldErrors: { foto: FOTO_MESSAGE } },
			};
		}
	}

	const userAgent = headers.get("user-agent")?.trim().slice(0, MAX_USER_AGENT_LENGTH) || null;
	const servicio = resolveServicio(data.servicio_id, data.servicio_detalle);
	const values: NuevaResena = {
		created_at: new Date(now()),
		nombre: data.nombre,
		contacto: data.contacto || null,
		contacto_tipo: data.contacto_tipo ?? null,
		empresa: data.empresa || null,
		servicio: servicio.servicio,
		servicio_id: servicio.servicio_id,
		servicio_detalle: servicio.servicio_detalle,
		estrellas: data.estrellas,
		comentario: data.comentario,
		foto_key: fotoKey,
		consentimiento: 1,
		consentimiento_en: new Date(now()),
		estado: "pendiente",
		descuento_otorgado: 1,
		origen: DEFAULT_ORIGEN,
		ip_hash: await hashClientIp(ip, userAgent ?? ""),
		user_agent: userAgent,
	};

	try {
		const insert = deps.insertResena ?? defaultInsertResena(env);
		await insert(values);
	} catch (error) {
		log.error("[resenas] No se pudo guardar la reseña en D1.", error);
		return { status: 500, body: { ok: false, code: "envio" } };
	}

	const inbox = env.CONTACT_INBOX?.trim() || DEFAULT_INBOX;
	const send = deps.sendEmail ?? sendEmail;
	const emailDeps = { fetch: deps.fetch, isProduction, log };

	// La reseña ya quedó guardada: los correos son best-effort y se registran si fallan.
	const notification = renderResenaNotificationEmail(data);
	const notificationResult = await send(
		{
			to: inbox,
			...notification,
			replyTo: data.contacto_tipo === "email" ? data.contacto : undefined,
		},
		env,
		emailDeps,
	);
	if (!notificationResult.ok) {
		log.error("[resenas] No se pudo enviar la notificación al equipo.");
	}

	if (data.contacto_tipo === "email") {
		const thankYou = renderResenaThankYouEmail(data);
		const thankYouResult = await send(
			{ to: data.contacto, ...thankYou, replyTo: inbox },
			env,
			emailDeps,
		);
		if (!thankYouResult.ok) {
			log.error("[resenas] No se pudo enviar el agradecimiento.");
		}
	}

	return { status: 200, body: { ok: true } };
}
