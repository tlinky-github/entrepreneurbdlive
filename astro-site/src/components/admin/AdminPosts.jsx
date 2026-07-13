import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postAPI, categoryAPI } from '../../lib/api';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  FileText,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
};

const AdminPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postAPI.list({ 
        search: search || undefined, 
        limit: 50, 
        isAdmin: true, 
        status: filterStatus,
        sortBy,
        sortOrder
      });
      setPosts(res.data || []);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, sortBy, sortOrder]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const { refreshStats } = useOutletContext();

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await postAPI.delete(deleteId);
      toast.success('Post deleted');
      if (refreshStats) refreshStats();
      loadPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-yellow-100 text-yellow-700',
      pending: 'bg-blue-100 text-blue-700',
    };
    return <Badge className={styles[status] || 'bg-stone-100 text-stone-700'}>{status}</Badge>;
  };

  return (
    <div data-testid="admin-posts">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Blog Posts</h1>
          <p className="text-stone-500">Manage your website's news and articles</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadPosts} 
            disabled={loading}
            className="border-stone-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild className="bg-emerald-900 text-white group hover:bg-emerald-800">
            <Link to="/admin/content-editor?type=blog">
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
              Add New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6 border-stone-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="view_count">Views</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search posts by title, slug or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card className="border-stone-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-lg text-stone-500">No posts found</p>
              <Link to="/admin/content-editor?type=blog">
                <Button className="mt-4 bg-emerald-900 hover:bg-emerald-800">
                  Create your first post
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow 
                    key={post.id}
                    className="cursor-pointer hover:bg-stone-50 transition-colors"
                    onClick={(e) => {
                      if (!e.target.closest('button') && !e.target.closest('a')) {
                        navigate(`/admin/content-editor?type=blog&id=${post.id}`);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.featured_image && (
                          <img
                            src={post.featured_image}
                            alt=""
                            className="w-12 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-stone-900 line-clamp-1">{post.title}</p>
                          <p className="text-xs text-stone-500">/{post.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell className="text-stone-600">{post.author_name}</TableCell>
                    <TableCell className="text-stone-600">
                      <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-xs">
                        {(post.view_count || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-stone-500 text-sm">
                      {formatDate(post.created_at || post.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem asChild>
                            <Link to={`/blog/${post.slug}`} target="_blank" className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/content-editor?type=blog&id=${post.id}`} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteId(post.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post.
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

export default AdminPosts;
