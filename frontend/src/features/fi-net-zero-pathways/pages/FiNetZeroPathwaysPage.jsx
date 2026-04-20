import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', navyL: '#2a4a6f', gold: '#d4a843', goldL: '#e8c060', sage: '#2d6a4f', sageL: '#3d8a6f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const NZ_ALLIANCES = [
  { name: 'NZBA', full: 'Net-Zero Banking Alliance', members: 143, commitType: 'Portfolio alignment 2030 interim + 2050 net-zero', coverage: 'Loans & investments (Scope 1,2,3)', framework: 'PCAF financed emissions + SBTi sector pathways', signatories: '$74T AUM/AUO', reporting: 'Annual PCAF-aligned disclosure' },
  { name: 'NZAOA', full: 'Net-Zero Asset Owner Alliance', members: 89, commitType: 'Portfolio temperature target ≤1.5°C', coverage: 'Investment portfolio (WACI)', framework: 'Portfolio Decarbonization Coalition methodology', signatories: '$9.5T AUM', reporting: 'Biennial progress reports' },
  { name: 'NZAMI', full: 'Net-Zero Asset Managers Initiative', members: 315, commitType: 'Managed AUM portion aligned to net-zero', coverage: 'Managed assets; client mandate dependent', framework: 'IIGCC Net-Zero Investment Framework', signatories: '$57T AUM', reporting: 'Annual target-setting disclosure' },
  { name: 'PCAF', full: 'Partnership for Carbon Accounting Financials', members: 450, commitType: 'Standardized financed emissions measurement', coverage: 'Loans, bonds, equity, project finance, RE', framework: 'Global GHG Accounting Standard', signatories: '$95T AUM', reporting: 'Annual financed emissions report' },
  { name: 'GFANZ', full: 'Glasgow Financial Alliance for Net Zero', members: 675, commitType: 'Umbrella NZ commitment across all FI types', coverage: 'Banks + AM + AO + insurers + RE', framework: 'Sub-sector specific (NZBA/NZAMI/NZAOA)', signatories: '$130T', reporting: 'Annual transition plan' },
];

const PORTFOLIO_SECTORS = [
  { sector: 'Power Generation', waci: 485, target2030: 230, target2050: 10, tempScore: 2.4, pathwayGap: 255, loanExposure: 18.5, engagement: 'Active', sbtiAligned: false },
  { sector: 'Oil & Gas', waci: 920, target2030: 550, target2050: 50, tempScore: 3.1, pathwayGap: 370, loanExposure: 12.2, engagement: 'Active', sbtiAligned: false },
  { sector: 'Steel', waci: 1840, target2030: 1200, target2050: 180, tempScore: 2.8, pathwayGap: 640, loanExposure: 8.7, engagement: 'Active', sbtiAligned: true },
  { sector: 'Cement', waci: 720, target2030: 500, target2050: 95, tempScore: 2.6, pathwayGap: 220, loanExposure: 6.4, engagement: 'Monitoring', sbtiAligned: false },
  { sector: 'Shipping', waci: 890, target2030: 620, target2050: 100, tempScore: 2.7, pathwayGap: 270, loanExposure: 9.1, engagement: 'Active', sbtiAligned: false },
  { sector: 'Aviation', waci: 650, target2030: 480, target2050: 80, tempScore: 2.9, pathwayGap: 170, loanExposure: 7.8, engagement: 'Monitoring', sbtiAligned: false },
  { sector: 'Real Estate', waci: 42, target2030: 25, target2050: 5, tempScore: 2.2, pathwayGap: 17, loanExposure: 22.4, engagement: 'Active', sbtiAligned: true },
  { sector: 'Automotive', waci: 185, target2030: 95, target2050: 15, tempScore: 2.1, pathwayGap: 90, loanExposure: 11.3, engagement: 'Active', sbtiAligned: true },
];

