import { describe, expect, it } from "bun:test";
import type { FetchLike } from "@/lib/contact/fetch";
import { RESEND_FROM, type ResendDeps, type ResendEnv, sendEmail } from "@/lib/contact/resend";

const payload = {
	to: "contacto@renovabit.com",
	subject: "Nueva consulta",
	html: "<p>Hola</p>",
	text: "Hola",
	replyTo: "ana@ejemplo.com",
};

function createLog() {
	const calls: unknown[][] = [];
	return {
		log: {
			info: (...args: unknown[]) => calls.push(args),
			error: (...args: unknown[]) => calls.push(args),
		} satisfies Pick<Console, "info" | "error">,
		calls,
	};
}

describe("sendEmail", () => {
	it("envía el correo con la API de Resend", async () => {
		let capturedUrl = "";
		let capturedInit: RequestInit | undefined;
		const fetchImpl: FetchLike = async (input, init) => {
			capturedUrl = String(input);
			capturedInit = init;
			return new Response(JSON.stringify({ id: "email-id" }), { status: 200 });
		};

		const result = await sendEmail(
			payload,
			{ RESEND_API_KEY: "re_test_key" },
			{ fetch: fetchImpl, isProduction: true },
		);

		expect(result).toEqual({ ok: true, simulated: false });
		expect(capturedUrl).toBe("https://api.resend.com/emails");
		expect(capturedInit?.headers).toMatchObject({
			Authorization: "Bearer re_test_key",
			"Content-Type": "application/json",
		});
		const body = JSON.parse(String(capturedInit?.body));
		expect(body.from).toBe(RESEND_FROM);
		expect(body.to).toEqual(["contacto@renovabit.com"]);
		expect(body.reply_to).toBe("ana@ejemplo.com");
		expect(body.text).toBe("Hola");
	});

	it("usa el remitente no-reply del dominio verificado", () => {
		expect(RESEND_FROM).toBe("RenovaBit <no-reply@mail.renovabit.com>");
	});

	it("simula el envío en desarrollo con CONTACT_DEV_SIMULATE_EMAIL=true", async () => {
		let called = false;
		const fetchImpl: FetchLike = async () => {
			called = true;
			return new Response(null, { status: 200 });
		};
		const { log, calls } = createLog();

		const result = await sendEmail(
			payload,
			{ RESEND_API_KEY: "re_test_key", CONTACT_DEV_SIMULATE_EMAIL: "true" },
			{ fetch: fetchImpl, isProduction: false, log },
		);

		expect(result).toEqual({ ok: true, simulated: true });
		expect(called).toBe(false);
		// En desarrollo sí se registra el contenido para poder revisarlo.
		expect(JSON.stringify(calls)).toContain("Hola");
	});

	it("rechaza el envío si CONTACT_DEV_SIMULATE_EMAIL está definida en producción", async () => {
		let called = false;
		const fetchImpl: FetchLike = async () => {
			called = true;
			return new Response(null, { status: 200 });
		};
		const { log, calls } = createLog();

		const result = await sendEmail(
			payload,
			{ RESEND_API_KEY: "re_test_key", CONTACT_DEV_SIMULATE_EMAIL: "true" },
			{ fetch: fetchImpl, isProduction: true, log },
		);

		expect(result).toEqual({ ok: false });
		expect(called).toBe(false);
		expect(calls).toHaveLength(1);
		// En producción nunca se registra el contenido del correo.
		expect(JSON.stringify(calls)).not.toContain("Hola");
		expect(JSON.stringify(calls)).not.toContain("ana@ejemplo.com");
	});

	it("falla sin API key aunque sea desarrollo", async () => {
		const { log, calls } = createLog();
		const result = await sendEmail(payload, {}, { isProduction: false, log });
		expect(result).toEqual({ ok: false });
		expect(calls).toHaveLength(1);
	});

	it("no registra el contenido del correo tras un envío real en producción", async () => {
		const { log, calls } = createLog();
		const fetchImpl: FetchLike = async () => new Response(null, { status: 200 });

		const result = await sendEmail(
			payload,
			{ RESEND_API_KEY: "re_test_key" },
			{ fetch: fetchImpl, isProduction: true, log },
		);

		expect(result).toEqual({ ok: true, simulated: false });
		expect(calls).toHaveLength(0);
	});

	it("falla cuando Resend responde con error", async () => {
		const fetchImpl: FetchLike = async () =>
			new Response(JSON.stringify({ message: "invalid" }), { status: 422 });
		const result = await sendEmail(
			payload,
			{ RESEND_API_KEY: "re_test_key" },
			{ fetch: fetchImpl, isProduction: true, log: createLog().log },
		);
		expect(result).toEqual({ ok: false });
	});

	it("falla ante un error de red", async () => {
		const fetchImpl: FetchLike = async () => {
			throw new Error("network down");
		};
		const result = await sendEmail(
			payload,
			{ RESEND_API_KEY: "re_test_key" },
			{ fetch: fetchImpl, isProduction: true, log: createLog().log },
		);
		expect(result).toEqual({ ok: false });
	});

	it("no registra la API key en los logs", async () => {
		const { log, calls } = createLog();
		const fetchImpl: FetchLike = async () => {
			throw new Error("network down");
		};
		const env: ResendEnv = { RESEND_API_KEY: "re_super_secret_key" };
		const deps: ResendDeps = { fetch: fetchImpl, isProduction: true, log };

		await sendEmail(payload, env, deps);

		const serialized = JSON.stringify(calls);
		expect(serialized).not.toContain("re_super_secret_key");
		expect(serialized).not.toContain("Bearer");
	});
});
