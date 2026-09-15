import { describe, expect, it } from "bun:test";
import type { FetchLike } from "@/lib/contact/fetch";
import {
	type ContactDeps,
	type ContactEnv,
	processContact,
	type SendEmailFn,
} from "@/lib/contact/handler";
import type { EmailPayload } from "@/lib/contact/resend";
import { TURNSTILE_TEST_SECRET } from "@/lib/contact/turnstile";

const PROD_SECRET = "turnstile-production-secret";

function createFormData(overrides: Record<string, string> = {}): FormData {
	const formData = new FormData();
	formData.set("nombre", "Ana Pérez");
	formData.set("whatsapp", "955 315 646");
	formData.set("email", "ana@ejemplo.com");
	formData.set("tipo", "mantenimiento");
	formData.set("mensaje", "Prueba de formulario local");
	formData.set("preferencia", "whatsapp");
	formData.set("consent", "on");
	formData.set("cf-turnstile-response", "test-token");
	formData.set("origen", "/contacto/");
	for (const [key, value] of Object.entries(overrides)) {
		if (value === "") formData.delete(key);
		else formData.set(key, value);
	}
	return formData;
}

function createHeaders(origin: string | null = "https://renovabit.com"): Headers {
	const headers = new Headers({ host: "renovabit.com" });
	if (origin) headers.set("origin", origin);
	headers.set("cf-connecting-ip", "203.0.113.10");
	return headers;
}

