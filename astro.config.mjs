// @ts-check

import cloudflare from "@astrojs/cloudflare";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import icon from "astro-icon";

export default defineConfig({
	site: "https://renovabit.com",
	server: { port: 3000 },
	compressHTML: "jsx",

	fonts: [
		{
			provider: fontProviders.local(),
			name: "Inter",
			cssVariable: "--font-inter",
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/inter/inter-v20-latin-regular.woff2"],
						weight: "400",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/inter/inter-v20-latin-italic.woff2"],
						weight: "400",
						style: "italic",
					},
					{
						src: ["./src/assets/fonts/inter/inter-v20-latin-500.woff2"],
						weight: "500",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/inter/inter-v20-latin-600.woff2"],
						weight: "600",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/inter/inter-v20-latin-600italic.woff2"],
						weight: "600",
						style: "italic",
					},
					{
						src: ["./src/assets/fonts/inter/inter-v20-latin-700.woff2"],
						weight: "700",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/inter/inter-v20-latin-700italic.woff2"],
						weight: "700",
						style: "italic",
					},
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: "Manrope",
			cssVariable: "--font-manrope",
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/manrope/manrope-v20-latin-500.woff2"],
						weight: "500",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/manrope/manrope-v20-latin-600.woff2"],
						weight: "600",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/manrope/manrope-v20-latin-700.woff2"],
						weight: "700",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/manrope/manrope-v20-latin-800.woff2"],
						weight: "800",
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
		sitemap({}),
		preact(),
	],

	vite: {
		plugins: [tailwindcss()],
	},

	adapter: cloudflare(),
});
