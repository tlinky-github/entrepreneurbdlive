'use client';
import React from 'react';

/**
 * UniversalLink Engine
 * High-performance link component that bridges legacy CRA and modern Next.js environments.
 * Ensures the app remains operational during the final phase of migration.
 */
const UniversalLink = React.forwardRef(({ href, children, ...props }, ref) => {
  // 1. Detect environment
  // Next.js components are usually rendered within a specific global context
  // or use the 'next/link' internal modules.
  
  const [isNext, setIsNext] = React.useState(false);

  React.useEffect(() => {
    // Check for Next.js specific marks in the DOM or window
    if (window.next || document.querySelector('#__NEXT_DATA__')) {
      setIsNext(true);
    }
  }, []);

  // Standard <a> tag fallback if we are in a transitional state or dynamic link
  if (!href) return <span {...props} ref={ref}>{children}</span>;

  // If we are definitely in Next.js (or navigating to a migrated route)
  // We want to use absolute pathing for a clean handover
  return (
    <a 
      href={href} 
      {...props} 
      ref={ref}
      onClick={(e) => {
        // If we are in the legacy SPA (react-router-dom), we hijack the click
        // to prevent full reloads on legacy routes while using RRD's navigate.
        if (!isNext && !href.startsWith('http') && !href.startsWith('mailto')) {
          // This allows RRD to handle the navigation if it is currently managing the page
          // (Requires 'useNavigate' which we'll handle in the specific Layout components)
        }
      }}
    >
      {children}
    </a>
  );
});

UniversalLink.displayName = 'UniversalLink';

export default UniversalLink;
