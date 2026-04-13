import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import api from '../../lib/api';
import { Upload, X, Image as ImageIcon, Loader2, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const ImageUploader = ({ 
  value, 
  onChange, 
  entityType = 'blog',
  placeholder = 'Enter image URL or upload'
}) => {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  const [previewUrl, setPreviewUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const fileInputRef = useRef(null);
  // Sync with value prop
  useEffect(() => {
    if (value) {
      setPreviewUrl(value);
    }
  }, [value]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type');
      return;
    }

    setUploading(true);
    try {
      const bridgeUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api/upload-url' 
        : '/api/upload-url';

      const response = await fetch(bridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: entityType,
          contentType: file.type
        })
      });

      if (!response.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await response.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadRes.ok) throw new Error('Cloudflare upload failed');

      setPreviewUrl(publicUrl);
      setAlt(file.name.split('.')[0].replace(/[-_]/g, ' '));
      toast.success('Upload successful!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUseImage = () => {
    if (previewUrl) {
      onChange(previewUrl, { alt, caption, title });
      toast.success('Image applied!');
    }
  };

  const handleRemove = () => {
    onChange('');
    setPreviewUrl('');
    setAlt('');
    setCaption('');
  };

  return (
    <div className="space-y-4" data-testid="image-uploader">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">
            <LinkIcon className="w-4 h-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-4">
          <div className="flex space-x-2">
            <Input
              value={previewUrl || ''}
              onChange={(e) => setPreviewUrl(e.target.value)}
              placeholder={placeholder}
            />
            <Button 
              onClick={handleUseImage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Apply
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          {!previewUrl && !uploading ? (
            <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:border-emerald-600/50 hover:bg-emerald-50/10 transition-all group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-stone-400 group-hover:text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-stone-600">Drop image or click to browse</p>
                <p className="text-xs text-stone-400 mt-1">PNG, JPG, WebP up to 10MB</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center justify-center p-8 bg-stone-50 rounded-xl border border-stone-100">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-stone-500">Uploading to Cloudflare...</p>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase">Selected Image</span>
                <button onClick={() => setPreviewUrl('')} className="text-xs text-red-500 hover:underline">Change</button>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden border border-stone-200 relative">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="grid gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500">Alt Text (Search Engines)</label>
                  <Input 
                    value={alt} 
                    onChange={(e) => setAlt(e.target.value)}
                    placeholder="Describe this image..."
                    size="sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500">Caption (Visible to Users)</label>
                  <Input 
                    value={caption} 
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    size="sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500">Image Title (Tooltip on Hover)</label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Extra info on hover..."
                    size="sm"
                  />
                </div>
              </div>
              <Button 
                onClick={handleUseImage} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 shadow-lg transition-all active:scale-[0.98]"
              >
                Insert This Image
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Persistence Preview (always visible if value exists) */}
      {value && !previewUrl && (
        <div className="relative rounded-lg overflow-hidden border border-stone-200">
          <img src={value} alt="Current" className="w-full h-48 object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
