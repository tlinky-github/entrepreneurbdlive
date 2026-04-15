import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import ProviderSetup from '../../components/ai/ProviderSetup';
import AIPostQueue from '../../components/ai/AIPostQueue';
import AIGenerateForm from '../../components/ai/AIGenerateForm';
import GenerationHistory from '../../components/ai/GenerationHistory';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

/**
 * AI Settings Admin Page
 * Main hub for AI post generation configuration and management
 */
export const AISettings = () => {
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostGenerated = (post) => {
    // Refresh the post queue to show the new post
    setRefreshKey((prev) => prev + 1);
    toast.success(`Post "${post.title}" generated successfully!`);
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-stone-900">AI Post Generator</h1>
            <Button
              onClick={() => setOpenGenerateDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate New Post
            </Button>
          </div>
          <p className="text-stone-600">
            Configure AI providers and manage automated content generation
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-stone-200">
            <TabsTrigger value="providers" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              🔑 Provider Profiles
            </TabsTrigger>
            <TabsTrigger value="queue" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              📝 Post Queue
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              📊 History & Logs
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Provider Setup */}
          <TabsContent value="providers" className="bg-white rounded-lg p-6 border border-stone-200">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-stone-900 mb-2">
                Configure AI Providers
              </h2>
              <p className="text-stone-600 text-sm">
                Set up your OpenAI, Google Gemini, and Anthropic Claude API keys.
                Keys are encrypted and never exposed in the frontend.
              </p>
            </div>
            <ProviderSetup />
          </TabsContent>

          {/* Tab 2: Post Queue */}
          <TabsContent value="queue" className="bg-white rounded-lg p-6 border border-stone-200">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-stone-900 mb-2">
                Generated Posts
              </h2>
              <p className="text-stone-600 text-sm">
                View and manage all AI-generated posts. Filter by status to find
                drafts, scheduled, published, or failed posts.
              </p>
            </div>
            <AIPostQueue key={refreshKey} />
          </TabsContent>

          {/* Tab 3: History & Logs */}
          <TabsContent value="history" className="bg-white rounded-lg p-6 border border-stone-200">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-stone-900 mb-2">
                Generation History & Analytics
              </h2>
              <p className="text-stone-600 text-sm">
                View detailed logs of all generation attempts and performance metrics.
              </p>
            </div>
            <GenerationHistory />
          </TabsContent>
        </Tabs>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How to use</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Set up at least one AI provider</li>
              <li>Click "Generate New Post"</li>
              <li>Enter topics and customize settings</li>
              <li>Review generated post in queue</li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">⚠️ Security Note</h3>
            <p className="text-sm text-amber-800">
              API keys are encrypted with AES-256-GCM and stored securely in Firestore.
              Never share your keys with anyone.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-900 mb-2">🚀 Pro Tips</h3>
            <ul className="text-sm text-emerald-800 space-y-1 list-disc list-inside">
              <li>Use specific keywords for better results</li>
              <li>Adjust temperature for style variations</li>
              <li>Test each provider to pick your favorite</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Generate Dialog */}
      <Dialog open={openGenerateDialog} onOpenChange={setOpenGenerateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate New Post with AI</DialogTitle>
            <DialogDescription>
              Configure your post settings and let AI create content based on your topics.
              Generation typically takes 15-60 seconds depending on post length and provider.
            </DialogDescription>
          </DialogHeader>
          <AIGenerateForm
            onPostGenerated={handlePostGenerated}
            onClose={() => setOpenGenerateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AISettings;
