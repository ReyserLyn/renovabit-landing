/**
 * Sitekey pública de Turnstile para la isla del formulario.
 *
 * En builds de producción se avisa (una sola vez por caso) cuando la sitekey
 * falta o cuando parece una sitekey de prueba: el formulario se renderiza en
 * modo degradado o no verifica usuarios reales.
 */

import { PUBLIC_TURNSTILE_SITE_KEY } from "astro:env/client";
import { isTurnstileTestSiteKey } from "@/lib/contact/turnstile";

let didWarnMissingSiteKey = false;
let didWarnTestSiteKey = false;

export function contactSiteKey(): string | undefined {
	const siteKey = PUBLIC_TURNSTILE_SITE_KEY || undefined;

	if (import.meta.env.PROD && siteKey && !didWarnTestSiteKey && isTurnstileTestSiteKey(siteKey)) {
		didWarnTestSiteKey = true;
		console.warn(
			"[contact] PUBLIC_TURNSTILE_SITE_KEY parece una sitekey de prueba de Cloudflare: en producción el formulario no verificará usuarios reales. Usa la sitekey del widget de renovabit.com (ver .env.example).",
		);
	}

	if (import.meta.env.PROD && !siteKey && !didWarnMissingSiteKey) {
		didWarnMissingSiteKey = true;
		console.warn(
			"[contact] PUBLIC_TURNSTILE_SITE_KEY no está definida: el formulario de contacto se mostrará en modo degradado. Define la variable en el entorno de build (ver .env.example).",
		);
	}

	return siteKey;
}
