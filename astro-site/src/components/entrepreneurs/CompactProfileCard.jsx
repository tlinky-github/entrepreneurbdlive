import React from 'react';
import DefaultAvatar from '../ui/DefaultAvatar';

const CompactProfileCard = ({ profile }) => {
  return (
    <a href={`/entrepreneurs/${profile.slug}`} className="block group">
      <div className="flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-stone-200 hover:bg-white hover:shadow-sm transition-all duration-200">
        <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
          {(profile.featured_image || profile.photo) ? (
            <img src={profile.featured_image || profile.photo} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <DefaultAvatar gender={profile.gender} />
          )}
        </div>
        <div>
          <h4 className="font-bold text-lg text-stone-900 leading-tight group-hover:text-emerald-700 transition-colors">
            {profile.name}
          </h4>
          {(profile.designation || profile.role_title) && (
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">
              {profile.designation || profile.role_title}
              {profile.company_name && ` at ${profile.company_name}`}
            </p>
          )}
        </div>
      </div>
    </a>
  );
};

export default CompactProfileCard;
