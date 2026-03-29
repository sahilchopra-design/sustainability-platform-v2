import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const PURPLE = '#7c3aed';
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const SYSTEMIC_NODES = [
  { name: 'GlobalBank Group',       type: 'Bank',          aum: 6800, esgScore: 58, climateVar: 12.4, sectorConcentration: 34, interconnectedness: 92, systemicRisk: 'Critical' },
  { name: 'Atlantic Insurance Co',  type: 'Insurer',       aum: 3200, esgScore: 64, climateVar: 9.1,  sectorConcentration: 28, interconnectedness: 74, systemicRisk: 'High'     },
  { name: 'Meridian Asset Mgmt',    type: 'Asset Manager', aum: 5400, esgScore: 71, climateVar: 7.8,  sectorConcentration: 22, interconnectedness: 81, systemicRisk: 'High'     },
  { name: 'Pacific Capital Bank',   type: 'Bank',          aum: 4100, esgScore: 55, climateVar: 14.2, sectorConcentration: 41, interconnectedness: 88, systemicRisk: 'Critical' },
  { name: 'Vanguard Reinsurance',   type: 'Insurer',       aum: 2700, esgScore: 67, climateVar: 8.6,  sectorConcentration: 31, interconnectedness: 63, systemicRisk: 'Medium'   },
  { name: 'NordInvest Partners',    type: 'Asset Manager', aum: 3900, esgScore: 78, climateVar: 5.3,  sectorConcentration: 18, interconnectedness: 57, systemicRisk: 'Medium'   },
  { name: 'Equatorial Bank',        type: 'Bank',          aum: 5100, esgScore: 52, climateVar: 16.7, sectorConcentration: 47, interconnectedness: 95, systemicRisk: 'Critical' },
  { name: 'Sovereign Wealth Fund',  type: 'Asset Manager', aum: 8200, esgScore: 69, climateVar: 6.9,  sectorConcentration: 15, interconnectedness: 49, systemicRisk: 'Low'      },
  { name: 'Continental Life Group', type: 'Insurer',       aum: 4600, esgScore: 61, climateVar: 10.5, sectorConcentration: 36, interconnectedness: 77, systemicRisk: 'High'     },
  { name: 'Apex Credit Union',      type: 'Bank',          aum: 3200, esgScore: 73, climateVar: 7.2,  sectorConcentration: 25, interconnectedness: 58, systemicRisk: 'Medium'   },
];

const SECTOR_CONCENTRATION = [
  { sector: 'Fossil Fuels',      weight: 18.4, taxonomyAlign: 4,  transitionRisk: 87 },
  { sector: 'Real Estate',       weight: 14.2, taxonomyAlign: 31, transitionRisk: 54 },
  { sector: 'Utilities',         weight: 12.8, taxonomyAlign: 48, transitionRisk: 61 },
  { sector: 'Industrials',       weight: 11.5, taxonomyAlign: 22, transitionRisk: 69 },
  { sector: 'Transportation',    weight: 9.7,  taxonomyAlign: 17, transitionRisk: 73 },
  { sector: 'Agriculture',       weight: 8.3,  taxonomyAlign: 35, transitionRisk: 58 },
  { sector: 'Technology',        weight: 14.6, taxonomyAlign: 62, transitionRisk: 28 },
  { sector: 'Healthcare',        weight: 10.5, taxonomyAlign: 55, transitionRisk: 22 },
];

const CONTAGION_SCENARIOS = [
  { scenario: 'Orderly Transition',       probability: 28, portfolioLoss: 8.2,  creditImpact: 3.1, liquidityStress: 12, timeHorizon: '2030' },
  { scenario: 'Disorderly Transition',    probability: 35, portfolioLoss: 21.7, creditImpact: 9.4, liquidityStress: 31, timeHorizon: '2027' },
  { scenario: 'Hot House World',          probability: 22, portfolioLoss: 34.5, creditImpact: 16.8,liquidityStress: 48, timeHorizon: '2035' },
  { scenario: 'Too Little Too Late',      probability: 15, portfolioLoss: 28.1, creditImpact: 12.3,liquidityStress: 39, timeHorizon: '2032' },
];

