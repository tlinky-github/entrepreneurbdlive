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
  ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { contentAPI, guidesAPI, faqCategoriesAPI, glossaryAPI } from '../../lib/api';
import { useOutletContext } from 'react-router-dom';

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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await contentAPI.list('knowledge');
        setArticles(res.data || []);
      } catch (err) {
        console.error('Error loading articles:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Knowledge Articles</CardTitle>
        <Button className="bg-emerald-900 hover:bg-emerald-800" onClick={() => navigate('/admin/content-editor?type=knowledge')}>
          <Plus className="w-4 h-4 mr-2" /> New Article
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : articles.length === 0 ? (
          <p className="text-center text-stone-500 py-8">No knowledge articles yet. Create one using the Content Editor.</p>
        ) : (
          <div className="space-y-2">
            {articles.map(article => (
              <div key={article.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <div>
                  <p className="font-medium text-stone-900">{article.title}</p>
                  <p className="text-xs text-stone-500">/{article.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={article.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}>{article.status || 'draft'}</Badge>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/content-editor?type=knowledge&id=${article.id}`)}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// === Guides Tab ===
const GuidesTab = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', icon: '📘', steps: [{ heading: '', text: '' }], status: 'published' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await guidesAPI.list();
      setGuides(res.data || []);
    } catch (err) { console.error('Guides error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ title: '', description: '', icon: '📘', steps: [{ heading: '', text: '' }], status: 'published' });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      if (editId) {
        await guidesAPI.update(editId, form);
        toast.success('Guide updated');
      } else {
        await guidesAPI.create(form);
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
      if (refreshStats) refreshStats();
      load();
    } catch (err) { toast.error('Failed to delete'); }
    finally { setDeleteId(null); }
  };

  return (
    <>
      {/* Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">{editId ? 'Edit Guide' : 'Add New Guide'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-500">Title</label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Guide title" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500">Icon (emoji)</label>
              <Input value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="📘" className="w-20" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500">Description</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" className="w-full p-2 border rounded text-sm" rows={2} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase text-stone-500">Steps</label>
              <Button size="sm" variant="outline" onClick={() => setForm(f => ({ ...f, steps: [...f.steps, { heading: '', text: '' }] }))}>
                <Plus className="w-3 h-3 mr-1" /> Add Step
              </Button>
            </div>
            {form.steps.map((step, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input value={step.heading} onChange={(e) => { const s = [...form.steps]; s[i].heading = e.target.value; setForm(f => ({ ...f, steps: s })); }} placeholder={`Step ${i + 1} heading`} className="flex-1" />
                <Input value={step.text} onChange={(e) => { const s = [...form.steps]; s[i].text = e.target.value; setForm(f => ({ ...f, steps: s })); }} placeholder="Details..." className="flex-[2]" />
                {form.steps.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))} className="text-red-500"><X className="w-3 h-3" /></Button>
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
              {guides.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <p className="font-medium">{g.icon} {g.title}</p>
                    <p className="text-xs text-stone-500">{g.steps?.length || 0} steps</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditId(g.id); setForm(g); }}><Edit2 className="w-3 h-3" /></Button>
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
  const [form, setForm] = useState({ name: '', icon: '❓', questions: [{ q: '', a: '' }], status: 'published' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await faqCategoriesAPI.list();
      setCategories(res.data || []);
    } catch (err) { console.error('FAQs error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm({ name: '', icon: '❓', questions: [{ q: '', a: '' }], status: 'published' }); setEditId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Category name required'); return; }
    setSaving(true);
    try {
      if (editId) { await faqCategoriesAPI.update(editId, form); toast.success('FAQ category updated'); }
      else { await faqCategoriesAPI.create(form); toast.success('FAQ category created'); }
      resetForm(); load();
    } catch (err) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await faqCategoriesAPI.delete(deleteId); toast.success('Deleted'); if (refreshStats) refreshStats(); load(); }
    catch (err) { toast.error('Failed to delete'); }
    finally { setDeleteId(null); }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">{editId ? 'Edit FAQ Category' : 'Add FAQ Category'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-500">Category Name</label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Getting Started" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500">Icon (emoji)</label>
              <Input value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="❓" className="w-20" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase text-stone-500">Questions</label>
              <Button size="sm" variant="outline" onClick={() => setForm(f => ({ ...f, questions: [...f.questions, { q: '', a: '' }] }))}>
                <Plus className="w-3 h-3 mr-1" /> Add Q&A
              </Button>
            </div>
            {form.questions.map((qa, i) => (
              <div key={i} className="mb-3 p-3 bg-stone-50 rounded-lg space-y-2">
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-stone-400">Q{i + 1}</span>
                  <Input value={qa.q} onChange={(e) => { const qs = [...form.questions]; qs[i].q = e.target.value; setForm(f => ({ ...f, questions: qs })); }} placeholder="Question" className="flex-1" />
                  {form.questions.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }))} className="text-red-500"><X className="w-3 h-3" /></Button>
                  )}
                </div>
                <textarea value={qa.a} onChange={(e) => { const qs = [...form.questions]; qs[i].a = e.target.value; setForm(f => ({ ...f, questions: qs })); }} placeholder="Answer" className="w-full p-2 border rounded text-sm" rows={2} />
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
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div>
                    <p className="font-medium">{cat.icon} {cat.name}</p>
                    <p className="text-xs text-stone-500">{cat.questions?.length || 0} questions</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditId(cat.id); setForm(cat); }}><Edit2 className="w-3 h-3" /></Button>
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
  const [form, setForm] = useState({ term: '', definition: '', status: 'published' });
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

  const resetForm = () => { setForm({ term: '', definition: '', status: 'published' }); setEditId(null); };

  const handleSave = async () => {
    if (!form.term.trim()) { toast.error('Term required'); return; }
    setSaving(true);
    try {
      if (editId) { await glossaryAPI.update(editId, form); toast.success('Term updated'); }
      else { await glossaryAPI.create(form); toast.success('Term created'); }
      resetForm(); load();
    } catch (err) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await glossaryAPI.delete(deleteId); toast.success('Deleted'); if (refreshStats) refreshStats(); load(); }
    catch (err) { toast.error('Failed to delete'); }
    finally { setDeleteId(null); }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">{editId ? 'Edit Term' : 'Add Glossary Term'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-500">Term</label>
            <Input value={form.term} onChange={(e) => setForm(f => ({ ...f, term: e.target.value }))} placeholder="e.g. Venture Capital" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500">Definition</label>
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
                    <p className="font-medium text-stone-900">{t.term}</p>
                    <p className="text-xs text-stone-500 truncate">{t.definition}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditId(t.id); setForm(t); }}><Edit2 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteId(t.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
