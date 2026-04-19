import { notFound } from 'next/navigation';
import { contentAPI } from '@/lib/api';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const res = await contentAPI.get(`/pages/${slug}`);
    const page = res.data;
    if (!page) return { title: "Page Not Found" };
    return {
      title: `${page.seoTitle || page.title} | Entrepreneurs BD`,
      description: page.metaDescription || "Official platform page for entrepreneurs.bd",
    };
  } catch (err) {
    return { title: "Error" };
  }
}

export default async function DynamicCustomPage({ params }) {
  const { slug } = await params;
  
  let page = null;
  try {
    const res = await contentAPI.get(`/pages/${slug}`);
    page = res.data;
  } catch (err) {
    console.error(`Dynamic page fetch failed for ${slug}:`, err);
  }

  if (!page) return notFound();

  // Schema Org for Custom Page
  const siteUrl = "https://entrepreneurs.bd";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": page.title,
    "description": page.metaDescription,
    "url": `${siteUrl}/page/${slug}`
  };

  return (
    <div className="bg-stone-50 min-h-screen py-16 lg:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <article className="max-w-4xl mx-auto px-4 md:px-8 bg-white py-16 md:py-24 rounded-[4rem] shadow-sm border border-stone-100">
        <header className="mb-16 border-b border-stone-100 pb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-stone-900 tracking-tighter mb-6 leading-none">
              {page.title}.
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">
               Official Publication &bull; Last Updated: {new Date(page.updated_at?.toDate?.() || Date.now()).toLocaleDateString()}
            </p>
        </header>

        <div 
          className="prose prose-stone prose-lg max-w-none prose-p:leading-[1.8] prose-p:text-stone-700 font-medium" 
          dangerouslySetInnerHTML={{ __html: page.content_html }} 
        />
        
        <footer className="mt-16 pt-12 border-t border-stone-100">
           <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-stone-300">
              <span className="w-2 h-2 rounded-full bg-emerald-900"></span>
              Verified Professional Page
           </div>
        </footer>
      </article>

      <div className="max-w-4xl mx-auto px-4 mt-8 flex justify-center">
         <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-emerald-900 transition-colors">
            &larr; Return to Core Hub
         </Link>
      </div>
    </div>
  );
}

// Sub-component for Link compatibility in server components
function Link({ href, children, ...props }) {
  const NextLink = require('next/link').default;
  return <NextLink href={href} {...props}>{children}</NextLink>;
}
