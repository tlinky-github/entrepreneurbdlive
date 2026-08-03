import { useState, useEffect } from 'react';
import { profileAPI, industryAPI, cityAPI, taxonomyAPI } from '../../lib/api';
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
  Linkedin,
  Twitter,
  Users,
  Filter,
  Star
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import DefaultAvatar from '../ui/DefaultAvatar';
import ProfileCard from './ProfileCard';

import { SitePagination } from '../../components/common/SitePagination';

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

const EntrepreneurList = ({ initialProfiles = [], initialIndustries = [], initialCities = [], initialPerPage = 12 }) => {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [industries, setIndustries] = useState(initialIndustries);
  const [cities, setCities] = useState(initialCities);
  const [startupStages, setStartupStages] = useState([]);
  const [loading, setLoading] = useState(initialProfiles.length === 0);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const industry = searchParams.get('industry') || '';
  const city = searchParams.get('city') || '';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const ITEMS_PER_PAGE = initialPerPage;

  // Load dynamic filters
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [indRes, cityRes, stageRes] = await Promise.all([
          industryAPI.list(),
          cityAPI.list(),
          taxonomyAPI.list('startup_stages')
        ]);
        setIndustries(indRes.data?.map(i => i.name) || []);
        setCities(cityRes.data?.map(c => c.name) || []);
        setStartupStages(stageRes.data || []);
      } catch (error) {
        console.error('Error loading filters:', error);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      try {
        const res = await profileAPI.list({
          search: search || undefined,
          industry: industry || undefined,
          city: city || undefined,
          status: 'published'
        });
        setProfiles(res.data || []);
      } catch (error) {
        console.error('Error loading profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [search, industry, city]);

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page back to 1 when search filters change
    if (key !== 'page') {
      params.delete('page');
    }
    setSearchParams(params);
    // Smooth scroll to top for better UX
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const featuredProfiles = profiles.filter(p => p.is_featured);
  let regularProfiles = profiles.filter(p => !p.is_featured);
  if (search || industry || city) {
    regularProfiles = profiles;
  }

  // Calculate Pagination parameters
  const totalPages = Math.ceil(regularProfiles.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProfiles = regularProfiles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="entrepreneurs-page">
      {/* Header */}
      <div className="bg-emerald-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="bg-emerald-800 text-emerald-100 mb-4">Community</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Entrepreneurs
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl">
            Connect with Bangladesh's most innovative founders and business leaders.
            Find mentors, partners, and collaborators.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Search entrepreneurs..."
              value={search}
              onChange={(e) => updateFilters('search', e.target.value)}
              className="pl-10"
              data-testid="entrepreneur-search-input"
            />
          </div>
          <Select value={industry || 'all'} onValueChange={(v) => updateFilters('industry', v)}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={city || 'all'} onValueChange={(v) => updateFilters('city', v)}>
            <SelectTrigger className="w-full md:w-48">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-lg text-stone-500">No entrepreneurs found</p>
            {(search || industry || city) && (
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
            {featuredProfiles.length > 0 && !search && !industry && !city && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  Featured Entrepreneurs
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredProfiles.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} featured startupStages={startupStages} />
                  ))}
                </div>
              </div>
            )}

            {/* All Profiles */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} startupStages={startupStages} />
              ))}
            </div>

            {/* Pagination Component */}
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

export default EntrepreneurList;
