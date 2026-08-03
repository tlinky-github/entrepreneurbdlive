import { getDocBySlug, getPublishedDocs, getSiteSettings, getDocById } from '../lib/serverApi';

export async function GET({ params, url }: { params: any, url: any }) {
  const { path } = params;
  
  // 1. Identify content type and slug from catch-all path
  // Expected formats: 
  // - "index" or undefined (Homepage)
  // - "blog/some-slug" (Blog post)
  // - "entrepreneurs/some-slug" (Founder profile)
  // - "directory/some-slug" (Startup directory listing)
  // - "knowledge/some-slug" or "resources/some-slug" (Resource Guides)
  // - "about", "contact", "terms" (Static site pages)
  
  let content = '';
  let title = '';
  let metadata: Record<string, any> = {};

  try {
    // Slice off trailing '.md' if present in requested URL path
    const cleanPath = path && path.endsWith('.md') ? path.slice(0, -3) : path;
    const settings = await getSiteSettings();

    if (!cleanPath || cleanPath === 'index') {
      // --- HOMEPAGE MD ---
      title = settings?.site_name || 'Entrepreneurs BD';
      content = `
# ${title}
${settings?.site_tagline || 'Bangladesh Entrepreneur Ecosystem'}

Welcome to ${title}. We offer educational resources, practical insights, business guides, and startup profiles.

## Dynamic Links
- Dynamic LLM Sitemap: /llms.txt
- Robots Config: /robots.txt
      `.trim();
    } else {
      const parts = cleanPath.split('/');
      console.log('[.md Endpoint Debug] split parts:', parts);
      
      if (parts.length === 2) {
        const [collection, slug] = parts;
        console.log('[.md Endpoint Debug] collection:', collection, 'slug:', slug);
        
        if (collection === 'blog') {
          if (settings?.index_blog === false) {
            return new Response('Blog indexing is disabled', { status: 403 });
          }
          const post = await getDocBySlug('posts', slug);
          console.log('[.md Endpoint Debug] Found post:', post ? post.title : 'None');
          if (post) {
            title = post.title;
            content = `# ${post.title}\n\n${post.excerpt ? `> ${post.excerpt}\n\n` : ''}${stripHtmlTags(post.content_html || post.content || '')}`;
            metadata = {
              author: post.author_name,
              category: post.category_name,
              published_at: post.created_at || post.published_at
            };
          }
        } else if (collection === 'entrepreneurs') {
          if (settings?.index_entrepreneurs === false) {
            return new Response('Entrepreneurs indexing is disabled', { status: 403 });
          }
          const profile = await getDocBySlug('profiles', slug);
          if (profile) {
            title = profile.name;
            content = `# ${profile.name}\n\n${profile.designation || 'Founder'}\n\n${stripHtmlTags(profile.bio || profile.description || '')}`;
            metadata = {
              company: profile.company_name,
              industry: profile.industry
            };
          }
        } else if (collection === 'directory') {
          if (settings?.index_directory === false) {
            return new Response('Directory indexing is disabled', { status: 403 });
          }
          const listing = await getDocBySlug('listings', slug);
          if (listing) {
            title = listing.title;
            content = `# ${listing.title}\n\n${listing.tagline ? `*${listing.tagline}*\n\n` : ''}${stripHtmlTags(listing.description || '')}`;
            metadata = {
              category: listing.category_name,
              location: listing.location,
              website: listing.website
            };
          }
        } else if (collection === 'resources' || collection === 'knowledge') {
          if (settings?.index_knowledge === false) {
            return new Response('Knowledge indexing is disabled', { status: 403 });
          }
          let doc = await getDocBySlug('knowledge', slug);
          if (!doc) doc = await getDocBySlug('resources', slug);
          if (doc) {
            title = doc.title;
            content = `# ${doc.title}\n\n${stripHtmlTags(doc.content_html || doc.content || '')}`;
          }
        }
      } else if (parts.length === 1) {
        const pageSlug = parts[0];
        
        if (pageSlug === 'entrepreneurs') {
          if (settings?.index_entrepreneurs === false) {
            return new Response('Entrepreneurs indexing is disabled', { status: 403 });
          }
          // Dynamic list of entrepreneurs
          const profiles = await getPublishedDocs('profiles', 100);
          title = 'Entrepreneurs';
          content = `# ${title}\n\nList of published entrepreneur profiles:\n\n` + 
            profiles.map((p: any) => `- [${p.name}](https://entrepreneurs.bd/entrepreneurs/${p.slug}.md)${p.designation ? ` - ${p.designation}` : ''}`).join('\n');
        } else if (pageSlug === 'directory') {
          if (settings?.index_directory === false) {
            return new Response('Directory indexing is disabled', { status: 403 });
          }
          // Dynamic list of startup directory
          const listings = await getPublishedDocs('listings', 100);
          title = 'Startup & Business Directory';
          content = `# ${title}\n\nList of startup directory listings:\n\n` + 
            listings.map((l: any) => `- [${l.title}](https://entrepreneurs.bd/directory/${l.slug}.md)${l.tagline ? ` - *${l.tagline}*` : ''}`).join('\n');
        } else if (pageSlug === 'blog') {
          if (settings?.index_blog === false) {
            return new Response('Blog indexing is disabled', { status: 403 });
          }
          // Dynamic list of blog articles
          const posts = await getPublishedDocs('posts', 100);
          title = 'Blog Posts';
          content = `# ${title}\n\nList of published blog articles:\n\n` + 
            posts.map((p: any) => `- [${p.title}](https://entrepreneurs.bd/blog/${p.slug}.md)`).join('\n');
        } else if (pageSlug === 'knowledge' || pageSlug === 'resources') {
          if (settings?.index_knowledge === false) {
            return new Response('Knowledge indexing is disabled', { status: 403 });
          }
          // Dynamic list of guides
          const docs = await getPublishedDocs('knowledge', 100);
          title = 'Knowledge Base & Guides';
          content = `# ${title}\n\nList of guides:\n\n` + 
            docs.map((k: any) => `- [${k.title}](https://entrepreneurs.bd/knowledge/${k.slug}.md)`).join('\n');
        } else {
          // Static page lookup
          const page = await getDocBySlug('pages', pageSlug);
          if (page) {
            title = page.title;
            content = `# ${page.title}\n\n${stripHtmlTags(page.content_html || page.content || '')}`;
          } else {
            // Dynamic fallback for custom pages
            title = pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1);
            content = `# ${title}\n\nDynamic raw markdown endpoint for the ${title} page.`;
          }
        }
      }
    }
  } catch (err: any) {
    return new Response(`Error generating markdown: ${err.message}`, { status: 500 });
  }

  if (!content) {
    return new Response('Content not found', { status: 404 });
  }

  // Format final AI markdown file payload
  let markdownPayload = '';
  if (Object.keys(metadata).length > 0) {
    markdownPayload += `---\n`;
    for (const [key, value] of Object.entries(metadata)) {
      if (value) markdownPayload += `${key}: "${String(value).replace(/"/g, '\\"')}"\n`;
    }
    markdownPayload += `---\n\n`;
  }
  markdownPayload += content;

  return new Response(markdownPayload, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
