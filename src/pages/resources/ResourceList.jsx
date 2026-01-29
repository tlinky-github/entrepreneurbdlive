import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { resourceAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import {
  Search,
  BookOpen,
  FileText,
  CheckSquare,
  ExternalLink,
  Download,
  Eye,
  Filter,
  Lock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';

const resourceTypes = [
  { value: 'guide', label: 'Guides', icon: BookOpen },
  { value: 'template', label: 'Templates', icon: FileText },
  { value: 'checklist', label: 'Checklists', icon: CheckSquare },
  { value: 'external_tool', label: 'Tools', icon: ExternalLink },
];

const categories = [
  'Business Planning', 'Marketing', 'Finance', 'Legal', 'Operations',
  'Technology', 'HR & Team', 'Sales', 'Funding', 'Growth', 'Other'
];

const ResourceList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const resourceType = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    const loadResources = async () => {
      setLoading(true);
      try {
        const res = await resourceAPI.list({
          search: search || undefined,
          resource_type: resourceType || undefined,
          category: category || undefined,
          limit: 24
        });
        setResources(res.data || []);
      } catch (error) {
        console.error('Error loading resources:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [search, resourceType, category]);

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const handleDownload = async (resource) => {
    if (resource.is_premium) {
      toast.error('This is a premium resource');
      return;
    }

    try {
      await resourceAPI.trackDownload(resource.id);
      if (resource.file_url) {
        window.open(resource.file_url, '_blank');
      } else if (resource.external_url) {
        window.open(resource.external_url, '_blank');
      }
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  const getResourceIcon = (type) => {
    const found = resourceTypes.find(t => t.value === type);
    return found ? found.icon : BookOpen;
  };

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="resources-page">
      <SEO pageKey="resources" />
      {/* Header */}
      <div className="bg-emerald-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="bg-emerald-800 text-emerald-100 mb-4">Resources</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Resources & Tools
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl">
            Free guides, templates, checklists, and tools to help you build and grow your business.
          </p>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={resourceType || 'all'} onValueChange={(v) => updateFilters('type', v)}>
          <TabsList className="bg-white border border-stone-200">
            <TabsTrigger value="all" className="data-[state=active]:bg-emerald-900 data-[state=active]:text-white">
              All
            </TabsTrigger>
            {resourceTypes.map((type) => (
              <TabsTrigger
                key={type.value}
                value={type.value}
                className="data-[state=active]:bg-emerald-900 data-[state=active]:text-white"
              >
                <type.icon className="w-4 h-4 mr-2" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => updateFilters('search', e.target.value)}
              className="pl-10"
              data-testid="resource-search-input"
            />
          </div>
          <Select value={category || 'all'} onValueChange={(v) => updateFilters('category', v)}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="w-12 h-12 rounded-lg mb-4" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-lg text-stone-500">No resources found</p>
            {(search || resourceType || category) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchParams({})}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => {
              const Icon = getResourceIcon(resource.resource_type);
              return (
                <Card
                  key={resource.id}
                  className="h-full border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-emerald-900" />
                      </div>
                      {resource.is_premium && (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          <Lock className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-stone-900 mb-2">{resource.title}</h3>

                    {resource.category && (
                      <Badge variant="outline" className="text-xs mb-3">
                        {resource.category}
                      </Badge>
                    )}

                    {resource.description && (
                      <p className="text-sm text-stone-600 line-clamp-2 mb-4">{resource.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-100">
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {resource.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {resource.download_count}
                        </span>
                      </div>

                      {resource.resource_type === 'guide' ? (
                        <Link to={`/resources/${resource.slug}`}>
                          <Button size="sm" variant="outline">
                            Read More
                          </Button>
                        </Link>
                      ) : resource.resource_type === 'external_tool' ? (
                        <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Visit
                          </Button>
                        </a>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-emerald-900 hover:bg-emerald-800"
                          onClick={() => handleDownload(resource)}
                          disabled={resource.is_premium}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceList;
