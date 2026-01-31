import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { faqs } from '../data/mock';

const FAQsPage = () => {
  return (
    <>
      <SEO
        pageKey="faqs"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Resources', path: '/resources' },
          { name: 'FAQs', path: '/resources/faqs' }
        ]}
      />
      {/* Hero Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <HelpCircle className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Common Questions</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
              Answers to common questions about entrepreneurship, business fundamentals,
              and the challenges of starting and growing a business.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-12">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-2xl font-bold text-stone-900 mb-6 pb-3 border-b border-stone-200">
                  {category.category}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, faqIndex) => (
                    <AccordionItem
                      key={faqIndex}
                      value={`${categoryIndex}-${faqIndex}`}
                      className="border-b border-stone-200"
                    >
                      <AccordionTrigger className="text-left text-stone-900 hover:text-emerald-900 hover:no-underline py-4 text-base font-medium">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-stone-600 pb-4 leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Questions CTA */}
      <section className="py-20 lg:py-24 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
              Have More Questions?
            </h2>
            <p className="text-stone-600 mb-8">
              If you didn't find the answer you're looking for, feel free to reach out
              or explore our knowledge hub for more in-depth information.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact">
                <Button className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[160px]">
                  Contact Us
                </Button>
              </Link>
              <Link to="/knowledge">
                <Button
                  variant="outline"
                  className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 min-w-[160px]"
                >
                  Explore Knowledge Hub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQsPage;
