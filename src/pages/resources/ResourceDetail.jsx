// src/pages/resources/ResourceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resourceAPI, authorAPI } from '../../lib/api';
import { SEO } from '../../components/SEO';
import NotFound from '../../components/common/NotFound';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { PageLoader } from '../../components/ui/page-loader';
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  Eye, 
  Download, 
  BookOpen, 
  Share2, 
  CheckCircle, 
  Plus, 
  Minus,
  Linkedin,
  Twitter,
  Facebook,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

const ResourceDetail = () => {
  const { slug } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorData, setAuthorData] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    const loadResource = async () => {
      setLoading(true);
      try {
        const res = await resourceAPI.get(slug);
        setResource(res.data);

        // Fetch Author Data if exists
        if (res.data?.authorId) {
          try {
            const authorRes = await authorAPI.get(res.data.authorId);
            setAuthorData(authorRes.data);
          } catch (err) {
            console.error('Error fetching resource author:', err);
          }
        }
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
  if (!resource) return <NotFound />;

  return (
    <div className="bg-stone-50 min-h-screen pb-20">
      <SEO 
        title={resource.seo_title || resource.title}
        description={resource.seo_description || resource.excerpt}
        image={resource.featured_image || '/images/resource-placeholder.jpg'}
        type="article"
        author={authorData?.name || "Entrepreneur BD"}
        publishedTime={resource.created_at?.toISOString ? resource.created_at.toISOString() : resource.created_at}
        faqs={resource.faqs}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Knowledge Hub', path: '/knowledge' },
          { name: resource.title, path: `/knowledge/${resource.slug}` }
        ]}
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
                {/* Article Content with Inline FAQs */}
                <div className="tiptap-content">
                  {(() => {
                    const content = resource.content || resource.content_html || '';
                    // Split content by our custom FAQ tag
                    const parts = content.split(/(<faq-section[^>]*><\/faq-section>)/g);
                    
                    return parts.map((part, index) => {
                      if (part.startsWith('<faq-section')) {
                        // Extract data-faqs attribute
                        try {
                          const match = part.match(/data-faqs='([^']*)'/);
                          if (match && match[1]) {
                            const faqs = JSON.parse(match[1].replace(/&quot;/g, '"'));
                            return (
                              <div key={index} className="my-12 pt-8 border-t border-stone-200 bg-emerald-50/30 rounded-2xl p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                                  <CheckCircle className="w-6 h-6 text-emerald-700" />
                                  Frequently Asked Questions
                                </h2>
                                <div className="space-y-4">
                                  {faqs.map((faq, fIndex) => (
                                    <div 
                                      key={fIndex}
                                      className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm"
                                    >
                                      <button
                                        onClick={() => setOpenFaqIndex(openFaqIndex === `inline-${index}-${fIndex}` ? null : `inline-${index}-${fIndex}`)}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50"
                                      >
                                        <strong className="font-bold text-stone-900 pr-4">{faq.question || faq.q}</strong>
                                        <div className="text-emerald-700">
                                          {openFaqIndex === `inline-${index}-${fIndex}` ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                        </div>
                                      </button>
                                      {openFaqIndex === `inline-${index}-${fIndex}` && (
                                        <div className="px-4 pb-4 pt-0 text-stone-600 border-t border-stone-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                          <p className="mt-4 leading-relaxed whitespace-pre-wrap">{faq.answer || faq.a}</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        } catch (e) {
                          console.error('Error parsing inline FAQs:', e);
                        }
                        return null;
                      }
                      
                      return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
                    })
                  })()}
                </div>

                {/* Meet The Author Section */}
                {authorData && (
                  <div className="mt-12 pt-8 border-t border-stone-100">
                    <div className="bg-stone-50 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start">
                      <Link to={`/author/${authorData.slug}`} className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-emerald-900 shadow-sm">
                          {authorData.photo ? (
                            <img src={authorData.photo} alt={authorData.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-emerald-900">
                              {authorData.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-stone-900">Contributor: {authorData.name}</h4>
                          <div className="flex items-center gap-3">
                            {authorData.linkedin && (
                              <a href={authorData.linkedin} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-blue-700 transition-colors">
                                <Linkedin className="w-4 h-4" />
                              </a>
                            )}
                            {authorData.twitter && (
                              <a href={authorData.twitter} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-sky-500 transition-colors">
                                <Twitter className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-stone-600 mb-4 line-clamp-3">
                          {authorData.bio || "Expert contributor to our knowledge base, helping community members thrive."}
                        </p>
                        <Link to={`/author/${authorData.slug}`} className="text-xs font-bold text-emerald-900 hover:underline">
                          VIEW FULL PROFILE & GUIDES →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
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
