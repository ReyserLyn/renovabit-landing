/**
 * Verificación server-side de tokens de Cloudflare Turnstile.
 *
 * Fail-closed: token ausente, secret sin configurar (o el secret de prueba en
 * producción), error de red, timeout, hostname fuera del allowlist o respuesta
 * sin `success` rechazan el envío. La verificación se hace siempre contra
 * `siteverify`; nunca se confía en el cliente. El `fetch` es inyectable para
 * poder testear el módulo sin red.
 */

import type { FetchLike } from "@/lib/contact/fetch";
import { hostnameMatches, isLocalHostname } from "@/lib/contact/origin";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TOKEN_LENGTH = 2048;
const TEST_SITEKEY_PATTERN = /^[123]x/i;

/** Secret de prueba oficial de Cloudflare ("siempre pasa"). Solo para local. */
export const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

/** `import.meta.env.PROD` lo reemplaza Vite en build; en Bun (tests) es undefined. */
const IS_PRODUCTION_DEFAULT = import.meta.env.PROD === true;

/** Detecta sitekeys de prueba de Cloudflare (1x pasa, 2x bloquea, 3x interactivo). */
export function isTurnstileTestSiteKey(siteKey: string): boolean {
	return TEST_SITEKEY_PATTERN.test(siteKey.trim());
}

export type TurnstileFailureReason = "token" | "config" | "network" | "hostname" | "rejected";

export type TurnstileResult = { ok: true } | { ok: false; reason: TurnstileFailureReason };

export interface TurnstileInput {
	token: string | null | undefined;
	secret: string | undefined;
	remoteip?: string;
	/** Hostname de la petición; localhost nunca se rechaza por allowlist. */
	hostname?: string;
}

export interface TurnstileDeps {
	fetch?: FetchLike;
	timeoutMs?: number;
	allowedHostnames?: readonly string[];
	isProduction?: boolean;
	log?: Pick<Console, "error">;
}

interface SiteVerifyResponse {
	success?: boolean;
	hostname?: string;
}

export async function verifyTurnstile(
	input: TurnstileInput,
	deps: TurnstileDeps = {},
): Promise<TurnstileResult> {
	const {
		fetch: fetchImpl = fetch,
		timeoutMs = DEFAULT_TIMEOUT_MS,
		allowedHostnames,
		isProduction = IS_PRODUCTION_DEFAULT,
		log = console,
	} = deps;

	const token = input.token?.trim() ?? "";
	if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
		return { ok: false, reason: "token" };
	}

	if (!input.secret) {
		log.error("[contact] TURNSTILE_SECRET_KEY no está configurada; se rechaza el envío.");
		return { ok: false, reason: "config" };
	}

	// El secret de prueba acepta cualquier token: en producción invalidaría la
	// verificación por completo, así que se rechaza de forma explícita.
	if (isProduction && input.secret === TURNSTILE_TEST_SECRET) {
		log.error(
			"[contact] TURNSTILE_SECRET_KEY es el secret de prueba de Cloudflare; se rechaza el envío en producción.",
		);
		return { ok: false, reason: "config" };
	}

	const requestHostname = input.hostname?.trim();
	if (
		allowedHostnames &&
		requestHostname &&
		!isLocalHostname(requestHostname) &&
		!allowedHostnames.some((pattern) => hostnameMatches(requestHostname, pattern))
	) {
		return { ok: false, reason: "hostname" };
	}

	try {
		const body = new URLSearchParams({ secret: input.secret, response: token });
		if (input.remoteip && input.remoteip !== "unknown") body.set("remoteip", input.remoteip);

		const response = await fetchImpl(SITEVERIFY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
			signal: AbortSignal.timeout(timeoutMs),
		});

		if (!response.ok) {
			log.error(`[contact] siteverify respondió con estado ${response.status}.`);
			return { ok: false, reason: "network" };
		}

		const data = (await response.json()) as SiteVerifyResponse;
		if (data.success !== true) return { ok: false, reason: "rejected" };

		// El hostname que devuelve siteverify debe pertenecer al sitio. Se omite
		// cuando la respuesta no lo incluye y con el secret de prueba (los tokens
		// de prueba informan hostnames que no son del dominio real).
		const verifiedHostname = data.hostname?.trim();
		if (
			allowedHostnames &&
			verifiedHostname &&
			input.secret !== TURNSTILE_TEST_SECRET &&
			!isLocalHostname(verifiedHostname) &&
			!allowedHostnames.some((pattern) => hostnameMatches(verifiedHostname, pattern))
		) {
			return { ok: false, reason: "hostname" };
		}

		return { ok: true };
	} catch (error) {
		log.error("[contact] Error de red al verificar Turnstile.", error);
		return { ok: false, reason: "network" };
	}
}
