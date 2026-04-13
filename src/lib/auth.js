import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleProvider, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let role = 'user';
        
        try {
          // Fetch real role from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role || 'user';
          } else {
            // Fallback for first-time admin setup using environment variable
            const masterAdminEmail = process.env.REACT_APP_ADMIN_EMAIL;
            if (masterAdminEmail && firebaseUser.email === masterAdminEmail) {
              role = 'super_admin';
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }

        const appUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          role: role
        };
        
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (roleOverride = null) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Sync user to Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      let role = roleOverride || 'user';
      
      // If user exists, keep their role unless override is forced
      if (userDoc.exists() && !roleOverride) {
        role = userDoc.data().role || 'user';
      } else {
        // First login or specific override
        const masterAdminEmail = process.env.REACT_APP_ADMIN_EMAIL;
        if (!roleOverride && masterAdminEmail && firebaseUser.email === masterAdminEmail) {
          role = 'super_admin';
        }
        
        // Save/Update user profile in Firestore
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          role: role,
          lastLogin: serverTimestamp()
        }, { merge: true });
      }
      
      return firebaseUser;
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userMeta');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const masterAdminEmail = process.env.REACT_APP_ADMIN_EMAIL;
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
