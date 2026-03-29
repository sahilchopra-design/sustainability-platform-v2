import React, { useState, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ReferenceLine, ComposedChart, Line
} from 'recharts';
import DataUploadPanel from '../../../components/DataUploadPanel';
import { useTestData } from '../../../context/TestDataContext';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const SCENARIO_TO_TOGGLE = {
  NGFS_P3_NET_ZERO_2050: 'nze',  NGFS_P3_BELOW_2C: 'nze', NGFS_P3_LOW_DEMAND: 'nze',
  NGFS_P3_DELAYED_2C: 'aps',     NGFS_P3_DIVERGENT_NZ: 'aps',
  NGFS_P3_NATIONALLY_NDC: 'steps', NGFS_P3_CURRENT_POLICIES: 'steps', NGFS_P3_HIGH_DEMAND: 'steps',
};
const IMPAIR_MULT = { Energy: 0.35, Mining: 0.45, Utilities: 0.28, Materials: 0.20, Industrials: 0.10 };

const BASE_PHASE_OUT = [
  { id: 'coal-power',   tech: 'Coal Power',    sector: 'Utilities', nze: 2030, aps: 2037, steps: 2048, book_usd: 1400e9, country: 'India' },
  { id: 'gas-power',    tech: 'Gas Power',     sector: 'Utilities', nze: 2038, aps: 2042, steps: 2055, book_usd: 860e9,  country: 'India' },
  { id: 'coal-mining',  tech: 'Coal Mining',   sector: 'Mining',    nze: 2032, aps: 2039, steps: 2050, book_usd: 580e9,  country: 'India' },
  { id: 'oil-upstream', tech: 'Oil Upstream',  sector: 'Energy',    nze: 2040, aps: 2046, steps: 2060, book_usd: 920e9,  country: 'India' },
  { id: 'lng-terminal', tech: 'LNG Terminal',  sector: 'Energy',    nze: 2042, aps: 2048, steps: 2065, book_usd: 340e9,  country: 'India' },
  { id: 'oil-refinery', tech: 'Oil Refinery',  sector: 'Materials', nze: 2038, aps: 2043, steps: 2058, book_usd: 440e9,  country: 'India' },
];

const DEMAND_DATA = [
  { year: 2025, nze: 100, aps: 100, steps: 100 },
  { year: 2030, nze: 78,  aps: 88,  steps: 97  },
  { year: 2035, nze: 55,  aps: 73,  steps: 92  },
  { year: 2040, nze: 33,  aps: 58,  steps: 86  },
  { year: 2045, nze: 16,  aps: 42,  steps: 78  },
  { year: 2050, nze: 5,   aps: 28,  steps: 70  },
];

