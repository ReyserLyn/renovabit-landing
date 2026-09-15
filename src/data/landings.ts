import type { ImageMetadata } from "astro";
import processImg1 from "@/assets/images/process/process-1.avif";
import processImg2 from "@/assets/images/process/process-2.avif";
import processImg3 from "@/assets/images/process/process-3.avif";
import processImg5 from "@/assets/images/process/process-5.avif";
import servicioImg1 from "@/assets/images/services/service-1.avif";
import type { FaqItem } from "@/data/faq";
import { getFaqsForService } from "@/data/faq";
import type { ServicioTecnicoPriceRow } from "@/data/servicio-tecnico";
import { servicioTecnicoCommercial } from "@/data/servicio-tecnico";

/** Fila de precios taller/domicilio. Mismo contrato que la fuente comercial canónica. */
export type LandingPriceRow = ServicioTecnicoPriceRow;

export interface LandingSymptom {
	icon: string;
	text: string;
}

export interface LandingCause {
	title: string;
	description: string;
}

export interface LandingStep {
	title: string;
	description: string;
	image?: ImageMetadata;
	imageAlt?: string;
}

export interface LandingInternalLink {
	href: string;
	label: string;
}

export interface LandingData {
	slug: string;
	seoTitle: string;
	metaDescription: string;
	ogImage: string;
	eyebrow: string;
	h1: string;
	heroIntro: string;
	heroImage: ImageMetadata;
	heroImageAlt: string;
	heroBadge?: string;
	heroNote?: string;
	heroSecondary?: { href: string; label: string };
	floatingCard?: { eyebrow: string; title: string; description: string };
	ctaLabel: string;
	ctaFinalLabel?: string;
	umamiPrefix: string;
	/** Mensaje precargado de WhatsApp para los CTA de la landing. */
	whatsappMessage: string;
	readonly symptoms: readonly LandingSymptom[];
	readonly causes: readonly LandingCause[];
	readonly processSteps: readonly LandingStep[];
	readonly priceRows: readonly LandingPriceRow[];
	readonly includes: readonly string[];
	readonly excluded: readonly string[];
	readonly conditions: readonly string[];
	readonly faqs: readonly FaqItem[];
	readonly internalLinks: readonly LandingInternalLink[];
}

