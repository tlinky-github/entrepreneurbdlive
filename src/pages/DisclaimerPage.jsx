import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const DisclaimerPage = () => {
  return (
    <>
      <SEO
        pageKey="disclaimer"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Disclaimer', path: '/disclaimer' }
        ]}
      />
      {/* Hero Section */}
      <section className="py-20 lg:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <AlertCircle className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Legal</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Disclaimer
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
            <h2 className="text-stone-900">General Disclaimer</h2>
            <p className="text-stone-600">
              The information provided on entrepreneurs.bd is for general educational and informational
              purposes only. It is not intended to be and should not be considered as professional
              business, financial, legal, or investment advice.
            </p>

            <h2 className="text-stone-900">No Guarantees</h2>
            <p className="text-stone-600">
              We make no representations or warranties of any kind, express or implied, about the
              completeness, accuracy, reliability, suitability, or availability of the information,
              products, services, or related content contained on this website. Any reliance you
              place on such information is strictly at your own risk.
            </p>

            <h2 className="text-stone-900">Individual Circumstances Vary</h2>
            <p className="text-stone-600">
              Entrepreneurship outcomes depend heavily on individual circumstances, including but not
              limited to:
            </p>
            <ul className="text-stone-600">
              <li>Personal skills, experience, and resources</li>
              <li>Market conditions and timing</li>
              <li>Geographic and regulatory environment</li>
              <li>Access to capital and networks</li>
              <li>Execution quality and persistence</li>
            </ul>
            <p className="text-stone-600">
              Content on this website describes general principles and considerations that may not
              apply to your specific situation.
            </p>

            <h2 className="text-stone-900">No Professional Relationship</h2>
            <p className="text-stone-600">
              Use of this website does not create any professional relationship between you and
              entrepreneurs.bd or its founder. For specific business, legal, financial, or tax
              advice, please consult qualified professionals who can assess your individual circumstances.
            </p>

            <h2 className="text-stone-900">External Links</h2>
            <p className="text-stone-600">
              This website may contain links to external websites. These links are provided for
              convenience and informational purposes only. We do not endorse or assume responsibility
              for the content, policies, or practices of any third-party websites.
            </p>

            <h2 className="text-stone-900">No Success Guarantees</h2>
            <p className="text-stone-600">
              Nothing on this website should be interpreted as a promise or guarantee of business
              success. Starting and running a business involves substantial risk, and many businesses
              do not achieve their founders' goals. Past results described in any content are not
              indicative of future outcomes.
            </p>

            <h2 className="text-stone-900">Content Accuracy</h2>
            <p className="text-stone-600">
              While we strive to keep information current and accurate, the business environment
              changes constantly. Some information may become outdated. We encourage readers to
              verify important information through authoritative sources and professional advisors.
            </p>

            <h2 className="text-stone-900">Limitation of Liability</h2>
            <p className="text-stone-600">
              In no event shall entrepreneurs.bd, its founder, or any contributors be liable for
              any direct, indirect, incidental, special, consequential, or punitive damages arising
              out of or related to your use of or inability to use this website or its content.
            </p>

            <h2 className="text-stone-900">Changes to This Disclaimer</h2>
            <p className="text-stone-600">
              We reserve the right to modify this disclaimer at any time. Changes will be posted
              on this page with an updated revision date.
            </p>

            <h2 className="text-stone-900">Contact</h2>
            <p className="text-stone-600">
              If you have questions about this disclaimer, please contact us through our
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

export default DisclaimerPage;
