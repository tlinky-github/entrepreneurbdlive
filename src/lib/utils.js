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
 * Moves leading/trailing whitespace (including &nbsp;) outside of <a> tags
 * so links don't visually include spaces.
 */
export function sanitizeHtml(html) {
  if (!html || typeof document === 'undefined') return html || '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('a').forEach(link => {
      // Get raw innerHTML and check for leading/trailing whitespace or &nbsp;
      const inner = link.innerHTML;
      const trimmed = inner.replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, '');
      if (inner === trimmed) return; // nothing to fix

      const leadMatch = inner.match(/^[\s\u00a0]+/);
      const trailMatch = inner.match(/[\s\u00a0]+$/);

      if (leadMatch) {
        // Move leading whitespace before the <a> tag
        const space = doc.createTextNode(leadMatch[0].replace(/\u00a0/g, ' '));
        link.parentNode.insertBefore(space, link);
      }

      link.innerHTML = trimmed;

      if (trailMatch) {
        // Move trailing whitespace after the <a> tag
        const space = doc.createTextNode(trailMatch[0].replace(/\u00a0/g, ' '));
        if (link.nextSibling) {
          link.parentNode.insertBefore(space, link.nextSibling);
        } else {
          link.parentNode.appendChild(space);
        }
      }
    });

    return doc.body.innerHTML;
  } catch (e) {
    // Fallback: regex approach for SSR or parse errors
    return html
      .replace(/<a\b([^>]*)>(&nbsp;|\s)+/g, ' <a$1>')
      .replace(/(&nbsp;|\s)+<\/a>/g, '</a> ');
  }
}
