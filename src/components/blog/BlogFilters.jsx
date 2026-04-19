'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function BlogFilters({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/blog?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-emerald-900 transition-colors" />
          <Input
            placeholder="Search articles..."
            defaultValue={search}
            onChange={(e) => {
                const value = e.target.value;
                // Debounce or immediate? For better UX in Next.js, we can just push
                const timeoutId = setTimeout(() => updateParams({ search: value }), 500);
                return () => clearTimeout(timeoutId);
            }}
            className="pl-12 h-12 bg-white border-stone-200 focus:border-emerald-900 focus:ring-emerald-900/20 rounded-xl transition-all"
          />
        </div>
        
        <Select 
          value={categoryId || 'all'} 
          onValueChange={(value) => updateParams({ category: value })}
        >
          <SelectTrigger className="w-full sm:w-56 h-12 bg-white border-stone-200 rounded-xl focus:ring-emerald-900/20">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-900" />
              <SelectValue placeholder="All Categories" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-stone-200 shadow-xl">
            <SelectItem value="all" className="hover:bg-emerald-50">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)} className="hover:bg-emerald-50">
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
