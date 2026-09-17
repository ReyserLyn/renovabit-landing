/**
 * Códigos de error del endpoint de reseñas y sus mensajes en español.
 *
 * El endpoint solo devuelve el código; la isla traduce con este mapa. Los
 * detalles internos nunca salen al cliente.
 */

export const RESENA_ERROR_CODES = ["campos", "verificacion", "limite", "envio"] as const;

export type ResenaErrorCode = (typeof RESENA_ERROR_CODES)[number];

export const RESENA_ERROR_MESSAGES: Record<ResenaErrorCode, string> = {
	campos: "Revisa los campos marcados e inténtalo de nuevo.",
	verificacion: "No pudimos verificar que seas humano. Recarga la página e inténtalo de nuevo.",
	limite: "Recibimos varias reseñas desde tu conexión. Espera unos minutos e inténtalo de nuevo.",
	envio: "No pudimos registrar tu reseña. Inténtalo de nuevo en unos minutos.",
};

export function isResenaErrorCode(value: unknown): value is ResenaErrorCode {
	return typeof value === "string" && (RESENA_ERROR_CODES as readonly string[]).includes(value);
}
