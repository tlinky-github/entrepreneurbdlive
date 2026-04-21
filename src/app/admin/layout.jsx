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
    { href: '/admin/traffic', label: 'Redirects', icon: ArrowRightLeft },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/ai-generator', label: '✨ AI Generator', icon: TrendingUp },
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <span className="font-bold text-stone-900">Admin Citadel</span>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
          {/* Logo Section */}
          <div className="p-6 border-b border-stone-100 bg-stone-50/30">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-11 h-11 bg-emerald-900 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 rotate-3 group-hover:rotate-0 transition-transform">
                <span className="text-white font-bold text-2xl">e</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-stone-900 tracking-tighter text-lg leading-none">Admin</span>
                <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest mt-1">entrepreneurs.bd</p>
              </div>
            </Link>
          </div>

          {/* Navigation Hub */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto font-sans custom-scrollbar">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive(item.href, item.exact)
                    ? 'bg-emerald-900 text-white shadow-xl shadow-emerald-900/30'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 transition-colors ${
                    isActive(item.href, item.exact) ? 'text-emerald-200' : 'text-stone-400 group-hover:text-emerald-700'
                }`} />
                <span className="flex-1">{item.label}</span>
                
                {item.label === 'Entrepreneurs' && stats?.pending_approvals > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white text-[9px] px-1.5 h-5 flex items-center justify-center border-none font-bold">
                    {stats.pending_approvals}
                  </Badge>
                )}
                
                {item.addType && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/admin/content-editor?type=${item.addType}`);
                    }}
                    className={`ml-1 p-1 rounded-md transition-all ${
                      isActive(item.href) ? 'hover:bg-emerald-800 text-emerald-200' : 'text-stone-300 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </Link>
            ))}
          </nav>

          {/* Super Admin Profile Hub */}
          <div className="p-4 border-t border-stone-100 bg-stone-50/50">
            <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-900 rounded-xl flex items-center justify-center shadow-md shadow-emerald-900/10">
                  <span className="text-white font-bold text-lg">{user?.name?.charAt(0) || 'K'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 truncate text-xs leading-tight">{user?.name || 'Khaled Mahmud'}</p>
                  <p className="text-[9px] text-emerald-700 uppercase tracking-widest font-black mt-0.5">{user?.role?.replace('_', ' ') || 'super admin'}</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout} 
                    className="h-8 w-8 p-0 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                    <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Link href="/">
                <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest h-8 border-stone-200 hover:bg-stone-50 hover:text-emerald-900 transition-all">
                  <Home className="w-3 h-3 mr-2" />
                  View Live Site
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </aside>

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