const ENGAGEMENT_STRATEGY = [
  { strategy: 'Voting Alignment', type: 'Asset Management', effort: 'Low', impact: 'High', timeline: '2024–2025', description: 'Vote against directors at laggard companies; support climate-related resolutions above 25% threshold' },
  { strategy: 'Direct Engagement', type: 'Banking + AM', effort: 'High', impact: 'Very High', timeline: '2024–2030', description: 'Set time-bound decarbonization targets; link loan pricing to science-based milestones' },
  { strategy: 'Escalation Policy', type: 'All FIs', effort: 'Medium', impact: 'High', timeline: '2025–2026', description: '3-stage escalation: dialogue → conditional financing → exit. Applied to 25 highest-impact borrowers' },
  { strategy: 'Divestment (Last Resort)', type: 'Asset Management', effort: 'Low', impact: 'Contested', timeline: 'Trigger-based', description: 'Exit when engagement fails + borrower exceeds emissions threshold over 2-year engagement window' },
  { strategy: 'SBTi Loan Covenant', type: 'Banking', effort: 'Medium', impact: 'High', timeline: '2025–2027', description: 'Include SBTi target submission as loan covenant; interest ratchet tied to annual CDR compliance' },
  { strategy: 'Transition Finance Allocation', type: 'Banking', effort: 'Medium', impact: 'Very High', timeline: '2024–2030', description: 'Dedicated transition finance book for hard-to-abate sectors; EU Taxonomy eligible capex financing' },
];

const INTERIM_TARGETS = [
  { sector: 'Power', baseline2019: 435, target2025: 340, target2030: 230, trajectory2025Pct: -22, trajectory2030Pct: -47 },
  { sector: 'Oil & Gas', baseline2019: 870, target2025: 740, target2030: 550, trajectory2025Pct: -15, trajectory2030Pct: -37 },
  { sector: 'Steel', baseline2019: 1920, target2025: 1650, target2030: 1200, trajectory2025Pct: -14, trajectory2030Pct: -38 },
  { sector: 'Cement', baseline2019: 780, target2025: 680, target2030: 500, trajectory2025Pct: -13, trajectory2030Pct: -36 },
  { sector: 'RE (CRREM 1.5°C)', baseline2019: 55, target2025: 40, target2030: 25, trajectory2025Pct: -27, trajectory2030Pct: -55 },
];

const PCAF_SCORES = [
  { assetClass: 'Listed Equity (S&P 500)', quality: 'DQ1–DQ2', availability: 'High', methodology: 'EVIC attribution: FE = (equity / EVIC) × total GHG', typical: '$2–45 tCO₂e / $M invested' },
  { assetClass: 'Corporate Bonds', quality: 'DQ1–DQ2', availability: 'High', methodology: 'Enterprise value attribution (same as equity)', typical: '$5–85 tCO₂e / $M' },
  { assetClass: 'Business Loans', quality: 'DQ2–DQ3', availability: 'Medium', methodology: 'Revenue / total revenue attribution for S3-limited firms', typical: '$10–400 tCO₂e / $M' },
  { assetClass: 'Project Finance', quality: 'DQ1', availability: 'Very High', methodology: '100% attribution (dedicated asset)', typical: '$0–1,200 tCO₂e / $M' },
  { assetClass: 'Commercial Real Estate', quality: 'DQ1–DQ3', availability: 'Medium', methodology: 'Physical intensity (kgCO₂e/m²) × floor area', typical: '$15–65 kgCO₂e/m²·yr' },
  { assetClass: 'Mortgages', quality: 'DQ1–DQ3', availability: 'Medium-Low', methodology: 'EPC rating → emission factor per property', typical: '$10–45 kgCO₂e/m²·yr' },
  { assetClass: 'Sovereign Bonds', quality: 'DQ2', availability: 'Medium', methodology: 'GDP-based attribution: FE = (bond / GDP) × nat. emissions', typical: '$60–350 tCO₂e / $M' },
];

const PATHWAY_YEARS = [2020, 2025, 2030, 2035, 2040, 2045, 2050];

const TABS = [
  'Overview', 'Alliance Commitments', 'Portfolio Temperature', 'Financed Emissions',
  'Sector Pathways', 'Engagement Strategy', 'PCAF Methodology', 'Interim Targets',
  'Transition Plan', 'FI Benchmark'
];

function calcWaci(loans) {
  const total = loans.reduce((s, l) => s + l.loanExposure, 0);
  return total > 0 ? loans.reduce((s, l) => s + l.waci * l.loanExposure, 0) / total : 0;
}

function calcPortfolioTemp(waci) {
  if (waci < 80) return 1.5;
  if (waci < 150) return 1.7 + (waci - 80) / 70 * 0.3;
  if (waci < 350) return 2.0 + (waci - 150) / 200 * 0.6;
  if (waci < 600) return 2.6 + (waci - 350) / 250 * 0.5;
  return 3.1 + (waci - 600) / 400 * 0.5;
}

export default function FiNetZeroPathwaysPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSectors, setSelectedSectors] = useState(new Set(PORTFOLIO_SECTORS.map(s => s.sector)));
  const [engagementScenario, setEngagementScenario] = useState('engage');
  const [targetYear, setTargetYear] = useState(2030);

  const activeSectors = useMemo(() => PORTFOLIO_SECTORS.filter(s => selectedSectors.has(s.sector)), [selectedSectors]);

  const portfolioWaci = useMemo(() => calcWaci(activeSectors), [activeSectors]);
  const portfolioTemp = useMemo(() => calcPortfolioTemp(portfolioWaci), [portfolioWaci]);

  const totalFinancedEmissions = useMemo(() => {
    return activeSectors.reduce((s, sec) => s + sec.waci * sec.loanExposure / 1000, 0);
  }, [activeSectors]);

  const pathwayData = useMemo(() => PATHWAY_YEARS.map((year, i) => {
    const progress = (year - 2020) / 30;
    const portfolioReduction = engagementScenario === 'engage' ? 0.52 : engagementScenario === 'divest' ? 0.38 : 0.72;
    const currentEmissions = totalFinancedEmissions * Math.max(0.05, 1 - progress * portfolioReduction);
    const parisPath = totalFinancedEmissions * Math.max(0.02, 1 - progress * 0.65);
    const ndc = totalFinancedEmissions * Math.max(0.15, 1 - progress * 0.45);
    return { year, portfolio: parseFloat(currentEmissions.toFixed(1)), paris: parseFloat(parisPath.toFixed(1)), ndc: parseFloat(ndc.toFixed(1)) };
  }), [totalFinancedEmissions, engagementScenario]);

  const waciByYear = useMemo(() => PATHWAY_YEARS.map((year, i) => {
    const decay = engagementScenario === 'engage' ? 0.048 : engagementScenario === 'divest' ? 0.036 : 0.065;
    return { year, waci: parseFloat((portfolioWaci * Math.exp(-decay * (year - 2020))).toFixed(0)) };
  }), [portfolioWaci, engagementScenario]);

  const tempByYear = useMemo(() => waciByYear.map(d => ({
    year: d.year, temp: parseFloat(calcPortfolioTemp(d.waci).toFixed(2)),
  })), [waciByYear]);

  const sectorGapData = useMemo(() => activeSectors.map(s => ({
    sector: s.sector.split(' ')[0], current: s.waci, target: s.target2030, gap: s.pathwayGap,
  })), [activeSectors]);

  const s = { padding: '24px', fontFamily: T.font, color: T.text, background: T.bg, minHeight: '100vh' };
  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px', marginBottom: 16 };
  const kpi = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px', textAlign: 'center' };
  const tab = (i) => ({ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: T.font, background: activeTab === i ? T.gold : T.surface, color: activeTab === i ? T.navy : T.text, fontWeight: activeTab === i ? 700 : 400 });
  const sel = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', color: T.text, fontSize: 13, fontFamily: T.mono, width: '100%', cursor: 'pointer' };
  const tempColor = (temp) => temp <= 1.5 ? T.green : temp <= 2.0 ? T.amber : T.red;

  return (
    <div style={s}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🌡️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>FI Net-Zero Pathways Intelligence Suite</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>EP-DW6 · NZBA / NZAOA / PCAF Alignment · Portfolio Temperature Score · Sectoral Decarbonization · Engagement Analytics</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => <button key={i} onClick={() => setActiveTab(i)} style={tab(i)}>{t}</button>)}
        </div>
      </div>

      {activeTab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'GFANZ Members', value: '675', sub: '$130T in financial commitments' },
              { label: 'NZBA Banks', value: '143', sub: '$74T in loans & investments' },
              { label: 'Avg Portfolio Temp (NZBA)', value: '2.4°C', sub: 'Weighted avg 2023; 1.5°C target' },
              { label: 'Annual Financed Emissions', value: '~$700Bn tCO₂e', sub: 'PCAF global banking estimate' },
            ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{k.value}</div><div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Portfolio Temperature Score</h3>
              <div style={{ textAlign: 'center', padding: '24px 0', borderBottom: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 64, fontWeight: 700, color: tempColor(portfolioTemp) }}>{portfolioTemp.toFixed(1)}°C</div>
                <div style={{ fontSize: 14, color: T.textSec, marginTop: 8 }}>Portfolio WACI: {portfolioWaci.toFixed(0)} tCO₂e/$M revenue</div>
                <div style={{ fontSize: 12, color: portfolioTemp > 2.0 ? T.red : T.amber, marginTop: 4 }}>
                  {portfolioTemp > 2.0 ? `⚠ ${(portfolioTemp - 1.5).toFixed(1)}°C above Paris 1.5°C target` : `✓ Within 2°C corridor`}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[{ label: 'Financed Emissions (MtCO₂e/yr)', value: totalFinancedEmissions.toFixed(1) }, { label: 'Active Sectors', value: activeSectors.length }, { label: 'Avg Pathway Gap (WACI)', value: Math.round(activeSectors.reduce((s, a) => s + a.pathwayGap, 0) / Math.max(1, activeSectors.length)) }].map((k, i) => (
                  <div key={i} style={{ padding: '10px', background: T.surfaceH, borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: T.textMut, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Net-Zero Alliance Landscape</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {NZ_ALLIANCES.map((a, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: T.surfaceH, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{a.name} <span style={{ fontSize: 11, color: T.textSec, fontWeight: 400 }}>— {a.full}</span></div>
                      <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{a.commitType}</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 80 }}>
                      <div style={{ fontSize: 12, fontFamily: T.mono, color: T.teal }}>{a.signatories}</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>{a.members} members</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {NZ_ALLIANCES.map((a, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 15 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>{a.full}</div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surfaceH, padding: '3px 8px', borderRadius: 4, color: T.teal }}>{a.members} members · {a.signatories}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['Commitment', a.commitType],
                    ['Coverage', a.coverage],
                    ['Framework', a.framework],
                    ['Reporting', a.reporting],
                  ].map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12, padding: '5px 8px', background: T.surfaceH, borderRadius: 4 }}>
                      <span style={{ color: T.navy, fontWeight: 600 }}>{k}: </span>
                      <span style={{ color: T.textSec }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
            <div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Engagement Scenario</h3>
                <select value={engagementScenario} onChange={e => setEngagementScenario(e.target.value)} style={sel}>
                  <option value="engage">Active Engagement (52% reduction)</option>
                  <option value="divest">Selective Divestment (38% reduction)</option>
                  <option value="transition">Transition Finance Push (72% reduction)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Portfolio WACI (tCO₂e/$M)', value: portfolioWaci.toFixed(0) },
                  { label: 'Portfolio Temperature', value: `${portfolioTemp.toFixed(2)}°C`, color: tempColor(portfolioTemp) },
                  { label: 'Total Financed Emissions', value: `${totalFinancedEmissions.toFixed(0)} MtCO₂e/yr` },
                  { label: '2030 Target Temp (NZBA)', value: '≤1.8°C corridor' },
                  { label: '2050 Target', value: 'Net-Zero (≤1.5°C)' },
                ].map((k, i) => (
                  <div key={i} style={kpi}>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: k.color || T.navy }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Portfolio Temperature Trajectory</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={tempByYear}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[1.4, 3.5]} label={{ value: '°C', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}°C`, 'Portfolio Temp']} />
                    <ReferenceLine y={1.5} stroke={T.green} strokeDasharray="4 4" label={{ value: '1.5°C Paris', fontSize: 10, fill: T.green }} />
                    <ReferenceLine y={2.0} stroke={T.amber} strokeDasharray="4 4" label={{ value: '2.0°C', fontSize: 10, fill: T.amber }} />
                    <Line type="monotone" dataKey="temp" stroke={T.red} strokeWidth={2.5} dot={{ r: 4, fill: T.red }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>WACI Pathway vs. Paris</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={waciByYear}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'WACI', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v} tCO₂e/$M`, 'WACI']} />
                    <Line type="monotone" dataKey="waci" stroke={T.navy} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Financed Emissions Pathway ($MtCO₂e/yr)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={pathwayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="paris" name="Paris 1.5°C Path" stroke={T.green} fill={T.green} fillOpacity={0.2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="ndc" name="NDC Path" stroke={T.amber} fill={T.amber} fillOpacity={0.15} strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="portfolio" name="Portfolio Path" stroke={T.navy} fill={T.navy} fillOpacity={0.3} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Financed Emissions by Sector (MtCO₂e/yr)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={activeSectors.map(s => ({ sector: s.sector.split(' ')[0], emissions: parseFloat((s.waci * s.loanExposure / 1000).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v} MtCO₂e`, 'Financed Emissions']} />
                  <Bar dataKey="emissions" fill={T.navy} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Sector Decarbonization Pathways</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sector','Current WACI','2030 Target','2050 Target','Temp Score','Pathway Gap','Loan Exp ($Bn)','SBTi','Engagement'].map(h => <th key={h} style={{ padding: '7px 8px', textAlign: h !== 'Sector' && h !== 'Engagement' ? 'right' : 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{PORTFOLIO_SECTORS.map((sec, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 8px', fontWeight: 600, color: T.navy }}>{sec.sector}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>{sec.waci}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, color: T.teal }}>{sec.target2030}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, color: T.green }}>{sec.target2050}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, color: tempColor(sec.tempScore) }}>{sec.tempScore}°C</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, color: T.red }}>{sec.pathwayGap}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>${sec.loanExposure}B</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}><span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: sec.sbtiAligned ? '#065f46' : '#374151', color: '#fff' }}>{sec.sbtiAligned ? 'YES' : 'NO'}</span></td>
                  <td style={{ padding: '7px 8px', color: sec.engagement === 'Active' ? T.teal : T.textSec }}>{sec.engagement}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>WACI Gap to 2030 Target by Sector</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sectorGapData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'tCO₂e/$M', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="target" name="2030 Target WACI" fill={T.teal} radius={[3,3,0,0]} />
                <Bar dataKey="gap" name="Pathway Gap (to close)" fill={T.red} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 5 && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ENGAGEMENT_STRATEGY.map((es, i) => (
              <div key={i} style={{ ...card, borderLeft: `4px solid ${[T.navy, T.teal, T.amber, T.red, T.sage, T.gold][i]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{es.strategy}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{es.type} · {es.timeline}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: es.impact === 'Very High' ? '#065f46' : es.impact === 'High' ? '#1e3a5f' : '#374151', color: '#fff' }}>{es.impact} impact</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: T.surfaceH, color: T.textSec }}>{es.effort} effort</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: T.text }}>{es.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 6 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>PCAF Methodology by Asset Class</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PCAF_SCORES.map((p, i) => (
                <div key={i} style={{ padding: '12px 16px', background: T.surfaceH, borderRadius: 6, display: 'grid', gridTemplateColumns: '180px 60px 1fr 140px', gap: 16, alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{p.assetClass}</div>
                  <div>
                    <div style={{ fontSize: 10, color: T.textMut }}>DQ Score</div>
                    <div style={{ fontSize: 12, fontFamily: T.mono, color: T.teal }}>{p.quality}</div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{p.methodology}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: T.textMut }}>Typical Range</div>
                    <div style={{ fontSize: 12, fontFamily: T.mono, color: T.navy }}>{p.typical}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 7 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>NZBA Sectoral Interim Targets</h3>
            {INTERIM_TARGETS.map((t, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{t.sector}</div>
                  <div style={{ fontSize: 12, fontFamily: T.mono }}>
                    <span style={{ color: T.amber }}>2025: {t.trajectory2025Pct}%</span>
                    <span style={{ margin: '0 8px', color: T.textMut }}>|</span>
                    <span style={{ color: T.red }}>2030: {t.trajectory2030Pct}%</span>
                  </div>
                </div>
                <div style={{ height: 20, background: T.surfaceH, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: '100%', width: `${100 + t.trajectory2030Pct}%`, background: T.navy, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>{t.target2030} tCO₂e/$M target</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut, marginTop: 4 }}>
                  <span>Baseline 2019: {t.baseline2019}</span>
                  <span>2025 target: {t.target2025}</span>
                  <span>2030 target: {t.target2030}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 8 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>FI Transition Plan Components</h3>
              {[
                { component: '1. Governance & Board Accountability', status: 'Required (NZBA 2025)', description: 'Board-level NZ commitment; Chief Climate Officer or equivalent; climate in MD&A' },
                { component: '2. Portfolio Temperature Target', status: 'Required (NZBA)', description: 'Interim 2030 WACI target + 2050 net-zero commitment; PCAF-aligned reporting' },
                { component: '3. Sectoral Decarbonization Pathways', status: 'Required (NZBA)', description: 'Sector-specific WACI targets using IEA Net-Zero or SBTi pathways' },
                { component: '4. Financed Emissions Disclosure', status: 'Required (PCAF)', description: 'Annual PCAF GHG accounting; Scope 3 Cat 15; DQ score improvement roadmap' },
                { component: '5. Engagement & Escalation Policy', status: 'Best Practice', description: 'Written policy for client engagement; escalation triggers; divestment conditions' },
                { component: '6. Transition Finance Allocation', status: 'Recommended', description: 'Dedicated book for green/transition lending; taxonomy-aligned KPI targets' },
                { component: '7. Own Operations (Scope 1+2)', status: 'Required', description: 'Science-based target for own operations; 100% renewable energy by 2030' },
                { component: '8. Third-Party Verification', status: 'Recommended', description: 'Annual external verification of financed emissions and target progress' },
              ].map((comp, i) => (
                <div key={i} style={{ padding: '10px 12px', background: i % 2 === 0 ? T.surfaceH : 'transparent', borderRadius: 4, marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: T.navy, fontSize: 12 }}>{comp.component}</div>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: comp.status.includes('Required') ? '#065f46' : '#1e3a5f', color: '#fff', whiteSpace: 'nowrap', marginLeft: 6 }}>{comp.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{comp.description}</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Financed Emissions Reduction Scenarios</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={pathwayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v} MtCO₂e`, '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="portfolio" name="Portfolio Path" stroke={T.navy} strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="paris" name="Paris 1.5°C" stroke={T.green} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="ndc" name="NDC Path" stroke={T.amber} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, color: T.navy }}>Regulatory Timeline</h4>
                {[
                  { year: '2024', req: 'CSRD mandatory reporting for large EU companies begins; ISSB IFRS S1/S2 voluntary adoption window' },
                  { year: '2025', req: 'NZBA annual interim target setting due; SEC Climate Disclosure Rule phased in' },
                  { year: '2026', req: 'EU CS3D supply chain due diligence in force; TCFD mandatory for FTSE 350' },
                  { year: '2030', req: 'First major NZBA interim targets due; ~50% financed emissions reduction target' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 12 }}>
                    <span style={{ fontFamily: T.mono, color: T.gold, fontWeight: 700, minWidth: 36 }}>{r.year}</span>
                    <span style={{ color: T.textSec }}>{r.req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 9 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>FI Net-Zero Progress Benchmark</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['FI (Illustrative)','WACI (tCO₂e/$M)','Portfolio Temp','NZBA Member','Interim Targets Set','Financed Emissions Disclosed','SBTi Status'].map(h => <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{Array.from({ length: 10 }, (_, i) => {
                const waciVal = Math.round(180 + sr(i * 23) * 350);
                const temp = parseFloat(calcPortfolioTemp(waciVal).toFixed(2));
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 8px', fontWeight: 600, color: T.navy }}>{['Global Bank A','EU Bank B','Asia Bank C','US Bank D','UK Bank E','Nordic Bank F','EM Bank G','Insurer H','Asset Mgr I','Pension J'][i]}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{waciVal}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: tempColor(temp) }}>{temp}°C</td>
                    <td style={{ padding: '7px 8px' }}><span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: sr(i*7) > 0.3 ? '#065f46' : '#374151', color: '#fff' }}>{sr(i*7) > 0.3 ? 'YES' : 'NO'}</span></td>
                    <td style={{ padding: '7px 8px' }}><span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: sr(i*11) > 0.4 ? '#065f46' : '#92400e', color: '#fff' }}>{sr(i*11) > 0.4 ? 'SET' : 'PENDING'}</span></td>
                    <td style={{ padding: '7px 8px' }}><span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: sr(i*13) > 0.35 ? '#065f46' : '#7f1d1d', color: '#fff' }}>{sr(i*13) > 0.35 ? 'FULL' : 'PARTIAL'}</span></td>
                    <td style={{ padding: '7px 8px' }}><span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: sr(i*17) > 0.5 ? '#065f46' : sr(i*17) > 0.25 ? '#1e3a5f' : '#374151', color: '#fff' }}>{sr(i*17) > 0.5 ? 'Validated' : sr(i*17) > 0.25 ? 'Committed' : 'None'}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
