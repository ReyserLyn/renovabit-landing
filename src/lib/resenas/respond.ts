/**
 * Respuestas HTTP del endpoint de reseñas.
 *
 * La isla siempre pide JSON (`Accept: application/json`); a diferencia del
 * formulario de contacto no hay redirect de respaldo porque sin JavaScript no
 * existe token de Turnstile. `noStore` y el 405 se reutilizan del módulo de
 * contacto para no duplicar contrato.
 */

import { methodNotAllowedResponse, noStore } from "@/lib/contact/respond";
import type { ResenaErrorCode } from "@/lib/resenas/errors";
import type { ResenaResult } from "@/lib/resenas/handler";

export function jsonResponse(result: ResenaResult): Response {
	return new Response(JSON.stringify(result.body), {
		status: result.status,
		headers: noStore({ "Content-Type": "application/json; charset=utf-8" }),
	});
}

export function jsonProblem(status: number, code: ResenaErrorCode): Response {
	return new Response(JSON.stringify({ ok: false, code }), {
		status,
		headers: noStore({ "Content-Type": "application/json; charset=utf-8" }),
	});
}

export { methodNotAllowedResponse };
