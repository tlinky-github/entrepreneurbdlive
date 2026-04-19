'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/components/admin/AdminClientWrapper';
import { adminAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from '@/components/common/UniversalLink';
import {
  Users,
  Building2,
  FileText,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Settings
} from 'lucide-react';

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
      // Simple reload to refresh the view
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200/50 hover:border-emerald-200 transition-all group">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-900 truncate group-hover:text-emerald-900 transition-colors">{name}</p>
        <p className="text-xs text-stone-500 capitalize font-medium">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-emerald-600 hover:bg-emerald-100 rounded-lg h-9 w-9 p-0"
          onClick={() => handleAction('approve')}
          disabled={processing}
        >
          <CheckCircle className="w-5 h-5" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-red-600 hover:bg-red-100 rounded-lg h-9 w-9 p-0"
          onClick={() => handleAction('reject')}
          disabled={processing}
        >
          <XCircle className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const { stats, loading } = useAdmin();
  const [pending, setPending] = useState({ profiles: [], listings: [] });
  const [pendingLoading, setPendingLoading] = useState(true);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const res = await adminAPI.getPending();
        setPending(res.data);
      } catch (error) {
        console.error('Error loading pending items:', error);
      } finally {
        setPendingLoading(false);
      }
    };

    loadPending();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
    { label: 'Entrepreneurs', value: stats?.total_entrepreneurs || 0, icon: Users, color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
    { label: 'Directory Listings', value: stats?.total_listings || 0, icon: Building2, color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
    { label: 'Blog Posts', value: stats?.total_blog_posts || 0, icon: FileText, color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
    { label: 'Resources', value: stats?.total_resources || 0, icon: BookOpen, color: 'bg-pink-100 text-pink-700', border: 'border-pink-200' },
    { label: 'Pending Approvals', value: stats?.pending_approvals || 0, icon: Clock, color: 'bg-red-100 text-red-700', border: 'border-red-200' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Citadel Overview</h1>
          <p className="text-stone-500 font-medium">Welcome back, Admin. Your platform engine is running at peak performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            System Live
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="border-stone-200 overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat, index) => (
            <Card key={index} className={`border-stone-200 hover:shadow-lg transition-all group cursor-default ${stat.border}`}>
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-stone-900 tracking-tight">{stat.value.toLocaleString()}</p>
                </div>
                <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pending Moderation Lists */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-stone-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-stone-50/50 border-b border-stone-100 py-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                Pending Profiles
              </span>
              <Badge variant="secondary" className="bg-emerald-900 text-white font-bold px-2 py-0.5">
                {pending.profiles?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pendingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : pending.profiles?.length === 0 ? (
              <div className="text-center py-12 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                <Users className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-stone-500 font-medium italic">No pending profiles found.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {pending.profiles?.map((profile) => (
                  <PendingItem 
                    key={profile.id} 
                    item={profile} 
                    type="profile"
                    name={profile.name}
                    subtitle={profile.company_name || 'Individual Profile'}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-stone-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-stone-50/50 border-b border-stone-100 py-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-700" />
                Pending Listings
              </span>
              <Badge variant="secondary" className="bg-emerald-900 text-white font-bold px-2 py-0.5">
                {pending.listings?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pendingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : pending.listings?.length === 0 ? (
              <div className="text-center py-12 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                <Building2 className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                <p className="text-stone-500 font-medium italic">No pending listings found.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {pending.listings?.map((listing) => (
                  <PendingItem 
                    key={listing.id} 
                    item={listing} 
                    type="listing"
                    name={listing.business_name}
                    subtitle={listing.listing_type?.replace('_', ' ') || 'General Listing'}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global Quick Actions Bar */}
      <Card className="border-stone-200 bg-emerald-900 text-white shadow-xl shadow-emerald-900/20 overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Command Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/content-editor?type=blog">
              <Button className="bg-white text-emerald-900 hover:bg-stone-100 font-bold px-6 border-none">
                <FileText className="w-4 h-4 mr-2" />
                Generate Blog
              </Button>
            </Link>
            <Link href="/admin/content-editor?type=entrepreneurs">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white font-bold">
                <Users className="w-4 h-4 mr-2" />
                New Profile
              </Button>
            </Link>
            <Link href="/admin/content-editor?type=directory">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white font-bold">
                <Building2 className="w-4 h-4 mr-2" />
                Sync Directory
              </Button>
            </Link>
            <Link href="/admin/settings" className="ml-auto">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <Settings className="w-4 h-4 mr-2" />
                Citadel Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
