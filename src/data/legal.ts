import { CONTACT, SOCIAL } from "@/constants";

/** Fecha de la última actualización de los textos legales. */
export const LEGAL_UPDATED = "15 de septiembre de 2026";

/**
 * Datos del titular para las páginas legales.
 * No se publica el DNI ni otros documentos de identidad.
 */
export const LEGAL_ENTITY = {
	titular: "Reyser Julio Zapata Butrón",
	nombreComercial: "RenovaBit",
	ruc: "10730954943",
	domicilio: "Av. Goyeneche 1602, Miraflores, Arequipa, 04004",
	correo: CONTACT.email,
	telefono: CONTACT.phone,
	whatsappUrl: CONTACT.whatsappUrl,
	facebook: SOCIAL.facebook,
	instagram: SOCIAL.instagram,
} as const;
