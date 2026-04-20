import SubmissionTabs from '@/components/submit/SubmissionTabs';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { Info, Sparkles, ShieldCheck, Clock, Award } from 'lucide-react';

export const metadata = {
  title: 'Apply to be Listed | Entrepreneurs.bd',
  description: 'Share your founder journey or list your business in Bangladesh\'s most comprehensive entrepreneur directory.',
};

export default function SubmissionPage() {
  return (
    <div className="min-h-screen bg-stone-50 overflow-x-hidden pb-24">
      {/* 🚀 The Perfect Breadcrumb Engine */}
      <Breadcrumbs />

      <div className="max-w-6xl mx-auto px-4">
        {/* 🛡️ Aesthetic Deck: Header */}
        <div className="text-center py-16 lg:py-24">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-900 text-emerald-100 border-none mb-8 shadow-xl shadow-emerald-900/20">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span className="text-xs font-bold">Community Expansion</span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-stone-900 mb-8 tracking-tighter leading-none">
            Join the <span className="text-emerald-900 font-serif italic">Ecosystem.</span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-stone-500 max-w-3xl mx-auto leading-relaxed font-medium">
            Share your story as a visionary founder or register your enterprise in Bangladesh&apos;s premier professional directory.
          </p>
        </div>

        {/* 🛡️ Interaction Hub: The Form Engine */}
        <SubmissionTabs />

        {/* 🛡️ Support Deck: Curation Guidelines */}
        <div className="mt-20 sm:mt-24 max-w-4xl mx-auto bg-white rounded-[2rem] p-10 sm:p-14 border border-stone-100 shadow-[0_40px_80px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center md:items-start gap-10 sm:gap-14">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-900 shrink-0 border border-emerald-100/50">
            <Award size={32} className="text-emerald-900" />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center gap-2.5 justify-center md:justify-start mb-5">
               <ShieldCheck className="w-4 h-4 text-emerald-900" />
               <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Governance & Quality</h4>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 mb-6 tracking-tight leading-none">Curation Standards</h2>
            <p className="text-xl text-stone-500 leading-relaxed mb-10 font-medium">
              Every submission is manually vetted by our strategic editorial board. We prioritize entries with high-resolution imagery, detailed narratives, and verified professional identifiers.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
               <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-stone-50 border border-stone-100 text-stone-900 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-900" />
                  <span className="text-xs font-bold">Manual Verification</span>
               </div>
               <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-stone-50 border border-stone-100 text-stone-900 shadow-sm">
                  <Clock className="w-4 h-4 text-emerald-900" />
                  <span className="text-xs font-bold">48h Review Cycle</span>
               </div>
               <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-stone-50 border border-stone-100 text-stone-900 shadow-sm">
                  <Award className="w-4 h-4 text-emerald-900" />
                  <span className="text-xs font-bold">Elite Registry Status</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
