import type { NotificationData } from "@/lib/contact/templates";
import type { ResenaData } from "@/lib/resenas/schema";

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

/** Reseña de ejemplo para la vista previa de los correos de reseñas. */
export const sampleResena: ResenaData = {
	nombre: "María Fernanda Quispe",
	empresa: "Estudio Contable Quispe",
	servicio_id: "servicio-tecnico",
	servicio_detalle: "",
	estrellas: 5,
	comentario:
		"Dejé mi laptop porque se apagaba sola y en dos días me la devolvieron impecable.\nMe explicaron qué tenía y me mostraron fotos del antes y después.",
	contacto: "maria.quispe@ejemplo.com",
	contacto_tipo: "email",
	consentimiento: true,
};
