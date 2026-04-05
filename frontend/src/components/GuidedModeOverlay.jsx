import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useGuidedMode } from '../context/GuidedModeContext';
import { MODULE_GUIDES } from '../data/moduleGuides';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', goldD: '#a8903a', textSec: '#5c6b7e',
  textMut: '#9aa3ae', red: '#dc2626', green: '#16a34a', amber: '#d97706',
  blue: '#2563eb', teal: '#0891b2', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

function SectionHeader({ title, icon, expanded, onToggle, color }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
      padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
      borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 12, color: color || T.navy, fontFamily: T.font }}>{title}</span>
      </span>
      <span style={{ color: T.textMut, fontSize: 14, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
    </button>
  );
}

function DataPointRow({ dp }) {
  return (
    <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, color: T.navy }}>{dp.name}</span>
        {dp.value && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, fontWeight: 700, background: T.gold + '15', padding: '1px 6px', borderRadius: 3 }}>{dp.value}</span>}
      </div>
      {dp.formula && <div style={{ fontFamily: T.mono, fontSize: 10, color: T.teal, marginBottom: 3, background: T.teal + '08', padding: '2px 6px', borderRadius: 3 }}>{dp.formula}</div>}
      <div style={{ color: T.textSec, lineHeight: 1.5 }}>{dp.interpretation}</div>
      {dp.source && <div style={{ color: T.textMut, fontSize: 10, marginTop: 3 }}>Source: {dp.source}</div>}
    </div>
  );
}

export default function GuidedModeOverlay() {
  const { isGuidedMode, expandedSections, toggleSection, panelWidth, showCalculationBrief, showDataPoints, showUserInteraction, showReferences } = useGuidedMode();
  const location = useLocation();

  const currentPath = location.pathname;
  const guide = useMemo(() => MODULE_GUIDES[currentPath], [currentPath]);

  if (!isGuidedMode) return null;

  if (!guide) {
    return (
      <div style={{
        width: panelWidth, minWidth: panelWidth, background: T.surface,
        borderLeft: `3px solid ${T.gold}`, overflowY: 'auto', height: '100%',
        boxShadow: '-4px 0 12px rgba(27,58,92,0.06)',
      }}>
        <div style={{ padding: 20 }}>
          <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>GUIDED MODE</div>
          <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 14 }}>No Guide Available</h3>
          <p style={{ color: T.textSec, fontSize: 12, lineHeight: 1.6 }}>
            Navigate to a module to see its contextual guidance, calculation engine brief, and data point explanations.
          </p>
          <div style={{ marginTop: 16, padding: 12, background: T.bg, borderRadius: 8, fontSize: 11, color: T.textSec }}>
            <strong style={{ color: T.navy }}>Tip:</strong> Use the sidebar to navigate to any of the 532+ modules. The guided panel will automatically update with relevant information.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: panelWidth, minWidth: panelWidth, background: T.surface,
      borderLeft: `3px solid ${T.gold}`, overflowY: 'auto', height: '100%',
      boxShadow: '-4px 0 12px rgba(27,58,92,0.06)',
      fontFamily: T.font,
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 14px', background: T.navy, borderBottom: `2px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, letterSpacing: 1 }}>GUIDED MODE</span>
          <span style={{ fontFamily: T.mono, fontSize: 9, background: T.gold + '33', color: T.gold, padding: '1px 6px', borderRadius: 3 }}>{guide.epCode}</span>
          {guide.sprint && <span style={{ fontFamily: T.mono, fontSize: 9, background: 'rgba(255,255,255,0.1)', color: '#94a3b8', padding: '1px 6px', borderRadius: 3 }}>Sprint {guide.sprint}</span>}
        </div>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{guide.title}</h3>
      </div>

      {/* ── Module Overview ── */}
      <SectionHeader title="Module Overview" icon="📋" expanded={expandedSections.includes('overview')} onToggle={() => toggleSection('overview')} color={T.navy} />
      {expandedSections.includes('overview') && (
        <div style={{ padding: '10px 14px', fontSize: 12, color: T.textSec, lineHeight: 1.7, borderBottom: `1px solid ${T.border}` }}>
          {guide.description}
        </div>
      )}

      {/* ── Calculation Engine ── */}
      {showCalculationBrief && guide.calculationEngine && (
        <>
          <SectionHeader title="Calculation Engine" icon="🔢" expanded={expandedSections.includes('calculation')} onToggle={() => toggleSection('calculation')} color={T.teal} />
          {expandedSections.includes('calculation') && (
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>Methodology</span>
                <div style={{ fontSize: 12, color: T.navy, fontWeight: 600, marginTop: 2 }}>{guide.calculationEngine.methodology}</div>
              </div>
              {guide.calculationEngine.formula && (
                <div style={{ marginBottom: 8, padding: '8px 10px', background: T.navy + '08', borderRadius: 6, border: `1px solid ${T.navy}15` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>Formula</span>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, marginTop: 4, lineHeight: 1.5 }}>{guide.calculationEngine.formula}</div>
                </div>
              )}
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.7, marginBottom: 8 }}>{guide.calculationEngine.brief}</div>
              {guide.calculationEngine.standards && guide.calculationEngine.standards.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {guide.calculationEngine.standards.map(s => (
                    <span key={s} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: T.teal + '15', color: T.teal, fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Data Points ── */}
      {showDataPoints && guide.dataPoints && guide.dataPoints.length > 0 && (
        <>
          <SectionHeader title={`Data Points (${guide.dataPoints.length})`} icon="📊" expanded={expandedSections.includes('dataPoints')} onToggle={() => toggleSection('dataPoints')} color={T.blue} />
          {expandedSections.includes('dataPoints') && guide.dataPoints.map((dp, i) => <DataPointRow key={i} dp={dp} />)}
        </>
      )}

      {/* ── User Interaction Guide ── */}
      {showUserInteraction && guide.userInteraction && guide.userInteraction.length > 0 && (
        <>
          <SectionHeader title="How to Use" icon="🖱️" expanded={expandedSections.includes('interaction')} onToggle={() => toggleSection('interaction')} color={T.purple} />
          {expandedSections.includes('interaction') && (
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}` }}>
              {guide.userInteraction.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>
                  <span style={{ fontFamily: T.mono, color: T.gold, fontWeight: 700, minWidth: 18 }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── References ── */}
      {showReferences && guide.references && guide.references.length > 0 && (
        <>
          <SectionHeader title={`References (${guide.references.length})`} icon="📚" expanded={expandedSections.includes('references')} onToggle={() => toggleSection('references')} color={T.goldD} />
          {expandedSections.includes('references') && (
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}` }}>
              {guide.references.map((ref, i) => (
                <div key={i} style={{ fontSize: 10, color: T.textSec, marginBottom: 4, paddingLeft: 12, borderLeft: `2px solid ${T.gold}22` }}>{ref}</div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Footer ── */}
      <div style={{ padding: '12px 14px', background: T.bg, fontSize: 10, color: T.textMut, textAlign: 'center' }}>
        Press <kbd style={{ fontFamily: T.mono, background: T.surface, padding: '1px 4px', borderRadius: 3, border: `1px solid ${T.border}` }}>G</kbd> to toggle Guided Mode
      </div>
    </div>
  );
}
