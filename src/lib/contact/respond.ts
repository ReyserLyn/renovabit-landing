/**
 * Respuestas HTTP del endpoint de contacto.
 *
 * La isla pide JSON (`Accept: application/json`); el resto de clientes recibe
 * un redirect 303 de vuelta al formulario. Módulo puro y sin dependencias de
 * runtime (no importa `astro:env` ni `cloudflare:workers`) para poder testearse
 * de forma aislada.
 */

import type { ContactErrorCode } from "@/lib/contact/errors";
import type { ContactResult } from "@/lib/contact/handler";

export const FORM_PATH = "/contacto/";
export const FORM_HASH = "#formulario";

export function noStore(headers: Record<string, string> = {}): HeadersInit {
	return { ...headers, "Cache-Control": "no-store" };
}

export function wantsJson(request: Request): boolean {
	return request.headers.get("accept")?.includes("application/json") ?? false;
}

export function jsonResponse(result: ContactResult): Response {
	return new Response(JSON.stringify(result.body), {
		status: result.status,
		headers: noStore({ "Content-Type": "application/json; charset=utf-8" }),
	});
}

export function jsonProblem(status: number, code: ContactErrorCode): Response {
	return new Response(JSON.stringify({ ok: false, code }), {
		status,
		headers: noStore({ "Content-Type": "application/json; charset=utf-8" }),
	});
}

export function redirectResponse(code?: ContactErrorCode): Response {
	const location = code
		? `${FORM_PATH}?estado=error&motivo=${encodeURIComponent(code)}${FORM_HASH}`
		: `${FORM_PATH}?estado=enviado${FORM_HASH}`;
	return new Response(null, { status: 303, headers: noStore({ Location: location }) });
}

export function problemResponse(
	request: Request,
	status: number,
	code: ContactErrorCode,
): Response {
	return wantsJson(request) ? jsonProblem(status, code) : redirectResponse(code);
}

export function methodNotAllowedResponse(): Response {
	return new Response(null, { status: 405, headers: noStore({ Allow: "POST" }) });
}
