import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, LineChart, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const BOND_TYPES = ['Green','Social','Sustainability','SLB','Blue','Transition'];
const ICMA_CATEGORIES = ['Renewable Energy','Energy Efficiency','Clean Transport','Water Management','Biodiversity','Affordable Housing','Social Infrastructure','Employment','Food Security','Sustainable Mgmt'];
const VERIFIERS = ['Sustainalytics','ISS ESG','Vigeo Eiris','DNV','Bureau Veritas','S&P','Moody\'s'];
const REPORTING_STATUSES = ['Reported','Pending','Missing'];
const GB_SECTORS = ['Government','Financials','Utilities','Industrials','Real Estate','Transport','Technology','Healthcare'];
const COUNTRIES_GB = ['US','UK','DE','FR','JP','CN','CA','AU','NL','SE','BR','SG'];

import { isIndiaMode, getIndiaGreenBonds } from '../../../data/IndiaDataAdapter';

const _DEFAULT_BONDS = Array.from({ length: 100 }, (_, i) => {
  const type = BOND_TYPES[Math.floor(sr(i * 7 + 1) * BOND_TYPES.length)];
  const nominal = sr(i * 11 + 2) * 500 + 50;
  const coupon = sr(i * 13 + 3) * 0.06 + 0.005;
  const ytm = coupon + (sr(i * 17 + 4) * 0.01 - 0.005);
  const greenium = sr(i * 19 + 5) * 0.0025 - 0.005;
  const dur = sr(i * 23 + 6) * 12 + 1;
  const impactPerM = type === 'Green' ? sr(i * 29 + 7) * 8 + 0.5 : type === 'Social' ? sr(i * 31 + 8) * 2000 + 100 : sr(i * 37 + 9) * 5 + 0.2;
  const sec = GB_SECTORS[Math.floor(sr(i * 41 + 10) * GB_SECTORS.length)];
  const verifier = VERIFIERS[Math.floor(sr(i * 43 + 11) * VERIFIERS.length)];
  const reporting = REPORTING_STATUSES[Math.floor(sr(i * 47 + 12) * 3)];
  return {
    id: i,
    name: `${type.substring(0, 2).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
    issuer: `Issuer-${String(Math.floor(sr(i * 53 + 13) * 50) + 1).padStart(2, '0')}`,
    type,
    icmaCategory: ICMA_CATEGORIES[Math.floor(sr(i * 59 + 14) * ICMA_CATEGORIES.length)],
    issuerSector: sec,
    country: COUNTRIES_GB[Math.floor(sr(i * 61 + 15) * COUNTRIES_GB.length)],
    nominal,
    coupon: +(coupon * 100).toFixed(3),
    yieldToMaturity: +(ytm * 100).toFixed(3),
    duration: +dur.toFixed(2),
    greenium: +(greenium * 100).toFixed(4),
    impactPerM,
    esgRating: ['AAA','AA','A','BBB','BB'][Math.floor(sr(i * 67 + 16) * 5)],
    taxonomyAligned: sr(i * 71 + 17) > 0.4,
    secondPartyOpinion: sr(i * 73 + 18) > 0.15,
    verifier,
    issuanceDate: `20${20 + Math.floor(sr(i * 79 + 19) * 5)}-${String(Math.floor(sr(i * 83 + 20) * 12) + 1).padStart(2, '0')}-01`,
    maturity: `20${30 + Math.floor(sr(i * 89 + 21) * 10)}-${String(Math.floor(sr(i * 97 + 22) * 12) + 1).padStart(2, '0')}-01`,
    reportingStatus: reporting,
    dnshCompliant: sr(i * 101 + 23) > 0.25,
    blendedImpact: sr(i * 103 + 24) * 80 + 20,
  };
});
// ── India Dataset Integration ──
const BONDS = isIndiaMode() ? (getIndiaGreenBonds() || _DEFAULT_BONDS) : _DEFAULT_BONDS;

const totalNominal = BONDS.reduce((s, b) => s + b.nominal, 0);
const BONDS_N = BONDS.map(b => ({ ...b, aumWeight: b.nominal / totalNominal }));

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['Portfolio Dashboard','Bond Universe','Greenium Analysis','Impact Analytics','Regulatory & Taxonomy','Reporting Monitor','Summary & Export'];

export default function GreenBondPortfolioAnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [greeniumMin, setGreeniumMin] = useState(-0.3);
  const [greeniumMax, setGreeniumMax] = useState(0.05);
  const [durMin, setDurMin] = useState(0);
  const [durMax, setDurMax] = useState(15);
  const [dnshFilter, setDnshFilter] = useState(false);
  const [reportingFilter, setReportingFilter] = useState('All');
  const [verifierFilter, setVerifierFilter] = useState('All');
  const [taxonomyFilter, setTaxonomyFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  const filtered = useMemo(() => {
    return BONDS_N.filter(b =>
      (typeFilter === 'All' || b.type === typeFilter) &&
      (sectorFilter === 'All' || b.issuerSector === sectorFilter) &&
      (countryFilter === 'All' || b.country === countryFilter) &&
      b.greenium >= greeniumMin && b.greenium <= greeniumMax &&
      b.duration >= durMin && b.duration <= durMax &&
      (!dnshFilter || b.dnshCompliant) &&
      (reportingFilter === 'All' || b.reportingStatus === reportingFilter) &&
      (verifierFilter === 'All' || b.verifier === verifierFilter) &&
      (!taxonomyFilter || b.taxonomyAligned) &&
      (search === '' || b.name.toLowerCase().includes(search.toLowerCase()) || b.issuer.toLowerCase().includes(search.toLowerCase()))
    );
  }, [typeFilter, sectorFilter, countryFilter, greeniumMin, greeniumMax, durMin, durMax, dnshFilter, reportingFilter, verifierFilter, taxonomyFilter, search]);

  const filteredNominal = useMemo(() => filtered.reduce((s, b) => s + b.nominal, 0), [filtered]);
  const portfolioGreenium = useMemo(() => {
    if (!filtered.length) return 0;
    const totN = filtered.reduce((s, b) => s + b.nominal, 0);
    return totN > 0 ? filtered.reduce((s, b) => s + (b.nominal / totN) * b.greenium, 0) : 0;
  }, [filtered]);
  const avgImpact = useMemo(() => filtered.length ? filtered.reduce((s, b) => s + b.aumWeight * b.blendedImpact, 0) / (filtered.reduce((s, b) => s + b.aumWeight, 0) || 1) : 0, [filtered]);
  const reportingCoverage = useMemo(() => filtered.length ? filtered.filter(b => b.reportingStatus === 'Reported').length / filtered.length * 100 : 0, [filtered]);

  const typeSplit = useMemo(() => {
    const map = {};
    filtered.forEach(b => { map[b.type] = (map[b.type] || 0) + b.nominal; });
    return Object.entries(map).map(([type, aum]) => ({ type, aum: +aum.toFixed(1), pct: +(aum / (filteredNominal || 1) * 100).toFixed(1) })).sort((a, b) => b.aum - a.aum);
  }, [filtered, filteredNominal]);

  const sectorGreenium = useMemo(() => {
    return GB_SECTORS.map(sec => {
      const subs = filtered.filter(b => b.issuerSector === sec);
      const n = subs.reduce((s, b) => s + b.nominal, 0);
      const g = n > 0 ? subs.reduce((s, b) => s + (b.nominal / n) * b.greenium, 0) : 0;
      return { sector: sec.substring(0, 7), greenium: +g.toFixed(4), count: subs.length };
    });
  }, [filtered]);

  const impactByCategory = useMemo(() => {
    const map = {};
    filtered.forEach(b => {
      if (!map[b.icmaCategory]) map[b.icmaCategory] = { category: b.icmaCategory, totalImpact: 0, nominal: 0, count: 0 };
      map[b.icmaCategory].totalImpact += b.impactPerM * b.nominal;
      map[b.icmaCategory].nominal += b.nominal;
      map[b.icmaCategory].count += 1;
    });
    return Object.values(map).map(x => ({
      ...x,
      efficiency: x.nominal > 0 ? +(x.totalImpact / x.nominal).toFixed(2) : 0,
      category: x.category.substring(0, 12),
    })).sort((a, b) => b.efficiency - a.efficiency);
  }, [filtered]);

  const euGbsGap = useMemo(() => {
    const aligned = filtered.filter(b => b.taxonomyAligned && b.dnshCompliant && b.secondPartyOpinion).length;
    return { aligned, total: filtered.length, gapPct: filtered.length > 0 ? (1 - aligned / filtered.length) * 100 : 0 };
  }, [filtered]);

  const reportingByMonth = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      reported: Math.floor(sr(i * 7 + 1) * 8) + 2,
      pending: Math.floor(sr(i * 11 + 2) * 4) + 1,
      missing: Math.floor(sr(i * 13 + 3) * 2),
    }));
  }, []);

  const bondA = useMemo(() => compareA ? BONDS_N.find(b => b.name === compareA) : null, [compareA]);
  const bondB = useMemo(() => compareB ? BONDS_N.find(b => b.name === compareB) : null, [compareB]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>EP-CZ4 · GREEN BOND PORTFOLIO ANALYTICS</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Green Bond Portfolio Analytics</h1>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>100 bonds · Greenium analysis · ICMA / EU GBS / DNSH · Impact efficiency scoring</div>
      </div>

      {/* Controls */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="All">All Types</option>
          {BOND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="All">All Sectors</option>
          {GB_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="All">All Countries</option>
          {COUNTRIES_GB.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={reportingFilter} onChange={e => setReportingFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="All">All Reporting</option>
          {REPORTING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={verifierFilter} onChange={e => setVerifierFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="All">All Verifiers</option>
          {VERIFIERS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <label style={{ fontSize: 12, color: T.muted }}>Dur: {durMin.toFixed(0)}–{durMax.toFixed(0)}yr
          <input type="range" min={0} max={15} value={durMin} onChange={e => setDurMin(+e.target.value)} style={{ marginLeft: 8, width: 60 }} />
          <input type="range" min={0} max={15} value={durMax} onChange={e => setDurMax(+e.target.value)} style={{ marginLeft: 4, width: 60 }} />
        </label>
        <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={dnshFilter} onChange={e => setDnshFilter(e.target.checked)} />DNSH Only
        </label>
        <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={taxonomyFilter} onChange={e => setTaxonomyFilter(e.target.checked)} />EU Taxonomy
        </label>
        <input placeholder="Search bonds..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 140 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 32px', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '12px 16px', fontSize: 12, fontWeight: activeTab === i ? 700 : 500, color: activeTab === i ? T.indigo : T.muted, background: 'none', border: 'none', borderBottom: activeTab === i ? `2px solid ${T.indigo}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* TAB 0: Portfolio Dashboard */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Portfolio Greenium" value={`${(portfolioGreenium * 100).toFixed(2)} bps`} sub="AUM-weighted" color={portfolioGreenium < 0 ? T.green : T.amber} />
              <KpiCard label="AUM" value={`$${filteredNominal.toFixed(0)}M`} sub={`${filtered.length} bonds`} color={T.navy} />
              <KpiCard label="Avg Impact Score" value={avgImpact.toFixed(1)} sub="Blended 0-100" color={T.teal} />
              <KpiCard label="Reporting Coverage" value={`${reportingCoverage.toFixed(1)}%`} sub="Annual impact reports" color={reportingCoverage >= 80 ? T.green : T.amber} />
              <KpiCard label="DNSH Compliant" value={`${(filtered.filter(b => b.dnshCompliant).length / (filtered.length || 1) * 100).toFixed(1)}%`} sub="EU taxonomy DNSH" color={T.green} />
              <KpiCard label="EU Taxonomy Aligned" value={`${(filtered.filter(b => b.taxonomyAligned).length / (filtered.length || 1) * 100).toFixed(1)}%`} sub="of holdings" color={T.indigo} />
              <KpiCard label="Avg Duration" value={`${filtered.length ? (filtered.reduce((s, b) => s + b.duration, 0) / filtered.length).toFixed(2) : 0}yr`} color={T.blue} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Bond Type Breakdown by AUM ($M)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={typeSplit} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v, n, p) => [v, n === 'aum' ? 'AUM $M' : '%']} />
                    <Bar dataKey="aum" fill={T.teal} radius={[4, 4, 0, 0]} name="AUM $M" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Greenium by Bond Type</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={BOND_TYPES.map(type => {
                    const subs = filtered.filter(b => b.type === type);
                    const n = subs.reduce((s, b) => s + b.nominal, 0);
                    const g = n > 0 ? subs.reduce((s, b) => s + (b.nominal / n) * b.greenium, 0) : 0;
                    return { type, greenium: +g.toFixed(4) };
                  })} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(2)}%`} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${(v * 100).toFixed(3)}%`, 'Greenium']} />
                    <ReferenceLine y={0} stroke={T.border} strokeWidth={2} />
                    <Bar dataKey="greenium" fill={T.indigo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Compare mode */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Bond Comparison Mode</h3>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <select value={compareA} onChange={e => setCompareA(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                  <option value="">Select Bond A</option>
                  {BONDS_N.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
                <select value={compareB} onChange={e => setCompareB(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                  <option value="">Select Bond B</option>
                  {BONDS_N.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              {bondA && bondB && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: T.sub }}>
                    <th style={{ padding: '7px 12px', textAlign: 'left', color: T.muted, fontWeight: 700 }}>Metric</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', color: T.indigo, fontWeight: 700 }}>{bondA.name}</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', color: T.teal, fontWeight: 700 }}>{bondB.name}</th>
                  </tr></thead>
                  <tbody>
                    {[['Type', bondA.type, bondB.type], ['Nominal $M', bondA.nominal.toFixed(1), bondB.nominal.toFixed(1)], ['Coupon %', bondA.coupon, bondB.coupon], ['YTM %', bondA.yieldToMaturity, bondB.yieldToMaturity], ['Duration yr', bondA.duration, bondB.duration], ['Greenium %', bondA.greenium, bondB.greenium], ['Impact/M', bondA.impactPerM.toFixed(2), bondB.impactPerM.toFixed(2)], ['ESG Rating', bondA.esgRating, bondB.esgRating], ['DNSH', bondA.dnshCompliant ? 'Yes' : 'No', bondB.dnshCompliant ? 'Yes' : 'No'], ['Reporting', bondA.reportingStatus, bondB.reportingStatus]].map(([m, a, b], i) => (
                      <tr key={m} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 12px', fontWeight: 600 }}>{m}</td>
                        <td style={{ padding: '6px 12px', color: T.indigo }}>{a}</td>
                        <td style={{ padding: '6px 12px', color: T.teal }}>{b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: Bond Universe */}
        {activeTab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Bond Universe — {filtered.length} bonds</h3>
            <div style={{ overflowX: 'auto', maxHeight: 540, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub, position: 'sticky', top: 0 }}>
                    {['Name','Issuer','Type','ICMA Cat','Sector','Country','Nominal $M','Coupon %','YTM %','Duration','Greenium %','ESG','Taxonomy','DNSH','SPO','Verifier','Reporting'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => (
                    <tr key={b.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '5px 10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{b.name}</td>
                      <td style={{ padding: '5px 10px', color: T.muted, fontSize: 10 }}>{b.issuer}</td>
                      <td style={{ padding: '5px 10px' }}><span style={{ background: b.type === 'Green' ? T.green : b.type === 'Social' ? T.blue : b.type === 'Blue' ? T.teal : b.type === 'SLB' ? T.purple : T.amber, color: '#fff', padding: '1px 6px', borderRadius: 8, fontSize: 9 }}>{b.type}</span></td>
                      <td style={{ padding: '5px 10px', fontSize: 10, color: T.muted }}>{b.icmaCategory.substring(0, 10)}</td>
                      <td style={{ padding: '5px 10px', fontSize: 10 }}>{b.issuerSector}</td>
                      <td style={{ padding: '5px 10px' }}>{b.country}</td>
                      <td style={{ padding: '5px 10px', fontWeight: 600 }}>{b.nominal.toFixed(0)}</td>
                      <td style={{ padding: '5px 10px' }}>{b.coupon}%</td>
                      <td style={{ padding: '5px 10px' }}>{b.yieldToMaturity}%</td>
                      <td style={{ padding: '5px 10px' }}>{b.duration.toFixed(1)}</td>
                      <td style={{ padding: '5px 10px', color: b.greenium < 0 ? T.green : T.red }}>{b.greenium > 0 ? '+' : ''}{b.greenium}%</td>
                      <td style={{ padding: '5px 10px' }}>{b.esgRating}</td>
                      <td style={{ padding: '5px 10px', color: b.taxonomyAligned ? T.green : T.red }}>{b.taxonomyAligned ? 'Y' : 'N'}</td>
                      <td style={{ padding: '5px 10px', color: b.dnshCompliant ? T.green : T.red }}>{b.dnshCompliant ? 'Y' : 'N'}</td>
                      <td style={{ padding: '5px 10px', color: b.secondPartyOpinion ? T.green : T.muted }}>{b.secondPartyOpinion ? 'Y' : 'N'}</td>
                      <td style={{ padding: '5px 10px', fontSize: 10, color: T.blue }}>{b.verifier.substring(0, 8)}</td>
                      <td style={{ padding: '5px 10px' }}><span style={{ background: b.reportingStatus === 'Reported' ? T.green : b.reportingStatus === 'Pending' ? T.amber : T.red, color: '#fff', padding: '1px 6px', borderRadius: 8, fontSize: 9 }}>{b.reportingStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Greenium Analysis */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <KpiCard label="Portfolio Greenium" value={`${(portfolioGreenium * 100).toFixed(2)} bps`} color={portfolioGreenium < 0 ? T.green : T.amber} />
              <KpiCard label="Tightest Greenium" value={`${Math.min(...filtered.map(b => b.greenium)).toFixed(3)}%`} sub="(most premium)" color={T.green} />
              <KpiCard label="Widest Spread" value={`${Math.max(...filtered.map(b => b.greenium)).toFixed(3)}%`} color={T.red} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Greenium by Sector (%)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorGreenium} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(2)}%`} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${(v * 100).toFixed(3)}%`, 'Greenium']} />
                    <ReferenceLine y={0} stroke={T.border} strokeWidth={2} />
                    <Bar dataKey="greenium" fill={T.indigo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Duration-Adjusted Greenium Scatter</h3>
                <div style={{ overflowY: 'auto', maxHeight: 280 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead><tr style={{ background: T.sub }}>
                      {['Bond','Duration','Greenium %','Type','Sector'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {[...filtered].sort((a, b) => a.greenium - b.greenium).slice(0, 20).map((b, i) => (
                        <tr key={b.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                          <td style={{ padding: '5px 10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{b.name}</td>
                          <td style={{ padding: '5px 10px' }}>{b.duration.toFixed(1)}yr</td>
                          <td style={{ padding: '5px 10px', color: b.greenium < 0 ? T.green : T.red, fontWeight: 600 }}>{b.greenium > 0 ? '+' : ''}{b.greenium}%</td>
                          <td style={{ padding: '5px 10px' }}>{b.type}</td>
                          <td style={{ padding: '5px 10px', color: T.muted, fontSize: 10 }}>{b.issuerSector}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Impact Analytics */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Total Impact" value={`${(filtered.reduce((s, b) => s + b.impactPerM * b.nominal, 0) / 1000).toFixed(1)}K`} sub="Impact units total" color={T.teal} />
              <KpiCard label="Avg Impact/M" value={filtered.length ? (filtered.reduce((s, b) => s + b.impactPerM, 0) / filtered.length).toFixed(2) : 0} sub="per $1M invested" />
              <KpiCard label="Best Category" value={impactByCategory[0]?.category || 'N/A'} sub={`${impactByCategory[0]?.efficiency || 0} eff.`} color={T.green} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Use-of-Proceeds by ICMA Category</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={impactByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 90, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="nominal" fill={T.teal} name="AUM $M" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Impact Efficiency by Category (units/$M)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={impactByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 90, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v}`, 'Impact/M']} />
                    <Bar dataKey="efficiency" fill={T.green} name="Efficiency" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Regulatory & Taxonomy */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <KpiCard label="EU GBS Compliant" value={`${euGbsGap.aligned}/${euGbsGap.total}`} color={euGbsGap.gapPct < 20 ? T.green : T.amber} />
              <KpiCard label="GBS Gap" value={`${euGbsGap.gapPct.toFixed(1)}%`} sub="Non-compliant" color={euGbsGap.gapPct > 30 ? T.red : T.amber} />
              <KpiCard label="DNSH Compliant" value={`${filtered.filter(b => b.dnshCompliant).length}`} sub={`of ${filtered.length}`} color={T.teal} />
              <KpiCard label="SPO Coverage" value={`${(filtered.filter(b => b.secondPartyOpinion).length / (filtered.length || 1) * 100).toFixed(1)}%`} color={T.indigo} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>EU GBS Gap Analysis</h3>
                {[
                  { label: 'Taxonomy Aligned', value: filtered.filter(b => b.taxonomyAligned).length, total: filtered.length },
                  { label: 'DNSH Compliant', value: filtered.filter(b => b.dnshCompliant).length, total: filtered.length },
                  { label: 'Second Party Opinion', value: filtered.filter(b => b.secondPartyOpinion).length, total: filtered.length },
                  { label: 'Impact Report Submitted', value: filtered.filter(b => b.reportingStatus === 'Reported').length, total: filtered.length },
                  { label: 'Full GBS Compliant', value: euGbsGap.aligned, total: euGbsGap.total },
                ].map(r => (
                  <div key={r.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span>{r.label}</span>
                      <span style={{ fontWeight: 600 }}>{r.value}/{r.total} ({r.total > 0 ? (r.value / r.total * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div style={{ background: T.border, borderRadius: 4, height: 8 }}>
                      <div style={{ background: r.value / r.total >= 0.8 ? T.green : r.value / r.total >= 0.5 ? T.amber : T.red, borderRadius: 4, height: 8, width: `${r.total > 0 ? r.value / r.total * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>SPO Verifier Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={VERIFIERS.map(v => ({
                    verifier: v.substring(0, 8),
                    count: filtered.filter(b => b.verifier === v && b.secondPartyOpinion).length,
                  }))} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="verifier" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="count" fill={T.purple} radius={[4, 4, 0, 0]} name="SPO Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Reporting Monitor */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <KpiCard label="Reported" value={filtered.filter(b => b.reportingStatus === 'Reported').length} color={T.green} />
              <KpiCard label="Pending" value={filtered.filter(b => b.reportingStatus === 'Pending').length} color={T.amber} />
              <KpiCard label="Missing" value={filtered.filter(b => b.reportingStatus === 'Missing').length} color={T.red} />
              <KpiCard label="Coverage" value={`${reportingCoverage.toFixed(1)}%`} color={reportingCoverage >= 80 ? T.green : T.amber} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Reporting Coverage by Month</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={reportingByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="reported" stackId="a" fill={T.green} name="Reported" />
                    <Bar dataKey="pending" stackId="a" fill={T.amber} name="Pending" />
                    <Bar dataKey="missing" stackId="a" fill={T.red} name="Missing" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Missing Disclosure Alerts</h3>
                <div style={{ overflowY: 'auto', maxHeight: 260 }}>
                  {filtered.filter(b => b.reportingStatus !== 'Reported').slice(0, 20).map((b, i) => (
                    <div key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ background: b.reportingStatus === 'Pending' ? T.amber : T.red, color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 10 }}>{b.reportingStatus}</span>
                      <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{b.name}</span>
                      <span style={{ color: T.muted, fontSize: 11 }}>{b.issuer}</span>
                      <span style={{ color: T.muted, fontSize: 11, marginLeft: 'auto' }}>Maturity: {b.maturity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Portfolio Summary — {filtered.length} bonds, ${filteredNominal.toFixed(0)}M AUM</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Metric','Value','Benchmark','Status','Notes'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    ['Portfolio Greenium', `${(portfolioGreenium * 100).toFixed(2)} bps`, '<0 bps', portfolioGreenium < 0 ? 'PASS' : 'FAIL'],
                    ['Reporting Coverage', `${reportingCoverage.toFixed(1)}%`, '>80%', reportingCoverage >= 80 ? 'PASS' : 'FAIL'],
                    ['DNSH Compliance', `${(filtered.filter(b => b.dnshCompliant).length / (filtered.length || 1) * 100).toFixed(1)}%`, '>70%', filtered.filter(b => b.dnshCompliant).length / (filtered.length || 1) > 0.7 ? 'PASS' : 'FAIL'],
                    ['Taxonomy Aligned', `${(filtered.filter(b => b.taxonomyAligned).length / (filtered.length || 1) * 100).toFixed(1)}%`, '>50%', filtered.filter(b => b.taxonomyAligned).length / (filtered.length || 1) > 0.5 ? 'PASS' : 'FAIL'],
                    ['SPO Coverage', `${(filtered.filter(b => b.secondPartyOpinion).length / (filtered.length || 1) * 100).toFixed(1)}%`, '>85%', filtered.filter(b => b.secondPartyOpinion).length / (filtered.length || 1) > 0.85 ? 'PASS' : 'FAIL'],
                    ['EU GBS Full Compliance', `${euGbsGap.gapPct.toFixed(1)}% gap`, '<20% gap', euGbsGap.gapPct < 20 ? 'PASS' : 'FAIL'],
                    ['Avg Impact Score', `${avgImpact.toFixed(1)}`, '>50', avgImpact >= 50 ? 'PASS' : 'FAIL'],
                    ['Bond Diversification', `${filtered.length} bonds`, '>20', filtered.length >= 20 ? 'PASS' : 'FAIL'],
                  ].map(([m, v, b, s], i) => (
                    <tr key={m} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{v}</td>
                      <td style={{ padding: '8px 12px', color: T.muted }}>{b}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: s === 'PASS' ? T.green : T.red, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{s}</span></td>
                      <td style={{ padding: '8px 12px', color: T.muted, fontSize: 11 }}>EU GBS / ICMA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>All Bonds — {filtered.length} holdings</h3>
              <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: T.sub }}>
                    {['Name','Type','Sector','Nominal $M','YTM %','Greenium %','Duration','Impact/M','ESG','DNSH','Taxonomy','Reporting'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...filtered].sort((a, b) => b.nominal - a.nominal).map((b, i) => (
                      <tr key={b.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{b.name}</td>
                        <td style={{ padding: '5px 10px' }}>{b.type}</td>
                        <td style={{ padding: '5px 10px', fontSize: 10, color: T.muted }}>{b.issuerSector}</td>
                        <td style={{ padding: '5px 10px', fontWeight: 600 }}>{b.nominal.toFixed(0)}</td>
                        <td style={{ padding: '5px 10px' }}>{b.yieldToMaturity}%</td>
                        <td style={{ padding: '5px 10px', color: b.greenium < 0 ? T.green : T.red }}>{b.greenium}%</td>
                        <td style={{ padding: '5px 10px' }}>{b.duration.toFixed(1)}</td>
                        <td style={{ padding: '5px 10px' }}>{b.impactPerM.toFixed(2)}</td>
                        <td style={{ padding: '5px 10px' }}>{b.esgRating}</td>
                        <td style={{ padding: '5px 10px', color: b.dnshCompliant ? T.green : T.red }}>{b.dnshCompliant ? 'Y' : 'N'}</td>
                        <td style={{ padding: '5px 10px', color: b.taxonomyAligned ? T.green : T.red }}>{b.taxonomyAligned ? 'Y' : 'N'}</td>
                        <td style={{ padding: '5px 10px' }}><span style={{ background: b.reportingStatus === 'Reported' ? T.green : b.reportingStatus === 'Pending' ? T.amber : T.red, color: '#fff', padding: '1px 6px', borderRadius: 8, fontSize: 9 }}>{b.reportingStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Duration breakdown */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Duration Profile — Bond Portfolio</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { range: '0-3yr', count: filtered.filter(b => b.duration < 3).length, aum: filtered.filter(b => b.duration < 3).reduce((s, b) => s + b.nominal, 0).toFixed(0) },
                  { range: '3-5yr', count: filtered.filter(b => b.duration >= 3 && b.duration < 5).length, aum: filtered.filter(b => b.duration >= 3 && b.duration < 5).reduce((s, b) => s + b.nominal, 0).toFixed(0) },
                  { range: '5-7yr', count: filtered.filter(b => b.duration >= 5 && b.duration < 7).length, aum: filtered.filter(b => b.duration >= 5 && b.duration < 7).reduce((s, b) => s + b.nominal, 0).toFixed(0) },
                  { range: '7-10yr', count: filtered.filter(b => b.duration >= 7 && b.duration < 10).length, aum: filtered.filter(b => b.duration >= 7 && b.duration < 10).reduce((s, b) => s + b.nominal, 0).toFixed(0) },
                  { range: '10yr+', count: filtered.filter(b => b.duration >= 10).length, aum: filtered.filter(b => b.duration >= 10).reduce((s, b) => s + b.nominal, 0).toFixed(0) },
                ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" fill={T.blue} radius={[4, 4, 0, 0]} name="Bond Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* ESG rating breakdown */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ESG Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={['AAA','AA','A','BBB','BB'].map(r => ({
                  rating: r,
                  count: filtered.filter(b => b.esgRating === r).length,
                  aum: +(filtered.filter(b => b.esgRating === r).reduce((s, b) => s + b.nominal, 0)).toFixed(0),
                }))} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rating" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="count" fill={T.indigo} name="Count" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="aum" stroke={T.gold} strokeWidth={2} name="AUM $M" dot={{ fill: T.gold, r: 3 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Sector x type matrix */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sector × Bond Type AUM Matrix ($M)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>Sector</th>
                      {BOND_TYPES.map(t => <th key={t} style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{t}</th>)}
                      <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}` }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GB_SECTORS.map((sec, i) => {
                      const secBonds = filtered.filter(b => b.issuerSector === sec);
                      const typeTotals = BOND_TYPES.map(t => secBonds.filter(b => b.type === t).reduce((s, b) => s + b.nominal, 0));
                      const rowTotal = typeTotals.reduce((s, x) => s + x, 0);
                      if (rowTotal === 0) return null;
                      return (
                        <tr key={sec} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                          <td style={{ padding: '5px 10px', fontWeight: 600 }}>{sec}</td>
                          {typeTotals.map((v, ti) => (
                            <td key={ti} style={{ padding: '5px 10px', textAlign: 'right', color: v > 0 ? T.text : T.muted }}>{v > 0 ? v.toFixed(0) : '–'}</td>
                          ))}
                          <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: T.navy }}>{rowTotal.toFixed(0)}</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Yield distribution */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>YTM Distribution — {filtered.length} bonds</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={Array.from({ length: 8 }, (_, i) => ({
                  range: `${(i * 0.75).toFixed(2)}-${((i + 1) * 0.75).toFixed(2)}%`,
                  count: filtered.filter(b => b.yieldToMaturity >= i * 0.75 && b.yieldToMaturity < (i + 1) * 0.75).length,
                }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v} bonds`, 'Count']} />
                  <Bar dataKey="count" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Country AUM heatmap */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Country AUM Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={COUNTRIES_GB.map(cty => ({
                  country: cty,
                  aum: +(filtered.filter(b => b.country === cty).reduce((s, b) => s + b.nominal, 0)).toFixed(0),
                })).sort((a, b) => b.aum - a.aum)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`$${v}M`, 'AUM']} />
                  <Bar dataKey="aum" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Bottom analytics panel */}
        {activeTab !== 6 && (
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Active Portfolio Metrics</div>
              {[
                ['Portfolio Greenium', `${(portfolioGreenium * 100).toFixed(2)} bps`],
                ['AUM ($M)', `$${filteredNominal.toFixed(0)}M`],
                ['Avg Impact Score', avgImpact.toFixed(1)],
                ['Reporting Coverage', `${reportingCoverage.toFixed(1)}%`],
                ['DNSH Compliant', `${(filtered.filter(b => b.dnshCompliant).length / (filtered.length || 1) * 100).toFixed(1)}%`],
                ['Taxonomy Aligned', `${(filtered.filter(b => b.taxonomyAligned).length / (filtered.length || 1) * 100).toFixed(1)}%`],
                ['SPO Coverage', `${(filtered.filter(b => b.secondPartyOpinion).length / (filtered.length || 1) * 100).toFixed(1)}%`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Reporting Status Breakdown</div>
              {REPORTING_STATUSES.map(s => {
                const count = filtered.filter(b => b.reportingStatus === s).length;
                const pct = filtered.length > 0 ? (count / filtered.length * 100).toFixed(1) : '0.0';
                return (
                  <div key={s} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: s === 'Reported' ? T.green : s === 'Pending' ? T.amber : T.red }}>{s}</span>
                      <span>{count} ({pct}%)</span>
                    </div>
                    <div style={{ background: T.border, borderRadius: 4, height: 6 }}>
                      <div style={{ background: s === 'Reported' ? T.green : s === 'Pending' ? T.amber : T.red, borderRadius: 4, height: 6, width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Bond Type AUM Breakdown</div>
              {typeSplit.map((t, i) => (
                <div key={t.type} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{t.type}</span>
                    <span>${t.aum.toFixed(0)}M ({t.pct}%)</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 5 }}>
                    <div style={{ background: [T.green, T.blue, T.teal, T.purple, T.indigo, T.amber][i % 6], borderRadius: 4, height: 5, width: `${t.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact by type table */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Impact Metrics by Bond Type</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Bond Type','# Bonds','AUM $M','Avg Coupon %','Avg YTM %','Avg Duration','Avg Greenium %','DNSH %','Taxonomy %','Avg Impact Score'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOND_TYPES.map((type, i) => {
                  const bds = filtered.filter(b => b.type === type);
                  if (!bds.length) return null;
                  const n = bds.length;
                  const aum = bds.reduce((s, b) => s + b.nominal, 0);
                  const avgC = bds.reduce((s, b) => s + b.coupon, 0) / n;
                  const avgY = bds.reduce((s, b) => s + b.yieldToMaturity, 0) / n;
                  const avgD = bds.reduce((s, b) => s + b.duration, 0) / n;
                  const avgG = bds.reduce((s, b) => s + b.greenium, 0) / n;
                  const dnshPct = bds.filter(b => b.dnshCompliant).length / n * 100;
                  const taxPct = bds.filter(b => b.taxonomyAligned).length / n * 100;
                  const avgImp = bds.reduce((s, b) => s + b.blendedImpact, 0) / n;
                  return (
                    <tr key={type} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{type}</td>
                      <td style={{ padding: '6px 10px' }}>{n}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>${aum.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px' }}>{avgC.toFixed(3)}%</td>
                      <td style={{ padding: '6px 10px' }}>{avgY.toFixed(3)}%</td>
                      <td style={{ padding: '6px 10px' }}>{avgD.toFixed(2)}yr</td>
                      <td style={{ padding: '6px 10px', color: avgG < 0 ? T.green : T.red }}>{avgG > 0 ? '+' : ''}{avgG.toFixed(4)}%</td>
                      <td style={{ padding: '6px 10px', color: dnshPct >= 70 ? T.green : T.amber }}>{dnshPct.toFixed(1)}%</td>
                      <td style={{ padding: '6px 10px', color: taxPct >= 50 ? T.green : T.amber }}>{taxPct.toFixed(1)}%</td>
                      <td style={{ padding: '6px 10px', color: avgImp >= 60 ? T.green : T.muted }}>{avgImp.toFixed(1)}</td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        )}

        {/* Verifier × type matrix */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>SPO Verifier × Bond Type Matrix</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>Verifier</th>
                    {BOND_TYPES.map(t => <th key={t} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{t}</th>)}
                    <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}` }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {VERIFIERS.map((ver, i) => {
                    const typeCounts = BOND_TYPES.map(t => filtered.filter(b => b.verifier === ver && b.type === t).length);
                    const total = typeCounts.reduce((s, x) => s + x, 0);
                    return (
                      <tr key={ver} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 10px', fontWeight: 600 }}>{ver}</td>
                        {typeCounts.map((v, ti) => (
                          <td key={ti} style={{ padding: '5px 10px', textAlign: 'center', color: v > 0 ? T.text : T.muted }}>{v > 0 ? v : '–'}</td>
                        ))}
                        <td style={{ padding: '5px 10px', textAlign: 'center', fontWeight: 700, color: T.navy }}>{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ESG rating × sector matrix */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ESG Rating Distribution by Sector</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={GB_SECTORS.map(sec => {
                const bds = filtered.filter(b => b.issuerSector === sec);
                return {
                  sector: sec.substring(0, 7),
                  AAA: bds.filter(b => b.esgRating === 'AAA').length,
                  AA: bds.filter(b => b.esgRating === 'AA').length,
                  A: bds.filter(b => b.esgRating === 'A').length,
                  BBB: bds.filter(b => b.esgRating === 'BBB').length,
                  BB: bds.filter(b => b.esgRating === 'BB').length,
                };
              })} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="AAA" stackId="a" fill={T.green} name="AAA" />
                <Bar dataKey="AA" stackId="a" fill={T.teal} name="AA" />
                <Bar dataKey="A" stackId="a" fill={T.blue} name="A" />
                <Bar dataKey="BBB" stackId="a" fill={T.amber} name="BBB" />
                <Bar dataKey="BB" stackId="a" fill={T.red} name="BB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Greenium analytics deep dive */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Greenium Percentile Distribution</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Percentile','Greenium %','Bond Count','Avg AUM $M','Avg ESG','Avg Duration','DNSH %','Taxonomy %'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 25, 50, 75, 90].map((pct, i) => {
                  const sorted = [...filtered].sort((a, b) => a.greenium - b.greenium);
                  const idx = Math.floor(sorted.length * pct / 100);
                  const sliceEnd = Math.floor(sorted.length * Math.min(100, pct + 25) / 100);
                  const slice = sorted.slice(idx, sliceEnd);
                  if (!slice.length) return null;
                  const greenium = sorted[idx]?.greenium || 0;
                  const avgAum = slice.reduce((s, b) => s + b.nominal, 0) / slice.length;
                  const avgESG = slice.reduce((s, b) => s + b.esgScore.charCodeAt(0), 0) / slice.length;
                  const avgDur = slice.reduce((s, b) => s + b.duration, 0) / slice.length;
                  const dnshPct2 = slice.filter(b => b.dnshCompliant).length / slice.length * 100;
                  const taxPct2 = slice.filter(b => b.taxonomyAligned).length / slice.length * 100;
                  return (
                    <tr key={pct} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>P{pct}</td>
                      <td style={{ padding: '6px 10px', color: greenium < 0 ? T.green : T.red }}>{greenium.toFixed(4)}%</td>
                      <td style={{ padding: '6px 10px' }}>{slice.length}</td>
                      <td style={{ padding: '6px 10px' }}>${avgAum.toFixed(0)}M</td>
                      <td style={{ padding: '6px 10px' }}>{sorted[idx]?.esgRating || '—'}</td>
                      <td style={{ padding: '6px 10px' }}>{avgDur.toFixed(2)}yr</td>
                      <td style={{ padding: '6px 10px', color: dnshPct2 >= 70 ? T.green : T.amber }}>{dnshPct2.toFixed(1)}%</td>
                      <td style={{ padding: '6px 10px', color: taxPct2 >= 50 ? T.green : T.amber }}>{taxPct2.toFixed(1)}%</td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        )}

        {/* Duration-weighted impact trajectory */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Annual Impact Delivery Schedule (Duration-Weighted)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Array.from({ length: 10 }, (_, yr) => {
                const activeBonds = filtered.filter(b => b.duration >= yr);
                const impactThisYr = activeBonds.reduce((s, b) => s + b.impactPerM * b.nominal / b.duration, 0);
                return { year: `Y${yr + 1}`, impact: +impactThisYr.toFixed(1), bonds: activeBonds.length };
              })} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="impact" fill={T.green} name="Annual Impact" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="bonds" stroke={T.indigo} strokeWidth={2} name="Active Bonds" dot={{ fill: T.indigo, r: 3 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
