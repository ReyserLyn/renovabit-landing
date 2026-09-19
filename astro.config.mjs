// @ts-check

import fs from "node:fs";
import cloudflare from "@astrojs/cloudflare";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import seoGraph from "@jdevalk/astro-seo-graph/integration";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";
import icon from "astro-icon";
import llms from "astro-llms-md";
import { readGitLastmod } from "./src/lib/seo/sitemap-lastmod";

/**
 * Lee la fecha de cada post del blog (updatedDate o publishDate) desde el
 * frontmatter para usarla como `lastmod` en el sitemap. Si el directorio no
 * existe o el archivo no tiene fecha, el post queda sin `lastmod`.
 */
function readBlogLastmods() {
	const lastmods = new Map();
	try {
		const dir = new URL("./src/content/blog/", import.meta.url);
		for (const entry of fs.readdirSync(dir)) {
			if (!entry.endsWith(".md")) continue;
			const raw = fs.readFileSync(new URL(entry, dir), "utf8");
			const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
			if (!frontmatter) continue;
			const updated = frontmatter[1].match(/^updatedDate:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
			const published = frontmatter[1].match(/^publishDate:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
			const date = updated?.[1] ?? published?.[1];
			if (date) lastmods.set(`/blog/${entry.slice(0, -3)}/`, date);
		}
	} catch {
		// Sin directorio de blog: el sitemap se genera sin `lastmod`.
	}
	return lastmods;
}

const blogLastmods = readBlogLastmods();

export default defineConfig({
	site: "https://renovabit.com",
	server: { port: 4321 },
	compressHTML: "jsx",

	// Precarga nativa de enlaces internos: al entrar en el viewport, Astro
	// descarga la página para que la navegación se sienta instantánea. Sin
	// dependencias adicionales; respeta ahorro de datos y conexiones lentas.
	prefetch: {
		prefetchAll: true,
		defaultStrategy: "viewport",
	},

	// La validación de origen del formulario de contacto vive en
	// `src/lib/contact/origin.ts` y decide el contrato de respuesta del endpoint
	// (403 `verificacion`). Se desactiva la comprobación global de Astro para no
	// duplicarla y para permitir clientes sin cabecera `Origin` (curl, formularios
	// sin JavaScript), que sí cubren Turnstile y el límite de envíos.
	security: {
		checkOrigin: false,
	},

	env: {
		schema: {
			// Secrets del formulario de contacto: se leen en runtime con
			// `astro:env/server` (en producción se cargan con `wrangler secret put`).
			RESEND_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
			TURNSTILE_SECRET_KEY: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			CONTACT_INBOX: envField.string({ context: "server", access: "secret", optional: true }),
			CONTACT_DEV_SIMULATE_EMAIL: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			// Sitekey pública de Turnstile. Es variable de BUILD: cambiarla exige
			// reconstruir el sitio. El default es la sitekey real del widget, así
			// ningún build (Workers Builds incluido, que no lee `.env`) despliega
			// los formularios en modo degradado; una env var la sobrescribe.
			PUBLIC_TURNSTILE_SITE_KEY: envField.string({
				context: "client",
				access: "public",
				optional: true,
				default: "0x4AAAAAAE2wDF4mconZF9uY",
			}),
		},
	},

	fonts: [
		{
			provider: fontProviders.local(),
			name: "Satoshi",
			cssVariable: "--font-satoshi",
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/satoshi/Satoshi-Regular.woff2"],
						weight: "400",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/satoshi/Satoshi-Medium.woff2"],
						weight: "500",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/satoshi/Satoshi-Bold.woff2"],
						weight: "700",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/satoshi/Satoshi-Black.woff2"],
						weight: "900",
						style: "normal",
					},
				],
			},
		},
	],

	integrations: [
		icon({
			include: {
				hugeicons: ["*"],
			},
		}),
		sitemap({
			// Las páginas temporales de `/dev/`, la página de acción `/resena/`
			// (noindex), los materiales internos `/qr/` y el panel admin
			// (`/admin/`, detrás de Access) no entran al sitemap. `/resenas/` sí entra.
			filter: (page) =>
				!page.includes("/dev/") &&
				!page.includes("/resena/") &&
				!page.includes("/qr/") &&
				!page.includes("/admin/"),
			serialize(item) {
				const pathname = new URL(item.url).pathname;
				// Los posts conservan la fecha de su frontmatter; el resto se completa
				// con la fecha del último commit que tocó sus archivos fuente.
				const lastmod = blogLastmods.get(pathname) ?? readGitLastmod(pathname);
				if (lastmod) item.lastmod = lastmod instanceof Date ? lastmod.toISOString() : lastmod;
				return item;
			},
		}),
		seoGraph({
			validateH1: true,
			validateImageAlt: true,
			validateMetadataLength: true,
			// El panel admin y los previews de correos son rutas on-demand (SSR):
			// no existen como HTML en el build y no son enlaces rotos.
			validateInternalLinks: {
				skip: (href) =>
					href.startsWith("/admin/") ||
					href.startsWith("https://renovabit.com/admin/") ||
					href.startsWith("/dev/") ||
					href.startsWith("https://renovabit.com/dev/"),
			},
		}),
		preact(),
		llms({
			name: "RenovaBit",
			description:
				"Servicio técnico de laptops y PCs en Arequipa. Reparación a domicilio, mantenimiento preventivo, desarrollo web, venta de componentes y reparaciones especializadas.",
			generateLlmsTxt: false,
			generateLlmsFullTxt: true,
			generateIndividualMd: true,
			// El panel admin es SSR y queda detrás de Access, y `/qr/` es una
			// página de materiales internos: ninguna se incluye en los artefactos
			// para LLMs.
			exclude: ["admin", "qr"],
			excludeSelectors: ["nav", "aside", "footer", "form", ".sr-only", "[aria-hidden='true']"],
		}),
	],

	vite: {
		plugins: [tailwindcss()],
	},

	adapter: cloudflare({
		prerenderEnvironment: "node",
	}),
});
