import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import {
  TrendingUp,
  Users,
  Eye,
  FileText,
  Building2,
  UserPlus,
  BarChart3,
  Calendar
} from 'lucide-react';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Page Views', 
      value: analytics?.total_page_views || 0, 
      icon: Eye, 
      color: 'bg-blue-100 text-blue-700' 
    },
    { 
      label: 'Total Users', 
      value: analytics?.total_users || 0, 
      icon: Users, 
      color: 'bg-emerald-100 text-emerald-700' 
    },
    { 
      label: 'New Users Today', 
      value: analytics?.new_users_today || 0, 
      icon: UserPlus, 
      color: 'bg-purple-100 text-purple-700' 
    },
    { 
      label: 'New This Month', 
      value: analytics?.new_users_month || 0, 
      icon: Calendar, 
      color: 'bg-orange-100 text-orange-700' 
    },
  ];

  return (
    <div data-testid="admin-analytics">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
        <p className="text-stone-500">Track your platform's performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-stone-200">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-stone-900">{stat.value.toLocaleString()}</p>
              <p className="text-sm text-stone-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users by Role */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics?.users_by_role || {}).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="capitalize text-stone-600">{role.replace('_', ' ')}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Posts */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Top Blog Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.top_posts?.length === 0 ? (
              <p className="text-stone-500 text-center py-4">No posts yet</p>
            ) : (
              <div className="space-y-3">
                {analytics?.top_posts?.map((post, index) => (
                  <div key={post.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-stone-400 text-sm">#{index + 1}</span>
                      <span className="truncate text-stone-700">{post.title}</span>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      <Eye className="w-3 h-3 mr-1" />
                      {post.view_count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Listings */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Top Directory Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.top_listings?.length === 0 ? (
              <p className="text-stone-500 text-center py-4">No listings yet</p>
            ) : (
              <div className="space-y-3">
                {analytics?.top_listings?.map((listing, index) => (
                  <div key={listing.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-stone-400 text-sm">#{index + 1}</span>
                      <span className="truncate text-stone-700">{listing.business_name}</span>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      <Eye className="w-3 h-3 mr-1" />
                      {listing.view_count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Summary */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Growth Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <p className="text-3xl font-bold text-emerald-900">{analytics?.new_users_today || 0}</p>
              <p className="text-sm text-stone-500">New Users Today</p>
            </div>
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <p className="text-3xl font-bold text-emerald-900">{analytics?.new_users_week || 0}</p>
              <p className="text-sm text-stone-500">New Users This Week</p>
            </div>
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <p className="text-3xl font-bold text-emerald-900">{analytics?.new_users_month || 0}</p>
              <p className="text-sm text-stone-500">New Users This Month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
