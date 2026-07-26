import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { db } from '../../lib/firebase';
import publicAPI from '../../lib/publicApi';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  User, Building2, FileText, Sparkles, Plus, CheckCircle2, 
  Clock, LogOut, ShieldCheck, ArrowRight, LayoutDashboard, 
  Globe, Star, Lock, Mail, ExternalLink, X, Loader2
} from 'lucide-react';

const UserDashboard = () => {
  const { user, isAuthenticated, loading, logout, loginWithGoogle } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Story / Article Submission Modal State
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [submittingStory, setSubmittingStory] = useState(false);
  const [storySuccess, setStorySuccess] = useState(false);
  const [storyData, setStoryData] = useState({
    title: '',
    author_name: '',
    category: '',
    excerpt: '',
    content: '',
    featured_image: '',
    contact_email: '',
    contact_phone: ''
  });

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      fetchUserSubmissions();
    }
  }, [isAuthenticated, user]);

  const handleStorySubmit = async (e) => {
    e.preventDefault();
    if (!storyData.title || !storyData.content) return;
    setSubmittingStory(true);
    try {
      // 1. Primary: Submit via server Admin SDK — bypasses Firestore client rules
      await publicAPI.submitArticle({
        title: storyData.title,
        author_name: storyData.author_name || user?.name || '',
        category: storyData.category || '',
        excerpt: storyData.excerpt || '',
        content: storyData.content || '',
        featured_image: storyData.featured_image || '',
        contact_email: storyData.contact_email || user?.email || '',
        contact_phone: storyData.contact_phone || '',
        email: user?.email,
        type: 'post',
        status: 'pending',
        source: 'dashboard'
      });

      // 2. Also attempt client addDoc as fallback (silent if rules block it)
      try {
        await addDoc(collection(db, 'submissions'), {
          title: storyData.title,
          author_name: storyData.author_name || user?.name || '',
          category: storyData.category || '',
          excerpt: storyData.excerpt || '',
          content: storyData.content || '',
          featured_image: storyData.featured_image || '',
          contact_email: storyData.contact_email || user?.email || '',
          contact_phone: storyData.contact_phone || '',
          email: user?.email,
          type: 'post',
          status: 'pending',
          source: 'dashboard',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (clientErr) {
        console.warn('Client-side addDoc skipped (handled by server API):', clientErr.message);
      }

      setStorySuccess(true);
      fetchUserSubmissions();
      setStoryData({
        title: '',
        author_name: '',
        category: '',
        excerpt: '',
        content: '',
        featured_image: '',
        contact_email: '',
        contact_phone: ''
      });
    } catch (err) {
      console.error('Error submitting story:', err);
    } finally {
      setSubmittingStory(false);
    }
  };


  const fetchUserSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      // Always use server Admin SDK — client SDK is blocked by Firestore rules
      const serverRes = await publicAPI.getUserSubmissions(user.email);
      setSubmissions(serverRes?.data || []);
    } catch (err) {
      console.warn('Could not fetch submissions:', err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-900 border-t-transparent"></div>
          <p className="text-sm font-medium text-stone-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Guest / Unauthenticated State
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-stone-50/50 py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-8 text-center shadow-xl shadow-stone-200/50">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Access Dashboard</h2>
          <p className="text-stone-600 text-sm mb-8 leading-relaxed">
            Please sign in to view your account, manage your submitted business listings, and track your entrepreneur profile.
          </p>
          <button
            onClick={() => loginWithGoogle()}
            className="w-full inline-flex items-center justify-center gap-3 bg-emerald-900 hover:bg-emerald-950 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <User className="w-5 h-5" />
            Sign In with Google
          </button>
          <div className="mt-6 pt-6 border-t border-stone-100 flex items-center justify-center gap-4 text-sm text-stone-500">
            <a href="/login" className="hover:text-emerald-900 font-medium transition-colors">Go to Login Page</a>
            <span>•</span>
            <a href="/" className="hover:text-emerald-900 font-medium transition-colors">Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-stone-50/40 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {user?.photoURL && !imgError ? (
                <img 
                  src={user.photoURL} 
                  alt="" 
                  onError={() => setImgError(true)} 
                  className="w-16 h-16 rounded-full border-2 border-white/30 shadow-md object-cover flex-shrink-0" 
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-800 border-2 border-white/30 shadow-md flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, {user?.name}!</h1>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    isAdmin 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {isAdmin ? 'Platform Admin' : 'Registered Member'}
                  </span>
                </div>
                <p className="text-emerald-200/80 text-sm mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {isAdmin && (
                <a
                  href="/admin"
                  className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-2.5 px-5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Panel
                </a>
              )}
              <button
                onClick={() => logout()}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* BIG FUNNY NOTICE BOARD */}
        <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-1 shadow-xl hover:shadow-2xl transition-all overflow-hidden group">
          <div className="bg-stone-900 rounded-[22px] p-6 sm:p-10 relative overflow-hidden text-center flex flex-col items-center justify-center gap-6">
            
            {/* Background Glow & Pattern */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 max-w-3xl relative z-10 mx-auto text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-inner">
                <span className="animate-pulse">📢</span>
                <span>জরুরী অবগতির জন্য জানানো যাচ্ছে</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight text-center">
                আজ আপনার কোনো কাজ নাই, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                  পকেটে টাকা থাকলে ঘুরে আসুন! 🌴✈️
                </span>
              </h2>

              <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl text-center">
                আজকে কাজের সব চাপ স্থগিত ঘোষণা করা হলো। পকেটের ব্যালেন্স চেক করুন, এক কাপ গরম কফি খান আর কক্সবাজার বা বান্দরবান ঘুরতে চলে যান! ☕💸
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center gap-2 shrink-0 text-center">
              <div className="inline-flex flex-col items-center gap-1 bg-amber-400/20 border border-amber-400/30 text-amber-300 font-extrabold py-3.5 px-7 rounded-2xl text-sm sm:text-base shadow-inner">
                <div className="flex items-center gap-2">
                  <span>🎒</span>
                  <span>ঘুরতে বের হওয়ার আদর্শ সময়</span>
                </div>
                <span className="text-xs text-amber-200/80 font-normal tracking-wide mt-0.5">
                  * সিইও কর্তৃক অনুমোদিত নোটিশ 🤫
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Account Role</span>
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-xl font-bold text-stone-900 capitalize">{user?.role || 'Member'}</p>
            <p className="text-xs text-stone-500 mt-1">Verified Account</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Submissions</span>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-stone-900">{submissions.length}</p>
            <p className="text-xs text-stone-500 mt-1">Submitted Forms</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Directory</span>
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-xl font-bold text-stone-900">
              {submissions.filter(s => s.type === 'directory' || s.listing_type).length}
            </p>
            <p className="text-xs text-stone-500 mt-1">Listings Created</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Profiles</span>
              <User className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xl font-bold text-stone-900">
              {submissions.filter(s => s.type === 'entrepreneur' || s.designation).length}
            </p>
            <p className="text-xs text-stone-500 mt-1">Entrepreneur Profiles</p>
          </div>
        </div>

        {/* Core Actions Grid */}
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-800" />
            Dashboard Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Submit Entrepreneur Profile */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-1">Entrepreneur Profile</h3>
                <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                  Submit or update your personal founder bio, leadership achievements, and industry expertise.
                </p>
              </div>
              <a
                href="/submit?type=entrepreneur"
                className="inline-flex items-center justify-between text-sm font-semibold text-emerald-900 group-hover:text-emerald-950 pt-4 border-t border-stone-100"
              >
                <span>Submit Profile</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Business Directory Listing */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-1">Business Directory</h3>
                <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                  Add your startup or company to Bangladesh's primary business ecosystem directory.
                </p>
              </div>
              <a
                href="/submit?type=directory"
                className="inline-flex items-center justify-between text-sm font-semibold text-blue-700 group-hover:text-blue-800 pt-4 border-t border-stone-100"
              >
                <span>Add Business Listing</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Community Content & Knowledge */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-1">Articles & Insights</h3>
                <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                  Share educational guides, startup insights, or thought leadership with our audience.
                </p>
              </div>
              <button
                onClick={() => {
                  setStorySuccess(false);
                  setStoryModalOpen(true);
                }}
                className="inline-flex items-center justify-between text-sm font-semibold text-amber-700 group-hover:text-amber-800 pt-4 border-t border-stone-100 w-full text-left cursor-pointer"
              >
                <span>Contribute Story</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Admin Portal Shortcut (Admin Only) */}
            {isAdmin && (
              <div className="bg-gradient-to-br from-stone-900 to-emerald-950 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 bg-white/10 text-amber-400 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">AI Post Generator</h3>
                  <p className="text-sm text-stone-300 mb-6 leading-relaxed">
                    Generate automated blog posts, articles, and SEO metadata using OpenAI, Claude, or Gemini.
                  </p>
                </div>
                <a
                  href="/admin"
                  className="inline-flex items-center justify-between text-sm font-bold text-amber-400 hover:text-amber-300 pt-4 border-t border-white/10"
                >
                  <span>Open AI Generator</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            )}

            {/* Explore Directory */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 bg-stone-100 text-stone-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-1">Browse Directory</h3>
                <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                  Explore thousands of verified Bangladeshi entrepreneurs, companies, and knowledge items.
                </p>
              </div>
              <a
                href="/directory"
                className="inline-flex items-center justify-between text-sm font-semibold text-stone-700 group-hover:text-stone-900 pt-4 border-t border-stone-100"
              >
                <span>Explore Directory</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Knowledge Hub */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Star className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-1">Knowledge Hub</h3>
                <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                  Access startup tools, guides, legal templates, and business scaling frameworks.
                </p>
              </div>
              <a
                href="/knowledge"
                className="inline-flex items-center justify-between text-sm font-semibold text-emerald-800 group-hover:text-emerald-900 pt-4 border-t border-stone-100"
              >
                <span>View Knowledge Hub</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Recent Submissions Section */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Your Submissions</h2>
              <p className="text-sm text-stone-500">Track status of your submitted profiles and directory listings</p>
            </div>
            <a
              href="/submit"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 hover:text-emerald-950"
            >
              <Plus className="w-4 h-4" />
              New Submission
            </a>
          </div>

          {loadingSubmissions ? (
            <div className="py-12 text-center text-stone-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-900 border-t-transparent mx-auto mb-2" />
              <p className="text-sm">Loading your submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-12 text-center bg-stone-50/60 rounded-2xl border border-dashed border-stone-200">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800">No Submissions Yet</h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-6">
                You haven't submitted any entrepreneur profiles or business directory listings under <span className="font-semibold text-stone-700">{user.email}</span> yet.
              </p>
              <a
                href="/submit"
                className="inline-flex items-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white font-medium text-sm py-2.5 px-5 rounded-xl shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                Submit Now
              </a>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {submissions.map((sub) => (
                <div key={sub.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 font-bold">
                      {sub.type === 'directory' ? (
                        <Building2 className="w-5 h-5 text-blue-600" />
                      ) : sub.type === 'post' || sub.type === 'article' ? (
                        <FileText className="w-5 h-5 text-amber-600" />
                      ) : (
                        <User className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900 text-sm">{sub.title || sub.business_name || sub.full_name || 'Submission'}</h4>
                      <p className="text-xs text-stone-400 capitalize">{sub.type || 'Submission'} • {sub.createdAt ? new Date(sub.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                    sub.status === 'approved' || sub.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sub.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {sub.status === 'approved' || sub.status === 'published' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span className="capitalize">{sub.status || 'Pending'}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Story / Article Submission Modal */}
        {storyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 p-6 sm:p-8 shadow-2xl relative my-8">
              <button 
                onClick={() => setStoryModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {storySuccess ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900">Story Submitted for Review!</h3>
                  <p className="text-stone-600 text-sm max-w-md mx-auto">
                    Thank you for sharing your insights. Your story has been submitted to our editorial team for review and will appear in your dashboard status list below.
                  </p>
                  <button
                    onClick={() => setStoryModalOpen(false)}
                    className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold py-2.5 px-6 rounded-xl transition-colors mt-4 text-sm"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">Contribute Story / Article</h3>
                      <p className="text-xs text-stone-500">Share your startup lessons and guides with the community</p>
                    </div>
                  </div>

                  <form onSubmit={handleStorySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Article Title *</label>
                      <input 
                        type="text"
                        placeholder="Enter a descriptive article title"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                        value={storyData.title}
                        onChange={(e) => setStoryData({...storyData, title: e.target.value})}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Author Name</label>
                        <input 
                          type="text"
                          placeholder="Enter author or pen name"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                          value={storyData.author_name}
                          onChange={(e) => setStoryData({...storyData, author_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Private Contact Email</label>
                        <input 
                          type="email"
                          placeholder="name@example.com"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                          value={storyData.contact_email}
                          onChange={(e) => setStoryData({...storyData, contact_email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Short Excerpt / Summary</label>
                      <textarea 
                        rows={2}
                        placeholder="Provide a brief 2-3 sentence overview of your article..."
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                        value={storyData.excerpt}
                        onChange={(e) => setStoryData({...storyData, excerpt: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Article Story & Content / Doc Link *</label>
                      <textarea 
                        rows={5}
                        placeholder="Write your article story here, or paste a link to a public Google Doc..."
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                        value={storyData.content}
                        onChange={(e) => setStoryData({...storyData, content: e.target.value})}
                        required
                      />
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setStoryModalOpen(false)}
                        className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingStory}
                        className="px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-bold shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        {submittingStory ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Story'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserDashboard;
