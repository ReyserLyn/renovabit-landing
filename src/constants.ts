export const SITE = {
	name: "RenovaBit",
	url: "https://renovabit.com",
	description:
		"Servicio técnico de laptops y PCs en Arequipa. Reparación, mantenimiento y soporte remoto.",
	author: "RenovaBit",
	locale: "es_PE",
	ogImage: "/og-default.jpg",
} as const;

export const CONTACT = {
	whatsappUrl: "https://wa.me/51987471074",
	phone: "+51 987 471 074",
	email: "contacto@renovabit.com",
} as const;

export const SOCIAL = {
	instagram: "https://instagram.com/renovabit",
	facebook: "https://facebook.com/renovabit",
	tiktok: "https://tiktok.com/@renovabit",
} as const;

export const NAV_ITEMS = [
	{ href: "#servicios", label: "Servicios" },
	{ href: "#empresas", label: "Empresas" },
	{ href: "#resenas", label: "Reseñas" },
	{ href: "#faq", label: "FAQ" },
] as const;

export const FOOTER = {
	emails: {
		info: "info@renovabit.com",
		contacto: CONTACT.email,
		soporte: "soporte@renovabit.com",
	},
	address: {
		line1: "Av. Goyeneche 1602",
		city: "Miraflores",
		district: "Arequipa",
		postalCode: "04004",
	},
	phone: CONTACT.phone,
	hours: "Lunes a Viernes, 8:00 AM - 8:00 PM",
} as const;

export const LOCATION = {
	lat: -16.3921345,
	lng: -71.5174131,
} as const;

export const FAQ_ITEMS = [
	{
		question: "¿Qué tipo de servicios ofrece RenovaBit?",
		answer:
			"Desarrollamos páginas web, landing pages, sitios corporativos y catálogos digitales. Además, realizamos mantenimiento preventivo y correctivo de laptops y PCs, reparaciones especializadas, microelectrónica, reemplazo de componentes, soporte técnico y soluciones para personas y empresas.",
	},
	{
		question: "¿Atienden personas y empresas?",
		answer:
			"Sí. Trabajamos tanto con clientes particulares como con empresas. Podemos atender equipos individuales o múltiples estaciones de trabajo, emitiendo la documentación necesaria para cada servicio.",
	},
	{
		question: "¿Emiten boleta y factura electrónica?",
		answer:
			"Sí. Emitimos boleta de venta y factura electrónica. Cuando el servicio lo requiere, también entregamos informes técnicos, evidencias fotográficas y documentación del trabajo realizado.",
	},
	{
		question: "¿Ofrecen servicio de recojo y entrega?",
		answer:
			"Sí. Puedes llevar tu equipo a nuestro taller o solicitar el servicio de recojo y entrega en Arequipa. También realizamos atención a domicilio y visitas programadas para empresas, según el tipo de servicio.",
	},
	{
		question: "¿Cómo sé que mi equipo estará en buenas manos?",
		answer:
			"Cada intervención se realiza con un proceso documentado y transparente. Explicamos el diagnóstico, mostramos evidencias cuando corresponde y recomendamos únicamente las soluciones que realmente aportan valor a tu equipo.",
	},
	{
		question: "¿Trabajan con todas las marcas?",
		answer:
			"Sí. Atendemos laptops, computadoras de escritorio y componentes de marcas como Lenovo, HP, Dell, Asus, Acer, MSI, Apple y muchas más, utilizando procedimientos adecuados para cada equipo.",
	},
	{
		question: "¿Realizan diagnóstico antes de reparar?",
		answer:
			"Sí. Primero evaluamos el equipo para identificar el origen del problema y te explicamos las alternativas disponibles antes de realizar cualquier reparación. Si decides continuar con la reparación, el diagnóstico no tiene costo.",
	},
	{
		question: "¿También desarrollan proyectos de software?",
		answer:
			"Sí. El desarrollo de software es una de nuestras principales líneas de trabajo. Creamos landing pages, sitios corporativos, catálogos digitales y soluciones web modernas enfocadas en rendimiento, diseño y facilidad de administración.",
	},
] as const;
