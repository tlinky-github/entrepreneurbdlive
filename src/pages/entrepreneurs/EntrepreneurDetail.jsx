import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileAPI, interactionAPI, authorAPI } from '../../lib/api';
import CustomCodeInjector from '../../components/common/CustomCodeInjector';
import { SEO } from '../../components/SEO';
import NotFound from '../../components/common/NotFound';
import { useAuth } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { ensureAbsoluteUrl, sanitizeHtml } from '../../lib/utils';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Mail,
  Users,
  Star,
  UserPlus,
  UserMinus,
  CheckCircle,
  Plus,
  Minus,
  Share2
} from 'lucide-react';

const EntrepreneurDetail = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [authorData, setAuthorData] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await profileAPI.get(slug);
        
        if (!res.data) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(res.data);

        // Fetch Author Data if exists
        if (res.data?.authorId) {
          try {
            const authorRes = await authorAPI.get(res.data.authorId);
            setAuthorData(authorRes.data);
          } catch (err) {
            console.error('Error fetching entrepreneur profile author:', err);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [slug, isAuthenticated]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: profile.name,
        text: profile.short_bio,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="bg-stone-50 min-h-screen py-8">
        <SEO 
          title="Loading Profile... | Entrepreneurs BD" 
          description="Please wait while we load this entrepreneur profile."
        />
        <div className="max-w-4xl mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="bg-white rounded-xl p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <NotFound />;
  }

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="entrepreneur-detail-page" data-content-id={profile.id} data-content-type="entrepreneur">
      {profile && (
        <CustomCodeInjector
          pageCss={profile.custom_css}
          pageJs={profile.custom_js}
          pageHeadHtml={profile.custom_head_html}
        />
      )}
      <SEO
        title={profile.seoTitle || profile.name}
        description={profile.metaDescription || profile.short_bio || profile.details}
        image={profile.featured_image || profile.photo}
        type="profile"
        author={authorData?.name || "Entrepreneur BD"}
        faqs={profile.faqs}
        profileData={{
          name: profile.name,
          photo: profile.photo || profile.featured_image,
          designation: profile.designation || profile.role_title,
          company_name: profile.company_name || profile.business_name,
          short_bio: profile.short_bio || profile.details,
          socialLinks: [
            profile.linkedin || profile.social_linkedin,
            profile.twitter || profile.social_twitter,
            profile.facebook || profile.social_facebook,
            profile.website || profile.company_page_url
          ].filter(Boolean)
        }}
        keywords={[profile.industry, profile.city, profile.role_title, profile.company_name, 'Entrepreneur', 'Bangladesh'].filter(Boolean)}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Entrepreneurs', path: '/entrepreneurs' },
          { name: profile.name, path: `/entrepreneurs/${profile.slug}` }
        ]}
      />
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/entrepreneurs" className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Entrepreneurs
        </Link>
      </div>

      {/* Profile Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-stone-200 overflow-hidden rounded-2xl">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-emerald-900 to-emerald-700" />

          <CardContent className="p-8 -mt-16">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                  {(profile.featured_image || profile.photo) ? (
                    <img src={profile.featured_image || profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-emerald-900">
                      {profile.name?.charAt(0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 pt-6 md:pt-10">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-stone-900">{profile.name}</h1>
                      {profile.is_featured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {(profile.designation || profile.role_title) && (profile.company_name || profile.business_name) && (
                      <p className="text-lg text-stone-600">
                        {profile.designation || profile.role_title} at{' '}
                        {profile.linked_business_slug ? (
                          <Link 
                            to={`/directory/${profile.linked_business_slug}`}
                            className="font-bold text-emerald-900 hover:underline decoration-emerald-200 decoration-2 underline-offset-4"
                          >
                            {profile.company_name || profile.business_name}
                          </Link>
                        ) : (
                          <span className="font-medium">{profile.company_name || profile.business_name}</span>
                        )}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-6 mt-3">
                      {(profile.linkedin || profile.social_linkedin) && (
                        <a href={ensureAbsoluteUrl(profile.linkedin || profile.social_linkedin)} target={profile.website_link_settings ? profile.website_link_settings.target : "_blank"} rel={profile.website_link_settings?.rel || "noopener noreferrer nofollow"} className="text-stone-400 hover:text-blue-600 transition-all hover:scale-110 flex items-center gap-2 font-medium text-sm">
                          <Linkedin className="w-5 h-5 opacity-70" />
                          <span className="hidden sm:inline">LinkedIn</span>
                        </a>
                      )}
                      {(profile.twitter || profile.social_twitter) && (
                        <a href={ensureAbsoluteUrl(profile.twitter || profile.social_twitter)} target={profile.website_link_settings ? profile.website_link_settings.target : "_blank"} rel={profile.website_link_settings?.rel || "noopener noreferrer nofollow"} className="text-stone-400 hover:text-sky-500 transition-all hover:scale-110 flex items-center gap-2 font-medium text-sm">
                          <Twitter className="w-5 h-5 opacity-70" />
                          <span className="hidden sm:inline">Twitter</span>
                        </a>
                      )}
                      {(profile.facebook || profile.social_facebook) && (
                        <a href={ensureAbsoluteUrl(profile.facebook || profile.social_facebook)} target={profile.website_link_settings ? profile.website_link_settings.target : "_blank"} rel={profile.website_link_settings?.rel || "noopener noreferrer nofollow"} className="text-stone-400 hover:text-blue-700 transition-all hover:scale-110 flex items-center gap-2 font-medium text-sm">
                          <Facebook className="w-5 h-5 opacity-70" />
                          <span className="hidden sm:inline">Facebook</span>
                        </a>
                      )}
                      {(profile.website || profile.company_page_url) && (
                        <a 
                          href={ensureAbsoluteUrl(profile.website || profile.company_page_url)} 
                          target={profile.website_link_settings ? profile.website_link_settings.target : "_blank"} 
                          rel={profile.website_link_settings?.rel || "noopener noreferrer"} 
                          className="text-stone-400 hover:text-emerald-700 transition-all hover:scale-110 flex items-center gap-2 font-medium text-sm"
                        >
                          <Globe className="w-5 h-5 opacity-70" />
                          <span className="hidden sm:inline">Website</span>
                        </a>
                      )}
                    </div>
                    {(profile.city || profile.headquarters) && (
                      <p className="text-sm text-stone-500 flex items-center gap-1 mt-2">
                        <MapPin className="w-4 h-4" />
                        {profile.headquarters || `${profile.city}${profile.country ? `, ${profile.country}` : ''}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Snapshot Stats - Removed Border */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6">
                  {profile.startup_stage && (
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-stone-600">Stage</span>
                      <span className="text-sm font-semibold text-stone-700">{profile.startup_stage}</span>
                    </div>
                  )}
                  {profile.industry && (
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-stone-600">Industry</span>
                      <span className="text-sm font-semibold text-stone-700">{profile.industry}</span>
                    </div>
                  )}
                  {profile.employee_size && (
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-stone-600">Team Size</span>
                      <span className="text-sm font-semibold text-stone-700">{profile.employee_size} members</span>
                    </div>
                  )}
                  {(profile.founder_name || profile.ceo_name) && (
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-stone-600">Leadership</span>
                      <span className="text-sm font-semibold text-stone-700 truncate">{profile.ceo_name || profile.founder_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* About / Bio - Removed Border */}
            {(profile.details || profile.short_bio) && (
              <div className="mt-8 pt-4">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">About</h2>
                <div className="relative">
                  <p className="text-stone-700 leading-relaxed">
                    {isExpanded 
                      ? (profile.details || profile.short_bio) 
                      : `${(profile.details || profile.short_bio).substring(0, 160)}${(profile.details || profile.short_bio).length > 160 ? '...' : ''}`
                    }
                  </p>
                  {(profile.details || profile.short_bio).length > 160 && (
                    <button 
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-emerald-900 font-semibold mt-2 hover:underline focus:outline-none"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Full Story / Content */}
            {profile.content && (
              <div className="mt-8 pt-8 border-t border-stone-200">
                {/* Content with Inline FAQs */}
                <div className="tiptap-content">
                  {(() => {
                    let content = profile.content || '';
                    if (!content) return null;

                    // Senior Engineer Fix: Sanitize content before saving (Google Docs compatible)
                    content = sanitizeHtml(content
                      .replace(/^(<p>\s*<br\s*\/?>\s*<\/p>|<p>\s*<\/p>|<br\s*\/?>|\s)+/gi, '')
                      .replace(/(<p>\s*<br\s*\/?>\s*<\/p>|<p>\s*<\/p>|<br\s*\/?>|\s)+$/gi, '')
                      .replace(/<p[^>]*>(?:<[^>]+>)*\s*SEO Title:[\s\S]*?<\/p>/gi, '')
                      .replace(/<p[^>]*>(?:<[^>]+>)*\s*Meta Description:[\s\S]*?<\/p>/gi, '')
                      .replace(/(<p>\s*<br\s*\/?>\s*<\/p>){2,}/gi, '<p><br></p>')
                      .replace(/ style="[^"]*"/gi, '') // Strip all hardcoded styles
                      .replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1') // Unwrap all spans
                    );

                    const parts = content.split(/(<faq-section[^>]*>.*?<\/faq-section>|<faq-section[^>]*\/>)/gi);
                    
                    return parts.map((part, index) => {
                      if (!part) return null;
                      const trimmedPart = part.trim();
                      if (trimmedPart.toLowerCase().startsWith('<faq-section')) {
                        try {
                          const match = trimmedPart.match(/data-faqs=(?:'([^']*)'|"([^"]*)")/i);
                          const faqsJson = match ? (match[1] || match[2]) : null;
                          if (faqsJson) {
                            const faqs = JSON.parse(faqsJson.replace(/&apos;/g, "'").replace(/&quot;/g, '"'));
                            return (
                              <div key={index} className="mt-10 mb-6">
                                <h2 className="text-[1.875rem] font-bold text-stone-900 mb-5">
                                  Frequently Asked Questions
                                </h2>
                                <div className="faq-list">
                                  {faqs.map((faq, fIndex) => (
                                    <div 
                                      key={fIndex}
                                      className="mb-6 last:mb-0"
                                    >
                                      <h3 className="font-bold text-stone-900 !m-0 text-lg">{faq.question || faq.q}</h3>
                                      <div 
                                        className="text-stone-800 leading-[1.8] !mt-1 !mb-0 prose-faq"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(
                                          (faq.answer || faq.a || '')
                                            .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                                            .replace(/&quot;/g, '"').replace(/&amp;apos;/g, "'").replace(/&amp;/g, '&')
                                            .replace(/style="[^"]*"/gi, '')
                                        ) }}
                                      />
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
              </div>
            )}

            {/* Dynamic FAQs Section */}
            {profile.faqs?.length > 0 && (
              <div className="mt-12 pt-8 border-t border-stone-200">
                <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-700" />
                  Common Questions
                </h2>
                <div className="space-y-4">
                  {profile.faqs.map((faq, index) => (
                    <div key={index} className="bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden transition-all duration-200">
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-100 transition-colors"
                      >
                        <h3 className="font-bold text-stone-900 pr-4 text-base">{faq.question || faq.q}</h3>
                        {openFaqIndex === index ? (
                          <Minus className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                        ) : (
                          <Plus className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                        )}
                      </button>
                      {openFaqIndex === index && (
                        <div className="px-4 pb-5 pt-0 text-stone-600 border-t border-stone-100 animate-in fade-in slide-in-from-top-1">
                          <div 
                            className="mt-4 leading-relaxed prose-faq"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(
                              (faq.answer || faq.a || '')
                                .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                                .replace(/&quot;/g, '"').replace(/&amp;apos;/g, "'").replace(/&amp;/g, '&')
                                .replace(/style="[^"]*"/gi, '')
                            ) }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Author Bio - Moved to Last */}
            {authorData && (
              <div className="mt-12 pt-8 border-t border-stone-200">
                <div className="bg-stone-50 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start">
                  <Link to={`/author/${authorData.slug}`} className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white border border-stone-200">
                      {authorData.photo ? (
                        <img src={authorData.photo} alt={authorData.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-stone-300">
                          {authorData.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <div className="mb-1">
                      <h4 className="font-bold text-stone-900 leading-none">Profile written by: {authorData.name}</h4>
                    </div>
                    <p className="text-xs text-stone-500 mb-3 italic">
                      {authorData.bio || "Verified Contributor at Entrepreneurs BD"}
                    </p>
                    <Link to={`/author/${authorData.slug}`} className="text-[10px] font-black uppercase tracking-widest text-emerald-900 hover:underline">
                      View all posts by this author →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EntrepreneurDetail;
