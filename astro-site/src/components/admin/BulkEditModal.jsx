import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  CheckSquare, X, Loader2, ChevronDown,
  FileText, Globe, Tag, Building2, User, Layers, CalendarClock, Trash2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  postAPI, profileAPI, listingAPI, contentAPI,
  blogCategoryAPI, industryAPI, categoryAPI, authorAPI
} from '../../lib/api';

// Which fields are available for each content type
const FIELD_CONFIG = {
  blog: {
    status: true,
    category: true,    // blog_categories
    author: true,
    industry: false,
    startupStage: false,
    scheduledAt: true,
  },
  knowledge: {
    status: true,
    category: true,
    author: true,
    industry: false,
    startupStage: false,
    scheduledAt: true,
  },
  entrepreneurs: {
    status: true,
    category: false,
    author: false,
    industry: true,
    startupStage: true,
    scheduledAt: false,
  },
  directory: {
    status: true,
    category: true,   // categories
    author: false,
    industry: true,
    startupStage: true,
    scheduledAt: false,
  },
};

const STARTUP_STAGES = [
  'Idea',
  'MVP',
  'Seed',
  'Early Stage',
  'Growth',
  'Scale-up',
  'Established',
  'Exit / Acquired',
];

const apiForType = (contentType) => {
  if (contentType === 'blog') return postAPI;
  if (contentType === 'knowledge') return {
    bulkUpdate: (ids, payload) => contentAPI.bulkUpdate('knowledge', ids, payload),
    delete: (id) => contentAPI.delete('knowledge', id)
  };
  if (contentType === 'entrepreneurs') return profileAPI;
  if (contentType === 'directory') return listingAPI;
  return postAPI;
};

/**
 * BulkEditModal
 *
 * Props:
 *   isOpen       – boolean
 *   onClose      – () => void
 *   selectedIds  – string[]
 *   contentType  – 'blog' | 'knowledge' | 'entrepreneurs' | 'directory'
 *   onSuccess    – () => void  (reload list after update)
 *   onBulkDelete – () => void  (triggered for delete; parent shows its own confirm dialog)
 */
