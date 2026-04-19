import Link from 'next/link';
import { HelpCircle, ChevronRight, MessageSquare, CheckCircle } from 'lucide-react';
import { faqs as mockFaqs } from '@/data/mock';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

export const metadata = {
  title: "Startup & Entrepreneurship FAQs | Entrepreneurs BD",
  description: "Answers to the most common questions about starting and growing a business in Bangladesh.",
};

export default async function FAQsPage() {
  // --- SCHEMAS ---
  const siteUrl = "https://entrepreneurs.bd";
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": mockFaqs.flatMap(cat => cat.questions.map(q => ({
      "@type": "Question",
      "name": q.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.a
      }
    })))
  };

  return (
    <div className="bg-stone-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      {/* Hero Section */}
      <section className="py-24 bg-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/50 border border-emerald-800 mb-6 shadow-sm">
              <HelpCircle className="w-4 h-4 text-emerald-100" />
              <span className="text-sm font-black uppercase tracking-widest text-emerald-100">Common Questions</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 tracking-tighter">
              Startup Help Desk
            </h1>
            <p className="text-xl text-emerald-100/80 leading-relaxed font-medium">
              You ask. We answer. Clear, practical answers for Bangladesh's 
              ambitious founders and innovators.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Engine */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {mockFaqs.map((category, catIndex) => (
              <div key={catIndex}>
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-px flex-1 bg-stone-100" />
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-900/40">
                    {category.category}
                  </h2>
                  <div className="h-px flex-1 bg-stone-100" />
                </div>

                <div className="space-y-6">
                  {category.questions.map((faq, faqIndex) => (
                    <CardWrapper key={faqIndex} question={faq.q}>
                       {faq.a}
                    </CardWrapper>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-24 bg-stone-50 border-t border-stone-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white border border-stone-100 shadow-sm flex items-center justify-center mx-auto mb-8">
             <MessageSquare className="w-8 h-8 text-emerald-900" />
          </div>
          <h2 className="text-3xl font-black text-stone-900 mb-4">Still have questions?</h2>
          <p className="text-stone-500 mb-10 font-bold">Our editorial board is here to help you navigate the journey.</p>
          <Link href="/contact">
             <button className="h-14 px-12 bg-emerald-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/10">
               Get Personal Advice &rarr;
             </button>
          </Link>
        </div>
      </section>
      
      {/* Hub Links */}
      <div className="py-12 flex justify-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">
         <Link href="/resources/guides" className="hover:text-emerald-900 transition-colors">Founder Guides</Link>
         <Link href="/resources/glossary" className="hover:text-emerald-900 transition-colors">Term Glossary</Link>
      </div>
    </div>
  );
}

const CardWrapper = ({ question, children }) => (
  <Accordion type="single" collapsible className="w-full">
    <AccordionItem value="item-1" className="border border-stone-100 rounded-[2rem] px-8 bg-stone-50/50 hover:bg-white transition-all overflow-hidden group">
      <AccordionTrigger className="text-left py-8 text-xl font-black text-stone-900 hover:no-underline group-hover:text-emerald-900">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-stone-600 text-lg leading-relaxed pb-8 font-medium border-t border-stone-100 mt-2 pt-6">
        <div className="flex gap-4">
           <CheckCircle className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-1" />
           {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);
