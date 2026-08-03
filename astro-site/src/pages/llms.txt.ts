import { getSiteSettings, getPublishedDocs } from '../lib/serverApi';

export async function GET() {
  let settings = null;
  try {
    settings = await getSiteSettings();
  } catch (e) {
    console.error('Failed to fetch settings for llms.txt:', e);
  }

  const siteName = settings?.site_name || 'entrepreneurs.bd';
  
  // Fetch lists of active published content
  const posts = await getPublishedDocs('posts', 100);
  const profiles = await getPublishedDocs('profiles', 100);
  const listings = await getPublishedDocs('listings', 100);
  const knowledge = await getPublishedDocs('knowledge', 100);

  // Retrieve configurable intro from settings (or use fallback)
  const introText = settings?.llms_txt_intro || `Welcome to ${siteName}. We are a trusted ecosystem platform offering startup directories, founder profiles, business resources, guides, and updates.`;

  let body = `# ${siteName}\n\n${introText}\n\n`;

  body += `## Main Endpoints\n`;
  body += `- [Home](https://entrepreneurs.bd/index.md)\n`;
  body += `- [About](https://entrepreneurs.bd/about.md)\n`;
  body += `- [Contact](https://entrepreneurs.bd/contact.md)\n\n`;

  if (settings?.index_blog !== false && posts.length > 0) {
    body += `## Blog Posts\n`;
    posts.forEach((p: any) => {
      if (p.slug) body += `- [${p.title}](https://entrepreneurs.bd/blog/${p.slug}.md)\n`;
    });
    body += `\n`;
  }

  if (settings?.index_entrepreneurs !== false && profiles.length > 0) {
    body += `## Entrepreneurs & Founders\n`;
    profiles.forEach((p: any) => {
      if (p.slug) body += `- [${p.name}](https://entrepreneurs.bd/entrepreneurs/${p.slug}.md)\n`;
    });
    body += `\n`;
  }

  if (settings?.index_directory !== false && listings.length > 0) {
    body += `## Startup & Business Directory\n`;
    listings.forEach((l: any) => {
      if (l.slug) body += `- [${l.title}](https://entrepreneurs.bd/directory/${l.slug}.md)\n`;
    });
    body += `\n`;
  }

  if (settings?.index_knowledge !== false && knowledge.length > 0) {
    body += `## Knowledge & Guides\n`;
    knowledge.forEach((k: any) => {
      if (k.slug) body += `- [${k.title}](https://entrepreneurs.bd/knowledge/${k.slug}.md)\n`;
    });
  }

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
