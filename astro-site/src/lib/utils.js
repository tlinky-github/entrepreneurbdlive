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
 * so links don't visually include spaces — even when the space is inside
 * nested elements like <u>, <em>, <strong>, etc.
 */
export function sanitizeHtml(html) {
  if (!html || typeof document === 'undefined') return html || '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('a').forEach(link => {
      // Walk into the FIRST text node (could be nested in <u>, <em>, etc.)
      const firstText = getFirstTextNode(link);
      if (firstText && /^[\s\u00a0]/.test(firstText.textContent)) {
        const match = firstText.textContent.match(/^[\s\u00a0]+/);
        if (match) {
          firstText.textContent = firstText.textContent.replace(/^[\s\u00a0]+/, '');
          const space = doc.createTextNode(match[0].replace(/\u00a0/g, ' '));
          link.parentNode.insertBefore(space, link);
        }
      }

      // Walk into the LAST text node
      const lastText = getLastTextNode(link);
      if (lastText && /[\s\u00a0]$/.test(lastText.textContent)) {
        const match = lastText.textContent.match(/[\s\u00a0]+$/);
        if (match) {
          lastText.textContent = lastText.textContent.replace(/[\s\u00a0]+$/, '');
          const space = doc.createTextNode(match[0].replace(/\u00a0/g, ' '));
          if (link.nextSibling) {
            link.parentNode.insertBefore(space, link.nextSibling);
          } else {
            link.parentNode.appendChild(space);
          }
        }
      }
    });

    return doc.body.innerHTML;
  } catch (e) {
    return html;
  }
}

// Helper: get the deepest first text node inside an element
function getFirstTextNode(el) {
  if (el.nodeType === 3) return el; // text node
  for (let i = 0; i < el.childNodes.length; i++) {
    const found = getFirstTextNode(el.childNodes[i]);
    if (found) return found;
  }
  return null;
}

// Helper: get the deepest last text node inside an element
function getLastTextNode(el) {
  if (el.nodeType === 3) return el; // text node
  for (let i = el.childNodes.length - 1; i >= 0; i--) {
    const found = getLastTextNode(el.childNodes[i]);
    if (found) return found;
  }
  return null;
}

