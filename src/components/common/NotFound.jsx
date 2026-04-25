import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PageLoader } from '../ui/page-loader';
import { collection, query, where, getDocs, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { deadLinkAPI } from '../../lib/api';

const NotFound = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    const checkRedirects = async () => {
      try {
        // Search for a matching redirect (case-insensitive usually handled by normalization)
        const path = pathname.replace(/\/$/, '') || '/';
        const q = query(
          collection(db, 'redirects'), 
          where('fromPath', '==', path), 
          where('status', '==', 'active'),
          limit(1)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const data = snap.docs[0].data();
          // Hit Tracking
          updateDoc(doc(db, 'redirects', snap.docs[0].id), {
            hit_count: increment(1),
            last_hit: new Date()
          }).catch(() => {});
          
          navigate(data.toPath, { replace: true });
          return;
        }
      } catch (err) {
        console.error('Redirect check failed:', err);
      } finally {
        setChecking(false);
        // Log the dead link if we reached this point (didn't redirect)
        try {
          deadLinkAPI.log(pathname);
        } catch (e) {
          console.error('Failed to log dead link:', e);
        }
      }
    };
    checkRedirects();
  }, [pathname, navigate]);

  if (checking) return (
    <div className="bg-stone-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <PageLoader message="Verifying link..." />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-stone-900 mb-4">404</h1>
      <p className="text-xl text-stone-600 mb-8">Page not found</p>
      <Link to="/" className="text-emerald-900 hover:text-emerald-700 font-medium tracking-tight">
        ← Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
