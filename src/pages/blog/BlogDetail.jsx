import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { postAPI, commentAPI, interactionAPI } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { PageLoader } from '../../components/ui/page-loader';
import { SEO } from '../../components/SEO';
import { toast } from 'sonner';
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
  Loader2
} from 'lucide-react';

const BlogDetail = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      try {
        const postRes = await postAPI.get(slug);
        setPost(postRes.data);

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

  const handleComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await commentAPI.create({
        content: newComment,
        content_type: 'blog',
        content_id: post.id,
      });
      setComments([res.data, ...comments]);
      setNewComment('');
      setPost(prev => ({ ...prev, comment_count: prev.comment_count + 1 }));
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const readingTime = post?.content_html
    ? Math.ceil(post.content_html.replace(/<[^>]+>/g, '').split(/\s+/).length / 200)
    : 0;

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
      <SEO
        title={post.title}
        description={post.excerpt}
        image={post.featured_image}
        type="article"
        author={post.author_name}
        publishedTime={post.created_at}
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
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="aspect-video bg-stone-100 rounded-xl overflow-hidden mb-10">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        {post.content_component ? (
          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-stone-900 prose-p:text-stone-700 prose-a:text-emerald-900 prose-strong:text-stone-900 prose-blockquote:border-emerald-900 prose-blockquote:text-stone-600">
            <MDXProvider>
              <post.content_component />
            </MDXProvider>
          </div>
        ) : (
          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-stone-900 prose-p:text-stone-700 prose-a:text-emerald-900 prose-strong:text-stone-900 prose-blockquote:border-emerald-900 prose-blockquote:text-stone-600"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="mt-10 pt-6 border-t border-stone-200">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-stone-600">
                  #{tag}
                </Badge>
              ))}
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

        {/* Comments Section */}
        <section id="comments" className="mt-12">
          <h2 className="text-2xl font-bold text-stone-900 mb-6">
            Comments
          </h2>

          {/* Coming Soon Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Comments Coming Soon</h3>
            <p className="text-blue-700">
              The comments feature will be implemented in the next update. Stay tuned!
            </p>
          </div>
        </section>
      </article>
    </div>
  );
};

export default BlogDetail;
