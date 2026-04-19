import { profileAPI, authorAPI, listingAPI } from '@/lib/api';
import { SEO_CONFIG } from '@/data/seo-config';
import BlogContentViewer from '@/components/blog/BlogContentViewer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Globe, 
  Star, 
  Share2,
  CheckCircle,
  Users,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeDate, ensureAbsoluteUrl } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export async function generateMetadata({ params }) {
  const { slug } = params;
  try {
    const res = await profileAPI.get(slug);
    const profile = res.data;
    if (!profile) return {};

    return {
      title: profile.seoTitle || profile.name,
      description: profile.metaDescription || profile.short_bio || profile.details,
      openGraph: {
        title: profile.seoTitle || profile.name,
        description: profile.metaDescription || profile.short_bio || profile.details,
        images: (profile.featured_image || profile.photo) ? [profile.featured_image || profile.photo] : [],
        type: 'profile',
      },
    };
  } catch (e) {
    return {};
  }
}

export default async function EntrepreneurProfilePage({ params }) {
  const { slug } = params;

  // High-Speed Parallel Ingestion
  let profile;
  try {
    const res = await profileAPI.get(slug);
    profile = res.data;
  } catch (e) {
    return notFound();
  }

  if (!profile) return notFound();

  const [authorRes, businessRes] = await Promise.all([
    profile.authorId ? authorAPI.get(profile.authorId).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    profile.linked_business_slug ? listingAPI.get(profile.linked_business_slug).catch(() => ({ data: null })) : Promise.resolve({ data: null })
  ]);

  const author = authorRes.data;
  const business = businessRes.data;

  return (
    <div className="bg-stone-50 min-h-screen pb-24">
      {/* 🛡️ Interaction Layer: Secondary Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/entrepreneurs" className="flex items-center gap-2 text-stone-500 hover:text-emerald-900 font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">The Innovation Network</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-4">
             {profile.industry && (
               <Badge className="bg-emerald-50 text-emerald-900 border-none font-bold text-[10px]">
                 {profile.industry}
               </Badge>
             )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.03)] rounded-[3rem] overflow-hidden bg-white">
          {/* 🛡️ Aesthetic Deck: Cover */}
          <div className="h-48 bg-emerald-900 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             }} />
          </div>

          <CardContent className="p-8 lg:p-12 -mt-24 relative z-10">
            {/* 🛡️ Identity Spotlight */}
            <div className="flex flex-col md:flex-row gap-10 items-start mb-12">
               <div className="flex-shrink-0">
                  <div className="w-36 h-36 lg:w-44 lg:h-44 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center overflow-hidden border-8 border-white ring-1 ring-stone-900/5">
                    {(profile.featured_image || profile.photo) ? (
                      <img src={profile.featured_image || profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-emerald-50 text-emerald-900 text-5xl font-black">{profile.name?.charAt(0)}</AvatarFallback>
                    )}
                  </div>
               </div>

               <div className="flex-1 pt-4 md:pt-16">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <h1 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tight">{profile.name}</h1>
                           {profile.is_featured && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                        </div>
                        <p className="text-lg lg:text-xl font-bold text-emerald-900/60 uppercase tracking-widest leading-none">
                           {profile.designation || profile.role_title}
                        </p>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="outline" className="h-12 w-12 rounded-xl border-stone-200">
                          <Share2 className="w-4 h-4" />
                        </Button>
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    {[
                      { icon: Linkedin, href: profile.linkedin || profile.social_linkedin, label: 'LinkedIn', color: 'hover:text-blue-600' },
                      { icon: Twitter, href: profile.twitter || profile.social_twitter, label: 'Twitter', color: 'hover:text-sky-500' },
                      { icon: Globe, href: profile.website || profile.company_page_url, label: 'Portal', color: 'hover:text-emerald-700' }
                    ].filter(s => s.href).map((social, i) => (
                      <a 
                        key={i} 
                        href={ensureAbsoluteUrl(social.href)} 
                        target="_blank" 
                        rel="noopener" 
                        className={`group flex items-center gap-2 text-sm font-bold text-stone-400 ${social.color} transition-all`}
                      >
                         <div className="w-10 h-10 rounded-xl bg-stone-50 group-hover:bg-current/5 flex items-center justify-center transition-colors">
                            <social.icon className="w-4 h-4" />
                         </div>
                         <span className="hidden sm:inline uppercase tracking-widest text-[10px]">{social.label}</span>
                      </a>
                    ))}
                  </div>
               </div>
            </div>

            {/* 🛡️ Context Module: The Business Link */}
            {business && (
              <Link href={`/directory/${business.slug}`} className="block mb-12">
                 <div className="bg-emerald-50/50 border border-emerald-100 p-6 lg:p-8 rounded-[2rem] flex items-center justify-between group hover:bg-emerald-50 transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-sm">
                          {business.logo ? <img src={business.logo} alt={business.business_name} className="w-full h-full object-contain" /> : <Building2 className="w-8 h-8 text-emerald-900/20" />}
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.2em] mb-1">Affiliated Venture</p>
                          <h4 className="text-xl font-bold text-stone-900 group-hover:text-emerald-900 transition-colors">{business.business_name}</h4>
                       </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-900 font-bold hidden sm:flex">View Enterprise Profile</Badge>
                 </div>
              </Link>
            )}

            {/* 🛡️ Metric Deck: Professional Vitals */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-10 border-y border-stone-100 mb-12">
               {[
                 { icon: Briefcase, label: 'Industry', value: profile.industry },
                 { icon: Star, label: 'Founder Stage', value: profile.startup_stage },
                 { icon: Users, label: 'Network Size', value: profile.employee_size ? `${profile.employee_size}+ Members` : 'Growth Stage' },
                 { icon: MapPin, label: 'Base Ops', value: profile.headquarters || profile.city }
               ].filter(m => m.value).map((metric, i) => (
                 <div key={i} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-stone-300 uppercase tracking-widest">
                       <metric.icon className="w-3.5 h-3.5 text-emerald-900" />
                       {metric.label}
                    </div>
                    <p className="text-sm font-bold text-stone-700">{metric.value}</p>
                 </div>
               ))}
            </div>

            {/* 🛡️ Narrative Core: The Profile Story */}
            <div className="prose prose-stone max-w-none">
                <div className="pl-6 border-l-4 border-emerald-900/10 mb-12">
                   <p className="text-2xl text-stone-500 italic font-medium leading-relaxed">
                     "{profile.short_bio || profile.details || "A leader in Bangladesh's growing innovation ecosystem."}"
                   </p>
                </div>
                
                {profile.content && <BlogContentViewer post={profile} />}
            </div>

            {/* 🛡️ Support Deck: Verification & Author */}
            {author && (
              <div className="mt-20 pt-10 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                       <img src={author.photo} alt={author.name} className="w-full h-full object-cover" />
                    </Avatar>
                    <div>
                       <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-0.5">Profile Curated By</p>
                       <Link href={`/author/${author.slug}`} className="text-sm font-bold text-stone-900 hover:text-emerald-900">{author.name}</Link>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100/50 px-6 py-3 rounded-2xl">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Identity Verified Profile</span>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
