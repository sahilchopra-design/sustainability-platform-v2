import React, { useState, useCallback } from 'react';
import { fmtInr, fmtUsd, fmtDual, isIndiaMode } from '../data/indiaLocale';

const MODES = ['usd', 'inr', 'dual'];
const LABELS = { usd: '$', inr: '\u20B9', dual: '$\u20B9' };

const T = {
  navy: '#1b2a4a', gold: '#b8962e', cream: '#faf9f6',
  border: '#e2e0d8', white: '#ffffff',
};

const SIZE_MAP = {
  sm: { fontSize: 11, pill: { fontSize: 9, padding: '1px 5px' } },
  md: { fontSize: 14, pill: { fontSize: 10, padding: '2px 7px' } },
  lg: { fontSize: 20, pill: { fontSize: 11, padding: '3px 9px' } },
};

function formatValue(usdValue, mode) {
  if (usdValue === null || usdValue === undefined || isNaN(usdValue)) return '\u2014';
  if (mode === 'usd') return fmtUsd(usdValue);
  if (mode === 'inr') return fmtInr(usdValue * 83.5);
  return fmtDual(usdValue);
}

function getInitialMode(showDual) {
  if (showDual) return 'dual';
  return isIndiaMode() ? 'inr' : 'usd';
}

export default function CurrencyToggle({ usdValue, showDual, size = 'md', style }) {
  const [mode, setMode] = useState(() => getInitialMode(showDual));
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const cycle = useCallback(() => {
    setMode((prev) => {
      const idx = MODES.indexOf(prev);
      return MODES[(idx + 1) % MODES.length];
    });
  }, []);

  const pillStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    cursor: 'pointer', userSelect: 'none',
    ...style,
  };

  const badgeStyle = {
    background: T.gold, color: T.white, borderRadius: 4,
    fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    letterSpacing: 0.3, lineHeight: 1,
    ...sizeConfig.pill,
  };

  const valueStyle = {
    fontWeight: 700, color: T.navy,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: sizeConfig.fontSize,
  };

  return (
    <span style={pillStyle} onClick={cycle} title="Click to toggle currency">
      <span style={valueStyle}>{formatValue(usdValue, mode)}</span>
      <span style={badgeStyle}>{LABELS[mode]}</span>
    </span>
  );
}
