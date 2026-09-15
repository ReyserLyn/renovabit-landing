import { describe, expect, it } from "bun:test";
import type { ContactErrorCode } from "@/lib/contact/errors";
import type { ContactResult } from "@/lib/contact/handler";
import {
	FORM_HASH,
	FORM_PATH,
	jsonProblem,
	jsonResponse,
	methodNotAllowedResponse,
	noStore,
	problemResponse,
	redirectResponse,
	wantsJson,
} from "@/lib/contact/respond";

function jsonRequest(): Request {
	return new Request("https://renovabit.com/api/contact", {
		method: "POST",
		headers: { Accept: "application/json" },
	});
}

function htmlRequest(): Request {
	return new Request("https://renovabit.com/api/contact", { method: "POST" });
}

async function readJson<T>(response: Response): Promise<T> {
	return (await response.json()) as T;
}

describe("wantsJson", () => {
	it("detecta los clientes que piden JSON", () => {
		expect(wantsJson(jsonRequest())).toBe(true);
		expect(wantsJson(htmlRequest())).toBe(false);
	});
});

describe("jsonResponse", () => {
	it("serializa el resultado con no-store", async () => {
		const result: ContactResult = { status: 200, body: { ok: true } };
		const response = jsonResponse(result);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(await readJson<{ ok: boolean }>(response)).toEqual({ ok: true });
	});
});

describe("jsonProblem", () => {
	it("devuelve el código con su estado", async () => {
		const response = jsonProblem(403, "verificacion");
		expect(response.status).toBe(403);
		expect(await readJson<{ ok: boolean; code: string }>(response)).toEqual({
			ok: false,
			code: "verificacion",
		});
	});
});

describe("redirectResponse", () => {
	it("redirige al éxito con el ancla del formulario", () => {
		const response = redirectResponse();
		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe(`${FORM_PATH}?estado=enviado${FORM_HASH}`);
	});

	it("codifica el motivo en la URL", () => {
		const response = redirectResponse("campos");
		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe(
			`${FORM_PATH}?estado=error&motivo=campos${FORM_HASH}`,
		);

		// Código fuera del contrato: comprueba que el valor se codifica igualmente.
		const weirdCode = "a b&c" as unknown as ContactErrorCode;
		const encoded = redirectResponse(weirdCode);
		expect(encoded.headers.get("location")).toContain("motivo=a%20b%26c");
	});
});

describe("problemResponse", () => {
	it("responde JSON cuando el cliente lo pide", async () => {
		const response = problemResponse(jsonRequest(), 429, "limite");
		expect(response.status).toBe(429);
		expect(await readJson<{ ok: boolean; code: string }>(response)).toEqual({
			ok: false,
			code: "limite",
		});
	});

	it("redirige al formulario para el resto de clientes", () => {
		const response = problemResponse(htmlRequest(), 413, "envio");
		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toContain("motivo=envio");
	});
});

describe("methodNotAllowedResponse", () => {
	it("devuelve 405 con Allow: POST", () => {
		const response = methodNotAllowedResponse();
		expect(response.status).toBe(405);
		expect(response.headers.get("allow")).toBe("POST");
		expect(response.headers.get("cache-control")).toBe("no-store");
	});
});

describe("noStore", () => {
	it("añade cache-control sin perder cabeceras", () => {
		expect(noStore({ "X-Test": "1" })).toEqual({ "X-Test": "1", "Cache-Control": "no-store" });
	});
});
