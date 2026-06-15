import { useEffect } from 'react';
import { useAuth } from '../../lib/auth';

const UserDashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900 mb-4">Welcome, {user?.name}!</h1>
      <p className="text-stone-600 mb-8">Manage your profile and activities.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <h3 className="font-semibold text-stone-900 mb-2">Your Profile</h3>
          <p className="text-sm text-stone-600 mb-4">Create or update your entrepreneur profile</p>
          <a href="/submit" className="text-emerald-900 text-sm font-medium hover:underline">
            Manage Profile →
          </a>
        </div>
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <h3 className="font-semibold text-stone-900 mb-2">Your Listings</h3>
          <p className="text-sm text-stone-600 mb-4">Manage your business directory listings</p>
          <a href="/submit" className="text-emerald-900 text-sm font-medium hover:underline">
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

export default UserDashboard;
