import type { ImageMetadata } from "astro";
import testimonial11 from "@/assets/images/testimonials/testimonial-1-1.avif";
import testimonial12 from "@/assets/images/testimonials/testimonial-1-2.avif";
import testimonial2 from "@/assets/images/testimonials/testimonial-2.avif";

export interface Testimonio {
	id: string;
	autor: string;
	rol?: string;
	fecha: string;
	texto: string;
	rating: number;
	servicio?: string;
	visual?: {
		imagenes?: {
			antes?: ImageMetadata;
			despues?: ImageMetadata;
			principal?: ImageMetadata;
		};
		badges: string[];
		destacado?: boolean;
	};
}

export const testimonios: Testimonio[] = [
	{
		id: "carlos-mantenimiento-empresarial",
		autor: "Carlos M.",
		rol: "Encargado de seguridad, empresa de distribución en Arequipa",
		fecha: "2025-11-15",
		texto:
			"Confiamos en RenovaBit para el mantenimiento de nuestras estaciones de trabajo. El cambio fue radical: pasamos de tener equipos con polvo acumulado y cables desordenados a PCs impecables, bien ventiladas y con todo en su lugar. El informe detallado que entregaron nos sirvió para la auditoría interna. Sin duda los volveremos a llamar.",
		rating: 5,
		servicio: "servicio-tecnico",
		visual: {
			imagenes: { antes: testimonial11, despues: testimonial12 },
			badges: ["Gestión de cables", "Limpieza profunda", "Mantenimiento"],
			destacado: true,
		},
	},
	{
		id: "antonio-pc-autocad",
		autor: "Antonio V.",
		fecha: "2026-02-20",
		texto:
			"Necesitaba una PC para trabajo de oficina y AutoCAD, pero no sabía por dónde empezar. RenovaBit me asesoró en la selección de componentes, armó todo, hizo las pruebas y me entregó el equipo listo para usar. El presupuesto fue claro desde el inicio y el resultado superó lo que esperaba. Ahora trabajo sin problemas.",
		rating: 5,
		servicio: "tienda",
		visual: {
			imagenes: { principal: testimonial2 },
			badges: ["Ensamblaje a medida", "Componentes nuevos"],
		},
	},
];

export function getTestimoniosByServicio(serviceSlug?: string): Testimonio[] {
	if (!serviceSlug) return testimonios;
	return testimonios.filter((t) => t.servicio === serviceSlug);
}
