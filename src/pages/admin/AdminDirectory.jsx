import { useState, useEffect } from 'react';
import { listingAPI, adminAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
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
  Building2,
  Star,
  Filter,
  Plus
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

const AdminDirectory = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadListings();
  }, [search, statusFilter, typeFilter]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.listing_type = typeFilter;
      
      const res = await listingAPI.list(params);
      setListings(res.data || []);
    } catch (error) {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.approve('listing', id);
      toast.success('Listing approved');
      loadListings();
    } catch (error) {
      toast.error('Failed to approve listing');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await adminAPI.reject('listing', id);
      toast.success('Listing rejected');
      loadListings();
    } catch (error) {
      toast.error('Failed to reject listing');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (listing) => {
    try {
      await listingAPI.update(listing.id, { is_featured: !listing.is_featured });
      toast.success(listing.is_featured ? 'Removed from featured' : 'Added to featured');
      loadListings();
    } catch (error) {
      toast.error('Failed to update listing');
    }
  };

  const handleToggleVerified = async (listing) => {
    try {
      await listingAPI.update(listing.id, { is_verified: !listing.is_verified });
      toast.success(listing.is_verified ? 'Verification removed' : 'Listing verified');
      loadListings();
    } catch (error) {
      toast.error('Failed to update listing');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await listingAPI.delete(deleteId);
      toast.success('Listing deleted');
      loadListings();
    } catch (error) {
      toast.error('Failed to delete listing');
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
    <div data-testid="admin-directory">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Directory Listings</h1>
          <p className="text-stone-500">Manage business directory listings</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-stone-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search listings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="sme">SME</SelectItem>
                <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                <SelectItem value="service_provider">Service Provider</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card className="border-stone-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-lg text-stone-500">No listings found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                          {listing.logo ? (
                            <img src={listing.logo} alt="" className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{listing.business_name}</p>
                          <p className="text-xs text-stone-500">{listing.city}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-stone-600 capitalize">{listing.listing_type?.replace('_', ' ')}</TableCell>
                    <TableCell className="text-stone-600">{listing.category || '-'}</TableCell>
                    <TableCell>{getStatusBadge(listing.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {listing.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                        {listing.is_verified && <Badge className="bg-blue-100 text-blue-700 text-xs">Verified</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-stone-600">{listing.view_count}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionLoading === listing.id}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/directory/${listing.slug}`} target="_blank" className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {listing.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(listing.id)} className="text-green-600">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(listing.id)} className="text-red-600">
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleToggleFeatured(listing)}>
                            <Star className="w-4 h-4 mr-2" />
                            {listing.is_featured ? 'Remove Featured' : 'Make Featured'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleVerified(listing)}>
                            {listing.is_verified ? 'Remove Verification' : 'Verify Business'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(listing.id)} className="text-red-600">
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
            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the business listing.
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

export default AdminDirectory;
