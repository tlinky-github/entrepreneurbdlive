'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  History, 
  Layers, 
  Settings, 
  ArrowLeft,
  Wand2,
  ListRestart
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import Link from '@/components/common/UniversalLink';
import AIGenerateForm from '@/components/admin/ai/AIGenerateForm';
import { AIPostQueue, GenerationHistory } from '@/components/admin/ai/AIPostQueue';

export default function AIGeneratorPage() {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Authority */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-stone-400 hover:text-emerald-900 transition-colors">
               <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Genesis Engine</span>
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tighter flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-emerald-600" />
            AI Intelligence Hub
          </h1>
          <p className="text-stone-500 font-medium lowercase">Automate your narrative. Calibrate your AI model. Monitor results.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white border border-stone-100 p-1 rounded-2xl shadow-xl shadow-stone-200/20 h-auto gap-1">
          <TabsTrigger value="generate" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-emerald-900 data-[state=active]:text-white">
            <Wand2 className="w-4 h-4 mr-2" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="queue" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-emerald-900 data-[state=active]:text-white">
            <ListRestart className="w-4 h-4 mr-2" />
            Process Queue
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-emerald-900 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            Audit History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-stone-100 shadow-2xl shadow-stone-200/30 rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-8">
                   <AIGenerateForm onClose={() => setActiveTab('history')} />
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-8">
               <div className="bg-emerald-900 text-white p-8 rounded-3xl shadow-xl shadow-emerald-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Sparkles className="w-32 h-32" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-4 relative z-10">AI Co-pilot Ready</h3>
                  <p className="text-emerald-100/80 text-sm font-medium leading-relaxed mb-6 relative z-10">
                     Batch mode supports up to 50 topics at once. Your restored reasoning engine ensures high-fidelity FAQ generation for every post.
                  </p>
                  <div className="space-y-3 relative z-10">
                     <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                        <Layers className="w-5 h-5 text-emerald-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Multi-Provider (Claude/Gemini/OAI)</span>
                     </div>
                  </div>
               </div>
               
               <div className="bg-white border border-stone-100 p-8 rounded-3xl shadow-lg shadow-stone-200/10">
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-4">Engine Metrics</h3>
                  <div className="space-y-6">
                     <div className="flex justify-between items-end border-b border-stone-50 pb-4">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Status</p>
                        <Badge className="bg-emerald-100 text-emerald-800 border-none px-2 py-0.5 font-bold flex items-center gap-1">
                           <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                           Operational
                        </Badge>
                     </div>
                     <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Connected Hubs</p>
                        <p className="text-xs font-black text-stone-900">RESTORED (ROOT API)</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="queue">
          <Card className="border-stone-100 shadow-xl shadow-stone-200/20 rounded-3xl bg-white overflow-hidden">
             <CardContent className="p-8">
                <div className="mb-6">
                    <h3 className="text-lg font-black text-stone-900 tracking-tight">Active Process Monitoring</h3>
                    <p className="text-xs text-stone-500 font-medium">Real-time status of multi-threaded generation tasks.</p>
                </div>
                <AIPostQueue />
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
           <GenerationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
