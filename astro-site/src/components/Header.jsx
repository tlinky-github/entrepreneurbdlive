// Header component — runs as a React island (client:load) for interactivity
// This is the SAME Header from the React CRA project, adapted to use <a> tags instead of react-router <Link>
import { useState } from 'react';
import {
  Menu, X, FileText, Building2, Users, BookOpen,
  ChevronDown, MessageCircle, Library, Plus
} from 'lucide-react';

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

export default function Header({ currentPath = '/' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  const isActive = (path) => currentPath.startsWith(path);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center group-hover:bg-emerald-800 transition-colors">
              <span className="text-white font-bold text-xl">e</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-stone-900">entrepreneurs</span>
              <span className="text-emerald-900 font-bold">.bd</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.children) {
                const isDropdownActive = link.children.some(child => isActive(child.href));
                return (
                  <div key={link.label} className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                      onBlur={() => setTimeout(() => setOpenDropdown(null), 150)}
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
              <button className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-900/20 text-emerald-900 rounded-md text-sm font-medium hover:bg-emerald-50 transition-colors">
                <Plus className="w-4 h-4" />
                Get Listed
              </button>
            </a>

            {/* Mobile menu button */}
            <button
              className="xl:hidden p-2 rounded-md text-stone-600 hover:bg-stone-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
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