const BulkEditModal = ({ isOpen, onClose, selectedIds, contentType, onSuccess, onBulkDelete }) => {
  const config = FIELD_CONFIG[contentType] || FIELD_CONFIG.blog;

  // Field toggles – each one is "active" only when its checkbox is checked
  const [fields, setFields] = useState({
    status: { active: false, value: '' },
    category: { active: false, value: '', id: '', name: '' },
    author: { active: false, value: '', id: '', name: '' },
    industry: { active: false, value: '' },
    startupStage: { active: false, value: '' },
    scheduledAt: { active: false, value: '' },
  });

  // Remote data for dropdowns
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load taxonomies when modal opens
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const [catRes, authRes, indRes] = await Promise.all([
          config.category
            ? (contentType === 'directory' ? categoryAPI.list() : blogCategoryAPI.list())
            : Promise.resolve({ data: [] }),
          config.author ? authorAPI.list() : Promise.resolve({ data: [] }),
          config.industry ? industryAPI.list() : Promise.resolve({ data: [] }),
        ]);
        setCategories(catRes.data || []);
        setAuthors(authRes.data || []);
        setIndustries(indRes.data || []);
      } catch (err) {
        console.error('BulkEditModal load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, contentType]);

  const setFieldActive = (key, active) =>
    setFields(prev => ({ ...prev, [key]: { ...prev[key], active } }));

  const setFieldValue = (key, patch) =>
    setFields(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const resetFields = () => {
    setFields({
      status: { active: false, value: '' },
      category: { active: false, value: '', id: '', name: '' },
      author: { active: false, value: '', id: '', name: '' },
      industry: { active: false, value: '' },
      startupStage: { active: false, value: '' },
      scheduledAt: { active: false, value: '' },
    });
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const buildUpdatePayload = () => {
    const payload = {};
    if (fields.status.active && fields.status.value)
      payload.status = fields.status.value;

    if (fields.category.active && fields.category.id) {
      payload.category_id = fields.category.id;
      payload.category_name = fields.category.name;
    }

    if (fields.author.active && fields.author.id) {
      payload.author_id = fields.author.id;
      payload.author_name = fields.author.name;
    }

    if (fields.industry.active && fields.industry.value)
      payload.industry = fields.industry.value;

    if (fields.startupStage.active && fields.startupStage.value)
      payload.startup_stage = fields.startupStage.value;

    if (fields.scheduledAt.active && fields.scheduledAt.value) {
      payload.scheduled_at = fields.scheduledAt.value;
      // If scheduling, ensure status is 'scheduled' unless user also changed status
      if (!fields.status.active)
        payload.status = 'scheduled';
    }

    return payload;
  };

  const handleApply = async () => {
    if (selectedIds.length === 0) {
      toast.error('No items selected');
      return;
    }
    const payload = buildUpdatePayload();
    if (Object.keys(payload).length === 0) {
      toast.error('Please enable and fill at least one field to update');
      return;
    }
    setProcessing(true);
    try {
      const api = apiForType(contentType);
      await api.bulkUpdate(selectedIds, payload);
      toast.success(`Updated ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''} successfully`);
      resetFields();
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('BulkEditModal apply error:', err);
      toast.error('Failed to update some items');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      const api = apiForType(contentType);
      await Promise.all(selectedIds.map(id => api.delete(id)));
      toast.success(`Deleted ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''}`);
      setDeleteDialogOpen(false);
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('BulkEditModal delete error:', err);
      toast.error('Failed to delete some items');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const enabledCount = Object.values(fields).filter(f => f.active).length;

  return (
    <>
      {/* Slide-in panel from bottom */}
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm transition-opacity" onClick={handleClose} />
        <div className="relative w-full max-w-5xl mx-4 mb-4 bg-white rounded-2xl shadow-2xl border border-stone-200 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center">
                <CheckSquare size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Bulk Edit
                  <Badge className="ml-2 bg-emerald-100 text-emerald-800 border-none text-xs">
                    {selectedIds.length} selected
                  </Badge>
                </h3>
                <p className="text-[11px] text-stone-400 font-medium">
                  {enabledCount === 0 ? 'Enable fields below to update' : `${enabledCount} field${enabledCount !== 1 ? 's' : ''} will be updated`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Fields grid */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-stone-400" />
            </div>
          ) : (
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

              {/* STATUS */}
              {config.status && (
                <FieldToggle
                  icon={<Globe size={13} />}
                  label="Status"
                  active={fields.status.active}
                  onToggle={v => setFieldActive('status', v)}
                >
                  <select
                    value={fields.status.value}
                    onChange={e => setFieldValue('status', { value: e.target.value })}
                    className="w-full text-xs h-8 border border-stone-200 rounded bg-white px-2 focus:outline-none focus:ring-1 focus:ring-emerald-800 font-medium"
                    disabled={!fields.status.active}
                  >
                    <option value="">— pick status —</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </FieldToggle>
              )}

              {/* CATEGORY */}
              {config.category && (
                <FieldToggle
                  icon={<Tag size={13} />}
                  label="Category"
                  active={fields.category.active}
                  onToggle={v => setFieldActive('category', v)}
                >
                  <select
                    value={fields.category.id}
                    onChange={e => {
                      const cat = categories.find(c => c.id === e.target.value);
                      setFieldValue('category', { id: e.target.value, name: cat?.name || '' });
                    }}
                    className="w-full text-xs h-8 border border-stone-200 rounded bg-white px-2 focus:outline-none focus:ring-1 focus:ring-emerald-800 font-medium"
                    disabled={!fields.category.active}
                  >
                    <option value="">— pick category —</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </FieldToggle>
              )}

              {/* AUTHOR */}
              {config.author && (
                <FieldToggle
                  icon={<User size={13} />}
                  label="Author"
                  active={fields.author.active}
                  onToggle={v => setFieldActive('author', v)}
                >
                  <select
                    value={fields.author.id}
                    onChange={e => {
                      const auth = authors.find(a => a.id === e.target.value);
                      setFieldValue('author', { id: e.target.value, name: auth?.name || '' });
                    }}
                    className="w-full text-xs h-8 border border-stone-200 rounded bg-white px-2 focus:outline-none focus:ring-1 focus:ring-emerald-800 font-medium"
                    disabled={!fields.author.active}
                  >
                    <option value="">— pick author —</option>
                    {authors.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </FieldToggle>
              )}

              {/* INDUSTRY */}
              {config.industry && (
                <FieldToggle
                  icon={<Building2 size={13} />}
                  label="Industry"
                  active={fields.industry.active}
                  onToggle={v => setFieldActive('industry', v)}
                >
                  <select
                    value={fields.industry.value}
                    onChange={e => setFieldValue('industry', { value: e.target.value })}
                    className="w-full text-xs h-8 border border-stone-200 rounded bg-white px-2 focus:outline-none focus:ring-1 focus:ring-emerald-800 font-medium"
                    disabled={!fields.industry.active}
                  >
                    <option value="">— pick industry —</option>
                    {industries.map(ind => (
                      <option key={ind.id} value={ind.name}>{ind.name}</option>
                    ))}
                  </select>
                </FieldToggle>
              )}

              {/* STARTUP STAGE */}
              {config.startupStage && (
                <FieldToggle
                  icon={<Layers size={13} />}
                  label="Startup Stage"
                  active={fields.startupStage.active}
                  onToggle={v => setFieldActive('startupStage', v)}
                >
                  <select
                    value={fields.startupStage.value}
                    onChange={e => setFieldValue('startupStage', { value: e.target.value })}
                    className="w-full text-xs h-8 border border-stone-200 rounded bg-white px-2 focus:outline-none focus:ring-1 focus:ring-emerald-800 font-medium"
                    disabled={!fields.startupStage.active}
                  >
                    <option value="">— pick stage —</option>
                    {STARTUP_STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </FieldToggle>
              )}

              {/* SCHEDULED AT */}
              {config.scheduledAt && (
                <FieldToggle
                  icon={<CalendarClock size={13} />}
                  label="Publish Schedule"
                  active={fields.scheduledAt.active}
                  onToggle={v => setFieldActive('scheduledAt', v)}
                >
                  <input
                    type="datetime-local"
                    value={fields.scheduledAt.value}
                    onChange={e => setFieldValue('scheduledAt', { value: e.target.value })}
                    className="w-full text-xs h-8 border border-stone-200 rounded bg-white px-2 focus:outline-none focus:ring-1 focus:ring-emerald-800 font-medium"
                    disabled={!fields.scheduledAt.active}
                  />
                </FieldToggle>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50/50 rounded-b-2xl">
            {/* Delete */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={processing}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-xs font-bold"
            >
              <Trash2 size={13} className="mr-1.5" />
              Delete {selectedIds.length} Selected
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="text-xs border-stone-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={processing || enabledCount === 0}
                className="text-xs bg-emerald-900 text-white hover:bg-emerald-800 font-bold min-w-[100px]"
              >
                {processing
                  ? <><Loader2 size={12} className="animate-spin mr-1.5" />Applying…</>
                  : `Apply to ${selectedIds.length} item${selectedIds.length !== 1 ? 's' : ''}`
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {selectedIds.length} selected item{selectedIds.length !== 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting…' : 'Delete All Selected'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Field toggle sub-component
const FieldToggle = ({ icon, label, active, onToggle, children }) => (
  <div className={`rounded-xl border transition-all duration-200 ${active ? 'border-emerald-300 bg-emerald-50/30 shadow-sm' : 'border-stone-200 bg-white'}`}>
    <label className="flex items-center gap-2.5 px-3 pt-3 pb-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={active}
        onChange={e => onToggle(e.target.checked)}
        className="w-3.5 h-3.5 rounded border-stone-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer"
      />
      <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${active ? 'text-emerald-800' : 'text-stone-500'}`}>
        {icon} {label}
      </span>
    </label>
    <div className="px-3 pb-3">
      {children}
    </div>
  </div>
);

export default BulkEditModal;
