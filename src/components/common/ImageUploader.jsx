import { useState, useRef } from 'react';
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
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB');
      return;
    }

    setUploading(true);
    try {
      // Get presigned URL
      const urlRes = await api.post('/upload/presigned-url', {
        filename: file.name,
        content_type: file.type,
        entity_type: entityType
      });

      const { presigned_url, public_url, mock } = urlRes.data;

      if (mock) {
        // In mock mode, just use a placeholder URL
        toast.info('Image upload configured in mock mode');
        onChange(URL.createObjectURL(file)); // Use local blob URL for preview
        return;
      }

      // Upload file to R2
      await fetch(presigned_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      // Set the public URL
      onChange(public_url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
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
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <div className="border-2 border-dashed border-stone-200 rounded-lg p-6 text-center hover:border-emerald-900/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-emerald-900 animate-spin" />
                <p className="text-sm text-stone-600">Uploading...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <p className="text-sm text-stone-600 mb-2">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-stone-400 mb-4">
                  JPEG, PNG, WebP, GIF up to 10MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </Button>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {value && (
        <div className="relative rounded-lg overflow-hidden border border-stone-200">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
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
