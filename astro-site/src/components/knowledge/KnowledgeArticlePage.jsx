import React, { useState, useEffect } from 'react';
import { contentAPI, getDocBySlug, incrementViewCountClient } from '../../lib/api';
import { sanitizeHtml } from '../../lib/utils';
import CustomCodeInjector from '../../components/common/CustomCodeInjector';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

// Browser-safe HTML processor (no Node.js / cheerio deps)
function processArticleHtml(html, featuredImage, title) {
  if (!html) return '';
  let content = String(html);

  // Decode double-encoded HTML entities
  content = content
    .replace(/&amp;apos;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&amp;amp;/g, '&')
    .replace(/&amp;#38;/g, '&')
    .replace(/&amp;#39;/g, "'")
    .replace(/&amp;ndash;/g, '\u2013')
    .replace(/&amp;mdash;/g, '\u2014')
    .replace(/&amp;rsquo;/g, '\u2019')
    .replace(/&amp;lsquo;/g, '\u2018')
    .replace(/&amp;ldquo;/g, '\u201C')
    .replace(/&amp;rdquo;/g, '\u201D')
    .replace(/&apos;/g, "'");

  // Remove AI-generated meta noise
  content = content
    .replace(/<p[^>]*>(?:<[^>]+>)*\s*SEO Title:[\s\S]*?<\/p>/gi, '')
    .replace(/<p[^>]*>(?:<[^>]+>)*\s*Meta Description:[\s\S]*?<\/p>/gi, '');

  // Inject featured image after first/second h2
  if (featuredImage) {
    const h2Matches = [...content.matchAll(/<h2/gi)];
    if (h2Matches.length > 0) {
      const injPoint = h2Matches.length >= 2 ? h2Matches[1].index : h2Matches[0].index;
      const finalAlt = title && title !== 'undefined' ? title : 'Featured Image';
      const imgHtml = `<div class="featured-image-inline"><img src="${featuredImage}" alt="${finalAlt}" class="w-full h-auto object-cover" /></div>`;
      content = content.slice(0, injPoint) + imgHtml + content.slice(injPoint);
    }
  }

  // Render <faq-section> custom elements
  content = content.replace(/<faq-section([^>]*)\/?>/gi, (match, attrs) => {
    const faqMatch = attrs.match(/data-faqs=(?:'([^']*)'|"([^"]*)")/i);
    const faqsJson = faqMatch ? (faqMatch[1] || faqMatch[2]) : null;
    if (!faqsJson) return '';
    try {
      const faqs = JSON.parse(faqsJson.replace(/&apos;/g, "'").replace(/&quot;/g, '"'));
      const decodeFaq = (str) => String(str || '')
        .replace(/&amp;lt;/g, '<').replace(/&lt;/g, '<')
        .replace(/&amp;gt;/g, '>').replace(/&gt;/g, '>')
        .replace(/&amp;quot;/g, '"').replace(/&quot;/g, '"')
        .replace(/&amp;apos;/g, "'").replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&amp;amp;/g, '&').replace(/&amp;/g, '&');

      let faqHtml = `<div class="faq-container my-10 bg-stone-50 border border-stone-200 rounded-2xl p-6 md:p-8"><h2 class="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2"><span class="text-emerald-900">❓</span> Frequently Asked Questions</h2><div class="space-y-6">`;
      faqs.forEach(faq => {
        const q = decodeFaq(faq.question || faq.q);
        const a = decodeFaq(faq.answer || faq.a).replace(/style="[^"]*"/gi, '');
        faqHtml += `<div class="faq-item mb-8 last:mb-0"><h3 class="text-[1.25rem] font-bold text-stone-900 mb-3 leading-tight">${q}</h3><div class="text-stone-700 leading-relaxed prose prose-stone max-w-none">${a}</div></div>`;
      });
      faqHtml += `</div></div>`;
      return faqHtml;
    } catch { return ''; }
  });
  content = content.replace(/<\/faq-section>/gi, '');

  return content;
}

const KnowledgeArticlePage = ({ slug, article: initialArticle, isFirestore: initialIsFirestore }) => {
  const [article, setArticle] = useState(initialArticle || null);
  const [isFirestore, setIsFirestore] = useState(!!initialIsFirestore);
  const [loading, setLoading] = useState(!initialArticle);

  useEffect(() => {
    if (article?.id && isFirestore) {
      const col = article.type === 'resource' ? 'resources' : 'knowledge';
      incrementViewCountClient(col, article.id);
    }
  }, [article?.id, isFirestore]);

  // Client-side fetch for draft previews (not in static paths)
  useEffect(() => {
    if (initialArticle) return;
    let cancelled = false;
    const fetchDraft = async () => {
      try {
        let doc = await getDocBySlug('knowledge', slug);
        if (!doc) doc = await getDocBySlug('resources', slug);
        if (!cancelled && doc) {
          setArticle(doc);
          setIsFirestore(true);
        }
      } catch (e) {
        console.error('[KnowledgeArticlePage] client fetch error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDraft();
    return () => { cancelled = true; };
  }, [slug]);

  const effectiveIsFirestore = isFirestore && typeof article?.content === 'string';
  const articleContent = typeof article?.content === 'object' && article?.content !== null ? article.content : {};
  const articleSections = !effectiveIsFirestore && Array.isArray(articleContent.sections) ? articleContent.sections : [];
  const articleFaqs = !effectiveIsFirestore && Array.isArray(articleContent.faqs) ? articleContent.faqs : [];

  const allPillarPagesList = typeof allPillarPages !== 'undefined' && Array.isArray(allPillarPages) ? allPillarPages : [];
  const currentIndex = allPillarPagesList.findIndex(p => p.id === slug || p.slug === slug);
  const prevArticle = currentIndex > 0 ? allPillarPagesList[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < allPillarPagesList.length - 1 ? allPillarPagesList[currentIndex + 1] : null;

  // Extract dynamic Table of Contents (TOC) headings
  const getTocHeadings = () => {
    if (effectiveIsFirestore) {
      const html = article?.content || '';
      if (!html || typeof html !== 'string') return [];
      const headings = [];
      const regex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
      let match;
      let count = 0;
      while ((match = regex.exec(html)) !== null) {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        if (text) {
          count++;
          const id = `heading-${count}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
          headings.push({ id, text });
        }
      }
      return headings;
    } else {
      const list = [];
      if (articleContent.introduction) list.push({ id: 'introduction', text: 'Introduction' });
      articleSections.forEach((sec, idx) => {
        if (sec.heading) list.push({ id: `section-${idx}`, text: sec.heading });
      });
      if (articleFaqs && articleFaqs.length > 0) list.push({ id: 'faqs', text: 'FAQs' });
      return list;
    }
  };

  const tocHeadings = getTocHeadings();

  // Process HTML for Firestore articles to inject matching IDs into headings
  const getProcessedFirestoreHtml = () => {
    if (!isFirestore || !article?.content) return '';
    let html = processArticleHtml(article.content, article.featured_image, article.featured_image_alt || article.title);
    let count = 0;
    html = html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (fullMatch, level, attrs, content) => {
      const text = content.replace(/<[^>]+>/g, '').trim();
      if (!text) return fullMatch;
      count++;
      const id = `heading-${count}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
      return `<h${level} id="${id}" class="scroll-mt-28"${attrs}>${content}</h${level}>`;
    });
    return sanitizeHtml(html);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-900 animate-spin mx-auto mb-4" />
          <p className="text-stone-500 text-sm">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Article Not Found</h1>
          <p className="text-stone-500 mb-8">The requested article could not be found.</p>
          <a href="/knowledge" className="inline-flex items-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 transition-colors">Back to Knowledge Hub</a>
        </div>
      </>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="knowledge-article-page" data-content-id={article.id} data-content-type="knowledge">
      {isFirestore && (
        <CustomCodeInjector
          pageCss={article.custom_css}
          pageJs={article.custom_js}
          pageHeadHtml={article.custom_head_html}
        />
      )}

      {/* Breadcrumb */}
      <div className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <a href="/" className="text-stone-500 hover:text-emerald-900 transition-colors">
              Home
            </a>
            <ChevronRight className="w-4 h-4 text-stone-400" />
            <a href="/knowledge" className="text-stone-500 hover:text-emerald-900 transition-colors">
              Knowledge Hub
            </a>
            <ChevronRight className="w-4 h-4 text-stone-400" />
            <span className="text-emerald-900 font-medium truncate max-w-[200px] sm:max-w-none">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <section className="py-12 lg:py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Knowledge Article</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-6">
              {article.title}
            </h1>
            {(() => {
              const articleDescription = article.short_description || article.shortDescription || article.description || article.excerpt || article.seo_description || '';
              return (
                <>
                  {article.subtitle && (
                    <p className="text-xl text-emerald-800 font-medium mb-4">
                      {article.subtitle}
                    </p>
                  )}
                  {articleDescription && articleDescription !== article.subtitle && (
                    <p className="text-lg text-stone-600 leading-relaxed">
                      {articleDescription}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 lg:py-16">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Table of Contents - Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="font-semibold text-stone-900 mb-4 text-sm uppercase tracking-wide">
                  In This Article
                </h3>
                {tocHeadings.length > 0 ? (
                  <nav className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                    {tocHeadings.map((heading, index) => (
                      <a
                        key={index}
                        href={`#${heading.id}`}
                        className="block text-sm text-stone-600 hover:text-emerald-900 py-1 border-l-2 border-transparent hover:border-emerald-500 pl-3 transition-colors truncate"
                        title={heading.text}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                ) : (
                  <p className="text-xs text-stone-400 italic">No section headings</p>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <article className="lg:col-span-3">
              <div className="prose-entrepreneurship max-w-none">
                {effectiveIsFirestore ? (
                  /* Firestore rich HTML content */
                  <div 
                    className="prose prose-stone max-w-none"
                    dangerouslySetInnerHTML={{ __html: getProcessedFirestoreHtml() }}
                  />
                ) : (
                  /* Legacy pillar page structured content */
                  <>
                    <section id="introduction" className="mb-12 scroll-mt-28">
                      <p className="text-lg text-stone-700 leading-relaxed">
                        {articleContent.introduction || ''}
                      </p>
                    </section>

                    {articleSections.map((section, index) => (
                      <section key={index} id={`section-${index}`} className="mb-12 scroll-mt-28">
                        <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-2 border-b border-stone-200">
                          {section.heading}
                        </h2>
                        <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                          {section.content}
                        </p>
                      </section>
                    ))}

                    <section id="faqs" className="mt-16 bg-stone-50 rounded-2xl p-8 scroll-mt-28">
                      <h2 className="text-2xl font-bold text-stone-900 mb-6">
                        Frequently Asked Questions
                      </h2>
                      <div className="faq-list space-y-8">
                        {articleFaqs.map((faq, index) => (
                          <div key={index} className="faq-item border-b border-stone-200 pb-8 last:border-0 last:pb-0">
                            <h3 className="text-xl font-bold text-stone-900 mb-3 leading-tight">
                              {(() => {
                                const qText = (faq.q || faq.question || '')
                                  .replace(/&amp;lt;/g, '<').replace(/&lt;/g, '<')
                                  .replace(/&amp;gt;/g, '>').replace(/&gt;/g, '>')
                                  .replace(/&amp;quot;/g, '"').replace(/&quot;/g, '"')
                                  .replace(/&amp;apos;/g, "'").replace(/&apos;/g, "'")
                                  .replace(/&#39;/g, "'")
                                  .replace(/&amp;amp;/g, '&').replace(/&amp;/g, '&');
                                return qText;
                              })()}
                            </h3>
                            <div className="text-stone-700 leading-relaxed prose prose-stone max-w-none prose-p:my-2 prose-a:text-emerald-600 prose-a:font-semibold hover:prose-a:text-emerald-700">
                              {(() => {
                                const rawAns = (faq.a || faq.answer || '')
                                  .replace(/&amp;lt;/g, '<').replace(/&lt;/g, '<')
                                  .replace(/&amp;gt;/g, '>').replace(/&gt;/g, '>')
                                  .replace(/&amp;quot;/g, '"').replace(/&quot;/g, '"')
                                  .replace(/&amp;apos;/g, "'").replace(/&apos;/g, "'")
                                  .replace(/&#39;/g, "'")
                                  .replace(/&amp;amp;/g, '&').replace(/&amp;/g, '&')
                                  .replace(/style="[^"]*"/gi, '');
                                const answerHtml = sanitizeHtml(rawAns);
                                return <div dangerouslySetInnerHTML={{ __html: answerHtml }} />;
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-12 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4">
            {prevArticle ? (
              <a
                href={`/knowledge/${prevArticle.id}`}
                className="flex-1 p-6 rounded-xl border border-stone-200 bg-white hover:border-emerald-500 transition-all hover:shadow-md group"
              >
                <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                  <ArrowLeft className="w-4 h-4" />
                  Previous Article
                </div>
                <p className="font-semibold text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-2">
                  {prevArticle.title}
                </p>
              </a>
            ) : (
              <div className="flex-1"></div>
            )}

            {nextArticle ? (
              <a
                href={`/knowledge/${nextArticle.id}`}
                className="flex-1 p-6 rounded-xl border border-stone-200 bg-white hover:border-emerald-500 transition-all hover:shadow-md group text-right"
              >
                <div className="flex items-center justify-end gap-2 text-sm text-stone-500 mb-2">
                  Next Article
                  <ArrowRight className="w-4 h-4" />
                </div>
                <p className="font-semibold text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-2">
                  {nextArticle.title}
                </p>
              </a>
            ) : (
              <div className="flex-1"></div>
            )}
          </div>
        </div>
      </section>

      {/* Related Resources CTA */}
      <section className="py-20 lg:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-stone-900 mb-4">
              Continue Your Learning
            </h2>
            <p className="text-stone-600 mb-8">
              Explore related practical guides and resources to deepen your understanding.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/knowledge">
                <Button className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[160px]">
                  Browse All Topics
                </Button>
              </a>
              <a href="/resources/guides">
                <Button
                  variant="outline"
                  className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 min-w-[160px]"
                >
                  View Practical Guides
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KnowledgeArticlePage;
