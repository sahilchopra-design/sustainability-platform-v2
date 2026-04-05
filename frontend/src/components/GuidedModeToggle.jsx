import React from 'react';
import { useGuidedMode } from '../context/GuidedModeContext';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', goldD: '#a8903a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

export default function GuidedModeToggle() {
  const { isGuidedMode, toggleGuidedMode } = useGuidedMode();

  return (
    <button
      onClick={toggleGuidedMode}
      title={isGuidedMode ? 'Switch to Normal Mode' : 'Switch to Guided Mode'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 6,
        border: `1px solid ${isGuidedMode ? T.gold : 'rgba(255,255,255,0.2)'}`,
        background: isGuidedMode ? 'rgba(197,169,106,0.15)' : 'transparent',
        color: isGuidedMode ? T.gold : 'rgba(255,255,255,0.6)',
        cursor: 'pointer', fontFamily: T.mono, fontSize: 10,
        fontWeight: 700, letterSpacing: 1, transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 14 }}>{isGuidedMode ? '📖' : '💡'}</span>
      <span>{isGuidedMode ? 'GUIDED' : 'GUIDE'}</span>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: isGuidedMode ? '#16a34a' : 'rgba(255,255,255,0.3)',
        transition: 'background 0.2s',
      }} />
    </button>
  );
}
