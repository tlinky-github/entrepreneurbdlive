import Link from 'next/link';
import { notFound } from 'next/navigation';
import { postAPI, authorAPI, commentAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { 
  Calendar, 
  ArrowLeft, 
  Clock, 
  Globe, 
  Linkedin, 
  Twitter, 
  Facebook,
  User,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  getArticleSchema, 
  getBreadcrumbSchema, 
  getFAQSchema 
} from '@/lib/seo-schemas';
import BrandedPlaceholder from '@/components/blog/BrandedPlaceholder';
import BlogInteractions from '@/components/blog/BlogInteractions';

// --- SERVER SIDE SMART DESIGNER (No DOMParser needed) ---
const applyServerSideStyles = (html, featuredImage, title) => {
  if (!html) return '';
  
  let content = html;

  // 1. Inject Featured Image after second H2 or first H2 or top
  if (featuredImage) {
    const h2Regex = /<h2/gi;
    const matches = [...content.matchAll(h2Regex)];
    const injectionPoint = matches.length >= 2 ? matches[1].index : (matches.length >= 1 ? matches[0].index : 0);
    
    const imageHtml = `
      <div class="featured-image-inline mt-8 mb-12 rounded-2xl overflow-hidden shadow-2xl border border-stone-100 group">
        <img src="${featuredImage}" alt="${title}" class="w-full h-auto object-cover" />
      </div>
    `;
    
    if (injectionPoint === 0) {
      content = imageHtml + content;
    } else {
      content = content.slice(0, injectionPoint) + imageHtml + content.slice(injectionPoint);
    }
  }

  // 2. Clean AI Metadata leftovers
  content = content
    .replace(/<p[^>]*>(?:<[^>]+>)*\s*SEO Title:[\s\S]*?<\/p>/gi, '')
    .replace(/<p[^>]*>(?:<[^>]+>)*\s*Meta Description:[\s\S]*?<\/p>/gi, '');

  return content;
};

// --- DYNAMIC METADATA GENERATION ---
export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (!slug) return { title: "Article Not Found" };
  
  const { data: post } = await postAPI.get(slug).catch(() => ({ data: null }));
  
  if (!post) return { title: "Article Not Found" };

  return {
    title: post.seoTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: [post.featured_image || 'https://entrepreneurs.bd/logo.png'],
      type: 'article',
      publishedTime: post.created_at,
    },
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  if (!slug) notFound();
  
  // --- SERVER FETCH ---
  const postRes = await postAPI.get(slug).catch(() => ({ data: null }));
  const post = postRes.data;

  if (!post) return notFound();

  const authorRes = post.authorId ? await authorAPI.get(post.authorId).catch(() => ({ data: null })) : { data: null };
  const authorData = authorRes.data;

  const commentsRes = await commentAPI.list('blog', post.id).catch(() => ({ data: [] }));
  const commentsCount = (commentsRes.data || []).length;

  const readingTime = (post.content || post.content_html)
    ? Math.ceil((post.content || post.content_html).replace(/<[^>]+>/g, '').split(/\s+/).length / 200)
    : 1;

  const styledContent = applyServerSideStyles(post.content || post.content_html, post.featured_image, post.title);

  // --- UNIFIED SCHEMAS (Master Architect) ---
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` }
  ]);

  const articleSchema = getArticleSchema(post, authorData);
  const faqSchema = getFAQSchema(post.faqs);

  return (
    <div className="bg-stone-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />}
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      
      {/* CSS/Head Injection (Native) */}
      {post.custom_css && <style dangerouslySetInnerHTML={{ __html: post.custom_css }} />}
      
      {/* 🚀 The Perfect Breadcrumb Engine */}
      <Breadcrumbs />

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <header className="mb-12">
          {post.category_name && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-900 mb-8 shadow-sm">
               <Sparkles className="w-3.5 h-3.5" />
               <span className="text-xs font-bold">{post.category_name}</span>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-stone-900 mb-10 tracking-tighter leading-none">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl sm:text-2xl text-stone-500 mb-10 leading-relaxed font-medium italic border-l-4 border-emerald-900 pl-8">
               {post.excerpt}
            </p>
          )}

           <div className="flex flex-wrap items-center gap-8 text-xs font-bold text-stone-400 pb-10 border-b border-stone-200">
             <div className="flex items-center gap-3">
               {authorData ? (
                 <Link href={`/author/${authorData.slug}`} className="flex items-center gap-3 group">
                   <Avatar className="w-12 h-12 border-2 border-white shadow-md group-hover:border-emerald-500 transition-colors">
                     {authorData.photo ? (
                       <img src={authorData.photo} alt={authorData.name} className="w-full h-full object-cover" />
                     ) : (
                       <AvatarFallback className="bg-emerald-100 text-emerald-900 font-black">
                         {authorData.name?.charAt(0)}
                       </AvatarFallback>
                     )}
                   </Avatar>
                   <div>
                     <p className="font-black text-stone-900 group-hover:text-emerald-900 transition-colors uppercase tracking-widest">{authorData.name}</p>
                     <p className="text-stone-400 uppercase tracking-widest text-[10px]">Strategic Author</p>
                   </div>
                 </Link>
               ) : (
                 <div className="flex items-center gap-3">
                   <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                     <AvatarFallback className="bg-emerald-100 text-emerald-900 font-black">
                       {post.author_name?.charAt(0)}
                     </AvatarFallback>
                   </Avatar>
                   <div>
                     <p className="font-black text-stone-900 uppercase tracking-widest">{post.author_name}</p>
                     <p className="text-stone-400 uppercase tracking-widest text-[10px]">Author</p>
                   </div>
                 </div>
               )}
             </div>
              <div className="flex items-center gap-2.5 uppercase tracking-widest ml-auto sm:ml-0">
                 <Calendar className="w-4 h-4 text-emerald-900" />
                 {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : 'Published'}
              </div>
             <div className="flex items-center gap-2.5 uppercase tracking-widest">
                <Clock className="w-4 h-4 text-emerald-900" />
                {readingTime} min read
             </div>
           </div>
        </header>

        {/* Article Body */}
        <div 
          className="tiptap-content text-lg leading-relaxed text-stone-700 font-medium" 
          dangerouslySetInnerHTML={{ __html: styledContent }} 
        />

        {/* Interaction Island */}
        <BlogInteractions 
          postId={post.id} 
          initialLikes={post.like_count || 0} 
          postTitle={post.title}
          postExcerpt={post.excerpt}
        />

        {/* Post SEO Footer (The FAQs) */}
        {post.faqs?.length > 0 && (
          <div className="mt-20 border-t border-stone-200 pt-20">
            <h2 className="text-3xl font-black text-stone-900 mb-10 tracking-tight">Intelligence Briefing <span className="text-emerald-900 font-serif italic">(FAQs)</span></h2>
            <div className="space-y-6">
              {post.faqs.map((faq, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all">
                  <p className="font-black text-stone-900 mb-4 text-lg tracking-tight leading-tight">{faq.question || faq.q}</p>
                  <p className="text-stone-600 leading-relaxed">{faq.answer || faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Author Box */}
        {authorData && (
          <div className="mt-20 bg-emerald-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-white">
               <User size={200} />
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
              <div className="flex-shrink-0">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-white/10 border-2 border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                   {authorData.photo ? (
                      <img src={authorData.photo} alt={authorData.name} className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white">
                         {authorData.name.charAt(0)}
                      </div>
                   )}
                </div>
              </div>
              <div className="flex-1">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                       <h3 className="text-3xl font-black tracking-tight">{authorData.name}</h3>
                       <p className="text-emerald-300 font-bold uppercase tracking-widest text-xs mt-1">{authorData.designation || 'Strategic Founder'}</p>
                    </div>
                 </div>
                 <p className="text-emerald-100/70 text-lg leading-relaxed mb-8 font-medium">
                    {authorData.bio || `Specialized contributor at entrepreneurs.bd, architecting tactical insights for the next generation of regional market leaders.`}
                 </p>
                 <Link href={`/author/${authorData.slug}`}>
                    <Button variant="outline" className="bg-white/5 border-white/20 hover:bg-white text-white hover:text-emerald-900 font-black text-xs uppercase tracking-widest h-14 px-8 rounded-2xl transition-all">
                       View Complete Intelligence Path
                    </Button>
                 </Link>
              </div>
            </div>
          </div>
        )}
      </article>
      
      {/* Custom Body-End scripts */}
      {post.custom_js && <script dangerouslySetInnerHTML={{ __html: post.custom_js }} />}
    </div>
  );
}
