import { describe, expect, it } from "bun:test";
import type { ResenaData } from "@/lib/resenas/schema";
import {
	RESENA_DESCUENTO,
	RESENA_PANEL_URL,
	renderResenaNotificationEmail,
	renderResenaThankYouEmail,
	renderStars,
} from "@/lib/resenas/templates";

const data: ResenaData = {
	nombre: "Ana Pérez",
	empresa: "Estudio Contable",
	servicio_id: "servicio-tecnico",
	servicio_detalle: "",
	estrellas: 5,
	comentario: "Excelente servicio, mi laptop quedó como nueva.",
	contacto: "ana@ejemplo.com",
	contacto_tipo: "email",
	consentimiento: true,
	foto: undefined,
};

function countStars(value: string, star: string): number {
	return value.split(star).length - 1;
}

describe("renderStars", () => {
	it("dibuja las estrellas llenas y vacías según la calificación", () => {
		const three = renderStars(3);
		expect(countStars(three, "★")).toBe(3);
		expect(countStars(three, "☆")).toBe(2);

		const five = renderStars(5);
		expect(countStars(five, "★")).toBe(5);
		expect(countStars(five, "☆")).toBe(0);
	});
});

describe("renderResenaNotificationEmail", () => {
	it("incluye todos los campos, el descuento y el enlace al panel", () => {
		const email = renderResenaNotificationEmail(data);

		expect(email.subject).toBe("Nueva reseña de Ana Pérez: 5★");
		for (const value of [
			"Ana Pérez",
			"Estudio Contable",
			"Servicio técnico",
			"ana@ejemplo.com",
			"Excelente servicio, mi laptop quedó como nueva.",
			RESENA_DESCUENTO,
			RESENA_PANEL_URL,
		]) {
			expect(email.html).toContain(value);
			expect(email.text).toContain(value);
		}
		expect(email.text).toContain("Descuento de S/5 otorgado");
	});

	it("marca el contacto ausente y omite la nota de foto cuando no hay", () => {
		const email = renderResenaNotificationEmail({
			...data,
			contacto: "",
			contacto_tipo: undefined,
		});
		expect(email.html).toContain("No indicado");
		expect(email.text).toContain("No indicado");
		expect(email.text).not.toContain("La reseña incluye una foto");
	});

	it("muestra el detalle cuando el servicio es Otro", () => {
		const email = renderResenaNotificationEmail({
			...data,
			servicio_id: "otro",
			servicio_detalle: "Cambio de pantalla",
		});
		expect(email.html).toContain("Cambio de pantalla");
		expect(email.text).toContain("Cambio de pantalla");
	});

	it("avisa cuando la reseña incluye una foto", () => {
		const email = renderResenaNotificationEmail({
			...data,
			foto: new File([new Uint8Array([0x89, 0x50])], "foto.png", { type: "image/png" }),
		});
		expect(email.text).toContain("La reseña incluye una foto");
		expect(email.html).toContain("La reseña incluye una foto");
	});

	it("escapa el contenido escrito por la persona", () => {
		const email = renderResenaNotificationEmail({
			...data,
			nombre: "<script>alert(1)</script>",
			comentario: "<img src=x onerror=alert(1)>",
		});
		expect(email.html).not.toContain("<script>");
		expect(email.html).not.toContain("<img src=x");
		expect(email.html).toContain("&lt;script&gt;");
		expect(email.subject).not.toContain("\n");
	});
});

describe("renderResenaThankYouEmail", () => {
	it("agradece con el nombre, la reseña y el descuento", () => {
		const email = renderResenaThankYouEmail(data);

		expect(email.subject).toContain("Gracias");
		expect(email.subject).toContain("Ana Pérez");
		for (const value of [
			"¡Gracias, Ana!",
			"Excelente servicio, mi laptop quedó como nueva.",
			"S/5",
			"descuento",
			"RenovaBit",
		]) {
			expect(email.html).toContain(value);
			expect(email.text).toContain(value);
		}
		expect(email.html).toContain("Hoy aplicamos tu descuento de S/5 en el servicio que recibiste.");
	});

	it("escapa el contenido escrito por la persona", () => {
		const email = renderResenaThankYouEmail({
			...data,
			nombre: "<b>Ana</b>",
			comentario: "<i>hola</i>",
		});
		expect(email.html).not.toContain("<b>Ana</b>");
		expect(email.html).not.toContain("<i>hola</i>");
		expect(email.html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
	});
});

describe("estructura del correo", () => {
	it("usa el logo absoluto, el ancho máximo y el color-scheme claro", () => {
		const email = renderResenaThankYouEmail(data);
		expect(email.html).toContain("https://renovabit.com/email/logo-horizontal-light.png");
		expect(email.html).toContain("max-width:600px");
		expect(email.html).toContain('name="color-scheme" content="light"');
	});
});
