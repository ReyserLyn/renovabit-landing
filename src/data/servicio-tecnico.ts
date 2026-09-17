export interface ServicioTecnicoPriceRow {
	device: string;
	workshop: string;
	home: string;
	description: string;
}

export interface ServicioTecnicoFaq {
	question: string;
	answer: string;
	tags: string[];
}

export const servicioTecnicoCommercial = {
	header: {
		price: "Desde S/90",
		subtitle: "Tarifas de mantenimiento",
		description:
			"Mantenimiento preventivo para laptops y PCs, con una tarifa clara según la complejidad del equipo y la modalidad de atención.",
	},
	prices: [
		{
			device: "Laptop o PC simple",
			workshop: "S/90",
			home: "S/120",
			description: "Equipos de uso diario, oficina o sin componentes de alto rendimiento.",
		},
		{
			device: "Laptop gamer o PC compleja",
			workshop: "S/120",
			home: "S/150",
			description: "Equipos gamer, con tarjeta gráfica o con mayor complejidad de mantenimiento.",
		},
	] satisfies ServicioTecnicoPriceRow[],
	included: [
		"Limpieza interna y externa del equipo",
		"Cambio de pasta térmica como parte del mantenimiento",
		"Pads térmicos estándar incluidos en mantenimiento complejo",
		"Pruebas básicas de funcionamiento y temperatura",
		"Backup básico cuando el volumen y el estado del equipo lo permiten",
	],
	excluded: [
		"Repuestos y licencias se cotizan por separado",
		"Las reparaciones se derivan a taller y se cotizan después de evaluar el equipo",
		"El diagnóstico avanzado cuesta S/60 y se acredita al servicio",
	],
	conditions: [
		"La atención a domicilio requiere coordinación previa.",
		"El servicio a domicilio suma S/30 a la tarifa de taller.",
		"La tarifa de mantenimiento no incluye reparaciones ni repuestos.",
		"Formateo con 50% de descuento si se realiza junto con el mantenimiento.",
	],
	faqs: [
		{
			question: "¿Cuánto cuesta el mantenimiento de una laptop o PC?",
			answer:
				"Una laptop o PC simple cuesta S/90 en taller o S/120 a domicilio. Una laptop gamer o PC compleja cuesta S/120 en taller o S/150 a domicilio. La atención a domicilio requiere coordinación previa.",
			tags: ["servicio-tecnico"],
		},
		{
			question: "¿Qué incluye el mantenimiento?",
			answer:
				"Incluye limpieza interna y externa, cambio de pasta térmica y pruebas básicas. En mantenimientos complejos también se incluyen pads térmicos estándar. El backup básico se realiza solo cuando el volumen y el estado del equipo lo permiten.",
			tags: ["servicio-tecnico"],
		},
		{
			question: "¿Cada cuánto tiempo conviene hacer mantenimiento?",
			answer:
				"Recomendamos mantenimiento preventivo cada 6 a 12 meses, según el uso y el ambiente. Si el equipo se usa en espacios con polvo o mascotas, puede necesitar mantenimiento más frecuente.",
			tags: ["servicio-tecnico"],
		},
		{
			question: "¿El mantenimiento incluye reparaciones o repuestos?",
			answer:
				"No. Las reparaciones se derivan a taller y se cotizan después de evaluar el equipo. Los repuestos y las licencias se cotizan por separado.",
			tags: ["servicio-tecnico"],
		},
		{
			question: "¿El diagnóstico avanzado tiene costo?",
			answer:
				"La revisión básica está incluida en el servicio. Si el equipo requiere evaluación avanzada de placa, cuesta S/60 y se acredita al servicio. Antes de intervenir te explicamos el alcance y la cotización.",
			tags: ["servicio-tecnico"],
		},
		{
			question: "¿Puedo elegir entre atención en taller y a domicilio?",
			answer:
				"Sí. Atendemos en taller en Av. Goyeneche 1602, Miraflores, y también a domicilio con coordinación previa. El servicio a domicilio suma S/30 a la tarifa de taller.",
			tags: ["servicio-tecnico"],
		},
		{
			question: "¿Qué métodos de pago aceptan?",
			answer: "Aceptamos Yape y Plin. Coordinamos el pago al confirmar el servicio.",
			tags: ["servicio-tecnico"],
		},
	] satisfies ServicioTecnicoFaq[],
} as const;
