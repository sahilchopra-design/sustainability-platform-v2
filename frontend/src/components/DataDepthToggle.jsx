import React from 'react';
import { useDataDepth } from '../context/DataDepthContext';

export default function DataDepthToggle() {
  const { isActive, toggleActive } = useDataDepth();
  return (
    <button
      onClick={toggleActive}
      title={isActive ? 'Disable Data Drill-Down' : 'Enable Data Drill-Down (click any metric to explore depth)'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 6,
        border: `1px solid ${isActive ? '#0891b2' : 'rgba(255,255,255,0.2)'}`,
        background: isActive ? 'rgba(8,145,178,0.15)' : 'transparent',
        color: isActive ? '#0891b2' : 'rgba(255,255,255,0.6)',
        cursor: 'pointer', fontFamily: "'JetBrains Mono','SF Mono',monospace",
        fontSize: 10, fontWeight: 700, letterSpacing: 1, transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 14 }}>{isActive ? '🔍' : '🔎'}</span>
      <span>{isActive ? 'DEPTH' : 'DEPTH'}</span>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: isActive ? '#16a34a' : 'rgba(255,255,255,0.3)',
        transition: 'background 0.2s',
      }} />
    </button>
  );
}
