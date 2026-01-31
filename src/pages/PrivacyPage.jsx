import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const PrivacyPage = () => {
  return (
    <>
      <SEO
        pageKey="privacy"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/privacy' }
        ]}
      />
      {/* Hero Section */}
      <section className="py-20 lg:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <Shield className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Legal</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-stone-500">
              Last updated: August 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose prose-stone lg:prose-lg max-w-none">
            <h2 className="text-stone-900">Introduction</h2>
            <p className="text-stone-600">
              entrepreneurs.bd ("we," "our," or "the platform") is committed to protecting your privacy.
              This Privacy Policy explains how we handle information when you visit our website.
            </p>

            <h2 className="text-stone-900">Information We Collect</h2>
            <p className="text-stone-600">
              As a static informational website, entrepreneurs.bd collects minimal information:
            </p>
            <ul className="text-stone-600">
              <li>
                <strong className="text-stone-900">Contact Form Submissions:</strong> If you use our contact form, we collect the
                information you voluntarily provide, including your name, email address, and message content.
              </li>
              <li>
                <strong className="text-stone-900">Analytics Data:</strong> We may use standard analytics tools that collect
                non-personally identifiable information such as browser type, device type, and pages visited
                to help us understand how visitors use our site.
              </li>
            </ul>

            <h2 className="text-stone-900">How We Use Information</h2>
            <p className="text-stone-600">
              Information collected through the contact form is used solely to respond to your inquiries.
              We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>

            <h2 className="text-stone-900">Data Security</h2>
            <p className="text-stone-600">
              We implement reasonable security measures to protect any information you provide. However,
              no internet transmission is completely secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-stone-900">Cookies</h2>
            <p className="text-stone-600">
              Our website may use cookies or similar technologies for basic functionality and analytics.
              You can control cookie settings through your browser preferences.
            </p>

            <h2 className="text-stone-900">Third-Party Links</h2>
            <p className="text-stone-600">
              Our website may contain links to external sites. We are not responsible for the privacy
              practices or content of these external sites. We encourage you to review their privacy
              policies before providing any information.
            </p>

            <h2 className="text-stone-900">Children's Privacy</h2>
            <p className="text-stone-600">
              Our website is not directed at children under 13. We do not knowingly collect personal
              information from children under 13.
            </p>

            <h2 className="text-stone-900">Changes to This Policy</h2>
            <p className="text-stone-600">
              We may update this Privacy Policy from time to time. Any changes will be posted on this
              page with an updated revision date.
            </p>

            <h2 className="text-stone-900">Contact Us</h2>
            <p className="text-stone-600">
              If you have questions about this Privacy Policy, please contact us through our
              <Link to="/contact" className="text-emerald-900 hover:text-emerald-700 font-medium"> contact page</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Back Link */}
      <section className="py-10 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Link to="/">
              <Button variant="outline" className="border-emerald-900 text-emerald-900 hover:bg-emerald-50">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default PrivacyPage;
