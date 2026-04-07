import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Already logged in — redirect away
  useEffect(() => {
    if (user) {
      navigate(params.get('returnTo') || '/', { replace: true });
    }
  }, [user, navigate, params]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(params.get('returnTo') || '/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 6,
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#ffffff',
    fontSize: 14,
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.15s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a2332',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(212,168,67,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(29,78,216,0.08) 0%, transparent 50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#d4a843',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 900,
            color: '#1a2332',
            letterSpacing: '-2px',
            marginBottom: 16,
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: '0 0 0 4px rgba(212,168,67,0.2), 0 8px 24px rgba(0,0,0,0.3)',
          }}>
            A²
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.01em',
          }}>
            A<sup style={{ fontSize: '0.6em', verticalAlign: 'super', letterSpacing: 0 }}>2</sup>{' '}Intelligence
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 13,
            marginTop: 4,
            letterSpacing: '0.03em',
          }}>
            by AA Impact Inc.
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          border: '1px solid rgba(212,168,67,0.25)',
          padding: '32px 28px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 24,
            letterSpacing: '-0.01em',
          }}>
            Sign in to your account
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.12)',
                border: '1px solid rgba(220,38,38,0.35)',
                borderRadius: 6,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 13,
                color: '#fca5a5',
                lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 6,
                border: 'none',
                background: loading ? 'rgba(212,168,67,0.45)' : '#d4a843',
                color: '#1a2332',
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '0.02em',
                transition: 'background 0.15s, transform 0.1s',
                boxShadow: loading ? 'none' : '0 2px 8px rgba(212,168,67,0.25)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 20,
          fontSize: 12,
          color: 'rgba(255,255,255,0.3)',
          lineHeight: 1.6,
        }}>
          Need access? Contact your administrator.
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 28,
          fontSize: 10,
          color: 'rgba(255,255,255,0.15)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.06em',
        }}>
          A² INTELLIGENCE · CONFIDENTIAL
        </div>
      </div>
    </div>
  );
}
