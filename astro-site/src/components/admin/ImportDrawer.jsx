import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, Play, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { contentAPI } from '../../lib/api';

// ─── Markdown Parser ──────────────────────────────────────────────────────────

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: text };
  const frontmatterRaw = match[1];
  const body = match[2].trim();
  const frontmatter = {};
  frontmatterRaw.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  });
  return { frontmatter, body };
}

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

function buildPayload(type, frontmatter, body) {
  const contentHtml = markdownToHtml(body);
  const base = {
    type,
    slug: frontmatter.slug || '',
    seo_title: frontmatter.title_tag || '',
    seo_description: frontmatter.meta_description || '',
    excerpt: frontmatter.short_bio || frontmatter.short_description || frontmatter.excerpt || '',
    content: contentHtml,
    content_html: contentHtml,
    status: 'draft',
    focus_keyword: frontmatter.keyword || '',
  };

  if (type === 'entrepreneurs') {
    return {
      ...base,
      title: frontmatter.full_name || '',
      name: frontmatter.full_name || '',
      designation: frontmatter.designation || '',
      company_name: frontmatter.company || '',
      city: frontmatter.city || '',
      startup_stage: frontmatter.stage ? frontmatter.stage.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      industry: frontmatter.industry || '',
      social_linkedin: frontmatter.linkedin || '',
      social_facebook: frontmatter.facebook || '',
      social_twitter: frontmatter.twitter || '',
      website: frontmatter.website || '',
      founded_year: frontmatter.founded || '',
      expertise: frontmatter.expertise || '',
      education: frontmatter.education || '',
    };
  }
  if (type === 'directory') {
    return {
      ...base,
      title: frontmatter.business_name || frontmatter.company || '',
      business_name: frontmatter.business_name || frontmatter.company || '',
      city: frontmatter.city || '',
      industry: frontmatter.industry || '',
      website: frontmatter.website || '',
      social_linkedin: frontmatter.linkedin || '',
      social_facebook: frontmatter.facebook || '',
      short_description: frontmatter.meta_description || '',
      listing_type: frontmatter.listing_type || 'startup',
    };
  }
  if (type === 'blog' || type === 'knowledge') {
    return {
      ...base,
      title: frontmatter.title || '',
    };
  }
  return base;
}

// ─── Sample templates ──────────────────────────────────────────────────────────

const TEMPLATES = {
  entrepreneurs: `---
full_name: Jane Doe
slug: jane-doe
designation: Co-Founder & CEO
company: ExampleCo
city: Dhaka
stage: Growth-stage
industry: FinTech
linkedin: https://linkedin.com/in/janedoe
facebook: https://facebook.com/janedoe
twitter: https://twitter.com/janedoe
website: https://exampleco.com
title_tag: "Jane Doe | ExampleCo Co-Founder & CEO | Entrepreneur BD"
meta_description: "Jane Doe co-founded ExampleCo, a fintech startup..."
short_bio: "Jane Doe is a fintech entrepreneur based in Dhaka..."
---

## About Jane Doe

More about Jane and her journey...
`,
  directory: `---
business_name: ExampleCo Ltd
slug: exampleco-ltd
listing_type: startup
city: Dhaka
industry: FinTech
website: https://exampleco.com
linkedin: https://linkedin.com/company/exampleco
facebook: https://facebook.com/exampleco
title_tag: "ExampleCo Ltd | FinTech Startup | Entrepreneur BD Directory"
meta_description: "ExampleCo Ltd is a Dhaka-based fintech startup..."
short_description: "ExampleCo Ltd is a fintech company focused on..."
---

## Services

- Digital payments
- SME lending
`,
  blog: `---
title: "My Blog Post Title"
slug: my-blog-post-title
title_tag: "My Blog Post Title | Entrepreneur BD"
meta_description: "A concise summary of this blog post for search engines..."
---

## Introduction

Your introduction paragraph here...

## Main Section

Content goes here...
`,
  knowledge: `---
title: "Knowledge Article Title"
slug: knowledge-article-title
title_tag: "Knowledge Article Title | Entrepreneur BD"
meta_description: "A summary of this knowledge article..."
---

## Overview

Your overview here...

## Details

More details...
`,
};

