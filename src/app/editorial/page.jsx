import Link from 'next/link';
import { ShieldCheck, BookOpen, PenTool, CheckCircle, Search, Target, AlertCircle } from 'lucide-react';
import { editorialPrinciples } from '@/data/mock';

export const metadata = {
  title: "Editorial Principles & Integrity | Entrepreneurs BD",
  description: "Our commitment to accuracy, depth, and practical utility. Learn about the standards behind entrepreneurs.bd content.",
};

export default async function EditorialPage() {
  return (
    <div className="bg-stone-50 min-h-screen">
      
      {/* Hero Section */}
      <section className="py-24 bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-8">
              <ShieldCheck className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-black uppercase tracking-widest text-emerald-900">Content Integrity</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-stone-900 mb-8 tracking-tighter">
              Editorial Standards.
            </h1>
            <p className="text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed border-l-4 border-emerald-900/10 pl-8 font-medium">
               The principles that guide our research, writing, and fact-checking processes. 
               Our commitment is to the founder's success, above all else.
            </p>
        </div>
      </section>

      {/* Main Principles Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {editorialPrinciples.principles.map((principle, index) => (
              <div key={index} className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-stone-100 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 group">
                <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-8 group-hover:bg-emerald-900 group-hover:text-white transition-all">
                   <div className="text-xl font-black">0{index + 1}</div>
                </div>
                <h2 className="text-2xl font-black text-stone-900 mb-4 group-hover:text-emerald-900 transition-colors">
                  {principle.title}
                </h2>
                <p className="text-lg text-stone-500 font-medium leading-relaxed">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-24 bg-stone-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
           <div className="max-w-3xl">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-400 mb-8">Our Research Methodology</h2>
              <div className="space-y-12">
                 <div className="flex gap-8 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-stone-950 transition-all">
                       <Search className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black mb-2">Fact-Based Research</h3>
                       <p className="text-stone-400 font-medium leading-relaxed">We draw on established business research, legislative documentation, and verified industry data. We avoid anecdotal "hacks" in favor of proven systems.</p>
                    </div>
                 </div>
                 <div className="flex gap-8 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-stone-950 transition-all">
                       <PenTool className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black mb-2">Independent Writing</h3>
                       <p className="text-stone-400 font-medium leading-relaxed">Our writers are professionals with specialized knowledge. We do not accept sponsored content that dictates our editorial opinion or assessment.</p>
                    </div>
                 </div>
                 <div className="flex gap-8 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-stone-950 transition-all">
                       <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black mb-2">Internal Verification</h3>
                       <p className="text-stone-400 font-medium leading-relaxed">Every guide and article undergoes internal fact-checking by our board to ensure it meets our standards of depth and practical utility.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-24 bg-white border-t border-stone-100">
         <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-8">
               <AlertCircle className="w-8 h-8 text-emerald-900" />
            </div>
            <h2 className="text-3xl font-black text-stone-900 mb-6 tracking-tighter">Spot an error?</h2>
            <p className="text-stone-500 text-lg font-medium leading-relaxed mb-10">
               Accuracy is paramount. If you find a discrepancy in our business guides or 
               knowledge articles, please notify our editorial board immediately.
            </p>
            <Link href="/contact">
               <button className="h-14 px-12 bg-emerald-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/10">
                 Report a Correction &rarr;
               </button>
            </Link>
         </div>
      </section>
    </div>
  );
}
