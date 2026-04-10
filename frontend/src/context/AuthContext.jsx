import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const SESSION_KEY = 'a2_session_token';

// Set or clear the default Bearer token for all axios requests
function _setAxiosToken(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try { sessionStorage.setItem(SESSION_KEY, token); } catch {}
  } else {
    delete axios.defaults.headers.common['Authorization'];
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }
}

// On module load, restore any saved token so API calls work on page reload
try {
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (saved) axios.defaults.headers.common['Authorization'] = `Bearer ${saved}`;
} catch {}

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
    // If the response includes a session token (login response), persist it
    if (data.session_token) {
      _setAxiosToken(data.session_token);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await axios.get('/api/auth/me', { withCredentials: true });
      processUser(res.data);
    } catch {
      // Dev mode ONLY: auto-login when REACT_APP_DEV_AUTH=true or localhost
      const isDev = process.env.REACT_APP_DEV_AUTH === 'true' ||
        (typeof window !== 'undefined' && window.location.hostname === 'localhost');
      if (isDev) {
        const DEV_FALLBACK = {
          id: 'dev-user', email: 'demo@a2intelligence.com', name: 'Demo User (Dev)',
          role: 'super_admin', allowed_module_paths: null, is_read_only: false,
          days_remaining: 365, session_token: 'dev-token',
        };
        processUser(DEV_FALLBACK);
      } else {
        // Production: no backend = no access
        setUser(null);
        setAllowedPaths(null);
      }
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
    _setAxiosToken(null);
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
      processUser,
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
