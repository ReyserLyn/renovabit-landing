/**
 * Fuente única de los servicios que se pueden reseñar.
 *
 * Para agregar un servicio: añade una entrada a `RESENA_SERVICIOS` con un `id`
 * igual al slug de su página cuando exista (`src/data/servicios.ts` y las
 * landings); el formulario, el esquema y los correos se actualizan solos.
 */

export const RESENA_SERVICIOS = [
	{ id: "servicio-tecnico", label: "Servicio técnico" },
	{ id: "reparacion-laptops-arequipa", label: "Reparación de laptops" },
	{ id: "mantenimiento-pc-domicilio-arequipa", label: "Mantenimiento de PC a domicilio" },
	{ id: "laptop-lenta-arequipa", label: "Solución de laptop lenta" },
	{ id: "reparaciones-especializadas", label: "Reparaciones especializadas" },
	{ id: "tienda", label: "Tienda de componentes y equipos" },
	{ id: "desarrollo-web", label: "Desarrollo web" },
] as const satisfies readonly { id: string; label: string }[];

/** Opción de texto libre cuando el servicio recibido no está en la lista. */
export const RESENA_SERVICIO_OTRO = { id: "otro", label: "Otro" } as const;

/** Opciones del select, en el orden en que se muestran. */
export const RESENA_SERVICIO_OPTIONS = [...RESENA_SERVICIOS, RESENA_SERVICIO_OTRO];

export type ResenaServicioId = (typeof RESENA_SERVICIO_OPTIONS)[number]["id"];

/** Ids válidos del formulario (los consume el esquema Valibot). */
export const RESENA_SERVICIO_IDS = [
	...RESENA_SERVICIOS.map((servicio) => servicio.id),
	RESENA_SERVICIO_OTRO.id,
] as const;

export interface ResenaServicioOption {
	id: ResenaServicioId;
	label: string;
}

/** Devuelve la opción del servicio por id; `undefined` si no existe. */
export function getServicioById(id: string): ResenaServicioOption | undefined {
	return RESENA_SERVICIO_OPTIONS.find((option) => option.id === id);
}
