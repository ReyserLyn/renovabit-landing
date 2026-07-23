import type { ImageMetadata } from "astro";
import aboutImg1 from "@/assets/images/about/about-1.avif";
import aboutImg2 from "@/assets/images/about/about-2.avif";
import processImg1 from "@/assets/images/process/process-1.avif";
import processImg2 from "@/assets/images/process/process-2.avif";
import processImg3 from "@/assets/images/process/process-3.avif";
import processImg4 from "@/assets/images/process/process-4.avif";
import processImg5 from "@/assets/images/process/process-5.avif";
import servicioImg1 from "@/assets/images/services/service-1.avif";
import servicioImg2 from "@/assets/images/services/service-2.avif";
import servicioImg3 from "@/assets/images/services/service-3.avif";
import servicioImg4 from "@/assets/images/services/service-4.avif";

export interface ServiceData {
	slug: string;
	title: string;
	description: string;
	price: string;
	subtitle: string;
	tiempo: string;
	ideal: string;
	entrega: string;
	entregaLabel?: string;
	includes: string[];
	/** Síntomas o señales de que el cliente necesita este servicio. Opcional: no todos los servicios los usan. */
	symptoms?: string[];
	ctaLabel: string;
	/** Banner CTA al final de la página de servicio */
	ctaHeading: string;
	ctaDescription: string;
	/** Contenido enriquecido en HTML inline (reemplaza o complementa secciones genéricas) */
	bodyHtml?: string;
	/** Imagen principal del servicio (misma que en el hub y slug) */
	heroImg: ImageMetadata;
	/** Features con iconos para Variant B (grid en hub) */
	features?: { icon: string; title: string; desc: string }[];
	process: {
		label: string;
		img: ImageMetadata;
	}[];
}

