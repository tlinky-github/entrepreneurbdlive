// AdminKnowledgeHub.jsx — Admin page for Knowledge Articles, Guides, FAQs, Glossary
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit2, Save, X, BookOpen, HelpCircle, FileText, BookA,
  ChevronDown, ChevronUp, Loader2, Search, MoreVertical, Eye, Pencil, Filter, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { contentAPI, guidesAPI, faqCategoriesAPI, glossaryAPI } from '../../lib/api';
import { useOutletContext } from 'react-router-dom';
import ImportDrawer from './ImportDrawer';
import BulkEditModal from './BulkEditModal';
import LinkDialog from './LinkDialog';

const AdminKnowledgeHub = () => {
  const navigate = useNavigate();
  const { refreshStats } = useOutletContext();
  const [activeTab, setActiveTab] = useState('articles');

  return (
    <div data-testid="admin-knowledge-hub">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Knowledge Hub</h1>
          <p className="text-stone-500">Manage knowledge articles, guides, FAQs, and glossary terms</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="articles"><BookOpen className="w-4 h-4 mr-1" /> Articles</TabsTrigger>
          <TabsTrigger value="guides"><FileText className="w-4 h-4 mr-1" /> Guides</TabsTrigger>
          <TabsTrigger value="faqs"><HelpCircle className="w-4 h-4 mr-1" /> FAQs</TabsTrigger>
          <TabsTrigger value="glossary"><BookA className="w-4 h-4 mr-1" /> Glossary</TabsTrigger>
        </TabsList>

        <TabsContent value="articles"><KnowledgeArticlesTab navigate={navigate} /></TabsContent>
        <TabsContent value="guides"><GuidesTab /></TabsContent>
        <TabsContent value="faqs"><FAQsTab /></TabsContent>
        <TabsContent value="glossary"><GlossaryTab /></TabsContent>
      </Tabs>
    </div>
  );
};

