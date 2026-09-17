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
	{
		question: "¿Qué métodos de pago aceptan?",
		answer: "Aceptamos Yape y Plin. Coordinamos el pago al confirmar el servicio.",
		tags: ["general", "tienda", "servicio-tecnico", "reparaciones-especializadas"],
		featured: true,
	},

	// ===== SERVICIO TÉCNICO / MANTENIMIENTO =====
	{
		question: "¿Realizan diagnóstico antes de reparar?",
		answer:
			"Sí. Primero evaluamos el equipo para identificar el origen del problema y te explicamos las alternativas disponibles antes de realizar cualquier reparación. Si decides continuar con la reparación, el diagnóstico no tiene costo.",
		tags: ["reparaciones-especializadas"],
	},
	{
		question: "¿Cuánto cuesta reparar una laptop en Arequipa?",
		answer:
			"El costo depende del tipo de falla y los repuestos necesarios. La revisión básica está incluida en el servicio. Si el equipo requiere evaluación avanzada de placa, cuesta S/60 y se acredita al servicio. Te entregamos una cotización clara antes de iniciar cualquier reparación. Cambios de pantalla, teclados, mantenimiento y reparación de placa tienen precios distintos.",
		tags: ["reparaciones-especializadas"],
	},
	{
		question: "¿Qué hacer si mi laptop no enciende?",
		answer:
			"No fuerces el encendido repetidamente. El problema puede ser la batería, el cargador, la BIOS o la placa madre. Escríbenos por WhatsApp para una evaluación inicial. En muchos casos el diagnóstico nos permite saber si la reparación es viable antes de que traigas el equipo.",
		tags: ["reparacion-laptops-arequipa", "reparaciones-especializadas"],
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
		question: "¿Cambian pasta térmica en el mantenimiento?",
		answer:
			"Sí. El cambio de pasta térmica de calidad está incluido en todos nuestros mantenimientos. Usamos pastas de grado profesional para asegurar la mejor transferencia de calor.",
		tags: ["servicio-tecnico"],
	},

	// ===== REPARACIÓN DE LAPTOPS (FALLAS DURAS) =====
	{
		question: "¿Qué fallas de laptop revisan en Arequipa?",
		answer:
			"Revisamos laptops que no encienden, se apagan solas, tienen la pantalla o el teclado dañados, fallas de carga y puertos, y equipos con posibles problemas de placa. El diagnóstico determina el origen de la falla y si requiere una reparación especializada.",
		tags: ["reparacion-laptops-arequipa"],
	},
	{
		question: "¿Cómo es el diagnóstico antes de reparar una laptop?",
		answer:
			"Primero revisamos los síntomas y el estado del equipo. Luego te explicamos qué encontramos, qué opciones existen y cuánto costaría cada alternativa. No iniciamos una reparación adicional sin tu aprobación.",
		tags: ["reparacion-laptops-arequipa"],
	},
	{
		question: "¿El diagnóstico de laptop tiene costo?",
		answer:
			"El diagnóstico no tiene costo si decides continuar con la reparación. Antes de intervenir te explicamos las condiciones y el alcance del trabajo, para que puedas decidir con información clara.",
		tags: ["reparacion-laptops-arequipa"],
	},
	{
		question: "¿Atienden reparaciones de laptops a domicilio en Arequipa?",
		answer:
			"Coordinamos la modalidad según la falla y el equipo: atención a domicilio, recojo y entrega o revisión en taller. Escríbenos por WhatsApp con tu zona y los síntomas para confirmar qué opción corresponde.",
		tags: ["reparacion-laptops-arequipa"],
	},
	{
		question: "¿Me informan el costo antes de reparar mi laptop?",
		answer:
			"Sí. El costo depende de la falla, la complejidad y los repuestos necesarios. Te entregamos una cotización clara antes de empezar y te avisamos si durante la revisión aparece algo que cambie el alcance aprobado.",
		tags: ["reparacion-laptops-arequipa"],
	},
	{
		question: "¿La reparación de mi laptop tiene garantía?",
		answer:
			"Sí. El trabajo queda con garantía por escrito. Antes de intervenir te confirmamos el alcance, la cotización y las condiciones, para que decidas con información clara.",
		tags: ["reparacion-laptops-arequipa"],
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

	// ===== LAPTOP LENTA =====
	{
		question: "¿Por qué mi laptop está lenta?",
		answer:
			"Las causas más comunes son un disco lleno o de varios años, poca memoria RAM, sobrecalentamiento por polvo o pasta térmica seca, demasiados programas al inicio y malware. En la revisión identificamos cuál aplica a tu equipo.",
		tags: ["laptop-lenta-arequipa"],
	},
	{
		question: "¿El mantenimiento soluciona la lentitud?",
		answer:
			"Depende de la causa. Si la lentitud viene de calor, polvo o programas que se abren al inicio, el mantenimiento suele resolverla. Si el disco o la memoria están al límite, puede ser necesario un upgrade, que se cotiza por separado.",
		tags: ["laptop-lenta-arequipa"],
	},
	{
		question: "¿Cuánto cuesta arreglar una laptop lenta en Arequipa?",
		answer:
			"La revisión parte del mantenimiento: S/90 en taller o S/120 a domicilio para laptops y PCs simples, y S/120 o S/150 para equipos gamer o complejos. El domicilio suma S/30 y requiere coordinación previa.",
		tags: ["laptop-lenta-arequipa"],
	},
	{
		question: "¿Cuánto cuesta formatear una laptop lenta?",
		answer:
			"El formateo parte desde S/50. El precio final depende del alcance: backup de información, instalación de programas y configuración. Confirmamos la cotización antes de empezar.",
		tags: ["laptop-lenta-arequipa"],
	},
	{
		question: "¿Cambian el disco a SSD o agregan RAM?",
		answer:
			"Sí, coordinamos upgrades de disco SSD o memoria RAM cuando el equipo lo soporta. Los repuestos se cotizan por separado y te explicamos el precio antes de intervenir.",
		tags: ["laptop-lenta-arequipa"],
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

	// ===== MANTENIMIENTO A DOMICILIO =====
	{
		question: "¿Qué incluye el mantenimiento a domicilio en Arequipa?",
		answer:
			"La visita incluye limpieza interna y externa, cambio de pasta térmica y pruebas básicas de funcionamiento y temperatura. En equipos complejos también se incluyen pads térmicos estándar. El backup básico se realiza cuando el volumen y el estado del equipo lo permiten.",
		tags: ["mantenimiento-pc-domicilio-arequipa"],
	},
	{
		question: "¿Cuánto cuesta el mantenimiento a domicilio?",
		answer:
			"El mantenimiento simple cuesta S/120 a domicilio y el complejo S/150. La visita suma S/30 sobre la tarifa de taller y se agenda con coordinación previa.",
		tags: ["mantenimiento-pc-domicilio-arequipa"],
	},
	{
		question: "¿En qué zonas de Arequipa atienden a domicilio?",
		answer:
			"Coordinamos la visita según tu zona y el tipo de equipo. Escríbenos por WhatsApp con tu dirección de referencia para confirmar disponibilidad y horario.",
		tags: ["mantenimiento-pc-domicilio-arequipa"],
	},
	{
		question: "¿La visita a domicilio incluye reparaciones?",
		answer:
			"No. El mantenimiento es preventivo: limpieza, pasta térmica y pruebas. Si encontramos una falla, la reparación se deriva a taller y se cotiza después de evaluar el equipo. Repuestos y licencias se cotizan aparte.",
		tags: ["mantenimiento-pc-domicilio-arequipa"],
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
