import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend, ScatterChart, Scatter,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ─── Static Data ─────────────────────────────────────────────────────────── */

const REGIONS=['East Asia & Pacific','Europe & Central Asia','Latin America & Caribbean','Middle East & North Africa','North America','South Asia','Sub-Saharan Africa'];
const INCOME_GROUPS=['High income','Upper middle income','Lower middle income','Low income'];
const RATINGS_SCALE=['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC+','CCC','CCC-'];
const HAZARDS=['Flood','Drought','Cyclone','Heat Stress','Sea Level Rise','Wildfire','Water Stress','Agricultural Loss'];

const COUNTRY_NAMES=[
  'United States','China','Japan','Germany','United Kingdom','France','India','Italy','Brazil','Canada',
  'Australia','South Korea','Spain','Mexico','Indonesia','Netherlands','Saudi Arabia','Turkey','Switzerland','Taiwan',
  'Poland','Sweden','Belgium','Thailand','Argentina','Norway','Austria','Israel','Ireland','Singapore',
  'Malaysia','Philippines','South Africa','Denmark','Colombia','Chile','Finland','Portugal','Czech Republic',
  'Romania','New Zealand','Peru','Greece','Iraq','Qatar','Hungary','Kuwait','Morocco','Ecuador','Vietnam',
  'Bangladesh','Nigeria','Egypt','Pakistan','Kenya','Ukraine','Ghana','Ethiopia','Sri Lanka','Tanzania',
  'Oman','Bahrain','Costa Rica','Panama','Uruguay','Dominican Republic','Guatemala','Myanmar','Ivory Coast','Senegal',
  'Cambodia','Mozambique','Madagascar','Nepal','Zimbabwe','Honduras','Paraguay','El Salvador','Jamaica','Trinidad & Tobago',
];

const REGION_MAP={
  'United States':4,'Canada':4,'Mexico':2,'Brazil':2,'Argentina':2,'Colombia':2,'Chile':2,'Peru':2,'Ecuador':2,'Uruguay':4,
  'Dominican Republic':2,'Guatemala':2,'Honduras':2,'Paraguay':2,'El Salvador':2,'Jamaica':2,'Trinidad & Tobago':2,'Costa Rica':2,'Panama':2,
  'China':0,'Japan':0,'South Korea':0,'Taiwan':0,'Indonesia':0,'Thailand':0,'Malaysia':0,'Philippines':0,'Singapore':0,'Vietnam':0,
  'Cambodia':0,'Myanmar':0,'Australia':0,'New Zealand':0,
  'Germany':1,'United Kingdom':1,'France':1,'Italy':1,'Netherlands':1,'Switzerland':1,'Sweden':1,'Belgium':1,'Norway':1,'Austria':1,
  'Ireland':1,'Denmark':1,'Finland':1,'Portugal':1,'Spain':1,'Poland':1,'Czech Republic':1,'Romania':1,'Greece':1,'Hungary':1,'Turkey':1,'Ukraine':1,'Israel':1,
  'India':5,'Bangladesh':5,'Pakistan':5,'Sri Lanka':5,'Nepal':5,
  'Saudi Arabia':3,'Qatar':3,'Kuwait':3,'Iraq':3,'Morocco':3,'Egypt':3,'Oman':3,'Bahrain':3,
  'South Africa':6,'Nigeria':6,'Kenya':6,'Ghana':6,'Ethiopia':6,'Tanzania':6,'Ivory Coast':6,'Senegal':6,'Mozambique':6,'Madagascar':6,'Zimbabwe':6,
};

const INCOME_MAP={
  'United States':0,'Japan':0,'Germany':0,'United Kingdom':0,'France':0,'Italy':0,'Canada':0,'Australia':0,'South Korea':0,
  'Spain':0,'Netherlands':0,'Saudi Arabia':0,'Switzerland':0,'Taiwan':0,'Sweden':0,'Belgium':0,'Norway':0,'Austria':0,
  'Israel':0,'Ireland':0,'Singapore':0,'Denmark':0,'Finland':0,'Portugal':0,'Czech Republic':0,'New Zealand':0,
  'Qatar':0,'Kuwait':0,'Bahrain':0,'Oman':0,'Trinidad & Tobago':0,'Uruguay':0,'Chile':0,
  'China':1,'Mexico':1,'Indonesia':1,'Turkey':1,'Poland':1,'Thailand':1,'Argentina':1,'Malaysia':1,'South Africa':1,
  'Colombia':1,'Romania':1,'Peru':1,'Iraq':1,'Hungary':1,'Brazil':1,'Dominican Republic':1,'Guatemala':1,'Ecuador':1,
  'Costa Rica':1,'Panama':1,'Paraguay':1,'Jamaica':1,'El Salvador':1,
  'India':2,'Philippines':2,'Vietnam':2,'Bangladesh':2,'Egypt':2,'Morocco':2,'Ukraine':2,'Ghana':2,'Sri Lanka':2,
  'Kenya':2,'Ivory Coast':2,'Senegal':2,'Cambodia':2,'Honduras':2,'Myanmar':2,'Nigeria':2,'Pakistan':2,'Nepal':2,
  'Tanzania':3,'Zimbabwe':3,'Mozambique':3,'Madagascar':3,'Ethiopia':3,
};

const RATING_BASE={
  'United States':0,'Germany':0,'Switzerland':0,'Norway':0,'Denmark':0,'Sweden':0,'Netherlands':0,'Singapore':0,'Australia':0,'Canada':0,
  'Austria':1,'Finland':1,'New Zealand':1,
  'United Kingdom':2,'France':2,'Belgium':2,'Ireland':2,'Taiwan':2,
  'South Korea':3,'Israel':3,'Czech Republic':3,
  'Japan':4,'China':4,'Chile':4,'Qatar':4,'Kuwait':4,'Saudi Arabia':4,
  'Spain':5,'Poland':5,'Thailand':5,'Malaysia':5,'Bahrain':5,
  'Italy':6,'Portugal':6,'Mexico':6,'Peru':6,'Indonesia':6,'India':6,'Oman':6,
  'Colombia':7,'Romania':7,'Hungary':7,'Philippines':7,'Uruguay':7,'Morocco':7,
  'Brazil':8,'South Africa':8,'Turkey':8,'Costa Rica':8,'Panama':8,
  'Greece':9,'Vietnam':9,'Dominican Republic':9,'Guatemala':9,
  'Argentina':10,'Bangladesh':10,'Egypt':10,'Kenya':10,'Paraguay':10,
  'Nigeria':11,'Iraq':11,'Ecuador':11,'Jamaica':11,'Honduras':11,'El Salvador':11,
  'Pakistan':12,'Ghana':12,'Sri Lanka':12,'Ukraine':12,
  'Cambodia':13,'Ivory Coast':13,'Senegal':13,'Trinidad & Tobago':7,
  'Ethiopia':14,'Tanzania':14,'Nepal':14,'Myanmar':15,'Mozambique':15,'Madagascar':16,'Zimbabwe':17,
};

const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];

/* ─── Generate 80 Countries ──────────────────────────────────────────────── */

