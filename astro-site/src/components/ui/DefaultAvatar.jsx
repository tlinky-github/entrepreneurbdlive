import React from 'react';

const DefaultAvatar = ({ gender, className = "w-full h-full" }) => {
  if (gender === 'female') {
    return (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={`${className} bg-stone-100`}>
        {/* Long Hair (Behind Body) */}
        <path d="M 32 40 C 15 50, 20 90, 20 90 L 80 90 C 80 90, 85 50, 68 40 Z" fill="#44403c" />
        {/* Body (Suit) */}
        <path d="M 15 100 C 15 75, 35 65, 50 65 C 65 65, 85 75, 85 100 Z" fill="#047857" />
        {/* V-Neck Cutout */}
        <path d="M 43 65 L 50 78 L 57 65 Z" fill="#d6d3d1" />
        {/* Neck */}
        <rect x="43" y="55" width="14" height="15" fill="#d6d3d1" />
        {/* Hair Dome */}
        <path d="M 31 42 C 31 15, 69 15, 69 42 Z" fill="#44403c" />
        {/* Face */}
        <ellipse cx="50" cy="44" rx="17" ry="19" fill="#e7e5e4" />
      </svg>
    );
  }

  // Male / Default
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={`${className} bg-stone-100`}>
      {/* Body (Suit) */}
      <path d="M 15 100 C 15 75, 35 65, 50 65 C 65 65, 85 75, 85 100 Z" fill="#047857" />
      {/* Neck */}
      <rect x="41" y="55" width="18" height="15" fill="#d6d3d1" />
      {/* Short Hair Dome */}
      <path d="M 32 38 C 32 15, 68 15, 68 38 Z" fill="#44403c" />
      {/* Face */}
      <ellipse cx="50" cy="42" rx="18" ry="19" fill="#e7e5e4" />
    </svg>
  );
};

export default DefaultAvatar;
