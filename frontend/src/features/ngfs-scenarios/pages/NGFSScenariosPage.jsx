import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area, ResponsiveContainer,
} from 'recharts';
import { NGFS_PHASE4, CARBON_PRICE_PATHS, SECTOR_PD_UPLIFT } from '../../../services/climateRiskDataService';
import { COUNTRY_EMISSIONS_2022, WORLD_CO2_TREND, DATASET_METADATA } from '../../../data/countryEmissions';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const ACCENT = '#6366f1';

const CAT_COLORS = { Orderly: T.sage, Disorderly: T.amber, 'Hot House World': T.red };
const TABS = [
  'Phase IV Overview', 'Carbon Price Pathways', 'Sector PD Migration',
  'Financial Stability', 'Scenario Comparison', 'Regulatory Alignment',
];

const pill = (label, color) => (
  <span style={{
    fontSize: 10, fontWeight: 700, color, background: `${color}22`,
    border: `1px solid ${color}55`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap',
  }}>{label}</span>
);

const card = (children, extra = {}) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: 16, ...extra,
  }}>{children}</div>
);

const Stat = ({ label, value, sub }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{value}</div>
    <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut }}>{sub}</div>}
  </div>
);

const MiniBar = ({ value, max, color }) => (
  <div style={{ background: T.border, borderRadius: 3, height: 6, width: '100%', overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color, height: '100%', borderRadius: 3 }} />
  </div>
);

