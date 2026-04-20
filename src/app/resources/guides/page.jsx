import React from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, ArrowRight, Target, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { guidesAPI } from '@/lib/api';
import { guides as mockGuides } from '@/data/mock';

export const metadata = {
  title: 'Practical Business Guides | Frameworks for Success',
  description: 'Structured frameworks and tactical considerations for navigating common entrepreneurial challenges. Navigate with confidence.',
};

export default async function GuidesPage() {
  let firestoreGuides = [];

  try {
    const res = await guidesAPI.list();
    firestoreGuides = (res.data || []).filter(g => g.status === 'published');
  } catch (error) {
    console.error('[Guides Hub] Firestore ingestion failed:', error);
  }

  // 🛡️ Data Ingestion Protocol: Hybrid Firestore + Mock
  const allGuides = [...firestoreGuides, ...mockGuides];

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* 🛡️ Aesthetic Breadcrumb Deck */}
      <Breadcrumbs />

      {/* 🛡️ Narrative Header */}
      <section className="py-20 lg:py-32 bg-stone-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <BookOpen size={400} className="text-emerald-900" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border border-stone-200 mb-8 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-900" />
            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Growth Frameworks</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-stone-900 mb-8 tracking-tighter leading-tight">
            Practical Guides
          </h1>
          <p className="text-xl text-stone-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Structured frameworks for navigating the most complex entrepreneurial inflection points.
          </p>
        </div>
      </section>

      {/* 🛡️ Guides Listing Interaction */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            {allGuides.map((guide, index) => (
              <Card key={guide.id || index} className="border-none shadow-2xl shadow-stone-200/50 bg-white rounded-[3rem] overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
                <CardHeader className="p-10 lg:p-14 bg-stone-50/50 border-b border-stone-100 group-hover:bg-stone-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center gap-10">
                    <div className="w-20 h-20 bg-emerald-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-900/20 group-hover:scale-110 transition-transform">
                      <BookOpen size={36} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-black text-stone-900 tracking-tight mb-4">
                        {guide.title}
                      </CardTitle>
                      <CardDescription className="text-xl text-stone-500 font-medium leading-relaxed">
                        {guide.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10 lg:p-14">
                  <div className="space-y-12">
                    {guide.content.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="flex gap-8 group/section">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 font-black text-lg group-hover/section:bg-emerald-900 group-hover/section:text-white transition-all">
                            {sectionIndex + 1}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-stone-900 mb-4 tracking-tight group-hover/section:text-emerald-900 transition-colors">
                            {section.heading}
                          </h4>
                          <p className="text-lg text-stone-500 font-medium leading-relaxed">
                            {section.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 🛡️ Narrative Footer */}
      <section className="py-24 bg-emerald-900 mt-12 border-t border-emerald-800 overflow-hidden relative">
         <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none text-white">
            <Sparkles size={400} />
         </div>
         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl font-black text-white mb-8 tracking-tighter">Strategic <span className="text-emerald-300">Hardening.</span></h2>
            <p className="text-xl text-emerald-100/70 font-medium leading-relaxed mb-12">
               Our guides are tactical snapshots of complex business processes. Leverage them to harden your strategy, but always maintain operational agility.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link href="/knowledge">
                  <Button className="h-16 px-12 rounded-2xl bg-white text-emerald-900 hover:bg-stone-100 font-black uppercase tracking-widest text-xs shadow-2xl min-w-[220px]">
                     Knowledge Hub Home
                  </Button>
               </Link>
               <Link href="/resources/faqs">
                  <Button variant="outline" className="h-16 px-12 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 font-black uppercase tracking-widest text-xs min-w-[220px]">
                     Browse FAQs &rarr;
                  </Button>
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
}
