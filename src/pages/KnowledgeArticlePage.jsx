import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { pillarPages, pillarPagesPart2 } from '../data/mock';
import { contentAPI } from '../lib/api';
import { sanitizeHtml } from '../lib/utils';
import CustomCodeInjector from '../components/common/CustomCodeInjector';

const KnowledgeArticlePage = () => {
  const { slug } = useParams();
  const [firestoreArticle, setFirestoreArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const allPillarPages = [...pillarPages, ...pillarPagesPart2];
  const pillarArticle = allPillarPages.find(p => p.id === slug);

  useEffect(() => {
    const loadFromFirestore = async () => {
      try {
        const res = await contentAPI.list('knowledge');
        const match = (res.data || []).find(a => a.slug === slug);
        if (match) setFirestoreArticle(match);
      } catch (err) {
        console.error('Firestore lookup failed:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFromFirestore();
  }, [slug]);

  const article = firestoreArticle || pillarArticle;
  const isFirestore = !!firestoreArticle;
  const articleContent = article?.content || {};
  const articleSections = !isFirestore && Array.isArray(articleContent.sections) ? articleContent.sections : [];
  const articleFaqs = !isFirestore && Array.isArray(articleContent.faqs) ? articleContent.faqs : [];

  const currentIndex = allPillarPages.findIndex(p => p.id === slug);
  const prevArticle = currentIndex > 0 ? allPillarPages[currentIndex - 1] : null;
  const nextArticle = currentIndex < allPillarPages.length - 1 ? allPillarPages[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-stone-500 mt-4">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Article Not Found</h1>
          <p className="text-stone-500 mb-8">The requested article could not be found.</p>
          <Button asChild>
            <Link to="/knowledge">Back to Knowledge Hub</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      {isFirestore && (
        <CustomCodeInjector
          pageCss={article.custom_css}
          pageJs={article.custom_js}
          pageHeadHtml={article.custom_head_html}
        />
      )}
      <SEO
        title={article.title}
        description={isFirestore ? (article.seo_description || article.excerpt) : article.description}
        image={article.featured_image}
        ogImage={article.og_image}
        type="article"
        keywords={[article.title, article.subtitle, 'Entrepreneurship Knowledge', 'Business Guide'].filter(Boolean)}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Knowledge Hub', path: '/knowledge' },
          { name: article.title, path: `/knowledge/${article.id}` }
        ]}
      />
      {/* Breadcrumb */}
      <div className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-stone-500 hover:text-emerald-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-stone-400" />
            <Link to="/knowledge" className="text-stone-500 hover:text-emerald-900 transition-colors">
              Knowledge Hub
            </Link>
            <ChevronRight className="w-4 h-4 text-stone-400" />
            <span className="text-emerald-900 font-medium truncate max-w-[200px] sm:max-w-none">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <section className="py-12 lg:py-16 bg-stone-50" data-content-id={article.id} data-content-type="knowledge">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Knowledge Article</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-6">
              {article.title}
            </h1>
            <p className="text-xl text-emerald-800 font-medium mb-4">
              {article.subtitle}
            </p>
            <p className="text-lg text-stone-600 leading-relaxed">
              {article.description}
            </p>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 lg:py-16">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Table of Contents - Sidebar */}
            {/* Table of Contents - Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="font-semibold text-stone-900 mb-4 text-sm uppercase tracking-wide">
                  In This Article
                </h3>
                <nav className="space-y-2">
                  <a
                    href="#introduction"
                    className="block text-sm text-stone-600 hover:text-emerald-900 py-1 border-l-2 border-transparent hover:border-emerald-500 pl-3 transition-colors"
                  >
                    Introduction
                  </a>
                  {articleSections.map((section, index) => (
                    <a
                      key={index}
                      href={`#section-${index}`}
                      className="block text-sm text-stone-600 hover:text-emerald-900 py-1 border-l-2 border-transparent hover:border-emerald-500 pl-3 transition-colors"
                    >
                      {section.heading}
                    </a>
                  ))}
                  <a
                    href="#faqs"
                    className="block text-sm text-stone-600 hover:text-emerald-900 py-1 border-l-2 border-transparent hover:border-emerald-500 pl-3 transition-colors"
                  >
                    FAQs
                  </a>
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <article className="lg:col-span-3">
              <div className="prose-entrepreneurship max-w-none">
                {isFirestore ? (
                  /* Firestore rich HTML content */
                  (() => {
                    const content = article.content || '';
                      const applySmartDesign = (html) => {
                        if (!html) return '';
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        
                        const scanners = ['key takeaways', 'quick overview', 'quick answer', 'key highlights', 'takeaways'];
                        const processedNodes = new Set();
                        
                        const allPossible = Array.from(doc.body.querySelectorAll('*')).filter(el => {
                          const text = el.innerText.trim().toLowerCase().replace(/[\s\u00A0\u2726]+/g, ' ');
                          return scanners.some(s => text.startsWith(s)) && text.length < 80;
                        });

                        allPossible.forEach(el => {
                          if (processedNodes.has(el)) return;
                          
                          // --- BROAD DOUBLE-WRAP PREVENTION ---
                          // If already inside ANY AI-styled block, do not wrap it again.
                          if (el.closest('.ai-overview-block, .ai-summary-block, [class*="ai-overview"], [class*="ai-summary"]')) return;
                          
                          // If this match is inside another match, skip it
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
                            if ((tag === 'P' || tag === 'DIV' || tag === 'SECTION') && next.innerText.trim().length > 5) {
                              const nt = next.innerText.trim().toLowerCase();
                              if (scanners.some(s => nt.startsWith(s))) break;
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

                        // 3. Fix links with leading/trailing spaces in their text (Premium Content Repair)
                        doc.querySelectorAll('a').forEach(link => {
                          const h = link.innerHTML;
                          const t = h.trim();
                          if (h !== t) {
                            const leadMatch = h.match(/^\s+/);
                            const trailMatch = h.match(/\s+$/);
                            
                            if (leadMatch) {
                              const leadNode = doc.createTextNode(leadMatch[0]);
                              link.parentNode.insertBefore(leadNode, link);
                            }
                            
                            link.innerHTML = t;
                            
                            if (trailMatch) {
                              const trailNode = doc.createTextNode(trailMatch[0]);
                              if (link.nextSibling) {
                                link.parentNode.insertBefore(trailNode, link.nextSibling);
                              } else {
                                link.parentNode.appendChild(trailNode);
                              }
                            }
                          }
                        });
                        
                        // 4. Fix tables for responsiveness (Wrap in scrollable container)
                        doc.querySelectorAll('table').forEach(table => {
                          if (table.parentNode && table.parentNode.className !== 'table-wrapper') {
                            const wrapper = doc.createElement('div');
                            wrapper.className = 'table-wrapper';
                            table.parentNode.insertBefore(wrapper, table);
                            wrapper.appendChild(table);
                          }
                        });

                        return doc.body.innerHTML;
                      };

                    return (
                      <div 
                        className="prose prose-stone max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(applySmartDesign(content)) }}
                      />
                    );
                  })()
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
                      <Accordion type="single" collapsible className="w-full">
                        {articleFaqs.map((faq, index) => (
                          <AccordionItem key={index} value={`faq-${index}`} className="border-b border-stone-200">
                             <AccordionTrigger className="text-left text-stone-900 hover:text-emerald-900 hover:no-underline py-4 font-medium">
                               {(faq.q || faq.question || '')
                                 .replace(/&amp;lt;/g, '<').replace(/&lt;/g, '<')
                                 .replace(/&amp;gt;/g, '>').replace(/&gt;/g, '>')
                                 .replace(/&amp;quot;/g, '"').replace(/&quot;/g, '"')
                                 .replace(/&amp;apos;/g, "'").replace(/&apos;/g, "'")
                                 .replace(/&#39;/g, "'")
                                 .replace(/&amp;amp;/g, '&').replace(/&amp;/g, '&')}
                             </AccordionTrigger>
                             <AccordionContent className="text-stone-600 pb-4 leading-relaxed">
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
                             </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
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
              <Link
                to={`/knowledge/${prevArticle.id}`}
                className="flex-1 p-6 rounded-xl border border-stone-200 bg-white hover:border-emerald-500 transition-all hover:shadow-md group"
              >
                <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                  <ArrowLeft className="w-4 h-4" />
                  Previous Article
                </div>
                <p className="font-semibold text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-2">
                  {prevArticle.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1"></div>
            )}

            {nextArticle ? (
              <Link
                to={`/knowledge/${nextArticle.id}`}
                className="flex-1 p-6 rounded-xl border border-stone-200 bg-white hover:border-emerald-500 transition-all hover:shadow-md group text-right"
              >
                <div className="flex items-center justify-end gap-2 text-sm text-stone-500 mb-2">
                  Next Article
                  <ArrowRight className="w-4 h-4" />
                </div>
                <p className="font-semibold text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-2">
                  {nextArticle.title}
                </p>
              </Link>
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
              <Link to="/knowledge">
                <Button className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[160px]">
                  Browse All Topics
                </Button>
              </Link>
              <Link to="/resources/guides">
                <Button
                  variant="outline"
                  className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 min-w-[160px]"
                >
                  View Practical Guides
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default KnowledgeArticlePage;
