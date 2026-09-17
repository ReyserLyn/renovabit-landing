import { gitLastmod } from "@jdevalk/astro-seo-graph";

/**
 * Mapa explícito URL→archivos fuente para completar el `lastmod` del sitemap con
 * la fecha del último commit que tocó cada página (`gitLastmod`). En rutas
 * dinámicas se incluyen el archivo de ruta y los datos que la alimentan: se usa
 * la fecha más reciente. Si git no está disponible, el archivo no tiene commits
 * o la URL no está en el mapa, la página queda sin `lastmod` (no se inventan
 * fechas).
 */
const gitLastmodSources: Record<string, string[]> = {
	"/": ["src/pages/index.astro", "src/components/sections/services.astro", "src/data/faq.ts"],
	"/blog/": ["src/pages/blog/index.astro"],
	"/blog/cada-cuanto-hacer-mantenimiento-laptop/": [
		"src/content/blog/cada-cuanto-hacer-mantenimiento-laptop.md",
	],
	"/blog/senales-pc-necesita-mantenimiento/": [
		"src/content/blog/senales-pc-necesita-mantenimiento.md",
	],
	"/contacto/": ["src/pages/contacto.astro"],
	"/cookies/": ["src/pages/cookies.astro", "src/data/legal.ts"],
	"/laptop-lenta-arequipa/": [
		"src/pages/laptop-lenta-arequipa.astro",
		"src/data/landings.ts",
		"src/data/faq.ts",
	],
	"/mantenimiento-pc-domicilio-arequipa/": [
		"src/pages/mantenimiento-pc-domicilio-arequipa.astro",
		"src/data/faq.ts",
		"src/data/servicio-tecnico.ts",
	],
	"/nosotros/": ["src/pages/nosotros.astro"],
	"/privacidad/": ["src/pages/privacidad.astro", "src/data/legal.ts"],
	"/reparacion-laptops-arequipa/": [
		"src/pages/reparacion-laptops-arequipa.astro",
		"src/data/faq.ts",
	],
	"/resenas/": ["src/pages/resenas/index.astro", "src/data/resenas.generated.ts"],
	"/servicios/": ["src/pages/servicios.astro", "src/data/servicios.ts"],
	"/servicios/desarrollo-web/": [
		"src/pages/servicios/[slug].astro",
		"src/data/servicios.ts",
		"src/components/services/slug/DesarrolloWebContent.astro",
		"src/data/faq.ts",
	],
	"/servicios/reparaciones-especializadas/": [
		"src/pages/servicios/[slug].astro",
		"src/data/servicios.ts",
		"src/components/services/slug/ReparacionesContent.astro",
		"src/data/faq.ts",
	],
	"/servicios/servicio-tecnico/": [
		"src/pages/servicios/[slug].astro",
		"src/data/servicios.ts",
		"src/components/services/slug/ServicioTecnicoContent.astro",
		"src/data/servicio-tecnico.ts",
	],
	"/servicios/tienda/": [
		"src/pages/servicios/[slug].astro",
		"src/data/servicios.ts",
		"src/components/services/slug/TiendaContent.astro",
		"src/data/faq.ts",
	],
	"/terminos/": ["src/pages/terminos.astro", "src/data/legal.ts"],
};

/**
 * Devuelve la fecha del commit más reciente que tocó alguno de los archivos
 * asociados a la URL, o `null` si ninguno tiene historial.
 */
export function readGitLastmod(pathname: string): Date | null {
	const files = gitLastmodSources[pathname];
	if (!files) return null;
	let latest: Date | null = null;
	for (const file of files) {
		const date = gitLastmod(file);
		if (date && (!latest || date > latest)) latest = date;
	}
	return latest;
}
