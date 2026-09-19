/**
 * Cliente Drizzle sobre el binding D1 (`DB`) del worker.
 *
 * `drizzle-orm/d1` recibe directamente el binding tipado como `D1Database`
 * (global que genera `wrangler types`). Nunca importar de `wrangler` en
 * runtime: ese paquete no existe dentro de workerd.
 */

import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/** Crea el cliente Drizzle a partir del binding `env.DB`. */
export function createDb(binding: D1Database) {
	return drizzle(binding, { schema });
}
