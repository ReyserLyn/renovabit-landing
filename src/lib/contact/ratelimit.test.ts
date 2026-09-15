import { describe, expect, it } from "bun:test";
import { allowRequest, type RateLimitEnv } from "@/lib/contact/ratelimit";

describe("allowRequest", () => {
	it("permite el envío y avisa una vez cuando falta el binding", async () => {
		const warnings: unknown[][] = [];
		const env: RateLimitEnv = {};
		const allowed = await allowRequest(env, "contact:1.2.3.4", {
			log: {
				warn: (...args: unknown[]) => warnings.push(args),
				error: (): void => undefined,
			},
		});
		expect(allowed).toBe(true);
		expect(warnings).toHaveLength(1);
	});

	it("permite el envío cuando el contador está por debajo del límite", async () => {
		const keys: string[] = [];
		const env: RateLimitEnv = {
			CONTACT_RATE_LIMITER: {
				limit: async ({ key }) => {
					keys.push(key);
					return { success: true };
				},
			},
		};
		const allowed = await allowRequest(env, "contact:1.2.3.4");
		expect(allowed).toBe(true);
		expect(keys).toEqual(["contact:1.2.3.4"]);
	});

	it("bloquea el envío cuando se supera el límite", async () => {
		const env: RateLimitEnv = {
			CONTACT_RATE_LIMITER: {
				limit: async () => ({ success: false }),
			},
		};
		expect(await allowRequest(env, "contact:1.2.3.4")).toBe(false);
	});

	it("permite el envío si el binding falla", async () => {
		const errors: unknown[][] = [];
		const env: RateLimitEnv = {
			CONTACT_RATE_LIMITER: {
				limit: async () => {
					throw new Error("binding unavailable");
				},
			},
		};
		const allowed = await allowRequest(env, "contact:1.2.3.4", {
			log: {
				warn: (): void => undefined,
				error: (...args: unknown[]) => errors.push(args),
			},
		});
		expect(allowed).toBe(true);
		expect(errors).toHaveLength(1);
	});
});
