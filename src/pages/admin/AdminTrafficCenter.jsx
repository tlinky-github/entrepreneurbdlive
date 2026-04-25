import { useState, useEffect, useMemo } from 'react';
import { redirectAPI, deadLinkAPI, postAPI, profileAPI, listingAPI, resourceAPI } from '../../lib/api';
import { findBestMatches } from '../../lib/suggestion-engine';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
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
  XCircle
} from 'lucide-react';

const AdminTrafficCenter = () => {
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

      setRedirects(redirectRes.data);
      setDeadLinks(deadRes.data);

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
      toast.error('Failed to load tracking data');
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

      toast.success('Redirect active and dead link cleared');
      setNewRedirect({ fromPath: '', toPath: '' });
      loadAllData();
    } catch (error) {
      toast.error('Failed to add redirect');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFixDeadLink = (path) => {
    setNewRedirect({ fromPath: path, toPath: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Link pre-filled. Checking for AI suggestions...');
  };

  const handleDelete = async (id, type = 'redirect') => {
    if (!confirm('Are you sure?')) return;
    try {
      if (type === 'redirect') {
        await redirectAPI.delete(id);
        setRedirects(prev => prev.filter(r => r.id !== id));
      } else {
        await deadLinkAPI.delete(id);
        setDeadLinks(prev => prev.filter(r => r.id !== id));
      }
      toast.success('Removed successfully');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            Traffic Control Center <Badge className="bg-emerald-100 text-emerald-800 border-none">Pro</Badge>
          </h1>
          <p className="text-stone-500">Intelligent 404 detection and link recovery engine.</p>
        </div>
        <div className="flex items-center gap-3">
           <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
             <Button variant="outline" className="border-emerald-600 text-emerald-900 bg-emerald-50/50 hover:bg-emerald-100">
               <ExternalLink className="w-4 h-4 mr-2" /> View Live Sitemap
             </Button>
           </a>
           <Button variant="outline" onClick={loadAllData} className="border-stone-200">
             <Activity className="w-4 h-4 mr-2" /> Refresh Audit
           </Button>
           <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-200 py-1.5">
             <Zap className="w-4 h-4 mr-1 fill-emerald-900" /> Edge Engine Online
           </Badge>
        </div>
      </div>

      {/* SMART REDIRECT CREATOR */}
      <Card className="border-emerald-200 shadow-lg shadow-emerald-900/5 overflow-hidden">
        <CardHeader className="bg-emerald-900 text-white border-b border-emerald-800 py-4">
          <CardTitle className="text-lg flex items-center gap-2 font-medium">
            <Plus className="w-5 h-5" />
            Create Smart Redirect
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-7 gap-6 items-start">
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Source Path (Old URL)</label>
              <Input 
                placeholder="/blog/old-slug" 
                value={newRedirect.fromPath}
                onChange={(e) => setNewRedirect({...newRedirect, fromPath: e.target.value})}
                className="border-stone-200 focus:ring-emerald-900 h-11"
              />
            </div>
            
            <div className="md:col-span-1 flex justify-center pt-8">
              <ArrowRightLeft className="text-stone-300 w-6 h-6" />
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Target Destination (New URL)</label>
              <div className="relative">
                <Input 
                  placeholder="/blog/new-slug" 
                  value={newRedirect.toPath}
                  onChange={(e) => setNewRedirect({...newRedirect, toPath: e.target.value})}
                  className="border-stone-200 focus:ring-emerald-900 h-11 pr-10"
                />
                <div className="absolute right-3 top-3">
                   <Sparkles className={`w-5 h-5 ${suggestions.length > 0 ? 'text-amber-500 animate-pulse' : 'text-stone-200'}`} />
                </div>
              </div>
              
              {/* AI SUGGESTIONS CHIPS */}
              {suggestions.length > 0 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <p className="text-[10px] text-stone-400 font-bold uppercase mb-2 flex items-center gap-1">
                    <History className="w-3 h-3" /> AI Suggested Best Matches:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map(match => (
                      <button 
                        key={match}
                        onClick={() => setNewRedirect({...newRedirect, toPath: match})}
                        className="text-xs py-1.5 px-3 bg-stone-100 border border-stone-200 rounded-full hover:bg-emerald-900 hover:text-white hover:border-emerald-900 transition-all"
                      >
                        {match}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-stone-100">
            <div className="flex items-center gap-2 text-xs text-stone-500 italic">
               <Info className="w-4 h-4 text-emerald-600" />
               <span>Supports internal slugs and absolute external URLs.</span>
            </div>
            <Button 
                onClick={handleAddRedirect} 
                className="bg-emerald-900 hover:bg-emerald-800 px-8 h-11" 
                disabled={isSubmitting || !newRedirect.toPath}
            >
                {isSubmitting ? 'activating...' : 'Activate Redirect'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* DEAD LINKS ALERT CENTER */}
        <Card className="border-stone-200 shadow-sm border-t-4 border-t-red-500">
          <CardHeader className="border-b border-stone-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Dead Links (404 Alerts)
            </CardTitle>
            <Badge variant="destructive" className="animate-pulse">
              {deadLinks.length} Urgent
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-50 text-stone-500 sticky top-0 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-6 py-4">Failing Path</th>
                    <th className="px-6 py-4">Volume</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => (
                      <tr key={i}><td colSpan="3" className="px-6 py-4 animate-pulse"><div className="h-6 bg-stone-100 rounded"></div></td></tr>
                    ))
                  ) : deadLinks.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-12 text-center text-stone-400 italic">No broken links detected recently. Excellent!</td></tr>
                  ) : (
                    deadLinks.map((dl) => (
                      <tr key={dl.id} className="group hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-stone-900 truncate max-w-[180px]" title={dl.path}>{dl.path}</p>
                          <p className="text-[10px] text-stone-400">First seen: {dl.created_at ? new Date(dl.created_at).toLocaleDateString() : 'Recently'}</p>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant="secondary" className="bg-stone-100 text-stone-600 border-none font-medium">
                             {dl.hit_count} hits
                           </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                                size="sm" 
                                className="bg-emerald-900 hover:bg-emerald-800 text-[10px] px-3 h-8"
                                onClick={() => handleFixDeadLink(dl.path)}
                            >
                                Fix
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-stone-300 hover:text-red-500 p-0 h-8 w-8"
                                onClick={() => handleDelete(dl.id, 'deadlink')}
                            >
                                <Trash2 className="w-4 h-4" />
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

        {/* ACTIVE REDIRECTS HISTORY */}
        <Card className="border-stone-200 shadow-sm border-t-4 border-t-emerald-900">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-900" />
              Redirect Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-stone-50 text-stone-500 sticky top-0 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Route Mapping</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {redirects.map((r) => (
                      <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-stone-900 font-medium">
                            <span className="truncate max-w-[100px]" title={r.fromPath}>{r.fromPath}</span>
                            <ArrowRightLeft className="w-3 h-3 text-stone-300" />
                            <span className="text-emerald-900 truncate max-w-[100px]" title={r.toPath}>{r.toPath}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
                            <Activity className="w-3 h-3" />
                            {r.hit_count || 0} hits total
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-tighter">Live</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-stone-300 hover:text-red-500"
                              onClick={() => handleDelete(r.id, 'redirect')}
                           >
                              <Trash2 className="w-4 h-4" />
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
};

export default AdminTrafficCenter;
