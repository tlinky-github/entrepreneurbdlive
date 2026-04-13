// src/pages/resources/ResourceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resourceAPI } from '../../lib/api';
import { SEO } from '../../components/SEO';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { PageLoader } from '../../components/ui/page-loader';
import { ChevronLeft, Calendar, User, Eye, Download, BookOpen, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const ResourceDetail = () => {
  const { slug } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResource = async () => {
      setLoading(true);
      try {
        const res = await resourceAPI.get(slug);
        setResource(res.data);
      } catch (error) {
        console.error('Error loading resource:', error);
      } finally {
        setLoading(false);
      }
    };
    loadResource();
  }, [slug]);

  const handleDownload = async () => {
    if (resource.is_premium) {
      toast.error('This is a premium resource');
      return;
    }
    try {
      await resourceAPI.trackDownload(resource.id);
      if (resource.file_url) {
        window.open(resource.file_url, '_blank');
      }
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  if (loading) return <PageLoader message="Loading resource..." />;
  if (!resource) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold text-stone-900 mb-4">Resource not found</h2>
      <Link to="/resources">
        <Button variant="outline">Back to Resources</Button>
      </Link>
    </div>
  );

  return (
    <div className="bg-stone-50 min-h-screen pb-20">
      <SEO 
        title={resource.seo_title || resource.title}
        description={resource.seo_description || resource.excerpt}
        keywords={resource.seo_keywords}
      />

      {/* Header */}
      <div className="bg-emerald-900 pt-12 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/resources" className="inline-flex items-center text-emerald-100/70 hover:text-white mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Resources
          </Link>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <Badge className="bg-emerald-800 text-emerald-100">{resource.resource_type}</Badge>
            {resource.category_name && <Badge variant="outline" className="border-emerald-700 text-emerald-100">{resource.category_name}</Badge>}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {resource.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-emerald-100/80 text-sm">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(resource.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {resource.view_count || 0} Views
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2">
            <Card className="border-stone-200 overflow-hidden shadow-sm">
              {resource.featured_image && (
                <div className="aspect-video">
                  <img src={resource.featured_image} alt={resource.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-8 lg:p-12">
                <div 
                  className="tiptap-content"
                  dangerouslySetInnerHTML={{ __html: resource.content }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-emerald-100 bg-white sticky top-24 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-700" />
                  Resource Access
                </h3>
                
                <p className="text-sm text-stone-600 mb-6">
                  {resource.excerpt || "Access this resource to help build and grow your business."}
                </p>

                {(resource.file_url || resource.external_url) && (
                  <Button 
                    className="w-full bg-emerald-900 hover:bg-emerald-800 h-12 text-lg font-semibold"
                    onClick={handleDownload}
                  >
                    {resource.resource_type === 'external_tool' ? 'Visit Tool' : 'Download Resource'}
                  </Button>
                )}
                
                {resource.is_premium && (
                  <p className="mt-4 text-xs text-center text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-100">
                    🔒 This is a premium resource. Upgrade your account for full access.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-stone-500" />
                  Share Resource
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard');
                  }}>
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetail;
