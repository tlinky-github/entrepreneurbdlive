import { useState, useEffect } from 'react';
import { listingAPI, categoryAPI, taxonomyAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { SitePagination } from '../../components/common/SitePagination';
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
import DirectoryCard from './DirectoryCard';

// Custom useSearchParams for Astro environment
const useSearchParams = () => {
  const [searchParams, setSearchParamsState] = useState(
    new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  );

  const setSearchParams = (params) => {
    setSearchParamsState(params);
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  return [searchParams, setSearchParams];
};

const DirectoryList = () => {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [listingTypes, setListingTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const listingType = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const ITEMS_PER_PAGE = 12;

  // Load dynamic filters
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, typeRes] = await Promise.all([
          categoryAPI.list(),
          taxonomyAPI.list('listing_types')
        ]);
        setCategories(catRes.data || []);
        setListingTypes(typeRes.data || []);
      } catch (error) {
        console.error('Error loading filters:', error);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      try {
        const res = await listingAPI.list({
          search: search || undefined,
          listing_type: listingType || undefined,
          category: category || undefined,
          status: 'published'
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
  
  // Calculate Pagination
  let regularListings = listings.filter(l => !l.is_featured);
  // If searching or filtering, we don't separate featured (we just show all matches properly)
  if (search || category || listingType) {
    regularListings = listings;
  }
  
  const totalPages = Math.ceil(regularListings.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedListings = regularListings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="directory-page">
      {/* Header */}
      <div className="bg-emerald-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="bg-emerald-800 text-emerald-100 mb-4">Directory</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Business Directory
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl">
            Discover the most ambitious businesses and entrepreneurs across Bangladesh.
            Connect, collaborate, and grow with our verified community.
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
                     key={type.id}
                     value={type.slug}
                     className="data-[state=active]:bg-emerald-900 data-[state=active]:text-white"
                   >
                     {type.name}
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
                   <SelectItem key={type.id} value={type.slug}>{type.name}</SelectItem>
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
                <SelectItem key={cat.id} value={cat.slug || cat.id}>{cat.name}</SelectItem>
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
                    <Skeleton className="w-16 h-16 rounded-2xl" />
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
                    <DirectoryCard key={listing.id} listing={listing} featured listingTypes={listingTypes} />
                  ))}
                </div>
              </div>
            )}

            {/* All Listings */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedListings.map((listing) => (
                <DirectoryCard key={listing.id} listing={listing} listingTypes={listingTypes} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 border-t border-stone-200 pt-8">
                <SitePagination 
                  currentPage={safeCurrentPage} 
                  totalPages={totalPages} 
                  onPageChange={(p) => updateFilters('page', p)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DirectoryList;
