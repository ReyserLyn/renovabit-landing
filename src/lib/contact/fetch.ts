/**
 * Firma mínima de `fetch` que consumen los módulos de contacto.
 *
 * Depender de esta interfaz (en vez de `typeof fetch`) mantiene los módulos
 * testeables: en producción se usa el `fetch` global y en tests una función
 * inyectada.
 */
export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
