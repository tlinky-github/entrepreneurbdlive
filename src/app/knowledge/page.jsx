import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, BookOpen, Lightbulb, MapPin, Users, Target, 
  TrendingUp, Brain, DollarSign, AlertTriangle, Rocket, 
  Laptop, ChevronRight, Sparkles 
} from 'lucide-react';
import { getBreadcrumbSchema } from '@/lib/seo-schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { pillarPages, pillarPagesPart2 } from '@/data/mock';
import { contentAPI } from '@/lib/api';

const iconMap = {
  Lightbulb: Lightbulb,
  MapPin: MapPin,
  Users: Users,
  Building: Target,
  Brain: Brain,
  DollarSign: DollarSign,
  TrendingUp: TrendingUp,
  Laptop: Laptop,
  AlertTriangle: AlertTriangle,
  Rocket: Rocket,
  Target: Target, // Fallback mapping
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://entrepreneurs.com.bd';

export async function generateMetadata() {
  return {
    metadataBase: new URL(BASE_URL),
    title: 'Business Knowledge Hub',
    description: 'A high-fidelity resource library for building and growing a successful business. From startup basics to scaling strategies.',
    canonical: '/knowledge',
    openGraph: {
      title: 'Business Knowledge Hub | Entrepreneurs BD',
      description: 'Your complete resource library for building and growing a successful business.',
      url: '/knowledge',
      siteName: 'Entrepreneurs BD',
      locale: 'en_BD',
      type: 'website',
    },
  };
}

export default async function KnowledgeHubGateway() {
  let firestoreArticles = [];
  try {
    const res = await contentAPI.list('knowledge');
    firestoreArticles = (res.data || []).filter(a => a.status === 'published');
  } catch (err) {
    console.error('[Knowledge Hub] Ingestion Error:', err);
  }

  const allPillarPages = [...pillarPages, ...pillarPagesPart2];

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Knowledge Hub', path: '/knowledge' }
  ]);

  return (
    <div className="bg-white min-h-screen">
      {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />}
      
      {/* 🚀 The Perfect Breadcrumb Engine */}
      <Breadcrumbs />

      {/* 🛡️ Narrative Header */}
      <section className="py-20 lg:py-32 bg-stone-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <BookOpen size={400} className="text-emerald-900" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white border border-stone-200/60 mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-900" />
            <span className="text-xs font-bold text-stone-900">Intelligence Gateway</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-stone-900 mb-8 tracking-tighter">
            Business Knowledge Hub
          </h1>
          <p className="text-xl text-stone-500 font-medium max-w-2xl mx-auto leading-relaxed">
            A high-fidelity resource library engineered for the modern founder. Discover the strategies and frameworks required to scale with precision.
          </p>
        </div>
      </section>

      {/* 🛡️ Strategic Topics Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {allPillarPages.map((pillar) => {
              const IconComponent = iconMap[pillar.icon] || BookOpen;
              return (
                <Card
                  key={pillar.id}
                  className="group border border-stone-100 bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-stone-200/50 hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-500 flex flex-col"
                >
                  <CardHeader className="p-10 pb-6 flex-1">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-stone-50 flex items-center justify-center mb-8 border border-stone-100 group-hover:bg-emerald-900 group-hover:border-emerald-800 transition-all duration-500 group-hover:scale-110">
                      <IconComponent className="w-8 h-8 text-emerald-900 group-hover:text-white transition-colors" />
                    </div>
                    <CardTitle className="text-2xl font-black text-stone-900 tracking-tight mb-4 group-hover:text-emerald-900 transition-colors">
                      <Link href={`/knowledge/${pillar.id}`}>
                        {pillar.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-lg text-emerald-900 font-serif italic mb-6">
                      {pillar.subtitle}
                    </CardDescription>
                    <p className="text-stone-500 font-medium leading-relaxed mb-6">
                       {pillar.description}
                    </p>
                  </CardHeader>
                  <CardContent className="p-10 pt-0">
                    <div className="flex items-center justify-between pt-8 border-t border-stone-100">
                      <span className="text-xs font-bold text-stone-400">
                        {pillar.content?.sections?.length || 0} Strategic Pillars
                      </span>
                      <Link
                        href={`/knowledge/${pillar.id}`}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-900 hover:text-emerald-700 transition-colors"
                      >
                        Read Narrative
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 🛡️ Extended Dynamic Library */}
          {firestoreArticles.length > 0 && (
            <div className="mt-32">
              <div className="text-center mb-16 animate-fade-in">
                <div className="h-[2px] w-24 bg-stone-200 mx-auto mb-8" />
                <h2 className="text-3xl font-black text-stone-900 tracking-tighter uppercase tracking-widest text-xs mb-4">Deep Ingestion</h2>
                <p className="text-xl text-stone-500 font-medium">Dynamic updates from the field</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {firestoreArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="border border-stone-100 bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
                  >
                    <CardHeader className="p-8">
                       <Link href={`/knowledge/${article.slug}`}>
                         <h3 className="text-xl font-black text-stone-900 hover:text-emerald-900 transition-colors tracking-tight mb-4">
                            {article.title}
                         </h3>
                       </Link>
                       <p className="text-stone-500 font-medium line-clamp-3 mb-6 leading-relaxed">
                          {article.excerpt || article.seo_description || 'Strategic brief overview.'}
                       </p>
                       <Link href={`/knowledge/${article.slug}`} className="text-xs font-black uppercase tracking-widest text-emerald-900 flex items-center gap-2">
                          View Asset <ArrowRight size={14} />
                       </Link>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 🛡️ Learning Path Hub */}
      <section className="py-24 bg-emerald-900 relative overflow-hidden text-center">
         <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none text-white">
            <Rocket size={400} />
         </div>
         <div className="max-w-4xl mx-auto px-4 relative z-10">
            <h2 className="text-4xl font-black text-white mb-8 tracking-tighter">Your <span className="text-emerald-300">Operational Alpha.</span></h2>
            <p className="text-xl text-emerald-100/70 font-medium leading-relaxed mb-16">
               New here? Follow the definitive growth path to build your foundation from the ground up.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
               {[
                 { num: 1, title: "Definition", desc: "What is Entrepreneurship?", href: "/knowledge/what-is-entrepreneurship" },
                 { num: 2, title: "Mindset", desc: "Founder Psychologies", href: "/knowledge/entrepreneurial-mindset" },
                 { num: 3, title: "Models", desc: "Business Frameworks", href: "/knowledge/business-models" },
                 { num: 4, title: "Risk", desc: "Mitigation & Challenges", href: "/knowledge/challenges-risks" },
               ].map((step) => (
                 <Link
                   key={step.num}
                   href={step.href}
                   className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white hover:border-white transition-all duration-500"
                 >
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-emerald-900 transition-colors">
                      <span className="text-white font-black">{step.num}</span>
                   </div>
                   <h4 className="text-white group-hover:text-emerald-900 font-serif italic text-xs mb-1 transition-colors">{step.title}</h4>
                   <p className="text-white group-hover:text-stone-900 font-black tracking-tight leading-tight transition-colors">{step.desc}</p>
                 </Link>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}
