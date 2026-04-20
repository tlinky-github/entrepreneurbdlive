'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleProvider, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Architectural Resilience: Skip observer if auth engine failed to initialize
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          let role = 'user';
          
          try {
            // Fetch real role from Firestore (if DB is available)
            if (db) {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                role = userDoc.data().role || 'user';
              } else {
                const masterAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
                if (masterAdminEmail && firebaseUser.email === masterAdminEmail) {
                  role = 'super_admin';
                }
              }
            }
          } catch (error) {
            console.error('[Auth] Error fetching user role:', error);
          }

          const appUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || (role === 'super_admin' ? 'Admin' : 'Member'),
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            role: role
          };
          
          setUser(appUser);
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (roleOverride = null) => {
    if (!auth || !googleProvider) {
      alert('Authentication is disabled or unavailable in this environment.');
      return null;
    }
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      let role = roleOverride || 'user';
      
      if (db) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && !roleOverride) {
          role = userDoc.data().role || 'user';
        } else {
          const masterAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
          if (!roleOverride && masterAdminEmail && firebaseUser.email === masterAdminEmail) {
            role = 'super_admin';
          }
          
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            role: role,
            lastLogin: serverTimestamp(),
            created_at: userDoc.exists() && userDoc.data().created_at ? userDoc.data().created_at : serverTimestamp()
          }, { merge: true });
        }
      }
      
      return firebaseUser;
    } catch (error) {
      console.error('[Auth] Google Sign-In Failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      localStorage.removeItem('userMeta');
    } catch (error) {
      console.error('[Auth] Sign-Out Failed:', error);
    }
  };

  const masterAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = user?.role === 'super_admin' || user?.role === 'editor' || (masterAdminEmail && user?.email === masterAdminEmail);
  const isSuperAdmin = user?.role === 'super_admin' || (masterAdminEmail && user?.email === masterAdminEmail);
  const isEntrepreneur = user?.role === 'entrepreneur';
  const canCreatePost = ['super_admin', 'editor', 'contributor'].includes(user?.role) || (masterAdminEmail && user?.email === masterAdminEmail);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        logout,
        isAdmin,
        isSuperAdmin,
        isEntrepreneur,
        canCreatePost,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
