import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { postAPI, profileAPI, listingAPI } from '../lib/api';
import { SEO } from '../components/SEO';
import {
  ArrowRight,
  Users,
  Building2,
  FileText,
  BookOpen,
  Rocket,
  Target,
  TrendingUp,
  Star,
  MapPin,
  ChevronRight,
  Lightbulb,
  Brain,
  DollarSign,
  AlertTriangle,
  Laptop
} from 'lucide-react';
import { pillarPages, pillarPagesPart2 } from '../data/mock';

const iconMap = {
  Lightbulb: Lightbulb,
  MapPin: MapPin,
  Users: Users,
  Building: Building2,
  Brain: Brain,
  DollarSign: DollarSign,
  TrendingUp: TrendingUp,
  Laptop: Laptop,
  AlertTriangle: AlertTriangle,
  Rocket: Rocket,
};

const Home = () => {
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [featuredEntrepreneurs, setFeaturedEntrepreneurs] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Combine pillars for the section
  const knowledgeItems = [...pillarPages, ...pillarPagesPart2].slice(0, 6);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [postsRes, profilesRes, listingsRes] = await Promise.all([
          postAPI.list({ is_featured: true, limit: 3 }).catch(() => ({ data: [] })),
          profileAPI.list({ is_featured: true, limit: 4 }).catch(() => ({ data: [] })),
          listingAPI.list({ is_featured: true, limit: 4 }).catch(() => ({ data: [] })),
        ]);

        setFeaturedPosts(postsRes.data || []);
        setFeaturedEntrepreneurs(profilesRes.data || []);
        setFeaturedListings(listingsRes.data || []);
      } catch (error) {
        console.error('Error loading homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = [
    { label: 'Entrepreneurs', value: '500+', icon: Users },
    { label: 'Businesses', value: '200+', icon: Building2 },
    { label: 'Articles', value: '150+', icon: FileText },
    { label: 'Resources', value: '50+', icon: BookOpen },
  ];

  const features = [
    {
      icon: Rocket,
      title: 'Entrepreneur Profiles',
      description: 'Showcase your journey and connect with fellow founders across Bangladesh.',
    },
    {
      icon: Target,
      title: 'Business Directory',
      description: 'List your startup or SME and get discovered by investors and partners.',
    },
    {
      icon: TrendingUp,
      title: 'Growth Resources',
      description: 'Access guides, templates, and tools to accelerate your business growth.',
    },
  ];

  return (
    <div className="bg-stone-50" data-testid="home-page">
      <SEO pageKey="home" />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-900" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <Badge className="bg-emerald-800 text-emerald-100 mb-6 px-4 py-1.5">
                Bangladesh's Entrepreneur Ecosystem
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Empowering{' '}
                <span className="text-[#ef4337]">Entrepreneurs</span>{' '}
                to Build the Future
              </h1>
              <p className="text-lg text-emerald-100 mb-8 max-w-lg">
                Connect with Bangladesh's most ambitious founders, discover thriving startups,
                and access resources to fuel your entrepreneurial journey.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="bg-white text-emerald-900 hover:bg-stone-100 px-8 font-semibold"
                    data-testid="hero-get-started-btn"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/directory">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 px-8"
                    data-testid="hero-explore-btn"
                  >
                    Explore Directory
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block animate-slide-up">
              <img
                src="https://images.unsplash.com/photo-1627599936744-51d288f89af4?w=600&h=400&fit=crop"
                alt="Bangladeshi entrepreneurs collaborating"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-12 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-emerald-900" />
                </div>
                <div className="text-3xl font-bold text-stone-900">{stat.value}</div>
                <div className="text-sm text-stone-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-900 mb-4">Platform Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              From building your profile to finding resources, we've got the tools to support your entrepreneurial journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200 group"
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl mb-6 flex items-center justify-center group-hover:bg-emerald-900 transition-colors">
                    <feature.icon className="w-7 h-7 text-emerald-900 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-3">{feature.title}</h3>
                  <p className="text-stone-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resources / Knowledge Hub Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <Badge className="bg-emerald-100 text-emerald-900 mb-4">Resources for Entrepreneurs</Badge>
              <h2 className="text-3xl font-bold text-stone-900 mb-4">
                Everything you need to start, grow, and scale
              </h2>
              <p className="text-lg text-stone-600 max-w-2xl">
                Comprehensive guides and insights to help you build your business successfully.
              </p>
            </div>
            <Link to="/knowledge" className="hidden sm:flex items-center gap-2 text-emerald-900 hover:text-emerald-700 font-medium">
              View All Topics <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {knowledgeItems.map((item) => {
              const IconComponent = iconMap[item.icon] || BookOpen;
              return (
                <Link key={item.id} to={`/knowledge/${item.id}`}>
                  <Card className="h-full border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200 group">
                    <CardContent className="p-8 flex flex-col h-full">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl mb-6 flex items-center justify-center group-hover:bg-emerald-900 transition-colors">
                        <IconComponent className="w-6 h-6 text-emerald-900 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-xl font-semibold text-stone-900 mb-2 group-hover:text-emerald-900 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm font-medium text-emerald-800 mb-3">
                        {item.subtitle}
                      </p>
                      <p className="text-stone-600 mb-6 flex-1 line-clamp-3">
                        {item.description}
                      </p>
                      <div className="flex items-center text-emerald-900 font-medium text-sm mt-auto group-hover:translate-x-1 transition-transform">
                        Read Article
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="sm:hidden mt-8 text-center">
            <Link to="/knowledge">
              <Button variant="outline" className="border-emerald-900 text-emerald-900">
                View All Topics <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Entrepreneurs */}
      {featuredEntrepreneurs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <Badge className="bg-red-100 text-red-700 mb-4">Featured</Badge>
                <h2 className="text-3xl font-bold text-stone-900">Meet Our Entrepreneurs</h2>
              </div>
              <Link to="/entrepreneurs" className="hidden sm:flex items-center gap-2 text-emerald-900 hover:text-emerald-700 font-medium">
                View All <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEntrepreneurs.map((entrepreneur) => (
                <Link key={entrepreneur.id} to={`/entrepreneurs/${entrepreneur.slug}`}>
                  <Card className="border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200 h-full">
                    <CardContent className="p-6">
                      <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                        {entrepreneur.photo ? (
                          <img src={entrepreneur.photo} alt={entrepreneur.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-emerald-900">
                            {entrepreneur.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-stone-900">{entrepreneur.name}</h3>
                        {entrepreneur.role_title && entrepreneur.company_name && (
                          <p className="text-sm text-stone-500 mt-1">
                            {entrepreneur.role_title} at {entrepreneur.company_name}
                          </p>
                        )}
                        {entrepreneur.industry && (
                          <Badge variant="outline" className="mt-3 text-xs">
                            {entrepreneur.industry}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="sm:hidden mt-8 text-center">
              <Link to="/entrepreneurs">
                <Button variant="outline" className="border-emerald-900 text-emerald-900">
                  View All Entrepreneurs <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Directory */}
      {featuredListings.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <Badge className="bg-emerald-100 text-emerald-900 mb-4">Directory</Badge>
                <h2 className="text-3xl font-bold text-stone-900">Featured Businesses</h2>
              </div>
              <Link to="/directory" className="hidden sm:flex items-center gap-2 text-emerald-900 hover:text-emerald-700 font-medium">
                View All <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredListings.map((listing) => (
                <Link key={listing.id} to={`/directory/${listing.slug}`}>
                  <Card className="border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {listing.logo ? (
                            <img src={listing.logo} alt={listing.business_name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-6 h-6 text-stone-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-stone-900 truncate">{listing.business_name}</h3>
                            {listing.is_verified && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-stone-500 capitalize">{listing.listing_type?.replace('_', ' ')}</p>
                          {listing.city && (
                            <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {listing.city}
                            </p>
                          )}
                        </div>
                      </div>
                      {listing.short_description && (
                        <p className="text-sm text-stone-600 mt-4 line-clamp-2">
                          {listing.short_description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Blog Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <Badge className="bg-emerald-100 text-emerald-900 mb-4">Blog</Badge>
                <h2 className="text-3xl font-bold text-stone-900">Latest Insights</h2>
              </div>
              <Link to="/blog" className="hidden sm:flex items-center gap-2 text-emerald-900 hover:text-emerald-700 font-medium">
                View All <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featuredPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="border-stone-200 hover:border-emerald-900/20 hover:shadow-lg transition-all duration-200 h-full overflow-hidden">
                    {post.featured_image && (
                      <div className="aspect-video bg-stone-100 overflow-hidden">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-stone-900 mb-2 line-clamp-2">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-sm text-stone-600 line-clamp-2 mb-4">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>{post.author_name}</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}



      {/* Meet the Founder Section */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-stone-100">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <Badge className="bg-emerald-100 text-emerald-900 mb-6 px-4 py-1.5">
                  Meet the Founder
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-6">
                  Md Shaddam Hossain
                </h2>
                <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                  An entrepreneur, digital marketer, and affiliate marketing specialist with over a decade
                  of experience in the technology and business sector. Former Team Lead of Sales & Marketing
                  at HasThemes (HasTech IT Ltd.), bringing hands-on experience in team coordination,
                  web development, and technology-driven business operations.
                </p>
                <Link to="/about#founder">
                  <Button
                    variant="outline"
                    className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 px-8"
                  >
                    Learn More About the Founder
                  </Button>
                </Link>
              </div>
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <img
                    src="/shaddam.webp"
                    alt="Md Shaddam Hossain"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Resources Section */}
      <section className="py-20 bg-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-emerald-800/50 rounded-2xl p-8 border border-emerald-700/50 hover:bg-emerald-800 transition-colors">
              <BookOpen className="w-10 h-10 text-emerald-300 mb-6" />
              <h3 className="text-xl font-bold mb-3">Practical Guides</h3>
              <p className="text-emerald-100 mb-8 min-h-[48px]">
                Step-by-step frameworks for common entrepreneurial challenges
              </p>
              <Link to="/resources/guides">
                <Button className="w-full bg-white text-emerald-900 hover:bg-emerald-50">
                  Explore Guides
                </Button>
              </Link>
            </div>

            <div className="bg-emerald-800/50 rounded-2xl p-8 border border-emerald-700/50 hover:bg-emerald-800 transition-colors">
              <Lightbulb className="w-10 h-10 text-emerald-300 mb-6" />
              <h3 className="text-xl font-bold mb-3">FAQs</h3>
              <p className="text-emerald-100 mb-8 min-h-[48px]">
                Answers to common entrepreneurship questions
              </p>
              <Link to="/resources/faqs">
                <Button className="w-full bg-white text-emerald-900 hover:bg-emerald-50">
                  Browse FAQs
                </Button>
              </Link>
            </div>

            <div className="bg-emerald-800/50 rounded-2xl p-8 border border-emerald-700/50 hover:bg-emerald-800 transition-colors">
              <FileText className="w-10 h-10 text-emerald-300 mb-6" />
              <h3 className="text-xl font-bold mb-3">Glossary</h3>
              <p className="text-emerald-100 mb-8 min-h-[48px]">
                Essential entrepreneurship terms explained clearly
              </p>
              <Link to="/resources/glossary">
                <Button className="w-full bg-white text-emerald-900 hover:bg-emerald-50">
                  View Glossary
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-6">
            Ready to Join Bangladesh's Entrepreneur Community?
          </h2>
          <p className="text-lg text-stone-600 mb-8 max-w-2xl mx-auto">
            Create your profile, list your business, and connect with thousands of entrepreneurs across Bangladesh.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-emerald-900 text-white hover:bg-emerald-800 px-8 font-semibold">
                Create Free Account
              </Button>
            </Link>
            <Link to="/blog">
              <Button size="lg" variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-100 px-8">
                Read Our Blog
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
