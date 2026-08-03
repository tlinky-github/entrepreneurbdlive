import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuth, AuthProvider } from '../../lib/auth';

// Import admin components
import AdminLayout, { AdminDashboard } from './AdminLayout';
import AdminAuthors from './AdminAuthors';
import AdminPosts from './AdminPosts';
import AdminEntrepreneurs from './AdminEntrepreneurs';
import AdminDirectory from './AdminDirectory';
import AdminResources from './AdminResources';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';
import AISettings from './AISettings';
import AdminLLMSettings from './AdminLLMSettings';
import AdminPages from './AdminPages';
import AdminAnalytics from './AdminAnalytics';
import AdminContentManager from './AdminContentManager';
import ContentEditorPanel from './ContentEditorPanel';
import AdminTaxonomies from './AdminTaxonomies';
import AdminMedia from './AdminMedia';
import AdminKnowledgeHub from './AdminKnowledgeHub';
import AdminReports from './AdminReports';
import AdminSubmissions from './AdminSubmissions';
import AdminContactMessages from './AdminContactMessages';
import AdminTrafficCenter from './AdminTrafficCenter';
import AdminImport from './AdminImport';
import TestEditor from './TestEditor';

const PageEditor = () => (
  <div className="p-8 bg-white rounded-lg border border-stone-200">
    <h1 className="text-2xl font-bold mb-4">Page Editor</h1>
    <p className="text-stone-500">Page editor coming soon...</p>
  </div>
);

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  if (!isAdmin) {
    window.location.href = '/';
    return null;
  }

  return children;
};

const router = createBrowserRouter([
  {
    path: "/admin",
    element: (
      <ProtectedAdminRoute>
        <AdminLayout />
      </ProtectedAdminRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "content-manager", element: <AdminContentManager /> },
      { path: "content-editor", element: <ContentEditorPanel /> },
      { path: "test-editor", element: <TestEditor /> },
      { path: "posts", element: <AdminPosts /> },
      { path: "authors", element: <AdminAuthors /> },
      { path: "posts/new", element: <ContentEditorPanel /> },
      { path: "posts/:id/edit", element: <ContentEditorPanel /> },
      { path: "entrepreneurs", element: <AdminEntrepreneurs /> },
      { path: "directory", element: <AdminDirectory /> },
      { path: "resources", element: <AdminResources /> },
      { path: "resources/new", element: <ContentEditorPanel /> },
      { path: "resources/:id/edit", element: <ContentEditorPanel /> },
      { path: "media", element: <AdminMedia /> },
      { path: "traffic-center", element: <AdminTrafficCenter /> },
      { path: "users", element: <AdminUsers /> },
      { path: "taxonomies", element: <AdminTaxonomies /> },
      { path: "knowledge-hub", element: <AdminKnowledgeHub /> },
      { path: "pages", element: <AdminPages /> },
      { path: "pages/new", element: <PageEditor /> },
      { path: "pages/:id/edit", element: <PageEditor /> },
      { path: "settings", element: <AdminSettings /> },
      { path: "llm-settings", element: <AdminLLMSettings /> },
      { path: "ai-settings", element: <AISettings /> },
      { path: "analytics", element: <AdminAnalytics /> },
      { path: "submissions", element: <AdminSubmissions /> },
      { path: "contact-messages", element: <AdminContactMessages /> },
      { path: "reports", element: <AdminReports /> },
      { path: "import", element: <AdminImport /> }
    ]
  }
]);

export default function AdminApp() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
