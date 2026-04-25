import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listingAPI } from '../../lib/api';
import CustomCodeInjector from '../../components/common/CustomCodeInjector';
import { SEO } from '../../components/SEO';
import NotFound from '../../components/common/NotFound';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import { ensureAbsoluteUrl } from '../../lib/utils';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Globe,
  Mail,
  Phone,
  Star,
  Share2,
  ExternalLink,
  Eye,
  CheckCircle,
  Plus,
  Minus,
  Users,
  Linkedin as LinkedinIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon
} from 'lucide-react';

const DirectoryDetail = () => {
  const { slug } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    const loadListing = async () => {
      setLoading(true);
      try {
        const res = await listingAPI.get(slug);
        setListing(res.data);
      } catch (error) {
        console.error('Error loading listing:', error);
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [slug]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: listing.business_name,
        text: listing.short_description,
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
        <div className="max-w-4xl mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="bg-white rounded-2xl p-8">
            <div className="flex items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return <NotFound />;
  }

  return (
    <div className="bg-stone-50 min-h-screen pb-12" data-testid="directory-detail-page">
      {listing && (
        <CustomCodeInjector
          pageCss={listing.custom_css}
          pageJs={listing.custom_js}
          pageHeadHtml={listing.custom_head_html}
        />
      )}
      <SEO
        title={listing.seoTitle || listing.business_name}
        description={listing.metaDescription || listing.short_description || listing.details}
        image={listing.logo}
        type="business.business"
        faqs={listing.faqs}
        businessData={{
          business_name: listing.business_name,
          logo: listing.logo,
          email: listing.email,
          phone: listing.phone,
          city: listing.city,
          socialLinks: [
            listing.social_linkedin,
            listing.social_twitter,
            listing.social_facebook,
            listing.website
          ].filter(Boolean)
        }}
        keywords={[listing.category, listing.city, listing.listing_type, 'Business Directory', 'Bangladesh'].filter(Boolean)}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Directory', path: '/directory' },
          { name: listing.business_name, path: `/directory/${listing.slug}` }
        ]}
      />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/directory" className="inline-flex items-center gap-2 text-stone-500 hover:text-emerald-900 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
      </div>

      {/* Hero Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="relative rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl h-40 md:h-60 lg:h-80 group">
          {/* Cover Image with Mesh Gradient Fallback */}
          {listing.cover_image ? (
            <img 
              src={listing.cover_image} 
              alt="" 
              className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" 
            />
          ) : (
            <div className="w-full h-full bg-stone-900 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/40 to-stone-950 opacity-80" />
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }} />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Building2 className="w-16 h-16 md:w-20 md:h-20 text-emerald-800/20" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Profile Identity Bar - Decoupled Overlap */}
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-10 px-4 md:px-12">
          {/* Logo with specific negative margin */}
          <div className="-mt-12 md:-mt-20 w-24 h-24 md:w-40 md:h-40 bg-white rounded-2xl md:rounded-3xl shadow-2xl border-4 md:border-[8px] border-white flex items-center justify-center overflow-hidden flex-shrink-0 z-10 transition-all hover:scale-105 duration-300">
            {listing.logo ? (
              <img src={listing.logo} alt={listing.business_name} className="w-full h-full object-contain p-3 md:p-6" />
            ) : (
              <Building2 className="w-12 h-12 md:w-20 md:h-20 text-stone-200" />
            )}
          </div>
          
          {/* Text content now starts naturally below the banner */}
          <div className="flex-1 w-full text-center md:text-left pt-4 md:pt-8">
            <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-center md:justify-start">
              <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                {listing.business_name}
              </h1>
              {listing.is_featured && (
                <div className="bg-yellow-100 p-1.5 rounded-full ring-2 ring-white shadow-md">
                   <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                </div>
              )}
            </div>
            <p className="text-xs md:text-md text-stone-400 font-bold mt-2 uppercase tracking-[0.2em] opacity-80">
              {listing.listing_type_name || listing.listing_type?.replace('_', ' ') || 'Registered Business'}
            </p>
          </div>
        </div>
      </div>

      {/* Content Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-10">
            <Card className="border-stone-200 shadow-sm overflow-hidden rounded-2xl">
              <CardContent className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10 pb-10 border-b border-stone-100">
                  <div className="space-y-6 flex-1">
                    <div className="flex flex-wrap gap-3">
                      {listing.city && (
                        <div className="flex items-center gap-2 text-sm bg-emerald-50 text-emerald-800 px-4 py-1.5 rounded-full font-semibold border border-emerald-100">
                           <MapPin className="w-4 h-4" /> {listing.city}
                        </div>
                      )}
                      {listing.employee_size && (
                        <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-800 px-4 py-1.5 rounded-full font-semibold border border-blue-100">
                           <Users className="w-4 h-4" /> {listing.employee_size} Employees
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm bg-stone-100 text-stone-600 px-4 py-1.5 rounded-full font-semibold border border-stone-200">
                         <Eye className="w-4 h-4" /> {listing.view_count || 0} Views
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" onClick={handleShare} className="flex-1 md:flex-initial h-11 border-stone-300">
                      <Share2 className="w-4 h-4 mr-2" /> Share
                    </Button>
                    {listing.website && (
                      <a href={ensureAbsoluteUrl(listing.website)} target={listing.website_link_settings?.target || "_blank"} rel={listing.website_link_settings?.rel || "noopener noreferrer"} className="flex-1 md:flex-initial">
                        <Button className="bg-emerald-900 hover:bg-emerald-800 w-full h-11 px-8">
                          <Globe className="w-4 h-4 mr-2" /> Visit Website
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                <div className="prose prose-stone max-w-none prose-h2:text-2xl prose-h2:font-black prose-p:text-stone-800 prose-p:leading-relaxed prose-p:text-lg">
                   <h2 className="mb-6 uppercase tracking-widest text-sm text-stone-900 font-black border-l-4 border-emerald-600 pl-4">Company Overview</h2>
                   <div className="whitespace-pre-wrap text-stone-900 font-medium">
                      {listing.details || listing.short_description || "No detailed description available for this business listing."}
                   </div>
                </div>

                {/* Rich Content & FAQs */}
                {listing.content && (
                  <div className="mt-12 pt-12 border-t border-stone-100 tiptap-content">
                    {(() => {
                      let contentHtml = listing.content || '';
                      if (!contentHtml) return null;

                      // Senior Engineer Fix: Advanced Frontend Smart Styler
                      // Automatically upgrades legacy content to the premium emerald design on-the-fly
                      const applySmartDesign = (html) => {
                        if (!html) return '';
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        
                        // 1. Surgical Style Cleaning (Preserves our specific premium classes)
                        doc.querySelectorAll('[style]').forEach(el => {
                          const style = el.getAttribute('style').toLowerCase();
                          if (el.innerText.length > 300) el.style.fontWeight = 'normal';
                          
                          // Remove Google Docs junk but keep intentional layout
                          const junk = ['color', 'background-color', 'font-family', 'font-size', 'line-height'];
                          junk.forEach(prop => { el.style[prop] = ''; });
                          if (!el.style.length) el.removeAttribute('style');
                        });

                        // 2. Fix links with leading/trailing spaces in their text (Premium Content Repair)
                        doc.querySelectorAll('a').forEach(link => {
                          const h = link.innerHTML;
                          const t = h.trim();
                          if (h !== t) {
                            const leadMatch = h.match(/^\s+/);
                            const trailMatch = h.match(/\s+$/);
                            
                            if (leadMatch) {
                              const leadNode = doc.createTextNode(leadMatch[0]);
                              link.parentNode.insertBefore(leadNode, link);
                            }
                            
                            link.innerHTML = t;
                            
                            if (trailMatch) {
                              const trailNode = doc.createTextNode(trailMatch[0]);
                              if (link.nextSibling) {
                                link.parentNode.insertBefore(trailNode, link.nextSibling);
                              } else {
                                link.parentNode.appendChild(trailNode);
                              }
                            }
                          }
                        });
                        
                        // 3. Fix tables for responsiveness (Wrap in scrollable container)
                        doc.querySelectorAll('table').forEach(table => {
                          if (table.parentNode && table.parentNode.className !== 'table-wrapper') {
                            const wrapper = doc.createElement('div');
                            wrapper.className = 'table-wrapper';
                            table.parentNode.insertBefore(wrapper, table);
                            wrapper.appendChild(table);
                          }
                        });
                        
                        return doc.body.innerHTML;
                      };

                      contentHtml = applySmartDesign(contentHtml);
                      
                      // Clean up redundant AI strings
                      contentHtml = contentHtml
                        .replace(/<p[^>]*>(?:<[^>]+>)*\s*SEO Title:[\s\S]*?<\/p>/gi, '')
                        .replace(/<p[^>]*>(?:<[^>]+>)*\s*Meta Description:[\s\S]*?<\/p>/gi, '');

                      const parts = contentHtml.split(/(<faq-section[^>]*>.*?<\/faq-section>|<faq-section[^>]*\/>)/gi);
                      
                      return parts.map((part, index) => {
                        if (!part) return null;
                        const trimmedPart = part.trim();
                        if (trimmedPart.toLowerCase().startsWith('<faq-section')) {
                          try {
                            const match = trimmedPart.match(/data-faqs=(?:'([^']*)'|"([^"]*)")/i);
                            const faqsJson = match ? (match[1] || match[2]) : null;
                            if (faqsJson) {
                              const faqsData = JSON.parse(faqsJson.replace(/&apos;/g, "'").replace(/&quot;/g, '"'));
                              return (
                                <div key={index} className="mt-10 mb-6">
                                  <h2 className="text-[1.875rem] font-bold text-stone-900 mb-5">
                                    Frequently Asked Questions
                                  </h2>
                                  <div className="faq-list">
                                    {faqsData.map((faq, fIndex) => {
                                      const answerHtml = (faq.answer || faq.a || '')
                                        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                                        .replace(/&quot;/g, '"').replace(/&amp;apos;/g, "'").replace(/&amp;/g, '&')
                                        .replace(/style="[^"]*"/gi, ''); // Strip nasty inline styles
                                        
                                      return (
                                        <div key={fIndex} className="mb-6 last:mb-0">
                                          <p className="font-bold text-stone-900 !m-0 text-lg">{faq.question || faq.q}</p>
                                          <div 
                                            className="text-stone-800 leading-[1.8] !mt-1 !mb-0 prose-faq"
                                            dangerouslySetInnerHTML={{ __html: answerHtml }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                          } catch (e) {
                            console.error('FAQ parse error:', e);
                          }
                          return null;
                        }
                        return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Life at Company Rich Section */}
            {listing.life_at_company && (
              <div className="bg-emerald-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                <h2 className="text-3xl font-black mb-8 relative z-10 flex items-center gap-3 text-white">
                  <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                  Life at {listing.business_name}
                </h2>
                <div 
                  className="tiptap-content relative z-10 prose prose-invert max-w-none text-white [&_*]:text-white"
                  dangerouslySetInnerHTML={{ __html: listing.life_at_company }}
                />
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            {/* Vital Statistics */}
            <Card className="border-stone-200 shadow-sm overflow-hidden rounded-2xl">
               <CardHeader className="bg-stone-50 border-b border-stone-100">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-stone-600">Company Vitals</CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-center group">
                    <span className="text-stone-400 text-sm font-bold uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Industry</span>
                    <span className="text-stone-900 font-black">{listing.industry || listing.industry_name || 'General Business'}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-stone-400 text-sm font-bold uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Staff Size</span>
                    <span className="text-stone-900 font-black">{listing.employee_size || 'Startup'}</span>
                  </div>
                  {listing.startup_stage && (
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 text-sm font-bold uppercase tracking-wider">Growth Stage</span>
                      <Badge className="bg-emerald-900 text-white hover:bg-emerald-950 font-black px-4 py-1">
                        {listing.startup_stage}
                      </Badge>
                    </div>
                  )}
                  {listing.headquarters && (
                     <div className="pt-4 border-t border-stone-100">
                        <span className="text-stone-400 text-[10px] font-black uppercase block mb-2">Location</span>
                        <p className="text-stone-700 font-bold flex items-start gap-2">
                           <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                           {listing.headquarters}
                        </p>
                     </div>
                  )}
               </CardContent>
            </Card>

            {/* Leadership Profiles */}
            {(listing.leadership_team || listing.founder_name || listing.ceo_name) && (
              <Card className="border-stone-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-stone-50 border-b border-stone-100">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-stone-600">Leadership Team</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {/* Founder */}
                  {(listing.leadership_team?.founder?.name || listing.founder_name) && (
                    <div className="flex items-center gap-4 group">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-900 font-black text-xl shadow-inner group-hover:bg-emerald-100 transition-colors overflow-hidden">
                        {(listing.leadership_team?.founder?.photo || listing.founder_photo) ? (
                          <img src={listing.leadership_team?.founder?.photo || listing.founder_photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (listing.leadership_team?.founder?.name || listing.founder_name).charAt(0)
                        )}
                      </div>
                      <div>
                        {listing.leadership_team?.founder?.type === 'linked' ? (
                          <Link to={`/entrepreneurs/${listing.leadership_team.founder.slug || listing.leadership_team.founder.id}`} className="font-black text-stone-900 group-hover:text-emerald-900 transition-colors hover:underline">
                            {listing.leadership_team.founder.name}
                          </Link>
                        ) : (
                          <p className="font-black text-stone-900 group-hover:text-emerald-900 transition-colors">
                            {listing.leadership_team?.founder?.name || listing.founder_name}
                          </p>
                        )}
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-0.5">Founder</p>
                      </div>
                    </div>
                  )}

                  {/* CEO */}
                  {(listing.leadership_team?.ceo?.name || listing.ceo_name) && (
                    <div className="flex items-center gap-4 group">
                      <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-900 font-black text-xl shadow-inner group-hover:bg-stone-200 transition-colors overflow-hidden">
                        {(listing.leadership_team?.ceo?.photo || listing.ceo_photo) ? (
                          <img src={listing.leadership_team?.ceo?.photo || listing.ceo_photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (listing.leadership_team?.ceo?.name || listing.ceo_name).charAt(0)
                        )}
                      </div>
                      <div>
                        {listing.leadership_team?.ceo?.type === 'linked' ? (
                          <Link to={`/entrepreneurs/${listing.leadership_team.ceo.slug || listing.leadership_team.ceo.id}`} className="font-black text-stone-900 group-hover:text-emerald-900 transition-colors hover:underline">
                            {listing.leadership_team.ceo.name}
                          </Link>
                        ) : (
                          <p className="font-black text-stone-900 group-hover:text-emerald-900 transition-colors">
                            {listing.leadership_team?.ceo?.name || listing.ceo_name}
                          </p>
                        )}
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-0.5">Chief Executive</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Direct Contact Card */}
            <Card className="bg-stone-900 border-none rounded-2xl text-white shadow-xl overflow-hidden">
               <CardContent className="p-8 space-y-6">
                  <h4 className="text-lg font-black">Get in Touch</h4>
                  <div className="space-y-4">
                    {listing.email && (
                      <a href={`mailto:${listing.email}`} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                          <Mail className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-stone-300 group-hover:text-white transition-colors">{listing.email}</span>
                      </a>
                    )}
                    {listing.phone && (
                      <a href={`tel:${listing.phone}`} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                          <Phone className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-stone-300 group-hover:text-white transition-colors">{listing.phone}</span>
                      </a>
                    )}
                    {listing.website && (
                      <a 
                        href={ensureAbsoluteUrl(listing.website)} 
                        target={listing.website_link_settings?.target || "_blank"} 
                        rel={listing.website_link_settings?.rel || "noopener noreferrer"} 
                        className="flex items-center gap-4 group"
                      >
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                          <Globe className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-stone-300 group-hover:text-white transition-colors">Visit Website</span>
                      </a>
                    )}
                    
                    {/* Social Media Section */}
                    {(listing.social_linkedin || listing.social_twitter || listing.social_facebook) && (
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-xs font-bold text-stone-400 mb-3">Follow Us</p>
                        <div className="flex items-center gap-3">
                          {listing.social_linkedin && (
                            <a href={ensureAbsoluteUrl(listing.social_linkedin)} target="_blank" rel="noopener noreferrer nofollow" className="p-2 bg-white/10 rounded-lg hover:bg-emerald-600 transition-colors group">
                              <LinkedinIcon className="w-4 h-4 text-stone-300 group-hover:text-white" />
                            </a>
                          )}
                          {listing.social_twitter && (
                            <a href={ensureAbsoluteUrl(listing.social_twitter)} target="_blank" rel="noopener noreferrer nofollow" className="p-2 bg-white/10 rounded-lg hover:bg-emerald-600 transition-colors group">
                              <TwitterIcon className="w-4 h-4 text-stone-300 group-hover:text-white" />
                            </a>
                          )}
                          {listing.social_facebook && (
                            <a href={ensureAbsoluteUrl(listing.social_facebook)} target="_blank" rel="noopener noreferrer nofollow" className="p-2 bg-white/10 rounded-lg hover:bg-emerald-600 transition-colors group">
                              <FacebookIcon className="w-4 h-4 text-stone-300 group-hover:text-white" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectoryDetail;
