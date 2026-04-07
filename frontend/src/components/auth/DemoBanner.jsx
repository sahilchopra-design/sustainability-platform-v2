import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function DemoBanner() {
  const { user, daysRemaining, isReadOnly } = useAuth();
  if (!user) return null;

  const show = user.rbac_role === 'demo' || user.rbac_role === 'partner' || isReadOnly;
  if (!show) return null;

  const role = user.rbac_role === 'partner' ? 'PARTNER' : 'DEMO';
  const org = user.display_org || user.org_name || '';
  const expiry = daysRemaining !== null
    ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
    : 'limited access';

  return (
    <div style={{
      background: '#1a2332',
      borderBottom: '2px solid #d4a843',
      padding: '6px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.05em',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          background: '#d4a843',
          color: '#1a2332',
          padding: '2px 8px',
          fontWeight: 700,
          borderRadius: 2,
        }}>
          {role} ACCESS
        </span>
        {org && (
          <span style={{ color: '#d4a843' }}>{org}</span>
        )}
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>Read-only · {expiry}</span>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
        AA IMPACT INTELLIGENCE — CONFIDENTIAL
      </div>
    </div>
  );
}
