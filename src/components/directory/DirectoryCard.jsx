import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Star, Globe, Mail, Phone, ArrowRight } from 'lucide-react';

export default function DirectoryCard({ listing, isFeatured = false }) {
  return (
    <Link href={`/directory/${listing.slug}`} className="block h-full">
      <Card className={`h-full border-stone-200/60 hover:border-emerald-900/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 group rounded-[32px] flex flex-col bg-white overflow-hidden ${isFeatured ? 'ring-2 ring-emerald-900/5' : ''}`}>
        <CardContent className="p-8 flex-1 flex flex-col">
          {/* Header Interaction Deck */}
          <div className="flex items-start gap-5 mb-8">
            <div className="w-20 h-20 bg-stone-50 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-stone-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
              {listing.logo ? (
                <img src={listing.logo} alt={listing.business_name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-stone-200" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-stone-900 truncate group-hover:text-emerald-900 transition-colors">
                  {listing.business_name}
                </h3>
                {isFeatured && <Star className="w-4 h-4 text-emerald-900 fill-emerald-900" />}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-emerald-50 text-emerald-900 border-none font-bold text-xs uppercase tracking-wider">
                  {listing.listing_type_name || listing.listing_type?.replace('_', ' ') || 'Enterprise'}
                </Badge>
                {listing.is_verified && (
                  <Badge className="bg-blue-50 text-blue-700 border-none font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Location Context */}
          {listing.city && (
            <div className="flex items-center gap-2 text-stone-400 font-bold text-xs mb-6 uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-emerald-900" />
              {listing.city}{listing.country ? `, ${listing.country}` : ''}
            </div>
          )}

          {/* Narrative Snippet */}
          {(listing.details || listing.short_description) && (
            <p className="text-stone-600 text-sm line-clamp-3 mb-8 leading-relaxed italic border-l-2 border-emerald-50 pl-4">
              "{listing.details || listing.short_description}"
            </p>
          )}

          {/* Industry Slot */}
          {listing.category_name && (
             <div className="mb-8">
                <Badge variant="outline" className="border-stone-200 text-stone-500 font-bold text-xs px-3 py-1">
                  {listing.category_name}
                </Badge>
             </div>
          )}

          {/* Meta Deck Footer */}
          <div className="mt-auto pt-6 border-t border-stone-50 flex items-center justify-between">
            <div className="flex items-center gap-4 text-stone-300">
              {listing.website && <Globe className="w-4 h-4 hover:text-emerald-900 transition-colors" />}
              {listing.email && <Mail className="w-4 h-4 hover:text-emerald-900 transition-colors" />}
              {listing.phone && <Phone className="w-4 h-4 hover:text-emerald-900 transition-colors" />}
            </div>
            
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 group-hover:gap-3 transition-all">
               Profile Details <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CheckCircle({ className }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
