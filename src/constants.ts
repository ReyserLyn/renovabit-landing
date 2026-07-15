export const SITE = {
	name: "RenovaBit",
	url: "https://renovabit.com",
	description:
		"Reparación de laptops y PCs en Arequipa a domicilio. Mantenimiento, desarrollo web y venta de componentes. Diagnóstico sin costo.",
	author: "RenovaBit",
	locale: "es_PE",
	ogImage: "/og-default.jpg",
	googleVerification: "7Q5lqvjWHcpuMW3CdX9IfWbcj3bmTNC0GGb3-hdfbCE",
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
		"tienda online arequipa",
		"web corporativa arequipa",
		"catálogo digital arequipa",
		// Tienda
		"venta componentes pc arequipa",
		"computadoras arequipa",
		"laptops arequipa",
		"upgrade laptop arequipa",
		"cambio disco duro ssd arequipa",
		"ensamblado pc arequipa",
		"venta de laptops arequipa",
		"componentes gamer arequipa",
		// Reparaciones Especializadas
		"reparación motherboard arequipa",
		"reparación microelectrónica arequipa",
		"cambio pantalla laptop arequipa",
		"reparación teclado laptop arequipa",
		"servicio técnico especializado arequipa",
		"reparación bios arequipa",
	].join(", "),
	themeColor: "#654fcc",
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
	x: "https://x.com/RenovaBit",
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

export const FAQ_ITEMS = [
	{
		question: "¿Qué tipo de servicios ofrece RenovaBit?",
		answer:
			"Ofrecemos cuatro líneas de servicio: servicio técnico de laptops y PCs (reparación, mantenimiento, diagnóstico), desarrollo web (landing pages, webs corporativas, catálogos digitales), venta de componentes y equipos, y reparaciones especializadas (microelectrónica, bios, pantallas). Atendemos en Arequipa con opción a domicilio.",
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
	{
		question: "¿Cuánto cuesta reparar una laptop en Arequipa?",
		answer:
			"El costo depende del tipo de falla y los repuestos necesarios. El diagnóstico es gratuito y te entregamos una cotización clara antes de iniciar cualquier reparación. Cambios de pantalla, teclados, mantenimiento y reparación de placa tienen precios distintos.",
	},
	{
		question: "¿Qué hacer si mi laptop no enciende?",
		answer:
			"No fuerces el encendido repetidamente. El problema puede ser la batería, el cargador, la BIOS o la placa madre. Escríbenos por WhatsApp para una evaluación inicial. En muchos casos el diagnóstico nos permite saber si la reparación es viable antes de que traigas el equipo.",
	},
	{
		question: "¿Cuánto cuesta formatear o instalar Windows en Arequipa?",
		answer:
			"El precio depende de si necesitas respaldo de información, instalación de programas específicos y configuración adicional. Te damos un precio fijo antes de empezar, sin cargos ocultos.",
	},
	{
		question: "¿Hacen mantenimiento de computadoras para empresas?",
		answer:
			"Sí. Atendemos flotas de equipos en empresas de Arequipa. Realizamos mantenimiento preventivo y correctivo, entregamos informes técnicos, evidencias fotográficas y factura electrónica para tu contabilidad.",
	},
] as const;
