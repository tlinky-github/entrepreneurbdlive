'use client';

import React, { useState } from 'react';
import { interactionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Heart, Bookmark, Share2, MessageCircle } from 'lucide-react';

export default function BlogEngagementBar({ post, initialLiked, initialBookmarked, commentCount }) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like posts');
      return;
    }
    try {
      const res = await interactionAPI.toggleLike('blog', post.id);
      setLiked(res.data.liked);
      setLikeCount(prev => prev + (res.data.liked ? 1 : -1));
    } catch (error) {
      toast.error('Failed to update like status');
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
      toast.error('Failed to update bookmark');
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

  const scrollToComments = () => {
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="py-6 border-y border-stone-200 flex items-center justify-between">
      <div className="flex items-center gap-2 lg:gap-6">
        <Button
          variant="ghost"
          className={`flex items-center gap-3 transition-all ${liked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-stone-600 hover:bg-stone-100'} rounded-xl px-4`}
          onClick={handleLike}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span className="font-bold text-sm">{likeCount}</span>
        </Button>
        
        <Button
          variant="ghost"
          className="flex items-center gap-3 text-stone-600 hover:bg-stone-100 rounded-xl px-4"
          onClick={scrollToComments}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-bold text-sm">{commentCount}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <Button
          variant="ghost"
          className={`transition-all ${bookmarked ? 'text-emerald-900 bg-emerald-50' : 'text-stone-600'} rounded-xl w-12 h-12 p-0`}
          onClick={handleBookmark}
        >
          <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
        </Button>
        
        <Button 
          variant="ghost" 
          className="text-stone-600 hover:bg-stone-100 rounded-xl w-12 h-12 p-0" 
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
