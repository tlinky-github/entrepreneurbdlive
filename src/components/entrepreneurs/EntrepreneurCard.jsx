import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Linkedin, Twitter, Globe, Star, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function EntrepreneurCard({ profile, isFeatured = false }) {
  const photo = profile.featured_image || profile.photo;

  return (
    <Link href={`/entrepreneurs/${profile.slug}`} className="block h-full group">
      <Card className={`h-full border-stone-200/60 hover:border-emerald-900/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 rounded-[32px] flex flex-col bg-white overflow-hidden ${isFeatured ? 'ring-2 ring-emerald-900/5' : ''}`}>
        <CardContent className="p-8 flex-1 flex flex-col items-center text-center">
          {/* 🛡️ Profile Spotlight */}
          <div className="relative mb-6">
            <div className={`w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500 ring-2 ${isFeatured ? 'ring-emerald-900/10' : 'ring-stone-100'}`}>
              {photo ? (
                <img src={photo} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-emerald-50 text-emerald-900 text-3xl font-bold">
                  {profile.name?.charAt(0)}
                </AvatarFallback>
              )}
            </div>
            {isFeatured && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-900 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <Star className="w-4 h-4 text-white fill-current" />
              </div>
            )}
          </div>

          {/* 🛡️ Identity Deck */}
          <div className="mb-4 flex-1">
             <h3 className="text-xl font-bold text-stone-900 mb-1 group-hover:text-emerald-900 transition-colors">
               {profile.name}
             </h3>
             {(profile.designation || profile.role_title) && (
               <p className="text-sm font-bold text-emerald-900/60 uppercase tracking-widest mb-1">
                 {profile.designation || profile.role_title}
               </p>
             )}
             {profile.company_name && (
               <p className="text-xs font-medium text-stone-400 mb-4 italic">
                 at {profile.company_name}
               </p>
             )}
          </div>

          {/* 🛡️ Context Deck */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {profile.industry && (
              <Badge variant="outline" className="border-stone-100 text-stone-500 font-bold text-xs px-3">
                {profile.industry}
              </Badge>
            )}
            {profile.startup_stage && (
               <Badge className="bg-emerald-50 text-emerald-800 border-none font-bold text-xs">
                 {profile.startup_stage}
               </Badge>
            )}
          </div>

          {(profile.city || profile.headquarters) && (
            <div className="flex items-center justify-center gap-2 text-stone-400 font-bold text-xs mb-8 uppercase tracking-widest">
              <MapPin className="w-3.5 h-3.5 text-emerald-900" />
              {profile.headquarters || profile.city}
            </div>
          )}

          {/* 🛡️ Social Bar Footer */}
          <div className="mt-auto w-full pt-6 border-t border-stone-50 flex items-center justify-center gap-6">
            <div className="flex items-center gap-4">
               {profile.linkedin && <Linkedin className="w-4 h-4 text-stone-300 hover:text-emerald-900 transition-colors" />}
               {(profile.website || profile.company_page_url) && <Globe className="w-4 h-4 text-stone-300 hover:text-emerald-900 transition-colors" />}
               {profile.twitter && <Twitter className="w-4 h-4 text-stone-300 hover:text-emerald-900 transition-colors" />}
            </div>
          </div>
          
          <div className="mt-6">
             <span className="text-xs font-black uppercase tracking-[0.2em] text-stone-300 group-hover:text-emerald-900 transition-colors flex items-center gap-2">
                Discovery <ArrowRight className="w-3.5 h-3.5" />
             </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
