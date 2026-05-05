import React, { lazy, Suspense } from 'react';

// --- LAZY-LOADED PUBLIC PAGES ---
const Home = lazy(() => import('./pages/Home'));
const BlogList = lazy(() => import('./pages/blog/BlogList'));
const BlogDetail = lazy(() => import('./pages/blog/BlogDetail'));
const EntrepreneurList = lazy(() => import('./pages/entrepreneurs/EntrepreneurList'));
const EntrepreneurDetail = lazy(() => import('./pages/entrepreneurs/EntrepreneurDetail'));
const DirectoryList = lazy(() => import('./pages/directory/DirectoryList'));
const DirectoryDetail = lazy(() => import('./pages/directory/DirectoryDetail'));
const ResourceList = lazy(() => import('./pages/resources/ResourceList'));
const ResourceDetail = lazy(() => import('./pages/resources/ResourceDetail'));
const AuthorDetail = lazy(() => import('./pages/AuthorDetail'));
const SubmissionPage = lazy(() => import('./pages/submit/SubmissionPage'));
const SubmissionSuccess = lazy(() => import('./pages/submit/SubmissionSuccess'));

// --- LAZY-LOADED AUTH PAGES ---
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

// --- LAZY-LOADED ADMIN PAGES ---
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminDashboard })));
const AdminAuthors = lazy(() => import('./pages/admin/AdminAuthors'));
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts'));
const AdminEntrepreneurs = lazy(() => import('./pages/admin/AdminEntrepreneurs'));
const AdminDirectory = lazy(() => import('./pages/admin/AdminDirectory'));
const AdminResources = lazy(() => import('./pages/admin/AdminResources'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AISettings = lazy(() => import('./pages/admin/AISettings'));
const AdminPages = lazy(() => import('./pages/admin/AdminPages'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminContentManager = lazy(() => import('./pages/admin/AdminContentManager'));
const ContentEditorPanel = lazy(() => import('./pages/admin/ContentEditorPanel'));
const AdminTaxonomies = lazy(() => import('./pages/admin/AdminTaxonomies'));
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'));
const AdminKnowledgeHub = lazy(() => import('./pages/admin/AdminKnowledgeHub'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSubmissions = lazy(() => import('./pages/admin/AdminSubmissions'));
const AdminTrafficCenter = lazy(() => import('./pages/admin/AdminTrafficCenter'));
const TestEditor = lazy(() => import('./pages/admin/TestEditor'));

// --- LAZY-LOADED STATIC & MIGRATED PAGES ---
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));
const EditorialPage = lazy(() => import('./pages/EditorialPage'));
const KnowledgeHubPage = lazy(() => import('./pages/KnowledgeHubPage'));
const KnowledgeArticlePage = lazy(() => import('./pages/KnowledgeArticlePage'));
const GuidesPage = lazy(() => import('./pages/GuidesPage'));
const FAQsPage = lazy(() => import('./pages/FAQsPage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));
const VisualEditor = lazy(() => import('./pages/VisualEditor/VisualEditor'));

import { createBrowserRouter, RouterProvider, createRoutesFromElements, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/layout/Layout';
import { Toaster } from './components/ui/sonner';
import './index.css';
import { sanitizeHtml } from './lib/utils';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Layout Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-stone-900 mb-2">Something went wrong</h1>
            <p className="text-stone-600 mb-6">The application encountered an unexpected error. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-emerald-900 text-white rounded-md hover:bg-emerald-800 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Layout Wrapper
const PublicLayout = ({ children }) => (
  <Layout>{children}</Layout>
);

// Auth Layout (notifications moved to global level)
const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-stone-50">
    {children}
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-900"></div>
          <p className="text-stone-500 font-medium animate-pulse">Loading experience...</p>
        </div>
      </div>
    }>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/blog" element={<PublicLayout><BlogList /></PublicLayout>} />
      <Route path="/blog/:slug" element={<PublicLayout><BlogDetail /></PublicLayout>} />
      <Route path="/entrepreneurs" element={<PublicLayout><EntrepreneurList /></PublicLayout>} />
      <Route path="/entrepreneurs/:slug" element={<PublicLayout><EntrepreneurDetail /></PublicLayout>} />
      <Route path="/directory" element={<PublicLayout><DirectoryList /></PublicLayout>} />
      <Route path="/directory/:slug" element={<PublicLayout><DirectoryDetail /></PublicLayout>} />
      <Route path="/submit" element={<PublicLayout><SubmissionPage /></PublicLayout>} />
      <Route path="/submit/success" element={<PublicLayout><SubmissionSuccess /></PublicLayout>} />
      <Route path="/resources" element={<PublicLayout><ResourceList /></PublicLayout>} />
      <Route path="/resources/:slug" element={<PublicLayout><ResourceDetail /></PublicLayout>} />
      <Route path="/author/:slug" element={<PublicLayout><AuthorDetail /></PublicLayout>} />

      {/* Auth Routes */}
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
// Unused routes removed

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="content-manager" element={<AdminContentManager />} />
        <Route path="content-editor" element={<ContentEditorPanel />} />
        <Route path="test-editor" element={<TestEditor />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="authors" element={<AdminAuthors />} />
        <Route path="posts/new" element={<ContentEditorPanel />} />
        <Route path="posts/:id/edit" element={<ContentEditorPanel />} />
        <Route path="entrepreneurs" element={<AdminEntrepreneurs />} />
        <Route path="directory" element={<AdminDirectory />} />
        <Route path="resources" element={<AdminResources />} />
        <Route path="resources/new" element={<ContentEditorPanel />} />
        <Route path="resources/:id/edit" element={<ContentEditorPanel />} />
        <Route path="media" element={<AdminMedia />} />
        <Route path="traffic-center" element={<AdminTrafficCenter />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="taxonomies" element={<AdminTaxonomies />} />
        <Route path="knowledge-hub" element={<AdminKnowledgeHub />} />
        <Route path="pages" element={<AdminPages />} />
        <Route path="pages/new" element={<PageEditor />} />
        <Route path="pages/:id/edit" element={<PageEditor />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="ai-settings" element={<AISettings />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="submissions" element={<AdminSubmissions />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route
        path="/visual-editor"
        element={
          <ProtectedRoute adminOnly>
            <VisualEditor />
          </ProtectedRoute>
        }
      />

      {/* User Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <UserDashboard />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Dynamic Pages */}
      <Route path="/page/:slug" element={<PublicLayout><DynamicPage /></PublicLayout>} />

      {/* Static Pages */}
      {/* Knowledge Hub */}
      <Route path="/knowledge" element={<PublicLayout><KnowledgeHubPage /></PublicLayout>} />
      <Route path="/knowledge/:slug" element={<PublicLayout><KnowledgeArticlePage /></PublicLayout>} />

      {/* Editorial */}
      <Route path="/editorial" element={<PublicLayout><EditorialPage /></PublicLayout>} />

      {/* Specific Resources */}
      <Route path="/resources/guides" element={<PublicLayout><GuidesPage /></PublicLayout>} />
      <Route path="/resources/faqs" element={<PublicLayout><FAQsPage /></PublicLayout>} />
      <Route path="/resources/glossary" element={<PublicLayout><GlossaryPage /></PublicLayout>} />

      {/* Static Pages */}
      <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
      <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
      <Route path="/disclaimer" element={<PublicLayout><DisclaimerPage /></PublicLayout>} />
      <Route path="/terms" element={<PublicLayout><TermsPage /></PublicLayout>} />

      {/* 404 */}
      <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
    </Routes>
  </Suspense>
);
}

// Simple Resource Editor (placeholder)
const ResourceEditor = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Resource Editor</h1>
    <p className="text-stone-500">Resource editor coming soon...</p>
  </div>
);

// Simple Page Editor (placeholder)
const PageEditor = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Page Editor</h1>
    <p className="text-stone-500">Page editor coming soon...</p>
  </div>
);

// User Dashboard
const UserDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900 mb-4">Welcome, {user?.name}!</h1>
      <p className="text-stone-600 mb-8">Manage your profile and activities.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <h3 className="font-semibold text-stone-900 mb-2">Your Profile</h3>
          <p className="text-sm text-stone-600 mb-4">Create or update your entrepreneur profile</p>
          <a href="/entrepreneurs" className="text-emerald-900 text-sm font-medium hover:underline">
            Manage Profile →
          </a>
        </div>
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <h3 className="font-semibold text-stone-900 mb-2">Your Listings</h3>
          <p className="text-sm text-stone-600 mb-4">Manage your business directory listings</p>
          <a href="/directory" className="text-emerald-900 text-sm font-medium hover:underline">
            Manage Listings →
          </a>
        </div>
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <h3 className="font-semibold text-stone-900 mb-2">Account Settings</h3>
          <p className="text-sm text-stone-600 mb-4">Update your account information</p>
          <span className="text-stone-400 text-sm">Coming soon</span>
        </div>
      </div>
    </div>
  );
};

// Dynamic Page Component
const DynamicPage = () => {
  const [page, setPage] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const { slug } = require('react-router-dom').useParams();
  React.useEffect(() => {
    const api = require('./lib/api').default;
    const loadPage = async () => {
      try {
        const res = await api.get(`/pages/${slug}`);
        setPage(res.data);
      } catch (error) {
        console.error('Failed to load page:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-10 bg-stone-200 rounded w-1/2 mb-6"></div>
          <div className="h-4 bg-stone-200 rounded w-full mb-3"></div>
          <div className="h-4 bg-stone-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!page) {
    return <NotFound />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <SEO 
        title={page.seoTitle || page.title}
        description={page.metaDescription || page.content_html?.replace(/<[^>]+>/g, '').substring(0, 160)}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: page.title, path: `/page/${slug}` }
        ]}
      />
      <h1 className="text-4xl font-bold text-stone-900 mb-6">{page.title}</h1>
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content_html) }}
      />
    </div>
  );
};





const TermsPage = () => (
  <div className="max-w-4xl mx-auto px-4 py-16">
    <h1 className="text-4xl font-bold text-stone-900 mb-6">Terms of Service</h1>
    <div className="prose prose-lg max-w-none">
      <p>By using entrepreneurs.bd, you agree to these terms and conditions.</p>
      <p>Last updated: December 2024</p>
    </div>
  </div>
);

import NotFound from './components/common/NotFound';
import ScrollToTop from './components/common/ScrollToTop';

const URLCleaner = () => {
  const { pathname, search } = require('react-router-dom').useLocation();
  const navigate = require('react-router-dom').useNavigate();

  React.useEffect(() => {
    if (search.includes('no_bot=1')) {
      // Remove no_bot=1 and clean up ? or &
      const newSearch = search
        .replace(/[?&]no_bot=1/, '')
        .replace(/^&/, '?');
      
      const cleanUrl = pathname + newSearch;
      navigate(cleanUrl, { replace: true });
    }
  }, [pathname, search, navigate]);

  return null;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="*" element={
      <HelmetProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <URLCleaner />
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ErrorBoundary>
      </HelmetProvider>
    } />
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
