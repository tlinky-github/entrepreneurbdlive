'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import of the massive editor to ensure fast initial page load and SSR safety
const EditorForge = dynamic(() => import('@/components/admin/EditorForge'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[600px] w-full bg-white rounded-3xl border border-stone-100 shadow-inner">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-emerald-700 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-emerald-900 rounded-full animate-pulse" />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-bold text-stone-900 tracking-tight uppercase">Igniting the Forge</h3>
      <p className="text-stone-400 text-sm font-medium animate-pulse">Initializing Tiptap engine & AI Copilot...</p>
    </div>
  )
});

export default function AdminContentEditorPage() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <Suspense fallback={null}>
        <EditorForge />
      </Suspense>
    </div>
  );
}
