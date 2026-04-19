import Link from 'next/link';
import { Gavel, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: "Terms of Service | Entrepreneurs BD",
  description: "Official terms and conditions governing the use of the entrepreneurs.bd platform and its resources.",
};

export default function TermsPage() {
  return (
    <div className="bg-stone-50 min-h-screen py-16 lg:py-24">
      <article className="max-w-4xl mx-auto px-6 md:px-12 bg-white py-16 md:py-24 rounded-[4rem] shadow-sm border border-stone-100">
        <header className="mb-16 border-b border-stone-50 pb-12">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-8">
             <Gavel className="w-6 h-6 text-emerald-900" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tighter mb-4">Terms of Service.</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">
             Last Updated: April 2026 &bull; Usage Agreement
          </p>
        </header>

        <div className="prose prose-stone prose-lg max-w-none text-stone-600 font-medium leading-relaxed">
          <p>Welcome to entrepreneurs.bd. These terms and conditions outline the rules and regulations for the use of Entrepreneurs BD's Website, located at https://entrepreneurs.bd.</p>

          <p>By accessing this website, we assume you accept these terms and conditions. Do not continue to use entrepreneurs.bd if you do not agree to take all of the terms and conditions stated on this page.</p>

          <h2 className="text-stone-900 font-black pt-8">Cookies</h2>
          <p>We employ the use of cookies. By accessing entrepreneurs.bd, you agreed to use cookies in agreement with the Entrepreneurs BD's Privacy Policy.</p>

          <h2 className="text-stone-900 font-black pt-8">License</h2>
          <p>Unless otherwise stated, Entrepreneurs BD and/or its licensors own the intellectual property rights for all material on entrepreneurs.bd. All intellectual property rights are reserved. You may access this from entrepreneurs.bd for your own personal use subjected to restrictions set in these terms and conditions.</p>

          <h2 className="text-stone-900 font-black pt-8">Content Liability</h2>
          <p>We shall not be hold responsible for any content that appears on your Website. You agree to protect and defend us against all claims that is rising on your Website. No link(s) should appear on any Website that may be interpreted as libellous, obscene or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third party rights.</p>

          <footer className="mt-20 pt-12 border-t border-stone-50 flex justify-between items-center">
             <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-emerald-900 flex items-center gap-2">
                <ArrowLeft className="w-3 h-3" /> Return to Hub
             </Link>
             <span className="text-[10px] text-stone-300 font-bold uppercase tracking-widest">Document ID: EBD-TOS-2026</span>
          </footer>
        </div>
      </article>
    </div>
  );
}
