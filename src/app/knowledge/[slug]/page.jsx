import React from 'react';
import { notFound } from 'next/navigation';
import { pillarPages, pillarPagesPart2 } from '@/data/mock';
import { contentAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  BookOpen, 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  Target,
  ShieldCheck,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';
import BlogContentViewer from '@/components/blog/BlogContentViewer';

// 🛡️ Data Ingestion Protocol: Hybrid Firestore + Mock
async function getArticleData(slug) {
  const allMockPillars = [...pillarPages, ...pillarPagesPart2];
  const mockMatch = allMockPillars.find(p => p.id === slug);
  
  try {
    const res = await contentAPI.list('knowledge');
    const firestoreMatch = (res.data || []).find(a => a.slug === slug);
    return firestoreMatch || mockMatch;
  } catch (err) {
    console.warn('[Knowledge Port] Firestore lookup failed, falling back to mock:', err);
    return mockMatch;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (!slug) return { title: 'Intelligence Not Found' };
  
  const article = await getArticleData(slug);
  if (!article) return { title: 'Intelligence Not Found' };
  
  return {
    title: `${article.title} | Knowledge Hub`,
    description: article.description || article.seo_description || `Deep dive into ${article.title} for entrepreneurs.`,
  };
}

export default async function KnowledgeDetailPage({ params }) {
  const { slug } = await params;
  if (!slug) notFound();
  
  const article = await getArticleData(slug);
  if (!article) notFound();

  const isMock = !article.source && (pillarPages.some(p => p.id === article.id) || pillarPagesPart2.some(p => p.id === article.id));
  const sections = isMock ? (article.content?.sections || []) : [];
  const faqs = isMock ? (article.content?.faqs || []) : [];

  const allPillars = [...pillarPages, ...pillarPagesPart2];
  const currentIndex = allPillars.findIndex(p => p.id === params.slug);
  const prevArticle = currentIndex > 0 ? allPillars[currentIndex - 1] : null;
  const nextArticle = currentIndex < allPillars.length - 1 ? allPillars[currentIndex + 1] : null;

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* 🚀 The Perfect Breadcrumb Engine */}
      <Breadcrumbs />

      {/* 🛡️ Narrative Header Section */}
      <section className="py-20 lg:py-28 bg-stone-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <Lightbulb size={400} className="text-emerald-900" />
        </div>
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white border border-stone-200/60 mb-10 shadow-sm animate-fade-in-up">
            <BookOpen className="w-4 h-4 text-emerald-900" />
            <span className="text-xs font-bold text-stone-900">Strategy Insight</span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-stone-900 mb-8 tracking-tighter leading-none">
            {article.title}
          </h1>
          <p className="text-2xl text-emerald-900 font-serif italic mb-10">
            {article.subtitle}
          </p>
          <p className="text-xl text-stone-500 max-w-3xl mx-auto leading-relaxed font-medium mb-12">
            {article.description}
          </p>
        </div>
      </section>

      {/* 🛡️ Narrative Core Interaction */}
      <section className="py-12 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Table of Contents - Sidebar */}
            <aside className="lg:col-span-3 hidden lg:block">
              <div className="sticky top-32">
                <h3 className="text-sm font-black text-stone-900 mb-8 uppercase tracking-widest flex items-center gap-3">
                   <Target size={18} className="text-emerald-700" /> In This Article
                </h3>
                <nav className="space-y-4">
                  <a href="#introduction" className="block text-sm font-bold text-stone-400 hover:text-emerald-900 py-1 transition-all hover:translate-x-1">00 Introduction</a>
                  {sections.map((s, i) => (
                    <a key={i} href={`#section-${i}`} className="block text-sm font-bold text-stone-400 hover:text-emerald-900 py-1 transition-all hover:translate-x-1">
                      {i + 1 < 10 ? `0${i + 1}` : i + 1} {s.heading}
                    </a>
                  ))}
                  {faqs.length > 0 && (
                    <a href="#faqs" className="block text-sm font-bold text-stone-400 hover:text-emerald-900 py-1 transition-all hover:translate-x-1 uppercase tracking-widest text-xs">
                       Intellectual FAQs
                    </a>
                  )}
                </nav>

                <div className="mt-16 p-8 bg-emerald-900 rounded-[2rem] text-white relative overflow-hidden group">
                   <div className="absolute -bottom-4 -right-4 opacity-10 transition-transform group-hover:scale-110">
                      <Sparkles size={120} />
                   </div>
                   <h4 className="text-lg font-black mb-4 tracking-tight">Need Strategy?</h4>
                   <p className="text-emerald-100/70 text-sm mb-8 font-medium leading-relaxed">Discover battle-tested guides for founders.</p>
                   <Link href="/resources/guides">
                      <Button variant="outline" className="w-full bg-white/5 border-white/20 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest h-12 rounded-xl">
                        Browse Guides
                      </Button>
                   </Link>
                </div>
              </div>
            </aside>

            {/* Main Narrative Engine */}
            <div className="lg:col-span-9">
              <article className="max-w-none">
                {isMock ? (
                  /* 🛡️ Recursive Pillar Renderer */
                  <div className="space-y-20">
                    <div id="introduction">
                       <p className="text-2xl text-stone-700 leading-relaxed font-serif animate-fade-in-up">
                        {article.content?.introduction}
                       </p>
                    </div>

                    {sections.map((section, i) => (
                      <section key={i} id={`section-${i}`} className="scroll-mt-32">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-10 h-10 border border-stone-100 bg-stone-50 rounded-xl flex items-center justify-center text-emerald-900 font-black text-sm">
                             {i + 1}
                           </div>
                           <h2 className="text-3xl font-black text-stone-900 tracking-tight">{section.heading}</h2>
                        </div>
                        <div className="text-lg text-stone-600 leading-relaxed font-medium space-y-6">
                           {section.content.split('\n\n').map((para, pi) => (
                             <p key={pi}>{para}</p>
                           ))}
                        </div>
                      </section>
                    ))}

                    {/* FAQ Deck */}
                    {faqs.length > 0 && (
                      <Card id="faqs" className="mt-24 border-none shadow-2xl shadow-stone-200/60 rounded-[3rem] bg-stone-50/50 p-10 lg:p-16 scroll-mt-32">
                        <div className="flex items-center gap-6 mb-12">
                           <div className="w-16 h-16 bg-emerald-900 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-900/20">
                              <Target size={30} />
                           </div>
                           <div>
                              <h2 className="text-3xl font-black text-stone-900 tracking-tight leading-none mb-2 font-serif italic">Operational FAQs</h2>
                              <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Strategic answers for founders</p>
                           </div>
                        </div>
                        
                        <Accordion type="single" collapsible className="w-full space-y-4">
                          {faqs.map((faq, i) => (
                            <AccordionItem key={i} value={`faq-${i}`} className="border-none bg-white rounded-3xl px-8 py-2 shadow-sm border border-stone-100/50">
                              <AccordionTrigger className="text-left text-stone-900 hover:text-emerald-900 hover:no-underline font-black text-lg py-6 tracking-tight">
                                {faq.q}
                              </AccordionTrigger>
                              <AccordionContent className="text-stone-600 pb-8 text-base font-medium leading-relaxed">
                                {faq.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </Card>
                    )}
                  </div>
                ) : (
                  /* 🛡️ Dynamic Firestore Renderer: Elite Multi-Styler */
                  <BlogContentViewer 
                    content={article.content} 
                    className="max-w-none"
                  />
                )}
              </article>

              {/* 🛡️ Navigation Deck */}
              <div className="mt-32 pt-16 border-t border-stone-100">
                <div className="grid sm:grid-cols-2 gap-8">
                  {prevArticle ? (
                    <Link href={`/knowledge/${prevArticle.id}`} className="group p-10 rounded-[2.5rem] border border-stone-100 bg-stone-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all">
                       <div className="flex items-center gap-3 text-stone-400 mb-6 group-hover:text-emerald-600 transition-colors">
                          <ArrowLeft size={16} />
                          <span className="text-xs font-black uppercase tracking-widest">Previous Unit</span>
                       </div>
                       <p className="text-xl font-black text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-tight">
                          {prevArticle.title}
                       </p>
                    </Link>
                  ) : <div />}

                  {nextArticle ? (
                    <Link href={`/knowledge/${nextArticle.id}`} className="group p-10 rounded-[2.5rem] border border-stone-100 bg-stone-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all text-right">
                       <div className="flex items-center justify-end gap-3 text-stone-400 mb-6 group-hover:text-emerald-600 transition-colors">
                          <span className="text-xs font-black uppercase tracking-widest">Next Strategy</span>
                          <ArrowRight size={16} />
                       </div>
                       <p className="text-xl font-black text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-tight">
                          {nextArticle.title}
                       </p>
                    </Link>
                  ) : <div />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🛡️ Continuity Ecosystem */}
      <section className="py-24 bg-stone-50 mt-12 overflow-hidden relative">
         <div className="absolute inset-0 bg-stone-100/50 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl font-black text-stone-900 mb-8 tracking-tighter">Expand your <span className="text-emerald-900">Intelligence.</span></h2>
            <p className="text-xl text-stone-500 font-medium leading-relaxed mb-12">
               Explore high-fidelity practical guides and semantic resources engineered to harden your entrepreneurial effectiveness.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link href="/knowledge">
                  <Button className="h-16 px-12 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-950/20 min-w-[220px]">
                     All Strategies
                  </Button>
               </Link>
               <Link href="/resources/guides">
                  <Button variant="outline" className="h-16 px-12 rounded-2xl border-emerald-900 text-emerald-900 hover:bg-emerald-50 font-black uppercase tracking-widest text-xs min-w-[220px]">
                     Practical Guides &rarr;
                  </Button>
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
}
