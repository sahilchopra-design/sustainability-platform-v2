import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const T = {
  navy: '#1a2332',
  gold: '#d4a843',
  bg: '#faf8f4',
  card: 'rgba(255,255,255,0.92)',
  border: 'rgba(26,35,50,0.12)',
  text: '#1a2332',
  textSec: '#5a6a7a',
  green: '#065f46',
  blue: '#1d4ed8',
  red: '#dc2626',
  mono: "'JetBrains Mono', monospace",
};

export default function ProtectedRoute({ element, path }) {
  const { user, loading, canAccess, daysRemaining } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  // Access expired check
  if (daysRemaining !== null && daysRemaining <= 0) {
    return <Navigate to="/access-expired" replace />;
  }

  if (path && !canAccess(path)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 400,
        flexDirection: 'column',
        gap: 16,
        padding: 40,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'rgba(26,35,50,0.06)',
          border: `2px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}>
          🔒
        </div>
        <div style={{
          fontSize: 20,
          fontWeight: 700,
          color: T.text,
          letterSpacing: '-0.01em',
        }}>
          Access Restricted
        </div>
        <div style={{
          color: T.textSec,
          fontSize: 14,
          maxWidth: 360,
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          You don't have permission to access this module. Contact your administrator to request access.
        </div>
        <div style={{
          marginTop: 8,
          padding: '6px 14px',
          background: 'rgba(26,35,50,0.04)',
          border: `1px solid ${T.border}`,
          borderRadius: 6,
          fontSize: 11,
          fontFamily: T.mono,
          color: T.textSec,
          letterSpacing: '0.04em',
        }}>
          PATH: {path}
        </div>
      </div>
    );
  }

  return element;
}
