'use client';

import { useState, useEffect } from 'react';
import { settingsAPI, codeSnippetsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Save, 
  Loader2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Search, 
  Code, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUploader from '@/components/common/ImageUploader';

export default function AdminSettingsPage() {
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Citadel Control Deck</h1>
          <p className="text-stone-500 font-medium font-medium">Manage global platform configurations and branding.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold h-12 px-8 shadow-xl shadow-emerald-900/20">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="bg-stone-200/50 p-1.5 rounded-2xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="general" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold transition-all">General</TabsTrigger>
          <TabsTrigger value="contact" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold transition-all">Contact</TabsTrigger>
          <TabsTrigger value="social" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold transition-all">Social Media</TabsTrigger>
          <TabsTrigger value="seo" className="px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold transition-all">SEO & Tracking</TabsTrigger>
          <TabsTrigger value="code" onClick={() => { if (snippets.length === 0) loadSnippets(); }} className="px-6 py-2.5 rounded-xl data-[state=active]:bg-emerald-900 data-[state=active]:text-white font-bold transition-all">
            <Code className="w-4 h-4 mr-2" /> Advanced Code
          </TabsTrigger>
        </TabsList>

        {loading && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-800 rounded-2xl animate-pulse border border-emerald-100">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-bold uppercase tracking-wider">Intercepting Database Settings...</span>
          </div>
        )}

        <TabsContent value="general" className="focus-visible:outline-none">
          <Card className="border-stone-200 shadow-xl shadow-stone-100/50 overflow-hidden rounded-2xl">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
              <CardTitle className="text-stone-900">Branding & Identity</CardTitle>
              <CardDescription>Configure your platform's core visual identity.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="site_name" className="text-xs font-bold uppercase text-stone-500">Site Name</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => handleChange('site_name', e.target.value)}
                    className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_tagline" className="text-xs font-bold uppercase text-stone-500">Global Tagline</Label>
                  <Input
                    id="site_tagline"
                    value={settings.site_tagline}
                    onChange={(e) => handleChange('site_tagline', e.target.value)}
                    className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-stone-500">Primary Logo</Label>
                  <ImageUploader
                    value={settings.logo_url}
                    onChange={(url) => handleChange('logo_url', url)}
                    entityType="settings"
                    placeholder="Upload high-res logo"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-stone-500">Browser Favicon</Label>
                  <ImageUploader
                    value={settings.favicon_url}
                    onChange={(url) => handleChange('favicon_url', url)}
                    entityType="settings"
                    placeholder="Upload 64x64 favicon"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer_text" className="text-xs font-bold uppercase text-stone-500">Copyright Footer Text</Label>
                <Input
                  id="footer_text"
                  value={settings.footer_text}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                  className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="focus-visible:outline-none">
          <Card className="border-stone-200 shadow-xl shadow-stone-100/50 overflow-hidden rounded-2xl">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
              <CardTitle className="text-stone-900">Contact Infrastructure</CardTitle>
              <CardDescription>Public contact vectors for ecosystem inquiries.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500">
                  <Mail className="w-4 h-4 text-emerald-700" />
                  Primary Ecosystem Email
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="hello@entrepreneurs.bd"
                  className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500">
                  <Phone className="w-4 h-4 text-emerald-700" />
                  Hotline / Support Phone
                </Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+880 1234 567890"
                  className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  Physical Headquarters
                </Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Official address in Bangladesh..."
                  rows={4}
                  className="border-stone-200 focus:ring-emerald-500 rounded-xl font-medium"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="focus-visible:outline-none">
          <Card className="border-stone-200 shadow-xl shadow-stone-100/50 overflow-hidden rounded-2xl">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
               <CardTitle className="text-stone-900">Ecosystem Socials</CardTitle>
               <CardDescription>Connect your official social media presence.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500">
                    <Facebook className="w-4 h-4 text-[#1877F2]" /> Facebook
                  </Label>
                  <Input id="facebook" value={settings.facebook} onChange={e => handleChange('facebook', e.target.value)} className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500">
                    <Twitter className="w-4 h-4 text-[#1DA1F2]" /> X / Twitter
                  </Label>
                  <Input id="twitter" value={settings.twitter} onChange={e => handleChange('twitter', e.target.value)} className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500">
                    <Linkedin className="w-4 h-4 text-[#0A66C2]" /> LinkedIn
                  </Label>
                  <Input id="linkedin" value={settings.linkedin} onChange={e => handleChange('linkedin', e.target.value)} className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube" className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500">
                    <Youtube className="w-4 h-4 text-[#FF0000]" /> YouTube
                  </Label>
                  <Input id="youtube" value={settings.youtube} onChange={e => handleChange('youtube', e.target.value)} className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="focus-visible:outline-none">
          <Card className="border-stone-200 shadow-xl shadow-stone-100/50 overflow-hidden rounded-2xl">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
              <CardTitle className="text-stone-900">SEO Intelligence</CardTitle>
              <CardDescription>Default metadata used to dominate search results.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <Label htmlFor="seo_title" className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500">
                  <Search className="w-4 h-4 text-emerald-700" />
                  Default SEO Title
                </Label>
                <Input
                  id="seo_title"
                  value={settings.seo_title}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                  maxLength={60}
                  className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl font-bold"
                />
                <p className="text-[10px] font-black text-stone-400 text-right">{settings.seo_title?.length || 0}/60 CHARS</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_description" className="text-xs font-bold uppercase text-stone-500">Global Meta Description</Label>
                <Textarea
                  id="seo_description"
                  value={settings.seo_description}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  maxLength={160}
                  rows={4}
                  className="border-stone-200 focus:ring-emerald-500 rounded-xl font-medium"
                />
                <p className="text-[10px] font-black text-stone-400 text-right">{settings.seo_description?.length || 0}/160 CHARS</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="google_analytics_id" className="flex items-center gap-2 text-xs font-bold uppercase text-stone-500">
                  <Globe className="w-4 h-4 text-emerald-700" />
                  Google Analytics Measurement ID
                </Label>
                <Input
                  id="google_analytics_id"
                  value={settings.google_analytics_id}
                  onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="h-12 border-stone-200 focus:ring-emerald-500 rounded-xl font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Code Tab (Engineers Only) */}
        <TabsContent value="code" className="focus-visible:outline-none">
          <div className="grid gap-8">
             <Card className="border-emerald-200 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-2xl">
               <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
                 <CardTitle className="text-emerald-900 flex items-center gap-2">
                   <Code className="w-5 h-5" /> Global Injection Lab
                 </CardTitle>
                 <CardDescription className="text-emerald-700/80">Premium CSS and JavaScript deployed across every router node.</CardDescription>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                 <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Global CSS Overrides
                      </Label>
                      <textarea
                        value={settings.custom_css || ''}
                        onChange={(e) => handleChange('custom_css', e.target.value)}
                        placeholder="/* body { ... } */"
                        className="w-full min-h-[160px] p-4 border rounded-2xl font-mono text-sm bg-stone-900 text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner"
                        spellCheck={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" /> Head Component (HTML)
                      </Label>
                      <textarea
                        value={settings.custom_head_html || ''}
                        onChange={(e) => handleChange('custom_head_html', e.target.value)}
                        placeholder="<!-- Meta tags, Font links -->"
                        className="w-full min-h-[120px] p-4 border rounded-2xl font-mono text-sm bg-stone-900 text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner"
                        spellCheck={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" /> Body Terminal (JS)
                      </Label>
                      <textarea
                        value={settings.custom_body_js || ''}
                        onChange={(e) => handleChange('custom_body_js', e.target.value)}
                        placeholder="console.log('CITADEL SECURE');"
                        className="w-full min-h-[120px] p-4 border rounded-2xl font-mono text-sm bg-stone-900 text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner"
                        spellCheck={false}
                      />
                    </div>
                 </div>
               </CardContent>
             </Card>

             {/* Snippets Hub */}
             <Card className="border-stone-200 shadow-xl shadow-stone-100/50 overflow-hidden rounded-2xl">
               <CardHeader className="bg-stone-50/50 border-b border-stone-100">
                 <CardTitle className="text-stone-900">Snippet Hub</CardTitle>
                 <CardDescription>Targeted logic deployments for specific route patterns.</CardDescription>
               </CardHeader>
               <CardContent className="p-8">
                 <div className="text-center py-12 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                    <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">Page-Specific Snippets</p>
                    <p className="text-xs text-stone-400 mt-2">Manage targeted code for /blog/* or /directory routes.</p>
                    <Button variant="outline" onClick={loadSnippets} className="mt-6 border-stone-200 font-bold">
                       <Plus className="w-4 h-4 mr-2" /> Initialize Snippets
                    </Button>
                 </div>
               </CardContent>
             </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