function createTurnstileFetch(success = true) {
	const calls: string[] = [];
	const fetchImpl: FetchLike = async (input) => {
		calls.push(String(input));
		return new Response(JSON.stringify({ success }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	};
	return { calls, fetchImpl };
}

function createSender(results: boolean[] = []) {
	const sent: EmailPayload[] = [];
	let index = 0;
	const sender: SendEmailFn = async (payload) => {
		sent.push(payload);
		const ok = results[index] ?? true;
		index += 1;
		return ok ? { ok: true as const, simulated: true } : { ok: false as const };
	};
	return { sent, sender };
}

const noop = (): void => undefined;
const silentLog = { info: noop, warn: noop, error: noop };

function baseEnv(overrides: Partial<ContactEnv> = {}): ContactEnv {
	return {
		TURNSTILE_SECRET_KEY: PROD_SECRET,
		CONTACT_INBOX: "contacto@renovabit.com",
		...overrides,
	};
}

const baseDeps: ContactDeps = { isProduction: true, log: silentLog };

describe("processContact", () => {
	it("envía la notificación y la respuesta automática", async () => {
		const { sent, sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData(),
			headers: createHeaders(),
			env: baseEnv(),
			hostname: "renovabit.com",
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result).toEqual({ status: 200, body: { ok: true } });
		expect(sent).toHaveLength(2);
		expect(sent[0]?.to).toBe("contacto@renovabit.com");
		expect(sent[0]?.replyTo).toBe("ana@ejemplo.com");
		expect(sent[0]?.subject).toContain("Ana Pérez");
		expect(sent[1]?.to).toBe("ana@ejemplo.com");
		// Las respuestas del cliente al remitente no-reply vuelven al inbox.
		expect(sent[1]?.replyTo).toBe("contacto@renovabit.com");
	});

	it("no envía respuesta automática cuando no hay correo", async () => {
		const { sent, sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData({ email: "" }),
			headers: createHeaders(),
			env: baseEnv(),
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result.status).toBe(200);
		expect(sent).toHaveLength(1);
	});

	it("usa la bandeja por defecto cuando CONTACT_INBOX no está definida", async () => {
		const { sent, sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();

		await processContact({
			formData: createFormData(),
			headers: createHeaders(),
			env: baseEnv({ CONTACT_INBOX: undefined }),
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(sent[0]?.to).toBe("contacto@renovabit.com");
	});

	it("responde éxito falso con el honeypot relleno y no envía nada", async () => {
		const { sent, sender } = createSender();
		const { calls, fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData({ empresa: "spam" }),
			headers: createHeaders(),
			env: baseEnv(),
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result).toEqual({ status: 200, body: { ok: true } });
		expect(sent).toHaveLength(0);
		expect(calls).toHaveLength(0);
	});

	it("devuelve errores por campo sin enviar correo", async () => {
		const { sent, sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData({ nombre: "A", mensaje: "corto" }),
			headers: createHeaders(),
			env: baseEnv(),
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result.status).toBe(400);
		if (result.status !== 400) return;
		expect(result.body.code).toBe("campos");
		expect(result.body.fieldErrors.nombre).toBe("El nombre debe tener al menos 2 caracteres.");
		expect(result.body.fieldErrors.mensaje).toBe("El mensaje debe tener al menos 10 caracteres.");
		expect(sent).toHaveLength(0);
	});

	it("rechaza el envío sin token de Turnstile", async () => {
		const { sent, sender } = createSender();
		const { calls, fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData({ "cf-turnstile-response": "" }),
			headers: createHeaders(),
			env: baseEnv(),
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result).toEqual({ status: 403, body: { ok: false, code: "verificacion" } });
		expect(sent).toHaveLength(0);
		expect(calls).toHaveLength(0);
	});

	it("rechaza un origen no permitido antes de verificar Turnstile", async () => {
		const { sent, sender } = createSender();
		const { calls, fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData(),
			headers: createHeaders("https://evil.example"),
			env: baseEnv(),
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result).toEqual({ status: 403, body: { ok: false, code: "verificacion" } });
		expect(calls).toHaveLength(0);
		expect(sent).toHaveLength(0);
	});

	it("rechaza el secret de prueba de Turnstile en producción", async () => {
		const { sent, sender } = createSender();
		const { calls, fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData(),
			headers: createHeaders(),
			env: baseEnv({ TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET }),
			hostname: "renovabit.com",
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result).toEqual({ status: 403, body: { ok: false, code: "verificacion" } });
		expect(calls).toHaveLength(0);
		expect(sent).toHaveLength(0);
	});

	it("permite previews de workers.dev fuera de producción", async () => {
		const { sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData(),
			headers: createHeaders("https://renovabit-landing.user.workers.dev"),
			env: baseEnv({ TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET }),
			hostname: "renovabit-landing.user.workers.dev",
			deps: { ...baseDeps, isProduction: false, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result).toEqual({ status: 200, body: { ok: true } });
	});

	it("rechaza previews de workers.dev en producción", async () => {
		const { sent, sender } = createSender();
		const { calls, fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData(),
			headers: createHeaders("https://renovabit-landing.user.workers.dev"),
			env: baseEnv(),
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result).toEqual({ status: 403, body: { ok: false, code: "verificacion" } });
		expect(calls).toHaveLength(0);
		expect(sent).toHaveLength(0);
	});

	it("aplica el límite de envíos", async () => {
		const { sent, sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();
		const keys: string[] = [];

		const result = await processContact({
			formData: createFormData(),
			headers: createHeaders(),
			env: baseEnv({
				CONTACT_RATE_LIMITER: {
					limit: async ({ key }) => {
						keys.push(key);
						return { success: false };
					},
				},
			}),
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result).toEqual({ status: 429, body: { ok: false, code: "limite" } });
		expect(keys).toEqual(["contact:203.0.113.10"]);
		expect(sent).toHaveLength(0);
	});

	it("devuelve un error genérico si falla la notificación", async () => {
		const { sender } = createSender([false]);
		const { fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData(),
			headers: createHeaders(),
			env: baseEnv(),
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result).toEqual({ status: 500, body: { ok: false, code: "envio" } });
	});

	it("mantiene el éxito si falla solo la respuesta automática", async () => {
		const { sent, sender } = createSender([true, false]);
		const { fetchImpl } = createTurnstileFetch();

		const result = await processContact({
			formData: createFormData(),
			headers: createHeaders(),
			env: baseEnv(),
			deps: { ...baseDeps, fetch: fetchImpl, sendEmail: sender },
		});

		expect(result).toEqual({ status: 200, body: { ok: true } });
		expect(sent).toHaveLength(2);
	});
});
