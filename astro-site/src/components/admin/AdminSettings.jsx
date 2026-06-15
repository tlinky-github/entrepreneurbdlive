import { useState, useEffect } from 'react';
import { settingsAPI, codeSnippetsAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { Save, Loader2, Globe, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube, Search, Code, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import ImageUploader from '../../components/common/ImageUploader';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    site_name: 'entrepreneurs.bd',
    site_tagline: 'Bangladesh Entrepreneur Ecosystem',
    logo_url: '',
    favicon_url: '',
    footer_text: '© 2024 entrepreneurs.bd. All rights reserved.',
    contact_email: '',
    contact_phone: '',
    address: '',
    facebook: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    seo_title: 'entrepreneurs.bd - Bangladesh Entrepreneur Ecosystem',
    seo_description: 'Connect with entrepreneurs, discover startups, and access resources for business growth in Bangladesh.',
    google_analytics_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Code snippets state
  const [snippets, setSnippets] = useState([]);
  const [snippetsLoading, setSnippetsLoading] = useState(false);
  const [newSnippet, setNewSnippet] = useState({ name: '', target: '*', css: '', js: '', html: '', enabled: true });
  const [editingSnippetId, setEditingSnippetId] = useState(null);
  const [editSnippet, setEditSnippet] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSnippets = async () => {
    setSnippetsLoading(true);
    try {
      const res = await codeSnippetsAPI.list();
      setSnippets(res.data || []);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    } finally {
      setSnippetsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(prev => ({ ...prev, ...res.data }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="admin-settings">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Site Settings</h1>
          <p className="text-stone-500">Configure your site's global settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} className="bg-emerald-900 hover:bg-emerald-800">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="code" onClick={() => { if (snippets.length === 0) loadSnippets(); }}>
            <Code className="w-4 h-4 mr-1" /> Custom Code
          </TabsTrigger>
        </TabsList>

        {loading && (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-800 rounded-lg animate-pulse border border-emerald-100">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Fetching settings from database...</span>
          </div>
        )}

        <TabsContent value="general">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic site information and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Site Name</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => handleChange('site_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_tagline">Tagline</Label>
                  <Input
                    id="site_tagline"
                    value={settings.site_tagline}
                    onChange={(e) => handleChange('site_tagline', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <ImageUploader
                    value={settings.logo_url}
                    onChange={(url) => handleChange('logo_url', url)}
                    entityType="settings"
                    placeholder="Upload site logo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <ImageUploader
                    value={settings.favicon_url}
                    onChange={(url) => handleChange('favicon_url', url)}
                    entityType="settings"
                    placeholder="Upload favicon"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer_text">Footer Text</Label>
                <Input
                  id="footer_text"
                  value={settings.footer_text}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Your business contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="hello@entrepreneurs.bd"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+880 1234 567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123 Business Street, Dhaka, Bangladesh"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook URL
                </Label>
                <Input
                  id="facebook"
                  value={settings.facebook}
                  onChange={(e) => handleChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/entrepreneursbd"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter URL
                </Label>
                <Input
                  id="twitter"
                  value={settings.twitter}
                  onChange={(e) => handleChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/entrepreneursbd"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn URL
                </Label>
                <Input
                  id="linkedin"
                  value={settings.linkedin}
                  onChange={(e) => handleChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/entrepreneursbd"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube" className="flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  YouTube URL
                </Label>
                <Input
                  id="youtube"
                  value={settings.youtube}
                  onChange={(e) => handleChange('youtube', e.target.value)}
                  placeholder="https://youtube.com/@entrepreneursbd"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Search engine optimization defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="seo_title" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Default SEO Title
                </Label>
                <Input
                  id="seo_title"
                  value={settings.seo_title}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                  maxLength={70}
                />
                <p className="text-xs text-stone-500">{settings.seo_title?.length || 0}/70 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_description">Default Meta Description</Label>
                <Textarea
                  id="seo_description"
                  value={settings.seo_description}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-stone-500">{settings.seo_description?.length || 0}/160 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="google_analytics_id" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Google Analytics ID
                </Label>
                <Input
                  id="google_analytics_id"
                  value={settings.google_analytics_id}
                  onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Code Tab */}
        <TabsContent value="code">
          {/* Global Code Section */}
          <Card className="border-stone-200 mb-6">
            <CardHeader>
              <CardTitle>Global Code Injection</CardTitle>
              <CardDescription>CSS, JavaScript, and HTML that loads on every page of your site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                ⚠️ Only add trusted code. Incorrect code can break your site.
              </div>

              <div className="space-y-2">
                <Label>Custom CSS (all pages)</Label>
                <textarea
                  value={settings.custom_css || ''}
                  onChange={(e) => handleChange('custom_css', e.target.value)}
                  placeholder="body { font-family: 'Inter', sans-serif; }\n.hero { background: linear-gradient(...); }"
                  className="w-full min-h-[120px] p-3 border rounded-lg font-mono text-sm bg-stone-900 text-green-400 placeholder-stone-600"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Head HTML (meta tags, analytics, schema)</Label>
                <textarea
                  value={settings.custom_head_html || ''}
                  onChange={(e) => handleChange('custom_head_html', e.target.value)}
                  placeholder='<meta name="google-site-verification" content="xxx" />\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXX"></script>'
                  className="w-full min-h-[100px] p-3 border rounded-lg font-mono text-sm bg-stone-900 text-green-400 placeholder-stone-600"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Body JavaScript (tracking, widgets, chat)</Label>
                <textarea
                  value={settings.custom_body_js || ''}
                  onChange={(e) => handleChange('custom_body_js', e.target.value)}
                  placeholder="console.log('Site loaded');\ngtag('config', 'G-XXXXXXXXXX');"
                  className="w-full min-h-[100px] p-3 border rounded-lg font-mono text-sm bg-stone-900 text-green-400 placeholder-stone-600"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Footer HTML (badges, widgets)</Label>
                <textarea
                  value={settings.custom_footer_html || ''}
                  onChange={(e) => handleChange('custom_footer_html', e.target.value)}
                  placeholder='<div class="trust-badge">Verified Business ✓</div>'
                  className="w-full min-h-[80px] p-3 border rounded-lg font-mono text-sm bg-stone-900 text-green-400 placeholder-stone-600"
                  spellCheck={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Page-Targeted Snippets Section */}
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Page-Targeted Code Snippets</CardTitle>
              <CardDescription>Custom code that only loads on specific pages. Use URL patterns like <code>/blog/*</code> or exact paths like <code>/about</code>.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Snippet */}
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Add New Snippet</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Snippet Name</Label>
                    <Input
                      value={newSnippet.name}
                      onChange={(e) => setNewSnippet(s => ({ ...s, name: e.target.value }))}
                      placeholder="e.g. Blog sidebar ad"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Target Pages (URL pattern)</Label>
                    <Input
                      value={newSnippet.target}
                      onChange={(e) => setNewSnippet(s => ({ ...s, target: e.target.value }))}
                      placeholder="/blog/* or /about, /contact"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CSS</Label>
                  <textarea
                    value={newSnippet.css}
                    onChange={(e) => setNewSnippet(s => ({ ...s, css: e.target.value }))}
                    placeholder=".custom-class { color: red; }"
                    className="w-full min-h-[60px] p-2 border rounded font-mono text-xs bg-stone-900 text-green-400 placeholder-stone-600"
                    spellCheck={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">JavaScript</Label>
                  <textarea
                    value={newSnippet.js}
                    onChange={(e) => setNewSnippet(s => ({ ...s, js: e.target.value }))}
                    placeholder="console.log('snippet loaded');"
                    className="w-full min-h-[60px] p-2 border rounded font-mono text-xs bg-stone-900 text-green-400 placeholder-stone-600"
                    spellCheck={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">HTML</Label>
                  <textarea
                    value={newSnippet.html}
                    onChange={(e) => setNewSnippet(s => ({ ...s, html: e.target.value }))}
                    placeholder='<script type="application/ld+json">{...}</script>'
                    className="w-full min-h-[60px] p-2 border rounded font-mono text-xs bg-stone-900 text-green-400 placeholder-stone-600"
                    spellCheck={false}
                  />
                </div>
                <Button
                  onClick={async () => {
                    if (!newSnippet.name.trim()) { toast.error('Snippet name required'); return; }
                    try {
                      await codeSnippetsAPI.create(newSnippet);
                      toast.success('Snippet created');
                      setNewSnippet({ name: '', target: '*', css: '', js: '', html: '', enabled: true });
                      loadSnippets();
                    } catch (err) {
                      toast.error('Failed to create snippet');
                    }
                  }}
                  className="bg-emerald-900 hover:bg-emerald-800"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Snippet
                </Button>
              </div>

              {/* Existing Snippets List */}
              {snippetsLoading ? (
                <div className="text-center py-8 text-stone-400">Loading snippets...</div>
              ) : snippets.length === 0 ? (
                <div className="text-center py-8 text-stone-400">No page-targeted snippets yet. Add one above.</div>
              ) : (
                <div className="space-y-3">
                  {snippets.map((snippet) => (
                    <div key={snippet.id} className={`p-4 rounded-lg border ${snippet.enabled !== false ? 'border-emerald-200 bg-emerald-50/30' : 'border-stone-200 bg-stone-50 opacity-60'}`}>
                      {editingSnippetId === snippet.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input value={editSnippet.name || ''} onChange={(e) => setEditSnippet(s => ({ ...s, name: e.target.value }))} placeholder="Name" />
                            <Input value={editSnippet.target || ''} onChange={(e) => setEditSnippet(s => ({ ...s, target: e.target.value }))} placeholder="Target" className="font-mono text-sm" />
                          </div>
                          <textarea value={editSnippet.css || ''} onChange={(e) => setEditSnippet(s => ({ ...s, css: e.target.value }))} placeholder="CSS" className="w-full min-h-[50px] p-2 border rounded font-mono text-xs bg-stone-900 text-green-400" spellCheck={false} />
                          <textarea value={editSnippet.js || ''} onChange={(e) => setEditSnippet(s => ({ ...s, js: e.target.value }))} placeholder="JS" className="w-full min-h-[50px] p-2 border rounded font-mono text-xs bg-stone-900 text-green-400" spellCheck={false} />
                          <textarea value={editSnippet.html || ''} onChange={(e) => setEditSnippet(s => ({ ...s, html: e.target.value }))} placeholder="HTML" className="w-full min-h-[50px] p-2 border rounded font-mono text-xs bg-stone-900 text-green-400" spellCheck={false} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={async () => {
                              try {
                                await codeSnippetsAPI.update(snippet.id, editSnippet);
                                toast.success('Snippet updated');
                                setEditingSnippetId(null);
                                loadSnippets();
                              } catch (err) { toast.error('Failed to update'); }
                            }} className="bg-emerald-600">Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingSnippetId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-stone-900">{snippet.name}</p>
                            <p className="text-xs text-stone-500 font-mono">Target: {snippet.target || '*'}</p>
                            <div className="flex gap-3 mt-1">
                              {snippet.css && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">CSS</span>}
                              {snippet.js && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">JS</span>}
                              {snippet.html && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">HTML</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await codeSnippetsAPI.update(snippet.id, { enabled: !snippet.enabled });
                                  loadSnippets();
                                } catch (err) { toast.error('Failed to toggle'); }
                              }}
                              className="text-stone-400 hover:text-emerald-600"
                              title={snippet.enabled !== false ? 'Disable' : 'Enable'}
                            >
                              {snippet.enabled !== false ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5" />}
                            </button>
                            <button onClick={() => { setEditingSnippetId(snippet.id); setEditSnippet(snippet); }} className="text-stone-400 hover:text-stone-700" title="Edit">
                              <Code className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Delete this snippet?')) {
                                  try {
                                    await codeSnippetsAPI.delete(snippet.id);
                                    toast.success('Snippet deleted');
                                    loadSnippets();
                                  } catch (err) { toast.error('Failed to delete'); }
                                }
                              }}
                              className="text-stone-400 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