// === Knowledge Articles Tab ===
const KnowledgeArticlesTab = ({ navigate }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contentAPI.list('knowledge');
      setArticles(res.data || []);
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Reset page and selection when search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await contentAPI.delete('knowledge', deleteId);
      toast.success('Article deleted');
      loadArticles();
    } catch (error) {
      toast.error('Failed to delete article');
    } finally {
      setDeleteId(null);
    }
  };

  const openBulkEdit = () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one article first');
      return;
    }
    setBulkEditOpen(true);
  };

  // Filter articles based on search
  const filteredArticles = articles.filter(article => 
    article.title?.toLowerCase().includes(search.toLowerCase()) || 
    article.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = filteredArticles.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const range = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
        pages.push(i);
      } else if (i === 2 && currentPage - range > 2) {
        pages.push('...');
      } else if (i === totalPages - 1 && currentPage + range < totalPages - 1) {
        pages.push('...');
      }
    }
    return pages.filter((item, index) => pages.indexOf(item) === index);
  };

  const pageIds = paginatedArticles.map(a => a.id);
  const isAllSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
  
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div>
      {/* Search Input Card */}
      <Card className="mb-6 border-stone-200">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions & Pagination controls */}
      {!loading && filteredArticles.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openBulkEdit}
              disabled={selectedIds.length === 0}
              className="border-stone-200 bg-white text-sm font-semibold"
            >
              Bulk Edit{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </Button>
            {selectedIds.length > 0 && (
              <span className="text-sm text-stone-500 font-medium">
                {selectedIds.length} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Show:</span>
            <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[80px] bg-white">
                <SelectValue placeholder="20" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-stone-500">per page</span>
          </div>
        </div>
      )}

      {/* Table Card */}
      <Card className="border-stone-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-stone-200 bg-stone-50/50">
          <CardTitle className="text-lg">Knowledge Articles</CardTitle>
          <div className="flex items-center gap-2">
            <ImportDrawer contentType="knowledge" onImported={loadArticles} />
            <Button className="bg-emerald-900 text-white hover:bg-emerald-800" onClick={() => navigate('/admin/content-editor?type=knowledge')}>
              <Plus className="w-4 h-4 mr-2" /> New Article
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-lg text-stone-500">No knowledge articles found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 px-4">
                      <input 
                        type="checkbox" 
                        checked={isAllSelected} 
                        onChange={handleSelectAll}
                        className="rounded border-stone-300 text-emerald-900 focus:ring-emerald-800 h-4 w-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Article Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="px-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(article.id)} 
                          onChange={() => handleSelectRow(article.id)}
                          className="rounded border-stone-300 text-emerald-900 focus:ring-emerald-800 h-4 w-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-stone-900">
                        {article.title}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        /{article.slug}
                      </TableCell>
                      <TableCell>
                        <Badge className={article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {article.status || 'draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/content-editor?type=knowledge&id=${article.id}`)} className="flex items-center gap-2">
                              <Pencil className="w-4 h-4" />
                              Edit Article
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/knowledge/${article.slug}`, '_blank')} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View Public
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(article.id)} className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-stone-50/50 border-t border-stone-200">
                  <div className="text-sm text-stone-500">
                    Showing <span className="font-semibold text-stone-700">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-stone-700">{Math.min(endIndex, totalItems)}</span> of{' '}
                    <span className="font-semibold text-stone-700">{totalItems}</span> articles
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="border-stone-200 bg-white"
                    >
                      Previous
                    </Button>
                    
                    {getPageNumbers().map((page, idx) => {
                      if (page === '...') {
                        return <span key={`ellipsis-${idx}`} className="px-2 text-stone-400">...</span>;
                      }
                      const isActive = page === currentPage;
                      return (
                        <Button
                          key={page}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={isActive ? 'bg-emerald-900 text-white hover:bg-emerald-800' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'}
                        >
                          {page}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="border-stone-200 bg-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the knowledge article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkEditModal
        isOpen={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        selectedIds={selectedIds}
        contentType="knowledge"
        onSuccess={() => {
          setSelectedIds([]);
          loadArticles();
        }}
      />
    </div>
  );
};

// === Guides Tab ===
const GuidesTab = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', icon: '📘', order: 1, steps: [{ heading: '', text: '' }], status: 'published' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await guidesAPI.list();
      const items = (res.data || []).map((g, idx) => ({
        ...g,
        order: Number(g.order ?? g.position ?? (idx + 1))
      }));
      items.sort((a, b) => a.order - b.order);
      setGuides(items);
    } catch (err) { console.error('Guides error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ title: '', description: '', icon: '📘', order: guides.length + 1, steps: [{ heading: '', text: '' }], status: 'published' });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        order: Number(form.order || (editId ? 1 : guides.length + 1))
      };
      if (editId) {
        await guidesAPI.update(editId, payload);
        toast.success('Guide updated');
      } else {
        await guidesAPI.create(payload);
        toast.success('Guide created');
      }
      resetForm();
      load();
    } catch (err) { toast.error('Failed to save guide'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await guidesAPI.delete(deleteId);
      toast.success('Guide deleted');
      load();
    } catch (err) { toast.error('Failed to delete'); }
    finally { setDeleteId(null); }
  };

  const moveGuide = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= guides.length) return;

    const g1 = guides[index];
    const g2 = guides[targetIndex];
    const order1 = Number(g1.order || (index + 1));
    const order2 = Number(g2.order || (targetIndex + 1));

    try {
      await guidesAPI.update(g1.id, { order: order2 });
      await guidesAPI.update(g2.id, { order: order1 });
      toast.success('Guide position updated');
      load();
    } catch (err) {
      toast.error('Failed to update position');
    }
  };

  const moveStep = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= form.steps.length) return;
    const newSteps = [...form.steps];
    const [moved] = newSteps.splice(index, 1);
    newSteps.splice(targetIndex, 0, moved);
    setForm(f => ({ ...f, steps: newSteps }));
  };

  return (
    <>
      {/* Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">{editId ? 'Edit Guide' : 'Add New Guide'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-stone-500">Title</label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Guide title" />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-500">Icon (Emoji or Lucide)</label>
              <Input 
                value={form.icon} 
                onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} 
                placeholder="e.g. 📘 or Lightbulb" 
                className="text-sm" 
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-500">Position / Order</label>
              <Input type="number" min="1" value={form.order || 1} onChange={(e) => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} className="w-full" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-500">Description</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" className="w-full p-2 border rounded text-sm" rows={2} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold uppercase text-stone-500">Steps (In Order)</label>
              <Button size="sm" variant="outline" onClick={() => setForm(f => ({ ...f, steps: [...f.steps, { heading: '', text: '' }] }))}>
                <Plus className="w-3 h-3 mr-1" /> Add Step
              </Button>
            </div>
            {form.steps.map((step, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <span className="text-xs font-bold text-stone-400 min-w-[20px]">{i + 1}</span>
                <Input value={step.heading} onChange={(e) => { const s = [...form.steps]; s[i].heading = e.target.value; setForm(f => ({ ...f, steps: s })); }} placeholder={`Step ${i + 1} heading`} className="flex-1" />
                <Input value={step.text} onChange={(e) => { const s = [...form.steps]; s[i].text = e.target.value; setForm(f => ({ ...f, steps: s })); }} placeholder="Details..." className="flex-[2]" />
                
                <div className="flex items-center gap-0.5">
                  <Button size="sm" type="button" variant="ghost" disabled={i === 0} onClick={() => moveStep(i, -1)} className="h-7 w-7 p-0">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" type="button" variant="ghost" disabled={i === form.steps.length - 1} onClick={() => moveStep(i, 1)} className="h-7 w-7 p-0">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {form.steps.length > 1 && (
                  <Button size="sm" type="button" variant="ghost" onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))} className="text-red-500 h-7 w-7 p-0"><X className="w-3.5 h-3.5" /></Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-900 hover:bg-emerald-800">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editId ? 'Update' : 'Create'} Guide
            </Button>
            {editId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader><CardTitle>All Guides ({guides.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-20" /> : guides.length === 0 ? (
            <p className="text-center text-stone-500 py-8">No guides yet</p>
          ) : (
            <div className="space-y-2">
              {guides.map((g, idx) => (
                <div key={g.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100 hover:border-stone-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                      #{g.order || (idx + 1)}
                    </span>
                    <div>
                      <p className="font-medium text-stone-900">{g.icon} {g.title}</p>
                      <p className="text-xs text-stone-500">{(g.steps?.length || g.content?.length || 0)} steps</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center mr-2 bg-white rounded border border-stone-200">
                      <Button size="sm" type="button" variant="ghost" disabled={idx === 0} onClick={() => moveGuide(idx, -1)} className="h-7 w-7 p-0" title="Move Up">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" type="button" variant="ghost" disabled={idx === guides.length - 1} onClick={() => moveGuide(idx, 1)} className="h-7 w-7 p-0" title="Move Down">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setEditId(g.id); setForm({ ...g, order: g.order || (idx + 1) }); }}><Edit2 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteId(g.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Guide?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// === FAQs Tab ===
const FAQsTab = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '❓', order: 1, questions: [{ q: '', a: '' }], status: 'published' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await faqCategoriesAPI.list();
      const items = (res.data || []).map((cat, idx) => ({
        ...cat,
        order: Number(cat.order ?? cat.position ?? (idx + 1))
      }));
      items.sort((a, b) => a.order - b.order);
      setCategories(items);
    } catch (err) { console.error('FAQs error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm({ name: '', icon: '❓', order: categories.length + 1, questions: [{ q: '', a: '' }], status: 'published' }); setEditId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Category name required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        order: Number(form.order || (editId ? 1 : categories.length + 1))
      };
      if (editId) { await faqCategoriesAPI.update(editId, payload); toast.success('FAQ category updated'); }
      else { await faqCategoriesAPI.create(payload); toast.success('FAQ category created'); }
      resetForm(); load();
    } catch (err) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await faqCategoriesAPI.delete(deleteId); toast.success('Deleted'); load(); }
    catch (err) { toast.error('Failed to delete'); }
    finally { setDeleteId(null); }
  };

  const moveCategory = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const cat1 = categories[index];
    const cat2 = categories[targetIndex];
    const order1 = Number(cat1.order || (index + 1));
    const order2 = Number(cat2.order || (targetIndex + 1));

    try {
      await faqCategoriesAPI.update(cat1.id, { order: order2 });
      await faqCategoriesAPI.update(cat2.id, { order: order1 });
      toast.success('Position updated');
      load();
    } catch (err) {
      toast.error('Failed to update position');
    }
  };

  const moveQuestion = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= form.questions.length) return;
    const newQs = [...form.questions];
    const [moved] = newQs.splice(index, 1);
    newQs.splice(targetIndex, 0, moved);
    setForm(f => ({ ...f, questions: newQs }));
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">{editId ? 'Edit FAQ Category' : 'Add FAQ Category'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-stone-500">Category Name</label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Getting Started" />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-500">Icon (emoji)</label>
              <Input value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="❓" className="w-full" />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-500">Position / Order</label>
              <Input type="number" min="1" value={form.order || 1} onChange={(e) => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} className="w-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold uppercase text-stone-500">Questions (In Order)</label>
              <Button size="sm" variant="outline" onClick={() => setForm(f => ({ ...f, questions: [...f.questions, { q: '', a: '' }] }))}>
                <Plus className="w-3 h-3 mr-1" /> Add Q&A
              </Button>
            </div>
            {form.questions.map((qa, i) => (
              <div key={i} className="mb-3 p-3 bg-stone-50 rounded-lg space-y-2 border border-stone-200">
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-stone-400 min-w-[28px]">Q{i + 1}</span>
                  <Input value={qa.q} onChange={(e) => { const qs = [...form.questions]; qs[i].q = e.target.value; setForm(f => ({ ...f, questions: qs })); }} placeholder="Question" className="flex-1" />
                  
                  <div className="flex items-center gap-0.5">
                    <Button size="sm" type="button" variant="ghost" disabled={i === 0} onClick={() => moveQuestion(i, -1)} className="h-7 w-7 p-0">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" type="button" variant="ghost" disabled={i === form.questions.length - 1} onClick={() => moveQuestion(i, 1)} className="h-7 w-7 p-0">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {form.questions.length > 1 && (
                    <Button size="sm" type="button" variant="ghost" onClick={() => setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }))} className="text-red-500 h-7 w-7 p-0"><X className="w-3.5 h-3.5" /></Button>
                  )}
                </div>
                <textarea value={qa.a} onChange={(e) => { const qs = [...form.questions]; qs[i].a = e.target.value; setForm(f => ({ ...f, questions: qs })); }} placeholder="Answer" className="w-full p-2 border rounded text-sm bg-white" rows={2} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-900 hover:bg-emerald-800">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editId ? 'Update' : 'Create'}
            </Button>
            {editId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>FAQ Categories ({categories.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-20" /> : categories.length === 0 ? (
            <p className="text-center text-stone-500 py-8">No FAQ categories yet</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100 hover:border-stone-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                      #{cat.order || (idx + 1)}
                    </span>
                    <div>
                      <p className="font-medium text-stone-900">{cat.icon} {cat.name}</p>
                      <p className="text-xs text-stone-500">{cat.questions?.length || 0} questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center mr-2 bg-white rounded border border-stone-200">
                      <Button size="sm" type="button" variant="ghost" disabled={idx === 0} onClick={() => moveCategory(idx, -1)} className="h-7 w-7 p-0" title="Move Up">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" type="button" variant="ghost" disabled={idx === categories.length - 1} onClick={() => moveCategory(idx, 1)} className="h-7 w-7 p-0" title="Move Down">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setEditId(cat.id); setForm({ ...cat, order: cat.order || (idx + 1) }); }}><Edit2 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteId(cat.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete FAQ Category?</AlertDialogTitle><AlertDialogDescription>All questions in this category will be deleted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// === Glossary Tab ===
const GlossaryTab = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [form, setForm] = useState({ term: '', definition: '', url: '', target: '', rel: '', status: 'published' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await glossaryAPI.list();
      setTerms(res.data || []);
    } catch (err) { console.error('Glossary error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm({ term: '', definition: '', url: '', target: '', rel: '', status: 'published' }); setEditId(null); };

  const handleSave = async () => {
    if (!form.term.trim()) { toast.error('Term required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        link_url: form.url || form.link_url || ''
      };
      if (editId) { await glossaryAPI.update(editId, payload); toast.success('Term updated'); }
      else { await glossaryAPI.create(payload); toast.success('Term created'); }
      resetForm(); load();
    } catch (err) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await glossaryAPI.delete(deleteId); toast.success('Deleted'); load(); }
    catch (err) { toast.error('Failed to delete'); }
    finally { setDeleteId(null); }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">{editId ? 'Edit Term' : 'Add Glossary Term'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-stone-500">Term</label>
              <Button type="button" variant="outline" size="sm" onClick={() => setLinkDialogOpen(true)} className="h-7 text-xs border-stone-200">
                <LinkIcon className="w-3 h-3 mr-1 text-emerald-700" />
                {form.url ? 'Edit Link' : 'Add Link'}
              </Button>
            </div>
            <Input value={form.term} onChange={(e) => setForm(f => ({ ...f, term: e.target.value }))} placeholder="e.g. Venture Capital" />
            {form.url && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 font-medium">
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                  {form.url}
                  <button type="button" onClick={() => setForm(f => ({ ...f, url: '', link_url: '', target: '', rel: '' }))} className="ml-1 text-emerald-600 hover:text-emerald-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-500">Definition</label>
            <textarea value={form.definition} onChange={(e) => setForm(f => ({ ...f, definition: e.target.value }))} placeholder="Clear, concise definition..." className="w-full p-2 border rounded text-sm" rows={3} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-900 hover:bg-emerald-800">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editId ? 'Update' : 'Add'} Term
            </Button>
            {editId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Glossary Terms ({terms.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-20" /> : terms.length === 0 ? (
            <p className="text-center text-stone-500 py-8">No glossary terms yet</p>
          ) : (
            <div className="space-y-2">
              {terms.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-stone-900">{t.term}</p>
                      {(t.url || t.link_url || t.href) && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                          <ExternalLink className="w-2.5 h-2.5" />
                          link
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 truncate">{t.definition}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditId(t.id); setForm({ ...t, url: t.url || t.link_url || t.href || '' }); }}><Edit2 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteId(t.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        initialData={{ href: form.url || form.link_url || '', target: form.target, rel: form.rel }}
        onApply={({ href, target, rel }) => {
          setForm(f => ({ ...f, url: href, link_url: href, target: target || '_blank', rel: rel || 'noopener noreferrer' }));
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Term?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminKnowledgeHub;
