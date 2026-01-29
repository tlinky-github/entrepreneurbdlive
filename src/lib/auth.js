import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // If user is already in localStorage (test mode), use it directly
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUser(user);
        setLoading(false);
        return;
      }

      // Otherwise try to fetch from API
      const response = await authAPI.getMe();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error loading user:', error);
      // Check if test user is still in localStorage
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUser(user);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role = 'user') => {
    const response = await authAPI.register({ name, email, password, role });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'super_admin' || user?.role === 'editor';
  const isSuperAdmin = user?.role === 'super_admin';
  const isEntrepreneur = user?.role === 'entrepreneur';
  const canCreatePost = ['super_admin', 'editor', 'contributor'].includes(user?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
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
