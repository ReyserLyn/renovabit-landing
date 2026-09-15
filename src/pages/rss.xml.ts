import { getCollection, render } from "astro:content";
import rss from "@astrojs/rss";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { SITE } from "@/constants";

export async function GET() {
	const posts = await getCollection("blog", ({ data }) => !data.draft);
	const sorted = posts.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
	const container = await AstroContainer.create();

	const items = await Promise.all(
		sorted.map(async (post) => {
			const { Content } = await render(post);
			const content = await container.renderToString(Content);
			return {
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.publishDate,
				link: `/blog/${post.id}/`,
				content,
			};
		}),
	);

	return rss({
		title: `Blog de ${SITE.name}`,
		description: "Artículos sobre mantenimiento de laptops, reparación de PCs y tecnología.",
		site: SITE.url,
		items,
		customData: `<language>es-PE</language>`,
	});
}
