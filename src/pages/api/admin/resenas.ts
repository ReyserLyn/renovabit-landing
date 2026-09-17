/**
 * Endpoint POST-only del panel de reseñas.
 *
 * Recibe `application/x-www-form-urlencoded` desde los formularios del panel,
 * valida la acción con `@/lib/resenas/admin`, actualiza D1 y responde un
 * redirect 303 (patrón PRG) de vuelta al listado con el mensaje en `?ok=` o
 * `?error=`. Nunca se interpola SQL: todo pasa por el query builder de Drizzle.
 *
 * Defensa en profundidad: Access en producción (header fail-closed), validación
 * de origen (anti-CSRF) y límite de cuerpo. El panel sigue siendo la superficie
 * principal y Access la barrera real.
 */

import { env as workerEnv } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { createDb } from "@/db/client";
import { resenas } from "@/db/schema";
import { contactAllowedHosts, isAllowedOrigin } from "@/lib/contact/origin";
import {
	accesoPermitido,
	codigoOk,
	parseAdminAccion,
	parseFiltro,
	puedeTransicionar,
	type ResenaEstadoFiltro,
	siguienteEstado,
} from "@/lib/resenas/admin";
import { methodNotAllowedResponse } from "@/lib/resenas/respond";

export const prerender = false;

const PANEL_PATH = "/admin/resenas/";
const MAX_BODY_BYTES = 8 * 1024;

function noStoreHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return { ...extra, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
}

function plainResponse(status: number, message: string): Response {
	return new Response(message, {
		status,
		headers: noStoreHeaders({ "Content-Type": "text/plain; charset=utf-8" }),
	});
}

/** Vuelve al listado conservando el filtro y agregando `ok` o `error`. */
function redirectBack(filtro: ResenaEstadoFiltro, extra: Record<string, string>): Response {
	const params = new URLSearchParams({ estado: filtro, ...extra });
	return new Response(null, {
		status: 303,
		headers: noStoreHeaders({ Location: `${PANEL_PATH}?${params.toString()}` }),
	});
}

function logWarn(event: string): void {
	console.warn(JSON.stringify({ scope: "resenas-admin", event }));
}

function logError(event: string, error?: unknown): void {
	const payload = {
		scope: "resenas-admin",
		event,
		message: error instanceof Error ? error.message : error ? String(error) : undefined,
	};
	if (error === undefined) console.error(JSON.stringify(payload));
	else console.error(JSON.stringify(payload), error);
}

/**
 * Los formularios del panel siempre envían `Content-Length` con un cuerpo
 * diminuto. Un valor ausente o desmedido se rechaza sin parsear nada.
 */
function hasOversizedBody(request: Request): boolean {
	const raw = request.headers.get("content-length");
	if (raw === null) return true;
	const value = Number(raw);
	return !Number.isFinite(value) || value > MAX_BODY_BYTES;
}

export const POST: APIRoute = async ({ request }) => {
	try {
		if (!accesoPermitido(request.headers, import.meta.env.PROD)) {
			logWarn("access-denied");
			return plainResponse(403, "No autorizado.");
		}

		const origin = request.headers.get("origin");
		if (!isAllowedOrigin(origin, contactAllowedHosts(import.meta.env.PROD))) {
			logWarn(`origin-not-allowed:${origin ?? "(sin cabecera)"}`);
			return plainResponse(403, "No autorizado.");
		}

		if (hasOversizedBody(request)) {
			logWarn("payload-too-large");
			return plainResponse(413, "Solicitud demasiado grande.");
		}

		let formData: FormData;
		try {
			formData = await request.formData();
		} catch (error) {
			logError("invalid-form-data", error);
			return plainResponse(400, "Solicitud no válida.");
		}

		const filtro = parseFiltro(formData.get("estado"));
		const parsed = parseAdminAccion(formData.get("id"), formData.get("accion"));
		if (!parsed.ok) {
			logWarn(`invalid-action:${parsed.motivo}`);
			return redirectBack(filtro, { error: "accion" });
		}

		if (!workerEnv.DB) {
			logError("missing-db-binding");
			return plainResponse(500, "No se pudo actualizar la reseña.");
		}

		const db = createDb(workerEnv.DB);
		const fila = await db.select().from(resenas).where(eq(resenas.id, parsed.id)).get();
		if (!fila) {
			logWarn(`not-found:${parsed.id}`);
			return redirectBack(filtro, { error: "no-encontrada" });
		}

		if (parsed.accion === "descuento") {
			const nuevo = fila.descuento_otorgado === 1 ? 0 : 1;
			await db.update(resenas).set({ descuento_otorgado: nuevo }).where(eq(resenas.id, parsed.id));
			return redirectBack(filtro, { ok: codigoOk("descuento", nuevo === 1) });
		}

		if (!puedeTransicionar(fila.estado, parsed.accion)) {
			logWarn(`invalid-transition:${fila.estado}:${parsed.accion}`);
			return redirectBack(filtro, { error: "transicion" });
		}

		const siguiente = siguienteEstado(fila.estado, parsed.accion);
		if (!siguiente) {
			logWarn(`invalid-transition:${fila.estado}:${parsed.accion}`);
			return redirectBack(filtro, { error: "transicion" });
		}

		await db.update(resenas).set({ estado: siguiente }).where(eq(resenas.id, parsed.id));
		return redirectBack(filtro, { ok: codigoOk(parsed.accion) });
	} catch (error) {
		logError("unhandled", error);
		return plainResponse(500, "No se pudo procesar la solicitud.");
	}
};

export const ALL: APIRoute = () => methodNotAllowedResponse();
