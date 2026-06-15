import React, { useState, useEffect } from 'react';
import { MessageCircle, BookOpen, ArrowRight, ChevronDown, ChevronUp, HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
// Accordion removed per user request
import { faqs as mockFaqs } from '../../data/mock';
import { faqCategoriesAPI } from '../../lib/api';

const FAQsPage = () => {
  const [firestoreFaqs, setFirestoreFaqs] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await faqCategoriesAPI.list();
        const published = (res.data || []).filter(f => f.status === 'published');
        // Map Firestore format to mock format
        setFirestoreFaqs(published.map(f => ({
          category: f.name,
          icon: f.icon || '❓',
          questions: f.questions || []
        })));
      } catch (err) {
        console.error('Failed to load FAQs from Firestore:', err);
      }
    };
    load();
  }, []);

  const allFaqs = [...firestoreFaqs, ...mockFaqs];

  return (
    <>
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
            {allFaqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-2xl font-bold text-stone-900 mb-6 pb-3 border-b border-stone-200">
                  {category.category || category.name || 'FAQ Category'}
                </h2>
                <div className="w-full space-y-8">
                  {(Array.isArray(category.questions) ? category.questions : []).map((faq, faqIndex) => (
                    <div
                      key={faqIndex}
                      className="border-b border-stone-200 pb-8 last:border-0 last:pb-0"
                    >
                      <h3 className="text-xl font-bold text-stone-900 mb-3 leading-tight">
                        {faq.q || 'Question unavailable'}
                      </h3>
                      <div className="text-stone-700 leading-relaxed prose prose-stone max-w-none prose-p:my-2 prose-a:text-emerald-600 prose-a:font-semibold hover:prose-a:text-emerald-700">
                        {faq.a || 'Answer unavailable.'}
                      </div>
                    </div>
                  ))}
                </div>
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
              <a href="/knowledge">
                <Button className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[160px]">
                  Knowledge Hub
                </Button>
              </a>
              <a href="/resources/guides">
                <Button
                  variant="outline"
                  className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 min-w-[160px]"
                >
                  Practical Guides
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQsPage;
