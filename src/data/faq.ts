export interface FaqItem {
	question: string;
	answer: string;
	tags: string[];
	/** Solo aparece en la landing page (máx 5-8) */
	featured?: boolean;
}

export const faqItems: FaqItem[] = [
	// ===== GENERALES (landing únicamente) =====
	{
		question: "¿Qué tipo de servicios ofrece RenovaBit?",
		answer:
			"Ofrecemos cuatro líneas de servicio: servicio técnico de laptops y PCs (reparación, mantenimiento, diagnóstico), desarrollo web (landing pages, webs corporativas, catálogos digitales), venta de componentes y equipos, y reparaciones especializadas (microelectrónica, BIOS, pantallas). Atendemos en Arequipa con opción a domicilio.",
		tags: ["general"],
		featured: true,
	},
	{
		question: "¿Emiten boleta y factura electrónica?",
		answer:
			"Sí. Emitimos boleta de venta y factura electrónica. Cuando el servicio lo requiere, también entregamos informes técnicos, evidencias fotográficas y documentación del trabajo realizado.",
		tags: ["general"],
		featured: true,
	},
	{
		question: "¿Atienden personas y empresas?",
		answer:
			"Sí. Trabajamos tanto con clientes particulares como con empresas. Podemos atender equipos individuales o múltiples estaciones de trabajo, emitiendo la documentación necesaria para cada servicio.",
		tags: ["general"],
		featured: true,
	},
	{
		question: "¿Cómo sé que mi equipo estará en buenas manos?",
		answer:
			"Cada intervención se realiza con un proceso documentado y transparente. Explicamos el diagnóstico, mostramos evidencias cuando corresponde y recomendamos únicamente las soluciones que realmente aportan valor a tu equipo.",
		tags: ["general"],
		featured: true,
	},
	{
		question: "¿Trabajan con todas las marcas?",
		answer:
			"Sí. Atendemos laptops, computadoras de escritorio y componentes de marcas como Lenovo, HP, Dell, Asus, Acer, MSI, Apple y muchas más, utilizando procedimientos adecuados para cada equipo.",
		tags: ["general"],
		featured: true,
	},
	{
		question: "¿Ofrecen servicio de recojo y entrega?",
		answer:
			"Sí. Puedes llevar tu equipo a nuestro taller o solicitar el servicio de recojo y entrega en Arequipa. También realizamos atención a domicilio y visitas programadas para empresas, según el tipo de servicio.",
		tags: ["general"],
		featured: true,
	},

	// ===== SERVICIO TÉCNICO =====
	{
		question: "¿Realizan diagnóstico antes de reparar?",
		answer:
			"Sí. Primero evaluamos el equipo para identificar el origen del problema y te explicamos las alternativas disponibles antes de realizar cualquier reparación. Si decides continuar con la reparación, el diagnóstico no tiene costo.",
		tags: ["servicio-tecnico", "reparaciones-especializadas"],
	},
	{
		question: "¿Cuánto cuesta reparar una laptop en Arequipa?",
		answer:
			"El costo depende del tipo de falla y los repuestos necesarios. El diagnóstico es gratuito y te entregamos una cotización clara antes de iniciar cualquier reparación. Cambios de pantalla, teclados, mantenimiento y reparación de placa tienen precios distintos.",
		tags: ["servicio-tecnico", "reparaciones-especializadas"],
	},
	{
		question: "¿Qué hacer si mi laptop no enciende?",
		answer:
			"No fuerces el encendido repetidamente. El problema puede ser la batería, el cargador, la BIOS o la placa madre. Escríbenos por WhatsApp para una evaluación inicial. En muchos casos el diagnóstico nos permite saber si la reparación es viable antes de que traigas el equipo.",
		tags: ["servicio-tecnico", "reparaciones-especializadas"],
	},
	{
		question: "¿Cuánto cuesta formatear o instalar Windows en Arequipa?",
		answer:
			"El precio depende de si necesitas respaldo de información, instalación de programas específicos y configuración adicional. Te damos un precio fijo antes de empezar, sin cargos ocultos.",
		tags: ["servicio-tecnico"],
	},
	{
		question: "¿Hacen mantenimiento de computadoras para empresas?",
		answer:
			"Sí. Atendemos flotas de equipos en empresas de Arequipa. Realizamos mantenimiento preventivo y correctivo, entregamos informes técnicos, evidencias fotográficas y factura electrónica para tu contabilidad.",
		tags: ["servicio-tecnico"],
	},
	{
		question: "¿Cada cuánto tiempo debo hacer mantenimiento a mi laptop?",
		answer:
			"Recomendamos mantenimiento preventivo cada 6 a 12 meses, dependiendo del uso y ambiente. Si tu equipo se usa en ambientes con polvo o mascotas, puede necesitar mantenimiento más frecuente.",
		tags: ["servicio-tecnico"],
	},
	{
		question: "¿Cambian pasta térmica en el mantenimiento?",
		answer:
			"Sí. El cambio de pasta térmica de calidad está incluido en todos nuestros mantenimientos. Usamos pastas de grado profesional para asegurar la mejor transferencia de calor.",
		tags: ["servicio-tecnico"],
	},

	// ===== DESARROLLO WEB =====
	{
		question: "¿También desarrollan proyectos de software?",
		answer:
			"Sí. El desarrollo de software es una de nuestras principales líneas de trabajo. Creamos landing pages, sitios corporativos, catálogos digitales y soluciones web modernas enfocadas en rendimiento, diseño y facilidad de administración.",
		tags: ["desarrollo-web"],
	},
	{
		question: "¿Cuánto tiempo toma desarrollar un sitio web?",
		answer:
			"Depende del alcance del proyecto. Una landing page puede estar lista en 2 a 5 días. Un sitio corporativo completo toma de 7 a 15 días. Siempre te damos un cronograma claro antes de empezar.",
		tags: ["desarrollo-web"],
	},
	{
		question: "¿Puedo actualizar el contenido yo mismo después de publicado?",
		answer:
			"Sí. Todos nuestros sitios incluyen un panel de administración sencillo para que puedas modificar textos, imágenes y productos sin conocimientos técnicos. También incluimos capacitación para que sepas cómo usarlo.",
		tags: ["desarrollo-web"],
	},
	{
		question: "¿El sitio web incluye hosting y dominio?",
		answer:
			"Sí. El precio del proyecto incluye la configuración del dominio, hosting de alto rendimiento y certificado SSL para que tu sitio sea seguro y cargue rápido desde el día uno.",
		tags: ["desarrollo-web"],
	},
	{
		question: "¿Hacen SEO en los sitios que desarrollan?",
		answer:
			"Sí. Todos nuestros sitios incluyen SEO técnico desde la base: meta tags, datos estructurados, sitemap, optimización de imágenes y velocidad de carga. Si necesitas una estrategia de contenido más amplia, también podemos ayudarte.",
		tags: ["desarrollo-web"],
	},

	// ===== TIENDA =====
	{
		question: "¿Los componentes tienen garantía del fabricante?",
		answer:
			"Sí. Todos los componentes y equipos que vendemos son nuevos y cuentan con garantía del fabricante. Antes de entregar, probamos cada componente para asegurarnos de que funciona correctamente.",
		tags: ["tienda"],
	},
	{
		question: "¿Pueden armar una PC a medida según mis necesidades?",
		answer:
			"Sí. Te asesoramos según tu presupuesto y el uso que le vas a dar (gaming, oficina, diseño, programación). Seleccionamos componentes compatibles, los ensamblamos, configuramos y probamos todo antes de entregar.",
		tags: ["tienda"],
	},
	{
		question: "¿Hacen envíos de componentes fuera de Arequipa?",
		answer:
			"Sí. Podemos coordinar envíos a otras ciudades del Perú. El costo del envío depende del destino y del tamaño del pedido. Contáctanos para una cotización.",
		tags: ["tienda"],
	},

	// ===== REPARACIONES ESPECIALIZADAS =====
	{
		question: "¿Reparan placas madre a nivel de componente?",
		answer:
			"Sí. Hacemos reparación de motherboard a nivel electrónico, incluyendo soldadura de precisión, reemplazo de capacitores, MOSFETs y otros componentes SMD. No reemplazamos la placa completa a menos que sea estrictamente necesario.",
		tags: ["reparaciones-especializadas"],
	},
	{
		question: "¿Qué marcas de laptop reparan a nivel de placa?",
		answer:
			"Lenovo, HP, Dell, Asus, Acer, MSI y Apple (modelos seleccionados). Contamos con esquemáticos, herramientas de diagnóstico y estación de soldadura profesional para intervenciones de precisión.",
		tags: ["reparaciones-especializadas"],
	},
	{
		question: "¿Recuperan datos de discos dañados?",
		answer:
			"Sí. Ofrecemos diagnóstico y recuperación de datos en discos duros y SSD con fallas lógicas o físicas leves. El éxito de la recuperación depende del tipo y grado del daño. Te informamos antes de cualquier intervención.",
		tags: ["reparaciones-especializadas"],
	},
];

/** FAQ destacadas para la landing page */
export function getFeaturedFaqs(): FaqItem[] {
	return faqItems.filter((f) => f.featured);
}

/** FAQ filtradas por un tag específico */
export function getFaqsByTag(tag: string): FaqItem[] {
	return faqItems.filter((f) => f.tags.includes(tag));
}

/** FAQ para un servicio específico (solo el tag del servicio, sin generales) */
export function getFaqsForService(serviceSlug: string): FaqItem[] {
	return faqItems.filter((f) => f.tags.includes(serviceSlug));
}
