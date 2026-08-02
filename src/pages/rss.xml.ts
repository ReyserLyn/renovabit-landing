import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE } from "@/constants";

export async function GET() {
	const posts = await getCollection("blog", ({ data }) => !data.draft);
	const sorted = posts.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());

	return rss({
		title: `${SITE.name} — Blog`,
		description: "Artículos sobre mantenimiento de laptops, reparación de PCs y tecnología.",
		site: SITE.url,
		items: sorted.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishDate,
			link: `/blog/${post.id}/`,
		})),
		customData: `<language>es-PE</language>`,
	});
}
