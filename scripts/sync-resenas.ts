/**
 * Sincroniza las reseñas aprobadas de D1 con el artefacto estático que consumen
 * la página `/resenas/` y el componente `ReviewsSection`.
 *
 * Uso:
 *   bun run resenas:sync              # D1 remota (producción)
 *   bun run resenas:sync -- --local   # D1 local (desarrollo)
 *
 * Pasos:
 *   1. SELECT de aprobadas (`scripts/sql/resenas-aprobadas.sql`) con wrangler.
 *   2. Validación con el esquema Valibot de `src/lib/resenas/public.ts`. Si
 *      falla, NO se escribe nada y el script sale con código 1.
 *   3. Escritura atómica de `src/data/resenas.generated.ts` (tmp + rename).
 *   4. Marcado de `publicado_en` en D1 para los ids publicados. Es best-effort:
 *      si falla, solo se avisa porque el artefacto ya quedó escrito.
 */

import { rename } from "node:fs/promises";
import { join } from "node:path";
import * as v from "valibot";
import { parseResenasExport, type ResenaPublica } from "@/lib/resenas/public";

const ROOT = join(import.meta.dir, "..");
const SQL_FILE = join(import.meta.dir, "sql", "resenas-aprobadas.sql");
const OUT_FILE = join(ROOT, "src", "data", "resenas.generated.ts");
const DB_NAME = "renovabit-landing-db";
const WRANGLER = Bun.which("wrangler") ?? "";

const GENERATED_HEADER = [
	"// GENERATED por bun run resenas:sync, no editar a mano.",
	'// Fuente: tabla `resenas` de D1 (estado = "aprobada").',
	"// Orden determinístico por id ASC; sin marcas de tiempo para que el diff sea mínimo.",
	"",
	'import type { ResenaPublica } from "@/lib/resenas/public";',
].join("\n");

/** La opción `--local` es la única que se interpreta; sin ella se usa la D1 remota. */
const local = process.argv.includes("--local");
const localArgs = local ? ["--local"] : [];
const target = local ? "D1 local" : "D1 remota";

interface WranglerResult {
	exitCode: number;
	stdout: string;
	stderr: string;
}

async function runWrangler(args: string[]): Promise<WranglerResult> {
	const proc = Bun.spawn({
		cmd: [WRANGLER, ...args],
		stdout: "pipe",
		stderr: "pipe",
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	return { exitCode, stdout, stderr };
}

function jsonLiteral(value: string | null): string {
	return value === null ? "null" : JSON.stringify(value);
}

function serializeResena(resena: ResenaPublica): string {
	return [
		"\t{",
		`\t\tid: ${resena.id},`,
		`\t\tnombrePublico: ${jsonLiteral(resena.nombrePublico)},`,
		`\t\tempresa: ${jsonLiteral(resena.empresa)},`,
		`\t\tservicio: ${jsonLiteral(resena.servicio)},`,
		`\t\tservicioId: ${jsonLiteral(resena.servicioId)},`,
		`\t\testrellas: ${resena.estrellas},`,
		`\t\tcomentario: ${jsonLiteral(resena.comentario)},`,
		`\t\tfecha: ${jsonLiteral(resena.fecha)},`,
		`\t\tfotoKey: ${jsonLiteral(resena.fotoKey)},`,
		"\t},",
	].join("\n");
}

function renderArtefacto(resenas: readonly ResenaPublica[]): string {
	const body =
		resenas.length === 0
			? "export const resenasPublicas: ResenaPublica[] = [];"
			: `export const resenasPublicas: ResenaPublica[] = [\n${resenas
					.map(serializeResena)
					.join("\n")}\n];`;
	return `${GENERATED_HEADER}\n\n${body}\n`;
}

/** Escritura atómica: si el proceso muere a mitad, el artefacto anterior queda intacto. */
async function writeAtomic(path: string, content: string): Promise<void> {
	const tmp = `${path}.tmp`;
	await Bun.write(tmp, content);
	await rename(tmp, path);
}

function printValidationIssues(issues: readonly v.BaseIssue<unknown>[]): void {
	console.error("La salida de wrangler no tiene el formato esperado:");
	for (const issue of issues) {
		const path = issue.path?.map((item) => String(item.key)).join(".") || "(raíz)";
		console.error(`  - ${path}: ${issue.message}`);
	}
}

async function main(): Promise<void> {
	if (!WRANGLER) {
		console.error(
			"No se encontró `wrangler` en el PATH. Ejecuta `bun install` e inténtalo otra vez.",
		);
		process.exit(1);
	}

	console.log(`Sincronizando reseñas aprobadas (${target})...`);

	const select = await runWrangler([
		"d1",
		"execute",
		DB_NAME,
		"--json",
		...localArgs,
		"--file",
		SQL_FILE,
	]);
	if (select.exitCode !== 0) {
		console.error("`wrangler d1 execute` falló al leer las reseñas aprobadas:");
		console.error(select.stderr.trim() || select.stdout.trim() || "(sin detalle)");
		process.exit(1);
	}

	let payload: unknown;
	try {
		payload = JSON.parse(select.stdout);
	} catch {
		console.error("No se pudo interpretar la salida JSON de wrangler:");
		console.error(select.stdout.slice(0, 2000) || "(vacía)");
		process.exit(1);
	}

	let resenas: ResenaPublica[];
	try {
		resenas = parseResenasExport(payload);
	} catch (error) {
		if (v.isValiError(error)) printValidationIssues(error.issues);
		else console.error("No se pudo validar la salida de wrangler.", error);
		console.error("No se escribió ningún archivo.");
		process.exit(1);
	}

	await writeAtomic(OUT_FILE, renderArtefacto(resenas));
	console.log(
		resenas.length === 0
			? "No hay reseñas aprobadas: `src/data/resenas.generated.ts` queda vacío."
			: `Publicadas ${resenas.length} reseña(s) en src/data/resenas.generated.ts (ids: ${resenas
					.map((resena) => resena.id)
					.join(", ")}).`,
	);

	const ids = resenas.map((resena) => resena.id);
	if (ids.length === 0) return;

	const sql = `UPDATE resenas SET publicado_en = unixepoch() WHERE estado = 'aprobada' AND publicado_en IS NULL AND id IN (${ids.join(", ")});`;
	const update = await runWrangler([
		"d1",
		"execute",
		DB_NAME,
		"--json",
		...localArgs,
		"--command",
		sql,
	]);
	if (update.exitCode !== 0) {
		console.warn(
			"Aviso: no se pudo marcar `publicado_en` en D1. El artefacto ya quedó escrito; vuelve a ejecutar el sync para reintentarlo.",
		);
		console.warn(update.stderr.trim() || update.stdout.trim() || "(sin detalle)");
		return;
	}
	console.log(`publicado_en marcado para ${ids.length} reseña(s).`);
}

await main();
