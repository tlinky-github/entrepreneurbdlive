import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Privacy Policy | Entrepreneurs BD',
  description: 'Learn how entrepreneurs.bd handles and protects your data. Transparency in our national growth mission.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* 🛡️ Aesthetic Breadcrumb Deck */}
      <div className="bg-stone-50 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <ChevronRight size={12} className="text-stone-300" />
            <span className="text-emerald-900 font-black">Privacy Policy</span>
          </nav>
        </div>
      </div>

      {/* 🛡️ Narrative Header */}
      <section className="py-20 lg:py-32 bg-stone-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <Shield size={400} className="text-emerald-900" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border border-stone-200 mb-8 shadow-sm">
            <Shield className="w-4 h-4 text-emerald-900" />
            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Legal Protection</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-stone-900 mb-8 tracking-tighter">
            Privacy Policy
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
            <h2 className="text-stone-900 font-black tracking-tight">Introduction</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              entrepreneurs.bd ("we," "our," or "the platform") is committed to protecting your privacy.
              This Privacy Policy explains how we handle information when you visit our website as part of our mission to connect 1 million entrepreneurs.
            </p>

            <h2 className="text-stone-900 font-black tracking-tight">Information Collection Protocols</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              As a high-performance informational hub, entrepreneurs.bd maintains strict data containment:
            </p>
            <ul className="text-stone-600 font-medium space-y-4">
              <li>
                <strong className="text-stone-900">Community Submissions:</strong> Data provided through our entrepreneur and directory submission forms is used solely for publication on the platform after vetting.
              </li>
              <li>
                <strong className="text-stone-900">Identity Desk:</strong> Contact form submissions collect your name and communication coordinates specifically for response purposes.
              </li>
              <li>
                <strong className="text-stone-900">Growth Analytics:</strong> We utilize standard telemetry to analyze traffic patterns and optimize the user experience for the national growth engine.
              </li>
            </ul>

            <h2 className="text-stone-900 font-black tracking-tight">Data Utilization</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              Information collected is utilized exclusively to respond to inquiries and maintain the platform's professional standards. We maintain a zero-tolerance policy for selling or sharing your data for third-party marketing.
            </p>

            <h2 className="text-stone-900 font-black tracking-tight">Operational Security</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              We implement industry-standard encryption and security measures to protect the integrity of your information. While absolute security is an ideal in any digital ecosystem, we commit to high-fidelity protection of your identity.
            </p>

            <h2 className="text-stone-900 font-black tracking-tight">Intellectual Transparency</h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              If you have questions about our data protocols, please connect with us through our
              <Link href="/contact" className="text-emerald-900 hover:text-emerald-700 font-black border-b-2 border-emerald-900/20 ml-1"> Identity Hub</Link>.
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
