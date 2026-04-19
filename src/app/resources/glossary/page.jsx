import Link from 'next/link';
import { Book, Search, ArrowLeft, HelpCircle } from 'lucide-react';
import { glossaryTerms as mockTerms } from '@/data/mock';

export const metadata = {
  title: "Entrepreneurship Glossary | Business Terms in Bangladesh",
  description: "Define your success. A comprehensive glossary of essential startup and business terminology for entrepreneurs.",
};

export default async function GlossaryPage() {
  // --- SCHEMAS ---
  const siteUrl = "https://entrepreneurs.bd";
  const glossarySchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${siteUrl}/resources/glossary`,
    "name": "Entrepreneurs BD Business Glossary",
    "description": "Essential terminology for the Bangladeshi startup ecosystem.",
    "hasDefinedTerm": mockTerms.map(t => ({
      "@type": "DefinedTerm",
      "name": t.term,
      "description": t.definition
    }))
  };

  // Sort terms alphabetically
  const sortedTerms = [...mockTerms].sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="bg-stone-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(glossarySchema) }} />
      
      {/* Hero Section */}
      <section className="py-24 bg-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_0)] bg-[size:30px_30px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/50 border border-emerald-800 mb-6 shadow-sm">
            <Book className="w-4 h-4 text-emerald-100" />
            <span className="text-sm font-black uppercase tracking-widest text-emerald-100">Encyclopedia</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 tracking-tighter">
            Business Glossary
          </h1>
          <p className="text-xl text-emerald-100/80 leading-relaxed font-medium max-w-2xl mx-auto">
            Demystifying the language of the startup world. Clear, concise 
            definitions for every term you need to know.
          </p>
        </div>
      </section>

      {/* Glossary Engine */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-2">
            {sortedTerms.map((item, index) => (
              <div 
                key={index} 
                id={item.term.toLowerCase().replace(/\s+/g, '-')}
                className="group p-8 rounded-[2.5rem] bg-stone-50/50 border border-transparent hover:border-emerald-900/20 hover:bg-white hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500"
              >
                <div className="flex items-start gap-4 mb-4">
                   <div className="w-10 h-10 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-emerald-900 font-black text-xs shadow-sm group-hover:bg-emerald-900 group-hover:text-white transition-all">
                      {item.term.charAt(0)}
                   </div>
                   <h2 className="text-2xl font-black text-stone-900 group-hover:text-emerald-950 transition-colors pt-1">
                     {item.term}
                   </h2>
                </div>
                <p className="text-stone-600 leading-relaxed font-medium text-lg border-l-2 border-stone-200 pl-6 group-hover:border-emerald-900 transition-colors">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Submission CTA */}
      <section className="py-24 bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-black text-white mb-6">Missing a term?</h2>
            <p className="text-stone-400 text-lg mb-10 font-medium">Help us expand the library. Suggest a term for our editorial board.</p>
            <Link href="/contact">
               <button className="h-14 px-12 bg-white text-emerald-950 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-50 transition-all shadow-xl">
                 Suggest a term &rarr;
               </button>
            </Link>
        </div>
      </section>

      {/* Hub Links */}
      <div className="py-12 flex justify-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">
         <Link href="/resources/guides" className="hover:text-emerald-900 transition-colors">Founder Guides</Link>
         <Link href="/resources/faqs" className="hover:text-emerald-900 transition-colors">Startup FAQs</Link>
      </div>
    </div>
  );
}
