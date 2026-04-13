import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listingAPI } from '../../lib/api';
import { SEO } from '../../components/SEO';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Globe,
  Mail,
  Phone,
  Star,
  Share2,
  ExternalLink,
  Eye,
  Calendar
} from 'lucide-react';

const DirectoryDetail = () => {
  const { slug } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadListing = async () => {
      setLoading(true);
      try {
        const res = await listingAPI.get(slug);
        setListing(res.data);
      } catch (error) {
        console.error('Error loading listing:', error);
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [slug]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: listing.business_name,
        text: listing.short_description,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="bg-stone-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="bg-white rounded-xl p-8">
            <div className="flex items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="bg-stone-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Business Not Found</h1>
          <Link to="/directory">
            <Button className="bg-emerald-900 hover:bg-emerald-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="directory-detail-page">
      <SEO
        title={listing.seoTitle || listing.business_name}
        description={listing.metaDescription || listing.short_description}
        image={listing.logo}
        type="business.business"
        keywords={[listing.category, listing.city, listing.listing_type, 'Business Directory', 'Bangladesh'].filter(Boolean)}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Directory', path: '/directory' },
          { name: listing.business_name, path: `/directory/${listing.slug}` }
        ]}
      />
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/directory" className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
      </div>

      {/* Listing Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-stone-200 overflow-hidden">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-24 h-24 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {listing.logo ? (
                  <img src={listing.logo} alt={listing.business_name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-12 h-12 text-stone-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-2xl font-bold text-stone-900">{listing.business_name}</h1>
                      {listing.is_verified && (
                        <Badge className="bg-blue-100 text-blue-700">Verified</Badge>
                      )}
                      {listing.is_featured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <p className="text-lg text-stone-600 capitalize mb-2">
                      {listing.listing_type?.replace('_', ' ')}
                    </p>
                    {listing.headquarters || listing.city ? (
                      <p className="text-sm text-stone-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {listing.headquarters || (listing.address ? `${listing.address}, ${listing.city}` : listing.city)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    {listing.website && (
                      <a href={listing.company_page_url || listing.website} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-emerald-900 hover:bg-emerald-800">
                          <Globe className="w-4 h-4 mr-2" />
                          Visit Website
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-6">
                  {listing.category && (
                    <Badge variant="outline">{listing.category}</Badge>
                  )}
                  {listing.employee_size && (
                    <span className="text-sm text-stone-500 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {listing.employee_size} Employees
                    </span>
                  )}
                  <span className="text-sm text-stone-500 flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {listing.view_count} views
                  </span>
                </div>
              </div>
            </div>

            {/* Description & Leadership */}
            <div className="grid md:grid-cols-3 gap-8 mt-8 pt-8 border-t border-stone-200">
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">About</h2>
                {listing.details || listing.short_description || listing.full_description ? (
                  <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                    {listing.details || listing.full_description || listing.short_description}
                  </p>
                ) : (
                  <p className="text-stone-400 italic">No description provided</p>
                )}

                {/* Main Rich Content */}
                {listing.content && (
                  <div className="mt-8 pt-8 border-t border-stone-200">
                    <div 
                      className="tiptap-content text-stone-700"
                      dangerouslySetInnerHTML={{ __html: listing.content }}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">Leadership</h3>
                  <div className="space-y-4">
                    {listing.founder_name && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-900 font-bold">
                          {listing.founder_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{listing.founder_name}</p>
                          <p className="text-xs text-stone-500">Founder</p>
                        </div>
                      </div>
                    )}
                    {listing.ceo_name && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-50 rounded-lg flex items-center justify-center text-stone-900 font-bold">
                          {listing.ceo_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{listing.ceo_name}</p>
                          <p className="text-xs text-stone-500">CEO</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Life at Company */}
            {listing.life_at_company && (
              <div className="mt-8 pt-8 border-t border-stone-200">
                <h2 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 fill-emerald-900" />
                  Life at {listing.business_name}
                </h2>
                <div 
                  className="tiptap-content bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100"
                  dangerouslySetInnerHTML={{ __html: listing.life_at_company }}
                />
              </div>
            )}

            {/* Contact Info */}
            <div className="mt-8 pt-8 border-t border-stone-200">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">Contact Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {listing.email && (
                  <a
                    href={`mailto:${listing.email}`}
                    className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-emerald-900" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Email</p>
                      <p className="text-sm font-medium text-stone-900">{listing.email}</p>
                    </div>
                  </a>
                )}
                {listing.phone && (
                  <a
                    href={`tel:${listing.phone}`}
                    className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-emerald-900" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Phone</p>
                      <p className="text-sm font-medium text-stone-900">{listing.phone}</p>
                    </div>
                  </a>
                )}
                {listing.website && (
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-emerald-900" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Website</p>
                      <p className="text-sm font-medium text-stone-900 flex items-center gap-1">
                        {listing.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        <ExternalLink className="w-3 h-3" />
                      </p>
                    </div>
                  </a>
                )}
                {listing.address && (
                  <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-emerald-900" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Address</p>
                      <p className="text-sm font-medium text-stone-900">
                        {listing.address}, {listing.city}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Badge */}
            {listing.plan === 'premium' && (
              <div className="mt-8 pt-8 border-t border-stone-200">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  Premium Listing
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DirectoryDetail;
