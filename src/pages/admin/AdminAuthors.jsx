import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  UserCircle, 
  Globe, 
  Linkedin, 
  Twitter, 
  Facebook,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { authorAPI } from '../../lib/api';
import ImageUploader from '../../components/common/ImageUploader';
import LinkDialog from '../../components/admin/LinkDialog';
import { Settings } from 'lucide-react';

const AdminAuthors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [facebook, setFacebook] = useState('');
  const [designation, setDesignation] = useState('');
  const [saving, setSaving] = useState(false);
  const [websiteLinkSettings, setWebsiteLinkSettings] = useState({ target: '_blank', rel: 'nofollow noopener noreferrer' });
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    setLoading(true);
    try {
      const res = await authorAPI.list();
      setAuthors(res.data);
    } catch (error) {
      console.error('Error loading authors:', error);
      toast.error('Failed to load authors');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (author) => {
    setEditingAuthor(author);
    setName(author.name || '');
    setBio(author.bio || '');
    setPhoto(author.photo || '');
    setWebsite(author.website || '');
    setLinkedin(author.linkedin || '');
    setTwitter(author.twitter || '');
    setFacebook(author.facebook || '');
    setDesignation(author.designation || '');
    setWebsiteLinkSettings(author.website_link_settings || { target: '_blank', rel: 'nofollow noopener noreferrer' });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingAuthor(null);
    setName('');
    setBio('');
    setPhoto('');
    setWebsite('');
    setLinkedin('');
    setTwitter('');
    setFacebook('');
    setDesignation('');
    setWebsiteLinkSettings({ target: '_blank', rel: 'nofollow noopener noreferrer' });
    setIsFormOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Author name is required');
      return;
    }

    setSaving(true);
    const payload = {
      name,
      bio,
      photo,
      website,
      linkedin,
      twitter,
      facebook,
      designation,
      website_link_settings: websiteLinkSettings
    };

    try {
      if (editingAuthor) {
        await authorAPI.update(editingAuthor.id, payload);
        toast.success('Author updated successfully');
      } else {
        await authorAPI.create(payload);
        toast.success('Author created successfully');
      }
      resetForm();
      loadAuthors();
    } catch (error) {
      console.error('Error saving author:', error);
      toast.error('Failed to save author');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this author? This will not delete their posts, but the author attribution might be lost.')) return;
    
    try {
      await authorAPI.delete(id);
      toast.success('Author deleted');
      loadAuthors();
    } catch (error) {
      console.error('Error deleting author:', error);
      toast.error('Failed to delete author');
    }
  };

  const filteredAuthors = authors.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Author Management</h1>
          <p className="text-stone-500">Create and manage professional profiles for your content team.</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-emerald-900 hover:bg-emerald-800"
          disabled={isFormOpen}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Author
        </Button>
      </div>

      {isFormOpen && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle>{editingAuthor ? 'Edit Author' : 'Create New Author'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Full Name *</label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g. Jane Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Biography</label>
                    <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full min-h-[120px] rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-900"
                      placeholder="Brief professional background..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Professional Designation</label>
                    <Input 
                      value={designation} 
                      onChange={(e) => setDesignation(e.target.value)} 
                      placeholder="e.g. Editor-in-Chief or Digital Marketer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Profile Photo</label>
                  <ImageUploader 
                    value={photo} 
                    onChange={setPhoto} 
                    className="h-48"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-stone-200">
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Website
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      value={website} 
                      onChange={(e) => setWebsite(e.target.value)} 
                      placeholder="https://..." 
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setLinkDialogOpen(true)}
                      title="Link Settings"
                      className={websiteLinkSettings?.rel?.includes('nofollow') ? 'border-amber-200 bg-amber-50 text-amber-600' : ''}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block flex items-center gap-2">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </label>
                  <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block flex items-center gap-2">
                    <Twitter className="w-4 h-4" /> Twitter
                  </label>
                  <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block flex items-center gap-2">
                    <Facebook className="w-4 h-4" /> Facebook
                  </label>
                  <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" className="bg-emerald-900 hover:bg-emerald-800" disabled={saving}>
                  {saving ? 'Saving...' : editingAuthor ? 'Update Author' : 'Create Author'}
                </Button>
              </div>
            </form>

            <LinkDialog
              open={linkDialogOpen}
              onOpenChange={setLinkDialogOpen}
              initialData={{ href: website, target: websiteLinkSettings.target, rel: websiteLinkSettings.rel }}
              onApply={(data) => {
                setWebsite(data.href);
                setWebsiteLinkSettings({ target: data.target, rel: data.rel });
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card className="border-stone-200">
        <CardHeader className="border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center justify-between">
            <CardTitle>Author Roster</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search authors..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredAuthors.length === 0 ? (
            <div className="p-12 text-center text-stone-500">
              <UserCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No authors found. Create your first author profile above.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredAuthors.map((author) => (
                <div key={author.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                      {author.photo ? (
                        <img src={author.photo} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">
                          {author.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900">{author.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs font-normal">
                          {author.designation || 'Author'}
                        </Badge>
                        <div className="flex items-center gap-1.5 ml-2">
                          {author.website && <Globe className="w-3.5 h-3.5 text-stone-400" />}
                          {author.linkedin && <Linkedin className="w-3.5 h-3.5 text-stone-400" />}
                          {author.twitter && <Twitter className="w-3.5 h-3.5 text-stone-400" />}
                          {author.facebook && <Facebook className="w-3.5 h-3.5 text-stone-400" />}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(author)}>
                      <Edit2 className="w-4 h-4 text-stone-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(author.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                    <div className="h-8 w-px bg-stone-200 mx-2" />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(`/author/${author.slug}`, '_blank')}
                      className="group"
                    >
                      <span className="text-sm text-stone-500 group-hover:text-emerald-900 mr-2">View Page</span>
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-900" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuthors;
