import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Disclaimer | Entrepreneurs BD',
  description: 'Understand the informational and legal boundaries of entrepreneurs.bd. Our commitment to professional transparency.',
};

export default function DisclaimerPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* 🛡️ Aesthetic Breadcrumb Deck */}
      <div className="bg-stone-50 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <ChevronRight size={12} className="text-stone-300" />
            <span className="text-emerald-900 font-black">Disclaimer</span>
          </nav>
        </div>
      </div>

      {/* 🛡️ Narrative Header */}
      <section className="py-20 lg:py-32 bg-stone-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <AlertCircle size={400} className="text-emerald-900" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border border-stone-200 mb-8 shadow-sm">
            <AlertCircle className="w-4 h-4 text-emerald-900" />
            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Legal Boundaries</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-stone-900 mb-8 tracking-tighter">
            Disclaimer
          </h1>
          <p className="text-xl text-stone-500 font-medium">
            Last updated: <span className="text-emerald-900">August 2025</span>
          </p>
        </div>
      </section>

      {/* 🛡️ Narrative Content */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose prose-stone lg:prose-xl">
            <h2 className="text-stone-900 font-black tracking-tight">General Disclaimer</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              The information provided on entrepreneurs.bd is for general educational and informational
              purposes only. It is not intended to be and should not be considered as professional
              business, financial, legal, or investment advice.
            </p>

            <h2 className="text-stone-900 font-black tracking-tight">No Warranties</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              We make no representations or warranties of any kind, express or implied, about the
              completeness, accuracy, reliability, suitability, or availability of the information,
              products, services, or related content contained on this website. Any reliance you
              place on such information is strictly at your own risk.
            </p>

            <h2 className="text-stone-900 font-black tracking-tight">Individual Circumstances</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              Entrepreneurship outcomes depend heavily on individual circumstances, including personal skills, market conditions, and execution quality. Content on this website describes general principles that may not apply to your specific situation.
            </p>

            <h2 className="text-stone-900 font-black tracking-tight">No Professional Relationship</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              Use of this website does not create any professional relationship between you and
              entrepreneurs.bd or its founders. For specific business, legal, or financial
              advice, please consult qualified professionals.
            </p>

            <h2 className="text-stone-900 font-black tracking-tight">External Ecosystems</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              This website may contain links to external sites provided for convenience. We do not endorse or assume responsibility for the content, policies, or practices of any third-party ecosystems.
            </p>

            <h2 className="text-stone-900 font-black tracking-tight">Limitation of Liability</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              In no event shall entrepreneurs.bd or any contributors be liable for any damages arising out of your use of this website. Our mission is informational; your results and risks remain your own professional responsibility.
            </p>

            <h2 className="text-stone-900 font-black tracking-tight">Intellectual Transparency</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              If you have questions about this disclaimer, please connect with us through our
              <Link href="/contact" className="text-emerald-900 hover:text-emerald-700 font-black border-b-2 border-emerald-900/20 ml-1"> contact page</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* 🛡️ Narrative Footer */}
      <section className="py-12 bg-stone-50 border-t border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Link href="/">
              <Button variant="outline" className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 rounded-xl px-10 h-14 font-black uppercase text-xs tracking-widest">
                <ArrowLeft className="mr-3 w-4 h-4" />
                Return to Growth Hub
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
