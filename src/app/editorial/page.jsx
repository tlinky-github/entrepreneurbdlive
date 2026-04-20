import React from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, AlertCircle, ChevronRight, Target, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { editorialPrinciples } from '@/data/mock';

export const metadata = {
  title: 'Editorial Policy | Entrepreneurs BD',
  description: 'Our commitment to providing accurate, practical, and trustworthy entrepreneurship content. Learn about our content ethics and standards.',
};

export default function EditorialPage() {
  return (
    <div className="bg-white min-h-screen pb-24">
      {/* 🛡️ Aesthetic Breadcrumb Deck */}
      <div className="bg-stone-50 border-b border-stone-200/60 sticky top-0 z-40 backdrop-blur-md bg-stone-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <ChevronRight size={12} className="text-stone-300" />
            <span className="text-emerald-900 font-black">Editorial Policy</span>
          </nav>
        </div>
      </div>

      {/* 🛡️ Narrative Header */}
      <section className="py-20 lg:py-32 bg-stone-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <BookOpen size={400} className="text-emerald-900" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border border-stone-200 mb-8 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-900" />
            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Content Standards</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-stone-900 mb-8 tracking-tighter">
            Editorial Principles <br className="hidden lg:block" /> & Content Ethics
          </h1>
          <p className="text-2xl text-stone-500 font-serif italic max-w-2xl mx-auto">
            "Our commitment to providing accurate, practical, and trustworthy entrepreneurship content."
          </p>
        </div>
      </section>

      {/* 🛡️ Mission Statement */}
      <section className="py-12 bg-white relative -mt-12 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Card className="bg-emerald-900 border-none rounded-[3rem] p-10 lg:p-16 text-center shadow-2xl shadow-emerald-900/20 relative overflow-hidden group">
               <div className="absolute -bottom-10 -right-10 opacity-10 transition-transform group-hover:scale-110">
                  <Sparkles size={240} className="text-white" />
               </div>
               <h2 className="text-3xl font-black text-white mb-8 tracking-tight">Our Editorial Mission</h2>
               <p className="text-xl text-emerald-50 leading-relaxed font-serif italic">
                 {editorialPrinciples.mission}
               </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 🛡️ Core Principles Grid */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-stone-900 mb-4 tracking-tighter uppercase tracking-widest text-xs">The Foundation</h2>
            <p className="text-xl text-stone-500 font-medium">Core principles that guide every piece of content</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {editorialPrinciples.principles.map((principle, index) => (
              <Card key={index} className="border-none shadow-xl shadow-stone-200/50 bg-white rounded-[2rem] p-4 group hover:translate-y-[-4px] transition-all duration-300">
                <CardHeader className="flex flex-row items-center gap-6 pb-6">
                  <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100 group-hover:bg-emerald-900 group-hover:border-emerald-800 transition-colors">
                    <span className="text-emerald-900 font-black text-xl group-hover:text-white">{index + 1}</span>
                  </div>
                  <CardTitle className="text-2xl font-black text-stone-900 tracking-tight leading-tight">
                    {principle.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-stone-600 font-medium leading-relaxed pl-22">
                    {principle.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 🛡️ Standards & Integrity Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Standards */}
            <div>
              <div className="inline-flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-900">
                    <Target size={20} />
                 </div>
                 <h2 className="text-3xl font-black text-stone-900 tracking-tight">Content Standards</h2>
              </div>
              <div className="space-y-4">
                {editorialPrinciples.contentStandards.map((standard, index) => (
                  <div key={index} className="flex items-start gap-4 p-8 rounded-3xl bg-stone-50 border border-stone-100 group hover:bg-white hover:shadow-lg transition-all">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-lg text-stone-700 font-medium leading-relaxed">{standard}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What We Avoid */}
            <div>
              <div className="inline-flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                    <AlertCircle size={20} />
                 </div>
                 <h2 className="text-3xl font-black text-stone-900 tracking-tight">What We Avoid</h2>
              </div>
              <div className="space-y-4">
                {[
                  "Unverifiable claims about success rates or outcomes",
                  "Motivational content that oversimplifies challenges",
                  "Fabricated case studies or invented statistics",
                  "Promotional content disguised as education",
                  "Prescriptive advice that ignores individual context",
                  "Sensationalized headlines or clickbait approaches"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-8 rounded-3xl bg-red-50/30 border border-red-100 group hover:bg-white hover:shadow-lg transition-all">
                    <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-lg text-stone-700 font-medium leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🛡️ E-E-A-T Commitment Grid */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fade-in">
             <h2 className="text-4xl font-black text-stone-900 mb-4 tracking-tighter">Our E-E-A-T Commitment</h2>
             <p className="text-xl text-stone-500 font-medium max-w-2xl mx-auto">Experience, Expertise, Authoritativeness, and Trustworthiness</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Experience", desc: "Our content draws on practical experience in entrepreneurship and business operations. We write from a practitioner's perspective." },
              { title: "Expertise", desc: "Content is developed with deep research and understanding of business building, avoiding oversimplification." },
              { title: "Authoritativeness", desc: "We build authority through consistent, high-quality content that serves genuine community needs." },
              { title: "Trustworthiness", desc: "Trust is earned through honesty, transparency, and accuracy. We prioritize reader benefit over engagement metrics." }
            ].map((eeat, i) => (
              <Card key={i} className="border-none bg-white rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl font-black text-stone-900 tracking-tight">{eeat.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-stone-500 font-medium leading-relaxed">{eeat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 🛡️ Footer Hub */}
      <section className="py-20 bg-emerald-900 border-t border-emerald-800 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <Sparkles size={400} />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl font-black text-white mb-6 tracking-tighter">Feedback Welcome</h2>
          <p className="text-xl text-emerald-100/70 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            If you identify errors or have suggestions for our editorial approach, we welcome your professional input.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button variant="outline" className="h-14 px-10 rounded-xl bg-white/5 border-white/20 hover:bg-white/10 text-white font-black uppercase text-xs tracking-widest">
                Professional Contact
              </Button>
            </Link>
            <Link href="/">
              <Button className="h-14 px-10 rounded-xl bg-white text-emerald-900 hover:bg-stone-100 font-black uppercase text-xs tracking-widest">
                Growth Hub Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
