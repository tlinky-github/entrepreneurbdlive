import Link from 'next/link';
import { BookOpen, ArrowRight, Lightbulb, MapPin, Users, Target, Brain, DollarSign, AlertTriangle, Rocket, Laptop } from 'lucide-react';
import { contentAPI } from '@/lib/api';
import { pillarPages, pillarPagesPart2 } from '@/data/mock';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: "Business Knowledge Hub | Entrepreneurs BD",
  description: "Your complete resource library for building and growing a successful business. From startup basics to scaling strategies.",
};

const iconMap = {
  Lightbulb,
  MapPin,
  Users,
  Building: Target,
  Brain,
  DollarSign,
  TrendingUp: Rocket,
  Laptop,
  AlertTriangle,
  Rocket,
};

export default async function KnowledgeHubPage() {
  // --- SERVER DATA FETCHING ---
  const res = await contentAPI.list('knowledge').catch(() => ({ data: [] }));
  const firestoreArticles = (res.data || []).filter(a => a.status === 'published');
  
  const allPillarPages = [...pillarPages, ...pillarPagesPart2];

  // --- SCHEMAS ---
  const siteUrl = "https://entrepreneurs.bd";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Business Knowledge Hub",
    "description": "Complete resource library for Bangladesh entrepreneurs.",
    "url": `${siteUrl}/knowledge`,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        ...allPillarPages.map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "url": `${siteUrl}/knowledge/${p.id}`,
          "name": p.title
        })),
        ...firestoreArticles.map((a, i) => ({
          "@type": "ListItem",
          "position": allPillarPages.length + i + 1,
          "url": `${siteUrl}/knowledge/${a.slug}`,
          "name": a.title
        }))
      ]
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Hero Section */}
      <section className="py-20 bg-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_0)] bg-[size:30px_30px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/50 border border-emerald-800 mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-emerald-100" />
              <span className="text-sm font-black uppercase tracking-widest text-emerald-100">Knowledge Hub</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 tracking-tighter">
              The Startup Library
            </h1>
            <p className="text-xl text-emerald-100/80 leading-relaxed font-medium">
              A comprehensive library of frameworks, definitions, and strategies 
              for the next generation of Bangladeshi founders.
            </p>
          </div>
        </div>
      </section>

      {/* Main Core Concepts Grid */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-900/40 mb-12 text-center">Core Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allPillarPages.map((pillar) => {
              const IconComponent = iconMap[pillar.icon] || BookOpen;
              return (
                <Link key={pillar.id} href={`/knowledge/${pillar.id}`}>
                  <Card className="group border-stone-200 bg-white h-full shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 rounded-[2.5rem] overflow-hidden border-none ring-1 ring-stone-900/5">
                    <CardHeader className="pb-4 p-8">
                      <div className="w-16 h-16 rounded-2xl bg-stone-50 flex items-center justify-center mb-6 group-hover:bg-emerald-900 group-hover:rotate-6 transition-all duration-500">
                        <IconComponent className="w-8 h-8 text-emerald-900 group-hover:text-white transition-colors" />
                      </div>
                      <CardTitle className="text-2xl font-black text-stone-900 group-hover:text-emerald-900 transition-colors mb-2">
                         {pillar.title}
                      </CardTitle>
                      <CardDescription className="text-stone-500 font-bold uppercase text-[10px] tracking-widest">
                        {pillar.subtitle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 flex flex-col flex-1">
                      <p className="text-sm text-stone-600 mb-8 flex-1 leading-relaxed hyphens-auto">
                        {pillar.description}
                      </p>
                      <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                          {pillar.content.sections.length} Lessons
                        </span>
                        <div className="inline-flex items-center text-xs font-black uppercase tracking-widest text-emerald-900 group-hover:translate-x-2 transition-transform">
                          Enter Lecture
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Firestore Deep Dive Articles */}
          {firestoreArticles.length > 0 && (
            <div className="mt-32">
              <div className="flex flex-col items-center mb-16">
                 <h2 className="text-3xl font-black text-stone-900 mb-4">Deep Dive Library</h2>
                 <div className="h-1.5 w-12 bg-emerald-900 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {firestoreArticles.map((article) => (
                  <Link key={article.id} href={`/knowledge/${article.slug}`}>
                    <Card className="group border-stone-200 bg-white h-full shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden">
                      <CardHeader className="pb-4 p-0">
                        <div className="h-48 bg-stone-100 overflow-hidden relative">
                           {article.featured_image ? (
                             <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center bg-stone-100 opacity-50">
                                <BookOpen className="w-12 h-12 text-stone-300" />
                             </div>
                           )}
                           <Badge className="absolute top-4 left-4 bg-white/90 text-stone-900 backdrop-blur-sm border-none font-bold uppercase text-[9px] tracking-widest">Article</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-2 flex flex-col flex-1">
                        <CardTitle className="text-xl font-bold text-stone-900 mb-3 group-hover:text-emerald-900 transition-colors">
                           {article.title}
                        </CardTitle>
                        <p className="text-sm text-stone-500 line-clamp-2 mb-6 leading-relaxed">
                          {article.excerpt || article.seo_description || 'In-depth analysis and practical insights for entrepreneurs.'}
                        </p>
                        <div className="mt-auto pt-4 border-t border-stone-50 flex justify-between items-center">
                           <span className="text-[10px] font-bold text-stone-400">Verified Knowledge</span>
                           <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-emerald-900 group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Learning Path Suggestion - Premium Gradient */}
      <section className="py-24 bg-stone-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">Recommended Track</span>
               <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">
                Freshman to Founder
              </h2>
              <p className="text-stone-400 text-lg font-medium">
                Follow this sequential path to build your foundational understanding of the startup world.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { num: "01", title: "What is entrepreneurship?", href: "/knowledge/what-is-entrepreneurship" },
                { num: "02", title: "Developing the Mindset", href: "/knowledge/entrepreneurial-mindset" },
                { num: "03", title: "Selecting a Business Model", href: "/knowledge/business-models" },
                { num: "04", title: "Facing the Real Challenges", href: "/knowledge/challenges-risks" },
              ].map((step) => (
                <Link key={step.num} href={step.href}>
                  <div className="group p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 flex items-center justify-center mb-6 border border-emerald-800/30">
                        <span className="text-emerald-400 font-black text-sm">{step.num}</span>
                     </div>
                     <p className="text-white font-bold text-lg leading-snug group-hover:text-emerald-400 transition-colors">
                        {step.title}
                     </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resource Footer Hub */}
      <section className="py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 mb-6">
              Practical Execution
            </h2>
            <p className="text-stone-500 text-lg mb-12 font-medium">
              Theory is good, but execution is better. Explore our practical kits.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/resources/guides">
                <Button className="h-14 px-10 bg-emerald-900 hover:bg-emerald-800 text-white rounded-2xl shadow-lg shadow-emerald-900/20 font-black uppercase tracking-widest text-xs">
                  View Founder Guides
                </Button>
              </Link>
              <Link href="/resources/faqs">
                <Button variant="outline" className="h-14 px-10 border-stone-200 text-stone-600 hover:bg-white hover:border-emerald-950 rounded-2xl font-black uppercase tracking-widest text-xs">
                  Startup FAQs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