export const laptopLentaLanding = {
	slug: "laptop-lenta-arequipa",
	seoTitle: "Laptop Lenta en Arequipa | Diagnóstico y Solución RenovaBit",
	metaDescription:
		"¿Tu laptop o PC va lenta en Arequipa? Revisamos disco, RAM, temperatura y mantenimiento. Precio claro desde S/90 en taller.",
	ogImage: "/og-servicio-tecnico.jpeg",
	eyebrow: "Laptop o PC lenta · Arequipa",
	h1: "¿Tu laptop está lenta? Encontramos la causa y la solucionamos",
	heroIntro:
		"Revisamos el disco, la memoria, la temperatura y los programas de inicio para explicarte qué frena tu equipo. Tarifas claras, diagnóstico honesto y sin tocar lo que no hace falta.",
	heroImage: servicioImg1,
	heroImageAlt: "Revisión de una laptop lenta en el taller de RenovaBit en Arequipa",
	heroBadge: "Desde S/90 en taller",
	heroNote: "Atención en Arequipa. El servicio a domicilio suma S/30 y se coordina previamente.",
	heroSecondary: { href: "#precios", label: "Ver tarifas" },
	floatingCard: {
		eyebrow: "La revisión",
		title: "Diagnóstico honesto",
		description: "Te decimos si conviene mantenimiento, upgrade o formateo.",
	},
	ctaLabel: "Revisar mi laptop por WhatsApp",
	ctaFinalLabel: "Escríbenos por WhatsApp",
	umamiPrefix: "laptop-slow",
	whatsappMessage: "Hola, mi laptop está lenta y quiero una revisión.",
	symptoms: [
		{ icon: "hugeicons:timer-01", text: "Tarda varios minutos en iniciar" },
		{ icon: "hugeicons:grid", text: "Los programas abren muy lento" },
		{ icon: "hugeicons:hard-drive", text: "El disco está lleno o al 100%" },
		{ icon: "hugeicons:ram-memory", text: "Se traba con varias pestañas o programas abiertos" },
		{ icon: "hugeicons:fan-02", text: "El ventilador hace ruido o el equipo se calienta" },
		{ icon: "hugeicons:dashboard-speed-01", text: "Va más lenta que antes sin un cambio claro" },
	],
	causes: [
		{
			title: "Disco lleno o HDD de varios años",
			description:
				"Un disco mecánico viejo o con poco espacio libre frena el arranque y la apertura de programas. El cambio a SSD se cotiza aparte.",
		},
		{
			title: "Falta de memoria RAM",
			description:
				"Cuando la memoria se agota, el equipo usa el disco como apoyo y todo se siente más lento. Ampliar la RAM se cotiza aparte.",
		},
		{
			title: "Sobrecalentamiento",
			description:
				"El polvo y la pasta térmica seca hacen que el procesador reduzca su rendimiento para protegerse. Es una causa frecuente de lentitud.",
		},
		{
			title: "Demasiados programas al inicio",
			description:
				"Muchos programas se cargan solos al encender el equipo y consumen recursos en segundo plano sin que los uses.",
		},
		{
			title: "Malware o programas no deseados",
			description:
				"Algunos programas se instalan sin tu permiso y consumen recursos o muestran anuncios. Se revisan durante el diagnóstico.",
		},
	],
	processSteps: [
		{
			title: "Revisamos tu equipo",
			description:
				"Evaluamos el disco, la memoria, la temperatura y los programas que se abren al inicio para encontrar la causa.",
			image: processImg1,
			imageAlt:
				"Conversación de WhatsApp coordinando la revisión de una laptop lenta con RenovaBit en Arequipa",
		},
		{
			title: "Te explicamos qué encontramos",
			description:
				"Recibes el diagnóstico con las opciones: mantenimiento, upgrade o formateo, y el precio de cada una antes de decidir.",
			image: processImg2,
			imageAlt:
				"Informe técnico RenovaBit para el diagnóstico de una laptop lenta: observaciones y evidencia fotográfica del mantenimiento",
		},
		{
			title: "Aplicamos la solución",
			description:
				"Realizamos la limpieza, la optimización o el formateo acordado, sin intervenir lo que no hace falta.",
			image: processImg3,
			imageAlt:
				"Antes y después del mantenimiento RenovaBit en Arequipa: limpieza interna y optimización que devuelven velocidad a la laptop",
		},
		{
			title: "Probamos y entregamos",
			description:
				"Verificamos el arranque y el funcionamiento, y te contamos qué se hizo y cómo cuidar el equipo.",
			image: processImg5,
			imageAlt:
				"PC tras el mantenimiento RenovaBit en Arequipa: componentes internos y sistema de ventilación revisados antes de la entrega",
		},
	],
	priceRows: servicioTecnicoCommercial.prices,
	includes: servicioTecnicoCommercial.included,
	excluded: servicioTecnicoCommercial.excluded,
	conditions: servicioTecnicoCommercial.conditions,
	faqs: getFaqsForService("laptop-lenta-arequipa"),
	internalLinks: [
		{ href: "/servicios/servicio-tecnico/", label: "el servicio técnico general" },
		{ href: "/mantenimiento-pc-domicilio-arequipa/", label: "el mantenimiento de PC a domicilio" },
		{ href: "/reparacion-laptops-arequipa/", label: "la reparación de laptops en Arequipa" },
	],
} satisfies LandingData;

export const landings = [laptopLentaLanding] satisfies readonly LandingData[];

export function getLandingBySlug(slug: string): LandingData | undefined {
	return landings.find((landing) => landing.slug === slug);
}