function downloadTemplate(type) {
  const content = TEMPLATES[type] || TEMPLATES.entrepreneurs;
  const filename = `template-${type}.md`;
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  if (status === 'pending')   return <span className="inline-flex items-center gap-1 text-sm text-stone-400"><AlertCircle className="w-3 h-3" /> Pending</span>;
  if (status === 'importing') return <span className="inline-flex items-center gap-1 text-sm text-blue-600"><Loader2 className="w-3 h-3 animate-spin" /> Importing…</span>;
  if (status === 'done')      return <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><CheckCircle className="w-3 h-3" /> Imported</span>;
  if (status === 'error')     return <span className="inline-flex items-center gap-1 text-sm text-red-500"><XCircle className="w-3 h-3" /> Failed</span>;
  if (status === 'skipped')   return <span className="inline-flex items-center gap-1 text-sm text-yellow-600"><AlertCircle className="w-3 h-3" /> Skipped</span>;
  return null;
};

// ─── ImportDrawer ─────────────────────────────────────────────────────────────
// Usage: <ImportDrawer contentType="entrepreneurs" onImported={loadProfiles} />

const ImportDrawer = ({ contentType, onImported }) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
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
      if (!file.name.match(/\.(md|markdown)$/i)) {
        toast.error(`${file.name} — not a .md file, skipped`);
        continue;
      }
      const text = await readFile(file);
      const { frontmatter, body } = parseFrontmatter(text);
      results.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        frontmatter,
        body,
        status: 'pending',
        error: null,
      });
    }
    if (results.length) setFiles(prev => [...prev, ...results]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [processFiles]);

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

  const importAll = async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (!pending.length) { toast.error('No pending files'); return; }

    setImporting(true);
    let imported = 0, failed = 0, skipped = 0;

    for (const file of pending) {
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'importing' } : f));
      try {
        const payload = buildPayload(contentType, file.frontmatter, file.body);
        if (!payload.title?.trim() || !payload.slug?.trim()) {
          throw new Error('Missing title or slug in frontmatter');
        }
        await contentAPI.create(payload);
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'done' } : f));
        imported++;
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', error: err.message } : f));
        failed++;
      }
    }

    setImporting(false);
    toast.success(`Import done: ${imported} imported, ${skipped} skipped, ${failed} failed`);
    if (imported > 0 && onImported) onImported();
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const labelMap = { entrepreneurs: 'Entrepreneur', directory: 'Business Listing', blog: 'Blog Post', knowledge: 'Knowledge Article' };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
      >
        <Upload className="w-4 h-4" />
        Import .md
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={() => !importing && setOpen(false)} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Import {labelMap[contentType]}s</h2>
            <p className="text-sm text-stone-400 mt-0.5">Drag & drop <code>.md</code> files — all saved as Draft</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadTemplate(contentType)}
              className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-emerald-700 transition-colors px-2 py-1 rounded border border-stone-200 hover:border-emerald-300"
            >
              <Download className="w-3 h-3" />
              Sample template
            </button>
            <button onClick={() => !importing && setOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`m-4 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-emerald-400 hover:bg-stone-50'
          }`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-2 ${dragging ? 'text-emerald-500' : 'text-stone-300'}`} />
          <p className="text-sm font-semibold text-stone-500">Drop <code>.md</code> files here or click to browse</p>
          <p className="text-sm text-stone-400 mt-1">Multiple files supported</p>
          <input ref={inputRef} type="file" accept=".md,.markdown" multiple onChange={(e) => { processFiles(Array.from(e.target.files)); e.target.value = ''; }} className="hidden" />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mx-4 mb-2 border border-stone-100 rounded-xl overflow-hidden flex-1 overflow-y-auto max-h-60">
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-stone-50 last:border-0 hover:bg-stone-50">
                <FileText className="w-4 h-4 text-stone-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-stone-700 truncate">{file.name}</span>
                    <StatusBadge status={file.status} />
                  </div>
                  <p className="text-sm text-stone-400 truncate">
                    {file.frontmatter?.full_name || file.frontmatter?.business_name || file.frontmatter?.title || '(no title in frontmatter)'}
                    {file.error && <span className="text-red-400 ml-1">— {file.error}</span>}
                  </p>
                </div>
                {file.status === 'pending' && (
                  <button onClick={() => removeFile(file.id)} className="text-stone-300 hover:text-red-400 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 gap-3">
          <button
            onClick={() => setFiles([])}
            disabled={importing}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Clear all
          </button>
          <button
            onClick={importAll}
            disabled={importing || pendingCount === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-900 text-white text-sm font-bold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
              : <><Play className="w-3.5 h-3.5" /> Import {pendingCount || ''} file{pendingCount !== 1 ? 's' : ''}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDrawer;
