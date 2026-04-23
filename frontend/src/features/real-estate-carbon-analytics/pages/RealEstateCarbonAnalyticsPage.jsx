import React, { useState, useMemo } from 'react';
import BuiltEnvironmentAdvancedAnalytics from '../../_shared/BuiltEnvironmentAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  CartesianGrid, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const T = {
  bg:'#f8f6f0', surface:'#ffffff', surfaceH:'#f1ede4',
  border:'#e2ded5', borderL:'#ede9e0',
  navy:'#1e3a5f', navyL:'#2d5282', gold:'#b8860b', goldL:'#d4a017',
  sage:'#4d7c5f', sageL:'#6aad84', teal:'#0f766e',
  text:'#1a1a2e', textSec:'#6b7280', textMut:'#9ca3af',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  font:'DM Sans, sans-serif', mono:'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmt0 = v => Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });
const fmt1 = v => Number(v).toFixed(1);
const fmt2 = v => Number(v).toFixed(2);

// CRREM 1.5°C and 2°C carbon intensity pathways (kgCO₂/m²/yr) by sector — 2025 budget
const CRREM = {
  Office:       { b15: 35, b20: 45 },
  Retail:       { b15: 40, b20: 52 },
  Industrial:   { b15: 60, b20: 78 },
  Residential:  { b15: 25, b20: 33 },
  Hotel:        { b15: 45, b20: 58 },
  'Mixed-Use':  { b15: 38, b20: 49 },
};

const SECTORS = Object.keys(CRREM);
const REGIONS = ['London', 'South East', 'North West', 'Yorkshire', 'Midlands', 'Scotland', 'South West', 'Wales'];
const EPC_GRADES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Embodied carbon benchmarks (kgCO₂e/m²) — A1-A5 lifecycle stages
const EMBODY_BENCH = {
  Office:       { a1a3: 380, a4a5: 95 },
  Retail:       { a1a3: 340, a4a5: 80 },
  Industrial:   { a1a3: 260, a4a5: 65 },
  Residential:  { a1a3: 420, a4a5: 105 },
  Hotel:        { a1a3: 450, a4a5: 115 },
  'Mixed-Use':  { a1a3: 400, a4a5: 100 },
};

// EPC → operational carbon intensity base (kgCO₂/m²/yr)
const EPC_OCI = { A:18, B:32, C:55, D:82, E:115, F:155, G:200 };

// Generate 80 properties
const PROPERTIES = Array.from({ length: 80 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const region = REGIONS[Math.floor(sr(i * 11) * REGIONS.length)];
  const epc = EPC_GRADES[Math.floor(sr(i * 13) * EPC_GRADES.length)];
  const epcIdx = EPC_GRADES.indexOf(epc);
  const gia = Math.round(500 + sr(i * 17) * 19500); // m² GIA
  const age = Math.round(1950 + sr(i * 23) * 73);   // construction year
  const ownershipPct = Math.round(5 + sr(i * 29) * 95); // %

  // Embodied carbon (A1-A5)
  const bench = EMBODY_BENCH[sector];
  const a1a3 = Math.round(bench.a1a3 * (0.85 + sr(i * 31) * 0.30)); // kgCO₂e/m²
  const a4a5 = Math.round(bench.a4a5 * (0.80 + sr(i * 37) * 0.40));
  const bLifeMaint = Math.round(120 + sr(i * 41) * 180); // B2-B5 maintenance over 60yr life
  const cDemolit  = Math.round(15 + sr(i * 43) * 40);   // C1-C4 end-of-life
  const d_reuse   = -Math.round(10 + sr(i * 47) * 50);  // D credits
  const embodiedTotal = a1a3 + a4a5 + bLifeMaint + cDemolit + d_reuse;

  // Operational carbon intensity (kgCO₂/m²/yr)
  const ociBase = EPC_OCI[epc];
  const oci = Math.round(ociBase * (0.88 + sr(i * 53) * 0.24));

  // Whole-life carbon over 60 years (tCO₂e total)
  const opCarbonTotal = oci * gia * 60 / 1000; // t
  const embCarbonTotal = embodiedTotal * gia / 1000; // t
  const wholeLifeCarbon = opCarbonTotal + embCarbonTotal;

  // CRREM pathway
  const crrem = CRREM[sector];
  const overshoot15 = Math.max(0, oci - crrem.b15);
  const overshoot20 = Math.max(0, oci - crrem.b20);
  const aligned15 = overshoot15 === 0;
  const aligned20 = overshoot20 === 0;
  const strandYr15 = aligned15 ? 2060
    : Math.min(2045, Math.round(2025 + (crrem.b15 / (overshoot15 + 1)) * 6 + sr(i * 59) * 4));
  const strandYr20 = aligned20 ? 2055
    : Math.min(2050, Math.round(2025 + (crrem.b20 / (overshoot20 + 1)) * 8 + sr(i * 61) * 5));

  // PCAF financed emissions (tCO₂e attributable)
  const pcafAttr = wholeLifeCarbon * ownershipPct / 100;
  const pcafPerM2 = pcafAttr * 1000 / gia; // kgCO₂e/m² attributable

  // Asset value
  const valuePerM2 = 3000 + epcIdx * -200 + sr(i * 67) * 4000; // £/m²
  const assetValue = Math.round(gia * valuePerM2 / 1000); // £k

  // Carbon cost at various price points
  const annualOpCarbon = oci * gia / 1000; // tCO₂e/yr
  const costAt50  = annualOpCarbon * 50;
  const costAt100 = annualOpCarbon * 100;
  const costAt150 = annualOpCarbon * 150;

  // Net zero gap (% reduction needed to hit 1.5°C pathway)
  const nzGap15 = aligned15 ? 0 : Math.round(overshoot15 / oci * 100);
  const nzGap20 = aligned20 ? 0 : Math.round(overshoot20 / oci * 100);

  return {
    id: i + 1,
    name: `Asset-${String(i + 1).padStart(3, '0')}`,
    sector, region, epc, epcIdx, gia, age, ownershipPct,
    a1a3, a4a5, bLifeMaint, cDemolit, d_reuse, embodiedTotal,
    oci, opCarbonTotal, embCarbonTotal, wholeLifeCarbon,
    crrem15: crrem.b15, crrem20: crrem.b20,
    overshoot15, overshoot20, aligned15, aligned20,
    strandYr15, strandYr20, pcafAttr, pcafPerM2,
    assetValue, annualOpCarbon, costAt50, costAt100, costAt150,
    nzGap15, nzGap20,
  };
});