// ---------------------------------------------------------------------------
// Tab 1 — NGFS Phase IV Overview
// ---------------------------------------------------------------------------
function Tab1() {
  const [sel, setSel] = useState(NGFS_PHASE4[0].id);
  const active = NGFS_PHASE4.find(s => s.id === sel);
  const chartData = NGFS_PHASE4.map(s => ({
    name: s.name.replace('Net Zero ', 'NZ ').replace('Low Energy', 'LED').replace('Below ', '<').replace('Delayed Transition', 'Delayed').replace('Divergent Net Zero', 'Div. NZ').replace('Current Policies', 'Cur. Pol.'),
    transition: s.transitionRisk,
    physical: s.physicalRisk,
    color: s.color,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🌐</span>
        <span style={{ fontWeight: 700, color: ACCENT }}>NGFS Phase IV — Nov 2023 · 6 Updated Scenarios</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: T.textSec }}>Source: Network for Greening the Financial System</span>
      </div>

      {/* Real Data provenance badge */}
      <div style={{ background: `${T.green}15`, border: `1px solid ${T.green}55`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>✓ Country emissions: OWID / IEA / EDGAR 2022</span>
        <span style={{ fontSize: 11, color: T.textSec }}>
          Real data · {COUNTRY_EMISSIONS_2022.length} countries · World total {WORLD_CO2_TREND[WORLD_CO2_TREND.length - 1].totalMtCO2.toLocaleString()} MtCO₂ (2022)
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textMut }}>
          {DATASET_METADATA.primarySource} · {DATASET_METADATA.license}
        </span>
      </div>

      {/* Global emissions trend (real OWID/IEA data) */}
      {card(
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>Global CO₂ Emissions Trend 1990–2022 (MtCO₂)</div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>Fossil fuels + industry · Source: OWID / IEA / EDGAR · CC BY 4.0</div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.red }}>37,500</div>
                <div style={{ fontSize: 10, color: T.textMut }}>MtCO₂ in 2022</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.amber }}>+65%</div>
                <div style={{ fontSize: 10, color: T.textMut }}>since 1990</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.sage }}>4.7</div>
                <div style={{ fontSize: 10, color: T.textMut }}>t per person 2022</div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={WORLD_CO2_TREND} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.red} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={T.red} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 10 }} />
              <YAxis domain={[20000, 42000]} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: T.textMut, fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}
                formatter={(v, n) => [n === 'totalMtCO2' ? `${v.toLocaleString()} MtCO₂` : `${v} t/person`, n === 'totalMtCO2' ? 'Total emissions' : 'Per capita']}
                labelStyle={{ color: T.text, fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="totalMtCO2" name="totalMtCO2" stroke={T.red} fill="url(#co2Grad)" strokeWidth={2} dot={{ r: 3, fill: T.red }} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Top emitters mini-table */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, color: T.textSec, fontSize: 12, marginBottom: 8 }}>Top 10 Emitters 2022 (real IEA/EDGAR data)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {COUNTRY_EMISSIONS_2022.slice(0, 10).map((c, i) => (
                <div key={c.iso3} style={{ background: T.surfaceH, borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: T.textMut }}>{i + 1}. {c.country}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: i < 3 ? T.red : i < 6 ? T.amber : T.text }}>
                    {c.totalMtCO2.toLocaleString()} Mt
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut }}>{c.shareOfWorld}% of world</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scenario cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {NGFS_PHASE4.map(s => {
          const isActive = s.id === sel;
          const catCol = CAT_COLORS[s.category] || T.textSec;
          return (
            <div key={s.id} onClick={() => setSel(s.id)} style={{
              background: isActive ? `${s.color}18` : T.surface,
              border: `2px solid ${isActive ? s.color : T.border}`,
              borderRadius: 8, padding: 14, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 13, flex: 1 }}>{s.name}</div>
                {pill(s.category, catCol)}
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.textMut }}>Temp 2100</div>
                  <div style={{ fontWeight: 700, color: s.color, fontSize: 15 }}>{s.temp}°C</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMut }}>Carbon 2030</div>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>${s.carbonPrice2030}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMut }}>GDP 2050</div>
                  <div style={{ fontWeight: 700, color: T.red, fontSize: 15 }}>{s.gdpImpact2050}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: T.textMut }}>Transition Risk</span>
                    <span style={{ fontSize: 10, color: T.amber, fontWeight: 600 }}>{s.transitionRisk}/10</span>
                  </div>
                  <MiniBar value={s.transitionRisk} max={10} color={T.amber} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: T.textMut }}>Physical Risk</span>
                    <span style={{ fontSize: 10, color: T.red, fontWeight: 600 }}>{s.physicalRisk}/10</span>
                  </div>
                  <MiniBar value={s.physicalRisk} max={10} color={T.red} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel for selected */}
      {active && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {card(
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: active.color }} />
                <span style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>{active.name} — Detail</span>
              </div>
              <p style={{ color: T.textSec, fontSize: 13, lineHeight: 1.6, margin: '0 0 12px' }}>{active.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Stat label="Unemployment Peak" value={`${active.unemploymentPeak}%`} />
                <Stat label="Property Price Drop" value={`${active.propertyPriceDrop}%`} />
                <Stat label="Sovereign Spread" value={`${active.sovereignSpread} bps`} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
                <Stat label="Stranded Assets 2050" value={`$${active.stranded2050}T`} />
                <Stat label="Carbon Price 2050" value={`$${active.carbonPrice2050}/tCO₂`} />
              </div>
            </div>
          )}
          {card(
            <div>
              <div style={{ fontWeight: 700, color: T.text, marginBottom: 12, fontSize: 13 }}>Transition vs Physical Risk — All Scenarios</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 9 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: T.textMut, fontSize: 9 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }} labelStyle={{ color: T.text }} itemStyle={{ color: T.textSec }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="transition" name="Transition Risk" fill={T.amber} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="physical" name="Physical Risk" fill={T.red} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Carbon Price Pathways
// ---------------------------------------------------------------------------
function Tab2() {
  const priceLevelColor = v => v >= 500 ? T.red : v >= 200 ? T.amber : v >= 50 ? T.teal : T.textMut;
  const years = CARBON_PRICE_PATHS.map(r => r.year);

  const policyCards = [
    { range: '$0–$50/tCO₂', meaning: 'Marginal impact on corporate carbon costs. Small capex nudge only.', icon: '🟢' },
    { range: '$50–$300/tCO₂', meaning: 'Material cost pressure for high-emitting sectors. Drives fuel-switch decisions.', icon: '🟡' },
    { range: '$300–$900/tCO₂', meaning: 'Transformative price signal. Accelerates stranded asset risk in fossil fuel value chains.', icon: '🔴' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {card(<Stat label="Highest 2050 Price" value="$850/tCO₂" sub="Low Energy Demand" />)}
        {card(<Stat label="Lowest 2050 Price" value="$25/tCO₂" sub="Current Policies" />)}
        {card(<Stat label="2050 Spread" value="$825/tCO₂" sub="DNZ–CP range" />)}
      </div>

      {/* Line chart */}
      {card(
        <div>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 14, fontSize: 13 }}>Carbon Price Trajectories 2025–2050 ($/tCO₂)</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={CARBON_PRICE_PATHS} margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill: T.textMut, fontSize: 11 }} />
              <YAxis domain={[0, 900]} tick={{ fill: T.textMut, fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }} formatter={(v, n) => [`$${v}/tCO₂`, n]} labelStyle={{ color: T.text }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {NGFS_PHASE4.map(s => (
                <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full price matrix table */}
      {card(
        <div>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 12, fontSize: 13 }}>Carbon Price Matrix — 6 Scenarios × 6 Years</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 10px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>Year</th>
                  {NGFS_PHASE4.map(s => (
                    <th key={s.id} style={{ padding: '6px 10px', textAlign: 'right', color: s.color, borderBottom: `1px solid ${T.border}` }}>{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CARBON_PRICE_PATHS.map((row) => (
                  <tr key={row.year} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '6px 10px', color: T.textSec, fontWeight: 600 }}>{row.year}</td>
                    {NGFS_PHASE4.map(s => {
                      const v = row[s.id];
                      return (
                        <td key={s.id} style={{ padding: '6px 10px', textAlign: 'right', color: priceLevelColor(v), fontWeight: v >= 300 ? 700 : 400 }}>
                          ${v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Policy implication cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {policyCards.map((c, i) => card(
          <div key={i}>
            <div style={{ fontSize: 16, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 6 }}>{c.range}</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{c.meaning}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Sector PD Migration
// ---------------------------------------------------------------------------
function Tab3() {
  const [activeSid, setActiveSid] = useState('nz2050');
  const activeScen = NGFS_PHASE4.find(s => s.id === activeSid);

  const sorted = [...SECTOR_PD_UPLIFT].sort((a, b) => (b[activeSid] || 0) - (a[activeSid] || 0));
  const chartData = sorted.map(r => ({ sector: r.sector.length > 16 ? r.sector.slice(0, 14) + '…' : r.sector, uplift: r[activeSid] || 0 }));
  const cellColor = v => v > 600 ? T.red : v > 300 ? T.amber : v >= 0 ? T.sage : T.teal;

  const maxUplift = Math.max(...SECTOR_PD_UPLIFT.map(r => r[activeSid] || 0));
  const avgUplift = Math.round(SECTOR_PD_UPLIFT.reduce((a, r) => a + (r[activeSid] || 0), 0) / SECTOR_PD_UPLIFT.length);
  const negCount = SECTOR_PD_UPLIFT.filter(r => (r[activeSid] || 0) < 0).length;

  const colLevColor = v => v > 600 ? `${T.red}33` : v > 300 ? `${T.amber}33` : v >= 0 ? `${T.sage}22` : `${T.teal}22`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {NGFS_PHASE4.map(s => (
          <button key={s.id} onClick={() => setActiveSid(s.id)} style={{
            padding: '6px 14px', borderRadius: 6, border: `1.5px solid ${activeSid === s.id ? s.color : T.border}`,
            background: activeSid === s.id ? `${s.color}22` : T.surface,
            color: activeSid === s.id ? s.color : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>{s.name}</button>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {card(<Stat label="Max Sector PD Uplift" value={`${maxUplift} bps`} sub="Coal Mining" />)}
        {card(<Stat label="Avg Sector Uplift" value={`${avgUplift} bps`} />)}
        {card(<Stat label="Sectors w/ Negative Uplift" value={negCount} sub="Renewables benefit" />)}
      </div>

      {/* Bar chart */}
      {card(
        <div>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 12, fontSize: 13 }}>
            PD Uplift (bps) by Sector — <span style={{ color: activeScen?.color }}>{activeScen?.name}</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 120, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: T.textMut, fontSize: 10 }} />
              <YAxis type="category" dataKey="sector" tick={{ fill: T.textSec, fontSize: 10 }} width={115} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }} formatter={v => [`${v} bps`]} labelStyle={{ color: T.text }} />
              <Bar dataKey="uplift" name="PD Uplift (bps)" radius={[0, 3, 3, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={cellColor(d.uplift)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full matrix table */}
      {card(
        <div>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 12, fontSize: 13 }}>Full PD Uplift Matrix — 20 Sectors × 6 Scenarios (bps)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ padding: '5px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>Sector</th>
                  {NGFS_PHASE4.map(s => (
                    <th key={s.id} style={{ padding: '5px 8px', textAlign: 'right', color: s.color, borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{s.name.replace('Net Zero 2050', 'NZ2050').replace('Low Energy Demand', 'LED').replace('Below 2°C', 'B2C').replace('Delayed Transition', 'Delayed').replace('Divergent Net Zero', 'Div NZ').replace('Current Policies', 'Cur. Pol.')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTOR_PD_UPLIFT.map((row) => (
                  <tr key={row.sector} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '5px 8px', color: T.textSec, whiteSpace: 'nowrap' }}>{row.sector}</td>
                    {NGFS_PHASE4.map(s => {
                      const v = row[s.id];
                      return (
                        <td key={s.id} style={{ padding: '5px 8px', textAlign: 'right', background: colLevColor(v), color: cellColor(v), fontWeight: v > 500 ? 700 : 400 }}>
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Financial Stability Transmission
// ---------------------------------------------------------------------------
function Tab4() {
  // 5 transmission channels
  const channels = [
    {
      name: 'Carbon Price Channel',
      desc: 'Corporate cost increase from carbon pricing',
      values: NGFS_PHASE4.map(s => ({ id: s.id, name: s.name, value: `+${(s.carbonPrice2030 * 0.04).toFixed(1)}%` })),
    },
    {
      name: 'Asset Stranding',
      desc: 'Stranded fossil fuel assets by 2050',
      values: NGFS_PHASE4.map(s => ({ id: s.id, name: s.name, value: `$${s.stranded2050}T` })),
    },
    {
      name: 'Physical Damage',
      desc: 'GDP loss from physical climate risk',
      values: NGFS_PHASE4.map(s => ({ id: s.id, name: s.name, value: s.physicalRisk > 6 ? `${(s.gdpImpact2050 * 0.6).toFixed(1)}%` : 'Contained' })),
    },
    {
      name: 'Macro / GDP Shock',
      desc: 'Overall GDP impact by 2050',
      values: NGFS_PHASE4.map(s => ({ id: s.id, name: s.name, value: `${s.gdpImpact2050}%` })),
    },
    {
      name: 'Property Market',
      desc: 'Residential/commercial price drop',
      values: NGFS_PHASE4.map(s => ({ id: s.id, name: s.name, value: `${s.propertyPriceDrop}%` })),
    },
  ];

  const spreadData = NGFS_PHASE4.map(s => ({ name: s.name.replace('Net Zero 2050', 'NZ2050').replace('Low Energy Demand', 'LED').replace('Below 2°C', 'B2C').replace('Delayed Transition', 'Delayed').replace('Divergent Net Zero', 'Div NZ').replace('Current Policies', 'Cur. Pol.'), spread: s.sovereignSpread, color: s.color }));

  // 24-month FSI trend (seeded)
  const fsiData = Array.from({ length: 24 }, (_, i) => ({
    month: `M${i + 1}`,
    fsi: +(65 + sr(i * 7) * 20 - (i > 12 ? sr(i * 3) * 15 : 0)).toFixed(1),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Transmission channels table */}
      {card(
        <div>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 12, fontSize: 13 }}>Transmission Channels — Impact by NGFS Scenario</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '7px 10px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>Channel</th>
                  {NGFS_PHASE4.map(s => (
                    <th key={s.id} style={{ padding: '7px 10px', textAlign: 'center', color: s.color, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{s.name.split(' ').slice(0, 2).join(' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {channels.map((ch, ci) => (
                  <tr key={ci} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ fontWeight: 600, color: T.text, fontSize: 12 }}>{ch.name}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>{ch.desc}</div>
                    </td>
                    {ch.values.map(v => (
                      <td key={v.id} style={{ padding: '7px 10px', textAlign: 'center', color: T.textSec, fontWeight: 500, fontSize: 12 }}>{v.value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Sovereign spread chart */}
        {card(
          <div>
            <div style={{ fontWeight: 700, color: T.text, marginBottom: 12, fontSize: 13 }}>Sovereign Spread Widening (bps) by Scenario</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={spreadData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 9 }} />
                <YAxis tick={{ fill: T.textMut, fontSize: 9 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }} formatter={v => [`${v} bps`]} labelStyle={{ color: T.text }} />
                <Bar dataKey="spread" name="Sovereign Spread (bps)" radius={[3, 3, 0, 0]}>
                  {spreadData.map((d, i) => (
                    <Cell key={i} fill={d.spread > 100 ? T.red : d.spread > 40 ? T.amber : T.sage} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 24-month FSI trend */}
        {card(
          <div>
            <div style={{ fontWeight: 700, color: T.text, marginBottom: 12, fontSize: 13 }}>Financial Stability Index — 24-Month Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={fsiData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fsiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill: T.textMut, fontSize: 9 }} interval={5} />
                <YAxis domain={[40, 100]} tick={{ fill: T.textMut, fontSize: 9 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }} labelStyle={{ color: T.text }} />
                <Area type="monotone" dataKey="fsi" name="FSI Score" stroke={ACCENT} fill="url(#fsiGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — Scenario Comparison Builder
// ---------------------------------------------------------------------------
function Tab5() {
  const [selected, setSelected] = useState(['nz2050', 'dt', 'cp']);

  const toggle = id => {
    setSelected(prev => prev.includes(id)
      ? prev.filter(x => x !== id)
      : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const params = [
    { key: 'temp', label: 'Temperature 2100 (°C)', fmt: v => `${v}°C` },
    { key: 'carbonPrice2030', label: 'Carbon Price 2030 ($/tCO₂)', fmt: v => `$${v}` },
    { key: 'carbonPrice2050', label: 'Carbon Price 2050 ($/tCO₂)', fmt: v => `$${v}` },
    { key: 'gdpImpact2050', label: 'GDP Impact 2050 (%)', fmt: v => `${v}%` },
    { key: 'physicalRisk', label: 'Physical Risk Score (/10)', fmt: v => `${v}/10` },
    { key: 'transitionRisk', label: 'Transition Risk Score (/10)', fmt: v => `${v}/10` },
    { key: 'renewableShare2050', label: 'Renewable Share 2050 (%)', fmt: v => `${v}%` },
    { key: 'coalShare2050', label: 'Coal Share 2050 (%)', fmt: v => `${v}%` },
    { key: 'stranded2050', label: 'Stranded Assets 2050 ($T)', fmt: v => `$${v}T` },
    { key: 'unemploymentPeak', label: 'Unemployment Peak (%)', fmt: v => `${v}%` },
    { key: 'propertyPriceDrop', label: 'Property Price Drop (%)', fmt: v => `${v}%` },
    { key: 'sovereignSpread', label: 'Sovereign Spread (bps)', fmt: v => `${v} bps` },
  ];

  const selScens = NGFS_PHASE4.filter(s => selected.includes(s.id));
  const diverges = (key) => {
    if (selScens.length < 2) return false;
    const vals = selScens.map(s => Math.abs(s[key]));
    const mn = Math.min(...vals), mx = Math.max(...vals);
    return mn > 0 && (mx - mn) / mn > 0.5;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Checkboxes */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: T.textSec, fontSize: 12, fontWeight: 600 }}>Select up to 3 scenarios:</span>
        {NGFS_PHASE4.map(s => {
          const on = selected.includes(s.id);
          return (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: on ? s.color : T.textSec }}>
              <input type="checkbox" checked={on} onChange={() => toggle(s.id)} style={{ accentColor: s.color }} />
              {s.name}
            </label>
          );
        })}
      </div>

      {/* Comparison table */}
      {selScens.length > 0 && card(
        <div>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 12, fontSize: 13 }}>Side-by-Side Comparison</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '7px 10px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>Parameter</th>
                  {selScens.map(s => (
                    <th key={s.id} style={{ padding: '7px 10px', textAlign: 'center', color: s.color, borderBottom: `1px solid ${T.border}` }}>{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {params.map(p => {
                  const isDivergent = diverges(p.key);
                  return (
                    <tr key={p.key} style={{ borderBottom: `1px solid ${T.border}22`, background: isDivergent ? `${T.amber}12` : 'transparent' }}>
                      <td style={{ padding: '6px 10px', color: isDivergent ? T.amber : T.textSec, fontWeight: isDivergent ? 600 : 400 }}>
                        {p.label} {isDivergent && <span style={{ fontSize: 9, background: `${T.amber}33`, color: T.amber, borderRadius: 3, padding: '1px 4px', marginLeft: 4 }}>DIVERGES</span>}
                      </td>
                      {selScens.map(s => (
                        <td key={s.id} style={{ padding: '6px 10px', textAlign: 'center', color: T.text, fontWeight: 500 }}>{p.fmt(s[p.key])}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {card(<div><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Most Benign</div><div style={{ fontWeight: 700, color: T.sage, fontSize: 14 }}>Net Zero 2050</div><div style={{ fontSize: 11, color: T.textSec }}>Lowest physical + GDP impact</div></div>)}
        {card(<div><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Most Severe (Transition)</div><div style={{ fontWeight: 700, color: T.amber, fontSize: 14 }}>Delayed Transition</div><div style={{ fontSize: 11, color: T.textSec }}>Highest unemployment peak 4.5%</div></div>)}
        {card(<div><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Most Severe (Physical)</div><div style={{ fontWeight: 700, color: T.red, fontSize: 14 }}>Current Policies</div><div style={{ fontSize: 11, color: T.textSec }}>Physical risk 8.9/10, GDP -10.4%</div></div>)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 6 — Regulatory Alignment
// ---------------------------------------------------------------------------
function Tab6() {
  const frameworks = [
    {
      name: 'ECB Climate Stress Test 2022',
      region: 'Eurozone',
      scenarios: ['Net Zero 2050', 'Delayed Transition', 'Current Policies'],
      ngfsCount: 3,
      vintage: 'NGFS Phase III',
      nextTest: 'Q4 2025',
      desc: 'Tests Orderly, Disorderly and Hot House World pathways across 4M+ firms.',
    },
    {
      name: 'EBA Pillar 2 NGFS',
      region: 'EU Banking',
      scenarios: ['Net Zero 2050', 'Below 2°C', 'Low Energy Demand', 'Delayed Transition', 'Divergent Net Zero', 'Current Policies'],
      ngfsCount: 6,
      vintage: 'NGFS Phase IV',
      nextTest: 'Q2 2026',
      desc: 'Full Phase IV suite required for IRRBB climate sensitivity analysis.',
    },
    {
      name: 'BoE CBES 2021',
      region: 'UK',
      scenarios: ['Early Action', 'Late Action', 'No Additional Action'],
      ngfsCount: 2,
      vintage: 'NGFS Phase II (aligned)',
      nextTest: 'Q3 2025',
      desc: 'Biennial exploratory scenario: maps to Orderly + Hot House World.',
    },
    {
      name: 'APRA Climate Vulnerability Assessment',
      region: 'Australia',
      scenarios: ['Net Zero 2050', 'Current Policies'],
      ngfsCount: 2,
      vintage: 'NGFS Phase III',
      nextTest: 'Q1 2026',
      desc: 'Two-scenario framework covering transition and physical risk extremes.',
    },
    {
      name: 'MAS Climate Stress Test',
      region: 'Singapore',
      scenarios: ['Delayed Transition', 'Current Policies'],
      ngfsCount: 2,
      vintage: 'NGFS Phase III',
      nextTest: 'Q2 2026',
      desc: 'Focuses on Disorderly transition and Hot House tail risk for APAC banking.',
    },
    {
      name: 'ISSB S2 / TCFD',
      region: 'Global',
      scenarios: ['Below 2°C', 'Current Policies'],
      ngfsCount: 2,
      vintage: 'NGFS Phase IV (recommended)',
      nextTest: 'Annual (31 Dec)',
      desc: 'Requires minimum 2°C scenario + current policies for IFRS S2 disclosure.',
    },
  ];

  const coverageData = frameworks.map(f => ({ name: f.name.split(' ').slice(0, 2).join(' '), count: f.ngfsCount }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Framework cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {frameworks.map((f, fi) => (
          <div key={fi} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: T.textMut }}>{f.region} · {f.vintage}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: T.textMut }}>Next Test</div>
                <div style={{ fontWeight: 700, color: T.teal, fontSize: 12 }}>{f.nextTest}</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, margin: '0 0 10px' }}>{f.desc}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {f.scenarios.map((sc, si) => {
                const matched = NGFS_PHASE4.find(n => n.name === sc);
                return (
                  <span key={si} style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600,
                    background: matched ? `${matched.color}22` : `${T.border}`,
                    color: matched ? matched.color : T.textMut,
                    border: `1px solid ${matched ? matched.color + '55' : T.border}`,
                  }}>{sc}</span>
                );
              })}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 11, color: T.textMut }}>Phase IV coverage:</div>
              <div style={{ fontWeight: 700, color: f.ngfsCount === 6 ? T.sage : f.ngfsCount >= 3 ? T.amber : T.textSec }}>
                {f.ngfsCount}/6 scenarios
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coverage chart */}
      {card(
        <div>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 12, fontSize: 13 }}>NGFS Phase IV Scenario Coverage per Regulatory Framework</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={coverageData} margin={{ top: 0, right: 20, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis domain={[0, 6]} ticks={[0, 2, 4, 6]} tick={{ fill: T.textMut, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }} formatter={v => [`${v} / 6 scenarios`]} labelStyle={{ color: T.text }} />
              <Bar dataKey="count" name="Scenarios Covered" radius={[4, 4, 0, 0]}>
                {coverageData.map((d, i) => (
                  <Cell key={i} fill={d.count === 6 ? T.sage : d.count >= 3 ? T.amber : T.textMut} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
export default function NGFSScenariosPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '24px 28px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>NGFS Scenario Analysis</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Phase IV · November 2023 · 6 Scenarios · Climate Finance Architecture</div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '7px 16px', borderRadius: 6, border: `1.5px solid ${tab === i ? ACCENT : T.border}`,
            background: tab === i ? `${ACCENT}22` : T.surface,
            color: tab === i ? ACCENT : T.textSec, fontSize: 12, fontWeight: tab === i ? 700 : 500, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <Tab1 />}
      {tab === 1 && <Tab2 />}
      {tab === 2 && <Tab3 />}
      {tab === 3 && <Tab4 />}
      {tab === 4 && <Tab5 />}
      {tab === 5 && <Tab6 />}
    </div>
  );
}
