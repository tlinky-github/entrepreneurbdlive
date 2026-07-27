import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, Play, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { contentAPI } from '../../lib/api';

// ─── Markdown Parser ──────────────────────────────────────────────────────────

function parseFrontmatter(text) {
  const normalizedText = text.replace(/\r\n/g, '\n');
  const lines = normalizedText.split('\n');
  const frontmatterLines = [];
  let bodyStartIndex = 0;

  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i += 1) {
      if (lines[i].trim() === '---') {
        bodyStartIndex = i + 1;
        break;
      }
      frontmatterLines.push(lines[i]);
    }
  } else {
    let sawFrontmatter = false;
    for (let i = 0; i < lines.length; i += 1) {
      const trimmed = lines[i].trim();
      if (!trimmed) {
        if (sawFrontmatter) {
          bodyStartIndex = i + 1;
          break;
        }
        continue;
      }

      const parsed = trimmed.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
      if (!parsed) {
        if (sawFrontmatter) {
          bodyStartIndex = i;
        }
        break;
      }

      sawFrontmatter = true;
      frontmatterLines.push(lines[i]);
    }
  }

  const frontmatter = {};
  let i = 0;
  while (i < frontmatterLines.length) {
    const line = frontmatterLines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }

    const blockParsed = trimmed.match(/^([A-Za-z0-9_\-]+):\s*(\||>)(?:\s*(.*))?$/);
    if (blockParsed) {
      const [, key] = blockParsed;
      const blockLines = [];
      i += 1;
      while (i < frontmatterLines.length) {
        const nextLine = frontmatterLines[i];
        const nextTrimmed = nextLine.trim();
        if (!nextTrimmed) {
          blockLines.push('');
          i += 1;
          continue;
        }
        if (!nextLine.startsWith(' ') && !nextLine.startsWith('\t')) {
          break;
        }
        blockLines.push(nextLine.replace(/^\s{2}/, '').replace(/^\t/, ''));
        i += 1;
      }
      frontmatter[key] = blockLines.join('\n').trim();
      continue;
    }

    const parsed = trimmed.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (!parsed) {
      i += 1;
      continue;
    }

    let value = parsed[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
    frontmatter[parsed[1]] = value;
    i += 1;
  }

  return { frontmatter, body: lines.slice(bodyStartIndex).join('\n').trim() };
}

