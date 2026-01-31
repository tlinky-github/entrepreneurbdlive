import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { editorialPrinciples } from '../data/mock';

const EditorialPage = () => {
  return (
    <>
      <SEO
        pageKey="editorial"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Editorial Policy', path: '/editorial' }
        ]}
      />
      {/* Hero Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Content Standards</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Editorial Principles & Content Ethics
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
              Our commitment to providing accurate, practical, and trustworthy entrepreneurship content.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-emerald-900 rounded-3xl p-8 lg:p-12 text-center shadow-lg">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Our Editorial Mission</h2>
              <p className="text-emerald-50 leading-relaxed text-lg lg:text-xl">
                {editorialPrinciples.mission}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-20 lg:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">Core Principles</h2>
              <p className="text-lg text-stone-600">
                The foundational values that guide all our content
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {editorialPrinciples.principles.map((principle, index) => (
                <Card key={index} className="border-stone-200 bg-white hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-900 font-bold">{index + 1}</span>
                      </div>
                      <CardTitle className="text-lg text-stone-900 leading-tight mt-1">
                        {principle.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-stone-600 leading-relaxed pl-14">
                      {principle.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Standards */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">Content Standards</h2>
              <p className="text-lg text-stone-600">
                Specific guidelines we follow in creating content
              </p>
            </div>

            <div className="space-y-4">
              {editorialPrinciples.contentStandards.map((standard, index) => (
                <div key={index} className="flex items-start gap-4 p-6 rounded-xl bg-stone-50 border border-stone-100">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-stone-700">{standard}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What We Avoid */}
      <section className="py-20 lg:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">What We Avoid</h2>
              <p className="text-lg text-stone-600">
                Content approaches we deliberately do not use
              </p>
            </div>

            <div className="space-y-4">
              {[
                "Unverifiable claims about success rates or outcomes",
                "Motivational content that oversimplifies challenges",
                "Fabricated case studies or invented statistics",
                "Promotional content disguised as education",
                "Prescriptive advice that ignores individual context",
                "Sensationalized headlines or clickbait approaches"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-6 rounded-xl bg-white border border-stone-200">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-stone-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* E-E-A-T Commitment */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">Our E-E-A-T Commitment</h2>
              <p className="text-lg text-stone-600 max-w-2xl mx-auto">
                Experience, Expertise, Authoritativeness, and Trustworthiness
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle className="text-lg text-stone-900">
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-600 leading-relaxed">
                    Our content draws on practical experience in entrepreneurship, digital marketing,
                    and business operations. We write from a practitioner's perspective, not purely
                    academic theory.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle className="text-lg text-stone-900">
                    Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-600 leading-relaxed">
                    Content is developed with deep research and understanding of entrepreneurship
                    principles, acknowledging the complexity of business building and avoiding
                    oversimplification.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle className="text-lg text-stone-900">
                    Authoritativeness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-600 leading-relaxed">
                    We build authority through consistent, high-quality content that serves readers'
                    genuine needs. We are transparent about the platform's purpose and the background
                    of its founder.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle className="text-lg text-stone-900">
                    Trustworthiness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-600 leading-relaxed">
                    Trust is earned through honesty, transparency, and accuracy. We acknowledge
                    uncertainty, avoid sensationalism, and prioritize reader benefit over engagement
                    metrics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="py-20 bg-emerald-900 border-t border-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Feedback Welcome
            </h2>
            <p className="text-emerald-100 mb-8">
              If you identify errors, have suggestions for improvement, or would like to
              discuss our editorial approach, we welcome your input.
            </p>
            <Link to="/contact">
              <Button
                variant="outline"
                className="bg-transparent border-emerald-400 text-emerald-100 hover:bg-emerald-800 hover:text-white"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default EditorialPage;
