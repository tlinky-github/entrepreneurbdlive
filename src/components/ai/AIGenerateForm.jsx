import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import aiAPI from '../../lib/aiApi';
import { Loader2, Plus, X, RefreshCw } from 'lucide-react';

/**
 * AI Generate Form Component
 * Interface to generate new posts from topics
 */

export const AIGenerateForm = ({ onPostGenerated, onClose }) => {
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(null);

  const [formData, setFormData] = useState({
    provider: 'openai',
    model: '',
    topics: [],
    topicInput: '',
    tone: 'professional',
    targetLength: '1000',
    keywords: [],
    keywordInput: '',
    includeSEO: true,
    autoPublish: false,
    temperature: 0.7,
    maxTokens: 2000,
  });

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    // Auto-select first model when provider changes
    const providerConfig = providers[formData.provider];
    if (providerConfig?.models?.length > 0) {
      setFormData((prev) => ({
        ...prev,
        model: providerConfig.models[0],
      }));
    }
  }, [formData.provider, providers]);

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
      // Set first provider as default
      const firstProvider = Object.keys(enabled)[0];
      setFormData((prev) => ({ ...prev, provider: firstProvider }));
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

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (formData.topics.length === 0) {
      toast.error('Please add at least one topic');
      return;
    }

    try {
      setGenerating(true);
      const result = await aiAPI.generatePost({
        provider: formData.provider,
        model: formData.model,
        topics: formData.topics,
        tone: formData.tone,
        targetLength: formData.targetLength,
        keywords: formData.keywords,
        includeSEO: formData.includeSEO,
        autoPublish: formData.autoPublish,
        temperature: parseFloat(formData.temperature),
        maxTokens: parseInt(formData.maxTokens),
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

  const providerConfig = providers[formData.provider];

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
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg"
            >
              {Object.entries(providers).map(([name, config]) => (
                <option key={name} value={name}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
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
            Model
          </label>
          <select
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg"
          >
            {providerConfig?.models?.length > 0 ? (
              providerConfig.models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))
            ) : (
              <option value="">No models available - fetch models first</option>
            )}
          </select>
          <p className="text-xs text-stone-500 mt-1">
            {providerConfig?.models?.length || 0} models available
          </p>
        </div>
      </div>

      {/* Topics */}
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
            value={formData.targetLength}
            onChange={(e) => setFormData({ ...formData, targetLength: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg"
          >
            <option value="500">Short (~500 words)</option>
            <option value="1000">Standard (~1000 words)</option>
            <option value="1500">Long-Form (~1500 words)</option>
            <option value="2000">Deep-Dive (~2000 words)</option>
          </select>
          <p className="text-xs text-stone-500 mt-1">
            Long-form posts are generated in multiple batches.
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

      {/* Options */}
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoPublish"
            checked={formData.autoPublish}
            onChange={(e) => setFormData({ ...formData, autoPublish: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="autoPublish" className="text-sm font-medium text-stone-700">
            Auto-publish to blog (otherwise save as draft)
          </label>
        </div>
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
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={generating || formData.topics.length === 0}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {parseInt(formData.targetLength) >= 1500 
                ? 'Building Long-Form Post (Batch 1/4)...' 
                : 'Generating Content...'}
            </>
          ) : (
            '✨ Generate Post'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AIGenerateForm;
