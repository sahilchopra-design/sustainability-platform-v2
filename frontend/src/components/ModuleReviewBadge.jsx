/**
 * ModuleReviewBadge — Shows module maturity status in the sidebar
 * Maturity levels: draft | review | beta | production
 * Review tiers: 0=unreviewed, 1=team-reviewed, 2=partner-reviewed, 3=production
 */
import React from 'react';

const MATURITY = {
  draft:      { label: 'Draft',      color: '#94a3b8', bg: '#94a3b810', icon: '📝' },
  review:     { label: 'In Review',  color: '#d97706', bg: '#d9770610', icon: '🔍' },
  beta:       { label: 'Beta',       color: '#2563eb', bg: '#2563eb10', icon: '🧪' },
  production: { label: 'Production', color: '#16a34a', bg: '#16a34a10', icon: '✅' },
};

const TIER_LABELS = {
  0: null,
  1: 'L1: Team',
  2: 'L2: Partner',
  3: 'L3: Production',
};

export default function ModuleReviewBadge({ maturityLevel = 'draft', reviewTier = 0, size = 'sm' }) {
  const m = MATURITY[maturityLevel] || MATURITY.draft;
  const tierLabel = TIER_LABELS[reviewTier];

  if (size === 'sm') {
    // Compact badge for sidebar items
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '1px 5px', borderRadius: 4,
        background: m.bg, border: `1px solid ${m.color}20`,
        fontSize: 8, fontWeight: 600, color: m.color,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: 0.3, lineHeight: 1.4, whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 7 }}>{m.icon}</span>
        {m.label}
      </span>
    );
  }

  // Full badge with tier info (for module headers)
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 6,
      background: m.bg, border: `1px solid ${m.color}30`,
    }}>
      <span style={{ fontSize: 14 }}>{m.icon}</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{m.label}</div>
        {tierLabel && (
          <div style={{ fontSize: 9, color: m.color + 'aa', fontFamily: "'JetBrains Mono', monospace" }}>
            {tierLabel}
          </div>
        )}
      </div>
    </div>
  );
}

export { MATURITY, TIER_LABELS };
