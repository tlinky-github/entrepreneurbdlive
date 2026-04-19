'use client';
import React from 'react';

/**
 * useSafeNavigation
 * A bridge hook that provides 'pathname' and 'router' functionality 
 * across both legacy SPA (CRA) and modern Next.js contexts.
 */
export const useSafeNavigation = () => {
  // Use state to track environment safely
  const [isNext, setIsNext] = React.useState(false);
  const [pathname, setPathname] = React.useState('/');

  // Fallback state for router
  const [router, setRouter] = React.useState({
    push: (url) => { window.location.href = url; },
    replace: (url) => { window.location.replace(url); },
    back: () => { window.history.back(); }
  });

  React.useEffect(() => {
    // 1. Detect Environment
    const isNextEnv = typeof window !== 'undefined' && (window.next || !!document.querySelector('#__NEXT_DATA__'));
    setIsNext(isNextEnv);

    if (isNextEnv) {
      // Logic for Next.js - Pathname is typically handled by the App Router
      setPathname(window.location.pathname);
    } else {
      // Logic for Legacy CRA
      setPathname(window.location.pathname);
    }
  }, []);

  // Return a consolidated interface
  return {
    pathname,
    router,
    isNext
  };
};
