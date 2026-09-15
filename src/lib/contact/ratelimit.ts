/**
 * Límite de envíos con el binding nativo `ratelimits` de Cloudflare.
 *
 * En local (o si el binding no está disponible) se permite el envío y se avisa
 * una sola vez por isolate. En producción el binding siempre existe según
 * `wrangler.jsonc`.
 */

export interface RateLimitBinding {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface RateLimitEnv {
	CONTACT_RATE_LIMITER?: RateLimitBinding;
}

export interface RateLimitDeps {
	log?: Pick<Console, "warn" | "error">;
}

let didWarnMissingBinding = false;

export async function allowRequest(
	env: RateLimitEnv,
	key: string,
	deps: RateLimitDeps = {},
): Promise<boolean> {
	const log = deps.log ?? console;
	const binding = env.CONTACT_RATE_LIMITER;

	if (!binding) {
		if (!didWarnMissingBinding) {
			didWarnMissingBinding = true;
			log.warn(
				"[contact] CONTACT_RATE_LIMITER no está disponible; el límite de envíos queda desactivado.",
			);
		}
		return true;
	}

	try {
		const outcome = await binding.limit({ key });
		return outcome.success;
	} catch (error) {
		log.error("[contact] Error al consultar el límite de envíos; se permite el envío.", error);
		return true;
	}
}
