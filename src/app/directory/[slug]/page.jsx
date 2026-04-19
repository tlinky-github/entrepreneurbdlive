import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listingAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
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
  Facebook 
} from 'lucide-react';

// --- DYNAMIC METADATA ---
export async function generateMetadata({ params }) {
  const { slug } = await params;
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
  
  // --- SERVER FETCH ---
  const res = await listingAPI.get(slug).catch(() => ({ data: null }));
  const listing = res.data;

  if (!listing) return notFound();

  // --- SCHEMAS ---
  const siteUrl = "https://entrepreneurs.bd";
  const currentUrl = `${siteUrl}/directory/${listing.slug}`;
  
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": listing.business_name,
    "image": listing.logo || listing.cover_image,
    "url": currentUrl,
    "email": listing.email,
    "telephone": listing.phone,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": listing.city,
      "addressRegion": "Dhaka",
      "addressCountry": "BD"
    },
    "description": listing.short_description || listing.details
  };

  const faqSchema = listing.faqs?.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": listing.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question || faq.q,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer || faq.a }
    }))
  } : null;

  return (
    <div className="bg-stone-50 min-h-screen pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      
      {/* CSS/JS Native Injection */}
      {listing.custom_css && <style dangerouslySetInnerHTML={{ __html: listing.custom_css }} />}
      
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link href="/directory" className="inline-flex items-center gap-2 text-stone-500 hover:text-emerald-900 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
      </div>

      {/* Hero Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="relative rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl h-40 md:h-60 lg:h-80 group">
          {listing.cover_image ? (
            <img src={listing.cover_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-stone-900 relative">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/40 to-stone-950 opacity-80" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-16 h-16 md:w-20 md:h-20 text-emerald-800/20" />
               </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-10 px-4 md:px-12">
          <div className="-mt-12 md:-mt-20 w-24 h-24 md:w-40 md:h-40 bg-white rounded-2xl md:rounded-3xl shadow-2xl border-4 md:border-[8px] border-white flex items-center justify-center overflow-hidden flex-shrink-0 z-10 transition-all hover:scale-105 duration-300">
            {listing.logo ? (
              <img src={listing.logo} alt={listing.business_name} className="w-full h-full object-contain p-3 md:p-6" />
            ) : (
              <Building2 className="w-12 h-12 md:w-20 md:h-20 text-stone-200" />
            )}
          </div>
          
          <div className="flex-1 w-full text-center md:text-left pt-4 md:pt-8">
            <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-center md:justify-start">
              <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                {listing.business_name}
              </h1>
              {listing.is_featured && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
            </div>
            <p className="text-xs md:text-md text-stone-400 font-bold mt-2 uppercase tracking-[0.2em] opacity-80">
              {listing.listing_type_name || listing.listing_type?.replace('_', ' ') || 'Registered Business'}
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-10">
            <Card className="border-stone-200 shadow-sm overflow-hidden rounded-2xl">
              <CardContent className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10 pb-10 border-b border-stone-100">
                  <div className="flex flex-wrap gap-3">
                    {listing.city && (
                      <div className="flex items-center gap-2 text-sm bg-emerald-50 text-emerald-800 px-4 py-1.5 rounded-full font-semibold border border-emerald-100">
                         <MapPin className="w-4 h-4" /> {listing.city}
                      </div>
                    )}
                    {listing.employee_size && (
                      <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-800 px-4 py-1.5 rounded-full font-semibold border border-blue-100">
                         <Users className="w-4 h-4" /> {listing.employee_size} Employees
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm bg-stone-100 text-stone-600 px-4 py-1.5 rounded-full font-semibold">
                       <Eye className="w-4 h-4" /> {listing.view_count || 0} Views
                    </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    {listing.website && (
                      <a href={ensureAbsoluteUrl(listing.website)} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button className="bg-emerald-900 hover:bg-emerald-800 w-full h-11 px-8">
                          <Globe className="w-4 h-4 mr-2" /> Visit Website
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                <div className="prose prose-stone max-w-none prose-p:text-lg">
                   <h2 className="mb-6 uppercase tracking-widest text-sm text-stone-900 font-black border-l-4 border-emerald-600 pl-4">Company Overview</h2>
                   <div className="whitespace-pre-wrap text-stone-900 font-medium">
                      {listing.details || listing.short_description || "No detailed description available."}
                   </div>
                </div>

                {listing.content && (
                  <div className="mt-12 pt-12 border-t border-stone-100 tiptap-content">
                     <div dangerouslySetInnerHTML={{ __html: listing.content }} />
                  </div>
                )}
              </CardContent>
            </Card>

            {listing.life_at_company && (
              <div className="bg-emerald-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden">
                <h2 className="text-3xl font-black mb-8 relative z-10 text-white">Life at {listing.business_name}</h2>
                <div 
                  className="tiptap-content relative z-10 prose prose-invert max-w-none text-white [&_*]:text-white"
                  dangerouslySetInnerHTML={{ __html: listing.life_at_company }}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="border-stone-200 shadow-sm rounded-2xl overflow-hidden">
               <CardHeader className="bg-stone-50 border-b border-stone-100 font-bold uppercase tracking-wider text-xs">Company Vitals</CardHeader>
               <CardContent className="p-8 space-y-6 text-sm">
                  <div className="flex justify-between items-center"><span className="text-stone-400 font-bold">Industry</span><span className="font-black">{listing.industry || 'General'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-stone-400 font-bold">Staff Size</span><span className="font-black">{listing.employee_size || 'Startup'}</span></div>
                  {listing.headquarters && (
                     <div className="pt-4 border-t border-stone-100">
                        <span className="text-stone-400 text-[10px] font-black uppercase mb-2 block">Location</span>
                        <p className="text-stone-700 font-bold flex gap-2"><MapPin className="w-4 h-4 text-emerald-600"/> {listing.headquarters}</p>
                     </div>
                  )}
               </CardContent>
            </Card>

            {(listing.founder_name || listing.ceo_name) && (
              <Card className="border-stone-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-stone-50 border-b border-stone-100 font-bold uppercase tracking-wider text-xs">Leadership</CardHeader>
                <CardContent className="p-8 space-y-6">
                  {listing.founder_name && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-900 font-black">{listing.founder_name.charAt(0)}</div>
                      <div>
                        <p className="font-black text-stone-900">{listing.founder_name}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase">Founder</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-stone-900 text-white rounded-2xl p-8 space-y-6 shadow-xl">
               <h4 className="font-black">Get in Touch</h4>
               <div className="space-y-4 text-sm">
                  {listing.email && <div className="flex gap-3 items-center"><Mail className="w-4 h-4"/> {listing.email}</div>}
                  {listing.phone && <div className="flex gap-3 items-center"><Phone className="w-4 h-4"/> {listing.phone}</div>}
               </div>
            </Card>
          </div>
        </div>
      </div>
      
      {listing.custom_js && <script dangerouslySetInnerHTML={{ __html: listing.custom_js }} />}
    </div>
  );
}
