import { useState, useEffect } from 'react';
import { commentAPI, interactionAPI } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { format, isToday, isYesterday } from 'date-fns';
import Turnstile from '../submit/Turnstile';
import {
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  Loader2,
  CornerDownRight,
  User,
  Send,
  Reply,
  Edit2,
  Trash2,
  Flag,
  Check,
  X
} from 'lucide-react';
import ShareModal from '../common/ShareModal';

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

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || import.meta.env.REACT_APP_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

export default function BlogInteractions({ postId, postTitle, postExcerpt, initialLikeCount = 0 }) {
  const { user, isAuthenticated } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [commenterGender, setCommenterGender] = useState('male');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [reportingCommentId, setReportingCommentId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const commentsRes = await commentAPI.list('blog', postId);
        setComments(commentsRes.data || []);

        if (isAuthenticated) {
          const [likeRes, bookmarkRes] = await Promise.all([
            interactionAPI.checkLike('blog', postId),
            interactionAPI.checkBookmark('blog', postId),
          ]);
          setLiked(likeRes.data.liked);
          setBookmarked(bookmarkRes.data.bookmarked);
        }
      } catch (error) {
        console.error('Error loading interaction data:', error);
      }
    };
    loadData();
  }, [postId, isAuthenticated]);

  const handleDeleteComment = async (id) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentAPI.delete(id);
        
        // Robust Recursive Deletion from local state
        setComments(prev => {
          const toDelete = new Set([id]);
          let foundNew;
          do {
            foundNew = false;
            prev.forEach(c => {
              if (c.parent_id && toDelete.has(c.parent_id) && !toDelete.has(c.id)) {
                toDelete.add(c.id);
                foundNew = true;
              }
            });
          } while (foundNew);
          
          return prev.filter(c => !toDelete.has(c.id));
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

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like posts');
      return;
    }
    try {
      const res = await interactionAPI.toggleLike('blog', postId);
      setLiked(res.data.liked);
      setLikeCount(prev => prev + (res.data.liked ? 1 : -1));
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
      const res = await interactionAPI.toggleBookmark('blog', postId);
      setBookmarked(res.data.bookmarked);
      toast.success(res.data.bookmarked ? 'Added to bookmarks' : 'Removed from bookmarks');
    } catch (error) {
      toast.error('Failed to bookmark post');
    }
  };

  const handleShare = () => {
    setIsShareOpen(true);
  };

  const getVisibleCommentsCount = () => {
    const topLevelIds = new Set(comments.filter(c => !c.parent_id).map(c => c.id));
    const visible = comments.filter(c => !c.parent_id || topLevelIds.has(c.parent_id));
    return visible.length;
  };

  const visibleCount = getVisibleCommentsCount();

  const handleCommentSubmit = async (parentId = null) => {
    const name = isAuthenticated ? (user?.name || 'Admin') : commenterName.trim();
    if (!name) { toast.error('Please enter your name'); return; }
    if (!newComment.trim()) { toast.error('Please write a comment'); return; }
    if (!turnstileToken) { toast.error('Please complete the captcha'); return; }

    setSubmittingComment(true);
    try {
      const res = await commentAPI.create({
        content: newComment.trim(),
        content_type: 'blog',
        content_id: postId,
        parent_id: parentId,
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
      setTurnstileToken(null); // Reset captcha token
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderCommentFormLocal = (parentId = null, replyName = '') => (
    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 md:p-8 mb-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-stone-700 flex items-center gap-2">
          {parentId ? <CornerDownRight className="w-4 h-4" /> : <User className="w-4 h-4" />}
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
        <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setTurnstileToken} />
        <Button
          size="sm"
          onClick={(e) => { e.preventDefault(); handleCommentSubmit(parentId); }}
          disabled={submittingComment || !turnstileToken}
          className="bg-emerald-900 text-white w-full sm:w-auto"
        >
          {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Comment'}
        </Button>
      </div>
    </div>
  );

  const renderCommentNode = (comment, isReply = false) => {
    const childReplies = comments.filter(r => r.parent_id === comment.id);
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
                      Admin
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

  const topLevelComments = comments.filter(c => !c.parent_id);

  return (
    <div className="mt-8">
      {/* Engagement Bar */}
      <div className="py-4 border-y border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className={`flex items-center gap-2 ${liked ? 'text-red-500' : 'text-stone-600'}`}
            onClick={handleLike}
            data-testid="like-btn"
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </Button>
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-stone-600"
            onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{visibleCount}</span>
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            Comments ({visibleCount})
          </h2>
          <Button variant="outline" size="sm" onClick={() => { setReplyTo(null); setActiveReplyId(null); document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' }); }}>
            Post New Comment
          </Button>
        </div>

        {/* Comment Form */}
        {renderCommentFormLocal(null)}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200">
            <MessageCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-0">
            {topLevelComments.map(c => renderCommentNode(c))}
          </div>
        )}
      </section>

      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareTitle={postTitle}
        shareText={postExcerpt}
      />
    </div>
  );
}
