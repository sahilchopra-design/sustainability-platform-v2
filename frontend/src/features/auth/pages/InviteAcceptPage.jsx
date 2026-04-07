import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const ROLE_LABELS = {
  super_admin: 'Super Administrator',
  team_member: 'Team Member',
  partner: 'Partner',
  demo: 'Demo User',
  viewer: 'Viewer',
};

const ROLE_COLORS = {
  super_admin: { bg: 'rgba(212,168,67,0.15)', text: '#92620a', border: 'rgba(212,168,67,0.4)' },
  team_member: { bg: 'rgba(29,78,216,0.1)', text: '#1d4ed8', border: 'rgba(29,78,216,0.3)' },
  partner: { bg: 'rgba(6,95,70,0.1)', text: '#065f46', border: 'rgba(6,95,70,0.3)' },
  demo: { bg: 'rgba(109,40,217,0.1)', text: '#6d28d9', border: 'rgba(109,40,217,0.3)' },
  viewer: { bg: 'rgba(100,116,139,0.1)', text: '#475569', border: 'rgba(100,116,139,0.3)' },
};

export default function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { processUser } = useAuth();

  const [inviteData, setInviteData] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await axios.get(`/api/auth/invite/${token}`, { withCredentials: true });
        setInviteData(res.data);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 410) {
          setInviteError('This invite link has expired. Please contact your administrator for a new invite.');
        } else if (status === 404) {
          setInviteError('This invite link is invalid or has already been used.');
        } else {
          setInviteError('Unable to load invite details. Please check the link and try again.');
        }
      } finally {
        setLoadingInvite(false);
      }
    };
    fetchInvite();
  }, [token]);

  const validate = () => {
    if (!name.trim()) return 'Please enter your full name.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await axios.post(
        `/api/auth/invite/${token}/accept`,
        { name: name.trim(), password },
        { withCredentials: true }
      );
      // If the backend returns user data, process it; otherwise navigate to login
      if (res.data?.user_id || res.data?.email) {
        if (typeof processUser === 'function') processUser(res.data);
      }
      navigate('/', { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 410) {
        setSubmitError('This invite link has expired. Please contact your administrator.');
      } else {
        setSubmitError(detail || 'Failed to complete registration. Please try again.');
      }
    } finally {
      setSubmitting(false);
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

  // Loading state
  if (loadingInvite) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a2332',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(212,168,67,0.3)',
            borderTopColor: '#d4a843',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Verifying invite…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Invalid / expired invite
  if (inviteError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a2332',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(220,38,38,0.15)',
            border: '2px solid rgba(220,38,38,0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            marginBottom: 20,
          }}>
            ✕
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
            Invite Unavailable
          </div>
          <div style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.7,
            marginBottom: 28,
            padding: '0 16px',
          }}>
            {inviteError}
          </div>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: '#d4a843',
              color: '#1a2332',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  const roleKey = inviteData?.rbac_role || inviteData?.role || 'viewer';
  const roleColor = ROLE_COLORS[roleKey] || ROLE_COLORS.viewer;
  const roleLabel = ROLE_LABELS[roleKey] || roleKey;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a2332',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(212,168,67,0.06) 0%, transparent 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
            marginBottom: 14,
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: '0 0 0 4px rgba(212,168,67,0.2)',
          }}>
            AA
          </div>
          <div style={{ color: '#ffffff', fontSize: 20, fontWeight: 700 }}>
            You've been invited
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 }}>
            AA Impact Intelligence — Sustainability Risk Platform
          </div>
        </div>

        {/* Invite details card */}
        <div style={{
          background: 'rgba(212,168,67,0.06)',
          border: '1px solid rgba(212,168,67,0.25)',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}>
          <div style={{ fontSize: 22, marginTop: 2 }}>✉</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
              Invited as{' '}
              <strong style={{ color: '#ffffff' }}>{inviteData?.email}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                background: roleColor.bg,
                color: roleColor.text,
                border: `1px solid ${roleColor.border}`,
                padding: '2px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                {roleLabel}
              </span>
              {(inviteData?.display_org || inviteData?.org_name) && (
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                  · {inviteData.display_org || inviteData.org_name}
                </span>
              )}
            </div>
            {inviteData?.expires_at && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                Expires: {new Date(inviteData.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        {/* Registration form */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '28px 24px',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 20 }}>
            Complete your account setup
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={submitting}
                autoComplete="name"
                autoFocus
                placeholder="Jane Smith"
                style={inputStyle}
              />
            </div>

            {/* Email (read-only from invite) */}
            {inviteData?.email && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={inviteData.email}
                  readOnly
                  style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
                />
              </div>
            )}

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={submitting}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                style={inputStyle}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={submitting}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                style={{
                  ...inputStyle,
                  borderColor: confirmPassword && confirmPassword !== password
                    ? 'rgba(220,38,38,0.5)'
                    : 'rgba(255,255,255,0.15)',
                }}
              />
              {confirmPassword && confirmPassword !== password && (
                <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>
                  Passwords do not match
                </div>
              )}
            </div>

            {/* Error */}
            {submitError && (
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
                {submitError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 6,
                border: 'none',
                background: submitting ? 'rgba(212,168,67,0.45)' : '#d4a843',
                color: '#1a2332',
                fontWeight: 700,
                fontSize: 15,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '0.02em',
              }}
            >
              {submitting ? 'Setting up account…' : 'Accept Invite & Sign In'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#d4a843', textDecoration: 'none' }}>Sign in here</a>
        </div>
      </div>
    </div>
  );
}
