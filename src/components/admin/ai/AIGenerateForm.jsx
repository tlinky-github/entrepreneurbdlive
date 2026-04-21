'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Send, History, Layers, Info, AlertTriangle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { adminAPI } from '@/lib/api';

const AIGenerateForm = ({ onClose, onGenerated }) => {
  const [formData, setFormData] = useState({
    topic: '',
    language: 'English',
    tone: 'professional',
    targetLength: 'Long (1500+ words)',
    isBulk: false,
    bulkTopics: '',
    targetDestination: 'blog',
    targetStatus: 'published',
    minFaqCount: 3,
    includeSEO: true,
    temperature: 0.7,
    maxTokens: 3000,
    tokenMode: 'auto'
  });

  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, active: false, logs: [] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    
    if (formData.isBulk) {
        const topics = formData.bulkTopics.split('\n').filter(t => t.trim().length > 0);
        setBulkProgress({ current: 0, total: topics.length, active: true, logs: [] });
        
        for (let i = 0; i < topics.length; i++) {
            const topic = topics[i];
            setGeneratingStatus(`Generating ${i+1}/${topics.length}: ${topic}`);
            try {
                await adminAPI.generateAIContent({ ...formData, topic });
                setBulkProgress(prev => ({ 
                    ...prev, 
                    current: i + 1, 
                    logs: [...prev.logs, { topic, status: 'success' }] 
                }));
            } catch (err) {
                setBulkProgress(prev => ({ 
                    ...prev, 
                    current: i + 1, 
                    logs: [...prev.logs, { topic, status: 'error' }] 
                }));
            }
        }
        setGenerating(false);
        setGeneratingStatus('Bulk generation complete');
    } else {
        setGeneratingStatus('Whispering to AI...');
        try {
            const result = await adminAPI.generateAIContent(formData);
            if (onGenerated) onGenerated(result);
            onClose();
        } catch (err) {
            console.error('Generation failed:', err);
            setGeneratingStatus('Failed to generate. Check your credits or logs.');
            setTimeout(() => setGenerating(false), 3000);
        }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start gap-4">
        <Sparkles className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
        <div>
          <h3 className="font-black text-emerald-900 uppercase tracking-tighter">Genesis AI Hub</h3>
          <p className="text-xs text-emerald-700/80 font-medium leading-relaxed">
            Configure your narrative parameters. Bulk mode supports multiple topics separated by new lines.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            id="isBulk"
            checked={formData.isBulk}
            onChange={(e) => setFormData({ ...formData, isBulk: e.target.checked })}
            className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="isBulk" className="text-sm font-black text-stone-700 uppercase tracking-widest">
            Activate Batch Mode
          </label>
        </div>

        {formData.isBulk ? (
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">
              Batch Topics (one per line)
            </label>
            <Textarea
              placeholder="Topic 1\nTopic 2\nTopic 3..."
              value={formData.bulkTopics}
              onChange={(e) => setFormData({ ...formData, bulkTopics: e.target.value })}
              className="min-h-[150px] border-emerald-100 focus:border-emerald-500 focus:ring-emerald-100 rounded-xl"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">
              Primary Narrative Topic
            </label>
            <Input
              placeholder="e.g. The Future of Freelancing in Bangladesh"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="border-emerald-100 focus:border-emerald-500 rounded-xl"
              required
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">
            Target Tone
          </label>
          <select
            value={formData.tone}
            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
            className="w-full px-3 py-2 border border-emerald-100 rounded-xl bg-white text-stone-700 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
          >
            <option value="professional">Professional</option>
            <option value="creative">Creative</option>
            <option value="casual">Casual</option>
            <option value="authoritative">Authoritative</option>
            <option value="minimalist">Minimalist</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">
            AI Calibration
          </label>
          <select
            value={formData.tokenMode}
            onChange={(e) => setFormData({ ...formData, tokenMode: e.target.value })}
            className="w-full px-3 py-2 border border-emerald-100 rounded-xl bg-white text-stone-700 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
          >
            <option value="auto">Auto-Detect</option>
            <option value="max_tokens">Classic Mode</option>
            <option value="max_completion_tokens">Reasoning Mode (o1/o3)</option>
          </select>
        </div>
      </div>

      {bulkProgress.active && (
        <div className="bg-stone-50 border border-emerald-100 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">
              Bulk Progression
            </span>
            <Badge className="bg-emerald-900 text-white font-bold px-2 py-0.5">
              {bulkProgress.current} / {bulkProgress.total}
            </Badge>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden shadow-inner font-black text-[9px] text-white flex items-center justify-center">
            <div 
              className="bg-emerald-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
            >
                {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={generating}
          className="flex-1 text-stone-400 font-bold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={generating}
          className="flex-[2] bg-emerald-900 hover:bg-emerald-950 text-white font-black uppercase tracking-widest py-6 rounded-xl shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span>{generatingStatus}</span>
            </>
          ) : (
            `✨ ${formData.isBulk ? 'Initiate Batch' : 'Fulfill Post'}`
          )}
        </Button>
      </div>
    </form>
  );
};

export default AIGenerateForm;
