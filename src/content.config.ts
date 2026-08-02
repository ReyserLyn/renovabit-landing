import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blogCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			publishDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image(),
			tags: z.array(z.string()).default([]),
			featured: z.boolean().default(false),
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog: blogCollection };
