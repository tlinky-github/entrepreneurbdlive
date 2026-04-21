import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Users, 
  Building2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  Inbox,
  ArrowUpRight,
  UserCircle,
  Globe
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

const formatDate = (date) => {
  if (!date) return 'N/A';
  // Handle Firestore Timestamp
  if (date && typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000).toLocaleDateString();
  }
  // Handle Date strings or objects
  const d = new Date(date);
  return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
};

const AdminSubmissions = () => {
  const navigate = useNavigate();
  const { refreshStats } = useOutletContext();
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

  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-20 text-stone-400 bg-white rounded-xl border border-dashed border-stone-200">
      <Inbox className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Moderation Queue</h1>
          <p className="text-stone-500 text-sm">Review and approve community submissions</p>
        </div>
        <Button onClick={loadPending} variant="outline" size="sm">
          Refresh List
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-stone-200/50 p-1">
          <TabsTrigger value="entrepreneurs" className="px-6">
            Founders ({data.profiles.length})
          </TabsTrigger>
          <TabsTrigger value="listings" className="px-6">
            Businesses ({data.listings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entrepreneurs">
          {data.profiles.length === 0 ? (
            <EmptyState message="No pending founder profiles" />
          ) : (
            <div className="grid gap-4">
              {data.profiles.map((p) => (
                <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-center p-6 gap-6">
                      <div className="w-16 h-16 rounded-full bg-stone-100 flex-shrink-0 overflow-hidden border border-stone-200">
                        {p.photo ? (
                          <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-full h-full p-3 text-stone-300" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-stone-900 truncate">{p.name}</h3>
                          {p.source === 'public' && (
                            <Badge variant="outline" className="text-[10px] uppercase text-blue-600 bg-blue-50 border-blue-100 font-bold">Public</Badge>
                          )}
                        </div>
                        <p className="text-sm text-stone-600 truncate">{p.designation} at <span className="font-semibold">{p.company_name}</span></p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Submitted {formatDate(p.created_at)}</span>
                          <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> {p.industry}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/admin/content-editor?type=entrepreneurs&id=${p.id}`)}
                          className="text-stone-600"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Polish
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReject('profile', p.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 border-stone-200"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleApprove('profile', p.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="listings">
          {data.listings.length === 0 ? (
            <EmptyState message="No pending business listings" />
          ) : (
            <div className="grid gap-4">
              {data.listings.map((l) => (
                <Card key={l.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-center p-6 gap-6">
                      <div className="w-16 h-16 rounded-xl bg-stone-100 flex-shrink-0 overflow-hidden border border-stone-200 flex items-center justify-center p-2">
                        {l.logo ? (
                          <img src={l.logo} alt={l.business_name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <Building2 className="w-10 h-10 text-stone-300" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-stone-900 truncate">{l.business_name}</h3>
                          {l.source === 'public' && (
                            <Badge variant="outline" className="text-[10px] uppercase text-blue-600 bg-blue-50 border-blue-100 font-bold">Public</Badge>
                          )}
                        </div>
                        <p className="text-sm text-stone-600 truncate">{l.listing_type_name || l.listing_type} • {l.headquarters}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Submitted {formatDate(l.created_at)}</span>
                           {l.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {l.website.replace(/^https?:\/\//, '')}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/admin/content-editor?type=directory&id=${l.id}`)}
                          className="text-stone-600"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Polish
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReject('listing', l.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 border-stone-200"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleApprove('listing', l.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
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
};

export default AdminSubmissions;
