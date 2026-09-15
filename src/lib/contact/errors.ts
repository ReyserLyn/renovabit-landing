/**
 * Códigos de error del endpoint de contacto y sus mensajes en español.
 *
 * El endpoint solo devuelve el código; la isla traduce con este mapa. Los
 * detalles internos nunca salen al cliente.
 */

export const CONTACT_ERROR_CODES = ["campos", "verificacion", "limite", "envio"] as const;

export type ContactErrorCode = (typeof CONTACT_ERROR_CODES)[number];

export const CONTACT_ERROR_MESSAGES: Record<ContactErrorCode, string> = {
	campos: "Revisa los campos marcados e inténtalo de nuevo.",
	verificacion: "No pudimos verificar que seas humano. Recarga la página e inténtalo de nuevo.",
	limite: "Recibimos varias consultas desde tu conexión. Espera unos minutos e inténtalo de nuevo.",
	envio: "No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.",
};

export function isContactErrorCode(value: unknown): value is ContactErrorCode {
	return typeof value === "string" && (CONTACT_ERROR_CODES as readonly string[]).includes(value);
}
