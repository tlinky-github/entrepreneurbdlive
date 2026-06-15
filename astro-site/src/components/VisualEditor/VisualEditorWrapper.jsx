import React, { useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import VisualEditor from './VisualEditor';

export default function VisualEditorWrapper() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        window.location.href = '/login';
      } else if (!isAdmin) {
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, isAdmin, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-900"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) return null;

  return <VisualEditor />;
}
