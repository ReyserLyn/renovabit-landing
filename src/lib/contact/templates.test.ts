import { describe, expect, it } from "bun:test";
import type { ContactData } from "@/lib/contact/schema";
import { escapeHtml, renderAutoReplyEmail, renderNotificationEmail } from "@/lib/contact/templates";

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
});
