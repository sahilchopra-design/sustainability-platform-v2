import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const CDFIS = [
  { id: 'ofn', name: 'Opportunity Finance Network', aum: 420, focus: 'National network', climate: 38, nmtcAlloc: 850, lmiShare: 92, loanType: 'Multi-product', greenScore: 72, jobs: 48200, founded: 1986 },
  { id: 'sh', name: 'Self-Help', aum: 3800, focus: 'Small business & housing', climate: 22, nmtcAlloc: 620, lmiShare: 88, loanType: 'Housing/SB', greenScore: 65, jobs: 31000, founded: 1980 },
  { id: 'liif', name: 'Low Income Investment Fund', aum: 2100, focus: 'Community facilities', climate: 45, nmtcAlloc: 480, lmiShare: 95, loanType: 'Real estate', greenScore: 78, jobs: 22500, founded: 1984 },
  { id: 'crf', name: 'Community Reinvestment Fund', aum: 1650, focus: 'Small business', climate: 30, nmtcAlloc: 390, lmiShare: 85, loanType: 'SBA/NMTC', greenScore: 60, jobs: 18700, founded: 1988 },
  { id: 'bh', name: 'BlueHub Capital', aum: 980, focus: 'Affordable housing', climate: 55, nmtcAlloc: 280, lmiShare: 96, loanType: 'Housing', greenScore: 82, jobs: 9400, founded: 1991 },
  { id: 'cei', name: 'Coastal Enterprises (CEI)', aum: 760, focus: 'Rural & fisheries', climate: 48, nmtcAlloc: 220, lmiShare: 89, loanType: 'Rural/natural res.', greenScore: 80, jobs: 12800, founded: 1977 },
  { id: 'ecp', name: 'Enterprise Community Partners', aum: 5200, focus: 'Affordable housing', climate: 42, nmtcAlloc: 1100, lmiShare: 94, loanType: 'Housing/NMTC', greenScore: 75, jobs: 55000, founded: 1982 },
  { id: 'rf', name: 'Reinvestment Fund', aum: 2400, focus: 'PA/NJ/MD markets', climate: 52, nmtcAlloc: 560, lmiShare: 91, loanType: 'Multi-sector', greenScore: 83, jobs: 28600, founded: 1985 },
];

const NMTC_PROGRAMS = [
  { program: 'NMTC (New Markets Tax Credit)', annualAlloc: 5000, leverage: '7:1 QEI to credit', benefit: '39% tax credit over 7yr', eligibility: 'LMI census tracts (≤80% AMI)', climateUse: 'Green community facilities' },
  { program: 'CDFI Bond Guarantee Program', annualAlloc: 500, leverage: 'Up to 100% guarantee', benefit: 'Below-market capital', eligibility: 'Certified CDFIs', climateUse: 'Climate infrastructure' },
  { program: 'CDFI Fund Awards', annualAlloc: 350, leverage: '12:1 private leverage', benefit: 'Grant + TA funding', eligibility: 'Certified CDFIs', climateUse: 'Equitable clean energy' },
  { program: 'State Small Business Credit (SSBCI)', annualAlloc: 1500, leverage: '10:1 private lending', benefit: 'Revolving loan fund', eligibility: 'Small businesses', climateUse: 'Green business financing' },
  { program: 'Community Advantage SBA', annualAlloc: 800, leverage: '85% SBA guarantee', benefit: 'Mission-focused SBA 7(a)', eligibility: 'Underserved markets', climateUse: 'Clean tech SMEs' },
  { program: 'IRA Greenhouse Gas Reduction Fund', annualAlloc: 6000, leverage: '10:1+ private capital', benefit: 'Zero-emission project finance', eligibility: 'Community lenders', climateUse: 'Solar, efficiency, EVs in LMI' },
];

const CLIMATE_PROGRAMS = [
  { name: 'IRA Clean Energy for All (EPA)', amount: 6000, focus: 'LMI solar & efficiency', status: 'Active 2024', returnType: 'Grant + revolving' },
  { name: 'DOE Loan Programs (LPO)', amount: 400000, focus: 'Clean energy manufacturing', status: 'Active', returnType: 'Loan guarantee' },
  { name: 'USDA ReConnect (rural broadband/energy)', amount: 1000, focus: 'Rural clean energy', status: 'Active', returnType: 'Grant/loan' },
  { name: 'Treasury CDFI Climate Initiative', amount: 850, focus: 'Climate resilience lending', status: 'Proposed', returnType: 'Award' },
  { name: 'HUD Green/Resilient Retrofit', amount: 4000, focus: 'Affordable housing retrofit', status: 'Active', returnType: 'Grant' },
  { name: 'EPA Environmental Justice Grants', amount: 3000, focus: 'Pollution & climate harm', status: 'Active', returnType: 'Grant' },
];

