export const SITE = {
	name: "RenovaBit",
	url: "https://renovabit.com",
	description:
		"Reparación de laptops y PCs en Arequipa a domicilio. Mantenimiento, desarrollo web y venta de componentes. Diagnóstico sin costo.",
	author: "RenovaBit",
	locale: "es_PE",
	ogImage: "/og-default.jpg",
	googleVerification: "7Q5lqvjWHcpuMW3CdX9IfWbcj3bmTNC0GGb3-hdfbCE",
	facebookVerification: "0l2k7sxfxqdnc1uzbmts6uxnmi5zn1",
	keywords: [
		// Servicio Técnico
		"servicio técnico arequipa",
		"reparación laptops arequipa",
		"técnico computadoras arequipa",
		"mantenimiento pc arequipa",
		"reparación laptops a domicilio arequipa",
		"servicio técnico laptops miraflores arequipa",
		"mantenimiento computadoras domicilio arequipa",
		"laptop no enciende arequipa",
		"pantalla laptop rota arequipa",
		"laptop lenta arequipa",
		"recuperar datos arequipa",
		"limpieza laptop arequipa",
		"diagnóstico gratuito arequipa",
		"servicio técnico a domicilio arequipa",
		"reparación pc gamer arequipa",
		"cambio pasta térmica arequipa",
		"instalación windows arequipa",
		"formateo computadora arequipa",
		// Desarrollo Web
		"desarrollo web arequipa",
		"diseño páginas web arequipa",
		"landing page arequipa",
		"página web para negocio arequipa",
		"desarrollador web arequipa",
		"web corporativa arequipa",
		"catálogo digital arequipa",
		"diseño web arequipa",
		"página web para pymes arequipa",
		// Empresas / B2B
		"soporte técnico empresas arequipa",
		"mantenimiento computadoras empresas arequipa",
		"soporte técnico con factura arequipa",
		"servicio técnico pymes arequipa",
		// Tienda / Componentes / Upgrade
		"venta componentes pc arequipa",
		"computadoras arequipa",
		"laptops arequipa",
		"upgrade laptop arequipa",
		"cambio disco duro ssd arequipa",
		"ensamblado pc arequipa",
		"venta de laptops arequipa",
		"componentes gamer arequipa",
		"tarjetas gráficas arequipa",
		"memoria ram laptop arequipa",
		// Reparaciones Especializadas
		"reparación motherboard arequipa",
		"reparación microelectrónica arequipa",
		"cambio pantalla laptop arequipa",
		"cambio teclado laptop arequipa",
		"reparación teclado laptop arequipa",
		"servicio técnico especializado arequipa",
		"reparación bios arequipa",
		"virus computadora arequipa",
		"recuperación archivos arequipa",
	].join(", "),
	themeColor: "#654fcc",
} as const;

export const CONTACT = {
	whatsappUrl:
		"https://wa.me/51955315646?text=%C2%A1Hola!%20Estoy%20interesado%20en%20uno%20de%20sus%20servicios%20y%20quisiera%20m%C3%A1s%20informaci%C3%B3n.",
	phone: "+51 955 315 646",
	email: "contacto@renovabit.com",
} as const;

export const SOCIAL = {
	instagram: "https://www.instagram.com/RenovaBit",
	facebook: "https://www.facebook.com/RenovaBitOficial",
	tiktok: "https://www.tiktok.com/@RenovaBit",
	x: "https://x.com/RenovaBit",
	github: "https://github.com/ReyserLyn/renovabit-landing",
} as const;

export const NAV_ITEMS = [
	{ href: "/servicios/", label: "Servicios" },
	{ href: "/nosotros/", label: "Nosotros" },
	{ href: "/contacto/", label: "Contacto" },
	{ href: "/#empresas", label: "Empresas" },
	{ href: "/#resenas", label: "Reseñas" },
	{ href: "/#faq", label: "FAQ" },
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

export const GEO = {
	region: "PE-ARE",
	placename: "Arequipa",
	position: "-16.409047;-71.537451",
	icbm: "-16.409047, -71.537451",
} as const;

export const LOCATION = {
	lat: -16.3921345,
	lng: -71.5174131,
} as const;
