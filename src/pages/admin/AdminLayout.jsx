import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { adminAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BookOpen,
  Settings,
  ChevronRight,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Menu,
  X,
  LogOut,
  Home
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const loadStats = async () => {
      try {
        const res = await adminAPI.getStats();
        setStats(res.data);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isAdmin, navigate]);

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/content-manager', label: 'Content Manager', icon: BookOpen },
    { href: '/admin/posts', label: 'Blog Posts', icon: FileText },
    { href: '/admin/entrepreneurs', label: 'Entrepreneurs', icon: Users },
    { href: '/admin/directory', label: 'Directory', icon: Building2 },
    { href: '/admin/resources', label: 'Resources', icon: BookOpen },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-stone-100" data-testid="admin-layout">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <span className="font-semibold text-stone-900">Admin Dashboard</span>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-stone-200">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">e</span>
              </div>
              <div>
                <span className="font-bold text-stone-900">Admin</span>
                <p className="text-xs text-stone-500">entrepreneurs.bd</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href, item.exact)
                    ? 'bg-emerald-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.label === 'Entrepreneurs' && stats?.pending_approvals > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white text-xs">
                    {stats.pending_approvals}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-stone-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-900 font-medium">{user?.name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900 truncate">{user?.name}</p>
                <p className="text-xs text-stone-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Home className="w-4 h-4 mr-1" />
                  Site
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          <Outlet context={{ stats, loading, refreshStats: async () => {
            const res = await adminAPI.getStats();
            setStats(res.data);
          }}} />
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Dashboard Overview Component
export const AdminDashboard = () => {
  const { stats, loading } = useOutletContext();
  const [pending, setPending] = useState({ profiles: [], listings: [] });
  const [pendingLoading, setPendingLoading] = useState(true);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const res = await adminAPI.getPending();
        setPending(res.data);
      } catch (error) {
        console.error('Error loading pending:', error);
      } finally {
        setPendingLoading(false);
      }
    };

    loadPending();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-100 text-blue-700' },
    { label: 'Entrepreneurs', value: stats?.total_entrepreneurs || 0, icon: Users, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Directory Listings', value: stats?.total_listings || 0, icon: Building2, color: 'bg-purple-100 text-purple-700' },
    { label: 'Blog Posts', value: stats?.total_blog_posts || 0, icon: FileText, color: 'bg-orange-100 text-orange-700' },
    { label: 'Resources', value: stats?.total_resources || 0, icon: BookOpen, color: 'bg-pink-100 text-pink-700' },
    { label: 'Pending Approvals', value: stats?.pending_approvals || 0, icon: Clock, color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div data-testid="admin-dashboard">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard Overview</h1>
        <p className="text-stone-500">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat, index) => (
            <Card key={index} className="border-stone-200">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
                <p className="text-sm text-stone-500">{stat.label}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pending Approvals */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Profiles</span>
              <Badge variant="outline">{pending.profiles?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : pending.profiles?.length === 0 ? (
              <p className="text-center text-stone-500 py-8">No pending profiles</p>
            ) : (
              <div className="space-y-3">
                {pending.profiles?.slice(0, 5).map((profile) => (
                  <PendingItem 
                    key={profile.id} 
                    item={profile} 
                    type="profile"
                    name={profile.name}
                    subtitle={profile.company_name}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Listings</span>
              <Badge variant="outline">{pending.listings?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : pending.listings?.length === 0 ? (
              <p className="text-center text-stone-500 py-8">No pending listings</p>
            ) : (
              <div className="space-y-3">
                {pending.listings?.slice(0, 5).map((listing) => (
                  <PendingItem 
                    key={listing.id} 
                    item={listing} 
                    type="listing"
                    name={listing.business_name}
                    subtitle={listing.listing_type?.replace('_', ' ')}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6 border-stone-200">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/posts/new">
              <Button className="bg-emerald-900 hover:bg-emerald-800">
                <FileText className="w-4 h-4 mr-2" />
                New Blog Post
              </Button>
            </Link>
            <Link to="/admin/resources/new">
              <Button variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                New Resource
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Site Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PendingItem = ({ item, type, name, subtitle }) => {
  const [processing, setProcessing] = useState(false);
  
  const handleAction = async (action) => {
    setProcessing(true);
    try {
      if (action === 'approve') {
        await adminAPI.approve(type, item.id);
      } else {
        await adminAPI.reject(type, item.id);
      }
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 truncate">{name}</p>
        <p className="text-sm text-stone-500 capitalize">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-green-600 hover:bg-green-100"
          onClick={() => handleAction('approve')}
          disabled={processing}
        >
          <CheckCircle className="w-4 h-4" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-red-600 hover:bg-red-100"
          onClick={() => handleAction('reject')}
          disabled={processing}
        >
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Need to import useOutletContext
import { useOutletContext } from 'react-router-dom';

export default AdminLayout;
