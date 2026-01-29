import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { postAPI, categoryAPI } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/ui/page-loader';
import { Search, Calendar, User, Eye, Heart, ChevronRight, Filter } from 'lucide-react';
import { SEO } from '../../components/SEO';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [postsRes, catsRes] = await Promise.all([
          postAPI.list({ search, category_id: categoryId || undefined, limit: 20 }),
          categoryAPI.list(),
        ]);
        setPosts(postsRes.data || []);
        setCategories(catsRes.data || []);
      } catch (error) {
        console.error('Error loading blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [search, categoryId]);

  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleCategoryChange = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const featuredPost = posts.find(p => p.is_featured);
  const regularPosts = posts.filter(p => !p.is_featured || posts.indexOf(p) > 0);

  return (
    <div className="bg-stone-50 min-h-screen" data-testid="blog-list-page">
      <SEO pageKey="blog" />
      {/* Header */}
      <div className="bg-emerald-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="bg-emerald-800 text-emerald-100 mb-4">Blog</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Insights & Stories
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl">
            Discover inspiring stories, expert insights, and practical guides from Bangladesh's entrepreneur community.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              data-testid="blog-search-input"
            />
          </div>
          <Select value={categoryId || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-48" data-testid="blog-category-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <PageLoader message="Discovering stories..." />
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-stone-500">No articles found</p>
            {(search || categoryId) && (
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
          <>
            {/* Featured Post */}
            {featuredPost && !search && !categoryId && (
              <Link to={`/blog/${featuredPost.slug}`} className="block mb-12">
                <Card className="overflow-hidden border-stone-200 hover:border-emerald-900/20 hover:shadow-xl transition-all duration-300">
                  <div className="grid lg:grid-cols-2">
                    <div className="aspect-video lg:aspect-auto bg-stone-100 overflow-hidden">
                      {featuredPost.featured_image ? (
                        <img
                          src={featuredPost.featured_image}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-100">
                          <span className="text-6xl font-bold text-emerald-900/20">e.bd</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-8 lg:p-12 flex flex-col justify-center">
                      <Badge className="bg-red-100 text-red-700 w-fit mb-4">Featured</Badge>
                      <h2 className="text-2xl lg:text-3xl font-bold text-stone-900 mb-4">
                        {featuredPost.title}
                      </h2>
                      {featuredPost.excerpt && (
                        <p className="text-stone-600 mb-6 line-clamp-3">{featuredPost.excerpt}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-stone-500">
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {featuredPost.author_name}
                        </span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            )}

            {/* Posts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="h-full overflow-hidden border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200">
                    <div className="aspect-video bg-stone-100 overflow-hidden">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                          <span className="text-4xl font-bold text-emerald-900/10">e.bd</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      {post.category_name && (
                        <Badge variant="outline" className="mb-3 text-xs">
                          {post.category_name}
                        </Badge>
                      )}
                      <h3 className="font-semibold text-stone-900 mb-2 line-clamp-2 group-hover:text-emerald-900">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-stone-600 line-clamp-2 mb-4">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {post.author_name}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BlogList;
