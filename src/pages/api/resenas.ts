/**
 * Endpoint on-demand del formulario de reseñas.
 *
 * Acepta solo POST (multipart por la foto), delega en `processResena` y responde
 * JSON a la isla. El límite de cuerpo cubre la foto más grande que acepta el
 * cliente (15 MB) antes de optimizarla. Los detalles internos nunca se exponen.
 *
 * La simulación de correos reutiliza la bandera `CONTACT_DEV_SIMULATE_EMAIL`
 * del formulario de contacto (ver `docs/contact-form.md`).
 */

import {
	CONTACT_DEV_SIMULATE_EMAIL,
	CONTACT_INBOX,
	RESEND_API_KEY,
	TURNSTILE_SECRET_KEY,
} from "astro:env/server";
import { env as workerEnv } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { processResena, type ResenasEnv } from "@/lib/resenas/handler";
import { jsonProblem, jsonResponse, methodNotAllowedResponse } from "@/lib/resenas/respond";

export const prerender = false;

const MAX_BODY_BYTES = 20 * 1024 * 1024;

let cachedEnv: ResenasEnv | undefined;

/** Los valores son estables por isolate; se resuelven una sola vez. */
function resenasEnv(): ResenasEnv {
	cachedEnv ??= {
		RESEND_API_KEY,
		TURNSTILE_SECRET_KEY,
		CONTACT_INBOX,
		CONTACT_DEV_SIMULATE_EMAIL,
		DB: workerEnv.DB,
		MEDIA: workerEnv.MEDIA,
		RESENAS_RATE_LIMITER: workerEnv.RESENAS_RATE_LIMITER,
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
		scope: "resenas",
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
			return jsonProblem(413, "envio");
		}

		let formData: FormData;
		try {
			formData = await request.formData();
		} catch (error) {
			logError("invalid-form-data", error);
			return jsonProblem(400, "campos");
		}

		const result = await processResena({
			formData,
			headers: request.headers,
			env: resenasEnv(),
			hostname: new URL(request.url).hostname.toLowerCase(),
			deps: { isProduction: import.meta.env.PROD },
		});

		return jsonResponse(result);
	} catch (error) {
		logError("unhandled", error);
		return jsonProblem(500, "envio");
	}
};

export const ALL: APIRoute = () => methodNotAllowedResponse();
