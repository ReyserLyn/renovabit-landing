/**
 * Esquema Valibot del formulario de reseñas.
 *
 * Es la única fuente de verdad de validación: la isla lo usa en el cliente y el
 * endpoint lo vuelve a ejecutar en el servidor. Los límites se exportan para
 * reflejarlos en los atributos `maxlength` del formulario.
 *
 * Los campos anti-bot (`referencia` para el honeypot, `ts` para la trampa de
 * tiempo y `cf-turnstile-response` para Turnstile) viven fuera de este esquema:
 * el handler los valida con códigos propios, igual que el formulario de
 * contacto (`src/lib/contact/handler.ts`). Sus nombres se exportan aquí para no
 * duplicar el contrato del endpoint.
 */

import * as v from "valibot";
import { RESENA_SERVICIO_IDS } from "@/data/resenas-servicios";

export const RESENA_NOMBRE_MIN = 2;
export const RESENA_NOMBRE_MAX = 80;
export const RESENA_EMPRESA_MAX = 80;
export const RESENA_SERVICIO_DETALLE_MAX = 80;
export const RESENA_COMENTARIO_MIN = 10;
export const RESENA_COMENTARIO_MAX = 600;
export const RESENA_CONTACTO_MAX = 120;
export const RESENA_FOTO_MAX_BYTES = 5 * 1024 * 1024;
export const RESENA_FOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Nombres de los campos auxiliares que solo procesa el servidor. */
export const RESENA_HONEYPOT_FIELD = "referencia";
export const RESENA_TS_FIELD = "ts";
export const RESENA_TURNSTILE_FIELD = "cf-turnstile-response";

const EMAIL_ALLOWED = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED = /^\+?[\d\s()-]+$/;
/** Montaje (ms) mínimo antes de aceptar un envío: frena bots que responden al instante. */
export const RESENA_MIN_FILL_MS = 3_000;

/**
 * Normaliza un celular peruano a 9 dígitos sin espacios.
 * Acepta `+51`, 51, espacios, paréntesis y guiones. Devuelve `null` si no es
 * plausible como número peruano.
 */
export function normalizePeruPhone(value: string): string | null {
	const cleaned = value.replace(/[\s()-]/g, "");
	if (!PHONE_ALLOWED.test(cleaned)) return null;
	const digits = cleaned.replace(/\D/g, "");
	if (digits.length === 9) return digits;
	if (digits.length === 11 && digits.startsWith("51")) return digits.slice(2);
	return null;
}

export const resenaSchema = v.pipe(
	v.object({
		nombre: v.pipe(
			v.string("Escribe tu nombre."),
			v.trim(),
			v.minLength(RESENA_NOMBRE_MIN, "El nombre debe tener al menos 2 caracteres."),
			v.maxLength(RESENA_NOMBRE_MAX, "El nombre no debe superar los 80 caracteres."),
		),
		empresa: v.optional(
			v.pipe(
				v.string(),
				v.trim(),
				v.maxLength(RESENA_EMPRESA_MAX, "La empresa no debe superar los 80 caracteres."),
			),
			"",
		),
		servicio_id: v.picklist(RESENA_SERVICIO_IDS, "Selecciona el servicio que recibiste."),
		servicio_detalle: v.optional(
			v.pipe(
				v.string(),
				v.trim(),
				v.maxLength(
					RESENA_SERVICIO_DETALLE_MAX,
					"El detalle del servicio no debe superar los 80 caracteres.",
				),
			),
			"",
		),
		estrellas: v.pipe(
			v.union([v.string(), v.number()], "Selecciona una calificación."),
			v.transform((value) => Number(value)),
			v.picklist([1, 2, 3, 4, 5], "Selecciona una calificación de 1 a 5 estrellas."),
		),
		comentario: v.pipe(
			v.string("Escribe tu comentario."),
			v.trim(),
			v.minLength(RESENA_COMENTARIO_MIN, "El comentario debe tener al menos 10 caracteres."),
			v.maxLength(RESENA_COMENTARIO_MAX, "El comentario no debe superar los 600 caracteres."),
		),
		contacto: v.pipe(
			v.optional(v.string(), ""),
			v.transform((value) => value.trim()),
			v.maxLength(RESENA_CONTACTO_MAX, "El contacto no debe superar los 120 caracteres."),
			v.check((value) => {
				if (value === "") return true;
				if (value.includes("@")) return EMAIL_ALLOWED.test(value);
				return normalizePeruPhone(value) !== null;
			}, "Escribe un correo o un WhatsApp válido, por ejemplo tucorreo@ejemplo.com o 955 315 646."),
		),
		consentimiento: v.literal(true, "Debes aceptar la publicación de tu reseña para enviarla."),
		foto: v.optional(
			v.pipe(
				v.file("Adjunta una imagen válida."),
				v.check((file) => file.size > 0, "La foto está vacía."),
				v.check((file) => file.size <= RESENA_FOTO_MAX_BYTES, "La foto no debe superar los 5 MB."),
				v.check(
					(file) => (RESENA_FOTO_TYPES as readonly string[]).includes(file.type),
					"La foto debe ser JPG, PNG o WebP.",
				),
			),
		),
	}),
	v.forward(
		v.check(
			(input) => input.servicio_id !== "otro" || input.servicio_detalle.length > 0,
			"Cuéntanos qué servicio recibiste.",
		),
		["servicio_detalle"],
	),
	v.transform((input) => {
		const contacto = input.contacto;
		if (contacto === "") {
			return { ...input, contacto: "", contacto_tipo: undefined };
		}
		if (contacto.includes("@")) {
			return { ...input, contacto, contacto_tipo: "email" as const };
		}
		return {
			...input,
			contacto: normalizePeruPhone(contacto) ?? contacto,
			contacto_tipo: "whatsapp" as const,
		};
	}),
);

/** Entrada cruda del formulario (lo que edita la persona). */
export type ResenaInput = v.InferInput<typeof resenaSchema>;

/** Salida validada (lo que consumen el handler y los correos). */
export type ResenaData = v.InferOutput<typeof resenaSchema>;

export const RESENA_FIELD_KEYS = [
	"nombre",
	"empresa",
	"servicio_id",
	"servicio_detalle",
	"estrellas",
	"comentario",
	"contacto",
	"consentimiento",
	"foto",
] as const satisfies readonly (keyof ResenaInput)[];

export type ResenaField = (typeof RESENA_FIELD_KEYS)[number];

export type ResenaFieldErrors = Partial<Record<ResenaField, string>>;

/**
 * Convierte los issues de Valibot en un mapa campo -> primer mensaje.
 * Solo considera campos del formulario; ignora errores de nivel raíz.
 */
export function fieldErrors(result: v.SafeParseResult<typeof resenaSchema>): ResenaFieldErrors {
	if (result.success) return {};
	const nested = v.flatten(result.issues).nested;
	const errors: ResenaFieldErrors = {};
	if (!nested) return errors;
	for (const key of RESENA_FIELD_KEYS) {
		const message = nested[key]?.[0];
		if (message) errors[key] = message;
	}
	return errors;
}
