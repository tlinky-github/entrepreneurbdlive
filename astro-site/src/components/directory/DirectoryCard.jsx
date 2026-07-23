import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Building2, MapPin, Globe, Mail, Phone, Star } from 'lucide-react';
import { resolveListingTypeLabel } from '../../lib/listingTypes.js';

const DirectoryCard = ({ listing, featured, listingTypes = [] }) => (
  <a href={`/directory/${listing.slug}`} className="block h-full">
    <Card className={`h-full border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200 rounded-2xl ${featured ? 'ring-2 ring-yellow-200' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
            {listing.logo ? (
              <img src={listing.logo} alt={listing.logo_alt || listing.business_name} className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-8 h-8 text-stone-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-stone-900 truncate">{listing.business_name}</h3>
              {listing.is_verified && (
                <Badge className="bg-blue-100 text-blue-700 text-sm">Verified</Badge>
              )}
              {featured && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-stone-500 capitalize mb-2">
              {resolveListingTypeLabel(listing.listing_type, listing.listing_type_name, listingTypes)}
            </p>
            {listing.city && (
              <p className="text-sm text-stone-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.city}{listing.country ? `, ${listing.country}` : ''}
              </p>
            )}
          </div>
        </div>

        {listing.category_name && (
          <Badge variant="outline" className="mt-4 text-sm">
            {listing.category_name}
          </Badge>
        )}

        {(listing.details || listing.short_description) && (
          <p className="text-sm text-stone-600 mt-3 line-clamp-3">
            {listing.details || listing.short_description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-100 text-sm text-stone-400">
          {listing.website && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Website
            </span>
          )}
          {listing.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              Email
            </span>
          )}
          {listing.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Phone
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  </a>
);

export default DirectoryCard;
