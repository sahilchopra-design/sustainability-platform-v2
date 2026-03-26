import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { GLOBAL_COMPANY_MASTER, EXCHANGES } from '../../../data/globalCompanyMaster';

/* ── Portfolio Data ──────────────────────────────────────────────────────────── */
const saved = localStorage.getItem('ra_portfolio_v1');
const { portfolios, activePortfolio } = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
const holdings = portfolios?.[activePortfolio]?.holdings || [];

/* ── Color Theme ─────────────────────────────────────────────────────────────── */
const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif"
};

/* ── Physical Hazards ────────────────────────────────────────────────────────── */
const HAZARDS = [
  { id:'flood', name:'River & Coastal Flooding', icon:'\u{1F30A}', type:'Acute', color:'#2563eb', description:'Fluvial and coastal flood events from extreme precipitation and storm surge' },
  { id:'cyclone', name:'Tropical Cyclones', icon:'\u{1F300}', type:'Acute', color:'#7c3aed', description:'Hurricanes, typhoons, cyclonic wind damage and storm surge' },
  { id:'wildfire', name:'Wildfire', icon:'\u{1F525}', type:'Acute', color:'#ef4444', description:'Forest and bushfire events driven by drought and heat extremes' },
  { id:'heatwave', name:'Extreme Heat', icon:'\u{1F321}\uFE0F', type:'Chronic', color:'#f97316', description:'Heatwave frequency, cooling demand, labour productivity loss' },
  { id:'drought', name:'Water Stress & Drought', icon:'\u{1F4A7}', type:'Chronic', color:'#d97706', description:'Precipitation decline, groundwater depletion, agricultural water stress' },
  { id:'sealevel', name:'Sea Level Rise', icon:'\u{1F3D6}\uFE0F', type:'Chronic', color:'#0891b2', description:'Coastal inundation from thermal expansion and ice sheet melt' },
];

/* ── Country-Level Physical Risk Scores ──────────────────────────────────────── */
const COUNTRY_RISK = {
  India:          { flood:82, cyclone:75, wildfire:35, heatwave:90, drought:78, sealevel:65, ndgain:43.5 },
  USA:            { flood:55, cyclone:60, wildfire:72, heatwave:58, drought:52, sealevel:45, ndgain:69.5 },
  UK:             { flood:62, cyclone:12, wildfire:8,  heatwave:35, drought:28, sealevel:55, ndgain:72.1 },
  Germany:        { flood:58, cyclone:8,  wildfire:15, heatwave:42, drought:38, sealevel:30, ndgain:72.0 },
  France:         { flood:52, cyclone:10, wildfire:45, heatwave:55, drought:45, sealevel:35, ndgain:68.5 },
  Japan:          { flood:78, cyclone:82, wildfire:18, heatwave:65, drought:30, sealevel:60, ndgain:67.8 },
  'Hong Kong':    { flood:55, cyclone:70, wildfire:12, heatwave:72, drought:25, sealevel:75, ndgain:73.2 },
  Australia:      { flood:50, cyclone:55, wildfire:92, heatwave:85, drought:88, sealevel:40, ndgain:75.5 },
  Singapore:      { flood:48, cyclone:15, wildfire:5,  heatwave:78, drought:18, sealevel:82, ndgain:78.1 },
  'South Korea':  { flood:55, cyclone:35, wildfire:22, heatwave:52, drought:35, sealevel:38, ndgain:68.2 },
  China:          { flood:72, cyclone:55, wildfire:30, heatwave:68, drought:65, sealevel:52, ndgain:52.8 },
  Brazil:         { flood:65, cyclone:18, wildfire:75, heatwave:62, drought:72, sealevel:35, ndgain:48.9 },
  'South Africa': { flood:52, cyclone:25, wildfire:60, heatwave:70, drought:82, sealevel:30, ndgain:44.2 },
  Canada:         { flood:48, cyclone:8,  wildfire:78, heatwave:32, drought:35, sealevel:25, ndgain:76.3 },
};

