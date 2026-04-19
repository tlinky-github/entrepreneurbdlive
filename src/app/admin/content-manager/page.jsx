'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Settings,
  BookOpen,
  Users,
  MapPin,
  Lightbulb,
  CheckCircle,
  MoreVertical,
  FileEdit,
  Ban
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { contentAPI, adminAPI, taxonomyAPI } from '@/lib/api';

export default function AdminContentManagerPage() {
  const router = useRouter();
  const [contentType, setContentType] = useState('blog'); // blog, entrepreneurs, directory, knowledge
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const contentConfig = {
    blog: {
      icon: BookOpen,
      label: 'Blog Posts',
      route: '/blog',
      apiKey: 'posts',
    },
    entrepreneurs: {
      icon: Users,
      label: 'Entrepreneurs',
      route: '/entrepreneurs',
      apiKey: 'profiles',
    },
    directory: {
      icon: MapPin,
      label: 'Business Directory',
      route: '/directory',
      apiKey: 'listings',
    },
    knowledge: {
      icon: Lightbulb,
      label: 'Knowledge Hub',
      route: '/knowledge',
      apiKey: 'resources',
    }
  };

  const config = contentConfig[contentType];
  const ConfigIcon = config.icon;

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contentAPI.list(contentType);
      setItems(res.data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items from database');
    } finally {
      setLoading(false);
    }
  }, [contentType]);

  const loadCategories = useCallback(async () => {
    try {
      const type = contentType === 'blog' ? 'blog_categories' : (contentType === 'knowledge' ? 'categories' : 'industries');
      const res = await taxonomyAPI.list(type);
      setCategories(res.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, [contentType]);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [loadItems, loadCategories]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminAPI.setStatus(contentType, id, newStatus);
      toast.success(`Status changed to ${newStatus}`);
      loadItems();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await contentAPI.delete(contentType, deleteId);
      setItems(items.filter(item => item.id !== deleteId));
      setDeleteId(null);
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = items.filter(item => {
    const searchStr = search.toLowerCase();
    return (
      (item.title?.toLowerCase().includes(searchStr)) ||
      (item.slug?.toLowerCase().includes(searchStr)) ||
      (item.company_name?.toLowerCase().includes(searchStr)) ||
      (item.name?.toLowerCase().includes(searchStr)) ||
      (item.business_name?.toLowerCase().includes(searchStr))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
            <ConfigIcon className="text-emerald-700" />
            Content Manager
          </h1>
          <p className="text-stone-500 font-medium">Manage editorial workflow, metadata, and publication status.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="border-emerald-600 text-emerald-800 hover:bg-emerald-50"
            onClick={() => router.push('/admin/ai-settings?action=generate')}
          >
            <Plus size={18} className="mr-2" />
            ⚡ AI-Generate
          </Button>
          <Button 
            className="bg-emerald-900 hover:bg-emerald-800"
            onClick={() => router.push(`/admin/content-editor?type=${contentType}`)}
          >
            <Plus size={18} className="mr-2" />
            Create {config.label}
          </Button>
        </div>
      </div>

      {/* Type Selector Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-2 rounded-2xl shadow-sm border border-stone-200">
        {Object.entries(contentConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const isActive = contentType === key;
          return (
            <button
              key={key}
              onClick={() => setContentType(key)}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-emerald-900 text-white shadow-md' 
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <Icon size={18} />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
          <Input
            placeholder={`Search ${config.label.toLowerCase()}...`}
            className="pl-10 h-11 bg-stone-50 border-stone-100 focus:bg-white transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setShowCategoryModal(true)} variant="outline" className="h-11 font-semibold flex-1 md:flex-none">
            <Settings size={18} className="mr-2" />
            Categories
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card className="border-stone-200 shadow-xl shadow-stone-200/50 overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone-400 font-medium italic mb-4">No content entries found in this section.</p>
              <Button 
                variant="outline"
                className="border-emerald-600 text-emerald-900"
                onClick={() => router.push(`/admin/content-editor?type=${contentType}`)}
              >
                Create the first one
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-stone-50/50">
                  <TableRow>
                    <TableHead className="font-bold py-4">Title/Name</TableHead>
                    <TableHead className="font-bold py-4 text-center">Status</TableHead>
                    {contentType === 'blog' && <TableHead className="font-bold py-4 text-center">Views</TableHead>}
                    <TableHead className="font-bold py-4 text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const title = item.title || item.name || item.business_name || item.slug || 'Untitled Entry';
                    const status = item.status || 'draft';

                    return (
                      <TableRow key={item.id} className="hover:bg-stone-50/50 transition-colors">
                        <TableCell className="font-semibold text-stone-900 py-4 pl-6">
                          {title}
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">{item.id}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={
                            status === 'published' 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : (status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-orange-100 text-orange-800 border-orange-200')
                          }>
                            {status}
                          </Badge>
                        </TableCell>
                        {contentType === 'blog' && <TableCell className="text-center font-mono text-sm text-stone-500">{item.view_count || 0}</TableCell>}
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-stone-200">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                {status !== 'published' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'published')} className="text-emerald-600 font-medium">
                                    <CheckCircle size={14} className="mr-2" /> Publish
                                  </DropdownMenuItem>
                                )}
                                {status !== 'draft' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'draft')} className="text-orange-600 font-medium">
                                    <FileEdit size={14} className="mr-2" /> Draft
                                  </DropdownMenuItem>
                                )}
                                {status !== 'rejected' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'rejected')} className="text-red-600 font-medium">
                                    <Ban size={14} className="mr-2" /> Reject
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(`${config.route}/${item.slug}`)}>
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.push(`/admin/content-editor?type=${contentType}&id=${item.id}`)}>
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(item.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Erase Content Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently remove this entry from your platform. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 rounded-xl">
              {deleting ? 'Erasing...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
