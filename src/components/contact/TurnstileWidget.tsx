/**
 * Widget de Cloudflare Turnstile con render explícito.
 *
 * Carga el script una sola vez, monta el widget en un contenedor propio y
 * comunica el token (o su ausencia) a la isla. Si el script falla se hace un
 * único reintento automático (el fallo suele ser de red transitoria); la isla
 * también puede remontar el widget tras un envío, porque el token es de un solo
 * uso.
 */

import { useEffect, useRef, useState } from "preact/hooks";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const RETRY_DELAY_MS = 2_000;

export type TurnstileWidgetState = "loading" | "ready" | "error" | "expired" | "timeout";

interface TurnstileRenderOptions {
	sitekey: string;
	language: string;
	theme: "auto";
	callback: (token: string) => void;
	"error-callback": () => void;
	"expired-callback": () => void;
	"timeout-callback": () => void;
}

interface TurnstileApi {
	render(container: HTMLElement, options: TurnstileRenderOptions): string;
	remove(widgetId: string): void;
}

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

let scriptPromise: Promise<void> | undefined;

function loadTurnstileScript(): Promise<void> {
	if (window.turnstile) return Promise.resolve();
	scriptPromise ??= new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.addEventListener("load", () => resolve(), { once: true });
		script.addEventListener(
			"error",
			() => {
				// Sin esto el promise rechazado quedaría cacheado y ningún remount
				// podría volver a intentar la carga.
				scriptPromise = undefined;
				script.remove();
				reject(new Error("No se pudo cargar Turnstile."));
			},
			{ once: true },
		);
		document.head.appendChild(script);
	});
	return scriptPromise;
}

export interface TurnstileWidgetProps {
	siteKey: string;
	onToken: (token: string | null) => void;
	onStateChange: (state: TurnstileWidgetState) => void;
}

export function TurnstileWidget({ siteKey, onToken, onStateChange }: TurnstileWidgetProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);
	const retryTimeoutRef = useRef<number | undefined>(undefined);
	const callbacksRef = useRef({ onToken, onStateChange });
	callbacksRef.current = { onToken, onStateChange };
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		let cancelled = false;
		callbacksRef.current.onStateChange("loading");

		loadTurnstileScript()
			.then(() => {
				const container = containerRef.current;
				const api = window.turnstile;
				if (cancelled || !container || !api) return;
				widgetIdRef.current = api.render(container, {
					sitekey: siteKey,
					language: "es",
					theme: "auto",
					callback: (token) => {
						callbacksRef.current.onToken(token);
						callbacksRef.current.onStateChange("ready");
					},
					"error-callback": () => {
						callbacksRef.current.onToken(null);
						callbacksRef.current.onStateChange("error");
					},
					"expired-callback": () => {
						callbacksRef.current.onToken(null);
						callbacksRef.current.onStateChange("expired");
					},
					"timeout-callback": () => {
						callbacksRef.current.onToken(null);
						callbacksRef.current.onStateChange("timeout");
					},
				});
			})
			.catch(() => {
				if (cancelled) return;
				callbacksRef.current.onToken(null);
				if (attempt === 0) {
					retryTimeoutRef.current = window.setTimeout(() => setAttempt(1), RETRY_DELAY_MS);
				} else {
					callbacksRef.current.onStateChange("error");
				}
			});

		return () => {
			cancelled = true;
			if (retryTimeoutRef.current !== undefined) {
				window.clearTimeout(retryTimeoutRef.current);
				retryTimeoutRef.current = undefined;
			}
			const widgetId = widgetIdRef.current;
			if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
			widgetIdRef.current = null;
		};
	}, [siteKey, attempt]);

	return <div ref={containerRef} class="flex min-h-[65px] items-center" />;
}
