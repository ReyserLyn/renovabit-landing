// @ts-check

import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

import preact from "@astrojs/preact";

export default defineConfig({
    site: "https://renovabit.com",
    server: { port: 3000 },
    // Traditional HTML whitespace: spaces between inline elements are preserved.
    // Set to 'jsx' (Astro 7 default) if you prefer React-like collapsing.
    compressHTML: true,
    integrations: [icon({
        include: {
            hugeicons: ["*"],
        },
		}), sitemap({}), preact()],
    vite: {
        plugins: [tailwindcss()],
    },
});