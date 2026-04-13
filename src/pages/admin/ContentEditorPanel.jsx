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
import { Save, ChevronLeft, Eye, Settings, Star } from 'lucide-react';
import { contentAPI, taxonomyAPI, categoryAPI } from '../../lib/api';
import ImageUploader from '../../components/common/ImageUploader';
import LinkDialog from '../../components/admin/LinkDialog';
import ImageEditorDialog from '../../components/admin/ImageEditorDialog';
import { Label } from '../../components/ui/label';
import { Pencil, Globe, Smartphone, Monitor } from 'lucide-react';
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

  const [categories, setCategories] = useState([
    { id: 1, name: 'Technology' },
    { id: 2, name: 'Marketing' },
    { id: 3, name: 'Finance' }
  ]);

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
    Highlight,
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
  });

  // Second Editor for "Life at Company" (Directory Only)
  const lifeAtCompanyEditor = useEditor({
    extensions: [
      ...sharedExtensions,
      Placeholder.configure({ placeholder: 'Describe company culture, environment, and perks...' })
    ],
    content: '',
    editable: true,
  });

  // Debug editor state
  useEffect(() => {
    if (editor) {
      console.log('✓ Editor created');
      console.log('  - Editable:', editor.isEditable);
      console.log('  - Can Bold:', editor.can().toggleBold().value);
      console.log('  - View:', !!editor.view);
    }
  }, [editor]);

  // Load existing content if editing
  useEffect(() => {
    if (editor) {
      setEditorReady(true);
      console.log('Editor is ready', editor.isEditable);

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

  // Load real categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryAPI.list();
        if (res.data && res.data.length > 0) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

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

  const handleSave = async () => {
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
      const content = editor?.getHTML() || '';

      console.log('Editor state:', {
        hasEditor: !!editor,
        content: content.substring(0, 100),
        contentLength: content.length,
        isEditable: editor?.isEditable,
      });

      if (!content || content === '<p></p>') {
        toast.warning('Please add some content before saving');
        setSaving(false);
        return;
      }

      const payload = {
        type,
        title,
        slug,
        excerpt,
        content,
        category_id: parseInt(category),
        // If editing existing content, force status to pending for re-approval
        status: itemId ? 'pending' : status,
        featured_image: featuredImage,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
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
        // Sync excerpt to fields used by the frontend for intro text
        details: type === 'entrepreneurs' ? excerpt : undefined,
        short_description: type === 'directory' ? excerpt : undefined
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
    // Ensure the status update is reflected in handleSave
    setTimeout(async () => {
      await handleSave();
      setPublishing(false);
    }, 0);
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
      {/* Header */}
      <div className="editor-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="editor-title" style={{ color: "#1c1917", opacity: 1 }}>Content Editor</h1>
        <div className="header-actions">
          <button onClick={() => window.open(getPreviewUrl(), '_blank')} style={{ marginRight: '4px' }}>
            <Eye size={18} /> Preview
          </button>
          <button onClick={handleSave} disabled={saving || publishing}>
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
                    <div>
                      <label>Headquarters</label>
                      <Input
                        value={headquarters}
                        onChange={(e) => setHeadquarters(e.target.value)}
                        placeholder="City, Country"
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

              <div>
                <label>Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-select"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Status</label>
                <div className="status-buttons gap-2 flex">
                  <button
                    onClick={() => setStatus('draft')}
                    className={`status-btn transition-all px-3 py-1 rounded border ${status === 'draft' ? 'bg-stone-200 border-stone-400' : 'bg-white border-stone-200'}`}
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => setStatus('published')}
                    className={`status-btn transition-all px-3 py-1 rounded border ${status === 'published' ? 'bg-emerald-100 border-emerald-400 text-emerald-900' : 'bg-white border-stone-200'}`}
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

              <div className="flex items-center gap-2 pt-4">
                <input 
                  type="checkbox" 
                  id="featured-toggle"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <label htmlFor="featured-toggle" className="flex items-center gap-1 cursor-pointer font-medium">
                  <Star className={`w-4 h-4 ${isFeatured ? 'fill-yellow-500 text-yellow-500' : 'text-stone-400'}`} />
                  Set as Featured Content
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor with Toolbar */}
          <Card className="mt-6">
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
