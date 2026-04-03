import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, PieChart, Pie, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', teal: '#0f766e', purple: '#6d28d9', emerald: '#059669' };
const pct = (n, d = 1) => `${parseFloat(n).toFixed(d)}%`;
const usd = (n, d = 2) => `$${parseFloat(n).toFixed(d)}`;

const INTEGRITY_DIMS = ['Additionality', 'Permanence', 'MRV Quality', 'Co-Benefits', 'Safeguards', 'Registry Standard', 'Verification Body', 'Project Vintage'];
const STANDARDS = ['VCMI', 'ICVCM Core Carbon Principles', 'SBTi Net-Zero', 'Science Based Targets', 'Oxford Principles', 'REDD+ Safeguards'];
const PROJECT_TYPES = ['REDD+', 'Improved Forest Mgmt', 'Renewable Energy', 'Cookstoves', 'Methane Capture', 'Blue Carbon'];
const RISK_LEVELS = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];

// Credit portfolio for due diligence
const CREDITS = Array.from({ length: 18 }, (_, i) => {
  const types = PROJECT_TYPES;
  const regs = ['Verra', 'Gold Standard', 'ACR'];
  const verifiers = ['DNV', 'Bureau Veritas', 'SCS Global', 'ERM CVS', 'Rainforest Alliance'];
  const additionality = Math.round(40 + sr(i * 5) * 55);
  const permanence    = Math.round(35 + sr(i * 7) * 60);
  const mrv           = Math.round(50 + sr(i * 9) * 45);
  const cobenefits    = Math.round(30 + sr(i * 11) * 65);
  const safeguards    = Math.round(45 + sr(i * 13) * 50);
  const overall       = Math.round((additionality + permanence + mrv + cobenefits + safeguards) / 5);
  const price         = +(2 + sr(i * 17) * 18).toFixed(2);
  const adjustedPrice = +(price * (0.5 + overall / 100)).toFixed(2);
  return {
    id: `CR-${String(i + 1).padStart(3, '0')}`,
    type: types[i % types.length],
    registry: regs[i % regs.length],
    country: ['Peru', 'Indonesia', 'Brazil', 'Kenya', 'USA', 'Zimbabwe', 'Colombia', 'India', 'Mexico', 'Zambia', 'Guatemala', 'Mozambique', 'Vietnam', 'Tanzania', 'Papua NG', 'DR Congo', 'Bolivia', 'Ecuador'][i],
    vintage: 2018 + Math.floor(sr(i * 19) * 6),
    verifier: verifiers[i % verifiers.length],
    additionality, permanence, mrv, cobenefits, safeguards, overall,
    price, adjustedPrice,
    greenwash_risk: overall < 50 ? 'Very High' : overall < 60 ? 'High' : overall < 72 ? 'Medium' : overall < 85 ? 'Low' : 'Very Low',
    reversal_risk:  permanence < 50 ? 'High' : permanence < 65 ? 'Medium' : 'Low',
    sdgs: Math.round(3 + sr(i * 23) * 12),
    flag: overall < 55,
  };
});

// Radar for selected credit
const buildRadar = (credit) => INTEGRITY_DIMS.map((dim, i) => ({
  dim: dim.length > 14 ? dim.slice(0, 13) + '…' : dim,
  score: [credit.additionality, credit.permanence, credit.mrv, credit.cobenefits, credit.safeguards, 80 + sr(i * 7) * 20, 65 + sr(i * 11) * 30, 55 + sr(i * 13) * 40][i],
  benchmark: 70,
}));

// ICVCM CCP scoring
const CCP_DIMS = [
  { principle: 'Governance',        score: 74, desc: 'Registry governance, oversight, accountability' },
  { principle: 'Tracking',          score: 81, desc: 'Unique serial numbers, no double-counting' },
  { principle: 'Transparency',      score: 68, desc: 'Public disclosure of methodology & data' },
  { principle: 'Robust MRV',        score: 77, desc: 'Measurement, reporting, verification quality' },
  { principle: 'Additionality',     score: 62, desc: 'Beyond business-as-usual baseline' },
  { principle: 'Permanence',        score: 55, desc: 'Buffer pool adequacy, reversal risk' },
  { principle: 'No net harm',       score: 88, desc: 'UNFCCC & host country safeguards' },
  { principle: 'Sustainable Dev',   score: 79, desc: 'Co-benefits for people and nature' },
];