/* ── Sector Vulnerability Multipliers ────────────────────────────────────────── */
const SECTOR_VULNERABILITY = {
  Energy:                     { flood:1.2, cyclone:1.3, wildfire:0.8, heatwave:1.1, drought:1.4, sealevel:1.5 },
  Materials:                  { flood:1.1, cyclone:1.0, wildfire:0.9, heatwave:1.3, drought:1.5, sealevel:0.8 },
  Utilities:                  { flood:1.4, cyclone:1.2, wildfire:1.1, heatwave:1.5, drought:1.8, sealevel:1.3 },
  'Real Estate':              { flood:1.8, cyclone:1.5, wildfire:1.4, heatwave:1.2, drought:0.6, sealevel:2.0 },
  Industrials:                { flood:1.0, cyclone:1.0, wildfire:0.7, heatwave:1.2, drought:1.0, sealevel:0.9 },
  'Consumer Staples':         { flood:0.8, cyclone:0.8, wildfire:0.6, heatwave:1.1, drought:1.6, sealevel:0.5 },
  Financials:                 { flood:0.5, cyclone:0.5, wildfire:0.4, heatwave:0.4, drought:0.3, sealevel:0.6 },
  IT:                         { flood:0.4, cyclone:0.4, wildfire:0.3, heatwave:0.5, drought:0.2, sealevel:0.3 },
  'Health Care':              { flood:0.6, cyclone:0.6, wildfire:0.5, heatwave:0.8, drought:0.5, sealevel:0.5 },
  'Consumer Discretionary':   { flood:0.7, cyclone:0.7, wildfire:0.5, heatwave:0.9, drought:0.6, sealevel:0.6 },
  'Communication Services':   { flood:0.3, cyclone:0.3, wildfire:0.2, heatwave:0.3, drought:0.2, sealevel:0.3 },
};

/* ── Exchange-to-Country Map ─────────────────────────────────────────────────── */
const EXCHANGE_COUNTRY = {
  NSE:'India', BSE:'India', NYSE:'USA', NASDAQ:'USA', LSE:'UK', XETRA:'Germany',
  EURONEXT:'France', TSE:'Japan', HKEX:'Hong Kong', ASX:'Australia', SGX:'Singapore',
  KRX:'South Korea', SSE:'China', SZSE:'China', B3:'Brazil', JSE:'South Africa', TSX:'Canada'
};