const CAPITAL_STACK = [
  { layer: 'Senior Debt (Bank / FHLBank)', typical: 55, rate: 5.8, security: 'First lien', provider: 'Commercial banks, FHLBs' },
  { layer: 'CDFI Subordinate Debt', typical: 20, rate: 4.2, security: 'Second lien', provider: 'CDFI partners' },
  { layer: 'NMTC Equity (Tax Credit Investor)', typical: 15, rate: 0, security: 'Equity stake', provider: 'Banks / insurance cos' },
  { layer: 'Grant / Subordinated Grant', typical: 7, rate: 0, security: 'None', provider: 'Foundations, gov grants' },
  { layer: 'Borrower Equity', typical: 3, rate: 0, security: 'Residual', provider: 'Developer / community org' },
];

const TABS = ['Overview', 'CDFI Landscape', 'NMTC Analytics', 'Capital Stack', 'Climate Programs', 'Green Lending', 'Community Impact', 'Equity Finance', 'Regulatory Framework', 'Deal Pipeline'];

function calcNmtcBenefit({ projectCost, taxCreditRate = 0.39, investorEquity }) {
  const qei = projectCost;
  const creditTotal = qei * taxCreditRate;
  const subsidy = creditTotal;
  const netProjectCost = projectCost - subsidy;
  return { creditTotal: (creditTotal / 1e6).toFixed(2), netProjectCost: (netProjectCost / 1e6).toFixed(2), leverage: (projectCost / Math.max(investorEquity, 1)).toFixed(1) };
}

