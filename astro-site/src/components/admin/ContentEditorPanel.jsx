// src/pages/admin/ContentEditorPanel.jsx
// Advanced Content Editor with SEO, Categories, Rich Text

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useBeforeUnload, useBlocker } from 'react-router-dom';
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
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { Save, ChevronLeft, Eye, Settings, Star, HelpCircle, Code, ChevronDown, ChevronUp, FileCode, Calendar, Users, Wand2, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { contentAPI, taxonomyAPI, categoryAPI, blogCategoryAPI, authorAPI } from '../../lib/api';
import aiAPI from '../../lib/aiApi';
import ImageUploader from '../../components/common/ImageUploader';
import LinkDialog from '../../components/admin/LinkDialog';
import ImageEditorDialog from '../../components/admin/ImageEditorDialog';
import SEOModal from './SEOModal';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent 
} from '../../components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '../../components/ui/command';
import { Pencil, Globe, Smartphone, Monitor, Plus, X, Check, ChevronsUpDown } from 'lucide-react';
import FaqExtension from '../../components/editor/FaqExtension';
import { OverviewBlock, QuickAnswer } from '../../components/editor/OverviewExtension';
import './ContentEditorPanel.css';

// Senior Engineer Fix: Advanced Multi-Structural Smart Scanner
// Detects FAQs, Quick Answers, and Key Takeaways for premium styling
const upgradeLegacyFaqs = (html) => {
  if (!html || !html.includes('<')) return html; // Plain text return early
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    if (!doc.body || !doc.body.innerHTML) return html;

    // 1. Fix Google Docs Bold Bug: Only unwrap IF we detect the docs-internal-guid or normal weighting
    doc.querySelectorAll('b, strong').forEach(el => {
      if (el.style.fontWeight === 'normal' || (el.id && el.id.startsWith('docs-internal-guid'))) {
        const parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
    });

    // 2. Scan for FAQs and Overview blocks
    // We scan top-level elements of the body
    const elements = Array.from(doc.body.children);
    const nodesToRemove = new Set();
    const extractedFaqs = [];
    let faqInsertionPoint = null;

    // PART A: AI OVERVIEW
    const overviewHeaders = ['key takeaways', 'quick overview', 'quick answer', 'key highlights', 'takeaways'];
    elements.forEach(el => {
      if (nodesToRemove.has(el)) return;
      const text = el.innerText.trim().toLowerCase();
      if (overviewHeaders.some(h => text.startsWith(h)) && text.length < 100) {
        let next = el.nextElementSibling;
        if (next && (next.tagName === 'UL' || next.tagName === 'OL' || next.tagName === 'P')) {
          const box = document.createElement('div');
          box.className = 'ai-overview-block';
          box.innerHTML = `<h2>${el.innerHTML}</h2>${next.outerHTML}`;
          el.parentNode.insertBefore(box, el);
          nodesToRemove.add(el);
          nodesToRemove.add(next);
        }
      }
    });

    // PART B: FAQs
    let inFaqZone = false;
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (nodesToRemove.has(el)) continue;

      const tag = el.tagName;
      const text = el.innerText.trim();

      if (tag.match(/^H[2-4]$/) && /faq|frequently asked|questions|q&a/i.test(text)) {
        inFaqZone = true;
        nodesToRemove.add(el);
        if (!faqInsertionPoint) faqInsertionPoint = { parent: el.parentNode, nextSibling: el };
        continue;
      }

      if (inFaqZone && text.endsWith('?') && text.length < 250) {
        let next = el.nextElementSibling;
        if (next && !nodesToRemove.has(next)) {
           extractedFaqs.push({ q: text, a: next.innerHTML });
           nodesToRemove.add(el);
           nodesToRemove.add(next);
           if (!faqInsertionPoint) faqInsertionPoint = { parent: el.parentNode, nextSibling: el };
        }
      } else if (inFaqZone && tag.match(/^H[1-6]$/)) {
        inFaqZone = false;
      }
    }

    // PART C: Insert FAQ Section
    if (extractedFaqs.length > 0 && faqInsertionPoint) {
      const faqsJson = JSON.stringify(extractedFaqs).replace(/'/g, "&apos;");
      const faqTag = document.createElement('faq-section');
      faqTag.setAttribute('data-faqs', faqsJson);
      faqInsertionPoint.parent.insertBefore(faqTag, faqInsertionPoint.nextSibling);
    }

    // 3. Fix links with leading/trailing spaces in their text (Premium Content Repair)
    doc.querySelectorAll('a').forEach(link => {
      const html = link.innerHTML;
      const trimmed = html.trim();
      if (html !== trimmed) {
        const leadMatch = html.match(/^\s+/);
        const trailMatch = html.match(/\s+$/);
        
        if (leadMatch) {
          const leadNode = doc.createTextNode(leadMatch[0]);
          link.parentNode.insertBefore(leadNode, link);
        }
        
        link.innerHTML = trimmed;
        
        if (trailMatch) {
          const trailNode = doc.createTextNode(trailMatch[0]);
          if (link.nextSibling) {
            link.parentNode.insertBefore(trailNode, link.nextSibling);
          } else {
            link.parentNode.appendChild(trailNode);
          }
        }
      }
    });

    // 4. Fix tables for responsiveness (Wrap in scrollable container)
    doc.querySelectorAll('table').forEach(table => {
      if (table.parentNode && table.parentNode.className !== 'table-wrapper') {
        const wrapper = doc.createElement('div');
        wrapper.className = 'table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });

    // Final Scrub: Only remove the nodes we converted to blocks
    nodesToRemove.forEach(node => { if(node.parentNode) node.parentNode.removeChild(node); });

    return doc.body.innerHTML;
  } catch (e) {
    console.warn('[Upgrade Scanner Fail]', e);
    return html;
  }
};

const ContentEditorPanel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'blog';
  const itemId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('draft');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [saving, setSaving] = useState(false);
  const isSubmittingRef = useRef(false);
  const [publishing, setPublishing] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [ogImageAlt, setOgImageAlt] = useState('');
  const [customSchema, setCustomSchema] = useState('');
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);

  // SEO Modal states
  const [isSEOModalOpen, setIsSEOModalOpen] = useState(false);
  const [focusKeyword, setFocusKeyword] = useState('');
  const [isPillarContent, setIsPillarContent] = useState(false);
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [breadcrumbTitle, setBreadcrumbTitle] = useState('');
  const [robotsMeta, setRobotsMeta] = useState({
    noindex: false,
    nofollow: false,
    noarchive: false,
    noimageindex: false,
    nosnippet: false
  });
  const [advancedRobots, setAdvancedRobots] = useState({
    maxSnippet: -1,
    maxVideo: -1,
    maxImage: 'large'
  });
  const [redirection, setRedirection] = useState({
    enable: false,
    type: '301',
    url: ''
  });
  const [socialMeta, setSocialMeta] = useState({
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    twitterCard: 'summary_large_image'
  });

  // Specialized Fields
  const [designation, setDesignation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [founderName, setFounderName] = useState('');
  const [ceoName, setCeoName] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [expertise, setExpertise] = useState('');
  const [education, setEducation] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [employeeSize, setEmployeeSize] = useState('');
  const [country, setCountry] = useState('');
  const [companyPageUrl, setCompanyPageUrl] = useState('');
  const [lifeAtCompany, setLifeAtCompany] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [listingType, setListingType] = useState('');
  const [startupStage, setStartupStage] = useState('');
  const [logo, setLogo] = useState('');
  const [logoAlt, setLogoAlt] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoAlt, setPhotoAlt] = useState('');
  const [gender, setGender] = useState('male');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  
  // Author & FAQ State
  const [authorId, setAuthorId] = useState('');
  const [authorsList, setAuthorsList] = useState([]);
  const [faqs, setFaqs] = useState([]); // Array of { q: '', a: '' }
  const [entrepreneursList, setEntrepreneursList] = useState([]);
  const [listingsList, setListingsList] = useState([]);
  const [leadershipTeam, setLeadershipTeam] = useState({
    founder: { type: 'manual', name: '', id: '', photo: '' },
    ceo: { type: 'manual', name: '', id: '', photo: '' }
  });
  const [linkedBusiness, setLinkedBusiness] = useState({ type: 'manual', name: '', id: '', slug: '' });

  // Taxonomy & Metadata States
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

  const [manualSlugSet, setManualSlugSet] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Prevent data loss on browser refresh
  useBeforeUnload(
    useCallback(
      (event) => {
        if (isDirty) {
          event.preventDefault();
        }
      },
      [isDirty]
    )
  );

  // BLOCK NAVIGATION: This catches sidebar clicks, logo clicks, etc.
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        isDirty && currentLocation.pathname !== nextLocation.pathname,
      [isDirty]
    )
  );

  // Senior Engineer Fix: Reset manual state when switching items (Prevents state bleed-over)
  useEffect(() => {
    setManualSlugSet(false);
  }, [itemId, type]);

  const [submittedCategory, setSubmittedCategory] = useState('');
  const [submittedIndustry, setSubmittedIndustry] = useState('');
  const [submittedCity, setSubmittedCity] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [source, setSource] = useState('');

  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [activeLinkData, setActiveLinkData] = useState(null);
  const [buttonDialogOpen, setButtonDialogOpen] = useState(false);
  const [buttonLabel, setButtonLabel] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [buttonOpenInNewTab, setButtonOpenInNewTab] = useState(true);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const buttonSelectionRef = useRef({ from: 0, to: 0 });

  // Per-post custom code
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');
  const [customHeadHtml, setCustomHeadHtml] = useState('');
  const [showCustomCode, setShowCustomCode] = useState(false);

  // Link Settings for manual fields
  const [websiteLinkSettings, setWebsiteLinkSettings] = useState({ target: '_blank', rel: 'nofollow noopener noreferrer' });
  const [linkSource, setLinkSource] = useState('editor'); // 'editor' or 'website'

  // Custom HTML block dialog
  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const [customHtmlInput, setCustomHtmlInput] = useState('');

  // --- AI Copilot Logic ---
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [showCustomCopilot, setShowCustomCopilot] = useState(false);
  const [customCopilotInstruction, setCustomCopilotInstruction] = useState('');

  const handleCopilot = async (actionStr, customPrompt = null) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText) {
       toast.error('Please highlight some text first to use AI Copilot');
       return;
    }

    try {
      setIsCopilotLoading(true);
      const payload = {
         action: actionStr,
         text: selectedText
      };

      if (customPrompt) {
         payload.prompt = customPrompt;
      }

      const response = await aiAPI.copilotAction(payload);

      if (response && response.success && response.text) {
         editor.chain().focus().insertContentAt({ from, to }, response.text).run();
         toast.success('AI finished successfully!');
      } else {
         throw new Error("Invalid response format");
      }
    } catch(err) {
      toast.error('AI Copilot failed: ' + (err.message || 'Unknown error'));
      console.error('Copilot error:', err);
    } finally {
  setIsCopilotLoading(false);
    }
  };

  const CustomLink = Link.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        'data-force-new-tab': {
          default: null,
          parseHTML: element => element.getAttribute('data-force-new-tab'),
          renderHTML: attributes => {
            if (!attributes['data-force-new-tab']) return {};
            return { 'data-force-new-tab': attributes['data-force-new-tab'] };
          }
        }
      };
    }
  });

  // 1. Shared Extensions to prevent duplicates
  // Factory for extensions to avoid duplicate instances between editors
  const getSharedExtensions = () => [
    StarterKit.configure({
      history: true,
    }),
    CustomLink.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-emerald-600 underline hover:text-emerald-700 transition-colors',
      },
    }),
    Image.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          alt: { default: null },
          caption: { default: null },
          title: { default: null },
        };
      },
      parseHTML() {
        return [
          {
            tag: 'figure.editor-figure',
            contentElement: 'img',
            getAttrs: (element) => {
              const img = element.querySelector('img');
              const caption = element.querySelector('figcaption')?.innerText || null;
              if (!img) return false;
              return {
                src: img.getAttribute('src'),
                alt: img.getAttribute('alt'),
                title: img.getAttribute('title'),
                caption,
              };
            },
          },
          {
            tag: 'img[src]',
          },
        ];
      },
      renderHTML({ HTMLAttributes }) {
        if (HTMLAttributes.caption) {
          return [
            'figure', 
            { class: 'editor-figure' }, 
            ['img', HTMLAttributes], 
            ['figcaption', { class: 'editor-figcaption' }, ['span', {}, HTMLAttributes.caption]]
          ];
        }
        return ['img', HTMLAttributes];
      },
    }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Highlight.configure({
      multicolor: true,
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse table-auto w-full border border-stone-200 shadow-sm rounded-md overflow-hidden my-4',
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: 'border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'bg-emerald-50/80 border border-stone-200 px-4 py-3 text-left text-sm font-bold text-emerald-900 border-b-2',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-stone-200 px-4 py-3 text-sm text-stone-700 align-top break-words',
      },
    }),
    FaqExtension,
    OverviewBlock,
    QuickAnswer,
  ];

  const openLinkDialogFromClick = (editorInstance, event, setLinkState) => {
    const target = event?.target;
    if (!(target instanceof Element)) return false;

    const anchor = target.closest('a');
    if (!anchor) return false;

    event.preventDefault();
    event.stopPropagation();

    const href = anchor.getAttribute('href') || '';
    const targetAttr = anchor.getAttribute('target');
    const rel = anchor.getAttribute('rel') || '';

    if (editorInstance) {
      editorInstance.commands.setTextSelection({ from: Math.max(1, Math.min(editorInstance.state.selection.from, editorInstance.state.selection.to)), to: Math.max(1, Math.max(editorInstance.state.selection.from, editorInstance.state.selection.to)) });
      editorInstance.chain().focus().extendMarkRange('link').run();
    }

    setLinkState({ href, target: targetAttr, rel });
    setLinkDialogOpen(true);
    return true;
  };

  // Memoize extension configurations to prevent re-registration on every component render
  const mainExtensions = React.useMemo(() => [
    ...getSharedExtensions(),
    Placeholder.configure({ placeholder: 'Start typing here...' })
  ], []);

  const lifeAtCompanyExtensions = React.useMemo(() => [
    ...getSharedExtensions(),
    Placeholder.configure({ placeholder: 'Describe company culture, environment, and perks...' })
  ], []);

  // Main Content Editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: mainExtensions,
    content: '',
    onUpdate: ({ editor }) => {
      // Any specific logic for update if needed
    },
    autofocus: true,
    editable: true,
    editorProps: {
      attributes: {
        class: 'tiptap-content focus:outline-none min-height: 400px;',
      },
      handleClick: (view, pos, event) => {
        const handled = openLinkDialogFromClick(editor, event, setActiveLinkData);
        if (!handled) return false;
        return true;
      },
      transformPastedHTML: (html) => {
        return upgradeLegacyFaqs(html);
      },
      handlePaste: (view, event) => {
        return false; // Let transformPastedHTML handle the structural conversion and cleaning
      }
    },
  });

  const handleApplyButton = () => {
    if (!editor) return;

    const href = buttonUrl.trim();
    if (!href) {
      toast.error('Please add a URL for the button');
      return;
    }

    const label = (buttonLabel || 'Button').trim() || 'Button';
    const buttonAnchor = document.createElement('a');
    buttonAnchor.textContent = label;
    buttonAnchor.href = href;
    buttonAnchor.className = 'editor-cta-button';

    if (buttonOpenInNewTab) {
      buttonAnchor.target = '_blank';
      buttonAnchor.rel = 'noopener noreferrer';
    }

    const selection = buttonSelectionRef.current;
    const chain = editor.chain().focus();

    if (selection && selection.from !== selection.to) {
      chain.setTextSelection(selection).insertContent(buttonAnchor.outerHTML).run();
    } else {
      chain.insertContent(buttonAnchor.outerHTML).run();
    }

    setButtonDialogOpen(false);
    setButtonLabel('');
    setButtonUrl('');
    setButtonOpenInNewTab(true);
  };

  // Second Editor for "Life at Company" (Directory Only)
  const lifeAtCompanyEditor = useEditor({
    immediatelyRender: false,
    extensions: lifeAtCompanyExtensions,
    content: '',
    editable: true,
    editorProps: {
      attributes: {
        class: 'tiptap-content focus:outline-none min-height: 200px;',
      },
      handleClick: (view, pos, event) => {
        const handled = openLinkDialogFromClick(lifeAtCompanyEditor, event, setActiveLinkData);
        if (!handled) return false;
        return true;
      },
      transformPastedHTML: (html) => {
        // Senior Engineer Fix: Bulletproof DOM-based cleaning for Google Docs/External junk
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Fix Google Docs bold wrapper issue
        doc.querySelectorAll('b, strong').forEach(el => {
          if (el.style.fontWeight === 'normal' || (el.id && el.id.startsWith('docs-internal-guid'))) {
            const fragment = document.createDocumentFragment();
            while (el.firstChild) fragment.appendChild(el.firstChild);
            el.parentNode.replaceChild(fragment, el);
          }
        });

        doc.querySelectorAll('*').forEach(el => {
          if (el.tagName !== 'TABLE' && el.tagName !== 'TD' && el.tagName !== 'TH' && el.tagName !== 'TR') {
            el.removeAttribute('style');
            el.removeAttribute('class');
          }
        });
        
        doc.querySelectorAll('span, font').forEach(el => {
          while (el.firstChild) {
            el.parentNode.insertBefore(el.firstChild, el);
          }
          el.remove();
        });
        return doc.body.innerHTML;
      },
    },
  });

  // Monitor editor for changes
  useEffect(() => {
    if (editor && contentLoaded) {
      const updateHandler = () => setIsDirty(true);
      editor.on('update', updateHandler);
      return () => editor.off('update', updateHandler);
    }
  }, [editor, contentLoaded]);

  // Monitor specialized editor
  useEffect(() => {
    if (lifeAtCompanyEditor && contentLoaded) {
      const updateHandler = () => setIsDirty(true);
      lifeAtCompanyEditor.on('update', updateHandler);
      return () => lifeAtCompanyEditor.off('update', updateHandler);
    }
  }, [lifeAtCompanyEditor, contentLoaded]);

  // Monitor form fields for changes
  useEffect(() => {
    if (contentLoaded) {
      setIsDirty(true);
    }
  }, [
    title, slug, excerpt, category, featuredImage, seoTitle, seoDescription, seoKeywords, faqs, isFeatured, status, contentLoaded,
    focusKeyword, isPillarContent, canonicalUrl, breadcrumbTitle, robotsMeta, advancedRobots, redirection, socialMeta
  ]);

  // Debug editor state
  useEffect(() => {
  }, [editor]);

  // Load existing content if editing
  useEffect(() => {
    if (editor) {
      setEditorReady(true);

      if (itemId) {
        const loadContent = async () => {
          try {
            const response = await contentAPI.get(type, itemId);
            const data = response.data;
            
            if (!data) {
              console.error('Content document not found:', { type, itemId });
              toast.error('Post not found in database');
              setContentLoaded(true);
              return;
            }

            // Mapping fix for community submissions
            const finalTitle = data.title || data.name || data.business_name || '';
            setTitle(finalTitle);
            setSlug(data.slug || '');
            setManualSlugSet(true); // LOCK the slug: once loaded, never auto-generate from title again
            
            // Store submission metadata for reference
            setSubmittedCategory(data.category || '');
            setSubmittedIndustry(data.industry || '');
            setSubmittedCity(data.city || data.headquarters || '');
            setContactEmail(data.contact_email || '');
            setContactPhone(data.contact_phone || '');
            setSource(data.source || '');

            setExcerpt(data.excerpt || '');
            setCategory(data.category_id || '');
            setStatus(data.status || 'draft');
            setFeaturedImage(data.featured_image || '');
            setSeoTitle(data.seo_title || '');
            setSeoDescription(data.seo_description || '');
            setSeoKeywords(data.seo_keywords || '');
            setFeaturedImage(data.featured_image || '');
            setFeaturedImageAlt(data.featured_image_alt || '');
            setOgImage(data.og_image || '');
            setOgImageAlt(data.og_image_alt || '');

            // Load SEO Fields
            setFocusKeyword(data.focus_keyword || '');
            setIsPillarContent(!!data.is_pillar_content);
            setCanonicalUrl(data.canonical_url || '');
            setBreadcrumbTitle(data.breadcrumb_title || '');
            setRobotsMeta(data.robots_meta || {
              noindex: false,
              nofollow: false,
              noarchive: false,
              noimageindex: false,
              nosnippet: false
            });
            setAdvancedRobots(data.advanced_robots || {
              maxSnippet: -1,
              maxVideo: -1,
              maxImage: 'large'
            });
            setRedirection(data.redirection || {
              enable: false,
              type: '301',
              url: ''
            });
            setSocialMeta(data.social_meta || {
              ogTitle: '',
              ogDescription: '',
              ogImage: '',
              twitterTitle: '',
              twitterDescription: '',
              twitterImage: '',
              twitterCard: 'summary_large_image'
            });
            setLogo(data.logo || '');
            setLogoAlt(data.logo_alt || '');
            setPhoto(data.photo || '');
            setPhotoAlt(data.photo_alt || '');
            setGender(data.gender || 'male');
            setCoverImage(data.cover_image || '');
            setCoverImageAlt(data.cover_image_alt || '');

            // Load specialized fields
            setDesignation(data.designation || '');
            setCompanyName(data.company_name || data.business_name || '');
            setFounderName(data.founder_name || '');
            setCeoName(data.ceo_name || '');
            setHeadquarters(data.headquarters || '');
            setEmployeeSize(data.employee_size || '');
            setCompanyPageUrl(data.company_page_url || data.website || '');
            setLifeAtCompany(data.life_at_company || '');
            setSocialLinkedin(data.social_linkedin || '');
            setSocialTwitter(data.social_twitter || '');
            setSocialFacebook(data.social_facebook || '');
            setEmail(data.email || '');
            setPhone(data.phone || '');
            setWebsite(data.website || '');
            setFoundedYear(data.founded_year || '');
            setExpertise(data.expertise || '');
            setEducation(data.education || '');
            setCountry(data.country || '');

            const fullContent = data.content_html || data.content;
            if (fullContent) {
              // Senior Engineer Fix: Automatically upgrade legacy plain-text FAQs to dynamic blocks on load
              editor.commands.setContent(upgradeLegacyFaqs(fullContent));
            }
            if (data.life_at_company && lifeAtCompanyEditor) {
              lifeAtCompanyEditor.commands.setContent(upgradeLegacyFaqs(data.life_at_company));
            }
            setListingType(data.listing_type || '');
            setStartupStage(data.startup_stage || '');
            setIndustry(data.industry || '');
            setCity(data.city || data.headquarters || '');
            setAuthorId(data.authorId || '');
            setFaqs(data.faqs || []);
            setIsFeatured(data.is_featured || false);
            setCustomCss(data.custom_css || '');
            setCustomJs(data.custom_js || '');
            setCustomHeadHtml(data.custom_head_html || '');
            setCustomSchema(data.custom_schema || '');
            setWebsiteLinkSettings(data.website_link_settings || { target: '_blank', rel: 'nofollow noopener noreferrer' });
            
            // Set Linked Business (for entrepreneurs)
            if (data.linked_business) {
              setLinkedBusiness(data.linked_business);
            } else if (data.company_name) {
              setLinkedBusiness({ type: 'manual', name: data.company_name, id: '', slug: '' });
            }

            // Set Leadership Team state from loaded data
            if (data.leadership_team) {
              setLeadershipTeam(data.leadership_team);
            } else {
              // Backward compatibility
              setLeadershipTeam({
                founder: { type: 'manual', name: data.founder_name || '', id: '', photo: '' },
                ceo: { type: 'manual', name: data.ceo_name || '', id: '', photo: '' }
              });
            }
            
            // Load Scheduling
            const scheduledDateVal = data.scheduled_at || data.scheduledAt;
            if (scheduledDateVal) {
              setIsScheduled(true);
              // Format for datetime-local input
              const date = new Date(scheduledDateVal);
              const formatted = date.toISOString().slice(0, 16);
              setScheduledAt(formatted);
            }
            
            setContentLoaded(true);
          } catch (error) {
            console.error('Error loading content:', error);
            toast.error('Failed to load content');
            setContentLoaded(true);
          }
        };
        loadContent();
      } else {
        setContentLoaded(true);
      }
    }
  }, [itemId, type, editor, lifeAtCompanyEditor]);


  // Metadata Refreshers
  const refreshCategories = useCallback(async () => {
    try {
      const res = type === 'blog' ? await blogCategoryAPI.list() : await categoryAPI.list();
      if (res.data) setCategories(res.data);
    } catch (error) { console.error('Error loading categories:', error); }
  }, [type]);

  const refreshAuthors = useCallback(async () => {
    try {
      const res = await authorAPI.list();
      if (res.data) setAuthorsList(res.data);
    } catch (error) { console.error('Error loading authors:', error); }
  }, []);

  const refreshListingTypes = useCallback(async () => {
    try {
      const res = await taxonomyAPI.list('listing_types');
      if (res.data) setListingTypes(res.data);
    } catch (error) { console.error('Error loading types:', error); }
  }, []);

  const refreshStartupStages = useCallback(async () => {
    try {
      const res = await taxonomyAPI.list('startup_stages');
      if (res.data) setStartupStages(res.data);
    } catch (error) { console.error('Error loading stages:', error); }
  }, []);

  const refreshIndustries = useCallback(async () => {
    try {
      const res = await taxonomyAPI.list('industries');
      if (res.data) setIndustries(res.data);
    } catch (error) { console.error('Error loading industries:', error); }
  }, []);

  const refreshCities = useCallback(async () => {
    try {
      const res = await taxonomyAPI.list('cities');
      if (res.data) setCities(res.data);
    } catch (error) { console.error('Error loading cities:', error); }
  }, []);

  const refreshListings = useCallback(async () => {
    try {
      const res = await contentAPI.list('directory');
      if (res.data) setListingsList(res.data);
    } catch (error) { console.error('Error loading directory listings:', error); }
  }, []);

  const refreshEntrepreneurs = useCallback(async () => {
    try {
      const res = await contentAPI.list('entrepreneurs');
      if (res.data) setEntrepreneursList(res.data);
    } catch (error) { console.error('Error loading entrepreneurs:', error); }
  }, []);

  // Initial Data Loads
  useEffect(() => {
    refreshAuthors();
  }, [refreshAuthors]);

  useEffect(() => {
    refreshCategories();
  }, [type, refreshCategories]);

  useEffect(() => {
    if (type === 'directory') {
      refreshListingTypes();
      refreshCities();
      refreshIndustries();
      refreshEntrepreneurs();
    }
    if (type === 'entrepreneurs') {
      refreshStartupStages();
      refreshIndustries();
      refreshCities();
      refreshListings();
    }
  }, [type, refreshListingTypes, refreshCities, refreshStartupStages, refreshIndustries, refreshListings, refreshEntrepreneurs]);

  const handleQuickAdd = async (taxType) => {
    if (!quickAddValue.trim()) return;
    try {
      let newItem;
      switch (taxType) {
        case 'category':
          newItem = type === 'blog' ? await blogCategoryAPI.create(quickAddValue) : await categoryAPI.create(quickAddValue);
          await refreshCategories();
          setCategory(newItem.id.toString());
          break;
        case 'author':
          newItem = await authorAPI.create({ name: quickAddValue, designation: 'Official Author', bio: '' });
          await refreshAuthors();
          setAuthorId(newItem.id);
          break;
        case 'listingType':
          newItem = await taxonomyAPI.create('listing_types', quickAddValue);
          await refreshListingTypes();
          setListingType(newItem.slug);
          break;
        case 'stage':
          newItem = await taxonomyAPI.create('startup_stages', quickAddValue);
          await refreshStartupStages();
          setStartupStage(newItem.slug);
          break;
        case 'industry':
          newItem = await taxonomyAPI.create('industries', quickAddValue);
          await refreshIndustries();
          setIndustry(newItem.name); // Store name or slug
          break;
        case 'city':
          newItem = await taxonomyAPI.create('cities', quickAddValue);
          await refreshCities();
          setCity(newItem.name);
          break;
      }
      toast.success(`Success! Created "${quickAddValue}"`);
      setQuickAddValue('');
      setShowQuickAdd(prev => ({ ...prev, [taxType]: false }));
    } catch (error) {
      console.error('Quick Add Failed:', error);
      toast.error('Failed to create item');
    }
  };

  const QuickSelector = ({ label, value, onChange, options, taxType, placeholder = "Select..." }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-stone-700">{label}</label>
        <button 
          type="button"
          onClick={() => {
            setQuickAddValue('');
            setShowQuickAdd(prev => ({ ...prev, [taxType]: !prev[taxType] }));
          }}
          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-tight"
        >
          {showQuickAdd[taxType] ? <><X className="w-3 h-3" /> Cancel</> : <><Plus className="w-3 h-3" /> New {label}</>}
        </button>
      </div>

      {showQuickAdd[taxType] ? (
        <div className="flex gap-2">
          <Input 
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()} name...`}
            className="flex-1"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(taxType)}
          />
          <Button 
            type="button" 
            onClick={() => handleQuickAdd(taxType)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-select w-full"
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option 
              key={opt.id || opt.slug || opt} 
              value={(taxType === 'city' || taxType === 'industry') ? (opt.name || opt) : (opt.id || opt.slug || opt)}
            >
              {opt.name || opt}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  // Auto-generate slug (Only for brand-new items, after search params settle)
  useEffect(() => {
    // Safety Barrier: Never auto-generate if we are editing an existing item
    if (itemId) return;
    
    // Safety Barrier: Only auto-generate if the content is ready and user hasn't typed a slug yet
    if (contentLoaded && !manualSlugSet && title) {
      const newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(newSlug);
    }
  }, [title, itemId, manualSlugSet, contentLoaded]);
  
  // Reset slug manual state only when we truly switch to a NEW post (no itemId)
  useEffect(() => {
    if (!itemId) {
      setManualSlugSet(false);
    }
  }, [itemId]);

  // Auto-fill SEO title if empty
  useEffect(() => {
    if (title && !seoTitle) {
      setSeoTitle(title);
    }
  }, [title, seoTitle]);

  const handleSave = async (overrideStatus = null) => {
    if (isSubmittingRef.current) return false;
    isSubmittingRef.current = true;

    if (!title.trim()) {
      toast.error('Title is required');
      isSubmittingRef.current = false;
      return false;
    }
    

      // Logo validation: optional for all types now — defaults used if missing
      // (directory logo, entrepreneur photo are optional — fallback avatars shown)

    // Category is recommended but not blocking for blog
    if (!category && type !== 'blog' && type !== 'knowledge' && type !== 'entrepreneurs') {
      toast.error('Category is required');
      isSubmittingRef.current = false;
      return false;
    }

    setSaving(true);
    try {
      let contentHtml = editor?.getHTML() || '';

      // For blog/knowledge allow empty content (draft without body is fine)
      if ((!contentHtml || contentHtml === '<p></p>') && type !== 'blog' && type !== 'knowledge') {
        toast.warning('Please add some content before saving');
        setSaving(false);
        isSubmittingRef.current = false;
        return false;
      }

      // Senior Engineer Fix: Sanitize content before saving (Google Docs compatible)
      contentHtml = contentHtml
        .replace(/^(<p>\s*<br\s*\/?>\s*<\/p>|<p>\s*<\/p>|<br\s*\/?>|\s)+/gi, '') // Trim top
        .replace(/(<p>\s*<br\s*\/?>\s*<\/p>|<p>\s*<\/p>|<br\s*\/?>|\s)+$/gi, '') // Trim bottom
        .replace(/<p[^>]*>(?:<[^>]+>)*\s*SEO Title:[\s\S]*?<\/p>/gi, '') // Remove styled metadata
        .replace(/<p[^>]*>(?:<[^>]+>)*\s*Meta Description:[\s\S]*?<\/p>/gi, '') // Remove styled metadata
        .replace(/(<p>\s*<br\s*\/?>\s*<\/p>){2,}/gi, '<p><br></p>'); // Consolidate multiple breaks

      // Extract FAQs from content
      const faqBlocks = document.createElement('div');
      faqBlocks.innerHTML = contentHtml;
      const faqNodes = faqBlocks.querySelectorAll('faq-section');
      let extractedFaqs = [];
      faqNodes.forEach(node => {
        try {
          const data = node.getAttribute('data-faqs');
          if (data) {
            extractedFaqs = [...extractedFaqs, ...JSON.parse(data)];
          }
        } catch (e) {
          console.error('Error parsing FAQs from content:', e);
        }
      });

      // Lookup names for denormalization
      const selectedCategory = categories.find(cat => cat.id == category);
      const selectedAuthor = authorsList.find(auth => auth.id == authorId);

      const payload = {
        type,
        title,
        slug,
        excerpt,
        content: contentHtml,
        category_id: category, // Keep as string Firestore ID
        // Priority: overrideStatus > current state status
        status: isScheduled ? 'scheduled' : (overrideStatus || status),
        scheduled_at: isScheduled ? scheduledAt : null,
        featured_image: featuredImage,
        featured_image_alt: featuredImageAlt,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
        og_image: ogImage,
        og_image_alt: ogImageAlt,
        focus_keyword: focusKeyword,
        is_pillar_content: isPillarContent,
        canonical_url: canonicalUrl,
        breadcrumb_title: breadcrumbTitle,
        robots_meta: robotsMeta,
        advanced_robots: advancedRobots,
        redirection: redirection,
        social_meta: socialMeta,
        faqs: extractedFaqs, // Keep array in sync for SEO component
        // Include all specialized fields in payload
        designation,
        headquarters,
        employee_size: employeeSize,
        company_page_url: companyPageUrl,
        life_at_company: lifeAtCompanyEditor?.getHTML() || '',
        social_linkedin: socialLinkedin,
        social_twitter: socialTwitter,
        social_facebook: socialFacebook,
        email,
        phone,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        source: source,
        founded_year: foundedYear,
        expertise,
        education,
        website,
        is_featured: isFeatured,
        listing_type: listingType,
        startup_stage: startupStage,
        industry,
        city,
        country,
        authorId,
        author_name: selectedAuthor?.name || '',
        author_slug: selectedAuthor?.slug || '',
        author_photo: selectedAuthor?.photo || '',
        author_designation: selectedAuthor?.designation || '',
        website_link_settings: websiteLinkSettings,
        logo: type === 'directory' ? (featuredImage || logo) : logo,
        logo_alt: type === 'directory' ? (featuredImageAlt || logoAlt) : logoAlt,
        photo: type === 'entrepreneurs' ? (featuredImage || photo) : photo,
        photo_alt: type === 'entrepreneurs' ? (featuredImageAlt || photoAlt) : photoAlt,
        gender: type === 'entrepreneurs' ? gender : undefined,
        cover_image: (type === 'directory' || type === 'entrepreneurs') ? coverImage : (featuredImage || coverImage),
        cover_image_alt: (type === 'directory' || type === 'entrepreneurs') ? coverImageAlt : (featuredImageAlt || coverImageAlt),
        leadership_team: leadershipTeam,
        linked_business: linkedBusiness,
        // MIRROR FIELDS for frontend compatibility
        founder_name: leadershipTeam.founder.name,
        ceo_name: leadershipTeam.ceo.name,
        business_name: type === 'directory' ? title : (linkedBusiness.type === 'linked' ? linkedBusiness.name : companyName),
        company_name: linkedBusiness.type === 'linked' ? linkedBusiness.name : companyName,
        linked_business_slug: linkedBusiness.type === 'linked' ? linkedBusiness.slug : null,
        name: type === 'entrepreneurs' ? title : null,
        role_title: designation,
        // Extra human-readable metadata for fast rendering
        listing_type_name: type === 'directory' ? (listingTypes.find(t => t.id === listingType || t.slug === listingType)?.name || listingType) : null,
        category_name: selectedCategory?.name || categories.find(c => c.id === parseInt(category) || c.id === category)?.name || '',
        // Sync excerpt to fields used by the frontend for intro text
        details: type === 'entrepreneurs' ? excerpt : null,
        short_description: type === 'directory' ? excerpt : null,
        // Per-post custom code
        custom_css: customCss,
        custom_js: customJs,
        custom_head_html: customHeadHtml,
        custom_schema: customSchema,
        // Standardized timestamps
        updated_at: new Date()
      };

      // Strip any undefined fields to prevent Firestore crashes
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      console.log('Saving content to database:', payload);

      let response;
      if (itemId) {
        // Update existing content
        response = await contentAPI.update(itemId, payload);
      } else {
        // Create new content
        response = await contentAPI.create(payload);
      }


      toast.success(`Content ${status === 'published' ? 'published' : 'saved'} successfully!`);
      setIsDirty(false); // Reset dirty state on successful save

      if (!itemId && response?.id) {
        navigate(`/admin/content-editor?type=${type}&id=${response.id}`, { replace: true });
      }
      return true;
    } catch (error) {
      console.error('Save error:', error);
      const errorMsg = error.message || 'Failed to save content';
      toast.error(`${errorMsg}. Please check your internet connection or Firestore permissions.`);
      return false;
    } finally {
      setSaving(false);
      isSubmittingRef.current = false;
    }
  };

  const handleGenerateSchema = async () => {
    setIsGeneratingSchema(true);
    try {
      const prompt = `Generate a standard, 100% compliant Schema.org JSON-LD snippet for a ${type} page.
Title: ${title}
Description: ${excerpt || seoDescription}
${companyName ? `Company: ${companyName}` : ''}
${founderName ? `Founder: ${founderName}` : ''}
Only output the raw JSON object, nothing else. Do not use markdown wrapping (\`\`\`json). Start exactly with { and end with }.`;

      const res = await aiAPI.copilotAction({
        action: 'custom',
        prompt: prompt,
        text: excerpt || title || 'Post'
      });
      
      let schemaStr = res.result.trim();
      if (schemaStr.startsWith('```json')) schemaStr = schemaStr.replace(/```json/i, '').replace(/```/g, '').trim();
      else if (schemaStr.startsWith('```')) schemaStr = schemaStr.replace(/```/g, '').trim();
      
      // Format it beautifully
      try {
        const parsed = JSON.parse(schemaStr);
        schemaStr = JSON.stringify(parsed, null, 2);
      } catch(e) {}
      
      setCustomSchema(schemaStr);
      toast.success('Schema generated successfully!');
      setIsDirty(true);
    } catch (err) {
      toast.error('Failed to generate schema with AI.');
      console.error(err);
    } finally {
      setIsGeneratingSchema(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setStatus('published');
    // Pass 'published' directly to handleSave to avoid state update race condition
    await handleSave('published');
    setPublishing(false);
  };

  // Generate preview URL based on content type
  const getPreviewUrl = () => {
    const contentTypeRoutes = {
      blog: `/blog/${slug}`,
      entrepreneurs: `/entrepreneurs/${slug}`,
      directory: `/directory/${slug}`,
      knowledge: `/knowledge/${slug}`
    };
    return contentTypeRoutes[type] || '/';
  };

  if (!contentLoaded) {
    return (
      <div className="content-editor-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', marginBottom: '20px' }}>Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-editor-panel">
      {/* Header Section */}
      <div className="editor-header">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/content-manager?type=' + type)}
            className="back-btn"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="editor-title">Content Editor</h1>
            {itemId && (
              <Badge className={
                status === 'published' 
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }>
                {status === 'published' ? 'Live' : 'Draft'}
              </Badge>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button className="preview-btn" onClick={() => window.open(getPreviewUrl(), '_blank')}>
            <Eye size={16} /> <span className="hidden sm:inline">Preview</span>
          </button>
          <button className="save-btn" onClick={() => handleSave()} disabled={saving || publishing}>
            <Save size={16} /> <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
          </button>
          <button 
            className="publish-btn"
            onClick={handlePublish} 
            disabled={saving || publishing}
          >
            {publishing ? '...' : 
             isScheduled ? 'Schedule' : 
             status === 'published' ? 'Update' : 
             status === 'pending' ? 'Approve' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="p-6">
      
      {isDirty && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-4 mb-8 flex items-center justify-between shadow-xl shadow-emerald-100 border border-emerald-500/20 animate-in fade-in slide-in-from-top-6 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Unsaved Draft Progress</p>
              <p className="text-[11px] text-emerald-100 opacity-90">Changes detected. Save as draft to prevent data loss.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsDirty(false)} 
              className="text-sm h-9 text-white hover:bg-white/10 border-white/20"
            >
              Ignore Changes
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleSave()} 
              className="text-sm h-9 bg-white text-emerald-700 hover:bg-emerald-50 border-0 font-bold px-5"
            >
              Save Draft Now
            </Button>
          </div>
        </div>
      )}

      {/* Branded Navigation Blocker Dialog */}
      <Dialog open={blocker.state === 'blocked'} onOpenChange={() => blocker.reset()}>
        <DialogContent className="sm:max-w-[425px] bg-white border-emerald-100 rounded-3xl p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-stone-900 tracking-tight">Unsaved Progress!</DialogTitle>
              <DialogDescription className="text-stone-500 pt-2">
                You have unsaved changes in your editor. If you leave now, these changes will be lost forever.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="w-full flex-col sm:flex-row gap-3 pt-6">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl h-12 border-stone-200"
                onClick={() => blocker.proceed()}
              >
                Leave anyway
              </Button>
              <Button 
                className="flex-1 rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                onClick={async () => {
                  const success = await handleSave();
                  if (success) {
                    blocker.proceed();
                  }
                }}
              >
                Save & Continue
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="editor-main">
        {/* Left: Content Editor */}
        <div className="editor-left">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label>
                  {type === 'entrepreneurs' ? 'Full Name *' : 
                   type === 'directory' ? 'Business Name *' : 
                   'Title *'}
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'entrepreneurs' ? 'Enter name' : 'Enter title'}
                />
                
                {slug && (
                  <div className="mt-2 flex items-center text-sm text-stone-500 bg-stone-50 py-1.5 px-3 rounded-md border border-stone-100 inline-flex">
                    <span className="font-medium">URL: </span>
                    <span className="ml-1 text-stone-400">https://entrepreneurs.bd/{type === 'blog' ? '' : type + '/' }</span>
                    {isEditingSlug ? (
                      <div className="flex items-center gap-2 ml-1">
                        <Input 
                          value={slug}
                          onChange={(e) => {
                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                            setManualSlugSet(true);
                          }}
                          className="h-6 text-xs py-0 px-1.5 w-40 border-emerald-500 focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-sm"
                          autoFocus
                          onBlur={() => setIsEditingSlug(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingSlug(false)}
                        />
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50 rounded-sm"
                          onClick={() => setIsEditingSlug(false)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center ml-1">
                        <span className="text-stone-700 font-medium">{slug}</span>
                        <button 
                          type="button"
                          className="h-5 px-2 ml-2 text-[11px] font-bold tracking-wide uppercase bg-stone-200 text-stone-600 hover:bg-stone-300 rounded transition-colors"
                          onClick={() => setIsEditingSlug(true)}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {type === 'entrepreneurs' && (
                 <>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label>Designation</label>
                       <Input
                         value={designation}
                         onChange={(e) => setDesignation(e.target.value)}
                         placeholder="e.g. Founder & CEO"
                       />
                     </div>
                     <div>
                      <div className="space-y-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold uppercase text-stone-500">Company / Organization</label>
                          <select 
                            className="text-[10px] bg-white text-stone-900 border border-stone-300 rounded px-2 py-1 shadow-sm"
                            value={linkedBusiness.type}
                            onChange={(e) => setLinkedBusiness(prev => ({
                              ...prev,
                              type: e.target.value
                            }))}
                          >
                            <option value="manual">Manual Entry</option>
                            <option value="linked">Link Listing</option>
                          </select>
                        </div>

                        {linkedBusiness.type === 'linked' ? (
                          <div className="space-y-2">
                             <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {linkedBusiness.id
                                      ? listingsList.find((l) => l.id === linkedBusiness.id)?.business_name
                                      : "Select Listing..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] p-0 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
                                  <Command className="bg-white">
                                    <CommandInput 
                                      placeholder="Search directory..."
                                      value={leadershipSearch.business}
                                      onValueChange={(val) => setLeadershipSearch(prev => ({ ...prev, business: val }))}
                                    />
                                    <CommandList>
                                      <CommandEmpty>No listing found.</CommandEmpty>
                                      <CommandGroup>
                                        {listingsList
                                          .filter(l => l.business_name?.toLowerCase().includes(leadershipSearch.business.toLowerCase()))
                                          .map(l => (
                                          <CommandItem
                                            key={l.id}
                                            value={l.business_name}
                                            onSelect={() => {
                                              setLinkedBusiness(prev => ({
                                                ...prev,
                                                id: l.id,
                                                name: l.business_name || '',
                                                slug: l.slug || ''
                                              }));
                                              setCompanyName(l.business_name || '');
                                              // Close popover handled contextually or by clicking outside
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                linkedBusiness.id === l.id ? "opacity-100" : "opacity-0"
                                              }`}
                                            />
                                            {l.business_name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                          </div>
                        ) : (
                          <Input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Target Company"
                          />
                        )}
                      </div>
                     </div>
                   </div>
                   <div className="space-y-4">
                     <QuickSelector
                       label="Startup Stage"
                       value={startupStage}
                       onChange={setStartupStage}
                       options={startupStages}
                       taxType="stage"
                       placeholder="Select Stage"
                     />
                     <QuickSelector
                       label="Industry"
                       value={industry}
                       onChange={setIndustry}
                       options={industries}
                       taxType="industry"
                       placeholder="Select Industry"
                     />
                     <div>
                       <label>Expertise</label>
                       <Input
                         value={expertise}
                         onChange={(e) => setExpertise(e.target.value)}
                         placeholder="e.g. Technology, Finance, Health"
                       />
                     </div>
                     <div>
                       <label>Education</label>
                       <Input
                         value={education}
                         onChange={(e) => setEducation(e.target.value)}
                         placeholder="e.g. BS Computer Science, Stanford"
                       />
                     </div>
                     <div>
                       <label>Founded Year</label>
                       <Input
                         value={foundedYear}
                         onChange={(e) => setFoundedYear(e.target.value)}
                         placeholder="e.g. 2021"
                       />
                     </div>
                     {submittedIndustry && (
                       <p className="text-[10px] text-emerald-600 font-bold px-1 uppercase leading-tight mt-1">
                         User Submitted: {submittedIndustry}
                       </p>
                     )}
                     <QuickSelector
                       label="City"
                       value={city}
                       onChange={setCity}
                       options={cities}
                       taxType="city"
                       placeholder="Select City"
                     />
                     {submittedCity && (
                       <p className="text-[10px] text-emerald-600 font-bold px-1 uppercase leading-tight mt-1">
                         User Submitted: {submittedCity}
                       </p>
                     )}
                   </div>
                 </>
               )}

              {type === 'directory' && (
                <>
                  <div className="space-y-6 pb-6 mb-6 border-b border-stone-100">
                    <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" /> Leadership Team
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Founder Selector */}
                      <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold uppercase text-stone-500">Founder</label>
                          <select 
                            className="text-[10px] bg-white text-stone-900 border border-stone-300 rounded px-2 py-1 shadow-sm"
                            value={leadershipTeam.founder.type}
                            onChange={(e) => setLeadershipTeam(prev => ({
                              ...prev,
                              founder: { ...prev.founder, type: e.target.value }
                            }))}
                          >
                            <option value="manual">Manual Entry</option>
                            <option value="linked">Link Profile</option>
                          </select>
                        </div>

                        {leadershipTeam.founder.type === 'linked' ? (
                          <div className="space-y-2">
                             <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {leadershipTeam.founder.id
                                      ? entrepreneursList.find((en) => en.id === leadershipTeam.founder.id)?.name
                                      : "Select Entrepreneur..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] p-0 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
                                  <Command className="bg-white">
                                    <CommandInput 
                                      placeholder="Search entrepreneur..."
                                      value={leadershipSearch.founder}
                                      onValueChange={(val) => setLeadershipSearch(prev => ({ ...prev, founder: val }))}
                                    />
                                    <CommandList>
                                      <CommandEmpty>No entrepreneur found.</CommandEmpty>
                                      <CommandGroup>
                                        {entrepreneursList
                                          .filter(en => en.name.toLowerCase().includes(leadershipSearch.founder.toLowerCase()))
                                          .map(en => (
                                          <CommandItem
                                            key={en.id}
                                            value={en.name}
                                            onSelect={() => {
                                              setLeadershipTeam(prev => ({
                                                ...prev,
                                                founder: { 
                                                  ...prev.founder, 
                                                  id: en.id, 
                                                  slug: en?.slug || '', 
                                                  name: en?.name || '', 
                                                  photo: en?.photo || en?.featured_image || '' 
                                                }
                                              }));
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                leadershipTeam.founder.id === en.id ? "opacity-100" : "opacity-0"
                                              }`}
                                            />
                                            {en.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Input 
                              placeholder="Name" 
                              value={leadershipTeam.founder.name} 
                              onChange={(e) => setLeadershipTeam(prev => ({ 
                                ...prev, 
                                founder: { ...prev.founder, name: e.target.value } 
                              }))} 
                            />
                            <ImageUploader 
                              value={leadershipTeam.founder.photo} 
                              onChange={(url) => setLeadershipTeam(prev => ({
                                ...prev,
                                founder: { ...prev.founder, photo: url }
                              }))}
                              placeholder="Link Photo"
                              entityType="leadership"
                            />
                          </div>
                        )}
                      </div>

                      {/* CEO Selector */}
                      <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold uppercase text-stone-500">CEO / Lead</label>
                          <select 
                            className="text-[10px] bg-white text-stone-900 border border-stone-300 rounded px-2 py-1 shadow-sm"
                            value={leadershipTeam.ceo.type}
                            onChange={(e) => setLeadershipTeam(prev => ({
                              ...prev,
                              ceo: { ...prev.ceo, type: e.target.value }
                            }))}
                          >
                            <option value="manual">Manual Entry</option>
                            <option value="linked">Link Profile</option>
                          </select>
                        </div>

                        {leadershipTeam.ceo.type === 'linked' ? (
                          <div className="space-y-2">
                             <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {leadershipTeam.ceo.id
                                      ? entrepreneursList.find((en) => en.id === leadershipTeam.ceo.id)?.name
                                      : "Select Entrepreneur..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] p-0 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
                                  <Command className="bg-white">
                                    <CommandInput 
                                      placeholder="Search entrepreneur..."
                                      value={leadershipSearch.ceo}
                                      onValueChange={(val) => setLeadershipSearch(prev => ({ ...prev, ceo: val }))}
                                    />
                                    <CommandList>
                                      <CommandEmpty>No entrepreneur found.</CommandEmpty>
                                      <CommandGroup>
                                        {entrepreneursList
                                          .filter(en => en.name.toLowerCase().includes(leadershipSearch.ceo.toLowerCase()))
                                          .map(en => (
                                          <CommandItem
                                            key={en.id}
                                            value={en.name}
                                            onSelect={() => {
                                              setLeadershipTeam(prev => ({
                                                ...prev,
                                                ceo: { 
                                                  ...prev.ceo, 
                                                  id: en.id, 
                                                  slug: en?.slug || '', 
                                                  name: en?.name || '', 
                                                  photo: en?.photo || en?.featured_image || '' 
                                                }
                                              }));
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                leadershipTeam.ceo.id === en.id ? "opacity-100" : "opacity-0"
                                              }`}
                                            />
                                            {en.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Input 
                              placeholder="Name" 
                              value={leadershipTeam.ceo.name} 
                              onChange={(e) => setLeadershipTeam(prev => ({ 
                                ...prev, 
                                ceo: { ...prev.ceo, name: e.target.value } 
                              }))} 
                            />
                            <ImageUploader 
                              value={leadershipTeam.ceo.photo} 
                              onChange={(url) => setLeadershipTeam(prev => ({
                                ...prev,
                                ceo: { ...prev.ceo, photo: url }
                              }))}
                              placeholder="Link Photo"
                              entityType="leadership"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <QuickSelector
                      label="City"
                      value={city}
                      onChange={setCity}
                      options={cities}
                      taxType="city"
                      placeholder="Select City"
                    />
                    <div>
                      <label>Country</label>
                      <Input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. Bangladesh"
                      />
                    </div>
                    <div>
                      <label>Employee Size</label>
                      <select
                        value={employeeSize}
                        onChange={(e) => setEmployeeSize(e.target.value)}
                        className="input-select"
                      >
                        <option value="">Select Size</option>
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-500">201-500</option>
                        <option value="500+">500+</option>
                      </select>
                    </div>
                    <div>
                      <label>Founded Year</label>
                      <Input
                        value={foundedYear}
                        onChange={(e) => setFoundedYear(e.target.value)}
                        placeholder="e.g. 2010"
                      />
                    </div>
                    <QuickSelector
                      label="Listing Type"
                      value={listingType}
                      onChange={setListingType}
                      options={listingTypes}
                      taxType="listingType"
                      placeholder="Select Type"
                    />
                    <QuickSelector
                      label="Industry"
                      value={industry}
                      onChange={setIndustry}
                      options={industries}
                      taxType="industry"
                      placeholder="Select Industry"
                    />
                    {submittedIndustry && (
                      <p className="text-[10px] text-emerald-600 font-bold px-1 uppercase leading-tight mt-1">
                        User Submitted: {submittedIndustry}
                      </p>
                    )}
                    
                    <div className="col-span-2">
                      <label>Expertise / Products</label>
                      <Input
                        value={expertise}
                        onChange={(e) => setExpertise(e.target.value)}
                        placeholder="e.g. WordPress, SaaS, AI Tools"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      value={companyPageUrl}
                      onChange={(e) => setCompanyPageUrl(e.target.value)}
                      placeholder="https://company.com"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLinkSource('companyPageUrl');
                        setActiveLinkData({ 
                          href: companyPageUrl, 
                          target: websiteLinkSettings.target === '_blank', 
                          rel: websiteLinkSettings.rel 
                        });
                        setLinkDialogOpen(true);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-emerald-600 transition-colors"
                      title="Link Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-stone-100">
                    <h4 className="font-semibold text-sm">Contact Information</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Contact Email"
                      />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Contact Phone"
                      />
                      <div className="relative">
                        <Input
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="Website URL"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLinkSource('website');
                            setActiveLinkData({ 
                              href: website, 
                              target: websiteLinkSettings.target === '_blank', 
                              rel: websiteLinkSettings.rel 
                            });
                            setLinkDialogOpen(true);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-emerald-600 transition-colors"
                          title="Link Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-stone-100">
                    <h4 className="font-semibold text-sm">Social Media Profiles</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        value={socialLinkedin}
                        onChange={(e) => setSocialLinkedin(e.target.value)}
                        placeholder="LinkedIn URL"
                      />
                      <Input
                        value={socialTwitter}
                        onChange={(e) => setSocialTwitter(e.target.value)}
                        placeholder="Twitter URL"
                      />
                      <Input
                        value={socialFacebook}
                        onChange={(e) => setSocialFacebook(e.target.value)}
                        placeholder="Facebook URL"
                      />
                    </div>
                  </div>
                   <div>
                    <label>Life at Company (Rich Text)</label>
                    <div className="directory-rich-editor border rounded-md mt-1 overflow-hidden bg-white">
                      <div className="flex items-center gap-1 p-2 border-b bg-stone-50 overflow-x-auto">
                        <button 
                          onClick={() => lifeAtCompanyEditor?.chain().focus().toggleBold().run()} 
                          className={`p-1 rounded hover:bg-stone-200 ${lifeAtCompanyEditor?.isActive('bold') ? 'bg-stone-200' : ''}`}
                        >
                          <strong>B</strong>
                        </button>
                        <button 
                          onClick={() => lifeAtCompanyEditor?.chain().focus().toggleBulletList().run()} 
                          className={`p-1 rounded hover:bg-stone-200 ${lifeAtCompanyEditor?.isActive('bulletList') ? 'bg-stone-200' : ''}`}
                        >
                          Bullets
                        </button>
                        <button 
                          onClick={() => lifeAtCompanyEditor?.chain().focus().toggleOrderedList().run()} 
                          className={`p-1 rounded hover:bg-stone-200 ${lifeAtCompanyEditor?.isActive('orderedList') ? 'bg-stone-200' : ''}`}
                        >
                          Numbers
                        </button>
                      </div>
                      <EditorContent 
                        editor={lifeAtCompanyEditor} 
                        className="p-4 min-h-[150px] focus:outline-none prose prose-sm max-w-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {type !== 'entrepreneurs' && (
                <>
                  <QuickSelector
                    label="Category *"
                    value={category}
                    onChange={setCategory}
                    options={categories}
                    taxType="category"
                    placeholder="Select a category"
                  />
                  {submittedCategory && (
                    <p className="text-[10px] text-emerald-600 font-bold px-1 uppercase leading-tight mt-1">
                      User Submitted: {submittedCategory}
                    </p>
                  )}
                </>
              )}
              <div>
                <label>Status</label>
                <div className="status-buttons gap-2 flex">
                  <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                    status === 'draft' 
                      ? 'border-stone-900 bg-stone-900 text-white shadow-lg scale-[1.02]' 
                      : 'border-stone-100 bg-white text-stone-400 hover:border-stone-200'
                  }`}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                    status === 'published' 
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]' 
                      : 'border-stone-100 bg-white text-stone-400 hover:border-stone-200'
                  }`}
                >
                  Published
                </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  {type === 'entrepreneurs' ? 'Profile Photo' : 
                   type === 'directory' ? 'Company Logo' : 
                   'Featured Image'}
                </Label>
                <div className="mt-1">
                  <ImageUploader 
                    value={featuredImage} 
                    onChange={(url, meta) => {
                      setFeaturedImage(url);
                      if (meta && meta.alt) {
                        setFeaturedImageAlt(meta.alt);
                      }
                    }} 
                    entityType={type}
                    placeholder={`Upload ${type === 'entrepreneurs' ? 'photo' : 'image'}`}
                  />
                </div>
              </div>

              <QuickSelector
                label="Assigned Author"
                value={authorId}
                onChange={setAuthorId}
                options={authorsList}
                taxType="author"
                placeholder="Select Author"
              />
              <p className="text-[10px] text-stone-400 mt-1">Assign an official author for professional attribution.</p>

              {type === 'entrepreneurs' && (
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <h4 className="font-semibold text-sm">Social Profiles</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      value={socialLinkedin}
                      onChange={(e) => setSocialLinkedin(e.target.value)}
                      placeholder="LinkedIn URL"
                    />
                    <Input
                      value={socialTwitter}
                      onChange={(e) => setSocialTwitter(e.target.value)}
                      placeholder="Twitter URL"
                    />
                    <Input
                      value={socialFacebook}
                      onChange={(e) => setSocialFacebook(e.target.value)}
                      placeholder="Facebook URL"
                    />
                  </div>
                </div>
              )}

              <div>
                <label>
                  {type === 'entrepreneurs' ? 'Short Bio (Max 400 chars)' : 'Short Description (Used in lists)'}
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => {
                    if (type === 'entrepreneurs' && e.target.value.length > 400) return;
                    setExcerpt(e.target.value);
                  }}
                  placeholder={type === 'entrepreneurs' ? 'Brief introduction...' : 'Brief summary (used in lists)'}
                  className="textarea-input w-full p-2 border rounded"
                  rows={4}
                />
                {type === 'entrepreneurs' && (
                  <small className={`char-count ${excerpt.length > 350 ? 'text-orange-500' : ''}`}>
                    {excerpt.length}/400
                  </small>
                )}
              </div>

              <div className="featured-toggle-container">
                <input 
                  type="checkbox" 
                  id="featured-toggle"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <label htmlFor="featured-toggle" className="featured-label">
                  <Star className={`w-4 h-4 ${isFeatured ? 'fill-yellow-500 text-yellow-500' : 'text-stone-400'}`} />
                  Set as Featured Content
                </label>
              </div>
              {source === 'public' && (
                <div className="space-y-4 pt-6 border-t border-stone-200 bg-stone-50/50 p-4 rounded-xl">
                  <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Moderation Contact Info
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-stone-500 uppercase">Private Email</p>
                      <p className="text-sm font-semibold text-stone-900 selection:bg-emerald-100">{contactEmail || 'Not Provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-stone-500 uppercase">Private Phone</p>
                      <p className="text-sm font-semibold text-stone-900 selection:bg-emerald-100">{contactPhone || 'Not Provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dynamic FAQ Manager - Removed (now inline) */}

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="editor-toolbar">
                <div className="toolbar-group">
                  <button
                    onClick={() => {
                      console.log('Bold clicked, editor:', editor?.isEditable);
                      editor?.chain().focus().toggleBold().run();
                    }}
                    disabled={!editor}
                    title="Bold">
                    <strong>B</strong>
                  </button>
                  <button
                    onClick={() => {
                      console.log('Italic clicked');
                      editor?.chain().focus().toggleItalic().run();
                    }}
                    disabled={!editor}
                    title="Italic">
                    <em>I</em>
                  </button>
                  <button
                    onClick={() => {
                      console.log('Underline clicked');
                      editor?.chain().focus().toggleUnderline().run();
                    }}
                    disabled={!editor}
                    title="Underline">
                    <u>U</u>
                  </button>
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-group">
                  <button
                    onClick={() => {
                      console.log('H1 clicked');
                      editor?.chain().focus().toggleHeading({ level: 1 }).run();
                    }}
                    disabled={!editor}
                  >
                    H1
                  </button>
                  <button
                    onClick={() => {
                      console.log('H2 clicked');
                      editor?.chain().focus().toggleHeading({ level: 2 }).run();
                    }}
                    disabled={!editor}
                  >
                    H2
                  </button>
                  <button
                    onClick={() => {
                      console.log('H3 clicked');
                      editor?.chain().focus().toggleHeading({ level: 3 }).run();
                    }}
                    disabled={!editor}
                    className={editor?.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                  >
                    H3
                  </button>
                  <button
                    onClick={() => {
                      console.log('H4 clicked');
                      editor?.chain().focus().toggleHeading({ level: 4 }).run();
                    }}
                    disabled={!editor}
                    className={editor?.isActive('heading', { level: 4 }) ? 'is-active' : ''}
                  >
                    H4
                  </button>
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-group">
                  <button
                    onClick={() => {
                      console.log('Bullet List clicked');
                      editor?.chain().focus().toggleBulletList().run();
                    }}
                    disabled={!editor}
                  >
                    Bullet List
                  </button>
                  <button
                    onClick={() => {
                      console.log('Ordered List clicked');
                      editor?.chain().focus().toggleOrderedList().run();
                    }}
                    disabled={!editor}
                  >
                    Ordered List
                  </button>
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-group">
                  <button
                    onClick={() => {
                      console.log('Left align clicked');
                      editor?.chain().focus().setTextAlign('left').run();
                    }}
                    disabled={!editor}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => {
                      console.log('Center align clicked');
                      editor?.chain().focus().setTextAlign('center').run();
                    }}
                    disabled={!editor}
                  >
                    Center
                  </button>
                  <button
                    onClick={() => {
                      console.log('Right align clicked');
                      editor?.chain().focus().setTextAlign('right').run();
                    }}
                    disabled={!editor}
                  >
                    Right
                  </button>
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-group">
                  <button
                    onClick={() => setImageDialogOpen(true)}
                    disabled={!editor}
                  >
                    Image
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      const { href, target, rel } = editor?.getAttributes('link') || {};
                      setActiveLinkData({ href, target, rel });
                      setLinkDialogOpen(true);
                    }}
                    className={editor?.isActive('link') ? 'is-active' : ''}
                    disabled={!editor}
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const { from, to } = editor.state.selection;
                      const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();
                      buttonSelectionRef.current = { from, to };
                      setButtonLabel(selectedText || 'Read More');
                      setButtonUrl('');
                      setButtonOpenInNewTab(true);
                      setButtonDialogOpen(true);
                    }}
                    disabled={!editor}
                    title="Insert Button"
                  >
                    Button
                  </button>
                  <button
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    disabled={!editor}
                    title="Insert Table"
                  >
                    Table
                  </button>
                  <button
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    disabled={!editor || !editor.isActive('table')}
                    title="Add Column Before"
                  >
                    +Col Left
                  </button>
                  <button
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    disabled={!editor || !editor.isActive('table')}
                    title="Add Row After"
                  >
                    +Row Below
                  </button>
                  <button
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    disabled={!editor || !editor.isActive('table')}
                    title="Delete Table"
                    className="text-red-500 hover:text-red-600"
                  >
                    Del Table
                  </button>
                  <button
                    onClick={() => editor.chain().focus().insertContent({ type: 'faqSection', attrs: { faqs: [{ q: '', a: '' }] } }).run()}
                    disabled={!editor}
                    title="Insert FAQ Section"
                    className="flex items-center gap-1"
                  >
                    <HelpCircle size={14} /> FAQ
                  </button>
                  <button
                    onClick={() => { setCustomHtmlInput(''); setHtmlDialogOpen(true); }}
                    disabled={!editor}
                    title="Insert Custom HTML Block"
                    className="flex items-center gap-1"
                  >
                    <FileCode size={14} /> HTML
                  </button>
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-group flex items-center bg-indigo-50 border border-indigo-100 rounded-md p-1 ml-auto">
                  <span className="text-sm font-bold text-indigo-800 mx-2 flex items-center uppercase tracking-wider">AI Copilot</span>
                  {isCopilotLoading ? (
                    <span className="text-sm font-semibold text-indigo-600 px-2 py-1 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> Thinking...
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleCopilot('rewrite'); }} 
                        title="Rewrite Selected Text" 
                        disabled={!editor} 
                        className="text-indigo-700 hover:bg-indigo-100 p-1 rounded transition-colors"
                      >
                        <Wand2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleCopilot('expand'); }} 
                        title="Expand Selected Text" 
                        disabled={!editor} 
                        className="text-indigo-700 hover:bg-indigo-100 p-1 rounded transition-colors"
                      >
                        <Sparkles size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleCopilot('summarize'); }} 
                        title="Summarize" 
                        disabled={!editor} 
                        className="text-sm font-bold text-indigo-700 hover:bg-indigo-100 px-1.5 py-1 rounded transition-colors"
                      >
                        SUM
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleCopilot('grammar'); }} 
                        title="Fix Grammar" 
                        disabled={!editor} 
                        className="text-sm font-bold text-indigo-700 hover:bg-indigo-100 px-1.5 py-1 rounded transition-colors"
                      >
                        A+
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          const currentHtml = editor.getHTML();
                          const upgraded = upgradeLegacyFaqs(currentHtml);
                          if (upgraded !== currentHtml) {
                            editor.commands.setContent(upgraded);
                            toast.success('Smart FAQ Upgrade: Detected and converted items!');
                          } else {
                            toast('No new FAQ patterns detected.');
                          }
                        }}
                        disabled={!editor} 
                        title="Smart FAQ Scan: Detects plain-text FAQs and converts them to dynamic blocks"
                        className="text-sm font-bold text-indigo-700 hover:bg-indigo-100 px-1.5 py-1 rounded transition-colors flex items-center gap-1"
                      >
                        <Wand2 size={12} /> SCAN
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); setShowCustomCopilot(!showCustomCopilot); }} 
                        title="Custom AI Instruction" 
                        disabled={!editor} 
                        className={`text-sm font-bold px-1.5 py-1 rounded transition-colors ${showCustomCopilot ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-indigo-100'}`}
                      >
                        CUSTOM
                      </button>
                    </div>
                  )}
                </div>

                {showCustomCopilot && !isCopilotLoading && (
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 p-1 px-2 rounded-md ml-2 shadow-sm animate-in slide-in-from-left-1 duration-200">
                     <Input 
                        placeholder="E.g. Make it funnier, simplify, etc." 
                        value={customCopilotInstruction}
                        onChange={(e) => setCustomCopilotInstruction(e.target.value)}
                        className="h-7 text-sm border-indigo-200 focus:border-indigo-400 bg-white w-48"
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCopilot('custom', customCopilotInstruction);
                              setShowCustomCopilot(false);
                           }
                        }}
                     />
                     <button 
                        onClick={() => {
                           handleCopilot('custom', customCopilotInstruction);
                           setShowCustomCopilot(false);
                        }}
                        className="p-1 px-2 bg-indigo-600 text-white rounded text-[10px] font-bold hover:bg-indigo-700 transition-colors uppercase"
                     >
                        Go
                     </button>
                     <button 
                        onClick={() => setShowCustomCopilot(false)}
                        className="text-indigo-400 hover:text-indigo-600 p-0.5"
                     >
                        <X size={14} />
                     </button>
                  </div>
                )}

                <div className="toolbar-divider" />

                <div className="toolbar-group">
                  <button
                    onClick={() => {
                      console.log('Undo clicked');
                      editor?.chain().focus().undo().run();
                    }}
                    disabled={!editor}
                  >
                    Undo
                  </button>
                  <button
                    onClick={() => {
                      console.log('Redo clicked');
                      editor?.chain().focus().redo().run();
                    }}
                    disabled={!editor}
                  >
                    Redo
                  </button>
                </div>
              </div>

              <div className="editor-content" style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}>
                {!editor ? (
                  <div style={{ padding: '16px', color: '#999' }}>Loading editor...</div>
                ) : (
                  <>
                    <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                      {editor.isEditable ? '✓ Ready to edit' : '✗ Editor not editable'}
                    </div>
                    <EditorContent
                      editor={editor}
                      className="prose prose-stone max-w-none prose-headings:font-bold prose-a:text-emerald-600 focus:outline-none"
                      style={{
                        outline: 'none',
                        minHeight: '400px',
                      }}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right: SEO & Preview */}
        <div className="editor-right">
          {/* Scheduling Section */}
          <Card className="mb-6 border-emerald-200 shadow-sm">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 py-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Publishing Schedule
                </span>
                <button
                  type="button"
                  onClick={() => setIsScheduled(!isScheduled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isScheduled ? 'bg-emerald-600' : 'bg-stone-300'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isScheduled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              {isScheduled ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="border-emerald-200 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-2 text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                    <Check className="w-3 h-3" />
                    <span>This post will be marked as <strong>Scheduled</strong> when saved.</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-stone-500 italic">No future schedule set.</p>
                  <p className="text-[10px] text-stone-400 mt-1">Post will be published immediately on Save/Publish.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Section */}
          <Card className="mb-6 border-stone-200">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-stone-600">Premium Media Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Primary Image: Logo, Photo, or Featured Image */}
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-stone-400">
                  {type === 'directory' ? 'Business Logo' : 
                   type === 'entrepreneurs' ? 'Profile Photo' : 
                   'Featured Image'}
                  <span className="ml-1 text-stone-300 normal-case font-normal">(optional)</span>
                </label>
                <ImageUploader 
                  value={type === 'directory' ? logo : type === 'entrepreneurs' ? photo : featuredImage}
                  onChange={(url, meta) => {
                    if (type === 'directory') {
                      setLogo(url);
                      if (meta?.alt) setLogoAlt(meta.alt);
                    }
                    else if (type === 'entrepreneurs') {
                      setPhoto(url);
                      if (meta?.alt) setPhotoAlt(meta.alt);
                    }
                    else {
                      setFeaturedImage(url);
                      if (meta?.alt) setFeaturedImageAlt(meta.alt);
                    }
                  }}
                  entityType={type}
                  placeholder={type === 'directory' ? "Upload logo" : "Upload photo"}
                />
                <p className="text-[10px] text-stone-400">Recommended: Square format for logos and photos. Leave blank to use a default avatar.</p>
              </div>

              {/* Gender selector for Entrepreneurs (controls default avatar) */}
              {type === 'entrepreneurs' && !photo && !featuredImage && (
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-stone-400">Default Avatar Gender</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${gender === 'male' ? 'border-emerald-900 bg-emerald-50 text-emerald-900' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
                    >
                      👤 Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${gender === 'female' ? 'border-emerald-900 bg-emerald-50 text-emerald-900' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}
                    >
                      👤 Female
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400">Used for the default avatar when no photo is uploaded.</p>
                </div>
              )}

              {/* Cover Background (Only for Directory/Entrepreneurs) */}
              {(type === 'directory' || type === 'entrepreneurs') && (
                <div className="space-y-2 pt-4 border-t border-stone-100">
                  <label className="text-sm font-bold uppercase tracking-widest text-stone-400">Cover Background</label>
                  <ImageUploader 
                    value={coverImage}
                    onChange={(url, meta) => {
                      setCoverImage(url);
                      if (meta?.alt) setCoverImageAlt(meta.alt);
                    }}
                    entityType="cover"
                    placeholder="Premium background image"
                  />
                  <p className="text-[10px] text-stone-400">High resolution landscape image recommended.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Section (SEO modal trigger) */}
          <Card className="border-emerald-200">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 py-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                <span>SEO Suite</span>
                {focusKeyword && (
                  <Badge className="bg-emerald-700 text-white border-none">
                    Score: {(() => {
                      const rawContentText = editor?.getText() || '';
                      const contentWordCount = rawContentText.split(/\s+/).filter(Boolean).length;
                      const activeKeyword = focusKeyword.trim().toLowerCase();
                      const finalTitle = seoTitle || title;
                      const finalDesc = seoDescription || excerpt;
                      let score = 0;
                      const checks = {
                        keywordInTitle: activeKeyword ? finalTitle.toLowerCase().includes(activeKeyword) : false,
                        keywordInDescription: activeKeyword ? finalDesc.toLowerCase().includes(activeKeyword) : false,
                        keywordInContentBeginning: rawContentText.toLowerCase().slice(0, 500).includes(activeKeyword),
                        keywordInContent: rawContentText.toLowerCase().includes(activeKeyword)
                      };
                      if (checks.keywordInTitle) score += 25;
                      if (checks.keywordInDescription) score += 25;
                      if (checks.keywordInContentBeginning) score += 20;
                      if (checks.keywordInContent) score += 15;
                      if (contentWordCount >= 600) score += 15;
                      return score;
                    })()}/100
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Button 
                type="button" 
                onClick={() => setIsSEOModalOpen(true)} 
                className="w-full bg-emerald-950 hover:bg-emerald-900 text-white font-bold flex items-center justify-center gap-2 h-11 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" /> Edit SEO & Schema
              </Button>
              <div className="text-stone-500 text-xs space-y-1 bg-stone-50 p-3 rounded-lg border border-stone-150">
                <div className="flex justify-between">
                  <span>Focus Keyword:</span>
                  <strong className="text-stone-700">{focusKeyword || 'None set'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Pillar Content:</span>
                  <strong className="text-stone-700">{isPillarContent ? 'Yes' : 'No'}</strong>
                </div>
                {canonicalUrl && (
                  <div className="flex justify-between truncate">
                    <span>Canonical:</span>
                    <strong className="text-stone-700 truncate max-w-[120px]">{canonicalUrl}</strong>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="stat-row">
                <span>Word Count:</span>
                <strong>{editor?.getText().split(/\s+/).filter(Boolean).length || 0}</strong>
              </div>
              <div className="stat-row">
                <span>Content Length:</span>
                <strong>{(editor?.getHTML().length || 0).toLocaleString()} chars</strong>
              </div>
              <div className="stat-row">
                <span>Status:</span>
                <Badge className={status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}>
                  {status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Per-Post Custom Code */}
          <Card className="mt-6">
            <CardHeader 
              className="cursor-pointer" 
              onClick={() => setShowCustomCode(!showCustomCode)}
            >
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Code className="w-4 h-4" /> Custom Code
                </span>
                {showCustomCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {showCustomCode && (
              <CardContent className="space-y-4">
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  ⚠️ Code here only loads on this specific post/page.
                </div>
                <div>
                  <label className="text-sm font-semibold text-stone-500">Custom CSS</label>
                  <textarea
                    value={customCss}
                    onChange={(e) => setCustomCss(e.target.value)}
                    placeholder=".post-content { ... }"
                    className="w-full min-h-[80px] p-2 border rounded font-mono text-sm bg-stone-900 text-green-400 placeholder-stone-600 mt-1"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-stone-500">Custom JavaScript</label>
                  <textarea
                    value={customJs}
                    onChange={(e) => setCustomJs(e.target.value)}
                    placeholder="document.addEventListener('DOMContentLoaded', () => { ... });"
                    className="w-full min-h-[80px] p-2 border rounded font-mono text-sm bg-stone-900 text-green-400 placeholder-stone-600 mt-1"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-stone-500">Custom Head HTML</label>
                  <textarea
                    value={customHeadHtml}
                    onChange={(e) => setCustomHeadHtml(e.target.value)}
                    placeholder='<meta property="article:tag" content="startup" />'
                    className="w-full min-h-[60px] p-2 border rounded font-mono text-sm bg-stone-900 text-green-400 placeholder-stone-600 mt-1"
                    spellCheck={false}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open);
          if (!open) setLinkSource('editor');
        }}
        initialData={activeLinkData}
        onApply={(data) => {
          if (linkSource === 'website' || linkSource === 'companyPageUrl') {
            if (linkSource === 'website') setWebsite(data.href || '');
            if (linkSource === 'companyPageUrl') setCompanyPageUrl(data.href || '');
            setWebsiteLinkSettings({
              target: data.target || '_blank',
              rel: data.rel || ''
            });
            toast.success('Link settings applied');
          } else {
            if (data.href) {
              // Senior Engineer Fix: Trim selection to avoid linking leading/trailing spaces
              const { from, to } = editor.state.selection;
              const text = editor.state.doc.textBetween(from, to);

              if (text) {
                const leadSpaces = text.match(/^\s*/)[0].length;
                const trailSpaces = text.match(/\s*$/)[0].length;

                if (leadSpaces > 0 || trailSpaces > 0) {
                  editor.chain()
                    .focus()
                    .setTextSelection({ from: from + leadSpaces, to: to - trailSpaces })
                    .setLink(data)
                    .run();
                  return;
                }
              }

              editor.chain().focus().setLink(data).run();
            } else {
              editor.chain().focus().unsetLink().run();
            }
          }
        }}
      />

      <Dialog open={buttonDialogOpen} onOpenChange={setButtonDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-stone-200 shadow-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle>Insert Button</DialogTitle>
            <DialogDescription>
              Add a call-to-action button to the content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Button Label</label>
              <Input
                className="bg-white"
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
                placeholder="Read More"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">URL</label>
              <Input
                className="bg-white"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={buttonOpenInNewTab}
                onChange={(e) => setButtonOpenInNewTab(e.target.checked)}
              />
              Open in new tab
            </label>
          </div>

          <DialogFooter>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
              onClick={() => setButtonDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-emerald-900 text-white text-sm font-semibold hover:bg-emerald-800"
              onClick={handleApplyButton}
            >
              Insert Button
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageEditorDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onInsert={(data) => {
          editor.chain().focus().insertContent({
            type: 'image',
            attrs: data
          }).run();
        }}
      />

      {/* Custom HTML Block Dialog */}
      <Dialog open={htmlDialogOpen} onOpenChange={setHtmlDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" /> Insert Custom HTML Block
            </DialogTitle>
            <DialogDescription>
              Paste raw HTML code below. It will be inserted at the cursor position in the editor, just like WordPress's Custom HTML block.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              ⚠️ Only add trusted HTML. Incorrect code may break your content layout.
            </div>
            <textarea
              value={customHtmlInput}
              onChange={(e) => setCustomHtmlInput(e.target.value)}
              placeholder={'<!-- Paste your HTML here -->\n<div class="custom-block">\n  <h3>My Custom Section</h3>\n  <p>Custom content goes here...</p>\n</div>'}
              className="w-full min-h-[250px] p-3 border rounded-lg font-mono text-sm bg-stone-900 text-green-400 placeholder-stone-600"
              spellCheck={false}
              autoFocus
            />
            {customHtmlInput.trim() && (
              <div>
                <p className="text-sm font-semibold text-stone-500 mb-2">Preview:</p>
                <div 
                  className="p-4 border border-stone-200 rounded-lg bg-white max-h-[200px] overflow-auto prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: customHtmlInput }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHtmlDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-emerald-900 hover:bg-emerald-800"
              disabled={!customHtmlInput.trim()}
              onClick={() => {
                if (editor && customHtmlInput.trim()) {
                  editor.chain().focus().insertContent(customHtmlInput).run();
                  toast.success('HTML block inserted');
                  setHtmlDialogOpen(false);
                  setCustomHtmlInput('');
                }
              }}
            >
              <FileCode className="w-4 h-4 mr-2" /> Insert HTML
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SEOModal 
        isOpen={isSEOModalOpen} 
        onClose={() => setIsSEOModalOpen(false)} 
        seoData={{
          seo_title: seoTitle,
          seo_description: seoDescription,
          seo_keywords: seoKeywords,
          focus_keyword: focusKeyword,
          is_pillar_content: isPillarContent,
          canonical_url: canonicalUrl,
          breadcrumb_title: breadcrumbTitle,
          custom_schema: customSchema,
          robots_meta: robotsMeta,
          advanced_robots: advancedRobots,
          redirection: redirection,
          social_meta: socialMeta
        }}
        onChange={(newData) => {
          setSeoTitle(newData.seo_title || '');
          setSeoDescription(newData.seo_description || '');
          setSeoKeywords(newData.seo_keywords || '');
          setFocusKeyword(newData.focus_keyword || '');
          setIsPillarContent(!!newData.is_pillar_content);
          setCanonicalUrl(newData.canonical_url || '');
          setBreadcrumbTitle(newData.breadcrumb_title || '');
          setCustomSchema(newData.custom_schema || '');
          if (newData.robots_meta) setRobotsMeta(newData.robots_meta);
          if (newData.advanced_robots) setAdvancedRobots(newData.advanced_robots);
          if (newData.redirection) setRedirection(newData.redirection);
          if (newData.social_meta) {
            setSocialMeta(newData.social_meta);
            setOgImage(newData.social_meta.ogImage || '');
          }
        }}
        documentContent={editor?.getHTML() || ''}
        documentTitle={title}
        documentExcerpt={excerpt}
        contentType={type}
        defaultShareImage={featuredImage || logo || photo}
      />
      </div>
    </div>
  );
};

export default ContentEditorPanel;
