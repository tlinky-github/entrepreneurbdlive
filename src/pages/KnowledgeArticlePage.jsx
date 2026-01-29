import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { pillarPages, pillarPagesPart2 } from '../data/mock';

const KnowledgeArticlePage = () => {
  const { slug } = useParams();
  const allPillarPages = [...pillarPages, ...pillarPagesPart2];
  const article = allPillarPages.find(p => p.id === slug);

  const currentIndex = allPillarPages.findIndex(p => p.id === slug);
  const prevArticle = currentIndex > 0 ? allPillarPages[currentIndex - 1] : null;
  const nextArticle = currentIndex < allPillarPages.length - 1 ? allPillarPages[currentIndex + 1] : null;

  if (!article) {
    return (
      <>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-bold text-[hsl(215,55%,22%)] mb-4">Article Not Found</h1>
          <p className="text-[hsl(215,35%,45%)] mb-8">The requested article could not be found.</p>
          <Button asChild>
            <Link to="/knowledge">Back to Knowledge Hub</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={article.title}
        description={article.description}
        type="article"
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
                  {article.content.sections.map((section, index) => (
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
                {/* Introduction */}
                <section id="introduction" className="mb-12 scroll-mt-28">
                  <p className="text-lg text-stone-700 leading-relaxed">
                    {article.content.introduction}
                  </p>
                </section>

                {/* Main Sections */}
                {article.content.sections.map((section, index) => (
                  <section key={index} id={`section-${index}`} className="mb-12 scroll-mt-28">
                    <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-2 border-b border-stone-200">
                      {section.heading}
                    </h2>
                    <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </section>
                ))}

                {/* FAQs Section */}
                <section id="faqs" className="mt-16 bg-stone-50 rounded-2xl p-8 scroll-mt-28">
                  <h2 className="text-2xl font-bold text-stone-900 mb-6 pb-2 border-b border-stone-200">
                    Frequently Asked Questions
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {article.content.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`} className="border-b border-stone-200">
                        <AccordionTrigger className="text-left text-stone-900 hover:text-emerald-900 hover:no-underline py-4 font-medium">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-stone-600 pb-4 leading-relaxed">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
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
