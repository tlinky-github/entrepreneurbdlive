import React from 'react';
import { Scale, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const TermsPage = () => {
  return (
    <>

      {/* Hero Section */}
      <section className="py-20 lg:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <Scale className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Legal</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Terms of Service
            </h1>
            <p className="text-stone-500">
              Last updated: May 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose prose-stone lg:prose-lg max-w-none">

            <h2 className="text-stone-900">1. Agreement to Terms</h2>
            <p className="text-stone-600">
              By accessing or using the entrepreneurs.bd website ("the Platform"), you agree to be bound by these
              Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use
              the Platform. These Terms constitute a legally binding agreement between you ("User," "you," or "your")
              and entrepreneurs.bd ("we," "us," or "our").
            </p>

            <h2 className="text-stone-900">2. Description of the Platform</h2>
            <p className="text-stone-600">
              entrepreneurs.bd is Bangladesh's leading digital platform dedicated to empowering the entrepreneurial
              ecosystem. The Platform provides:
            </p>
            <ul className="text-stone-600">
              <li>
                <strong className="text-stone-900">Editorial Content:</strong> Original articles, insights,
                and analysis covering the Bangladeshi startup and business landscape, published under our
                {' '}<a href="/editorial" className="text-emerald-900 hover:text-emerald-700 font-medium">Editorial Principles</a>.
              </li>
              <li>
                <strong className="text-stone-900">Entrepreneur Profiles:</strong> Curated profiles of founders,
                business leaders, and innovators across Bangladesh.
              </li>
              <li>
                <strong className="text-stone-900">Business Directory:</strong> A searchable directory of verified
                businesses, startups, and service providers operating in Bangladesh.
              </li>
              <li>
                <strong className="text-stone-900">Knowledge Hub & Resources:</strong> Educational guides,
                glossaries, FAQs, and practical resources for entrepreneurs at every stage.
              </li>
              <li>
                <strong className="text-stone-900">Community Submissions:</strong> A public submission process
                that allows entrepreneurs and businesses to submit their profiles and listings for editorial review.
              </li>
            </ul>

            <h2 className="text-stone-900">3. Eligibility</h2>
            <p className="text-stone-600">
              You must be at least 18 years of age to create an account or submit content to the Platform.
              By using the Platform, you represent and warrant that you meet this age requirement and have
              the legal capacity to enter into these Terms. If you are using the Platform on behalf of an
              organisation, you represent that you have the authority to bind that organisation to these Terms.
            </p>

            <h2 className="text-stone-900">4. User Accounts</h2>
            <p className="text-stone-600">
              Certain features of the Platform may require you to create an account. When you create an account, you agree to:
            </p>
            <ul className="text-stone-600">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain and promptly update your account information to keep it accurate.</li>
              <li>Maintain the security of your password and accept responsibility for all activities that occur under your account.</li>
              <li>Notify us immediately of any unauthorised use of your account.</li>
            </ul>
            <p className="text-stone-600">
              We reserve the right to suspend or terminate accounts that violate these Terms, contain
              inaccurate information, or remain inactive for an extended period.
            </p>

            <h2 className="text-stone-900">5. Content Submissions & Editorial Review</h2>
            <p className="text-stone-600">
              The Platform allows users to submit entrepreneur profiles and business listings for potential
              inclusion. By submitting content, you acknowledge and agree that:
            </p>
            <ul className="text-stone-600">
              <li>
                <strong className="text-stone-900">Editorial Discretion:</strong> All submissions undergo editorial review.
                We reserve the right to accept, reject, edit, or remove any submission at our sole discretion,
                in accordance with our editorial standards and content guidelines.
              </li>
              <li>
                <strong className="text-stone-900">Accuracy:</strong> You are solely responsible for the accuracy,
                completeness, and legality of the content you submit. Submitting false, misleading, or fraudulent
                information is strictly prohibited.
              </li>
              <li>
                <strong className="text-stone-900">Rights:</strong> By submitting content, you grant entrepreneurs.bd
                a non-exclusive, worldwide, royalty-free licence to use, reproduce, modify, publish, and display
                the submitted content on the Platform and associated marketing channels.
              </li>
              <li>
                <strong className="text-stone-900">No Guarantee of Publication:</strong> Submission does not guarantee
                that your content will be published. We do not provide individual feedback on rejected submissions.
              </li>
            </ul>

            <h2 className="text-stone-900">6. Intellectual Property</h2>
            <p className="text-stone-600">
              All content on the Platform—including but not limited to text, articles, graphics, logos, icons,
              images, data compilations, software, and the overall design and layout—is the property of
              entrepreneurs.bd or its content suppliers and is protected by applicable intellectual property laws.
            </p>
            <p className="text-stone-600">
              You may not reproduce, distribute, modify, create derivative works from, publicly display,
              or otherwise exploit any content from the Platform without prior written permission, except for
              personal, non-commercial use such as reading or sharing links. Automated scraping, crawling,
              or data extraction from the Platform without written authorisation is strictly prohibited.
            </p>

            <h2 className="text-stone-900">7. Acceptable Use</h2>
            <p className="text-stone-600">
              When using the Platform, you agree not to:
            </p>
            <ul className="text-stone-600">
              <li>Use the Platform for any unlawful purpose or in violation of any applicable laws or regulations.</li>
              <li>Submit false, misleading, defamatory, or harmful content.</li>
              <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
              <li>Attempt to gain unauthorised access to any part of the Platform, its servers, or any connected systems.</li>
              <li>Interfere with or disrupt the integrity or performance of the Platform.</li>
              <li>Use automated tools, bots, or scripts to access the Platform or collect data without express permission.</li>
              <li>Upload or transmit viruses, malware, or any other harmful code.</li>
              <li>Harvest or collect personal information of other users without their consent.</li>
            </ul>

            <h2 className="text-stone-900">8. Third-Party Links & Services</h2>
            <p className="text-stone-600">
              The Platform may contain links to third-party websites, services, or resources that are not
              owned or controlled by entrepreneurs.bd. We do not endorse and are not responsible for the
              content, privacy policies, or practices of any third-party sites. You access such links
              entirely at your own risk and should review the terms and privacy policies of any third-party
              site you visit.
            </p>

            <h2 className="text-stone-900">9. Disclaimer of Warranties</h2>
            <p className="text-stone-600">
              The Platform and all content are provided on an <strong className="text-stone-900">"as is"</strong> and
              {' '}<strong className="text-stone-900">"as available"</strong> basis, without warranties of any kind,
              either express or implied. To the fullest extent permitted by law, entrepreneurs.bd disclaims
              all warranties, including but not limited to implied warranties of merchantability, fitness
              for a particular purpose, and non-infringement.
            </p>
            <p className="text-stone-600">
              We do not warrant that:
            </p>
            <ul className="text-stone-600">
              <li>The Platform will be uninterrupted, timely, secure, or error-free.</li>
              <li>The information, content, or materials on the Platform are accurate, reliable, or complete.</li>
              <li>Any defects or errors will be corrected.</li>
              <li>The Platform is free of viruses or other harmful components.</li>
            </ul>
            <p className="text-stone-600">
              Any reliance you place on information published on the Platform is strictly at your own risk.
              Please refer to our <a href="/disclaimer" className="text-emerald-900 hover:text-emerald-700 font-medium">Disclaimer</a> for
              further details.
            </p>

            <h2 className="text-stone-900">10. Limitation of Liability</h2>
            <p className="text-stone-600">
              To the maximum extent permitted by applicable law, entrepreneurs.bd, its directors, employees,
              partners, agents, and affiliates shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including but not limited to loss of profits, data, business
              opportunities, or goodwill, arising out of or in connection with your use of, or inability to use,
              the Platform—whether based on warranty, contract, tort, or any other legal theory.
            </p>
            <p className="text-stone-600">
              In no event shall our total aggregate liability exceed the amount you have paid to
              entrepreneurs.bd, if any, in the twelve (12) months preceding the event giving rise to the claim.
            </p>

            <h2 className="text-stone-900">11. Indemnification</h2>
            <p className="text-stone-600">
              You agree to indemnify, defend, and hold harmless entrepreneurs.bd and its officers, directors,
              employees, and agents from and against any claims, liabilities, damages, losses, and expenses
              (including reasonable legal fees) arising out of or in any way connected with your access to or
              use of the Platform, your violation of these Terms, or your infringement of any intellectual
              property or other rights of any third party.
            </p>

            <h2 className="text-stone-900">12. Modifications to the Terms</h2>
            <p className="text-stone-600">
              We reserve the right to modify these Terms at any time. When we make changes, we will update the
              "Last updated" date at the top of this page. Material changes may be communicated via a notice on
              the Platform. Your continued use of the Platform after any modifications constitutes your acceptance
              of the revised Terms. We encourage you to review this page periodically.
            </p>

            <h2 className="text-stone-900">13. Termination</h2>
            <p className="text-stone-600">
              We may terminate or suspend your access to the Platform immediately, without prior notice or
              liability, for any reason, including if you breach these Terms. Upon termination, your right
              to use the Platform will cease immediately. All provisions of these Terms that by their nature
              should survive termination shall survive, including ownership provisions, warranty disclaimers,
              indemnity, and limitations of liability.
            </p>

            <h2 className="text-stone-900">14. Governing Law & Jurisdiction</h2>
            <p className="text-stone-600">
              These Terms shall be governed by and construed in accordance with the laws of the People's Republic
              of Bangladesh, without regard to its conflict of law provisions. Any disputes arising under or in
              connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in
              Dhaka, Bangladesh.
            </p>

            <h2 className="text-stone-900">15. Severability</h2>
            <p className="text-stone-600">
              If any provision of these Terms is found to be unenforceable or invalid by a court of competent
              jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary,
              and the remaining provisions shall remain in full force and effect.
            </p>

            <h2 className="text-stone-900">16. Entire Agreement</h2>
            <p className="text-stone-600">
              These Terms, together with our <a href="/privacy" className="text-emerald-900 hover:text-emerald-700 font-medium">Privacy Policy</a> and
              {' '}<a href="/disclaimer" className="text-emerald-900 hover:text-emerald-700 font-medium">Disclaimer</a>,
              constitute the entire agreement between you and entrepreneurs.bd regarding your use of the Platform,
              superseding any prior agreements or communications.
            </p>

            <h2 className="text-stone-900">17. Contact Us</h2>
            <p className="text-stone-600">
              If you have any questions or concerns about these Terms of Service, please reach out to us through
              our <a href="/contact" className="text-emerald-900 hover:text-emerald-700 font-medium">contact page</a> or
              email us at <a href="mailto:hello@entrepreneurs.bd" className="text-emerald-900 hover:text-emerald-700 font-medium">hello@entrepreneurs.bd</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Back Link */}
      <section className="py-10 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <a href="/">
              <Button variant="outline" className="border-emerald-900 text-emerald-900 hover:bg-emerald-50">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Home
              </Button>
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default TermsPage;
