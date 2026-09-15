/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

/**
 * Umami Analytics se carga solo cuando `PUBLIC_UMAMI_ENABLED=true` (ver
 * BaseLayout). Las islas lo usan de forma opcional, sin asumir que existe.
 */
interface Window {
	umami?: {
		track: (event: string, data?: Record<string, unknown>) => void;
	};
}
