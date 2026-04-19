'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { commentAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  User, 
  CornerDownRight, 
  Trash2, 
  Flag, 
  MoreVertical,
  Loader2,
  Reply,
  CheckCircle,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import Script from 'next/script';

export default function BlogComments({ postId, initialComments = [] }) {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [commenterGender, setCommenterGender] = useState('male');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  const renderTurnstile = useCallback(() => {
    if (typeof window !== 'undefined' && window.turnstile && turnstileRef.current && !turnstileWidgetId.current) {
        turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.REACT_APP_TURNSTILE_SITE_KEY,
          callback: (token) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(null),
          theme: 'light',
        });
    }
  }, []);

  const handleCreateComment = async () => {
    const name = isAuthenticated ? (user?.name || (isAdmin ? 'Admin' : 'User')) : commenterName.trim();
    if (!name) return toast.error('Please enter your name');
    if (!newComment.trim()) return toast.error('Please write a comment');
    if (!turnstileToken) return toast.error('Please complete the security check');

    setSubmitting(true);
    try {
      const res = await commentAPI.create({
        content_type: 'blog',
        content_id: postId,
        author_name: name,
        author_gender: commenterGender,
        content: newComment.trim(),
        parent_id: replyTo?.id || null,
        turnstile_token: turnstileToken
      });

      setComments(prev => [...prev, res.data]);
      setNewComment('');
      setReplyTo(null);
      if (window.turnstile) window.turnstile.reset(turnstileWidgetId.current);
      setTurnstileToken(null);
      toast.success('Comment posted successfully');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await commentAPI.delete(id);
      setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const CommentItem = ({ comment, isReply = false }) => {
    const isEditing = editingId === comment.id;
    const isOwner = user?.uid === comment.author_uid || isAdmin;

    return (
      <div className={`group animate-fade-in ${isReply ? 'ml-8 lg:ml-12 mt-4' : 'mb-8'}`}>
        <div className="flex gap-4">
          <Avatar className="w-10 h-10 border border-stone-100 flex-shrink-0">
             <AvatarFallback className={`${comment.author_gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'} font-bold`}>
                {comment.author_name?.charAt(0)}
             </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-stone-200/60 rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-stone-900 mr-2">{comment.author_name}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                    {formatRelativeDate(comment.created_at)}
                  </span>
                </div>
                {isOwner && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }} className="p-1 hover:text-emerald-900"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(comment.id)} className="p-1 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mt-2">
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="mb-2" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={async () => {
                        await commentAPI.update(comment.id, editContent);
                        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, content: editContent } : c));
                        setEditingId(null);
                    }}><Check className="w-3.5 h-3.5 mr-1" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>

            {!isReply && !isEditing && (
              <div className="flex items-center gap-4 mt-2 ml-2">
                <button 
                  onClick={() => {
                    setReplyTo(comment);
                    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-bold text-stone-500 hover:text-emerald-900 flex items-center gap-1.5 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" /> Reply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const topLevelComments = comments.filter(c => !c.parent_id);

  return (
    <section id="comments-section" className="mt-16 pt-16 border-t border-stone-200">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onLoad={renderTurnstile} />
      
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-3xl font-bold text-stone-900 flex items-center gap-4 tracking-tight">
          <MessageCircle className="w-8 h-8 text-emerald-900" />
          Dialogue Hub <span className="text-emerald-900/30">({comments.length})</span>
        </h2>
      </div>

      {/* 🛡️ Interaction Port: The Comment Form */}
      <div id="comment-form" className="bg-white border border-stone-200/60 rounded-[32px] p-8 lg:p-12 mb-16 shadow-sm relative overflow-hidden">
        {replyTo && (
           <div className="mb-6 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 animate-slide-up">
             <span className="text-sm text-emerald-900 font-bold flex items-center gap-2">
               <CornerDownRight className="w-4 h-4" /> Replying to {replyTo.author_name}
             </span>
             <button onClick={() => setReplyTo(null)} className="text-stone-400 hover:text-stone-900 font-bold text-xs">Cancel</button>
           </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
             <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
             <Input 
                placeholder="Your name" 
                value={isAuthenticated ? (user?.name || 'Admin') : commenterName}
                onChange={(e) => setCommenterName(e.target.value)}
                disabled={isAuthenticated}
                className="pl-12 h-12 rounded-xl"
             />
          </div>
          {!isAuthenticated && (
            <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-100">
               {['male', 'female'].map(g => (
                 <button
                   key={g}
                   onClick={() => setCommenterGender(g)}
                   className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                     commenterGender === g ? 'bg-emerald-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-100'
                   }`}
                 >
                   {g}
                 </button>
               ))}
            </div>
          )}
        </div>

        <Textarea 
          placeholder="Share your perspective..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={5}
          className="rounded-2xl border-stone-200 mb-6 focus:ring-emerald-900/20"
        />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
           <div ref={turnstileRef} className="scale-90 origin-left" />
           <Button 
              disabled={submitting}
              onClick={handleCreateComment}
              className="w-full lg:w-auto bg-emerald-900 text-white hover:bg-emerald-800 px-12 h-14 rounded-2xl font-bold transition-all shadow-xl active:scale-95"
           >
             {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <MessageCircle className="w-5 h-5 mr-2" />}
             Post Narrative
           </Button>
        </div>
      </div>

      {/* 🛡️ Content Deck: The Threads */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-20 bg-stone-50 rounded-[32px] border border-stone-100">
             <p className="text-stone-500 font-medium">No narratives yet. Be the first to start the conversation.</p>
          </div>
        ) : (
          topLevelComments.map(comment => (
            <div key={comment.id}>
              <CommentItem comment={comment} />
              {comments.filter(c => c.parent_id === comment.id).map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
