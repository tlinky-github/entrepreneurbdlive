import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden pt-16 lg:pt-0">
      <div className="absolute inset-0 bg-emerald-900" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in translate-y-0 opacity-100 transition-all duration-700">
            <Badge className="bg-emerald-800 text-emerald-100 mb-6 px-4 py-1.5 border-none shadow-sm">
              Bangladesh's Entrepreneur Ecosystem
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]">
              Empowering{' '}
              <span className="text-[#ef4337] relative inline-block">
                Entrepreneurs
                <svg className="absolute -bottom-2 left-0 w-full h-2 text-emerald-400 opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>{' '}
              to Build the Future
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 mb-8 max-w-lg leading-relaxed opacity-90">
              Connect with Bangladesh's most ambitious founders, discover thriving startups,
              and access resources to fuel your entrepreneurial journey.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/submit">
                <Button
                  size="lg"
                  className="bg-white text-emerald-900 hover:bg-stone-100 px-8 h-14 rounded-[2rem] font-bold shadow-xl transition-all hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95"
                >
                  <Plus className="mr-2 w-5 h-5" />
                  Get Featured
                </Button>
              </Link>
              <Link href="/directory">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 h-14 rounded-[2rem] backdrop-blur-sm transition-all"
                >
                  Explore Ecosystem
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block animate-slide-up">
            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full" />
              <img
                src="https://images.unsplash.com/photo-1627599936744-51d288f89af4?w=800&h=600&fit=crop"
                alt="Bangladeshi entrepreneurs collaborating"
                className="relative rounded-[2rem] shadow-2xl border border-white/10 brightness-110"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-[2rem] shadow-2xl border border-stone-100 flex items-center gap-4 animate-bounce-slow">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="text-emerald-900 font-bold text-xl">1M</span>
                </div>
                <div>
                  <p className="text-base font-bold text-stone-900 leading-tight">Ecosystem Mission</p>
                  <p className="text-xs text-stone-500 font-medium">Empowering Founders by 2030</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