/* ── Per-Holding Physical Risk Computation ───────────────────────────────────── */
function computeHoldingPhysicalRisk(holding, timeHorizon, sspMultiplier) {
  const c = holding.company || {};
  const country = EXCHANGE_COUNTRY[c.exchange] || 'USA';
  const countryRisk = COUNTRY_RISK[country] || COUNTRY_RISK['USA'];
  const sectorVuln = SECTOR_VULNERABILITY[c.sector] || { flood:0.5, cyclone:0.5, wildfire:0.5, heatwave:0.5, drought:0.5, sealevel:0.5 };

  const timeFactor = timeHorizon === 2050 ? 1.3 : timeHorizon === 2100 ? 1.8 : 1.0;
  const hazardScores = {};
  let totalPhysicalScore = 0;
  HAZARDS.forEach(h => {
    const raw = (countryRisk[h.id] || 30) * (sectorVuln[h.id] || 0.5) / 100;
    hazardScores[h.id] = Math.min(100, raw * 100 * timeFactor * sspMultiplier);
    totalPhysicalScore += hazardScores[h.id];
  });
  const compositePhysicalRisk = totalPhysicalScore / HAZARDS.length;
  const ndgain = countryRisk.ndgain || 50;

  return { ...holding, country, hazardScores, compositePhysicalRisk, ndgain };
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
const fmt = v => v == null ? '-' : v.toFixed(1);
const fmtPct = v => v == null ? '-' : v.toFixed(1) + '%';
const fmtUsd = v => {
  if (v == null) return '-';
  if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'Mn';
  if (Math.abs(v) >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
  return '$' + v.toFixed(0);
};

const riskColor = v => v >= 60 ? T.red : v >= 30 ? T.amber : T.green;
const riskLabel = v => v > 75 ? 'Critical' : v > 50 ? 'High' : v > 25 ? 'Medium' : 'Low';
const riskLabelColor = v => v > 75 ? '#991b1b' : v > 50 ? T.red : v > 25 ? T.amber : T.green;

const vulnColor = v => v > 1.0 ? T.red : v >= 0.5 ? T.amber : T.green;
const adaptColor = v => v >= 65 ? T.green : v >= 50 ? T.amber : T.red;

/* ── Styles ──────────────────────────────────────────────────────────────────── */
const card = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, marginBottom: 20,
};
const cardTitle = {
  fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 14, letterSpacing: '-0.01em',
};
const kpiBox = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', textAlign: 'center', minWidth: 170, flex: 1,
};
const badge = (label, color) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 7px', marginLeft: 6 }}>{label}</span>
);
const thStyle = {
  padding: '10px 12px', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase',
  letterSpacing: '0.04em', borderBottom: `2px solid ${T.border}`, background: T.surfaceH, textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
};
const tdStyle = {
  padding: '9px 12px', fontSize: 12.5, color: T.text, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
};
const btnStyle = (active) => ({
  padding: '7px 16px', fontSize: 12, fontWeight: 600, border: `1px solid ${active ? T.navy : T.border}`,
  borderRadius: 8, cursor: 'pointer', background: active ? T.navy : T.surface, color: active ? '#fff' : T.text,
  transition: 'all 0.15s',
});

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  COMPONENT                                                                   */
/* ══════════════════════════════════════════════════════════════════════════════ */
export default function ClimatePhysicalRiskPage() {
  const navigate = useNavigate();

  /* ── State ─────────────────────────────────────────────────────────────────── */
  const [timeHorizon, setTimeHorizon] = useState(2030);
  const [sspScenario, setSspScenario] = useState('SSP2-4.5');
  const [holdingSortCol, setHoldingSortCol] = useState('compositePhysicalRisk');
  const [holdingSortAsc, setHoldingSortAsc] = useState(false);
  const [geoSortCol, setGeoSortCol] = useState('composite');
  const [geoSortAsc, setGeoSortAsc] = useState(false);

  /* ── SSP Multiplier ────────────────────────────────────────────────────────── */
  const sspMultiplier = sspScenario === 'SSP1-2.6' ? 0.8 : sspScenario === 'SSP5-8.5' ? 1.4 : 1.0;

  /* ── Compute holdings ──────────────────────────────────────────────────────── */
  const enriched = useMemo(() =>
    holdings.map(h => computeHoldingPhysicalRisk(h, timeHorizon, sspMultiplier)),
    [timeHorizon, sspMultiplier]
  );

  const totalValue = enriched.reduce((s, h) => s + (h.exposure_usd || h.value || 0), 0);
  const w = h => totalValue > 0 ? (h.exposure_usd || h.value || 0) / totalValue : 0;

  /* ── Portfolio KPIs ────────────────────────────────────────────────────────── */
  const compositeRisk = useMemo(() => {
    if (!enriched.length) return 0;
    return enriched.reduce((s, h) => s + h.compositePhysicalRisk * w(h), 0);
  }, [enriched, totalValue]);

  const acuteExposurePct = useMemo(() => {
    if (!enriched.length) return 0;
    return enriched.filter(h => {
      const hs = h.hazardScores;
      return ((hs.flood || 0) + (hs.cyclone || 0) + (hs.wildfire || 0)) / 3 > 50;
    }).reduce((s, h) => s + w(h) * 100, 0);
  }, [enriched, totalValue]);

  const chronicExposurePct = useMemo(() => {
    if (!enriched.length) return 0;
    return enriched.filter(h => {
      const hs = h.hazardScores;
      return ((hs.heatwave || 0) + (hs.drought || 0) + (hs.sealevel || 0)) / 3 > 50;
    }).reduce((s, h) => s + w(h) * 100, 0);
  }, [enriched, totalValue]);

  const mostExposedCountry = useMemo(() => {
    if (!enriched.length) return '-';
    const byCountry = {};
    enriched.forEach(h => {
      byCountry[h.country] = (byCountry[h.country] || 0) + h.compositePhysicalRisk * w(h);
    });
    return Object.entries(byCountry).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  }, [enriched, totalValue]);

  const mostExposedSector = useMemo(() => {
    if (!enriched.length) return '-';
    const bySector = {};
    enriched.forEach(h => {
      const sec = h.company?.sector || 'Unknown';
      bySector[sec] = (bySector[sec] || 0) + h.compositePhysicalRisk * w(h);
    });
    return Object.entries(bySector).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  }, [enriched, totalValue]);

  const ndgainScore = useMemo(() => {
    if (!enriched.length) return 0;
    return enriched.reduce((s, h) => s + (h.ndgain || 50) * w(h), 0);
  }, [enriched, totalValue]);

  /* ── Hazard Radar Data ─────────────────────────────────────────────────────── */
  const radarData = useMemo(() =>
    HAZARDS.map(hz => ({
      hazard: hz.name.split(' ')[0],
      fullName: hz.name,
      portfolio: enriched.length ? enriched.reduce((s, h) => s + (h.hazardScores[hz.id] || 0) * w(h), 0) : 0,
      benchmark: 50,
    })),
    [enriched, totalValue]
  );

  /* ── Hazard Breakdown Bar Data ─────────────────────────────────────────────── */
  const hazardBarData = useMemo(() =>
    HAZARDS.map(hz => ({
      name: hz.name,
      type: hz.type,
      score: enriched.length ? enriched.reduce((s, h) => s + (h.hazardScores[hz.id] || 0) * w(h), 0) : 0,
      color: hz.color,
    })),
    [enriched, totalValue]
  );

  /* ── Geographic Grouping ───────────────────────────────────────────────────── */
  const geoData = useMemo(() => {
    const byCountry = {};
    enriched.forEach(h => {
      if (!byCountry[h.country]) {
        const cr = COUNTRY_RISK[h.country] || COUNTRY_RISK['USA'];
        byCountry[h.country] = { country: h.country, count: 0, weight: 0, flood: 0, cyclone: 0, wildfire: 0, heatwave: 0, drought: 0, sealevel: 0, composite: 0, ndgain: cr.ndgain || 50 };
      }
      const wt = w(h);
      byCountry[h.country].count += 1;
      byCountry[h.country].weight += wt * 100;
      HAZARDS.forEach(hz => { byCountry[h.country][hz.id] += (h.hazardScores[hz.id] || 0) * wt; });
      byCountry[h.country].composite += h.compositePhysicalRisk * wt;
    });
    return Object.values(byCountry);
  }, [enriched, totalValue]);

  const sortedGeoData = useMemo(() => {
    const sorted = [...geoData];
    sorted.sort((a, b) => geoSortAsc ? (a[geoSortCol] > b[geoSortCol] ? 1 : -1) : (a[geoSortCol] < b[geoSortCol] ? 1 : -1));
    return sorted;
  }, [geoData, geoSortCol, geoSortAsc]);

  /* ── Sorted Holdings ───────────────────────────────────────────────────────── */
  const sortedHoldings = useMemo(() => {
    const arr = [...enriched];
    arr.sort((a, b) => {
      let va, vb;
      if (holdingSortCol === 'compositePhysicalRisk') { va = a.compositePhysicalRisk; vb = b.compositePhysicalRisk; }
      else if (holdingSortCol === 'weight') { va = w(a); vb = w(b); }
      else if (holdingSortCol === 'company') { va = (a.company?.name || '').toLowerCase(); vb = (b.company?.name || '').toLowerCase(); }
      else if (holdingSortCol === 'country') { va = a.country; vb = b.country; }
      else if (holdingSortCol === 'sector') { va = a.company?.sector || ''; vb = b.company?.sector || ''; }
      else if (HAZARDS.find(h => h.id === holdingSortCol)) { va = a.hazardScores[holdingSortCol] || 0; vb = b.hazardScores[holdingSortCol] || 0; }
      else { va = a.compositePhysicalRisk; vb = b.compositePhysicalRisk; }
      if (typeof va === 'string') return holdingSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return holdingSortAsc ? va - vb : vb - va;
    });
    return arr;
  }, [enriched, holdingSortCol, holdingSortAsc, totalValue]);

  /* ── Projection Data ───────────────────────────────────────────────────────── */
  const projectionData = useMemo(() =>
    [2025, 2030, 2035, 2040, 2050, 2060, 2070, 2080, 2090, 2100].map(yr => {
      const yearFactor = 1 + (yr - 2025) * 0.01 * sspMultiplier;
      return {
        year: yr,
        ssp126: Math.min(100, compositeRisk * 0.8 * yearFactor * 0.7),
        ssp245: Math.min(100, compositeRisk * yearFactor),
        ssp585: Math.min(100, compositeRisk * 1.4 * yearFactor * 1.2),
      };
    }),
    [compositeRisk, sspMultiplier]
  );

  /* ── Physical Risk VaR ─────────────────────────────────────────────────────── */
  const physicalVaR = useMemo(() => {
    let acuteVaR = 0, chronicVaR = 0;
    enriched.forEach(h => {
      const exp = h.exposure_usd || h.value || 0;
      const hs = h.hazardScores;
      acuteVaR += exp * ((hs.flood || 0) + (hs.cyclone || 0) + (hs.wildfire || 0)) / 300 * 0.15;
      chronicVaR += exp * ((hs.heatwave || 0) + (hs.drought || 0) + (hs.sealevel || 0)) / 300 * 0.15;
    });
    return { total: acuteVaR + chronicVaR, acute: acuteVaR, chronic: chronicVaR };
  }, [enriched]);

  /* ── Adaptation Data ───────────────────────────────────────────────────────── */
  const adaptationData = useMemo(() => {
    const byCountry = {};
    enriched.forEach(h => {
      if (!byCountry[h.country]) {
        const cr = COUNTRY_RISK[h.country] || COUNTRY_RISK['USA'];
        byCountry[h.country] = { country: h.country, ndgain: cr.ndgain || 50, compositeRisk: 0, weight: 0 };
      }
      const wt = w(h);
      byCountry[h.country].compositeRisk += h.compositePhysicalRisk * wt;
      byCountry[h.country].weight += wt * 100;
    });
    return Object.values(byCountry).sort((a, b) => a.ndgain - b.ndgain);
  }, [enriched, totalValue]);

  /* ── CSV Export ─────────────────────────────────────────────────────────────── */
  const handleExport = () => {
    const header = ['Company','Ticker','Country','Sector','Weight%','Flood','Cyclone','Wildfire','HeatStress','Drought','SeaLevel','Composite','RiskLevel','ND-GAIN'];
    const rows = sortedHoldings.map(h => [
      h.company?.name || '', h.company?.ticker || '', h.country, h.company?.sector || '',
      (w(h) * 100).toFixed(2), fmt(h.hazardScores.flood), fmt(h.hazardScores.cyclone), fmt(h.hazardScores.wildfire),
      fmt(h.hazardScores.heatwave), fmt(h.hazardScores.drought), fmt(h.hazardScores.sealevel),
      fmt(h.compositePhysicalRisk), riskLabel(h.compositePhysicalRisk), fmt(h.ndgain),
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `physical_risk_report_${sspScenario}_${timeHorizon}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Sort Handler ──────────────────────────────────────────────────────────── */
  const toggleHoldingSort = col => {
    if (holdingSortCol === col) setHoldingSortAsc(!holdingSortAsc);
    else { setHoldingSortCol(col); setHoldingSortAsc(false); }
  };
  const toggleGeoSort = col => {
    if (geoSortCol === col) setGeoSortAsc(!geoSortAsc);
    else { setGeoSortCol(col); setGeoSortAsc(false); }
  };
  const sortArrow = (col, activeCol, asc) => col === activeCol ? (asc ? ' \u25B2' : ' \u25BC') : '';

  /* ── Custom Tooltip ────────────────────────────────────────────────────────── */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
        <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginTop: 2 }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</div>
        ))}
      </div>
    );
  };

  /* ── Hazard cell renderer ──────────────────────────────────────────────────── */
  const hazardCell = (val) => (
    <td style={{ ...tdStyle, fontWeight: 600, color: riskColor(val), background: `${riskColor(val)}08` }}>{fmt(val)}</td>
  );

  /* ══════════════════════════════════════════════════════════════════════════ */
  /*  EMPTY STATE                                                              */
  /* ══════════════════════════════════════════════════════════════════════════ */
  if (!holdings.length) {
    return (
      <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...card, maxWidth: 520, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u{1F30D}'}</div>
          <h2 style={{ color: T.navy, fontSize: 22, marginBottom: 8 }}>No Portfolio Loaded</h2>
          <p style={{ color: T.textSec, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            The Climate Physical Risk Engine requires an active portfolio to assess hazard exposure across your holdings.
            Please configure your portfolio first.
          </p>
          <button onClick={() => navigate('/portfolio-manager')} style={{ ...btnStyle(true), padding: '10px 28px', fontSize: 14 }}>
            Open Portfolio Manager
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                   */
  /* ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '28px 36px 60px' }}>

      {/* ── 1. HEADER ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0, letterSpacing: '-0.02em' }}>
              Climate Physical Risk Engine
            </h1>
            {badge('NGFS', T.navyL)}{badge('IPCC AR6', '#7c3aed')}{badge('6 Hazards', T.sage)}{badge('Asset-Level', T.gold)}
          </div>
          <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>
            Multi-hazard physical climate risk assessment across portfolio holdings
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExport} style={{ ...btnStyle(false), display: 'flex', alignItems: 'center', gap: 6 }}>
            {'\u{1F4E5}'} Export Physical Risk Report
          </button>
        </div>
      </div>

      {/* ── 2. TIME HORIZON SELECTOR ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ ...card, padding: '14px 20px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Horizon</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[2030, 2050, 2100].map(yr => (
              <button key={yr} onClick={() => setTimeHorizon(yr)} style={btnStyle(timeHorizon === yr)}>
                {yr}{yr === 2030 ? ' (1.0x)' : yr === 2050 ? ' (1.3x)' : ' (1.8x)'}
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. SSP SCENARIO SELECTOR ─────────────────────────────────────────── */}
        <div style={{ ...card, padding: '14px 20px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>RCP/SSP Scenario</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ id: 'SSP1-2.6', label: 'SSP1-2.6 (Low)', mult: '0.8x' }, { id: 'SSP2-4.5', label: 'SSP2-4.5 (Medium)', mult: '1.0x' }, { id: 'SSP5-8.5', label: 'SSP5-8.5 (High)', mult: '1.4x' }].map(s => (
              <button key={s.id} onClick={() => setSspScenario(s.id)} style={btnStyle(sspScenario === s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. PORTFOLIO PHYSICAL RISK SUMMARY KPIs ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {/* Composite */}
        <div style={kpiBox}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>Composite Physical Risk</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: riskColor(compositeRisk) }}>{fmt(compositeRisk)}</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>/ 100 scale</div>
        </div>
        {/* Acute */}
        <div style={kpiBox}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>Acute Risk Exposure</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: riskColor(acuteExposurePct) }}>{fmtPct(acuteExposurePct)}</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>of portfolio in high acute</div>
        </div>
        {/* Chronic */}
        <div style={kpiBox}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>Chronic Risk Exposure</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: riskColor(chronicExposurePct) }}>{fmtPct(chronicExposurePct)}</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>of portfolio in high chronic</div>
        </div>
        {/* Most Exposed Country */}
        <div style={kpiBox}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>Most Exposed Country</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>{mostExposedCountry}</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>highest weighted risk</div>
        </div>
        {/* Most Exposed Sector */}
        <div style={kpiBox}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>Most Exposed Sector</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{mostExposedSector}</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>vulnerability-adjusted</div>
        </div>
        {/* ND-GAIN */}
        <div style={kpiBox}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>ND-GAIN Resilience</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: adaptColor(ndgainScore) }}>{fmt(ndgainScore)}</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>portfolio-weighted avg</div>
        </div>
      </div>

      {/* ── 5 & 6. RADAR + BAR CHART ROW ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Radar Chart */}
        <div style={card}>
          <div style={cardTitle}>Hazard Exposure Radar {badge(sspScenario, T.navyL)} {badge(String(timeHorizon), T.gold)}</div>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="hazard" tick={{ fontSize: 11, fill: T.textSec }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
              <Radar name="Portfolio" dataKey="portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Benchmark (50)" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Hazard Breakdown Bar */}
        <div style={card}>
          <div style={cardTitle}>Hazard Breakdown by Type</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={hazardBarData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: T.text }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name="Portfolio Score" radius={[0, 6, 6, 0]} barSize={22}>
                {hazardBarData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: T.textSec }}>{'\u26A1'} <strong>Acute:</strong> Flood, Cyclone, Wildfire</span>
            <span style={{ fontSize: 11, color: T.textSec }}>{'\u{1F552}'} <strong>Chronic:</strong> Heat, Drought, Sea Level</span>
          </div>
        </div>
      </div>

      {/* ── 7. GEOGRAPHIC RISK HEATMAP TABLE ─────────────────────────────────── */}
      <div style={card}>
        <div style={cardTitle}>Geographic Risk Heatmap</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {[
                  { col: 'country', label: 'Country' }, { col: 'count', label: '# Holdings' }, { col: 'weight', label: 'Weight %' },
                  { col: 'flood', label: 'Flood' }, { col: 'cyclone', label: 'Cyclone' }, { col: 'wildfire', label: 'Wildfire' },
                  { col: 'heatwave', label: 'Heat' }, { col: 'drought', label: 'Drought' }, { col: 'sealevel', label: 'Sea Level' },
                  { col: 'composite', label: 'Composite' }, { col: 'ndgain', label: 'ND-GAIN' },
                ].map(c => (
                  <th key={c.col} onClick={() => toggleGeoSort(c.col)} style={thStyle}>
                    {c.label}{sortArrow(c.col, geoSortCol, geoSortAsc)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedGeoData.map((row, idx) => (
                <tr key={row.country} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{row.country}</td>
                  <td style={tdStyle}>{row.count}</td>
                  <td style={tdStyle}>{fmtPct(row.weight)}</td>
                  {hazardCell(row.flood)}
                  {hazardCell(row.cyclone)}
                  {hazardCell(row.wildfire)}
                  {hazardCell(row.heatwave)}
                  {hazardCell(row.drought)}
                  {hazardCell(row.sealevel)}
                  <td style={{ ...tdStyle, fontWeight: 700, color: riskColor(row.composite) }}>{fmt(row.composite)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: adaptColor(row.ndgain) }}>{fmt(row.ndgain)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 8. HOLDING-LEVEL PHYSICAL RISK TABLE ─────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={cardTitle}>Holding-Level Physical Risk Assessment ({enriched.length} holdings)</div>
          <div style={{ fontSize: 11, color: T.textMut }}>Click column headers to sort</div>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr>
                {[
                  { col: 'company', label: 'Company' }, { col: 'ticker', label: 'Ticker' }, { col: 'country', label: 'Country' },
                  { col: 'sector', label: 'Sector' }, { col: 'weight', label: 'Weight %' },
                  { col: 'flood', label: 'Flood' }, { col: 'cyclone', label: 'Cyclone' }, { col: 'wildfire', label: 'Wildfire' },
                  { col: 'heatwave', label: 'Heat' }, { col: 'drought', label: 'Drought' }, { col: 'sealevel', label: 'Sea Level' },
                  { col: 'compositePhysicalRisk', label: 'Composite' }, { col: 'riskLevel', label: 'Risk Level' },
                ].map(c => (
                  <th key={c.col} onClick={() => c.col !== 'ticker' && c.col !== 'riskLevel' && toggleHoldingSort(c.col)} style={thStyle}>
                    {c.label}{c.col !== 'ticker' && c.col !== 'riskLevel' ? sortArrow(c.col, holdingSortCol, holdingSortAsc) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h, idx) => {
                const rl = riskLabel(h.compositePhysicalRisk);
                const rlc = riskLabelColor(h.compositePhysicalRisk);
                return (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH, cursor: 'pointer' }}
                    onClick={() => navigate(`/holdings/${h.company?.ticker || ''}`)}>
                    <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.company?.name || '-'}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{h.company?.ticker || '-'}</td>
                    <td style={tdStyle}>{h.country}</td>
                    <td style={{ ...tdStyle, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.company?.sector || '-'}</td>
                    <td style={tdStyle}>{fmtPct(w(h) * 100)}</td>
                    {hazardCell(h.hazardScores.flood)}
                    {hazardCell(h.hazardScores.cyclone)}
                    {hazardCell(h.hazardScores.wildfire)}
                    {hazardCell(h.hazardScores.heatwave)}
                    {hazardCell(h.hazardScores.drought)}
                    {hazardCell(h.hazardScores.sealevel)}
                    <td style={{ ...tdStyle, fontWeight: 700, color: riskColor(h.compositePhysicalRisk) }}>{fmt(h.compositePhysicalRisk)}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: rlc, background: `${rlc}14`, border: `1px solid ${rlc}33`, borderRadius: 4, padding: '3px 8px' }}>{rl}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 9. SECTOR PHYSICAL VULNERABILITY MATRIX ──────────────────────────── */}
      <div style={card}>
        <div style={cardTitle}>Sector Physical Vulnerability Matrix</div>
        <p style={{ fontSize: 12, color: T.textSec, marginTop: -8, marginBottom: 14 }}>
          Multiplier indicating how exposed each sector is to each hazard. {badge('Low < 0.5', T.green)} {badge('Med 0.5-1.0', T.amber)} {badge('High > 1.0', T.red)}
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle}>Sector</th>
                {HAZARDS.map(h => <th key={h.id} style={thStyle}>{h.icon} {h.name.split(' ')[0]}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(SECTOR_VULNERABILITY).map(([sector, vulns], idx) => (
                <tr key={sector} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{sector}</td>
                  {HAZARDS.map(h => {
                    const v = vulns[h.id];
                    const c = vulnColor(v);
                    return (
                      <td key={h.id} style={{ ...tdStyle, fontWeight: 600, color: c, background: `${c}08`, textAlign: 'center' }}>
                        {v.toFixed(1)}x
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 10. TIME SERIES PROJECTION CHART ─────────────────────────────────── */}
      <div style={card}>
        <div style={cardTitle}>Physical Risk Projection (2025 - 2100) {badge('Multi-Scenario', T.navyL)}</div>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textMut } }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="ssp585" name="SSP5-8.5 (High)" stroke="#ef4444" fill="#ef4444" fillOpacity={0.12} strokeWidth={2} />
            <Area type="monotone" dataKey="ssp245" name="SSP2-4.5 (Medium)" stroke={T.navy} fill={T.navy} fillOpacity={0.10} strokeWidth={2} />
            <Area type="monotone" dataKey="ssp126" name="SSP1-2.6 (Low)" stroke={T.sage} fill={T.sage} fillOpacity={0.10} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 11. PHYSICAL RISK VaR PANEL ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ ...kpiBox, borderLeft: `4px solid ${T.red}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>Total Physical Risk VaR</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: T.red }}>{fmtUsd(physicalVaR.total)}</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>15% max loss factor applied</div>
        </div>
        <div style={{ ...kpiBox, borderLeft: `4px solid #7c3aed` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>Acute VaR Component</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#7c3aed' }}>{fmtUsd(physicalVaR.acute)}</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Flood + Cyclone + Wildfire</div>
        </div>
        <div style={{ ...kpiBox, borderLeft: `4px solid ${T.amber}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', marginBottom: 6 }}>Chronic VaR Component</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: T.amber }}>{fmtUsd(physicalVaR.chronic)}</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Heat + Drought + Sea Level</div>
        </div>
      </div>

      {/* ── 12. ADAPTATION READINESS ASSESSMENT ──────────────────────────────── */}
      <div style={card}>
        <div style={cardTitle}>Adaptation Readiness Assessment {badge('ND-GAIN Index', T.sage)}</div>
        <p style={{ fontSize: 12, color: T.textSec, marginTop: -8, marginBottom: 14 }}>
          High physical risk + Low adaptive capacity = PRIORITY for engagement
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle}>Country</th>
                <th style={thStyle}>Portfolio Weight</th>
                <th style={thStyle}>ND-GAIN Score</th>
                <th style={thStyle}>Adaptive Capacity</th>
                <th style={thStyle}>Composite Physical Risk</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {adaptationData.map((row, idx) => {
                const capLabel = row.ndgain >= 65 ? 'High' : row.ndgain >= 50 ? 'Medium' : 'Low';
                const capColor = adaptColor(row.ndgain);
                const isPriority = row.compositeRisk > 20 && row.ndgain < 55;
                const priorityLabel = isPriority ? 'HIGH' : row.compositeRisk > 15 ? 'MEDIUM' : 'LOW';
                const priorityColor = isPriority ? T.red : row.compositeRisk > 15 ? T.amber : T.green;
                return (
                  <tr key={row.country} style={{ background: idx % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{row.country}</td>
                    <td style={tdStyle}>{fmtPct(row.weight)}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: capColor }}>{fmt(row.ndgain)}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: capColor, background: `${capColor}14`, border: `1px solid ${capColor}33`, borderRadius: 4, padding: '3px 8px' }}>{capLabel}</span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: riskColor(row.compositeRisk * 2) }}>{fmt(row.compositeRisk)}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: priorityColor, background: `${priorityColor}14`, border: `1px solid ${priorityColor}33`, borderRadius: 4, padding: '3px 8px' }}>{priorityLabel}</span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 11, color: T.textSec, maxWidth: 250 }}>
                      {isPriority ? 'Priority engagement: high physical risk with low adaptive capacity. Consider divestment or stewardship action.'
                        : row.ndgain >= 65 ? 'Strong adaptive capacity. Monitor ongoing exposure trends.'
                        : 'Moderate resilience. Enhanced monitoring recommended.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 14. CROSS-MODULE LINKS ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/climate-transition-risk')} style={{ ...btnStyle(false), display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          {'\u{1F30D}'} View Transition Risk {'\u2192'}
        </button>
        <button onClick={() => navigate('/scenario-stress-test')} style={{ ...btnStyle(false), display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          {'\u{1F4CA}'} View Scenario Stress Test {'\u2192'}
        </button>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 36, paddingTop: 20, borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: T.textMut, margin: 0 }}>
          Climate Physical Risk Engine v1.0 | NGFS-aligned | IPCC AR6 WG2 hazard taxonomy | ND-GAIN Country Index | {sspScenario} @ {timeHorizon}
        </p>
      </div>
    </div>
  );
}
