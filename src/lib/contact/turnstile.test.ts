import { describe, expect, it } from "bun:test";
import type { FetchLike } from "@/lib/contact/fetch";
import {
	isTurnstileTestSiteKey,
	TURNSTILE_TEST_SECRET,
	verifyTurnstile,
} from "@/lib/contact/turnstile";

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

const noop = (): void => undefined;
const silentLog = { error: noop } satisfies Pick<Console, "error">;

describe("isTurnstileTestSiteKey", () => {
	it("detecta las sitekeys de prueba de Cloudflare", () => {
		expect(isTurnstileTestSiteKey("1x00000000000000000000AA")).toBe(true);
		expect(isTurnstileTestSiteKey("2x00000000000000000000AB")).toBe(true);
		expect(isTurnstileTestSiteKey("3x00000000000000000000FF")).toBe(true);
		expect(isTurnstileTestSiteKey("1X00000000000000000000AA")).toBe(true);
		expect(isTurnstileTestSiteKey("0x4AAAAAAABcdefghijklmnop")).toBe(false);
	});
});

describe("verifyTurnstile", () => {
	it("acepta un token válido", async () => {
		let capturedUrl = "";
		let capturedBody = "";
		const fetchImpl: FetchLike = async (input, init) => {
			capturedUrl = String(input);
			capturedBody = String(init?.body ?? "");
			return jsonResponse({ success: true });
		};

		const result = await verifyTurnstile(
			{ token: "test-token", secret: TURNSTILE_TEST_SECRET, remoteip: "1.2.3.4" },
			{ fetch: fetchImpl, isProduction: false, log: silentLog },
		);

		expect(result).toEqual({ ok: true });
		expect(capturedUrl).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
		expect(capturedBody).toContain("secret=1x0000000000000000000000000000000AA");
		expect(capturedBody).toContain("response=test-token");
		expect(capturedBody).toContain("remoteip=1.2.3.4");
	});

	it("rechaza cuando siteverify responde success=false", async () => {
		const fetchImpl: FetchLike = async () => jsonResponse({ success: false });
		const result = await verifyTurnstile(
			{ token: "test-token", secret: "secret" },
			{ fetch: fetchImpl, log: silentLog },
		);
		expect(result).toEqual({ ok: false, reason: "rejected" });
	});

	it("rechaza cuando falta el token", async () => {
		let called = false;
		const fetchImpl: FetchLike = async () => {
			called = true;
			return jsonResponse({ success: true });
		};

		const result = await verifyTurnstile(
			{ token: null, secret: "secret" },
			{ fetch: fetchImpl, log: silentLog },
		);
		expect(result).toEqual({ ok: false, reason: "token" });
		expect(called).toBe(false);
	});

	it("falla cerrado cuando falta el secret", async () => {
		let errors = 0;
		const fetchImpl: FetchLike = async () => jsonResponse({ success: true });

		const result = await verifyTurnstile(
			{ token: "test-token", secret: undefined },
			{ fetch: fetchImpl, log: { error: () => errors++ } },
		);
		expect(result).toEqual({ ok: false, reason: "config" });
		expect(errors).toBe(1);
	});

	it("rechaza el secret de prueba en producción", async () => {
		let called = false;
		let errors = 0;
		const fetchImpl: FetchLike = async () => {
			called = true;
			return jsonResponse({ success: true });
		};

		const result = await verifyTurnstile(
			{ token: "test-token", secret: TURNSTILE_TEST_SECRET },
			{ fetch: fetchImpl, isProduction: true, log: { error: () => errors++ } },
		);

		expect(result).toEqual({ ok: false, reason: "config" });
		expect(called).toBe(false);
		expect(errors).toBe(1);
	});

	it("permite el secret de prueba fuera de producción", async () => {
		const fetchImpl: FetchLike = async () => jsonResponse({ success: true });
		const result = await verifyTurnstile(
			{ token: "test-token", secret: TURNSTILE_TEST_SECRET },
			{ fetch: fetchImpl, isProduction: false, log: silentLog },
		);
		expect(result).toEqual({ ok: true });
	});

	it("falla cerrado ante un error de red", async () => {
		const fetchImpl: FetchLike = async () => {
			throw new Error("network down");
		};

		const result = await verifyTurnstile(
			{ token: "test-token", secret: "secret" },
			{ fetch: fetchImpl, log: silentLog },
		);
		expect(result).toEqual({ ok: false, reason: "network" });
	});

	it("falla cerrado cuando siteverify supera el timeout", async () => {
		const fetchImpl: FetchLike = (_input, init) =>
			new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener("abort", () => {
					reject(new DOMException("The operation was aborted.", "AbortError"));
				});
			});

		const result = await verifyTurnstile(
			{ token: "test-token", secret: "secret" },
			{ fetch: fetchImpl, timeoutMs: 5, log: silentLog },
		);
		expect(result).toEqual({ ok: false, reason: "network" });
	});

	it("rechaza un hostname de la petición fuera del allowlist y exime a localhost", async () => {
		const fetchImpl: FetchLike = async () => jsonResponse({ success: true });
		const allowedHostnames = ["renovabit.com", "www.renovabit.com", "localhost"];

		const rejected = await verifyTurnstile(
			{ token: "test-token", secret: "secret", hostname: "staging.example.com" },
			{ fetch: fetchImpl, allowedHostnames, log: silentLog },
		);
		expect(rejected).toEqual({ ok: false, reason: "hostname" });

		const accepted = await verifyTurnstile(
			{ token: "test-token", secret: "secret", hostname: "localhost" },
			{ fetch: fetchImpl, allowedHostnames, log: silentLog },
		);
		expect(accepted).toEqual({ ok: true });
	});

	it("rechaza un hostname verificado fuera del allowlist", async () => {
		const fetchImpl: FetchLike = async () =>
			jsonResponse({ success: true, hostname: "evil.example" });
		const result = await verifyTurnstile(
			{ token: "test-token", secret: "real-secret" },
			{ fetch: fetchImpl, allowedHostnames: ["renovabit.com"], log: silentLog },
		);
		expect(result).toEqual({ ok: false, reason: "hostname" });
	});

	it("acepta un hostname verificado dentro del allowlist", async () => {
		const fetchImpl: FetchLike = async () =>
			jsonResponse({ success: true, hostname: "renovabit.com" });
		const result = await verifyTurnstile(
			{ token: "test-token", secret: "real-secret" },
			{ fetch: fetchImpl, allowedHostnames: ["renovabit.com"], log: silentLog },
		);
		expect(result).toEqual({ ok: true });
	});

	it("omite el hostname verificado cuando la respuesta no lo incluye", async () => {
		const fetchImpl: FetchLike = async () => jsonResponse({ success: true });
		const result = await verifyTurnstile(
			{ token: "test-token", secret: "real-secret" },
			{ fetch: fetchImpl, allowedHostnames: ["renovabit.com"], log: silentLog },
		);
		expect(result).toEqual({ ok: true });
	});

	it("omite el hostname verificado con el secret de prueba", async () => {
		const fetchImpl: FetchLike = async () =>
			jsonResponse({ success: true, hostname: "example.com" });
		const result = await verifyTurnstile(
			{ token: "test-token", secret: TURNSTILE_TEST_SECRET },
			{
				fetch: fetchImpl,
				isProduction: false,
				allowedHostnames: ["renovabit.com"],
				log: silentLog,
			},
		);
		expect(result).toEqual({ ok: true });
	});

	it("acepta el flujo local con el secret de prueba y hostname localhost", async () => {
		const fetchImpl: FetchLike = async () => jsonResponse({ success: true });
		const result = await verifyTurnstile(
			{ token: "XXXX.DUMMY.TOKEN.XXXX", secret: TURNSTILE_TEST_SECRET, hostname: "localhost" },
			{ fetch: fetchImpl, isProduction: false, allowedHostnames: ["localhost"], log: silentLog },
		);
		expect(result).toEqual({ ok: true });
	});
});