// Greenwashing risk indicators
const GREENWASH_FLAGS = [
  { flag: 'Over-credited baseline',    frequency: 38, severity: 'High',     type: 'Methodological' },
  { flag: 'Permanence buffer < 15%',   frequency: 24, severity: 'High',     type: 'Risk Management' },
  { flag: 'No third-party site visit', frequency: 19, severity: 'Medium',   type: 'Verification' },
  { flag: 'Avoided deforestation only',frequency: 52, severity: 'Medium',   type: 'Additionality' },
  { flag: 'Old vintage (pre-2016)',     frequency: 31, severity: 'Low',      type: 'Vintage' },
  { flag: 'No FPIC documentation',     frequency: 15, severity: 'High',     type: 'Safeguards' },
  { flag: 'Leakage not assessed',      frequency: 29, severity: 'High',     type: 'Scope' },
  { flag: 'Negative co-benefit claims',frequency: 8,  severity: 'Very High',type: 'Claims' },
];

// Price discount by integrity tier
const INTEGRITY_TIERS = [
  { tier: 'Gold (CCP + VCMI)', score: '85–100', premium: '+22%',  volume: 18, color: T.gold },
  { tier: 'Silver (CCP)',      score: '70–84',  premium: '+8%',   volume: 38, color: T.teal },
  { tier: 'Standard',          score: '55–69',  premium: '±0%',   volume: 28, color: T.gray },
  { tier: 'Below Standard',    score: '40–54',  premium: '-18%',  volume: 12, color: T.orange },
  { tier: 'Non-compliant',     score: '<40',    premium: '-42%',  volume: 4,  color: T.red },
];

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy, borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: '14px 18px', flex: 1 }}>
    <div style={{ fontSize: 11, color: T.gray, fontFamily: 'DM Sans, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.gray, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Section = ({ title, children, badge }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: 20, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.navy }}>{title}</h3>
      {badge && <span style={{ fontSize: 10, background: T.navy, color: '#fff', padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const RiskBadge = ({ level }) => {
  const c = { 'Very High': T.red, 'High': T.orange, 'Medium': '#b45309', 'Low': T.teal, 'Very Low': T.emerald }[level] || T.gray;
  return <span style={{ background: c, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{level}</span>;
};

const ScoreBar = ({ score, max = 100 }) => {
  const c = score >= 75 ? T.emerald : score >= 60 ? T.gold : score >= 45 ? T.orange : T.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 6, background: '#e5e0d8', borderRadius: 3 }}>
        <div style={{ width: `${(score / max) * 100}%`, height: 6, background: c, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: c, fontWeight: 700 }}>{score}</span>
    </div>
  );
};

export default function CreditIntegrityDDPage() {
  const [tab, setTab] = useState('Portfolio Integrity');
  const [selected, setSelected] = useState(CREDITS[0]);
  const [sortBy, setSortBy] = useState('overall');

  const sortedCredits = useMemo(() =>
    [...CREDITS].sort((a, b) => sortBy === 'overall' ? b.overall - a.overall : sortBy === 'price' ? b.price - a.price : b.additionality - a.additionality),
    [sortBy]
  );

  const avgIntegrity = Math.round(CREDITS.reduce((a, c) => a + c.overall, 0) / CREDITS.length);
  const flagged = CREDITS.filter(c => c.flag).length;
  const avgAdjustedPremium = ((CREDITS.reduce((a, c) => a + c.adjustedPrice, 0) / CREDITS.reduce((a, c) => a + c.price, 0) - 1) * 100).toFixed(1);

  const radarData = buildRadar(selected);

  const TABS = ['Portfolio Integrity', 'Credit Due Diligence', 'ICVCM CCP Assessment', 'Greenwashing Flags', 'Integrity Pricing'];

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BN3</span>
          <span style={{ fontSize: 11, color: T.purple, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>INTEGRITY · DUE DILIGENCE</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>Credit Integrity & Due Diligence</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>Additionality · Permanence · MRV quality · ICVCM CCP scoring · Greenwashing detection · Integrity-adjusted pricing</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'Portfolio Integrity' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Portfolio Avg Integrity" value={`${avgIntegrity}/100`} sub="Weighted integrity score" color={avgIntegrity >= 70 ? T.emerald : T.orange} />
            <Kpi label="Flagged Credits" value={`${flagged} / ${CREDITS.length}`} sub="Score < 55 — high risk" color={flagged > 3 ? T.red : T.orange} />
            <Kpi label="Integrity Premium" value={`+${avgAdjustedPremium}%`} sub="Quality-adjusted pricing" color={T.teal} />
            <Kpi label="CCP Compliant" value={`${CREDITS.filter(c => c.overall >= 70).length} / ${CREDITS.length}`} sub="Meets ICVCM threshold" color={T.emerald} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Integrity Score Distribution">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { range: '85–100', count: CREDITS.filter(c => c.overall >= 85).length, fill: T.emerald },
                  { range: '70–84',  count: CREDITS.filter(c => c.overall >= 70 && c.overall < 85).length, fill: T.teal },
                  { range: '55–69',  count: CREDITS.filter(c => c.overall >= 55 && c.overall < 70).length, fill: T.gold },
                  { range: '40–54',  count: CREDITS.filter(c => c.overall >= 40 && c.overall < 55).length, fill: T.orange },
                  { range: '<40',    count: CREDITS.filter(c => c.overall < 40).length, fill: T.red },
                ]} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="range" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis allowDecimals={false} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => `${v} credits`} />
                  <Bar dataKey="count" name="# Credits" radius={[3, 3, 0, 0]}>
                    {[T.emerald, T.teal, T.gold, T.orange, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Integrity Dimensions — Portfolio Average">
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={[
                  { dim: 'Additionality', score: Math.round(CREDITS.reduce((a, c) => a + c.additionality, 0) / CREDITS.length) },
                  { dim: 'Permanence',    score: Math.round(CREDITS.reduce((a, c) => a + c.permanence, 0)    / CREDITS.length) },
                  { dim: 'MRV Quality',   score: Math.round(CREDITS.reduce((a, c) => a + c.mrv, 0)           / CREDITS.length) },
                  { dim: 'Co-Benefits',   score: Math.round(CREDITS.reduce((a, c) => a + c.cobenefits, 0)    / CREDITS.length) },
                  { dim: 'Safeguards',    score: Math.round(CREDITS.reduce((a, c) => a + c.safeguards, 0)    / CREDITS.length) },
                ]}>
                  <PolarGrid stroke="#e5e0d8" />
                  <PolarAngleAxis dataKey="dim" style={{ fontSize: 11, fontFamily: 'DM Sans, sans-serif' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar dataKey="score" name="Portfolio Avg" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                  <Radar dataKey={() => 70} name="Benchmark (70)" stroke={T.gold} fill="none" strokeDasharray="4 3" />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <Section title="Integrity vs Price Scatter">
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="overall" name="Integrity Score" domain={[30, 100]}
                  label={{ value: 'Integrity Score', position: 'insideBottom', offset: -10, fontSize: 11 }}
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis dataKey="price" name="Price ($/t)" tickFormatter={v => `$${v}`}
                  label={{ value: 'Price ($/t)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [n.includes('Price') ? `$${v}` : v, n]} />
                <ReferenceLine x={70} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'CCP threshold', fill: T.gold, fontSize: 10 }} />
                <Scatter data={CREDITS} name="Credits" fill={T.teal} opacity={0.7} r={7} />
              </ScatterChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {tab === 'Credit Due Diligence' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 3 }}>Sort by</div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d1c9bc', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                <option value="overall">Integrity Score</option>
                <option value="price">Market Price</option>
                <option value="additionality">Additionality</option>
              </select>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>{flagged} flagged</span>
            </div>
          </div>

          <Section title="Credit Portfolio Due Diligence Scorecard">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['ID', 'Type', 'Registry', 'Country', 'Vintage', 'Integrity', 'Additionality', 'Permanence', 'MRV', 'Co-Benefits', 'Price', 'GW Risk', 'Reversal'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCredits.map((c, i) => (
                    <tr key={c.id} onClick={() => setSelected(c)}
                      style={{ background: c.flag ? '#fff5f5' : i % 2 === 0 ? '#faf9f7' : '#fff', cursor: 'pointer',
                        outline: selected.id === c.id ? `2px solid ${T.gold}` : 'none' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: c.flag ? T.red : T.teal, fontWeight: 700 }}>
                        {c.flag && '⚠ '}{c.id}
                      </td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{c.type}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11, color: T.gray }}>{c.registry}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{c.country}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{c.vintage}</td>
                      <td style={{ padding: '7px 10px' }}><ScoreBar score={c.overall} /></td>
                      <td style={{ padding: '7px 10px' }}><ScoreBar score={c.additionality} /></td>
                      <td style={{ padding: '7px 10px' }}><ScoreBar score={c.permanence} /></td>
                      <td style={{ padding: '7px 10px' }}><ScoreBar score={c.mrv} /></td>
                      <td style={{ padding: '7px 10px' }}><ScoreBar score={c.cobenefits} /></td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.gold }}>${c.price}</td>
                      <td style={{ padding: '7px 10px' }}><RiskBadge level={c.greenwash_risk} /></td>
                      <td style={{ padding: '7px 10px' }}><RiskBadge level={c.reversal_risk} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {selected && (
            <Section title={`Integrity Radar — ${selected.id} (${selected.type})`} badge={`Score: ${selected.overall}/100`}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e0d8" />
                    <PolarAngleAxis dataKey="dim" style={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                    <Radar dataKey="score"     name={selected.id}  stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                    <Radar dataKey="benchmark" name="Benchmark 70" stroke={T.gold} fill="none"  strokeDasharray="4 3" />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                  {[
                    { label: 'Registry', val: selected.registry },
                    { label: 'Country', val: selected.country },
                    { label: 'Vintage', val: selected.vintage },
                    { label: 'Verifier', val: selected.verifier },
                    { label: 'Market Price', val: `$${selected.price}/t` },
                    { label: 'Adjusted Price', val: `$${selected.adjustedPrice}/t` },
                    { label: 'Greenwash Risk', val: selected.greenwash_risk },
                    { label: 'Reversal Risk', val: selected.reversal_risk },
                    { label: 'SDG Coverage', val: `${selected.sdgs} goals` },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0ece4' }}>
                      <span style={{ fontSize: 12, color: T.gray }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.navy, fontFamily: label.includes('Price') ? 'JetBrains Mono, monospace' : 'inherit' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}
        </>
      )}

      {tab === 'ICVCM CCP Assessment' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Overall CCP Score" value="72/100" sub="Above CCP threshold (70)" color={T.emerald} />
            <Kpi label="CCP-Eligible Credits" value="61%" sub="Meet all core carbon principles" color={T.teal} />
            <Kpi label="Weakest Dimension" value="Permanence" sub="Score: 55 — key risk area" color={T.red} />
            <Kpi label="VCMI Claim Ready" value="38%" sub="Meet VCMI Integrity Tier" color={T.gold} />
          </div>

          <Section title="ICVCM Core Carbon Principles — Dimension Scoring" badge="Portfolio Average">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={CCP_DIMS} layout="vertical" margin={{ top: 5, right: 30, left: 110, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis type="category" dataKey="principle" width={110} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}/100`} />
                  <ReferenceLine x={70} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'CCP Min', fill: T.gold, fontSize: 10 }} />
                  <Bar dataKey="score" name="CCP Score" radius={[0, 4, 4, 0]}>
                    {CCP_DIMS.map((d, i) => <Cell key={i} fill={d.score >= 75 ? T.emerald : d.score >= 60 ? T.teal : d.score >= 45 ? T.orange : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div>
                {CCP_DIMS.map((d, i) => (
                  <div key={d.principle} style={{ padding: '8px 0', borderBottom: i < 7 ? '1px solid #f0ece4' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 12, color: T.navy }}>{d.principle}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
                        color: d.score >= 75 ? T.emerald : d.score >= 60 ? T.teal : d.score >= 45 ? T.orange : T.red }}>{d.score}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.gray, marginTop: 2 }}>{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Standards Alignment Matrix">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'left' }}>Standard</th>
                  {['Additionality', 'Permanence', 'MRV', 'Co-Benefits', 'Safeguards', 'Transparency'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STANDARDS.map((s, i) => (
                  <tr key={s} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '7px 12px', fontWeight: 600, fontSize: 12 }}>{s}</td>
                    {[0, 1, 2, 3, 4, 5].map(j => {
                      const req = sr(i * 7 + j * 11) > 0.25;
                      return <td key={j} style={{ padding: '7px 12px', textAlign: 'center', fontSize: 14 }}>{req ? '✅' : '⚠️'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {tab === 'Greenwashing Flags' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="High-Risk Flags Found" value={`${GREENWASH_FLAGS.filter(f => f.severity === 'High' || f.severity === 'Very High').length}`} sub="Across portfolio" color={T.red} />
            <Kpi label="Avg Flag Frequency" value={`${Math.round(GREENWASH_FLAGS.reduce((a, f) => a + f.frequency, 0) / GREENWASH_FLAGS.length)}%`} sub="Of reviewed credits" color={T.orange} />
            <Kpi label="FPIC Compliance" value="62%" sub="Free, Prior & Informed Consent" color={T.teal} />
            <Kpi label="Leakage Assessed" value="71%" sub="Of forest-based projects" color={T.emerald} />
          </div>

          <Section title="Greenwashing Risk Indicators — Frequency & Severity">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Flag', 'Type', 'Frequency', 'Severity', 'Risk Bar'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GREENWASH_FLAGS.sort((a, b) => b.frequency - a.frequency).map((f, i) => (
                  <tr key={f.flag} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{f.flag}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: T.purple }}>{f.type}</td>
                    <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', color: T.teal }}>{f.frequency}%</td>
                    <td style={{ padding: '8px 14px' }}><RiskBadge level={f.severity} /></td>
                    <td style={{ padding: '8px 14px' }}>
                      <div style={{ width: 80, height: 6, background: '#e5e0d8', borderRadius: 3 }}>
                        <div style={{ width: `${f.frequency}%`, height: 6, borderRadius: 3,
                          background: f.severity === 'Very High' ? T.red : f.severity === 'High' ? T.orange : T.gold }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Greenwashing Flag Frequency by Type">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={GREENWASH_FLAGS} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="flag" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9 }} angle={-25} textAnchor="end" height={70} />
                <YAxis tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${v}% of credits`} />
                <Bar dataKey="frequency" name="Frequency %" radius={[3, 3, 0, 0]}>
                  {GREENWASH_FLAGS.map((f, i) => <Cell key={i} fill={
                    f.severity === 'Very High' ? T.red : f.severity === 'High' ? T.orange : f.severity === 'Medium' ? T.gold : T.teal} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {tab === 'Integrity Pricing' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {INTEGRITY_TIERS.map(t => (
              <Kpi key={t.tier} label={t.tier} value={t.premium} sub={`Score ${t.score} · ${t.volume}% of market`} color={t.color} />
            ))}
          </div>

          <Section title="Integrity Tier — Market Price Premium / Discount">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={INTEGRITY_TIERS.map(t => ({ ...t, premiumNum: parseFloat(t.premium) }))}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="tier" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                <YAxis tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${v}% vs market avg`} />
                <ReferenceLine y={0} stroke={T.gray} />
                <Bar dataKey="premiumNum" name="Price Premium/Discount" radius={[3, 3, 0, 0]}>
                  {INTEGRITY_TIERS.map((t, i) => <Cell key={i} fill={t.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Integrity-Adjusted Price vs Market Price — Portfolio Credits">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={CREDITS.slice(0, 12).map(c => ({ id: c.id, market: c.price, adjusted: c.adjustedPrice }))}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="id" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }} />
                <YAxis tickFormatter={v => `$${v}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `$${v.toFixed(2)}/t`} />
                <Bar dataKey="market"   name="Market Price"    fill={T.gray}    radius={[2, 2, 0, 0]} />
                <Bar dataKey="adjusted" name="Integrity-Adj." fill={T.emerald} radius={[2, 2, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}
    </div>
  );
}
