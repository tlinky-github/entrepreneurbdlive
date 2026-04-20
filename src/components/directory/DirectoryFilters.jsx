'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Filter, Building2, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DirectoryFilters({ categories = [], listingTypes = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') || '';
  const typeSlug = searchParams.get('type') || 'all';
  const categorySlug = searchParams.get('category') || 'all';

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/directory?${params.toString()}`, { scroll: false });
  };

  const allTiers = [{ id: 'all', name: 'All Tiers', slug: 'all' }, ...listingTypes];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 🛡️ Listing Type Selection (High-Fidelity Sliding Tabs) */}
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="hidden sm:block">
           <div className="inline-flex bg-white border border-stone-200 p-1.5 rounded-2xl h-14 shadow-sm relative">
             {allTiers.map((type) => {
               const isActive = typeSlug === type.slug;
               return (
                 <button
                   key={type.id}
                   onClick={() => updateParams({ type: type.slug })}
                   className={`relative px-8 h-full flex items-center justify-center text-sm font-bold transition-colors duration-300 z-10 whitespace-nowrap ${
                     isActive ? 'text-white' : 'text-stone-500 hover:text-stone-900'
                   }`}
                 >
                   {isActive && (
                     <motion.div
                       layoutId="activeTabBackground"
                       className="absolute inset-0 bg-emerald-900 rounded-xl z-[-1] shadow-lg shadow-emerald-900/20"
                       transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                     />
                   )}
                   {type.slug === 'all' && <LayoutGrid className={`w-4 h-4 mr-2 ${isActive ? 'text-emerald-300' : 'text-stone-400'}`} />}
                   {type.name}
                 </button>
               );
             })}
           </div>
        </div>
        
        {/* Mobile Selection Port */}
        <div className="sm:hidden">
          <Select value={typeSlug} onValueChange={(v) => updateParams({ type: v })}>
            <SelectTrigger className="w-full h-12 rounded-xl bg-white border-stone-200">
               <SelectValue placeholder="Select Business Tier" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-stone-200">
                <SelectItem value="all">All Tiers</SelectItem>
                {listingTypes.map((type) => (
                    <SelectItem key={type.id} value={type.slug}>{type.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 🛡️ Search & Category Deck */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input
            placeholder="Search business directory..."
            defaultValue={search}
            onChange={(e) => {
                const value = e.target.value;
                const timeoutId = setTimeout(() => updateParams({ search: value }), 500);
                return () => clearTimeout(timeoutId);
            }}
            className="pl-12 h-12 bg-white border-stone-200 rounded-xl focus:border-emerald-900 focus:ring-emerald-900/20 text-sm"
          />
        </div>
        
        <Select 
          value={categorySlug} 
          onValueChange={(v) => updateParams({ category: v })}
        >
          <SelectTrigger className="w-full sm:w-56 h-12 bg-white border-stone-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-900" />
              <SelectValue placeholder="Industry Sector" className="text-sm" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-stone-200">
            <SelectItem value="all" className="text-sm">All Sectors</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug || String(cat.id)} className="text-sm">
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
