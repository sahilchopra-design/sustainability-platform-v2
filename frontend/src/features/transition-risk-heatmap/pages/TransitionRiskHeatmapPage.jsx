import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend } from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const SECTORS = ['Energy', 'Materials', 'Industrials', 'Utilities', 'Real Estate', 'Financials', 'Technology', 'Consumer', 'Health', 'Telecom'];
const GEOS = ['North America', 'Europe', 'Asia Pacific', 'Emerging Markets', 'Middle East'];
const SCENARIOS = ['Current Policies', 'Below 2°C', 'Net Zero 2050'];

// Risk matrix: sector × geography × scenario
const riskMatrix = (scenario, scIdx) => {
  const base = {
    'Energy':      [85, 72, 68, 78, 92],
    'Materials':   [62, 55, 58, 64, 70],
    'Industrials': [45, 40, 48, 52, 58],
    'Utilities':   [55, 42, 50, 65, 72],
    'Real Estate': [48, 62, 44, 52, 38],
    'Financials':  [32, 38, 35, 42, 28],
    'Technology':  [18, 22, 20, 24, 16],
    'Consumer':    [28, 32, 30, 38, 22],
    'Health':      [12, 15, 14, 18, 10],
    'Telecom':     [10, 12, 11, 14, 8],
  };
  // Adjust by scenario intensity
  const multiplier = scIdx === 0 ? 0.8 : scIdx === 1 ? 1.0 : 1.35;
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v.map(x => Math.min(100, Math.round(x * multiplier)))]));
};

function riskColor(val) {
  if (val >= 75) return { bg: T.red + '44', text: T.red, label: 'CRITICAL' };
  if (val >= 55) return { bg: T.orange + '33', text: T.orange, label: 'HIGH' };
  if (val >= 35) return { bg: T.amber + '33', text: T.amber, label: 'MEDIUM' };
  if (val >= 20) return { bg: T.green + '22', text: T.green, label: 'LOW' };
  return { bg: T.teal + '22', text: T.teal, label: 'MINIMAL' };
}

const TABS = ['Risk Heatmap', 'Sector Analysis', 'Geographic Analysis', 'Scenario Sensitivity'];

