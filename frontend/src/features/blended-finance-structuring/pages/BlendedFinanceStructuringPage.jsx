import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', navyL: '#2a4a6f', gold: '#d4a843', goldL: '#e8c060', sage: '#2d6a4f', sageL: '#3d8a6f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const DFI_PROVIDERS = [
  { name: 'IFC (World Bank Group)', type: 'Multilateral', focus: 'Emerging markets, private sector', firstLossCapacity: 8500, guaranteePct: 25, mobilizationRatio: 4.8, regions: 'Global (EM focus)', instruments: 'First loss, guarantee, equity, mezzanine' },
  { name: 'ADB', type: 'Multilateral', focus: 'Asia-Pacific development', firstLossCapacity: 4200, guaranteePct: 20, mobilizationRatio: 4.2, regions: 'Asia-Pacific', instruments: 'First loss, partial credit guarantee, anchor equity' },
  { name: 'AIIB', type: 'Multilateral', focus: 'Asian infrastructure', firstLossCapacity: 2800, guaranteePct: 20, mobilizationRatio: 3.8, regions: 'Asia', instruments: 'First loss, guarantee, co-lending' },
  { name: 'AfDB', type: 'Multilateral', focus: 'African development', firstLossCapacity: 3100, guaranteePct: 30, mobilizationRatio: 3.5, regions: 'Africa', instruments: 'First loss, partial guarantee, TA grants' },
  { name: 'EBRD', type: 'Multilateral', focus: 'Transition economies', firstLossCapacity: 5600, guaranteePct: 22, mobilizationRatio: 4.1, regions: 'EMEA (transition)', instruments: 'First loss, concessional finance, equity' },
  { name: 'EIB', type: 'EU Multilateral', focus: 'EU climate + global scale-up', firstLossCapacity: 9200, guaranteePct: 20, mobilizationRatio: 5.2, regions: 'EU + global', instruments: 'First loss, guarantee, InvestEU' },
  { name: 'US DFC', type: 'Bilateral DFI', focus: 'US foreign policy + development', firstLossCapacity: 3800, guaranteePct: 25, mobilizationRatio: 3.2, regions: 'Global (US allies)', instruments: 'Loan guarantee, equity, political risk insurance' },
  { name: 'OPIC/MIGA', type: 'Risk mitigation', focus: 'Political risk insurance', firstLossCapacity: 2200, guaranteePct: 100, mobilizationRatio: 6.5, regions: 'Global (emerging markets)', instruments: 'Political risk insurance, non-commercial risk' },
];

const TRANCHE_TYPES = [
  { tier: 'First-Loss / Junior', position: 1, returnTarget: '0–8%', riskAbsorbed: 'First 8–15% of losses', provider: 'DFI / Philanthropic / Government', typical: '5–15% of structure', purpose: 'De-risk senior tranches to investment grade' },
  { tier: 'Mezzanine / Sub-Debt', position: 2, returnTarget: '8–14%', riskAbsorbed: 'Next 10–20% of losses', provider: 'Impact Investors / DFI Jr.', typical: '10–25% of structure', purpose: 'Bridge risk-return gap; intermediate layer' },
  { tier: 'Senior / Investment Grade', position: 3, returnTarget: 'Libor/SOFR + 150–300bps', riskAbsorbed: 'Residual after junior absorption', provider: 'Commercial Banks / Institutional', typical: '60–80% of structure', purpose: 'Mobilize large-scale commercial capital' },
  { tier: 'Technical Assistance Grant', position: 0, returnTarget: 'N/A (grant)', riskAbsorbed: 'Project preparation risk', provider: 'Bilateral donors / Foundations', typical: '1–3% of structure', purpose: 'Reduce information asymmetry and preparation costs' },
];

