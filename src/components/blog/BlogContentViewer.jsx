'use client';

import React, { useState, useEffect } from 'react';

export default function BlogContentViewer({ post }) {
  const [processedContent, setProcessedContent] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let content = post.content || post.content_html || '';
    if (!content) return;

    // --- 🛡️ THE SMART STYLER ENGINE (Ported from Legacy) ---
    const applySmartDesign = (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // 1. Surgical Style Cleaning
      doc.querySelectorAll('[style]').forEach(el => {
        if (el.closest('.ai-overview-block')) return;
        const junk = ['color', 'background-color', 'font-family', 'font-size', 'line-height'];
        junk.forEach(prop => { el.style[prop] = ''; });
        if (!el.style.length) el.removeAttribute('style');
      });

      // 2. Discover & Upgrade Overview Blocks
      const scanners = ['key takeaways', 'quick overview', 'quick answer', 'key highlights', 'takeaways'];
      const processedNodes = new Set();
      
      const allPossible = Array.from(doc.body.querySelectorAll('*')).filter(el => {
        const text = el.innerText.trim().toLowerCase().replace(/[\s\u00A0\u2726]+/g, ' ');
        return scanners.some(s => text.startsWith(s)) && text.length < 80;
      });

      allPossible.forEach(el => {
        if (processedNodes.has(el)) return;
        if (el.closest('.ai-overview-block, .ai-summary-block')) return;
        if (allPossible.some(other => other !== el && other.contains(el))) return;

        const sectionData = { headerHtml: el.innerHTML.replace(/[:.]+$/, '').trim(), bodyHtml: '' };
        const nodesToRemove = [el];
        
        let next = el.nextElementSibling;
        let attempts = 0;
        while (next && attempts < 15) {
          const tag = next.tagName;
          if (tag === 'UL' || tag === 'OL') {
            sectionData.bodyHtml = next.outerHTML; 
            nodesToRemove.push(next);
            break;
          }
          if ((tag === 'P' || tag === 'DIV') && next.innerText.trim().length > 5) {
            sectionData.bodyHtml = `<div class="quick-answer">${next.innerHTML}</div>`;
            nodesToRemove.push(next);
            break;
          }
          next = next.nextElementSibling;
          attempts++;
        }

        if (sectionData.bodyHtml) {
          const box = document.createElement('div');
          box.className = 'ai-overview-block';
          box.innerHTML = `<h2>${sectionData.headerHtml}</h2>${sectionData.bodyHtml}`;
          el.parentNode.insertBefore(box, el);
          nodesToRemove.forEach(node => {
            processedNodes.add(node);
            try { node.remove(); } catch(e) {}
          });
        }
      });
      
      return doc.body.innerHTML;
    };

    let styledHtml = applySmartDesign(content);

    // 3. Clean up AI Junk
    styledHtml = styledHtml
      .replace(/<p[^>]*>(?:<[^>]+>)*\s*SEO Title:[\s\S]*?<\/p>/gi, '')
      .replace(/<p[^>]*>(?:<[^>]+>)*\s*Meta Description:[\s\S]*?<\/p>/gi, '');

    // 4. Surgical Image Injection
    if (post.featured_image) {
      const h2TagRegex = /<h2/gi;
      const matches = [...styledHtml.matchAll(h2TagRegex)];
      
      if (matches.length > 0) {
        const injectionPoint = matches.length >= 2 ? matches[1].index : matches[0].index;
        const imageHtml = `
          <div class="featured-image-inline mt-10 mb-12 rounded-[2rem] overflow-hidden shadow-2xl border border-stone-100 ring-1 ring-stone-900/5 group">
            <img src="${post.featured_image}" alt="${post.title}" class="w-full h-auto transform transition-transform duration-700 group-hover:scale-105" />
          </div>
        `;
        styledHtml = styledHtml.slice(0, injectionPoint) + imageHtml + styledHtml.slice(injectionPoint);
      } else {
        const imageHtml = `<div class="featured-image-inline mb-12 rounded-[2rem] overflow-hidden shadow-xl border border-stone-100"><img src="${post.featured_image}" alt="${post.title}" class="w-full h-auto" /></div>`;
        styledHtml = imageHtml + styledHtml;
      }
    }

    // 5. Porting FAQ sections
    const parts = styledHtml.split(/(<faq-section[^>]*>.*?<\/faq-section>|<faq-section[^>]*\/>)/gi);
    const finalElements = parts.map((part, index) => {
        if (!part) return null;
        const trimmedPart = part.trim();
        if (trimmedPart.toLowerCase().startsWith('<faq-section')) {
            try {
                const match = trimmedPart.match(/data-faqs=(?:'([^']*)'|"([^"]*)")/i);
                const faqsJson = match ? (match[1] || match[2]) : null;
                if (faqsJson) {
                    const faqs = JSON.parse(faqsJson.replace(/&apos;/g, "'").replace(/&quot;/g, '"'));
                    return (
                        <div key={`faq-${index}`} className="mt-12 mb-8 bg-emerald-50/50 p-8 lg:p-12 rounded-[2.5rem] border border-emerald-100/50">
                            <h2 className="text-3xl font-bold text-stone-900 mb-8 tracking-tight">Frequently Asked Questions</h2>
                            <div className="space-y-8">
                                {faqs.map((faq, fIndex) => (
                                    <div key={fIndex} className="animate-fade-in">
                                        <p className="font-bold text-stone-900 text-lg mb-2">Q: {faq.question || faq.q}</p>
                                        <p className="text-stone-600 leading-relaxed pl-6 border-l-2 border-emerald-200">{faq.answer || faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
            } catch (e) {
                console.error('FAQ Ingestion Error:', e);
            }
            return null;
        }
        return <div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: part }} />;
    });

    setProcessedContent(finalElements);
  }, [post]);

  return (
    <div className="tiptap-content prose prose-stone max-w-none">
      {processedContent}
    </div>
  );
}
