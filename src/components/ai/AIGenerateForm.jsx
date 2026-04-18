import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import aiAPI from '../../lib/aiApi';
import { authorAPI, taxonomyAPI } from '../../lib/api';
import { Loader2, Plus, X, RefreshCw, User, Tag, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

/**
 * AI Generate Form Component
 * Interface to generate new posts from topics
 */

export const AIGenerateForm = ({ onPostGenerated, onClose }) => {
  const [providers, setProviders] = useState({});
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(null);

  const [formData, setFormData] = useState({
    provider: 'openai',
    profileIndex: 0,
    isBulk: false,
    bulkTopics: '',
    targetDestination: 'blog',
    targetStatus: 'draft',
    topics: [],
    topicInput: '',
    tone: 'professional',
    targetLength: '1000',
    customLength: '',
    authorId: '',
    categoryId: '',
    minFaqCount: 3,
    keywords: [],
    keywordInput: '',
    includeSEO: true,
    temperature: 0.7,
    maxTokens: 2000,
    scheduledAt: '',
    isScheduled: false,
    customPrompt: '',
    isCustomPrompt: false,
  });

  const [bulkProgress, setBulkProgress] = useState({ 
    active: false, 
    total: 0, 
    current: 0, 
    logs: [] 
  });
  
  const providerConfig = providers[formData.provider];

  const TONES = [
    'professional',
    'casual',
    'technical',
    'creative',
    'educational',
    'persuasive',
  ];

  useEffect(() => {
    loadProviders();
    loadMetadata();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    // Auto-select first model when provider changes
    if (!loading && providerConfig?.models?.length > 0) {
      setFormData((prev) => ({
        ...prev,
        model: providerConfig.models[0],
      }));
    }
  }, [formData.provider, providers, loading]);

  const loadMetadata = async () => {
    try {
      const [authorsRes, catsRes] = await Promise.all([
        authorAPI.list(),
        taxonomyAPI.list('blog_categories')
      ]);
      setAuthors(authorsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (error) {
      console.error('Failed to load metadata:', error);
    }
  };

  const loadProviders = async () => {
    try {
      setLoading(true);
      const config = await aiAPI.getProvidersConfig();
      const enabled = Object.entries(config.providers || {})
        .filter(([, p]) => p.enabled)
        .reduce((acc, [name, p]) => {
          acc[name] = p;
          return acc;
        }, {});

      if (Object.keys(enabled).length === 0) {
        toast.error('Please configure at least one AI provider first');
        onClose?.();
        return;
      }

      setProviders(enabled);
      setFormData(prev => ({ 
        ...prev, 
        provider: Object.keys(enabled)[0],
        // Set admin defaults
        targetDestination: config.settings?.defaultDestination || 'blog',
        targetStatus: config.settings?.defaultStatus || 'draft',
        minFaqCount: config.settings?.minFaqCount || 3,
        customPrompt: config.settings?.defaultCustomPrompt || ''
      }));
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast.error('Failed to load AI providers');
    } finally {
      setLoading(false);
    }
  };

  const addTopic = () => {
    if (!formData.topicInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      topics: [...prev.topics, prev.topicInput.trim()],
      topicInput: '',
    }));
  };

  const removeTopic = (index) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }));
  };

  const addKeyword = () => {
    if (!formData.keywordInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      keywords: [...prev.keywords, prev.keywordInput.trim()],
      keywordInput: '',
    }));
  };

  const removeKeyword = (index) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
  };

  const handleFetchModels = async () => {
    try {
      setFetchingModels(formData.provider);
      const result = await aiAPI.getProviderModels(formData.provider);
      
      // Update the providers state with new models
      setProviders(prev => ({
        ...prev,
        [formData.provider]: {
          ...prev[formData.provider],
          models: result.models || []
        }
      }));
      
      // Set first model as default
      if (result.models?.length > 0) {
        setFormData(prev => ({
          ...prev,
          model: result.models[0]
        }));
      }
      
      toast.success(`Fetched ${result.models?.length || 0} models for ${formData.provider}`);
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error(`Failed to fetch models: ${error.message}`);
    } finally {
      setFetchingModels(null);
    }
  };

  const runBulkGeneration = async () => {
    const lines = formData.bulkTopics.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error('No topics found in bulk list');
      return;
    }

    setBulkProgress({
      active: true,
      total: lines.length,
      current: 0,
      logs: []
    });

    setGenerating(true);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Format: Topic | Keyword1, Keyword2
      const [topic, kwString] = line.split('|').map(s => s.trim());
      const keywords = kwString ? kwString.split(',').map(s => s.trim()).filter(Boolean) : [];

      setBulkProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const profile = providerConfig?.profiles?.[formData.profileIndex];
        const model = profile?.selectedModel || 'gpt-4-turbo';

        const targetLength = formData.targetLength === 'custom' ? formData.customLength : formData.targetLength;

        // Lookup names for denormalization
        const selectedAuthor = authors.find(a => a.id == formData.authorId);
        const selectedCategory = categories.find(c => c.id == formData.categoryId);

        await aiAPI.generatePost({
          provider: formData.provider,
          profileIndex: parseInt(formData.profileIndex),
          model,
          topics: [topic],
          tone: formData.tone,
          targetLength,
          keywords: keywords,
          includeSEO: formData.includeSEO,
          minFaqCount: formData.minFaqCount,
          targetDestination: formData.targetDestination,
          targetStatus: formData.targetStatus,
          temperature: parseFloat(formData.temperature),
          maxTokens: parseInt(formData.maxTokens),
          authorId: formData.authorId || null,
          authorName: selectedAuthor?.name || null,
          categoryId: formData.categoryId || null,
          categoryName: selectedCategory?.name || null,
          scheduledAt: formData.isScheduled ? formData.scheduledAt : null,
          tokenMode: formData.tokenMode || 'auto',
          customPrompt: formData.isCustomPrompt && formData.customPrompt.trim() !== '' ? formData.customPrompt : null,
        });

        setBulkProgress(prev => ({
          ...prev,
          logs: [...prev.logs, { topic, status: 'success' }]
        }));
      } catch (error) {
        console.error(`Bulk item ${i} failed:`, error);
        setBulkProgress(prev => ({
          ...prev,
          logs: [...prev.logs, { topic, status: 'error', message: error.message }]
        }));
      }
    }

    setGenerating(false);
    toast.success(`Bulk generation completed! ${lines.length} items processed.`);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (formData.isBulk) {
      runBulkGeneration();
      return;
    }

    if (formData.topics.length === 0) {
      toast.error('Please add at least one topic');
      return;
    }

    try {
      setGenerating(true);
      const profile = providerConfig?.profiles?.[formData.profileIndex];
      const model = profile?.selectedModel || 'gpt-4-turbo';

      const targetLength = formData.targetLength === 'custom' ? formData.customLength : formData.targetLength;

      // Lookup names for denormalization
      const selectedAuthor = authors.find(a => a.id == formData.authorId);
      const selectedCategory = categories.find(c => c.id == formData.categoryId);

      const result = await aiAPI.generatePost({
        provider: formData.provider,
        profileIndex: parseInt(formData.profileIndex),
        model,
        topics: formData.topics,
        tone: formData.tone,
        targetLength,
        keywords: formData.keywords,
        includeSEO: formData.includeSEO,
        minFaqCount: formData.minFaqCount,
        targetDestination: formData.targetDestination,
        targetStatus: formData.targetStatus,
        temperature: parseFloat(formData.temperature),
        maxTokens: parseInt(formData.maxTokens),
        authorId: formData.authorId || null,
        authorName: selectedAuthor?.name || null,
        categoryId: formData.categoryId || null,
        categoryName: selectedCategory?.name || null,
        scheduledAt: formData.isScheduled ? formData.scheduledAt : null,
        tokenMode: formData.tokenMode || 'auto',
        customPrompt: formData.isCustomPrompt && formData.customPrompt.trim() !== '' ? formData.customPrompt : null,
      });

      toast.success('Post generated successfully!');
      onPostGenerated?.(result.post);
      onClose?.();
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate post');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        <span className="ml-2 text-stone-600">Loading providers...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-6">
      {/* Provider & Model Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            AI Provider
          </label>
          <div className="flex gap-2">
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value, profileIndex: 0 })}
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg"
            >
              {Object.entries(providers).map(([name, config]) => (
                <option key={name} value={name}>
                  {name.charAt(0).toUpperCase() + name.slice(1)} ({config.profiles?.length || 0} Profiles)
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={handleFetchModels}
              disabled={fetchingModels === formData.provider}
              variant="outline"
              className="text-xs px-3"
              title="Refresh available models from provider"
            >
              {fetchingModels === formData.provider ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                </>
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Selected Profile
          </label>
          <select
            value={formData.profileIndex}
            onChange={(e) => setFormData({ ...formData, profileIndex: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-emerald-50"
          >
            {providerConfig?.profiles?.map((profile, idx) => (
              <option key={idx} value={idx}>
                {profile.profileName || `Profile ${idx + 1}`} ({profile.selectedModel || 'No default model'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Author & Category Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-2">
            <User size={14} className="text-stone-400" /> Assign Author
          </label>
          <Select
            value={formData.authorId}
            onValueChange={(v) => setFormData(prev => ({ ...prev, authorId: v }))}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select author" />
            </SelectTrigger>
            <SelectContent>
              {authors.length > 0 ? (
                authors.map((author) => (
                  <SelectItem key={author.id} value={author.id}>{author.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No authors found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-2">
            <Tag size={14} className="text-stone-400" /> Blog Category
          </label>
          <Select
            value={formData.categoryId}
            onValueChange={(v) => setFormData(prev => ({ ...prev, categoryId: v }))}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No categories found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scheduling Section */}
      <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-emerald-600" />
            <span className="text-sm font-semibold text-stone-700">Post Scheduling</span>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isScheduled: !formData.isScheduled })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.isScheduled ? 'bg-emerald-600' : 'bg-stone-300'}`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.isScheduled ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
        
        {formData.isScheduled && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <Input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              className="bg-white"
            />
            <p className="text-[10px] text-stone-500 mt-2">
              Status will be set to <strong>Scheduled</strong>. The post will appear in your queue with the specific publish date.
            </p>
          </div>
        )}
      </div>

      {/* Bulk Mode Toggle */}
      <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-100">
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${formData.isBulk ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`}></div>
           <span className="text-sm font-semibold text-stone-700">Bulk Generation Mode</span>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, isBulk: !formData.isBulk })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isBulk ? 'bg-emerald-600' : 'bg-stone-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isBulk ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Topics or Bulk Input */}
      {formData.isBulk ? (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Bulk Topics (one per line)
          </label>
          <textarea
            value={formData.bulkTopics}
            onChange={(e) => setFormData({ ...formData, bulkTopics: e.target.value })}
            placeholder={"Topic 1 | Keywords...\nTopic 2\nTopic 3 | SEO, Marketing"}
            className="w-full h-32 px-3 py-2 border border-stone-300 rounded-lg font-mono text-sm"
          />
          <p className="text-xs text-stone-500 mt-1">
             Format: <strong>Topic | Keyword1, Keyword2</strong> (Keywords are optional)
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Topics (minimum 1)
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={formData.topicInput}
              onChange={(e) => setFormData({ ...formData, topicInput: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTopic();
                }
              }}
              placeholder="e.g., AI trends, Future of work"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addTopic}
              variant="outline"
              className="text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.topics.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => removeTopic(idx)}
                  className="hover:text-emerald-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tone & Length */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Tone
          </label>
          <select
            value={formData.tone}
            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg"
          >
            {TONES.map((tone) => (
              <option key={tone} value={tone}>
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Target Length
          </label>
          <select
            value={formData.targetLength === 'custom' ? 'custom' : formData.targetLength}
            onChange={(e) => setFormData({ ...formData, targetLength: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg"
          >
            <option value="500">Short (~500 words)</option>
            <option value="1000">Standard (~1000 words)</option>
            <option value="1500">Long-Form (~1500 words)</option>
            <option value="2000">Deep-Dive (~2000 words)</option>
            <option value="custom">Custom...</option>
          </select>
          {formData.targetLength === 'custom' && (
            <div className="mt-2 animate-in slide-in-from-top-1">
              <Input
                type="number"
                value={formData.customLength}
                onChange={(e) => setFormData({ ...formData, customLength: e.target.value })}
                placeholder="Target word count (e.g., 850)"
                className="w-full"
                min="100"
                max="10000"
              />
            </div>
          )}
          <p className="text-xs text-stone-500 mt-1">
            {formData.targetLength === 'custom' ? 'Specify your desired word count.' : 'Long-form posts are generated in multiple batches.'}
          </p>
        </div>
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Keywords (optional)
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            value={formData.keywordInput}
            onChange={(e) => setFormData({ ...formData, keywordInput: e.target.value })}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
            placeholder="e.g., artificial intelligence"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addKeyword}
            variant="outline"
            className="text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {formData.keywords.map((kw, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
            >
              {kw}
              <button
                type="button"
                onClick={() => removeKeyword(idx)}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Prompt Toggle */}
      <div className="flex items-center justify-between bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-semibold text-amber-900">Custom Prompt Override</span>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, isCustomPrompt: !formData.isCustomPrompt })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isCustomPrompt ? 'bg-amber-600' : 'bg-amber-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isCustomPrompt ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Custom Prompt Override Textarea */}
      {formData.isCustomPrompt && (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 shadow-sm animate-in slide-in-from-top-1">
          <label className="block text-sm font-semibold text-amber-900 mb-2 whitespace-nowrap">
            Full Custom Prompt Override (Advanced)
          </label>
          <textarea
            value={formData.customPrompt}
            onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
            placeholder="e.g. You are an expert marketer. Write a 5-paragraph promotional post about [Topic]. Do not use any subheadings..."
            className="w-full h-32 px-3 py-2 border border-amber-300 rounded-lg font-mono text-sm shadow-inner"
          />
          <div className="flex flex-wrap gap-2 mt-2">
             <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Available Placeholders:</span>
             {['[Topic]', '[Keywords]', '[Tone]'].map(tag => (
               <code key={tag} className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">{tag}</code>
             ))}
          </div>
          <p className="text-xs text-amber-700/80 mt-2 font-medium leading-relaxed">
            If provided, this prompt will <strong>completely ignore</strong> Topics, Tone, Length, and Keywords. It speaks directly directly to the AI model using exactly your wording. Your custom prompt will run <strong>once</strong>.
          </p>
        </div>
      )}

      {/* Content Engine Settings */}
      <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">⚙️</span>
          <h3 className="font-bold text-emerald-900">Content Engine Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-emerald-800 mb-2">
              Target Destination
            </label>
            <select
              value={formData.targetDestination}
              onChange={(e) => setFormData({ ...formData, targetDestination: e.target.value })}
              className="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="blog">Main Blog Feed</option>
              <option value="knowledge">Knowledge Hub Articles</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-800 mb-2">
              Content Status
            </label>
            <select
              value={formData.targetStatus}
              onChange={(e) => setFormData({ ...formData, targetStatus: e.target.value })}
              className="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="draft">Save as Draft</option>
              <option value="published">Live Immediately</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-emerald-100">
          <label className="block text-sm font-semibold text-emerald-800 mb-2">
            Minimum FAQ Generation
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="15"
              value={formData.minFaqCount}
              onChange={(e) => setFormData({ ...formData, minFaqCount: parseInt(e.target.value) || 1 })}
              className="w-20 px-3 py-2 border border-emerald-200 rounded-lg text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <span className="text-sm text-emerald-700 italic">
              AI will generate exactly {formData.minFaqCount} questions and answers for this post.
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-stone-50 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeSEO"
            checked={formData.includeSEO}
            onChange={(e) => setFormData({ ...formData, includeSEO: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="includeSEO" className="text-sm font-medium text-stone-700">
            Include SEO Optimization
          </label>
        </div>
        {!formData.isBulk && (
          <p className="text-xs text-stone-500 italic">Individual settings can be adjusted in Advanced Settings below.</p>
        )}
      </div>

      {/* Advanced Settings */}
      <details className="bg-stone-50 rounded-lg">
        <summary className="p-4 font-medium text-stone-700 cursor-pointer hover:bg-stone-100 transition">
          ⚙️ Advanced Settings
        </summary>
        <div className="p-4 space-y-4 border-t border-stone-200">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Temperature ({formData.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className="w-full"
            />
            <p className="text-xs text-stone-500 mt-1">
              Lower = more consistent, Higher = more creative
            </p>
          </div>

          <div className="pt-2 border-t border-stone-200">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Token Parameter Mode
            </label>
            <select
              value={formData.tokenMode || 'auto'}
              onChange={(e) => setFormData({ ...formData, tokenMode: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-900"
            >
              <option value="auto">Auto-Detect (Recommended)</option>
              <option value="max_tokens">Legacy (max_tokens)</option>
              <option value="max_completion_tokens">Reasoning (max_completion_tokens)</option>
            </select>
            <p className="text-xs text-stone-500 mt-1">
              "Auto" detects reasoning models like o1/o3. 
              <br/>
              <span className="text-amber-600 font-medium">⚠️ If you see a "max_tokens" error, switch this manually to "Reasoning".</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Max Tokens
            </label>
            <Input
              type="number"
              value={formData.maxTokens}
              onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value })}
              min="500"
              max="4000"
            />
          </div>
        </div>
      </details>

      {/* Submit */}
      {/* Bulk Progress Indicator */}
      {bulkProgress.active && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 space-y-4 shadow-inner">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-emerald-800">
              Bulk Generation Progress
            </span>
            <span className="text-sm font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
              {bulkProgress.current} / {bulkProgress.total}
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="bg-emerald-600 h-full transition-all duration-500 ease-out flex items-center justify-center text-[8px] text-white font-bold"
              style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
            >
              {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
            </div>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {bulkProgress.logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 bg-white rounded border border-stone-100 shadow-sm animate-in fade-in slide-in-from-bottom-1">
                <span className="truncate font-medium text-stone-700 max-w-[70%]">
                  {i + 1}. {log.topic}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  log.status === 'success' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {log.status === 'success' ? 'Ready' : 'Failed'}
                </span>
              </div>
            )).reverse()}
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4 sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 border-t border-stone-100 -mx-6 -mb-6 rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={generating}
          className="flex-1 py-6 text-lg"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={generating}
          className="flex-[2] bg-emerald-600 hover:bg-emerald-700 py-6 text-lg shadow-lg active:scale-95 transition-all"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {formData.isBulk ? 'Processing Queue...' : 'Generating Post...'}
            </>
          ) : (
            `✨ ${formData.isBulk ? 'Generate Batch' : 'Generate Post'}`
          )}
        </Button>
      </div>
    </form>
  );
};

export default AIGenerateForm;
