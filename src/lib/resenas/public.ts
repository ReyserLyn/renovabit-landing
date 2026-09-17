/**
 * Lógica pura del artefacto público de reseñas.
 *
 * `scripts/sync-resenas.ts` lee las reseñas aprobadas de D1, valida la salida de
 * Wrangler con `resenasExportSchema`, las convierte a `ResenaPublica` y las
 * escribe en `src/data/resenas.generated.ts`. La página `/resenas/` y el
 * componente `ReviewsSection` consumen ese artefacto en el build.
 *
 * Nada de este módulo toca D1, R2 ni el sistema de archivos: todo es testeable.
 * El único dato que se publica con nombre recortado es el de la persona
 * (`nombrePublico`); la foto queda en `fotoKey` pero no se publica todavía
 * porque su ruta es privada del panel (ver `docs/resenas.md`, F2).
 */

import * as v from "valibot";

/** Zona de Arequipa: UTC-5 fijo, sin horario de verano. */
const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

const MESES = [
	"enero",
	"febrero",
	"marzo",
	"abril",
	"mayo",
	"junio",
	"julio",
	"agosto",
	"septiembre",
	"octubre",
	"noviembre",
	"diciembre",
] as const;

/** Año 2100: cota superior razonable para `created_at` (segundos Unix). */
export const RESENA_EXPORT_MAX_UNIX = 4_102_444_800;

/** Reseña tal como la consumen las páginas públicas (artefacto generado). */
export interface ResenaPublica {
	id: number;
	/** Nombre recortado para publicar, por ejemplo "María G.". */
	nombrePublico: string;
	empresa: string | null;
	servicio: string;
	servicioId: string | null;
	estrellas: number;
	comentario: string;
	/** ISO 8601 en UTC, derivado de `created_at`. */
	fecha: string;
	fotoKey: string | null;
}

/**
 * Recorta el nombre para publicar: primer nombre más la inicial del segundo
 * ("María Fernanda Quispe" → "María F."). Si solo hay un nombre, se publica tal
 * cual. La inicial se sube a mayúscula.
 */
export function nombrePublico(nombre: string): string {
	const partes = nombre.trim().split(/\s+/).filter(Boolean);
	if (partes.length === 0) return "";
	if (partes.length === 1) return partes[0];
	const inicial = partes[1].charAt(0).toUpperCase();
	return `${partes[0]} ${inicial}.`;
}

/** Fecha "mes de año" con la zona de Arequipa, sin depender de ICU. */
export function formatFechaResena(fecha: string): string {
	const date = new Date(fecha);
	if (Number.isNaN(date.getTime())) return fecha;
	const lima = new Date(date.getTime() - LIMA_OFFSET_MS);
	return `${MESES[lima.getUTCMonth()]} de ${lima.getUTCFullYear()}`;
}

/** Fila de la tabla `resenas` tal como la exporta `wrangler d1 execute --json`. */
export const resenaExportRowSchema = v.object({
	id: v.pipe(v.number(), v.integer(), v.minValue(1)),
	created_at: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(RESENA_EXPORT_MAX_UNIX)),
	nombre: v.pipe(v.string(), v.minLength(1)),
	empresa: v.nullable(v.string()),
	servicio: v.pipe(v.string(), v.minLength(1)),
	servicio_id: v.nullable(v.string()),
	estrellas: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5)),
	comentario: v.pipe(v.string(), v.minLength(1)),
	foto_key: v.nullable(v.string()),
});

export type ResenaExportRow = v.InferOutput<typeof resenaExportRowSchema>;

/**
 * Envoltura que imprime `wrangler d1 execute --json`: un arreglo con un objeto
 * por base ejecutada. `success: true` es obligatorio: si Wrangler reporta un
 * error, el sync aborta sin escribir.
 */
export const resenasExportSchema = v.pipe(
	v.array(
		v.object({
			results: v.array(resenaExportRowSchema),
			success: v.literal(true),
		}),
	),
	v.minLength(1, "Wrangler no devolvió ningún resultado."),
);

/** Convierte una fila validada al formato público. */
export function toResenaPublica(row: ResenaExportRow): ResenaPublica {
	return {
		id: row.id,
		nombrePublico: nombrePublico(row.nombre),
		empresa: row.empresa,
		servicio: row.servicio,
		servicioId: row.servicio_id,
		estrellas: row.estrellas,
		comentario: row.comentario,
		fecha: new Date(row.created_at * 1000).toISOString(),
		fotoKey: row.foto_key,
	};
}

/**
 * Orden determinístico del artefacto: id ascendente. Las reseñas nuevas se
 * agregan al final, así el diff del archivo generado es mínimo.
 */
export function ordenarResenasPublicas(resenas: readonly ResenaPublica[]): ResenaPublica[] {
	return [...resenas].sort((a, b) => a.id - b.id);
}

/** Orden de presentación: la más reciente arriba; el id desempata. */
export function ordenarResenasPorFecha(resenas: readonly ResenaPublica[]): ResenaPublica[] {
	return [...resenas].sort((a, b) => {
		if (a.fecha === b.fecha) return b.id - a.id;
		return a.fecha < b.fecha ? 1 : -1;
	});
}

/**
 * Valida la salida completa de Wrangler y la convierte al artefacto público.
 * Lanza `ValiError` si el JSON no tiene la forma esperada; el script lo captura
 * y aborta sin escribir.
 */
export function parseResenasExport(json: unknown): ResenaPublica[] {
	const parsed = v.parse(resenasExportSchema, json);
	const rows = parsed.flatMap((item) => item.results);
	return ordenarResenasPublicas(rows.map(toResenaPublica));
}

export interface ResumenPublico {
	total: number;
	/** Promedio con un decimal; `null` si no hay reseñas. */
	promedio: number | null;
}

/** Estadísticas de la página `/resenas/`. */
export function calcularResumenPublico(resenas: readonly ResenaPublica[]): ResumenPublico {
	if (resenas.length === 0) return { total: 0, promedio: null };
	const suma = resenas.reduce((total, resena) => total + resena.estrellas, 0);
	return {
		total: resenas.length,
		promedio: Math.round((suma / resenas.length) * 10) / 10,
	};
}
