import React, { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Lightbulb, MapPin, Users, Target, TrendingUp, Brain, DollarSign, AlertTriangle, Rocket, Laptop } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { pillarPages, pillarPagesPart2 } from '../../data/mock';
import { contentAPI } from '../../lib/api';
import { SitePagination } from '../common/SitePagination';

const iconMap = {
  Lightbulb: Lightbulb,
  MapPin: MapPin,
  Users: Users,
  Building: Target,
  Brain: Brain,
  DollarSign: DollarSign,
  TrendingUp: TrendingUp,
  Laptop: Laptop,
  AlertTriangle: AlertTriangle,
  Rocket: Rocket,
};

const KnowledgeHubPage = ({ firestoreArticles = [] }) => {
  const allPillarPages = [...pillarPages, ...pillarPagesPart2];
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get('page')) || 1;
      setCurrentPage(page);
    }
  }, []);

  const totalPages = Math.ceil(firestoreArticles.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedArticles = firestoreArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page);
      window.history.pushState({}, '', url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Entrepreneurs Hub Resources</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Business Knowledge Hub
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed">
              Your complete resource library for building and growing a successful business.
              From startup basics to scaling strategies — everything entrepreneurs need in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Topics Grid */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allPillarPages.map((pillar, index) => {
              const IconComponent = iconMap[pillar.icon] || BookOpen;
              return (
                <Card
                  key={pillar.id}
                  className="group hover:scale-105 transition-transform duration-300 border-stone-200 bg-white h-full shadow-sm hover:shadow-xl flex flex-col justify-between"
                >
                  <CardHeader className="pb-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-900 transition-colors">
                      <IconComponent className="w-7 h-7 text-emerald-900 group-hover:text-white transition-colors" />
                    </div>
                    <CardTitle className="text-xl text-stone-900 group-hover:text-emerald-900 transition-colors">
                      <a href={`/knowledge/${pillar.id}`}>
                        {pillar.title}
                      </a>
                    </CardTitle>
                    <CardDescription className="text-stone-500">
                      {pillar.subtitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 justify-between">
                    <p className="text-sm text-stone-600 mb-6 flex-1">
                      {pillar.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
                      <span className="text-sm text-stone-400">
                        {pillar.content?.sections?.length || 0} sections
                      </span>
                      <a
                        href={`/knowledge/${pillar.id}`}
                        className="inline-flex items-center text-sm font-medium text-emerald-900 hover:text-emerald-700 transition-colors"
                      >
                        Read Article
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Firestore-created articles */}
          {firestoreArticles.length > 0 && (
            <>
              <div className="mt-12 mb-8 text-center">
                <h2 className="text-2xl font-bold text-stone-900">More Articles</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="group hover:scale-105 transition-transform duration-300 border-stone-200 bg-white h-full shadow-sm hover:shadow-xl flex flex-col justify-between"
                  >
                    <CardHeader className="pb-4">
                      {article.featured_image && (
                        <img src={article.featured_image} alt={article.title} className="w-full h-40 object-cover rounded-lg mb-4" />
                      )}
                      <CardTitle className="text-xl text-stone-900 group-hover:text-emerald-900 transition-colors">
                        <a href={`/knowledge/${article.slug}`}>{article.title}</a>
                      </CardTitle>
                      <CardDescription className="text-stone-500">
                        {article.excerpt || article.seo_description || ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 justify-between">
                      <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
                        <span className="text-sm text-stone-400">Article</span>
                        <a
                          href={`/knowledge/${article.slug}`}
                          className="inline-flex items-center text-sm font-medium text-emerald-900 hover:text-emerald-700 transition-colors"
                        >
                          Read Article
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-16 border-t border-stone-200 pt-8">
                  <SitePagination 
                    currentPage={safeCurrentPage} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Learning Path Suggestion */}
      <section className="py-20 bg-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Start Your Entrepreneur Journey
              </h2>
              <p className="text-emerald-100">
                New to entrepreneurship? Follow this recommended path to build your foundation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { num: 1, title: "What is Entrepreneurship", href: "/knowledge/what-is-entrepreneurship" },
                { num: 2, title: "Entrepreneurial Mindset", href: "/knowledge/entrepreneurial-mindset" },
                { num: 3, title: "Business Models", href: "/knowledge/business-models" },
                { num: 4, title: "Challenges & Risks", href: "/knowledge/challenges-risks" },
              ].map((step) => (
                <a
                  key={step.num}
                  href={step.href}
                  className="group p-4 rounded-xl bg-emerald-800/50 border border-emerald-700/50 hover:bg-emerald-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-900 font-bold text-sm">{step.num}</span>
                    </div>
                    <div>
                      <p className="text-emerald-50 font-medium text-sm group-hover:text-white transition-colors">
                        {step.title}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
              Looking for Practical Guidance?
            </h2>
            <p className="text-stone-600 mb-8">
              Explore our practical guides and FAQs for actionable frameworks and answers to common questions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/resources/guides">
                <Button
                  className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[180px]"
                >
                  View Practical Guides
                </Button>
              </a>
              <a href="/resources/faqs">
                <Button
                  variant="outline"
                  className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 min-w-[180px]"
                >
                  Browse FAQs
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default KnowledgeHubPage;
