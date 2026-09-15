/**
 * Plantillas de correo en HTML y texto plano (sin React Email).
 *
 * Todo valor interpolado pasa por `escapeHtml` o `escapeMultiline`: el
 * contenido lo escribe la persona que envía el formulario. El diseño usa
 * tablas, estilos inline y max-width 600px para ser compatible con clientes de
 * correo (sin <style> externo ni webfonts).
 */

import { CONTACT, FOOTER, SITE, whatsappUrl } from "@/constants";
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

const BRAND = {
	primary: SITE.themeColor,
	text: "#1a1a36",
	muted: "#6b7280",
	page: "#f5f4fb",
	box: "#f8f8fc",
	separator: "#ececf5",
} as const;

const FONT_STACK = "Arial,Helvetica,sans-serif";
const SITE_HOST = SITE.url.replace(/^https?:\/\//, "");
/**
 * Logo horizontal del brand kit (arte oscuro, para fondos claros). Va sobre una
 * placa blanca dentro del header púrpura: directamente sobre `#654fcc` el arte
 * pierde contraste. El PNG público está recortado (1808x258) y el display
 * mantiene esa proporción.
 */
const LOGO_URL = `${SITE.url}/email/logo-horizontal-light.png`;
const LOGO_WIDTH = 160;
const LOGO_HEIGHT = 23;
const WHATSAPP_GREETING = "Hola, envié una consulta por el formulario.";
const SCHEDULE = "lunes a viernes, de 8:00 a.m. a 8:00 p.m.";

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

/**
 * Normaliza un número de WhatsApp a un enlace `wa.me`.
 * Sin código de país (9 dígitos) asume Perú (51); devuelve `null` si no alcanza
 * un largo plausible.
 */
export function toWhatsAppLink(raw: string): string | null {
	const digits = raw.replace(/\D/g, "");
	if (digits.length === 9) return `https://wa.me/51${digits}`;
	if (digits.length >= 10 && digits.length <= 15) return `https://wa.me/${digits}`;
	return null;
}

function mailtoHref(email: string, nombre: string): string {
	const subject = `Re: Nueva consulta de ${truncateForSubject(nombre, 40)}`;
	return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}`;
}

function renderFooterLine(): string {
	const address = `${FOOTER.address.line1}, ${FOOTER.address.city}, ${FOOTER.address.district}`;
	return `${escapeHtml(SITE.name)} · ${escapeHtml(address)} · WhatsApp ${escapeHtml(
		CONTACT.phone,
	)} · ${escapeHtml(FOOTER.hours)}`;
}

function renderShell(title: string, bodyHtml: string, footerExtraHtml = ""): string {
	return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.page};font-family:${FONT_STACK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${BRAND.page};padding:24px 12px;">
<tr>
<td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;font-family:${FONT_STACK};">
<tr>
<td align="center" style="background-color:${BRAND.primary};padding:22px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
<tr>
<td align="center" style="background-color:#ffffff;border-radius:10px;padding:10px 16px;">
<img src="${LOGO_URL}" alt="${escapeHtml(SITE.name)}" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" style="display:block;width:${LOGO_WIDTH}px;height:${LOGO_HEIGHT}px;border:0;" />
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:28px;color:${BRAND.text};font-size:15px;line-height:1.6;">
${bodyHtml}
</td>
</tr>
<tr>
<td style="padding:16px 28px;background-color:${BRAND.page};color:${BRAND.muted};font-size:12px;line-height:1.6;">
<p style="margin:0;">${renderFooterLine()}</p>
${footerExtraHtml}
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function renderStackedRows(rows: ReadonlyArray<{ label: string; value: string }>): string {
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
${rows
	.map((row, index) => {
		const border = index < rows.length - 1 ? `border-bottom:1px solid ${BRAND.separator};` : "";
		return `<tr>
<td style="padding:12px 0;${border}">
<div style="font-size:11px;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};font-weight:bold;">${escapeHtml(row.label)}</div>
<div style="font-size:15px;font-weight:bold;line-height:1.5;color:${BRAND.text};padding-top:2px;">${escapeMultiline(row.value)}</div>
</td>
</tr>`;
	})
	.join("\n")}
</table>`;
}

