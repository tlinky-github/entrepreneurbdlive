import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import ImageUploader from '../../components/common/ImageUploader';

const AdminMedia = () => {
  return (
    <div className="space-y-6" data-testid="admin-media">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-emerald-700">
          <ImageIcon className="w-5 h-5" />
          <h1 className="text-2xl font-bold text-stone-900">Media Library</h1>
        </div>
        <p className="text-sm text-stone-500 max-w-2xl">
          Manage images stored in your Cloudflare R2 media library. Upload, preview, and delete assets directly from the admin console.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Media</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            defaultTab="gallery"
            onChange={() => {} }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMedia;
