"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Image as ImageIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  // Entrepreneur Form State
  const [pData, setPData] = useState({
    name: '', designation: '', company_name: '', industry: '', category: '', 
    excerpt: '', content: '', email: '', social_linkedin: '', social_twitter: '', 
    social_facebook: '', photo: '', contact_email: '', contact_phone: ''
  });

  // Listing Form State
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
        setMetadata(prev => ({
          ...prev,
          ...res.data
        }));
      } catch (err) {
        console.error('Metadata load failed:', err);
      }
    };
    loadMetadata();
  }, [turnstileToken]);

  const handlePSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) return toast.error('Check failed. Complete Captcha.');
    if (!pData.name || !pData.email || !pData.contact_email) return toast.error('Missing required fields.');

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
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center text-emerald-900 shadow-sm shrink-0 border border-emerald-100">
        <Icon size={22} />
      </div>
      <div>
        <h3 className="text-xl font-black text-stone-900 tracking-tight leading-none mb-1">{title}</h3>
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-16 animate-in fade-in duration-700">
      <div className="flex justify-center w-full">
        <TabsList className="bg-stone-100 p-1.5 rounded-[2rem] h-auto flex gap-1 w-full max-w-lg border border-stone-200/40 shadow-inner">
          <TabsTrigger 
            value="entrepreneur" 
            className="flex-1 rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-lg text-stone-400 font-black uppercase text-[10px] tracking-widest transition-all"
          >
            Founder Spotlight
          </TabsTrigger>
          <TabsTrigger 
            value="listing" 
            className="flex-1 rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-lg text-stone-400 font-black uppercase text-[10px] tracking-widest transition-all"
          >
            Business Listing
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="entrepreneur" className="space-y-12">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Marketing Sidebar */}
          <div className="hidden lg:block space-y-6">
             <div className="p-10 rounded-[3rem] bg-emerald-950 text-white shadow-2xl shadow-emerald-950/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <Rocket className="w-12 h-12 text-emerald-400 mb-8 relative z-10" />
                <h2 className="text-3xl font-black mb-6 relative z-10 tracking-tight">Showcase Your Journey.</h2>
                <div className="space-y-8 relative z-10">
                   {[
                     { icon: Star, text: 'Personal Brand Authority' },
                     { icon: Users, text: 'Community Networking' },
                     { icon: Trophy, text: 'Venture Backing Ready' }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-xl bg-emerald-900 flex items-center justify-center text-emerald-400 border border-emerald-800">
                           <item.icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-emerald-100/80 uppercase tracking-widest leading-none">{item.text}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Form Core */}
          <div className="lg:col-span-3">
             <form onSubmit={handlePSubmit} className="space-y-8">
                <Card className="rounded-[3.5rem] border-stone-100 shadow-xl shadow-stone-200/40 p-12">
                   <SectionTitle icon={Briefcase} title="Identity Hub" subtitle="Your professional anchor" />
                   <div className="grid sm:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Full Name *</label>
                         <Input 
                            placeholder="e.g. Nasir Uddin" 
                            className="bg-stone-50 border-stone-100 h-14 rounded-2xl focus:ring-emerald-900 transition-all font-medium"
                            value={pData.name}
                            onChange={(e) => setPData({...pData, name: e.target.value})}
                            required
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Designation *</label>
                         <Input 
                            placeholder="e.g. CEO & Founder" 
                            className="bg-stone-50 border-stone-100 h-14 rounded-2xl focus:ring-emerald-900 transition-all font-medium"
                            value={pData.designation}
                            onChange={(e) => setPData({...pData, designation: e.target.value})}
                            required
                         />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Current Company Name *</label>
                      <Input 
                         placeholder="The business you are leading" 
                         className="bg-stone-50 border-stone-100 h-14 rounded-2xl focus:ring-emerald-900 transition-all font-medium"
                         value={pData.company_name}
                         onChange={(e) => setPData({...pData, company_name: e.target.value})}
                         required
                      />
                   </div>
                </Card>

                <Card className="rounded-[3.5rem] border-stone-100 shadow-xl shadow-stone-200/40 p-12">
                   <SectionTitle icon={FileText} title="The Narrative" subtitle="Storytelling & Bio" />
                   <div className="space-y-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Profile Photo (Direct Link)</label>
                         <Input 
                            placeholder="https://example.com/photo.jpg" 
                            className="bg-stone-50 border-stone-100 h-14 rounded-2xl focus:ring-emerald-900 transition-all"
                            value={pData.photo}
                            onChange={(e) => setPData({...pData, photo: e.target.value})}
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Short Pitch (Max 400 chars)</label>
                         <textarea 
                            className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] p-6 min-h-[120px] focus:ring-4 focus:ring-emerald-900/5 focus:outline-none transition-all font-medium text-stone-700 shadow-inner"
                            placeholder="A concise summary for discovery cards..."
                            maxLength={400}
                            value={pData.excerpt}
                            onChange={(e) => setPData({...pData, excerpt: e.target.value})}
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Deep Journey (The Full Story)</label>
                         <PublicRichEditor 
                            value={pData.content} 
                            onChange={(html) => setPData({...pData, content: html})}
                            placeholder="Tell the community about your struggles, pivots, and victories..."
                         />
                      </div>
                   </div>
                </Card>

                <div className="flex flex-col items-center gap-10 py-8">
                    <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setTurnstileToken} />
                    <Button 
                      type="submit" 
                      disabled={loading || !turnstileToken}
                      className="w-full max-w-md h-16 rounded-3xl bg-emerald-900 hover:bg-emerald-800 text-white font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-emerald-950/20 active:scale-95"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Submit Profile &rarr;"}
                    </Button>
                </div>
             </form>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="listing" className="space-y-12">
        <div className="grid lg:grid-cols-4 gap-12">
           {/* Sidebar */}
           <div className="hidden lg:block space-y-6">
              <div className="p-10 rounded-[3rem] bg-stone-900 text-white shadow-2xl shadow-stone-900/20">
                 <Building2 className="w-12 h-12 text-emerald-400 mb-8" />
                 <h2 className="text-3xl font-black mb-6 tracking-tight">Scale Your Business.</h2>
                 <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mb-12">Register your organization in the definitive directory.</p>
                 <div className="space-y-6">
                    {["SEO Optimized Listing", "Lead Generation Hub", "Verified Ecosystem Badge"].map((t, i) => (
                       <div key={i} className="flex gap-4 items-center border-l-2 border-emerald-900 pl-6 h-12 bg-white/5 rounded-r-2xl">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/60">{t}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Form */}
           <div className="lg:col-span-3">
              <form onSubmit={handleLSubmit} className="space-y-8">
                 <Card className="rounded-[3.5rem] border-stone-100 shadow-xl shadow-stone-200/40 p-12">
                   <SectionTitle icon={Building2} title="Company Foundation" subtitle="The core business identity" />
                   <div className="space-y-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Business Name *</label>
                         <Input 
                            placeholder="e.g. GreenTech Bangladesh" 
                            className="bg-stone-50 border-stone-100 h-14 rounded-2xl focus:ring-emerald-900 transition-all font-black text-lg tracking-tight"
                            value={lData.business_name}
                            onChange={(e) => setLData({...lData, business_name: e.target.value})}
                            required
                         />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Category / Sector</label>
                            <Input 
                               placeholder="e.g. Fintech" 
                               className="bg-stone-50 border-stone-100 h-14 rounded-2xl focus:ring-emerald-900 transition-all"
                               value={lData.category}
                               onChange={(e) => setLData({...lData, category: e.target.value})}
                            />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">HQ Location</label>
                            <Input 
                               placeholder="e.g. Banani, Dhaka" 
                               className="bg-stone-50 border-stone-100 h-14 rounded-2xl focus:ring-emerald-900 transition-all font-medium"
                               value={lData.headquarters}
                               onChange={(e) => setLData({...lData, headquarters: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>
                 </Card>

                 <Card className="rounded-[3.5rem] border-stone-100 shadow-xl shadow-stone-200/40 p-12">
                    <SectionTitle icon={Globe} title="Digital Assets" subtitle="Logos & Visual Presence" />
                    <div className="grid sm:grid-cols-2 gap-8 mb-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Company Logo (URL)</label>
                          <Input 
                             placeholder="Direct link to .png/.jpg" 
                             className="bg-stone-50 border-stone-100 h-14 rounded-2xl"
                             value={lData.logo}
                             onChange={(e) => setLData({...lData, logo: e.target.value})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Website URL</label>
                          <Input 
                             placeholder="https://business.bd" 
                             className="bg-stone-50 border-stone-100 h-14 rounded-2xl font-bold text-emerald-900"
                             value={lData.website}
                             onChange={(e) => setLData({...lData, website: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Detailed About (Story)</label>
                        <PublicRichEditor 
                           value={lData.content} 
                           onChange={(html) => setLData({...lData, content: html})}
                           placeholder="Describe your mission, values, and what makes your business unique..."
                        />
                    </div>
                 </Card>

                 <div className="flex flex-col items-center gap-10 py-8">
                    <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setTurnstileToken} />
                    <Button 
                      type="submit" 
                      disabled={loading || !turnstileToken}
                      className="w-full max-w-md h-16 rounded-3xl bg-emerald-900 hover:bg-emerald-800 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-950/20 active:scale-95 transition-all"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Register Business &rarr;"}
                    </Button>
                </div>
              </form>
           </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