// ── Carbon price scenarios for sensitivity ──
const CARBON_PRICES = [50, 75, 100, 150, 200];

// ── Regulatory frameworks ──
const FRAMEWORKS = [
  { code:'TCFD', full:'Task Force on Climate-related Financial Disclosures', scope:'Physical & Transition Risk', metric:'Scope 1–3 + stranding risk', status:'Mandatory (UK)' },
  { code:'SFDR', full:'Sustainable Finance Disclosure Regulation', scope:'Financed emissions', metric:'PCAF-attributed carbon', status:'EU mandatory' },
  { code:'CSRD', full:'Corporate Sustainability Reporting Directive', scope:'Double materiality', metric:'ESRS E1 — full value chain', status:'EU phased 2024+' },
  { code:'UK SDR', full:'UK Sustainability Disclosure Requirements', scope:'Real-asset decarbonisation', metric:'CRREM-aligned pathways', status:'FCA mandatory 2026' },
  { code:'GRESB', full:'Global Real Estate Sustainability Benchmark', scope:'Portfolio ESG + carbon', metric:'Intensity & like-for-like', status:'Voluntary (market norm)' },
  { code:'NABERS', full:'National Australian Built Environment Rating System', scope:'Operational energy/carbon', metric:'Star rating 0–6', status:'Voluntary (adopted globally)' },
  { code:'Net Zero Carbon Buildings', full:'UKGBC Net Zero Carbon Buildings Framework', scope:'Whole-life carbon', metric:'Embodied + operational', status:'Best practice (UK)' },
];

// ── KPI card ──
const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '14px 18px', minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase',
      letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

// ── Styled card wrapper ──
const Card = ({ title, children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: 20, ...style }}>
    {title && <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.mono,
      marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>}
    {children}
  </div>
);

const TABS = ['Overview', 'Embodied Carbon', 'Operational Carbon', 'CRREM Pathways',
              'Financed Emissions', 'Net Zero Plan', 'Regulatory', 'Advanced Analytics'];

