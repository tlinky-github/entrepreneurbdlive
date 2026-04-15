import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import aiAPI from '../../lib/aiApi';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Trash2, Edit2, Plus } from 'lucide-react';

/**
 * Provider Setup Component
 * Configure API keys for ChatGPT, Gemini, Claude
 */

export const ProviderSetup = ({ refreshTrigger }) => {
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [setupForm, setSetupForm] = useState({ provider: '', profile: '', apiKey: '', selectedModel: '' });
  const [settingUp, setSettingUp] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [fetchingModels, setFetchingModels] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState({});
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [deletingProfileId, setDeletingProfileId] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({ minFaqCount: 3 });
  const [savingSettings, setSavingSettings] = useState(false);

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
      setGlobalSettings(config.settings || { minFaqCount: 3 });
      
      // Convert to flat list of profiles with provider info
      const profilesList = [];
      Object.entries(config.providers || {}).forEach(([providerName, providerConfig]) => {
        if (providerConfig.profiles) {
          providerConfig.profiles.forEach((profile, idx) => {
            profilesList.push({
              id: `${providerName}-${idx}`,
              provider: providerName,
              ...profile
            });
          });
        }
      });
      setAllProfiles(profilesList);
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast.error('Failed to load provider configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupProvider = async (e) => {
    e.preventDefault();

    if (!setupForm.provider || !setupForm.profile || !setupForm.apiKey) {
      toast.error('Please fill in all fields: provider, profile name, and API key');
      return;
    }

    try {
      setSettingUp(true);
      const result = await aiAPI.setupProvider({
        provider: setupForm.provider,
        apiKey: setupForm.apiKey,
        profileName: setupForm.profile,
        selectedModel: setupForm.selectedModel
      });

      if (result.success) {
        toast.success(`${setupForm.provider} profile "${setupForm.profile}" configured successfully!${setupForm.selectedModel ? ` (Default model: ${setupForm.selectedModel})` : ''}`);
        setSetupForm({ provider: '', profile: '', apiKey: '', selectedModel: '' });
        setAvailableModels({});
        await loadProviders();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to setup provider');
    } finally {
      setSettingUp(false);
    }
  };

  const handleFetchModelsForSetup = async () => {
    if (!setupForm.provider || !setupForm.apiKey) {
      toast.error('Please select a provider and enter API key first');
      return;
    }

    try {
      setFetchingModels(setupForm.provider);
      
      // Call API to fetch actual models from the provider, passing the API key for setup phase
      const result = await aiAPI.getProviderModels(setupForm.provider, setupForm.apiKey);
      
      setAvailableModels(prev => ({
        ...prev,
        [setupForm.provider]: result.models || []
      }));
      
      if (result.models?.length > 0) {
        // Auto-select first model
        setSetupForm(prev => ({
          ...prev,
          selectedModel: result.models[0]
        }));
        toast.success(`Fetched ${result.models.length} models for ${setupForm.provider}`);
      } else {
        toast.warning(`No models found for ${setupForm.provider}. Check your API key.`);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error(`Failed to fetch models: ${error.message || 'API error'}`);
    } finally {
      setFetchingModels(null);
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

  const handleEditProfile = async (profile) => {
    setEditingProfileId(profile.id);
    setSetupForm({
      provider: profile.provider,
      profile: profile.profileName || profile.profile || '',
      apiKey: '',
      selectedModel: profile.selectedModel || ''
    });
  };

  const handleSaveEditProfile = async (e) => {
    e.preventDefault();
    
    if (!setupForm.profile) {
      toast.error('Please enter a profile name');
      return;
    }

    try {
      setSettingUp(true);
      const profileIndex = parseInt(editingProfileId.split('-')[1]);
      
      const result = await aiAPI.updateProfile(setupForm.provider, profileIndex, {
        profileName: setupForm.profile,
        apiKey: setupForm.apiKey,
        selectedModel: setupForm.selectedModel
      });

      if (result.success) {
        toast.success('Profile updated successfully!');
        setEditingProfileId(null);
        setSetupForm({ provider: '', profile: '', apiKey: '', selectedModel: '' });
        await loadProviders();
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSettingUp(false);
    }
  };

  const handleDeleteProfile = async (profile) => {
    if (!window.confirm(`Are you sure you want to delete the profile "${profile.profileName || profile.profile}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSettingUp(true);
      const profileIndex = parseInt(profile.id.split('-')[1]);
      
      const result = await aiAPI.deleteProfile(profile.provider, profileIndex);

      if (result.success) {
        toast.success('Profile deleted successfully');
        setEditingProfileId(null);
        setSetupForm({ provider: '', profile: '', apiKey: '', selectedModel: '' });
        await loadProviders();
      }
    } catch (error) {
      console.error('Delete profile error:', error);
      toast.error(error.message || 'Failed to delete profile');
    } finally {
      setSettingUp(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const result = await aiAPI.updateSettings(globalSettings);
      if (result.success) {
        toast.success('Global settings updated successfully');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to update global settings');
    } finally {
      setSavingSettings(false);
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
              Profile Name (e.g., "Primary Account", "Team Account")
            </label>
            <input
              type="text"
              value={setupForm.profile}
              onChange={(e) => setSetupForm({ ...setupForm, profile: e.target.value })}
              placeholder="E.g., Production, Testing, Client Account..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg"
              maxLength="50"
            />
            <p className="text-xs text-stone-500 mt-1">
              Give this configuration a memorable name to identify it later. You can have multiple profiles per provider.
            </p>
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

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Default Model for This Profile
            </label>
            <div className="flex gap-2">
              <select
                value={setupForm.selectedModel}
                onChange={(e) => setSetupForm({ ...setupForm, selectedModel: e.target.value })}
                className="flex-1 px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-900"
                disabled={!availableModels[setupForm.provider]?.length}
              >
                <option value="">Select a model (optional)</option>
                {availableModels[setupForm.provider]?.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleFetchModelsForSetup}
                disabled={!setupForm.provider || !setupForm.apiKey || fetchingModels === setupForm.provider}
                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                title="Load available models"
              >
                {fetchingModels === setupForm.provider ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                    Loading...
                  </>
                ) : (
                  'Load Models'
                )}
              </button>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Click "Load Models" to see available models for this provider. You can change it later when generating posts.
            </p>
          </div>

          <Button
            type="submit"
            disabled={settingUp || !setupForm.provider || !setupForm.profile || !setupForm.apiKey}
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

      {/* Your Configured Profiles */}
      {allProfiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">Your Configured Profiles</h3>
            <span className="text-sm text-stone-600 bg-stone-100 px-2 py-1 rounded">
              {allProfiles.length} profile{allProfiles.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`border rounded-lg p-4 transition ${
                  editingProfileId === profile.id
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-stone-900">
                      {PROVIDERS.find(p => p.name === profile.provider)?.icon}{' '}
                      {profile.profileName || profile.profile}
                    </p>
                    <p className="text-xs text-stone-500">
                      {PROVIDERS.find(p => p.name === profile.provider)?.label}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditProfile(profile)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(profile)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {profile.selectedModel && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-600">Default Model:</span>
                    <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                      {profile.selectedModel}
                    </span>
                  </div>
                )}

                {editingProfileId === profile.id && (
                  <form onSubmit={handleSaveEditProfile} className="mt-3 border-t border-emerald-200 pt-3 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Profile Name
                      </label>
                      <input
                        type="text"
                        value={setupForm.profile}
                        onChange={(e) => setSetupForm({ ...setupForm, profile: e.target.value })}
                        className="w-full px-2 py-1 border border-stone-300 rounded text-sm"
                        maxLength="50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        API Key (leave blank to keep current)
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={setupForm.apiKey}
                          onChange={(e) => setSetupForm({ ...setupForm, apiKey: e.target.value })}
                          className="w-full px-2 py-1 border border-stone-300 rounded text-sm pr-7"
                          placeholder="Leave blank to keep current"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 top-1.5 text-stone-500 hover:text-stone-700"
                        >
                          {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Default Model
                      </label>
                      <div className="flex gap-1">
                        <select
                          value={setupForm.selectedModel}
                          onChange={(e) => setSetupForm({ ...setupForm, selectedModel: e.target.value })}
                          className="flex-1 px-2 py-1 border border-stone-300 rounded bg-white text-sm"
                        >
                          <option value="">Select a model (optional)</option>
                          {availableModels[profile.provider]?.map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={settingUp}
                        className="flex-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-sm font-medium"
                      >
                        {settingUp ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProfileId(null);
                          setSetupForm({ provider: '', profile: '', apiKey: '', selectedModel: '' });
                        }}
                        className="flex-1 px-2 py-1.5 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
