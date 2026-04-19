import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clock } from 'lucide-react';
import BrandedPlaceholder from '@/components/blog/BrandedPlaceholder';

export default function BlogPostCard({ post, isFeatured = false }) {
  const readTime = Math.ceil(((post.content || post.content_html || '').replace(/<[^>]+>/g, '').split(/\s+/).length) / 200);

  if (isFeatured) {
    return (
      <Link href={`/blog/${post.slug}`} className="block mb-12">
        <Card className="overflow-hidden border-stone-200/60 hover:border-emerald-900/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500 group rounded-[32px] bg-white">
          <div className="grid lg:grid-cols-2">
            <div className="aspect-video lg:aspect-auto bg-stone-100 overflow-hidden relative">
              {post.featured_image ? (
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <BrandedPlaceholder 
                  title={post.title} 
                  category={post.category_name} 
                />
              )}
              <Badge className="absolute top-6 left-6 bg-red-100 text-red-700 border-none font-bold px-4 py-1">Featured Story</Badge>
            </div>
            <CardContent className="p-8 lg:p-16 flex flex-col justify-center">
              {post.category_name && (
                <Badge variant="outline" className="w-fit mb-6 text-xs border-emerald-900/20 text-emerald-900 font-bold px-3">
                  {post.category_name}
                </Badge>
              )}
              <h2 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-6 group-hover:text-emerald-900 transition-colors leading-tight">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-stone-600 mb-8 text-lg line-clamp-3 leading-relaxed">{post.excerpt}</p>
              )}
              <div className="flex items-center gap-8 text-sm font-bold text-stone-400">
                <span className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-emerald-900" />
                  {post.author_name}
                </span>
                <span className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-900" />
                  {readTime} min read
                </span>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="block h-full">
      <Card className="h-full overflow-hidden border-stone-200/60 hover:border-emerald-900/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 group rounded-[32px] flex flex-col bg-white">
        <div className="aspect-[3/2] bg-stone-100 overflow-hidden relative">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <BrandedPlaceholder 
              title={post.title} 
              category={post.category_name} 
            />
          )}
          {post.category_name && (
            <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-emerald-900 border-none font-bold text-[10px] px-3">
              {post.category_name}
            </Badge>
          )}
        </div>
        <CardContent className="p-6 lg:p-8 flex-1 flex flex-col">
          <h3 className="font-bold text-xl text-stone-900 mb-3 line-clamp-2 leading-tight group-hover:text-emerald-900 transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-stone-600 text-base line-clamp-2 mb-6 leading-relaxed flex-1">
              {post.excerpt}
            </p>
          )}
          <div className="mt-auto pt-6 border-t border-stone-50 flex items-center justify-between text-xs font-bold text-stone-400">
            <span className="flex items-center gap-2 text-stone-500">
              <User className="w-3.5 h-3.5 text-emerald-900" />
              {post.author_name}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-900" />
              {readTime} min read
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
