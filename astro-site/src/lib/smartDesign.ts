import * as cheerio from 'cheerio';

export function processHtmlContent(html: string | null | undefined, featuredImage?: string | null, title?: string | null): string {
  if (!html) return '';
  const $ = cheerio.load(html, null, false); // false = don't wrap in html/body

  // 1. Surgical Style Cleaning
  $('[style]').each((_, el) => {
    const $el = $(el);
    if ($el.closest('.ai-overview-block').length > 0) return;
    
    const text = $el.text();
    if (text.length > 300) {
      $el.css('font-weight', 'normal');
    }
    
    // Remove Google Docs junk
    $el.css('color', '');
    $el.css('background-color', '');
    $el.css('font-family', '');
    $el.css('font-size', '');
    $el.css('line-height', '');
    
    const styleAttr = $el.attr('style');
    if (!styleAttr || styleAttr.trim() === '') {
      $el.removeAttr('style');
    }
  });

  // 2. Discover Overview Blocks
  const scanners = ['key takeaways', 'quick overview', 'quick answer', 'key highlights', 'takeaways'];
  const allPossible = $('*').filter((_, el) => {
    const text = $(el).text().trim().toLowerCase().replace(/[\s\u00A0\u2726]+/g, ' ');
    return scanners.some(s => text.startsWith(s)) && text.length < 80;
  }).toArray();

  const processedNodes = new Set();

  allPossible.forEach(el => {
    if (processedNodes.has(el)) return;
    
    const $el = $(el);
    if ($el.closest('.ai-overview-block, .ai-summary-block, [class*="ai-overview"], [class*="ai-summary"]').length > 0) return;
    
    // Skip if inside another match
    let isInsideOther = false;
    allPossible.forEach(other => {
      if (other !== el && $.contains(other, el)) isInsideOther = true;
    });
    if (isInsideOther) return;

    const sectionData = { headerHtml: ($el.html() || '').replace(/[:.]+$/, '').trim(), bodyHtml: '' };
    const nodesToRemove = [$el];
    
    let $next = $el.next();
    let attempts = 0;
    
    while ($next.length > 0 && attempts < 15) {
      const tag = $next[0].name.toUpperCase();
      if (tag === 'UL' || tag === 'OL') {
        sectionData.bodyHtml = $.html($next);
        nodesToRemove.push($next);
        break;
      }
      if ((tag === 'P' || tag === 'DIV' || tag === 'SECTION') && $next.text().trim().length > 5) {
        const nt = $next.text().trim().toLowerCase();
        if (scanners.some(s => nt.startsWith(s))) break;
        sectionData.bodyHtml = `<div class="quick-answer">${$.html($next)}</div>`;
        nodesToRemove.push($next);
        break;
      }
      $next = $next.next();
      attempts++;
    }

    if (sectionData.bodyHtml) {
      const box = `<div class="ai-overview-block"><h2>${sectionData.headerHtml}</h2>${sectionData.bodyHtml}</div>`;
      $el.before(box);
      nodesToRemove.forEach($node => {
        processedNodes.add($node[0]);
        $node.remove();
      });
    }
  });

  // 3. Fix links with leading/trailing spaces & handle internal links smartly
  $('a').each((_, link) => {
    const $link = $(link);
    const html = $link.html() || '';
    const trimmed = html.trim();
    if (html !== trimmed) {
      const leadMatch = html.match(/^\s+/);
      const trailMatch = html.match(/\s+$/);
      
      if (leadMatch) $link.before(leadMatch[0]);
      $link.html(trimmed);
      if (trailMatch) $link.after(trailMatch[0]);
    }

    const href = $link.attr('href') || '';
    const isInternal = (
      (href.startsWith('/') && !href.startsWith('//')) ||
      href.startsWith('#') ||
      href.includes('localhost') ||
      href.includes('entrepreneurs.bd') ||
      href.includes('entrepreneurbd.live')
    );
    if (isInternal) {
      const forceNewTab = $link.attr('data-force-new-tab') === 'true';
      if (!forceNewTab) {
        $link.removeAttr('target');
        const rel = $link.attr('rel') || '';
        if (rel === 'noopener noreferrer' || rel === 'noopener' || rel === 'noreferrer') {
          $link.removeAttr('rel');
        }
      }
    }
  });

  // 4. Fix tables
  $('table').each((_, table) => {
    const $table = $(table);
    if ($table.parent().attr('class') !== 'table-wrapper') {
      $table.wrap('<div class="table-wrapper"></div>');
    }
  });

  let content = $.html();

  // Clean up redundant AI strings
  content = content
    .replace(/<p[^>]*>(?:<[^>]+>)*\s*SEO Title:[\s\S]*?<\/p>/gi, '')
    .replace(/<p[^>]*>(?:<[^>]+>)*\s*Meta Description:[\s\S]*?<\/p>/gi, '');

  // Inject featured image after second H2
  if (featuredImage) {
    const h2TagRegex = /<h2/gi;
    const matches = [...content.matchAll(h2TagRegex)];
    
    if (matches.length > 0) {
      const injectionMatch = matches.length >= 2 ? matches[1] : matches[0];
      const injectionPoint = injectionMatch.index;
      
      const finalAlt = (title && title !== 'undefined') ? title : 'Featured Image';
      const imageHtml = `
        <div class="featured-image-inline">
          <img src="${featuredImage}" alt="${finalAlt}" class="w-full h-auto object-cover" />
        </div>
      `;
      content = content.slice(0, injectionPoint) + imageHtml + content.slice(injectionPoint);
    } else {
      const finalAlt = (title && title !== 'undefined') ? title : 'Featured Image';
      const imageHtml = `
        <div class="featured-image-inline">
          <img src="${featuredImage}" alt="${finalAlt}" class="w-full h-auto" />
        </div>
      `;
      content = imageHtml + content;
    }
  }

  // Handle FAQ sections
  const parts = content.split(/(<faq-section[^>]*>.*?<\/faq-section>|<faq-section[^>]*\/>)/gi);
  const finalParts = parts.map((part) => {
    if (!part) return '';
    const trimmedPart = part.trim();
    if (trimmedPart.toLowerCase().startsWith('<faq-section')) {
      try {
        const match = trimmedPart.match(/data-faqs=(?:'([^']*)'|"([^"]*)")/i);
        const faqsJson = match ? (match[1] || match[2]) : null;
        if (faqsJson) {
          const faqs = JSON.parse(faqsJson.replace(/&apos;/g, "'").replace(/&quot;/g, '"'));
          let faqHtml = `<div class="mt-10 mb-6"><h2 class="text-[1.875rem] font-bold text-stone-900 mb-5">Frequently Asked Questions</h2><div class="faq-list">`;
          
          faqs.forEach((faq: any, fIndex: number) => {
            const rawQuestion = faq.question || faq.q || '';
            const rawAnswer = faq.answer || faq.a || '';
            
            const question = rawQuestion.replace(/&amp;apos;/g, "'").replace(/&apos;/g, "'").replace(/&amp;quot;/g, '"').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            const answer = rawAnswer.replace(/style="[^"]*"/gi, '').replace(/&amp;apos;/g, "'").replace(/&apos;/g, "'").replace(/&amp;quot;/g, '"').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            
            faqHtml += `
              <div class="faq-item mb-8 last:mb-0">
                <h3 class="text-[1.25rem] font-bold text-stone-900 mb-3 leading-tight">
                  ${question}
                </h3>
                <div class="text-stone-700 leading-relaxed prose prose-stone max-w-none prose-p:my-2 prose-a:text-emerald-600 prose-a:font-semibold hover:prose-a:text-emerald-700">
                  ${answer}
                </div>
              </div>
            `;
          });
          faqHtml += `</div></div>`;
          return faqHtml;
        }
      } catch (e) {
        console.error("Error parsing FAQ JSON:", e);
      }
    }
    return part;
  });

  const result = finalParts.join('');
  return result
    .replace(/&amp;apos;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&amp;amp;/g, '&')
    .replace(/&amp;#38;/g, '&')
    .replace(/&amp;#39;/g, "'")
    .replace(/&amp;#039;/g, "'")
    .replace(/&amp;ndash;/g, '–')
    .replace(/&amp;mdash;/g, '—')
    .replace(/&amp;rsquo;/g, '’')
    .replace(/&amp;lsquo;/g, '‘')
    .replace(/&amp;ldquo;/g, '“')
    .replace(/&amp;rdquo;/g, '”')
    .replace(/&apos;/g, "'");
}

export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';
  let decoded = text;
  // Run up to 3 times to resolve double-escaped entities
  for (let i = 0; i < 3; i++) {
    const previous = decoded;
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#039;/g, "'")
      .replace(/&#38;/g, '&')
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      .replace(/&lsquo;/g, '‘')
      .replace(/&rsquo;/g, '’')
      .replace(/&ldquo;/g, '“')
      .replace(/&rdquo;/g, '”')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&#8216;/g, '‘')
      .replace(/&#8217;/g, '’')
      .replace(/&#8220;/g, '“')
      .replace(/&#8221;/g, '”');
    if (decoded === previous) break;
  }
  return decoded;
}