export default function TransitionRiskHeatmapPage() {
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState(1);
  const [selectedSector, setSelectedSector] = useState('Energy');
  const [selectedGeo, setSelectedGeo] = useState('Europe');

  const matrix = riskMatrix(SCENARIOS[scenario], scenario);

  const sectorAvg = SECTORS.map(s => ({ name: s, avg: Math.round(matrix[s].reduce((a, b) => a + b, 0) / GEOS.length) }));
  const geoAvg = GEOS.map((g, gi) => ({ name: g, avg: Math.round(SECTORS.reduce((s, sec) => s + matrix[sec][gi], 0) / SECTORS.length) }));

  const scenarioSensitivity = SECTORS.map(s => ({
    name: s,
    cp:  Math.round(riskMatrix(SCENARIOS[0], 0)[s].reduce((a, b) => a + b, 0) / GEOS.length),
    b2c: Math.round(riskMatrix(SCENARIOS[1], 1)[s].reduce((a, b) => a + b, 0) / GEOS.length),
    nz:  Math.round(riskMatrix(SCENARIOS[2], 2)[s].reduce((a, b) => a + b, 0) / GEOS.length),
  }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CD2 · TRANSITION RISK HEATMAP</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Portfolio Transition Risk Heatmap — Sector × Geography</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              10 GICS Sectors · 5 Geographies · 3 NGFS Scenarios · 50-cell Risk Matrix · Scenario Sensitivity
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SCENARIOS.map((s, i) => (
              <button key={s} onClick={() => setScenario(i)} style={{
                padding: '8px 16px', borderRadius: 8, border: `2px solid ${scenario === i ? T.gold : 'transparent'}`,
                background: scenario === i ? 'rgba(197,169,106,0.15)' : 'rgba(255,255,255,0.08)',
                color: scenario === i ? T.gold : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>Transition Risk Matrix — {SCENARIOS[scenario]}</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 20px' }}>Composite score 0–100. Red ≥75 = Critical · Orange ≥55 = High · Amber ≥35 = Medium · Green ≥20 = Low</p>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'].map((l, i) => {
                  const col = [T.red, T.orange, T.amber, T.green, T.teal][i];
                  return (
                    <div key={l} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: col + '44', border: `1px solid ${col}` }} />
                      <span style={{ fontSize: 11, color: col, fontWeight: 700 }}>{l}</span>
                    </div>
                  );
                })}
              </div>
              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 16px', background: T.navy, color: '#fff', textAlign: 'left', fontSize: 12, width: 140 }}>Sector ↓ / Geo →</th>
                      {GEOS.map(g => <th key={g} style={{ padding: '8px 12px', background: T.navy, color: '#fff', fontSize: 11, textAlign: 'center', minWidth: 120 }}>{g}</th>)}
                      <th style={{ padding: '8px 12px', background: '#0f2a45', color: T.gold, fontSize: 11, textAlign: 'center' }}>Sector Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SECTORS.map(sector => {
                      const avg = Math.round(matrix[sector].reduce((a, b) => a + b) / GEOS.length);
                      const avgStyle = riskColor(avg);
                      return (
                        <tr key={sector}>
                          <td style={{ padding: '10px 16px', background: T.navy + '11', fontWeight: 700, color: T.navy, fontSize: 13, borderBottom: `1px solid ${T.border}` }}>{sector}</td>
                          {matrix[sector].map((val, gi) => {
                            const style = riskColor(val);
                            return (
                              <td key={gi} style={{ padding: '8px 12px', textAlign: 'center', background: style.bg, borderBottom: `1px solid ${T.border}`, borderLeft: `1px solid ${T.border}` }}>
                                <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 16, color: style.text }}>{val}</div>
                                <div style={{ fontSize: 9, color: style.text, textTransform: 'uppercase', letterSpacing: 1 }}>{style.label}</div>
                              </td>
                            );
                          })}
                          <td style={{ padding: '8px 12px', textAlign: 'center', background: avgStyle.bg, borderBottom: `1px solid ${T.border}`, borderLeft: `2px solid ${T.border}` }}>
                            <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 16, color: avgStyle.text }}>{avg}</div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: '#f0ede7' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: T.navy, fontSize: 12, background: '#0f2a45', color: T.gold }}>Geo Avg</td>
                      {GEOS.map((_, gi) => {
                        const avg = Math.round(SECTORS.reduce((s, sec) => s + matrix[sec][gi], 0) / SECTORS.length);
                        const style = riskColor(avg);
                        return (
                          <td key={gi} style={{ padding: '8px 12px', textAlign: 'center', background: style.bg, borderTop: '2px solid ' + T.border }}>
                            <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 15, color: style.text }}>{avg}</div>
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px 12px' }} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Sector Average Risk — {SCENARIOS[scenario]}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sectorAvg.sort((a, b) => b.avg - a.avg)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}`, 'Risk Score']} />
                  <Bar dataKey="avg" name="Avg Risk" radius={[6,6,0,0]}>
                    {sectorAvg.sort((a, b) => b.avg - a.avg).map((e, i) => <Cell key={i} fill={riskColor(e.avg).text} />)}
                  </Bar>
                  <ReferenceLine y={55} stroke={T.orange} strokeDasharray="4 4" label={{ value: 'High threshold', fill: T.orange, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Geographic Risk Distribution — {SCENARIOS[scenario]}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={geoAvg}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}`, 'Avg Risk']} />
                  <Bar dataKey="avg" name="Avg Risk Score" radius={[6,6,0,0]}>
                    {geoAvg.map((e, i) => <Cell key={i} fill={riskColor(e.avg).text} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Scenario Sensitivity — Risk Score by Sector × Scenario</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={scenarioSensitivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={55} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cp" name="Current Policies" fill={T.red} opacity={0.7} />
                  <Bar dataKey="b2c" name="Below 2°C" fill={T.amber} opacity={0.8} />
                  <Bar dataKey="nz" name="Net Zero 2050" fill={T.green} opacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ color: T.textSec, fontSize: 12, marginTop: 12 }}>
                Note: Under Net Zero 2050, transition risk scores are higher for carbon-intensive sectors because the <em>speed</em> of transition creates disruption risk even for sectors that ultimately benefit (e.g. Utilities must accelerate capex rapidly).
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
