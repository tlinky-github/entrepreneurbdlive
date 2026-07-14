import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Trash2, 
  MapPin, 
  Building2, 
  Tag, 
  ChevronRight,
  Globe,
  Briefcase,
  Star,
  Rocket,
  BookOpen
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { taxonomyAPI } from '../../lib/api';

const AdminTaxonomies = () => {
  const [activeType, setActiveType] = useState('industries'); // industries, cities, categories
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const taxonomyTypes = [
    { id: 'blog_categories', label: 'Blog Categories', icon: Tag, color: 'purple' },
    { id: 'categories', label: 'Business Categories', icon: Tag, color: 'emerald' },
    { id: 'industries', label: 'Industries', icon: Briefcase, color: 'blue' },
    { id: 'cities', label: 'Cities', icon: MapPin, color: 'stone' },
    { id: 'listing_types', label: 'Listing Types', icon: Building2, color: 'orange' },
    { id: 'startup_stages', label: 'Startup Stages', icon: Star, color: 'yellow' },
  ];

  const loadTaxonomy = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taxonomyAPI.list(activeType);
      setItems(res.data || []);
    } catch (error) {
      console.error('Error loading taxonomy:', error);
      toast.error(`Failed to load ${activeType}`);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    loadTaxonomy();
  }, [loadTaxonomy]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setAdding(true);
    try {
      await taxonomyAPI.create(activeType, newName.trim());
      toast.success(`${newName} added to ${activeType}`);
      setNewName('');
      loadTaxonomy();
    } catch (error) {
      toast.error('Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This may affect existing profiles/listings.')) return;

    try {
      await taxonomyAPI.delete(activeType, id);
      setItems(items.filter(item => item.id !== id));
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Taxonomy Manager</h1>
        <p className="text-stone-500">Manage global industries, cities, and categories used across the platform.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          {taxonomyTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                  activeType === type.id 
                    ? 'bg-emerald-900 text-white shadow-md' 
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span className="font-medium">{type.label}</span>
                </div>
                <ChevronRight size={16} opacity={activeType === type.id ? 1 : 0.3} />
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Add New */}
          <Card className="border-emerald-100 bg-emerald-50/30">
            <CardContent className="p-4">
              <form onSubmit={handleAdd} className="flex gap-3">
                <div className="relative flex-1">
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <Input 
                    placeholder={`Add new ${activeType.slice(0, -1)}...`}
                    className="pl-10 bg-white"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={adding || !newName.trim()}
                  className="bg-emerald-900 hover:bg-emerald-800"
                >
                  {adding ? 'Adding...' : 'Add Item'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-bold capitalize">All {activeType}</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <Input 
                  placeholder="Filter list..."
                  className="pl-9 h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-stone-200">
                  <Table>
                    <TableHeader className="bg-stone-50">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead className="w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-stone-400 italic">
                            No items found. Add your first {activeType.slice(0, -1)} above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item) => (
                          <TableRow key={item.id} className="hover:bg-stone-50/50">
                            <TableCell className="font-medium text-stone-900">{item.name}</TableCell>
                            <TableCell>
                              <code className="text-sm bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                                {item.slug}
                              </code>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminTaxonomies;
