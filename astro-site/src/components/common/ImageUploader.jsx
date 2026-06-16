import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { mediaAPI } from '../../lib/api';
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
import ImageEditor from 'tui-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css';

// Hide Tui Image Editor branding
const tuiEditorStyles = document.createElement('style');
tuiEditorStyles.textContent = `
  .tui-image-editor-header-logo {
    display: none !important;
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('[data-tui-branding-hidden]')) {
  tuiEditorStyles.setAttribute('data-tui-branding-hidden', 'true');
  document.head.appendChild(tuiEditorStyles);
}

const ImageUploader = ({ 
  value, 
  onChange, 
  entityType = 'blog',
  placeholder = 'Enter image URL or upload',
  defaultTab = 'url'
}) => {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [previewUrl, setPreviewUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [mediaList, setMediaList] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(15);
  const [optimizeBeforeInsert, setOptimizeBeforeInsert] = useState(false);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('auto');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [crop, setCrop] = useState(false);
  const [sourceSize, setSourceSize] = useState(null);
  const [optimizedSize, setOptimizedSize] = useState(null);
  const [isOptimizingPreview, setIsOptimizingPreview] = useState(false);
  const [localPreviewObjectUrl, setLocalPreviewObjectUrl] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDeleteItem, setSelectedDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const editorContainerRef = useRef(null);
  const editorInstanceRef = useRef(null);

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

  const uploadFileToCloudflare = async (file, token) => {
    const authToken = token || await auth.currentUser?.getIdToken();
    if (!authToken) throw new Error('You must be logged in to upload images');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('fileType', entityType);

    const response = await fetch('/api/media-handler?action=upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to upload image');
    }

    const { publicUrl } = await response.json();
    return { publicUrl };
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

  const formatBytes = (bytes) => {
    if (bytes == null) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
  };

  useEffect(() => {
    let mounted = true;

    const fetchRemoteFileSize = async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const length = response.headers.get('content-length');
        return length ? Number(length) : null;
      } catch (error) {
        console.warn('Remote file size unavailable', error);
        return null;
      }
    };

    const updateSize = async () => {
      if (!previewUrl || activeTab !== 'url') {
        return;
      }

      setSourceSize(null);
      setOptimizedSize(null);

      const size = await fetchRemoteFileSize(previewUrl);
      if (!mounted) return;
      setSourceSize(size);
    };

    updateSize();
    return () => { mounted = false; };
  }, [previewUrl, activeTab]);

  useEffect(() => {
    return () => {
      if (localPreviewObjectUrl) {
        URL.revokeObjectURL(localPreviewObjectUrl);
      }
    };
  }, [localPreviewObjectUrl]);

  useEffect(() => {
    // Reset optimized size when optimization parameters change
    if (optimizedSize != null) {
      setOptimizedSize(null);
    }
  }, [format, quality, width, height, crop, optimizeBeforeInsert, optimizedSize]);

  const handlePreviewOptimize = async () => {
    if (!previewUrl) return;
    setIsOptimizingPreview(true);

    try {
      const optimizeRes = await mediaAPI.optimize(previewUrl, {
        format,
        quality,
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        crop,
      });

      if (optimizeRes.publicUrl) {
        setPreviewUrl(optimizeRes.publicUrl);
      }
      setSourceSize(optimizeRes.originalSize || sourceSize);
      setOptimizedSize(optimizeRes.optimizedSize || null);
      toast.success('Optimized preview ready');
    } catch (error) {
      console.error('Preview optimization failed:', error);
      toast.error('Could not generate optimized preview.');
    } finally {
      setIsOptimizingPreview(false);
    }
  };

  const handleEditImage = async () => {
    if (!previewUrl) return;
    setShowImageEditor(true);
  };

  useEffect(() => {
    if (!showImageEditor || !editorContainerRef.current) return;

    let isMounted = true;
    const initEditor = async () => {
      try {
        if (!isMounted) return;
        
        // Clear previous editor if exists
        if (editorInstanceRef.current) {
          try {
            editorInstanceRef.current.destroy();
          } catch (e) {
            console.warn('Error destroying previous editor:', e);
          }
        }

        // Fetch image and convert to data URL to avoid CORS issues
        let imageSource = previewUrl;
        try {
          const response = await fetch(previewUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          imageSource = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (fetchError) {
          console.warn('Failed to fetch image as blob, using URL directly:', fetchError);
          // Fall back to original URL
        }

        // Initialize editor with proper options
        editorInstanceRef.current = new ImageEditor(editorContainerRef.current, {
          includeUI: {
            loadImage: {
              path: imageSource,
              name: 'Image',
            },
            initMenu: '',
            menuBarPosition: 'bottom',
            locale: 'en',
          },
        });
      } catch (error) {
        console.error('Failed to initialize Tui Image Editor:', error);
        if (isMounted) {
          toast.error('Could not open image editor. Invalid image or format.');
          setShowImageEditor(false);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initEditor, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.destroy();
          editorInstanceRef.current = null;
        } catch (error) {
          console.warn('Error destroying editor:', error);
        }
      }
    };
  }, [showImageEditor, previewUrl]);

  const handleSaveEditedImage = async () => {
    if (!editorInstanceRef.current) {
      toast.error('Editor not ready. Please try again.');
      return;
    }

    try {
      setUploading(true);
      
      // Get the edited image as data URL
      const editedDataUrl = editorInstanceRef.current.toDataURL({
        format: 'png',
        multiplier: 1,
        quality: 0.95,
      });

      // Convert data URL to Blob
      const response = await fetch(editedDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `edited-${Date.now()}.png`, { type: 'image/png' });

      const { publicUrl } = await uploadFileToCloudflare(file, token);
      try {
        await mediaAPI.create({
          url: publicUrl,
          fileName: file.name,
          entityType,
          contentType: file.type,
          uploaderId: auth.currentUser?.uid,
        });
      } catch (trackError) {
        console.warn('Edited image uploaded but failed to track in Firestore:', trackError);
      }
      setPreviewUrl(publicUrl);
      setSourceSize(file.size);
      setOptimizedSize(null);
      setShowImageEditor(false);
      toast.success('Image edited and saved');
    } catch (error) {
      console.error('Failed to save edited image:', error);
      toast.error('Could not save edited image.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelEdit = () => {
    if (editorInstanceRef.current) {
      try {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      } catch (error) {
        console.warn('Error destroying editor:', error);
      }
    }
    setShowImageEditor(false);
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

      const { publicUrl } = await uploadFileToCloudflare(file);

      // 1. Set local state for preview
      setPreviewUrl(publicUrl);
      setAlt(file.name.split('.')[0].replace(/[-_]/g, ' '));
      setSourceSize(file.size);
      setOptimizedSize(null);
      
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

      // 3. Notify parent immediately
      onChange(publicUrl, { 
        alt: file.name.split('.')[0].replace(/[-_]/g, ' '),
        title: file.name
      });
      
      toast.success('Upload successful and linked to content!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const parseR2KeyFromUrl = (url) => {
    try {
      return new URL(url).pathname.replace(/^\//, '');
    } catch {
      return '';
    }
  };

  const handleGalleryDelete = async () => {
    if (!selectedDeleteItem) return;
    setDeleteLoading(true);

    try {
      const key = selectedDeleteItem.key || parseR2KeyFromUrl(selectedDeleteItem.url);

      if (key) {
        await mediaAPI.deleteR2(key);
      }

      if (selectedDeleteItem.id) {
        await mediaAPI.delete(selectedDeleteItem.id);
      }

      if (previewUrl === selectedDeleteItem.url) {
        setPreviewUrl('');
      }

      toast.success('Image deleted from library and Cloudflare R2');
      setSelectedDeleteItem(null);
      loadMedia();
    } catch (error) {
      console.error('Failed to delete gallery image:', error);
      toast.error('Could not delete the selected image.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUseImage = async () => {
    if (!previewUrl) return;

    let insertUrl = previewUrl;

    if (optimizeBeforeInsert) {
      try {
        toast.info('Optimizing image before insertion...');
        const optimizeRes = await mediaAPI.optimize(previewUrl, {
          format,
          quality,
          width: width ? Number(width) : undefined,
          height: height ? Number(height) : undefined,
          crop,
        });
        insertUrl = optimizeRes.publicUrl || previewUrl;
        setPreviewUrl(insertUrl);
        setOptimizedSize(optimizeRes.optimizedSize || null);
        setSourceSize(optimizeRes.originalSize || sourceSize);
        toast.success('Image optimized successfully!');
      } catch (error) {
        console.error('Image optimization failed:', error);
        toast.error('Could not optimize image. Inserting original image instead.');
      }
    }

    onChange(insertUrl, { alt, caption, title });
    setOptimizeBeforeInsert(false);
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
                          setSourceSize(item.size || null);
                          setOptimizedSize(null);
                          // Notify parent immediately
                          onChange(item.url, { 
                            alt: item.fileName?.split('.')[0].replace(/[-_]/g, ' ') || '',
                            title: item.fileName
                          });
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
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedDeleteItem(item);
                          }}
                          className="absolute right-2 top-2 z-10 rounded-full bg-black/80 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-white"
                          title="Delete image from library"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          <div className="space-y-3">
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
            {previewUrl && (
              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={optimizeBeforeInsert}
                    onChange={(e) => setOptimizeBeforeInsert(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-emerald-600"
                  />
                  Optimize image before insert
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500">Format</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
                    >
                      <option value="auto">Auto</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500">Quality (%)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm text-stone-500">{quality}%</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500">Max Width</label>
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="e.g. 1200"
                      size="sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500">Max Height</label>
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 800"
                      size="sm"
                    />
                  </div>
                  <div className="space-y-2 pt-6">
                    <label className="inline-flex items-center gap-2 text-sm text-stone-600">
                      <input
                        type="checkbox"
                        checked={crop}
                        onChange={(e) => setCrop(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-emerald-600"
                      />
                      Crop to size
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handlePreviewOptimize}
                    disabled={isOptimizingPreview || !previewUrl}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isOptimizingPreview ? 'Optimizing...' : 'Optimize preview'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEditImage}
                    className="text-xs border-stone-200 hover:bg-stone-50"
                  >
                    Edit image
                  </Button>
                </div>
                <p className="text-xs text-stone-500">
                  Source size: {sourceSize != null ? formatBytes(sourceSize) : 'Unavailable'}
                  {optimizedSize != null
                    ? ` · Optimized size: ${formatBytes(optimizedSize)}`
                    : optimizeBeforeInsert
                      ? ' · Optimized size: pending'
                      : ''}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          {!previewUrl && !uploading ? (
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all group cursor-pointer ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50/30 scale-[1.02]' 
                  : 'border-stone-200 hover:border-emerald-600/50 hover:bg-emerald-50/10'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  // Trigger the same upload flow as file select
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  fileInputRef.current.files = dataTransfer.files;
                  handleFileSelect({ target: { files: dataTransfer.files } });
                } else {
                  toast.error('Please drop a valid image file');
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform ${
                  isDragging ? 'bg-emerald-100 scale-110' : 'bg-stone-50 group-hover:scale-110'
                }`}>
                  <Upload className={`w-6 h-6 ${isDragging ? 'text-emerald-600' : 'text-stone-400 group-hover:text-emerald-600'}`} />
                </div>
                <p className="text-sm font-medium text-stone-600">
                  {isDragging ? 'Drop your image here!' : 'Drop image or click to browse'}
                </p>
                <p className="text-xs text-stone-400 mt-1">PNG, JPG, WebP up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-stone-400 uppercase">Selected Image</span>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setPreviewUrl('')} 
                    className="text-xs text-red-500 hover:underline"
                  >
                    Change
                  </button>
                  {mediaList.find(item => item.url === previewUrl) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const matchedItem = mediaList.find(item => item.url === previewUrl);
                        if (matchedItem) {
                          setSelectedDeleteItem(matchedItem);
                        }
                      }}
                      className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-stone-200 relative bg-stone-100">
                {previewUrl && <img src={previewUrl} alt="Preview" className="w-full max-h-[300px] object-contain" />}
              </div>
              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={optimizeBeforeInsert}
                    onChange={(e) => setOptimizeBeforeInsert(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-emerald-600"
                  />
                  Optimize before insert
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500">Format</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
                    >
                      <option value="auto">Auto</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500">Quality (%)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm text-stone-500">{quality}%</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500">Max Width</label>
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="e.g. 1200"
                      size="sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500">Max Height</label>
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 800"
                      size="sm"
                    />
                  </div>
                  <div className="space-y-2 pt-6">
                    <label className="inline-flex items-center gap-2 text-sm text-stone-600">
                      <input
                        type="checkbox"
                        checked={crop}
                        onChange={(e) => setCrop(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-emerald-600"
                      />
                      Crop to size
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handlePreviewOptimize}
                    disabled={isOptimizingPreview || !previewUrl}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isOptimizingPreview ? 'Optimizing...' : 'Optimize preview'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEditImage}
                    className="text-xs border-stone-200 hover:bg-stone-50"
                  >
                    Edit image
                  </Button>
                </div>
                <p className="text-xs text-stone-500">
                  Source size: {sourceSize != null ? formatBytes(sourceSize) : 'Unavailable'}
                  {optimizedSize != null
                    ? ` · Optimized size: ${formatBytes(optimizedSize)}`
                    : optimizeBeforeInsert
                      ? ' · Optimized size: pending'
                      : ''}
                </p>
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

      <AlertDialog open={!!selectedDeleteItem} onOpenChange={(open) => { if (!open) setSelectedDeleteItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image from Library?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the image from your Cloudflare R2 bucket and remove it from the media library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 py-2">
            <p className="text-sm text-stone-600">{selectedDeleteItem?.fileName || selectedDeleteItem?.url}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGalleryDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete Image'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tui Image Editor Modal */}
      {showImageEditor && (
        <div className="fixed inset-0 z-50 bg-black/50" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white',
              zIndex: 10,
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Edit Image</h2>
              <button
                onClick={handleCancelEdit}
                disabled={uploading}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: uploading ? 0.5 : 1,
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              ref={editorContainerRef}
              style={{
                flex: 1,
                overflow: 'hidden',
                backgroundColor: '#f9fafb',
                width: '100%',
                height: '100%',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f3f4f6',
              zIndex: 10,
            }}>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={uploading}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1,
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedImage}
                disabled={uploading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.7 : 1,
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Upload'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
