/**
 * Plantillas de correo de reseñas (notificación interna y agradecimiento).
 *
 * Reutilizan el layout de `src/lib/email/layout.ts` para conservar el mismo
 * diseño que los correos de contacto. Todo valor interpolado se escapa.
 */

import { SITE } from "@/constants";
import { getServicioById, RESENA_SERVICIO_OTRO } from "@/data/resenas-servicios";
import {
	EMAIL_BRAND as BRAND,
	escapeHtml,
	type RenderedEmail,
	renderButton,
	renderEmailShell,
	renderMessageBox,
	renderStackedRows,
	truncateForSubject,
} from "@/lib/email/layout";
import type { ResenaData } from "@/lib/resenas/schema";

/** Panel interno para revisar y publicar reseñas. */
export const RESENA_PANEL_URL = `${SITE.url}/admin/resenas/`;

/** Monto del descuento que se registra en la reseña y se comunica en los correos. */
export const RESENA_DESCUENTO = "S/5";

function servicioLabel(data: ResenaData): string {
	const option = getServicioById(data.servicio_id);
	if (data.servicio_id === RESENA_SERVICIO_OTRO.id) {
		return data.servicio_detalle || option?.label || "Otro";
	}
	return option?.label ?? data.servicio_id;
}

function contactoLabel(data: ResenaData): string {
	if (!data.contacto) return "No indicado";
	return data.contacto_tipo === "email"
		? `${data.contacto} (correo)`
		: `${data.contacto} (WhatsApp)`;
}

/** Estrellas visuales para clientes de correo (texto, sin imágenes externas). */
export function renderStars(estrellas: number): string {
	const filled = "★".repeat(Math.max(0, Math.min(5, estrellas)));
	const empty = "☆".repeat(Math.max(0, 5 - estrellas));
	const style = "font-size:22px;letter-spacing:3px;line-height:1;";
	return `<span style="color:#f5a623;${style}">${filled}</span><span style="color:#d1d5db;${style}">${empty}</span>`;
}

export function renderResenaNotificationEmail(data: ResenaData): RenderedEmail {
	const subject = `Nueva reseña de ${truncateForSubject(data.nombre)}: ${data.estrellas}★`;
	const rows = [
		{ label: "Nombre", value: data.nombre },
		{ label: "Empresa", value: data.empresa || "No indicada" },
		{ label: "Servicio", value: servicioLabel(data) },
		{ label: "Contacto", value: contactoLabel(data) },
		{ label: "Calificación", value: `${data.estrellas} de 5` },
	];

	const descuento = `<div style="margin:22px 0 0;background-color:#eef8ef;border-left:3px solid #1f9d55;border-radius:6px;padding:14px 16px;font-size:14px;line-height:1.6;color:${BRAND.text};"><strong>Descuento de ${RESENA_DESCUENTO} otorgado.</strong> El cliente debe mostrar la pantalla de confirmación (o este correo) en el servicio que recibió.</div>`;
	const fotoNota = data.foto
		? `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">La reseña incluye una foto; revisa su clave en el panel antes de publicarla.</p>`
		: "";

	const html = renderEmailShell(
		subject,
		`<p style="margin:0 0 8px;">Recibiste una nueva reseña desde el formulario de ${escapeHtml(SITE.name)}.</p>
${renderStars(data.estrellas)}
${renderStackedRows(rows)}
${renderMessageBox("Comentario", data.comentario)}
${descuento}
${fotoNota}
${renderButton(RESENA_PANEL_URL, "Abrir el panel de reseñas")}`,
		`<p style="margin:8px 0 0;">Publicación pendiente de revisión.</p>`,
	);

	const text = [
		`Nueva reseña de ${data.nombre}`,
		"",
		...rows.map((row) => `${row.label}: ${row.value}`),
		"",
		"Comentario:",
		data.comentario,
		"",
		`Descuento de ${RESENA_DESCUENTO} otorgado. El cliente debe mostrar la pantalla de confirmación (o este correo).`,
		...(data.foto ? ["La reseña incluye una foto (revisar antes de publicar)."] : []),
		"",
		`Abrir el panel de reseñas: ${RESENA_PANEL_URL}`,
	].join("\n");

	return { subject, html, text };
}

export function renderResenaThankYouEmail(data: ResenaData): RenderedEmail {
	const nombre = data.nombre.split(" ")[0] || data.nombre;
	const subject = `¡Gracias, ${truncateForSubject(data.nombre)}!`;

	const descuentoBox = `<div style="margin:24px 0 0;background-color:#f0ecff;border-radius:12px;padding:20px;text-align:center;">
<p style="margin:0;font-size:11px;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.primary};font-weight:bold;">Tu descuento</p>
<p style="margin:6px 0 0;font-size:30px;line-height:1.2;font-weight:bold;color:${BRAND.text};">${RESENA_DESCUENTO}</p>
<p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:${BRAND.text};">Hoy aplicamos tu descuento de ${RESENA_DESCUENTO} en el servicio que recibiste.</p>
<p style="margin:6px 0 0;font-size:13px;line-height:1.5;color:${BRAND.muted};">Muéstrale este correo a Reyser para aplicarlo.</p>
</div>`;

	const html = renderEmailShell(
		subject,
		`<p style="margin:0 0 6px;font-size:20px;line-height:1.3;font-weight:bold;color:${BRAND.text};">¡Gracias, ${escapeHtml(nombre)}!</p>
<p style="margin:0 0 4px;">Recibimos tu reseña y nos alegra que hayas confiado en nosotros.</p>
${renderStars(data.estrellas)}
${renderMessageBox("Tu reseña", data.comentario)}
${descuentoBox}
<p style="margin:24px 0 0;">Gracias por confiar en ${escapeHtml(SITE.name)}. Seguiremos cuidando tus equipos como si fueran nuestros.</p>
<p style="margin:18px 0 0;">Equipo ${escapeHtml(SITE.name)}</p>`,
	);

	const text = [
		`¡Gracias, ${nombre}!`,
		"",
		"Recibimos tu reseña y nos alegra que hayas confiado en nosotros.",
		"",
		"Tu reseña:",
		data.comentario,
		"",
		`Hoy aplicamos tu descuento de ${RESENA_DESCUENTO} en el servicio que recibiste.`,
		"Muéstrale este correo a Reyser para aplicarlo.",
		"",
		`Gracias por confiar en ${SITE.name}. Seguiremos cuidando tus equipos como si fueran nuestros.`,
		"",
		`Equipo ${SITE.name}`,
	].join("\n");

	return { subject, html, text };
}
