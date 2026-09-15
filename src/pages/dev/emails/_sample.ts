import type { NotificationData } from "@/lib/contact/templates";

/** Datos de ejemplo para la vista previa temporal de correos. */
export const sampleContact: NotificationData = {
	nombre: "María Fernanda Quispe",
	whatsapp: "+51 987 654 321",
	email: "maria.quispe@ejemplo.com",
	tipo: "mantenimiento",
	mensaje:
		"Tengo una laptop Lenovo IdeaPad que se apaga sola después de unos minutos.\nYa le hice limpieza y sigue igual.\n¿Atienden a domicilio en Miraflores?",
	preferencia: "whatsapp",
	consent: true,
	origen: "/laptop-lenta-arequipa/",
};
