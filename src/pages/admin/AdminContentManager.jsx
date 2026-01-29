// src/pages/admin/AdminContentManager.jsx
// Unified Content Manager for Blog, Entrepreneurs, Directory, Knowledge Hub

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Eye, Settings, BookOpen, Users, MapPin, Lightbulb } from 'lucide-react';
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
import './AdminContentManager.css';

const AdminContentManager = () => {
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
      fields: ['first_name', 'last_name', 'bio', 'image', 'category_id', 'seo_title', 'seo_description']
    },
    directory: {
      icon: MapPin,
      label: 'Business Directory',
      route: '/directory',
      apiKey: 'listings',
      fields: ['company_name', 'description', 'location', 'category_id', 'seo_title', 'seo_description']
    },
    knowledge: {
      icon: Lightbulb,
      label: 'Knowledge Hub',
      route: '/knowledge',
      apiKey: 'resources',
      fields: ['title', 'description', 'content', 'category_id', 'file_url', 'seo_title', 'seo_description']
    }
  };

  const config = contentConfig[contentType];
  const ConfigIcon = config.icon;

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [contentType, search]);

  const loadItems = async () => {
    setLoading(true);
    try {
      // Mock data for demo - replace with actual API calls
      const mockData = {
        blog: [
          { id: 1, title: 'Getting Started with Entrepreneurship', slug: 'getting-started', category_id: 1, views: 234, status: 'published' },
          { id: 2, title: 'Marketing Tips for Startups', slug: 'marketing-tips', category_id: 2, views: 156, status: 'published' }
        ],
        entrepreneurs: [
          { id: 1, first_name: 'John', last_name: 'Doe', category_id: 1, status: 'active' },
          { id: 2, first_name: 'Jane', last_name: 'Smith', category_id: 2, status: 'active' }
        ],
        directory: [
          { id: 1, company_name: 'Tech Solutions Inc', location: 'New York', category_id: 1, status: 'active' },
          { id: 2, company_name: 'Digital Marketing Pro', location: 'San Francisco', category_id: 2, status: 'active' }
        ],
        knowledge: [
          { id: 1, title: 'Business Planning Guide', category_id: 1, views: 450, status: 'published' },
          { id: 2, title: 'Financial Literacy Handbook', category_id: 2, views: 320, status: 'published' }
        ]
      };

      setItems(mockData[contentType] || []);
    } catch (error) {
      toast.error('Failed to load items');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const mockCategories = [
        { id: 1, name: 'Technology', slug: 'technology' },
        { id: 2, name: 'Marketing', slug: 'marketing' },
        { id: 3, name: 'Finance', slug: 'finance' }
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Category name required');
      return;
    }
    try {
      // Mock: In real app, call API
      const newCat = {
        id: categories.length + 1,
        name: newCategory,
        slug: newCategory.toLowerCase().replace(/\s+/g, '-')
      };
      setCategories([...categories, newCat]);
      setNewCategory('');
      setShowCategoryModal(false);
      toast.success('Category created');
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      // Mock: In real app, call API
      setItems(items.filter(item => item.id !== deleteId));
      setDeleteId(null);
      toast.success('Item deleted');
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
                            <Eye 
                              size={18} 
                              className="icon-btn"
                              onClick={() => window.open(config.route)}
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
                    <Trash2 size={16} className="cursor-pointer text-red-500" />
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
