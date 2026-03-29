import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';

// ── Theme ──────────────────────────────────────────────────────────────────
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const CHART_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#2563eb','#9333ea','#ea580c','#0d9488','#dc2626','#6366f1','#14b8a6'];
const DQS_COLORS = { 1:'#16a34a', 2:'#65a30d', 3:'#d97706', 4:'#ea580c', 5:'#dc2626' };
const DQS_LABELS = { 1:'Verified', 2:'Audited', 3:'Reported', 4:'Sector proxy', 5:'Estimated' };
const HEATMAP_COLORS = { low:'#dcfce7', medium:'#fef3c7', high:'#fecaca', critical:'#fca5a5' };

// ── Sample Portfolio Holdings (10 Indian companies) ────────────────────────
const SAMPLE_HOLDINGS = [
  {
    id: 1, company: 'Tata Consultancy Services', ticker: 'TCS', sector: 'Information Technology',
    marketValue: 4250, weight: 17.0, scope1: 48000, scope2: 210000, scope3: 890000,
    revenue: 22400, evic: 1580000, dqs: 2, controversyLevel: 'Low',
    taxonomyAligned: 32, brsrReported: true,
    physical: { flooding: 'low', heat: 'medium', drought: 'low', seaLevel: 'low', wildfire: 'low' },
  },
  {
    id: 2, company: 'Reliance Industries', ticker: 'RELIANCE', sector: 'Energy',
    marketValue: 5800, weight: 23.2, scope1: 25600000, scope2: 890000, scope3: 180000000,
    revenue: 88000, evic: 9800000, dqs: 2, controversyLevel: 'High',
    taxonomyAligned: 18, brsrReported: true,
    physical: { flooding: 'medium', heat: 'high', drought: 'medium', seaLevel: 'high', wildfire: 'low' },
  },
  {
    id: 3, company: 'Tata Steel', ticker: 'TATASTEEL', sector: 'Materials',
    marketValue: 2100, weight: 8.4, scope1: 29000000, scope2: 1800000, scope3: 12000000,
    revenue: 22000, evic: 780000, dqs: 1, controversyLevel: 'Medium',
    taxonomyAligned: 8, brsrReported: true,
    physical: { flooding: 'high', heat: 'high', drought: 'medium', seaLevel: 'medium', wildfire: 'low' },
  },
  {
    id: 4, company: 'HDFC Bank', ticker: 'HDFCBANK', sector: 'Financials',
    marketValue: 3800, weight: 15.2, scope1: 18000, scope2: 82000, scope3: 4500000,
    revenue: 28000, evic: 4800000, dqs: 3, controversyLevel: 'Low',
    taxonomyAligned: 45, brsrReported: true,
    physical: { flooding: 'medium', heat: 'low', drought: 'low', seaLevel: 'low', wildfire: 'low' },
  },
  {
    id: 5, company: 'Infosys', ticker: 'INFY', sector: 'Information Technology',
    marketValue: 3200, weight: 12.8, scope1: 25000, scope2: 145000, scope3: 620000,
    revenue: 16000, evic: 780000, dqs: 1, controversyLevel: 'Low',
    taxonomyAligned: 38, brsrReported: true,
    physical: { flooding: 'low', heat: 'medium', drought: 'medium', seaLevel: 'low', wildfire: 'low' },
  },
  {
    id: 6, company: 'NTPC', ticker: 'NTPC', sector: 'Utilities',
    marketValue: 1500, weight: 6.0, scope1: 195000000, scope2: 2400000, scope3: 8200000,
    revenue: 17500, evic: 350000, dqs: 2, controversyLevel: 'High',
    taxonomyAligned: 5, brsrReported: true,
    physical: { flooding: 'high', heat: 'high', drought: 'high', seaLevel: 'medium', wildfire: 'medium' },
  },
  {
    id: 7, company: 'Adani Green Energy', ticker: 'ADANIGREEN', sector: 'Utilities',
    marketValue: 1100, weight: 4.4, scope1: 18000, scope2: 52000, scope3: 340000,
    revenue: 8500, evic: 950000, dqs: 3, controversyLevel: 'High',
    taxonomyAligned: 72, brsrReported: true,
    physical: { flooding: 'medium', heat: 'high', drought: 'high', seaLevel: 'low', wildfire: 'medium' },
  },
  {
    id: 8, company: 'Larsen & Toubro', ticker: 'LT', sector: 'Industrials',
    marketValue: 1800, weight: 7.2, scope1: 420000, scope2: 280000, scope3: 9500000,
    revenue: 21000, evic: 520000, dqs: 2, controversyLevel: 'Medium',
    taxonomyAligned: 22, brsrReported: true,
    physical: { flooding: 'medium', heat: 'medium', drought: 'low', seaLevel: 'medium', wildfire: 'low' },
  },
  {
    id: 9, company: 'Sun Pharma', ticker: 'SUNPHARMA', sector: 'Health Care',
    marketValue: 950, weight: 3.8, scope1: 58000, scope2: 94000, scope3: 1200000,
    revenue: 4200, evic: 310000, dqs: 3, controversyLevel: 'Medium',
    taxonomyAligned: 15, brsrReported: true,
    physical: { flooding: 'low', heat: 'medium', drought: 'medium', seaLevel: 'low', wildfire: 'low' },
  },
  {
    id: 10, company: 'ICICI Bank', ticker: 'ICICIBANK', sector: 'Financials',
    marketValue: 500, weight: 2.0, scope1: 14000, scope2: 68000, scope3: 3800000,
    revenue: 22000, evic: 3900000, dqs: 3, controversyLevel: 'Low',
    taxonomyAligned: 42, brsrReported: true,
    physical: { flooding: 'medium', heat: 'low', drought: 'low', seaLevel: 'medium', wildfire: 'low' },
  },
];

