import { describe, expect, it } from "bun:test";
import { buildContactOrigin, readDesde } from "@/lib/contact/attribution";

describe("readDesde", () => {
	it("lee el parámetro desde codificado", () => {
		expect(readDesde("?desde=%2Flaptop-lenta-arequipa%2F")).toBe("/laptop-lenta-arequipa/");
		expect(readDesde("?utm_source=x&desde=%2Fservicios%2F")).toBe("/servicios/");
	});

	it("devuelve null cuando falta, está vacío o no es una ruta interna", () => {
		expect(readDesde("")).toBeNull();
		expect(readDesde("?estado=enviado")).toBeNull();
		expect(readDesde("?desde=")).toBeNull();
		expect(readDesde("?desde=sin-slash")).toBeNull();
	});

	it("devuelve null con valores demasiado largos o con caracteres raros", () => {
		expect(readDesde(`?desde=/${"a".repeat(121)}`)).toBeNull();
		expect(readDesde("?desde=%3Cscript%3E")).toBeNull();
		expect(readDesde("?desde=%2Ffoo%20bar")).toBeNull();
	});
});

describe("buildContactOrigin", () => {
	it("usa el formato de atribución cuando desde es válido", () => {
		expect(buildContactOrigin("/contacto/", "?desde=%2Flaptop-lenta-arequipa%2F")).toBe(
			"/laptop-lenta-arequipa/ (formulario de contacto)",
		);
	});

	it("conserva ruta y search cuando no hay desde", () => {
		expect(buildContactOrigin("/contacto/", "")).toBe("/contacto/");
		expect(buildContactOrigin("/contacto/", "?estado=enviado")).toBe("/contacto/?estado=enviado");
	});

	it("hace fallback cuando desde es inválido", () => {
		expect(buildContactOrigin("/contacto/", "?desde=sin-slash")).toBe("/contacto/?desde=sin-slash");
		expect(buildContactOrigin("/contacto/", "?desde=")).toBe("/contacto/?desde=");
		expect(buildContactOrigin("/contacto/", "?desde=%3Cscript%3E")).toBe(
			"/contacto/?desde=%3Cscript%3E",
		);
		expect(buildContactOrigin("/contacto/", `?desde=/${"a".repeat(121)}`)).toBe(
			`/contacto/?desde=/${"a".repeat(121)}`,
		);
	});
});
