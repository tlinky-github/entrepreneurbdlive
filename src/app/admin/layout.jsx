'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AdminClientWrapper, useAdmin } from '@/components/admin/AdminClientWrapper';
import Link from '@/components/common/UniversalLink';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BookOpen,
  Settings,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Home,
  Tag,
  Plus,
  UserCircle,
  Image as ImageIcon,
  AlertTriangle,
  Inbox,
  ArrowRightLeft,
  TrendingUp
} from 'lucide-react';

const AdminShell = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { stats, loading } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/content-manager', label: 'Content Manager', icon: BookOpen },
    { href: '/admin/submissions', label: 'Submissions', icon: Inbox },
    { href: '/admin/knowledge-hub', label: 'Knowledge Hub', icon: BookOpen },
    { href: '/admin/posts', label: 'Blog Posts', icon: FileText, addType: 'blog' },
    { href: '/admin/authors', label: 'Authors', icon: UserCircle },
    { href: '/admin/entrepreneurs', label: 'Entrepreneurs', icon: Users, addType: 'entrepreneurs' },
    { href: '/admin/directory', label: 'Directory', icon: Building2, addType: 'directory' },
    { href: '/admin/taxonomies', label: 'Taxonomies', icon: Tag },
    { href: '/admin/media', label: 'Media', icon: ImageIcon },
    { href: '/admin/traffic-center', label: 'Redirects', icon: ArrowRightLeft },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/ai-settings', label: '✨ AI Generator', icon: TrendingUp },
    { href: '/admin/reports', label: 'Reports', icon: AlertTriangle },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path) && (path !== '/admin' || pathname === '/admin');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-emerald-900 rounded-2xl flex items-center justify-center animate-pulse shadow-2xl shadow-emerald-900/20">
            <span className="text-white font-bold text-3xl">e</span>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] animate-pulse">Identity Hub</p>
            <p className="text-sm font-bold text-stone-600">Authenticating Narrative...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <span className="font-semibold text-stone-900">Admin Dashboard</span>
          <Link href="/">
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
            <Link href="/admin" className="flex items-center gap-2">
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
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto font-sans">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href, item.exact)
                    ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.label === 'Entrepreneurs' && stats?.pending_approvals > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                    {stats.pending_approvals}
                  </Badge>
                )}
                {item.label === 'Submissions' && (stats?.pending_public_submissions > 0) && (
                  <Badge className="ml-auto bg-blue-500 text-white text-[10px] px-1.5 min-w-[18px] h-[18px] flex items-center justify-center animate-pulse">
                    {stats.pending_public_submissions}
                  </Badge>
                )}
                {item.addType && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/admin/content-editor?type=${item.addType}`);
                    }}
                    className={`ml-2 p-1 rounded-md hover:bg-stone-200 transition-colors ${
                      isActive(item.href) ? 'hover:bg-emerald-800 text-white' : 'text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-stone-200 bg-stone-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-emerald-900 font-bold">{user?.name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900 truncate text-sm">{user?.name}</p>
                <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  <Home className="w-3.5 h-3.5 mr-1.5" />
                  Site
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-stone-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default function AdminLayout({ children }) {
  return (
    <AdminClientWrapper>
      <AdminShell>
        {children}
      </AdminShell>
    </AdminClientWrapper>
  );
}
