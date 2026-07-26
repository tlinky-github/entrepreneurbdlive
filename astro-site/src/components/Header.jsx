// Header component — runs as a React island (client:load) for interactivity
// This is the SAME Header from the React CRA project, adapted to use <a> tags instead of react-router <Link>
import { useState, useEffect } from 'react';
import {
  Menu, X, FileText, Building2, Users, BookOpen,
  ChevronDown, MessageCircle, Library, Plus, LayoutDashboard, User, LogOut
} from 'lucide-react';
import { useAuth, AuthProvider } from '../lib/auth';
import { settingsAPI } from '../lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

const navLinks = [
  { href: '/blog', label: 'Blog', icon: FileText },
  { href: '/entrepreneurs', label: 'Entrepreneurs', icon: Users },
  { href: '/directory', label: 'Directory', icon: Building2 },
  { href: '/knowledge', label: 'Knowledge Hub', icon: Library },
  {
    label: 'Tools & Guides',
    icon: BookOpen,
    children: [
      { href: '/resources/guides', label: 'Guides', icon: BookOpen },
      { href: '/resources/faqs', label: 'FAQs', icon: MessageCircle },
      { href: '/resources/glossary', label: 'Glossary', icon: FileText },
    ]
  },
];

function HeaderContent({ currentPath = '/', initialSiteSettings = null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [siteSettings, setSiteSettings] = useState(initialSiteSettings);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (!initialSiteSettings) {
      settingsAPI.get().then(res => {
        if (res?.data) setSiteSettings(res.data);
      }).catch(() => {});
    }
  }, [initialSiteSettings]);

  const isActive = (path) => currentPath.startsWith(path);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className={`sticky ${isAdmin ? 'top-8' : 'top-0'} z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/50 transition-all`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            {siteSettings?.logo_url ? (
              <img src={siteSettings.logo_url} alt={siteSettings.site_name || 'Site Logo'} className="h-9 object-contain" />
            ) : siteSettings?.site_name ? (
              <>
                <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center group-hover:bg-emerald-800 transition-colors">
                  <span className="text-white font-bold text-xl">
                    {siteSettings.site_name.charAt(0).toLowerCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-lg text-stone-900">
                    {siteSettings.site_name}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-900/10 animate-pulse rounded-lg flex items-center justify-center">
                  <span className="text-emerald-900 font-bold text-lg">e</span>
                </div>
                <div className="w-32 h-5 bg-stone-200 animate-pulse rounded hidden sm:block"></div>
              </div>
            )}
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.children) {
                const isDropdownActive = link.children.some(child => isActive(child.href));
                return (
                  <div 
                    key={link.label} 
                    className="relative group"
                    onMouseEnter={() => setOpenDropdown(link.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                        isDropdownActive
                          ? 'bg-emerald-50 text-emerald-900'
                          : 'text-stone-600 hover:text-emerald-900 hover:bg-emerald-50'
                      }`}
                    >
                      {link.label}
                      <ChevronDown className={`w-4 h-4 ml-1 opacity-50 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === link.label && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-stone-200 py-1 z-50">
                        {link.children.map((child) => {
                          const Icon = child.icon;
                          return (
                            <a
                              key={child.href}
                              href={child.href}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-emerald-900"
                            >
                              <Icon className="w-4 h-4 text-stone-500" />
                              {child.label}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-emerald-50 text-emerald-900'
                      : 'text-stone-600 hover:text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a href="/submit" className="hidden lg:block">
              <Button variant="outline" className="border-emerald-900/20 text-emerald-900 hover:bg-emerald-50 gap-2">
                <Plus className="w-4 h-4" />
                Get Listed
              </Button>
            </a>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-trigger">
                    <div className="w-8 h-8 bg-emerald-900 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-stone-700">
                      {user?.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-stone-200 shadow-md">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-stone-900">{user?.name}</p>
                    <p className="text-sm text-stone-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-stone-200" />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <a href="/admin" className="flex items-center gap-2 text-stone-700 hover:bg-stone-50 hover:text-stone-900 cursor-pointer" data-testid="admin-dashboard-link">
                          <LayoutDashboard className="w-4 h-4" />
                          Admin Dashboard
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-stone-200" />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <a href="/dashboard" className="flex items-center gap-2 text-stone-700 hover:bg-stone-50 hover:text-stone-900 cursor-pointer" data-testid="my-dashboard-link">
                      <User className="w-4 h-4" />
                      My Dashboard
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-stone-200" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <a href="/login">
                  <Button variant="ghost" className="text-stone-600 hover:text-emerald-900 hover:bg-emerald-50">
                    Login
                  </Button>
                </a>
                <a href="/register">
                  <Button className="bg-emerald-900 text-white hover:bg-emerald-800">
                    Get Started
                  </Button>
                </a>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="xl:hidden p-2 rounded-md text-stone-600 hover:bg-stone-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-stone-200 bg-white">
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              if (link.children) {
                const isExpanded = expandedMenu === link.label;
                const Icon = link.icon;
                return (
                  <div key={link.label} className="space-y-1">
                    <button
                      onClick={() => setExpandedMenu(isExpanded ? null : link.label)}
                      className="w-full px-4 py-3 text-sm font-medium text-stone-900 flex items-center gap-3 rounded-md hover:bg-stone-50 transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      {link.label}
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="pl-12 space-y-1">
                        {link.children.map((child) => (
                          <a
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              isActive(child.href)
                                ? 'text-emerald-900 bg-emerald-50'
                                : 'text-stone-600 hover:text-emerald-900'
                            }`}
                          >
                            {child.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-emerald-50 text-emerald-900'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </a>
              );
            })}
            <div className="pt-4 border-t border-stone-100">
              <a
                href="/submit"
                className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-semibold bg-emerald-900 text-white"
              >
                <Plus className="w-5 h-5" />
                Get Listed
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default function Header(props) {
  return (
    <AuthProvider>
      <HeaderContent {...props} />
    </AuthProvider>
  );
}
