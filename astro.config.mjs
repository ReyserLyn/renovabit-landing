// @ts-check

import cloudflare from "@astrojs/cloudflare";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

export default defineConfig({
	site: "https://renovabit.com",
	server: { port: 3000 },
	compressHTML: "jsx",

	integrations: [
		icon({
			include: {
				hugeicons: ["*"],
			},
		}),
		sitemap({}),
		preact(),
	],

	vite: {
		plugins: [tailwindcss()],
	},

	adapter: cloudflare(),
});
