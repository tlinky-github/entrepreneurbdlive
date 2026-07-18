import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, Download, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { contentAPI, categoryAPI, taxonomyAPI } from '../../lib/api';
import { serverTimestamp } from 'firebase/firestore';

// ─── Markdown Parser ─────────────────────────────────────────────────────────

function parseFrontmatter(text) {
  const normalizedText = text.replace(/\r\n/g, '\n');
  const match = normalizedText.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (match) {
    const frontmatterRaw = match[1];
    const body = match[2].trim();
    const frontmatter = {};

    frontmatterRaw.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parsed = trimmed.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
      if (!parsed) return;
      let value = parsed[2].trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[parsed[1]] = value;
    });

    return { frontmatter, body };
  }

  const lines = normalizedText.split('\n');
  const frontmatterLines = [];
  let bodyStartIndex = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      if (frontmatterLines.length > 0) {
        bodyStartIndex = i + 1;
        break;
      }
      continue;
    }

    const parsed = trimmed.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (!parsed) {
      if (frontmatterLines.length > 0) {
        bodyStartIndex = i;
      }
      break;
    }

    frontmatterLines.push(lines[i]);
  }

  const frontmatter = {};
  frontmatterLines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parsed = trimmed.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (!parsed) return;
    let value = parsed[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    frontmatter[parsed[1]] = value;
  });

  return { frontmatter, body: lines.slice(bodyStartIndex).join('\n').trim() };
}

