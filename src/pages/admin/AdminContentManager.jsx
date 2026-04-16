// src/pages/admin/AdminContentManager.jsx
// Unified Content Manager for Blog, Entrepreneurs, Directory, Knowledge Hub

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Eye, Settings, BookOpen, Users, MapPin, Lightbulb, CheckCircle, XCircle, MoreVertical, FileEdit, EyeOff, Ban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { contentAPI, categoryAPI, adminAPI } from '../../lib/api';
import './AdminContentManager.css';

const AdminContentManager = () => {
  const navigate = useNavigate();
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
      fields: ['title', 'slug', 'excerpt', 'content', 'featured_image', 'category_id', 'seo_title', 'seo_description', 'seo_keywords']
    },
    entrepreneurs: {
      icon: Users,
      label: 'Entrepreneurs',
      route: '/entrepreneurs',
      apiKey: 'profiles',
      fields: ['name', 'photo', 'designation', 'company_name', 'category', 'details', 'social_linkedin', 'social_twitter', 'social_facebook', 'seo_title', 'seo_description']
    },
    directory: {
      icon: MapPin,
      label: 'Business Directory',
      route: '/directory',
      apiKey: 'listings',
      fields: ['logo', 'business_name', 'founder_name', 'ceo_name', 'category', 'headquarters', 'employee_size', 'details', 'company_page_url', 'life_at_company', 'seo_title', 'seo_description']
    },
    knowledge: {
      icon: Lightbulb,
      label: 'Knowledge Hub',
      route: '/knowledge',
      apiKey: 'resources',
      fields: ['title', 'details', 'content', 'category_id', 'file_url', 'seo_title', 'seo_description']
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
      const res = await categoryAPI.list();
      setCategories(res.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [loadItems, loadCategories]);

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Category name required');
      return;
    }
    try {
      await categoryAPI.create(newCategory);
      setNewCategory('');
      setShowCategoryModal(false);
      loadCategories();
      toast.success('Category created');
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await categoryAPI.delete(id);
      loadCategories();
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

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
      (item.first_name?.toLowerCase().includes(searchStr))
    );
  });

  return (
    <div className="admin-content-manager">
      {/* Header */}
      <div className="manager-header">
        <div>
          <h1 className="page-title">
            <ConfigIcon className="title-icon" />
            Content Manager
          </h1>
          <p className="page-subtitle">Manage content, categories, and SEO for all sections</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="border-emerald-600 text-emerald-800 hover:bg-emerald-50"
            onClick={() => navigate('/admin/ai-generator')}
          >
            <Plus size={18} className="mr-2" />
            ⚡ AI-Generate
          </Button>
          <Button 
            className="bg-emerald-900 hover:bg-emerald-800"
            onClick={() => navigate(`/admin/content-editor?type=${contentType}`)}
          >
            <Plus size={18} className="mr-2" />
            Create New {config.label}
          </Button>
        </div>
      </div>

      {/* Content Type Selector */}
      <div className="content-type-selector">
        {Object.entries(contentConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setContentType(key)}
              className={`type-btn ${contentType === key ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="manager-controls">
        <div className="search-box">
          <Search size={18} />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="action-buttons">
          <Button onClick={() => setShowCategoryModal(true)} variant="outline">
            <Settings size={18} />
            Manage Categories
          </Button>
          <Button onClick={() => window.location.href = `/admin/content-editor?type=${contentType}`}>
            <Plus size={18} />
            Create New
          </Button>
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>{config.label} ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="skeleton-table">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <p>No {config.label.toLowerCase()} found</p>
              <Button onClick={() => window.location.href = `/admin/content-editor?type=${contentType}`}>
                Create the first one
              </Button>
            </div>
          ) : (
            <div className="table-wrapper">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title/Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    {contentType === 'blog' && <TableHead>Views</TableHead>}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const catName = categories.find(c => c.id === item.category_id)?.name || '-';
                    const title = item.title || item.slug || item.company_name || `${item.first_name} ${item.last_name}`;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{catName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={item.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {item.status || 'draft'}
                          </Badge>
                        </TableCell>
                        {contentType === 'blog' && <TableCell>{item.views || 0}</TableCell>}
                        <TableCell>
                          <div className="action-icons">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded hover:bg-stone-100 transition-colors" title="Change Status">
                                  <MoreVertical size={16} className="text-stone-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {item.status !== 'published' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'published')} className="text-green-600">
                                    <CheckCircle size={14} className="mr-2" /> Publish
                                  </DropdownMenuItem>
                                )}
                                {item.status !== 'draft' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'draft')} className="text-yellow-600">
                                    <FileEdit size={14} className="mr-2" /> Move to Draft
                                  </DropdownMenuItem>
                                )}
                                {item.status !== 'rejected' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'rejected')} className="text-red-600">
                                    <Ban size={14} className="mr-2" /> Reject
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Eye
                              size={18}
                              className="icon-btn"
                              onClick={() => window.open(`${config.route}/${item.slug}`)}
                            />
                            <Edit2
                              size={18}
                              className="icon-btn"
                              onClick={() => window.location.href = `/admin/content-editor?type=${contentType}&id=${item.id}`}
                            />
                            <Trash2
                              size={18}
                              className="icon-btn delete"
                              onClick={() => setDeleteId(item.id)}
                            />
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

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <Card className="modal-content" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Manage Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="category-list">
                {categories.map(cat => (
                  <div key={cat.id} className="category-item">
                    <span>{cat.name}</span>
                    <Trash2 
                      size={16} 
                      className="cursor-pointer text-red-500 hover:scale-110 transition-transform" 
                      onClick={() => handleDeleteCategory(cat.id)}
                    />
                  </div>
                ))}
              </div>

              <div className="add-category">
                <Input
                  placeholder="New category name..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                />
                <Button onClick={handleCreateCategory}>Add Category</Button>
              </div>

              <Button
                onClick={() => setShowCategoryModal(false)}
                variant="outline"
                className="w-full mt-4"
              >
                Done
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminContentManager;
