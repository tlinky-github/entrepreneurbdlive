'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Save, 
  ChevronLeft, 
  Eye, 
  Settings, 
  Star, 
  HelpCircle, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  FileCode, 
  Calendar, 
  Users, 
  Wand2, 
  Sparkles, 
  Loader2,
  Pencil,
  Globe,
  Plus,
  X,
  Check,
  ChevronsUpDown,
  Building2,
  ArrowUpRight,
  UserCircle
} from 'lucide-react';
import { contentAPI, taxonomyAPI, categoryAPI, blogCategoryAPI, authorAPI, adminAPI } from '@/lib/api';
import aiAPI from '@/lib/aiApi';
import ImageUploader from '@/components/common/ImageUploader';
import LinkDialog from '@/components/admin/LinkDialog';
import ImageEditorDialog from '@/components/admin/ImageEditorDialog';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent 
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import FaqExtension from '@/components/editor/FaqExtension';
import { OverviewBlock, QuickAnswer } from '@/components/editor/OverviewExtension';

// --- UPGRADE LOGIC (Senior Engineer Fix) ---
const upgradeLegacyFaqs = (html) => {
  if (typeof document === 'undefined') return html; // SSR Safety
  if (!html) return html;
  
  const sanitizedHtml = html
    .replace(/\s+class=["'][^"']*["']/gi, '') 
    .replace(/\s+style=["'][^"']*["']/gi, '');

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedHtml, 'text/html');
  const topLevelElements = Array.from(doc.body.children);
  if (topLevelElements.length === 0) return sanitizedHtml;

  let nodesToRemove = new Set();
  
  // PART 1: OVERVIEW SCANNER
  const scanners = ['key takeaways', 'quick overview', 'quick answer', 'key highlights', 'takeaways'];
  const processedNodes = new Set();
  
  const allPossible = Array.from(doc.body.querySelectorAll('*')).filter(el => {
    const text = el.innerText.trim().toLowerCase().replace(/[\s\u00A0\u2726]+/g, ' ');
    return scanners.some(s => text.startsWith(s)) && text.length < 80;
  });

  allPossible.forEach(el => {
    if (processedNodes.has(el)) return;
    if (el.closest('.ai-overview-block')) return;
    if (allPossible.some(other => other !== el && other.contains(el))) return;

    const sectionData = { headerHtml: el.innerHTML.replace(/[:.]+$/, '').trim(), bodyHtml: '' };
    const nodesToRemoveCurrent = [el];
    
    let next = el.nextElementSibling;
    let attempts = 0;
    while (next && attempts < 15) {
      const tag = next.tagName;
      if (tag === 'UL' || tag === 'OL') {
        sectionData.bodyHtml = next.outerHTML; 
        nodesToRemoveCurrent.push(next);
        break;
      }
      if ((tag === 'P' || tag === 'DIV') && next.innerText.trim().length > 5) {
        const nt = next.innerText.trim().toLowerCase();
        if (scanners.some(s => nt.startsWith(s))) break;
        sectionData.bodyHtml = `<div class="quick-answer">${next.innerHTML}</div>`;
        nodesToRemoveCurrent.push(next);
        break;
      }
      next = next.nextElementSibling;
      attempts++;
    }

    if (sectionData.bodyHtml) {
      const box = document.createElement('div');
      box.className = 'ai-overview-block';
      box.innerHTML = `<h2>${sectionData.headerHtml}</h2>${sectionData.bodyHtml}`;
      el.parentNode.insertBefore(box, el);
      nodesToRemoveCurrent.forEach(node => {
        processedNodes.add(node);
        nodesToRemove.add(node);
      });
    }
  });

  // PART 2: FAQ SCANNER
  let extractedFaqs = [];
  let inFaqZone = false;

  for (let i = 0; i < topLevelElements.length; i++) {
    const el = topLevelElements[i];
    if (nodesToRemove.has(el)) continue;

    const text = el.innerText.trim();
    const tag = el.tagName;

    if (tag.match(/^H[2-4]$/) && /faq|frequently asked|questions|q&a/i.test(text)) {
      inFaqZone = true;
      nodesToRemove.add(el);
      continue;
    }

    const endsWithQuestion = text.endsWith('?');
    if (inFaqZone && endsWithQuestion && text.length < 250 && text.length > 5) {
      let answerParts = [];
      let gatheredChars = 0;
      let tempNodes = [];
      let j = i + 1;
      
      while (j < topLevelElements.length) {
        const nextEl = topLevelElements[j];
        if (nodesToRemove.has(nextEl)) { j++; continue; }
        const nextText = nextEl.innerText.trim();
        if (!nextText) { j++; continue; }

        if (nextText.endsWith('?') && nextText.length < 250) break;
        if (nextEl.tagName.match(/^H[1-6]$/)) break;
        if (nextText.length > 1000) break;
        
        answerParts.push(nextText);
        gatheredChars += nextText.length;
        tempNodes.push(nextEl);
        j++;
        if (answerParts.length >= 3) break;
      }

      if (answerParts.length > 0) {
        extractedFaqs.push({ q: text, a: answerParts.join('\n\n') });
        nodesToRemove.add(el);
        tempNodes.forEach(node => nodesToRemove.add(node));
        i = j - 1;
      }
    } else if (inFaqZone && tag.match(/^H[1-6]$/) && !/faq|questions/i.test(text)) {
      inFaqZone = false;
    }
  }

  if (extractedFaqs.length > 0) {
    const faqsJson = JSON.stringify(extractedFaqs).replace(/'/g, "&apos;");
    const faqTag = `<faq-section data-faqs='${faqsJson}'></faq-section>`;
    
    const firstRemoved = topLevelElements.find(el => nodesToRemove.has(el));
    if (firstRemoved && firstRemoved.parentNode) {
      const tempWrapper = document.createElement('div');
      tempWrapper.innerHTML = faqTag;
      firstRemoved.parentNode.insertBefore(tempWrapper.firstChild, firstRemoved);
    }
  }

  nodesToRemove.forEach(node => { try { node.remove(); } catch(e) {} });
  return doc.body.innerHTML;
};