// Convert markdown to basic HTML (headings, bold, links, paragraphs)
function markdownToHtml(md) {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .split(/\n\n+/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<h[1-6]>/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, ' ')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

function getFrontmatterValue(frontmatter, aliases) {
  for (const alias of aliases) {
    const value = frontmatter[alias];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function normalizeStartupStage(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Map markdown frontmatter to Firestore payload based on content type
function buildPayload(type, frontmatter, body) {
  const contentHtml = markdownToHtml(body);
  const focusKeyword = getFrontmatterValue(frontmatter, ['focus_keyword', 'focus-keyword', 'focusKeyword', 'keyword', 'seo_keyword', 'seoKeyword']);
  const startupStage = normalizeStartupStage(getFrontmatterValue(frontmatter, ['startup_stage', 'startup-stage', 'startupStage', 'stage', 'stage_name']));

  if (type === 'entrepreneurs') {
    return {
      type,
      title: frontmatter.full_name || '',
      name: frontmatter.full_name || '',
      slug: frontmatter.slug || frontmatter.full_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
      designation: frontmatter.designation || '',
      company_name: getFrontmatterValue(frontmatter, ['company_name', 'company', 'business_name']),
      city: frontmatter.city || '',
      startup_stage: startupStage,
      industry: frontmatter.industry || '',
      social_linkedin: frontmatter.linkedin || '',
      social_facebook: frontmatter.facebook || '',
      seo_title: frontmatter.title_tag || frontmatter.full_name || '',
      seo_description: frontmatter.meta_description || '',
      excerpt: frontmatter.meta_description || '',
      content: contentHtml,
      content_html: contentHtml,
      status: 'draft',
      category: frontmatter.industry || '',
      focus_keyword: focusKeyword,
    };
  }

  if (type === 'directory') {
    return {
      type,
      title: getFrontmatterValue(frontmatter, ['business_name', 'company_name', 'company', 'full_name']) || '',
      business_name: getFrontmatterValue(frontmatter, ['business_name', 'company_name', 'company']) || '',
      slug: frontmatter.slug || (getFrontmatterValue(frontmatter, ['business_name', 'company_name', 'company']) || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
      designation: frontmatter.designation || '',
      city: frontmatter.city || '',
      industry: frontmatter.industry || '',
      website: frontmatter.website || '',
      social_linkedin: frontmatter.linkedin || '',
      social_facebook: frontmatter.facebook || '',
      seo_title: frontmatter.title_tag || frontmatter.business_name || '',
      seo_description: frontmatter.meta_description || '',
      excerpt: frontmatter.meta_description || '',
      short_description: frontmatter.meta_description || '',
      content: contentHtml,
      content_html: contentHtml,
      status: 'draft',
      startup_stage: startupStage,
      focus_keyword: focusKeyword,
    };
  }

  // blog / knowledge
  return {
    type,
    title: frontmatter.title || frontmatter.full_name || '',
    slug: frontmatter.slug || (frontmatter.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
    excerpt: frontmatter.meta_description || frontmatter.excerpt || '',
    seo_title: frontmatter.title_tag || frontmatter.title || '',
    seo_description: frontmatter.meta_description || '',
    content: contentHtml,
    content_html: contentHtml,
    status: 'draft',
    focus_keyword: focusKeyword,
  };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  if (status === 'pending') return <span className="inline-flex items-center gap-1 text-sm text-stone-400"><AlertCircle className="w-3 h-3" /> Pending</span>;
  if (status === 'importing') return <span className="inline-flex items-center gap-1 text-sm text-blue-600"><Loader2 className="w-3 h-3 animate-spin" /> Importing…</span>;
  if (status === 'done') return <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><CheckCircle className="w-3 h-3" /> Imported</span>;
  if (status === 'error') return <span className="inline-flex items-center gap-1 text-sm text-red-500"><XCircle className="w-3 h-3" /> Failed</span>;
  if (status === 'skipped') return <span className="inline-flex items-center gap-1 text-sm text-yellow-600"><AlertCircle className="w-3 h-3" /> Skipped (exists)</span>;
  return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────

const AdminImport = () => {
  const [contentType, setContentType] = useState('entrepreneurs');
  const [files, setFiles] = useState([]); // { name, text, frontmatter, body, status, error, id }
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef();

  const readFile = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsText(file, 'utf-8');
    });

  const processFiles = useCallback(async (rawFiles) => {
    const results = [];
    for (const file of rawFiles) {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
        toast.error(`${file.name} is not a markdown file — skipped`);
        continue;
      }
      const text = await readFile(file);
      const { frontmatter, body } = parseFrontmatter(text);
      results.push({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        text,
        frontmatter,
        body,
        status: 'pending',
        error: null,
      });
    }
    setFiles(prev => [...prev, ...results]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [processFiles]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));
  const clearAll = () => setFiles([]);

  const importAll = async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (!pending.length) { toast.error('No pending files to import'); return; }

    setImporting(true);
    let imported = 0, failed = 0, skipped = 0;

    for (const file of pending) {
      // Mark as importing
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'importing' } : f));

      try {
        const payload = buildPayload(contentType, file.frontmatter, file.body);

        if (!payload.title || !payload.slug) {
          throw new Error('Missing title or slug in frontmatter');
        }

        // Check for duplicate slug
        const collectionMap = { blog: 'posts', entrepreneurs: 'profiles', directory: 'listings', knowledge: 'resources' };
        const existing = await contentAPI.getBySlug?.(contentType, payload.slug).catch(() => null);

        if (existing?.data) {
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'skipped' } : f));
          skipped++;
          continue;
        }

        await contentAPI.create(payload);
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'done' } : f));
        imported++;
      } catch (err) {
        console.error('Import error:', err);
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', error: err.message } : f));
        failed++;
      }
    }

    setImporting(false);
    toast.success(`Import complete: ${imported} imported, ${skipped} skipped, ${failed} failed`);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Import Content</h1>
          <p className="text-sm text-stone-500 mt-1">
            Bulk import profiles and content from <code className="bg-stone-100 px-1 rounded text-sm">.md</code> markdown files with frontmatter
          </p>
        </div>
        {files.length > 0 && (
          <button onClick={clearAll} className="text-sm text-stone-400 hover:text-red-500 flex items-center gap-1 transition-colors">
            <Trash2 className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Content Type Selector */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
        <label className="text-sm font-semibold text-stone-700">Import as</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: 'entrepreneurs', label: 'Entrepreneurs', emoji: '👤' },
            { value: 'directory', label: 'Directory', emoji: '🏢' },
            { value: 'blog', label: 'Blog Posts', emoji: '📝' },
            { value: 'knowledge', label: 'Knowledge', emoji: '📚' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setContentType(opt.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                contentType === opt.value
                  ? 'border-emerald-900 bg-emerald-50 text-emerald-900'
                  : 'border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              <span className="text-xl">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Field Mapping Preview */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-3">Expected frontmatter fields</p>
        <div className="flex flex-wrap gap-2">
          {contentType === 'entrepreneurs' && ['full_name', 'slug', 'designation', 'company', 'city', 'stage', 'industry', 'linkedin', 'facebook', 'title_tag', 'meta_description'].map(f => (
            <code key={f} className="text-sm bg-white border border-stone-200 rounded px-2 py-0.5 text-emerald-700">{f}</code>
          ))}
          {contentType === 'directory' && ['business_name', 'slug', 'city', 'industry', 'website', 'linkedin', 'title_tag', 'meta_description'].map(f => (
            <code key={f} className="text-sm bg-white border border-stone-200 rounded px-2 py-0.5 text-emerald-700">{f}</code>
          ))}
          {(contentType === 'blog' || contentType === 'knowledge') && ['title', 'slug', 'excerpt', 'title_tag', 'meta_description'].map(f => (
            <code key={f} className="text-sm bg-white border border-stone-200 rounded px-2 py-0.5 text-emerald-700">{f}</code>
          ))}
        </div>
        <p className="text-sm text-stone-400 mt-3">
          The markdown body (below <code>---</code>) will be converted to HTML and saved as content. All imports start as <strong>Draft</strong>.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-stone-300 hover:border-emerald-400 hover:bg-stone-50'
        }`}
      >
        <Upload className={`w-10 h-10 mx-auto mb-3 ${dragging ? 'text-emerald-500' : 'text-stone-300'}`} />
        <p className="font-semibold text-stone-600 mb-1">Drop <code>.md</code> files here</p>
        <p className="text-sm text-stone-400">or click to browse — you can select multiple files at once</p>
        <input
          ref={inputRef}
          type="file"
          accept=".md,.markdown"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-700">
              {files.length} file{files.length !== 1 ? 's' : ''} queued
              {doneCount > 0 && <span className="ml-2 text-emerald-600">· {doneCount} imported</span>}
            </span>
            <button
              onClick={importAll}
              disabled={importing || pendingCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900 text-white text-sm font-bold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                : <><Play className="w-4 h-4" /> Import {pendingCount} file{pendingCount !== 1 ? 's' : ''}</>
              }
            </button>
          </div>

          <div className="divide-y divide-stone-100 max-h-[50vh] overflow-y-auto">
            {files.map(file => (
              <div key={file.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-stone-50">
                <FileText className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-stone-800 truncate">{file.name}</span>
                    <StatusBadge status={file.status} />
                  </div>
                  {file.frontmatter && (
                    <p className="text-sm text-stone-400 mt-0.5 truncate">
                      {file.frontmatter.full_name || file.frontmatter.business_name || file.frontmatter.title || '—'}
                      {file.frontmatter.designation && ` · ${file.frontmatter.designation}`}
                      {file.frontmatter.company && ` @ ${file.frontmatter.company}`}
                    </p>
                  )}
                  {file.error && (
                    <p className="text-sm text-red-500 mt-0.5">{file.error}</p>
                  )}
                </div>
                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-700">
        <p className="font-semibold mb-2">How it works</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-600">
          <li>Select the content type above (Entrepreneurs, Directory, Blog, or Knowledge)</li>
          <li>Drop one or more <code className="bg-blue-100 px-1 rounded">.md</code> files into the zone</li>
          <li>Each file must start with a <code className="bg-blue-100 px-1 rounded">---</code> frontmatter block</li>
          <li>Click <strong>Import</strong> — all files are saved to Firestore as <strong>Draft</strong></li>
          <li>Open each draft in the Content Editor to review and publish</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminImport;
