import { render } from "svelte/server";
import { getPost, getPosts } from "$lib/posts";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "$lib/site";

export const prerender = true;

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Make root-relative links and images absolute so feed readers can follow them. */
const absolutise = (html: string) => html.replace(/(href|src)="\//g, `$1="${SITE_URL}/`);

export function GET() {
  const items = getPosts()
    .map((post) => {
      const content = absolutise(render(getPost(post.slug)!.content).body);
      const link = `${SITE_URL}/blog/${post.slug}`;
      return `    <item>
      <title>${escape(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escape(post.description)}</description>
      <pubDate>${new Date(post.pubDate).toUTCString()}</pubDate>
      <content:encoded><![CDATA[${content.replace(/]]>/g, "]]]]><![CDATA[>")}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escape(SITE_TITLE)}</title>
    <description>${escape(SITE_DESCRIPTION)}</description>
    <link>${SITE_URL}/</link>
${items}
  </channel>
</rss>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
