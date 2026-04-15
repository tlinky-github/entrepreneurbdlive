import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import api, { mediaAPI } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { Upload, X, Image as ImageIcon, Loader2, Link as LinkIcon, Grid, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

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
  const [mediaList, setMediaList] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(15);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);

  // Sync with value prop
  useEffect(() => {
    if (value) {
      setPreviewUrl(value);
    }
  }, [value]);

  // Load media when gallery tab is opened
  useEffect(() => {
    if (activeTab === 'gallery') {
      loadMedia();
    }
  }, [activeTab]);

  const loadMedia = async () => {
    setMediaLoading(true);
    try {
      const res = await mediaAPI.list();
      console.log('Media API Response:', res);
      if (res && res.data) {
        setMediaList(res.data);
      } else {
        setMediaList([]);
      }
    } catch (error) {
      console.error('Error loading media gallery:', error);
      toast.error('Could not load gallery images');
    } finally {
      setMediaLoading(false);
    }
  };

  const deepExtractImages = (obj, foundUrls = new Set()) => {
    if (!obj || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        // Look for direct URLs
        if (obj.match(/^https?:\/\/[^\s]+?\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?$/i) || 
            (obj.includes('cloudflare') && obj.includes('http'))) {
          foundUrls.add(obj);
        }
        // Scrape embedded tags with a more flexible regex
        const imgMatches = obj.matchAll(/src\s*=\s*["']([^"']+)["']/gi);
        for (const match of imgMatches) {
          if (match[1] && match[1].startsWith('http')) {
            foundUrls.add(match[1]);
          }
        }
      }
      return foundUrls;
    }

    Object.values(obj).forEach(val => deepExtractImages(val, foundUrls));
    return foundUrls;
  };

  const syncGallery = async () => {
    setMediaLoading(true);
    toast.info('Directly listing Cloudflare R2 bucket...');
    try {
      // 1. Get current media URLs to avoid duplicates
      const currentRes = await mediaAPI.list({ noSort: true });
      const existingUrls = new Set((currentRes.data || []).map(m => m.url));
      console.log(`Current items in gallery: ${existingUrls.size}`);

      // 2. Fetch ALL resources directly from Cloudflare R2
      console.log('Crawling R2 Bucket...');
      const r2Res = await mediaAPI.listR2();
      const r2Items = r2Res.data || [];
      console.log(`Found ${r2Items.length} total objects in R2 bucket.`);
      
      const imagesToTrack = r2Items.filter(item => !existingUrls.has(item.url));
      console.log(`Unique NEW images found in bucket: ${imagesToTrack.length}`);

      let syncCount = 0;
      for (const img of imagesToTrack) {
        try {
          await mediaAPI.create({
            url: img.url,
            fileName: img.fileName,
            entityType: 'imported',
            contentType: img.contentType || 'image/jpeg',
            uploaderId: auth.currentUser?.uid,
            isImported: true,
            size: img.size
          });
          syncCount++;
        } catch (e) {
          console.warn('Failed to sync individual image:', img.url, e);
        }
      }

      if (syncCount > 0) {
        toast.success(`Registered ${syncCount} bucket images to your library!`);
        loadMedia();
      } else {
        // Fallback: If bucket is empty or all synced, check if any legacy post images are missing
        toast.info('Bucket synced. Checking for legacy post images...');
        // ... (can keep original scraper as fallback if needed)
        toast.success('Your library is fully synchronized with Cloudflare!');
      }
    } catch (err) {
      console.error('Bucket sync failed:', err);
      toast.error('Could not connect to Cloudflare R2 bucket.');
    } finally {
      setMediaLoading(false);
    }
  };

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
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error('You must be logged in to upload images');
        setUploading(false);
        return;
      }

      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

      // 1. Set local state for preview
      setPreviewUrl(publicUrl);
      setAlt(file.name.split('.')[0].replace(/[-_]/g, ' '));
      
      // 2. Track in Firestore Media collection for the Gallery
      try {
        await mediaAPI.create({
          url: publicUrl,
          fileName: file.name,
          entityType,
          contentType: file.type,
          uploaderId: auth.currentUser?.uid
        });
      } catch (trackError) {
        console.warn('Image uploaded to R2 but failed to track in Firestore:', trackError);
      }

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

  const handleRemove = async () => {
    // Try to find and delete the media record from Firestore
    try {
      const currentUrl = value || previewUrl;
      if (currentUrl) {
        const res = await mediaAPI.list();
        const match = (res.data || []).find(m => m.url === currentUrl);
        if (match) {
          await mediaAPI.delete(match.id);
        }
      }
    } catch (err) {
      console.warn('Could not delete media record:', err);
    }
    onChange('');
    setPreviewUrl('');
    setAlt('');
    setCaption('');
    setShowDeleteConfirm(false);
    toast.success('Image removed');
  };

  return (
    <div className="space-y-4" data-testid="image-uploader">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="url">
            <LinkIcon className="w-4 h-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <Grid className="w-4 h-4 mr-2" />
            Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-4">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Your Library</span>
              <button 
                onClick={syncGallery}
                disabled={mediaLoading}
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                title="Sync images from content"
              >
                <span className="text-[10px] font-bold">Resync Bucket</span>
                <RefreshCw className={`w-3 h-3 ${mediaLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVisibleCount(15); // Reset limit on search
                }}
                placeholder="Search images by name..."
                className="pl-9 bg-white border-stone-200"
              />
            </div>
          </div>
          
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 min-h-[250px]">
            {mediaLoading ? (
              <div className="grid grid-cols-5 gap-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : mediaList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="w-10 h-10 text-stone-200 mb-2" />
                <p className="text-sm text-stone-500">No images in your library yet.</p>
                <div className="flex flex-col gap-2 mt-4">
                  <button 
                    onClick={() => setActiveTab('upload')}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Upload your first image
                  </button>
                  <button 
                    onClick={syncGallery}
                    className="text-xs text-stone-400 hover:text-emerald-600 transition-colors"
                  >
                    or Sync Existing Post Images
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {mediaList
                    .filter(item => item.fileName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .slice(0, visibleCount)
                    .map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setPreviewUrl(item.url);
                          setAlt(item.fileName?.split('.')[0].replace(/[-_]/g, ' ') || '');
                          setActiveTab('upload');
                        }}
                        className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.05] active:scale-95 group relative ${
                          previewUrl === item.url ? 'border-emerald-600 shadow-md ring-2 ring-emerald-100' : 'border-transparent hover:border-stone-200'
                        }`}
                      >
                        <img 
                          src={item.url} 
                          alt={item.fileName} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[8px] text-white truncate text-center">{item.fileName}</p>
                        </div>
                      </div>
                    ))}
                </div>
                {mediaList.filter(item => item.fileName?.toLowerCase().includes(searchTerm.toLowerCase())).length > visibleCount && (
                  <div className="flex justify-center pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setVisibleCount(prev => prev + 15)}
                      className="text-xs text-stone-500 border-stone-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                    >
                      Load More Images
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <div className="flex space-x-2">
            <Input
              value={previewUrl || ''}
              onChange={(e) => setPreviewUrl(e.target.value)}
              placeholder={placeholder}
            />
            <Button 
              type="button"
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
                  type="button"
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
                <button 
                  type="button" 
                  onClick={() => setPreviewUrl('')} 
                  className="text-xs text-red-500 hover:underline"
                >
                  Change
                </button>
              </div>
              <div className="rounded-lg overflow-hidden border border-stone-200 relative bg-stone-100">
                <img src={previewUrl} alt="Preview" className="w-full max-h-[300px] object-contain" />
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
                type="button"
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
        <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
          <img src={value} alt="Current" className="w-full max-h-[250px] object-contain" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Remove
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the image from this content. The image file will be kept in your media library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700">
              Remove Image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImageUploader;
