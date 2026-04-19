import { postAPI, blogCategoryAPI } from '@/lib/api';
import { SEO_CONFIG } from '@/data/seo-config';
import BlogFilters from '@/components/blog/BlogFilters';
import BlogPostCard from '@/components/blog/BlogPostCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ searchParams }) {
  const search = searchParams.search || '';
  const categoryId = searchParams.category || '';
  const config = SEO_CONFIG.blog;

  let title = config.title;
  if (search) title = `Search: "${search}" | ${title}`;
  
  return {
    title,
    description: config.description,
    keywords: config.keywords,
  };
}

export default async function BlogPage({ searchParams }) {
  const search = searchParams.search || '';
  const categoryId = searchParams.category || '';

  // Parallel Data Ingestion
  const [postsRes, catsRes] = await Promise.all([
    postAPI.list({ 
      search, 
      category_id: categoryId || undefined, 
      status: 'published', 
      limit: 20 
    }),
    blogCategoryAPI.list(),
  ]);

  const posts = postsRes.data || [];
  const categories = catsRes.data || [];

  const featuredPost = posts.find(p => p.is_featured);
  const regularPosts = posts.filter(p => !p.is_featured || posts.indexOf(p) > 0);

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* 🛡️ Editorial Header */}
      <div className="bg-emerald-900 py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 35c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57 43c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM16 38c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge className="bg-emerald-800 text-emerald-100 mb-8 px-5 py-2 border-none font-bold uppercase tracking-widest text-[10px]">
            Platform Insights
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8 tracking-tight">
            Insights & <span className="text-emerald-400">Stories</span>
          </h1>
          <p className="text-xl text-emerald-100/80 max-w-2xl mx-auto font-medium leading-relaxed">
            Discover inspiring stories, expert insights, and practical guides from Bangladesh's entrepreneur community.
          </p>
        </div>
      </div>

      {/* 🛡️ Interaction Layer: Intelligence Deck */}
      <div className="sticky top-0 z-40 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/40">
        <BlogFilters categories={categories} />
      </div>

      {/* 🛡️ Content Layer: The Feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-12">
        {posts.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[48px] border border-stone-100 shadow-sm">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Search className="w-10 h-10 text-stone-300" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Discovery Engine Empty</h2>
            <p className="text-lg text-stone-500 mb-10 max-w-md mx-auto">
              We couldn't find any articles matching your current search criteria.
            </p>
            {(search || categoryId) && (
              <Link href="/blog">
                <Button variant="outline" className="h-14 px-10 rounded-2xl border-stone-300 font-bold hover:bg-emerald-900 hover:text-white hover:border-emerald-900 transition-all">
                  Reset Discovery Hub
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featuredPost && !search && !categoryId && (
              <div className="animate-fade-in mb-16">
                <BlogPostCard post={featuredPost} isFeatured={true} />
              </div>
            )}

            {/* Standard Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {regularPosts.map((post, idx) => (
                <div key={post.id} className="animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                  <BlogPostCard post={post} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
