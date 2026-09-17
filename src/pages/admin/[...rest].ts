/**
 * Catch-all de `/admin/*` para las variantes escritas a mano de la URL del
 * panel (`/admin/reseñas`, `/admin/resena`, etc.).
 *
 * Las rutas con match propio (`/admin/resenas/`, `/admin/resenas/acciones`,
 * `/admin/resenas/foto/...`) tienen prioridad por ser más específicas y no
 * pasan por acá. Este endpoint vive bajo `/admin/` para quedar detrás de
 * Cloudflare Access en producción, igual que el panel.
 *
 * No se usa `public/_redirects`: al renderizar el Worker estos 404, el
 * fallback interno a assets no aplica reglas de redirect. Tampoco alcanza un
 * middleware: el de Astro no corre para rutas sin match, por eso hace falta
 * este catch-all (que sí matchea).
 */

import type { APIRoute } from "astro";
import { adminRedirectFor } from "@/lib/resenas/admin";

export const prerender = false;

function noEncontrado(): Response {
	return new Response("No encontrado.", {
		status: 404,
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"X-Robots-Tag": "noindex",
			"Cache-Control": "no-store",
		},
	});
}

export const GET: APIRoute = ({ url, redirect }) => {
	let pathname: string;
	try {
		pathname = decodeURI(url.pathname);
	} catch {
		return noEncontrado();
	}

	const target = adminRedirectFor(pathname.replace(/\/+$/, ""));
	if (target) {
		return redirect(target, 301);
	}
	return noEncontrado();
};

export const ALL: APIRoute = () => noEncontrado();