export default function RealEstateCarbonAnalyticsPage() {
  const [tab, setTab] = useState('Overview');
  const [filterSector, setFilterSector] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterEpc, setFilterEpc] = useState('All');
  const [carbonPx, setCarbonPx] = useState(100);  // £/tCO₂
  const [lifeYears, setLifeYears] = useState(60);  // assessment period

  const filtered = useMemo(() => PROPERTIES.filter(p =>
    (filterSector === 'All' || p.sector === filterSector) &&
    (filterRegion === 'All' || p.region === filterRegion) &&
    (filterEpc === 'All' || p.epc === filterEpc)
  ), [filterSector, filterRegion, filterEpc]);

  const totals = useMemo(() => {
    const n = filtered.length || 1;
    return {
      n: filtered.length,
      totalGia:    filtered.reduce((s, p) => s + p.gia, 0),
      avgOci:      filtered.reduce((s, p) => s + p.oci, 0) / n,
      avgEmbody:   filtered.reduce((s, p) => s + p.embodiedTotal, 0) / n,
      totalPcaf:   filtered.reduce((s, p) => s + p.pcafAttr, 0),
      pctAligned15: filtered.filter(p => p.aligned15).length / n * 100,
      pctAligned20: filtered.filter(p => p.aligned20).length / n * 100,
      totalAnnualOp: filtered.reduce((s, p) => s + p.annualOpCarbon, 0),
      avgNzGap15:  filtered.reduce((s, p) => s + p.nzGap15, 0) / n,
      totalCarbonCost: filtered.reduce((s, p) => s + p.annualOpCarbon, 0) * carbonPx,
      avgWholeLife: filtered.reduce((s, p) => s + p.wholeLifeCarbon, 0) / n,
    };
  }, [filtered, carbonPx]);

  // Sector summary
  const sectorRows = useMemo(() => SECTORS.map(s => {
    const props = filtered.filter(p => p.sector === s);
    const n = props.length || 1;
    return {
      sector: s,
      count: props.length,
      avgOci:   props.reduce((a, p) => a + p.oci, 0) / n,
      avgEmb:   props.reduce((a, p) => a + p.embodiedTotal, 0) / n,
      pctAl15:  props.filter(p => p.aligned15).length / n * 100,
      totalPcaf: props.reduce((a, p) => a + p.pcafAttr, 0),
      budget15: CRREM[s].b15,
    };
  }), [filtered]);

  // EPC distribution of OCI
  const epcOciData = useMemo(() => EPC_GRADES.map(g => {
    const props = filtered.filter(p => p.epc === g);
    const n = props.length || 1;
    return {
      epc: g,
      avgOci: props.reduce((a, p) => a + p.oci, 0) / n,
      count: props.length,
      crrem15avg: filtered.length ? filtered.reduce((a, p) => a + p.crrem15, 0) / (filtered.length) : 35,
    };
  }), [filtered]);

  // Embodied carbon lifecycle breakdown (portfolio average)
  const embodiedBreakdown = useMemo(() => {
    const n = filtered.length || 1;
    return [
      { stage: 'A1–A3 Manufacturing', value: filtered.reduce((s, p) => s + p.a1a3, 0) / n, fill: T.navy },
      { stage: 'A4–A5 Construction', value: filtered.reduce((s, p) => s + p.a4a5, 0) / n, fill: T.navyL },
      { stage: 'B Maintenance (60yr)', value: filtered.reduce((s, p) => s + p.bLifeMaint, 0) / n, fill: T.gold },
      { stage: 'C Demolition', value: filtered.reduce((s, p) => s + p.cDemolit, 0) / n, fill: T.amber },
      { stage: 'D Reuse Credits', value: Math.abs(filtered.reduce((s, p) => s + p.d_reuse, 0) / n), fill: T.sage },
    ];
  }, [filtered]);

  // CRREM pathway chart (portfolio avg OCI decay 2025-2050 vs budgets)
  const crremPathway = useMemo(() => {
    const avgOci = filtered.reduce((s, p) => s + p.oci, 0) / (filtered.length || 1);
    const avgBudget15 = filtered.reduce((s, p) => s + p.crrem15, 0) / (filtered.length || 1);
    const avgBudget20 = filtered.reduce((s, p) => s + p.crrem20, 0) / (filtered.length || 1);
    return Array.from({ length: 6 }, (_, i) => {
      const yr = 2025 + i * 5;
      const decay = (i / 5) * 0.35; // assumed 35% improvement by 2050 with retrofit
      return {
        year: yr.toString(),
        portfolio: Math.round(avgOci * (1 - decay)),
        pathway15: Math.round(avgBudget15 * Math.pow(0.965, i * 5)),
        pathway20: Math.round(avgBudget20 * Math.pow(0.975, i * 5)),
      };
    });
  }, [filtered]);

  // Carbon cost sensitivity
  const costSensData = useMemo(() => CARBON_PRICES.map(px => ({
    price: `£${px}`,
    annualCost: Math.round(totals.totalAnnualOp * px / 1000), // £k
  })), [totals]);

  // PCAF by sector for bar chart
  const pcafBySector = useMemo(() => SECTORS.map(s => {
    const props = filtered.filter(p => p.sector === s);
    return {
      sector: s.replace('-', '\u2011'),
      pcaf: Math.round(props.reduce((a, p) => a + p.pcafAttr, 0)),
    };
  }), [filtered]);

  // Net zero alignment gap timeline
  const nzTimeline = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const yr = 2025 + i * 5;
      const improveFactor = 1 - (i / 5) * 0.40;
      const avgGap = totals.avgNzGap15 * improveFactor;
      return {
        year: yr.toString(),
        gap15: Math.round(Math.max(0, avgGap)),
        aligned15Pct: Math.round(Math.min(100, totals.pctAligned15 + i * 8)),
      };
    });
  }, [totals]);

  // Whole-life carbon scatter (gia vs whole-life)
  const scatterData = useMemo(() =>
    filtered.slice(0, 50).map(p => ({
      x: p.gia,
      y: Math.round(p.wholeLifeCarbon),
      sector: p.sector,
    }))
  , [filtered]);

  const labelStyle = { fontSize: 11, color: T.textSec, marginBottom: 4, display: 'block' };
  const selectStyle = {
    padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
    fontSize: 12, background: T.surface, color: T.text, fontFamily: T.font,
  };
  const sliderStyle = { width: '100%', accentColor: T.navy };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 4 }}>
          EP-DE6 · Real Estate Carbon Analytics
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
          Real Estate Carbon Analytics
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Whole-life carbon · Embodied & operational intensity · CRREM pathways · PCAF financed emissions · Net zero planning
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Filters row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 20px',
          alignItems: 'flex-end' }}>
          <div>
            <span style={labelStyle}>Sector</span>
            <select style={selectStyle} value={filterSector} onChange={e => setFilterSector(e.target.value)}>
              <option>All</option>{SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <span style={labelStyle}>Region</span>
            <select style={selectStyle} value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
              <option>All</option>{REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <span style={labelStyle}>EPC Grade</span>
            <select style={selectStyle} value={filterEpc} onChange={e => setFilterEpc(e.target.value)}>
              <option>All</option>{EPC_GRADES.map(g => <option key={g}>EPC {g}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <span style={labelStyle}>Carbon Price: £{carbonPx}/tCO₂e</span>
            <input type="range" min={25} max={250} step={25} value={carbonPx}
              onChange={e => setCarbonPx(+e.target.value)} style={sliderStyle} />
          </div>
          <div style={{ minWidth: 160 }}>
            <span style={labelStyle}>Assessment Period: {lifeYears} years</span>
            <input type="range" min={25} max={100} step={5} value={lifeYears}
              onChange={e => setLifeYears(+e.target.value)} style={sliderStyle} />
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>
            {totals.n} assets · {fmt0(totals.totalGia)} m² GIA
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 16px', borderRadius: 6, border: `1px solid ${tab === t ? T.navy : T.border}`,
              background: tab === t ? T.navy : T.surface, color: tab === t ? '#fff' : T.textSec,
              fontFamily: T.font, fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>

        {/* ── TAB: Overview ── */}
        {tab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPIs */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <KpiCard label="Avg Operational Intensity" value={`${fmt1(totals.avgOci)} kgCO₂/m²`} sub="Vs CRREM 1.5°C pathway" />
              <KpiCard label="Avg Embodied Carbon" value={`${fmt0(totals.avgEmbody)} kgCO₂e/m²`} sub="Whole-life A1–D" />
              <KpiCard label="Total Annual Op. Emissions" value={`${fmt0(totals.totalAnnualOp)} tCO₂e`} sub="Portfolio scope 1–2" color={T.red} />
              <KpiCard label="Annual Carbon Cost" value={`£${fmt0(totals.totalCarbonCost / 1000)}k`} sub={`@ £${carbonPx}/tCO₂e`} color={T.amber} />
              <KpiCard label="CRREM 1.5°C Aligned" value={`${fmt1(totals.pctAligned15)}%`} sub="Of portfolio assets" color={T.green} />
              <KpiCard label="CRREM 2°C Aligned" value={`${fmt1(totals.pctAligned20)}%`} sub="Of portfolio assets" color={T.sage} />
              <KpiCard label="Total PCAF Financed" value={`${fmt0(totals.totalPcaf)} tCO₂e`} sub="Ownership-weighted" color={T.navy} />
              <KpiCard label="Avg Net Zero Gap" value={`${fmt1(totals.avgNzGap15)}%`} sub="Reduction needed (1.5°C)" color={T.red} />
            </div>

            {/* Sector overview table */}
            <Card title="Sector Carbon Performance">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Sector','Assets','Avg OCI','CRREM 1.5°C','vs Budget','Avg Embodied','1.5°C Aligned','PCAF (tCO₂e)'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: T.mono,
                          fontSize: 11, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sectorRows.map((r, i) => {
                      const vs = r.avgOci - r.budget15;
                      return (
                        <tr key={r.sector} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{r.sector}</td>
                          <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{r.count}</td>
                          <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{fmt1(r.avgOci)}</td>
                          <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{r.budget15}</td>
                          <td style={{ padding: '8px 12px', fontFamily: T.mono,
                            color: vs > 0 ? T.red : T.green, fontWeight: 600 }}>
                            {vs > 0 ? '+' : ''}{fmt1(vs)}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{fmt0(r.avgEmb)}</td>
                          <td style={{ padding: '8px 12px', fontFamily: T.mono,
                            color: r.pctAl15 >= 50 ? T.green : T.amber }}>
                            {fmt1(r.pctAl15)}%
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{fmt0(r.totalPcaf)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* CRREM pathway line chart */}
            <Card title="Portfolio Carbon Intensity vs CRREM Pathways (2025–2050)">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={crremPathway} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: T.mono }} unit=" kg" />
                  <Tooltip formatter={(v, n) => [`${v} kgCO₂/m²`, n]} />
                  <Legend />
                  <Line dataKey="portfolio" name="Portfolio OCI" stroke={T.navy} strokeWidth={2.5} dot={false} />
                  <Line dataKey="pathway15" name="CRREM 1.5°C" stroke={T.green} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                  <Line dataKey="pathway20" name="CRREM 2°C" stroke={T.amber} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── TAB: Embodied Carbon ── */}
        {tab === 'Embodied Carbon' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <KpiCard label="Avg A1–A3 Manufacturing" value={`${fmt0(filtered.reduce((s,p)=>s+p.a1a3,0)/(filtered.length||1))} kgCO₂e/m²`} sub="Cradle to gate" />
              <KpiCard label="Avg A4–A5 Construction" value={`${fmt0(filtered.reduce((s,p)=>s+p.a4a5,0)/(filtered.length||1))} kgCO₂e/m²`} sub="Transport + install" />
              <KpiCard label="Avg B2–B5 Maintenance" value={`${fmt0(filtered.reduce((s,p)=>s+p.bLifeMaint,0)/(filtered.length||1))} kgCO₂e/m²`} sub="60-year life cycle" />
              <KpiCard label="Avg C Demolition" value={`${fmt0(filtered.reduce((s,p)=>s+p.cDemolit,0)/(filtered.length||1))} kgCO₂e/m²`} sub="End-of-life stage" />
              <KpiCard label="Avg D Credits" value={`−${fmt0(Math.abs(filtered.reduce((s,p)=>s+p.d_reuse,0)/(filtered.length||1)))} kgCO₂e/m²`} sub="Reuse & recycling" color={T.green} />
              <KpiCard label="Avg Total Embodied" value={`${fmt0(totals.avgEmbody)} kgCO₂e/m²`} sub="A1–D net whole-life" color={T.navy} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Card title="Portfolio Average — Lifecycle Stage Breakdown">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={embodiedBreakdown} layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} unit=" kg" />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 10 }} width={160} />
                    <Tooltip formatter={v => [`${fmt0(v)} kgCO₂e/m²`]} />
                    <Bar dataKey="value" name="kgCO₂e/m²" radius={[0, 4, 4, 0]}
                      fill={T.navy} label={{ position: 'right', fontSize: 10, fontFamily: T.mono,
                        formatter: v => fmt0(v) }} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Embodied Carbon by Sector (Avg A1–A5)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorRows} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="sector" tick={{ fontSize: 10, angle: -25, textAnchor: 'end' }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit=" kg" />
                    <Tooltip formatter={v => [`${fmt0(v)} kgCO₂e/m²`]} />
                    <Bar dataKey="avgEmb" name="Avg Embodied" fill={T.gold} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Asset table — top 20 by embodied carbon */}
            <Card title="Top 20 Assets by Total Embodied Carbon (kgCO₂e/m²)">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Asset','Sector','EPC','GIA (m²)','A1–A3','A4–A5','B Maint','C Demo','D Credits','Total'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: T.mono,
                          fontSize: 10, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].sort((a, b) => b.embodiedTotal - a.embodiedTotal).slice(0, 20).map((p, i) => (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '7px 10px', fontFamily: T.mono, fontSize: 11 }}>{p.name}</td>
                        <td style={{ padding: '7px 10px' }}>{p.sector}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.mono, fontWeight: 700,
                          color: p.epcIdx <= 1 ? T.green : p.epcIdx >= 5 ? T.red : T.amber }}>{p.epc}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{fmt0(p.gia)}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{p.a1a3}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{p.a4a5}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{p.bLifeMaint}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{p.cDemolit}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.mono, color: T.green }}>{p.d_reuse}</td>
                        <td style={{ padding: '7px 10px', fontFamily: T.mono, fontWeight: 700,
                          color: p.embodiedTotal > 600 ? T.red : T.text }}>{fmt0(p.embodiedTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB: Operational Carbon ── */}
        {tab === 'Operational Carbon' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <KpiCard label="Portfolio Avg OCI" value={`${fmt1(totals.avgOci)} kgCO₂/m²/yr`} sub="Operational intensity" color={T.red} />
              <KpiCard label="Total Annual Emissions" value={`${fmt0(totals.totalAnnualOp)} tCO₂e`} sub="Whole portfolio" color={T.navy} />
              <KpiCard label="Carbon Cost @ £${carbonPx}" value={`£${fmt0(totals.totalCarbonCost / 1000)}k/yr`} sub="Annual exposure" color={T.amber} />
              <KpiCard label="Highest OCI Asset" value={`${fmt0(Math.max(...filtered.map(p => p.oci)))} kgCO₂/m²`} sub="Max in portfolio" color={T.red} />
              <KpiCard label="CRREM 1.5°C Avg Budget" value={`${fmt1(filtered.reduce((s,p)=>s+p.crrem15,0)/(filtered.length||1))} kgCO₂/m²`} sub="Portfolio weighted" color={T.green} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Card title="OCI by EPC Grade vs CRREM 1.5°C Budget">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={epcOciData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="epc" tick={{ fontSize: 11, fontFamily: T.mono }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit=" kg" />
                    <Tooltip formatter={v => [`${fmt1(v)} kgCO₂/m²/yr`]} />
                    <Legend />
                    <Bar dataKey="avgOci" name="Avg OCI" fill={T.navy} radius={[4,4,0,0]} />
                    <Bar dataKey="crrem15avg" name="CRREM 1.5°C Avg" fill={T.green} radius={[4,4,0,0]} opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Carbon Cost Sensitivity (Annual, £k)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={costSensData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="price" tick={{ fontSize: 11, fontFamily: T.mono }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="k" />
                    <Tooltip formatter={v => [`£${fmt0(v)}k`]} />
                    <Bar dataKey="annualCost" name="Annual Cost £k" radius={[4,4,0,0]}
                      fill={carbonPx >= 150 ? T.red : carbonPx >= 100 ? T.amber : T.sage} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card title="Asset-Level Operational Carbon — Top 25 by Annual Emissions">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Asset','Sector','EPC','GIA m²','OCI kg/m²/yr','Annual tCO₂e',`Cost @ £${carbonPx}`,'vs CRREM 1.5°C','Status'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign:'left', fontFamily:T.mono,
                          fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].sort((a, b) => b.annualOpCarbon - a.annualOpCarbon).slice(0, 25).map((p, i) => {
                      const vs = p.oci - p.crrem15;
                      return (
                        <tr key={p.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono, fontSize:11 }}>{p.name}</td>
                          <td style={{ padding:'7px 10px' }}>{p.sector}</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono, fontWeight:700,
                            color: p.epcIdx<=1?T.green:p.epcIdx>=5?T.red:T.amber }}>{p.epc}</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{fmt0(p.gia)}</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono, color: p.oci>80?T.red:T.text }}>{p.oci}</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{fmt1(p.annualOpCarbon)}</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono }}>£{fmt0(p.annualOpCarbon*carbonPx/1000)}k</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono,
                            color: vs>0?T.red:T.green, fontWeight:600 }}>
                            {vs>0?'+':''}{vs} kg
                          </td>
                          <td style={{ padding:'7px 10px' }}>
                            <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600,
                              background: p.aligned15?'#dcfce7':p.overshoot15<20?'#fef3c7':'#fee2e2',
                              color: p.aligned15?T.green:p.overshoot15<20?T.amber:T.red }}>
                              {p.aligned15?'Aligned':'Overshoot'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB: CRREM Pathways ── */}
        {tab === 'CRREM Pathways' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <KpiCard label="1.5°C Aligned Assets" value={`${filtered.filter(p=>p.aligned15).length}`} sub={`${fmt1(totals.pctAligned15)}% of portfolio`} color={T.green} />
              <KpiCard label="2°C Aligned Assets" value={`${filtered.filter(p=>p.aligned20).length}`} sub={`${fmt1(totals.pctAligned20)}% of portfolio`} color={T.sage} />
              <KpiCard label="Avg Overshoot (1.5°C)" value={`${fmt1(filtered.reduce((s,p)=>s+p.overshoot15,0)/(filtered.length||1))} kg`} sub="kgCO₂/m²/yr excess" color={T.red} />
              <KpiCard label="Avg Stranding Year (1.5°C)" value={`${fmt0(filtered.filter(p=>!p.aligned15).reduce((s,p)=>s+p.strandYr15,0)/(filtered.filter(p=>!p.aligned15).length||1))}`} sub="Non-aligned assets" color={T.amber} />
              <KpiCard label="Avg Stranding Year (2°C)" value={`${fmt0(filtered.filter(p=>!p.aligned20).reduce((s,p)=>s+p.strandYr20,0)/(filtered.filter(p=>!p.aligned20).length||1))}`} sub="Non-aligned assets" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Card title="CRREM Budget vs Portfolio OCI by Sector">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorRows} margin={{ top:5, right:20, left:0, bottom:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="sector" tick={{ fontSize:10, angle:-25, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} unit=" kg" />
                    <Tooltip formatter={v => [`${fmt1(v)} kgCO₂/m²/yr`]} />
                    <Legend />
                    <Bar dataKey="avgOci" name="Portfolio OCI" fill={T.navy} radius={[4,4,0,0]} />
                    <Bar dataKey="budget15" name="CRREM 1.5°C" fill={T.green} radius={[4,4,0,0]} opacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Stranding Year Distribution (1.5°C pathway)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={[2027,2030,2033,2036,2039,2042,2045].map(yr => ({
                      year: yr.toString(),
                      count: filtered.filter(p => !p.aligned15 && p.strandYr15 >= yr - 2 && p.strandYr15 < yr + 1).length,
                    }))}
                    margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Assets stranding" fill={T.red} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card title="Carbon Intensity vs CRREM 1.5°C Pathway — All Assets">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:T.surfaceH }}>
                      {['Asset','Sector','EPC','OCI','CRREM 1.5°C','Overshoot','CRREM 2°C','Overshoot 2°C','Strand Yr 1.5°C','Strand Yr 2°C','NZ Gap'].map(h => (
                        <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontFamily:T.mono,
                          fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].sort((a,b) => b.overshoot15 - a.overshoot15).slice(0, 30).map((p, i) => (
                      <tr key={p.id} style={{ background: i%2===0?T.surface:T.surfaceH }}>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono, fontSize:11 }}>{p.name}</td>
                        <td style={{ padding:'7px 10px' }}>{p.sector}</td>
                        <td style={{ padding:'7px 10px', fontWeight:700, fontFamily:T.mono,
                          color: p.epcIdx<=1?T.green:p.epcIdx>=5?T.red:T.amber }}>{p.epc}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{p.oci}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{p.crrem15}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono, fontWeight:600,
                          color: p.overshoot15>0?T.red:T.green }}>
                          {p.overshoot15>0?'+':''}{p.overshoot15}
                        </td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{p.crrem20}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono,
                          color: p.overshoot20>0?T.amber:T.green }}>
                          {p.overshoot20>0?'+':''}{p.overshoot20}
                        </td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono }}>
                          {p.aligned15?'—':p.strandYr15}
                        </td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono }}>
                          {p.aligned20?'—':p.strandYr20}
                        </td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono,
                          color: p.nzGap15>30?T.red:p.nzGap15>10?T.amber:T.green }}>
                          {p.nzGap15}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB: Financed Emissions ── */}
        {tab === 'Financed Emissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <KpiCard label="Total PCAF Attributed" value={`${fmt0(totals.totalPcaf)} tCO₂e`} sub="Ownership-weighted whole-life" color={T.navy} />
              <KpiCard label="Avg Ownership Share" value={`${fmt1(filtered.reduce((s,p)=>s+p.ownershipPct,0)/(filtered.length||1))}%`} sub="Portfolio average" />
              <KpiCard label="Avg PCAF per m²" value={`${fmt1(filtered.reduce((s,p)=>s+p.pcafPerM2,0)/(filtered.length||1))} kgCO₂e/m²`} sub="Attributable intensity" color={T.amber} />
              <KpiCard label="Avg Whole-Life Carbon" value={`${fmt0(totals.avgWholeLife)} tCO₂e`} sub="60-year full lifecycle" />
              <KpiCard label="Top Contributor" value={`${filtered.sort((a,b)=>b.pcafAttr-a.pcafAttr)[0]?.name||'—'}`} sub={`${fmt0(filtered[0]?.pcafAttr||0)} tCO₂e`} color={T.red} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Card title="PCAF Financed Emissions by Sector (tCO₂e)">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={pcafBySector} margin={{ top:5, right:20, left:0, bottom:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="sector" tick={{ fontSize:10, angle:-25, textAnchor:'end' }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip formatter={v => [`${fmt0(v)} tCO₂e`]} />
                    <Bar dataKey="pcaf" name="PCAF tCO₂e" fill={T.teal} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Whole-Life Carbon vs GIA (Asset Scatter)">
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ top:10, right:20, left:0, bottom:10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="GIA (m²)" tick={{ fontSize:10, fontFamily:T.mono }} label={{ value:'GIA m²', position:'insideBottom', offset:-5, fontSize:10 }} />
                    <YAxis dataKey="y" name="Whole-life tCO₂e" tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip cursor={{ strokeDasharray:'3 3' }}
                      formatter={(v, n) => [n==='x'?`${fmt0(v)} m²`:`${fmt0(v)} tCO₂e`, n==='x'?'GIA':'Whole-life']} />
                    <Scatter data={scatterData} fill={T.navy} opacity={0.55} r={3} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* PCAF portfolio table */}
            <Card title="PCAF Attribution — Asset Detail (Top 25)">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:T.surfaceH }}>
                      {['Asset','Sector','GIA m²','Ownership %','Annual Op (tCO₂e)','Whole-life (tCO₂e)','PCAF Attr (tCO₂e)','PCAF /m² (kg)'].map(h => (
                        <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontFamily:T.mono,
                          fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].sort((a,b)=>b.pcafAttr-a.pcafAttr).slice(0,25).map((p,i) => (
                      <tr key={p.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono, fontSize:11 }}>{p.name}</td>
                        <td style={{ padding:'7px 10px' }}>{p.sector}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{fmt0(p.gia)}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{p.ownershipPct}%</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{fmt1(p.annualOpCarbon)}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{fmt0(p.wholeLifeCarbon)}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono, fontWeight:600 }}>{fmt0(p.pcafAttr)}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono,
                          color: p.pcafPerM2>300?T.red:p.pcafPerM2>150?T.amber:T.green }}>
                          {fmt1(p.pcafPerM2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB: Net Zero Plan ── */}
        {tab === 'Net Zero Plan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <KpiCard label="Assets Needing Action" value={`${filtered.filter(p=>!p.aligned15).length}`} sub="Not on 1.5°C pathway" color={T.red} />
              <KpiCard label="Avg NZ Gap (1.5°C)" value={`${fmt1(totals.avgNzGap15)}%`} sub="OCI reduction needed" color={T.amber} />
              <KpiCard label="Est. Retrofit Spend" value={`£${fmt0(filtered.filter(p=>!p.aligned15).reduce((s,p)=>s+p.assetValue*p.nzGap15/100*0.08,0)/1000)}k`} sub="~8% of asset value × gap" />
              <KpiCard label="Portfolio Aligned 2°C" value={`${fmt1(totals.pctAligned20)}%`} sub="Current state" color={T.sage} />
              <KpiCard label="Proj. Aligned 1.5°C (2035)" value={`${fmt1(Math.min(100, totals.pctAligned15 + 30))}%`} sub="With active programme" color={T.green} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Card title="Net Zero Gap Reduction Roadmap (2025–2040)">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={nzTimeline} margin={{ top:10, right:20, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                    <YAxis tick={{ fontSize:10, fontFamily:T.mono }} />
                    <Tooltip />
                    <Legend />
                    <Area dataKey="gap15" name="Avg NZ Gap %" stroke={T.red} fill={T.red} fillOpacity={0.15} />
                    <Area dataKey="aligned15Pct" name="% Aligned 1.5°C" stroke={T.green} fill={T.green} fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Retrofit Priority Matrix (NZ Gap % vs Asset Value £k)">
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ top:10, right:20, left:0, bottom:10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="Asset Value £k" tick={{ fontSize:10, fontFamily:T.mono }}
                      label={{ value:'Asset Value £k', position:'insideBottom', offset:-5, fontSize:10 }} />
                    <YAxis dataKey="y" name="NZ Gap %" tick={{ fontSize:10, fontFamily:T.mono }}
                      label={{ value:'NZ Gap %', angle:-90, position:'insideLeft', fontSize:10 }} />
                    <Tooltip cursor={{ strokeDasharray:'3 3' }}
                      formatter={(v, n) => [n==='x'?`£${fmt0(v)}k`:`${v}%`, n==='x'?'Value':'NZ Gap']} />
                    <Scatter
                      data={filtered.filter(p=>!p.aligned15).slice(0,40).map(p=>({ x:p.assetValue, y:p.nzGap15 }))}
                      fill={T.red} opacity={0.6} r={4} />
                    <Scatter
                      data={filtered.filter(p=>p.aligned15).slice(0,20).map(p=>({ x:p.assetValue, y:0 }))}
                      fill={T.green} opacity={0.5} r={3} name="Aligned" />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Action priority table */}
            <Card title="Retrofit Action Priority List — Top 20 by OCI Reduction Urgency">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:T.surfaceH }}>
                      {['Asset','Sector','EPC','Current OCI','Target OCI','NZ Gap %','Strand Yr 1.5°C','Est. Cost £k','Annual Saving £k','Priority'].map(h => (
                        <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontFamily:T.mono,
                          fontSize:10, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].filter(p=>!p.aligned15).sort((a,b)=>b.nzGap15-a.nzGap15).slice(0,20).map((p,i) => {
                      const targetOci = p.crrem15;
                      const ociDrop = p.oci - targetOci;
                      const annualSaving = ociDrop * p.gia / 1000 * carbonPx;
                      const estCost = p.assetValue * p.nzGap15 / 100 * 0.08;
                      const priority = p.nzGap15 >= 40 ? 'Critical' : p.nzGap15 >= 20 ? 'High' : 'Medium';
                      return (
                        <tr key={p.id} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono, fontSize:11 }}>{p.name}</td>
                          <td style={{ padding:'7px 10px' }}>{p.sector}</td>
                          <td style={{ padding:'7px 10px', fontWeight:700, fontFamily:T.mono,
                            color: p.epcIdx<=1?T.green:p.epcIdx>=5?T.red:T.amber }}>{p.epc}</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono, color:T.red }}>{p.oci}</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono, color:T.green }}>{targetOci}</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono, fontWeight:600,
                            color: p.nzGap15>=40?T.red:p.nzGap15>=20?T.amber:T.text }}>
                            {p.nzGap15}%
                          </td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono }}>{p.strandYr15}</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono }}>£{fmt0(estCost)}k</td>
                          <td style={{ padding:'7px 10px', fontFamily:T.mono, color:T.green }}>£{fmt0(annualSaving/1000)}k</td>
                          <td style={{ padding:'7px 10px' }}>
                            <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600,
                              background: priority==='Critical'?'#fee2e2':priority==='High'?'#fef3c7':'#f0fdf4',
                              color: priority==='Critical'?T.red:priority==='High'?T.amber:T.green }}>
                              {priority}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB: Regulatory ── */}
        {tab === 'Regulatory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <KpiCard label="TCFD — Transition Risk" value="HIGH" sub="Avg OCI vs CRREM pathway" color={T.red} />
              <KpiCard label="SFDR PAI Coverage" value={`${fmt1(totals.pctAligned20)}%`} sub="Assets on 2°C pathway" color={T.sage} />
              <KpiCard label="CSRD E1 Scope" value="Full Chain" sub="A1–D embodied + B6 operational" color={T.teal} />
              <KpiCard label="GRESB Score (est.)" value={`${Math.round(40 + totals.pctAligned15 * 0.35)}/100`} sub="Based on CRREM alignment" color={T.gold} />
              <KpiCard label="UK SDR Compliance" value={totals.pctAligned15 >= 50 ? 'On Track' : 'Review'} sub="CRREM-aligned pathways" color={totals.pctAligned15 >= 50 ? T.green : T.amber} />
            </div>

            {/* Frameworks table */}
            <Card title="Applicable Regulatory & Disclosure Frameworks">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:T.surfaceH }}>
                      {['Framework','Full Name','Scope','Key Metric','Status'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontFamily:T.mono,
                          fontSize:11, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FRAMEWORKS.map((fw, i) => (
                      <tr key={fw.code} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                        <td style={{ padding:'8px 12px', fontFamily:T.mono, fontWeight:700, color:T.navy }}>{fw.code}</td>
                        <td style={{ padding:'8px 12px', color:T.text }}>{fw.full}</td>
                        <td style={{ padding:'8px 12px', color:T.textSec }}>{fw.scope}</td>
                        <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:11 }}>{fw.metric}</td>
                        <td style={{ padding:'8px 12px' }}>
                          <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600,
                            background: fw.status.includes('Mandatory')?'#fee2e2':fw.status.includes('phased')?'#fef3c7':'#f0fdf4',
                            color: fw.status.includes('Mandatory')?T.red:fw.status.includes('phased')?T.amber:T.sage }}>
                            {fw.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Disclosure metrics summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <Card title="TCFD Climate Risk Disclosure Metrics">
                {[
                  { label:'Physical Risk (NGFS Hot House)', value: `${fmt1(filtered.reduce((s,p)=>s+p.overshoot15,0)/(filtered.length||1))} kg avg overshoot` },
                  { label:'Transition Risk — Stranding', value: `${filtered.filter(p=>!p.aligned15).length} assets at risk` },
                  { label:'Scope 1+2 (Operational)', value: `${fmt0(totals.totalAnnualOp)} tCO₂e/yr` },
                  { label:'Scope 3 (Embodied)', value: `${fmt0(filtered.reduce((s,p)=>s+p.embCarbonTotal,0))} tCO₂e (60yr)` },
                  { label:'Carbon Cost Exposure', value: `£${fmt0(totals.totalCarbonCost/1000)}k/yr @ £${carbonPx}/t` },
                  { label:'CRREM Alignment (1.5°C)', value: `${fmt1(totals.pctAligned15)}%` },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'8px 0', borderBottom:`1px solid ${T.borderL}` }}>
                    <span style={{ fontSize:12, color:T.textSec }}>{row.label}</span>
                    <span style={{ fontSize:12, fontFamily:T.mono, fontWeight:600, color:T.navy }}>{row.value}</span>
                  </div>
                ))}
              </Card>

              <Card title="SFDR Principal Adverse Impact Indicators">
                {[
                  { pai: 'PAI-1', label:'Scope 1+2 GHG Emissions', value:`${fmt0(totals.totalAnnualOp)} tCO₂e` },
                  { pai: 'PAI-2', label:'Carbon Footprint', value:`${fmt1(totals.totalAnnualOp/(filtered.reduce((s,p)=>s+p.assetValue,0)/1000||1)*1000)} tCO₂e/£M` },
                  { pai: 'PAI-3', label:'GHG Intensity (Revenue)', value:`${fmt1(totals.avgOci)} kgCO₂/m²` },
                  { pai: 'PAI-7', label:'Non-Renewable Energy', value:`${fmt1(filtered.filter(p=>p.epcIdx>=4).length/(filtered.length||1)*100)}% low EPC` },
                  { pai: 'PAI-14', label:'Real Assets — Energy Efficiency', value:`${fmt1(totals.pctAligned15)}% CRREM aligned` },
                  { pai: 'PAI-18', label:'Real Estate Energy Efficiency', value:`EPC A/B: ${fmt1(filtered.filter(p=>p.epcIdx<=1).length/(filtered.length||1)*100)}%` },
                ].map(row => (
                  <div key={row.pai} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'8px 0', borderBottom:`1px solid ${T.borderL}` }}>
                    <div>
                      <span style={{ fontSize:10, fontFamily:T.mono, color:T.gold, marginRight:8 }}>{row.pai}</span>
                      <span style={{ fontSize:12, color:T.text }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize:12, fontFamily:T.mono, fontWeight:600, color:T.navy }}>{row.value}</span>
                  </div>
                ))}
              </Card>
            </div>

            {/* CSRD ESRS E1 mapping */}
            <Card title="CSRD ESRS E1 — Climate Change Disclosure Requirements">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {[
                  { dr:'E1-1','label':'Transition Plan','status':'Required','detail':'CRREM net zero trajectory, stranding analysis' },
                  { dr:'E1-2','label':'Policies & Targets','status':'Required','detail':'Sector carbon budgets, 2030/2050 targets' },
                  { dr:'E1-3','label':'Actions','status':'Required','detail':'Retrofit programme, green procurement' },
                  { dr:'E1-4','label':'Targets','status':'Required','detail':'Absolute & intensity targets vs 1.5°C' },
                  { dr:'E1-5','label':'Energy Consumption','status':'Required','detail':'OCI kWh/m²/yr by sector & EPC' },
                  { dr:'E1-6','label':'GHG Emissions Scope 1–3','status':'Required','detail':'Op + embodied full lifecycle' },
                  { dr:'E1-7','label':'GHG Removals','status':'Conditional','detail':'Offset credits if applicable' },
                  { dr:'E1-8','label':'Internal Carbon Pricing','status':'Voluntary','detail':`£${carbonPx}/tCO₂e shadow price applied` },
                  { dr:'E1-9','label':'Anticipated Financial Effects','status':'Required','detail':'Stranding haircuts, PD uplift, VaR' },
                ].map(item => (
                  <div key={item.dr} style={{ background:T.surfaceH, borderRadius:8, padding:12,
                    border:`1px solid ${T.borderL}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontFamily:T.mono, fontSize:11, fontWeight:700, color:T.navy }}>{item.dr}</span>
                      <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, fontWeight:600,
                        background: item.status==='Required'?'#fee2e2':item.status==='Conditional'?'#fef3c7':'#f0fdf4',
                        color: item.status==='Required'?T.red:item.status==='Conditional'?T.amber:T.sage }}>
                        {item.status}
                      </span>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:4 }}>{item.label}</div>
                    <div style={{ fontSize:11, color:T.textSec }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

      </div>

      {tab==='Advanced Analytics' && (
        <div style={{ padding:'0 32px 24px' }}>
          <BuiltEnvironmentAdvancedAnalytics T={T} moduleId="DE6" moduleName="Real Estate Carbon Analytics" />
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${T.border}`, padding:'12px 32px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        background:T.surface, marginTop:24 }}>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>
          EP-DE6 · Real Estate Carbon Analytics · CRREM 2024 · PCAF v2 · SFDR Annex I · CSRD ESRS E1
        </span>
        <span style={{ fontFamily:T.mono, fontSize:10, color:T.textMut }}>
          {totals.n} assets · £{carbonPx}/tCO₂e · {lifeYears}yr lifecycle
        </span>
      </div>
    </div>
  );
}
