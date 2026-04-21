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
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-50 text-blue-700', border: 'border-blue-100', shadow: 'shadow-blue-900/5' },
    { label: 'Entrepreneurs', value: stats?.total_entrepreneurs || 0, icon: Users, color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100', shadow: 'shadow-emerald-900/5' },
    { label: 'Directory Listings', value: stats?.total_listings || 0, icon: Building2, color: 'bg-purple-50 text-purple-700', border: 'border-purple-100', shadow: 'shadow-purple-900/5' },
    { label: 'Blog Posts', value: stats?.total_blog_posts || 0, icon: FileText, color: 'bg-orange-50 text-orange-700', border: 'border-orange-100', shadow: 'shadow-orange-900/5' },
    { label: 'Resources', value: stats?.total_resources || 0, icon: BookOpen, color: 'bg-pink-50 text-pink-700', border: 'border-pink-100', shadow: 'shadow-pink-900/5' },
    { label: 'Pending Approvals', value: stats?.pending_approvals || 0, icon: Clock, color: 'bg-red-50 text-red-700', border: 'border-red-100', shadow: 'shadow-red-900/5' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-stone-500 font-medium lowercase">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-900 text-white border-none px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20">
            System Live
          </Badge>
        </div>
      </div>

      {/* High-Fidelity Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="border-stone-200 overflow-hidden rounded-2xl">
              <CardContent className="p-8">
                <Skeleton className="h-12 w-12 rounded-xl mb-6" />
                <Skeleton className="h-10 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat, index) => (
            <Card key={index} className={`bg-white border ${stat.border} hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group cursor-default rounded-2xl ${stat.shadow}`}>
              <CardContent className="p-8">
                <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-stone-900 tracking-tighter">{stat.value.toLocaleString()}</p>
                </div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.15em] mt-2">{stat.label}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Authoritative Moderation Center */}
      <div className="grid lg:grid-cols-2 gap-10">
        <Card className="border-stone-200 shadow-xl shadow-stone-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-stone-50/80 border-b border-stone-100 py-5 px-8">
            <CardTitle className="flex items-center justify-between text-lg font-bold">
              <span className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-900" />
                Pending Profiles
              </span>
              <Badge variant="secondary" className="bg-stone-900 text-white font-black px-3 py-1 rounded-full text-xs">
                {pending.profiles?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {pendingLoading ? (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : pending.profiles?.length === 0 ? (
              <div className="text-center py-16 bg-stone-50/50 rounded-3xl border-2 border-dashed border-stone-200">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-stone-300" />
                </div>
                <p className="text-stone-400 font-bold text-sm uppercase tracking-widest leading-loose">No pending profiles</p>
              </div>
            ) : (
              <div className="space-y-5 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
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

        <Card className="border-stone-200 shadow-xl shadow-stone-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-stone-50/80 border-b border-stone-100 py-5 px-8">
            <CardTitle className="flex items-center justify-between text-lg font-bold">
              <span className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-emerald-900" />
                Pending Listings
              </span>
              <Badge variant="secondary" className="bg-stone-900 text-white font-black px-3 py-1 rounded-full text-xs">
                {pending.listings?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {pendingLoading ? (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : pending.listings?.length === 0 ? (
              <div className="text-center py-16 bg-stone-50/50 rounded-3xl border-2 border-dashed border-stone-200">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-stone-300" />
                </div>
                <p className="text-stone-400 font-bold text-sm uppercase tracking-widest leading-loose">No pending listings</p>
              </div>
            ) : (
              <div className="space-y-5 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
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

      {/* High-Fidelity Quick Actions Hub */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-stone-900 uppercase tracking-[0.2em] px-2 border-l-4 border-emerald-900">
                Quick Actions
            </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/admin/content-editor?type=blog">
                <Button className="w-full bg-emerald-900 text-white hover:bg-emerald-950 font-bold h-12 shadow-md rounded-xl">
                    <FileText className="w-4 h-4 mr-2" />
                    New Blog Post
                </Button>
            </Link>
            <Link href="/admin/content-editor?type=entrepreneurs">
                <Button variant="outline" className="w-full border-stone-200 text-stone-900 hover:bg-stone-50 font-bold h-12 rounded-xl">
                    <Users className="w-4 h-4 mr-2" />
                    New Entrepreneur
                </Button>
            </Link>
            <Link href="/admin/content-editor?type=directory">
                <Button variant="outline" className="w-full border-stone-200 text-stone-900 hover:bg-stone-50 font-bold h-12 rounded-xl">
                    <Building2 className="w-4 h-4 mr-2" />
                    New Directory
                </Button>
            </Link>
            <Link href="/admin/content-editor?type=knowledge">
                <Button variant="outline" className="w-full border-stone-200 text-stone-900 hover:bg-stone-50 font-bold h-12 rounded-xl">
                    <BookOpen className="w-4 h-4 mr-2" />
                    New Resource
                </Button>
            </Link>
            <Link href="/admin/settings">
                <Button variant="outline" className="w-full border-stone-200 text-stone-900 hover:bg-stone-50 font-bold h-12 rounded-xl">
                    <Settings className="w-4 h-4 mr-2" />
                    Site Settings
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}

    </div>
  );
}
