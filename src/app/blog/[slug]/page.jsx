import Link from 'next/link';
import { notFound } from 'next/navigation';
import { postAPI, authorAPI, commentAPI } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  ArrowLeft, 
  Clock, 
  Globe, 
  Linkedin, 
  Twitter, 
  Facebook 
} from 'lucide-react';
import { format } from 'date-fns';
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

  // --- PERFECT SCHEMAS ---
  const siteUrl = "https://entrepreneurs.bd";
  const currentUrl = `${siteUrl}/blog/${post.slug}`;
  
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.featured_image || `${siteUrl}/logo.png`,
    "author": { "@type": "Person", "name": authorData?.name || post.author_name || "Entrepreneurs BD" },
    "publisher": { "@type": "Organization", "name": "Entrepreneurs BD", "logo": { "@type": "ImageObject", "url": `${siteUrl}/logo.png` } },
    "datePublished": post.created_at,
    "mainEntityOfPage": { "@type": "WebPage", "@id": currentUrl }
  };

  const faqSchema = post.faqs?.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question || faq.q,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer || faq.a }
    }))
  } : null;

  return (
    <div className="bg-stone-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      
      {/* CSS/Head Injection (Native) */}
      {post.custom_css && <style dangerouslySetInnerHTML={{ __html: post.custom_css }} />}
      
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          {post.category_name && (
            <Badge className="bg-emerald-100 text-emerald-900 mb-4">{post.category_name}</Badge>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-6 leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl text-stone-600 mb-6">{post.excerpt}</p>
          )}

           <div className="flex flex-wrap items-center gap-6 text-sm text-stone-500 pb-6 border-b border-stone-200">
             <div className="flex items-center gap-2">
               {authorData ? (
                 <Link href={`/author/${authorData.slug}`} className="flex items-center gap-2 group">
                   <Avatar className="w-10 h-10 border border-stone-200 group-hover:border-emerald-500 transition-colors">
                     {authorData.photo ? (
                       <img src={authorData.photo} alt={authorData.name} className="w-full h-full object-cover" />
                     ) : (
                       <AvatarFallback className="bg-emerald-100 text-emerald-900">
                         {authorData.name?.charAt(0)}
                       </AvatarFallback>
                     )}
                   </Avatar>
                   <div>
                     <p className="font-medium text-stone-900 group-hover:text-emerald-900 transition-colors">{authorData.name}</p>
                     <p className="text-xs">{authorData.designation || 'Professional Author'}</p>
                   </div>
                 </Link>
               ) : (
                 <div className="flex items-center gap-2">
                   <Avatar className="w-10 h-10">
                     <AvatarFallback className="bg-emerald-100 text-emerald-900">
                       {post.author_name?.charAt(0)}
                     </AvatarFallback>
                   </Avatar>
                   <div>
                     <p className="font-medium text-stone-900">{post.author_name}</p>
                     <p className="text-xs">Author</p>
                   </div>
                 </div>
               )}
             </div>
              <div className="flex items-center gap-2">
                 <Calendar className="w-4 h-4" />
                 {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : 'Recently Published'}
              </div>
             <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {readingTime} min read
             </div>
           </div>
        </header>

        {/* Article Body */}
        <div 
          className="tiptap-content" 
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
          <div className="mt-12 border-t border-stone-200 pt-12">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {post.faqs.map((faq, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                  <p className="font-bold text-stone-900 mb-2">{faq.question || faq.q}</p>
                  <p className="text-stone-600">{faq.answer || faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Author Box */}
        {authorData && (
          <div className="mt-12 bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-stone-100 border-2 border-emerald-900 shadow-md">
                   {authorData.photo ? (
                      <img src={authorData.photo} alt={authorData.name} className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-emerald-900">
                         {authorData.name.charAt(0)}
                      </div>
                   )}
                </div>
              </div>
              <div className="flex-1">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                       <h3 className="text-xl font-bold text-stone-900">Md Shaddam Hossain</h3>
                       <p className="text-sm text-emerald-700 font-medium">{authorData.designation || 'Founder'}</p>
                    </div>
                 </div>
                 <p className="text-stone-600 leading-relaxed mb-6">
                    {authorData.bio || `Expert contributor at entrepreneurs.bd, sharing insights to help the next generation of Bangladeshi founders grow.`}
                 </p>
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
