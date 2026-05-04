import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function ensureAbsoluteUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }
  return `https://${url}`;
}

/**
 * Sanitize HTML content for clean rendering.
 * Moves leading/trailing whitespace outside of <a> tags so links don't
 * visually include spaces (e.g. " word " → " <a>word</a> ").
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  return html
    .replace(/<a\b([^>]*)>(\s+)/g, '$2<a$1>')     // leading space → before tag
    .replace(/(\s+)<\/a>/g, '</a>$1');               // trailing space → after tag
}
