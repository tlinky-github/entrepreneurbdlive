"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
   User,
   Building2,
   ArrowRight,
   Linkedin,
   Twitter,
   Facebook,
   Globe,
   Mail,
   Briefcase,
   FileText,
   ShieldCheck,
   Rocket,
   Star,
   Users,
   Trophy,
   Loader2,
   Image as ImageIcon,
   Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Turnstile from './Turnstile';
import PublicRichEditor from './PublicRichEditor';
import publicAPI from '@/lib/publicApi';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

export default function SubmissionTabs() {
   const router = useRouter();
   const [activeTab, setActiveTab] = useState('entrepreneur');
   const [loading, setLoading] = useState(false);
   const [turnstileToken, setTurnstileToken] = useState('');
   const [metadata, setMetadata] = useState({
      categories: [],
      industries: [],
      employee_sizes: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']
   });

   // Forms state logic unchanged...
   const [pData, setPData] = useState({
      name: '', designation: '', company_name: '', industry: '', category: '',
      excerpt: '', content: '', email: '', social_linkedin: '', social_twitter: '',
      social_facebook: '', photo: '', contact_email: '', contact_phone: ''
   });

   const [lData, setLData] = useState({
      business_name: '', category: '', industry: '', headquarters: '', website: '',
      employee_size: '', ceo_name: '', founder_name: '', excerpt: '', content: '',
      logo: '', cover_image: '', email: '', phone: '', social_linkedin: '',
      social_twitter: '', social_facebook: '', contact_email: '', contact_phone: ''
   });

   useEffect(() => {
      const loadMetadata = async () => {
         try {
            const res = await publicAPI.listMetadata(turnstileToken || TURNSTILE_SITE_KEY);
            setMetadata(prev => ({ ...prev, ...res.data }));
         } catch (err) {
            console.error('Metadata load failed:', err);
         }
      };
      loadMetadata();
   }, [turnstileToken]);

   const handlePSubmit = async (e) => {
      e.preventDefault();
      if (!turnstileToken) return toast.error('Check failed. Complete Captcha.');
      if (!pData.name || !pData.email) return toast.error('Missing required fields.');
      setLoading(true);
      try {
         await publicAPI.submitEntrepreneur(pData, turnstileToken);
         router.push('/submit/success');
      } catch (err) {
         toast.error(err.message);
         setLoading(false);
      }
   };

   const handleLSubmit = async (e) => {
      e.preventDefault();
      if (!turnstileToken) return toast.error('Check failed. Complete Captcha.');
      if (!lData.business_name || !lData.contact_email) return toast.error('Missing required fields.');
      setLoading(true);
      try {
         await publicAPI.submitListing(lData, turnstileToken);
         router.push('/submit/success');
      } catch (err) {
         toast.error(err.message);
         setLoading(false);
      }
   };

   const SectionTitle = ({ icon: Icon, title, subtitle }) => (
      <div className="flex items-center gap-5 mb-10">
         <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-900 shadow-sm shrink-0 border border-emerald-100">
            <Icon size={24} className="shrink-0" />
         </div>
         <div>
            <h3 className="text-xl font-bold text-stone-900 tracking-tight leading-none mb-2">{title}</h3>
            <p className="text-xs font-medium text-stone-400">{subtitle}</p>
         </div>
      </div>
   );

   const tabs = [
      { id: 'entrepreneur', name: 'Founder Spotlight', icon: User },
      { id: 'listing', name: 'Business Listing', icon: Building2 }
   ];

   return (
      <div className="space-y-16 animate-in fade-in duration-700 py-12">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 🚀 The Perfect Sliding Tab Controller */}
            <div className="flex justify-center mb-20">
               <div className="relative bg-white p-2 rounded-[2.5rem] flex items-center w-full max-w-xl border border-stone-100 shadow-xl shadow-stone-200/20 overflow-hidden">
                  {tabs.map((tab) => {
                     const isActive = activeTab === tab.id;
                     return (
                        <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id)}
                           className={`relative flex-1 py-3 flex items-center justify-center gap-3 text-sm font-bold tracking-tight transition-colors duration-500 z-10 ${
                              isActive ? 'text-white' : 'text-stone-400 hover:text-stone-900'
                           }`}
                        >
                           {isActive && (
                              <motion.div
                                 layoutId="activeSubmissionTab"
                                 className="absolute inset-0 bg-emerald-900 rounded-3xl z-[-1] shadow-xl shadow-emerald-900/20"
                                 transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                           )}
                           <tab.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-300' : 'text-stone-300'}`} />
                           {tab.name}
                        </button>
                     );
                  })}
               </div>
            </div>

            <AnimatePresence mode="wait">
               <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
               >
                  {activeTab === 'entrepreneur' ? (
                     <div className="space-y-12">
                        <div className="grid lg:grid-cols-4 gap-12">
                           <div className="hidden lg:block sticky top-8">
                              <div className="p-10 rounded-[2rem] bg-emerald-900 text-white shadow-2xl relative flex flex-col items-start overflow-hidden group border border-emerald-800">
                                 <div className="absolute top-0 right-0 p-12 opacity-5 text-white"><Rocket size={180} /></div>
                                 <div className="w-14 h-14 bg-emerald-800 rounded-2xl flex items-center justify-center text-emerald-300 mb-10 relative z-10 border border-emerald-700/50">
                                    <Rocket size={24} />
                                 </div>
                                 <h2 className="text-3xl font-bold mb-6 tracking-tight leading-tight relative z-10">Forge Your<br/>Legend</h2>
                                 <p className="text-emerald-100/60 font-medium mb-12 leading-relaxed relative z-10 text-sm">
                                    Your personal growth inspires thousands. Tell us the story behind the founder.
                                 </p>
                                 <div className="space-y-8 w-full relative z-10">
                                    {[{ icon: Star, text: 'Personal Branding' }, { icon: Users, text: 'Network Growth' }, { icon: Trophy, text: 'Investor Visibility' }].map((item, i) => (
                                       <div key={i} className="flex gap-4 items-center group/item">
                                          <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 border border-emerald-800 shadow-lg group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-500 shrink-0">
                                             <item.icon size={18} className="shrink-0" />
                                          </div>
                                          <span className="text-[13px] font-medium text-emerald-100/80">{item.text}</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <div className="lg:col-span-3">
                              <form onSubmit={handlePSubmit} className="space-y-10">
                                 <Card className="rounded-[2rem] border-stone-100 shadow-2xl shadow-stone-200/40 p-10 sm:p-14 bg-white">
                                    <SectionTitle icon={Briefcase} title="Identity & Role" subtitle="How should the community know you?" />
                                    <div className="grid sm:grid-cols-2 gap-8 mb-8">
                                       <div className="space-y-3">
                                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Full Name *</label>
                                          <Input placeholder="e.g. Nasir Uddin" className="bg-stone-50/50 border-stone-100 h-16 rounded-2xl font-medium text-lg focus:ring-emerald-900 transition-all" value={pData.name} onChange={(e) => setPData({ ...pData, name: e.target.value })} required />
                                       </div>
                                       <div className="space-y-3">
                                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Designation *</label>
                                          <Input placeholder="e.g. Managing Director" className="bg-stone-50/50 border-stone-100 h-16 rounded-2xl font-medium text-lg focus:ring-emerald-900 transition-all" value={pData.designation} onChange={(e) => setPData({ ...pData, designation: e.target.value })} required />
                                       </div>
                                    </div>
                                    <div className="space-y-3">
                                       <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Company Name *</label>
                                       <Input placeholder="Your organization" className="bg-stone-50/50 border-stone-100 h-16 rounded-2xl font-medium text-lg focus:ring-emerald-900 transition-all" value={pData.company_name} onChange={(e) => setPData({ ...pData, company_name: e.target.value })} required />
                                    </div>
                                 </Card>

                                 <Card className="rounded-[2rem] border-stone-100 shadow-2xl shadow-stone-200/40 p-10 sm:p-14 bg-white">
                                    <SectionTitle icon={FileText} title="The Narrative" subtitle="Your journey storyline" />
                                    <div className="space-y-10">
                                       <div className="space-y-3">
                                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Profile Photo (URL)</label>
                                          <Input placeholder="https://example.com/photo.jpg" className="bg-stone-50/50 border-stone-100 h-16 rounded-2xl font-medium focus:ring-emerald-900" value={pData.photo} onChange={(e) => setPData({ ...pData, photo: e.target.value })} />
                                       </div>
                                       <div className="space-y-3">
                                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Short Excerpt (The Pitch)</label>
                                          <textarea className="w-full bg-stone-50/50 border border-stone-100 rounded-3xl p-8 min-h-[160px] focus:ring-4 focus:ring-emerald-900/5 focus:outline-none transition-all font-medium text-stone-700 text-lg" placeholder="A concise executive summary for discovery cards..." maxLength={400} value={pData.excerpt} onChange={(e) => setPData({ ...pData, excerpt: e.target.value })} />
                                       </div>
                                       <div className="space-y-5">
                                          <label className="text-xs font-black uppercase tracking-widest text-stone-400 ml-1 ml-1 ml-1 ml-1">Deep Journey (Detailed Content)</label>
                                          <PublicRichEditor value={pData.content} onChange={(html) => setPData({ ...pData, content: html })} placeholder="Tell the board about your pivots, growth metrics, and market triumphs..." />
                                       </div>
                                    </div>
                                 </Card>

                                 <div className="flex flex-col items-center gap-12 py-12">
                                    <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setTurnstileToken} />
                                    <Button type="submit" disabled={loading || !turnstileToken} className="w-full max-w-md h-20 rounded-[2rem] bg-emerald-900 hover:bg-emerald-800 text-white font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl shadow-emerald-950/20 active:scale-95 group">
                                       {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <div className="flex items-center gap-3">Authorize Profile Discovery <Sparkles size={18} className="text-emerald-300" /></div>}
                                    </Button>
                                 </div>
                              </form>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-12">
                        <div className="grid lg:grid-cols-4 gap-12">
                           <div className="hidden lg:block sticky top-8">
                              <div className="p-10 rounded-[2rem] bg-stone-900 text-white shadow-2xl relative flex flex-col items-start overflow-hidden group border border-stone-800">
                                 <div className="absolute top-0 right-0 p-12 opacity-5 text-white"><Building2 size={180} /></div>
                                 <div className="w-14 h-14 bg-stone-800 rounded-2xl flex items-center justify-center text-emerald-400 mb-10 relative z-10 border border-stone-700/50">
                                    <Building2 size={24} />
                                 </div>
                                 <h2 className="text-3xl font-bold mb-6 tracking-tight leading-tight relative z-10">Business<br/>Registry</h2>
                                 <p className="text-stone-400 font-medium mb-12 leading-relaxed relative z-10 text-sm">
                                    List your enterprise in Bangladesh's digital directory for the new entrepreneur generation.
                                 </p>
                                 <div className="space-y-8 w-full relative z-10">
                                    {[{ icon: Globe, text: 'Global Discovery' }, { icon: ShieldCheck, text: 'Verified Hub' }, { icon: Mail, text: 'Direct Intake' }].map((item, i) => (
                                       <div key={i} className="flex gap-4 items-center group/item">
                                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-300 shrink-0">
                                             <item.icon size={18} className="shrink-0" />
                                          </div>
                                          <span className="text-[13px] font-medium text-emerald-100/80">{item.text}</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <div className="lg:col-span-3">
                              <form onSubmit={handleLSubmit} className="space-y-10">
                                 <Card className="rounded-[2rem] border-stone-100 shadow-2xl shadow-stone-200/40 p-10 sm:p-14 bg-white">
                                    <SectionTitle icon={Building2} title="Entity Core" subtitle="The baseline registry identity" />
                                    <div className="space-y-10">
                                       <div className="space-y-3">
                                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Official Business Name *</label>
                                          <Input placeholder="GreenTech Bangladesh Ltd" className="bg-stone-50/50 border-stone-100 h-16 rounded-2xl font-medium text-xl focus:ring-emerald-900 transition-all shadow-inner" value={lData.business_name} onChange={(e) => setLData({ ...lData, business_name: e.target.value })} required />
                                       </div>
                                       <div className="grid sm:grid-cols-2 gap-8">
                                          <div className="space-y-3">
                                             <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Operation Sector</label>
                                             <Input placeholder="e.g. Cleantech" className="bg-stone-50/50 border-stone-100 h-16 rounded-2xl font-medium text-lg focus:ring-emerald-900" value={lData.category} onChange={(e) => setLData({ ...lData, category: e.target.value })} />
                                          </div>
                                          <div className="space-y-3">
                                             <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Central Hub Location</label>
                                             <Input placeholder="Gulshan, Dhaka" className="bg-stone-50/50 border-stone-100 h-16 rounded-2xl font-medium text-lg focus:ring-emerald-900" value={lData.headquarters} onChange={(e) => setLData({ ...lData, headquarters: e.target.value })} />
                                          </div>
                                       </div>
                                    </div>
                                 </Card>

                                 <Card className="rounded-[2rem] border-stone-100 shadow-2xl shadow-stone-200/40 p-10 sm:p-14 bg-white">
                                    <SectionTitle icon={Globe} title="Digital Hub" subtitle="Company Assets & Mission" />
                                    <div className="grid sm:grid-cols-2 gap-8 mb-10">
                                       <div className="space-y-3">
                                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Corporate Emblem (URL)</label>
                                          <Input placeholder="Link to logo.png" className="bg-stone-50/50 border-stone-100 h-16 rounded-2xl" value={lData.logo} onChange={(e) => setLData({ ...lData, logo: e.target.value })} />
                                       </div>
                                       <div className="space-y-3">
                                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Venture URL</label>
                                          <Input placeholder="https://venture.bd" className="bg-stone-50/50 border-stone-100 h-16 rounded-2xl font-medium text-emerald-900 text-lg" value={lData.website} onChange={(e) => setLData({ ...lData, website: e.target.value })} />
                                       </div>
                                    </div>
                                    <div className="space-y-5">
                                       <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 ml-1">Mission Statement</label>
                                       <PublicRichEditor value={lData.content} onChange={(html) => setLData({ ...lData, content: html })} placeholder="Describe your corporate mission, values, and market unique selling points..." />
                                    </div>
                                 </Card>

                                 <div className="flex flex-col items-center gap-12 py-12">
                                    <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setTurnstileToken} />
                                    <Button type="submit" disabled={loading || !turnstileToken} className="w-full max-w-md h-20 rounded-[2rem] bg-emerald-900 hover:bg-emerald-800 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-emerald-950/20 active:scale-95 group transition-all">
                                       {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <div className="flex items-center gap-3">Register Professional Listing <ShieldCheck size={18} className="text-emerald-300" /></div>}
                                    </Button>
                                 </div>
                              </form>
                           </div>
                        </div>
                     </div>
                  )}
               </motion.div>
            </AnimatePresence>
         </div>
      </div>
   );
}