const COUNTRIES = COUNTRY_NAMES.map((name, i) => {
  const s = i * 7 + 3;
  const regionIdx = REGION_MAP[name] ?? (i % 7);
  const incomeIdx = INCOME_MAP[name] ?? (i % 4);
  const ratingIdx = RATING_BASE[name] ?? Math.min(Math.floor(sr(s) * 18), 18);
  const gdp = incomeIdx === 0 ? 500 + sr(s+1) * 20000 : incomeIdx === 1 ? 100 + sr(s+2) * 2000 : incomeIdx === 2 ? 30 + sr(s+3) * 400 : 5 + sr(s+4) * 80;
  const debtGdp = 30 + sr(s+5) * 140;
  const emissionsPC = incomeIdx === 0 ? 5 + sr(s+6) * 15 : incomeIdx === 1 ? 2 + sr(s+7) * 8 : 0.5 + sr(s+8) * 4;
  const ndcTarget = -(20 + Math.floor(sr(s+9) * 50));

  /* Physical risk: 8 hazards */
  const hazardScores = HAZARDS.map((_, hi) => {
    let base = 10 + sr(s + 10 + hi) * 60;
    if (regionIdx === 5 && (hi === 1 || hi === 3 || hi === 7)) base += 20; // South Asia: drought/heat/ag
    if (regionIdx === 0 && (hi === 2 || hi === 4)) base += 15; // EAP: cyclone/SLR
    if (regionIdx === 6 && (hi === 1 || hi === 6)) base += 18; // SSA: drought/water
    if (regionIdx === 3 && (hi === 3 || hi === 6)) base += 22; // MENA: heat/water
    if (regionIdx === 2 && hi === 0) base += 12; // LAC: flood
    return Math.min(Math.round(base), 100);
  });
  const physicalRisk = Math.round(hazardScores.reduce((a, b) => a + b, 0) / HAZARDS.length);

  /* Transition risk */
  const carbonDep = incomeIdx <= 1 && regionIdx === 3 ? 60 + sr(s+20) * 35 : 10 + sr(s+21) * 50;
  const strandedAssets = carbonDep * (0.4 + sr(s+22) * 0.5);
  const policyReadiness = incomeIdx === 0 ? 50 + sr(s+23) * 45 : incomeIdx === 1 ? 30 + sr(s+24) * 40 : 10 + sr(s+25) * 35;
  const transitionRisk = Math.round((carbonDep * 0.4 + strandedAssets * 0.3 + (100 - policyReadiness) * 0.3));

  /* ND-GAIN */
  const ndgainVuln = incomeIdx === 0 ? 20 + sr(s+26) * 20 : incomeIdx === 1 ? 35 + sr(s+27) * 20 : incomeIdx === 2 ? 45 + sr(s+28) * 25 : 55 + sr(s+29) * 30;
  const ndgainReady = incomeIdx === 0 ? 55 + sr(s+30) * 30 : incomeIdx === 1 ? 35 + sr(s+31) * 25 : incomeIdx === 2 ? 20 + sr(s+32) * 25 : 10 + sr(s+33) * 20;

  const compositeRisk = Math.round(physicalRisk * 0.5 + transitionRisk * 0.5);

  /* 12Q trends */
  const qTrend = QUARTERS.map((q, qi) => ({
    q,
    physical: Math.max(5, Math.min(100, physicalRisk + Math.round((sr(s + 40 + qi) - 0.5) * 12 + qi * 0.4))),
    transition: Math.max(5, Math.min(100, transitionRisk + Math.round((sr(s + 55 + qi) - 0.5) * 10 + qi * 0.3))),
    composite: Math.max(5, Math.min(100, compositeRisk + Math.round((sr(s + 70 + qi) - 0.5) * 8 + qi * 0.35))),
  }));

  return {
    id: i, name, region: REGIONS[regionIdx], incomeGroup: INCOME_GROUPS[incomeIdx],
    rating: RATINGS_SCALE[Math.min(ratingIdx, 18)],
    ratingIdx, gdp: Math.round(gdp * 10) / 10, debtGdp: Math.round(debtGdp * 10) / 10,
    emissionsPC: Math.round(emissionsPC * 100) / 100, ndcTarget,
    physicalRisk, transitionRisk, compositeRisk,
    hazardScores, carbonDep: Math.round(carbonDep), strandedAssets: Math.round(strandedAssets),
    policyReadiness: Math.round(policyReadiness),
    ndgainVuln: Math.round(ndgainVuln * 10) / 10, ndgainReady: Math.round(ndgainReady * 10) / 10,
    qTrend,
  };
});

/* ─── Climate-Adjusted Ratings ───────────────────────────────────────────── */

const NGFS_SCENARIOS = [
  { key: 'orderly', label: 'Orderly (Net Zero 2050)', color: T.green },
  { key: 'disorderly', label: 'Disorderly (Delayed)', color: T.amber },
  { key: 'hothouse', label: 'Hot House World', color: T.red },
];

const getClimateNotchImpact = (c, scenario) => {
  const base = scenario === 'orderly' ? 0.3 : scenario === 'disorderly' ? 0.6 : 1.0;
  const physFactor = c.physicalRisk / 100;
  const transFactor = c.transitionRisk / 100;
  const factor = scenario === 'hothouse' ? physFactor * 1.5 + transFactor * 0.5 : physFactor * 0.5 + transFactor * 1.2;
  return Math.round(factor * base * 4 * 10) / 10;
};

/* ─── Sovereign Bond Portfolio (30 holdings) ─────────────────────────────── */

const PORTFOLIO_HOLDINGS = Array.from({ length: 30 }, (_, i) => {
  const s = i * 11 + 500;
  const cIdx = Math.floor(sr(s) * 50); // mostly larger economies
  const country = COUNTRIES[cIdx];
  const weight = 1 + sr(s + 1) * 8;
  const coupon = 0.5 + sr(s + 2) * 6;
  const maturity = 2026 + Math.floor(sr(s + 3) * 25);
  const isGreen = sr(s + 4) > 0.75;
  const yieldVal = coupon + (country.ratingIdx * 0.15) + (sr(s + 5) - 0.5) * 0.8;
  const climateAdjYield = yieldVal + (country.compositeRisk / 100) * 1.5;
  return {
    id: i, country: country.name, countryId: cIdx,
    weight: Math.round(weight * 100) / 100,
    coupon: Math.round(coupon * 100) / 100,
    maturity, isGreen,
    yield: Math.round(yieldVal * 100) / 100,
    climateAdjYield: Math.round(climateAdjYield * 100) / 100,
    rating: country.rating,
    physicalRisk: country.physicalRisk,
    transitionRisk: country.transitionRisk,
    compositeRisk: country.compositeRisk,
  };
});
const totalWeight = PORTFOLIO_HOLDINGS.reduce((a, h) => a + h.weight, 0);
PORTFOLIO_HOLDINGS.forEach(h => { h.weightPct = Math.round(h.weight / totalWeight * 10000) / 100; });

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const sCard = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 };
const sTab = (active) => ({
  padding: '8px 18px', cursor: 'pointer', border: 'none', borderRadius: 6,
  background: active ? T.navy : 'transparent', color: active ? '#fff' : T.textSec,
  fontFamily: T.font, fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
});
const sInput = { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 12, background: T.surface, color: T.text };
const sBtn = (primary) => ({
  padding: '7px 16px', border: primary ? 'none' : `1px solid ${T.border}`, borderRadius: 6,
  background: primary ? T.navy : T.surface, color: primary ? '#fff' : T.text,
  fontFamily: T.font, fontSize: 12, fontWeight: 600, cursor: 'pointer',
});
const sMetric = { fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.navy, lineHeight: 1 };
const sLabel = { fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.6 };
const sBadge = (color) => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
  fontFamily: T.mono, background: color + '18', color,
});

