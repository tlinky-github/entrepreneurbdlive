import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/layout/Layout';
import { Toaster } from './components/ui/sonner';
import './index.css';

// Public Pages
import Home from './pages/Home';
import BlogList from './pages/blog/BlogList';
import BlogDetail from './pages/blog/BlogDetail';
import EntrepreneurList from './pages/entrepreneurs/EntrepreneurList';
import EntrepreneurDetail from './pages/entrepreneurs/EntrepreneurDetail';
import DirectoryList from './pages/directory/DirectoryList';
import DirectoryDetail from './pages/directory/DirectoryDetail';
import ResourceList from './pages/resources/ResourceList';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Admin Pages
import AdminLayout, { AdminDashboard } from './pages/admin/AdminLayout';
import AdminPosts from './pages/admin/AdminPosts';
import PostEditor from './pages/admin/PostEditor';
import AdminEntrepreneurs from './pages/admin/AdminEntrepreneurs';
import AdminDirectory from './pages/admin/AdminDirectory';
import AdminResources from './pages/admin/AdminResources';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminPages from './pages/admin/AdminPages';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminContentManager from './pages/admin/AdminContentManager';
import ContentEditorPanel from './pages/admin/ContentEditorPanel';
import TestEditor from './pages/admin/TestEditor';

// Migrated Pages
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import DisclaimerPage from './pages/DisclaimerPage';
import EditorialPage from './pages/EditorialPage';
import KnowledgeHubPage from './pages/KnowledgeHubPage';
import KnowledgeArticlePage from './pages/KnowledgeArticlePage';
import GuidesPage from './pages/GuidesPage';
import FAQsPage from './pages/FAQsPage';
import GlossaryPage from './pages/GlossaryPage';

// Visual Editor
import VisualEditor from './pages/VisualEditor/VisualEditor';

// Protected Route Component
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

// Auth Layout (with toaster for notifications)
const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-stone-50">
    {children}
    <Toaster position="top-right" richColors />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/blog" element={<PublicLayout><BlogList /></PublicLayout>} />
      <Route path="/blog/:slug" element={<PublicLayout><BlogDetail /></PublicLayout>} />
      <Route path="/entrepreneurs" element={<PublicLayout><EntrepreneurList /></PublicLayout>} />
      <Route path="/entrepreneurs/:slug" element={<PublicLayout><EntrepreneurDetail /></PublicLayout>} />
      <Route path="/directory" element={<PublicLayout><DirectoryList /></PublicLayout>} />
      <Route path="/directory/:slug" element={<PublicLayout><DirectoryDetail /></PublicLayout>} />
      <Route path="/resources" element={<PublicLayout><ResourceList /></PublicLayout>} />

      {/* Auth Routes */}
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
      <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
      <Route path="/reset-password" element={<AuthLayout><ResetPassword /></AuthLayout>} />
      <Route path="/verify-email" element={<AuthLayout><VerifyEmail /></AuthLayout>} />

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
        <Route path="posts/new" element={<PostEditor />} />
        <Route path="posts/:id/edit" element={<PostEditor />} />
        <Route path="entrepreneurs" element={<AdminEntrepreneurs />} />
        <Route path="directory" element={<AdminDirectory />} />
        <Route path="resources" element={<AdminResources />} />
        <Route path="resources/new" element={<ResourceEditor />} />
        <Route path="resources/:id/edit" element={<ResourceEditor />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="pages" element={<AdminPages />} />
        <Route path="pages/new" element={<PageEditor />} />
        <Route path="pages/:id/edit" element={<PageEditor />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      {/* Visual Editor Route */}
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
  const api = require('./lib/api').default;

  React.useEffect(() => {
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
      <h1 className="text-4xl font-bold text-stone-900 mb-6">{page.title}</h1>
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content_html }}
      />
    </div>
  );
};

// Import React for DynamicPage
import React from 'react';



const TermsPage = () => (
  <div className="max-w-4xl mx-auto px-4 py-16">
    <h1 className="text-4xl font-bold text-stone-900 mb-6">Terms of Service</h1>
    <div className="prose prose-lg max-w-none">
      <p>By using entrepreneurs.bd, you agree to these terms and conditions.</p>
      <p>Last updated: December 2024</p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 text-center">
    <h1 className="text-6xl font-bold text-stone-900 mb-4">404</h1>
    <p className="text-xl text-stone-600 mb-8">Page not found</p>
    <a href="/" className="text-emerald-900 hover:text-emerald-700 font-medium">← Back to Home</a>
  </div>
);

import ScrollToTop from './components/common/ScrollToTop';

function App() {
  return (
    <Router>
      <HelmetProvider>
        <ScrollToTop />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </HelmetProvider>
    </Router>
  );
}

export default App;
