import React from 'react';
import IndiaAdvancedAnalytics from './IndiaAdvancedAnalytics';

// Global-flavored secondary framework ring: EU Taxonomy + SBTi + DNSH.
export const EU_TAXONOMY_CORE = [
  { id: 'tx1', item: 'Substantial contribution (Art 10 — climate mitigation)' },
  { id: 'tx2', item: 'DNSH — climate adaptation' },
  { id: 'tx3', item: 'DNSH — water & marine' },
  { id: 'tx4', item: 'DNSH — circular economy' },
  { id: 'tx5', item: 'DNSH — pollution prevention' },
  { id: 'tx6', item: 'DNSH — biodiversity & ecosystems' },
  { id: 'tx7', item: 'Minimum social safeguards (OECD/UNGP)' },
  { id: 'tx8', item: 'Green capex / revenue tagging disclosed' },
  { id: 'tx9', item: 'SBTi 1.5°C-validated target' },
];

// Normalize a module's local T object to the canonical shape the primitive expects.
// Caller Ts may lack surface/surfaceH/borderL/textSec/textMut/gold/mono/font keys.
const normalizeT = (t = {}) => ({
  bg: t.bg || '#FAFAF7',
  surface: t.surface || t.card || '#FFFFFF',
  surfaceH: t.surfaceH || t.sub || '#F1EDE4',
  border: t.border || '#E5E2D9',
  borderL: t.borderL || t.border || '#EDE9E0',
  navy: t.navy || '#0F172A',
  gold: t.gold || t.accent || '#B8860B',
  text: t.text || t.textPri || '#1A1A2E',
  textSec: t.textSec || t.sub || '#4B5563',
  textMut: t.textMut || t.sub || '#6B7280',
  red: t.red || '#DC2626',
  green: t.green || '#16A34A',
  amber: t.amber || '#D97706',
  font: t.font || "'Inter', -apple-system, sans-serif",
  mono: t.mono || t.fontMono || "'JetBrains Mono', monospace",
  ...t,
});

export default function EnergyAdvancedAnalytics(props) {
  const T = normalizeT(props.T);
  return (
    <IndiaAdvancedAnalytics
      {...props}
      T={T}
      frameworkBLabel={props.frameworkBLabel || 'EU TAXONOMY & SBTi ALIGNMENT'}
      frameworkBRingLabel={props.frameworkBRingLabel || 'EU Tx'}
      frameworkB={props.frameworkB || EU_TAXONOMY_CORE}
      brsrDefault={props.brsrDefault || ['tx1', 'tx2', 'tx8', 'tx9']}
      scenarioPathsLabel={props.scenarioPathsLabel || 'NGFS × IEA NZE × STEPS × APS'}
    />
  );
}
