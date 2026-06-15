import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '../lib/auth';
import { 
  Plus, 
  Edit3, 
  ChevronDown,
  ExternalLink,
  Settings,
  LayoutDashboard,
  LogOut
} from 'lucide-react';

const AdminToolbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const [contentInfo, setContentInfo] = useState({ id: null, type: null });
  const [imgError, setImgError] = useState(false);
  const [pathname, setPathname] = useState('');

  // Scan the page for content ID and type attributes
  useEffect(() => {
    setPathname(window.location.pathname);

    const checkContent = () => {
      const el = document.querySelector('[data-content-id]');
      if (el) {
        setContentInfo({
          id: el.getAttribute('data-content-id'),
          type: el.getAttribute('data-content-type')
        });
      } else {
        setContentInfo({ id: null, type: null });
      }
    };

    // Use a small delay to ensure React has finished rendering the content
    const timeout = setTimeout(checkContent, 100);

    const observer = new MutationObserver(() => {
      checkContent();
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  // Reset image error state when user changes
  useEffect(() => {
    setImgError(false);
  }, [user?.id]);

  if (!isAdmin) return null;
  // Don't show inside the admin area itself
  if (pathname.startsWith('/admin')) return null;

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getEditLink = () => {
    if (!contentInfo.id) return null;
    switch (contentInfo.type) {
      case 'post': return `/admin/content-editor?type=blog&id=${contentInfo.id}`;
      case 'entrepreneur': return `/admin/content-editor?type=entrepreneurs&id=${contentInfo.id}`;
      case 'directory': return `/admin/content-editor?type=directory&id=${contentInfo.id}`;
      case 'resource': return `/admin/content-editor?type=resources&id=${contentInfo.id}`;
      case 'knowledge': return `/admin/content-editor?type=knowledge&id=${contentInfo.id}`;
      case 'page': return `/admin/pages/${contentInfo.id}/edit`;
      default: return null;
    }
  };

  const editLink = getEditLink();

  return (
    <div className="bg-[#064e3b] text-[#ecfdf5] h-8 flex items-center px-4 text-[12px] font-medium sticky top-0 z-[1000] border-b border-emerald-800/50 font-sans select-none shadow-sm">
       <div className="flex items-center gap-5 w-full">
         <div className="flex items-center gap-2 pr-4 border-r border-emerald-800 h-8">
           <img src="/logo192.png" alt="" className="w-3.5 h-3.5 invert opacity-90" />
           <a href="/admin" className="hover:text-white transition-colors font-bold tracking-tight">Entrepreneur BD</a>
         </div>

         <div className="flex items-center gap-1 h-8">
           {editLink && (
             <a 
               href={editLink} 
               className="flex items-center gap-1.5 px-3 h-8 hover:bg-emerald-800 text-white transition-colors border-r border-emerald-800"
             >
               <Edit3 size={13} className="text-emerald-300" />
               Edit {contentInfo.type?.charAt(0).toUpperCase() + contentInfo.type?.slice(1)}
             </a>
           )}

           <div className="relative group h-8">
             <button className="flex items-center gap-1.5 px-3 h-8 hover:bg-emerald-800 transition-colors">
               <Plus size={13} className="text-emerald-300" />
               New
               <ChevronDown size={10} className="opacity-50" />
             </button>
             <div className="absolute top-8 left-0 hidden group-hover:block bg-[#064e3b] border border-emerald-800 rounded-b shadow-2xl min-w-[160px] py-1 z-[1001]">
               <a href="/admin/posts/new" className="block px-4 py-2 hover:bg-emerald-800 transition-colors">Blog Post</a>
               <a href="/admin/directory" className="block px-4 py-2 hover:bg-emerald-800 transition-colors">Directory Listing</a>
               <a href="/admin/resources/new" className="block px-4 py-2 hover:bg-emerald-800 transition-colors">Resource</a>
               <a href="/admin/knowledge-hub" className="block px-4 py-2 hover:bg-emerald-800 transition-colors">Knowledge Article</a>
               <div className="h-px bg-emerald-800 my-1" />
               <a href="/admin/users" className="block px-4 py-2 hover:bg-emerald-800 transition-colors">User</a>
             </div>
           </div>

           <a href="/admin/settings" className="flex items-center gap-1.5 px-3 h-8 hover:bg-emerald-800 transition-colors" title="Site Settings">
             <Settings size={13} className="text-emerald-300" />
           </a>
         </div>

         <div className="ml-auto flex items-center h-8">
           <div className="relative group h-8">
             <button className="flex items-center gap-3 px-3 h-8 hover:bg-emerald-800 transition-colors">
               <span className="text-emerald-200/70">Howdy, <span className="text-white font-semibold">{user?.name?.split(' ')[0] || 'Admin'}</span></span>
               <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-400/30 flex-shrink-0 bg-emerald-700">
                 {user?.photoURL && !imgError ? (
                   <img 
                    src={user.photoURL} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    onError={() => setImgError(true)}
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                     {(user?.name || 'A').charAt(0).toUpperCase()}
                   </div>
                 )}
               </div>
             </button>
             
             <div className="absolute top-8 right-0 hidden group-hover:block bg-[#064e3b] border border-emerald-800 rounded-b shadow-2xl min-w-[180px] py-1 z-[1001]">
               <div className="px-4 py-3 border-b border-emerald-800 mb-1">
                 <p className="text-white font-bold truncate">{user?.name || 'Administrator'}</p>
                 <p className="text-[10px] text-emerald-300/70 truncate">{user?.email}</p>
               </div>
               <a href="/admin" className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-800 transition-colors text-white">
                 <LayoutDashboard size={13} className="text-emerald-300" />
                 Admin Dashboard
               </a>
               <a href="/admin/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-800 transition-colors text-white">
                 <Settings size={13} className="text-emerald-300" />
                 Edit Profile
               </a>
               <div className="h-px bg-emerald-800 my-1" />
               <button 
                 onClick={handleLogout} 
                 className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-900 transition-colors text-red-200 text-left"
               >
                 <LogOut size={13} />
                 Log Out
               </button>
             </div>
           </div>
         </div>
       </div>
    </div>
  );
};

export default function AdminToolbarWithAuth() {
  return (
    <AuthProvider>
      <AdminToolbar />
    </AuthProvider>
  );
}
