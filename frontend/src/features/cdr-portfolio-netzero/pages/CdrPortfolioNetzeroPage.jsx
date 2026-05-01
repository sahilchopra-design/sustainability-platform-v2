import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

const T = {
  bg: '#F0FDF4', card: '#FFFFFF', border: '#BBF7D0', text: '#14532D',
  sub: '#166534', accent: '#15803D', light: '#DCFCE7',
  cdr: '#0D9488', dac: '#2563EB', biochar: '#B45309', ew: '#16A34A',
  red: '#DC2626', amber: '#D97706', purple: '#7C3AED', ocean: '#0891B2',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CDR_INSTRUMENTS = [
  { id: 'DAC-Geo', name: 'DAC — Geological', lcoc: 600, permanenceTier: 1, volume: 50, irr: 6, risk: 25, additionality: 98, maturity: 'Early Commercial' },
  { id: 'BECCS', name: 'BECCS', lcoc: 200, permanenceTier: 1, volume: 500, irr: 9, risk: 45, additionality: 90, maturity: 'Commercial' },
  { id: 'Biochar', name: 'Biochar', lcoc: 130, permanenceTier: 3, volume: 2000, irr: 12, risk: 35, additionality: 85, maturity: 'Commercial' },
  { id: 'EW-Basalt', name: 'Enhanced Weathering', lcoc: 120, permanenceTier: 2, volume: 1000, irr: 11, risk: 40, additionality: 88, maturity: 'Pilot' },
  { id: 'OAE', name: 'Ocean Alkalinity Enh.', lcoc: 80, permanenceTier: 1, volume: 200, irr: 8, risk: 60, additionality: 80, maturity: 'R&D' },
  { id: 'DACCS-Wind', name: 'DAC + Wind Power', lcoc: 500, permanenceTier: 1, volume: 100, irr: 7, risk: 30, additionality: 99, maturity: 'Early Commercial' },
  { id: 'Kelp', name: 'Kelp/Ocean Biomass', lcoc: 160, permanenceTier: 3, volume: 150, irr: 5, risk: 75, additionality: 60, maturity: 'Pilot' },
  { id: 'EW-Olivine', name: 'EW — Olivine', lcoc: 100, permanenceTier: 2, volume: 500, irr: 13, risk: 45, additionality: 85, maturity: 'R&D' },
];

const PORTFOLIO_TEMPLATES = [
  { name: 'Conservative Net-Zero', dac: 40, beccs: 30, biochar: 20, ew: 10, description: 'High permanence, lower yield — suitable for regulated entities', targetIrr: 8.5 },
  { name: 'Balanced CDR Portfolio', dac: 25, beccs: 20, biochar: 30, ew: 25, description: 'Diversified across permanence tiers and maturity levels', targetIrr: 10.5 },
  { name: 'High-Yield CDR', dac: 10, beccs: 15, biochar: 50, ew: 25, description: 'Maximize returns — accepts lower-permanence instruments', targetIrr: 12.5 },
  { name: 'Frontier Research', dac: 30, beccs: 10, biochar: 10, ew: 20, description: 'R&D focus with ocean CDR exposure, Stripe/Microsoft aligned', targetIrr: 7.0 },
];

const NETZERO_TRAJECTORY = Array.from({ length: 11 }, (_, i) => ({
  year: 2025 + i * 2.5,
  baselineEmissions: Math.round(1000 * Math.pow(0.95, i)),
  avoidance: Math.round(200 * (1 + i * 0.3)),
  cdrRemoval: Math.round(50 * Math.pow(1.5, i)),
  residual: Math.max(0, Math.round(1000 * Math.pow(0.95, i) - 200 * (1 + i * 0.3) - 50 * Math.pow(1.5, i))),
}));

const COST_CURVE = Array.from({ length: 8 }, (_, i) => ({
  volume: Math.round(100 * (i + 1)),
  marginalCost: Math.round(700 - i * 65 + sr(i * 17) * 20),
  avgCost: Math.round(650 - i * 50),
}));

const FRONTIER_BUYERS = [
  { name: 'Stripe Frontier', allocation: 35, focus: 'Pre-commercial CDR only', avgPrice: 850, volume2024: 35000 },
  { name: 'Microsoft', allocation: 25, focus: 'Mix of CDR types', avgPrice: 520, volume2024: 200000 },
  { name: 'Shopify', allocation: 15, focus: 'Biochar + EW focus', avgPrice: 190, volume2024: 20000 },
  { name: 'BCG/McKinsey', allocation: 10, focus: 'Corporate client facilitation', avgPrice: 300, volume2024: 15000 },
  { name: 'Holcim', allocation: 8, focus: 'BECCS + EW for cement', avgPrice: 220, volume2024: 25000 },
  { name: 'Others', allocation: 7, focus: 'Diverse', avgPrice: 180, volume2024: 50000 },
];

const TABS = ['Portfolio Builder', 'Net-Zero Trajectory', 'Cost Curve', 'Buyer Alignment', 'Risk/Return', 'Net-Zero Integration'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.accent }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

export default function CdrPortfolioNetzeroPage() {
  const [tab, setTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [dacPct, setDacPct] = useState(25);
  const [beccsPct, setBeccsPct] = useState(20);
  const [biocharPct, setBiocharPct] = useState(30);
  const [ewPct, setEwPct] = useState(25);
  const [carbonTarget, setCarbonTarget] = useState(150);

  const portfolioStats = useMemo(() => {
    const total = dacPct + beccsPct + biocharPct + ewPct || 1;
    const wdac = dacPct / total;
    const wbeccs = beccsPct / total;
    const wbiochar = biocharPct / total;
    const wew = ewPct / total;
    const dacI = CDR_INSTRUMENTS.find(c => c.id === 'DAC-Geo');
    const beccsI = CDR_INSTRUMENTS.find(c => c.id === 'BECCS');
    const biocharI = CDR_INSTRUMENTS.find(c => c.id === 'Biochar');
    const ewI = CDR_INSTRUMENTS.find(c => c.id === 'EW-Basalt');
    const avgLcoc = Math.round(wdac * dacI.lcoc + wbeccs * beccsI.lcoc + wbiochar * biocharI.lcoc + wew * ewI.lcoc);
    const avgIrr = (wdac * dacI.irr + wbeccs * beccsI.irr + wbiochar * biocharI.irr + wew * ewI.irr).toFixed(1);
    const avgRisk = Math.round(wdac * dacI.risk + wbeccs * beccsI.risk + wbiochar * biocharI.risk + wew * ewI.risk);
    const permanencePct = Math.round(wdac * 100 + wbeccs * 100); // tier 1 only
    const annualCDR = carbonTarget * 1000; // tCO₂
    const annualCost = (annualCDR * avgLcoc / 1e6).toFixed(1);
    return { avgLcoc, avgIrr, avgRisk, permanencePct, annualCDR, annualCost };
  }, [dacPct, beccsPct, biocharPct, ewPct, carbonTarget]);

  const applyTemplate = (idx) => {
    const t = PORTFOLIO_TEMPLATES[idx];
    setSelectedTemplate(idx);
    setDacPct(t.dac);
    setBeccsPct(t.beccs);
    setBiocharPct(t.biochar);
    setEwPct(t.ew);
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.cdr + '22', color: T.cdr, border: `1px solid ${T.cdr}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EH6</span>
            <span style={{ fontSize: 12, color: T.sub }}>CDR Portfolio Construction & Net-Zero Integration</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>CDR Portfolio & Net-Zero Integration Platform</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>Strategic CDR allocation across permanence tiers — portfolio optimization, net-zero pathway integration, and frontier buyer alignment</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Portfolio LCOC" value={`$${portfolioStats.avgLcoc}`} sub="blended weighted avg" color={T.cdr} />
          <KpiCard label="Portfolio IRR" value={`${portfolioStats.avgIrr}%`} sub="blended equity return" color={T.dac} />
          <KpiCard label="Risk Score" value={`${portfolioStats.avgRisk}/100`} sub="lower is better" color={portfolioStats.avgRisk < 40 ? T.ew : T.amber} />
          <KpiCard label="Permanent Tier 1" value={`${portfolioStats.permanencePct}%`} sub="geological + BECCS" color={T.accent} />
          <KpiCard label="Annual Cost" value={`$${portfolioStats.annualCost}M`} sub={`for ${portfolioStats.annualCDR.toLocaleString()} tCO₂`} color={T.biochar} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.cdr : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Portfolio Allocation Builder</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {PORTFOLIO_TEMPLATES.map((t, i) => (
                  <button key={t.name} onClick={() => applyTemplate(i)} style={{ padding: '4px 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: selectedTemplate === i ? T.cdr : T.card, color: selectedTemplate === i ? '#fff' : T.text, fontSize: 11, cursor: 'pointer' }}>{t.name}</button>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: T.sub }}>DAC Geological: {dacPct}%</label>
                <input type="range" min={0} max={60} value={dacPct} onChange={e => setDacPct(Number(e.target.value))} style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: T.sub }}>BECCS: {beccsPct}%</label>
                <input type="range" min={0} max={60} value={beccsPct} onChange={e => setBeccsPct(Number(e.target.value))} style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: T.sub }}>Biochar: {biocharPct}%</label>
                <input type="range" min={0} max={60} value={biocharPct} onChange={e => setBiocharPct(Number(e.target.value))} style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: T.sub }}>Enhanced Weathering: {ewPct}%</label>
                <input type="range" min={0} max={60} value={ewPct} onChange={e => setEwPct(Number(e.target.value))} style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: T.sub }}>CDR Target: {carbonTarget} ktCO₂/yr</label>
                <input type="range" min={10} max={1000} value={carbonTarget} onChange={e => setCarbonTarget(Number(e.target.value))} style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>
                Total allocation: <strong style={{ color: dacPct + beccsPct + biocharPct + ewPct === 100 ? T.cdr : T.red }}>{dacPct + beccsPct + biocharPct + ewPct}%</strong>
                {dacPct + beccsPct + biocharPct + ewPct !== 100 && <span style={{ color: T.red }}> (adjust to 100%)</span>}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Portfolio Allocation</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[{ name: 'Portfolio', dac: dacPct, beccs: beccsPct, biochar: biocharPct, ew: ewPct }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="dac" fill={T.dac} name="DAC" stackId="a" />
                  <Bar dataKey="beccs" fill={T.ew} name="BECCS" stackId="a" />
                  <Bar dataKey="biochar" fill={T.biochar} name="Biochar" stackId="a" />
                  <Bar dataKey="ew" fill={T.cdr} name="Enh. Weathering" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Net-Zero Pathway — Emissions, Avoidance & CDR (ktCO₂)</h3>
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={NETZERO_TRAJECTORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="baselineEmissions" fill={T.red + '22'} stroke={T.red} name="Baseline Emissions" />
                  <Bar dataKey="avoidance" fill={T.amber + 'aa'} name="Avoidance / Reduction" stackId="stack" />
                  <Bar dataKey="cdrRemoval" fill={T.cdr} name="CDR Removal" stackId="stack" />
                  <Line type="monotone" dataKey="residual" stroke={T.purple} strokeWidth={2} strokeDasharray="6 3" name="Residual Emissions" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: T.text, marginTop: 0 }}>CDR Marginal Cost Curve ($/tCO₂ vs Volume)</h3>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={COST_CURVE}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="volume" tick={{ fontSize: 11 }} label={{ value: 'Volume (ktCO₂)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: '$/tCO₂', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="marginalCost" stroke={T.red} strokeWidth={2.5} name="Marginal Cost" dot={false} />
                <Line type="monotone" dataKey="avgCost" stroke={T.cdr} strokeWidth={2.5} name="Average Cost" dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Frontier Buyer Allocation Mix</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={FRONTIER_BUYERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="allocation" fill={T.cdr} radius={[4, 4, 0, 0]} name="Portfolio Allocation %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Buyer Intelligence</h3>
              {FRONTIER_BUYERS.map(b => (
                <div key={b.name} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{b.name}</span>
                    <span style={{ color: T.cdr, fontWeight: 700 }}>${b.avgPrice}/t avg</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.sub }}>{b.focus}</div>
                  <div style={{ fontSize: 11, color: T.accent, marginTop: 2 }}>2024 volume: {b['volume2024'].toLocaleString()} tCO₂</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Risk vs Return by CDR Instrument</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="risk" name="Risk Score" tick={{ fontSize: 11 }} label={{ value: 'Risk Score', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="irr" name="IRR %" tick={{ fontSize: 11 }} label={{ value: 'IRR %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [`${v}`, n]} />
                  <Scatter data={CDR_INSTRUMENTS} fill={T.cdr} fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>CDR Instrument Radar</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={CDR_INSTRUMENTS.slice(0, 6).map(c => ({ subject: c.id, irr: c.irr, additionality: c.additionality / 10, permanence: c.permanenceTier * 30, riskInverse: 100 - c.risk, volume: Math.min(100, c.volume / 20) }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <Radar name="IRR" dataKey="irr" stroke={T.cdr} fill={T.cdr} fillOpacity={0.2} />
                  <Radar name="Additionality" dataKey="additionality" stroke={T.dac} fill={T.dac} fillOpacity={0.2} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Net-Zero Integration Frameworks & Standards</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[
                  { standard: 'SBTi — NET-Zero Standard', role: 'Cap residual at 10% with permanent CDR', relevance: 'Required for SBTi corporate net-zero' },
                  { standard: 'VCMI Claims Code', role: 'Silver/Gold/Platinum CDR tiers', relevance: 'Voluntary market integrity' },
                  { standard: 'ICVCM Core Carbon Principles', role: 'Quality baseline for traded CDR credits', relevance: 'Registry endorsement and buyer confidence' },
                  { standard: 'IFRS S2 (ISSB)', role: 'Disclose CDR strategy, costs, reliance', relevance: 'Mandatory from 2026 for large entities' },
                  { standard: 'EU CBAM / ETS', role: 'CDR may offset CBAM certificates in future', relevance: 'Regulatory optionality for industrial emitters' },
                  { standard: "Oxford Principles for Net-Zero", role: 'Shift portfolio from avoidance to removal over time', relevance: 'Credibility framework for net-zero claims' },
                ].map(s => (
                  <div key={s.standard} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 6 }}>{s.standard}</div>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>{s.role}</div>
                    <div style={{ fontSize: 11, color: T.cdr }}>{s.relevance}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Oxford Principles: Shifting CDR Portfolio Over Time</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={Array.from({ length: 7 }, (_, i) => ({ year: 2025 + i * 4, avoidance: Math.round(80 - i * 10), highDurability: Math.round(10 + i * 12), lowDurability: Math.round(10 - i * 2) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="avoidance" stroke={T.amber} fill={T.amber + '33'} name="Avoidance-based %" stackId="1" />
                  <Area type="monotone" dataKey="lowDurability" stroke={T.ew} fill={T.ew + '33'} name="Low Durability CDR %" stackId="1" />
                  <Area type="monotone" dataKey="highDurability" stroke={T.cdr} fill={T.cdr + '33'} name="High Durability CDR %" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
