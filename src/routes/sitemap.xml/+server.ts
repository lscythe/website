import { getPosts } from "$lib/posts";
import { SITE_URL } from "$lib/site";

export const prerender = true;

const PAGES = ["/", "/about", "/blog", "/projects", "/privacy-policy"];

export function GET() {
  const urls = [...PAGES, ...getPosts().map((post) => `/blog/${post.slug}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
