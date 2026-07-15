// @ts-check

import cloudflare from "@astrojs/cloudflare";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import seoGraph from "@jdevalk/astro-seo-graph/integration";
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
						src: ["./src/assets/fonts/satoshi/Satoshi-Italic.woff2"],
						weight: "400",
						style: "italic",
					},
					{
						src: ["./src/assets/fonts/satoshi/Satoshi-Medium.woff2"],
						weight: "500",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/satoshi/Satoshi-MediumItalic.woff2"],
						weight: "500",
						style: "italic",
					},
					{
						src: ["./src/assets/fonts/satoshi/Satoshi-Bold.woff2"],
						weight: "700",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/satoshi/Satoshi-BoldItalic.woff2"],
						weight: "700",
						style: "italic",
					},
					{
						src: ["./src/assets/fonts/satoshi/Satoshi-Black.woff2"],
						weight: "900",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/satoshi/Satoshi-BlackItalic.woff2"],
						weight: "900",
						style: "italic",
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
		seoGraph({
			validateH1: true,
			validateImageAlt: true,
			validateMetadataLength: true,
			validateInternalLinks: true,
		}),
		preact(),
	],

	vite: {
		plugins: [tailwindcss()],
	},

	adapter: cloudflare({
		prerenderEnvironment: "node",
	}),
});
