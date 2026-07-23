import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { MapPin, Globe, Linkedin, Twitter, Star } from 'lucide-react';
import DefaultAvatar from '../ui/DefaultAvatar';

const ProfileCard = ({ profile, featured, startupStages = [] }) => {
  const getStageName = (stageVal) => {
    if (!stageVal) return '';
    const match = startupStages.find(s => s.id === stageVal || s.slug === stageVal || s.name?.toLowerCase() === stageVal.toLowerCase());
    return match ? match.name : stageVal;
  };

  return (
    <a href={`/entrepreneurs/${profile.slug}`} className="block h-full">
      <Card className={`h-full border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200 rounded-2xl ${featured ? 'ring-2 ring-yellow-200' : ''}`}>
        <CardContent className="p-6 flex flex-col h-full">
          <div className="text-center flex-1 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden flex-shrink-0">
              {(profile.featured_image || profile.photo) ? (
                <img src={profile.featured_image || profile.photo} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <DefaultAvatar gender={profile.gender} />
              )}
            </div>

            <div className="flex items-center justify-center gap-1 mb-1">
              <h3 className="font-semibold text-stone-900">{profile.name}</h3>
              {featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
            </div>

            <div className="min-h-[2.5rem] flex items-center justify-center mb-1">
              {(profile.designation || profile.role_title) && profile.company_name && (
                <p className="text-sm text-stone-500 line-clamp-2">
                  {profile.designation || profile.role_title} at {profile.company_name}
                </p>
              )}
            </div>

            {(profile.city || profile.headquarters) && (
              <p className="text-sm text-stone-400 flex items-center justify-center gap-1 mb-3">
                <MapPin className="w-3 h-3" />
                {profile.headquarters || `${profile.city}${profile.country ? `, ${profile.country}` : ''}`}
              </p>
            )}

            <div className="min-h-[2.25rem] flex flex-wrap items-center justify-center gap-2 mb-3">
              {profile.industry && (
                <Badge variant="outline" className="text-sm">
                  {profile.industry}
                </Badge>
              )}

              {profile.startup_stage && (
                <Badge className="bg-emerald-100 text-emerald-900 text-sm">
                  {getStageName(profile.startup_stage)}
                </Badge>
              )}
            </div>

            {(profile.details || profile.short_bio) && (
              <p className="text-sm text-stone-600 mt-1 line-clamp-6 flex-1 overflow-hidden">
                {profile.details || profile.short_bio}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-4 mt-auto pt-4 border-t border-stone-100/80">
            {(profile.company_page_url || profile.website) && (
              <Globe className="w-4 h-4 text-stone-400 hover:text-emerald-900 transition-colors" />
            )}
            {profile.linkedin && (
              <Linkedin className="w-4 h-4 text-stone-400 hover:text-emerald-900 transition-colors" />
            )}
            {profile.twitter && (
              <Twitter className="w-4 h-4 text-stone-400 hover:text-emerald-900 transition-colors" />
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
};

export default ProfileCard;
