import SubmissionTabs from '@/components/submit/SubmissionTabs';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export const metadata = {
  title: 'Apply to be Listed | Entrepreneurs.bd',
  description: 'Share your founder journey or list your business in Bangladesh\'s most comprehensive entrepreneur directory.',
};

export default function SubmissionPage() {
  return (
    <div className="min-h-screen bg-stone-50 py-16 sm:py-24 px-4 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* 🛡️ Aesthetic Deck: Header */}
        <div className="text-center mb-16 lg:mb-24">
          <Badge className="bg-emerald-900 text-emerald-100 border-none mb-8 px-6 py-2 uppercase tracking-[0.2em] text-[10px] font-black shadow-lg shadow-emerald-900/10">
            Community Expansion
          </Badge>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-stone-900 mb-8 tracking-tight leading-none">
            Join the <span className="text-emerald-900 font-serif italic">Ecosystem.</span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-stone-500 max-w-3xl mx-auto leading-relaxed font-medium">
            Share your story as a visionary founder or register your enterprise in Bangladesh&apos;s premier professional directory.
          </p>
        </div>

        {/* 🛡️ Interaction Hub: The Form Engine */}
        <SubmissionTabs />

        {/* 🛡️ Support Deck: Curation Guidelines */}
        <div className="mt-24 sm:mt-32 max-w-4xl mx-auto bg-white rounded-[3rem] p-8 sm:p-12 lg:p-16 border border-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center md:items-start gap-8 sm:gap-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-900 shrink-0 shadow-inner">
            <Info size={32} />
          </div>
          <div className="text-center md:text-left flex-1">
            <h4 className="text-2xl sm:text-3xl font-black text-stone-900 mb-4 tracking-tight">Curation Standards</h4>
            <p className="text-lg text-stone-500 leading-relaxed mb-8 font-medium">
              Every submission is manually vetted by our editorial board. We prioritize entries with high-resolution imagery, detailed narratives, and verified professional identifiers.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
               <Badge variant="outline" className="border-stone-100 text-stone-400 font-bold py-2 px-6 rounded-2xl uppercase tracking-widest text-[9px]">Manual Verification</Badge>
               <Badge variant="outline" className="border-stone-100 text-stone-400 font-bold py-2 px-6 rounded-2xl uppercase tracking-widest text-[9px]">48h Review Cycle</Badge>
               <Badge variant="outline" className="border-stone-100 text-stone-400 font-bold py-2 px-6 rounded-2xl uppercase tracking-widest text-[9px]">Elite Directory Status</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
