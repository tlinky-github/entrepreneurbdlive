import React from 'react';
import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { ArrowRight, Linkedin, Facebook, ExternalLink, BookOpen, Target, Award } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { siteConfig, editorialPrinciples } from '../data/mock';

const AboutPage = () => {
  return (
    <>
      <SEO
        pageKey="about"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'About Us', path: '/about' }
        ]}
      />
      {/* Hero Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              About entrepreneurs.bd
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
              Your trusted entrepreneurs hub — a platform dedicated to helping founders,
              business owners, and aspiring entrepreneurs succeed with practical resources and expert guidance.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Story */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose-entrepreneurship">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Our Purpose</h2>
            <p className="text-stone-600 leading-relaxed mb-6">
              entrepreneurs.bd was created to be the go-to hub for entrepreneurs seeking reliable,
              actionable guidance. We go beyond motivational content to deliver practical resources
              that help you start, grow, and scale your business successfully.
            </p>
            <p className="text-stone-600 leading-relaxed mb-6">
              Whether you're a first-time founder or an experienced business owner, our hub provides
              the tools, strategies, and insights you need. We cover everything from business fundamentals
              to advanced growth tactics, with special focus on the opportunities and challenges in Bangladesh
              and the broader region.
            </p>

            <h2 className="text-2xl font-bold text-stone-900 mb-6 mt-12">What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose mb-8">
              <Card className="border-stone-200">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                    <BookOpen className="w-5 h-5 text-emerald-900" />
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-2">Business Resources</h3>
                  <p className="text-sm text-stone-600">
                    Comprehensive guides covering startup basics, business models, marketing, and operations.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-stone-200">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                    <Target className="w-5 h-5 text-emerald-900" />
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-2">Growth Strategies</h3>
                  <p className="text-sm text-stone-600">
                    Proven tactics and frameworks to help you scale your business effectively.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-stone-200">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                    <Award className="w-5 h-5 text-emerald-900" />
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-2">Expert Insights</h3>
                  <p className="text-sm text-stone-600">
                    Real-world perspectives from experienced entrepreneurs and industry practitioners.
                  </p>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-2xl font-bold text-stone-900 mb-6 mt-12">Our Approach</h2>
            <p className="text-stone-600 leading-relaxed mb-6">
              We prioritize depth over breadth, practical utility over entertainment, and honest
              assessment over promotion. Our content acknowledges uncertainty where it exists and
              avoids making unverifiable claims. We aim to help readers develop their own judgment
              rather than prescribing specific paths.
            </p>
            <p className="text-stone-600 leading-relaxed">
              While we draw on established research and widely-accepted principles, we recognize
              that entrepreneurship outcomes depend heavily on context and execution. We encourage
              readers to adapt concepts to their specific circumstances rather than following
              any approach rigidly.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section id="founder" className="py-24 bg-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-emerald-100 font-medium text-sm mb-2 opacity-80 uppercase tracking-widest">Meet the Founder</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">About the Founder</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
              <div className="md:col-span-1">
                <div className="sticky top-24">
                  <div className="w-full max-w-xs mx-auto">
                    <div className="aspect-square rounded-2xl overflow-hidden border-4 border-emerald-800 shadow-xl mb-6">
                      <img
                        src="/shaddam.webp"
                        alt="Md Shaddam Hossain"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-1">{siteConfig.founder.name}</h3>
                      <p className="text-emerald-100 text-sm mb-4">{siteConfig.founder.title}</p>
                      <div className="flex items-center justify-center gap-3">
                        <a
                          href={siteConfig.founder.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-emerald-800/50 flex items-center justify-center hover:bg-emerald-700 transition-colors text-white border border-emerald-700 hover:border-emerald-600"
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                        <a
                          href={siteConfig.founder.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-emerald-800/50 flex items-center justify-center hover:bg-emerald-700 transition-colors text-white border border-emerald-700 hover:border-emerald-600"
                        >
                          <Facebook className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-emerald-50 space-y-6 text-lg leading-relaxed opacity-90">
                  <p>
                    Md Shaddam Hossain is an entrepreneur, digital marketer, and affiliate marketing
                    specialist with experience spanning the technology and business sectors. His
                    professional journey has included roles in sales and marketing leadership,
                    team coordination, and business development.
                  </p>
                  <p>
                    As a former Team Lead of Sales & Marketing at HasThemes (HasTech IT Ltd.),
                    Shaddam gained hands-on experience in managing teams, developing marketing
                    strategies, and working within technology-driven organizations. This background
                    informs his practical understanding of business operations and entrepreneurial challenges.
                  </p>
                  <p>
                    His experience in digital marketing and affiliate marketing has provided
                    insights into online business models, customer acquisition, and the practical
                    realities of building revenue in digital environments. These experiences
                    contribute to the practical perspective reflected in entrepreneurs.bd content.
                  </p>
                  <p>
                    entrepreneurs.bd represents Shaddam's commitment to sharing entrepreneurship
                    knowledge in an honest, practical manner. The platform reflects his belief
                    that aspiring entrepreneurs benefit more from realistic information than
                    from motivational content that oversimplifies the challenges of building businesses.
                  </p>
                </div>

                <div className="mt-10 pt-10 border-t border-emerald-800/50">
                  <h4 className="text-white font-semibold mb-6 text-lg">Professional Background</h4>
                  <ul className="space-y-4 text-emerald-100">
                    <li className="flex items-start gap-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2.5 flex-shrink-0"></span>
                      <span>Entrepreneur and Digital Business Practitioner</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2.5 flex-shrink-0"></span>
                      <span>Digital Marketing and Affiliate Marketing Specialist</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2.5 flex-shrink-0"></span>
                      <span>Former Team Lead, Sales & Marketing at HasThemes (HasTech IT Ltd.)</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2.5 flex-shrink-0"></span>
                      <span>Experience in team coordination and web development environments</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">Our Values</h2>
              <p className="text-lg text-stone-600">
                The principles that guide our content and platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {editorialPrinciples.principles.map((principle, index) => (
                <Card key={index} className="border-stone-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-900 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-900 mb-2">{principle.title}</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">
                          {principle.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-24 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
              Explore Our Content
            </h2>
            <p className="text-stone-600 mb-8">
              Discover our knowledge hub and practical resources for entrepreneurs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/knowledge">
                <Button className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[180px]">
                  Explore Knowledge Hub
                </Button>
              </Link>
              <Link to="/editorial">
                <Button
                  variant="outline"
                  className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 min-w-[180px]"
                >
                  Editorial Principles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
