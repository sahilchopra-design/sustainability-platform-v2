/**
 * CountryDatasetSelector — Persistent country dataset toggle in the app shell.
 * Stores selection in localStorage ('a2_country_dataset').
 * Modules check isIndiaMode() from IndiaDataAdapter to swap data sources.
 */
import React, { useState, useCallback } from 'react';

const LS_KEY = 'a2_country_dataset';
const DATASETS = [
  { code: 'GLOBAL', label: 'Global', flag: '🌐', desc: '5,000 securities · 22 databases · 213 countries' },
  { code: 'IN', label: 'India', flag: '🇮🇳', desc: '200 companies · NIFTY 50 · BSE 200 · BRSR · CBAM · 5 portfolios' },
];

export default function CountryDatasetSelector() {
  const [active, setActive] = useState(() => {
    try { return localStorage.getItem(LS_KEY) || 'GLOBAL'; } catch { return 'GLOBAL'; }
  });
  const [open, setOpen] = useState(false);

  const select = useCallback((code) => {
    setActive(code);
    try { localStorage.setItem(LS_KEY, code); } catch { /* silent */ }
    setOpen(false);
    // Trigger soft reload so modules pick up new dataset
    window.dispatchEvent(new Event('a2-dataset-changed'));
  }, []);

  const current = DATASETS.find(d => d.code === active) || DATASETS[0];
  const isIndia = active === 'IN';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 8,
          border: `1px solid ${isIndia ? '#b8962e' : 'rgba(255,255,255,0.2)'}`,
          background: isIndia ? 'rgba(184,150,46,0.15)' : 'transparent',
          color: isIndia ? '#b8962e' : 'rgba(255,255,255,0.7)',
          cursor: 'pointer', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600, transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 14 }}>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: '#1b2a4a', border: '1px solid #334155', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 9999,
          minWidth: 280, overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #334155', fontSize: 9,
            fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8', letterSpacing: 1.5 }}>
            DATASET
          </div>
          {DATASETS.map(d => (
            <button
              key={d.code}
              onClick={() => select(d.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', border: 'none', cursor: 'pointer',
                background: active === d.code ? 'rgba(184,150,46,0.12)' : 'transparent',
                borderLeft: active === d.code ? '3px solid #b8962e' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 18 }}>{d.flag}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: active === d.code ? '#b8962e' : '#e2e8f0' }}>
                  {d.label}
                </div>
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{d.desc}</div>
              </div>
              {active === d.code && (
                <span style={{ marginLeft: 'auto', color: '#b8962e', fontSize: 14 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
