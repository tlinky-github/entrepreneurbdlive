import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Globe, Linkedin, Twitter, Facebook, Calendar, ChevronRight, 
  TrendingUp, FileText, Users, Building2, BookOpen, Clock,
  ShieldCheck, Sparkles
} from 'lucide-react';
import { authorAPI, postAPI, profileAPI, listingAPI, resourceAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// 🛡️ Pre-Rendering Metadata Engine
export async function generateMetadata({ params }) {
  const { slug } = params;
  if (!slug) return { title: 'Author Identity' };
  
  try {
    const res = await authorAPI.getBySlug(slug);
    const author = res.data;
    if (!author) return { title: 'Author Not Found' };

    return {
      title: `${author.name} | Professional Author Profile`,
      description: author.bio?.substring(0, 160) || `Read articles and contributions from ${author.name} on entrepreneurs.bd.`,
    };
  } catch (error) {
    return { title: 'Author Identity' };
  }
}

export default async function AuthorProfilePage({ params }) {
  const { slug } = params;
  if (!slug) notFound();
  
  let author = null;
  let contents = [];

  try {
    const res = await authorAPI.getBySlug(slug);
    author = res.data;

    if (author) {
      // 🛡️ Aggregate high-fidelity portfolio across all collections
      const [posts, profiles, listings, resources] = await Promise.all([
        postAPI.list({ isAdmin: false, limit: 100 }),
        profileAPI.list({ status: 'published' }),
        listingAPI.list({ status: 'published' }),
        resourceAPI.list()
      ]);

      contents = [
        ...(posts.data || []).map(p => ({ ...p, type: 'blog', link: `/blog/${p.slug}`, icon: FileText })),
        ...(profiles.data || []).map(p => ({ ...p, type: 'entrepreneur', link: `/entrepreneurs/${p.slug}`, icon: Users, title: p.name })),
        ...(listings.data || []).map(l => ({ ...l, type: 'directory', link: `/directory/${l.slug}`, icon: Building2, title: l.business_name })),
        ...(resources.data || []).map(r => ({ ...r, type: 'knowledge', link: `/knowledge/${r.slug}`, icon: BookOpen }))
      ].filter(item => item.authorId === author.id);

      contents.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
    }
  } catch (error) {
    console.error('[Identity Engine] Failed to fetch author portfolio:', error);
  }

  if (!author) notFound();

  return (
    <div className="bg-stone-50 min-h-screen pb-24">
      {/* 🛡️ Narrative Header Shield */}
      <section className="relative h-64 md:h-80 w-full overflow-hidden">
        {author.cover_image ? (
          <img src={author.cover_image} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full bg-stone-900 relative">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/60 to-stone-950 opacity-90" />
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20" />
      </section>

      {/* 🛡️ Identity Core Deck */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-16">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] border-8 border-stone-50 overflow-hidden bg-white shadow-2xl flex-shrink-0 group">
             {author.photo ? (
               <img src={author.photo} alt={author.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-6xl text-emerald-900 font-black bg-stone-50">
                  {author.name?.charAt(0)}
               </div>
             )}
          </div>
          <div className="flex-1 text-center md:text-left pb-4">
             <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-900 border border-emerald-800 text-white mb-6 shadow-xl">
               <ShieldCheck className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Verified Author</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl mb-4 tracking-tighter">
               {author.name}
             </h1>
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Badge className="bg-white/20 backdrop-blur-md text-white border-none px-4 py-1 text-xs">
                   {author.designation || 'Professional Contributor'}
                </Badge>
                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                   <TrendingUp size={16} />
                   {contents.length} Articles Authored
                </div>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-12">
          {/* Sidebar: Narrative Context */}
          <div className="space-y-8">
            <Card className="border-none shadow-2xl shadow-stone-200/50 bg-white rounded-[2.5rem] overflow-hidden">
               <CardContent className="p-10">
                 <h3 className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-6">About Contributor</h3>
                 <p className="text-stone-500 font-medium leading-relaxed mb-10">
                   {author.bio || "Professional contributor to entrepreneurs.bd, focusing on high-growth strategy and the development of the Bangladeshi startup ecosystem."}
                 </p>
                 
                 <div className="pt-10 border-t border-stone-100 space-y-6">
                    <h3 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-4">Professional Matrix</h3>
                    <div className="flex flex-col gap-4">
                       {author.linkedin && (
                         <a href={author.linkedin} target="_blank" className="flex items-center gap-4 text-stone-600 hover:text-emerald-900 transition-colors font-medium">
                            <Linkedin size={20} /> LinkedIn
                         </a>
                       )}
                       {author.twitter && (
                         <a href={author.twitter} target="_blank" className="flex items-center gap-4 text-stone-600 hover:text-emerald-900 transition-colors font-medium">
                            <Twitter size={20} /> Twitter
                         </a>
                       )}
                       {author.website && (
                         <a href={author.website} target="_blank" className="flex items-center gap-4 text-stone-600 hover:text-emerald-900 transition-colors font-medium">
                            <Globe size={20} /> Profile Deck
                         </a>
                       )}
                    </div>
                 </div>
               </CardContent>
            </Card>
          </div>

          {/* Main: Content Portfolio */}
          <div className="lg:col-span-3 space-y-8">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">Portfolio Snapshot</h2>
                <div className="h-[2px] flex-1 bg-stone-100 mx-10 rounded-full" />
             </div>

             {contents.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-stone-100">
                  <BookOpen size={48} className="mx-auto text-stone-200 mb-6" />
                  <p className="text-stone-400 font-medium italic">Pending publication of initial intelligence assets.</p>
               </div>
             ) : (
               <div className="grid gap-6">
                 {contents.map((item) => (
                   <Link key={item.id} href={item.link} className="group">
                      <Card className="border-none shadow-xl shadow-stone-200/40 bg-white rounded-[2rem] overflow-hidden hover:shadow-2xl hover:translate-x-2 transition-all duration-300">
                        <CardContent className="p-0">
                           <div className="flex flex-col md:flex-row">
                             {item.featured_image && (
                               <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden">
                                 <img src={item.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                               </div>
                             )}
                             <div className="p-8 flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                   <div className="px-3 py-1 bg-stone-50 rounded-lg text-[10px] font-black uppercase text-stone-400 tracking-widest border border-stone-100">
                                      {item.type}
                                   </div>
                                   <div className="flex items-center gap-2 text-stone-300 text-[10px] font-black uppercase tracking-widest">
                                      <Calendar size={12} />
                                      {new Date(item.created_at || Date.now()).toLocaleDateString()}
                                   </div>
                                </div>
                                <h3 className="text-2xl font-black text-stone-900 group-hover:text-emerald-900 transition-colors tracking-tight mb-4 leading-tight">
                                   {item.title}
                                </h3>
                                <p className="text-stone-500 font-medium line-clamp-2 leading-relaxed mb-6">
                                   {item.excerpt || item.subtitle || "Exploring high-growth strategic narratives in the emerging market ecosystem."}
                                </p>
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-900 group-hover:translate-x-2 transition-transform">
                                   View Intelligence <ChevronRight size={14} />
                                </div>
                             </div>
                           </div>
                        </CardContent>
                      </Card>
                   </Link>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