function renderMessageBox(label: string, message: string): string {
	return `<div style="margin:22px 0 0;font-size:11px;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};font-weight:bold;">${escapeHtml(label)}</div>
<div style="margin-top:8px;background-color:${BRAND.box};border-left:3px solid ${BRAND.primary};border-radius:6px;padding:14px 16px;font-size:15px;line-height:1.6;color:${BRAND.text};white-space:pre-wrap;">${escapeMultiline(message)}</div>`;
}

function renderButton(href: string, label: string): string {
	return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;">
<tr>
<td align="center" style="background-color:${BRAND.primary};border-radius:8px;">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-family:${FONT_STACK};font-size:15px;font-weight:bold;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
</td>
</tr>
</table>`;
}

export function renderNotificationEmail(data: NotificationData): RenderedEmail {
	const subject = `Nueva consulta: ${truncateForSubject(data.nombre)} (${tipoLabel(data.tipo)})`;
	const origen = data.origen?.trim() || "/contacto/";

	const rows = [
		{ label: "Nombre", value: data.nombre },
		{ label: "WhatsApp", value: data.whatsapp },
		{ label: "Correo", value: data.email || "No indicado" },
		{ label: "Necesidad", value: tipoLabel(data.tipo) },
		{ label: "Preferencia", value: preferenciaLabel(data.preferencia) },
	];

	const whatsappHref = toWhatsAppLink(data.whatsapp);
	const whatsappCta = whatsappHref ? renderButton(whatsappHref, "Responder por WhatsApp") : "";
	const emailCta = data.email
		? `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">También puedes <a href="${mailtoHref(data.email, data.nombre)}" style="color:${BRAND.primary};text-decoration:underline;">Responder por correo</a>.</p>`
		: "";

	const html = renderShell(
		subject,
		`<p style="margin:0 0 18px;">Recibiste una nueva consulta desde el formulario de ${escapeHtml(SITE_HOST)}.</p>
${renderStackedRows(rows)}
${renderMessageBox("Mensaje", data.mensaje)}
${whatsappCta}
${emailCta}`,
		`<p style="margin:8px 0 0;">Origen: ${escapeHtml(origen)}</p>`,
	);

	const text = [
		`Nueva consulta desde el formulario de ${SITE_HOST}`,
		"",
		...rows.map((row) => `${row.label}: ${row.value}`),
		`Origen: ${origen}`,
		"",
		"Mensaje:",
		data.mensaje,
		"",
		...(whatsappHref ? [`Responder por WhatsApp: ${whatsappHref}`] : []),
		...(data.email ? [`Responder por correo: ${data.email}`] : []),
	].join("\n");

	return { subject, html, text };
}

export function renderAutoReplyEmail(data: ContactData): RenderedEmail {
	const nombre = data.nombre.split(" ")[0] || data.nombre;
	const subject = `Recibimos tu mensaje, ${truncateForSubject(data.nombre)}`;

	const html = renderShell(
		subject,
		`<p style="margin:0 0 16px;">Hola ${escapeHtml(nombre)},</p>
<p style="margin:0 0 16px;">Gracias por escribir a ${escapeHtml(SITE.name)}. Recibimos tu consulta y te responderemos en horario de atención (${SCHEDULE}).</p>
${renderMessageBox("Tu mensaje", data.mensaje)}
${renderButton(whatsappUrl(WHATSAPP_GREETING), "Escribirnos por WhatsApp")}
<p style="margin:22px 0 0;">Equipo ${escapeHtml(SITE.name)}</p>`,
	);

	const text = [
		`Hola ${nombre},`,
		"",
		`Gracias por escribir a ${SITE.name}. Recibimos tu consulta y te responderemos en horario de atención (${SCHEDULE}).`,
		"",
		"Tu mensaje:",
		data.mensaje,
		"",
		`Escribirnos por WhatsApp: ${whatsappUrl(WHATSAPP_GREETING)}`,
		"",
		`Equipo ${SITE.name}`,
	].join("\n");

	return { subject, html, text };
}
