import { useState, useEffect, useCallback } from 'react';
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
  Plus,
  Pencil
} from 'lucide-react';
import BulkEditModal from './BulkEditModal';
import ImportDrawer from './ImportDrawer';
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
import { Link, useOutletContext } from 'react-router-dom';

const AdminDirectory = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Pagination & Bulk Selection States
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 500, isAdmin: true };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.listing_type = typeFilter;
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      const res = await listingAPI.list(params);
      setListings(res.data || []);
    } catch (error) {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Reset page and selection when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search, statusFilter, typeFilter, sortBy, sortOrder]);

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

  const { refreshStats } = useOutletContext();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await listingAPI.delete(deleteId);
      toast.success('Listing deleted');
      if (refreshStats) refreshStats();
      loadListings();
    } catch (error) {
      toast.error('Failed to delete listing');
    } finally {
      setDeleteId(null);
    }
  };

  const openBulkEdit = () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one listing first');
      return;
    }
    setBulkEditOpen(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return <Badge className={styles[status] || 'bg-stone-100 text-stone-700'}>{status}</Badge>;
  };

  const totalItems = listings.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedListings = listings.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const range = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
        pages.push(i);
      } else if (i === 2 && currentPage - range > 2) {
        pages.push('...');
      } else if (i === totalPages - 1 && currentPage + range < totalPages - 1) {
        pages.push('...');
      }
    }
    return pages.filter((item, index) => pages.indexOf(item) === index);
  };

  const pageIds = paginatedListings.map(l => l.id);
  const isAllSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
  
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div data-testid="admin-directory">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Directory Listings</h1>
          <p className="text-stone-500">Manage business directory listings</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportDrawer contentType="directory" onImported={loadListings} />
          <Button asChild className="bg-emerald-900 text-white group hover:bg-emerald-800">
            <Link to="/admin/content-editor?type=directory">
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
              Add New Listing
            </Link>
          </Button>
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date</SelectItem>
                <SelectItem value="updated_at">Last Edited</SelectItem>
                <SelectItem value="view_count">Views</SelectItem>
                <SelectItem value="business_name">Name</SelectItem>
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
        </CardContent>
      </Card>

      {/* Bulk Actions & Pagination controls */}
      {!loading && listings.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openBulkEdit}
              disabled={selectedIds.length === 0}
              className="border-stone-200 bg-white text-sm font-semibold"
            >
              Bulk Edit{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </Button>
            {selectedIds.length > 0 && (
              <span className="text-sm text-stone-500 font-medium">
                {selectedIds.length} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Show:</span>
            <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[80px] bg-white">
                <SelectValue placeholder="20" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-stone-500">per page</span>
          </div>
        </div>
      )}

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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 px-4">
                      <input 
                        type="checkbox" 
                        checked={isAllSelected} 
                        onChange={handleSelectAll}
                        className="rounded border-stone-300 text-emerald-900 focus:ring-emerald-800 h-4 w-4 cursor-pointer"
                      />
                    </TableHead>
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
                  {paginatedListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="px-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(listing.id)} 
                          onChange={() => handleSelectRow(listing.id)}
                          className="rounded border-stone-300 text-emerald-900 focus:ring-emerald-800 h-4 w-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white border border-stone-200 rounded-lg flex items-center justify-center overflow-hidden p-1">
                            {listing.logo ? (
                              <img src={listing.logo} alt="" className="w-full h-full rounded-lg object-contain" />
                            ) : (
                              <Building2 className="w-5 h-5 text-stone-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">{listing.business_name || listing.title || 'Untitled'}</p>
                            <p className="text-sm text-stone-500">{listing.city || listing.headquarters || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-stone-600 capitalize">
                        {listing.listing_type_name || listing.listing_type?.replace('_', ' ') || '-'}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {listing.category_name || listing.category || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(listing.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {listing.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                          {listing.is_verified && <Badge className="bg-blue-100 text-blue-700 text-sm">Verified</Badge>}
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
                              <Link to={`/admin/content-editor?type=directory&id=${listing.id}`} className="flex items-center gap-2">
                                <Pencil className="w-4 h-4" />
                                Edit Listing
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/directory/${listing.slug}`} target="_blank" className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                View Public
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

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-stone-50/50 border-t border-stone-200">
                  <div className="text-sm text-stone-500">
                    Showing <span className="font-semibold text-stone-700">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-stone-700">{Math.min(endIndex, totalItems)}</span> of{' '}
                    <span className="font-semibold text-stone-700">{totalItems}</span> listings
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="border-stone-200 bg-white"
                    >
                      Previous
                    </Button>
                    
                    {getPageNumbers().map((page, idx) => {
                      if (page === '...') {
                        return <span key={`ellipsis-${idx}`} className="px-2 text-stone-400">...</span>;
                      }
                      const isActive = page === currentPage;
                      return (
                        <Button
                          key={page}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={isActive ? 'bg-emerald-900 text-white hover:bg-emerald-800' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'}
                        >
                          {page}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="border-stone-200 bg-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
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

      <BulkEditModal
        isOpen={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        selectedIds={selectedIds}
        contentType="directory"
        onSuccess={() => {
          setSelectedIds([]);
          if (refreshStats) refreshStats();
          loadListings();
        }}
      />
    </div>
  );
};

export default AdminDirectory;
