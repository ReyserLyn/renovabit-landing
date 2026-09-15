/**
 * Orquestador puro del formulario de contacto.
 *
 * Recibe `FormData`, cabeceras y el entorno resuelto; devuelve `{ status, body }`
 * listo para el endpoint. Todas las dependencias externas (fetch, envío de
 * correo, logger) son inyectables para poder testearlo sin red.
 *
 * Orden de defensas: honeypot, origen, Turnstile, límite de envíos, validación,
 * correo. Cualquier fallo interno devuelve un código estable; los detalles solo
 * se registran en el servidor.
 */

import * as v from "valibot";
import type { FetchLike } from "@/lib/contact/fetch";
import { contactAllowedHosts, isAllowedOrigin } from "@/lib/contact/origin";
import { allowRequest, type RateLimitDeps, type RateLimitEnv } from "@/lib/contact/ratelimit";
import { type ResendEnv, sendEmail } from "@/lib/contact/resend";
import {
	CONTACT_FIELD_KEYS,
	type ContactFieldErrors,
	contactSchema,
	fieldErrors,
} from "@/lib/contact/schema";
import { renderAutoReplyEmail, renderNotificationEmail } from "@/lib/contact/templates";
import { verifyTurnstile } from "@/lib/contact/turnstile";

const DEFAULT_INBOX = "contacto@renovabit.com";
const MAX_ORIGEN_LENGTH = 200;

/** `import.meta.env.PROD` lo reemplaza Vite en build; en Bun (tests) es undefined. */
const IS_PRODUCTION_DEFAULT = import.meta.env.PROD === true;

export interface ContactEnv extends RateLimitEnv, ResendEnv {
	TURNSTILE_SECRET_KEY?: string;
	CONTACT_INBOX?: string;
}

export interface ContactLog extends Pick<Console, "info" | "warn" | "error"> {}

export type SendEmailFn = typeof sendEmail;

export interface ContactDeps {
	isProduction?: boolean;
	fetch?: FetchLike;
	sendEmail?: SendEmailFn;
	log?: ContactLog;
}

export interface ContactRequest {
	formData: FormData;
	headers: Headers;
	env: ContactEnv;
	/** Hostname de la petición (minúsculas, sin puerto). Lo resuelve el endpoint. */
	hostname?: string;
	deps?: ContactDeps;
}

export type ContactResult =
	| { status: 200; body: { ok: true } }
	| { status: 400; body: { ok: false; code: "campos"; fieldErrors: ContactFieldErrors } }
	| { status: 403; body: { ok: false; code: "verificacion" } }
	| { status: 429; body: { ok: false; code: "limite" } }
	| { status: 500; body: { ok: false; code: "envio" } };

function readText(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === "string" ? value : "";
}

function readOptionalText(formData: FormData, key: string): string | undefined {
	const value = readText(formData, key).trim();
	return value === "" ? undefined : value;
}

function readConsent(formData: FormData): boolean {
	const value = readText(formData, "consent").toLowerCase();
	return value === "on" || value === "true" || value === "1";
}

function readContactInput(formData: FormData) {
	return {
		nombre: readText(formData, "nombre"),
		whatsapp: readText(formData, "whatsapp"),
		email: readOptionalText(formData, "email"),
		tipo: readText(formData, "tipo"),
		mensaje: readText(formData, "mensaje"),
		preferencia: readOptionalText(formData, "preferencia"),
		consent: readConsent(formData),
	};
}

export function clientIp(headers: Headers): string {
	const direct = headers.get("cf-connecting-ip")?.trim();
	if (direct) return direct;
	const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
	return forwarded || "unknown";
}

export async function processContact(request: ContactRequest): Promise<ContactResult> {
	const { formData, headers, env, hostname } = request;
	const deps = request.deps ?? {};
	const isProduction = deps.isProduction ?? IS_PRODUCTION_DEFAULT;
	const log = deps.log ?? console;
	const allowedHosts = contactAllowedHosts(isProduction);

	// Orden deliberado: honeypot (no gasta recursos), origen, Turnstile, límite y
	// validación. El límite de envíos es fail-open si el binding falla para no
	// bloquear consultas legítimas: la barrera fail-closed es Turnstile.
	if (readText(formData, "empresa").trim() !== "") {
		log.info("[contact] Envío descartado por el campo trampa.");
		return { status: 200, body: { ok: true } };
	}

	const origin = headers.get("origin");
	if (!isAllowedOrigin(origin, allowedHosts)) {
		log.warn(`[contact] Origen no permitido: ${origin ?? "(sin cabecera Origin)"}`);
		return { status: 403, body: { ok: false, code: "verificacion" } };
	}

	const ip = clientIp(headers);
	const verification = await verifyTurnstile(
		{
			token: readText(formData, "cf-turnstile-response"),
			secret: env.TURNSTILE_SECRET_KEY,
			remoteip: ip,
			hostname,
		},
		{ fetch: deps.fetch, allowedHostnames: allowedHosts, isProduction, log },
	);
	if (!verification.ok) {
		log.warn(`[contact] Turnstile rechazó el envío (${verification.reason}).`);
		return { status: 403, body: { ok: false, code: "verificacion" } };
	}

	const rateLimitDeps: RateLimitDeps = { log };
	if (!(await allowRequest(env, `contact:${ip}`, rateLimitDeps))) {
		log.warn("[contact] Límite de envíos alcanzado.");
		return { status: 429, body: { ok: false, code: "limite" } };
	}

	const parsed = v.safeParse(contactSchema, readContactInput(formData));
	if (!parsed.success) {
		const errors = fieldErrors(parsed);
		const failedFields = CONTACT_FIELD_KEYS.filter((key) => errors[key]).join(", ");
		log.info(`[contact] Validación fallida: ${failedFields}`);
		return { status: 400, body: { ok: false, code: "campos", fieldErrors: errors } };
	}

	const data = parsed.output;
	const origen = readText(formData, "origen")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, MAX_ORIGEN_LENGTH);
	const inbox = env.CONTACT_INBOX?.trim() || DEFAULT_INBOX;
	const send = deps.sendEmail ?? sendEmail;
	const emailDeps = { fetch: deps.fetch, isProduction, log };

	const notification = renderNotificationEmail({ ...data, origen: origen || "/contacto/" });
	const notificationResult = await send(
		{ to: inbox, ...notification, replyTo: data.email || undefined },
		env,
		emailDeps,
	);
	if (!notificationResult.ok) {
		log.error("[contact] No se pudo enviar la notificación al equipo.");
		return { status: 500, body: { ok: false, code: "envio" } };
	}

	if (data.email) {
		const autoReply = renderAutoReplyEmail(data);
		// `Reply-To` apunta al inbox del equipo: las respuestas del cliente al
		// remitente no-reply llegan a contacto@.
		const autoReplyResult = await send(
			{ to: data.email, ...autoReply, replyTo: inbox },
			env,
			emailDeps,
		);
		if (!autoReplyResult.ok) {
			// La consulta ya llegó al equipo: el fallo de la respuesta automática
			// no debe hacer que la persona vuelva a enviar el formulario.
			log.error("[contact] No se pudo enviar la respuesta automática.");
		}
	}

	return { status: 200, body: { ok: true } };
}