const riskColor = (v) => v >= 70 ? T.red : v >= 45 ? T.amber : T.green;
const ratingColor = (idx) => idx <= 3 ? T.green : idx <= 8 ? T.gold : idx <= 12 ? T.amber : T.red;

/* ─── Tooltip Styles ─────────────────────────────────────────────────────── */

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.navy, color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: 11, fontFamily: T.mono }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.goldL }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TAB 1: Country Risk Dashboard                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CountryRiskDashboard = () => {
  const [regionFilter, setRegionFilter] = useState('All');
  const [incomeFilter, setIncomeFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [riskThreshold, setRiskThreshold] = useState(0);
  const [sortCol, setSortCol] = useState('compositeRisk');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let data = COUNTRIES.filter(c => {
      if (regionFilter !== 'All' && c.region !== regionFilter) return false;
      if (incomeFilter !== 'All' && c.incomeGroup !== incomeFilter) return false;
      if (ratingFilter !== 'All') {
        const g = ratingFilter === 'Investment Grade' ? c.ratingIdx <= 8 : c.ratingIdx > 8;
        if (!g) return false;
      }
      if (c.compositeRisk < riskThreshold) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    data.sort((a, b) => sortDir === 'asc' ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol]);
    return data;
  }, [regionFilter, incomeFilter, ratingFilter, riskThreshold, sortCol, sortDir, search]);

  const top10Vulnerable = useMemo(() => [...COUNTRIES].sort((a, b) => b.compositeRisk - a.compositeRisk).slice(0, 10), []);
  const top10Resilient = useMemo(() => [...COUNTRIES].sort((a, b) => a.compositeRisk - b.compositeRisk).slice(0, 10), []);

  const scatterData = useMemo(() => COUNTRIES.map(c => ({
    name: c.name, x: c.physicalRisk, y: c.transitionRisk, z: Math.max(c.gdp / 50, 5), region: c.region,
  })), []);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const sel = selectedCountry ? COUNTRIES.find(c => c.id === selectedCountry) : null;
  const radarData = sel ? HAZARDS.map((h, i) => ({ hazard: h, score: sel.hazardScores[i] })) : [];

  return (
    <div style={{ display: 'flex', gap: 16, flexDirection: sel ? 'row' : 'column' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Filters */}
        <div style={{ ...sCard, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Search country..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...sInput, width: 180 }} />
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={sInput}>
            <option>All</option>{REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={incomeFilter} onChange={e => setIncomeFilter(e.target.value)} style={sInput}>
            <option>All</option>{INCOME_GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={sInput}>
            <option>All</option><option>Investment Grade</option><option>Sub-Investment Grade</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ ...sLabel, textTransform: 'none' }}>Min Risk:</span>
            <input type="range" min={0} max={80} value={riskThreshold} onChange={e => setRiskThreshold(+e.target.value)} style={{ width: 100 }} />
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy }}>{riskThreshold}</span>
          </div>
          <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginLeft: 'auto' }}>{filtered.length} countries</span>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'AVG PHYSICAL RISK', val: (filtered.reduce((a, c) => a + c.physicalRisk, 0) / (filtered.length || 1)).toFixed(1), color: T.amber },
            { label: 'AVG TRANSITION RISK', val: (filtered.reduce((a, c) => a + c.transitionRisk, 0) / (filtered.length || 1)).toFixed(1), color: T.red },
            { label: 'AVG COMPOSITE RISK', val: (filtered.reduce((a, c) => a + c.compositeRisk, 0) / (filtered.length || 1)).toFixed(1), color: T.navy },
            { label: 'HIGH RISK (>60)', val: filtered.filter(c => c.compositeRisk > 60).length, color: T.red },
          ].map((m, i) => (
            <div key={i} style={{ ...sCard, padding: 14, borderLeft: `3px solid ${m.color}` }}>
              <div style={sLabel}>{m.label}</div>
              <div style={{ ...sMetric, color: m.color, marginTop: 6 }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Country Table */}
        <div style={{ ...sCard, padding: 0, overflow: 'auto', maxHeight: 440 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font, fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH, position: 'sticky', top: 0, zIndex: 2 }}>
                {[
                  { key: 'name', label: 'Country', w: 140 },
                  { key: 'region', label: 'Region', w: 130 },
                  { key: 'incomeGroup', label: 'Income', w: 110 },
                  { key: 'rating', label: 'Rating', w: 60 },
                  { key: 'physicalRisk', label: 'Phys Risk', w: 75 },
                  { key: 'transitionRisk', label: 'Trans Risk', w: 75 },
                  { key: 'compositeRisk', label: 'Composite', w: 75 },
                  { key: 'ndgainVuln', label: 'ND-GAIN Vuln', w: 85 },
                  { key: 'ndgainReady', label: 'ND-GAIN Ready', w: 90 },
                ].map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={{
                    padding: '8px 6px', textAlign: col.key === 'name' ? 'left' : 'right', cursor: 'pointer',
                    fontWeight: 700, color: T.navy, fontSize: 10, fontFamily: T.mono, textTransform: 'uppercase',
                    borderBottom: `2px solid ${T.border}`, width: col.w, whiteSpace: 'nowrap',
                  }}>
                    {col.label} {sortCol === col.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 80).map((c, ri) => (
                <tr key={c.id} onClick={() => setSelectedCountry(c.id === selectedCountry ? null : c.id)}
                  style={{ cursor: 'pointer', background: c.id === selectedCountry ? T.surfaceH : ri % 2 ? T.surface : T.bg + '40', borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '6px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: T.textSec, fontSize: 11 }}>{c.region.split(' ')[0]}</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: T.textSec, fontSize: 11 }}>{c.incomeGroup.split(' ')[0]}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>
                    <span style={sBadge(ratingColor(c.ratingIdx))}>{c.rating}</span>
                  </td>
                  <td style={{ padding: '6px', textAlign: 'right', fontFamily: T.mono, fontWeight: 600, color: riskColor(c.physicalRisk) }}>{c.physicalRisk}</td>
                  <td style={{ padding: '6px', textAlign: 'right', fontFamily: T.mono, fontWeight: 600, color: riskColor(c.transitionRisk) }}>{c.transitionRisk}</td>
                  <td style={{ padding: '6px', textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: riskColor(c.compositeRisk) }}>{c.compositeRisk}</td>
                  <td style={{ padding: '6px', textAlign: 'right', fontFamily: T.mono, color: riskColor(c.ndgainVuln) }}>{c.ndgainVuln}</td>
                  <td style={{ padding: '6px', textAlign: 'right', fontFamily: T.mono, color: riskColor(100 - c.ndgainReady) }}>{c.ndgainReady}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top 10 Vulnerable & Resilient + Scatter */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div style={sCard}>
            <div style={{ ...sLabel, marginBottom: 10 }}>Top 10 Most Vulnerable</div>
            {top10Vulnerable.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: `1px solid ${T.border}22` }}>
                <span style={{ fontSize: 12, color: T.text }}><span style={{ fontFamily: T.mono, color: T.textMut, marginRight: 6 }}>{i + 1}.</span>{c.name}</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.red }}>{c.compositeRisk}</span>
              </div>
            ))}
          </div>
          <div style={sCard}>
            <div style={{ ...sLabel, marginBottom: 10 }}>Top 10 Most Resilient</div>
            {top10Resilient.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: `1px solid ${T.border}22` }}>
                <span style={{ fontSize: 12, color: T.text }}><span style={{ fontFamily: T.mono, color: T.textMut, marginRight: 6 }}>{i + 1}.</span>{c.name}</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.green }}>{c.compositeRisk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scatter Plot */}
        <div style={{ ...sCard, marginTop: 16 }}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Physical vs Transition Risk (sized by GDP)</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" type="number" name="Physical Risk" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: 'Physical Risk', position: 'bottom', fontSize: 10, fontFamily: T.mono }} />
              <YAxis dataKey="y" type="number" name="Transition Risk" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: 'Transition Risk', angle: -90, position: 'insideLeft', fontSize: 10, fontFamily: T.mono }} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={scatterData} fill={T.navyL}>
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={riskColor(Math.max(d.x, d.y))} r={Math.max(3, Math.min(d.z, 18))} fillOpacity={0.65} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side Panel for Selected Country */}
      {sel && (
        <div style={{ width: 380, flexShrink: 0 }}>
          <div style={{ ...sCard, position: 'sticky', top: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{sel.name}</div>
              <button onClick={() => setSelectedCountry(null)} style={{ ...sBtn(false), padding: '2px 10px', fontSize: 11 }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ textAlign: 'center' }}><div style={sLabel}>Rating</div><div style={{ ...sMetric, fontSize: 16, color: ratingColor(sel.ratingIdx) }}>{sel.rating}</div></div>
              <div style={{ textAlign: 'center' }}><div style={sLabel}>GDP ($B)</div><div style={{ ...sMetric, fontSize: 16 }}>{sel.gdp.toFixed(0)}</div></div>
              <div style={{ textAlign: 'center' }}><div style={sLabel}>Debt/GDP</div><div style={{ ...sMetric, fontSize: 16, color: sel.debtGdp > 100 ? T.red : T.navy }}>{sel.debtGdp.toFixed(0)}%</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ background: T.bg, padding: 8, borderRadius: 6, textAlign: 'center' }}><div style={sLabel}>Physical</div><div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: riskColor(sel.physicalRisk) }}>{sel.physicalRisk}</div></div>
              <div style={{ background: T.bg, padding: 8, borderRadius: 6, textAlign: 'center' }}><div style={sLabel}>Transition</div><div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: riskColor(sel.transitionRisk) }}>{sel.transitionRisk}</div></div>
            </div>
            <div style={{ background: T.bg, padding: 8, borderRadius: 6, textAlign: 'center', marginBottom: 14 }}>
              <div style={sLabel}>NDC Target</div><div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 600, color: T.sage }}>{sel.ndcTarget}% by 2030</div>
            </div>

            {/* Hazard Radar */}
            <div style={{ ...sLabel, marginBottom: 6 }}>Hazard Profile (8 Types)</div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="hazard" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar name="Score" dataKey="score" stroke={T.red} fill={T.red} fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>

            {/* Transition Decomposition */}
            <div style={{ ...sLabel, marginBottom: 6, marginTop: 10 }}>Transition Risk Decomposition</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[
                { label: 'Carbon Dep.', val: sel.carbonDep, color: T.red },
                { label: 'Stranded Assets', val: sel.strandedAssets, color: T.amber },
                { label: 'Policy Ready', val: sel.policyReadiness, color: T.green },
              ].map((d, i) => (
                <div key={i} style={{ flex: 1, background: T.bg, padding: 6, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>{d.label}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: d.color }}>{d.val}</div>
                </div>
              ))}
            </div>

            {/* 12Q Trend */}
            <div style={{ ...sLabel, marginBottom: 6 }}>12-Quarter Risk Trend</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={sel.qTrend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="q" tick={{ fontSize: 8, fontFamily: T.mono }} interval={2} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 8, fontFamily: T.mono }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="physical" stroke={T.amber} strokeWidth={2} dot={false} name="Physical" />
                <Line type="monotone" dataKey="transition" stroke={T.red} strokeWidth={2} dot={false} name="Transition" />
                <Line type="monotone" dataKey="composite" stroke={T.navy} strokeWidth={2} dot={false} name="Composite" />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.mono }} />
              </LineChart>
            </ResponsiveContainer>

            {/* ND-GAIN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              <div style={{ background: T.bg, padding: 8, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>ND-GAIN Vulnerability</div>
                <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: riskColor(sel.ndgainVuln) }}>{sel.ndgainVuln}</div>
              </div>
              <div style={{ background: T.bg, padding: 8, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>ND-GAIN Readiness</div>
                <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: riskColor(100 - sel.ndgainReady) }}>{sel.ndgainReady}</div>
              </div>
            </div>

            {/* Credit Outlook */}
            <div style={{ marginTop: 12, background: T.bg, padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>Credit Rating Outlook</div>
              <div style={{ fontSize: 12, color: T.text }}>
                {sel.compositeRisk > 60 ? 'Negative' : sel.compositeRisk > 40 ? 'Stable' : 'Positive'} outlook.
                Climate-adjusted notch impact: <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.red }}>
                  -{getClimateNotchImpact(sel, 'orderly').toFixed(1)}
                </span> (orderly) to <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.red }}>
                  -{getClimateNotchImpact(sel, 'hothouse').toFixed(1)}
                </span> (hothouse)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TAB 2: Credit Rating Impact                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const CreditRatingImpact = () => {
  const [scenario, setScenario] = useState('orderly');
  const [carbonPrice, setCarbonPrice] = useState(100);
  const [sortCol, setSortCol] = useState('notchImpact');
  const [sortDir, setSortDir] = useState('desc');

  const adjusted = useMemo(() => COUNTRIES.map(c => {
    const notch = getClimateNotchImpact(c, scenario);
    const carbonAdj = (carbonPrice / 100) * (c.carbonDep / 100) * 2;
    const totalNotch = Math.round((notch + carbonAdj) * 10) / 10;
    const adjRatingIdx = Math.min(Math.round(c.ratingIdx + totalNotch), 18);
    return {
      ...c, notchImpact: totalNotch, adjRating: RATINGS_SCALE[adjRatingIdx], adjRatingIdx,
      downgraded: adjRatingIdx > c.ratingIdx,
      notchDiff: adjRatingIdx - c.ratingIdx,
      spreadImpact: Math.round(totalNotch * 25),
    };
  }).sort((a, b) => sortDir === 'asc' ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol]), [scenario, carbonPrice, sortCol, sortDir]);

  const downgradedCount = adjusted.filter(c => c.downgraded).length;
  const avgNotch = (adjusted.reduce((a, c) => a + c.notchImpact, 0) / adjusted.length).toFixed(2);
  const fallenAngels = adjusted.filter(c => c.ratingIdx <= 8 && c.adjRatingIdx > 8).length;

  /* Notch impact by hazard */
  const hazardImpact = HAZARDS.map((h, hi) => ({
    hazard: h,
    orderly: Math.round(COUNTRIES.reduce((a, c) => a + c.hazardScores[hi] * 0.01, 0) / COUNTRIES.length * 100) / 100,
    disorderly: Math.round(COUNTRIES.reduce((a, c) => a + c.hazardScores[hi] * 0.018, 0) / COUNTRIES.length * 100) / 100,
    hothouse: Math.round(COUNTRIES.reduce((a, c) => a + c.hazardScores[hi] * 0.03, 0) / COUNTRIES.length * 100) / 100,
  }));

  /* Migration matrix */
  const migrationBuckets = ['AAA/AA','A','BBB','BB','B','CCC-'];
  const getBucket = (idx) => idx <= 3 ? 0 : idx <= 5 ? 1 : idx <= 8 ? 2 : idx <= 11 ? 3 : idx <= 14 ? 4 : 5;
  const matrix = migrationBuckets.map((_, fromB) => {
    const row = { from: migrationBuckets[fromB] };
    const inBucket = adjusted.filter(c => getBucket(c.ratingIdx) === fromB);
    migrationBuckets.forEach((_, toB) => {
      const count = inBucket.filter(c => getBucket(c.adjRatingIdx) === toB).length;
      row[`to_${toB}`] = inBucket.length ? Math.round(count / inBucket.length * 100) : 0;
    });
    return row;
  });

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  return (
    <div>
      {/* Controls */}
      <div style={{ ...sCard, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {NGFS_SCENARIOS.map(sc => (
            <button key={sc.key} onClick={() => setScenario(sc.key)}
              style={{ ...sTab(scenario === sc.key), background: scenario === sc.key ? sc.color : 'transparent', fontSize: 11 }}>
              {sc.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <span style={{ ...sLabel, textTransform: 'none' }}>Carbon Price ($/t):</span>
          <input type="range" min={10} max={400} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 160 }} />
          <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.navy }}>${carbonPrice}</span>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'DOWNGRADED', val: downgradedCount, color: T.red },
          { label: 'AVG NOTCH IMPACT', val: avgNotch, color: T.amber },
          { label: 'FALLEN ANGELS', val: fallenAngels, color: T.red },
          { label: 'AVG SPREAD IMPACT', val: `+${Math.round(adjusted.reduce((a, c) => a + c.spreadImpact, 0) / adjusted.length)} bp`, color: T.navy },
        ].map((m, i) => (
          <div key={i} style={{ ...sCard, padding: 14, borderLeft: `3px solid ${m.color}` }}>
            <div style={sLabel}>{m.label}</div>
            <div style={{ ...sMetric, color: m.color, marginTop: 6 }}>{m.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Notch impact by hazard */}
        <div style={sCard}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Average Notch Impact by Hazard Type</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hazardImpact} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <YAxis dataKey="hazard" type="category" tick={{ fontSize: 10, fontFamily: T.mono }} width={75} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orderly" fill={T.green} name="Orderly" barSize={8} />
              <Bar dataKey="disorderly" fill={T.amber} name="Disorderly" barSize={8} />
              <Bar dataKey="hothouse" fill={T.red} name="Hothouse" barSize={8} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.mono }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Migration Matrix */}
        <div style={sCard}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Rating Migration Probability Matrix ({NGFS_SCENARIOS.find(s => s.key === scenario)?.label})</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.mono }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                <th style={{ padding: 4, textAlign: 'left', color: T.textMut, fontSize: 9 }}>From \\ To</th>
                {migrationBuckets.map(b => <th key={b} style={{ padding: 4, textAlign: 'center', color: T.navy, fontSize: 9 }}>{b}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: 4, fontWeight: 600, color: T.navy, fontSize: 10 }}>{row.from}</td>
                  {migrationBuckets.map((_, ci) => {
                    const val = row[`to_${ci}`];
                    const isDiag = ri === ci;
                    return (
                      <td key={ci} style={{
                        padding: 4, textAlign: 'center', fontWeight: isDiag ? 700 : 400,
                        background: isDiag ? T.surfaceH : val > 20 && ci > ri ? T.red + '15' : 'transparent',
                        color: ci > ri && val > 0 ? T.red : ci < ri && val > 0 ? T.green : T.text,
                      }}>{val}%</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sovereign Spread Sensitivity */}
      <div style={{ ...sCard, marginBottom: 16 }}>
        <div style={{ ...sLabel, marginBottom: 10 }}>Sovereign Spread Sensitivity to Climate Risk (Top 30)</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={adjusted.slice(0, 30)} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 8, fontFamily: T.mono, angle: -45, textAnchor: 'end' }} interval={0} height={60} />
            <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: 'bp impact', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="spreadImpact" name="Spread Impact (bp)">
              {adjusted.slice(0, 30).map((c, i) => (
                <Cell key={i} fill={c.spreadImpact > 50 ? T.red : c.spreadImpact > 25 ? T.amber : T.green} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Adjusted Rating Table */}
      <div style={{ ...sCard, padding: 0, overflow: 'auto', maxHeight: 400 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font, fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH, position: 'sticky', top: 0, zIndex: 2 }}>
              {[
                { key: 'name', label: 'Country' }, { key: 'rating', label: 'Current' },
                { key: 'adjRating', label: 'Adjusted' }, { key: 'notchImpact', label: 'Notch Impact' },
                { key: 'notchDiff', label: 'Notches Down' }, { key: 'spreadImpact', label: 'Spread (bp)' },
                { key: 'carbonDep', label: 'Carbon Dep.' }, { key: 'compositeRisk', label: 'Climate Risk' },
              ].map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{
                  padding: '8px 6px', textAlign: col.key === 'name' ? 'left' : 'center', cursor: 'pointer',
                  fontWeight: 700, color: T.navy, fontSize: 10, fontFamily: T.mono, textTransform: 'uppercase',
                  borderBottom: `2px solid ${T.border}`,
                }}>
                  {col.label} {sortCol === col.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adjusted.slice(0, 60).map((c, ri) => (
              <tr key={c.id} style={{ background: ri % 2 ? T.surface : T.bg + '40', borderBottom: `1px solid ${T.border}22` }}>
                <td style={{ padding: '5px 6px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                <td style={{ padding: '5px 6px', textAlign: 'center' }}><span style={sBadge(ratingColor(c.ratingIdx))}>{c.rating}</span></td>
                <td style={{ padding: '5px 6px', textAlign: 'center' }}><span style={sBadge(ratingColor(c.adjRatingIdx))}>{c.adjRating}</span></td>
                <td style={{ padding: '5px 6px', textAlign: 'center', fontFamily: T.mono, fontWeight: 600, color: c.notchImpact > 1 ? T.red : T.amber }}>{c.notchImpact.toFixed(1)}</td>
                <td style={{ padding: '5px 6px', textAlign: 'center', fontFamily: T.mono, color: c.notchDiff > 0 ? T.red : T.green }}>{c.notchDiff > 0 ? `-${c.notchDiff}` : '0'}</td>
                <td style={{ padding: '5px 6px', textAlign: 'center', fontFamily: T.mono, color: T.textSec }}>+{c.spreadImpact}</td>
                <td style={{ padding: '5px 6px', textAlign: 'center', fontFamily: T.mono }}>{c.carbonDep}</td>
                <td style={{ padding: '5px 6px', textAlign: 'center', fontFamily: T.mono, color: riskColor(c.compositeRisk) }}>{c.compositeRisk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TAB 3: Physical Risk Deep Dive                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PhysicalRiskDeepDive = () => {
  const [rcpToggle, setRcpToggle] = useState('rcp85');
  const [timeHorizon, setTimeHorizon] = useState(2050);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [selectedCountryPhy, setSelectedCountryPhy] = useState(null);

  const rcpMult = rcpToggle === 'rcp45' ? 0.7 : 1.0;
  const timeMult = timeHorizon === 2030 ? 0.6 : timeHorizon === 2040 ? 0.8 : 1.0;

  const heatmapData = useMemo(() => COUNTRIES.slice(0, 40).map(c => ({
    name: c.name,
    scores: HAZARDS.map((_, hi) => Math.round(Math.min(100, c.hazardScores[hi] * rcpMult * timeMult))),
  })), [rcpMult, timeMult]);

  const coastalGdp = useMemo(() => COUNTRIES.map(c => ({
    name: c.name,
    coastalPct: Math.round(c.hazardScores[4] * (0.3 + sr(c.id * 3 + 100) * 0.5) * rcpMult * timeMult * 10) / 10,
    gdp: c.gdp,
  })).sort((a, b) => b.coastalPct - a.coastalPct).slice(0, 20), [rcpMult, timeMult]);

  const hazardFrequency = useMemo(() => QUARTERS.map((q, qi) => {
    const row = { quarter: q };
    [0, 1, 2].forEach(hi => {
      row[HAZARDS[hi]] = Math.round(5 + sr(qi * 3 + hi + 200) * 30 + qi * 1.5);
    });
    return row;
  }), []);

  const agImpact = useMemo(() => COUNTRIES.filter(c => c.hazardScores[7] > 40).sort((a, b) => b.hazardScores[7] - a.hazardScores[7]).slice(0, 15).map(c => ({
    name: c.name,
    agLoss: Math.round(c.hazardScores[7] * rcpMult * timeMult * 0.3 * 10) / 10,
    waterStress: Math.round(c.hazardScores[6] * rcpMult * timeMult * 10) / 10,
  })), [rcpMult, timeMult]);

  const selPhy = selectedCountryPhy !== null ? COUNTRIES[selectedCountryPhy] : null;

  return (
    <div>
      {/* Controls */}
      <div style={{ ...sCard, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setRcpToggle('rcp45')} style={{ ...sTab(rcpToggle === 'rcp45'), background: rcpToggle === 'rcp45' ? T.sage : 'transparent' }}>RCP 4.5</button>
          <button onClick={() => setRcpToggle('rcp85')} style={{ ...sTab(rcpToggle === 'rcp85'), background: rcpToggle === 'rcp85' ? T.red : 'transparent' }}>RCP 8.5</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...sLabel, textTransform: 'none' }}>Time Horizon:</span>
          {[2030, 2040, 2050].map(y => (
            <button key={y} onClick={() => setTimeHorizon(y)} style={sTab(timeHorizon === y)}>{y}</button>
          ))}
        </div>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginLeft: 'auto' }}>
          {rcpToggle === 'rcp45' ? '+1.8\u00B0C' : '+3.2\u00B0C'} by {timeHorizon}
        </span>
      </div>

      {/* Heatmap */}
      <div style={{ ...sCard, marginBottom: 16, overflow: 'auto' }}>
        <div style={{ ...sLabel, marginBottom: 10 }}>Physical Risk Heatmap: 8 Hazards x 40 Countries ({rcpToggle.toUpperCase()} / {timeHorizon})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: T.mono }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 8px', textAlign: 'left', fontSize: 9, color: T.navy, borderBottom: `2px solid ${T.border}`, position: 'sticky', left: 0, background: T.surface, zIndex: 1 }}>Country</th>
                {HAZARDS.map(h => (
                  <th key={h} onClick={() => setSelectedHazard(h === selectedHazard ? null : h)}
                    style={{ padding: '4px 6px', textAlign: 'center', fontSize: 8, color: h === selectedHazard ? T.gold : T.navy, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row, ri) => (
                <tr key={ri} onClick={() => setSelectedCountryPhy(ri === selectedCountryPhy ? null : ri)} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '3px 8px', fontWeight: 600, color: T.text, borderBottom: `1px solid ${T.border}22`, position: 'sticky', left: 0, background: ri % 2 ? T.surface : T.bg + '60', zIndex: 1, fontSize: 10 }}>
                    {row.name}
                  </td>
                  {row.scores.map((score, si) => {
                    const bg = score >= 70 ? `rgba(220,38,38,${score / 140})` : score >= 45 ? `rgba(217,119,6,${score / 140})` : `rgba(22,163,74,${score / 200})`;
                    return (
                      <td key={si} style={{ padding: '3px 6px', textAlign: 'center', background: bg, color: score >= 60 ? '#fff' : T.text, borderBottom: `1px solid ${T.border}22`, fontWeight: score >= 70 ? 700 : 400 }}>
                        {score}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Sea Level Rise */}
        <div style={sCard}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Sea Level Rise: Coastal GDP Exposure (%)</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={coastalGdp.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontFamily: T.mono }} width={95} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="coastalPct" name="Coastal GDP %">
                {coastalGdp.slice(0, 15).map((d, i) => (
                  <Cell key={i} fill={d.coastalPct > 15 ? T.red : d.coastalPct > 8 ? T.amber : T.sage} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hazard Frequency Trends */}
        <div style={sCard}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Flood / Drought / Cyclone Frequency Trends (Global Index)</div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={hazardFrequency} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="quarter" tick={{ fontSize: 10, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Flood" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="Drought" stroke={T.amber} fill={T.amber} fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="Cyclone" stroke={T.red} fill={T.red} fillOpacity={0.2} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.mono }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Agricultural Impact */}
        <div style={sCard}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Agricultural Productivity Loss (% GDP, Top 15)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agImpact} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 8, fontFamily: T.mono, angle: -45, textAnchor: 'end' }} interval={0} height={50} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="agLoss" name="Ag Loss %" fill={T.amber}>
                {agImpact.map((d, i) => <Cell key={i} fill={d.agLoss > 5 ? T.red : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Water Stress */}
        <div style={sCard}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Water Stress Projections (Top 15)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agImpact} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 8, fontFamily: T.mono, angle: -45, textAnchor: 'end' }} interval={0} height={50} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.mono }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="waterStress" name="Water Stress Score" fill="#3b82f6">
                {agImpact.map((d, i) => <Cell key={i} fill={d.waterStress > 50 ? T.red : d.waterStress > 30 ? T.amber : '#3b82f6'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected Country Detail Panel */}
      {selPhy && (
        <div style={{ ...sCard, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{selPhy.name} -- Detailed Hazard Profile</div>
            <button onClick={() => setSelectedCountryPhy(null)} style={{ ...sBtn(false), fontSize: 11 }}>Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={HAZARDS.map((h, hi) => ({ hazard: h, rcp45: Math.round(selPhy.hazardScores[hi] * 0.7 * timeMult), rcp85: Math.round(selPhy.hazardScores[hi] * timeMult) }))} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="hazard" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="RCP 4.5" dataKey="rcp45" stroke={T.sage} fill={T.sage} fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="RCP 8.5" dataKey="rcp85" stroke={T.red} fill={T.red} fillOpacity={0.2} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.mono }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ ...sLabel, marginBottom: 8 }}>Historical Loss Data (Last 12 Quarters)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={selPhy.qTrend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="q" tick={{ fontSize: 8, fontFamily: T.mono }} interval={2} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 8, fontFamily: T.mono }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="physical" stroke={T.red} strokeWidth={2} dot={false} name="Physical Risk" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
                {[
                  { label: 'Emissions/Cap', val: `${selPhy.emissionsPC} tCO2` },
                  { label: 'Region', val: selPhy.region.split(' ')[0] },
                  { label: 'ND-GAIN Vuln', val: selPhy.ndgainVuln },
                  { label: 'NDC Target', val: `${selPhy.ndcTarget}%` },
                ].map((d, i) => (
                  <div key={i} style={{ background: T.bg, padding: 6, borderRadius: 4, textAlign: 'center' }}>
                    <div style={{ fontSize: 8, color: T.textMut, fontFamily: T.mono }}>{d.label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: T.navy }}>{d.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TAB 4: Portfolio Sovereign Exposure                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PortfolioSovereignExposure = () => {
  const [sortCol, setSortCol] = useState('weightPct');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => [...PORTFOLIO_HOLDINGS].sort((a, b) => sortDir === 'asc' ? (a[sortCol] > b[sortCol] ? 1 : -1) : (b[sortCol] > a[sortCol] ? 1 : -1)), [sortCol, sortDir]);

  const totalGreen = PORTFOLIO_HOLDINGS.filter(h => h.isGreen).reduce((a, h) => a + h.weightPct, 0);
  const avgYield = (PORTFOLIO_HOLDINGS.reduce((a, h) => a + h.yield * h.weightPct, 0) / 100).toFixed(2);
  const avgClimateYield = (PORTFOLIO_HOLDINGS.reduce((a, h) => a + h.climateAdjYield * h.weightPct, 0) / 100).toFixed(2);
  const weightedRisk = (PORTFOLIO_HOLDINGS.reduce((a, h) => a + h.compositeRisk * h.weightPct, 0) / 100).toFixed(1);

  /* Region allocation */
  const regionAlloc = useMemo(() => {
    const map = {};
    PORTFOLIO_HOLDINGS.forEach(h => {
      const c = COUNTRIES[h.countryId];
      if (!map[c.region]) map[c.region] = { region: c.region, weight: 0, risk: 0, count: 0 };
      map[c.region].weight += h.weightPct;
      map[c.region].risk += h.compositeRisk;
      map[c.region].count++;
    });
    return Object.values(map).map(r => ({ ...r, avgRisk: Math.round(r.risk / r.count), weight: Math.round(r.weight * 10) / 10 })).sort((a, b) => b.weight - a.weight);
  }, []);

  /* Risk vs Weight scatter */
  const riskWeightData = PORTFOLIO_HOLDINGS.map(h => ({
    name: h.country, x: h.compositeRisk, y: h.weightPct, z: h.climateAdjYield,
  }));

  /* Diversification */
  const hhi = Math.round(PORTFOLIO_HOLDINGS.reduce((a, h) => a + (h.weightPct / 100) ** 2, 0) * 10000);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const exportCSV = useCallback(() => {
    const headers = ['Country', 'Weight%', 'Rating', 'Coupon', 'Maturity', 'Yield', 'Climate-Adj Yield', 'Physical Risk', 'Transition Risk', 'Composite Risk', 'Green Bond'];
    const rows = PORTFOLIO_HOLDINGS.map(h => [h.country, h.weightPct, h.rating, h.coupon, h.maturity, h.yield, h.climateAdjYield, h.physicalRisk, h.transitionRisk, h.compositeRisk, h.isGreen ? 'Yes' : 'No']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sovereign_risk_report.csv'; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const REGION_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#3b82f6', '#8b5cf6'];

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'HOLDINGS', val: PORTFOLIO_HOLDINGS.length, color: T.navy },
          { label: 'AVG YIELD', val: `${avgYield}%`, color: T.gold },
          { label: 'CLIMATE-ADJ YIELD', val: `${avgClimateYield}%`, color: T.amber },
          { label: 'WEIGHTED RISK', val: weightedRisk, color: riskColor(+weightedRisk) },
          { label: 'GREEN BOND ALLOC', val: `${totalGreen.toFixed(1)}%`, color: T.green },
        ].map((m, i) => (
          <div key={i} style={{ ...sCard, padding: 14, borderLeft: `3px solid ${m.color}` }}>
            <div style={sLabel}>{m.label}</div>
            <div style={{ ...sMetric, color: m.color, marginTop: 6 }}>{m.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Region Allocation Pie */}
        <div style={sCard}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Portfolio Allocation by Region</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={regionAlloc} dataKey="weight" nameKey="region" cx="50%" cy="50%" outerRadius={100} label={({ region, weight }) => `${region.split(' ')[0]} ${weight}%`} labelLine={{ stroke: T.border }} style={{ fontSize: 10, fontFamily: T.mono }}>
                {regionAlloc.map((_, i) => <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Country Allocation vs Climate Risk */}
        <div style={sCard}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Weight vs Climate Risk (Bubble = Yield)</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" type="number" name="Climate Risk" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: 'Composite Risk', position: 'bottom', fontSize: 10, fontFamily: T.mono }} />
              <YAxis dataKey="y" type="number" name="Weight %" tick={{ fontSize: 10, fontFamily: T.mono }} label={{ value: 'Weight %', angle: -90, position: 'insideLeft', fontSize: 10, fontFamily: T.mono }} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={riskWeightData} fill={T.navyL}>
                {riskWeightData.map((d, i) => <Cell key={i} fill={riskColor(d.x)} r={Math.max(4, d.z * 2)} fillOpacity={0.7} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Diversification */}
        <div style={sCard}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Diversification Analysis</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: T.bg, padding: 12, borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>HHI Concentration</div>
              <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: hhi > 1000 ? T.red : hhi > 500 ? T.amber : T.green }}>{hhi}</div>
              <div style={{ fontSize: 10, color: T.textMut }}>{hhi > 1000 ? 'Concentrated' : hhi > 500 ? 'Moderate' : 'Diversified'}</div>
            </div>
            <div style={{ background: T.bg, padding: 12, borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>Unique Countries</div>
              <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.navy }}>{new Set(PORTFOLIO_HOLDINGS.map(h => h.country)).size}</div>
            </div>
            <div style={{ background: T.bg, padding: 12, borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>IG Allocation</div>
              <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.green }}>
                {PORTFOLIO_HOLDINGS.filter(h => COUNTRIES[h.countryId].ratingIdx <= 8).reduce((a, h) => a + h.weightPct, 0).toFixed(1)}%
              </div>
            </div>
            <div style={{ background: T.bg, padding: 12, borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>Yield Pickup (Climate)</div>
              <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.amber }}>{(avgClimateYield - avgYield).toFixed(0)} bp</div>
            </div>
          </div>
          {/* Region risk breakdown */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, marginBottom: 6 }}>Region Risk Breakdown</div>
            {regionAlloc.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: `1px solid ${T.border}22` }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: REGION_COLORS[i % REGION_COLORS.length] }} />
                <span style={{ fontSize: 11, color: T.text, flex: 1 }}>{r.region}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{r.weight}%</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: riskColor(r.avgRisk) }}>{r.avgRisk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Green Sovereign Bonds */}
        <div style={sCard}>
          <div style={{ ...sLabel, marginBottom: 10 }}>Green Sovereign Bond Allocation</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={[
                { name: 'Green', value: Math.round(totalGreen * 10) / 10 },
                { name: 'Conventional', value: Math.round((100 - totalGreen) * 10) / 10 },
              ]} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}%`} labelLine={{ stroke: T.border }} style={{ fontSize: 10, fontFamily: T.mono }}>
                <Cell fill={T.green} />
                <Cell fill={T.border} />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, marginBottom: 6 }}>Green Bond Holdings</div>
            {PORTFOLIO_HOLDINGS.filter(h => h.isGreen).map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.border}22`, fontSize: 11 }}>
                <span style={{ color: T.text }}>{h.country}</span>
                <span style={{ fontFamily: T.mono, color: T.green, fontWeight: 600 }}>{h.weightPct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export */}
      <div style={{ ...sCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>Export Sovereign Risk Report</div>
          <div style={{ fontSize: 11, color: T.textMut }}>Download full portfolio analysis with climate-adjusted metrics as CSV</div>
        </div>
        <button onClick={exportCSV} style={sBtn(true)}>Export CSV</button>
      </div>

      {/* Holdings Table */}
      <div style={{ ...sCard, padding: 0, overflow: 'auto', maxHeight: 420 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font, fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH, position: 'sticky', top: 0, zIndex: 2 }}>
              {[
                { key: 'country', label: 'Country' }, { key: 'weightPct', label: 'Weight %' },
                { key: 'rating', label: 'Rating' }, { key: 'coupon', label: 'Coupon' },
                { key: 'maturity', label: 'Maturity' }, { key: 'yield', label: 'Yield' },
                { key: 'climateAdjYield', label: 'Clim-Adj Yield' },
                { key: 'physicalRisk', label: 'Phys Risk' }, { key: 'transitionRisk', label: 'Trans Risk' },
                { key: 'compositeRisk', label: 'Composite' }, { key: 'isGreen', label: 'Green' },
              ].map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{
                  padding: '8px 5px', textAlign: col.key === 'country' ? 'left' : 'center', cursor: 'pointer',
                  fontWeight: 700, color: T.navy, fontSize: 9, fontFamily: T.mono, textTransform: 'uppercase',
                  borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap',
                }}>
                  {col.label} {sortCol === col.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((h, ri) => (
              <tr key={h.id} style={{ background: ri % 2 ? T.surface : T.bg + '40', borderBottom: `1px solid ${T.border}22` }}>
                <td style={{ padding: '5px', fontWeight: 600, color: T.navy }}>{h.country}</td>
                <td style={{ padding: '5px', textAlign: 'center', fontFamily: T.mono, fontWeight: 600 }}>{h.weightPct}%</td>
                <td style={{ padding: '5px', textAlign: 'center' }}><span style={sBadge(ratingColor(COUNTRIES[h.countryId].ratingIdx))}>{h.rating}</span></td>
                <td style={{ padding: '5px', textAlign: 'center', fontFamily: T.mono }}>{h.coupon}%</td>
                <td style={{ padding: '5px', textAlign: 'center', fontFamily: T.mono, color: T.textSec }}>{h.maturity}</td>
                <td style={{ padding: '5px', textAlign: 'center', fontFamily: T.mono }}>{h.yield}%</td>
                <td style={{ padding: '5px', textAlign: 'center', fontFamily: T.mono, fontWeight: 600, color: T.amber }}>{h.climateAdjYield}%</td>
                <td style={{ padding: '5px', textAlign: 'center', fontFamily: T.mono, color: riskColor(h.physicalRisk) }}>{h.physicalRisk}</td>
                <td style={{ padding: '5px', textAlign: 'center', fontFamily: T.mono, color: riskColor(h.transitionRisk) }}>{h.transitionRisk}</td>
                <td style={{ padding: '5px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: riskColor(h.compositeRisk) }}>{h.compositeRisk}</td>
                <td style={{ padding: '5px', textAlign: 'center' }}>
                  {h.isGreen ? <span style={sBadge(T.green)}>Green</span> : <span style={{ fontSize: 10, color: T.textMut }}>--</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN EXPORT                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const TABS = [
  { key: 'dashboard', label: 'Country Risk Dashboard' },
  { key: 'credit', label: 'Credit Rating Impact' },
  { key: 'physical', label: 'Physical Risk Deep Dive' },
  { key: 'portfolio', label: 'Portfolio Sovereign Exposure' },
];

export default function SovereignClimateRiskPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              EP-AQ1 // Sovereign Climate Risk
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: T.navy, margin: 0 }}>
              Sovereign Climate Risk Assessment
            </h1>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
              Country-level physical & transition climate risk for sovereign bond portfolios
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={sBadge(T.navy)}>80 Countries</span>
            <span style={sBadge(T.sage)}>8 Hazards</span>
            <span style={sBadge(T.gold)}>12Q Data</span>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 24px', display: 'flex', gap: 4 }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px', cursor: 'pointer', border: 'none', background: 'transparent',
              fontFamily: T.font, fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? T.navy : T.textMut,
              borderBottom: activeTab === tab.key ? `2px solid ${T.gold}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {activeTab === 'dashboard' && <CountryRiskDashboard />}
        {activeTab === 'credit' && <CreditRatingImpact />}
        {activeTab === 'physical' && <PhysicalRiskDeepDive />}
        {activeTab === 'portfolio' && <PortfolioSovereignExposure />}
      </div>

      {/* Footer */}
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: '10px 24px', display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 10, color: T.textMut }}>
        <span>Sovereign Climate Risk Assessment v1.0</span>
        <span>ND-GAIN Index | NGFS Scenarios | RCP 4.5 / 8.5 | 80 Countries | 12 Quarters</span>
        <span>Updated: {new Date().toISOString().slice(0, 10)}</span>
      </div>
    </div>
  );
}