const FRAGILITY_TREND = [
  { month: 'Oct 24', index: 53, climate: 21, credit: 18, liquidity: 14 },
  { month: 'Nov 24', index: 55, climate: 22, credit: 19, liquidity: 14 },
  { month: 'Dec 24', index: 57, climate: 23, credit: 20, liquidity: 14 },
  { month: 'Jan 25', index: 54, climate: 22, credit: 18, liquidity: 14 },
  { month: 'Feb 25', index: 59, climate: 24, credit: 21, liquidity: 14 },
  { month: 'Mar 25', index: 62, climate: 25, credit: 22, liquidity: 15 },
  { month: 'Apr 25', index: 60, climate: 24, credit: 21, liquidity: 15 },
  { month: 'May 25', index: 64, climate: 26, credit: 23, liquidity: 15 },
  { month: 'Jun 25', index: 67, climate: 27, credit: 24, liquidity: 16 },
  { month: 'Jul 25', index: 65, climate: 26, credit: 24, liquidity: 15 },
  { month: 'Aug 25', index: 70, climate: 28, credit: 26, liquidity: 16 },
  { month: 'Sep 25', index: 72, climate: 29, credit: 27, liquidity: 16 },
  { month: 'Oct 25', index: 69, climate: 28, credit: 26, liquidity: 15 },
  { month: 'Nov 25', index: 74, climate: 30, credit: 28, liquidity: 16 },
  { month: 'Dec 25', index: 76, climate: 31, credit: 29, liquidity: 16 },
  { month: 'Jan 26', index: 73, climate: 30, credit: 28, liquidity: 15 },
  { month: 'Feb 26', index: 79, climate: 32, credit: 30, liquidity: 17 },
  { month: 'Mar 26', index: 82, climate: 34, credit: 31, liquidity: 17 },
];

const REGULATORY_EXPOSURE = [
  { regulation: 'SFDR Article 8/9',         status: 'Compliant',     capitalImpact: 0.4,  implementDate: 'Jan 2023', scope: 'EU' },
  { regulation: 'Basel IV Climate Pillar 2', status: 'In Progress',   capitalImpact: 2.8,  implementDate: 'Jan 2026', scope: 'Global' },
  { regulation: 'CSRD Reporting',            status: 'In Progress',   capitalImpact: 0.6,  implementDate: 'Jan 2025', scope: 'EU' },
  { regulation: 'TCFD Mandatory Disclosure', status: 'Compliant',     capitalImpact: 0.2,  implementDate: 'Apr 2022', scope: 'UK/US' },
  { regulation: 'EU Taxonomy Alignment',     status: 'Partial',       capitalImpact: 1.4,  implementDate: 'Jan 2024', scope: 'EU' },
  { regulation: 'Nature Risk Disclosure',    status: 'Not Started',   capitalImpact: 3.2,  implementDate: 'Jan 2027', scope: 'Global' },
];

const RISK_COLOR = { Critical: T.red, High: T.amber, Medium: PURPLE, Low: T.green };
const STATUS_COLOR = { Compliant: T.green, 'In Progress': T.amber, Partial: PURPLE, 'Not Started': T.red };

const STAT = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', minWidth: 160, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + '18', color, border: `1px solid ${color}40` }}>{text}</span>
);

const InterconnBar = ({ value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ flex: 1, height: 7, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: value >= 85 ? T.red : value >= 70 ? T.amber : PURPLE, borderRadius: 4 }} />
    </div>
    <span style={{ fontSize: 11, color: T.textSec, minWidth: 28, textAlign: 'right' }}>{value}</span>
  </div>
);

const TABS = ['Overview', 'Network Contagion', 'Sector Concentration', 'Systemic Fragility Index', 'Regulatory Exposure'];