const CURRENT_YEAR = 2026;
const BADGE = (label, color) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`,
    border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 6px' }}>{label}</span>
);

const MANUAL_FIELDS = [
  { key: 'id',              label: 'Reserve ID',          type: 'text',   defaultValue: 'RSRV-001' },
  { key: 'tech',            label: 'Technology',          type: 'select', options: ['Coal Power','Gas Power','Coal Mining','Oil Upstream','LNG Terminal','Oil Refinery','Solar','Wind'], defaultValue: 'Coal Power' },
  { key: 'sector',          label: 'Sector',              type: 'select', options: ['Energy','Mining','Utilities','Materials'], defaultValue: 'Utilities' },
  { key: 'book_usd',        label: 'Book Value (USD)',     type: 'number', defaultValue: 500000000 },
  { key: 'nze',             label: 'Phase-Out Yr (NZE)',  type: 'number', defaultValue: 2035 },
  { key: 'aps',             label: 'Phase-Out Yr (APS)',  type: 'number', defaultValue: 2040 },
  { key: 'steps',           label: 'Phase-Out Yr (STEPS)',type: 'number', defaultValue: 2050 },
  { key: 'country',         label: 'Country',             type: 'select', options: ['India','China','USA','EU','Other'], defaultValue: 'India' },
];

export default function StrandedAssetsPage() {
  const ctx = useTestData();
  const [assets, setAssets]               = useState(BASE_PHASE_OUT);
  const [scenario, setScenario]           = useState(
    SCENARIO_TO_TOGGLE[ctx.selectedNgfsScenarioId] || 'nze'
  );
  const [discountRate, setDiscountRate]   = useState(ctx.discountRate || 0.08);
  const [targetYears, setTargetYears]     = useState([2030, 2035, 2040, 2050]);
  const [techFilter, setTechFilter]       = useState(new Set());
  const [editCell, setEditCell]           = useState(null);  // { id, col }
  const [editVal, setEditVal]             = useState('');
  const [calcResult, setCalcResult]       = useState(null);
  const [calcLoading, setCalcLoading]     = useState(false);
  const [inputOpen, setInputOpen]         = useState(false);
  const [targetYr, setTargetYr]           = useState(2030);

  // Sync scenario from NGFS context
  const ctxToggle = SCENARIO_TO_TOGGLE[ctx.selectedNgfsScenarioId];
  const displayScenario = ctxToggle || scenario;

  // Pre-filled from Portfolio VaR — energy/mining holdings
  const linkedHoldings = useMemo(() =>
    ctx.portfolioHoldings.filter(h => ['Energy','Mining','Utilities','Materials'].includes(h.sector)),
    [ctx.portfolioHoldings]
  );
  const linkedExposure = linkedHoldings.reduce((s, h) =>
    s + h.exposure_usd * (IMPAIR_MULT[h.sector] || 0.15), 0);

  const handleDataParsed = (rows) => {
    const parsed = rows.map(r => ({
      id: r.reserve_id || r.id || `R${Date.now()}`,
      tech: r.tech_type || r.tech || 'Coal Power',
      sector: r.sector || 'Energy',
      book_usd: Number(r.book_value_usd || r.book_usd || r.estimated_value_usd || 0),
      nze: Number(r.phase_out_nze || r.nze || 2035),
      aps: Number(r.phase_out_aps || r.aps || 2040),
      steps: Number(r.phase_out_steps || r.steps || 2050),
      country: r.country || 'India',
    })).filter(a => a.book_usd > 0);
    if (parsed.length) setAssets(prev => [...prev, ...parsed]);
    ctx.setReserveIds(parsed.map(a => a.id));
  };

  // Client-side impairment calc
  const impairmentResults = useMemo(() => {
    return assets.map(a => {
      const phaseOut = a[displayScenario];
      const remainLife = Math.max(0, phaseOut - CURRENT_YEAR);
      const pv = a.book_usd / Math.pow(1 + discountRate, remainLife);
      const impairment = a.book_usd - pv;
      const impairPct = (impairment / a.book_usd) * 100;
      return { ...a, phaseOut, remainLife, pv, impairment, impairPct };
    });
  }, [assets, displayScenario, discountRate]);

  const totalImpairment = impairmentResults.reduce((s, a) => s + a.impairment, 0);
  const totalBook = impairmentResults.reduce((s, a) => s + a.book_usd, 0);

  const filteredAssets = techFilter.size > 0
    ? impairmentResults.filter(a => techFilter.has(a.tech)) : impairmentResults;

  // Inline edit handler
  const saveEdit = (id, col) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, [col]: Number(editVal) } : a));
    setEditCell(null);
  };

  const runAPICalc = async () => {
    setCalcLoading(true);
    try {
      const res = await axios.post(`${API}/api/v1/stranded-assets/calculate/reserve-impairment`, {
        reserve_ids: assets.map(a => a.id),
        scenario_id: ctx.selectedNgfsScenarioId || '880e8400-e29b-41d4-a716-446655440001',
        target_years: targetYears,
        discount_rate: discountRate,
      });
      setCalcResult({ ...res.data, source: 'api' });
    } catch {
      setCalcResult({ demo: true, source: 'client', results: impairmentResults });
    } finally { setCalcLoading(false); }
  };

  const allTechs = [...new Set(assets.map(a => a.tech))];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>Stranded Asset Analyzer</h1>
          <p style={{ color: T.sub, fontSize: 12, margin: '4px 0 0' }}>
            Upload reserves CSV · Editable phase-out table · Client-side impairment calc · Synced from Portfolio VaR & NGFS · EP-D1
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {ctxToggle && ctxToggle !== scenario && (
            <div style={{ fontSize: 11, color: T.blue, background: '#eff6ff', padding: '4px 10px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
              ↻ Scenario synced from NGFS: {ctx.selectedNgfsScenarioId?.replace('NGFS_P3_','').replace(/_/g,' ')}
            </div>
          )}
          {['nze','aps','steps'].map(s => (
            <button key={s} onClick={() => setScenario(s)} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: displayScenario === s ? T.navy : T.card,
              color: displayScenario === s ? '#fff' : T.sub,
              border: `1px solid ${displayScenario === s ? T.navy : T.border}`,
            }}>{s.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Regulatory Context Bar */}
      <div style={{
        background: `${T.navy}08`, border: `1px solid ${T.navy}20`,
        borderLeft: `3px solid ${T.navy}`, borderRadius: 8,
        padding: '8px 16px', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 4 }}>REGULATORY BASIS</span>
          {[
            { label: 'RBI Climate Guidelines 2023', color: T.red },
            { label: 'SEBI BRSR Core — Principle 6', color: T.amber },
            { label: 'TCFD Forward Scenario Analysis', color: T.navy },
            { label: 'IND AS 109 / IFRS 9 ECL', color: T.blue },
          ].map(r => (
            <span key={r.label} style={{ fontSize: 10, fontWeight: 700, color: r.color,
              background: `${r.color}12`, border: `1px solid ${r.color}30`,
              borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>{r.label}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>METHOD</span>
          <span style={{ fontSize: 11, color: T.navy, fontWeight: 600 }}>IEA WEO 2023 Phase-Out × DCF Impairment</span>
          <span style={{ fontSize: 9, color: T.amber, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 3, padding: '1px 6px' }}>IEA WEO 2023</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>PRIMARY USER</span>
          <span style={{ fontSize: 11, color: T.navy, fontWeight: 600, background: `${T.gold}22`, border: `1px solid ${T.gold}44`, borderRadius: 4, padding: '2px 8px' }}>Credit Risk / Climate Analyst</span>
        </div>
      </div>

      {/* Analyst Workflow Steps */}
      <div style={{ display: 'flex', alignItems: 'stretch', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        {[
          { n: 1, title: 'Upload Reserves', desc: 'CSV or manual entry · book values + phase-out years per technology' },
          { n: 2, title: 'Set Parameters', desc: 'NGFS scenario (synced from EP-D6) · discount rate (RBI: 8–10%)' },
          { n: 3, title: 'Review Impairments', desc: 'Per-asset PV impairment · assets >60% → IND AS 109 Stage 2/3 ECL' },
          { n: 4, title: 'Export & Report', desc: 'Download CSV for credit committee · feeds CSRD ESRS E1 disclosure' },
        ].map((s, i) => (
          <div key={s.n} style={{ flex: 1, padding: '10px 14px', borderRight: i < 3 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: T.navy, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{s.title}</div>
                <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Input Panel */}
      <DataUploadPanel
        isOpen={inputOpen}
        onToggle={() => setInputOpen(o => !o)}
        title={`Reserve Assets Input — ${assets.length} asset${assets.length !== 1 ? 's' : ''} loaded`}
        manualFields={MANUAL_FIELDS}
        csvTemplate="reserve_id,tech_type,sector,book_value_usd,phase_out_nze,phase_out_aps,phase_out_steps,country"
        onDataParsed={handleDataParsed}
        contextBanner={linkedHoldings.length > 0
          ? `🔗 ${linkedHoldings.length} holdings synced from Portfolio VaR (${linkedHoldings.map(h=>h.sector).join(', ')}) · Linked stranded exposure: $${(linkedExposure/1e6).toFixed(1)}M`
          : null}
      />

      {/* Controls */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>
              Discount Rate: <strong style={{ color: T.navy }}>{(discountRate * 100).toFixed(1)}%</strong>
            </label>
            <input type="range" min={0.04} max={0.15} step={0.005} value={discountRate}
              onChange={e => { setDiscountRate(Number(e.target.value)); ctx.setDiscountRate(Number(e.target.value)); }}
              style={{ width: '100%', accentColor: T.navy }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>
              Target Year (Chart): <strong style={{ color: T.navy }}>{targetYr}</strong>
            </label>
            <input type="range" min={2025} max={2055} step={5} value={targetYr}
              onChange={e => setTargetYr(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.amber }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>Tech Filter</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {allTechs.map(t => (
                <button key={t} onClick={() => setTechFilter(p => { const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n; })} style={{
                  padding: '3px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                  background: techFilter.has(t) ? T.navy : T.card, color: techFilter.has(t) ? '#fff' : T.sub,
                  border: `1px solid ${techFilter.has(t) ? T.navy : T.border}`,
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>Target Years</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[2030, 2035, 2040, 2050].map(y => (
                <button key={y} onClick={() => setTargetYears(p => p.includes(y) ? p.filter(x=>x!==y) : [...p, y])} style={{
                  flex: 1, padding: '6px 4px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  background: targetYears.includes(y) ? T.navy : T.card, color: targetYears.includes(y) ? '#fff' : T.sub,
                  border: `1px solid ${targetYears.includes(y) ? T.navy : T.border}`,
                }}>{y}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Book Value',        value: `$${(totalBook/1e12).toFixed(1)}T`,      sub: `${assets.length} assets`, color: T.navy },
          { label: `Impairment (${displayScenario.toUpperCase()})`, value: `$${(totalImpairment/1e12).toFixed(1)}T`, sub: `${(totalImpairment/totalBook*100).toFixed(0)}% of book`, color: T.red },
          { label: 'Discount Rate',           value: `${(discountRate*100).toFixed(1)}%`,      sub: 'WACC for PV calc', color: T.amber },
          { label: 'Earliest Phase-Out',      value: `${Math.min(...assets.map(a => a[displayScenario]))}`, sub: `${displayScenario.toUpperCase()} scenario`, color: T.red },
          { label: 'Linked Portfolio Risk',   value: `$${(linkedExposure/1e6).toFixed(0)}M`,  sub: `${linkedHoldings.length} holdings`, color: T.gold },
          { label: 'Assets at Risk',          value: impairmentResults.filter(a => a.impairPct > 20).length, sub: '>20% impairment', color: T.amber },
        ].map((k, i) => (
          <div key={i} style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
            borderTop: `3px solid ${k.color}`, padding: '12px 14px',
            boxShadow: '0 1px 4px rgba(27,58,92,0.06)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{k.value}</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 3 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: T.sage, marginTop: 1 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Output Interpretation Banner */}
      <div style={{
        background: '#f0fdf4', border: '1px solid #bbf7d0', borderLeft: `3px solid ${T.sage}`,
        borderRadius: 8, padding: '10px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ color: T.sage, fontSize: 16, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sage, marginBottom: 3 }}>
            Output Interpretation — IND AS 109 / IFRS 9 Credit Risk Integration
          </div>
          <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.6 }}>
            Total impairment of <strong>${(totalImpairment/1e12).toFixed(2)}T</strong> ({(totalImpairment/totalBook*100).toFixed(0)}% of book) represents forward-looking Expected Credit Losses (ECL) under the <strong>{displayScenario.toUpperCase()}</strong> scenario.
            {' '}Assets with impairment &gt;60% should be escalated for <strong>Stage 2/3 classification</strong> under IND AS 109.
            {impairmentResults.filter(a => a.impairPct > 60).length > 0 && (
              <span style={{ color: T.red, fontWeight: 600 }}>
                {' '}⚠ {impairmentResults.filter(a => a.impairPct > 60).length} asset(s) exceed 60% impairment — immediate credit review required (RBI Climate Guidelines §4.2).
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Demand Trajectory Area Chart */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>
            Fossil Demand Trajectory — {displayScenario.toUpperCase()} highlighted
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={DEMAND_DATA} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 110]} />
              <Tooltip formatter={v => [`${v}%`]} contentStyle={{ fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area dataKey="steps" stroke={T.sage}  fill={T.sage}  fillOpacity={displayScenario === 'steps' ? 0.25 : 0.05} strokeWidth={displayScenario === 'steps' ? 2.5 : 1} name="STEPS" />
              <Area dataKey="aps"   stroke={T.amber} fill={T.amber} fillOpacity={displayScenario === 'aps'   ? 0.25 : 0.05} strokeWidth={displayScenario === 'aps'   ? 2.5 : 1} name="APS"   />
              <Area dataKey="nze"   stroke={T.red}   fill={T.red}   fillOpacity={displayScenario === 'nze'   ? 0.25 : 0.05} strokeWidth={displayScenario === 'nze'   ? 2.5 : 1} name="NZE"   />
              <ReferenceLine x={targetYr} stroke={T.gold} strokeDasharray="4 2"
                label={{ value: targetYr, fontSize: 9, fill: T.amber, position: 'insideTopRight' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Impairment vs Phase-Out Combo */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>
            Impairment % vs Phase-Out Year ({displayScenario.toUpperCase()})
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={filteredAssets.map(a => ({
              name: a.tech.split(' ')[0], impairPct: parseFloat(a.impairPct.toFixed(1)), phaseOut: a.phaseOut,
            }))} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="left"  tick={{ fontSize: 9 }} unit="%" domain={[0,100]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} domain={[2025, 2070]} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar  yAxisId="left"  dataKey="impairPct" fill={T.red}   name="Impairment %" radius={[3,3,0,0]} />
              <Line yAxisId="right" dataKey="phaseOut"  stroke={T.amber} strokeWidth={2} name="Phase-Out Yr" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Editable Phase-Out Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
            Phase-Out × Impairment Table
            <span style={{ fontSize: 11, fontWeight: 400, color: T.sub, marginLeft: 8 }}>Click any year cell to edit</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => {
              const csv = ['Asset ID,Technology,Sector,Book Value USD,Phase-Out Year,Remaining Life (Y),PV USD,Impairment USD,Impairment %',
                ...impairmentResults.map(a =>
                  [a.id, a.tech, a.sector, a.book_usd, a.phaseOut, a.remainLife,
                   a.pv.toFixed(0), a.impairment.toFixed(0), a.impairPct.toFixed(1)].join(',')
                )
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const lnk = document.createElement('a');
              lnk.href = URL.createObjectURL(blob);
              lnk.download = `stranded_assets_${displayScenario}_${new Date().toISOString().slice(0,10)}.csv`;
              lnk.click();
            }} style={{
              padding: '7px 14px', background: T.card, color: T.navy,
              border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>↓ Export CSV</button>
            <button onClick={runAPICalc} disabled={calcLoading} style={{
              padding: '7px 16px', background: T.navy, color: '#fff', border: 'none',
              borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: calcLoading ? 'wait' : 'pointer',
              opacity: calcLoading ? 0.7 : 1,
            }}>{calcLoading ? 'Running…' : 'Run API Calc →'}</button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f8f7f4' }}>
              {['Technology','Sector','Book Value','NZE Yr','APS Yr','STEPS Yr','Remain Life','PV ('+displayScenario.toUpperCase()+')','Impairment $','Impairment %'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, fontWeight: 600,
                  color: T.sub, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((a, i) => (
              <tr key={a.id} style={{ background: i%2===0?'#fff':'#fafaf8', borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{a.tech}</td>
                <td style={{ padding: '7px 10px' }}>{BADGE(a.sector, a.sector==='Mining'?'#b45309':a.sector==='Energy'?T.red:T.amber)}</td>
                <td style={{ padding: '7px 10px', color: T.text }}>${(a.book_usd/1e9).toFixed(0)}bn</td>
                {['nze','aps','steps'].map(col => (
                  <td key={col} onClick={() => { setEditCell({id:a.id,col}); setEditVal(String(a[col])); }}
                    style={{ padding: '7px 10px', cursor: 'pointer', fontWeight: 600,
                      color: col==='nze'?T.red:col==='aps'?T.amber:T.sage,
                      background: editCell?.id===a.id&&editCell?.col===col ? '#fffbeb' : undefined }}>
                    {editCell?.id === a.id && editCell?.col === col
                      ? <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                          onBlur={() => saveEdit(a.id, col)}
                          onKeyDown={e => e.key==='Enter' && saveEdit(a.id, col)}
                          style={{ width: 56, padding: '2px 4px', fontSize: 11, border: `1px solid ${T.gold}`, borderRadius: 3 }} />
                      : a[col]
                    }
                  </td>
                ))}
                <td style={{ padding: '7px 10px', color: T.sub }}>{a.remainLife}Y</td>
                <td style={{ padding: '7px 10px', color: T.blue }}>${(a.pv/1e9).toFixed(0)}bn</td>
                <td style={{ padding: '7px 10px', color: T.red, fontWeight: 700 }}>-${(a.impairment/1e9).toFixed(0)}bn</td>
                <td style={{ padding: '7px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 50, height: 6, background: '#e5e7eb', borderRadius: 3 }}>
                      <div style={{ width: `${Math.min(a.impairPct,100)}%`, height: '100%', borderRadius: 3,
                        background: a.impairPct > 60 ? T.red : a.impairPct > 30 ? T.amber : T.sage }} />
                    </div>
                    <strong style={{ color: a.impairPct > 60 ? T.red : a.impairPct > 30 ? T.amber : T.sage }}>
                      {a.impairPct.toFixed(0)}%
                    </strong>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* API Result */}
      {calcResult && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            Calculation Result — {calcResult.source === 'api' ? '✓ API Response' : '⚠ Client-side (Seed data mode)'}
          </div>
          {calcResult.demo
            ? (
              <div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>
                  Client-side calculation · Discount rate: <strong style={{ color: T.navy }}>{(discountRate*100).toFixed(1)}%</strong>
                  {' '}· Scenario: <strong style={{ color: T.navy }}>{displayScenario.toUpperCase()}</strong>
                  {' '}· {impairmentResults.length} assets · Total impairment:{' '}
                  <strong style={{ color: T.red }}>-${(totalImpairment/1e9).toFixed(1)}bn</strong>
                  {' '}({(totalImpairment/totalBook*100).toFixed(0)}% of book)
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#f0ede7' }}>
                        {['Asset ID','Technology','Book Value','Phase-Out Yr','Remain Life','PV (Discounted)','Impairment $','Impairment %'].map(h => (
                          <th key={h} style={{ padding: '5px 10px', textAlign: 'left', fontSize: 9, fontWeight: 700,
                            color: T.sub, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {impairmentResults.map((a, i) => (
                        <tr key={a.id} style={{ background: i%2===0 ? '#fff' : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '5px 10px', fontWeight: 600, color: T.navy, fontSize: 10 }}>{a.id}</td>
                          <td style={{ padding: '5px 10px', color: T.text, fontSize: 10 }}>{a.tech}</td>
                          <td style={{ padding: '5px 10px', color: T.text, fontSize: 10 }}>${(a.book_usd/1e9).toFixed(1)}bn</td>
                          <td style={{ padding: '5px 10px', fontWeight: 700, fontSize: 10,
                            color: displayScenario==='nze' ? T.red : displayScenario==='aps' ? T.amber : T.sage }}>
                            {a.phaseOut}
                          </td>
                          <td style={{ padding: '5px 10px', color: T.sub, fontSize: 10 }}>{a.remainLife}Y</td>
                          <td style={{ padding: '5px 10px', color: T.blue, fontWeight: 600, fontSize: 10 }}>${(a.pv/1e9).toFixed(2)}bn</td>
                          <td style={{ padding: '5px 10px', color: T.red, fontWeight: 700, fontSize: 10 }}>
                            -{(a.impairment/1e9).toFixed(2)}bn
                          </td>
                          <td style={{ padding: '5px 10px', fontSize: 10 }}>
                            <span style={{ fontWeight: 700,
                              color: a.impairPct > 60 ? T.red : a.impairPct > 30 ? T.amber : T.sage }}>
                              {a.impairPct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
            : <pre style={{ fontSize: 10, background: '#f8f7f4', padding: 10, borderRadius: 7, overflow: 'auto', maxHeight: 200, margin: 0, color: T.text }}>
                {JSON.stringify(calcResult, null, 2)}
              </pre>
          }
        </div>
      )}

      <div style={{ fontSize: 11, color: T.sub, marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
        IEA WEO 2023 · Scenario synced from NGFS module · Holdings synced from Portfolio VaR · Click phase-out years to edit · EP-D1
      </div>
    </div>
  );
}