const USE_CASES = [
  { name: 'Climate Infra in SSA', region: 'Sub-Saharan Africa', sector: 'Solar + Grid', dealM: 180, firstLossM: 25, seniorM: 140, mezM: 15, taM: 3, mobilization: 4.5, carbonAvoid: 0.24, irr: 9.2, dfiProvider: 'AfDB + donors' },
  { name: 'Green Urban Housing', region: 'South-East Asia', sector: 'Affordable Green Housing', dealM: 320, firstLossM: 40, seniorM: 245, mezM: 35, taM: 4, mobilization: 4.8, carbonAvoid: 0.18, irr: 7.8, dfiProvider: 'ADB + bilateral' },
  { name: 'Transition Industry LatAm', region: 'Latin America', sector: 'Steel / Cement Decarbonisation', dealM: 420, firstLossM: 55, seniorM: 320, mezM: 45, taM: 5, mobilization: 4.3, carbonAvoid: 0.45, irr: 11.4, dfiProvider: 'IDB + IFC' },
  { name: 'Nature-Based Solutions', region: 'Amazon / Congo Basin', sector: 'Forestry / REDD+', dealM: 95, firstLossM: 18, seniorM: 68, mezM: 9, taM: 2.5, mobilization: 3.4, carbonAvoid: 1.82, irr: 5.1, dfiProvider: 'GCF + bilateral' },
  { name: 'Offshore Wind ASEAN', region: 'Vietnam / Philippines', sector: 'Offshore Wind', dealM: 850, firstLossM: 80, seniorM: 680, mezM: 90, taM: 8, mobilization: 5.8, carbonAvoid: 0.62, irr: 10.8, dfiProvider: 'AIIB + ADB + IFC' },
  { name: 'EV Transition Mobility', region: 'East Africa', sector: 'E-Mobility / E-Bus', dealM: 65, firstLossM: 12, seniorM: 45, mezM: 8, taM: 1.5, mobilization: 3.8, carbonAvoid: 0.08, irr: 8.5, dfiProvider: 'AfDB + bilateral' },
];

const GUARANTEE_STRUCTURES = [
  { type: 'Partial Credit Guarantee', coverage: '15–40% of loan', trigger: 'Credit default', pricing: '50–150bps p.a.', mobilization: '3–5×', bestFor: 'Bank-to-bank lending, bond issuance' },
  { type: 'First-Loss Guarantee', coverage: 'First 8–20% of loss', trigger: 'First default in portfolio', pricing: '30–80bps p.a.', mobilization: '5–8×', bestFor: 'SME lending, microfinance, green ABS' },
  { type: 'Political Risk Insurance', coverage: 'Non-commercial risk (expropriation, CTP)', trigger: 'Government action / currency', pricing: '0.5–2.5% p.a.', mobilization: '6–10×', bestFor: 'Cross-border infrastructure, renewables' },
  { type: 'Currency Risk Guarantee', coverage: 'FX tail risk', trigger: 'Local currency devaluation >X%', pricing: '1.5–4% p.a.', mobilization: '2–4×', bestFor: 'Local currency bonds, EM solar' },
  { type: 'USAID/DFC Blended Guarantee', coverage: 'Blended first loss + credit', trigger: 'Project-level default', pricing: '25–75bps p.a.', mobilization: '4–6×', bestFor: 'US-strategic sectors, energy access' },
];

const MOBILIZATION_DATA = [
  { year: 2015, total: 48, publicConcession: 22, dfiGuarantee: 14, blendedFunds: 12 },
  { year: 2016, total: 58, publicConcession: 26, dfiGuarantee: 18, blendedFunds: 14 },
  { year: 2017, total: 71, publicConcession: 30, dfiGuarantee: 24, blendedFunds: 17 },
  { year: 2018, total: 85, publicConcession: 35, dfiGuarantee: 31, blendedFunds: 19 },
  { year: 2019, total: 98, publicConcession: 40, dfiGuarantee: 38, blendedFunds: 20 },
  { year: 2020, total: 82, publicConcession: 36, dfiGuarantee: 30, blendedFunds: 16 },
  { year: 2021, total: 124, publicConcession: 51, dfiGuarantee: 48, blendedFunds: 25 },
  { year: 2022, total: 156, publicConcession: 62, dfiGuarantee: 62, blendedFunds: 32 },
  { year: 2023, total: 188, publicConcession: 74, dfiGuarantee: 78, blendedFunds: 36 },
  { year: 2024, total: 224, publicConcession: 88, dfiGuarantee: 95, blendedFunds: 41 },
];

