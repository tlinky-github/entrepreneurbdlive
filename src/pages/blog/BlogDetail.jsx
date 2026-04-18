import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postAPI, commentAPI, interactionAPI, authorAPI } from '../../lib/api';
import CustomCodeInjector from '../../components/common/CustomCodeInjector';
import { useAuth } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { PageLoader } from '../../components/ui/page-loader';
import { SEO } from '../../components/SEO';
import { toast } from 'sonner';
import { ensureAbsoluteUrl } from '../../lib/utils';
import {
  Calendar,
  User,
  Eye,
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  ArrowLeft,
  Clock,
  Loader2,
  Plus,
  Minus,
  CheckCircle,
  Linkedin,
  Twitter,
  Facebook,
  Globe,
  Send,
  Reply,
  CornerDownRight,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Flag,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import BrandedPlaceholder from '../../components/blog/BrandedPlaceholder';

const formatRelativeDate = (date) => {
  if (!date) return 'Recently Published';
  try {
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    if (isNaN(d.getTime())) return 'Recently Published';
    
    if (isToday(d)) {
      return `Today, ${format(d, 'h:mm a')}`;
    }
    if (isYesterday(d)) {
      return `Yesterday, ${format(d, 'h:mm a')}`;
    }
    return format(d, 'MMM d, yyyy');
  } catch (error) {
    return 'Recently Published';
  }
};

const BlogDetail = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [commenterGender, setCommenterGender] = useState('male');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [authorData, setAuthorData] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  const handleDeleteComment = async (id) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentAPI.delete(id);
        // Remove the comment and all its replies from the local state to prevent orphans
        setComments(prev => {
          const toDelete = new Set([id]);
          // Simple one-level nested check (common in this app)
          prev.forEach(c => { if(c.parent_id === id) toDelete.add(c.id); });
          return prev.filter(c => !toDelete.has(c.id));
        });
        
        // Update local post count based on actual items removed
        setPost(prev => {
          const removedCount = comments.filter(c => c.id === id || c.parent_id === id).length;
          return { 
            ...prev, 
            comment_count: Math.max(0, (prev.comment_count || 0) - removedCount) 
          };
        });
        toast.success('Comment deleted');
      } catch (error) {
        console.error('Delete Error:', error);
        toast.error('Failed to delete comment');
      }
    }
  };
  
  const handleUpdateComment = async (id) => {
    if (!editContent.trim()) return;
    try {
      await commentAPI.update(id, editContent.trim());
      setComments(prev => prev.map(c => c.id === id ? { ...c, content: editContent.trim(), is_edited: true } : c));
      setEditingCommentId(null);
      toast.success('Comment updated');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  };

  const handleReportComment = async (id) => {
    try {
      await commentAPI.report(id, 'Spam or Inappropriate');
      setReportingCommentId(id);
      toast.success('Report submitted to admins');
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  // Render Turnstile widget
  const renderTurnstile = useCallback(() => {
    try {
      if (turnstileRef.current && window.turnstile && !turnstileWidgetId.current) {
        turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.REACT_APP_TURNSTILE_SITE_KEY,
          callback: (token) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(null),
          'error-callback': (err) => console.error('Turnstile Error:', err),
          theme: 'light',
        });
      }
    } catch (err) {
      console.error('Failed to render Turnstile:', err);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.turnstile && turnstileRef.current && !turnstileWidgetId.current) {
        renderTurnstile();
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [renderTurnstile]);

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      try {
        const postRes = await postAPI.get(slug);
        
        if (!postRes.data) {
          setPost(null);
          setLoading(false);
          return;
        }

        setPost(postRes.data);

        // Load related posts from the same category
        if (postRes.data.category_id) {
          try {
            const relatedRes = await postAPI.list({ category_id: postRes.data.category_id, status: 'published', limit: 7 });
            const filtered = (relatedRes.data || []).filter(p => p.id !== postRes.data.id).slice(0, 6);
            setRelatedPosts(filtered);
          } catch (err) {
            console.error('Error loading related posts:', err);
          }
        }
        
        // Load Author Data if exists
        if (postRes.data.authorId) {
          try {
            const authorRes = await authorAPI.get(postRes.data.authorId);
            setAuthorData(authorRes.data);
          } catch (err) {
            console.error('Error fetching author details:', err);
          }
        }

        // Load comments
        const commentsRes = await commentAPI.list('blog', postRes.data.id);
        setComments(commentsRes.data || []);

        // Check like/bookmark status
        if (isAuthenticated) {
          const [likeRes, bookmarkRes] = await Promise.all([
            interactionAPI.checkLike('blog', postRes.data.id),
            interactionAPI.checkBookmark('blog', postRes.data.id),
          ]);
          setLiked(likeRes.data.liked);
          setBookmarked(bookmarkRes.data.bookmarked);
        }
      } catch (error) {
        console.error('Error loading post:', error);
        toast.error('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug, isAuthenticated]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like posts');
      return;
    }
    try {
      const res = await interactionAPI.toggleLike('blog', post.id);
      setLiked(res.data.liked);
      setPost(prev => ({
        ...prev,
        like_count: prev.like_count + (res.data.liked ? 1 : -1)
      }));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to bookmark posts');
      return;
    }
    try {
      const res = await interactionAPI.toggleBookmark('blog', post.id);
      setBookmarked(res.data.bookmarked);
      toast.success(res.data.bookmarked ? 'Added to bookmarks' : 'Removed from bookmarks');
    } catch (error) {
      toast.error('Failed to bookmark post');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const readingTime = (post?.content || post?.content_html)
    ? Math.ceil((post.content || post.content_html).replace(/<[^>]+>/g, '').split(/\s+/).length / 200)
    : 1; // Default to 1 min if content exists but is short

  if (loading) {
    return (
      <div className="bg-stone-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <PageLoader message="Loading article..." />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-stone-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Article Not Found</h1>
          <Link to="/blog">
            <Button className="bg-emerald-900 hover:bg-emerald-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="blog-detail-page">
      {post && (
        <CustomCodeInjector
          pageCss={post.custom_css}
          pageJs={post.custom_js}
          pageHeadHtml={post.custom_head_html}
        />
      )}
      <SEO
        title={post.seoTitle || post.title}
        description={post.metaDescription || post.excerpt}
        image={post.featured_image}
        type="article"
        author={authorData?.name || post.author_name}
        publishedTime={post.created_at}
        faqs={post.faqs}
        keywords={[...(post.tags || []), post.category_name, authorData?.name || post.author_name].filter(Boolean)}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          ...(post.category_name ? [{ name: post.category_name, path: `/blog?category=${post.category_slug || post.category_name.toLowerCase()}` }] : []),
          { name: post.title, path: `/blog/${post.slug}` }
        ]}
      />
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          {post.category_name && (
            <Badge className="bg-emerald-100 text-emerald-900 mb-4">{post.category_name}</Badge>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-6 leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl text-stone-600 mb-6">{post.excerpt}</p>
          )}

           <div className="flex flex-wrap items-center gap-6 text-sm text-stone-500 pb-6 border-b border-stone-200">
             <div className="flex items-center gap-2">
               {authorData ? (
                 <Link to={`/author/${authorData.slug}`} className="flex items-center gap-2 group">
                   <Avatar className="w-10 h-10 border border-stone-200 group-hover:border-emerald-500 transition-colors">
                     {authorData.photo ? (
                       <img src={authorData.photo} alt={authorData.name} className="w-full h-full object-cover" />
                     ) : (
                       <AvatarFallback className="bg-emerald-100 text-emerald-900">
                         {authorData.name?.charAt(0)}
                       </AvatarFallback>
                     )}
                   </Avatar>
                   <div>
                     <p className="font-medium text-stone-900 group-hover:text-emerald-900 transition-colors">{authorData.name}</p>
                     <p className="text-xs">{authorData.designation || 'Professional Author'}</p>
                   </div>
                 </Link>
               ) : (
                 <div className="flex items-center gap-2">
                   <Avatar className="w-10 h-10">
                     <AvatarFallback className="bg-emerald-100 text-emerald-900">
                       {post.author_name?.charAt(0)}
                     </AvatarFallback>
                   </Avatar>
                   <div>
                     <p className="font-medium text-stone-900">{post.author_name}</p>
                     <p className="text-xs">Author</p>
                   </div>
                 </div>
               )}
             </div>
              <div className="flex items-center gap-2">
                 <Calendar className="w-4 h-4" />
                 {formatRelativeDate(post.created_at)}
              </div>
             <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {readingTime} min read
             </div>
           </div>
        </header>

        {/* Featured Image */}
        {/* Featured Image */}
        {post.featured_image && (
          <div className="w-full bg-stone-100 rounded-2xl overflow-hidden mb-10 shadow-lg">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Article Content with Inline FAQs */}
        <div className="tiptap-content">
          {(() => {
            const content = post.content || post.content_html || '';
            if (!content) return null;
            
            const parts = content.split(/(<faq-section[^>]*><\/faq-section>)/g);
            
            return parts.map((part, index) => {
              if (part.startsWith('<faq-section')) {
                try {
                  const match = part.match(/data-faqs='([^']*)'/);
                  if (match && match[1]) {
                    const faqs = JSON.parse(match[1]);
                    return (
                      <div key={`faq-${index}`} className="my-12 pt-8 border-t border-stone-200 bg-emerald-50/30 rounded-2xl p-6 md:p-8">
                        <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                          <CheckCircle className="w-6 h-6 text-emerald-700" />
                          Frequently Asked Questions
                        </h2>
                        <div className="space-y-4">
                          {faqs.map((faq, fIndex) => (
                            <div key={`faq-item-${fIndex}`} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                              <button
                                onClick={() => setOpenFaqIndex(openFaqIndex === `faq-${index}-${fIndex}` ? null : `faq-${index}-${fIndex}`)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 transition-colors"
                              >
                                <strong className="font-bold text-stone-900 pr-4">{faq.question || faq.q}</strong>
                                {openFaqIndex === `faq-${index}-${fIndex}` ? <Minus className="w-5 h-5 text-emerald-700" /> : <Plus className="w-5 h-5 text-emerald-700" />}
                              </button>
                              {openFaqIndex === `faq-${index}-${fIndex}` && (
                                <div className="px-4 pb-4 pt-0 text-stone-600 border-t border-stone-100 p-4">
                                  <p className="leading-relaxed whitespace-pre-wrap">{faq.answer || faq.a}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  console.error('FAQ Error:', e);
                }
                return null;
              }
              return <div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: part }} />;
            });
          })()}
        </div>

        {/* Author Bio Section */}
        {authorData && (
          <div className="mt-12 bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Link to={`/author/${authorData.slug}`} className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-stone-100 border-2 border-emerald-900 shadow-md">
                   {authorData.photo ? (
                      <img src={authorData.photo} alt={authorData.name} className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-emerald-900">
                         {authorData.name.charAt(0)}
                      </div>
                   )}
                </div>
              </Link>
              <div className="flex-1">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                       <h3 className="text-xl font-bold text-stone-900">About the Author: {authorData.name}</h3>
                       <p className="text-sm text-emerald-700 font-medium">{authorData.designation || 'Professional Contributor'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       {authorData.website && (
                         <a href={authorData.website} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-emerald-900 transition-colors">
                            <Globe className="w-5 h-5" />
                         </a>
                       )}
                       {authorData.linkedin && (
                         <a href={authorData.linkedin} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-blue-700 transition-colors">
                            <Linkedin className="w-5 h-5" />
                         </a>
                       )}
                       {authorData.twitter && (
                         <a href={authorData.twitter} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-sky-500 transition-colors">
                            <Twitter className="w-5 h-5" />
                         </a>
                       )}
                       {authorData.facebook && (
                         <a href={authorData.facebook} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-blue-600 transition-colors">
                            <Facebook className="w-5 h-5" />
                         </a>
                       )}
                    </div>
                 </div>
                 <p className="text-stone-600 leading-relaxed mb-6">
                    {authorData.bio || `Expert contributor at entrepreneurs.bd, sharing insights to help the next generation of Bangladeshi founders grow.`}
                 </p>
                 <Link to={`/author/${authorData.slug}`}>
                    <Button variant="outline" size="sm" className="border-emerald-900 text-emerald-900 hover:bg-emerald-50">
                       View Full Profile & Contributions
                    </Button>
                 </Link>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Bar */}
        <div className="mt-8 py-4 border-y border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className={`flex items-center gap-2 ${liked ? 'text-red-500' : 'text-stone-600'}`}
              onClick={handleLike}
              data-testid="like-btn"
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{post.like_count}</span>
            </Button>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-stone-600"
              onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comment_count}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className={`${bookmarked ? 'text-emerald-900' : 'text-stone-600'}`}
              onClick={handleBookmark}
              data-testid="bookmark-btn"
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="ghost" className="text-stone-600" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-stone-900 mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((rPost) => (
                <Link key={rPost.id} to={`/blog/${rPost.slug}`}>
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-emerald-900/20 transition-all duration-200 h-full group">
                    <div className="aspect-video bg-stone-100 overflow-hidden">
                      {rPost.featured_image ? (
                        <img
                          src={rPost.featured_image}
                          alt={rPost.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <BrandedPlaceholder 
                          title={rPost.title} 
                          category={rPost.category_name} 
                        />
                      )}
                    </div>
                    <div className="p-5">
                      {rPost.category_name && (
                        <Badge variant="outline" className="mb-2 text-xs">{rPost.category_name}</Badge>
                      )}
                      <h3 className="font-semibold text-stone-900 line-clamp-2 mb-2 group-hover:text-emerald-900 transition-colors">
                        {rPost.title}
                      </h3>
                      {rPost.excerpt && (
                        <p className="text-sm text-stone-600 line-clamp-2">{rPost.excerpt}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Comments Section */}
        <section id="comments" className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
              <MessageCircle className="w-6 h-6" />
              Comments ({comments.length})
            </h2>
            <Button variant="outline" size="sm" onClick={() => { setReplyTo(null); setActiveReplyId(null); document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Post New Comment
            </Button>
          </div>

          {/* Comment Form */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
            {replyTo && (
              <div className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                <span className="text-sm text-emerald-800 flex items-center gap-2">
                  <CornerDownRight className="w-4 h-4" />
                  Replying to <strong>{replyTo.name}</strong>
                </span>
                <button onClick={() => setReplyTo(null)} className="text-stone-400 hover:text-stone-600 text-sm font-medium">Cancel</button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <Input
                  placeholder="Your name"
                  value={isAuthenticated ? (user?.name || 'Admin') : commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  disabled={isAuthenticated}
                  className="pl-10"
                />
              </div>
              {!isAuthenticated && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-stone-600">Gender:</span>
                  <button
                    type="button"
                    onClick={() => setCommenterGender('male')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      commenterGender === 'male'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommenterGender('female')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      commenterGender === 'female'
                        ? 'bg-pink-500 text-white shadow-md'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    Female
                  </button>
                </div>
              )}
            </div>

            <div className="relative mb-4">
              <Textarea
                placeholder="Share your perspective on this article..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
                rows={4}
                className="resize-none"
              />
              <span className="absolute bottom-2 right-3 text-xs text-stone-400">{newComment.length}/500</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div ref={turnstileRef} className="scale-90 origin-left" />
              <Button
                onClick={async (e) => {
                  e.preventDefault();
                  const name = isAuthenticated ? (user?.name || 'Admin') : commenterName.trim();
                  if (!name) { toast.error('Please enter your name'); return; }
                  if (!newComment.trim()) { toast.error('Please write a comment'); return; }
                  if (!turnstileToken) { toast.error('Please complete the captcha'); return; }

                  setSubmittingComment(true);
                  try {
                    const res = await commentAPI.create({
                      content: newComment.trim(),
                      content_type: 'blog',
                      content_id: post.id,
                      parent_id: replyTo?.id || null,
                      name,
                      gender: isAuthenticated ? 'admin' : commenterGender,
                      is_admin: isAuthenticated,
                      admin_name: isAuthenticated ? (user?.name || 'Admin') : null,
                      admin_photo: isAuthenticated ? user?.photoURL : null,
                    }, turnstileToken);
                    
                    setComments(prev => [res.data, ...prev]);
                    setNewComment('');
                    setReplyTo(null);
                    setActiveReplyId(null);
                    toast.success('Comment posted!');
                    
                    if (window.turnstile && turnstileWidgetId.current) {
                      window.turnstile.reset(turnstileWidgetId.current);
                      setTurnstileToken(null);
                    }
                  } catch (error) {
                    toast.error('Failed to post comment');
                  } finally {
                    setSubmittingComment(false);
                  }
                }}
                disabled={submittingComment || !turnstileToken}
                className="bg-emerald-900 hover:bg-emerald-800 text-white px-8 w-full sm:w-auto disabled:opacity-50"
              >
                {submittingComment ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Post Comment</>
                )}
              </Button>
            </div>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200">
              <MessageCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {(() => {
                // Build threaded structure
                const topLevel = comments.filter(c => !c.parent_id);
                const replies = comments.filter(c => c.parent_id);

                const renderCommentFormLocal = (parentId = null, replyName = '') => (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 md:p-8 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-stone-700 flex items-center gap-2">
                        {parentId ? <CornerDownRight className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {parentId ? `Replying to ${replyName}` : 'Share your thoughts'}
                      </span>
                      {parentId && (
                        <button onClick={() => { setReplyTo(null); setActiveReplyId(null); }} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
                      )}
                    </div>
                    
                    {!isAuthenticated && (
                      <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <Input
                          placeholder="Your name"
                          value={commenterName}
                          onChange={(e) => setCommenterName(e.target.value)}
                          className="bg-white"
                        />
                        <div className="flex items-center gap-2">
                          <button onClick={() => setCommenterGender('male')} className={`px-3 py-1 text-xs rounded-full ${commenterGender === 'male' ? 'bg-blue-500 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}>Male</button>
                          <button onClick={() => setCommenterGender('female')} className={`px-3 py-1 text-xs rounded-full ${commenterGender === 'female' ? 'bg-pink-500 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}>Female</button>
                        </div>
                      </div>
                    )}

                    <Textarea
                      placeholder="Write your comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
                      rows={parentId ? 2 : 3}
                      className="bg-white resize-none mb-4"
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div ref={parentId ? null : turnstileRef} className="scale-90 origin-left" />
                      <Button
                        size="sm"
                        onClick={async (e) => {
                          e.preventDefault();
                          const name = isAuthenticated ? (user?.name || 'Platform Admin') : commenterName.trim();
                          if (!name) { toast.error('Please enter your name'); return; }
                          if (!newComment.trim()) { toast.error('Please write a comment'); return; }
                          if (!turnstileToken) { toast.error('Please complete the captcha'); return; }

                          setSubmittingComment(true);
                          try {
                            const res = await commentAPI.create({
                              content: newComment.trim(),
                              content_type: 'blog',
                              content_id: post.id,
                              parent_id: parentId,
                              name,
                              gender: isAuthenticated ? 'admin' : commenterGender,
                              is_admin: isAuthenticated,
                              admin_name: isAuthenticated ? (user?.name || 'Platform Admin') : null,
                              admin_photo: isAuthenticated ? user?.photoURL : null,
                            }, turnstileToken);
                            
                            setComments(prev => [res.data, ...prev]);
                            setNewComment('');
                            setReplyTo(null);
                            setActiveReplyId(null);
                            toast.success('Comment posted!');
                          } catch (error) {
                            toast.error('Failed to post comment');
                          } finally {
                            setSubmittingComment(false);
                          }
                        }}
                        disabled={submittingComment || !turnstileToken}
                        className="bg-emerald-900 text-white w-full sm:w-auto"
                      >
                        {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Comment'}
                      </Button>
                    </div>
                  </div>
                );

                const renderCommentNode = (comment, isReply = false) => {
                  const childReplies = replies.filter(r => r.parent_id === comment.id);
                  const isCommentAdmin = comment.is_admin;
                  const isCurrentAdmin = isAuthenticated && (user?.role === 'super_admin' || user?.role === 'editor');
                  
                  let avatarUrl;
                  if (isCommentAdmin) {
                    avatarUrl = comment.admin_photo || `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.name || 'Admin'}&backgroundColor=059669`;
                  } else {
                    const style = comment.gender === 'female' ? 'lorelei' : 'avataaars';
                    avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(comment.name)}&backgroundColor=f1f5f9`;
                  }

                  return (
                    <div key={comment.id} className={`${isReply ? 'ml-8 md:ml-12 border-l-2 border-emerald-100 pl-4 md:pl-6' : 'border-b border-stone-100 last:border-b-0'} py-6 group/comment`}>
                      <div className="flex gap-4">
                        <div className="w-11 h-11 rounded-full flex-shrink-0 border border-stone-100 shadow-sm overflow-hidden bg-white">
                          <img src={avatarUrl} alt={comment.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap justify-between">
                            <div className="flex items-center gap-2">
                               <span className="font-bold text-stone-900 text-sm whitespace-nowrap">
                                  {isCommentAdmin ? (comment.admin_name || comment.name) : comment.name}
                               </span>
                               {isCommentAdmin && (
                                 <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0 border-none">
                                    {(comment.admin_name === post.author_name || comment.name === post.author_name) ? 'Author' : 'Admin'}
                                 </Badge>
                               )}
                               <span className="text-xs text-stone-400 whitespace-nowrap">
                                 {formatRelativeDate(comment.created_at || comment.createdAt)}
                               </span>
                            </div>
                            
                            {/* Moderation Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                               {isCurrentAdmin && (
                                 <>
                                   <button 
                                     onClick={() => {
                                       setEditingCommentId(comment.id);
                                       setEditContent(comment.content);
                                     }} 
                                     className="text-stone-400 hover:text-emerald-600 transition-colors" 
                                     title="Edit Comment"
                                   >
                                     <Edit2 className="w-4 h-4" />
                                   </button>
                                   <button onClick={() => handleDeleteComment(comment.id)} className="text-stone-400 hover:text-red-500 transition-colors" title="Delete Comment">
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                 </>
                               )}
                               {!isCurrentAdmin && reportingCommentId !== comment.id && (
                                 <button onClick={() => handleReportComment(comment.id)} className="text-stone-400 hover:text-orange-500 transition-colors" title="Report Comment">
                                   <Flag className="w-4 h-4" />
                                 </button>
                               )}
                               {reportingCommentId === comment.id && <span className="text-[10px] text-orange-500 font-medium bg-orange-50 px-1.5 py-0.5 rounded">Reported</span>}
                            </div>
                          </div>
                          
                          {editingCommentId === comment.id ? (
                            <div className="mt-2 space-y-3">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="bg-white border-emerald-100 focus:border-emerald-500 min-h-[100px]"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleUpdateComment(comment.id)} className="bg-emerald-900 text-white">
                                  <Check className="w-4 h-4 mr-1" /> Save Changes
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-stone-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                                {comment.content}
                                {comment.is_edited && <span className="ml-2 text-[10px] text-stone-400 italic">(edited)</span>}
                              </p>
                              <button
                                onClick={() => {
                                  setActiveReplyId(activeReplyId === comment.id ? null : comment.id);
                                  setReplyTo({ id: comment.id, name: comment.name });
                                }}
                                className="mt-3 text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <Reply className="w-3.5 h-3.5" /> {activeReplyId === comment.id ? 'Cancel Reply' : 'Reply'}
                              </button>
                            </>
                          )}

                          {/* Inline Reply Form */}
                          {activeReplyId === comment.id && renderCommentFormLocal(comment.id, comment.name)}
                        </div>
                      </div>

                      {childReplies.length > 0 && (
                        <div className="mt-2">
                          {childReplies.map(reply => renderCommentNode(reply, true))}
                        </div>
                      )}
                    </div>
                  );
                };

                return topLevel.map(c => renderCommentNode(c));
              })()}
            </div>
          )}
        </section>
      </article>
    </div>
  );
};

export default BlogDetail;
