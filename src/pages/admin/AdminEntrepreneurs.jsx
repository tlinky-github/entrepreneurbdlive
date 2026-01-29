import { useState, useEffect, useCallback } from 'react';
import { profileAPI, adminAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical,
  Users,
  Star,
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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
import { Link } from 'react-router-dom';

const AdminEntrepreneurs = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await profileAPI.list(params);
      setProfiles(res.data || []);
    } catch (error) {
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.approve('profile', id);
      toast.success('Profile approved');
      loadProfiles();
    } catch (error) {
      toast.error('Failed to approve profile');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.reject('profile', id);
      toast.success('Profile rejected');
      loadProfiles();
    } catch (error) {
      toast.error('Failed to reject profile');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (profile) => {
    try {
      await profileAPI.update(profile.id, { is_featured: !profile.is_featured });
      toast.success(profile.is_featured ? 'Removed from featured' : 'Added to featured');
      loadProfiles();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await profileAPI.delete(deleteId);
      toast.success('Profile deleted');
      loadProfiles();
    } catch (error) {
      toast.error('Failed to delete profile');
    } finally {
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return <Badge className={styles[status] || 'bg-stone-100 text-stone-700'}>{status}</Badge>;
  };

  return (
    <div data-testid="admin-entrepreneurs">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Entrepreneur Profiles</h1>
          <p className="text-stone-500">Manage and approve entrepreneur profiles</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-stone-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search profiles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Profiles Table */}
      <Card className="border-stone-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-lg text-stone-500">No profiles found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          {profile.photo ? (
                            <img src={profile.photo} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-emerald-900 font-medium">{profile.name?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{profile.name}</p>
                          <p className="text-xs text-stone-500">{profile.role_title}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-stone-600">{profile.company_name || '-'}</TableCell>
                    <TableCell className="text-stone-600">{profile.industry || '-'}</TableCell>
                    <TableCell>{getStatusBadge(profile.status)}</TableCell>
                    <TableCell>
                      {profile.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    </TableCell>
                    <TableCell className="text-stone-600">{profile.follower_count}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionLoading === profile.id}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/entrepreneurs/${profile.slug}`} target="_blank" className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {profile.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(profile.id)} className="text-green-600">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(profile.id)} className="text-red-600">
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleToggleFeatured(profile)}>
                            <Star className="w-4 h-4 mr-2" />
                            {profile.is_featured ? 'Remove Featured' : 'Make Featured'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(profile.id)} className="text-red-600">
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
            <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entrepreneur profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEntrepreneurs;
