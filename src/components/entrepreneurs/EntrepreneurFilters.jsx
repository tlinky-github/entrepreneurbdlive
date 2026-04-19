'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Filter, MapPin, UserCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EntrepreneurFilters({ industries = [], cities = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') || '';
  const industrySlug = searchParams.get('industry') || 'all';
  const citySlug = searchParams.get('city') || 'all';

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/entrepreneurs?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-4">
        {/* 🛡️ Search Entry Port */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input
            placeholder="Search founders & leaders..."
            defaultValue={search}
            onChange={(e) => {
                const value = e.target.value;
                const timeoutId = setTimeout(() => updateParams({ search: value }), 500);
                return () => clearTimeout(timeoutId);
            }}
            className="pl-12 h-12 bg-white border-stone-200 rounded-xl focus:border-emerald-900 focus:ring-emerald-900/20"
          />
        </div>
        
        {/* 🛡️ Industry Deck */}
        <Select 
          value={industrySlug} 
          onValueChange={(v) => updateParams({ industry: v })}
        >
          <SelectTrigger className="w-full md:w-56 h-12 bg-white border-stone-200 rounded-xl">
            <div className="flex items-center gap-2 text-stone-600 font-medium">
              <Filter className="w-4 h-4 text-emerald-900" />
              <SelectValue placeholder="Industry" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-stone-200 shadow-xl">
            <SelectItem value="all">Global Industries</SelectItem>
            {industries.map((ind) => (
              <SelectItem key={ind} value={ind}>{ind}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 🛡️ Geographic Cluster Selection */}
        <Select 
          value={citySlug} 
          onValueChange={(v) => updateParams({ city: v })}
        >
          <SelectTrigger className="w-full md:w-56 h-12 bg-white border-stone-200 rounded-xl">
            <div className="flex items-center gap-2 text-stone-600 font-medium">
              <MapPin className="w-4 h-4 text-emerald-900" />
              <SelectValue placeholder="City" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-stone-200 shadow-xl">
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
