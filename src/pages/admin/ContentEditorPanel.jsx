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
import { Save, ChevronLeft, Eye, Settings } from 'lucide-react';
import { contentAPI } from '../../lib/api';
import '@tiptap/extension-text-style';
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
  const [contentLoaded, setContentLoaded] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  const [categories, setCategories] = useState([
    { id: 1, name: 'Technology' },
    { id: 2, name: 'Marketing' },
    { id: 3, name: 'Finance' }
  ]);

  // Initialize editor with minimal config for testing
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start typing here...</p>',
    autofocus: true,
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

            if (data.content) {
              editor.commands.setContent(data.content);
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
  }, [itemId, type, editor]);

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
        status,
        featured_image: featuredImage,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords
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
      if (error.response?.status === 400) {
        toast.error(error.response.data?.error || 'Failed to save content');
      } else {
        toast.error('Failed to save content. Make sure the backend is running on port 8001');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setStatus('published');
    await handleSave();
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
        <h1 className="editor-title">Content Editor</h1>
        <div className="header-actions">
          <button onClick={() => window.open(getPreviewUrl(), '_blank')} style={{ marginRight: '4px' }}>
            <Eye size={18} /> Preview
          </button>
          <button onClick={handleSave} disabled={saving}>
            <Save size={18} /> Save Draft
          </button>
          <button onClick={handlePublish} disabled={saving}>
            Publish
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
                <label>Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label>Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated"
                  disabled
                />
              </div>

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
                <div className="status-buttons">
                  <button
                    onClick={() => setStatus('draft')}
                    className={`status-btn ${status === 'draft' ? 'active' : ''}`}
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => setStatus('published')}
                    className={`status-btn ${status === 'published' ? 'active' : ''}`}
                  >
                    Published
                  </button>
                </div>
              </div>

              <div>
                <label>Featured Image URL</label>
                <Input
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
                {featuredImage && (
                  <img src={featuredImage} alt="Featured" className="featured-preview" />
                )}
              </div>

              <div>
                <label>Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary (used in lists)"
                  className="textarea-input"
                />
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
                    onClick={() => {
                      const url = prompt('Enter image URL:');
                      if (url) {
                        console.log('Adding image:', url);
                        editor?.chain().focus().setImage({ src: url }).run();
                      }
                    }}
                    disabled={!editor}
                  >
                    Image
                  </button>
                  <button
                    onClick={() => {
                      const url = prompt('Enter link URL:');
                      if (url) {
                        console.log('Adding link:', url);
                        editor?.chain().focus().setLink({ href: url }).run();
                      }
                    }}
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
                  <div className="preview-title">{seoTitle || title || 'Your Title'}</div>
                  <div className="preview-url">yoursite.com/{slug || 'url'}</div>
                  <div className="preview-description">
                    {seoDescription || 'Your meta description will appear here...'}
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
    </div>
  );
};

export default ContentEditorPanel;
