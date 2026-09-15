/**
 * Endpoint on-demand del formulario de contacto.
 *
 * Es la única ruta con `prerender = false` del sitio. Acepta solo POST, delega
 * en `processContact` y responde JSON a la isla. Para clientes sin JavaScript
 * devuelve un redirect 303 de respaldo, pero sin JS no hay token de Turnstile
 * ni forma de completar el envío: en la práctica ese camino solo puede terminar
 * en `/contacto/?estado=error&motivo=verificacion` (el sitio recomienda
 * WhatsApp en ese caso). Los detalles internos nunca se exponen.
 */

import {
	CONTACT_DEV_SIMULATE_EMAIL,
	CONTACT_INBOX,
	RESEND_API_KEY,
	TURNSTILE_SECRET_KEY,
} from "astro:env/server";
import { env as workerEnv } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { type ContactEnv, processContact } from "@/lib/contact/handler";
import {
	jsonResponse,
	methodNotAllowedResponse,
	problemResponse,
	redirectResponse,
	wantsJson,
} from "@/lib/contact/respond";

export const prerender = false;

const MAX_BODY_BYTES = 64 * 1024;

let cachedEnv: ContactEnv | undefined;

/** Los valores son estables por isolate; se resuelven una sola vez. */
function contactEnv(): ContactEnv {
	cachedEnv ??= {
		RESEND_API_KEY,
		TURNSTILE_SECRET_KEY,
		CONTACT_INBOX,
		CONTACT_DEV_SIMULATE_EMAIL,
		CONTACT_RATE_LIMITER: workerEnv.CONTACT_RATE_LIMITER,
	};
	return cachedEnv;
}

/**
 * Esta ruta siempre recibe `Content-Length` (navegadores y curl lo envían). Si
 * falta o no es un número finito se rechaza igual que un cuerpo demasiado
 * grande para no procesar payloads de tamaño desconocido.
 */
function hasOversizedBody(request: Request): boolean {
	const raw = request.headers.get("content-length");
	if (raw === null) return true;
	const value = Number(raw);
	return !Number.isFinite(value) || value > MAX_BODY_BYTES;
}

function logError(event: string, error?: unknown): void {
	const payload = {
		scope: "contact",
		event,
		message: error instanceof Error ? error.message : error ? String(error) : undefined,
	};
	if (error === undefined) console.error(JSON.stringify(payload));
	else console.error(JSON.stringify(payload), error);
}

export const POST: APIRoute = async ({ request }) => {
	try {
		if (hasOversizedBody(request)) {
			logError("payload-too-large");
			return problemResponse(request, 413, "envio");
		}

		let formData: FormData;
		try {
			formData = await request.formData();
		} catch (error) {
			logError("invalid-form-data", error);
			return problemResponse(request, 400, "campos");
		}

		const result = await processContact({
			formData,
			headers: request.headers,
			env: contactEnv(),
			hostname: new URL(request.url).hostname.toLowerCase(),
			deps: { isProduction: import.meta.env.PROD },
		});

		if (wantsJson(request)) return jsonResponse(result);
		return result.status === 200 ? redirectResponse() : redirectResponse(result.body.code);
	} catch (error) {
		logError("unhandled", error);
		return problemResponse(request, 500, "envio");
	}
};

export const ALL: APIRoute = () => methodNotAllowedResponse();
