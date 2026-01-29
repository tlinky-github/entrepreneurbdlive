import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resourceAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
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
  BookOpen,
  FileText,
  CheckSquare,
  ExternalLink,
  Download
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

const resourceTypes = [
  { value: 'guide', label: 'Guide', icon: BookOpen },
  { value: 'template', label: 'Template', icon: FileText },
  { value: 'checklist', label: 'Checklist', icon: CheckSquare },
  { value: 'external_tool', label: 'External Tool', icon: ExternalLink },
];

const AdminResources = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      if (typeFilter !== 'all') params.resource_type = typeFilter;

      const res = await resourceAPI.list(params);
      setResources(res.data || []);
    } catch (error) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await resourceAPI.delete(deleteId);
      toast.success('Resource deleted');
      loadResources();
    } catch (error) {
      toast.error('Failed to delete resource');
    } finally {
      setDeleteId(null);
    }
  };

  const getTypeIcon = (type) => {
    const found = resourceTypes.find(t => t.value === type);
    return found ? found.icon : BookOpen;
  };

  return (
    <div data-testid="admin-resources">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Resources</h1>
          <p className="text-stone-500">Manage guides, templates, and tools</p>
        </div>
        <Link to="/admin/resources/new">
          <Button className="bg-emerald-900 hover:bg-emerald-800">
            <Plus className="w-4 h-4 mr-2" />
            New Resource
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-stone-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {resourceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card className="border-stone-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-lg text-stone-500">No resources found</p>
              <Link to="/admin/resources/new">
                <Button className="mt-4 bg-emerald-900 hover:bg-emerald-800">
                  Create your first resource
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => {
                  const Icon = getTypeIcon(resource.resource_type);
                  return (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-emerald-900" />
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">{resource.title}</p>
                            <p className="text-xs text-stone-500">/{resource.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{resource.resource_type?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-stone-600">{resource.category || '-'}</TableCell>
                      <TableCell>
                        {resource.is_premium && <Badge className="bg-yellow-100 text-yellow-700">Premium</Badge>}
                      </TableCell>
                      <TableCell className="text-stone-600">{resource.view_count}</TableCell>
                      <TableCell className="text-stone-600">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {resource.download_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/resources/${resource.slug}`} target="_blank" className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/resources/${resource.id}/edit`} className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(resource.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resource.
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

export default AdminResources;
