/**
 * Plantillas de correo de contacto en HTML y texto plano (sin React Email).
 *
 * El layout compartido (shell, filas, cajas, botones y escapado) vive en
 * `src/lib/email/layout.ts`. Todo valor interpolado pasa por `escapeHtml` o
 * `escapeMultiline`: el contenido lo escribe la persona que envía el formulario.
 */

import { SITE, whatsappUrl } from "@/constants";
import { CONTACT_PREFERENCIA_OPTIONS, CONTACT_TIPO_OPTIONS } from "@/data/contact-form";
import type { ContactData } from "@/lib/contact/schema";
import {
	EMAIL_BRAND as BRAND,
	escapeHtml,
	type RenderedEmail,
	renderButton,
	renderMessageBox,
	renderEmailShell as renderShell,
	renderStackedRows,
	EMAIL_SITE_HOST as SITE_HOST,
	truncateForSubject,
} from "@/lib/email/layout";

export { escapeHtml } from "@/lib/email/layout";
export type { RenderedEmail };

export interface NotificationData extends ContactData {
	origen?: string;
}

const WHATSAPP_GREETING = "Hola, envié una consulta por el formulario.";
const SCHEDULE = "lunes a viernes, de 8:00 a.m. a 8:00 p.m.";

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
