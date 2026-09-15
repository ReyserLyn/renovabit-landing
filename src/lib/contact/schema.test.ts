import { describe, expect, it } from "bun:test";
import * as v from "valibot";
import {
	CONTACT_EMAIL_MAX,
	CONTACT_MENSAJE_MAX,
	contactSchema,
	fieldErrors,
} from "@/lib/contact/schema";

const validInput = {
	nombre: "  Ana Pérez  ",
	whatsapp: "955 315 646",
	email: undefined,
	tipo: "mantenimiento",
	mensaje: "  Prueba de formulario local  ",
	preferencia: undefined,
	consent: true,
};

describe("contactSchema", () => {
	it("acepta una consulta válida y normaliza los textos", () => {
		const result = v.safeParse(contactSchema, validInput);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.output.nombre).toBe("Ana Pérez");
		expect(result.output.mensaje).toBe("Prueba de formulario local");
		expect(result.output.email).toBe("");
		expect(result.output.preferencia).toBe("whatsapp");
	});

	it("exige el nombre y respeta sus límites", () => {
		const short = v.safeParse(contactSchema, { ...validInput, nombre: "A" });
		expect(short.success).toBe(false);
		if (!short.success) {
			expect(fieldErrors(short).nombre).toBe("El nombre debe tener al menos 2 caracteres.");
		}

		const long = v.safeParse(contactSchema, { ...validInput, nombre: "x".repeat(81) });
		expect(long.success).toBe(false);
		if (!long.success) {
			expect(fieldErrors(long).nombre).toBe("El nombre no debe superar los 80 caracteres.");
		}
	});

	it("valida el WhatsApp por cantidad de dígitos y formato", () => {
		const short = v.safeParse(contactSchema, { ...validInput, whatsapp: "12345678" });
		expect(short.success).toBe(false);
		if (!short.success) {
			expect(fieldErrors(short).whatsapp).toBe(
				"El número de WhatsApp debe tener entre 9 y 15 dígitos.",
			);
		}

		const long = v.safeParse(contactSchema, { ...validInput, whatsapp: "1".repeat(16) });
		expect(long.success).toBe(false);

		const letters = v.safeParse(contactSchema, { ...validInput, whatsapp: "955 315 ABC" });
		expect(letters.success).toBe(false);
		if (!letters.success) {
			expect(fieldErrors(letters).whatsapp).toBe(
				"Escribe un número de WhatsApp válido, por ejemplo 955 315 646.",
			);
		}

		const international = v.safeParse(contactSchema, {
			...validInput,
			whatsapp: "+51 955 315 646",
		});
		expect(international.success).toBe(true);
	});

	it("permite el correo vacío y valida el correo presente", () => {
		const empty = v.safeParse(contactSchema, { ...validInput, email: "" });
		expect(empty.success).toBe(true);

		const valid = v.safeParse(contactSchema, { ...validInput, email: "ana@ejemplo.com" });
		expect(valid.success).toBe(true);
		if (valid.success) expect(valid.output.email).toBe("ana@ejemplo.com");

		const invalid = v.safeParse(contactSchema, { ...validInput, email: "ana@" });
		expect(invalid.success).toBe(false);
		if (!invalid.success) {
			expect(fieldErrors(invalid).email).toBe(
				"Escribe un correo válido, por ejemplo tucorreo@ejemplo.com.",
			);
		}

		const long = v.safeParse(contactSchema, {
			...validInput,
			email: `${"a".repeat(CONTACT_EMAIL_MAX)}@ejemplo.com`,
		});
		expect(long.success).toBe(false);
	});

	it("exige una necesidad de la lista", () => {
		const missing = v.safeParse(contactSchema, { ...validInput, tipo: "" });
		expect(missing.success).toBe(false);
		if (!missing.success) {
			expect(fieldErrors(missing).tipo).toBe("Selecciona qué necesitas.");
		}

		const unknown = v.safeParse(contactSchema, { ...validInput, tipo: "soporte" });
		expect(unknown.success).toBe(false);
	});

	it("exige un mensaje entre 10 y 1200 caracteres", () => {
		const short = v.safeParse(contactSchema, { ...validInput, mensaje: "corto" });
		expect(short.success).toBe(false);
		if (!short.success) {
			expect(fieldErrors(short).mensaje).toBe("El mensaje debe tener al menos 10 caracteres.");
		}

		const long = v.safeParse(contactSchema, {
			...validInput,
			mensaje: "x".repeat(CONTACT_MENSAJE_MAX + 1),
		});
		expect(long.success).toBe(false);
		if (!long.success) {
			expect(fieldErrors(long).mensaje).toBe("El mensaje no debe superar los 1200 caracteres.");
		}
	});

	it("acepta las preferencias válidas y rechaza las desconocidas", () => {
		for (const preferencia of ["whatsapp", "llamada", "correo"] as const) {
			const result = v.safeParse(contactSchema, { ...validInput, preferencia });
			expect(result.success).toBe(true);
		}

		const invalid = v.safeParse(contactSchema, { ...validInput, preferencia: "telegram" });
		expect(invalid.success).toBe(false);
	});

	it("exige el consentimiento", () => {
		const denied = v.safeParse(contactSchema, { ...validInput, consent: false });
		expect(denied.success).toBe(false);
		if (!denied.success) {
			expect(fieldErrors(denied).consent).toBe(
				"Debes aceptar el uso de tus datos para enviar la consulta.",
			);
		}
	});
});

describe("fieldErrors", () => {
	it("devuelve el primer mensaje por campo", () => {
		const result = v.safeParse(contactSchema, {
			...validInput,
			nombre: "",
			whatsapp: "",
			mensaje: "",
			tipo: "",
			consent: false,
		});
		expect(result.success).toBe(false);
		if (result.success) return;
		const errors = fieldErrors(result);
		expect(errors.nombre).toBe("El nombre debe tener al menos 2 caracteres.");
		expect(errors.whatsapp).toBe("Escribe un número de WhatsApp válido, por ejemplo 955 315 646.");
		expect(errors.mensaje).toBe("El mensaje debe tener al menos 10 caracteres.");
		expect(errors.tipo).toBe("Selecciona qué necesitas.");
		expect(errors.consent).toBe("Debes aceptar el uso de tus datos para enviar la consulta.");
		expect(errors.email).toBeUndefined();
	});

	it("devuelve un objeto vacío cuando el parseo es válido", () => {
		const result = v.safeParse(contactSchema, validInput);
		expect(result.success).toBe(true);
		expect(fieldErrors(result)).toEqual({});
	});
});
