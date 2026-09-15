/**
 * Atribución de origen del formulario de contacto.
 *
 * Las páginas de alta intención enlazan a `/contacto/?desde=<ruta>`; la isla
 * traduce ese parámetro al campo `origen` del correo y al evento de Umami.
 *
 * No confundir con `origin.ts`, que valida la cabecera HTTP `Origin`.
 */

/** Largo máximo aceptado para el valor de `desde`. */
export const MAX_DESDE_LENGTH = 120;

const INVALID_DESDE_CHARS = /[\s<>"'`\\]/;

/** Devuelve el `desde` válido del search o `null` si falta o no es una ruta simple. */
export function readDesde(search: string): string | null {
	const value = new URLSearchParams(search).get("desde")?.trim();
	if (!value) return null;
	if (value.length > MAX_DESDE_LENGTH) return null;
	if (!value.startsWith("/")) return null;
	if (INVALID_DESDE_CHARS.test(value)) return null;
	return value;
}

/**
 * Valor del campo `origen`:
 * - Con `desde` válido: "<desde> (formulario de contacto)".
 * - Sin `desde`: la ruta y el search actuales (comportamiento de siempre).
 */
export function buildContactOrigin(pathname: string, search: string): string {
	const desde = readDesde(search);
	return desde ? `${desde} (formulario de contacto)` : `${pathname}${search}`;
}
