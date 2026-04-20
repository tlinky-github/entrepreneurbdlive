import React from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronRight, ArrowLeft, Target, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqs as mockFaqs } from '@/data/mock';

export const metadata = {
  title: 'Frequently Asked Questions | Entrepreneurs BD',
  description: 'Answers to common questions about entrepreneurship, business fundamentals, and the challenges of starting and growing a business.',
};

export default function FAQsPage() {
  // 🛡️ Data Ingestion Protocol: Hybrid Firestore + Mock
  // Note: For now, using mock and established patterns. Firestore dynamic fetch can be added via a client component if needed.
  const allFaqs = mockFaqs;

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* 🛡️ Aesthetic Breadcrumb Deck */}
      <Breadcrumbs />

      {/* 🛡️ Narrative Header */}
      <section className="py-20 lg:py-32 bg-stone-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <HelpCircle size={400} className="text-emerald-900" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border border-stone-200 mb-8 shadow-sm">
            <HelpCircle className="w-4 h-4 text-emerald-900" />
            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Tactical Q&A</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-stone-900 mb-8 tracking-tighter">
            Operational FAQs
          </h1>
          <p className="text-xl text-stone-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Direct answers to the most frequent challenges encountered by founders in the high-growth ecosystem.
          </p>
        </div>
      </section>

      {/* 🛡️ FAQ Categories Interaction */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-16">
            {allFaqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="animate-fade-in">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-emerald-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/10">
                      <Target size={24} />
                   </div>
                   <h2 className="text-3xl font-black text-stone-900 tracking-tight">
                     {category.category}
                   </h2>
                </div>
                
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <AccordionItem 
                      key={faqIndex} 
                      value={`${categoryIndex}-${faqIndex}`}
                      className="border-none bg-stone-50 rounded-3xl px-8 py-2 shadow-sm border border-stone-100/50 hover:bg-white hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300"
                    >
                      <AccordionTrigger className="text-left text-stone-900 hover:text-emerald-900 hover:no-underline py-6 text-lg font-black tracking-tight">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-stone-600 pb-8 text-base font-medium leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🛡️ Narrative Footer */}
      <section className="py-24 bg-stone-50 mt-12 border-t border-stone-200/60 overflow-hidden relative">
         <div className="absolute inset-0 bg-stone-100/50 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl font-black text-stone-900 mb-8 tracking-tighter">Unanswered <span className="text-emerald-900">Intelligence?</span></h2>
            <p className="text-xl text-stone-500 font-medium leading-relaxed mb-12">
               If you require specific strategic clarity not covered in our hub, our advisory desk is standing by to resolve your operational inquiries.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link href="/contact">
                  <Button className="h-16 px-12 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-950/20 min-w-[220px]">
                     Contact Advisory
                  </Button>
               </Link>
               <Link href="/knowledge">
                  <Button variant="outline" className="h-16 px-12 rounded-2xl border-emerald-900 text-emerald-900 hover:bg-emerald-50 font-black uppercase tracking-widest text-xs min-w-[220px]">
                     Knowledge Hub &rarr;
                  </Button>
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
}
