// CustomCodeInjector.jsx
// Injects custom CSS/JS/HTML from 3 levels: Global, Page-targeted snippets, Per-post
import { useEffect, useRef, useState } from 'react';
import { settingsAPI, codeSnippetsAPI } from '../../lib/api';

const matchTarget = (target, pathname) => {
  if (!target || target === '*') return true;
  
  // Multiple patterns: "/about, /contact"
  const patterns = target.split(',').map(p => p.trim());
  
  return patterns.some(pattern => {
    if (pattern === pathname) return true; // Exact match
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2);
      return pathname === base || pathname.startsWith(base + '/');
    }
    return false;
  });
};

const CustomCodeInjector = ({ pageCss, pageJs, pageHeadHtml } = {}) => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const [globalSettings, setGlobalSettings] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const injectedRef = useRef({ styles: [], scripts: [], htmlNodes: [] });

  // Load global settings once
  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsAPI.get();
        setGlobalSettings(res.data || {});
      } catch (err) {
        console.warn('CustomCodeInjector: Failed to load global settings', err);
      }
    };
    load();
  }, []);

  // Load snippets once
  useEffect(() => {
    const load = async () => {
      try {
        const res = await codeSnippetsAPI.list();
        setSnippets(res.data || []);
      } catch (err) {
        console.warn('CustomCodeInjector: Failed to load code snippets', err);
      }
    };
    load();
  }, []);

  // Cleanup function
  const cleanup = () => {
    const { styles, scripts, htmlNodes } = injectedRef.current;
    styles.forEach(el => el.parentNode?.removeChild(el));
    scripts.forEach(el => el.parentNode?.removeChild(el));
    htmlNodes.forEach(el => el.parentNode?.removeChild(el));
    injectedRef.current = { styles: [], scripts: [], htmlNodes: [] };
  };

  // Inject code when settings, snippets, location, or per-page code changes
  useEffect(() => {
    cleanup();
    const newStyles = [];
    const newScripts = [];
    const newHtmlNodes = [];

    const injectCSS = (css, id) => {
      if (!css?.trim()) return;
      const style = document.createElement('style');
      style.setAttribute('data-injector', id);
      style.textContent = css;
      document.head.appendChild(style);
      newStyles.push(style);
    };

    const injectJS = (js, id) => {
      if (!js?.trim()) return;
      const script = document.createElement('script');
      script.setAttribute('data-injector', id);
      script.textContent = js;
      document.body.appendChild(script);
      newScripts.push(script);
    };

    const injectHeadHTML = (html, id) => {
      if (!html?.trim()) return;
      const container = document.createElement('div');
      container.setAttribute('data-injector', id);
      container.innerHTML = html;
      // Move children to head
      while (container.firstChild) {
        const node = container.firstChild;
        document.head.appendChild(node);
        newHtmlNodes.push(node);
      }
    };

    // 1. Global code from settings
    if (globalSettings) {
      injectCSS(globalSettings.custom_css, 'global-css');
      injectJS(globalSettings.custom_body_js, 'global-js');
      injectHeadHTML(globalSettings.custom_head_html, 'global-head');
    }

    // 2. Page-targeted snippets matching current URL
    const matchingSnippets = snippets.filter(
      s => s.enabled !== false && matchTarget(s.target, pathname)
    );
    matchingSnippets.forEach((snippet, i) => {
      injectCSS(snippet.css, `snippet-css-${i}`);
      injectJS(snippet.js, `snippet-js-${i}`);
      injectHeadHTML(snippet.html, `snippet-html-${i}`);
    });

    // 3. Per-post/per-page code from props
    injectCSS(pageCss, 'page-css');
    injectJS(pageJs, 'page-js');
    injectHeadHTML(pageHeadHtml, 'page-head');

    injectedRef.current = { styles: newStyles, scripts: newScripts, htmlNodes: newHtmlNodes };

    return cleanup;
  }, [globalSettings, snippets, pathname, pageCss, pageJs, pageHeadHtml]);

  return null; // This component doesn't render anything
};

export default CustomCodeInjector;
