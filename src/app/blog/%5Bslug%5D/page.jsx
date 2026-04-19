import { postAPI, commentAPI, interactionAPI, authorAPI } from '@/lib/api';
import { SEO_CONFIG } from '@/data/seo-config';
import BlogContentViewer from '@/components/blog/BlogContentViewer';
import BlogEngagementBar from '@/components/blog/BlogEngagementBar';
import BlogComments from '@/components/blog/BlogComments';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Globe, Linkedin, Twitter, Facebook, Lightbulb, BookOpen, User } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import BrandedPlaceholder from '@/components/blog/BrandedPlaceholder';

export async function generateMetadata({ params }) {
  const { slug } = params;
  try {
    const res = await postAPI.get(slug);
    const post = res.data;
    if (!post) return {};

    return {
      title: post.seoTitle || post.title,
      description: post.metaDescription || post.excerpt,
      openGraph: {
        title: post.seoTitle || post.title,
        description: post.metaDescription || post.excerpt,
        images: post.featured_image ? [post.featured_image] : [],
        type: 'article',
        publishedTime: post.created_at?.seconds ? new Date(post.created_at.seconds * 1000).toISOString() : post.created_at,
        authors: [post.author_name],
        section: post.category_name,
        tags: post.tags || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.seoTitle || post.title,
        description: post.metaDescription || post.excerpt,
        images: post.featured_image ? [post.featured_image] : [],
      },
    };
  } catch (e) {
    return {};
  }
}

