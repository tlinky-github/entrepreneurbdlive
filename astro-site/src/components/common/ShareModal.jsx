import React, { useState, useEffect } from 'react';
import { X, Facebook, Linkedin, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const ShareModal = ({ isOpen, onClose, shareUrl, shareTitle, shareText }) => {
  const [copied, setCopied] = useState(false);
  const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const title = shareTitle || 'Entrepreneur BD';
  const text = shareText || '';

  // Reset copy state when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text || title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-100 p-6 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-stone-900 tracking-tight">Share this page</h3>
        </div>

        {/* Social Platforms Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Facebook */}
          <a 
            href={shareLinks.facebook} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 transition-all duration-300 transform group-hover:-translate-y-1 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200">
              <Facebook className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-stone-500 transition-colors duration-300 group-hover:text-stone-900">Facebook</span>
          </a>

          {/* X (formerly Twitter) */}
          <a 
            href={shareLinks.twitter} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-stone-50 text-stone-900 transition-all duration-300 transform group-hover:-translate-y-1 group-hover:bg-stone-900 group-hover:text-white group-hover:shadow-lg group-hover:shadow-stone-200">
              <svg 
                viewBox="0 0 24 24" 
                aria-hidden="true" 
                className="w-5 h-5 fill-current"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-stone-500 transition-colors duration-300 group-hover:text-stone-900">X</span>
          </a>

          {/* LinkedIn */}
          <a 
            href={shareLinks.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-sky-50 text-sky-700 transition-all duration-300 transform group-hover:-translate-y-1 group-hover:bg-sky-700 group-hover:text-white group-hover:shadow-lg group-hover:shadow-sky-200">
              <Linkedin className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-stone-500 transition-colors duration-300 group-hover:text-stone-900">LinkedIn</span>
          </a>
        </div>

        {/* Copy Link Input Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Or Copy Link</label>
          <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-200/60 focus-within:border-emerald-900 focus-within:ring-2 focus-within:ring-emerald-900/10 transition-all duration-200">
            <input 
              type="text" 
              readOnly 
              value={url} 
              className="flex-1 min-w-0 bg-transparent text-sm text-stone-600 px-3 outline-none select-all"
            />
            <button 
              onClick={handleCopy}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                copied 
                  ? 'bg-emerald-950 text-emerald-300' 
                  : 'bg-emerald-900 hover:bg-emerald-800 text-white shadow-md shadow-emerald-900/10'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
