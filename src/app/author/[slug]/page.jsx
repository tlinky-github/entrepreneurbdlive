import Link from 'next/link';
import { notFound } from 'next/navigation';
import { authorAPI, postAPI, profileAPI, listingAPI, resourceAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { 
  Globe, 
  Linkedin, 
  Twitter, 
  Facebook, 
  TrendingUp, 
  FileText, 
  Users, 
  Building2, 
  BookOpen, 
  Clock, 
  Calendar, 
  ChevronRight 
} from 'lucide-react';

// --- DYNAMIC METADATA ---
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: author } = await authorAPI.getBySlug(slug).catch(() => ({ data: null }));
  if (!author) return { title: "Author Not Found" };

  return {
    title: `${author.name} | Editorial Board | Entrepreneurs BD`,
    description: author.bio?.substring(0, 160) || `Read articles and contributions from ${author.name} on Bangladesh's largest startup platform.`,
    openGraph: {
      images: [author.photo || 'https://entrepreneurs.bd/logo.png'],
      type: 'profile',
    },
  };
}

export default async function AuthorDetailPage({ params }) {
  const { slug } = await params;
  
  // --- SERVER FETCH ---
  const res = await authorAPI.getBySlug(slug).catch(() => ({ data: null }));
  const author = res.data;

  if (!author) return notFound();

  // --- AGGREGATE CONTRIBUTIONS (Server-Side Filtering) ---
  const [postsRes, profilesRes, listingsRes, resourcesRes] = await Promise.all([
    postAPI.list({ isAdmin: false, limit: 100 }),
    profileAPI.list({ status: 'published', limit: 100 }),
    listingAPI.list({ status: 'published', limit: 100 }),
    resourceAPI.list()
  ]);

  const authorContents = [
    ...(postsRes.data || []).map(p => ({ ...p, type: 'blog', link: `/blog/${p.slug}`, icon: FileText })),
    ...(profilesRes.data || []).map(p => ({ ...p, type: 'entrepreneur', link: `/entrepreneurs/${p.slug}`, icon: Users, title: p.name })),
    ...(listingsRes.data || []).map(l => ({ ...l, type: 'directory', link: `/directory/${l.slug}`, icon: Building2, title: l.business_name })),
    ...(resourcesRes.data || []).map(r => ({ ...r, type: 'knowledge', link: `/knowledge/${r.slug}`, icon: BookOpen }))
  ].filter(item => item.authorId === author.id)
   .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // --- SCHEMAS ---
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": author.name,
    "jobTitle": author.designation,
    "image": author.photo,
    "description": author.bio,
    "sameAs": [
      author.linkedin,
      author.twitter,
      author.facebook,
      author.website
    ].filter(Boolean)
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative mb-12">
          <div className="h-48 md:h-64 w-full bg-stone-900 rounded-3xl overflow-hidden relative shadow-inner">
            {author.cover_image ? (
              <img src={author.cover_image} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/60 to-stone-950 opacity-90" />
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/10" />
          </div>
          
          <div className="absolute -bottom-12 md:-bottom-10 left-4 md:left-8 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 w-[calc(100%-2rem)] md:w-full pr-0 md:pr-16">
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden bg-stone-100 shadow-xl flex-shrink-0">
              {author.photo ? (
                <img src={author.photo} alt={author.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-stone-400 font-bold bg-stone-50">
                  {author.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="pb-4 pt-2 md:pt-0 text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">{author.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 border-none px-3">
                  {author.designation || 'Official Author'}
                </Badge>
                <span className="text-sm text-stone-200 font-medium flex items-center gap-1 drop-shadow-md">
                   <TrendingUp className="w-4 h-4" />
                   {authorContents.length} Contributions
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 mt-16 md:mt-24">
          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-stone-200 rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-900 mb-4">About Author</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {author.bio || "Professional contributor to entrepreneurs.bd, focusing on the growth and development of the Bangladeshi startup ecosystem."}
                </p>

                <div className="mt-8 space-y-4 pt-6 border-t border-stone-100">
                  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Connect</h3>
                  <div className="flex flex-col gap-3">
                    {author.linkedin && (
                      <a href={ensureAbsoluteUrl(author.linkedin)} className="text-stone-600 hover:text-blue-700 text-sm flex items-center gap-2 transition-colors">
                        <Linkedin className="w-4 h-4" /> LinkedIn
                      </a>
                    )}
                    {author.twitter && (
                      <a href={ensureAbsoluteUrl(author.twitter)} className="text-stone-600 hover:text-sky-500 text-sm flex items-center gap-2 transition-colors">
                        <Twitter className="w-4 h-4" /> Twitter
                      </a>
                    )}
                    {author.website && (
                      <a href={ensureAbsoluteUrl(author.website)} className="text-stone-600 hover:text-emerald-900 text-sm flex items-center gap-2 transition-colors">
                        <Globe className="w-4 h-4" /> Website
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Contributions List */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900">Articles & Contributions</h2>
              <div className="h-px flex-1 bg-stone-200 mx-6 hidden md:block" />
            </div>

            <div className="space-y-4">
              {authorContents.length === 0 ? (
                <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-3xl">
                   <p className="text-stone-400 font-medium italic">No public contributions yet</p>
                </div>
              ) : (
                authorContents.map((item) => (
                  <Link key={item.id} href={item.link}>
                    <Card className="border-stone-200 hover:border-emerald-500/30 hover:shadow-xl transition-all duration-300 group overflow-hidden rounded-2xl">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {item.featured_image && (
                            <div className="w-full md:w-32 h-40 md:h-auto flex-shrink-0 bg-stone-100 overflow-hidden">
                              <img src={item.featured_image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                          )}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-black">{item.type}</span>
                                <div className="w-1 h-1 rounded-full bg-stone-300 mx-1" />
                                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-1">{item.title}</h3>
                              <p className="text-xs text-stone-500 line-clamp-2 mt-2 leading-relaxed">
                                {item.excerpt || item.details || item.short_description || "Read more about this contribution on entrepreneurs.bd"}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center text-[10px] font-black text-emerald-900 group-hover:translate-x-1 transition-transform uppercase tracking-widest">
                              VIEW CONTENT <ChevronRight className="w-3 h-3 ml-1" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
