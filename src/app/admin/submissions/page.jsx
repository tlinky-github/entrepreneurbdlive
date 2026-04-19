'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/admin/AdminClientWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Users, 
  Building2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Inbox,
  ArrowUpRight,
  UserCircle,
  Globe
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-24 text-stone-400 bg-white rounded-2xl border border-dashed border-stone-200">
    <Inbox className="w-16 h-16 mb-4 opacity-10" />
    <p className="text-sm font-semibold tracking-wide uppercase">{message}</p>
  </div>
);

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const { refreshStats } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ profiles: [], listings: [] });
  const [activeTab, setActiveTab] = useState('entrepreneurs');

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPending();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (type, id) => {
    try {
      await adminAPI.approve(type, id);
      toast.success('Submission approved and published!');
      loadPending();
      refreshStats();
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const handleReject = async (type, id) => {
    if (!window.confirm('Are you sure you want to reject this submission?')) return;
    try {
      await adminAPI.reject(type, id);
      toast.success('Submission rejected');
      loadPending();
      refreshStats();
    } catch (err) {
      toast.error('Rejection failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Moderation Queue</h1>
          <p className="text-stone-500 font-medium">Review and verify community-contributed entries before publication.</p>
        </div>
        <Button onClick={loadPending} variant="outline" className="border-emerald-600 text-emerald-900 font-bold px-6">
          <Clock className="w-4 h-4 mr-2" />
          Refresh List
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-stone-200/50 p-2 rounded-2xl w-full md:w-auto h-auto grid grid-cols-2">
          <TabsTrigger value="entrepreneurs" className="px-8 py-3 rounded-xl data-[state=active]:bg-emerald-900 data-[state=active]:text-white font-bold transition-all">
            <Users className="w-4 h-4 mr-2" />
            Founders ({data.profiles.length})
          </TabsTrigger>
          <TabsTrigger value="listings" className="px-8 py-3 rounded-xl data-[state=active]:bg-emerald-900 data-[state=active]:text-white font-bold transition-all">
            <Building2 className="w-4 h-4 mr-2" />
            Businesses ({data.listings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entrepreneurs" className="focus-visible:outline-none">
          {data.profiles.length === 0 ? (
            <EmptyState message="No pending founder profiles" />
          ) : (
            <div className="grid gap-6">
              {data.profiles.map((p) => (
                <Card key={p.id} className="overflow-hidden border-stone-200 hover:shadow-xl transition-all group rounded-2xl">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                      <div className="w-20 h-20 rounded-full bg-stone-100 flex-shrink-0 overflow-hidden border-2 border-stone-200 shadow-inner group-hover:border-emerald-500 transition-colors">
                        {p.photo ? (
                          <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-full h-full p-4 text-stone-300" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                          <h3 className="text-xl font-bold text-stone-900">{p.name}</h3>
                          {p.source === 'public' && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-black uppercase">Public Sync</Badge>
                          )}
                        </div>
                        <p className="text-stone-600 font-medium">{p.designation} at <span className="text-emerald-900 font-bold">{p.company_name}</span></p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-xs text-stone-400 font-semibold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-md border border-stone-100"><Clock className="w-3.5 h-3.5" /> {new Date(p.created_at?.seconds * 1000).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-md border border-stone-100"><ArrowUpRight className="w-3.5 h-3.5" /> {p.industry}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0">
                        <Button 
                          variant="ghost" 
                          onClick={() => router.push(`/admin/content-editor?type=entrepreneurs&id=${p.id}`)}
                          className="text-stone-600 hover:bg-stone-100 font-bold"
                        >
                          <Eye className="w-4 h-4 mr-2" /> Polish
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleReject('profile', p.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold px-4"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => handleApprove('profile', p.id)}
                          className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-6 shadow-lg shadow-emerald-900/20"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="listings" className="focus-visible:outline-none">
          {data.listings.length === 0 ? (
            <EmptyState message="No pending business listings" />
          ) : (
            <div className="grid gap-6">
              {data.listings.map((l) => (
                <Card key={l.id} className="overflow-hidden border-stone-200 hover:shadow-xl transition-all group rounded-2xl">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-stone-50 flex-shrink-0 overflow-hidden border-2 border-stone-100 shadow-inner group-hover:border-emerald-500 transition-colors flex items-center justify-center p-3">
                        {l.logo ? (
                          <img src={l.logo} alt={l.business_name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <Building2 className="w-10 h-10 text-stone-200" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                          <h3 className="text-xl font-bold text-stone-900">{l.business_name}</h3>
                          {l.source === 'public' && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-black uppercase">Public Submission</Badge>
                          )}
                        </div>
                        <p className="text-stone-600 font-medium">{l.listing_type_name || l.listing_type} • <span className="text-emerald-900 font-bold">{l.headquarters}</span></p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-xs text-stone-400 font-semibold uppercase tracking-wider">
                           <span className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-md border border-stone-100"><Clock className="w-3.5 h-3.5" /> {new Date(l.created_at?.seconds * 1000).toLocaleDateString()}</span>
                           {l.website && <span className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-md border border-stone-100"><Globe className="w-3.5 h-3.5" /> {l.website.replace(/^https?:\/\//, '')}</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0">
                        <Button 
                          variant="ghost" 
                          onClick={() => router.push(`/admin/content-editor?type=directory&id=${l.id}`)}
                          className="text-stone-600 hover:bg-stone-100 font-bold"
                        >
                          <Eye className="w-4 h-4 mr-2" /> Polish
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleReject('listing', l.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold px-4"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => handleApprove('listing', l.id)}
                          className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-6 shadow-lg shadow-emerald-900/20"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
