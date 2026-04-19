import { listingAPI, profileAPI } from '@/lib/api';
import { SEO_CONFIG } from '@/data/seo-config';
import BlogContentViewer from '@/components/blog/BlogContentViewer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  Star, 
  Share2,
  Users,
  Eye,
  CheckCircle,
  ExternalLink,
  Linkedin,
  Twitter,
  Facebook
} from 'lucide-react';
import Link from 'next/link';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = params;
  try {
    const res = await listingAPI.get(slug);
    const listing = res.data;
    if (!listing) return {};

    return {
      title: listing.seoTitle || listing.business_name,
      description: listing.metaDescription || listing.short_description || listing.details,
      openGraph: {
        title: listing.seoTitle || listing.business_name,
        description: listing.metaDescription || listing.short_description || listing.details,
        images: listing.logo ? [listing.logo] : [],
        type: 'business.business',
      },
    };
  } catch (e) {
    return {};
  }
}

export default async function DirectoryDetailPage({ params }) {
  const { slug } = params;

  // High-Speed Parallel Ingestion
  let listing;
  try {
    const res = await listingAPI.get(slug);
    listing = res.data;
  } catch (e) {
    return notFound();
  }

  if (!listing) return notFound();

  return (
    <div className="bg-stone-50 min-h-screen pb-24">
      {/* 🛡️ Interaction Layer: Secondary Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/directory" className="flex items-center gap-2 text-stone-500 hover:text-emerald-900 font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Directory</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-4">
               {listing.industry && (
                 <Badge className="bg-emerald-50 text-emerald-900 border-none font-bold text-[10px]">
                   {listing.industry}
                 </Badge>
               )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 🛡️ Hero Section: Flagship Branding */}
        <div className="relative mb-20">
          <div className="h-64 lg:h-96 rounded-[3rem] overflow-hidden relative group shadow-2xl">
             {listing.cover_image ? (
               <img src={listing.cover_image} alt="" className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105" />
             ) : (
               <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/40 to-stone-950 opacity-80" />
                  <Building2 className="w-24 h-24 text-white/5" />
               </div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
          </div>

          <div className="max-w-5xl mx-auto px-12 -mt-24 lg:-mt-32 relative z-10 flex flex-col md:flex-row items-end gap-8">
             <div className="w-40 h-40 lg:w-56 lg:h-56 bg-white rounded-[2.5rem] shadow-2xl border-8 border-white flex items-center justify-center p-8 transition-all hover:scale-105 duration-500 ring-1 ring-stone-900/5">
                {listing.logo ? (
                  <img src={listing.logo} alt={listing.business_name} className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-16 h-16 text-stone-200" />
                )}
             </div>
             <div className="flex-1 pb-4 md:pb-8">
                <div className="flex flex-wrap items-center gap-4 mb-2">
                   <h1 className="text-4xl lg:text-6xl font-black text-stone-900 tracking-tight leading-tight">{listing.business_name}</h1>
                   {listing.is_featured && <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />}
                </div>
                <p className="text-sm font-bold text-emerald-900/60 uppercase tracking-[0.3em] font-medium">
                  {listing.listing_type_name || listing.listing_type?.replace('_', ' ') || 'Enterprise'}
                </p>
             </div>
          </div>
        </div>

        {/* 🛡️ Main Profile Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* 🛡️ Narrative Deck: The Enterprise Story */}
          <div className="lg:col-span-8 space-y-12">
            <Card className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.03)] rounded-[3rem] overflow-hidden bg-white">
              <CardContent className="p-8 lg:p-12">
                <div className="flex flex-wrap gap-4 mb-10 pb-10 border-b border-stone-100">
                   {[
                     { icon: MapPin, label: listing.city, color: 'bg-emerald-50 text-emerald-900' },
                     { icon: Users, label: listing.employee_size ? `${listing.employee_size} Members` : 'Growth Tier', color: 'bg-blue-50 text-blue-800' },
                     { icon: Eye, label: `${listing.view_count || 0} Discovery Impressions`, color: 'bg-stone-50 text-stone-600' }
                   ].filter(tag => tag.label).map((tag, i) => (
                      <div key={i} className={`flex items-center gap-2 px-6 py-2 rounded-2xl font-bold text-xs ${tag.color}`}>
                         <tag.icon className="w-4 h-4" /> {tag.label}
                      </div>
                   ))}
                </div>

                <div className="prose prose-stone max-w-none">
                   <h2 className="text-3xl font-black text-stone-900 mb-8 border-l-8 border-emerald-900 pl-8">Enterprise Essence</h2>
                   <p className="text-2xl text-stone-500 italic font-medium leading-relaxed mb-12">
                      "{listing.short_description || listing.details || 'A verified operation in our innovation ecosystem.'}"
                   </p>
                   
                   {listing.content && <BlogContentViewer post={listing} />}
                </div>
              </CardContent>
            </Card>

            {/* 🛡️ Life At: Cultural Spotlight */}
            {listing.life_at_company && (
               <div className="bg-emerald-900 rounded-[4rem] p-12 lg:p-20 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-800 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50 group-hover:scale-125 transition-transform duration-1000" />
                  <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-10">
                        <Star className="w-12 h-12 text-emerald-400 fill-current" />
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">Narrative: Life at {listing.business_name}</h2>
                     </div>
                     <div className="tiptap-content text-white opacity-90 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: listing.life_at_company }} />
                  </div>
               </div>
            )}
          </div>

          {/* 🛡️ Interaction Deck: Enterprise Intelligence */}
          <div className="lg:col-span-4 space-y-8">
             {/* Profile Vitals */}
             <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                <div className="bg-stone-50 px-8 py-5 border-b border-stone-100">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Enterprise Vitals</h3>
                </div>
                <CardContent className="p-8 space-y-5">
                   {[
                     { label: 'Industry Sector', value: listing.industry || 'Global Business' },
                     { label: 'Growth Tier', value: listing.employee_size || 'Startup' },
                     { label: 'Capital Stage', value: listing.startup_stage || 'Operating' }
                   ].map((item, i) => (
                     <div key={i} className="flex justify-between items-center group">
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{item.label}</span>
                        <span className="text-sm font-black text-stone-900">{item.value}</span>
                     </div>
                   ))}
                </CardContent>
             </Card>

             {/* Leadership Deck */}
             {(listing.leadership_team || listing.founder_name) && (
                <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                   <div className="bg-stone-50 px-8 py-5 border-b border-stone-100">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Leadership Team</h3>
                   </div>
                   <CardContent className="p-8 space-y-8">
                      {/* Founder Spotlights */}
                      {[
                        { name: listing.leadership_team?.founder?.name || listing.founder_name, slug: listing.leadership_team?.founder?.slug, photo: listing.leadership_team?.founder?.photo || listing.founder_photo, role: 'Founder' },
                        { name: listing.leadership_team?.ceo?.name || listing.ceo_name, slug: listing.leadership_team?.ceo?.slug, photo: listing.leadership_team?.ceo?.photo || listing.ceo_photo, role: 'Chief Executive' }
                      ].filter(l => l.name).map((leader, i) => (
                        <div key={i} className="flex items-center gap-5 group">
                           <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-stone-900/5 group-hover:scale-105 transition-all">
                              {leader.photo ? <img src={leader.photo} className="w-full h-full object-cover" /> : <span className="text-2xl font-black text-emerald-900/20">{leader.name.charAt(0)}</span>}
                           </div>
                           <div>
                              {leader.slug ? (
                                <Link href={`/entrepreneurs/${leader.slug}`} className="font-black text-stone-900 hover:text-emerald-900 transition-colors block leading-tight">{leader.name}</Link>
                              ) : (
                                <p className="font-black text-stone-900 block leading-tight">{leader.name}</p>
                              )}
                              <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-1">{leader.role}</p>
                           </div>
                        </div>
                      ))}
                   </CardContent>
                </Card>
             )}

             {/* Command Deck: Direct Interaction */}
             <Card className="bg-stone-900 border-none rounded-[2.5rem] text-white shadow-2xl overflow-hidden p-10">
                <h4 className="text-2xl font-black mb-8 tracking-tight">Enterprise Portals</h4>
                <div className="space-y-6">
                   {listing.email && (
                     <a href={`mailto:${listing.email}`} className="flex items-center gap-5 group">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-all font-bold">
                           <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                           <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">Verified Email</p>
                           <p className="text-sm font-bold text-stone-200 group-hover:text-white truncate">{listing.email}</p>
                        </div>
                     </a>
                   )}
                   {listing.phone && (
                     <a href={`tel:${listing.phone}`} className="flex items-center gap-5 group">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-all font-bold">
                           <Phone className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                           <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">Confirmed Contact</p>
                           <p className="text-sm font-bold text-stone-200 group-hover:text-white">{listing.phone}</p>
                        </div>
                     </a>
                   )}
                   {listing.website && (
                     <a href={ensureAbsoluteUrl(listing.website)} target="_blank" rel="noopener" className="flex items-center gap-5 group">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-all font-bold">
                           <Globe className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                           <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">Web Gateway</p>
                           <p className="text-sm font-bold text-stone-200 group-hover:text-white">Visit {new URL(ensureAbsoluteUrl(listing.website)).hostname}</p>
                        </div>
                     </a>
                   )}
                   
                   <div className="pt-8 border-t border-white/5">
                      <div className="flex items-center gap-4">
                         {[
                           { icon: Linkedin, href: listing.social_linkedin },
                           { icon: Twitter, href: listing.social_twitter },
                           { icon: Facebook, href: listing.social_facebook }
                         ].filter(s => s.href).map((social, i) => (
                           <a key={i} href={ensureAbsoluteUrl(social.href)} target="_blank" rel="noopener" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-stone-400 hover:text-white hover:bg-emerald-600 transition-all">
                              <social.icon className="w-5 h-5" />
                           </a>
                         ))}
                      </div>
                   </div>
                </div>
             </Card>

             {/* Verification Shield */}
             <div className="bg-white border border-stone-200/50 p-8 rounded-[2.5rem] flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                   <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest leading-none mb-1">Status</p>
                   <p className="text-sm font-bold text-stone-900">Verified Legal Entity</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
