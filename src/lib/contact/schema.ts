/**
 * Esquema Valibot del formulario de contacto.
 *
 * Es la única fuente de verdad de validación: la isla lo usa en el cliente y
 * el endpoint lo vuelve a ejecutar en el servidor. Los límites se exportan
 * para reflejarlos en los atributos `maxlength` del formulario.
 */

import * as v from "valibot";
import { CONTACT_PREFERENCIA_VALUES, CONTACT_TIPO_VALUES } from "@/data/contact-form";

export const CONTACT_NOMBRE_MIN = 2;
export const CONTACT_NOMBRE_MAX = 80;
export const CONTACT_WHATSAPP_MIN_DIGITS = 9;
export const CONTACT_WHATSAPP_MAX_DIGITS = 15;
export const CONTACT_EMAIL_MAX = 120;
export const CONTACT_MENSAJE_MIN = 10;
export const CONTACT_MENSAJE_MAX = 1200;

const WHATSAPP_ALLOWED = /^\+?[\d\s()-]+$/;
const EMAIL_ALLOWED = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function countDigits(value: string): number {
	return value.replace(/\D/g, "").length;
}

export const contactSchema = v.object({
	nombre: v.pipe(
		v.string("Escribe tu nombre."),
		v.trim(),
		v.minLength(CONTACT_NOMBRE_MIN, "El nombre debe tener al menos 2 caracteres."),
		v.maxLength(CONTACT_NOMBRE_MAX, "El nombre no debe superar los 80 caracteres."),
	),
	whatsapp: v.pipe(
		v.string("Escribe tu número de WhatsApp."),
		v.trim(),
		v.regex(WHATSAPP_ALLOWED, "Escribe un número de WhatsApp válido, por ejemplo 955 315 646."),
		v.check((value) => {
			const digits = countDigits(value);
			return digits >= CONTACT_WHATSAPP_MIN_DIGITS && digits <= CONTACT_WHATSAPP_MAX_DIGITS;
		}, "El número de WhatsApp debe tener entre 9 y 15 dígitos."),
	),
	email: v.pipe(
		v.optional(v.string(), ""),
		v.transform((value) => value.trim()),
		v.check(
			(value) => value === "" || EMAIL_ALLOWED.test(value),
			"Escribe un correo válido, por ejemplo tucorreo@ejemplo.com.",
		),
		v.maxLength(CONTACT_EMAIL_MAX, "El correo no debe superar los 120 caracteres."),
	),
	tipo: v.picklist(CONTACT_TIPO_VALUES, "Selecciona qué necesitas."),
	mensaje: v.pipe(
		v.string("Escribe tu mensaje."),
		v.trim(),
		v.minLength(CONTACT_MENSAJE_MIN, "El mensaje debe tener al menos 10 caracteres."),
		v.maxLength(CONTACT_MENSAJE_MAX, "El mensaje no debe superar los 1200 caracteres."),
	),
	preferencia: v.optional(v.picklist(CONTACT_PREFERENCIA_VALUES), "whatsapp"),
	consent: v.literal(true, "Debes aceptar el uso de tus datos para enviar la consulta."),
});

/** Entrada cruda del formulario (lo que edita la persona). */
export type ContactInput = v.InferInput<typeof contactSchema>;

/** Salida validada (lo que consumen el handler y los correos). */
export type ContactData = v.InferOutput<typeof contactSchema>;

export const CONTACT_FIELD_KEYS = [
	"nombre",
	"whatsapp",
	"email",
	"tipo",
	"mensaje",
	"preferencia",
	"consent",
] as const satisfies readonly (keyof ContactInput)[];

export type ContactField = (typeof CONTACT_FIELD_KEYS)[number];

export type ContactFieldErrors = Partial<Record<ContactField, string>>;

/**
 * Convierte los issues de Valibot en un mapa campo -> primer mensaje.
 * Solo considera campos del formulario; ignora errores de nivel raíz.
 */
export function fieldErrors(result: v.SafeParseResult<typeof contactSchema>): ContactFieldErrors {
	if (result.success) return {};
	const nested = v.flatten(result.issues).nested;
	const errors: ContactFieldErrors = {};
	if (!nested) return errors;
	for (const key of CONTACT_FIELD_KEYS) {
		const message = nested[key]?.[0];
		if (message) errors[key] = message;
	}
	return errors;
}
