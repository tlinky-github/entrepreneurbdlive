import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ArrowRight, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { guides } from '../data/mock';

const GuidesPage = () => {
  return (
    <>
      <SEO pageKey="guides" />
      {/* Hero Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Practical Resources</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Practical Guides
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
              Frameworks and considerations for navigating common entrepreneurial challenges.
              These guides provide structured approaches while acknowledging that outcomes
              depend on individual circumstances.
            </p>
          </div>
        </div>
      </section>

      {/* Guides List */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {guides.map((guide, guideIndex) => (
              <Card key={guide.id} className="border-stone-200 overflow-hidden shadow-md">
                <CardHeader className="bg-stone-50 border-b border-stone-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-900 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-emerald-100" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-stone-900">
                        {guide.title}
                      </CardTitle>
                      <CardDescription className="text-stone-500">
                        {guide.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-8">
                    {guide.content.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <span className="text-emerald-900 font-bold text-sm">
                              {sectionIndex + 1}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-stone-900 mb-2">
                            {section.heading}
                          </h4>
                          <p className="text-stone-600 leading-relaxed">
                            {section.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-stone-500 leading-relaxed">
              <strong className="text-stone-900">Note:</strong> These guides provide general frameworks
              and considerations. Outcomes depend on individual circumstances, market conditions,
              and execution. Adapt these approaches to your specific situation and consider seeking
              professional advice for significant decisions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
              Explore More Resources
            </h2>
            <p className="text-stone-600 mb-8">
              Continue your learning with our knowledge hub and FAQs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/knowledge">
                <Button className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[160px]">
                  Knowledge Hub
                </Button>
              </Link>
              <Link to="/resources/faqs">
                <Button
                  variant="outline"
                  className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 min-w-[160px]"
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

export default GuidesPage;