function calcClimateMultiplier({ loanAmount, avgEmissionsReductionTperLoan }) {
  return (loanAmount * avgEmissionsReductionTperLoan / 1e6).toFixed(2);
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function CdfiClimateFinancePage() {
  const [tab, setTab] = useState('Overview');
  const [selectedCdfi, setSelectedCdfi] = useState('ofn');
  const [projectCost, setProjectCost] = useState(10);
  const [investorEquity, setInvestorEquity] = useState(3);
  const [portfolioAum, setPortfolioAum] = useState(500);
  const [climateAlloc, setClimateAlloc] = useState(40);

  const cdfi = CDFIS.find(c => c.id === selectedCdfi) || CDFIS[0];
  const nmtc = calcNmtcBenefit({ projectCost: projectCost * 1e6, taxCreditRate: 0.39, investorEquity: investorEquity * 1e6 });
  const totalAum = CDFIS.reduce((s, c) => s + c.aum, 0);
  const totalJobs = CDFIS.reduce((s, c) => s + c.jobs, 0);
  const avgClimate = CDFIS.length ? CDFIS.reduce((s, c) => s + c.climate, 0) / CDFIS.length : 0;
  const climateDeployment = (portfolioAum * climateAlloc / 100).toFixed(0);

  const radarData = [
    { metric: 'Green Lending', value: cdfi.climate },
    { metric: 'LMI Reach', value: cdfi.lmiShare },
    { metric: 'ESG Score', value: cdfi.greenScore },
    { metric: 'NMTC Scale', value: Math.min(100, cdfi.nmtcAlloc / 12) },
    { metric: 'Job Impact', value: Math.min(100, cdfi.jobs / 600) },
  ];

  const pipelineData = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    deal: `Deal ${i + 1}`, size: Math.round(sr(i * 17) * 45 + 5), climate: Math.round(sr(i * 23) * 80 + 20), lmi: Math.round(sr(i * 31) * 15 + 80), stage: ['Screening', 'Underwriting', 'Approved', 'Closed'][Math.floor(sr(i * 7) * 4)],
  })), []);

  const lendingTrend = useMemo(() => [2020, 2021, 2022, 2023, 2024, 2025].map((yr, i) => ({
    year: yr, total: Math.round(15 + i * 4.5 + sr(i * 13) * 3), climate: Math.round(3 + i * 3.2 + sr(i * 19) * 2),
  })), []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text, padding: '24px 32px' }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: '0.12em', marginBottom: 6 }}>EP-DY2 · CDFI CLIMATE FINANCE INTELLIGENCE</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>CDFI Climate Finance Intelligence Suite</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>Community Development Finance · NMTC Analytics · IRA Greenhouse Gas Reduction Fund · Equitable Clean Energy</div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 4, border: `1px solid ${tab === t ? T.gold : T.border}`, background: tab === t ? T.gold : T.surface, color: tab === t ? T.bg : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer', fontWeight: tab === t ? 700 : 400 }}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="CDFI SECTOR AUM" value={`$${(totalAum / 1000).toFixed(0)}Bn`} sub="Tracked CDFIs" />
            <Kpi label="AVG CLIMATE LENDING" value={`${avgClimate.toFixed(0)}%`} sub="of portfolio" color={T.green} />
            <Kpi label="JOBS SUPPORTED" value={totalJobs.toLocaleString()} sub="Direct & indirect" color={T.teal} />
            <Kpi label="IRA GGRF CAPITAL" value="$6Bn" sub="EPA 2024 program" color={T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CLIMATE LENDING % BY CDFI</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...CDFIS].sort((a, b) => b.climate - a.climate).map(c => ({ name: c.name.split(' ').slice(-1)[0], climate: c.climate }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="climate" fill={T.green} name="Climate Lending (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CDFI LENDING TREND ($Bn)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={lendingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Area type="monotone" dataKey="total" stroke={T.teal} fill={T.navy} name="Total ($Bn)" />
                  <Area type="monotone" dataKey="climate" stroke={T.green} fill={T.sage} name="Climate ($Bn)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'CDFI Landscape' && (
        <div>
          <div style={{ marginBottom: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CDFI UNIVERSE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['CDFI', 'AUM ($M)', 'Climate %', 'LMI Share', 'NMTC Alloc ($M)', 'Green Score', 'Founded'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{CDFIS.map((c, i) => (
                <tr key={c.id} onClick={() => setSelectedCdfi(c.id)} style={{ cursor: 'pointer', background: selectedCdfi === c.id ? T.surfaceH : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', color: T.text, fontFamily: T.mono }}>{c.aum.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', color: T.green }}>{c.climate}%</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{c.lmiShare}%</td>
                  <td style={{ padding: '7px 10px', color: T.teal, fontFamily: T.mono }}>{c.nmtcAlloc}</td>
                  <td style={{ padding: '7px 10px', color: c.greenScore >= 80 ? T.green : c.greenScore >= 65 ? T.amber : T.red }}>{c.greenScore}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{c.founded}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {selectedCdfi && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>SELECTED: {cdfi.name.toUpperCase()}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Kpi label="AUM" value={`$${cdfi.aum.toLocaleString()}M`} sub={cdfi.loanType} color={T.teal} />
                  <Kpi label="CLIMATE %" value={`${cdfi.climate}%`} sub="of portfolio" color={T.green} />
                  <Kpi label="JOBS" value={cdfi.jobs.toLocaleString()} sub="supported" />
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: T.textSec, fontSize: 10 }} />
                    <Radar dataKey="value" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'NMTC Analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>NMTC BENEFIT CALCULATOR</div>
              {[['Project Cost ($M)', projectCost, setProjectCost, 1, 100], ['Investor Equity ($M)', investorEquity, setInvestorEquity, 1, 50]].map(([label, val, setter, min, max]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{label}: <span style={{ color: T.gold, fontFamily: T.mono }}>${val}M</span></div>
                  <input type="range" min={min} max={max} value={val} onChange={e => setter(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
                </div>
              ))}
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textSec }}>39% Tax Credit Over 7yr</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.green, fontFamily: T.mono, marginTop: 4 }}>${nmtc.creditTotal}M</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>Net Project Cost: <span style={{ color: T.gold }}>${nmtc.netProjectCost}M</span></div>
                <div style={{ fontSize: 11, color: T.textSec }}>QEI Leverage: <span style={{ color: T.teal }}>{nmtc.leverage}x</span></div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>NMTC ALLOCATIONS BY CDFI ($M)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...CDFIS].sort((a, b) => b.nmtcAlloc - a.nmtcAlloc).map(c => ({ name: c.name.split(' ').slice(-1)[0], alloc: c.nmtcAlloc }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="alloc" fill={T.gold} name="NMTC Allocation ($M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>PROGRAM COMPARISON</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Program', 'Annual Alloc ($M)', 'Leverage', 'Benefit', 'Climate Use'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{NMTC_PROGRAMS.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{p.program}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>${p.annualAlloc.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{p.leverage}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{p.benefit}</td>
                  <td style={{ padding: '7px 10px', color: T.green }}>{p.climateUse}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Capital Stack' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="TYPICAL SENIOR DEBT" value="55%" sub="Bank / FHLB" />
            <Kpi label="CDFI SUB DEBT" value="20%" sub="Below-market rate" color={T.teal} />
            <Kpi label="NMTC EQUITY" value="15%" sub="Tax credit investor" color={T.green} />
            <Kpi label="GRANT LAYER" value="7%" sub="Foundations / gov" color={T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CAPITAL STACK COMPOSITION</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={CAPITAL_STACK} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis dataKey="layer" type="category" tick={{ fill: T.textSec, fontSize: 9 }} width={160} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="typical" fill={T.teal} name="Typical Share (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>LAYER DETAIL</div>
              {CAPITAL_STACK.map((l, i) => (
                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < CAPITAL_STACK.length - 1 ? `1px solid ${T.borderL}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{l.layer}</span>
                    <span style={{ fontSize: 12, color: T.gold, fontFamily: T.mono }}>{l.typical}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{l.provider} · {l.rate > 0 ? `${l.rate}%` : 'No rate'} · {l.security}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Climate Programs' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="IRA GGRF (EPA)" value="$6Bn" sub="LMI clean energy" color={T.green} />
            <Kpi label="DOE LPO CAPACITY" value="$400Bn" sub="Loan guarantees" />
            <Kpi label="HUD GREEN RETROFIT" value="$4Bn" sub="Affordable housing" color={T.teal} />
            <Kpi label="EPA EJ GRANTS" value="$3Bn" sub="Environmental justice" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>FEDERAL CLIMATE PROGRAMS FOR CDFIs</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Program', 'Amount ($M)', 'Focus', 'Status', 'Return Type'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{CLIMATE_PROGRAMS.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>{p.amount.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{p.focus}</td>
                  <td style={{ padding: '7px 10px', color: p.status === 'Active' || p.status.startsWith('Active') ? T.green : T.amber }}>{p.status}</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{p.returnType}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>PORTFOLIO CLIMATE DEPLOYMENT CALCULATOR</div>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
              <div>
                {[['Portfolio AUM ($M)', portfolioAum, setPortfolioAum, 50, 5000], ['Climate Allocation (%)', climateAlloc, setClimateAlloc, 5, 100]].map(([label, val, setter, min, max]) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{label}: <span style={{ color: T.gold, fontFamily: T.mono }}>{val}</span></div>
                    <input type="range" min={min} max={max} value={val} onChange={e => setter(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
                  </div>
                ))}
                <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 11, color: T.textSec }}>Climate Capital Deployed</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: T.green, fontFamily: T.mono }}>${climateDeployment}M</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>CO₂ avoided: {(Number(climateDeployment) * 0.12).toFixed(0)} tCO₂e (est.)</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[{ label: 'Total AUM', value: portfolioAum }, { label: 'Climate', value: Number(climateDeployment) }, { label: 'Non-Climate', value: portfolioAum - Number(climateDeployment) }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="label" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="value" fill={T.sage} name="Amount ($M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Green Lending' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="AVG GREEN SCORE" value={CDFIS.length ? (CDFIS.reduce((s, c) => s + c.greenScore, 0) / CDFIS.length).toFixed(0) : 0} sub="/100 composite" color={T.green} />
            <Kpi label="TOP GREEN LENDER" value="Reinvestment Fund" sub="Score: 83" color={T.teal} />
            <Kpi label="SOLAR LOANS (LMI)" value="$2.4Bn" sub="IRA GGRF deployed" />
            <Kpi label="EFFICIENCY LOANS" value="$1.8Bn" sub="Multifamily housing" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>GREEN LENDING SCORE vs CLIMATE ALLOCATION</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={CDFIS.map(c => ({ name: c.name.split(' ').slice(-1)[0], greenScore: c.greenScore, climate: c.climate }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Bar dataKey="greenScore" fill={T.green} name="Green Score" />
                <Bar dataKey="climate" fill={T.teal} name="Climate Allocation (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Community Impact' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="TOTAL JOBS SUPPORTED" value={totalJobs.toLocaleString()} sub="All tracked CDFIs" color={T.green} />
            <Kpi label="AVG LMI REACH" value={`${CDFIS.length ? (CDFIS.reduce((s, c) => s + c.lmiShare, 0) / CDFIS.length).toFixed(0) : 0}%`} sub="of portfolio in LMI" />
            <Kpi label="COMMUNITIES SERVED" value="2,800+" sub="Census tracts" color={T.teal} />
            <Kpi label="AFFORDABLE UNITS" value="180,000+" sub="Financed 2020–2025" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>JOBS SUPPORTED BY CDFI</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...CDFIS].sort((a, b) => b.jobs - a.jobs).map(c => ({ name: c.name.split(' ').slice(-1)[0], jobs: c.jobs }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="jobs" fill={T.teal} name="Jobs Supported" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Equity Finance' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="EJ COMMUNITY LOANS" value="$4.2Bn" sub="2024 pipeline" color={T.green} />
            <Kpi label="MINORITY-OWNED BIZ" value="38%" sub="of CDFI portfolio" color={T.teal} />
            <Kpi label="WOMEN-LED ORG" value="22%" sub="of borrowers" />
            <Kpi label="RURAL REACH" value="31%" sub="Non-metro census tracts" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>LMI REACH BY CDFI (%)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...CDFIS].sort((a, b) => b.lmiShare - a.lmiShare).map(c => ({ name: c.name.split(' ').slice(-1)[0], lmi: c.lmiShare }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                <YAxis domain={[70, 100]} tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="lmi" fill={T.sage} name="LMI Share (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Regulatory Framework' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="CRA BENEFIT" value="Qualifying" sub="For bank investors" color={T.green} />
            <Kpi label="CERTIFIED CDFIs" value="1,400+" sub="CDFI Fund certified" />
            <Kpi label="DODD-FRANK SECTION" value="§1044" sub="CDFI protection" color={T.teal} />
            <Kpi label="IRS RULING" value="Rev. Rul. 89-77" sub="NMTC guidance" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>REGULATORY OVERVIEW</div>
            {[['Community Reinvestment Act (CRA)', 'Banks investing in CDFIs receive CRA credit. 2023 CRA modernization expanded qualifying activities to include climate-related community development lending.'],
              ['CDFI Fund Certification', 'CDFIs must demonstrate primary mission, target market (LMI), financing entity status, and accountability to community. Recertified every 3 years.'],
              ['NMTC Program (IRC §45D)', '39% tax credit to investors in CDE-certified entities making QLICIs in LMI census tracts. 7-year compliance period. Annual $5B allocation.'],
              ['IRA Greenhouse Gas Reduction Fund', 'EPA §134 program deploying $27B total ($6B for LMI communities). CDFIs are primary conduit for equitable clean energy access.'],
              ['SSBCI 2.0', 'Treasury program with $10B for small business credit support; 40% directed to underserved communities. CDFIs serve as participating lenders.']].map(([title, desc], i) => (
              <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < 4 ? `1px solid ${T.borderL}` : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Deal Pipeline' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="PIPELINE DEALS" value={pipelineData.length} sub="Active" color={T.teal} />
            <Kpi label="TOTAL PIPELINE" value={`$${pipelineData.reduce((s, d) => s + d.size, 0)}M`} sub="Estimated" />
            <Kpi label="AVG CLIMATE SCORE" value={pipelineData.length ? (pipelineData.reduce((s, d) => s + d.climate, 0) / pipelineData.length).toFixed(0) : 0} sub="/100" color={T.green} />
            <Kpi label="AVG LMI SCORE" value={pipelineData.length ? (pipelineData.reduce((s, d) => s + d.lmi, 0) / pipelineData.length).toFixed(0) : 0} sub="% LMI" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ACTIVE DEAL PIPELINE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Deal', 'Size ($M)', 'Climate Score', 'LMI Score', 'Stage'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{pipelineData.map((d, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text }}>{d.deal}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>${d.size}M</td>
                  <td style={{ padding: '7px 10px', color: d.climate >= 70 ? T.green : d.climate >= 50 ? T.amber : T.red }}>{d.climate}</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{d.lmi}%</td>
                  <td style={{ padding: '7px 10px', color: d.stage === 'Closed' ? T.green : d.stage === 'Approved' ? T.teal : T.textSec }}>{d.stage}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
