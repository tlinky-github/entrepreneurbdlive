import Link from 'next/link';
import { notFound } from 'next/navigation';
import { profileAPI, authorAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
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
  Minus
} from 'lucide-react';

// --- DYNAMIC METADATA ---
export async function generateMetadata({ params }) {
  const { slug } = await params;
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
  
  // --- SERVER FETCH ---
  const res = await profileAPI.get(slug).catch(() => ({ data: null }));
  const profile = res.data;

  if (!profile) return notFound();

  const authorRes = profile.authorId ? await authorAPI.get(profile.authorId).catch(() => ({ data: null })) : { data: null };
  const authorData = authorRes.data;

  // --- SCHEMAS ---
  const siteUrl = "https://entrepreneurs.bd";
  const currentUrl = `${siteUrl}/entrepreneurs/${profile.slug}`;
  
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profile.name,
    "jobTitle": profile.role_title || profile.designation,
    "worksFor": {
      "@type": "Organization",
      "name": profile.company_name || profile.business_name
    },
    "image": profile.photo || profile.featured_image,
    "url": currentUrl,
    "description": profile.short_bio || profile.details,
    "sameAs": [
      profile.linkedin,
      profile.twitter,
      profile.facebook,
      profile.website
    ].filter(Boolean)
  };

  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": personSchema
  };

  return (
    <div className="bg-stone-50 min-h-screen pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }} />
      
      {/* CSS/JS Injection */}
      {profile.custom_css && <style dangerouslySetInnerHTML={{ __html: profile.custom_css }} />}
      
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link href="/entrepreneurs" className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Entrepreneurs
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-stone-200 overflow-hidden rounded-[2.5rem] shadow-xl">
          {/* Hero Gradient Cover */}
          <div className="h-40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_0)] bg-[size:20px_20px]" />
          </div>

          <CardContent className="p-8 md:p-12 -mt-20 relative">
            <div className="flex flex-col md:flex-row gap-8 items-start">
               {/* High-Fidelity Avatar */}
               <div className="flex-shrink-0">
                  <div className="w-36 h-36 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center overflow-hidden border-[6px] border-white ring-1 ring-stone-900/5">
                     {(profile.photo || profile.featured_image) ? (
                        <img src={profile.photo || profile.featured_image} alt={profile.name} className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-5xl font-black text-emerald-900">{profile.name?.charAt(0)}</span>
                     )}
                  </div>
               </div>

               {/* Profile Info Hub */}
               <div className="flex-1 pt-4 md:pt-12">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <h1 className="text-3xl font-black text-stone-900 tracking-tight">{profile.name}</h1>
                           {profile.is_featured && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                        </div>
                        
                        {(profile.role_title || profile.designation) && (
                           <p className="text-xl font-bold text-stone-600 mb-4">
                              {profile.role_title || profile.designation} at{' '}
                              {profile.linked_business_slug ? (
                                <Link href={`/directory/${profile.linked_business_slug}`} className="text-emerald-900 border-b-2 border-emerald-100 hover:border-emerald-900 transition-colors">
                                   {profile.company_name || profile.business_name}
                                </Link>
                              ) : (
                                <span className="text-emerald-950">{profile.company_name || profile.business_name || 'Innovator'}</span>
                              )}
                           </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-6">
                           {profile.linkedin && (
                             <a href={ensureAbsoluteUrl(profile.linkedin)} target="_blank" rel="noopener noreferrer nofollow" className="p-2.5 bg-stone-50 text-stone-400 hover:text-blue-700 hover:bg-white hover:shadow-md rounded-2xl transition-all">
                                <Linkedin className="w-5 h-5" />
                             </a>
                           )}
                           {profile.twitter && (
                             <a href={ensureAbsoluteUrl(profile.twitter)} target="_blank" rel="noopener noreferrer nofollow" className="p-2.5 bg-stone-50 text-stone-400 hover:text-sky-500 hover:bg-white hover:shadow-md rounded-2xl transition-all">
                                <Twitter className="w-5 h-5" />
                             </a>
                           )}
                           {profile.website && (
                             <a href={ensureAbsoluteUrl(profile.website)} target="_blank" rel="noopener noreferrer nofollow" className="p-2.5 bg-stone-50 text-stone-400 hover:text-emerald-700 hover:bg-white hover:shadow-md rounded-2xl transition-all">
                                <Globe className="w-5 h-5" />
                             </a>
                           )}
                           {profile.city && (
                             <div className="flex items-center gap-2 text-stone-500 text-sm font-bold bg-stone-50 px-4 py-2 rounded-2xl">
                                <MapPin className="w-4 h-4 text-emerald-700" /> {profile.city}
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Snapshot Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 py-8 border-y border-stone-100">
               <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Industry</span>
                  <p className="text-sm font-black text-stone-900">{profile.industry || 'Tech & Startup'}</p>
               </div>
               <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Startup Stage</span>
                  <p className="text-sm font-black text-emerald-900">{profile.startup_stage || 'Growth'}</p>
               </div>
               <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Team Size</span>
                  <p className="text-sm font-black text-stone-900">{profile.employee_size || '10-20'} Members</p>
               </div>
               <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Community Proof</span>
                  <p className="text-sm font-black text-stone-900">{profile.follower_count || 0} Followers</p>
               </div>
            </div>

            {/* The Biography Content */}
            <div className="mt-12 space-y-12">
               <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-900/50 mb-6">About the Founder</h2>
                  <div className="prose prose-stone max-w-none prose-p:text-lg prose-p:leading-relaxed prose-p:text-stone-800">
                     <div className="whitespace-pre-wrap font-medium">
                        {profile.details || profile.short_bio || "Biography details are being verified by our community staff."}
                     </div>
                  </div>
               </div>

               {profile.content && (
                  <div className="pt-12 border-t border-stone-50 tiptap-content">
                     <div dangerouslySetInnerHTML={{ __html: profile.content }} />
                  </div>
               )}

               {/* FAQs Section */}
               {profile.faqs?.length > 0 && (
                  <div className="pt-12 border-t border-stone-50">
                     <h3 className="text-xl font-black text-stone-900 mb-8 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-emerald-700" />
                        Founder Q&A
                     </h3>
                     <div className="grid gap-4">
                        {profile.faqs.map((faq, idx) => (
                           <div key={idx} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm group hover:border-emerald-900/20 transition-all">
                              <p className="font-bold text-stone-900 mb-2">{faq.question || faq.q}</p>
                              <p className="text-stone-600 text-sm leading-relaxed">{faq.answer || faq.a}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Author Attribution */}
               {authorData && (
                  <div className="pt-12 border-t border-stone-50">
                     <div className="bg-emerald-900/5 rounded-3xl p-6 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                           <img src={authorData.photo || '/logo.png'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 mb-1">Authenticated Entry</p>
                           <h4 className="font-bold text-stone-900 mb-1">Verified by {authorData.name}</h4>
                           <Link href={`/author/${authorData.slug}`} className="text-xs font-bold text-emerald-800 hover:underline">
                              View Editorial Board Profile &rarr;
                           </Link>
                        </div>
                     </div>
                  </div>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-8">
         <Link href="/entrepreneurs">
            <Button variant="ghost" className="text-stone-400 font-bold hover:text-emerald-900 uppercase tracking-widest text-[10px]">
               &larr; Back to Member Directory
            </Button>
         </Link>
      </div>

      {profile.custom_js && <script dangerouslySetInnerHTML={{ __html: profile.custom_js }} />}
    </div>
  );
}
