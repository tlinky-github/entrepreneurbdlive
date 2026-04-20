'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Building2, User, Sparkles, Network } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Innovator';
  const type = searchParams.get('type') || 'entrepreneur';

  return (
    <div className="min-h-screen bg-stone-50 py-24 sm:py-32 px-4 overflow-x-hidden">
      <div className="max-w-3xl mx-auto text-center">
        {/* 🛡️ Aesthetic Deck: Visual Confirmation */}
        <div className="mb-12 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center animate-bounce-subtle shadow-inner">
               <CheckCircle2 className="w-12 h-12 text-emerald-900" />
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center animate-pulse">
               <Sparkles className="w-6 h-6 text-yellow-500 fill-current" />
            </div>
          </div>
        </div>

        <Badge className="bg-emerald-100 text-emerald-800 border-none mb-8 px-6 py-2 uppercase tracking-[0.2em] text-[10px] font-black shadow-sm">
          Application Successfully Received
        </Badge>
        
        <h1 className="text-4xl sm:text-6xl font-black text-stone-900 mb-8 tracking-tight leading-tight">
          Welcome to the Network, <br />
          <span className="text-emerald-900 font-serif italic">{name}!</span>
        </h1>

        <Card className="border-none shadow-[0_30px_100px_rgba(0,0,0,0.04)] rounded-[3rem] overflow-hidden mb-16 bg-white">
          <CardContent className="p-10 lg:p-16">
            <div className="flex justify-center mb-10">
              {type === 'entrepreneur' ? (
                <div className="flex items-center gap-3 px-6 py-3 bg-stone-50 rounded-2xl border border-stone-100 shadow-inner">
                  <User className="w-5 h-5 text-emerald-900" />
                  <span className="text-stone-900 font-bold uppercase tracking-widest text-[10px]">Founder Spotlight Application</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-6 py-3 bg-stone-50 rounded-2xl border border-stone-100 shadow-inner">
                  <Building2 className="w-5 h-5 text-emerald-900" />
                  <span className="text-stone-900 font-bold uppercase tracking-widest text-[10px]">Enterprise Directory Submission</span>
                </div>
              )}
            </div>

            <p className="text-xl text-stone-500 mb-12 leading-relaxed font-medium max-w-xl mx-auto">
              {type === 'entrepreneur' ? (
                <>
                  We are incredibly excited to showcase your journey as a founder. 
                  Our editorial board is currently reviewing your narrative to ensure 
                  your legacy is presented with the prestige it deserves.
                </>
              ) : (
                <>
                  Your enterprise is a vital pillar of Bangladesh&apos;s growing ecosystem. 
                  We have received your directory listing and our curators are 
                  validating the details to maximize your discovery footprint.
                </>
              )}
            </p>

            {/* 🛡️ Interaction Roadmap */}
            <div className="bg-emerald-50/50 rounded-[2.5rem] p-8 lg:p-12 border border-emerald-100/50 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Network className="w-24 h-24 text-emerald-900" />
              </div>
              <h3 className="text-lg font-black text-emerald-900 mb-8 flex items-center gap-3">
                 The Vetting Roadmap
              </h3>
              <div className="space-y-6 relative z-10">
                 {[
                   { id: 1, text: 'Our editorial board will manually vet your submission for narrative precision and media quality.' },
                   { id: 2, text: 'If further clarifications are required, we will reach out via your provided moderation contact email.' },
                   { id: 3, text: 'Upon confirmation, your profile will be indexed and broadcast across the Innovation Network.' }
                 ].map((step) => (
                   <div key={step.id} className="flex gap-6">
                      <div className="w-8 h-8 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-900/20 shrink-0">
                         {step.id}
                      </div>
                      <p className="text-sm font-bold text-emerald-900/70 leading-relaxed uppercase tracking-wide">
                        {step.text}
                      </p>
                   </div>
                 ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🛡️ CTAs */}
        <div className="flex flex-wrap justify-center gap-6">
          <Link href="/">
            <Button variant="ghost" className="h-16 px-10 rounded-2xl text-stone-500 hover:text-emerald-900 font-bold uppercase tracking-widest text-[11px]">
              Back to Home
            </Button>
          </Link>
          <Link href="/blog">
            <Button size="lg" className="bg-emerald-900 text-white hover:bg-emerald-800 px-12 h-16 rounded-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
              Explore Insights
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center font-black text-emerald-900 uppercase tracking-widest animate-pulse">Initializing Identity...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
