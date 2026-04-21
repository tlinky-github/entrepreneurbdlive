'use client';

import React from 'react';
import { ImageIcon, HardDrive, Info, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from '@/components/common/UniversalLink';
import ImageUploader from '@/components/common/ImageUploader';

export default function AdminMediaPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Authority */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-stone-400 hover:text-emerald-900 transition-colors">
               <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Asset Command</span>
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tighter flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-emerald-600" />
            Media & Storage Hub
          </h1>
          <p className="text-stone-500 font-medium lowercase">Manage your Cloudflare R2 assets. Upload, edit, and optimize your platform's narrative imagery.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Card className="border-stone-100 shadow-2xl shadow-stone-200/30 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100 py-6 px-8">
               <CardTitle className="flex items-center justify-between text-lg font-black text-stone-900 uppercase tracking-tighter">
                  Cloud Asset Browser
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ImageUploader 
                defaultTab="gallery"
                onChange={(url) => console.log('Selected image:', url)}
                entityType="general"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <div className="bg-emerald-900 text-white p-8 rounded-3xl shadow-xl shadow-emerald-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <ImageIcon className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-black tracking-tight mb-4 relative z-10">Storage Authority</h3>
              <p className="text-emerald-100/80 text-sm font-medium leading-relaxed mb-6 relative z-10">
                 All assets are served via your high-performance Cloudflare R2 bucket. Use the "Resync Bucket" action to manually register remote uploads.
              </p>
              <div className="space-y-3 relative z-10">
                 <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                    <Info className="w-5 h-5 text-emerald-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Auto-Optimization Enabled</span>
                 </div>
              </div>
           </div>

           <Alert className="bg-stone-50 border-stone-200 rounded-2xl">
              <Info className="h-5 w-5 text-stone-400" />
              <AlertDescription className="text-xs text-stone-500 font-medium leading-relaxed">
                 Deleting an image here will permanently remove it from Cloudflare R2. This action cannot be reversed.
              </AlertDescription>
           </Alert>
        </div>
      </div>
    </div>
  );
}