// ── WACI Trend Data (historical) ───────────────────────────────────────────
const WACI_TREND = [
  { year: '2022-Q1', waci: 312 }, { year: '2022-Q2', waci: 305 }, { year: '2022-Q3', waci: 298 }, { year: '2022-Q4', waci: 290 },
  { year: '2023-Q1', waci: 285 }, { year: '2023-Q2', waci: 278 }, { year: '2023-Q3', waci: 271 }, { year: '2023-Q4', waci: 264 },
  { year: '2024-Q1', waci: 258 }, { year: '2024-Q2', waci: 252 }, { year: '2024-Q3', waci: 245 }, { year: '2024-Q4', waci: 239 },
  { year: '2025-Q1', waci: 234 }, { year: '2025-Q2', waci: 228 }, { year: '2025-Q3', waci: 222 }, { year: '2025-Q4', waci: 218 },
  { year: '2026-Q1', waci: 212 },
];

const EMISSIONS_TREND = [
  { year: '2022-Q1', emissions: 18400 }, { year: '2022-Q2', emissions: 17900 }, { year: '2022-Q3', emissions: 17500 }, { year: '2022-Q4', emissions: 17100 },
  { year: '2023-Q1', emissions: 16800 }, { year: '2023-Q2', emissions: 16400 }, { year: '2023-Q3', emissions: 16000 }, { year: '2023-Q4', emissions: 15700 },
  { year: '2024-Q1', emissions: 15300 }, { year: '2024-Q2', emissions: 14900 }, { year: '2024-Q3', emissions: 14600 }, { year: '2024-Q4', emissions: 14200 },
  { year: '2025-Q1', emissions: 13900 }, { year: '2025-Q2', emissions: 13600 }, { year: '2025-Q3', emissions: 13200 }, { year: '2025-Q4', emissions: 12900 },
  { year: '2026-Q1', emissions: 12600 },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n == null) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString('en-IN');
};

