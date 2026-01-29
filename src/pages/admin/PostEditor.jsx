import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postAPI, categoryAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import TipTapEditor from '../../components/editor/TipTapEditor';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const PostEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content_json: { type: 'doc', content: [{ type: 'paragraph' }] },
    content_html: '',
    featured_image: '',
    category_id: '',
    tags: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    og_image: '',
    is_featured: false,
    status: 'draft',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const catsRes = await categoryAPI.list();
        setCategories(catsRes.data || []);

        if (isEditing) {
          const postRes = await postAPI.get(id);
          const post = postRes.data;
          setFormData({
            title: post.title || '',
            slug: post.slug || '',
            excerpt: post.excerpt || '',
            content_json: post.content_json || { type: 'doc', content: [{ type: 'paragraph' }] },
            content_html: post.content_html || '',
            featured_image: post.featured_image || '',
            category_id: post.category_id || '',
            tags: post.tags?.join(', ') || '',
            seo_title: post.seo_title || '',
            seo_description: post.seo_description || '',
            seo_keywords: post.seo_keywords || '',
            og_image: post.og_image || '',
            is_featured: post.is_featured || false,
            status: post.status || 'draft',
          });
        }
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditing]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from title
    if (field === 'title' && !isEditing) {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleEditorChange = ({ json, html }) => {
    setFormData(prev => ({
      ...prev,
      content_json: json,
      content_html: html,
    }));
  };

  const handleSave = async (status) => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        status,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        category_id: formData.category_id || null,
      };

      if (isEditing) {
        await postAPI.update(id, payload);
        toast.success('Post updated');
      } else {
        await postAPI.create(payload);
        toast.success('Post created');
      }
      
      navigate('/admin/posts');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to save post';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-900" />
      </div>
    );
  }

  return (
    <div data-testid="post-editor">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/posts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {isEditing ? 'Edit Post' : 'New Post'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>
          <Button
            className="bg-emerald-900 hover:bg-emerald-800"
            onClick={() => handleSave('published')}
            disabled={saving}
            data-testid="publish-post-btn"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-stone-200">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter post title"
                  className="mt-1"
                  data-testid="post-title-input"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="url-friendly-slug"
                  className="mt-1"
                  data-testid="post-slug-input"
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  placeholder="Brief summary of the post"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TipTapEditor
                content={formData.content_json}
                onChange={handleEditorChange}
                placeholder="Write your blog post content..."
              />
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                  placeholder="SEO optimized title (60 characters)"
                  maxLength={60}
                  className="mt-1"
                />
                <p className="text-xs text-stone-500 mt-1">{formData.seo_title.length}/60</p>
              </div>
              <div>
                <Label htmlFor="seo_description">Meta Description</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  placeholder="Meta description (160 characters)"
                  maxLength={160}
                  className="mt-1"
                  rows={3}
                />
                <p className="text-xs text-stone-500 mt-1">{formData.seo_description.length}/160</p>
              </div>
              <div>
                <Label htmlFor="seo_keywords">Keywords</Label>
                <Input
                  id="seo_keywords"
                  value={formData.seo_keywords}
                  onChange={(e) => handleChange('seo_keywords', e.target.value)}
                  placeholder="Comma-separated keywords"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="og_image">Open Graph Image URL</Label>
                <Input
                  id="og_image"
                  value={formData.og_image}
                  onChange={(e) => handleChange('og_image', e.target.value)}
                  placeholder="https://example.com/og-image.jpg"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(v) => handleChange('category_id', v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="featured">Featured Post</Label>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(v) => handleChange('is_featured', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.featured_image}
                onChange={(e) => handleChange('featured_image', e.target.value)}
                placeholder="Image URL"
              />
              {formData.featured_image && (
                <img
                  src={formData.featured_image}
                  alt="Featured"
                  className="mt-4 rounded-lg w-full h-40 object-cover"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;
