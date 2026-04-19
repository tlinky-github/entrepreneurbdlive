// src/pages/admin/ContentEditorPanel.jsx
// Advanced Content Editor with SEO, Categories, Rich Text

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { Save, ChevronLeft, Eye, Settings, Star, HelpCircle, Code, ChevronDown, ChevronUp, FileCode, Calendar, Users, Wand2, Sparkles, Loader2 } from 'lucide-react';
import { contentAPI, taxonomyAPI, categoryAPI, blogCategoryAPI, authorAPI } from '../../lib/api';
import aiAPI from '../../lib/aiApi';
import ImageUploader from '../../components/common/ImageUploader';
import LinkDialog from '../../components/admin/LinkDialog';
import ImageEditorDialog from '../../components/admin/ImageEditorDialog';
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
  if (!html) return html;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const topLevelElements = Array.from(doc.body.children);
  if (topLevelElements.length === 0) return html;

  let nodesToRemove = new Set();
  let overviewData = { answer: null, takeaways: [], markerNode: null };
  let foundOverview = false;

  // --- PART 1: SMART OVERVIEW SCANNER (Quick Answer & Key Takeaways) ---
  // We use deep discovery to find these elements regardless of nesting
  const allElements = Array.from(doc.body.querySelectorAll('p, h1, h2, h3, h4, div'));
  
  // A. Find Quick Answer (Matches "Quick Answer:" or "Quick Overview:")
  const answerNode = allElements.find(el => /^(quick\s*answer|quick\s*overview):/i.test(el.innerText.trim()));
  if (answerNode) {
    // Preserve the original HTML structure (bold, links, etc)
    const rawHtml = answerNode.innerHTML;
    overviewData.answer = rawHtml.replace(/^(?:<[^>]*>)*\s*(quick\s*answer|quick\s*overview):\s*(?:<\/[^>]*>)*/i, '<strong>Quick Answer:</strong> ');
    overviewData.markerNode = answerNode;
    nodesToRemove.add(answerNode);
    foundOverview = true;
  }

  // B. Find Key Takeaways Header
  const takeawaysHeader = allElements.find(el => /^(key\s*takeaways|key\s*highlights|takeaways)$/i.test(el.innerText.trim()));
  if (takeawaysHeader) {
    if (!overviewData.markerNode) overviewData.markerNode = takeawaysHeader;
    nodesToRemove.add(takeawaysHeader);
    foundOverview = true;

    // Look for the NEAREST list below this header (within reasonable proximity)
    let next = takeawaysHeader.nextElementSibling;
    let attempts = 0;
    while (next && attempts < 5) {
      if (next.tagName === 'UL' || next.tagName === 'OL') {
        overviewData.takeawaysHtml = next.outerHTML; // Keep the whole list with its attributes/styles
        nodesToRemove.add(next);
        break;
      }
      next = next.nextElementSibling;
      attempts++;
    }
  }

  if (foundOverview) {
    const aside = document.createElement('aside');
    aside.className = 'ai-overview-block';
    
    // We treat Key Takeaways and Quick Overview the same - boxing them in the premium emerald container
    const answerHtml = overviewData.answer ? `<div class="quick-answer">${overviewData.answer}</div>` : '';
    const takeawaysHtml = overviewData.takeawaysHtml 
      ? `<h2>${takeawaysHeader ? takeawaysHeader.innerHTML : 'Key Takeaways'}</h2>${overviewData.takeawaysHtml}`
      : '';
    
    aside.innerHTML = `${answerHtml}${takeawaysHtml}`;
    
    if (overviewData.markerNode && overviewData.markerNode.parentNode) {
      overviewData.markerNode.parentNode.insertBefore(aside, overviewData.markerNode);
    }
  }

  // --- PART 2: FAQ SCANNER ---
  let faqStartIndex = -1;
  for (let i = 0; i < topLevelElements.length; i++) {
    const text = topLevelElements[i].innerText.trim();
    if (/^(frequently\s*asked\s*questions|faq|q&a|common\s*questions)$/i.test(text)) {
      faqStartIndex = i;
      break;
    }
  }

  let extractedFaqs = [];
  const scanStartIndex = faqStartIndex !== -1 ? faqStartIndex + 1 : 0;
  let inFaqZone = faqStartIndex !== -1;

  for (let i = scanStartIndex; i < topLevelElements.length; i++) {
    const el = topLevelElements[i];
    if (nodesToRemove.has(el)) continue;

    const text = el.innerText.trim();
    const styleAttr = (el.getAttribute('style') || '').toLowerCase();
    const isBold = (el.querySelector('strong, b') || styleAttr.includes('font-weight:700'));
    const isHeader = el.tagName.match(/^H[1-6]$/);
    const endsWithQuestion = text.endsWith('?');

    if (inFaqZone && (isBold || isHeader) && !endsWithQuestion && text.length > 5) break; 
    if (inFaqZone && text.length > 600) break;

    if (endsWithQuestion && text.length < 250 && text.length > 5) {
      inFaqZone = true;
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
        if ((nextEl.tagName.match(/^H[1-6]$/) || nextEl.querySelector('strong, b')) && !nextText.endsWith('?')) break;
        if (nextText.length > 600 || gatheredChars > 1500) break;
        
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
    }
  }

  // --- PART 3: ASSEMBLY & CLEANING ---
  if (extractedFaqs.length > 0) {
    const faqsJson = JSON.stringify(extractedFaqs).replace(/'/g, "&apos;");
    const faqTag = `<faq-section data-faqs='${faqsJson}'></faq-section>`;
    const markerNode = faqStartIndex !== -1 ? topLevelElements[faqStartIndex] : Array.from(nodesToRemove).find(n => n.innerText.includes('?'));
    
    if (markerNode && markerNode.parentNode) {
      const tempWrapper = document.createElement('div');
      tempWrapper.innerHTML = faqTag;
      const faqNode = tempWrapper.firstChild;
      markerNode.parentNode.insertBefore(faqNode, markerNode);
    }
    
    if (faqStartIndex !== -1) try { topLevelElements[faqStartIndex].remove(); } catch(e) {}
  }

  // Final removal of source nodes
  nodesToRemove.forEach(node => { try { node.remove(); } catch(e) {} });

  // Deep Clean Style Sanitization
  doc.querySelectorAll('[style]').forEach(el => {
    // Preserve the new overview block classes and styles
    if (el.closest('.ai-overview-block')) return; 

    const textLen = el.innerText.length;
    if (textLen > 300) el.style.fontWeight = 'normal';
    
    el.style.color = '';
    el.style.backgroundColor = '';
    el.style.fontFamily = '';
    el.style.fontSize = '';
    el.style.lineHeight = '';
    
    if (el.getAttribute('style') === '' || !el.style.length) {
      el.removeAttribute('style');
    }
  });

  doc.querySelectorAll('strong, b').forEach(bold => {
    if (bold.closest('.ai-overview-block')) return;
    if (bold.innerText.length > 500) {
      while (bold.firstChild) { bold.parentNode.insertBefore(bold.firstChild, bold); }
      bold.remove();
    }
  });

  doc.querySelectorAll('span').forEach(span => {
    if (span.closest('.ai-overview-block')) return;
    while (span.firstChild) { span.parentNode.insertBefore(span.firstChild, span); }
    span.remove();
  });

  return doc.body.innerHTML;
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
  const [saving, setSaving] = useState(false);
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

  // Specialized Fields
  const [designation, setDesignation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [founderName, setFounderName] = useState('');
  const [ceoName, setCeoName] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [employeeSize, setEmployeeSize] = useState('');
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
  const [photo, setPhoto] = useState('');
  const [coverImage, setCoverImage] = useState('');
  
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

  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [activeLinkData, setActiveLinkData] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

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

  // 1. Shared Extensions to prevent duplicates
  const sharedExtensions = [
    StarterKit.configure({
      history: true,
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
    FaqExtension,
    OverviewBlock,
    QuickAnswer,
  ];

  // Main Content Editor
  const editor = useEditor({
    extensions: [
      ...sharedExtensions,
      Placeholder.configure({ placeholder: 'Write your story...' })
    ],
    content: '<p>Start typing here...</p>',
    autofocus: true,
    editable: true,
    editorProps: {
      attributes: {
        class: 'tiptap-content focus:outline-none min-height: 400px;',
      },
      transformPastedHTML: (html) => {
        return upgradeLegacyFaqs(html);
      },
      handlePaste: (view, event) => {
        return false; // Let transformPastedHTML handle the structural conversion and cleaning
      }
    },
  });

  // Second Editor for "Life at Company" (Directory Only)
  const lifeAtCompanyEditor = useEditor({
    extensions: [
      ...sharedExtensions,
      Placeholder.configure({ placeholder: 'Describe company culture, environment, and perks...' })
    ],
    content: '',
    editable: true,
    editorProps: {
      attributes: {
        class: 'tiptap-content focus:outline-none min-height: 200px;',
      },
      transformPastedHTML: (html) => {
        // Senior Engineer Fix: Bulletproof DOM-based cleaning for Google Docs/External junk
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        doc.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
        doc.querySelectorAll('span').forEach(span => {
          while (span.firstChild) {
            span.parentNode.insertBefore(span.firstChild, span);
          }
          span.remove();
        });
        doc.querySelectorAll('font').forEach(font => {
          while (font.firstChild) {
            font.parentNode.insertBefore(font.firstChild, font);
          }
          font.remove();
        });
        return doc.body.innerHTML;
      },
    },
  });

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

            setTitle(data.title || '');
            setSlug(data.slug || '');
            setExcerpt(data.excerpt || '');
            setCategory(data.category_id || '');
            setStatus(data.status || 'draft');
            setFeaturedImage(data.featured_image || '');
            setSeoTitle(data.seo_title || '');
            setSeoDescription(data.seo_description || '');
            setSeoKeywords(data.seo_keywords || '');
            setFeaturedImage(data.featured_image || '');
            setOgImage(data.og_image || '');
            setLogo(data.logo || '');
            setPhoto(data.photo || '');
            setCoverImage(data.cover_image || '');

            // Load specialized fields
            setDesignation(data.designation || '');
            setCompanyName(data.company_name || data.business_name || '');
            setFounderName(data.founder_name || '');
            setCeoName(data.ceo_name || '');
            setHeadquarters(data.headquarters || '');
            setEmployeeSize(data.employee_size || '');
            setCompanyPageUrl(data.company_page_url || '');
            setLifeAtCompany(data.life_at_company || '');
            setSocialLinkedin(data.social_linkedin || '');
            setSocialTwitter(data.social_twitter || '');
            setSocialFacebook(data.social_facebook || '');
            setEmail(data.email || '');
            setPhone(data.phone || '');
            setWebsite(data.website || '');

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
            setCity(data.city || '');
            setAuthorId(data.authorId || '');
            setFaqs(data.faqs || []);
            setIsFeatured(data.is_featured || false);
            setCustomCss(data.custom_css || '');
            setCustomJs(data.custom_js || '');
            setCustomHeadHtml(data.custom_head_html || '');
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
      refreshEntrepreneurs();
    }
    if (type === 'entrepreneurs') {
      refreshStartupStages();
      refreshIndustries();
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

  // Auto-generate slug
  useEffect(() => {
    const newSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(newSlug);
  }, [title]);

  // Auto-fill SEO title if empty
  useEffect(() => {
    if (title && !seoTitle) {
      setSeoTitle(title);
    }
  }, [title, seoTitle]);

  const handleSave = async (overrideStatus = null) => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!category) {
      toast.error('Category is required');
      return;
    }

    setSaving(true);
    try {
      let contentHtml = editor?.getHTML() || '';

      if (!contentHtml || contentHtml === '<p></p>') {
        toast.warning('Please add some content before saving');
        setSaving(false);
        return;
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
        category_name: selectedCategory?.name || '',
        // Priority: overrideStatus > current state status
        status: isScheduled ? 'scheduled' : (overrideStatus || status),
        scheduled_at: isScheduled ? scheduledAt : null,
        featured_image: featuredImage,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
        og_image: ogImage,
        faqs: extractedFaqs, // Keep array in sync for SEO component
        // Include all specialized fields in payload
        designation,
        company_name: companyName,
        founder_name: founderName,
        ceo_name: ceoName,
        headquarters,
        employee_size: employeeSize,
        company_page_url: companyPageUrl,
        life_at_company: lifeAtCompanyEditor?.getHTML() || '',
        social_linkedin: socialLinkedin,
        social_twitter: socialTwitter,
        social_facebook: socialFacebook,
        email,
        phone,
        website,
        is_featured: isFeatured,
        listing_type: listingType,
        startup_stage: startupStage,
        industry,
        city,
        authorId,
        website_link_settings: websiteLinkSettings,
        author_name: selectedAuthor?.name || '',
        logo: type === 'directory' ? (featuredImage || logo) : logo,
        photo: type === 'entrepreneurs' ? (featuredImage || photo) : photo,
        cover_image: featuredImage || coverImage,
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
        category_name: categories.find(c => c.id === parseInt(category) || c.id === category)?.name || '',
        // Sync excerpt to fields used by the frontend for intro text
        details: type === 'entrepreneurs' ? excerpt : null,
        short_description: type === 'directory' ? excerpt : null,
        // Per-post custom code
        custom_css: customCss,
        custom_js: customJs,
        custom_head_html: customHeadHtml,
        // Standardized timestamps
        updated_at: new Date()
      };

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

      if (!itemId && response?.id) {
        navigate(`/admin/content-editor?type=${type}&id=${response.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Save error:', error);
      const errorMsg = error.message || 'Failed to save content';
      toast.error(`${errorMsg}. Please check your internet connection or Firestore permissions.`);
    } finally {
      setSaving(false);
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
    <div className="content-editor-panel p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/content-manager?type=' + type)}
            className="text-stone-500 hover:text-stone-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-stone-900 uppercase tracking-tight">Content Editor</h1>
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
            <p className="text-stone-500 text-sm">Create and refine your platform content</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => window.open(getPreviewUrl(), '_blank')} style={{ marginRight: '4px' }}>
            <Eye size={18} /> Preview
          </button>
          <button onClick={() => handleSave()} disabled={saving || publishing}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            onClick={handlePublish} 
            disabled={saving || publishing}
            style={{ backgroundColor: '#10b981', color: 'white' }}
          >
            {publishing ? 'Publishing...' : 
             isScheduled ? 'Schedule' : 
             status === 'published' ? 'Update' : 
             status === 'pending' ? 'Approve & Publish' : 'Publish'}
          </button>
        </div>
      </div>

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
                          <label className="text-xs font-bold uppercase text-stone-500">Company / Organization</label>
                          <select 
                            className="text-[10px] bg-white border rounded px-1"
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
                                <PopoverContent className="w-full p-0">
                                  <Command>
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
                          <label className="text-xs font-bold uppercase text-stone-500">Founder</label>
                          <select 
                            className="text-[10px] bg-white border rounded px-1"
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
                                <PopoverContent className="w-full p-0">
                                  <Command>
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
                          <label className="text-xs font-bold uppercase text-stone-500">CEO / Lead</label>
                          <select 
                            className="text-[10px] bg-white border rounded px-1"
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
                                <PopoverContent className="w-full p-0">
                                  <Command>
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
                    <QuickSelector
                      label="Listing Type"
                      value={listingType}
                      onChange={setListingType}
                      options={listingTypes}
                      taxType="listingType"
                      placeholder="Select Type"
                    />
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

               <QuickSelector
                label="Category *"
                value={category}
                onChange={setCategory}
                options={categories}
                taxType="category"
                placeholder="Select a category"
              />

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
                      if (meta) {
                        console.log('Image Meta:', meta);
                        // You could store these in the document state if needed
                        // For now, they are available here.
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
                    onClick={() => {
                      const { href, target, rel } = editor.getAttributes('link');
                      setActiveLinkData({ href, target, rel });
                      setLinkDialogOpen(true);
                    }}
                    className={editor?.isActive('link') ? 'is-active' : ''}
                    disabled={!editor}
                  >
                    Link
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
                  <span className="text-xs font-bold text-indigo-800 mx-2 flex items-center uppercase tracking-wider">AI Copilot</span>
                  {isCopilotLoading ? (
                    <span className="text-xs font-semibold text-indigo-600 px-2 py-1 flex items-center gap-1">
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
                        className="text-xs font-bold text-indigo-700 hover:bg-indigo-100 px-1.5 py-1 rounded transition-colors"
                      >
                        SUM
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleCopilot('grammar'); }} 
                        title="Fix Grammar" 
                        disabled={!editor} 
                        className="text-xs font-bold text-indigo-700 hover:bg-indigo-100 px-1.5 py-1 rounded transition-colors"
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
                        className="text-xs font-bold text-indigo-700 hover:bg-indigo-100 px-1.5 py-1 rounded transition-colors flex items-center gap-1"
                      >
                        <Wand2 size={12} /> SCAN
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); setShowCustomCopilot(!showCustomCopilot); }} 
                        title="Custom AI Instruction" 
                        disabled={!editor} 
                        className={`text-xs font-bold px-1.5 py-1 rounded transition-colors ${showCustomCopilot ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-indigo-100'}`}
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
                        className="h-7 text-xs border-indigo-200 focus:border-indigo-400 bg-white w-48"
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
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
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
                  <p className="text-xs text-stone-500 italic">No future schedule set.</p>
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
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  {type === 'directory' ? 'Business Logo *' : 
                   type === 'entrepreneurs' ? 'Profile Photo *' : 
                   'Featured Image *'}
                </label>
                <ImageUploader 
                  value={type === 'directory' ? logo : type === 'entrepreneurs' ? photo : featuredImage}
                  onChange={(url) => {
                    if (type === 'directory') setLogo(url);
                    else if (type === 'entrepreneurs') setPhoto(url);
                    else setFeaturedImage(url);
                  }}
                  entityType={type}
                  placeholder={type === 'directory' ? "Upload logo" : "Upload photo"}
                />
                <p className="text-[10px] text-stone-400">Recommended: Square format for logos and photos.</p>
              </div>

              {/* Cover Background (Only for Directory/Entrepreneurs) */}
              {(type === 'directory' || type === 'entrepreneurs') && (
                <div className="space-y-2 pt-4 border-t border-stone-100">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Cover Background</label>
                  <ImageUploader 
                    value={coverImage}
                    onChange={(url) => setCoverImage(url)}
                    entityType="cover"
                    placeholder="Premium background image"
                  />
                  <p className="text-[10px] text-stone-400">High resolution landscape image recommended.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Section */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label>SEO Title</label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  maxLength="60"
                  placeholder="Max 60 characters"
                />
                <small className="char-count">{seoTitle.length}/60</small>
              </div>

              <div>
                <label>Meta Description</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  maxLength="160"
                  placeholder="Max 160 characters"
                  className="textarea-small"
                />
                <small className="char-count">{seoDescription.length}/160</small>
              </div>

              <div>
                <label>Keywords</label>
                <textarea
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="Comma-separated keywords"
                  className="textarea-small"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Social Media Image (OpenGraph)</label>
                <ImageUploader 
                  value={ogImage}
                  onChange={(url) => setOgImage(url)}
                  entityType="seo"
                  placeholder="Custom image for social sharing"
                />
                <p className="text-[10px] text-stone-400">Controls how your link appears on Facebook, Twitter, and LinkedIn.</p>
              </div>

              <div className="seo-preview">
                <h4>Search Preview</h4>
                <div className="preview-item">
                  <div className="preview-title text-blue-700 text-lg hover:underline cursor-pointer">
                    {seoTitle || title || 'Your Title'}
                  </div>
                  <div className="preview-url flex items-center space-x-1 text-green-700 text-sm mt-1">
                    <span>yoursite.com/</span>
                    {isEditingSlug ? (
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        onBlur={() => setIsEditingSlug(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingSlug(false)}
                        className="border-b border-green-600 outline-none bg-transparent"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:underline flex items-center"
                        onClick={() => setIsEditingSlug(true)}
                      >
                        {slug || 'url'} <Pencil size={12} className="ml-1 opacity-40" />
                      </span>
                    )}
                  </div>
                  <div className="preview-description text-slate-600 text-sm mt-1">
                    {seoDescription || 'Your meta description will appear here on Google search results...'}
                  </div>
                </div>
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
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  ⚠️ Code here only loads on this specific post/page.
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500">Custom CSS</label>
                  <textarea
                    value={customCss}
                    onChange={(e) => setCustomCss(e.target.value)}
                    placeholder=".post-content { ... }"
                    className="w-full min-h-[80px] p-2 border rounded font-mono text-xs bg-stone-900 text-green-400 placeholder-stone-600 mt-1"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500">Custom JavaScript</label>
                  <textarea
                    value={customJs}
                    onChange={(e) => setCustomJs(e.target.value)}
                    placeholder="document.addEventListener('DOMContentLoaded', () => { ... });"
                    className="w-full min-h-[80px] p-2 border rounded font-mono text-xs bg-stone-900 text-green-400 placeholder-stone-600 mt-1"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500">Custom Head HTML</label>
                  <textarea
                    value={customHeadHtml}
                    onChange={(e) => setCustomHeadHtml(e.target.value)}
                    placeholder='<meta property="article:tag" content="startup" />'
                    className="w-full min-h-[60px] p-2 border rounded font-mono text-xs bg-stone-900 text-green-400 placeholder-stone-600 mt-1"
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
              editor.chain().focus().setLink(data).run();
            } else {
              editor.chain().focus().unsetLink().run();
            }
          }
        }}
      />

      <ImageEditorDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onInsert={(data) => {
          editor.chain().focus().setImage(data).run();
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
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
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
                <p className="text-xs font-semibold text-stone-500 mb-2">Preview:</p>
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
    </div>
  );
};

export default ContentEditorPanel;