const fmtCr = (n) => {
  if (n == null) return '—';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L Cr';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K Cr';
  return n.toLocaleString('en-IN') + ' Cr';
};

const pct = (n) => n != null ? n.toFixed(1) + '%' : '—';

const heatColor = (level) => {
  if (level === 'low') return { bg: '#dcfce7', color: '#166534' };
  if (level === 'medium') return { bg: '#fef3c7', color: '#92400e' };
  if (level === 'high') return { bg: '#fecaca', color: '#991b1b' };
  if (level === 'critical') return { bg: '#fca5a5', color: '#7f1d1d' };
  return { bg: '#f3f4f6', color: '#6b7280' };
};

const controversyColor = (level) => {
  if (level === 'Low') return T.green;
  if (level === 'Medium') return T.amber;
  if (level === 'High') return T.red;
  return T.sub;
};

const statusBadge = (status) => {
  const map = {
    Compliant: { bg: '#dcfce7', color: '#166534' },
    Partial: { bg: '#fef3c7', color: '#92400e' },
    Gap: { bg: '#fecaca', color: '#991b1b' },
  };
  const c = map[status] || map.Gap;
  return c;
};

// ── Mini Components ────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: T.navy, margin: 0, fontFamily: T.font }}>{children}</h2>
    {sub && <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{sub}</div>}
  </div>
);

const KpiStrip = ({ items }) => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    {items.map((item, i) => (
      <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
        padding: '14px 18px', flex: '1 1 160px', minWidth: 160 }}>
        <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: 0.6, marginBottom: 4 }}>{item.label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: item.color || T.navy, lineHeight: 1.2 }}>{item.value}</div>
        {item.sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{item.sub}</div>}
      </div>
    ))}
  </div>
);

const Badge = ({ label, status }) => {
  const c = statusBadge(status);
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 20, padding: '3px 12px',
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
};

const DqsBadge = ({ score }) => (
  <span style={{ background: DQS_COLORS[score] || T.sub, color: '#fff', borderRadius: 20,
    padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>DQS {score}</span>
);

const tbl = { width: '100%', fontSize: 13, borderCollapse: 'collapse' };
const th = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left',
  fontWeight: 600, color: T.sub, background: '#fafaf8', whiteSpace: 'nowrap' };
const td = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 13 };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6,
      padding: '8px 12px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: T.navy }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
        </div>
      ))}
    </div>
  );
};