// --- COMPONENT ENGINE ---
export default function EditorForge() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'blog';
  const itemId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('draft');
  const [featuredImage, setFeaturedImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');

  // Specialized Fields
  const [designation, setDesignation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [employeeSize, setEmployeeSize] = useState('');
  const [companyPageUrl, setCompanyPageUrl] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [listingType, setListingType] = useState('');
  const [startupStage, setStartupStage] = useState('');
  const [logo, setLogo] = useState('');
  const [photo, setPhoto] = useState('');
  const [coverImage, setCoverImage] = useState('');
  
  // Author & Listing State
  const [authorId, setAuthorId] = useState('');
  const [authorsList, setAuthorsList] = useState([]);
  const [entrepreneursList, setEntrepreneursList] = useState([]);
  const [listingsList, setListingsList] = useState([]);
  const [leadershipTeam, setLeadershipTeam] = useState({
    founder: { type: 'manual', name: '', id: '', photo: '' },
    ceo: { type: 'manual', name: '', id: '', photo: '' }
  });
  const [linkedBusiness, setLinkedBusiness] = useState({ type: 'manual', name: '', id: '', slug: '' });

  // Taxonomy States
  const [categories, setCategories] = useState([]);
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [industries, setIndustries] = useState([]);
  const [cities, setCities] = useState([]);
  const [listingTypes, setListingTypes] = useState([]);
  const [startupStages, setStartupStages] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState({ category: false, author: false, listingType: false, stage: false, industry: false, city: false });
  const [quickAddValue, setQuickAddValue] = useState('');
  const [leadershipSearch, setLeadershipSearch] = useState({ founder: '', ceo: '', business: '' });

  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [activeLinkData, setActiveLinkData] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [websiteLinkSettings, setWebsiteLinkSettings] = useState({ target: '_blank', rel: 'nofollow noopener noreferrer' });
  const [linkSource, setLinkSource] = useState('editor');

  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const [customHtmlInput, setCustomHtmlInput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [showCustomCopilot, setShowCustomCopilot] = useState(false);
  const [customCopilotInstruction, setCustomCopilotInstruction] = useState('');

  // Per-post custom code
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');
  const [customHeadHtml, setCustomHeadHtml] = useState('');
  const [showCustomCode, setShowCustomCode] = useState(false);

  const getSharedExtensions = () => [
    StarterKit.configure({ history: true }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-emerald-600 underline hover:text-emerald-700 transition-colors' },
    }),
    Image.extend({
      addAttributes() {
        return { ...this.parent?.(), alt: { default: null }, caption: { default: null }, title: { default: null } };
      },
      renderHTML({ HTMLAttributes }) {
        if (HTMLAttributes.caption) {
          return [ 'figure', { class: 'editor-figure' }, ['img', HTMLAttributes], ['figcaption', { class: 'editor-figcaption' }, ['span', {}, HTMLAttributes.caption]] ];
        }
        return ['img', HTMLAttributes];
      },
    }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Highlight.configure({ multicolor: true }),
    FaqExtension,
    OverviewBlock,
    QuickAnswer,
  ];

  const editor = useEditor({
    extensions: [ ...getSharedExtensions(), Placeholder.configure({ placeholder: 'Write your story...' }) ],
    content: '<p>Start typing here...</p>',
    editorProps: {
      attributes: { class: 'tiptap-content focus:outline-none min-h-[400px]' },
      transformPastedHTML: (html) => upgradeLegacyFaqs(html),
    },
    immediatelyRender: false,
  });

  const lifeAtCompanyEditor = useEditor({
    extensions: [ ...getSharedExtensions(), Placeholder.configure({ placeholder: 'Describe company culture...' }) ],
    content: '',
    editorProps: {
      attributes: { class: 'tiptap-content focus:outline-none min-h-[200px]' },
    },
    immediatelyRender: false,
  });

  const loadAllMetadata = useCallback(async () => {
    try {
      const [cats, auths] = await Promise.all([
        type === 'blog' ? blogCategoryAPI.list() : categoryAPI.list(),
        authorAPI.list()
      ]);
      if (cats.data) setCategories(cats.data);
      if (auths.data) setAuthorsList(auths.data);

      if (type === 'directory') {
        const [lt, ct, en] = await Promise.all([taxonomyAPI.list('listing_types'), taxonomyAPI.list('cities'), contentAPI.list('entrepreneurs')]);
        if (lt.data) setListingTypes(lt.data);
        if (ct.data) setCities(ct.data);
        if (en.data) setEntrepreneursList(en.data);
      } else if (type === 'entrepreneurs') {
        const [ss, ind, dir] = await Promise.all([taxonomyAPI.list('startup_stages'), taxonomyAPI.list('industries'), contentAPI.list('directory')]);
        if (ss.data) setStartupStages(ss.data);
        if (ind.data) setIndustries(ind.data);
        if (dir.data) setListingsList(dir.data);
      }
    } catch (error) {
      console.error('Metadata load failed:', error);
    }
  }, [type]);

  useEffect(() => {
    loadAllMetadata();
  }, [loadAllMetadata]);

  useEffect(() => {
    if (editor && itemId && !contentLoaded) {
      const loadContent = async () => {
        try {
          const response = await contentAPI.get(type, itemId);
          const data = response.data;
          if (!data) return;

          setTitle(data.title || '');
          setSlug(data.slug || '');
          setExcerpt(data.excerpt || '');
          setCategory(data.category_id || '');
          setStatus(data.status || 'draft');
          setFeaturedImage(data.featured_image || '');
          setSeoTitle(data.seo_title || '');
          setSeoDescription(data.seo_description || '');
          setSeoKeywords(data.seo_keywords || '');
          setOgImage(data.og_image || '');
          setLogo(data.logo || '');
          setPhoto(data.photo || '');
          setCoverImage(data.cover_image || '');
          setDesignation(data.designation || '');
          setCompanyName(data.company_name || data.business_name || '');
          setHeadquarters(data.headquarters || '');
          setEmployeeSize(data.employee_size || '');
          setSocialLinkedin(data.social_linkedin || '');
          setSocialTwitter(data.social_twitter || '');
          setSocialFacebook(data.social_facebook || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setWebsite(data.website || '');
          setListingType(data.listing_type || '');
          setStartupStage(data.startup_stage || '');
          setIndustry(data.industry || '');
          setCity(data.city || '');
          setAuthorId(data.authorId || '');
          setIsFeatured(data.is_featured || false);
          setCustomCss(data.custom_css || '');
          setCustomJs(data.custom_js || '');
          setCustomHeadHtml(data.custom_head_html || '');
          
          if (data.leadership_team) setLeadershipTeam(data.leadership_team);
          if (data.linked_business) setLinkedBusiness(data.linked_business);
          
          const body = data.content_html || data.content;
          if (body) editor.commands.setContent(upgradeLegacyFaqs(body));
          if (data.life_at_company && lifeAtCompanyEditor) lifeAtCompanyEditor.commands.setContent(data.life_at_company);
          
          setContentLoaded(true);
        } catch (error) {
          console.error('Content load failed:', error);
          toast.error('Failed to load item from database');
        }
      };
      loadContent();
    } else if (!itemId) {
      setContentLoaded(true);
    }
  }, [itemId, type, editor, lifeAtCompanyEditor, contentLoaded]);

  const handleCopilot = async (actionStr, customPrompt = null) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText) {
       toast.error('Highlight text first to use AI Copilot');
       return;
    }

    try {
      setIsCopilotLoading(true);
      const payload = { action: actionStr, text: selectedText };
      if (customPrompt) payload.prompt = customPrompt;
      const res = await aiAPI.copilotAction(payload);
      if (res?.success) {
         editor.chain().focus().insertContentAt({ from, to }, res.text).run();
         toast.success('AI Finished!');
      }
    } catch(err) {
      toast.error('AI Failed');
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleSave = async (overrideStatus = null) => {
    if (!title.trim() || !category) {
      toast.error('Title and Category are required');
      return;
    }

    setSaving(true);
    try {
      let contentHtml = editor?.getHTML() || '';
      const selectedCategory = categories.find(cat => cat.id == category);
      const selectedAuthor = authorsList.find(auth => auth.id == authorId);

      const payload = {
        type, title, slug, excerpt,
        content: contentHtml,
        category_id: category,
        category_name: selectedCategory?.name || '',
        status: overrideStatus || status,
        featured_image: featuredImage,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
        og_image: ogImage,
        designation,
        company_name: linkedBusiness.type === 'linked' ? linkedBusiness.name : companyName,
        headquarters,
        employee_size: employeeSize,
        life_at_company: lifeAtCompanyEditor?.getHTML() || '',
        social_linkedin: socialLinkedin,
        social_twitter: socialTwitter,
        social_facebook: socialFacebook,
        email, phone, website,
        is_featured: isFeatured,
        listing_type: listingType,
        startup_stage: startupStage,
        industry, city, authorId,
        author_name: selectedAuthor?.name || '',
        logo: type === 'directory' ? (featuredImage || logo) : logo,
        photo: type === 'entrepreneurs' ? (featuredImage || photo) : photo,
        cover_image: featuredImage || coverImage,
        leadership_team: leadershipTeam,
        linked_business: linkedBusiness,
        updated_at: new Date()
      };

      if (itemId) {
        await contentAPI.update(itemId, payload);
      } else {
        const res = await contentAPI.create(payload);
        if (res?.id) router.replace(`/admin/content-editor?type=${type}&id=${res.id}`);
      }
      toast.success('Content saved successfully!');
    } catch (error) {
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdd = async (taxType) => {
    if (!quickAddValue.trim()) return;
    try {
      let newItem;
      if (taxType === 'category') {
        newItem = type === 'blog' ? await blogCategoryAPI.create(quickAddValue) : await categoryAPI.create(quickAddValue);
        setCategory(newItem.id.toString());
      } else if (taxType === 'author') {
        newItem = await authorAPI.create({ name: quickAddValue });
        setAuthorId(newItem.id);
      }
      loadAllMetadata();
      setQuickAddValue('');
      setShowQuickAdd(prev => ({ ...prev, [taxType]: false }));
      toast.success(`Created ${quickAddValue}`);
    } catch (e) { toast.error('Failed to create'); }
  };

  const QuickSelector = ({ label, value, onChange, options, taxType, placeholder = "Select..." }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase text-stone-500">{label}</label>
        <button type="button" onClick={() => setShowQuickAdd(p => ({...p, [taxType]: !p[taxType]}))} className="text-[10px] font-bold text-emerald-600">
          {showQuickAdd[taxType] ? 'Cancel' : `+ New ${label}`}
        </button>
      </div>
      {showQuickAdd[taxType] ? (
        <div className="flex gap-2">
          <Input value={quickAddValue} onChange={e => setQuickAddValue(e.target.value)} className="h-8 text-xs" />
          <Button size="sm" onClick={() => handleQuickAdd(taxType)}><Check size={14}/></Button>
        </div>
      ) : (
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-stone-50 border rounded-lg p-2 text-sm">
          <option value="">{placeholder}</option>
          {options.map(opt => <option key={opt.id || opt.slug || opt} value={opt.id || opt.slug || opt}>{opt.name || opt}</option>)}
        </select>
      )}
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/content-manager?type=' + type)} className="hover:bg-stone-50">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 uppercase">Forge Editor</h1>
            <p className="text-stone-500 text-xs font-semibold uppercase">{type} • {itemId ? 'Refining' : 'Creating'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving} className="border-stone-200 font-bold px-6">
            {saving ? '...' : 'Save Draft'}
          </Button>
          <Button onClick={() => handleSave('published')} disabled={saving || publishing} className="bg-emerald-900 border-none font-bold px-8 shadow-lg shadow-emerald-900/20">
            {publishing ? '...' : (status === 'published' ? 'Update' : 'Publish Now')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-stone-200 shadow-xl shadow-stone-100/50">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-stone-600">Core Content</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-wide">Main Title</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Headline..." className="text-xl font-bold h-14 border-stone-200 focus:ring-emerald-500 rounded-xl" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-stone-400 mb-1">
                  <span>RICH TEXT EDITOR</span>
                  <div className="flex items-center bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                    <Sparkles size={8} className="mr-1" /> AI ENABLED
                  </div>
                </div>
                <div className="border border-stone-200 rounded-2xl overflow-hidden focus-within:border-emerald-500 transition-colors shadow-inner bg-white">
                   {/* Tiptap Toolbar */}
                   <div className="flex flex-wrap items-center gap-1 p-2 bg-stone-50 border-b border-stone-100">
                      <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'bg-stone-200' : ''}><strong>B</strong></Button>
                      <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleHeading({level: 2}).run()} className={editor?.isActive('heading', {level: 2}) ? 'bg-stone-200' : ''}>H2</Button>
                      <Button variant="ghost" size="sm" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'bg-stone-200' : ''}>LIST</Button>
                      <div className="h-4 w-px bg-stone-200 mx-2" />
                      <button onClick={() => editor.chain().focus().insertContent({ type: 'faqSection', attrs: { faqs: [{ q: '', a: '' }] } }).run()} className="text-[10px] font-black bg-white border border-stone-100 px-2 py-1.5 rounded hover:bg-stone-50 transition-colors uppercase tracking-tight">+ FAQ BLOCK</button>
                      
                      <div className="ml-auto flex items-center gap-1">
                        {isCopilotLoading ? <Loader2 size={14} className="animate-spin text-emerald-600 mr-2" /> : (
                          <>
                            <button onClick={() => handleCopilot('rewrite')} className="p-1.5 text-stone-400 hover:text-indigo-600 transition-colors" title="AI Rewrite"><Wand2 size={16} /></button>
                            <button onClick={() => setShowCustomCopilot(!showCustomCopilot)} className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-transform active:scale-95 shadow-md uppercase">AI COPILOT</button>
                          </>
                        )}
                      </div>
                   </div>
                   
                   {showCustomCopilot && (
                     <div className="p-2 bg-indigo-50 border-b border-indigo-100 flex gap-2">
                        <Input value={customCopilotInstruction} onChange={e => setCustomCopilotInstruction(e.target.value)} placeholder="Describe what AI should do..." className="h-8 text-xs focus:ring-indigo-500" />
                        <Button size="sm" onClick={() => handleCopilot('custom', customCopilotInstruction)} className="bg-indigo-600 h-8">Go</Button>
                     </div>
                   )}

                   <div className="p-6">
                      <EditorContent editor={editor} />
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-stone-200 shadow-lg">
             <CardHeader className="bg-stone-50/50 border-b border-stone-100 py-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-stone-400">Taxonomy & Media</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <QuickSelector label="Category *" value={category} onChange={setCategory} options={categories} taxType="category" />
                  <QuickSelector label="Assigned Author" value={authorId} onChange={setAuthorId} options={authorsList} taxType="author" />
                </div>
                
                <div className="space-y-2 pt-4 border-t border-stone-100">
                  <label className="text-xs font-bold uppercase text-stone-400 tracking-wide">Featured Image</label>
                  <ImageUploader 
                    value={featuredImage} 
                    onChange={url => setFeaturedImage(url)} 
                    entityType={type} 
                    placeholder="Select cover image..." 
                  />
                  <p className="text-[10px] text-stone-400 italic">Recommended 1200x630 for SEO dominance.</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-stone-100">
                   <label className="text-xs font-bold uppercase text-stone-400 tracking-wide">Excerpt / TL;DR</label>
                   <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={4} className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm focus:ring-emerald-500 outline-none" placeholder="Brief summary for list views..." />
                </div>
             </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card className="rounded-2xl overflow-hidden border-stone-200">
             <div className="bg-stone-900 p-4 border-b border-stone-800">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Google SERP Preview
                </h4>
             </div>
             <div className="p-6 bg-white space-y-2">
                <p className="text-blue-700 text-lg hover:underline cursor-pointer truncate font-medium">{seoTitle || title || 'Placeholder Title'}</p>
                <div className="flex items-center text-green-800 text-[11px] gap-1">
                   <span>entrepreneurbd.live / {type} /</span>
                   <span className="font-bold underline text-emerald-700">{slug || 'your-url-slug'}</span>
                </div>
                <p className="text-stone-600 text-xs line-clamp-2">{seoDescription || excerpt || 'Search engines will see your summary here...'}</p>
             </div>
          </Card>
        </div>
      </div>

      <LinkDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} initialData={activeLinkData} onApply={data => {
        if (data.href) editor.chain().focus().setLink(data).run();
        else editor.chain().focus().unsetLink().run();
      }} />
      
      <ImageEditorDialog open={imageDialogOpen} onOpenChange={setImageDialogOpen} onInsert={data => editor.chain().focus().setImage(data).run()} />
    </div>
  );
}
