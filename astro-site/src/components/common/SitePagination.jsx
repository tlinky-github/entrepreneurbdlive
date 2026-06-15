import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';

export const SitePagination = ({ 
  currentPage, 
  totalPages, 
  baseUrl = '', // If provided, creates SEO-friendly anchor tags
  onPageChange, // Fallback for pure React state-based pagination
  searchParams = new URLSearchParams(), // Preserves existing query params
  className = "" 
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }

    return pages;
  };

  const getUrl = (page) => {
    if (!baseUrl && !onPageChange) {
      // Auto-detect current URL if neither is provided (for Astro client:load)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('page', page);
        return url.toString();
      }
      return `?page=${page}`;
    }
    
    if (baseUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page);
      const queryString = params.toString();
      return `${baseUrl}${queryString ? '?' + queryString : ''}`;
    }
    
    return '#';
  };

  const handleClick = (e, page) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(page);
    }
  };

  const renderButton = (page, content, disabled = false, isCurrent = false) => {
    const isMore = content === '...';
    
    if (isMore) {
      return (
        <div className="w-10 h-10 flex items-center justify-center text-stone-400">
          <MoreHorizontal className="w-4 h-4" />
        </div>
      );
    }

    const commonClasses = `flex items-center justify-center w-10 h-10 rounded-md transition-colors ${
      isCurrent 
        ? 'bg-emerald-900 text-white font-medium hover:bg-emerald-800' 
        : 'border border-stone-200 text-stone-600 bg-white hover:text-emerald-900 hover:border-emerald-200 hover:bg-emerald-50'
    } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`;

    if (onPageChange || typeof window === 'undefined') {
       return (
         <button 
           onClick={(e) => handleClick(e, page)} 
           disabled={disabled}
           className={commonClasses}
           aria-current={isCurrent ? "page" : undefined}
         >
           {content}
         </button>
       );
    }

    // Default to anchor tag for Astro client:load
    return (
      <a 
        href={getUrl(page)} 
        className={commonClasses}
        aria-disabled={disabled}
        aria-current={isCurrent ? "page" : undefined}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
      >
        {content}
      </a>
    );
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {renderButton(currentPage - 1, <ChevronLeft className="w-4 h-4" />, currentPage === 1)}
      
      <div className="flex items-center gap-1 hidden sm:flex">
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {renderButton(page, page, false, currentPage === page)}
          </React.Fragment>
        ))}
      </div>
      
      <span className="text-sm font-medium text-stone-600 sm:hidden">
        Page {currentPage} of {totalPages}
      </span>

      {renderButton(currentPage + 1, <ChevronRight className="w-4 h-4" />, currentPage === totalPages)}
    </div>
  );
};

export default SitePagination;
