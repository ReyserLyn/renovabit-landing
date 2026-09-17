/**
 * Fuente única de copy y opciones del formulario de contacto.
 *
 * Lo consumen la isla `ContactForm`, el endpoint `/api/contact` (etiquetas de
 * los correos) y la página `/contacto/`. Los `value` de `tipo` y `preferencia`
 * se validan en `src/lib/contact/schema.ts`.
 */

export const CONTACT_TIPO_VALUES = [
	"domicilio",
	"mantenimiento",
	"reparacion",
	"empresas",
	"web",
	"tienda",
	"otro",
] as const;

export type ContactTipo = (typeof CONTACT_TIPO_VALUES)[number];

export const CONTACT_TIPO_OPTIONS = [
	{ value: "domicilio", label: "Reparación a domicilio" },
	{ value: "mantenimiento", label: "Mantenimiento preventivo" },
	{ value: "reparacion", label: "Reparación en taller" },
	{ value: "empresas", label: "Soporte para empresas" },
	{ value: "web", label: "Desarrollo web" },
	{ value: "tienda", label: "Compra de componentes" },
	{ value: "otro", label: "Otro" },
] as const satisfies ReadonlyArray<{ value: ContactTipo; label: string }>;

export const CONTACT_PREFERENCIA_VALUES = ["whatsapp", "llamada", "correo"] as const;

export type ContactPreferencia = (typeof CONTACT_PREFERENCIA_VALUES)[number];

export const CONTACT_PREFERENCIA_OPTIONS = [
	{ value: "whatsapp", label: "WhatsApp" },
	{ value: "llamada", label: "Llamada telefónica" },
	{ value: "correo", label: "Correo electrónico" },
] as const satisfies ReadonlyArray<{ value: ContactPreferencia; label: string }>;

export const contactFormCopy = {
	heading: "Escríbenos",
	subheading:
		"Cuéntanos qué necesitas y te responderemos en horario de atención. Si prefieres una respuesta inmediata, también puedes escribirnos por WhatsApp.",
	fields: {
		nombre: {
			label: "Nombre",
		},
		whatsapp: {
			label: "WhatsApp",
			hint: "Solo lo usaremos para responder esta consulta.",
		},
		email: {
			label: "Correo electrónico (opcional)",
			hint: "Si lo indicas, te enviaremos una copia de tu mensaje.",
		},
		tipo: {
			label: "¿Qué necesitas?",
			placeholder: "Selecciona una opción",
		},
		mensaje: {
			label: "Mensaje",
		},
		preferencia: {
			label: "¿Cómo prefieres que te respondamos?",
		},
		consent: {
			label: "Acepto que RenovaBit use mis datos para responder esta consulta, conforme a la",
			link: { href: "/privacidad/", label: "Política de Privacidad" },
		},
	},
	requiredHint: "Obligatorio",
	submit: "Enviar mensaje",
	sending: "Enviando...",
	successTitle: "Gracias por escribirnos",
	successMessage:
		"Gracias, recibimos tu mensaje. Te responderemos en horario de atención (lunes a viernes, de 8:00 a.m. a 8:00 p.m.). Sábados: previa coordinación.",
	whatsappCta: "Escríbenos por WhatsApp",
	turnstileExpired:
		"La verificación de seguridad expiró. Vuelve a completarla para enviar el formulario.",
	turnstileTimeout:
		"La verificación de seguridad tardó demasiado. Vuelve a intentarlo en unos segundos.",
	turnstileUnavailable:
		"El formulario no está disponible en este momento. Escríbenos por WhatsApp o llámanos y te atendemos igual.",
	noscript:
		"Para usar el formulario, activa JavaScript. También puedes escribirnos por WhatsApp o llamarnos al +51 955 315 646.",
} as const;