function markdownToHtml(md) {
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let tableLines = [];

  const formatInline = (text) => String(text || '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ').trim();
    if (text) blocks.push(`<p>${text}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) return;
    const tag = listType === 'ol' ? 'ol' : 'ul';
    blocks.push(`<${tag}>${listItems.map(item => `<li>${item}</li>`).join('')}</${tag}>`);
    listType = null;
    listItems = [];
  };

  const flushTable = () => {
    if (!tableLines.length) return;
    const headerIndex = tableLines.findIndex(l => l.includes('---'));
    if (headerIndex > 0) {
      const parseRow = (line) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => formatInline(c.trim()));
      const headers = parseRow(tableLines[0]);
      const bodyLines = tableLines.slice(headerIndex + 1);

      let tableHtml = `<div class="table-wrapper my-6 overflow-x-auto rounded-lg border border-stone-200 shadow-sm bg-white"><table class="w-full text-left text-sm border-collapse"><thead class="bg-stone-100 border-b border-stone-200 text-stone-900 font-semibold"><tr>${headers.map(h => `<th class="p-3.5 border-r border-stone-200 last:border-r-0">${h}</th>`).join('')}</tr></thead><tbody class="divide-y divide-stone-200 text-stone-700">${bodyLines.map((bLine, rIdx) => {
        const row = parseRow(bLine);
        if (row.length === 0 || (row.length === 1 && !row[0])) return '';
        return `<tr class="${rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'} hover:bg-stone-100/50 transition-colors">${row.map(cell => `<td class="p-3.5 border-r border-stone-200 last:border-r-0">${cell}</td>`).join('')}</tr>`;
      }).join('')}</tbody></table></div>`;

      blocks.push(tableHtml);
    } else {
      tableLines.forEach(l => blocks.push(`<p>${formatInline(l)}</p>`));
    }
    tableLines = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushTable();
      return;
    }

    if (trimmed.startsWith('|') || (tableLines.length > 0 && (trimmed.includes('|') || trimmed.includes('---')))) {
      flushParagraph();
      flushList();
      tableLines.push(trimmed);
      return;
    }

    flushTable();

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    const unorderedMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);

    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      return;
    }

    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      const nextType = unorderedMatch ? 'ul' : 'ol';
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push(formatInline((unorderedMatch || orderedMatch)[1]));
      return;
    }

    flushList();
    paragraph.push(formatInline(trimmed));
  });

  flushParagraph();
  flushList();
  flushTable();
  return blocks.join('\n');
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

function buildPayload(type, frontmatter, body) {
  const contentHtml = markdownToHtml(body);
  const lifeAtCompanyHtml = markdownToHtml(getFrontmatterValue(frontmatter, ['life_at_company', 'lifeAtCompany']) || body);
  const focusKeyword = getFrontmatterValue(frontmatter, ['focus_keyword', 'focus-keyword', 'focusKeyword', 'keyword', 'seo_keyword', 'seoKeyword']);
  const startupStage = normalizeStartupStage(getFrontmatterValue(frontmatter, ['startup_stage', 'startup-stage', 'startupStage', 'stage', 'stage_name']));
  const base = {
    type,
    slug: frontmatter.slug || '',
    seo_title: frontmatter.title_tag || '',
    seo_description: frontmatter.meta_description || '',
    excerpt: frontmatter.short_bio || frontmatter.short_description || frontmatter.excerpt || '',
    content: contentHtml,
    content_html: contentHtml,
    status: 'draft',
    focus_keyword: focusKeyword,
  };

  if (type === 'entrepreneurs') {
    return {
      ...base,
      title: frontmatter.full_name || '',
      name: frontmatter.full_name || '',
      designation: frontmatter.designation || '',
      company_name: getFrontmatterValue(frontmatter, ['company_name', 'company', 'business_name']),
      city: frontmatter.city || '',
      startup_stage: startupStage,
      industry: frontmatter.industry || '',
      social_linkedin: frontmatter.linkedin || '',
      social_facebook: frontmatter.facebook || '',
      social_twitter: frontmatter.twitter || '',
      website: frontmatter.website || '',
      founded_year: frontmatter.founded_year || frontmatter.founded || '',
      expertise: frontmatter.expertise || '',
      education: frontmatter.education || '',
      excerpt: frontmatter.short_bio || frontmatter.short_description || frontmatter.excerpt || '',
    };
  }
  if (type === 'directory') {
    return {
      ...base,
      title: getFrontmatterValue(frontmatter, ['business_name', 'company_name', 'company']),
      business_name: getFrontmatterValue(frontmatter, ['business_name', 'company_name', 'company']),
      name: getFrontmatterValue(frontmatter, ['business_name', 'company_name', 'company']),
      city: frontmatter.city || '',
      country: frontmatter.country || '',
      industry: frontmatter.industry || '',
      website: frontmatter.website || '',
      social_linkedin: frontmatter.linkedin || '',
      social_twitter: frontmatter.twitter || '',
      social_facebook: frontmatter.facebook || '',
      email: frontmatter.email || '',
      phone: frontmatter.phone || '',
      founded_year: frontmatter.founded_year || frontmatter.founded || '',
      employee_size: frontmatter.employee_size || '',
      expertise: frontmatter.expertise || '',
      startup_stage: startupStage,
      listing_type: frontmatter.listing_type || 'startup',
      excerpt: frontmatter.company_overview || frontmatter.short_description || frontmatter.short_bio || frontmatter.excerpt || '',
      short_description: frontmatter.company_overview || frontmatter.short_description || '',
      life_at_company: lifeAtCompanyHtml,
      category: frontmatter.category || '',
      leadership_team: {
        founder: { type: 'manual', name: frontmatter.founder || '', id: '', photo: '' },
        ceo: { type: 'manual', name: frontmatter.ceo || '', id: '', photo: '' },
      },
      founder_name: frontmatter.founder || '',
      ceo_name: frontmatter.ceo || '',
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
company_name: ExampleCo
city: Dhaka
stage: Growth-stage
industry: FinTech
founded: 2018
founded_year: 2018
expertise: "FinTech, Digital Payments, SME Lending"
education: "Bangladesh University of Engineering and Technology"
linkedin: https://linkedin.com/in/janedoe
facebook: https://facebook.com/janedoe
twitter: https://twitter.com/janedoe
website: https://exampleco.com
title_tag: "Jane Doe | ExampleCo Co-Founder & CEO | Entrepreneurs BD Profile"
meta_description: "Jane Doe co-founded ExampleCo in 2018, a Dhaka-based fintech startup focused on digital payments."
keyword: "Jane Doe"
short_bio: "Jane Doe is a fintech entrepreneur based in Dhaka who co-founded ExampleCo in 2018."
---

## About Jane Doe

Jane Doe is the co-founder and CEO of ExampleCo, a Dhaka-based fintech company she built from the ground up in 2018.

### Early Career

Her journey began after graduating from BUET with a focus on financial technology...

### Building ExampleCo

ExampleCo started with a small team of five engineers and has grown to over 100 employees...
`,
  directory: `---
business_name: ExampleCo Ltd
company_name: ExampleCo Ltd
slug: exampleco-ltd
founder: Jane Doe
ceo: Jane Doe
city: Dhaka
country: Bangladesh
founded_year: 2015
founded: 2015
employee_size: 51-200
category: Software Company
industry: FinTech
expertise: "Payments, Mobile Banking, SME Lending"
listing_type: startup
website: https://exampleco.com
linkedin: https://linkedin.com/company/exampleco
twitter: https://x.com/exampleco
facebook: https://facebook.com/exampleco
email: hello@exampleco.com
phone: +880 17 0000 0000
title_tag: "ExampleCo Ltd | FinTech Startup | Entrepreneurs BD Directory"
meta_description: "ExampleCo Ltd is a Dhaka-based fintech startup building digital payment infrastructure for SMEs in Bangladesh."
keyword: "ExampleCo"
short_description: "ExampleCo Ltd is a fintech company founded in 2015 that builds digital payment infrastructure and mobile banking tools for SMEs across Bangladesh."
company_overview: "ExampleCo Ltd is a fintech company founded in 2015 that builds digital payment infrastructure and mobile banking tools for SMEs across Bangladesh."
life_at_company: |
  ExampleCo offers a modern and collaborative workplace in Dhaka, designed to support both productivity and employee well-being.

  **Employee Benefits:**

  - Free lunch, snacks, and coffee from an in-house barista
  - Fully equipped gym and indoor games area
  - Basketball court and sports facilities
  - Free shuttle service and on-site parking
  - Friendly and collaborative work environment

  According to employee reviews on Glassdoor, ExampleCo has an overall culture rating of around **3.9/5**, with many employees recommending it as a good place to work.
---

## About ExampleCo

ExampleCo has been building financial technology for Bangladeshi businesses since 2015, starting with a small payments API and growing into a full-stack banking platform.

## Products

Through its flagship product, ExamplePay, the company serves over 10,000 SMEs across Dhaka and Chittagong...

## Life at ExampleCo

The team works out of a modern office in Gulshan with flexible hours, free lunch, and regular hackathons...
`,
  blog: `---
title: "My Blog Post Title"
slug: my-blog-post-title
title_tag: "My Blog Post Title | Entrepreneurs BD"
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
title_tag: "Knowledge Article Title | Entrepreneurs BD"
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
