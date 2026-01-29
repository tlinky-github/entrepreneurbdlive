import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { profileAPI } from '../../lib/api';
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

const industries = [
  'Technology', 'E-commerce', 'Fintech', 'Healthcare', 'Education',
  'Agriculture', 'Manufacturing', 'Retail', 'Logistics', 'Food & Beverage',
  'Fashion', 'Media', 'Real Estate', 'Energy', 'Other'
];

const cities = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna',
  'Comilla', 'Rangpur', 'Gazipur', 'Narayanganj', 'Other'
];

const EntrepreneurList = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const industry = searchParams.get('industry') || '';
  const city = searchParams.get('city') || '';

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      try {
        const res = await profileAPI.list({
          search: search || undefined,
          industry: industry || undefined,
          city: city || undefined,
          limit: 24
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
    setSearchParams(params);
  };

  const featuredProfiles = profiles.filter(p => p.is_featured);
  const regularProfiles = profiles.filter(p => !p.is_featured);

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="entrepreneurs-page">
      <SEO pageKey="entrepreneurs" />
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
                    <ProfileCard key={profile.id} profile={profile} featured />
                  ))}
                </div>
              </div>
            )}

            {/* All Profiles */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ProfileCard = ({ profile, featured }) => (
  <Link to={`/entrepreneurs/${profile.slug}`}>
    <Card className={`h-full border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200 ${featured ? 'ring-2 ring-yellow-200' : ''}`}>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-emerald-900">
                {profile.name?.charAt(0)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-1 mb-1">
            <h3 className="font-semibold text-stone-900">{profile.name}</h3>
            {featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
          </div>

          {profile.role_title && profile.company_name && (
            <p className="text-sm text-stone-500 mb-2">
              {profile.role_title} at {profile.company_name}
            </p>
          )}

          {profile.city && (
            <p className="text-xs text-stone-400 flex items-center justify-center gap-1 mb-3">
              <MapPin className="w-3 h-3" />
              {profile.city}, {profile.country}
            </p>
          )}

          {profile.industry && (
            <Badge variant="outline" className="text-xs mb-3">
              {profile.industry}
            </Badge>
          )}

          {profile.startup_stage && (
            <Badge className="bg-emerald-100 text-emerald-900 text-xs ml-2">
              {profile.startup_stage}
            </Badge>
          )}

          {profile.short_bio && (
            <p className="text-sm text-stone-600 mt-3 line-clamp-2">{profile.short_bio}</p>
          )}

          <div className="flex justify-center gap-3 mt-4">
            {profile.website && (
              <Globe className="w-4 h-4 text-stone-400 hover:text-emerald-900" />
            )}
            {profile.linkedin && (
              <Linkedin className="w-4 h-4 text-stone-400 hover:text-emerald-900" />
            )}
            {profile.twitter && (
              <Twitter className="w-4 h-4 text-stone-400 hover:text-emerald-900" />
            )}
          </div>

          <div className="mt-4 text-xs text-stone-400">
            <Users className="w-3 h-3 inline mr-1" />
            {profile.follower_count} followers
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default EntrepreneurList;
