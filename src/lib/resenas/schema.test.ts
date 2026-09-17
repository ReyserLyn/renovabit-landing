import { describe, expect, it } from "bun:test";
import * as v from "valibot";
import {
	fieldErrors,
	RESENA_COMENTARIO_MAX,
	RESENA_FOTO_MAX_BYTES,
	resenaSchema,
} from "@/lib/resenas/schema";

function makeFile(bytes: number, type = "image/png"): File {
	return new File([new Uint8Array(bytes)], "foto.png", { type });
}

function validInput(overrides: Record<string, unknown> = {}) {
	return {
		nombre: "  Ana Pérez  ",
		empresa: "",
		servicio_id: "servicio-tecnico",
		servicio_detalle: "",
		estrellas: "5",
		comentario: "  Excelente servicio, mi laptop quedó como nueva.  ",
		contacto: "",
		consentimiento: true,
		foto: undefined,
		...overrides,
	};
}

describe("resenaSchema", () => {
	it("acepta una reseña válida y normaliza los textos", () => {
		const result = v.safeParse(resenaSchema, validInput());
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.output.nombre).toBe("Ana Pérez");
		expect(result.output.comentario).toBe("Excelente servicio, mi laptop quedó como nueva.");
		expect(result.output.estrellas).toBe(5);
		expect(result.output.contacto).toBe("");
		expect(result.output.contacto_tipo).toBeUndefined();
		expect(result.output.empresa).toBe("");
	});

	it("exige el nombre y respeta sus límites", () => {
		const short = v.safeParse(resenaSchema, validInput({ nombre: "A" }));
		expect(short.success).toBe(false);
		if (!short.success) {
			expect(fieldErrors(short).nombre).toBe("El nombre debe tener al menos 2 caracteres.");
		}

		const long = v.safeParse(resenaSchema, validInput({ nombre: "x".repeat(81) }));
		expect(long.success).toBe(false);
		if (!long.success) {
			expect(fieldErrors(long).nombre).toBe("El nombre no debe superar los 80 caracteres.");
		}
	});

	it("acepta estrellas de 1 a 5 y rechaza fuera de rango", () => {
		for (const value of [1, 2, 3, 4, 5] as const) {
			const result = v.safeParse(resenaSchema, validInput({ estrellas: String(value) }));
			expect(result.success).toBe(true);
			if (result.success) expect(result.output.estrellas).toBe(value);
		}

		for (const value of ["0", "6", "abc", ""]) {
			const result = v.safeParse(resenaSchema, validInput({ estrellas: value }));
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(fieldErrors(result).estrellas).toBe(
					"Selecciona una calificación de 1 a 5 estrellas.",
				);
			}
		}
	});

	it("exige un comentario entre 10 y 600 caracteres", () => {
		const short = v.safeParse(resenaSchema, validInput({ comentario: "corto" }));
		expect(short.success).toBe(false);
		if (!short.success) {
			expect(fieldErrors(short).comentario).toBe(
				"El comentario debe tener al menos 10 caracteres.",
			);
		}

		const long = v.safeParse(resenaSchema, {
			...validInput(),
			comentario: "x".repeat(RESENA_COMENTARIO_MAX + 1),
		});
		expect(long.success).toBe(false);
		if (!long.success) {
			expect(fieldErrors(long).comentario).toBe(
				"El comentario no debe superar los 600 caracteres.",
			);
		}
	});

	it("exige el detalle cuando el servicio es Otro", () => {
		const missing = v.safeParse(
			resenaSchema,
			validInput({ servicio_id: "otro", servicio_detalle: "" }),
		);
		expect(missing.success).toBe(false);
		if (!missing.success) {
			expect(fieldErrors(missing).servicio_detalle).toBe("Cuéntanos qué servicio recibiste.");
		}

		const filled = v.safeParse(
			resenaSchema,
			validInput({ servicio_id: "otro", servicio_detalle: "  Cambio de pantalla  " }),
		);
		expect(filled.success).toBe(true);
		if (filled.success) expect(filled.output.servicio_detalle).toBe("Cambio de pantalla");
	});

	it("rechaza servicios fuera de la lista", () => {
		const result = v.safeParse(resenaSchema, validInput({ servicio_id: "soporte" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldErrors(result).servicio_id).toBe("Selecciona el servicio que recibiste.");
		}
	});

	it("exige el consentimiento", () => {
		const denied = v.safeParse(resenaSchema, validInput({ consentimiento: false }));
		expect(denied.success).toBe(false);
		if (!denied.success) {
			expect(fieldErrors(denied).consentimiento).toBe(
				"Debes aceptar la publicación de tu reseña para enviarla.",
			);
		}
	});

	it("valida un correo y deriva contacto_tipo email", () => {
		const result = v.safeParse(resenaSchema, validInput({ contacto: " ana@ejemplo.com " }));
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.output.contacto).toBe("ana@ejemplo.com");
		expect(result.output.contacto_tipo).toBe("email");

		const invalid = v.safeParse(resenaSchema, validInput({ contacto: "ana@" }));
		expect(invalid.success).toBe(false);
		if (!invalid.success) {
			expect(fieldErrors(invalid).contacto).toBe(
				"Escribe un correo o un WhatsApp válido, por ejemplo tucorreo@ejemplo.com o 955 315 646.",
			);
		}
	});

	it("normaliza celulares peruanos y deriva contacto_tipo whatsapp", () => {
		for (const [raw, normalized] of [
			["955 315 646", "955315646"],
			["+51 955-315-646", "955315646"],
			["51 955315646", "955315646"],
			["(955) 315 646", "955315646"],
		]) {
			const result = v.safeParse(resenaSchema, validInput({ contacto: raw }));
			expect(result.success).toBe(true);
			if (!result.success) continue;
			expect(result.output.contacto).toBe(normalized);
			expect(result.output.contacto_tipo).toBe("whatsapp");
		}

		for (const raw of ["12345", "sin números", "955 315 ABC"]) {
			const result = v.safeParse(resenaSchema, validInput({ contacto: raw }));
			expect(result.success).toBe(false);
		}
	});

	it("acepta la foto válida y rechaza tamaño o tipo incorrectos", () => {
		const valid = v.safeParse(resenaSchema, validInput({ foto: makeFile(1024) }));
		expect(valid.success).toBe(true);

		const big = v.safeParse(
			resenaSchema,
			validInput({ foto: makeFile(RESENA_FOTO_MAX_BYTES + 1) }),
		);
		expect(big.success).toBe(false);
		if (!big.success) {
			expect(fieldErrors(big).foto).toBe("La foto no debe superar los 5 MB.");
		}

		const wrongType = v.safeParse(resenaSchema, validInput({ foto: makeFile(1024, "text/plain") }));
		expect(wrongType.success).toBe(false);
		if (!wrongType.success) {
			expect(fieldErrors(wrongType).foto).toBe("La foto debe ser JPG, PNG o WebP.");
		}
	});
});

describe("fieldErrors", () => {
	it("devuelve el primer mensaje por campo y se vacía con un parseo válido", () => {
		const result = v.safeParse(
			resenaSchema,
			validInput({ nombre: "", estrellas: "6", comentario: "", consentimiento: false }),
		);
		expect(result.success).toBe(false);
		if (result.success) return;
		const errors = fieldErrors(result);
		expect(errors.nombre).toBe("El nombre debe tener al menos 2 caracteres.");
		expect(errors.estrellas).toBe("Selecciona una calificación de 1 a 5 estrellas.");
		expect(errors.comentario).toBe("El comentario debe tener al menos 10 caracteres.");
		expect(errors.consentimiento).toBe("Debes aceptar la publicación de tu reseña para enviarla.");
		expect(errors.foto).toBeUndefined();

		expect(fieldErrors(v.safeParse(resenaSchema, validInput()))).toEqual({});
	});
});
