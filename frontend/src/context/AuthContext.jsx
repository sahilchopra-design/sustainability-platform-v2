import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // null = all allowed (super_admin); Set of strings = allowed paths
  const [allowedPaths, setAllowedPaths] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(null);

  const processUser = useCallback((data) => {
    setUser(data);
    setIsReadOnly(data.is_read_only || false);
    if (data.allowed_module_paths === null || data.allowed_module_paths === undefined) {
      setAllowedPaths(null); // super_admin — all allowed
    } else {
      setAllowedPaths(new Set(data.allowed_module_paths));
    }
    if (data.days_remaining !== undefined && data.days_remaining !== null) {
      setDaysRemaining(data.days_remaining);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await axios.get('/api/auth/me', { withCredentials: true });
      processUser(res.data);
    } catch {
      setUser(null);
      setAllowedPaths(null);
    } finally {
      setLoading(false);
    }
  }, [processUser]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
    processUser(res.data);
    return res.data;
  };

  const logout = async () => {
    await axios.post('/api/auth/logout', {}, { withCredentials: true }).catch(() => {});
    setUser(null);
    setAllowedPaths(null);
    setIsReadOnly(false);
    setDaysRemaining(null);
  };

  const canAccess = useCallback((path) => {
    if (!user) return false;
    if (allowedPaths === null) return true; // super_admin
    return allowedPaths.has(path);
  }, [user, allowedPaths]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      allowedPaths,
      isReadOnly,
      daysRemaining,
      login,
      logout,
      canAccess,
      refreshUser: fetchMe,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
