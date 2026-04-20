import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { contentAPI } from '@/lib/api';

// 🛡️ Pre-Rendering Metadata Engine
export async function generateMetadata({ params }) {
  const { slug } = params;
  if (!slug) return { title: 'Page Intelligence' };
  
  try {
    const res = await contentAPI.get('pages', slug);
    const page = res.data;
    if (!page) return { title: 'Page Not Found' };

    return {
      title: `${page.seoTitle || page.title} | Entrepreneurs BD`,
      description: page.metaDescription || page.content_html?.replace(/<[^>]+>/g, '').substring(0, 160),
    };
  } catch (error) {
    return { title: 'Page Intelligence' };
  }
}

export default async function DynamicNarrativePage({ params }) {
  const { slug } = params;
  if (!slug) notFound();
  
  let page = null;

  try {
    const res = await contentAPI.get('pages', slug);
    page = res.data;
  } catch (error) {
    console.error(`[Narrative Engine] Failed to fetch page ${slug}:`, error);
  }

  if (!page) notFound();

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* 🛡️ Aesthetic Breadcrumb Deck */}
      <div className="bg-stone-50 border-b border-stone-200/60 sticky top-0 z-40 backdrop-blur-md bg-stone-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <ChevronRight size={12} className="text-stone-300" />
            <span className="text-emerald-900 truncate max-w-[200px] sm:max-w-none">{page.title}</span>
          </nav>
        </div>
      </div>

      {/* 🛡️ Narrative Header */}
      <section className="py-20 lg:py-28 bg-stone-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <FileText size={400} className="text-emerald-900" />
        </div>
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border border-stone-200 mb-10 shadow-sm animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-emerald-900" />
            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Platform Narrative</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-stone-900 mb-8 tracking-tighter leading-tight">
            {page.title}
          </h1>
          {page.subtitle && (
            <p className="text-2xl text-emerald-900 font-serif italic mb-6">
              {page.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* 🛡️ Narrative Core Interaction */}
      <section className="py-12 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
           <article className="prose prose-stone lg:prose-xl max-w-none prose-emerald prose-headings:font-black prose-headings:tracking-tight prose-p:font-medium prose-p:text-stone-600 prose-p:leading-relaxed">
             <div
               dangerouslySetInnerHTML={{ __html: page.content_html }}
             />
           </article>

           {/* 🛡️ Narrative Footer */}
           <div className="mt-20 pt-16 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-8">
             <Link href="/">
               <Button variant="outline" className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 rounded-xl px-10 h-14 font-black uppercase text-xs tracking-widest">
                 <ArrowLeft className="mr-3 w-4 h-4" />
                 Growth Hub
               </Button>
             </Link>
             <div className="text-[10px] font-black text-stone-300 uppercase tracking-widest">
               Last Synchronized: {new Date(page.updated_at || page.created_at || Date.now()).toLocaleDateString()}
             </div>
           </div>
        </div>
      </section>
    </div>
  );
}
