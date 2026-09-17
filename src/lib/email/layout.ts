/**
 * Layout compartido de los correos transaccionales.
 *
 * Todo valor interpolado pasa por `escapeHtml` o `escapeMultiline`: el
 * contenido suele escribirlo la persona que llena un formulario. El diseño usa
 * tablas, estilos inline y max-width 600px para ser compatible con clientes de
 * correo (sin <style> externo ni webfonts). Lo usan las plantillas de contacto
 * (`src/lib/contact/templates.ts`) y de reseñas (`src/lib/resenas/templates.ts`).
 */

import { CONTACT, FOOTER, SITE } from "@/constants";

export interface RenderedEmail {
	subject: string;
	html: string;
	text: string;
}

export const EMAIL_BRAND = {
	primary: SITE.themeColor,
	text: "#1a1a36",
	muted: "#6b7280",
	page: "#f5f4fb",
	box: "#f8f8fc",
	separator: "#ececf5",
} as const;

export const EMAIL_FONT_STACK = "Arial,Helvetica,sans-serif";
export const EMAIL_SITE_HOST = SITE.url.replace(/^https?:\/\//, "");
/**
 * Logo horizontal del brand kit (arte oscuro, para fondos claros). Va sobre una
 * placa blanca dentro del header púrpura: directamente sobre `#654fcc` el arte
 * pierde contraste. El PNG público está recortado (1808x258) y el display
 * mantiene esa proporción.
 */
export const EMAIL_LOGO_URL = `${SITE.url}/email/logo-horizontal-light.png`;
export const EMAIL_LOGO_WIDTH = 160;
export const EMAIL_LOGO_HEIGHT = 23;

export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function escapeMultiline(value: string): string {
	return escapeHtml(value).replaceAll("\n", "<br>");
}

export function truncateForSubject(value: string, maxLength = 60): string {
	const normalized = value.replace(/\s+/g, " ").trim();
	if (normalized.length <= maxLength) return normalized;
	return `${normalized.slice(0, maxLength - 3)}...`;
}

export function renderEmailFooterLine(): string {
	const address = `${FOOTER.address.line1}, ${FOOTER.address.city}, ${FOOTER.address.district}`;
	return `${escapeHtml(SITE.name)} · ${escapeHtml(address)} · WhatsApp ${escapeHtml(
		CONTACT.phone,
	)} · ${escapeHtml(FOOTER.hours)}`;
}

export function renderEmailShell(title: string, bodyHtml: string, footerExtraHtml = ""): string {
	return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BRAND.page};font-family:${EMAIL_FONT_STACK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${EMAIL_BRAND.page};padding:24px 12px;">
<tr>
<td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;font-family:${EMAIL_FONT_STACK};">
<tr>
<td align="center" style="background-color:${EMAIL_BRAND.primary};padding:22px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
<tr>
<td align="center" style="background-color:#ffffff;border-radius:10px;padding:10px 16px;">
<img src="${EMAIL_LOGO_URL}" alt="${escapeHtml(SITE.name)}" width="${EMAIL_LOGO_WIDTH}" height="${EMAIL_LOGO_HEIGHT}" style="display:block;width:${EMAIL_LOGO_WIDTH}px;height:${EMAIL_LOGO_HEIGHT}px;border:0;" />
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:28px;color:${EMAIL_BRAND.text};font-size:15px;line-height:1.6;">
${bodyHtml}
</td>
</tr>
<tr>
<td style="padding:16px 28px;background-color:${EMAIL_BRAND.page};color:${EMAIL_BRAND.muted};font-size:12px;line-height:1.6;">
<p style="margin:0;">${renderEmailFooterLine()}</p>
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

export function renderStackedRows(rows: ReadonlyArray<{ label: string; value: string }>): string {
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
${rows
	.map((row, index) => {
		const border =
			index < rows.length - 1 ? `border-bottom:1px solid ${EMAIL_BRAND.separator};` : "";
		return `<tr>
<td style="padding:12px 0;${border}">
<div style="font-size:11px;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.muted};font-weight:bold;">${escapeHtml(row.label)}</div>
<div style="font-size:15px;font-weight:bold;line-height:1.5;color:${EMAIL_BRAND.text};padding-top:2px;">${escapeMultiline(row.value)}</div>
</td>
</tr>`;
	})
	.join("\n")}
</table>`;
}

export function renderMessageBox(label: string, message: string): string {
	return `<div style="margin:22px 0 0;font-size:11px;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.muted};font-weight:bold;">${escapeHtml(label)}</div>
<div style="margin-top:8px;background-color:${EMAIL_BRAND.box};border-left:3px solid ${EMAIL_BRAND.primary};border-radius:6px;padding:14px 16px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.text};white-space:pre-wrap;">${escapeMultiline(message)}</div>`;
}

export function renderButton(href: string, label: string): string {
	return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;">
<tr>
<td align="center" style="background-color:${EMAIL_BRAND.primary};border-radius:8px;">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-family:${EMAIL_FONT_STACK};font-size:15px;font-weight:bold;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
</td>
</tr>
</table>`;
}
