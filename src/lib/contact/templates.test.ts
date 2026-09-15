import { describe, expect, it } from "bun:test";
import type { ContactData } from "@/lib/contact/schema";
import {
	escapeHtml,
	renderAutoReplyEmail,
	renderNotificationEmail,
	toWhatsAppLink,
} from "@/lib/contact/templates";

const data: ContactData = {
	nombre: "Ana Pérez",
	whatsapp: "955 315 646",
	email: "ana@ejemplo.com",
	tipo: "mantenimiento",
	mensaje: "Mi laptop se apaga sola.",
	preferencia: "whatsapp",
	consent: true,
};

describe("escapeHtml", () => {
	it("escapa los caracteres peligrosos", () => {
		expect(escapeHtml('<script>alert("x&y")</script>')).toBe(
			"&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;",
		);
		expect(escapeHtml("'")).toBe("&#39;");
	});
});

describe("renderNotificationEmail", () => {
	it("incluye todos los campos y el origen", () => {
		const email = renderNotificationEmail({ ...data, origen: "/contacto/?estado=enviado" });

		expect(email.subject).toContain("Ana Pérez");
		expect(email.subject).toContain("Mantenimiento preventivo");
		for (const value of [
			"Ana Pérez",
			"955 315 646",
			"ana@ejemplo.com",
			"Mantenimiento preventivo",
			"WhatsApp",
			"Mi laptop se apaga sola.",
			"/contacto/?estado=enviado",
		]) {
			expect(email.html).toContain(value);
			expect(email.text).toContain(value);
		}
	});

	it("escapa el contenido escrito por la persona", () => {
		const email = renderNotificationEmail({
			...data,
			nombre: "<script>alert(1)</script>",
			mensaje: "<img src=x onerror=alert(1)>",
			origen: "<b>/contacto/</b>",
		});

		expect(email.html).not.toContain("<script>");
		expect(email.html).not.toContain("<img src=x");
		expect(email.html).not.toContain("<b>/contacto/</b>");
		expect(email.html).toContain("&lt;script&gt;");
		expect(email.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
		expect(email.text).toContain("<script>alert(1)</script>");
	});

	it("marca el correo vacío como no indicado", () => {
		const email = renderNotificationEmail({ ...data, email: "" });
		expect(email.html).toContain("No indicado");
		expect(email.text).toContain("No indicado");
	});

	it("normaliza los saltos de línea del asunto", () => {
		const email = renderNotificationEmail({ ...data, nombre: "Ana\nBcc: atacante" });
		expect(email.subject).not.toContain("\n");
		expect(email.subject).toContain("Ana Bcc: atacante");
	});

	it("acorta los nombres largos en el asunto", () => {
		const email = renderNotificationEmail({ ...data, nombre: "n".repeat(200) });
		expect(email.subject.length).toBeLessThan(120);
		expect(email.subject).toContain("...");
	});
});

describe("toWhatsAppLink", () => {
	it("agrega el código de Perú a los números de 9 dígitos", () => {
		expect(toWhatsAppLink("955315646")).toBe("https://wa.me/51955315646");
		expect(toWhatsAppLink("987 654 321")).toBe("https://wa.me/51987654321");
		expect(toWhatsAppLink("987-654-321")).toBe("https://wa.me/51987654321");
	});

	it("respeta los números que ya incluyen el código de país", () => {
		expect(toWhatsAppLink("+51 987 654 321")).toBe("https://wa.me/51987654321");
		expect(toWhatsAppLink("51 987654321")).toBe("https://wa.me/51987654321");
	});

	it("devuelve null cuando el número no es plausible", () => {
		expect(toWhatsAppLink("")).toBeNull();
		expect(toWhatsAppLink("12345")).toBeNull();
		expect(toWhatsAppLink("sin números")).toBeNull();
		expect(toWhatsAppLink("1".repeat(16))).toBeNull();
	});
});

describe("CTA del correo de notificación", () => {
	it("incluye el enlace de correo solo cuando hay email", () => {
		const withEmail = renderNotificationEmail({ ...data, email: "ana@ejemplo.com" });
		expect(withEmail.html).toContain("Responder por correo");

		const withoutEmail = renderNotificationEmail({ ...data, email: "" });
		expect(withoutEmail.html).not.toContain("Responder por correo");
	});

	it("incluye el botón de WhatsApp cuando el número es válido y lo omite si no", () => {
		const valid = renderNotificationEmail(data);
		expect(valid.html).toContain("Responder por WhatsApp");
		expect(valid.html).toContain("https://wa.me/51955315646");

		const invalid = renderNotificationEmail({ ...data, whatsapp: "123" });
		expect(invalid.html).not.toContain("Responder por WhatsApp");
	});
});

describe("estructura del correo", () => {
	it("usa el logo absoluto, el ancho máximo y el color-scheme claro", () => {
		const email = renderNotificationEmail(data);
		expect(email.html).toContain("https://renovabit.com/email/logo-horizontal-light.png");
		expect(email.html).toContain("max-width:600px");
		expect(email.html).toContain('name="color-scheme" content="light"');
	});
});

describe("renderAutoReplyEmail", () => {
	it("incluye el nombre, el resumen y el horario", () => {
		const email = renderAutoReplyEmail(data);
		expect(email.subject).toContain("Ana Pérez");
		expect(email.html).toContain("Hola Ana,");
		expect(email.html).toContain("Mi laptop se apaga sola.");
		expect(email.html).toContain("lunes a viernes, de 8:00 a.m. a 8:00 p.m.");
		expect(email.text).toContain("Hola Ana,");
		expect(email.text).toContain("Mi laptop se apaga sola.");
	});

	it("escapa el contenido escrito por la persona", () => {
		const email = renderAutoReplyEmail({ ...data, nombre: "<b>Ana</b>", mensaje: "<i>hola</i>" });
		expect(email.html).not.toContain("<b>Ana</b>");
		expect(email.html).not.toContain("<i>hola</i>");
		expect(email.html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
	});

	it("incluye el CTA de WhatsApp del sitio", () => {
		const email = renderAutoReplyEmail(data);
		expect(email.html).toContain("Escribirnos por WhatsApp");
		expect(email.html).toContain(
			"https://wa.me/51955315646?text=Hola%2C%20envi%C3%A9%20una%20consulta%20por%20el%20formulario.",
		);
	});
});
