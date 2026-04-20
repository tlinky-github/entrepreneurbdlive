import Link from 'next/link';
import { notFound } from 'next/navigation';
import { profileAPI, authorAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { 
  getPersonSchema, 
  getBreadcrumbSchema, 
  getFAQSchema 
} from '@/lib/seo-schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Globe, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Share2,
  CheckCircle,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';

// --- DYNAMIC METADATA ---
export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (!slug) return { title: "Profile Not Found" };
  
  const { data: profile } = await profileAPI.get(slug).catch(() => ({ data: null }));
  if (!profile) return { title: "Profile Not Found" };

  return {
    title: profile.seoTitle || `${profile.name} | Entrepreneur Profiles`,
    description: profile.metaDescription || profile.short_bio || profile.details,
    openGraph: {
      images: [profile.photo || profile.featured_image || 'https://entrepreneurs.bd/logo.png'],
      type: 'profile',
    },
  };
}

export default async function EntrepreneurDetailPage({ params }) {
  const { slug } = await params;
  if (!slug) notFound();
  
  // --- SERVER FETCH ---
  const res = await profileAPI.get(slug).catch(() => ({ data: null }));
  const profile = res.data;

  if (!profile) return notFound();

  const authorRes = profile.authorId ? await authorAPI.get(profile.authorId).catch(() => ({ data: null })) : { data: null };
  const authorData = authorRes.data;

  // --- UNIFIED SCHEMAS (Master Architect) ---
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Entrepreneurs', path: '/entrepreneurs' },
    { name: profile.name, path: `/entrepreneurs/${profile.slug}` }
  ]);

  const personSchema = getPersonSchema(profile);

  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": personSchema
  };

  const faqSchema = getFAQSchema(profile.faqs);

  return (
    <div className="bg-stone-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }} />
      {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />}
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      
      {/* CSS/JS Injection */}
      {profile.custom_css && <style dangerouslySetInnerHTML={{ __html: profile.custom_css }} />}
      
      {/* 🚀 The Perfect Breadcrumb Engine */}
      <Breadcrumbs />

      {/* Main Profile Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <Card className="border-stone-200 overflow-hidden rounded-[3rem] shadow-2xl bg-white">
          {/* Hero Gradient Cover */}
          <div className="h-48 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_0)] bg-[size:20px_20px]" />
          </div>

          <CardContent className="p-8 md:p-16 -mt-24 relative">
            <div className="flex flex-col md:flex-row gap-8 items-start">
               {/* High-Fidelity Avatar */}
               <div className="flex-shrink-0">
                  <div className="w-40 h-40 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center overflow-hidden border-[8px] border-white ring-1 ring-stone-900/5">
                     {(profile.photo || profile.featured_image) ? (
                        <img src={profile.photo || profile.featured_image} alt={profile.name} className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-6xl font-black text-emerald-900">{profile.name?.charAt(0)}</span>
                     )}
                  </div>
               </div>

               {/* Profile Info Hub */}
               <div className="flex-1 pt-4 md:pt-16">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                     <div>
                        <div className="flex items-center gap-3 mb-4">
                           <h1 className="text-4xl lg:text-5xl font-black text-stone-900 tracking-tighter leading-none">{profile.name}</h1>
                           {profile.is_featured && <Star className="w-7 h-7 text-emerald-900 fill-emerald-900" />}
                        </div>
                        
                        {(profile.role_title || profile.designation) && (
                           <p className="text-xl font-bold text-stone-500 mb-6 leading-tight">
                              {profile.role_title || profile.designation} <span className="text-emerald-900 font-serif italic">at</span>{' '}
                              {profile.linked_business_slug ? (
                                <Link href={`/directory/${profile.linked_business_slug}`} className="text-emerald-900 border-b-2 border-emerald-100 hover:border-emerald-900 transition-colors">
                                   {profile.company_name || profile.business_name}
                                </Link>
                              ) : (
                                <span className="text-emerald-950 font-black">{profile.company_name || profile.business_name || 'Innovator'}</span>
                              )}
                           </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-8">
                           {profile.linkedin && (
                             <a href={ensureAbsoluteUrl(profile.linkedin)} target="_blank" rel="noopener noreferrer nofollow" className="p-3 bg-stone-50 text-stone-400 hover:text-emerald-900 hover:bg-white hover:shadow-xl rounded-2xl transition-all">
                                <Linkedin className="w-5 h-5" />
                             </a>
                           )}
                           {profile.twitter && (
                             <a href={ensureAbsoluteUrl(profile.twitter)} target="_blank" rel="noopener noreferrer nofollow" className="p-3 bg-stone-50 text-stone-400 hover:text-emerald-900 hover:bg-white hover:shadow-xl rounded-2xl transition-all">
                                <Twitter className="w-5 h-5" />
                             </a>
                           )}
                           {profile.website && (
                             <a href={ensureAbsoluteUrl(profile.website)} target="_blank" rel="noopener noreferrer nofollow" className="p-3 bg-stone-50 text-stone-400 hover:text-emerald-900 hover:bg-white hover:shadow-xl rounded-2xl transition-all">
                                <Globe className="w-5 h-5" />
                             </a>
                           )}
                           {profile.city && (
                             <div className="flex items-center gap-2.5 text-stone-900 text-xs font-black uppercase tracking-widest bg-stone-50 px-6 py-3 rounded-2xl shadow-sm">
                                <MapPin className="w-4 h-4 text-emerald-900" /> {profile.city}
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Snapshot Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mt-16 py-10 border-y border-stone-100">
               <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Industry</span>
                  <p className="text-sm font-black text-stone-900 uppercase tracking-tight">{profile.industry || 'Capital & Startup'}</p>
               </div>
               <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Startup Stage</span>
                  <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">{profile.startup_stage || 'Growth'}</p>
               </div>
               <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Team Size</span>
                  <p className="text-sm font-black text-stone-900 uppercase tracking-tight">{profile.employee_size || '10-20'} Members</p>
               </div>
               <div className="space-y-2 text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Ecosystem Proof</span>
                  <p className="text-sm font-black text-stone-900 uppercase tracking-tight">{profile.follower_count || 0} Followers</p>
               </div>
            </div>

            {/* The Biography Content */}
            <div className="mt-16 space-y-16">
               <div className="relative">
                  <div className="flex items-center gap-3 mb-8">
                     <Sparkles className="w-5 h-5 text-emerald-900" />
                     <h2 className="text-xs font-black uppercase tracking-widest text-stone-400">The Journey Narrative</h2>
                  </div>
                  <div className="prose prose-stone max-w-none prose-p:text-xl prose-p:leading-relaxed prose-p:text-stone-700">
                     <div className="whitespace-pre-wrap font-medium">
                        {profile.details || profile.short_bio || "Biography details are being verified by our community board."}
                     </div>
                  </div>
               </div>

               {profile.content && (
                  <div className="pt-16 border-t border-stone-50 tiptap-content text-lg leading-relaxed text-stone-700 font-medium">
                     <div dangerouslySetInnerHTML={{ __html: profile.content }} />
                  </div>
               )}

               {/* FAQs Section */}
               {profile.faqs?.length > 0 && (
                  <div className="pt-16 border-t border-stone-50">
                     <h3 className="text-2xl font-black text-stone-900 mb-10 flex items-center gap-4 tracking-tighter">
                        <CheckCircle className="w-7 h-7 text-emerald-900" />
                        Founder Intelligence <span className="text-emerald-900 font-serif italic">(FAQ)</span>
                     </h3>
                     <div className="grid gap-6">
                        {profile.faqs.map((faq, idx) => (
                           <div key={idx} className="bg-stone-50/50 p-8 rounded-[2rem] border border-stone-100 group hover:bg-white hover:border-emerald-900/20 hover:shadow-xl transition-all">
                              <p className="font-black text-stone-900 mb-4 text-lg tracking-tight leading-tight">{faq.question || faq.q}</p>
                              <p className="text-stone-600 leading-relaxed">{faq.answer || faq.a}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Author Attribution */}
               {authorData && (
                  <div className="pt-16 border-t border-stone-50">
                     <div className="bg-emerald-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-white">
                           <ShieldCheck size={200} />
                        </div>
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 flex-shrink-0 bg-white/10 relative z-10 transition-all hover:scale-110">
                           <img src={authorData.photo || '/logo.png'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="relative z-10 text-center md:text-left">
                           <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-2">Authenticated Registry Entry</p>
                           <h4 className="text-2xl font-black mb-2 tracking-tight">Verified by {authorData.name}</h4>
                           <Link href={`/author/${authorData.slug}`} className="text-xs font-black uppercase tracking-widest text-white/60 hover:text-white flex items-center justify-center md:justify-start gap-2 transition-colors">
                              View Board Credentials <ArrowRight size={14} />
                           </Link>
                        </div>
                     </div>
                  </div>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-12">
         <Link href="/entrepreneurs">
            <Button variant="ghost" className="h-14 px-10 rounded-2xl text-stone-400 font-black uppercase tracking-widest text-xs hover:text-emerald-900 hover:bg-white transition-all">
               &larr; Back to Member Registry
            </Button>
         </Link>
      </div>

      {profile.custom_js && <script dangerouslySetInnerHTML={{ __html: profile.custom_js }} />}
    </div>
  );
}
