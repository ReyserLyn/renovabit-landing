/**
 * Fuente única de copy y opciones del formulario de reseñas.
 *
 * Lo consumen la isla `ReviewForm`, el endpoint `/api/resenas` (plantillas de
 * correo) y la página `/resena/`. Los `value` de `estrellas` se validan en
 * `src/lib/resenas/schema.ts`.
 */

export const RESENA_ESTRELLAS_OPTIONS = [
	{ value: 1, label: "Muy malo" },
	{ value: 2, label: "Malo" },
	{ value: 3, label: "Regular" },
	{ value: 4, label: "Bueno" },
	{ value: 5, label: "Excelente" },
] as const satisfies readonly { value: number; label: string }[];

export const resenaFormCopy = {
	heading: "Cuéntanos tu experiencia",
	subheading:
		"Tu opinión nos ayuda a mejorar y toma menos de un minuto. Al enviarla, te damos un descuento de S/5 en el servicio que recibiste.",
	fields: {
		nombre: {
			label: "Nombre",
		},
		empresa: {
			label: "Empresa o negocio (opcional)",
			hint: "Si te atendimos como empresa, cuéntanos el nombre.",
		},
		servicio: {
			label: "¿Qué servicio recibiste?",
			placeholder: "Selecciona una opción",
		},
		servicioDetalle: {
			label: "Cuéntanos qué servicio recibiste",
			placeholder: "Ejemplo: cambio de pantalla",
		},
		estrellas: {
			label: "¿Cómo calificas tu experiencia?",
			hint: "Toca las estrellas para calificar: 1 es muy malo y 5 es excelente.",
		},
		comentario: {
			label: "Tu comentario",
			placeholder: "Cuéntanos cómo fue el servicio, qué se hizo y cómo quedó tu equipo.",
		},
		contacto: {
			label: "Correo o WhatsApp (opcional)",
			hint: "Si lo dejas, te enviamos el agradecimiento y coordinamos tu descuento.",
		},
		foto: {
			label: "Foto del equipo (opcional)",
			hint: "JPG, PNG o WebP de hasta 5 MB. La optimizamos antes de enviarla.",
			selectLabel: "Elegir foto",
			changeLabel: "Cambiar foto",
			removeLabel: "Quitar foto",
			previewAlt: "Vista previa de la foto del equipo",
			tooLarge: "La foto no debe superar los 15 MB.",
			processing: "Preparamos tu foto...",
			unreadable: "No pudimos procesar esta imagen. Prueba con una foto JPG, PNG o WebP.",
		},
		consent: {
			label: "Acepto que RenovaBit publique mi reseña en su sitio web conforme a la",
			link: { href: "/privacidad/", label: "Política de Privacidad" },
		},
	},
	welcome:
		"Gracias por confiar en RenovaBit. Tu opinión nos ayuda a mejorar y toma menos de un minuto.",
	requiredHint: "Obligatorio",
	submit: "Enviar reseña",
	sending: "Enviando...",
	successTitle: (nombre: string): string => `¡Gracias, ${nombre}!`,
	successMessage:
		"Muéstrale esta pantalla a Reyser para aplicar tu descuento de S/5 en este servicio.",
	successNote:
		"Publicaremos tu reseña en el sitio después de revisarla. Tu opinión nos ayuda a seguir mejorando.",
	turnstileExpired:
		"La verificación de seguridad expiró. Vuelve a completarla para enviar tu reseña.",
	turnstileTimeout:
		"La verificación de seguridad tardó demasiado. Vuelve a intentarlo en unos segundos.",
	turnstileUnavailable:
		"El formulario no está disponible en este momento. Escríbenos por WhatsApp y registramos tu reseña igual.",
	whatsappCta: "Escríbenos por WhatsApp",
	noscript:
		"Para dejar tu reseña, activa JavaScript. También puedes escribirnos por WhatsApp o llamarnos al +51 955 315 646.",
} as const;
