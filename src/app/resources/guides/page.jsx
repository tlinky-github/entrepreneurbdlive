import Link from 'next/link';
import { BookOpen, ChevronRight, ArrowRight } from 'lucide-react';
import { guides as mockGuides } from '@/data/mock';
import { guidesAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: "Practical Business Guides | Entrepreneurs BD",
  description: "Frameworks and actionable guides for starting and scaling your business in Bangladesh.",
};

export default async function GuidesPage() {
  // --- SERVER DATA FETCHING ---
  const res = await guidesAPI.list().catch(() => ({ data: [] }));
  const firestoreGuides = (res.data || []).filter(g => g.status === 'published');
  
  const allGuides = [...firestoreGuides, ...mockGuides];

  // --- SCHEMAS ---
  const siteUrl = "https://entrepreneurs.bd";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Practical Business Guides Hub",
    "description": "Actionable frameworks for entrepreneurs.",
    "url": `${siteUrl}/resources/guides`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": allGuides.map((g, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `${siteUrl}/resources/guides/${g.id || g.slug}`,
        "name": g.title
      }))
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Hero Section */}
      <section className="py-24 bg-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_0)] bg-[size:25px_25px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/50 border border-emerald-800 mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-emerald-100" />
              <span className="text-sm font-black uppercase tracking-widest text-emerald-100">Practical Resources</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 tracking-tighter">
              Founder Playbooks
            </h1>
            <p className="text-xl text-emerald-100/80 leading-relaxed font-medium">
              Structured frameworks and step-by-step considerations for 
              navigating the toughest challenges in business building.
            </p>
          </div>
        </div>
      </section>

      {/* Guides Engine */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            {allGuides.map((guide) => (
              <Card key={guide.id} className="border-none shadow-xl shadow-stone-200/50 rounded-[3rem] overflow-hidden group">
                <CardHeader className="bg-stone-900 border-none p-10 md:p-12 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 to-stone-900 opacity-90" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform">
                      <BookOpen className="w-10 h-10 text-emerald-900" />
                    </div>
                    <div className="text-center md:text-left">
                      <CardTitle className="text-3xl font-black text-white mb-3">
                        {guide.title}
                      </CardTitle>
                      <CardDescription className="text-emerald-100/60 text-lg font-medium">
                        {guide.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-12 p-10 md:p-16">
                  <div className="grid gap-10">
                    {(Array.isArray(guide.content) ? guide.content : []).map((section, idx) => (
                      <div key={idx} className="flex gap-6 group/item">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center font-black text-emerald-900 shadow-sm group-hover/item:bg-emerald-900 group-hover/item:text-white transition-all">
                             {String(idx + 1).padStart(2, '0')}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-stone-900 mb-2">
                            {section.heading}
                          </h4>
                          <p className="text-stone-600 leading-relaxed text-lg font-medium">
                            {section.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-16 pt-10 border-t border-stone-100 flex justify-center">
                     <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Playbook Verified by Editorial Board</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advisory Note */}
      <section className="py-12 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-stone-400 font-bold max-w-2xl mx-auto italic">
              Disclaimer: These guides provide general frameworks. Outcomes depend on execution and market conditions. 
              Always adapt these to your specific business context.
            </p>
        </div>
      </section>

      {/* Cross-Link Hub */}
      <section className="py-24 bg-white border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-black text-stone-900 mb-12 uppercase tracking-widest">More Resources</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
               <Link href="/knowledge">
                  <Button variant="ghost" className="text-stone-400 font-black tracking-widest text-[10px] uppercase hover:text-emerald-900 transition-colors">
                    &larr; Knowledge Hub
                  </Button>
               </Link>
               <Link href="/resources/faqs">
                  <Button variant="ghost" className="text-stone-400 font-black tracking-widest text-[10px] uppercase hover:text-emerald-900 transition-colors">
                    Startup FAQs &rarr;
                  </Button>
               </Link>
            </div>
        </div>
      </section>
    </div>
  );
}
