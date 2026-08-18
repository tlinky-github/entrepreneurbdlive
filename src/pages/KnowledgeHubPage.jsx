import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { contentAPI } from '../lib/api';

const KnowledgeHubPage = () => {
  const [firestoreArticles, setFirestoreArticles] = useState([]);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const res = await contentAPI.list('knowledge');
        const published = (res.data || []).filter(a => a.status === 'published');
        published.sort((a, b) => Number(a.order ?? 9999) - Number(b.order ?? 9999));
        setFirestoreArticles(published);
      } catch (err) {
        console.error('Failed to load knowledge articles:', err);
      }
    };
    loadArticles();
  }, []);

  return (
    <>
      <SEO
        pageKey="knowledge"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Knowledge Hub', path: '/knowledge' }
        ]}
      />
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

      {/* Articles Grid Section */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {firestoreArticles.length > 0 ? (
            <div>
              <div className="mb-8 flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Latest Knowledge Articles</h2>
                  <p className="text-sm text-stone-500 mt-1">Recently published articles and deep dives</p>
                </div>
                <span className="text-sm font-medium text-emerald-900 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {firestoreArticles.length} {firestoreArticles.length === 1 ? 'Article' : 'Articles'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {firestoreArticles.map((article) => {
                  const shortDesc = article.short_description || article.shortDescription || article.description || article.excerpt || article.seo_description || article.subtitle || '';
                  return (
                    <Card
                      key={article.id}
                      className="group hover:scale-105 transition-transform duration-300 border-stone-200 bg-white h-full shadow-sm hover:shadow-xl flex flex-col justify-between"
                    >
                      <CardHeader className="pb-4">
                        {article.featured_image && (
                          <img src={article.featured_image} alt={article.title} className="w-full h-40 object-cover rounded-lg mb-4" />
                        )}
                        <CardTitle className="text-xl text-stone-900 group-hover:text-emerald-900 transition-colors">
                          <Link to={`/knowledge/${article.slug}`}>{article.title}</Link>
                        </CardTitle>
                        {article.subtitle && article.subtitle !== shortDesc && (
                          <CardDescription className="text-stone-500 line-clamp-1 mt-1">
                            {article.subtitle}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1 justify-between">
                        <p className="text-sm text-stone-600 mb-6 flex-1 line-clamp-3 leading-relaxed">
                          {shortDesc}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
                          <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                            Article #{article.order || 1}
                          </span>
                          <Link
                            to={`/knowledge/${article.slug}`}
                            className="inline-flex items-center text-sm font-medium text-emerald-900 hover:text-emerald-700 transition-colors"
                          >
                            Read Article
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
              <BookOpen className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Knowledge Articles Found</h3>
              <p className="text-stone-500 max-w-md mx-auto">
                Articles published from the admin panel will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Learning Path Suggestion (Dynamic from Published Articles) */}
      {firestoreArticles.length > 0 && (
        <section className="py-20 bg-emerald-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Start Your Entrepreneur Journey
                </h2>
                <p className="text-emerald-100">
                  Follow this recommended path to build your foundation
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {firestoreArticles.slice(0, 4).map((step, index) => (
                  <Link
                    key={step.id || step.slug}
                    to={`/knowledge/${step.slug}`}
                    className="group p-4 rounded-xl bg-emerald-800/50 border border-emerald-700/50 hover:bg-emerald-800 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-900 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-emerald-50 font-medium text-sm group-hover:text-white transition-colors line-clamp-2">
                          {step.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

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
              <Link to="/resources/guides">
                <Button
                  className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[180px]"
                >
                  View Practical Guides
                </Button>
              </Link>
              <Link to="/resources/faqs">
                <Button
                  variant="outline"
                  className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 min-w-[180px]"
                >
                  Browse FAQs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default KnowledgeHubPage;
