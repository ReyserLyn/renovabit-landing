/**
 * Plantillas de correo en HTML y texto plano (sin React Email).
 *
 * Todo valor interpolado pasa por `escapeHtml` o `escapeMultiline`: el
 * contenido lo escribe la persona que envía el formulario. El diseño usa
 * tablas para ser compatible con clientes de correo.
 */

import { CONTACT, FOOTER, SITE } from "@/constants";
import { CONTACT_PREFERENCIA_OPTIONS, CONTACT_TIPO_OPTIONS } from "@/data/contact-form";
import type { ContactData } from "@/lib/contact/schema";

export interface RenderedEmail {
	subject: string;
	html: string;
	text: string;
}

export interface NotificationData extends ContactData {
	origen?: string;
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function escapeMultiline(value: string): string {
	return escapeHtml(value).replaceAll("\n", "<br>");
}

function truncateForSubject(value: string, maxLength = 60): string {
	const normalized = value.replace(/\s+/g, " ").trim();
	if (normalized.length <= maxLength) return normalized;
	return `${normalized.slice(0, maxLength - 3)}...`;
}

export function tipoLabel(value: string): string {
	return CONTACT_TIPO_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function preferenciaLabel(value: string): string {
	return CONTACT_PREFERENCIA_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function renderShell(heading: string, bodyHtml: string): string {
	const address = `${FOOTER.address.line1}, ${FOOTER.address.city}, ${FOOTER.address.district}`;
	return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f4fb;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4fb;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
<tr><td style="background-color:${SITE.themeColor};padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold;">${escapeHtml(SITE.name)}</td></tr>
<tr><td style="padding:28px;color:#1a1a36;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
<tr><td style="padding:16px 28px;background-color:#f5f4fb;color:#6b7280;font-size:12px;line-height:1.5;">
${escapeHtml(SITE.name)} · ${escapeHtml(address)} · WhatsApp ${escapeHtml(CONTACT.phone)}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function renderRows(rows: ReadonlyArray<{ label: string; value: string }>): string {
	return rows
		.map(
			(row) =>
				`<p style="margin:0 0 8px;"><strong>${escapeHtml(row.label)}:</strong> ${escapeMultiline(row.value)}</p>`,
		)
		.join("");
}

export function renderNotificationEmail(data: NotificationData): RenderedEmail {
	const subject = `Nueva consulta: ${truncateForSubject(data.nombre)} (${tipoLabel(data.tipo)})`;
	const origen = data.origen?.trim() || "/contacto/";

	const rows = [
		{ label: "Nombre", value: data.nombre },
		{ label: "WhatsApp", value: data.whatsapp },
		{ label: "Correo", value: data.email || "No indicado" },
		{ label: "Necesidad", value: tipoLabel(data.tipo) },
		{ label: "Preferencia de respuesta", value: preferenciaLabel(data.preferencia) },
		{ label: "Origen", value: origen },
	];

	const html = renderShell(
		subject,
		`<p style="margin:0 0 16px;">Recibiste una nueva consulta desde el formulario de ${escapeHtml(SITE.url)}.</p>
${renderRows(rows)}
<p style="margin:16px 0 8px;"><strong>Mensaje:</strong></p>
<p style="margin:0;white-space:pre-wrap;">${escapeMultiline(data.mensaje)}</p>`,
	);

	const text = [
		`Nueva consulta desde el formulario de ${SITE.url}`,
		"",
		...rows.map((row) => `${row.label}: ${row.value}`),
		"",
		"Mensaje:",
		data.mensaje,
	].join("\n");

	return { subject, html, text };
}

export function renderAutoReplyEmail(data: ContactData): RenderedEmail {
	const nombre = data.nombre.split(" ")[0] || data.nombre;
	const subject = `Recibimos tu mensaje, ${truncateForSubject(data.nombre)}`;

	const html = renderShell(
		subject,
		`<p style="margin:0 0 16px;">Hola ${escapeHtml(nombre)},</p>
<p style="margin:0 0 16px;">Gracias por escribir a ${escapeHtml(SITE.name)}. Recibimos tu consulta y te responderemos en horario de atención (lunes a viernes, de 8:00 a.m. a 8:00 p.m.).</p>
<p style="margin:16px 0 8px;"><strong>Resumen de tu mensaje:</strong></p>
<p style="margin:0 0 16px;white-space:pre-wrap;">${escapeMultiline(data.mensaje)}</p>
<p style="margin:0;">Si necesitas una respuesta inmediata, escríbenos por WhatsApp al ${escapeHtml(CONTACT.phone)}.</p>`,
	);

	const text = [
		`Hola ${nombre},`,
		"",
		`Gracias por escribir a ${SITE.name}. Recibimos tu consulta y te responderemos en horario de atención (lunes a viernes, de 8:00 a.m. a 8:00 p.m.).`,
		"",
		"Resumen de tu mensaje:",
		data.mensaje,
		"",
		`Si necesitas una respuesta inmediata, escríbenos por WhatsApp al ${CONTACT.phone}.`,
	].join("\n");

	return { subject, html, text };
}