export default function SystemicESGRiskPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18 }}>🕸</span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>Systemic ESG Risk Dashboard</div>
            <div style={{ fontSize: 12, color: T.textMut }}>EP-AB1 · Cross-institutional contagion, concentration & fragility monitoring</div>
          </div>
          <div style={{ marginLeft: 'auto', padding: '4px 14px', borderRadius: 20, background: PURPLE + '18', color: PURPLE, fontSize: 12, fontWeight: 700, border: `1px solid ${PURPLE}40` }}>LIVE</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${T.border}`, marginBottom: 28 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, color: tab === i ? PURPLE : T.textSec, background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${PURPLE}` : '2px solid transparent', marginBottom: -2, cursor: 'pointer', transition: 'color 0.15s' }}>{t}</button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 0 && (
        <div>
          {/* Stat Row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <STAT label="Systemically Important Institutions" value="10" sub="Banks, insurers & asset managers" color={PURPLE} />
            <STAT label="Total AUM Monitored" value="$47.2T" sub="Aggregate exposure pool" color={T.navy} />
            <STAT label="Average ESG Score" value="62.4" sub="Weighted by AUM" color={T.amber} />
            <STAT label="Network Density" value="0.68" sub="Interconnectedness index" color={T.red} />
          </div>

          {/* Contagion Scenario Table */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Contagion Scenario Overview</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>NGFS-aligned climate transition scenarios — portfolio impact projections</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Scenario', 'Probability', 'Portfolio Loss %', 'Credit Impact %', 'Liquidity Stress %', 'Time Horizon'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMut, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONTAGION_SCENARIOS.map((s, i) => (
                  <tr key={s.scenario} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.bg : T.surface }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{s.scenario}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{s.probability}%</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: s.portfolioLoss > 25 ? T.red : s.portfolioLoss > 15 ? T.amber : T.green, fontWeight: 700 }}>{s.portfolioLoss}%</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{s.creditImpact}%</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{s.liquidityStress}%</td>
                    <td style={{ padding: '10px 12px', color: T.textMut }}>{s.timeHorizon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fragility Trend Chart */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Systemic Fragility Index — 18-Month Trend</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>Composite score: climate VaR + credit stress + liquidity risk (0–100)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={FRAGILITY_TREND} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textMut }} interval={2} />
                <YAxis domain={[45, 90]} tick={{ fontSize: 10, fill: T.textMut }} />
                <Tooltip contentStyle={tip} />
                <Area type="monotone" dataKey="index" stroke={PURPLE} fill={PURPLE + '22'} strokeWidth={2} name="Fragility Index" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Network Contagion ── */}
      {tab === 1 && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Systemically Important Institutions</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>Ranked by interconnectedness — network contagion exposure</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Institution', 'Type', 'AUM ($B)', 'ESG Score', 'Climate VaR %', 'Interconnectedness', 'Systemic Risk'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMut, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...SYSTEMIC_NODES].sort((a, b) => b.interconnectedness - a.interconnectedness).map((node, i) => (
                  <tr key={node.name} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.bg : T.surface }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{node.name}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{node.type}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{node.aum.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: node.esgScore >= 70 ? T.green : node.esgScore >= 60 ? T.amber : T.red, fontWeight: 700 }}>{node.esgScore}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: node.climateVar > 12 ? T.red : T.textSec }}>{node.climateVar}%</td>
                    <td style={{ padding: '10px 12px', minWidth: 160 }}><InterconnBar value={node.interconnectedness} /></td>
                    <td style={{ padding: '10px 12px' }}><Badge text={node.systemicRisk} color={RISK_COLOR[node.systemicRisk]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scenario Impact Grid */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Scenario Impact Grid</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {CONTAGION_SCENARIOS.map(s => (
                <div key={s.scenario} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{s.scenario}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Probability', val: `${s.probability}%`, color: T.textSec },
                      { label: 'Portfolio Loss', val: `${s.portfolioLoss}%`, color: s.portfolioLoss > 25 ? T.red : T.amber },
                      { label: 'Credit Impact', val: `${s.creditImpact}%`, color: T.amber },
                      { label: 'Liquidity Stress', val: `${s.liquidityStress}%`, color: s.liquidityStress > 35 ? T.red : T.amber },
                      { label: 'Time Horizon', val: s.timeHorizon, color: T.textMut },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: T.textMut }}>{item.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sector Concentration ── */}
      {tab === 2 && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Portfolio Sector Weight Distribution</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>Aggregate AUM allocation across systemically important sectors</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SECTOR_CONCENTRATION} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textMut }} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} unit="%" />
                <Tooltip contentStyle={tip} formatter={(v) => [`${v}%`, 'Portfolio Weight']} />
                <Bar dataKey="weight" radius={[4, 4, 0, 0]} name="Portfolio Weight %">
                  {SECTOR_CONCENTRATION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.transitionRisk > 70 ? T.red : entry.transitionRisk > 50 ? T.amber : PURPLE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
              {[{ label: 'High Transition Risk (>70)', color: T.red }, { label: 'Medium Risk (50–70)', color: T.amber }, { label: 'Lower Risk (<50)', color: PURPLE }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSec }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Taxonomy Alignment Table */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>EU Taxonomy Alignment & Transition Risk</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>Sector-level taxonomy-aligned share vs. transition risk score</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Sector', 'Portfolio Weight', 'EU Taxonomy Alignment', 'Transition Risk Score', 'Risk Band'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMut, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...SECTOR_CONCENTRATION].sort((a, b) => b.transitionRisk - a.transitionRisk).map((sec, i) => (
                  <tr key={sec.sector} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.bg : T.surface }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{sec.sector}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{sec.weight}%</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 7, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${sec.taxonomyAlign}%`, height: '100%', background: sec.taxonomyAlign > 50 ? T.green : sec.taxonomyAlign > 25 ? T.amber : T.red, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11, color: T.textSec }}>{sec.taxonomyAlign}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: sec.transitionRisk > 70 ? T.red : sec.transitionRisk > 50 ? T.amber : T.green, fontWeight: 700 }}>{sec.transitionRisk}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge
                        text={sec.transitionRisk > 70 ? 'High' : sec.transitionRisk > 50 ? 'Medium' : 'Low'}
                        color={sec.transitionRisk > 70 ? T.red : sec.transitionRisk > 50 ? T.amber : T.green}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Systemic Fragility Index ── */}
      {tab === 3 && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Systemic Fragility Index — 18-Month Decomposition</div>
            <div style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>Stacked sub-components: climate VaR · credit stress · liquidity risk</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={FRAGILITY_TREND} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textMut }} interval={1} />
                <YAxis domain={[0, 90]} tick={{ fontSize: 10, fill: T.textMut }} />
                <Tooltip contentStyle={tip} />
                <Area type="monotone" dataKey="climate" stackId="1" stroke={T.red} fill={T.red + '55'} strokeWidth={1.5} name="Climate VaR" />
                <Area type="monotone" dataKey="credit" stackId="1" stroke={T.amber} fill={T.amber + '55'} strokeWidth={1.5} name="Credit Stress" />
                <Area type="monotone" dataKey="liquidity" stackId="1" stroke={PURPLE} fill={PURPLE + '55'} strokeWidth={1.5} name="Liquidity Risk" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, justifyContent: 'center' }}>
              {[{ label: 'Climate VaR', color: T.red }, { label: 'Credit Stress', color: T.amber }, { label: 'Liquidity Risk', color: PURPLE }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSec }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Fragility Decomposition Cards */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Current Fragility Decomposition (Mar 2026)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Composite Fragility Index', value: 82, max: 100, color: T.red, desc: 'Up 9 pts from Oct 2024' },
                { label: 'Climate VaR Component', value: 34, max: 50, color: T.red, desc: '+13 pts YoY increase' },
                { label: 'Credit Stress Component', value: 31, max: 40, color: T.amber, desc: 'Elevated in fossil-heavy sectors' },
                { label: 'Liquidity Risk Component', value: 17, max: 20, color: PURPLE, desc: 'Stable — moderate concern' },
                { label: 'Network Amplification Factor', value: 68, max: 100, color: T.amber, desc: 'Dense cross-institution links' },
                { label: 'Tail Risk Concentration', value: 74, max: 100, color: T.red, desc: '3 Critical institutions drive 61%' },
              ].map(item => (
                <div key={item.label} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.value}</div>
                  <div style={{ height: 6, background: T.surfaceH, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${(item.value / item.max) * 100}%`, height: '100%', background: item.color, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Regulatory Exposure ── */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <STAT label="Compliant Regulations" value="2 / 6" sub="SFDR & TCFD complete" color={T.green} />
            <STAT label="Estimated Capital Impact" value="8.6%" sub="Blended capital buffer required" color={T.red} />
            <STAT label="Upcoming Deadlines" value="3" sub="Within next 24 months" color={T.amber} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {REGULATORY_EXPOSURE.map(reg => (
              <div key={reg.regulation} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{reg.regulation}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{reg.scope} · Implementation: {reg.implementDate}</div>
                  </div>
                  <Badge text={reg.status} color={STATUS_COLOR[reg.status]} />
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, background: T.bg, borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: T.textMut, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Capital Impact</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: reg.capitalImpact >= 2 ? T.red : reg.capitalImpact >= 1 ? T.amber : T.green }}>
                      +{reg.capitalImpact}%
                    </div>
                  </div>
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                    <div style={{ fontSize: 11, color: T.textMut }}>Compliance readiness</div>
                    <div style={{ height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: reg.status === 'Compliant' ? '100%' : reg.status === 'In Progress' ? '55%' : reg.status === 'Partial' ? '30%' : '5%',
                        height: '100%',
                        background: STATUS_COLOR[reg.status],
                        borderRadius: 4,
                        transition: 'width 0.4s'
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec }}>
                      {reg.status === 'Compliant' ? '100%' : reg.status === 'In Progress' ? '55%' : reg.status === 'Partial' ? '30%' : '5%'} complete
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary insight banner */}
          <div style={{ background: PURPLE + '10', border: `1px solid ${PURPLE}30`, borderRadius: 12, padding: 20, marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: PURPLE, marginBottom: 6 }}>Regulatory Action Priority</div>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
              <strong>Nature Risk Disclosure</strong> (Jan 2027) carries the highest capital impact at +3.2% and is currently not started — immediate gap assessment recommended.
              <strong> Basel IV Climate Pillar 2</strong> (Jan 2026) is in progress but requires accelerated implementation given +2.8% capital requirement.
              EU Taxonomy partial alignment (30% complete) should be escalated ahead of mandatory GAR reporting obligations.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