export default async function BlogPostPage({ params }) {
  const { slug } = params;

  // High-Speed Parallel Ingestion
  let post;
  try {
    const res = await postAPI.get(slug);
    post = res.data;
  } catch (e) {
    return notFound();
  }

  if (!post) return notFound();

  const [authorRes, commentsRes, relatedRes] = await Promise.all([
    post.authorId ? authorAPI.get(post.authorId).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    commentAPI.list('blog', post.id).catch(() => ({ data: [] })),
    post.category_id ? postAPI.list({ category_id: post.category_id, status: 'published', limit: 4 }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
  ]);

  const author = authorRes.data;
  const comments = commentsRes.data || [];
  const relatedPosts = (relatedRes.data || []).filter(p => p.id !== post.id).slice(0, 3);
  
  const readTime = Math.ceil(((post.content || post.content_html || '').replace(/<[^>]+>/g, '').split(/\s+/).length) / 200);

  return (
    <div className="bg-white min-h-screen">
      {/* 🛡️ Interaction Layer: Secondary Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-stone-500 hover:text-emerald-900 font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Insights</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-4">
               {post.category_name && (
                 <Badge className="bg-emerald-50 text-emerald-900 border-none font-bold text-[10px]">
                   {post.category_name}
                 </Badge>
               )}
          </div>
        </div>
      </div>

      {/* 🛡️ Editorial Layer: The Story */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Badge className="bg-red-50 text-red-700 border-none font-bold px-4 py-1 animate-pulse">Published</Badge>
            <span className="text-stone-300">/</span>
            <span className="text-sm font-bold text-stone-400 uppercase tracking-widest">{post.category_name || 'Blog'}</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold text-stone-900 mb-8 leading-[1.1] tracking-tight">
            {post.title}
          </h1>

          <p className="text-xl lg:text-2xl text-stone-500 italic mb-10 leading-relaxed font-medium pl-6 border-l-4 border-emerald-900/10">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-8 py-8 border-y border-stone-100">
            <div className="flex items-center gap-4">
               <Avatar className="w-14 h-14 border-2 border-white shadow-xl ring-2 ring-stone-900/5">
                 {author?.photo ? (
                   <img src={author.photo} alt={author.name} className="w-full h-full object-cover" />
                 ) : (
                   <AvatarFallback className="bg-emerald-900 text-white font-bold">{post.author_name?.charAt(0)}</AvatarFallback>
                 )}
               </Avatar>
               <div>
                  <p className="font-bold text-stone-900">{author?.name || post.author_name}</p>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{author?.designation || 'Professional Contributor'}</p>
               </div>
            </div>

            <div className="flex items-center gap-6 ml-auto">
               <div className="flex items-center gap-2 text-stone-400 font-bold text-xs">
                 <Calendar className="w-4 h-4 text-emerald-900" />
                 {formatRelativeDate(post.created_at)}
               </div>
               <div className="flex items-center gap-2 text-stone-400 font-bold text-xs">
                 <Clock className="w-4 h-4 text-emerald-900" />
                 {readTime} MIN READ
               </div>
            </div>
          </div>
        </header>

        {/* 🛡️ Content Core */}
        <BlogContentViewer post={post} />

        {/* 🛡️ Engagement Layer */}
        <BlogEngagementBar 
          post={post} 
          commentCount={comments.length}
          initialLiked={false} // Will be updated by client-side effect in component if needed
          initialBookmarked={false}
        />

        {/* 🛡️ Author Bio Deck */}
        {author && (
          <section className="mt-20 p-8 lg:p-12 bg-stone-50 rounded-[32px] border border-stone-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
               <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-700">
                    {author.photo ? (
                      <img src={author.photo} alt={author.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-emerald-900 flex items-center justify-center text-4xl font-bold text-white uppercase">{author.name.charAt(0)}</div>
                    )}
                  </div>
               </div>
               <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-stone-900 mb-1">Md Shaddam Hossain</h3>
                      <p className="text-sm font-bold text-emerald-900/60 uppercase tracking-widest">{author.designation || 'Ecosystem Leader'}</p>
                    </div>
                    <div className="flex gap-3">
                      {[
                        { icon: Globe, href: author.website },
                        { icon: Linkedin, href: author.linkedin },
                        { icon: Twitter, href: author.twitter },
                        { icon: Facebook, href: author.facebook }
                      ].filter(s => s.href).map((social, i) => (
                        <a key={i} href={author.website} target="_blank" rel="noopener" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-400 hover:text-emerald-900 border border-stone-100 shadow-sm hover:shadow-md transition-all">
                           <social.icon className="w-4 h-4" />
                        </a>
                      ))}
                    </div>
                  </div>
                  <p className="text-lg text-stone-600 leading-relaxed font-medium mb-8">
                    {author.bio || "Helping the next generation of founders grow."}
                  </p>
                  <Link href={`/author/${author.slug}`}>
                    <Button variant="outline" className="h-12 px-8 border-stone-200 rounded-xl font-bold hover:bg-emerald-900 hover:text-white hover:border-emerald-900 transition-all">
                      View Full Profile
                    </Button>
                  </Link>
               </div>
            </div>
          </section>
        )}

        {/* 🛡️ Dialogue Hub */}
        <BlogComments postId={post.id} initialComments={comments} />
      </article>

      {/* 🛡️ Related Spotlight */}
      {relatedPosts.length > 0 && (
        <section className="bg-stone-50 py-24 border-t border-stone-100">
           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                 <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Expand Your Knowledge</h2>
                 <Link href="/blog" className="text-sm font-bold text-emerald-900 hover:underline">View All Articles</Link>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {relatedPosts.map(rPost => (
                  <Link key={rPost.id} href={`/blog/${rPost.slug}`} className="group">
                    <div className="bg-white rounded-3xl overflow-hidden border border-stone-200/60 shadow-sm hover:shadow-xl hover:border-emerald-900/10 transition-all duration-300 h-full flex flex-col">
                       <div className="aspect-video bg-stone-100 overflow-hidden relative">
                         {rPost.featured_image ? (
                           <img src={rPost.featured_image} alt={rPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         ) : (
                           <BrandedPlaceholder title={rPost.title} />
                         )}
                       </div>
                       <div className="p-6 flex-1 flex flex-col">
                         <h4 className="font-bold text-stone-900 mb-2 line-clamp-2 leading-tight group-hover:text-emerald-900 transition-colors">{rPost.title}</h4>
                         <p className="text-xs text-stone-500 line-clamp-2 italic border-l-2 border-emerald-50 pl-3 mb-4">{rPost.excerpt}</p>
                         <div className="mt-auto pt-4 border-t border-stone-50 flex items-center justify-between text-[10px] font-bold text-stone-400">
                            <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-emerald-900" /> {rPost.author_name}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-emerald-900" /> {Math.ceil((rPost.content || '').length / 500)} MIN</span>
                         </div>
                       </div>
                    </div>
                  </Link>
                ))}
              </div>
           </div>
        </section>
      )}

      {/* 🛡️ Final CTA Deck */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
               <Lightbulb className="w-10 h-10 text-emerald-900" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-stone-900 mb-8 tracking-tight leading-tight">
              Have a Narrative to <span className="text-emerald-900 underline decoration-emerald-200 underline-offset-8">Share</span>?
            </h2>
            <p className="text-xl text-stone-500 mb-12 max-w-2xl mx-auto font-medium">
              Join our ecosystem of founders and experts. Contribute your insights and inspire the next wave of entrepreneurs.
            </p>
            <Link href="/submit">
              <Button size="lg" className="bg-emerald-900 text-white hover:bg-emerald-800 px-12 h-16 rounded-2xl font-bold shadow-2xl transition-all hover:translate-y-[-4px]">
                Submit Your Story
              </Button>
            </Link>
        </div>
      </section>
    </div>
  );
}
