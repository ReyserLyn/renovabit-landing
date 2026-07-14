export const SITE = {
	name: "RenovaBit",
	url: "https://renovabit.com",
	description:
		"Servicio técnico de laptops y PCs en Arequipa. Reparación, mantenimiento y soporte remoto.",
	author: "RenovaBit",
	locale: "es_PE",
	ogImage: "/og-default.png",
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
