'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const AdminContext = createContext(null);

export const AdminClientWrapper = ({ children }) => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (error) {
      console.error('Error refreshing admin stats:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      refreshStats();
    } else if (!authLoading && !isAdmin) {
      setLoading(false);
    }
  }, [authLoading, isAdmin, refreshStats]);

  return (
    <AdminContext.Provider value={{ stats, loading, refreshStats }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminClientWrapper');
  }
  return context;
};
