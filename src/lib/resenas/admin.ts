/**
 * Lógica pura del panel de moderación de reseñas.
 *
 * La comparten la página del panel, el endpoint POST y la ruta de la foto. No
 * depende de D1, de Cloudflare ni de Astro, así que se puede testear con
 * `bun test`.
 *
 * La columna `estado` de D1 es texto libre (el esquema no declara enum), por eso
 * las funciones aceptan `string` y validan con `esEstadoResena` antes de operar.
 */

/** Estados válidos de una reseña. */
export const RESENA_ESTADOS = ["pendiente", "aprobada", "rechazada"] as const;

export type ResenaEstado = (typeof RESENA_ESTADOS)[number];

/** Acciones del panel sobre una reseña. */
export const RESENA_ADMIN_ACCIONES = ["aprobar", "rechazar", "descuento"] as const;

export type ResenaAdminAccion = (typeof RESENA_ADMIN_ACCIONES)[number];

/** Filtros del listado (`?estado=`). */
export const RESENA_ESTADO_FILTROS = ["pendiente", "aprobada", "rechazada", "todas"] as const;

export type ResenaEstadoFiltro = (typeof RESENA_ESTADO_FILTROS)[number];

/** Filtro por defecto del panel: la cola de moderación. */
export const RESENA_FILTRO_DEFAULT: ResenaEstadoFiltro = "pendiente";

/** Header que Cloudflare Access inyecta tras autenticar a la persona. */
export const ACCESS_EMAIL_HEADER = "cf-access-authenticated-user-email";

/**
 * Transiciones de estado válidas.
 *
 * `descuento` no aparece aquí: es un flag aparte (`descuento_otorgado`) que se
 * puede alternar en cualquier estado, no una transición.
 */
const TRANSICIONES: Record<ResenaEstado, Partial<Record<ResenaAdminAccion, ResenaEstado>>> = {
	pendiente: { aprobar: "aprobada", rechazar: "rechazada" },
	aprobada: { rechazar: "rechazada" },
	rechazada: { aprobar: "aprobada" },
};

export function esEstadoResena(value: unknown): value is ResenaEstado {
	return typeof value === "string" && (RESENA_ESTADOS as readonly string[]).includes(value);
}

export function esAdminAccion(value: unknown): value is ResenaAdminAccion {
	return typeof value === "string" && (RESENA_ADMIN_ACCIONES as readonly string[]).includes(value);
}

/** Normaliza el filtro del listado; cualquier valor raro cae al filtro por defecto. */
export function parseFiltro(value: unknown): ResenaEstadoFiltro {
	return typeof value === "string" && (RESENA_ESTADO_FILTROS as readonly string[]).includes(value)
		? (value as ResenaEstadoFiltro)
		: RESENA_FILTRO_DEFAULT;
}

/**
 * ¿La acción aprobar/rechazar cambia el estado? `descuento` devuelve `true`
 * porque siempre se puede alternar (no cambia el estado).
 */
export function puedeTransicionar(estado: string, accion: ResenaAdminAccion): boolean {
	if (accion === "descuento") return true;
	if (!esEstadoResena(estado)) return false;
	return TRANSICIONES[estado][accion] !== undefined;
}

/**
 * Estado resultante de aprobar/rechazar; `null` si la transición no es válida o
 * si la acción es `descuento` (que no toca el estado).
 */
export function siguienteEstado(estado: string, accion: ResenaAdminAccion): ResenaEstado | null {
	if (!esEstadoResena(estado)) return null;
	return TRANSICIONES[estado][accion] ?? null;
}

/** Código de `?ok=` que se muestra como mensaje de éxito tras la acción. */
export function codigoOk(accion: ResenaAdminAccion, descuentoActivo = false): string {
	if (accion === "aprobar") return "aprobada";
	if (accion === "rechazar") return "rechazada";
	return descuentoActivo ? "descuento" : "descuento-quitado";
}

export type ParseAdminAccionResult =
	| { ok: true; id: number; accion: ResenaAdminAccion }
	| { ok: false; motivo: "id" | "accion" };

