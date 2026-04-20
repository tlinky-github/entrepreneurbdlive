import { postAPI, profileAPI, listingAPI, adminAPI, resourceAPI } from '@/lib/api';
import { SEO_CONFIG } from '@/data/seo-config';
import HomeHero from '@/components/home/HomeHero';
import HomeStats from '@/components/home/HomeStats';
import HomeFeatures from '@/components/home/HomeFeatures';
import HomeFeaturedGrid from '@/components/home/HomeFeaturedGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { BookOpen, Lightbulb, FileText, ChevronRight } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://entrepreneurs.com.bd';

export async function generateMetadata() {
  const config = SEO_CONFIG.home;
  return {
    metadataBase: new URL(BASE_URL),
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    openGraph: {
      title: config.title,
      description: config.description,
      type: 'website',
      url: '/',
      siteName: 'Entrepreneurs BD',
      locale: 'en_BD',
      images: [
        {
          url: '/og-default.png', // Use our high-fidelity production asset
          width: 1200,
          height: 630,
        }
      ],
    },
    alternates: {
      canonical: '/',
    },
  };
}

export default async function HomePage() {
  // High-Speed Data Ingestion (Parallel Fetching)
  const [
    postsRes, 
    latestPostsRes, 
    profilesRes, 
    listingsRes, 
    statsRes, 
    resourcesRes
  ] = await Promise.all([
    postAPI.list({ is_featured: true, status: 'published', limit: 3 }).catch(() => ({ data: [] })),
    postAPI.list({ status: 'published', limit: 6 }).catch(() => ({ data: [] })),
    profileAPI.list({ is_featured: true, status: 'published', limit: 4 }).catch(() => ({ data: [] })),
    listingAPI.list({ is_featured: true, status: 'published', limit: 4 }).catch(() => ({ data: [] })),
    adminAPI.getStats().catch(() => ({ data: {} })),
    resourceAPI?.list ? resourceAPI.list({ limit: 6 }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
  ]);

  const blogPosts = (postsRes.data && postsRes.data.length > 0) 
    ? postsRes.data.slice(0, 3) 
    : (latestPostsRes.data || []).slice(0, 3);

  const stats = statsRes.data || {};

  return (
    <div className="bg-stone-50 overflow-x-hidden">
      {/* 🛡️ Hero Layer */}
      <HomeHero />

      {/* 🛡️ Intelligence Layer */}
      <HomeStats stats={stats} />

      {/* 🛡️ Pillar Layer */}
      <HomeFeatures />

      {/* 🛡️ Spotlight 1: Knowledge Hub */}
      <HomeFeaturedGrid 
        title="Everything you need to start, grow, and scale"
        badge="Resources"
        items={resourcesRes.data || []}
        type="knowledge"
        viewAllHref="/knowledge"
        bgColor="bg-white"
      />

      {/* 🛡️ Spotlight 2: Entrepreneurs */}
      <HomeFeaturedGrid 
        title="Meet Our Founders"
        badge="Featured Profiles"
        items={profilesRes.data || []}
        type="entrepreneur"
        viewAllHref="/entrepreneurs"
        bgColor="bg-stone-50"
        badgeColor="bg-red-100 text-red-700"
      />

      {/* 🛡️ Enterprise Spotlight: Call to Action */}
      <section className="py-24 bg-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
           <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 35c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57 43c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM16 38c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
           }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="bg-emerald-800 text-emerald-100 mb-8 px-4 py-2 border-none font-bold uppercase tracking-widest text-[10px]">
            Accelerate Your Growth
          </Badge>
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-8 tracking-tight">
            Ready to Spotlight Your <span className="text-emerald-400">Journey</span>?
          </h2>
          <p className="text-xl text-emerald-100/80 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Join thousands of Bangladeshi entrepreneurs. Showcase your profile, list your business, 
            and get discovered by the stakeholders who matter most.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
{/* 
            <Link href="/register">
              <Button size="lg" className="bg-white text-emerald-900 hover:bg-stone-200 px-10 h-16 rounded-2xl font-bold text-lg shadow-2xl transition-all hover:scale-105 active:scale-95">
                Join the Ecosystem
              </Button>
            </Link> 
            */}
            <Link href="/submit">
              <Button size="lg" variant="outline" className="border-emerald-100/40 text-emerald-100 hover:bg-white/10 px-10 h-16 rounded-2xl font-bold text-lg backdrop-blur-sm shadow-xl">
                Apply for Feature
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 🛡️ Spotlight 3: Directory */}
      <HomeFeaturedGrid 
        title="Featured Businesses"
        badge="Business Directory"
        items={listingsRes.data || []}
        type="directory"
        viewAllHref="/directory"
        bgColor="bg-white"
        badgeColor="bg-emerald-100 text-emerald-900"
      />

      {/* 🛡️ Spotlight 4: Blog */}
      <HomeFeaturedGrid 
        title="Latest Insights"
        badge="Platform Blog"
        items={blogPosts}
        type="blog"
        viewAllHref="/blog"
        bgColor="bg-stone-50"
      />

      {/* 🛡️ Mission Layer: The Founder */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-stone-50 rounded-[32px] p-8 lg:p-16 border border-stone-200/60 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="order-2 lg:order-1">
                <Badge className="bg-emerald-100 text-emerald-900 mb-8 px-5 py-2 border-none font-bold tracking-wider">
                  Meet the Founder
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-stone-900 mb-8 tracking-tight">
                  Md Shaddam Hossain
                </h2>
                <p className="text-xl text-stone-600 mb-10 leading-[1.8] font-medium">
                  An entrepreneur, digital marketer, and affiliate marketing specialist with over a decade
                  of experience in the technology and business sector. Former Team Lead of Sales & Marketing
                  at HasThemes, bringing hands-on experience in building technology-driven business operations.
                </p>
                <Link href="/about#founder">
                  <Button
                    variant="outline"
                    className="border-stone-300 text-stone-900 hover:bg-emerald-900 hover:text-white hover:border-emerald-900 px-10 h-14 rounded-2xl font-bold transition-all shadow-sm"
                  >
                    Learn More About Our Mission
                  </Button>
                </Link>
              </div>
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 sm:w-96 sm:h-96 rounded-[48px] overflow-hidden border-8 border-white shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-700">
                    <img
                      src="/shaddam.webp"
                      alt="Md Shaddam Hossain"
                      className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-all duration-700"
                    />
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-900 rounded-[28px] flex items-center justify-center shadow-2xl animate-bounce-slow">
                    <Lightbulb className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🛡️ Support Layer: Final Resources */}
      <section className="py-24 bg-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: BookOpen, title: 'Practical Guides', desc: 'Step-by-step frameworks for common challenges', href: '/resources/guides' },
              { icon: Lightbulb, title: 'Expert FAQs', desc: 'Answers to common entrepreneurship questions', href: '/resources/faqs' },
              { icon: FileText, title: 'Ecosystem Glossary', desc: 'Essential business terms explained clearly', href: '/resources/glossary' }
            ].map((box, i) => (
              <div key={i} className="bg-emerald-800/40 rounded-3xl p-10 border border-white/10 hover:bg-emerald-800/60 transition-all group backdrop-blur-sm">
                <box.icon className="w-12 h-12 text-emerald-300 mb-8 group-hover:rotate-12 transition-transform" />
                <h3 className="text-2xl font-bold mb-4">{box.title}</h3>
                <p className="text-emerald-100/70 mb-10 leading-relaxed font-medium">
                  {box.desc}
                </p>
                <Link href={box.href} className="block">
                  <Button className="w-full bg-white text-emerald-900 font-bold h-14 rounded-2xl hover:bg-stone-100 shadow-xl transition-all active:scale-95">
                    Explore Now
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🛡️ Final CTA Deck */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-stone-900 mb-8 tracking-tight">
            Ready to Join Bangladesh's Fastest Growing Community?
          </h2>
          <p className="text-xl text-stone-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Create your profile, list your business, and connect with thousands of entrepreneurs across the nation.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
{/* 
            <Link href="/register">
              <Button size="lg" className="bg-emerald-900 text-white hover:bg-emerald-800 px-12 h-16 rounded-2xl font-bold text-lg shadow-2xl transition-all hover:scale-105 active:scale-95">
                Create Free Account
              </Button>
            </Link> 
            */}
            <Link href="/blog">
              <Button size="lg" variant="outline" className="border-stone-300 text-stone-700 hover:bg-emerald-900 hover:text-white hover:border-emerald-900 px-12 h-16 rounded-2xl font-bold text-lg shadow-sm transition-all">
                Join the Community
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
