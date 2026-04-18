import { useState, useEffect } from 'react';
import { adminAPI, commentAPI } from '../../lib/api';
import { useOutletContext, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  Trash2, 
  CheckCircle, 
  ExternalLink,
  Clock,
  MessageCircle,
  XCircle,
  Flag
} from 'lucide-react';

const AdminReports = () => {
  const { refreshStats } = useOutletContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReports();
      setReports(res.data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (reportId, action) => {
    setProcessingId(reportId);
    try {
      await adminAPI.resolveReport(reportId, action);
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success(action === 'dismiss' ? 'Report dismissed' : 'Comment and report deleted');
      refreshStats?.();
    } catch (error) {
      toast.error('Failed to resolve report');
    } finally {
      setProcessingId(null);
    }
  };

  const formatRelativeDate = (date) => {
    if (!date) return 'Unknown date';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Comment Reports</h1>
          <p className="text-stone-500">Manage flags and moderation requests from users.</p>
        </div>
        <Button variant="outline" onClick={loadReports} disabled={loading}>
          Refresh List
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-stone-200">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-10 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-stone-200">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-1">No Pending Reports</h3>
            <p className="text-stone-500 text-sm">Great job! All flags have been cleared.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="border-stone-200 overflow-hidden">
              <div className="bg-stone-50/50 px-6 py-3 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRelativeDate(report.created_at)}
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <Flag className="w-3 h-3 mr-1" />
                  {report.reason || 'Spam / Inappropriate'}
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Reported Content</h4>
                  {report.comment ? (
                    <div className="bg-white border border-stone-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-600">
                          {report.comment.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-stone-900">{report.comment.name}</span>
                        {report.comment.is_admin && <Badge className="text-[9px] px-1 py-0">Admin</Badge>}
                      </div>
                      <p className="text-stone-700 text-sm leading-relaxed italic border-l-4 border-stone-200 pl-4 py-1">
                        "{report.comment.content}"
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-50 text-red-600 text-sm p-4 rounded-lg flex items-center gap-2 border border-red-100">
                      <XCircle className="w-4 h-4" />
                      Original comment has been deleted or is missing.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleResolve(report.id, 'delete_comment')}
                      disabled={processingId === report.id || !report.comment}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Comment
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(report.id, 'dismiss')}
                      disabled={processingId === report.id}
                      className="text-stone-600 hover:bg-stone-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Dismiss Report
                    </Button>
                  </div>
                  
                  {report.comment?.content_id && (
                    <Link to={`/${report.comment.content_type || 'blog'}/${report.comment.content_id}`} target="_blank">
                      <Button size="sm" variant="ghost" className="text-emerald-800 hover:bg-emerald-50">
                        View Context
                        <ExternalLink className="w-3.5 h-3.5 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
