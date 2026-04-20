'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, BookOpen, ChevronRight, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export default function GlossaryClient({ initialTerms }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchTermLower = searchTerm.toLowerCase();
  const filteredTerms = initialTerms.filter(item => {
    const termText = (item.term || '').toLowerCase();
    const definitionText = (item.definition || '').toLowerCase();
    return termText.includes(searchTermLower) || definitionText.includes(searchTermLower);
  });

  // Group terms alphabetically
  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const letter = ((term.term || '').trim()[0] || '#').toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(term);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedTerms).sort();

  return (
    <div className="bg-white min-h-screen">
      {/* 🛡️ Aesthetic Breadcrumb Deck */}
      <Breadcrumbs />

      {/* 🛡️ Narrative Header */}
      <section className="py-20 lg:py-32 bg-stone-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <BookOpen size={400} className="text-emerald-900" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border border-stone-200 mb-8 shadow-sm">
            <Target className="w-4 h-4 text-emerald-900" />
            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Business Taxonomy</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-stone-900 mb-8 tracking-tighter leading-tight">
            Entrepreneurship Glossary
          </h1>
          <p className="text-xl text-stone-500 font-medium max-w-2xl mx-auto mb-10">
            Clear definitions of essential business terms to harden your operational intelligence.
          </p>

          {/* Search Hub */}
          <div className="max-w-xl mx-auto relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-emerald-600 transition-colors" />
            <Input
              type="text"
              placeholder="Search taxonomy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-16 h-16 border-none shadow-2xl shadow-stone-200/60 rounded-2xl focus:ring-2 focus:ring-emerald-900/10 bg-white text-lg font-medium"
            />
          </div>
        </div>
      </section>

      {/* 🛡️ Alphabet Navigation Deck */}
      {sortedLetters.length > 0 && (
        <section className="py-6 bg-white border-b border-stone-100 sticky top-[61px] z-30 shadow-sm backdrop-blur-sm bg-white/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-3">
              {sortedLetters.map((letter) => (
                <a
                  key={letter}
                  href={`#letter-${letter}`}
                  className="w-10 h-10 rounded-xl bg-stone-50 hover:bg-emerald-900 hover:text-white flex items-center justify-center text-xs font-black text-stone-400 transition-all hover:shadow-lg hover:shadow-emerald-900/20"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 🛡️ Glossary Content interaction */}
      <section className="py-24 bg-white min-h-[400px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {filteredTerms.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 bg-stone-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-stone-100 text-stone-300">
                   <Search size={40} />
                </div>
                <h3 className="text-2xl font-black text-stone-900 mb-2">No terms found</h3>
                <p className="text-stone-400 font-medium mb-8">No results matching "{searchTerm}"</p>
                <Button variant="outline" onClick={() => setSearchTerm('')} className="rounded-xl px-8 h-12 border-emerald-900 text-emerald-900 font-black uppercase text-[10px] tracking-widest">
                  Clear Intelligence Search
                </Button>
              </div>
            ) : (
              <div className="space-y-24">
                {sortedLetters.map((letter) => (
                  <div key={letter} id={`letter-${letter}`} className="scroll-mt-48 animate-fade-in">
                    <div className="flex items-center gap-6 mb-12">
                       <div className="w-16 h-16 bg-emerald-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-900/10 font-black text-2xl">
                          {letter}
                       </div>
                       <div className="h-[2px] flex-1 bg-stone-100 rounded-full" />
                    </div>
                    <dl className="grid gap-10">
                      {(groupedTerms[letter] || []).map((item, index) => (
                        <div key={index} className="group p-8 rounded-[2rem] hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100/50">
                          <dt className="text-2xl font-black text-stone-900 mb-4 tracking-tight group-hover:text-emerald-900 transition-colors">
                            {item.term}
                          </dt>
                          <dd className="text-lg text-stone-500 leading-relaxed font-medium pl-8 border-l-4 border-stone-100 group-hover:border-emerald-600 transition-all">
                            {item.definition}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 🛡️ Narrative Footer */}
      <section className="py-24 bg-stone-50 mt-12 border-t border-stone-200/60 overflow-hidden relative">
         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white border border-stone-200 mb-8 shadow-sm">
               <Sparkles size={16} className="text-emerald-700" />
               <span className="text-[10px] font-black uppercase tracking-widest">Deep Strategy</span>
            </div>
            <h2 className="text-4xl font-black text-stone-900 mb-8 tracking-tighter">Ready for <span className="text-emerald-900">Battle?</span></h2>
            <p className="text-xl text-stone-500 font-medium leading-relaxed mb-12">
               Now that you've hardened your vocabulary, execute on your strategy with our practical business guides.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link href="/resources/guides">
                  <Button className="h-16 px-12 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-950/20 min-w-[220px]">
                     Practical Guides
                  </Button>
               </Link>
               <Link href="/knowledge">
                  <Button variant="outline" className="h-16 px-12 rounded-2xl border-emerald-900 text-emerald-900 hover:bg-emerald-50 font-black uppercase tracking-widest text-xs min-w-[220px]">
                     Get Expert Guidance →
                  </Button>
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
}