// ── Main Dashboard Component ───────────────────────────────────────────────
export default function PortfolioDashboardPage() {
  const [holdings] = useState(SAMPLE_HOLDINGS);

  // ── Computed analytics ──────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const totalAUM = holdings.reduce((s, h) => s + h.marketValue, 0);
    const totalScope1 = holdings.reduce((s, h) => s + (h.scope1 || 0), 0);
    const totalScope2 = holdings.reduce((s, h) => s + (h.scope2 || 0), 0);
    const totalScope3 = holdings.reduce((s, h) => s + (h.scope3 || 0), 0);
    const totalFinanced = holdings.reduce((s, h) => {
      const attr = h.evic > 0 ? h.marketValue / (h.evic / 100) : 0;
      return s + attr * ((h.scope1 || 0) + (h.scope2 || 0));
    }, 0);

    // WACI = sum( weight_i * (scope1+scope2)_i / revenue_i )
    const waci = holdings.reduce((s, h) => {
      if (!h.revenue) return s;
      const intensity = (h.scope1 + h.scope2) / h.revenue;
      return s + (h.weight / 100) * intensity;
    }, 0);

    // Weighted temperature alignment estimate
    const tempMap = { 'Information Technology': 1.8, 'Energy': 3.2, 'Materials': 2.9, 'Financials': 2.1,
      'Utilities': 3.0, 'Industrials': 2.5, 'Health Care': 2.0 };
    const portfolioTemp = holdings.reduce((s, h) => {
      return s + (h.weight / 100) * (tempMap[h.sector] || 2.5);
    }, 0);

    // EU Taxonomy weighted alignment
    const taxonomyAlignment = holdings.reduce((s, h) => s + (h.weight / 100) * h.taxonomyAligned, 0);

    // SFDR PAI compliance (simulated: 12 of 14 indicators calculated)
    const sfdrPaiPct = 85.7;

    // ESG Controversy weighted score
    const contMap = { Low: 1, Medium: 3, High: 5 };
    const avgControversy = holdings.reduce((s, h) => s + (h.weight / 100) * (contMap[h.controversyLevel] || 2), 0);

    // Emissions by holding for stacked bar
    const emissionsByHolding = holdings.map(h => ({
      name: h.ticker,
      scope1: Math.round((h.scope1 || 0) / 1000),
      scope2: Math.round((h.scope2 || 0) / 1000),
      scope3: Math.round((h.scope3 || 0) / 1000),
    }));

    // Emissions by sector for donut
    const sectorMap = {};
    holdings.forEach(h => {
      const total = (h.scope1 || 0) + (h.scope2 || 0);
      sectorMap[h.sector] = (sectorMap[h.sector] || 0) + total;
    });
    const emissionsBySector = Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000) }))
      .sort((a, b) => b.value - a.value);

    // DQS distribution
    const dqsDist = [1, 2, 3, 4, 5].map(d => ({
      name: `DQS ${d}`,
      value: holdings.filter(h => h.dqs === d).length,
      label: DQS_LABELS[d],
    }));

    // Coverage metrics
    const withReported = holdings.filter(h => h.dqs <= 3).length;
    const withEstimated = holdings.filter(h => h.dqs >= 4).length;
    const withBrsr = holdings.filter(h => h.brsrReported).length;

    return {
      totalAUM, totalScope1, totalScope2, totalScope3, totalFinanced,
      waci, portfolioTemp, taxonomyAlignment, sfdrPaiPct, avgControversy,
      emissionsByHolding, emissionsBySector, dqsDist,
      coverageReported: (withReported / holdings.length) * 100,
      coverageEstimated: (withEstimated / holdings.length) * 100,
      coverageMissing: 0,
      brsrCoverage: withBrsr,
    };
  }, [holdings]);

  // ── Regulatory readiness cards ──────────────────────────────────────────
  const regulatoryCards = useMemo(() => [
    {
      framework: 'PCAF', module: 'E100',
      score: '92%', detail: '92% portfolio covered',
      status: 'Compliant', color: T.green,
      desc: 'Partnership for Carbon Accounting Financials - Financed emissions coverage across all asset classes',
    },
    {
      framework: 'SFDR PAI', module: 'E102',
      score: '12/14', detail: '12 of 14 indicators calculated',
      status: 'Partial', color: T.amber,
      desc: 'Sustainable Finance Disclosure Regulation - Principal Adverse Impact indicators',
    },
    {
      framework: 'ISSB S2 / TCFD', module: 'E103',
      score: '78%', detail: 'Maturity score 78%',
      status: 'Compliant', color: T.green,
      desc: 'ISSB S2 Climate Disclosures - 4 pillars (Governance, Strategy, Risk Mgmt, Metrics)',
    },
    {
      framework: 'EU Taxonomy', module: 'E101',
      score: pct(analytics.taxonomyAlignment), detail: 'Weighted alignment',
      status: analytics.taxonomyAlignment > 30 ? 'Partial' : 'Gap', color: analytics.taxonomyAlignment > 30 ? T.amber : T.red,
      desc: 'EU Taxonomy for Sustainable Activities - Environmental objectives alignment',
    },
    {
      framework: 'TCFD', module: 'E103',
      score: '9/11', detail: '9 of 11 recommendations met',
      status: 'Partial', color: T.amber,
      desc: 'Task Force on Climate-related Financial Disclosures - 11 recommendations',
    },
    {
      framework: 'CSRD / ESRS', module: 'E104',
      score: '8', detail: '8 material topics identified',
      status: 'Partial', color: T.amber,
      desc: 'Corporate Sustainability Reporting Directive - European Sustainability Reporting Standards',
    },
  ], [analytics.taxonomyAlignment]);

  // ── Physical risk data for heatmap ──────────────────────────────────────
  const physicalRisks = ['flooding', 'heat', 'drought', 'seaLevel', 'wildfire'];
  const physicalLabels = { flooding: 'Flooding', heat: 'Heat Stress', drought: 'Drought',
    seaLevel: 'Sea Level Rise', wildfire: 'Wildfire' };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px 60px' }}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ background: T.navy, color: T.gold, borderRadius: 8, padding: '6px 14px',
            fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>MASTER DASHBOARD</div>
          <div style={{ background: T.gold, color: '#fff', borderRadius: 8, padding: '6px 14px',
            fontSize: 12, fontWeight: 700 }}>PORTFOLIO ANALYTICS</div>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: '8px 0 4px', letterSpacing: -0.5 }}>
          Portfolio Analytics Dashboard
        </h1>
        <div style={{ fontSize: 13, color: T.sub }}>
          Integrated climate risk, regulatory compliance, and ESG analytics across all modules
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1: Portfolio Header + KPI Strip
          ══════════════════════════════════════════════════════════════════════ */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #1b3a5c 0%, #2a5580 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>India ESG Portfolio - Demo</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
              AUM: {fmtCr(analytics.totalAUM)} &nbsp;|&nbsp; Holdings: {holdings.length} &nbsp;|&nbsp;
              Reporting Date: 31 Mar 2026
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: T.gold, color: '#fff', border: 'none', borderRadius: 6,
              padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>
              Generate Report
            </button>
            <button style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)',
              borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>
              Run PCAF
            </button>
          </div>
        </div>
      </Card>

      <KpiStrip items={[
        { label: 'Total Financed Emissions', value: fmt(Math.round(analytics.totalFinanced)) + ' tCO\u2082e',
          sub: 'PCAF Scope 1+2 attributed', color: T.navy },
        { label: 'WACI', value: analytics.waci.toFixed(1), sub: 'tCO\u2082e / \u20B9Cr revenue', color: T.indigo },
        { label: 'Portfolio Temperature', value: analytics.portfolioTemp.toFixed(1) + '\u00B0C',
          sub: 'PCAF implied alignment', color: analytics.portfolioTemp > 2.5 ? T.red : T.amber },
        { label: 'EU Taxonomy Alignment', value: pct(analytics.taxonomyAlignment),
          sub: 'Weighted avg across holdings', color: analytics.taxonomyAlignment > 30 ? T.green : T.amber },
        { label: 'SFDR PAI Compliance', value: analytics.sfdrPaiPct.toFixed(0) + '%',
          sub: '12 of 14 indicators', color: T.blue },
        { label: 'ESG Controversy Score', value: analytics.avgControversy.toFixed(1) + ' / 5',
          sub: 'Weighted average', color: analytics.avgControversy > 3 ? T.red : T.amber },
      ]} />

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: Emissions Breakdown
          ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 32 }}>
        <SectionTitle sub="PCAF financed emissions by holding and sector">Emissions Breakdown</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Stacked Bar: Scope 1/2/3 by Holding */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
              Scope 1 / 2 / 3 by Holding (thousand tCO\u2082e)
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={analytics.emissionsByHolding} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.sub }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: T.sub }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="scope1" stackId="a" fill={T.navy} name="Scope 1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="scope2" stackId="a" fill={T.gold} name="Scope 2" />
                <Bar dataKey="scope3" stackId="a" fill={T.sage} name="Scope 3" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Donut: Emissions by Sector */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
              Emissions by Sector (Scope 1+2, thousand tCO\u2082e)
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie data={analytics.emissionsBySector} cx="50%" cy="50%" innerRadius={70} outerRadius={120}
                  paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: T.sub, strokeWidth: 1 }}
                  style={{ fontSize: 11 }}>
                  {analytics.emissionsBySector.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: Climate Risk Heatmap
          ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 32 }}>
        <SectionTitle sub="ISSB S2 / TCFD physical risk assessment across holdings">Climate Risk Heatmap</SectionTitle>
        <Card style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={{ ...th, minWidth: 130, position: 'sticky', left: 0, background: '#fafaf8', zIndex: 1 }}>
                  Physical Risk
                </th>
                {holdings.map(h => (
                  <th key={h.id} style={{ ...th, textAlign: 'center', minWidth: 90 }}>{h.ticker}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {physicalRisks.map(risk => (
                <tr key={risk}>
                  <td style={{ ...td, fontWeight: 600, fontSize: 12, position: 'sticky', left: 0,
                    background: T.card, zIndex: 1 }}>
                    {physicalLabels[risk]}
                  </td>
                  {holdings.map(h => {
                    const level = h.physical[risk];
                    const c = heatColor(level);
                    return (
                      <td key={h.id} style={{ ...td, textAlign: 'center', background: c.bg, color: c.color,
                        fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                        {level}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 11, color: T.sub }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#dcfce7',
              borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />Low</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#fef3c7',
              borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />Medium</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#fecaca',
              borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />High</span>
          </div>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4: Regulatory Readiness Scorecard
          ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 32 }}>
        <SectionTitle sub="Compliance readiness across major ESG/climate frameworks">Regulatory Readiness Scorecard</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {regulatoryCards.map((rc, i) => (
            <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
              borderLeft: `4px solid ${rc.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{rc.framework}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{rc.module}</div>
                </div>
                <Badge label={rc.status} status={rc.status} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: rc.color }}>{rc.score}</div>
              <div style={{ fontSize: 12, color: T.sub }}>{rc.detail}</div>
              <div style={{ fontSize: 11, color: T.sub, borderTop: `1px solid ${T.border}`, paddingTop: 8,
                marginTop: 'auto' }}>
                {rc.desc}
              </div>
              <div style={{ fontSize: 11, color: T.blue, cursor: 'pointer', fontWeight: 600 }}>
                View {rc.framework} Module Details &rarr;
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5: Top Holdings Table
          ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 32 }}>
        <SectionTitle sub="Top 10 holdings by market value with ESG metrics">Top Holdings</SectionTitle>
        <Card style={{ overflowX: 'auto', padding: 0 }}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Company</th>
                <th style={th}>Sector</th>
                <th style={{ ...th, textAlign: 'right' }}>Mkt Value ({'\u20B9'}Cr)</th>
                <th style={{ ...th, textAlign: 'right' }}>Weight</th>
                <th style={{ ...th, textAlign: 'right' }}>Financed tCO{'\u2082'}e</th>
                <th style={{ ...th, textAlign: 'right' }}>WACI</th>
                <th style={{ ...th, textAlign: 'center' }}>Controversy</th>
                <th style={{ ...th, textAlign: 'right' }}>Taxonomy %</th>
                <th style={{ ...th, textAlign: 'center' }}>DQS</th>
              </tr>
            </thead>
            <tbody>
              {[...holdings].sort((a, b) => b.marketValue - a.marketValue).map((h, i) => {
                const attr = h.evic > 0 ? h.marketValue / (h.evic / 100) : 0;
                const financedEmissions = Math.round(attr * (h.scope1 + h.scope2));
                const holdingWaci = h.revenue > 0 ? ((h.scope1 + h.scope2) / h.revenue).toFixed(1) : '—';
                return (
                  <tr key={h.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf8' }}>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: T.sub, fontSize: 11 }}>{i + 1}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 600, color: T.navy }}>{h.company}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>{h.ticker}</div>
                    </td>
                    <td style={{ ...td, fontSize: 12 }}>{h.sector}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{h.marketValue.toLocaleString('en-IN')}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{h.weight.toFixed(1)}%</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{fmt(financedEmissions)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{holdingWaci}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{ color: controversyColor(h.controversyLevel), fontWeight: 600, fontSize: 12 }}>
                        {h.controversyLevel}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>{h.taxonomyAligned}%</td>
                    <td style={{ ...td, textAlign: 'center' }}><DqsBadge score={h.dqs} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6: Trend Charts
          ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 32 }}>
        <SectionTitle sub="Historical portfolio-level metrics (2022-2026)">Trend Analysis</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* WACI Trend */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
              Portfolio WACI Over Time (tCO{'\u2082'}e / {'\u20B9'}Cr)
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={WACI_TREND} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.sub }} angle={-35} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11, fill: T.sub }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="waci" stroke={T.indigo} strokeWidth={2.5}
                  dot={{ r: 3, fill: T.indigo }} activeDot={{ r: 5 }} name="WACI" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: T.sub }}>
              <span>2022-Q1: 312</span>
              <span style={{ color: T.green, fontWeight: 600 }}>-32% reduction</span>
              <span>2026-Q1: 212</span>
            </div>
          </Card>

          {/* Financed Emissions Trend */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
              Financed Emissions Over Time (tCO{'\u2082'}e)
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={EMISSIONS_TREND} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.sub }} angle={-35} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11, fill: T.sub }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="emissions" stroke={T.navy} strokeWidth={2.5}
                  dot={{ r: 3, fill: T.navy }} activeDot={{ r: 5 }} name="Financed Emissions" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: T.sub }}>
              <span>2022-Q1: 18,400</span>
              <span style={{ color: T.green, fontWeight: 600 }}>-31.5% reduction</span>
              <span>2026-Q1: 12,600</span>
            </div>
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7: Data Quality Overview
          ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 32 }}>
        <SectionTitle sub="Data Quality Scores, coverage metrics, and BRSR integration">Data Quality Overview</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {/* DQS Distribution Donut */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>
              DQS Distribution
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={analytics.dqsDist.filter(d => d.value > 0)} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  style={{ fontSize: 11 }}>
                  {analytics.dqsDist.filter(d => d.value > 0).map((d, i) => (
                    <Cell key={i} fill={DQS_COLORS[parseInt(d.name.replace('DQS ', ''))]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(d => (
                <span key={d} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: DQS_COLORS[d], display: 'inline-block' }} />
                  DQS {d}: {DQS_LABELS[d]}
                </span>
              ))}
            </div>
          </Card>

          {/* Coverage Metrics */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 16 }}>
              Coverage Metrics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Reported */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: T.text, fontWeight: 500 }}>Reported Data</span>
                  <span style={{ fontWeight: 700, color: T.green }}>{analytics.coverageReported.toFixed(0)}%</span>
                </div>
                <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${analytics.coverageReported}%`, background: T.green,
                    borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
              {/* Estimated */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: T.text, fontWeight: 500 }}>Estimated Data</span>
                  <span style={{ fontWeight: 700, color: T.amber }}>{analytics.coverageEstimated.toFixed(0)}%</span>
                </div>
                <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${analytics.coverageEstimated}%`, background: T.amber,
                    borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
              {/* Missing */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: T.text, fontWeight: 500 }}>Missing Data</span>
                  <span style={{ fontWeight: 700, color: T.red }}>{analytics.coverageMissing.toFixed(0)}%</span>
                </div>
                <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max(analytics.coverageMissing, 2)}%`, background: T.red,
                    borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
              {/* Separator */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Data Source Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: T.sub }}>BRSR Filings</span>
                    <span style={{ fontWeight: 600, color: T.text }}>{holdings.filter(h => h.brsrReported).length} / {holdings.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: T.sub }}>CDP Responses</span>
                    <span style={{ fontWeight: 600, color: T.text }}>6 / {holdings.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: T.sub }}>GRI Reports</span>
                    <span style={{ fontWeight: 600, color: T.text }}>8 / {holdings.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* BRSR Coverage */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 16 }}>
              BRSR Integration Status
            </div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: T.navy }}>
                {analytics.brsrCoverage}
                <span style={{ fontSize: 18, color: T.sub, fontWeight: 400 }}> / {holdings.length}</span>
              </div>
              <div style={{ fontSize: 12, color: T.sub }}>Holdings with BRSR data</div>
            </div>
            <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', width: `${(analytics.brsrCoverage / holdings.length) * 100}%`,
                background: `linear-gradient(90deg, ${T.navy}, ${T.sage})`, borderRadius: 5 }} />
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 8 }}>BRSR Database</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: T.sub }}>Total Companies in DB</span>
                  <span style={{ fontWeight: 600, color: T.text }}>1,323</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: T.sub }}>Portfolio Match Rate</span>
                  <span style={{ fontWeight: 600, color: T.green }}>100%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: T.sub }}>Avg Emission Quality</span>
                  <span style={{ fontWeight: 600, color: T.text }}>DQS 2.3</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: T.sub }}>Scope 3 Available</span>
                  <span style={{ fontWeight: 600, color: T.amber }}>6 / 10</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#eff6ff', borderRadius: 6,
              fontSize: 11, color: '#1e40af' }}>
              BRSR data auto-synced from Supabase. Last updated: 24 Mar 2026
            </div>
          </Card>
        </div>
      </div>

      {/* ── Module Cross-Reference ──────────────────────────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <SectionTitle sub="Quick access to all integrated analytics modules">Module Cross-Reference</SectionTitle>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { code: 'E100', name: 'PCAF India BRSR', status: 'Active', color: T.green },
              { code: 'E101', name: 'EU Taxonomy', status: 'Active', color: T.green },
              { code: 'E102', name: 'SFDR Article 9', status: 'Active', color: T.green },
              { code: 'E103', name: 'ISSB S2 / TCFD', status: 'Active', color: T.green },
              { code: 'E104', name: 'CSRD / ESRS', status: 'Active', color: T.green },
              { code: 'E105', name: 'Double Materiality', status: 'Active', color: T.green },
              { code: 'E106', name: 'Climate Stress Test', status: 'Active', color: T.green },
              { code: 'E107', name: 'Temperature Alignment', status: 'Active', color: T.green },
              { code: 'E108', name: 'Transition Finance', status: 'Active', color: T.green },
              { code: 'E109', name: 'Physical Risk Pricing', status: 'Active', color: T.green },
              { code: 'E110', name: 'ESG Data Quality', status: 'Active', color: T.green },
              { code: 'E111', name: 'ESG Controversy', status: 'Active', color: T.green },
              { code: 'E112', name: 'Climate Litigation', status: 'Active', color: T.green },
              { code: 'E113', name: 'Carbon Accounting AI', status: 'Active', color: T.green },
              { code: 'E114', name: 'Green Bond / SLB', status: 'Active', color: T.green },
              { code: 'E115', name: 'Water Risk', status: 'Active', color: T.green },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                borderRadius: 6, border: `1px solid ${T.border}`, cursor: 'pointer',
                transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9f8f5'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <div style={{ background: T.navy, color: T.gold, borderRadius: 4, padding: '2px 6px',
                  fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{m.code}</div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 500, flex: 1 }}>{m.name}</div>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: m.color }} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 40, padding: '20px 0', borderTop: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: T.sub }}>
          SustainLens Platform &mdash; Portfolio Analytics Master Dashboard &mdash; Module: Dashboard (Master View)
        </div>
        <div style={{ fontSize: 11, color: T.sub }}>
          Data as of 24 Mar 2026 &nbsp;|&nbsp; PCAF v2.0 &nbsp;|&nbsp; BRSR FY2025 &nbsp;|&nbsp; Demo Mode
        </div>
      </div>

    </div>
  );
}