const OECD_PRINCIPLES = [
  { principle: 'Additionality', description: 'Public finance must not displace commercial finance that would have occurred without it', implication: 'Demonstrate market failure; DFI terms only where private sector would not otherwise lend' },
  { principle: 'Alignment', description: 'Blended finance should align with development goals (SDGs, Paris Agreement)', implication: 'Target sectors with high climate impact; use results-based finance' },
  { principle: 'Effectiveness', description: 'Public funds should mobilize private capital at maximum leverage ratio', implication: 'Design guarantees to minimize required public capital per $ mobilized' },
  { principle: 'Transparency', description: 'Disclose terms, DFI roles, results and fees to maintain market integrity', implication: 'Impact reporting framework aligned with OECD DAC blended finance principles' },
  { principle: 'Financial Returns', description: 'Private investors should earn risk-adjusted market returns', implication: 'First-loss tranche absorbs downside; senior tranche achieves market pricing' },
];

const TABS = [
  'Overview', 'Structure Builder', 'DFI Landscape', 'Guarantee Structures',
  'OECD Principles', 'Deal Library', 'Mobilization Analytics', 'Concessional Pricing',
  'Impact Metrics', 'FI Origination'
];

function calcBlendedStructure({ totalM, firstLossPct, mezzPct, dfiGuaranteePct, concRateBps, marketRate, wacc }) {
  const seniorPct = 100 - firstLossPct - mezzPct;
  const firstLossM = totalM * firstLossPct / 100;
  const mezzM = totalM * mezzPct / 100;
  const seniorM = totalM * seniorPct / 100;
  const guaranteeM = totalM * dfiGuaranteePct / 100;
  const concessionalRate = (marketRate - concRateBps / 100) / 100;
  const blendedCost = (firstLossM * 0.04 + mezzM * (marketRate / 100) * 0.85 + seniorM * (marketRate / 100)) / totalM;
  const mobilizationRatio = seniorM / (firstLossM + guaranteeM * 0.15);
  const concessionality = (marketRate / 100 - blendedCost) * totalM;
  return {
    firstLossM: firstLossM.toFixed(1), mezzM: mezzM.toFixed(1), seniorM: seniorM.toFixed(1),
    guaranteeM: guaranteeM.toFixed(1), blendedCost: (blendedCost * 100).toFixed(2),
    mobilizationRatio: mobilizationRatio.toFixed(1), concessionality: (concessionality * 1e3).toFixed(0),
    seniorPct: seniorPct.toFixed(1),
  };
}

export default function BlendedFinanceStructuringPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [totalM, setTotalM] = useState(200);
  const [firstLossPct, setFirstLossPct] = useState(12);
  const [mezzPct, setMezzPct] = useState(18);
  const [dfiGuaranteePct, setDfiGuaranteePct] = useState(20);
  const [marketRate, setMarketRate] = useState(8.5);
  const [concRateBps, setConcRateBps] = useState(250);
  const [selectedCase, setSelectedCase] = useState(0);

  const structure = useMemo(() => calcBlendedStructure({ totalM, firstLossPct, mezzPct, dfiGuaranteePct, concRateBps, marketRate, wacc: 8 }), [totalM, firstLossPct, mezzPct, dfiGuaranteePct, concRateBps, marketRate]);

  const trancheViz = useMemo(() => [
    { name: 'Senior / Commercial', value: parseFloat(structure.seniorPct), color: T.navy, m: parseFloat(structure.seniorM) },
    { name: 'Mezzanine', value: mezzPct, color: T.teal, m: parseFloat(structure.mezzM) },
    { name: 'First-Loss', value: firstLossPct, color: T.amber, m: parseFloat(structure.firstLossM) },
  ], [structure, firstLossPct, mezzPct, T]);

  const mobHistory = useMemo(() => MOBILIZATION_DATA, []);

  const dfiChart = useMemo(() => DFI_PROVIDERS.map((d, i) => ({
    name: d.name.split('(')[0].trim(), capacity: d.firstLossCapacity / 1000, ratio: d.mobilizationRatio,
  })), []);

  const concPricingData = useMemo(() => [0, 50, 100, 150, 200, 250, 300, 350, 400, 500].map(conc => ({
    concession: conc, blendedCost: Math.max(2, marketRate - conc / 100 * (firstLossPct + mezzPct) / 100 - 0.5).toFixed(2),
  })), [marketRate, firstLossPct, mezzPct]);

  const s = { padding: '24px', fontFamily: T.font, color: T.text, background: T.bg, minHeight: '100vh' };
  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px', marginBottom: 16 };
  const kpi = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px', textAlign: 'center' };
  const tab = (i) => ({ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: T.font, background: activeTab === i ? T.gold : T.surface, color: activeTab === i ? T.navy : T.text, fontWeight: activeTab === i ? 700 : 400 });
  const sel = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', color: T.text, fontSize: 13, fontFamily: T.mono, width: '100%', cursor: 'pointer' };
  const TIER_COLORS = [T.amber, T.teal, T.navy, T.sage];

  return (
    <div style={s}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🌐</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>Blended Finance Structuring Intelligence Suite</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>EP-DW5 · First-Loss / Mezzanine / Senior Tranching · DFI Guarantee Sizing · Mobilization Analytics · OECD Principles</p>
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
              { label: 'Global Blended Finance Market 2024', value: '$224B', sub: '+19% YoY mobilization' },
              { label: 'Avg Mobilization Ratio', value: '4.5×', sub: 'Private capital per $1 DFI' },
              { label: 'Annual Climate Finance Gap', value: '$2.4T', sub: 'OECD estimate for EM countries' },
              { label: 'SDG Financing Gap (annual)', value: '$4.2T', sub: 'UNCTAD 2023 estimate' },
            ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{k.value}</div><div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Typical Blended Finance Capital Stack</h3>
              <div style={{ display: 'flex', height: 80, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
                {[{ pct: 70, color: T.navy, label: 'Senior Commercial 70%' }, { pct: 18, color: T.teal, label: 'Mezz 18%' }, { pct: 10, color: T.amber, label: 'First-Loss 10%' }, { pct: 2, color: T.sage, label: 'TA 2%' }].map((t, i) => (
                  <div key={i} style={{ width: `${t.pct}%`, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 600, padding: '0 3px', textAlign: 'center' }}>{t.pct >= 15 ? t.label : ''}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TRANCHE_TYPES.map((t, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: T.surfaceH, borderRadius: 6, borderLeft: `3px solid ${TIER_COLORS[i]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, color: T.navy, fontSize: 12 }}>{t.tier}</div>
                      <span style={{ fontSize: 11, fontFamily: T.mono, color: T.teal }}>{t.returnTarget}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{t.purpose}</div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 3 }}><span style={{ color: T.navy }}>Provider: </span>{t.provider}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Blended Finance Mobilization Trend ($Bn)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={MOBILIZATION_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="publicConcession" name="Concessional Finance" stackId="1" stroke={T.amber} fill={T.amber} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="dfiGuarantee" name="DFI Guarantees" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="blendedFunds" name="Blended Funds" stackId="1" stroke={T.teal} fill={T.teal} fillOpacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div>
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Structure Parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Total Deal Size ($M): {totalM}</label><input type="range" min={20} max={1000} step={10} value={totalM} onChange={e => setTotalM(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>First-Loss Tranche (%): {firstLossPct}</label><input type="range" min={3} max={25} step={1} value={firstLossPct} onChange={e => setFirstLossPct(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Mezzanine Tranche (%): {mezzPct}</label><input type="range" min={5} max={35} step={1} value={mezzPct} onChange={e => setMezzPct(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>DFI Guarantee (%): {dfiGuaranteePct}</label><input type="range" min={0} max={40} step={1} value={dfiGuaranteePct} onChange={e => setDfiGuaranteePct(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Market Rate (%): {marketRate}</label><input type="range" min={4} max={18} step={0.5} value={marketRate} onChange={e => setMarketRate(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Concessionality (bps below mkt): {concRateBps}</label><input type="range" min={0} max={500} step={25} value={concRateBps} onChange={e => setConcRateBps(+e.target.value)} style={{ width: '100%' }} /></div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Senior Notional ($M)', value: structure.seniorM },
                  { label: 'Mezzanine ($M)', value: structure.mezzM },
                  { label: 'First-Loss ($M)', value: structure.firstLossM },
                  { label: 'DFI Guarantee ($M)', value: structure.guaranteeM },
                  { label: 'Blended Cost (%)', value: `${structure.blendedCost}%` },
                  { label: 'Mobilization Ratio', value: `${structure.mobilizationRatio}×` },
                ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{k.value}</div></div>)}
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Capital Stack Visualization</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[{ name: 'Capital Stack', ...Object.fromEntries(trancheViz.map(t => [t.name, t.m])) }]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis dataKey="name" type="category" hide />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}M`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {trancheViz.map((t, i) => <Bar key={i} dataKey={t.name} stackId="a" fill={t.color} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Mobilization Sensitivity (First-Loss %)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={[3,5,8,10,12,15,18,20,25].map(fl => ({
                    fl, ratio: ((totalM * (100 - fl - mezzPct) / 100) / (totalM * fl / 100 + totalM * dfiGuaranteePct / 100 * 0.15)).toFixed(1),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="fl" label={{ value: 'First-Loss %', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Mobiliz. Ratio', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                    <ReferenceLine x={firstLossPct} stroke={T.amber} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="ratio" stroke={T.gold} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>DFI First-Loss Capacity vs. Mobilization</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dfiChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$Bn Capacity', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Mob. Ratio', angle: 90, position: 'insideRight', fontSize: 10, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="capacity" name="Capacity ($Bn)" fill={T.navy} radius={[3,3,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="ratio" name="Mob. Ratio" stroke={T.gold} strokeWidth={2} dot={{ r: 4, fill: T.gold }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>DFI Instruments & Focus Areas</h3>
              <div style={{ overflowY: 'auto', maxHeight: 280 }}>
                {DFI_PROVIDERS.map((dfi, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: i % 2 === 0 ? T.surfaceH : 'transparent', borderRadius: 4, marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, color: T.navy, fontSize: 12 }}>{dfi.name}</div>
                      <div style={{ fontSize: 11, fontFamily: T.mono, color: T.teal }}>{dfi.mobilizationRatio}× mobilization</div>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 2 }}>{dfi.focus} · {dfi.regions}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{dfi.instruments}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1,1fr)', gap: 16 }}>
            {GUARANTEE_STRUCTURES.map((g, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: T.navy }}>{g.type}</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surfaceH, padding: '3px 8px', borderRadius: 4, color: T.teal }}>{g.mobilization} mobilization</span>
                    <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surfaceH, padding: '3px 8px', borderRadius: 4, color: T.amber }}>{g.pricing}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[['Coverage', g.coverage], ['Trigger', g.trigger], ['Best For', g.bestFor]].map(([k, v]) => (
                    <div key={k} style={{ padding: '8px', background: T.surfaceH, borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: T.textMut, marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 12, color: T.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {OECD_PRINCIPLES.map((p, i) => (
              <div key={i} style={{ ...card, borderLeft: `4px solid ${[T.navy, T.teal, T.gold, T.sage, T.amber][i]}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: [T.navy, T.teal, T.gold, T.sage, T.amber][i], minWidth: 36 }}>{i+1}.</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 15, marginBottom: 6 }}>{p.principle}</div>
                    <div style={{ fontSize: 13, color: T.text, marginBottom: 8 }}>{p.description}</div>
                    <div style={{ fontSize: 12, color: T.textSec, padding: '8px 12px', background: T.surfaceH, borderRadius: 4 }}>
                      <span style={{ color: T.navy, fontWeight: 600 }}>FI Implication: </span>{p.implication}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {USE_CASES.map((uc, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{uc.name}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>{uc.region} · {uc.sector}</div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surfaceH, padding: '3px 8px', borderRadius: 4 }}>{uc.dfiProvider}</span>
                </div>
                <div style={{ display: 'flex', height: 32, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                  {[
                    { val: uc.firstLossM, color: T.amber, label: `FL $${uc.firstLossM}M` },
                    { val: uc.mezM, color: T.teal, label: `Mz $${uc.mezM}M` },
                    { val: uc.seniorM, color: T.navy, label: `Sr $${uc.seniorM}M` },
                  ].map((t, j) => (
                    <div key={j} style={{ width: `${(t.val / uc.dealM * 100).toFixed(1)}%`, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, color: '#fff', fontWeight: 600 }}>{t.val / uc.dealM > 0.1 ? t.label : ''}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {[
                    { k: 'Total ($M)', v: `$${uc.dealM}M` },
                    { k: 'Mobiliz. Ratio', v: `${uc.mobilization}×` },
                    { k: 'IRR', v: `${uc.irr}%` },
                    { k: 'Carbon Avoid', v: `${uc.carbonAvoid} MtCO₂/yr` },
                    { k: 'TA Grant', v: `$${uc.taM}M` },
                    { k: 'Senior %', v: `${(uc.seniorM / uc.dealM * 100).toFixed(0)}%` },
                  ].map(item => (
                    <div key={item.k} style={{ padding: '6px 8px', background: T.surfaceH, borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: T.textMut }}>{item.k}</div>
                      <div style={{ fontSize: 12, fontFamily: T.mono, color: T.navy, fontWeight: 600 }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Historical Mobilization by Instrument ($Bn)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={mobHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="total" name="Total" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="dfiGuarantee" name="DFI Guarantees" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="publicConcession" name="Concessional" stroke={T.amber} fill={T.amber} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Mobilization Ratio by DFI</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={DFI_PROVIDERS.map(d => ({ name: d.name.split('(')[0].trim(), ratio: d.mobilizationRatio, guarantee: d.guaranteePct }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Bar dataKey="ratio" name="Mobilization Ratio" fill={T.navy} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 7 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Blended Cost vs. Concessionality (bps)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={concPricingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="concession" label={{ value: 'Concession (bps below market)', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Blended Cost %', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Blended Cost']} />
                  <ReferenceLine x={concRateBps} stroke={T.amber} strokeDasharray="4 4" label={{ value: `Current ${concRateBps}bps`, fontSize: 10, fill: T.amber }} />
                  <Line type="monotone" dataKey="blendedCost" stroke={T.navy} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Concessional Pricing Reference</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Provider','Concessional Rate','Pricing Basis','Typical Deal Size'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{[
                  ['GCF (Grant)', '0%', 'Grant window — 100% concessional', '$20–200M'],
                  ['GCF (Loan)', '0.75%', 'Fixed, 40yr, 10yr grace period', '$50–300M'],
                  ['IDA / World Bank', '1.25%', 'Concessional window, 25–40yr', '$10–500M'],
                  ['ADB Concessional', '1.5–2.5%', 'ADF terms + 3.0% blend market', '$20–400M'],
                  ['EBRD Green', '2.5–4.0%', 'Below-market green facility', '$30–250M'],
                  ['EIB Project Finance', 'Benchmark -50bps', 'EUR benchmark minus greenium', '$50M+'],
                ].map(([prov, rate, basis, size], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 8px', color: T.navy, fontWeight: 600 }}>{prov}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.green }}>{rate}</td>
                    <td style={{ padding: '7px 8px', color: T.textSec, fontSize: 11 }}>{basis}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{size}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 8 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Carbon Impact by Deal Type (tCO₂/$M invested)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={USE_CASES.map(u => ({ name: u.name.split(' ').slice(0, 2).join(' '), carbon: (u.carbonAvoid * 1e6 / u.dealM).toFixed(0) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}tCO₂/$M`, 'Carbon Avoid']} />
                  <Bar dataKey="carbon" fill={T.teal} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Key Impact KPIs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { metric: 'Carbon Avoided', unit: 'tCO₂/yr per $M invested', typical: '200–2,000', best: 'Nature-based / RE access' },
                  { metric: 'Energy Access', unit: 'households per $M', typical: '50–500', best: 'Off-grid solar, mini-grids' },
                  { metric: 'Jobs Created', unit: 'FTE per $M', typical: '5–40', best: 'Labor-intensive construction' },
                  { metric: 'SDG Alignment', unit: 'SDGs addressed', typical: '3–7', best: 'Integrated projects' },
                  { metric: 'Mobilization', unit: '$ private per $1 public', typical: '3–6×', best: 'Guarantee-heavy structures' },
                ].map((kp, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '8px', background: T.surfaceH, borderRadius: 6, fontSize: 12 }}>
                    <div><span style={{ color: T.navy, fontWeight: 600 }}>{kp.metric}</span><div style={{ fontSize: 11, color: T.textMut }}>{kp.unit}</div></div>
                    <div style={{ fontFamily: T.mono, color: T.teal }}>{kp.typical}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{kp.best}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 9 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>FI Role in Blended Finance Transactions</h3>
              {[
                { role: 'Lead Arranger', fee: '50–100bps', volume: '$50M–$2Bn', capabilities: 'Structuring, investor relations, legal', competitive: 'Relationships with DFIs, EM experience' },
                { role: 'Senior Lender', fee: 'SOFR + 150–300bps', volume: '$20M–$500M', capabilities: 'Credit underwriting, monitoring', competitive: 'Balance sheet, cross-sell' },
                { role: 'Mezzanine Provider', fee: 'Market + 200–400bps', volume: '$10M–$100M', capabilities: 'Risk appetite, deal sourcing', competitive: 'Specialist mandates, impact returns' },
                { role: 'Guarantee Issuer', fee: '30–100bps p.a.', volume: '$10M–$300M', capabilities: 'Credit assessment, risk pricing', competitive: 'DFI relationships, local network' },
                { role: 'Fund Manager', fee: '1.5–2.0% + carry', volume: '$100M–$1Bn', capabilities: 'Portfolio management, reporting', competitive: 'Track record, accreditation' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '10px 12px', background: i % 2 === 0 ? T.surfaceH : 'transparent', borderRadius: 4, marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{r.role}</div>
                    <span style={{ fontSize: 11, fontFamily: T.mono, color: T.gold }}>{r.fee}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{r.capabilities}</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 3 }}><span style={{ color: T.teal }}>Competitive edge: </span>{r.competitive}</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>FI Revenue Model ($M deal, blended)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { component: 'Arrangement (75bps)', rev: totalM * 0.0075 },
                  { component: 'Annual Mgmt (0.12%×5yr)', rev: totalM * 0.0012 * 5 },
                  { component: 'FX Hedge Revenue', rev: totalM * 0.002 * 5 },
                  { component: 'Technical Assistance Mgt', rev: totalM * 0.0003 * 5 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="component" tick={{ fontSize: 10, fill: T.textSec }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v.toFixed(2)}M`, 'Revenue']} />
                  <Bar dataKey="rev" fill={T.gold} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, padding: '12px', background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Estimated Total 5yr FI Revenue:</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.navy }}>${(totalM * (0.0075 + 0.0012*5 + 0.002*5 + 0.0003*5)).toFixed(1)}M</div>
                <div style={{ fontSize: 11, color: T.textMut }}>Arrangement + Servicing + FX hedge + TA management</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
