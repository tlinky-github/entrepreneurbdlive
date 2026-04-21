'use client';

import React, { useState } from 'react';
import { 
  Pencil, 
  Layers, 
  Sparkles, 
  ArrowLeft,
  MousePointer2,
  Layout,
  Code,
  Eye,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from '@/components/common/UniversalLink';
import { Button } from '@/components/ui/button';

export default function VisualEditorHubPage() {
  const [selectedMode, setSelectedMode] = useState(null);

  // In Next.js, we'll keep it simple for the selector and move into sub-routes or conditional rendering
  // For the "Richness" requested, we'll keep the selector high-fidelity

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Authority */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-stone-400 hover:text-emerald-900 transition-colors">
               <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Visual Suite</span>
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tighter flex items-center gap-3">
             <Layout className="w-8 h-8 text-emerald-600" />
             Platform Visual Editor
          </h1>
          <p className="text-stone-500 font-medium lowercase">Calibrate your narrative structure. Select a specialized editor to continue.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
        {/* Module 1: Content Editor Authority */}
        <Card className="group relative border-stone-100 shadow-2xl shadow-stone-200/40 rounded-[2.5rem] overflow-hidden hover:scale-[1.02] transition-all duration-500 bg-white">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Pencil className="w-40 h-40" />
           </div>
           
           <CardContent className="p-12 space-y-8">
              <div className="bg-emerald-50 w-16 h-16 rounded-3xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
                 <Pencil className="w-8 h-8" />
              </div>
              
              <div className="space-y-3">
                 <h2 className="text-2xl font-black text-stone-900 tracking-tight">Narrative Forge</h2>
                 <p className="text-stone-500 text-sm font-medium leading-relaxed">
                    The definitive authoring engine. Write, format, and optimize rich articles with your AI-integrated TipTap suite.
                 </p>
              </div>

              <div className="space-y-3">
                 {[
                    'Bold/Italic/Heading Control',
                    'High-Fidelity AI Copilot',
                    'Real-time SEO Preview',
                    'Auto-save to Central Registry'
                 ].map((feat) => (
                    <div key={feat} className="flex items-center gap-3 text-xs font-bold text-stone-400">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       <span className="uppercase tracking-tight">{feat}</span>
                    </div>
                 ))}
              </div>

              <Button 
                asChild
                className="w-full h-14 rounded-2xl bg-emerald-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-900/20 group"
              >
                 <Link href="/admin/visual-editor/content">
                    Initialize Content mode
                    <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </Link>
              </Button>
           </CardContent>
        </Card>

        {/* Module 2: Component Editor Authority */}
        <Card className="group relative border-stone-100 shadow-2xl shadow-stone-200/40 rounded-[2.5rem] overflow-hidden hover:scale-[1.02] transition-all duration-500 bg-white">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Layers className="w-40 h-40" />
           </div>
           
           <CardContent className="p-12 space-y-8">
              <div className="bg-indigo-50 w-16 h-16 rounded-3xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                 <Layers className="w-8 h-8" />
              </div>
              
              <div className="space-y-3">
                 <h2 className="text-2xl font-black text-stone-900 tracking-tight">Structural Architect</h2>
                 <p className="text-stone-500 text-sm font-medium leading-relaxed">
                    A high-performance visual scanner. Identify components, edit styles, and modify element IDs directly on the live DOM.
                 </p>
              </div>

              <div className="space-y-3">
                 {[
                    'Real-time DOM Scanning',
                    'Visual Selection Highlight',
                    'Style & Attribute Injection',
                    'Component Metadata Mapping'
                 ].map((feat) => (
                    <div key={feat} className="flex items-center gap-3 text-xs font-bold text-stone-400">
                       <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                       <span className="uppercase tracking-tight">{feat}</span>
                    </div>
                 ))}
              </div>

              <Button 
                asChild
                className="w-full h-14 rounded-2xl bg-indigo-900 hover:bg-stone-900 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-900/20 group"
              >
                 <Link href="/admin/visual-editor/components">
                    Initialize architectural mode
                    <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </Link>
              </Button>
           </CardContent>
        </Card>
      </div>

      {/* Authority Notice */}
      <div className="bg-stone-50 border border-stone-200 p-8 rounded-[2rem] max-w-5xl">
         <div className="flex gap-4">
            <div className="bg-white p-2 h-fit rounded-lg shadow-sm">
               <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="space-y-2">
               <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Genesis Visual Strike</h3>
               <p className="text-xs text-stone-500 font-medium leading-relaxed max-w-2xl">
                  Your platform is now realigned with the authoritative visual control of your original setup. All changes are flawslessly operationally authoritative across the Next.js App Router.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
