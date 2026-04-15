import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import aiAPI from '../../lib/aiApi';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

/**
 * Provider Setup Component
 * Configure API keys for ChatGPT, Gemini, Claude
 */

export const ProviderSetup = ({ refreshTrigger }) => {
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [setupForm, setSetupForm] = useState({ provider: '', apiKey: '' });
  const [settingUp, setSettingUp] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [fetchingModels, setFetchingModels] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const PROVIDERS = [
    { name: 'openai', label: 'OpenAI (ChatGPT/GPT-4)', icon: '🤖' },
    { name: 'gemini', label: 'Google Gemini', icon: '🔮' },
    { name: 'claude', label: 'Anthropic Claude', icon: '🧠' },
  ];

  // Load configured providers
  useEffect(() => {
    loadProviders();
  }, [refreshTrigger]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const config = await aiAPI.getProvidersConfig();
      setProviders(config.providers || {});
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast.error('Failed to load provider configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupProvider = async (e) => {
    e.preventDefault();

    if (!setupForm.provider || !setupForm.apiKey) {
      toast.error('Please select a provider and enter API key');
      return;
    }

    try {
      setSettingUp(true);
      const result = await aiAPI.setupProvider(setupForm.provider, setupForm.apiKey);

      if (result.success) {
        toast.success(`${setupForm.provider} configured successfully!`);
        setSetupForm({ provider: '', apiKey: '' });
        await loadProviders();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to setup provider');
    } finally {
      setSettingUp(false);
    }
  };

  const handleTestProvider = async (provider) => {
    try {
      setTestingProvider(provider);
      const result = await aiAPI.testProvider(provider);

      if (result.success) {
        toast.success(`${provider} connection successful!`);
      } else {
        toast.error(`${provider} connection failed: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Failed to test ${provider}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const handleFetchModels = async (provider) => {
    try {
      setFetchingModels(provider);
      const result = await aiAPI.getProviderModels(provider);
      
      // Update the providers state with new models
      setProviders(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          models: result.models || []
        }
      }));
      
      toast.success(`Fetched ${result.models?.length || 0} models for ${provider}`);
    } catch (error) {
      toast.error(`Failed to fetch models for ${provider}`);
    } finally {
      setFetchingModels(null);
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
    <div className="space-y-6">
      {/* Setup Form */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Configure New Provider</h3>

        <form onSubmit={handleSetupProvider} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              AI Provider
            </label>
            <select
              value={setupForm.provider}
              onChange={(e) => setSetupForm({ ...setupForm, provider: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-900"
            >
              <option value="">Select a provider...</option>
              {PROVIDERS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={setupForm.apiKey}
                onChange={(e) => setSetupForm({ ...setupForm, apiKey: e.target.value })}
                placeholder="sk-... or api-key"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2.5 text-stone-600 hover:text-stone-900"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Your key is encrypted and stored securely. Never shared.
            </p>
          </div>

          <Button
            type="submit"
            disabled={settingUp || !setupForm.provider || !setupForm.apiKey}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {settingUp ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              'Configure Provider'
            )}
          </Button>
        </form>
      </div>

      {/* Configured Providers */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-stone-900">Your Providers</h3>

        {PROVIDERS.map((provider) => {
          const config = providers[provider.name];
          const isEnabled = config?.enabled;
          const models = config?.models || [];

          return (
            <div
              key={provider.name}
              className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <p className="font-medium text-stone-900">{provider.label}</p>
                    {isEnabled ? (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Configured • {models.length} models available
                      </p>
                    ) : (
                      <p className="text-xs text-stone-500">Not configured</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {isEnabled && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFetchModels(provider.name)}
                        disabled={fetchingModels === provider.name}
                        className="text-xs"
                        title="Refresh available models from provider"
                      >
                        {fetchingModels === provider.name ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Fetch Models
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestProvider(provider.name)}
                        disabled={testingProvider === provider.name}
                        className="text-xs"
                      >
                        {testingProvider === provider.name ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          'Test'
                        )}
                      </Button>
                      <div
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium"
                      >
                        Active
                      </div>
                    </>
                  )}
                  {!isEnabled && (
                    <div className="px-3 py-1 bg-stone-100 text-stone-600 rounded text-xs font-medium">
                      Not Setup
                    </div>
                  )}
                </div>
              </div>

              {/* Models List */}
              {isEnabled && models.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <p className="text-xs font-medium text-stone-700 mb-2">Available Models:</p>
                  <div className="flex flex-wrap gap-1">
                    {models.map((model, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded"
                        title={model}
                      >
                        {model.length > 20 ? model.substring(0, 20) + '...' : model}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> Set up at least one AI provider to generate posts. You can use all three providers
          and switch between them for different posts.
        </p>
      </div>

      {/* Get API Keys Links */}
      <div className="bg-stone-100 rounded-lg p-4">
        <p className="text-sm font-medium text-stone-900 mb-3">Get API Keys:</p>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 px-3 py-1 rounded transition"
          >
            OpenAI Keys →
          </a>
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 px-3 py-1 rounded transition"
          >
            Google Gemini Keys →
          </a>
          <a
            href="https://console.anthropic.com/account/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 px-3 py-1 rounded transition"
          >
            Anthropic Keys →
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProviderSetup;
