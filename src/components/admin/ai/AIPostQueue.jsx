'use client';

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Filter,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminAPI } from '@/lib/api';

const AIPostQueue = () => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadQueue = async () => {
            try {
                // Mocking queue for now or fetching from real endpoint if available
                // const res = await adminAPI.getAIQueue();
                // setQueue(res.data);
                setQueue([]);
            } catch (err) {
                console.error('Queue load failed:', err);
            } finally {
                setLoading(false);
            }
        };
        loadQueue();
    }, []);

    if (queue.length === 0 && !loading) {
        return (
            <div className="bg-stone-50/50 rounded-2xl border-2 border-dashed border-stone-100 p-8 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-stone-100">
                    <Clock className="w-6 h-6 text-stone-300" />
                </div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-loose">Queue is vacant</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {queue.map((item) => (
                <div key={item.id} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-emerald-900 rounded-lg flex items-center justify-center">
                                 <FileText className="w-4 h-4 text-white" />
                             </div>
                             <div>
                                 <p className="text-sm font-bold text-stone-900 truncate max-w-[200px]">{item.topic}</p>
                                 <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{item.provider}</p>
                             </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[9px] px-2 py-0.5 uppercase tracking-wider">
                            {item.status}
                        </Badge>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1 overflow-hidden">
                        <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: `${item.progress}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const GenerationHistory = () => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getAILogs(filter);
            setLogs(res.data.logs || []);
            setStats(res.data.stats || null);
        } catch (err) {
            console.error('Logs load failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filter]);

    const downloadCSV = () => {
        const headers = ["Timestamp", "Topic", "Action", "Status", "Provider", "Tokens", "Cost"];
        const rows = logs.map(l => [
            new Date(l.timestamp).toLocaleString(),
            l.topic || '-',
            l.action,
            l.status,
            l.provider || '-',
            l.metrics?.tokenUsed || 0,
            l.metrics?.estimatedCost || 0
        ]);
        
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `ai_generation_audit_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            {/* Rich Analytics Overview */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-xl shadow-stone-200/20 group">
                        <TrendingUp className="w-5 h-5 text-emerald-900 mb-3 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Total Generated</p>
                        <p className="text-2xl font-black text-stone-900 mt-1 tracking-tighter">{stats.totalGenerated.toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-xl shadow-stone-200/20 group">
                        <CheckCircle className="w-5 h-5 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Live Content</p>
                        <p className="text-2xl font-black text-stone-900 mt-1 tracking-tighter">{stats.totalPublished.toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-xl shadow-stone-200/20 group">
                        <Layers className="w-5 h-5 text-violet-600 mb-3 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tokens Consumed</p>
                        <p className="text-2xl font-black text-stone-900 mt-1 tracking-tighter">{stats.tokensUsedTotal.toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-xl shadow-stone-200/20 group">
                        <AlertTriangle className="w-5 h-5 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Est. Cost (USD)</p>
                        <p className="text-2xl font-black text-stone-900 mt-1 tracking-tighter">${parseFloat(stats.estimatedCostUSD).toFixed(2)}</p>
                    </div>
                </div>
            )}

            {/* Audit Logs Registry */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {['all', 'generation', 'publish', 'error'].map(t => (
                            <Button 
                                key={t}
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setFilter(t)}
                                className={`text-[10px] font-black uppercase tracking-widest h-8 rounded-lg ${
                                    filter === t ? 'bg-emerald-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-900'
                                }`}
                            >
                                {t}
                            </Button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                         <Button variant="ghost" size="sm" onClick={loadData} className="h-8 w-8 p-0 text-stone-400 hover:text-emerald-900">
                             <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                         </Button>
                         <Button variant="outline" size="sm" onClick={downloadCSV} className="text-[10px] font-black uppercase tracking-widest h-8 border-stone-200 shadow-sm px-4 rounded-lg">
                             <Download className="w-3 h-3 mr-2" />
                             Export
                         </Button>
                    </div>
                </div>

                <div className="bg-white border border-stone-100 rounded-3xl overflow-hidden shadow-xl shadow-stone-200/10">
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-stone-50/50 text-stone-400 sticky top-0 uppercase text-[9px] font-black tracking-[0.15em] border-b border-stone-100">
                                <tr>
                                    <th className="px-8 py-4">Timestamp</th>
                                    <th className="px-8 py-4">Topic / Narrative</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4 text-right">Optimization</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {logs.map((log, i) => (
                                    <tr key={log.id || i} className="group hover:bg-stone-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="text-stone-900 font-bold text-[11px]">{new Date(log.timestamp).toLocaleDateString()}</p>
                                            <p className="text-[9px] text-stone-400 font-medium uppercase tracking-tighter mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-stone-800 text-sm truncate max-w-[250px]" title={log.topic}>{log.topic || 'System Maintenance'}</p>
                                            <div className="flex gap-2 mt-1.5 font-bold uppercase text-[8px] tracking-widest">
                                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shadow-sm">{log.provider}</span>
                                                <span className="text-stone-400">{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                {log.status === 'success' ? (
                                                    <Badge className="bg-emerald-900 text-white border-none font-black text-[8px] px-2 py-0.5 rounded-full shadow-lg shadow-emerald-900/10 uppercase tracking-widest animate-in fade-in zoom-in-50">
                                                        Authorized
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-500 text-white border-none font-black text-[8px] px-2 py-0.5 rounded-full shadow-lg shadow-red-500/10 uppercase tracking-widest">
                                                        Failed
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <p className="text-stone-900 font-black text-[11px] tracking-tighter">{(log.metrics?.tokenUsed || 0).toLocaleString()} <span className="text-stone-400 font-bold ml-0.5">TK</span></p>
                                            <p className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter mt-0.5">${parseFloat(log.metrics?.estimatedCost || 0).toFixed(4)}</p>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" className="py-20 text-center text-stone-400 font-bold text-xs uppercase tracking-[0.2em] italic"> No logs recorded yet </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { AIPostQueue, GenerationHistory };
