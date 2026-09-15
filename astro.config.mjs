// @ts-check

import fs from "node:fs";
import cloudflare from "@astrojs/cloudflare";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import seoGraph from "@jdevalk/astro-seo-graph/integration";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import icon from "astro-icon";
import llms from "astro-llms-md";

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
	server: { port: 3000 },
	compressHTML: "jsx",

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
			serialize(item) {
				const lastmod = blogLastmods.get(new URL(item.url).pathname);
				if (lastmod) item.lastmod = lastmod;
				return item;
			},
		}),
		seoGraph({
			validateH1: true,
			validateImageAlt: true,
			validateMetadataLength: true,
			validateInternalLinks: true,
		}),
		preact(),
		llms({
			name: "RenovaBit",
			description:
				"Servicio técnico de laptops y PCs en Arequipa. Reparación a domicilio, mantenimiento preventivo, desarrollo web, venta de componentes y reparaciones especializadas.",
			generateLlmsTxt: false,
			generateLlmsFullTxt: true,
			generateIndividualMd: true,
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
