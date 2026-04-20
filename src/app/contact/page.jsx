'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  MapPin, 
  Linkedin, 
  Facebook, 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  Network,
  ArrowRight
} from 'lucide-react';
import { siteConfig } from '@/data/mock';
import { toast } from 'sonner';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate high-performance transmission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Communication Transmitted', {
      description: 'Your message has been received and indexed by our team.'
    });

    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="bg-stone-50 overflow-hidden min-h-screen pb-24">
      {/* 🛡️ Aesthetic Deck: Hero Narrative */}
      <section className="relative py-24 lg:py-32 bg-white">
        <div className="absolute inset-0 bg-stone-50/50 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <Badge className="bg-emerald-100 text-emerald-900 border-none mb-8 px-6 py-2 uppercase tracking-[0.2em] text-[10px] font-black shadow-sm">
            Interaction Gateway
          </Badge>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-stone-900 mb-10 tracking-tighter leading-none">
            Contact & <span className="text-emerald-900 font-serif italic">Transparency.</span>
          </h1>
          <p className="text-xl sm:text-2xl text-stone-500 max-w-3xl mx-auto leading-relaxed font-medium">
            We welcome inquiries, feedback, and strategic suggestions. Connect with the ecosystem here.
          </p>
        </div>
      </section>

      {/* 🛡️ Interaction Hub */}
      <section className="py-24 relative -mt-12 z-20">
        <div className="max-w-7xl mx-auto px-4">
           <div className="grid lg:grid-cols-3 gap-12 lg:gap-20">
              {/* Identity Deck */}
              <div className="lg:col-span-1 space-y-8">
                 <Card className="border-none shadow-xl shadow-stone-200/40 rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="p-10 pb-2">
                       <CardTitle className="text-2xl font-black text-stone-900 tracking-tight">Identity Hub</CardTitle>
                       <CardDescription className="font-bold text-xs uppercase tracking-widest text-stone-400">Verified Touchpoints</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                       <div className="flex gap-6 items-center group">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-900 border border-emerald-100 transition-all group-hover:bg-emerald-900 group-hover:text-white">
                             <Mail size={22} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Official Email</p>
                             <a href={`mailto:${siteConfig.contact.email}`} className="text-lg font-black text-stone-900 hover:text-emerald-900 transition-colors">
                                {siteConfig.contact.email}
                             </a>
                          </div>
                       </div>

                       <div className="flex gap-6 items-center group">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-900 border border-emerald-100 transition-all group-hover:bg-emerald-900 group-hover:text-white">
                             <MapPin size={22} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Global HQ</p>
                             <p className="text-lg font-black text-stone-900">
                                {siteConfig.contact.location}
                             </p>
                          </div>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="border-none shadow-xl shadow-stone-200/40 rounded-[2.5rem] bg-stone-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                       <Network size={200} />
                    </div>
                    <CardHeader className="p-10">
                       <CardTitle className="text-2xl font-black tracking-tight">Ecosystem Pulse</CardTitle>
                       <CardDescription className="font-bold text-xs uppercase tracking-widest text-stone-400">Social Narratives</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-0">
                       <div className="flex gap-4">
                          <a href={siteConfig.founder.linkedin} target="_blank" className="flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-black text-xs uppercase tracking-widest">
                             <Linkedin size={18} /> LinkedIn
                          </a>
                          <a href={siteConfig.founder.facebook} target="_blank" className="flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-black text-xs uppercase tracking-widest">
                             <Facebook size={18} /> Facebook
                          </a>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="border-emerald-100 bg-emerald-50/50 rounded-[2.5rem] p-10 border shadow-inner">
                    <h4 className="text-emerald-900 font-black text-lg mb-4 flex items-center gap-3 tracking-tight">
                       <ShieldCheck className="text-emerald-600" /> Response Protocol
                    </h4>
                    <p className="text-sm font-medium text-emerald-800/70 leading-relaxed">
                       Our curation board aims to process all incoming intelligence within 48-72 standard business hours. 
                    </p>
                 </Card>
              </div>

              {/* Communication Engine */}
              <div className="lg:col-span-2">
                 <Card className="border-none shadow-2xl shadow-stone-200/60 rounded-[3.5rem] bg-white p-10 sm:p-16">
                    <div className="flex items-center gap-6 mb-12">
                       <div className="w-16 h-16 bg-stone-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-stone-900/20">
                          <MessageSquare size={30} />
                       </div>
                       <div>
                          <CardTitle className="text-4xl font-black text-stone-900 tracking-tighter">Unified Transmission</CardTitle>
                          <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Send regular inquiries or strategic feedback</p>
                       </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                       <div className="grid sm:grid-cols-2 gap-10">
                          <div className="group space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1 transition-colors group-focus-within:text-emerald-900">Full Name *</Label>
                             <Input 
                                placeholder="Nasir Uddin" 
                                className="h-16 rounded-2xl border-stone-100 bg-stone-50 focus:ring-4 focus:ring-emerald-900/5 transition-all text-lg font-black tracking-tight"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                             />
                          </div>
                          <div className="group space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1 transition-colors group-focus-within:text-emerald-900">Email Address *</Label>
                             <Input 
                                type="email"
                                placeholder="innovator@ecosystem.bd" 
                                className="h-16 rounded-2xl border-stone-100 bg-stone-50 focus:ring-4 focus:ring-emerald-900/5 transition-all font-bold"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                required
                             />
                          </div>
                       </div>

                       <div className="group space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1 transition-colors group-focus-within:text-emerald-900">Communication Subject *</Label>
                          <Input 
                             placeholder="Regarding Platform Partnership..." 
                             className="h-16 rounded-2xl border-stone-100 bg-stone-50 focus:ring-4 focus:ring-emerald-900/5 transition-all font-bold"
                             value={formData.subject}
                             onChange={(e) => setFormData({...formData, subject: e.target.value})}
                             required
                          />
                       </div>

                       <div className="group space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1 transition-colors group-focus-within:text-emerald-900">Your Message *</Label>
                          <Textarea 
                             placeholder="Elaborate on your inquiry..." 
                             rows={8}
                             className="rounded-3xl border-stone-100 bg-stone-50 focus:ring-4 focus:ring-emerald-900/5 transition-all font-medium text-lg min-h-[220px] p-8"
                             value={formData.message}
                             onChange={(e) => setFormData({...formData, message: e.target.value})}
                             required
                          />
                       </div>

                       <Button 
                         type="submit" 
                         disabled={isSubmitting}
                         className="h-20 w-full sm:w-auto px-16 rounded-3xl bg-emerald-900 hover:bg-emerald-800 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-950/20 active:scale-95 transition-all flex items-center gap-4"
                       >
                          {isSubmitting ? (
                             <>
                               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Transmitting...
                             </>
                          ) : (
                             <>Transmit Message <Send size={18} /></>
                          )}
                       </Button>
                    </form>
                 </Card>
              </div>
           </div>
        </div>
      </section>

      {/* 🛡️ Transparency Engagement */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-4xl font-black text-stone-900 mb-8 tracking-tighter leading-tight">Elite Commitments to <span className="text-emerald-900">Transparency.</span></h2>
           <div className="space-y-8 text-xl text-stone-500 font-medium leading-relaxed">
              <p>
                 {siteConfig.name} is architected on a foundation of radical transparency. We believe trusts are forged through clear, evidence-based narratives and 
                 open communication about our editorial protocols.
              </p>
              <p>
                 If you identify narrative discrepancies, require editorial clarifications, or seek further identification of our platform&apos;s data origins, 
                 we encourage you to reach out. We are committed to the continuous hardening of our intelligence quality.
              </p>
           </div>
           
           <div className="mt-12 flex justify-center">
              <Link href="/about">
                 <Button variant="ghost" className="h-14 px-8 rounded-xl text-emerald-900 font-black uppercase tracking-widest text-[11px] gap-2">
                    Review Our Principles <ArrowRight size={16} />
                 </Button>
              </Link>
           </div>
        </div>
      </section>
    </div>
  );
}
