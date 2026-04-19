'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { interactionAPI, commentAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Send, 
  Clock, 
  Trash2, 
  ShieldAlert,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function BlogInteractions({ postId, initialLikes = 0, postTitle, postExcerpt }) {
  const { user, isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);

  // --- IDENTITY & SOCIAL CHECK ---
  useEffect(() => {
    const checkStatus = async () => {
      if (isAuthenticated) {
        const [likeRes, bookmarkRes] = await Promise.all([
          interactionAPI.checkLike('blog', postId),
          interactionAPI.checkBookmark('blog', postId)
        ]);
        setLiked(likeRes.data.liked);
        setBookmarked(bookmarkRes.data.bookmarked);
      }
    };
    checkStatus();
  }, [postId, isAuthenticated]);

  // --- COMMENTS LOADING ---
  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await commentAPI.list('blog', postId);
      setComments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // --- ACTIONS ---
  const handleLike = async () => {
    if (!isAuthenticated) return toast.error('Please login to like');
    try {
      const res = await interactionAPI.toggleLike('blog', postId);
      setLiked(res.data.liked);
      setLikeCount(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      toast.error('Like failed');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) return toast.error('Please login to bookmark');
    try {
      const res = await interactionAPI.toggleBookmark('blog', postId);
      setBookmarked(res.data.bookmarked);
      toast.success(res.data.bookmarked ? 'Bookmarked!' : 'Removed bookmark');
    } catch (err) {
      toast.error('Bookmark failed');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: postTitle, text: postExcerpt, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!turnstileToken && !isAuthenticated) {
      toast.error('Please complete the verification');
      return;
    }

    setSubmitting(true);
    try {
      const commentData = {
        content: newComment,
        content_id: postId,
        content_type: 'blog',
        name: user?.name || 'Guest User',
        user_id: user?.uid || null,
        created_at: new Date()
      };

      const res = await commentAPI.create(commentData, turnstileToken);
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
      toast.success('Comment posted!');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t border-stone-200 pt-8" id="interactions">
      {/* Social Bar */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`gap-2 rounded-full px-6 ${liked ? 'bg-red-50 text-red-600' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span className="font-bold">{likeCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-stone-600 rounded-full px-6 hover:bg-stone-100"
            onClick={() => document.getElementById('comment-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-bold">{comments.length}</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className={`rounded-full ${bookmarked ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="text-stone-600 rounded-full hover:bg-stone-100"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Comment Section */}
      <div id="comment-section" className="scroll-mt-24">
        <h3 className="text-2xl font-bold text-stone-900 mb-8">Discussions</h3>
        
        {/* Post Form */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 mb-12">
           <div className="flex items-start gap-4">
              <Avatar className="w-10 h-10 ring-2 ring-white">
                 <AvatarFallback className="bg-emerald-900 text-white">
                   {user?.name?.charAt(0) || <User className="w-5 h-5" />}
                 </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                 <Textarea 
                    placeholder="Write a comment..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-4 bg-white border-stone-200 min-h-[100px]"
                 />
                 <div className="flex flex-wrap items-center justify-between gap-4">
                    <div ref={turnstileRef} className="h-[65px]" />
                    <Button 
                       disabled={submitting || !newComment.trim()}
                       onClick={handleSubmitComment}
                       className="bg-emerald-900 text-white px-8 rounded-full"
                    >
                       {submitting ? 'Posting...' : 'Post Comment'}
                       <Send className="ml-2 w-4 h-4" />
                    </Button>
                 </div>
              </div>
           </div>
        </div>

        {/* Comment List */}
        <div className="space-y-8">
           {loadingComments ? (
             <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-900" />
             </div>
           ) : comments.length === 0 ? (
             <div className="text-center py-12 text-stone-500 border border-dashed border-stone-200 rounded-2xl">
                No comments yet. Start the conversation!
             </div>
           ) : (
             comments.map((comment) => (
               <div key={comment.id} className="group flex gap-4">
                  <Avatar className="w-10 h-10 border border-stone-200">
                     <AvatarFallback className="bg-stone-100 text-stone-600">
                        {comment.name?.charAt(0) || 'U'}
                     </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-stone-900 text-sm">{comment.name}</span>
                        {comment.user_id === user?.uid && (
                          <Badge variant="outline" className="text-[10px] py-0 bg-emerald-50">You</Badge>
                        )}
                        <span className="text-[11px] text-stone-400">
                           {comment.created_at ? formatDistanceToNow(new Date(comment.created_at)) + ' ago' : 'Just now'}
                        </span>
                     </div>
                     <p className="text-stone-700 text-sm leading-relaxed mb-2">
                        {comment.content}
                     </p>
                     <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-[11px] font-bold text-stone-500 hover:text-emerald-900">Reply</button>
                        <button className="text-[11px] font-bold text-stone-500 hover:text-red-600 flex items-center gap-1">
                           <ShieldAlert className="w-3 h-3" /> Report
                        </button>
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
