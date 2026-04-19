'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Filter, Building2, LayoutGrid } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 🛡️ Listing Type Selection (Tabs on Desktop, Select on Mobile) */}
      <div className="mb-8">
        <div className="hidden sm:block">
          <Tabs value={typeSlug} onValueChange={(v) => updateParams({ type: v })}>
            <TabsList className="bg-white border border-stone-200 p-1 rounded-2xl h-14 shadow-sm">
              <TabsTrigger value="all" className="data-[state=active]:bg-emerald-900 data-[state=active]:text-white rounded-xl px-8 h-full font-bold transition-all">
                <LayoutGrid className="w-4 h-4 mr-2" /> All Tiers
              </TabsTrigger>
              {listingTypes.map((type) => (
                <TabsTrigger 
                  key={type.id} 
                  value={type.slug} 
                  className="data-[state=active]:bg-emerald-900 data-[state=active]:text-white rounded-xl px-8 h-full font-bold transition-all"
                >
                  {type.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        
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
            className="pl-12 h-12 bg-white border-stone-200 rounded-xl focus:border-emerald-900 focus:ring-emerald-900/20"
          />
        </div>
        
        <Select 
          value={categorySlug} 
          onValueChange={(v) => updateParams({ category: v })}
        >
          <SelectTrigger className="w-full sm:w-56 h-12 bg-white border-stone-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-900" />
              <SelectValue placeholder="Industry Sector" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-stone-200">
            <SelectItem value="all">All Sectors</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug || String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
