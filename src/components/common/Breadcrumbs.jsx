'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  // 🛡️ Logic Hub: Dynamic Path Reconstruction
  const generateCrumbs = () => {
    const pathSegments = pathname.split('/').filter(p => p);
    const crumbs = [
      { name: 'Home', path: '/' }
    ];
    
    let currentPath = '';
    pathSegments.forEach((segment, idx) => {
      currentPath += `/${segment}`;
      // Clean up slugs (replace hyphens, capitalize)
      const name = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      crumbs.push({ name, path: currentPath });
    });
    
    return crumbs;
  };

  const crumbs = generateCrumbs();

  if (pathname === '/') return null;

  return (
    <nav className="bg-white border-b border-stone-100 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center flex-wrap gap-2 sm:gap-3">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            
            return (
              <li key={crumb.path} className="flex items-center">
                {idx > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300 mx-1 sm:mx-2" />
                )}
                
                {isLast ? (
                  <span className="text-xs sm:text-sm font-semibold text-emerald-900 bg-emerald-50 px-3 py-1 rounded-full">
                    {crumb.name}
                  </span>
                ) : (
                  <Link 
                    href={crumb.path}
                    className="text-xs sm:text-sm font-medium text-stone-500 hover:text-emerald-900 transition-colors flex items-center gap-1.5"
                  >
                    {idx === 0 && <Home className="w-3 h-3" />}
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
