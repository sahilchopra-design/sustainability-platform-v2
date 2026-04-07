import React from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function AccessExpiredPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const org = user?.display_org || user?.org_name || '';
  const email = user?.email || '';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a2332',
      backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(220,38,38,0.06) 0%, transparent 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        {/* Header with AA logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#d4a843',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 900,
            color: '#1a2332',
            letterSpacing: '-1px',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 16,
          }}>
            AA
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '0.06em' }}>
            AA IMPACT INTELLIGENCE
          </div>
        </div>

        {/* Expired Icon */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(220,38,38,0.1)',
          border: '2px solid rgba(220,38,38,0.35)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          marginBottom: 24,
        }}>
          ⏱
        </div>

        {/* Message */}
        <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
          Access Expired
        </div>
        <div style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.7,
          marginBottom: 8,
          maxWidth: 360,
          margin: '0 auto 8px',
        }}>
          Your access to the AA Impact Intelligence platform has expired.
        </div>
        {(email || org) && (
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 32,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {email}{org ? ` · ${org}` : ''}
          </div>
        )}

        {/* Details card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '20px 24px',
          marginBottom: 28,
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
            What happens next?
          </div>
          {[
            'Contact your administrator to request a renewal',
            'Your data and settings are preserved',
            'Access is typically restored within 1 business day',
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: i < 2 ? 10 : 0,
            }}>
              <span style={{ color: '#d4a843', fontSize: 14, marginTop: 1 }}>›</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <a
            href="mailto:admin@aaimpact.com?subject=Access%20Renewal%20Request"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#d4a843',
              color: '#1a2332',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
              letterSpacing: '0.01em',
              width: '100%',
              maxWidth: 320,
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            Contact Administrator
          </a>

          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: '10px 24px',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              width: '100%',
              maxWidth: 320,
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            Sign Out
          </button>
        </div>

        <div style={{
          marginTop: 36,
          fontSize: 10,
          color: 'rgba(255,255,255,0.15)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.06em',
        }}>
          AA IMPACT INTELLIGENCE · CONFIDENTIAL
        </div>
      </div>
    </div>
  );
}
