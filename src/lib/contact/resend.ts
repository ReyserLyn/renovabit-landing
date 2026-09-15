/**
 * Envío de correo con la API HTTP de Resend (sin SDK).
 *
 * Modo simulado: solo con `CONTACT_DEV_SIMULATE_EMAIL=true` fuera de
 * producción. En producción esa bandera se trata como error de configuración y
 * el envío falla cerrado, igual que cuando falta la API key: nunca se simula.
 * El contenido del correo solo se registra al simular en desarrollo; en
 * producción los logs son metadatos. La API key nunca se registra.
 */

import type { FetchLike } from "@/lib/contact/fetch";

export const RESEND_FROM = "RenovaBit <no-reply@mail.renovabit.com>";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RESEND_TIMEOUT_MS = 10_000;

/** `import.meta.env.PROD` lo reemplaza Vite en build; en Bun (tests) es undefined. */
const IS_PRODUCTION_DEFAULT = import.meta.env.PROD === true;

export interface EmailPayload {
	to: string;
	subject: string;
	html: string;
	text: string;
	replyTo?: string;
}

export interface ResendEnv {
	RESEND_API_KEY?: string;
	CONTACT_DEV_SIMULATE_EMAIL?: string;
}

export interface ResendDeps {
	fetch?: FetchLike;
	isProduction?: boolean;
	log?: Pick<Console, "info" | "error">;
}

export type SendEmailResult = { ok: true; simulated: boolean } | { ok: false };

export async function sendEmail(
	payload: EmailPayload,
	env: ResendEnv,
	deps: ResendDeps = {},
): Promise<SendEmailResult> {
	const { fetch: fetchImpl = fetch, isProduction = IS_PRODUCTION_DEFAULT, log = console } = deps;

	if (env.CONTACT_DEV_SIMULATE_EMAIL === "true") {
		if (isProduction) {
			log.error(
				"[contact] CONTACT_DEV_SIMULATE_EMAIL está definida en producción; se rechaza el envío (los correos nunca se simulan en producción).",
			);
			return { ok: false };
		}
		// Solo en desarrollo se registra el contenido del correo.
		log.info("[contact] Correo simulado (no se envió por Resend).", {
			to: payload.to,
			subject: payload.subject,
			text: payload.text,
		});
		return { ok: true, simulated: true };
	}

	if (!env.RESEND_API_KEY) {
		log.error("[contact] RESEND_API_KEY no está configurada; no se pudo enviar el correo.");
		return { ok: false };
	}

	try {
		const response = await fetchImpl(RESEND_ENDPOINT, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: RESEND_FROM,
				to: [payload.to],
				subject: payload.subject,
				html: payload.html,
				text: payload.text,
				...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
			}),
			signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
		});

		if (!response.ok) {
			// Metadatos solamente: nunca el cuerpo ni las direcciones del correo.
			log.error(`[contact] Resend respondió con estado ${response.status}.`);
			return { ok: false };
		}

		return { ok: true, simulated: false };
	} catch (error) {
		log.error("[contact] Error de red al enviar el correo con Resend.", error);
		return { ok: false };
	}
}
