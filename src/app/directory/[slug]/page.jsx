import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listingAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  Star, 
  Share2, 
  Eye, 
  Users, 
  Linkedin, 
  Twitter, 
  Facebook,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { 
  getBusinessSchema, 
  getBreadcrumbSchema, 
  getFAQSchema 
} from '@/lib/seo-schemas';

// --- DYNAMIC METADATA ---
export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (!slug) return { title: "Business Not Found" };
  
  const { data: listing } = await listingAPI.get(slug).catch(() => ({ data: null }));
  if (!listing) return { title: "Business Not Found" };

  return {
    title: listing.seoTitle || `${listing.business_name} | Business Directory`,
    description: listing.metaDescription || listing.short_description || listing.details,
    openGraph: {
      images: [listing.logo || listing.cover_image || 'https://entrepreneurs.bd/logo.png'],
    },
  };
}

export default async function DirectoryDetailPage({ params }) {
  const { slug } = await params;
  if (!slug) notFound();
  
  // --- SERVER FETCH ---
  const res = await listingAPI.get(slug).catch(() => ({ data: null }));
  const listing = res.data;

  if (!listing) return notFound();

  // --- UNIFIED SCHEMAS (Master Architect) ---
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Directory', path: '/directory' },
    { name: listing.business_name, path: `/directory/${listing.slug}` }
  ]);

  const businessSchema = getBusinessSchema(listing);
  const faqSchema = getFAQSchema(listing.faqs);

  return (
    <div className="bg-stone-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />
      {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />}
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      
      {/* CSS/JS Native Injection */}
      {listing.custom_css && <style dangerouslySetInnerHTML={{ __html: listing.custom_css }} />}
      
      {/* 🚀 The Perfect Breadcrumb Engine */}
      <Breadcrumbs />

      {/* Hero Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl h-48 md:h-80 group">
          {listing.cover_image ? (
            <img src={listing.cover_image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-stone-900 relative">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/40 to-stone-950 opacity-80" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-16 h-16 md:w-24 md:h-24 text-emerald-800/20" />
               </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 px-4 md:px-16">
          <div className="-mt-16 md:-mt-24 w-32 h-32 md:w-48 md:h-48 bg-white rounded-3xl shadow-2xl border-[8px] border-white ring-1 ring-stone-900/5 flex items-center justify-center overflow-hidden flex-shrink-0 z-10 transition-all hover:scale-105 duration-500 bg-white">
            {listing.logo ? (
              <img src={listing.logo} alt={listing.business_name} className="w-full h-full object-contain p-6" />
            ) : (
              <Building2 className="w-16 h-16 md:w-24 md:h-24 text-stone-200" />
            )}
          </div>
          
          <div className="flex-1 w-full text-center md:text-left pt-6 md:pt-12">
            <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start mb-4">
              <h1 className="text-4xl md:text-6xl font-black text-stone-900 tracking-tighter leading-none">
                {listing.business_name}
              </h1>
              {listing.is_featured && <Star className="w-8 h-8 text-emerald-900 fill-emerald-900" />}
            </div>
            <p className="text-sm font-black text-emerald-900/60 uppercase tracking-[0.3em] opacity-80">
              {listing.listing_type_name || listing.listing_type?.replace('_', ' ') || 'Enterprise Registry'}
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="grid lg:grid-cols-12 gap-16">
          
          <div className="lg:col-span-8 space-y-16">
            <Card className="border-stone-100 shadow-xl shadow-stone-200/40 overflow-hidden rounded-[3rem] bg-white">
              <CardContent className="p-10 md:p-16">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-12 pb-12 border-b border-stone-50">
                  <div className="flex flex-wrap gap-4">
                    {listing.city && (
                      <div className="flex items-center gap-2.5 text-xs bg-emerald-50 text-emerald-900 px-5 py-2 rounded-full font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                         <MapPin className="w-4 h-4" /> {listing.city}
                      </div>
                    )}
                    {listing.employee_size && (
                      <div className="flex items-center gap-2.5 text-xs bg-stone-50 text-stone-600 px-5 py-2 rounded-full font-black uppercase tracking-widest border border-stone-100">
                         <Users className="w-4 h-4" /> {listing.employee_size} Members
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-xs bg-emerald-900 text-white px-5 py-2 rounded-full font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20">
                       <Eye className="w-4 h-4" /> {listing.view_count || 0} Discovery Impressions
                    </div>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto">
                    {listing.website && (
                      <a href={ensureAbsoluteUrl(listing.website)} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button className="bg-emerald-900 hover:bg-emerald-800 w-full h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-950/20 active:scale-95 transition-all">
                          <Globe className="w-4 h-4 mr-2" /> Visit Ecosystem
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                <div className="prose prose-stone max-w-none prose-p:text-xl prose-p:leading-relaxed prose-p:text-stone-700">
                   <div className="flex items-center gap-3 mb-8">
                      <Sparkles className="w-5 h-5 text-emerald-900 font-black" />
                      <h2 className="text-xs font-black uppercase tracking-widest text-stone-400 m-0">Corporate Architecture</h2>
                   </div>
                   <div className="whitespace-pre-wrap text-stone-900 font-medium">
                      {listing.details || listing.short_description || "Detailed operational overview is being verified by the registry."}
                   </div>
                </div>

                {listing.content && (
                  <div className="mt-16 pt-16 border-t border-stone-50 tiptap-content text-lg leading-relaxed text-stone-700 font-medium">
                     <div dangerouslySetInnerHTML={{ __html: listing.content }} />
                  </div>
                )}
              </CardContent>
            </Card>

            {listing.life_at_company && (
              <div className="bg-emerald-950 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none text-white">
                   <Building2 size={300} />
                </div>
                <h2 className="text-4xl font-black mb-12 relative z-10 tracking-tight leading-none">Culture <span className="text-emerald-400 font-serif italic">&</span> Operations</h2>
                <div 
                  className="tiptap-content relative z-10 prose prose-invert max-w-none text-emerald-100/80 [&_*]:text-emerald-100/80 text-xl font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: listing.life_at_company }}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-12">
            <Card className="border-stone-100 shadow-xl shadow-stone-200/40 rounded-[2.5rem] overflow-hidden bg-white">
               <CardHeader className="bg-stone-50/50 border-b border-stone-50 font-black uppercase tracking-widest text-xs px-10 py-6">Intelligence Vitals</CardHeader>
               <CardContent className="p-10 space-y-8 text-xs">
                  <div className="flex justify-between items-center"><span className="text-stone-400 font-black uppercase tracking-widest">Industry</span><span className="font-black text-emerald-900 uppercase tracking-tight">{listing.industry || 'Capital'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-stone-400 font-black uppercase tracking-widest">Staff Size</span><span className="font-black text-stone-900 uppercase tracking-tight">{listing.employee_size || 'Ecosystem'}</span></div>
                  {listing.headquarters && (
                     <div className="pt-8 border-t border-stone-50">
                        <span className="text-stone-400 text-xs font-black uppercase tracking-widest mb-4 block">Central Hub</span>
                        <p className="text-stone-900 font-black flex gap-3 text-sm uppercase tracking-tight"><MapPin className="w-4 h-4 text-emerald-900"/> {listing.headquarters}</p>
                     </div>
                  )}
               </CardContent>
            </Card>

            {(listing.founder_name || listing.ceo_name) && (
              <Card className="border-stone-100 shadow-xl shadow-stone-200/40 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-stone-50/50 border-b border-stone-50 font-black uppercase tracking-widest text-xs px-10 py-6">Governance</CardHeader>
                <CardContent className="p-10 space-y-8">
                  {listing.founder_name && (
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-900 font-black shadow-inner overflow-hidden uppercase">
                         {listing.logo ? <img src={listing.logo} className="w-full h-full object-cover"/> : listing.founder_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-stone-900 text-lg tracking-tight leading-none mb-1">{listing.founder_name}</p>
                        <p className="text-xs text-stone-400 font-black uppercase tracking-widest">Founder</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-stone-900 text-white rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 text-white">
                  <Mail size={120} />
               </div>
               <h4 className="font-black text-xl tracking-tight relative z-10">Asset Engagement</h4>
               <div className="space-y-6 text-xs font-black uppercase tracking-widest relative z-10">
                  {listing.email && <div className="flex gap-4 items-center text-stone-400 hover:text-white transition-colors"><Mail className="w-4 h-4 text-emerald-400"/> {listing.email}</div>}
                  {listing.phone && <div className="flex gap-4 items-center text-stone-400 hover:text-white transition-colors"><Phone className="w-4 h-4 text-emerald-400"/> {listing.phone}</div>}
               </div>
            </Card>
          </div>
        </div>
      </div>
      
      {listing.custom_js && <script dangerouslySetInnerHTML={{ __html: listing.custom_js }} />}
    </div>
  );
}
