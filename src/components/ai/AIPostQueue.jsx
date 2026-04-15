import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import aiAPI from '../../lib/aiApi';
import { Loader2, Trash2, Eye, Edit, Copy } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

/**
 * AI Post Queue Component
 * View and manage all generated posts
 */

export const AIPostQueue = ({ refreshTrigger }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('draft');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const LIMIT = 10;

  useEffect(() => {
    loadPosts();
  }, [statusFilter, currentPage, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPosts = async () => {
    try {
      setLoading(true);
      const result = await aiAPI.getPosts({
        status: statusFilter,
        limit: LIMIT,
        page: currentPage,
      });

      setPosts(result.posts || []);
      setTotalPages(result.pages || 1);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;

    try {
      setDeleting(true);
      await aiAPI.deletePost(selectedPost.id);
      toast.success('Post deleted');
      setShowDeleteConfirm(false);
      setSelectedPost(null);
      await loadPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-stone-100 text-stone-700',
      scheduled: 'bg-blue-100 text-blue-700',
      published: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {['draft', 'scheduled', 'published', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg capitalize font-medium transition ${
              statusFilter === status
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          <span className="ml-2 text-stone-600">Loading posts...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center p-8 bg-stone-50 rounded-lg border border-stone-200">
          <p className="text-stone-600">No posts found</p>
          <p className="text-sm text-stone-500 mt-1">
            Generate your first post to see it here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-stone-900 truncate">{post.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(post.status)}`}>
                      {post.status}
                    </span>
                    <span className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded">
                      {post.generationConfig?.provider}
                    </span>
                  </div>

                  <p className="text-sm text-stone-600 line-clamp-2 mb-2">{post.excerpt}</p>

                  <div className="flex gap-4 text-xs text-stone-500">
                    <span>📝 {Math.ceil((post.content?.split(/\s+/)?.length || 0) / 200)} min read</span>
                    <span>📊 SEO Score: {post.metadata?.seoScore || 0}%</span>
                    <span>🔤 {post.tokens || 0} tokens</span>
                    <span>📅 {new Date(post.createdAt?.toDate?.() || post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-stone-600 hover:text-stone-900"
                    onClick={() => copyToClipboard(post.title)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => alert('Preview modal will open here')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => alert('Edit modal will open here')}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs"
                    onClick={() => {
                      setSelectedPost(post);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded text-sm font-medium transition ${
                  currentPage === page
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedPost?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIPostQueue;