/**
 * Valida la acción enviada por el formulario. El `id` debe ser un entero
 * positivo; la acción, una de las permitidas. Acepta los valores de `FormData`
 * (texto) sin asumir nada más.
 */
export function parseAdminAccion(idRaw: unknown, accionRaw: unknown): ParseAdminAccionResult {
	const id = typeof idRaw === "number" ? idRaw : Number(String(idRaw ?? "").trim());
	if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, motivo: "id" };
	if (!esAdminAccion(accionRaw)) return { ok: false, motivo: "accion" };
	return { ok: true, id, accion: accionRaw };
}

/**
 * Defensa en profundidad del panel.
 *
 * En producción exige el header que Access inyecta tras autenticar (fail-closed
 * si falta); fuera de producción se omite porque no hay Access y el panel solo
 * escucha en local. Access sigue siendo la barrera real en producción.
 */
export function accesoPermitido(headers: Headers, isProduction: boolean): boolean {
	if (!isProduction) return true;
	return (headers.get(ACCESS_EMAIL_HEADER) ?? "").trim().length > 0;
}

/** Campos mínimos de una fila para ordenar y calcular estadísticas. */
export interface ResenaAdminItem {
	estado: string;
	estrellas: number;
	created_at: Date;
	publicado_en: Date | null;
}

export function filtrarPorEstado<T extends { estado: string }>(
	items: readonly T[],
	filtro: ResenaEstadoFiltro,
): T[] {
	if (filtro === "todas") return [...items];
	return items.filter((item) => item.estado === filtro);
}

/** Pendientes primero; dentro de cada grupo, la más reciente arriba. */
export function ordenarResenasAdmin<T extends ResenaAdminItem>(items: readonly T[]): T[] {
	const prioridad = (item: T) => (item.estado === "pendiente" ? 0 : 1);
	return [...items].sort((a, b) => {
		const porEstado = prioridad(a) - prioridad(b);
		if (porEstado !== 0) return porEstado;
		return b.created_at.getTime() - a.created_at.getTime();
	});
}

export interface ResenasStats {
	total: number;
	pendientes: number;
	aprobadas: number;
	rechazadas: number;
	/** Aprobadas que todavía no entraron a `resenas.generated.ts` (sync pendiente). */
	aprobadasSinPublicar: number;
	/** Promedio con un decimal; `null` si no hay filas. */
	promedioEstrellas: number | null;
}

export function calcularStats(items: readonly ResenaAdminItem[]): ResenasStats {
	let pendientes = 0;
	let aprobadas = 0;
	let rechazadas = 0;
	let aprobadasSinPublicar = 0;
	let sumaEstrellas = 0;

	for (const item of items) {
		sumaEstrellas += item.estrellas;
		if (item.estado === "pendiente") {
			pendientes += 1;
		} else if (item.estado === "aprobada") {
			aprobadas += 1;
			if (!item.publicado_en) aprobadasSinPublicar += 1;
		} else if (item.estado === "rechazada") {
			rechazadas += 1;
		}
	}

	return {
		total: items.length,
		pendientes,
		aprobadas,
		rechazadas,
		aprobadasSinPublicar,
		promedioEstrellas:
			items.length > 0 ? Math.round((sumaEstrellas / items.length) * 10) / 10 : null,
	};
}

/**
 * Fecha y hora en zona de Arequipa (UTC-5 fijo, sin horario de verano), sin
 * depender de ICU para que el render sea idéntico en workerd y en Node.
 */
export function formatearFechaAdmin(date: Date): string {
	const lima = new Date(date.getTime() - 5 * 60 * 60 * 1000);
	const dia = String(lima.getUTCDate()).padStart(2, "0");
	const mes = String(lima.getUTCMonth() + 1).padStart(2, "0");
	const hora = String(lima.getUTCHours()).padStart(2, "0");
	const minuto = String(lima.getUTCMinutes()).padStart(2, "0");
	return `${dia}/${mes}/${lima.getUTCFullYear()} ${hora}:${minuto}`;
}
