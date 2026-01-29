import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ArrowRight, BookOpen, Lightbulb, MapPin, Users, Target, TrendingUp, Brain, DollarSign, AlertTriangle, Rocket, Laptop } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { pillarPages, pillarPagesPart2 } from '../data/mock';

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

const KnowledgeHubPage = () => {
  const allPillarPages = [...pillarPages, ...pillarPagesPart2];

  return (
    <>
      <SEO pageKey="knowledge" />
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
                  className="group hover:scale-105 transition-transform duration-300 border-stone-200 bg-white h-full shadow-sm hover:shadow-xl"
                >
                  <CardHeader className="pb-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-900 transition-colors">
                      <IconComponent className="w-7 h-7 text-emerald-900 group-hover:text-white transition-colors" />
                    </div>
                    <CardTitle className="text-xl text-stone-900 group-hover:text-emerald-900 transition-colors">
                      <Link to={`/knowledge/${pillar.id}`}>
                        {pillar.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-stone-500">
                      {pillar.subtitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <p className="text-sm text-stone-600 mb-6 flex-1">
                      {pillar.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                      <span className="text-xs text-stone-400">
                        {pillar.content.sections.length} sections
                      </span>
                      <Link
                        to={`/knowledge/${pillar.id}`}
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
                <Link
                  key={step.num}
                  to={step.href}
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
                </Link>
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
