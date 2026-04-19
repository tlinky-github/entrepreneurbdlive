import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Building2, Star, Clock, ChevronRight, ArrowRight } from 'lucide-react';
import BrandedPlaceholder from '@/components/blog/BrandedPlaceholder';

export default function HomeFeaturedGrid({ 
  title, 
  badge, 
  items = [], 
  type = 'blog', 
  viewAllHref, 
  badgeColor = 'bg-emerald-100 text-emerald-900',
  bgColor = 'bg-white'
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className={`py-20 ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div className="animate-fade-in">
            <Badge className={`${badgeColor} mb-4 px-4 py-1 border-none font-bold uppercase tracking-wider text-[10px]`}>
              {badge}
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
              {title}
            </h2>
          </div>
          {viewAllHref && (
            <Link 
              href={viewAllHref} 
              className="hidden sm:flex items-center gap-2 text-emerald-900 hover:text-emerald-700 font-bold transition-all group"
            >
              View All <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        <div className={`grid sm:grid-cols-2 ${type === 'blog' || type === 'knowledge' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-8`}>
          {items.map((item) => (
            <Card key={item.id} className="border-stone-200/60 shadow-sm hover:border-emerald-900/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 group rounded-3xl overflow-hidden h-full flex flex-col bg-white">
              
              {/* Media Header */}
              {(type === 'blog' || type === 'knowledge') && (
                <div className="aspect-[16/10] bg-stone-100 overflow-hidden relative">
                  {item.featured_image ? (
                    <img
                      src={item.featured_image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <BrandedPlaceholder title={item.title} category={item.category_name} />
                  )}
                  {item.category_name && (
                    <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-emerald-900 border-none font-bold text-[10px]">
                      {item.category_name}
                    </Badge>
                  )}
                </div>
              )}

              <CardContent className={`p-6 flex-1 flex flex-col ${type === 'entrepreneur' ? 'text-center' : ''}`}>
                {/* Profile Circle for Entrepreneurs */}
                {type === 'entrepreneur' && (
                  <div className="w-24 h-24 bg-emerald-50 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-emerald-900">{item.name?.charAt(0)}</span>
                    )}
                  </div>
                )}

                {/* Directory Item Header */}
                {type === 'directory' && (
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-stone-100">
                      {item.logo ? (
                        <img src={item.logo} alt={item.business_name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900 truncate group-hover:text-emerald-900 transition-colors">
                          {item.business_name}
                        </h3>
                        {item.is_verified && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mt-1">
                        {item.industry || 'Business'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Content */}
                <div className="flex-1">
                  {(type === 'blog' || type === 'knowledge') && (
                    <>
                      <h3 className="font-bold text-xl text-stone-900 mb-3 line-clamp-2 leading-tight group-hover:text-emerald-900 transition-colors">
                        {item.title}
                      </h3>
                      {item.excerpt && <p className="text-stone-600 text-sm line-clamp-2 mb-6 leading-relaxed">{item.excerpt}</p>}
                    </>
                  )}

                  {type === 'entrepreneur' && (
                    <>
                      <h3 className="font-bold text-xl text-stone-900 mb-2">{item.name}</h3>
                      <p className="text-sm font-medium text-stone-500 mb-4 h-10 line-clamp-2">
                        {item.role_title} at {item.company_name}
                      </p>
                      {item.industry && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-900 border-none font-bold text-[10px]">
                          {item.industry}
                        </Badge>
                      )}
                    </>
                  )}

                  {type === 'directory' && item.short_description && (
                    <p className="text-sm text-stone-600 line-clamp-2 mb-4 leading-relaxed italic border-l-2 border-emerald-100 pl-3">
                      "{item.short_description}"
                    </p>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="mt-auto pt-6 border-t border-stone-50 flex items-center justify-between">
                  {(type === 'blog' || type === 'knowledge') && (
                    <>
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
                        <User className="w-3 h-3 text-emerald-900" />
                        <span className="truncate max-w-[100px]">{item.author_name}</span>
                      </div>
                      <Link 
                        href={`/${type === 'blog' ? 'blog' : 'knowledge'}/${item.slug || item.id}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 hover:text-emerald-700 transition-all group-hover:translate-x-1"
                      >
                        Read More <ArrowRight className="w-3 h-3" />
                      </Link>
                    </>
                  )}

                  {type === 'directory' && (
                    <div className="flex items-center gap-4 w-full justify-between">
                      <p className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {item.city || 'Bangladesh'}
                      </p>
                      <Link 
                        href={`/directory/${item.slug}`} 
                        className="text-xs font-bold text-emerald-900 hover:text-emerald-700 flex items-center gap-1.5"
                      >
                        View Profile <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {type === 'entrepreneur' && (
                    <Link 
                      href={`/entrepreneurs/${item.slug}`} 
                      className="w-full"
                    >
                      <button className="w-full py-2.5 bg-stone-50 text-stone-900 rounded-xl font-bold text-xs hover:bg-emerald-900 hover:text-white transition-all transform hover:-translate-y-0.5">
                        View Journey
                      </button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="sm:hidden mt-8">
          {viewAllHref && (
            <Link href={viewAllHref}>
              <button className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                Browse All <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
