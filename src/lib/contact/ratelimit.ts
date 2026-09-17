/**
 * Límite de envíos con el binding nativo `ratelimits` de Cloudflare.
 *
 * En local (o si el binding no está disponible) se permite el envío y se avisa
 * una sola vez por isolate. En producción el binding siempre existe según
 * `wrangler.jsonc`. El formulario de reseñas reutiliza este módulo pasando su
 * propio binding (`RESENAS_RATE_LIMITER`) en `deps.binding`.
 */

export interface RateLimitBinding {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface RateLimitEnv {
	CONTACT_RATE_LIMITER?: RateLimitBinding;
	/** Límite del formulario de reseñas (mismo binding nativo, namespace distinto). */
	RESENAS_RATE_LIMITER?: RateLimitBinding;
}

export interface RateLimitDeps {
	log?: Pick<Console, "warn" | "error">;
	/** Binding a consultar; por defecto, `env.CONTACT_RATE_LIMITER`. */
	binding?: RateLimitBinding;
	/** Etiqueta del binding en los avisos; por defecto, `CONTACT_RATE_LIMITER`. */
	bindingName?: string;
	/** Prefijo de los avisos; por defecto, `contact`. */
	scope?: string;
}

const warnedBindings = new Set<string>();

export async function allowRequest(
	env: RateLimitEnv,
	key: string,
	deps: RateLimitDeps = {},
): Promise<boolean> {
	const log = deps.log ?? console;
	const bindingName = deps.bindingName ?? "CONTACT_RATE_LIMITER";
	const scope = deps.scope ?? "contact";
	const binding = deps.binding ?? env.CONTACT_RATE_LIMITER;

	if (!binding) {
		if (!warnedBindings.has(bindingName)) {
			warnedBindings.add(bindingName);
			log.warn(
				`[${scope}] ${bindingName} no está disponible; el límite de envíos queda desactivado.`,
			);
		}
		return true;
	}

	try {
		const outcome = await binding.limit({ key });
		return outcome.success;
	} catch (error) {
		log.error(`[${scope}] Error al consultar el límite de envíos; se permite el envío.`, error);
		return true;
	}
}
