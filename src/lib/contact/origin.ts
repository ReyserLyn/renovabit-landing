/**
 * Validación de origen (anti-CSRF de formularios).
 *
 * Un navegador siempre envía `Origin` en peticiones POST cross-origin, así que
 * rechazar orígenes desconocidos bloquea envíos desde otros sitios. Las
 * peticiones sin `Origin` (clientes que no son navegadores) se permiten:
 * Turnstile y el límite de envíos son la barrera real.
 */

/** Hosts de producción, permitidos siempre. */
export const CONTACT_ALLOWED_HOSTS = ["renovabit.com", "www.renovabit.com"] as const;

/** Hosts locales y previews de Cloudflare, permitidos solo fuera de producción. */
export const CONTACT_DEV_ALLOWED_HOSTS = ["localhost", "127.0.0.1", "*.workers.dev"] as const;

export const CONTACT_LOCAL_HOSTS = ["localhost", "127.0.0.1"] as const;

/**
 * Allowlist efectiva según el entorno.
 *
 * `*.workers.dev` y los hosts locales solo se permiten fuera de producción:
 * cualquier persona puede desplegar un subdominio en `workers.dev`, así que
 * aceptarlo en producción abriría la puerta a envíos cross-site.
 */
export function contactAllowedHosts(isProduction: boolean): readonly string[] {
	return isProduction
		? CONTACT_ALLOWED_HOSTS
		: [...CONTACT_ALLOWED_HOSTS, ...CONTACT_DEV_ALLOWED_HOSTS];
}

/** Compara hostnames sin distinguir mayúsculas; soporta el patrón `*.dominio`. */
export function hostnameMatches(hostname: string, pattern: string): boolean {
	const normalizedHostname = hostname.trim().toLowerCase();
	const normalizedPattern = pattern.trim().toLowerCase();
	if (normalizedPattern.startsWith("*.")) {
		const suffix = normalizedPattern.slice(1);
		return normalizedHostname.endsWith(suffix) && normalizedHostname.length > suffix.length;
	}
	return normalizedHostname === normalizedPattern;
}

export function isAllowedOrigin(origin: string | null, allowedHosts: readonly string[]): boolean {
	if (!origin) return true;
	let hostname: string;
	try {
		hostname = new URL(origin).hostname;
	} catch {
		return false;
	}
	return allowedHosts.some((pattern) => hostnameMatches(hostname, pattern));
}

export function isLocalHostname(hostname: string): boolean {
	return (CONTACT_LOCAL_HOSTS as readonly string[]).some((local) =>
		hostnameMatches(hostname, local),
	);
}
