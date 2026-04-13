import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Globe, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Calendar,
  ChevronRight,
  TrendingUp,
  FileText,
  Users,
  Building2,
  BookOpen,
  Clock
} from 'lucide-react';
import { authorAPI, postAPI, profileAPI, listingAPI, resourceAPI } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { SEO } from '../components/SEO';

const AuthorDetail = () => {
  const { slug } = useParams();
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    const loadAuthor = async () => {
      setLoading(true);
      try {
        const res = await authorAPI.getBySlug(slug);
        if (res.data) {
          setAuthor(res.data);
          loadAuthorContents(res.data.id);
        }
      } catch (error) {
        console.error('Error loading author:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAuthor();
  }, [slug]);

  const loadAuthorContents = async (authorId) => {
    setContentLoading(true);
    try {
      // In a real production environment, you'd have a specific "search by author" index.
      // For now, we'll fetch recently published items across all categories and filter.
      const [posts, profiles, listings, resources] = await Promise.all([
        postAPI.list({ isAdmin: false, limit: 100 }),
        profileAPI.list({ status: 'published' }),
        listingAPI.list({ status: 'published' }),
        resourceAPI.list()
      ]);

      const allItems = [
        ...(posts.data || []).map(p => ({ ...p, type: 'blog', link: `/blog/${p.slug}`, icon: FileText })),
        ...(profiles.data || []).map(p => ({ ...p, type: 'entrepreneur', link: `/entrepreneurs/${p.slug}`, icon: Users, title: p.name })),
        ...(listings.data || []).map(l => ({ ...l, type: 'directory', link: `/directory/${l.slug}`, icon: Building2, title: l.business_name })),
        ...(resources.data || []).map(r => ({ ...r, type: 'knowledge', link: `/knowledge/${r.slug}`, icon: BookOpen }))
      ].filter(item => item.authorId === authorId);

      setContents(allItems.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0)));
    } catch (error) {
      console.error('Error loading author contents:', error);
    } finally {
      setContentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-[300px] w-full rounded-2xl mb-8" />
          <div className="grid lg:grid-cols-4 gap-8">
             <div className="lg:col-span-1 space-y-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
             </div>
             <div className="lg:col-span-3 space-y-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-stone-900 mb-4">Author Not Found</h1>
          <Link to="/" className="text-emerald-900 hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-16">
      <SEO 
        title={`${author.name} | Author Profile`}
        description={author.bio?.substring(0, 160) || `Read articles and contributions from ${author.name} on entrepreneurs.bd.`}
        image={author.photo}
        type="profile"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative mb-12">
          {/* Cover Background */}
          <div className="h-48 md:h-64 w-full bg-stone-900 rounded-3xl overflow-hidden relative shadow-inner">
            {author.cover_image ? (
              <img src={author.cover_image} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900/60 to-stone-950 opacity-90" />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/10" />
          </div>
          
          {/* Profile Basic Info */}
          <div className="absolute -bottom-12 md:-bottom-10 left-4 md:left-8 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 w-[calc(100%-2rem)] md:w-full pr-0 md:pr-16">
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden bg-stone-100 shadow-xl flex-shrink-0">
              {author.photo ? (
                <img src={author.photo} alt={author.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-stone-400 font-bold bg-stone-50">
                  {author.name?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <div className="pb-4 pt-2 md:pt-0 text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">{author.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 border-none px-3">
                  {author.designation || 'Official Author'}
                </Badge>
                {contents.length > 0 && (
                   <span className="text-sm text-stone-500 font-medium flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {contents.length} Contributions
                   </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 mt-16 md:mt-24">
          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-stone-200">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">About Author</h3>
                <p className="text-stone-600 leading-relaxed text-sm">
                  {author.bio || "Professional contributor to entrepreneurs.bd, focusing on the growth and development of the Bangladeshi startup ecosystem."}
                </p>

                <div className="mt-8 space-y-4 pt-6 border-t border-stone-100">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Connect</h3>
                  <div className="flex flex-col gap-3">
                    {author.website && (
                      <a href={author.website} target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-emerald-900 text-sm flex items-center gap-2 transition-colors">
                        <Globe className="w-4 h-4" /> Website
                      </a>
                    )}
                    {author.linkedin && (
                      <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-blue-700 text-sm flex items-center gap-2 transition-colors">
                        <Linkedin className="w-4 h-4" /> LinkedIn
                      </a>
                    )}
                    {author.twitter && (
                      <a href={author.twitter} target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-sky-500 text-sm flex items-center gap-2 transition-colors">
                        <Twitter className="w-4 h-4" /> Twitter
                      </a>
                    )}
                    {author.facebook && (
                      <a href={author.facebook} target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-blue-600 text-sm flex items-center gap-2 transition-colors">
                        <Facebook className="w-4 h-4" /> Facebook
                      </a>
                    )}
                    {!author.website && !author.linkedin && !author.twitter && !author.facebook && (
                      <p className="text-xs text-stone-400 italic">No social links provided.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900">Articles & Contributions</h2>
              <div className="h-px flex-1 bg-stone-200 mx-6 hidden md:block" />
            </div>

            <div className="space-y-4">
              {contentLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
              ) : contents.length === 0 ? (
                <Card className="border-dashed border-stone-300 bg-transparent py-16">
                  <div className="text-center px-6">
                    <FileText className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                    <p className="text-stone-500">This author hasn't published any articles yet.</p>
                  </div>
                </Card>
              ) : (
                contents.map((item) => (
                  <Link key={item.id} to={item.link}>
                    <Card className="border-stone-200 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 group mb-4 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {item.featured_image && (
                            <div className="w-full md:w-32 h-40 md:h-auto flex-shrink-0 bg-stone-100 overflow-hidden">
                              <img src={item.featured_image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                          )}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <item.icon className="w-3.5 h-3.5 text-stone-400" />
                                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{item.type}</span>
                                <div className="w-1 h-1 rounded-full bg-stone-300" />
                                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {item.created_at?.seconds 
                                    ? new Date(item.created_at.seconds * 1000).toLocaleDateString()
                                    : 'Recently'}
                                </span>
                                {(item.content || item.content_html) && (
                                  <>
                                    <div className="w-1 h-1 rounded-full bg-stone-300 mx-1" />
                                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {Math.ceil(((item.content || item.content_html).replace(/<[^>]+>/g, '').split(/\s+/).length) / 200)} min read
                                    </span>
                                  </>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-1">{item.title}</h3>
                              <p className="text-sm text-stone-500 line-clamp-2 mt-2">
                                {item.excerpt || item.details || item.short_description || (item.content ? item.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...' : '')}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center text-xs font-bold text-emerald-900 group-hover:translate-x-1 transition-transform">
                              READ MORE <ChevronRight className="w-3 h-3 ml-1" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorDetail;
