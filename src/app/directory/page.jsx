import { listingAPI, categoryAPI, taxonomyAPI } from '@/lib/api';
import { SEO_CONFIG } from '@/data/seo-config';
import DirectoryFilters from '@/components/directory/DirectoryFilters';
import DirectoryCard from '@/components/directory/DirectoryCard';
import { Badge } from '@/components/ui/badge';
import { Star, Building2, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export async function generateMetadata({ searchParams }) {
  const search = searchParams.search || '';
  const config = SEO_CONFIG.directory;

  let title = config.title;
  if (search) title = `Search: "${search}" | ${title}`;

  return {
    title,
    description: config.description,
    keywords: config.keywords,
  };
}

export default async function DirectoryPage({ searchParams }) {
  const search = searchParams.search || '';
  const listingType = searchParams.get ? searchParams.get('type') : (searchParams.type || '');
  const category = searchParams.get ? searchParams.get('category') : (searchParams.category || '');

  // Parallel Data Ingestion
  const [catRes, typeRes, listingsRes] = await Promise.all([
    categoryAPI.list().catch(() => ({ data: [] })),
    taxonomyAPI.list('listing_types').catch(() => ({ data: [] })),
    listingAPI.list({
      search: search || undefined,
      listing_type: listingType || undefined,
      category: category || undefined,
      status: 'published',
      limit: 24
    }).catch(() => ({ data: [] }))
  ]);

  const categories = catRes.data || [];
  const listingTypes = typeRes.data || [];
  const listings = listingsRes.data || [];

  const featuredListings = listings.filter(l => l.is_featured);
  const regularListings = listings.filter(l => !l.is_featured);

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* 🛡️ Enterprise Header */}
      <div className="bg-emerald-900 py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge className="bg-emerald-800 text-emerald-100 mb-8 px-5 py-2 border-none font-bold uppercase tracking-widest text-[10px]">
            Enterprise Ecosystem
          </Badge>
          <h1 className="text-4xl lg:text-7xl font-bold text-white mb-8 tracking-tight">
            Business <span className="text-emerald-400 font-serif italic">Directory</span>
          </h1>
          <p className="text-xl text-emerald-100/80 max-w-2xl mx-auto font-medium leading-relaxed">
            Discover the most ambitious businesses and entrepreneurs across Bangladesh.
            Connect, collaborate, and grow with our verified community.
          </p>
        </div>
      </div>

      {/* 🛡️ Interaction Layer: Intelligence Deck */}
      <div className="sticky top-0 z-40 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/40">
        <DirectoryFilters categories={categories} listingTypes={listingTypes} />
      </div>

      {/* 🛡️ Content Layer: The Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-12">
        {listings.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[40px] border border-stone-100 shadow-sm transition-all duration-700">
            <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <Building2 className="w-12 h-12 text-stone-200" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4 tracking-tight">Zero Matches Found</h2>
            <p className="text-lg text-stone-500 mb-12 max-w-md mx-auto">
              Our business crawler couldn't find any listings matching your current filter set.
            </p>
            {(search || listingType || category) && (
              <Link href="/directory">
                <Button variant="outline" className="h-16 px-12 rounded-2xl border-stone-300 font-bold hover:bg-emerald-900 hover:text-white hover:border-emerald-900 transition-all shadow-sm">
                  Reset Global Directory
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featuredListings.length > 0 && !search && !category && (
              <div className="mb-20 animate-fade-in">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-12 h-12 bg-emerald-900 rounded-[14px] flex items-center justify-center shadow-lg shadow-emerald-900/20">
                      <Star className="w-6 h-6 text-white fill-current" />
                   </div>
                   <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Featured Operations</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {featuredListings.map((listing) => (
                    <DirectoryCard key={listing.id} listing={listing} isFeatured={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Standard Grid */}
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 bg-white border border-stone-100 rounded-[14px] flex items-center justify-center shadow-sm">
                  <Building2 className="w-6 h-6 text-emerald-900" />
               </div>
               <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Verified Community</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularListings.map((listing, idx) => (
                <div key={listing.id} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                   <DirectoryCard listing={listing} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 🛡️ Support Layer: Get Listed CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
               <Star className="w-10 h-10 text-emerald-900" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-stone-900 mb-8 tracking-tight leading-tight">
              Is Your Business <span className="text-emerald-900 underline decoration-emerald-200 underline-offset-8 text-serif italic">Missing</span>?
            </h2>
            <p className="text-xl text-stone-500 mb-12 max-w-2xl mx-auto font-medium">
              Join the official directory of Bangladeshi entrepreneurs. Showcase your operations to investors, partners, and customers.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
                <Link href="/register">
                  <Button size="lg" className="bg-emerald-900 text-white hover:bg-emerald-800 px-12 h-16 rounded-2xl font-bold shadow-2xl transition-all hover:scale-105 active:scale-95">
                    Register Entity
                  </Button>
                </Link>
                <Link href="/directory/verified">
                  <Button size="lg" variant="outline" className="border-stone-300 text-stone-700 hover:bg-white px-12 h-16 rounded-2xl font-bold shadow-sm">
                    How Verification Works
                  </Button>
                </Link>
            </div>
        </div>
      </section>
    </div>
  );
}
