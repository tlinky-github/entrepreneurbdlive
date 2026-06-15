import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export default function BlogFilters({ initialSearch = '', initialCategory = '', categories = [] }) {
  const [search, setSearch] = useState(initialSearch);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      submitFilters(search, initialCategory);
    }
  };

  const submitFilters = (newSearch, newCategory) => {
    const url = new URL(window.location.href);
    if (newSearch) url.searchParams.set('search', newSearch);
    else url.searchParams.delete('search');
    
    if (newCategory && newCategory !== 'all') url.searchParams.set('category', newCategory);
    else url.searchParams.delete('category');

    window.location.href = url.toString();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <Input
          placeholder="Search articles... (Press Enter)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          className="pl-10 h-10 bg-white border-stone-200"
        />
      </div>
      <Select 
        value={initialCategory || 'all'} 
        onValueChange={(val) => submitFilters(search, val)}
      >
        <SelectTrigger className="w-full sm:w-48 h-10 bg-white border-stone-200">
          <Filter className="w-4 h-4 mr-2 text-stone-500" />
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={String(cat.slug || cat.id)}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
