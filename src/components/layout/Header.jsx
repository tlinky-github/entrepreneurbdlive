import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  BookOpen,
  Lightbulb,
  ChevronDown,
  Mail,
  PenTool,
  MessageCircle,
  Library
} from 'lucide-react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
    { href: '/editorial', label: 'Editorial', icon: PenTool },
    { href: '/contact', label: 'Contact', icon: Mail },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="header-logo">
            <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center group-hover:bg-emerald-800 transition-colors">
              <span className="text-white font-bold text-xl">e</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-stone-900">entrepreneurs</span>
              <span className="text-emerald-900 font-bold">.bd</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.children) {
                return (
                  <DropdownMenu key={link.label}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`px-4 py-2 text-sm font-medium transition-colors ${link.children.some(child => isActive(child.href))
                            ? 'bg-emerald-50 text-emerald-900'
                            : 'text-stone-600 hover:text-emerald-900 hover:bg-emerald-50'
                          }`}
                      >
                        <span className="flex items-center gap-1">
                          {link.label}
                          <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {link.children.map((child) => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link to={child.href} className="flex items-center gap-2 cursor-pointer">
                            <child.icon className="w-4 h-4 text-stone-500" />
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive(link.href)
                      ? 'bg-emerald-50 text-emerald-900'
                      : 'text-stone-600 hover:text-emerald-900 hover:bg-emerald-50'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
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
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-stone-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2" data-testid="admin-dashboard-link">
                          <LayoutDashboard className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2" data-testid="my-dashboard-link">
                      <User className="w-4 h-4" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-stone-600">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-emerald-900 text-white hover:bg-emerald-800">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              className="xl:hidden"
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
        <div className="xl:hidden border-t border-stone-200 bg-white animate-slide-down">
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              if (link.children) {
                const isExpanded = expandedMenu === link.label;
                return (
                  <div key={link.label} className="space-y-1">
                    <button
                      onClick={() => setExpandedMenu(isExpanded ? null : link.label)}
                      className="w-full px-4 py-3 text-sm font-medium text-stone-900 flex items-center gap-3 rounded-md hover:bg-stone-50 transition-colors"
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="pl-12 space-y-1">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setExpandedMenu(null);
                            }}
                            className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive(child.href)
                                ? 'text-emerald-900 bg-emerald-50'
                                : 'text-stone-600 hover:text-emerald-900'
                              }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${isActive(link.href)
                      ? 'bg-emerald-50 text-emerald-900'
                      : 'text-stone-600 hover:bg-stone-50'
                    }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