export const servicios: ServiceData[] = [
	{
		slug: "servicio-tecnico",
		title: "Servicio Técnico",
		description:
			"Mantenimiento y reparación de laptops y PCs con diagnóstico profesional, documentación del proceso y atención personalizada en Arequipa.",
		price: "S/ 90",
		subtitle: "Desde · Diagnóstico sin costo",
		tiempo: "1 a 3 días",
		ideal: "Personas y empresas",
		entrega: "Informe + fotografías",
		includes: [
			"Mantenimiento preventivo completo",
			"Cambio de pasta térmica",
			"Limpieza interna profunda",
			"Optimización térmica",
			"Pruebas de temperatura",
			"Actualización de drivers",
			"Verificación de componentes",
			"Informe documentado",
			"Diagnóstico sin costo",
			"Garantía por escrito",
			"Boleta o factura",
		],
		symptoms: [
			"Se calienta y hace ruido",
			"Funciona más lento que antes",
			"La batería no dura",
			"Nunca le hiciste mantenimiento",
			"Se apaga solo",
		],
		ctaLabel: "Cotizar servicio",
		ctaHeading: "¿Tu laptop necesita mantenimiento?",
		ctaDescription:
			"Agenda tu diagnóstico sin costo. Te contamos qué necesita tu equipo, cuánto cuesta y cuándo lo tienes listo.",
		heroImg: servicioImg1,
		process: [
			{ label: "Recepción", img: servicioImg1 },
			{ label: "Diagnóstico", img: aboutImg1 },
			{ label: "Desarme", img: aboutImg2 },
			{ label: "Limpieza", img: processImg1 },
			{ label: "Pruebas", img: processImg2 },
			{ label: "Entrega", img: servicioImg1 },
		],
	},
	{
		slug: "desarrollo-web",
		title: "Desarrollo Web",
		description:
			"Sitios web rápidos, profesionales y preparados para convertir visitantes en clientes. Desde landing pages hasta webs corporativas.",
		price: "S/ 500",
		subtitle: "Proyectos desde",
		tiempo: "2 a 15 días",
		ideal: "Negocios, emprendedores, PYMEs",
		entrega: "Sitio publicado + CMS",
		entregaLabel: "Qué entregamos",
		includes: [
			"Diseño responsive mobile-first",
			"Optimización SEO técnica",
			"Velocidad de carga optimizada",
			"Panel de administración",
			"Formulario de contacto",
			"Integración con WhatsApp",
			"Dominio + hosting + SSL",
			"Capacitación para gestionar",
			"Soporte post-entrega",
		],
		ctaLabel: "Cuéntanos tu proyecto",
		ctaHeading: "¿Listo para tener tu sitio web?",
		ctaDescription:
			"Contanos tu idea y te preparamos una propuesta clara, con tiempos, precio y sin vueltas.",
		heroImg: servicioImg2,
		features: [
			{
				icon: "hugeicons:web-design-01",
				title: "Landing Pages",
				desc: "Optimizadas para convertir",
			},
			{
				icon: "hugeicons:api",
				title: "Automatizaciones",
				desc: "Formularios, WhatsApp e integraciones",
			},
			{
				icon: "hugeicons:computer-programming-01",
				title: "Web Corporativa",
				desc: "Presencia profesional para tu empresa",
			},
			{
				icon: "hugeicons:search-01",
				title: "SEO Técnico",
				desc: "Optimización para Google desde el inicio",
			},
			{
				icon: "hugeicons:shopping-cart-01",
				title: "Catálogo Digital",
				desc: "Muestra tus productos sin vender online",
			},
			{
				icon: "hugeicons:rocket-01",
				title: "Dominio + Hosting + SSL",
				desc: "Todo listo para publicar",
			},
		],
		process: [
			{ label: "Brief", img: servicioImg1 },
			{ label: "Diseño", img: servicioImg2 },
			{ label: "Desarrollo", img: aboutImg1 },
			{ label: "Revisión", img: aboutImg2 },
			{ label: "Publicación", img: processImg3 },
			{ label: "Soporte", img: processImg5 },
		],
	},
	{
		slug: "tienda",
		title: "Tienda de Componentes y Equipos",
		description:
			"Equipos y componentes seleccionados según tus necesidades, sin venderte productos que no necesitas. Precio de distribuidor.",
		price: "S/ 50",
		subtitle: "Desde · Precio de distribuidor",
		tiempo: "1 a 7 días",
		ideal: "Gamers y oficina",
		entrega: "Producto probado + garantía",
		includes: [
			"Laptops y PCs nuevas",
			"Componentes originales",
			"Tarjetas gráficas y RAM",
			"Discos SSD y NVMe",
			"Monitores y periféricos",
			"Ensamblado a medida",
			"Asesoría sin compromiso",
			"Pruebas antes de entregar",
			"Garantía del fabricante",
			"Boleta o factura",
		],
		ctaLabel: "Consultar disponibilidad",
		ctaHeading: "¿Buscás componentes o equipos?",
		ctaDescription:
			"Dinos qué necesitas y te damos precio de distribuidor. Sin compromiso y con asesoría incluida.",
		heroImg: servicioImg3,
		process: [
			{ label: "Consulta", img: servicioImg3 },
			{ label: "Selección", img: aboutImg1 },
			{ label: "Ensamblado", img: processImg1 },
			{ label: "Pruebas", img: processImg2 },
			{ label: "Optimización", img: processImg4 },
			{ label: "Entrega", img: servicioImg3 },
		],
	},
	{
		slug: "reparaciones-especializadas",
		title: "Reparaciones Especializadas",
		description:
			"Solucionamos fallas complejas que requieren diagnóstico y reparación a nivel electrónico. Microelectrónica, BIOS, motherboard.",
		price: "S/ 150",
		subtitle: "Desde",
		tiempo: "3 a 10 días",
		ideal: "Equipos con fallas complejas",
		entrega: "Diagnóstico documentado + garantía",
		entregaLabel: "Qué entregamos",
		includes: [
			"Reparación de motherboard",
			"Microelectrónica",
			"Reprogramación de BIOS",
			"Cambio de pantallas",
			"Cambio de teclados",
			"Conectores y puertos",
			"Soldadura de precisión",
			"Equipo profesional",
			"Diagnóstico documentado",
			"Garantía del trabajo",
			"Boleta o factura",
		],
		ctaLabel: "Solicitar diagnóstico",
		ctaHeading: "¿Tu equipo tiene una falla compleja?",
		ctaDescription:
			"Contanos los síntomas. A veces lo que parece perdido tiene solución con el diagnóstico correcto.",
		heroImg: servicioImg4,
		features: [
			{
				icon: "hugeicons:cpu-settings",
				title: "Reparación de motherboard",
				desc: "A nivel de componente, sin reemplazo innecesario",
			},
			{
				icon: "hugeicons:laptop",
				title: "Pantallas y teclados",
				desc: "Cambio de componentes internos de laptop",
			},
			{
				icon: "hugeicons:microscope",
				title: "Microelectrónica",
				desc: "Soldadura de precisión con equipo profesional",
			},
			{
				icon: "hugeicons:usb-connected-01",
				title: "Conectores y puertos",
				desc: "Reparación de carga, USB, HDMI dañados",
			},
			{
				icon: "hugeicons:chip",
				title: "Reprogramación y recuperación de BIOS",
				desc: "BIOS corrupta o bloqueada",
			},
			{
				icon: "hugeicons:flash",
				title: "Diagnóstico de equipos sin encendido",
				desc: "Detección de fallas eléctricas sin cambiar piezas",
			},
		],
		process: [
			{ label: "Recepción", img: servicioImg4 },
			{ label: "Diagnóstico", img: aboutImg1 },
			{ label: "Microelectrónica", img: processImg1 },
			{ label: "Reparación", img: processImg2 },
			{ label: "Pruebas", img: processImg4 },
			{ label: "Entrega", img: servicioImg4 },
		],
	},
];

export function getServiceBySlug(slug: string): ServiceData | undefined {
	return servicios.find((s) => s.slug === slug);
}
