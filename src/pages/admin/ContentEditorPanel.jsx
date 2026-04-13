// src/pages/admin/ContentEditorPanel.jsx
// Advanced Content Editor with SEO, Categories, Rich Text

import React, { useState, useEffect, useRef } from 'react';
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
import { Save, ChevronLeft, Eye, Settings, Star, HelpCircle } from 'lucide-react';
import { contentAPI, taxonomyAPI, categoryAPI, blogCategoryAPI, authorAPI } from '../../lib/api';
import ImageUploader from '../../components/common/ImageUploader';
import LinkDialog from '../../components/admin/LinkDialog';
import ImageEditorDialog from '../../components/admin/ImageEditorDialog';
import { Label } from '../../components/ui/label';
import { Pencil, Globe, Smartphone, Monitor, Plus, X, Check } from 'lucide-react';
import FaqExtension from '../../components/editor/FaqExtension';
import './ContentEditorPanel.css';

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
  const [listingType, setListingType] = useState('');
  const [startupStage, setStartupStage] = useState('');
  
  // Author & FAQ State
  const [authorId, setAuthorId] = useState('');
  const [authorsList, setAuthorsList] = useState([]);
  const [faqs, setFaqs] = useState([]); // Array of { q: '', a: '' }

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

  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [activeLinkData, setActiveLinkData] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

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
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    FaqExtension,
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
            setTitle(data.title || '');
            setSlug(data.slug || '');
            setExcerpt(data.excerpt || '');
            setCategory(data.category_id?.toString() || '');
            setStatus(data.status || 'draft');
            setFeaturedImage(data.featured_image || '');
            setSeoTitle(data.seo_title || '');
            setSeoDescription(data.seo_description || '');
            setSeoKeywords(data.seo_keywords || '');
            setOgImage(data.og_image || '');

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

            if (data.content) {
              editor.commands.setContent(data.content);
            }
            if (data.life_at_company && lifeAtCompanyEditor) {
              lifeAtCompanyEditor.commands.setContent(data.life_at_company);
            }
            setListingType(data.listing_type || '');
            setStartupStage(data.startup_stage || '');
            setIndustry(data.industry || '');
            setCity(data.city || '');
            setAuthorId(data.authorId || '');
            setFaqs(data.faqs || []);
            setIsFeatured(data.is_featured || false);
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
  const refreshCategories = async () => {
    try {
      const res = type === 'blog' ? await blogCategoryAPI.list() : await categoryAPI.list();
      if (res.data) setCategories(res.data);
    } catch (error) { console.error('Error loading categories:', error); }
  };

  const refreshAuthors = async () => {
    try {
      const res = await authorAPI.list();
      if (res.data) setAuthorsList(res.data);
    } catch (error) { console.error('Error loading authors:', error); }
  };

  const refreshListingTypes = async () => {
    try {
      const res = await taxonomyAPI.list('listing_types');
      if (res.data) setListingTypes(res.data);
    } catch (error) { console.error('Error loading types:', error); }
  };

  const refreshStartupStages = async () => {
    try {
      const res = await taxonomyAPI.list('startup_stages');
      if (res.data) setStartupStages(res.data);
    } catch (error) { console.error('Error loading stages:', error); }
  };

  const refreshIndustries = async () => {
    try {
      const res = await taxonomyAPI.list('industries');
      if (res.data) setIndustries(res.data);
    } catch (error) { console.error('Error loading industries:', error); }
  };

  const refreshCities = async () => {
    try {
      const res = await taxonomyAPI.list('cities');
      if (res.data) setCities(res.data);
    } catch (error) { console.error('Error loading cities:', error); }
  };

  // Initial Data Loads
  useEffect(() => {
    refreshAuthors();
  }, []);

  useEffect(() => {
    refreshCategories();
  }, [type]);

  useEffect(() => {
    if (type === 'directory') {
      refreshListingTypes();
      refreshCities();
    }
    if (type === 'entrepreneurs') {
      refreshStartupStages();
      refreshIndustries();
    }
  }, [type]);

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
            <option key={opt.id || opt.slug || opt} value={opt.id || opt.slug || opt}>{opt.name || opt}</option>
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
      const contentHtml = editor?.getHTML() || '';

      if (!contentHtml || contentHtml === '<p></p>') {
        toast.warning('Please add some content before saving');
        setSaving(false);
        return;
      }

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

      const payload = {
        type,
        title,
        slug,
        excerpt,
        content: contentHtml,
        category_id: parseInt(category),
        // Priority: overrideStatus > current state status
        status: overrideStatus || status,
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
        is_featured: isFeatured,
        listing_type: listingType,
        startup_stage: startupStage,
        industry,
        city,
        authorId,
        // Sync excerpt to fields used by the frontend for intro text
        details: type === 'entrepreneurs' ? excerpt : null,
        short_description: type === 'directory' ? excerpt : null
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

      console.log('Save response:', response);
      toast.success(`Content ${status === 'published' ? 'published' : 'saved'} successfully!`);

      // Redirect after successful save
      setTimeout(() => {
        navigate(`/admin/content-manager?type=${type}`);
      }, 1500);
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
            {publishing ? 'Publishing...' : status === 'published' ? 'Update' : 'Publish'}
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
                       <label>Company Name</label>
                       <Input
                         value={companyName}
                         onChange={(e) => setCompanyName(e.target.value)}
                         placeholder="Target Company"
                       />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label>Founder Name</label>
                      <Input
                        value={founderName}
                        onChange={(e) => setFounderName(e.target.value)}
                        placeholder="Founder name"
                      />
                    </div>
                    <div>
                      <label>CEO Name</label>
                      <Input
                        value={ceoName}
                        onChange={(e) => setCeoName(e.target.value)}
                        placeholder="CEO name"
                      />
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
                  <div>
                    <label>Official Page URL</label>
                    <Input
                      value={companyPageUrl}
                      onChange={(e) => setCompanyPageUrl(e.target.value)}
                      placeholder="https://company.com"
                    />
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
                  >
                    H3
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
                </div>

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
        </div>
      </div>

      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        initialData={activeLinkData}
        onApply={(data) => {
          if (data.href) {
            editor.chain().focus().setLink(data).run();
          } else {
            editor.chain().focus().unsetLink().run();
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
    </div>
  );
};

export default ContentEditorPanel;
