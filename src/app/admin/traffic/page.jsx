'use client';

import { useState, useEffect } from 'react';
import { 
  redirectAPI, 
  deadLinkAPI, 
  postAPI, 
  profileAPI, 
  listingAPI, 
  resourceAPI 
} from '@/lib/api';
import { findBestMatches } from '@/lib/suggestion-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowRightLeft, 
  Plus, 
  Trash2, 
  ExternalLink, 
  AlertCircle, 
  Activity,
  History,
  Info,
  Sparkles,
  Zap,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export default function AdminTrafficCenterPage() {
  const [redirects, setRedirects] = useState([]);
  const [deadLinks, setDeadLinks] = useState([]);
  const [livePaths, setLivePaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRedirect, setNewRedirect] = useState({ fromPath: '', toPath: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [redirectRes, deadRes, posts, profiles, listings, resources] = await Promise.all([
        redirectAPI.list(),
        deadLinkAPI.list(),
        postAPI.list(),
        profileAPI.list(),
        listingAPI.list(),
        resourceAPI.list()
      ]);

      setRedirects(redirectRes.data || []);
      setDeadLinks(deadRes.data || []);

      // Consolidate all live paths for suggestion engine
      const paths = [
        '/', '/blog', '/entrepreneurs', '/directory', '/knowledge', '/about', '/contact',
        ...(posts.data?.map(p => `/blog/${p.slug}`) || []),
        ...(profiles.data?.map(p => `/entrepreneurs/${p.slug}`) || []),
        ...(listings.data?.map(l => `/directory/${l.slug}`) || []),
        ...(resources.data?.map(r => `/knowledge/${r.slug}`) || [])
      ];
      setLivePaths(paths);

    } catch (error) {
      console.error('Audit failed:', error);
      toast.error('Failed to load tracking data from database.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger suggestions when fromPath changes
  useEffect(() => {
    if (newRedirect.fromPath && newRedirect.fromPath.length > 5) {
      const matches = findBestMatches(newRedirect.fromPath, livePaths);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [newRedirect.fromPath, livePaths]);

  const handleAddRedirect = async (e) => {
    e?.preventDefault();
    if (!newRedirect.fromPath || !newRedirect.toPath) {
      toast.error('Both fields are required');
      return;
    }

    if (!newRedirect.fromPath.startsWith('/')) {
      toast.error('From Path must start with /');
      return;
    }

    setIsSubmitting(true);
    try {
      await redirectAPI.create({
        fromPath: newRedirect.fromPath.trim(),
        toPath: newRedirect.toPath.trim(),
        status: 'active'
      });
      
      // If we fixed a dead link, remove it from the dead links list
      const matchingDeadLink = deadLinks.find(dl => dl.path === newRedirect.fromPath);
      if (matchingDeadLink) {
        await deadLinkAPI.delete(matchingDeadLink.id);
      }

      toast.success('Redirect successfully activated!');
      setNewRedirect({ fromPath: '', toPath: '' });
      loadAllData();
    } catch (error) {
      toast.error('Failed to publish redirect logic.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFixDeadLink = (path) => {
    setNewRedirect({ fromPath: path, toPath: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Link pre-filled into engine. Calculating matches...');
  };

  const handleDelete = async (id, type = 'redirect') => {
    if (!confirm('Are you sure you want to decommission this path?')) return;
    try {
      if (type === 'redirect') {
        await redirectAPI.delete(id);
        setRedirects(prev => prev.filter(r => r.id !== id));
      } else {
        await deadLinkAPI.delete(id);
        setDeadLinks(prev => prev.filter(r => r.id !== id));
      }
      toast.success('Path removed from control logs.');
    } catch (error) {
      toast.error('Delete operation rejected by database.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            Traffic Intelligence <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[10px] px-2 uppercase">Core Engine</Badge>
          </h1>
          <p className="text-stone-500 font-medium mt-1">Real-time oversight of platform engagement and link health.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" onClick={loadAllData} className="border-stone-200 h-12 rounded-xl px-6 font-bold">
             <Activity className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
           </Button>
           <Badge variant="outline" className="bg-emerald-950 text-white border-none py-3 px-6 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-emerald-900/10 h-12">
             <Zap className="w-4 h-4 fill-emerald-400 text-emerald-400" /> Edge Intelligence Live
           </Badge>
        </div>
      </div>

      {/* SMART REDIRECT ENGINE */}
      <Card className="border-emerald-200 shadow-2xl shadow-emerald-900/5 overflow-hidden rounded-3xl">
        <CardHeader className="bg-emerald-900 text-white p-6">
          <CardTitle className="text-xl flex items-center gap-3 font-bold uppercase tracking-wider">
            <Plus className="w-6 h-6" />
            Logic Deployment: Smart Redirect
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid md:grid-cols-7 gap-8 items-start">
            <div className="md:col-span-3 space-y-3">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest pl-1">Source Path (Old URL)</label>
              <Input 
                placeholder="/blog/deprecated-post" 
                value={newRedirect.fromPath}
                onChange={(e) => setNewRedirect({...newRedirect, fromPath: e.target.value})}
                className="border-stone-200 focus:ring-emerald-900 h-14 rounded-2xl text-lg font-medium"
              />
            </div>
            
            <div className="md:col-span-1 flex justify-center pt-10">
              <ArrowRightLeft className="text-stone-200 w-8 h-8" />
            </div>

            <div className="md:col-span-3 space-y-3">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest pl-1">Target Destination (Live URL)</label>
              <div className="relative">
                <Input 
                  placeholder="/blog/modern-post" 
                  value={newRedirect.toPath}
                  onChange={(e) => setNewRedirect({...newRedirect, toPath: e.target.value})}
                  className="border-stone-200 focus:ring-emerald-900 h-14 rounded-2xl text-lg pr-12 font-medium"
                />
                <div className="absolute right-4 top-4">
                   <Sparkles className={`w-6 h-6 ${suggestions.length > 0 ? 'text-amber-500 animate-pulse' : 'text-stone-100'}`} />
                </div>
              </div>
              
              {/* AI SUGGESTIONS CHIPS */}
              {suggestions.length > 0 && (
                <div className="pt-3 animate-in fade-in slide-in-from-top-1 duration-500">
                  <p className="text-[10px] text-stone-400 font-black uppercase mb-3 flex items-center gap-2 tracking-widest">
                    <History className="w-3 h-3" /> Engine Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map(match => (
                      <button 
                        key={match}
                        onClick={() => setNewRedirect({...newRedirect, toPath: match})}
                        className="text-xs py-2 px-4 bg-stone-50 border border-stone-200 rounded-xl hover:bg-emerald-900 hover:text-white hover:border-emerald-900 transition-all font-bold"
                      >
                        {match}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-stone-100 gap-4">
            <div className="flex items-center gap-3 text-sm text-stone-500 font-medium">
               <Info className="w-5 h-5 text-emerald-700" />
               <span>Supports absolute paths and cross-ecosystem routing.</span>
            </div>
            <Button 
                onClick={handleAddRedirect} 
                className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold h-14 px-12 rounded-2xl shadow-xl shadow-emerald-900/20 w-full sm:w-auto" 
                disabled={isSubmitting || !newRedirect.toPath}
            >
                {isSubmitting ? 'DEPLOYING LOGIC...' : 'ACTIVATE REDIRECT'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* DEAD LINK AUDIT */}
        <Card className="border-stone-100 shadow-xl shadow-stone-100/50 rounded-3xl overflow-hidden border-t-8 border-t-red-600">
          <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between bg-stone-50/50">
            <CardTitle className="text-xl flex items-center gap-3 font-bold text-stone-900">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Intelligence Breach (404s)
            </CardTitle>
            <Badge variant="destructive" className="animate-pulse px-3 py-1 font-black text-[10px] uppercase tracking-widest">
              {deadLinks.length} Critical
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-100/50 text-stone-400 sticky top-0 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Failing Route</th>
                    <th className="px-8 py-5">Engagement</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => (
                      <tr key={i}><td colSpan="3" className="px-8 py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-stone-200" /></td></tr>
                    ))
                  ) : deadLinks.length === 0 ? (
                    <tr><td colSpan="3" className="px-8 py-20 text-center text-stone-400 font-bold uppercase tracking-widest text-xs">Platform Links Secure. No 404s Logged.</td></tr>
                  ) : (
                    deadLinks.map((dl) => (
                      <tr key={dl.id} className="group hover:bg-stone-50 transition-colors">
                        <td className="px-8 py-6">
                          <p className="font-bold text-stone-900 truncate max-w-[200px]" title={dl.path}>{dl.path}</p>
                          <p className="text-[10px] text-stone-400 font-medium">Intercepted on {new Date(dl.created_at?.toDate()).toLocaleDateString()}</p>
                        </td>
                        <td className="px-8 py-6">
                           <Badge variant="secondary" className="bg-red-50 text-red-900 border-none font-black text-[10px] px-3 py-1">
                             {dl.hit_count} Hits
                           </Badge>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-3">
                            <Button 
                                size="sm" 
                                className="bg-emerald-900 hover:bg-emerald-800 text-[10px] px-4 font-bold h-9 rounded-xl"
                                onClick={() => handleFixDeadLink(dl.path)}
                            >
                                FIX PATH
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-stone-300 hover:text-red-600 h-9 w-9 p-0"
                                onClick={() => handleDelete(dl.id, 'deadlink')}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ACTIVE LOGS */}
        <Card className="border-stone-100 shadow-xl shadow-stone-100/50 rounded-3xl overflow-hidden border-t-8 border-t-emerald-950">
          <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/50">
            <CardTitle className="text-xl flex items-center gap-3 font-bold text-stone-900">
              <History className="w-6 h-6 text-emerald-950" />
              Communication Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
               <table className="w-full text-sm text-left">
                  <thead className="bg-stone-100/50 text-stone-400 sticky top-0 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Active Bridge</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {redirects.map((r) => (
                      <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3 text-stone-900 font-bold">
                            <span className="truncate max-w-[120px]" title={r.fromPath}>{r.fromPath}</span>
                            <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
                            <span className="text-emerald-900 truncate max-w-[120px]" title={r.toPath}>{r.toPath}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1 font-bold">
                            <Activity className="w-4 h-4 text-emerald-600" />
                            {r.hit_count || 0} TOTAL ROUTER HITS
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Bridged</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-stone-300 hover:text-red-600 h-10 w-10 p-0"
                              onClick={() => handleDelete(r.id, 'redirect')}
                           >
                              <Trash2 className="w-5 h-5" />
                           </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
