import { useState, useRef } from 'react';
import { Button } from '../ui/button.jsx';
import { Progress } from '../ui/progress.jsx';
import { toast } from 'sonner';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import publicAPI from '../../lib/publicApi.js';

const PublicImageUploader = ({ onUploadComplete, value, label, turnstileToken, type }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!turnstileToken) {
      toast.error('Please complete the Captcha first');
      return;
    }

    // Standard size check for the raw file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      // If we have a specific type, use the optimization path for strict constraints
      if (type) {
        setProgress(20);
        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        
        const fileBase64 = await base64Promise;
        const response = await publicAPI.optimizeImage({ 
          fileBase64,
          type, 
          crop: true 
        }, turnstileToken);

        if (response.success && response.publicUrl) {
          setProgress(100);
          onUploadComplete(response.publicUrl);
          toast.success(`${label || 'Image'} uploaded and optimized`);
        } else {
          throw new Error('Optimization failed');
        }
      } else {
        setProgress(30);
        const response = await publicAPI.uploadDirect(file, turnstileToken);
        if (response.success && response.publicUrl) {
          setProgress(100);
          onUploadComplete(response.publicUrl);
          toast.success('Image uploaded successfully');
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-stone-700">{label}</label>}
      
      <div className="relative group">
        {value ? (
          <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-stone-200">
            <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
            <button
              onClick={() => onUploadComplete('')}
              className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-stone-200 hover:border-emerald-900/20 hover:bg-stone-50 transition-all flex flex-col items-center justify-center gap-3 group"
          >
            {uploading ? (
              <div className="text-center space-y-3 w-full px-8">
                <Loader2 className="w-8 h-8 text-emerald-900 animate-spin mx-auto" />
                <p className="text-sm text-stone-500 font-medium">Uploading... {progress}%</p>
                <Progress value={progress} className="h-1.5" />
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Upload className="w-6 h-6 text-stone-400 group-hover:text-emerald-900" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-stone-900 group-hover:text-emerald-900">
                    Click to upload image
                  </p>
                  <p className="text-sm text-stone-500 mt-1">PNG, JPG or WEBP (Max 5MB)</p>
                </div>
              </>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default PublicImageUploader;
