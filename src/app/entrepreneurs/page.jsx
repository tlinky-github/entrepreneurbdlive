import { profileAPI, industryAPI, cityAPI } from '@/lib/api';
import { SEO_CONFIG } from '@/data/seo-config';
import EntrepreneurFilters from '@/components/entrepreneurs/EntrepreneurFilters';
import EntrepreneurCard from '@/components/entrepreneurs/EntrepreneurCard';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { Users, Star, Search, MapPin, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getBreadcrumbSchema } from '@/lib/seo-schemas';
import { Button } from '@/components/ui/button';

export async function generateMetadata({ searchParams }) {
  const { search = '' } = await searchParams;
  const config = SEO_CONFIG.entrepreneurs;

  let title = config.title;
  if (search) title = `Search Founders: "${search}" | ${title}`;

  return {
    title,
    description: config.description,
    keywords: config.keywords,
  };
}

export default async function EntrepreneursPage({ searchParams }) {
  const { search = '', industry = '', city = '' } = await searchParams;

  // Parallel Data Ingestion
  const [indRes, cityRes, profilesRes] = await Promise.all([
    industryAPI.list().catch(() => ({ data: [] })),
    cityAPI.list().catch(() => ({ data: [] })),
    profileAPI.list({
      search: search || undefined,
      industry: industry || undefined,
      city: city || undefined,
      status: 'published',
      limit: 24
    }).catch(() => ({ data: [] }))
  ]);

  const industries = (indRes.data || []).map(i => i.name).filter(Boolean);
  const cities = (cityRes.data || []).map(c => c.name).filter(Boolean);
  const profiles = profilesRes.data || [];

  const featuredProfiles = profiles.filter(p => p.is_featured);
  const regularProfiles = profiles.filter(p => !p.is_featured);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Entrepreneurs', path: '/entrepreneurs' }
  ]);

  return (
    <div className="bg-stone-50 min-h-screen">
      {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />}
      
      {/* 🚀 The Perfect Breadcrumb Engine */}
      <Breadcrumbs />

      {/* 🛡️ Community Header */}
      <div className="bg-emerald-900 py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 35c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57 43c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM16 38c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-800/50 border border-emerald-700/50 mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span className="text-xs font-bold text-emerald-50">The Innovation Network</span>
          </div>
          <h1 className="text-4xl lg:text-7xl font-black text-white mb-8 tracking-tight leading-none">
            Meet the <span className="text-emerald-400 font-serif italic">Founders.</span>
          </h1>
          <p className="text-xl text-emerald-100/80 max-w-2xl mx-auto font-medium leading-relaxed">
            Connect with Bangladesh's most innovative founders and business leaders.
            Find mentors, partners, and collaborators driving the future.
          </p>
        </div>
      </div>

      {/* 🛡️ Interaction Layer: Discovery Port */}
      <div className="sticky top-0 z-40 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/40">
        <EntrepreneurFilters industries={industries} cities={cities} />
      </div>

      {/* 🛡️ Content Layer: The Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-12">
        {profiles.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[40px] border border-stone-100 shadow-sm transition-all">
            <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <Users className="w-12 h-12 text-stone-200" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4 tracking-tight">No Founders Found</h2>
            <p className="text-lg text-stone-500 mb-12 max-w-md mx-auto">
              Our network currently has no profiles matching your selection.
            </p>
            {(search || industry || city) && (
              <Link href="/entrepreneurs">
                <Button variant="outline" className="h-16 px-12 rounded-2xl border-stone-300 font-bold hover:bg-emerald-900 hover:text-white transition-all shadow-sm">
                   Reset Network Discovery
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featuredProfiles.length > 0 && !search && !industry && !city && (
              <div className="mb-20 animate-fade-in">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-12 h-12 bg-white border border-stone-100 rounded-[14px] flex items-center justify-center shadow-sm">
                      <Star className="w-6 h-6 text-emerald-900 fill-current" />
                   </div>
                   <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Ecosystem Spotlight</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {featuredProfiles.map((profile) => (
                    <EntrepreneurCard key={profile.id} profile={profile} isFeatured={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Standard Grid */}
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 bg-white border border-stone-100 rounded-[14px] flex items-center justify-center shadow-sm">
                  <Users className="w-6 h-6 text-emerald-900" />
               </div>
               <h2 className="text-2xl font-bold text-stone-900 tracking-tight">The Network</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {regularProfiles.map((profile, idx) => (
                <div key={profile.id} className="animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                   <EntrepreneurCard profile={profile} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 🛡️ Support Layer: Join CTAs */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
               <Users className="w-10 h-10 text-emerald-900" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-stone-900 mb-8 tracking-tight leading-tight">
              Join the Elite <span className="text-emerald-900 underline decoration-emerald-200 underline-offset-8">Network.</span>
            </h2>
            <p className="text-xl text-stone-500 mb-12 max-w-2xl mx-auto font-medium">
              Are you a founder or business leader? Create your profile and become part of Bangladesh's premier entrepreneur networking platform.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
                <Link href="/register">
                  <Button size="lg" className="bg-emerald-900 text-white hover:bg-emerald-800 px-12 h-16 rounded-2xl font-bold shadow-2xl transition-all hover:scale-105 active:scale-95">
                    Create Profile
                  </Button>
                </Link>
                <Link href="/submit">
                  <Button size="lg" variant="outline" className="border-stone-300 text-stone-700 hover:bg-white px-12 h-16 rounded-2xl font-bold shadow-sm">
                    Apply for Feature
                  </Button>
                </Link>
            </div>
        </div>
      </section>
    </div>
  );
}
