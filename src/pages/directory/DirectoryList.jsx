import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { listingAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Search,
  MapPin,
  Building2,
  Globe,
  Star,
  Filter,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';

const listingTypes = [
  { value: 'startup', label: 'Startups' },
  { value: 'sme', label: 'SMEs' },
  { value: 'entrepreneur', label: 'Entrepreneurs' },
  { value: 'service_provider', label: 'Service Providers' },
];

const categories = [
  'Technology', 'E-commerce', 'Fintech', 'Healthcare', 'Education',
  'Agriculture', 'Manufacturing', 'Retail', 'Logistics', 'Food & Beverage',
  'Fashion', 'Media', 'Real Estate', 'Marketing', 'Consulting', 'Other'
];

const DirectoryList = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const listingType = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      try {
        const res = await listingAPI.list({
          search: search || undefined,
          listing_type: listingType || undefined,
          category: category || undefined,
          limit: 24
        });
        setListings(res.data || []);
      } catch (error) {
        console.error('Error loading listings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [search, listingType, category]);

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const featuredListings = listings.filter(l => l.is_featured);
  const regularListings = listings.filter(l => !l.is_featured);

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="directory-page">
      <SEO pageKey="directory" />
      {/* Header */}
      <div className="bg-emerald-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="bg-emerald-800 text-emerald-100 mb-4">Directory</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Business Directory
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl">
            Discover startups, SMEs, and service providers across Bangladesh.
            Find your next business partner or investment opportunity.
          </p>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Desktop Tabs */}
          <div className="hidden sm:block w-full">
            <Tabs value={listingType || 'all'} onValueChange={(v) => updateFilters('type', v)}>
              <TabsList className="bg-white border border-stone-200">
                <TabsTrigger value="all" className="data-[state=active]:bg-emerald-900 data-[state=active]:text-white">
                  All
                </TabsTrigger>
                {listingTypes.map((type) => (
                  <TabsTrigger
                    key={type.value}
                    value={type.value}
                    className="data-[state=active]:bg-emerald-900 data-[state=active]:text-white"
                  >
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Mobile Dropdown */}
          <div className="sm:hidden w-full">
            <Select value={listingType || 'all'} onValueChange={(v) => updateFilters('type', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {listingTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => updateFilters('search', e.target.value)}
              className="pl-10"
              data-testid="directory-search-input"
            />
          </div>
          <Select value={category || 'all'} onValueChange={(v) => updateFilters('category', v)}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-lg text-stone-500">No businesses found</p>
            {(search || listingType || category) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchParams({})}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featuredListings.length > 0 && !search && !category && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  Featured Businesses
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} featured />
                  ))}
                </div>
              </div>
            )}

            {/* All Listings */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ListingCard = ({ listing, featured }) => (
  <Link to={`/directory/${listing.slug}`}>
    <Card className={`h-full border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200 ${featured ? 'ring-2 ring-yellow-200' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {listing.logo ? (
              <img src={listing.logo} alt={listing.business_name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-stone-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-stone-900 truncate">{listing.business_name}</h3>
              {listing.is_verified && (
                <Badge className="bg-blue-100 text-blue-700 text-xs">Verified</Badge>
              )}
              {featured && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-stone-500 capitalize mb-2">
              {listing.listing_type?.replace('_', ' ')}
            </p>
            {listing.city && (
              <p className="text-xs text-stone-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.city}, {listing.country}
              </p>
            )}
          </div>
        </div>

        {listing.category && (
          <Badge variant="outline" className="mt-4 text-xs">
            {listing.category}
          </Badge>
        )}

        {listing.short_description && (
          <p className="text-sm text-stone-600 mt-3 line-clamp-2">{listing.short_description}</p>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-100 text-xs text-stone-400">
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
  </Link>
);

export default DirectoryList;
