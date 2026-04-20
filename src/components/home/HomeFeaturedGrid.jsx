import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Building2, Star, Clock, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
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
          <div className="animate-fade-in text-left">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${badgeColor} border-none font-bold text-xs mb-4 shadow-sm`}>
               <Sparkles className="w-3.5 h-3.5" />
               <span>{badge}</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tight leading-none">
              {title}
            </h2>
          </div>
          {viewAllHref && (
            <Link 
              href={viewAllHref} 
              className="hidden sm:flex items-center gap-2 text-emerald-900 hover:text-emerald-700 font-black transition-all group text-xs uppercase tracking-widest"
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
                    <Badge className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-emerald-900 border-none font-bold text-xs shadow-sm">
                      {item.category_name}
                    </Badge>
                  )}
                </div>
              )}

              <CardContent className={`p-6 flex-1 flex flex-col ${type === 'entrepreneur' ? 'text-center' : ''}`}>
                {/* Profile Circle for Entrepreneurs */}
                {type === 'entrepreneur' && (
                  <div className="w-24 h-24 bg-stone-50 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-emerald-900">{item.name?.charAt(0)}</span>
                    )}
                  </div>
                )}

                {/* Directory Item Header */}
                {type === 'directory' && (
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-stone-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                      {item.logo ? (
                        <img src={item.logo} alt={item.business_name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-7 h-7 text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-stone-900 truncate group-hover:text-emerald-900 transition-colors leading-tight">
                          {item.business_name}
                        </h3>
                        {item.is_verified && <Star className="w-4 h-4 text-emerald-900 fill-emerald-900 shrink-0" />}
                      </div>
                      <Badge variant="outline" className="text-xs font-bold border-emerald-900/10 text-emerald-900 px-2 py-0">
                        {item.industry || item.listing_type_name || 'Enterprise'}
                      </Badge>
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
                      {item.excerpt && <p className="text-stone-500 text-sm line-clamp-2 mb-6 leading-relaxed font-normal">{item.excerpt}</p>}
                    </>
                  )}

                  {type === 'entrepreneur' && (
                    <>
                      <h4 className="font-black text-xl text-stone-900 mb-2 truncate">{item.name}</h4>
                      <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-widest mb-4 h-8 line-clamp-2 leading-tight">
                        {item.role_title} at {item.company_name}
                      </p>
                      <div className="flex justify-center gap-2 mb-6">
                        {item.industry && (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-900 border-none font-bold text-xs px-3">
                            {item.industry}
                          </Badge>
                        )}
                        {item.city && (
                           <Badge variant="outline" className="border-stone-100 text-stone-400 font-bold text-xs">
                             {item.city}
                           </Badge>
                        )}
                      </div>
                    </>
                  )}

                  {type === 'directory' && item.short_description && (
                    <p className="text-sm text-stone-600 line-clamp-2 mb-4 leading-relaxed font-medium">
                      {item.short_description}
                    </p>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="mt-auto pt-6 border-t border-stone-50 flex items-center justify-between">
                  {(type === 'blog' || type === 'knowledge') && (
                    <>
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
                        <User className="w-3.5 h-3.5 text-emerald-900" />
                        <span className="truncate max-w-[100px]">{item.author_name}</span>
                      </div>
                      <Link 
                        href={`/${type === 'blog' ? 'blog' : 'knowledge'}/${item.slug || item.id}`}
                        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-900 hover:text-emerald-700 transition-all group-hover:translate-x-1"
                      >
                        Read Asset <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </>
                  )}

                  {type === 'directory' && (
                    <div className="flex items-center gap-4 w-full justify-between">
                      <p className="text-xs font-bold text-stone-400 flex items-center gap-1.5 uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5 text-emerald-900" /> {item.city || 'Bangladesh'}
                      </p>
                      <Link 
                        href={`/directory/${item.slug}`} 
                        className="text-xs font-black uppercase tracking-widest text-emerald-900 hover:text-emerald-700 flex items-center gap-2 transition-all hover:translate-x-1"
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
                      <button className="w-full py-4 bg-stone-50 text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-900 hover:text-white transition-all transform hover:-translate-y-1 shadow-sm active:scale-95">
                        View Journey
                      </button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="sm:hidden mt-12">
          {viewAllHref && (
            <Link href={viewAllHref}>
              <button className="w-full py-5 bg-emerald-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/20 active:scale-95 transition-transform">
                Browse Registry <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
