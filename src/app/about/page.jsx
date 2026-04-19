import React from 'react';
import { siteConfig, editorialPrinciples } from '@/data/mock';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Rocket, 
  Target, 
  Award, 
  Linkedin, 
  Facebook, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: `About ${siteConfig.name} | The Founder's Mission`,
  description: siteConfig.description,
};

export default function AboutPage() {
  return (
    <div className="bg-stone-50 overflow-hidden">
      {/* 🛡️ Aesthetic Deck: Hero Narrative */}
      <section className="relative py-24 lg:py-32 bg-white">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <Rocket size={400} className="text-emerald-900" />
        </div>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="bg-emerald-100 text-emerald-900 border-none mb-8 px-6 py-2 uppercase tracking-[0.2em] text-[10px] font-black shadow-sm">
            Our Heritage
          </Badge>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-stone-900 mb-10 tracking-tighter leading-none">
            About <span className="text-emerald-900 font-serif italic">{siteConfig.name}</span>
          </h1>
          <p className="text-xl sm:text-2xl text-stone-500 max-w-3xl mx-auto leading-relaxed font-medium">
            Building the definitive hub for entrepreneurial excellence in Bangladesh and beyond.
          </p>
        </div>
      </section>

      {/* 🛡️ Mission Pillar Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
               <h2 className="text-4xl font-black text-stone-900 mb-8 tracking-tight">Our <span className="text-emerald-900">Purpose.</span></h2>
               <div className="space-y-6 text-lg text-stone-600 font-medium leading-relaxed">
                  <p>
                    {siteConfig.name} was forged to be the premier destination for visionaries seeking high-fidelity,
                    actionable intelligence. We transcend traditional motivational narratives to deliver the tactical
                    blueprints required to launch and scale enterprises.
                  </p>
                  <p>
                    Whether you are an emerging founder or an established enterprise leader, our ecosystem provides
                    the intelligence, strategies, and verified networks necessary to navigate the complexities of the modern market.
                  </p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {[
                 { icon: BookOpen, title: "Verified Resources", desc: "Elite guides covering enterprise architecture and digital marketing." },
                 { icon: Target, title: "Growth Tactics", desc: "Battle-tested frameworks to scale your venture with precision." }
               ].map((item, i) => (
                 <Card key={i} className="border-none shadow-xl shadow-stone-200/50 rounded-[2.5rem] p-8 bg-white transition-all hover:scale-105">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-900 mb-6">
                       <item.icon size={24} />
                    </div>
                    <h3 className="font-black text-stone-900 mb-3 tracking-tight">{item.title}</h3>
                    <p className="text-sm text-stone-500 font-medium leading-relaxed">{item.desc}</p>
                 </Card>
               ))}
               {[
                 { icon: Award, title: "Expert Portals", desc: "Direct access to some of the finest minds in the regional ecosystem." },
                 { icon: Sparkles, title: "Narrative Hub", desc: "Elite storytelling that celebrates the legacies of modern founders." }
               ].map((item, i) => (
                 <Card key={i} className="border-none shadow-xl shadow-stone-200/50 rounded-[2.5rem] p-8 bg-white transition-all hover:scale-105">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-900 mb-6">
                       <item.icon size={24} />
                    </div>
                    <h3 className="font-black text-stone-900 mb-3 tracking-tight">{item.title}</h3>
                    <p className="text-sm text-stone-500 font-medium leading-relaxed">{item.desc}</p>
                 </Card>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* 🛡️ Founder Spotlight: High-Impact Deck */}
      <section className="py-24 lg:py-32 bg-emerald-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-3 gap-20 items-start">
             <div className="lg:col-span-1">
                <div className="sticky top-12">
                   <div className="rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-emerald-900/50 mb-10 group transition-all duration-700">
                      <img 
                        src="/shaddam.webp" 
                        alt={siteConfig.founder.name}
                        className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                   </div>
                   <div className="text-center lg:text-left">
                      <h3 className="text-4xl font-black mb-2 tracking-tight">{siteConfig.founder.name}</h3>
                      <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-8">{siteConfig.founder.title}</p>
                      <div className="flex justify-center lg:justify-start gap-4">
                        <a href={siteConfig.founder.linkedin} target="_blank" className="w-12 h-12 rounded-2xl bg-emerald-900 flex items-center justify-center border border-emerald-800 hover:bg-emerald-800 transition-all">
                           <Linkedin size={20} className="text-emerald-100" />
                        </a>
                        <a href={siteConfig.founder.facebook} target="_blank" className="w-12 h-12 rounded-2xl bg-emerald-900 flex items-center justify-center border border-emerald-800 hover:bg-emerald-800 transition-all">
                           <Facebook size={20} className="text-emerald-100" />
                        </a>
                      </div>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-2 space-y-10">
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-2 uppercase tracking-[0.2em] text-[10px] font-black">
                   Founder Spotlight
                </Badge>
                <div className="space-y-8 text-xl text-emerald-100/80 font-medium leading-relaxed">
                   <p>{siteConfig.founder.bio}</p>
                   <p>
                     Shaddam Hossain&apos;s professional journey has been defined by leadership in the marketing and technology sectors. 
                     As a former lead at HasThemes, he spearheaded complex sales and marketing architectures for scaling IT organizations.
                   </p>
                   <p>
                     {siteConfig.name} represents his commitment to fostering a realistic, practical entrepreneurship culture. 
                     His vision is to provide aspiring leaders with the raw intelligence required to thrive in a competitive digital economy.
                   </p>
                </div>

                <div className="pt-12 border-t border-emerald-900">
                   <h4 className="text-white font-black text-2xl mb-8 tracking-tight">Professional Credentials</h4>
                   <div className="grid sm:grid-cols-2 gap-6">
                      {[
                        "Digital Business Architect",
                        "Affiliate Marketing Specialist",
                        "Former Team Lead, Sales at HasThemes",
                        "Team Coordination Specialist"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                           <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center group-hover:bg-emerald-500 transition-all">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-white" />
                           </div>
                           <span className="text-sm font-bold uppercase tracking-widest text-emerald-100/60 group-hover:text-white transition-all">{item}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 🛡️ Value System Deck */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center mb-20">
              <h2 className="text-4xl font-black text-stone-900 mb-4 tracking-tight">The <span className="text-emerald-900 font-serif italic">Values</span> that Drive Us.</h2>
              <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">Guided by precision, integrity, and depth.</p>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {editorialPrinciples.principles.map((p, i) => (
                <Card key={i} className="border-stone-100 shadow-xl shadow-stone-200/30 rounded-[2.5rem] p-10 bg-white transition-all hover:translate-y--2">
                   <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-emerald-900 border border-stone-100 mb-8 font-black text-sm">
                      {i + 1}
                   </div>
                   <h3 className="text-xl font-black text-stone-900 mb-4 tracking-tight">{p.title}</h3>
                   <p className="text-sm text-stone-500 font-medium leading-relaxed">{p.description}</p>
                </Card>
              ))}
           </div>
        </div>
      </section>

      {/* 🛡️ Final Call to Action */}
      <section className="py-24 bg-stone-50 border-t border-stone-200/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <h2 className="text-4xl font-black text-stone-900 mb-8 tracking-tight">Begin your <span className="text-emerald-900">Transformation.</span></h2>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/knowledge">
                 <Button className="h-16 px-12 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-950/20 min-w-[220px]">
                    Explore Insights
                 </Button>
              </Link>
              <Link href="/contact">
                 <Button variant="outline" className="h-16 px-12 rounded-2xl border-emerald-900 text-emerald-900 hover:bg-emerald-50 font-black uppercase tracking-widest text-xs min-w-[220px]">
                    Contact Hub &rarr;
                 </Button>
              </Link>
           </div>
        </div>
      </section>
    </div>
  );
}
