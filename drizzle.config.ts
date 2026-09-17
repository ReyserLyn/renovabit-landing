import { defineConfig } from "drizzle-kit";

/**
 * Configuracion de Drizzle Kit solo para generar migraciones SQL.
 *
 * Sin `dbCredentials`: las migraciones se aplican con Wrangler
 * (`bun run db:migrate:local` / `bun run db:migrate:remote`), que es quien
 * conoce la D1 local y la remota. `drizzle-kit push` no se usa en este repo.
 */
export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	out: "./migrations",
});
