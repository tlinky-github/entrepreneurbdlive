import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileAPI, interactionAPI } from '../../lib/api';
import { SEO } from '../../components/SEO';
import { useAuth } from '../../lib/auth';
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
  Linkedin,
  Twitter,
  Facebook,
  Mail,
  Users,
  Star,
  Share2,
  UserPlus,
  UserMinus
} from 'lucide-react';

const EntrepreneurDetail = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await profileAPI.get(slug);
        setProfile(res.data);

        if (isAuthenticated) {
          const followRes = await interactionAPI.checkFollow(res.data.id);
          setFollowing(followRes.data.following);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [slug, isAuthenticated]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to follow');
      return;
    }
    try {
      const res = await interactionAPI.toggleFollow(profile.id);
      setFollowing(res.data.following);
      setProfile(prev => ({
        ...prev,
        follower_count: prev.follower_count + (res.data.following ? 1 : -1)
      }));
      toast.success(res.data.following ? 'Now following' : 'Unfollowed');
    } catch (error) {
      toast.error('Failed to follow');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: profile.name,
        text: profile.short_bio,
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
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-stone-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Profile Not Found</h1>
          <Link to="/entrepreneurs">
            <Button className="bg-emerald-900 hover:bg-emerald-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Entrepreneurs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="entrepreneur-detail-page">
      <SEO
        title={profile.name}
        description={profile.short_bio}
        image={profile.photo}
        type="profile"
        keywords={[profile.industry, profile.city, profile.role_title, profile.company_name, 'Entrepreneur', 'Bangladesh'].filter(Boolean)}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Entrepreneurs', path: '/entrepreneurs' },
          { name: profile.name, path: `/entrepreneurs/${profile.slug}` }
        ]}
      />
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/entrepreneurs" className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Entrepreneurs
        </Link>
      </div>

      {/* Profile Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-stone-200 overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-emerald-900 to-emerald-700" />

          <CardContent className="p-8 -mt-16">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                  {profile.photo ? (
                    <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-emerald-900">
                      {profile.name?.charAt(0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 pt-4 md:pt-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-stone-900">{profile.name}</h1>
                      {profile.is_featured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {profile.role_title && profile.company_name && (
                      <p className="text-lg text-stone-600">
                        {profile.role_title} at <span className="font-medium">{profile.company_name}</span>
                      </p>
                    )}
                    {profile.city && (
                      <p className="text-sm text-stone-500 flex items-center gap-1 mt-2">
                        <MapPin className="w-4 h-4" />
                        {profile.city}, {profile.country}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={following ? 'outline' : 'default'}
                      className={following ? '' : 'bg-emerald-900 hover:bg-emerald-800'}
                      onClick={handleFollow}
                      data-testid="follow-btn"
                    >
                      {following ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-6 pt-6 border-t border-stone-200">
                  <div>
                    <p className="text-2xl font-bold text-stone-900">{profile.follower_count}</p>
                    <p className="text-sm text-stone-500">Followers</p>
                  </div>
                  {profile.industry && (
                    <div>
                      <Badge className="bg-emerald-100 text-emerald-900">{profile.industry}</Badge>
                    </div>
                  )}
                  {profile.startup_stage && (
                    <div>
                      <Badge variant="outline">{profile.startup_stage}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.short_bio && (
              <div className="mt-8 pt-8 border-t border-stone-200">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">About</h2>
                <p className="text-stone-700 leading-relaxed">{profile.short_bio}</p>
              </div>
            )}

            {/* Social Links */}
            <div className="mt-8 pt-8 border-t border-stone-200">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">Connect</h2>
              <div className="flex flex-wrap gap-3">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-emerald-100 rounded-lg text-stone-700 hover:text-emerald-900 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-blue-100 rounded-lg text-stone-700 hover:text-blue-700 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={profile.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-sky-100 rounded-lg text-stone-700 hover:text-sky-600 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </a>
                )}
                {profile.facebook && (
                  <a
                    href={profile.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-blue-100 rounded-lg text-stone-700 hover:text-blue-600 transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EntrepreneurDetail;
