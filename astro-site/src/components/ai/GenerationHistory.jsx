import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import aiAPI from '../../lib/aiApi';
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
} from 'lucide-react';

/**
 * Generation History Component
 * Display logs, metrics, and analytics for AI post generation
 */
export const GenerationHistory = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsResponse, statsData] = await Promise.all([
        aiAPI.getLogs({ limit: 100 }),
        aiAPI.getStats(),
      ]);
      setLogs(logsResponse.logs || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load generation history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (type) => {
    try {
      setFiltering(true);
      setFilterType(type);
      if (type === 'all') {
        await loadData();
      } else {
        const response = await aiAPI.getLogs({ limit: 100, type });
        setLogs(response.logs || []);
      }
    } catch (error) {
      console.error('Filter error:', error);
      toast.error('Failed to filter logs');
    } finally {
      setFiltering(false);
    }
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'generation':
        return 'bg-emerald-100 text-emerald-800';
      case 'publish':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-stone-100 text-stone-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-stone-400" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    try {
      // Handle Firestore Timestamp
      const date = timestamp.toDate?.() || new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Error';
    }
  };

  const downloadCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs to download');
      return;
    }

    const headers = ['Timestamp', 'Action', 'Status', 'Provider', 'Tokens', 'Duration (ms)'];
    const rows = logs.map((log) => [
      formatDate(log.timestamp),
      log.action,
      log.status || 'unknown',
      log.provider || '-',
      log.metrics?.tokenUsed || '-',
      log.metrics?.duration || '-',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-generation-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Logs downloaded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        <span className="ml-2 text-stone-600">Loading generation history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">📈</div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm text-emerald-700 font-medium">Total Generated</div>
            <div className="text-3xl font-bold text-emerald-900">{stats.totalGenerated || 0}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">✅</div>
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-sm text-blue-700 font-medium">Published</div>
            <div className="text-3xl font-bold text-blue-900">{stats.totalPublished || 0}</div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">🔤</div>
              <TrendingUp className="w-4 h-4 text-violet-600" />
            </div>
            <div className="text-sm text-violet-700 font-medium">Tokens Used</div>
            <div className="text-3xl font-bold text-violet-900">
              {(stats.tokensUsedTotal || 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">💰</div>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-sm text-amber-700 font-medium">Est. Cost (USD)</div>
            <div className="text-3xl font-bold text-amber-900">${stats.estimatedCostUSD || '0.00'}</div>
          </div>
        </div>
      )}

      {/* Logs Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900">Generation Logs</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => loadData()}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={downloadCSV}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilter('all')}
            disabled={filtering}
            className={filterType === 'all' ? 'bg-emerald-600' : ''}
          >
            All
          </Button>
          <Button
            variant={filterType === 'generation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilter('generation')}
            disabled={filtering}
            className={filterType === 'generation' ? 'bg-emerald-600' : ''}
          >
            Generations
          </Button>
          <Button
            variant={filterType === 'publish' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilter('publish')}
            disabled={filtering}
            className={filterType === 'publish' ? 'bg-emerald-600' : ''}
          >
            Published
          </Button>
          <Button
            variant={filterType === 'error' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilter('error')}
            disabled={filtering}
            className={filterType === 'error' ? 'bg-red-600' : ''}
          >
            Errors
          </Button>
        </div>

        {/* Logs Table */}
        {logs.length > 0 ? (
          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-stone-100 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900">Timestamp</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900">Provider</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-900">Tokens</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-900">Duration (ms)</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={log.id || idx}
                    className="border-b border-stone-200 hover:bg-stone-50 transition"
                  >
                    <td className="px-4 py-3 text-stone-700">{formatDate(log.timestamp)}</td>
                    <td className="px-4 py-3">
                      <Badge className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="capitalize">{log.status || 'pending'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {log.provider || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-600">
                      {log.metrics?.tokenUsed?.toLocaleString() || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-600">
                      {log.metrics?.duration || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-500 truncate max-w-xs">
                      {log.message || log.error || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-8 text-center">
            <Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-stone-700 mb-1">No logs yet</h3>
            <p className="text-stone-600">
              Generate your first post to see logs and performance metrics
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📊 About These Metrics</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Tokens Used:</strong> Total tokens consumed across all API calls</li>
          <li><strong>Est. Cost:</strong> Rough estimation based on token usage (actual costs may vary)</li>
          <li><strong>Duration:</strong> Time taken for post generation in milliseconds</li>
          <li>All times are in your local timezone</li>
        </ul>
      </div>
    </div>
  );
};

export default GenerationHistory;
