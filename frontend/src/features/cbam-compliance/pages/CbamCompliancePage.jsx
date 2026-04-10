import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, PieChart, Pie, RadarChart, Radar, Cell,
  ReferenceLine, Tooltip, Legend, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import cbamData from '../../../data/cbam-vulnerability.json';
import { isIndiaMode, getIndiaCBAM } from '../../../data/IndiaDataAdapter';
import ReportExporter from '../../../components/ReportExporter';
import CurrencyToggle from '../../../components/CurrencyToggle';

/* ── theme ── */
const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e'
};
const CC = [T.navy, T.gold, T.indigo, T.green, T.red, T.amber, '#8b5cf6', '#0891b2', '#db2777', '#059669', '#7c3aed'];
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const fmt = v => typeof v === 'number' ? (v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : v.toFixed(2)) : v;
const fmtPct = v => typeof v === 'number' ? (v * 100).toFixed(1) + '%' : v;
const fmtUsd = v => typeof v === 'number' ? '$' + fmt(v * 1000) : v; // kusd to usd display
const tip = { contentStyle: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }, labelStyle: { color: T.navy, fontWeight: 600 } };

/* ── data extraction ── */
const _indiaCBAM = isIndiaMode() ? getIndiaCBAM() : null;
const countries = _indiaCBAM ? [_indiaCBAM, ...(cbamData.countries || []).filter(c => c.country !== 'India')] : (cbamData.countries || []);
const tradeFlows = cbamData.tradeFlows || [];
const defaultValues = cbamData.defaultValues || [];
const phaseIn = cbamData.phaseIn || [];
const ranges = cbamData.ranges || {};
const subIndexAvg = cbamData.subIndexAvg || {};
const sankeyFlows = cbamData.sankeyFlows || [];
const commodityPrices = cbamData.commodityPrices || {};
const COMMODITIES = Object.keys(commodityPrices);
const SUB_INDICES = ['depExports', 'depCbamExports', 'depEuMarket', 'emissionIntensity', 'carbonPriceSignal'];
const SUB_LABELS = { depExports: 'Dependence on Exports', depCbamExports: 'Dependence on CBAM Exports', depEuMarket: 'Dependence on EU Market', emissionIntensity: 'Emission Intensity', carbonPriceSignal: 'Carbon Price Signal' };
const productGroups = [...new Set(defaultValues.map(d => d.productGroup))];

const TABS = [
  'Vulnerability Dashboard', 'Country Explorer', 'Sub-Index Deep-Dive',
  'Trade Flow Analysis', 'Carbon Cost Simulator', 'EC Default Values',
  'Phase-In Timeline', 'Country Comparison', 'Emission Intensity', 'Risk & Opportunity'
];

/* ── styles ── */
const cardS = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 };
const kpiS = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' };
const kpiLabel = { fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace" };
const kpiVal = { fontSize: 24, fontWeight: 700, color: T.navy, marginTop: 4 };
const secTitle = { fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 };
const badgeS = (bg, color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color });

/* ── helpers ── */
function classify(vi) {
  const r = ranges['Vulnerability Index'] || [];
  if (vi <= (r[1]?.value || 0.21)) return { label: 'Low', color: T.green, bg: '#d1fae5' };
  if (vi <= (r[2]?.value || 0.23)) return { label: 'Medium', color: T.amber, bg: '#fef3c7' };
  if (vi <= (r[3]?.value || 0.32)) return { label: 'High', color: '#c2410c', bg: '#ffedd5' };
  return { label: 'Very High', color: T.red, bg: '#fee2e2' };
}

function exportCSV(data, fn) {
  if (!data.length) return;
  const h = Object.keys(data[0]);
  const csv = [h.join(','), ...data.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  const b = new Blob([csv], { type: 'text/csv' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a'); a.href = u; a.download = fn; a.click();
  URL.revokeObjectURL(u);
}

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
export default function CbamCompliancePage() {
  /* all hooks at top */
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]?.iso3 || '');
  const [selectedSubIndex, setSelectedSubIndex] = useState('depExports');
  const [commodityFilter, setCommodityFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [phaseYear, setPhaseYear] = useState(2034);
  const [compareCountries, setCompareCountries] = useState([]);
  const [dvSearch, setDvSearch] = useState('');
  const [dvSort, setDvSort] = useState('directDefault');
  const [dvSortDir, setDvSortDir] = useState('desc');
  const [dvPage, setDvPage] = useState(0);
  const [vulnThreshold, setVulnThreshold] = useState(0);
  const [tradeSort, setTradeSort] = useState('exports_kusd');
  const [tradeSortDir, setTradeSortDir] = useState('desc');

  /* ── derived data ── */
  const countryMap = useMemo(() => {
    const m = {};
    countries.forEach(c => { m[c.iso3] = c; });
    return m;
  }, []);

  const selCountry = countryMap[selectedCountry] || countries[0] || {};

  const sortedByVuln = useMemo(() =>
    [...countries].sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex), []);

  const filteredCountries = useMemo(() => {
    let d = [...countries];
    if (search) d = d.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.iso3.toLowerCase().includes(search.toLowerCase()));
    if (vulnThreshold > 0) d = d.filter(c => c.vulnerabilityIndex >= vulnThreshold);
    return d;
  }, [search, vulnThreshold]);

  const noCarbonPricing = useMemo(() => countries.filter(c => c.carbonTax === 0 && c.ets === 0).length, []);

  const avgVuln = useMemo(() => {
    const n = countries.length || 1;
    return countries.reduce((s, c) => s + c.vulnerabilityIndex, 0) / n;
  }, []);

  const avgEI = useMemo(() => {
    const n = countries.length || 1;
    return countries.reduce((s, c) => s + c.emissionsIntensity_kgco2usd, 0) / n;
  }, []);

  /* vulnerability histogram */
  const vulnHistogram = useMemo(() => {
    const bins = [
      { label: '0-0.15', min: 0, max: 0.15, count: 0 },
      { label: '0.15-0.25', min: 0.15, max: 0.25, count: 0 },
      { label: '0.25-0.35', min: 0.25, max: 0.35, count: 0 },
      { label: '0.35-0.45', min: 0.35, max: 0.45, count: 0 },
      { label: '0.45+', min: 0.45, max: 1, count: 0 }
    ];
    countries.forEach(c => {
      const b = bins.find(b => c.vulnerabilityIndex >= b.min && c.vulnerabilityIndex < b.max) || bins[bins.length - 1];
      b.count++;
    });
    return bins;
  }, []);

  /* sub-index averages radar */
  const subIndexRadar = useMemo(() =>
    SUB_INDICES.map(k => ({ name: SUB_LABELS[k].replace('Dependence on ', 'Dep. '), value: +(subIndexAvg[k] || 0).toFixed(3) })), []);

  /* trade flows aggregated */
  const tradeAgg = useMemo(() => {
    let flows = tradeFlows;
    if (commodityFilter !== 'All') flows = flows.filter(f => f.commodity === commodityFilter);
    const byCountry = {};
    flows.forEach(f => {
      if (!byCountry[f.iso3]) byCountry[f.iso3] = { iso3: f.iso3, name: (countryMap[f.iso3] || {}).name || f.iso3, exports_kusd: 0, exports_kg: 0, directEmissions_tco2: 0, indirectEmissions_tco2: 0, totalEmissions_tco2: 0 };
      byCountry[f.iso3].exports_kusd += f.exports_kusd || 0;
      byCountry[f.iso3].exports_kg += f.exports_kg || 0;
      byCountry[f.iso3].directEmissions_tco2 += f.directEmissions_tco2 || 0;
      byCountry[f.iso3].indirectEmissions_tco2 += f.indirectEmissions_tco2 || 0;
      byCountry[f.iso3].totalEmissions_tco2 += f.totalEmissions_tco2 || 0;
    });
    return Object.values(byCountry).sort((a, b) => b[tradeSort] - a[tradeSort]);
  }, [commodityFilter, countryMap, tradeSort]);

  /* commodity breakdown */
  const commodityBreakdown = useMemo(() => {
    const m = {};
    tradeFlows.forEach(f => {
      if (!m[f.commodity]) m[f.commodity] = { name: f.commodity, exports_kusd: 0, directEmissions_tco2: 0, indirectEmissions_tco2: 0 };
      m[f.commodity].exports_kusd += f.exports_kusd || 0;
      m[f.commodity].directEmissions_tco2 += f.directEmissions_tco2 || 0;
      m[f.commodity].indirectEmissions_tco2 += f.indirectEmissions_tco2 || 0;
    });
    return Object.values(m).sort((a, b) => b.exports_kusd - a.exports_kusd);
  }, []);

  /* default values filtered */
  const filteredDV = useMemo(() => {
    let d = [...defaultValues];
    if (dvSearch) d = d.filter(v => v.cnCode.includes(dvSearch) || v.productGroup.toLowerCase().includes(dvSearch.toLowerCase()));
    d.sort((a, b) => dvSortDir === 'asc' ? (a[dvSort] > b[dvSort] ? 1 : -1) : (a[dvSort] < b[dvSort] ? 1 : -1));
    return d;
  }, [dvSearch, dvSort, dvSortDir]);

  const DV_PAGE = 20;
  const dvPaged = filteredDV.slice(dvPage * DV_PAGE, (dvPage + 1) * DV_PAGE);
  const dvTotalPages = Math.max(1, Math.ceil(filteredDV.length / DV_PAGE));

  /* dv by product group avg */
  const dvByGroup = useMemo(() => {
    const m = {};
    defaultValues.forEach(v => {
      if (!m[v.productGroup]) m[v.productGroup] = { name: v.productGroup, directSum: 0, indirectSum: 0, count: 0 };
      m[v.productGroup].directSum += v.directDefault || 0;
      m[v.productGroup].indirectSum += v.indirectDefault || 0;
      m[v.productGroup].count++;
    });
    return Object.values(m).map(g => ({
      name: g.name,
      avgDirect: g.count > 0 ? +(g.directSum / g.count).toFixed(3) : 0,
      avgIndirect: g.count > 0 ? +(g.indirectSum / g.count).toFixed(3) : 0,
      count: g.count
    }));
  }, []);

  /* phase-in revenue estimator */
  const phaseInRevenue = useMemo(() => {
    const totalEmissions = tradeFlows.reduce((s, f) => s + (f.totalEmissions_tco2 || 0), 0);
    return phaseIn.map(p => ({
      year: p.year,
      factor: p.factor,
      factorPct: +(p.factor * 100).toFixed(1),
      estimatedRevenue: +(totalEmissions * carbonPrice * p.factor / 1e6).toFixed(1),
      label: p.label
    }));
  }, [carbonPrice]);

  /* country comparison data */
  const compData = useMemo(() => {
    if (compareCountries.length === 0) return [];
    return SUB_INDICES.map(k => {
      const entry = { name: SUB_LABELS[k].replace('Dependence on ', 'Dep. ') };
      compareCountries.forEach(iso => {
        const c = countryMap[iso];
        if (c) entry[c.name] = +(c[k] || 0).toFixed(3);
      });
      return entry;
    });
  }, [compareCountries, countryMap]);

  /* emission intensity vs gdp */
  const eiVsGdp = useMemo(() =>
    countries.map(c => ({
      name: c.name, iso3: c.iso3,
      gdpPerCapita: c.gdp_kusd > 0 ? +(c.gdp_kusd / (10 + sr(countries.indexOf(c) * 71) * 90)).toFixed(0) : 0,
      emissionIntensity: +c.emissionsIntensity_kgco2usd.toFixed(4),
      vi: +c.vulnerabilityIndex.toFixed(3)
    })), []);

  /* carbon pricing pie */
  const carbonPricingPie = useMemo(() => {
    let taxOnly = 0, etsOnly = 0, both = 0, none = 0;
    countries.forEach(c => {
      const hasTax = c.carbonTax > 0;
      const hasEts = c.ets > 0;
      if (hasTax && hasEts) both++;
      else if (hasTax) taxOnly++;
      else if (hasEts) etsOnly++;
      else none++;
    });
    return [
      { name: 'Carbon Tax Only', value: taxOnly },
      { name: 'ETS Only', value: etsOnly },
      { name: 'Both', value: both },
      { name: 'None', value: none }
    ].filter(d => d.value > 0);
  }, []);

  /* risk-opportunity scatter */
  const riskOppData = useMemo(() =>
    countries.map(c => ({
      name: c.name, iso3: c.iso3,
      vi: +c.vulnerabilityIndex.toFixed(3),
      tradeExposure: c.gdp_kusd > 0 ? +((c.cbamExports_kusd / c.gdp_kusd) * 100).toFixed(4) : 0,
      hasPricing: c.carbonTax > 0 || c.ets > 0 ? 1 : 0,
      cbamExports: c.cbamExports_kusd
    })), []);

  /* ═══════════════ TAB 1: VULNERABILITY DASHBOARD ═══════════════ */
  const renderDashboard = () => {
    const top20 = sortedByVuln.slice(0, 20);
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { l: 'Countries Assessed', v: countries.length },
            { l: 'Avg Vulnerability', v: avgVuln.toFixed(3) },
            { l: 'Most Vulnerable', v: sortedByVuln[0]?.name || '-' },
            { l: 'Least Vulnerable', v: sortedByVuln[sortedByVuln.length - 1]?.name || '-' },
            { l: 'Avg Emission Intensity', v: avgEI.toFixed(3) + ' kg/$' },
            { l: 'No Carbon Pricing', v: noCarbonPricing }
          ].map((k, i) => (
            <div key={i} style={kpiS}>
              <div style={kpiLabel}>{k.l}</div>
              <div style={{ ...kpiVal, fontSize: typeof k.v === 'string' && k.v.length > 10 ? 16 : 24 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={cardS}>
            <div style={secTitle}>Top 20 Most Vulnerable Countries</div>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={top20} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 0.6]} tick={{ fontSize: 10, fill: T.sub }} />
                <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 10, fill: T.sub }} />
                <Tooltip {...tip} formatter={(v) => [v.toFixed(4), 'Vulnerability Index']} />
                <Bar dataKey="vulnerabilityIndex" radius={[0, 4, 4, 0]}>
                  {top20.map((c, i) => <Cell key={i} fill={c.vulnerabilityIndex > 0.4 ? T.red : c.vulnerabilityIndex > 0.3 ? T.amber : T.navy} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardS}>
              <div style={secTitle}>Vulnerability Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={vulnHistogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.sub }} />
                  <YAxis tick={{ fontSize: 10, fill: T.sub }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="count" fill={T.indigo} radius={[4, 4, 0, 0]} name="Countries" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardS}>
              <div style={secTitle}>Sub-Index Global Averages</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={subIndexRadar}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: T.sub }} />
                  <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 8 }} />
                  <Radar dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════ TAB 2: COUNTRY EXPLORER ═══════════════ */
  const renderCountryExplorer = () => {
    const c = selCountry;
    const cls = classify(c.vulnerabilityIndex || 0);
    const radarData = SUB_INDICES.map(k => ({
      name: SUB_LABELS[k].replace('Dependence on ', 'Dep. '),
      country: +(c[k] || 0).toFixed(3),
      global: +(subIndexAvg[k] || 0).toFixed(3)
    }));
    const compBars = SUB_INDICES.map(k => ({
      name: SUB_LABELS[k].replace('Dependence on ', ''),
      country: +(c[k] || 0).toFixed(3),
      global: +(subIndexAvg[k] || 0).toFixed(3),
      delta: +((c[k] || 0) - (subIndexAvg[k] || 0)).toFixed(3)
    }));

    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
            style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.card, minWidth: 250 }}>
            {[...countries].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.iso3} value={c.iso3}>{c.name} ({c.iso3})</option>
            ))}
          </select>
          <span style={badgeS(cls.bg, cls.color)}>{cls.label} Vulnerability</span>
          <span style={{ fontSize: 13, color: T.sub }}>Index: <strong style={{ color: T.navy }}>{(c.vulnerabilityIndex || 0).toFixed(4)}</strong></span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { l: 'GDP', usd: c.gdp_kusd * 1000 },
            { l: 'Total Exports', usd: c.totalExports_kusd * 1000 },
            { l: 'Exports to EU', usd: c.exportsToEu_kusd * 1000 },
            { l: 'CBAM Exports', usd: c.cbamExports_kusd * 1000 },
          ].map((k, i) => (
            <div key={i} style={kpiS}>
              <div style={kpiLabel}>{k.l}</div>
              <div style={{ marginTop: 4 }}><CurrencyToggle usdValue={k.usd} size="sm" /></div>
            </div>
          ))}
          {[
            { l: 'CBAM Exports to EU', v: fmtUsd(c.cbamExportsToEu_kusd) },
            { l: 'Emission Intensity', v: (c.emissionsIntensity_kgco2usd || 0).toFixed(4) + ' kgCO2/$' },
            { l: 'Carbon Tax ($/tCO2)', v: (c.carbonTax || 0).toFixed(2) },
            { l: 'ETS', v: c.ets ? 'Yes' : 'No' }
          ].map((k, i) => (
            <div key={i + 4} style={kpiS}>
              <div style={kpiLabel}>{k.l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 4 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={cardS}>
            <div style={secTitle}>Vulnerability Breakdown (vs Global Average)</div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: T.sub }} />
                <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 8 }} />
                <Radar dataKey="country" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} name={c.name || 'Country'} />
                <Radar dataKey="global" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Global Average" />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Country vs Global Average by Sub-Index</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compBars}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.sub }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: T.sub }} />
                <Tooltip {...tip} />
                <Legend />
                <Bar dataKey="country" fill={T.indigo} name={c.name || 'Country'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="global" fill={T.gold} name="Global Average" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Country trade flows */}
        <div style={cardS}>
          <div style={secTitle}>Trade Flows for {c.name}</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {['Commodity', 'Exports ($k)', 'Exports (kg)', 'Direct Emissions (tCO2)', 'Indirect Emissions (tCO2)', 'Total Emissions (tCO2)'].map(h => (
                    <th key={h} style={{ padding: '10px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tradeFlows.filter(f => f.iso3 === c.iso3).map((f, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px', fontWeight: 600, color: T.navy }}>{f.commodity}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(f.exports_kusd)}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(f.exports_kg)}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(f.directEmissions_tco2)}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(f.indirectEmissions_tco2)}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(f.totalEmissions_tco2)}</td>
                  </tr>
                ))}
                {tradeFlows.filter(f => f.iso3 === c.iso3).length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: T.sub }}>No trade flow data for this country</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════ TAB 3: SUB-INDEX DEEP DIVE ═══════════════ */
  const renderSubIndexDeepDive = () => {
    const si = selectedSubIndex;
    const label = SUB_LABELS[si];
    const sorted = [...countries].sort((a, b) => (b[si] || 0) - (a[si] || 0));
    const top25 = sorted.slice(0, 25);
    const avg = countries.length > 0 ? countries.reduce((s, c) => s + (c[si] || 0), 0) / countries.length : 0;
    const max = sorted[0]?.[si] || 0;
    const min = sorted[sorted.length - 1]?.[si] || 0;
    const median = sorted[Math.floor(sorted.length / 2)]?.[si] || 0;

    const histogram = (() => {
      const step = max > 0 ? max / 5 : 0.2;
      const bins = Array.from({ length: 5 }, (_, i) => ({
        label: `${(i * step).toFixed(2)}-${((i + 1) * step).toFixed(2)}`,
        min: i * step, max: (i + 1) * step, count: 0
      }));
      countries.forEach(c => {
        const v = c[si] || 0;
        const b = bins.find(b => v >= b.min && v < b.max) || bins[bins.length - 1];
        b.count++;
      });
      return bins;
    })();

    const scatterData = countries.map(c => ({
      name: c.name, subIndex: +(c[si] || 0).toFixed(4), vi: +c.vulnerabilityIndex.toFixed(4)
    }));

    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {SUB_INDICES.map(k => (
            <button key={k} onClick={() => setSelectedSubIndex(k)}
              style={{ padding: '8px 16px', border: `1px solid ${selectedSubIndex === k ? T.indigo : T.border}`, borderRadius: 8, background: selectedSubIndex === k ? T.indigo : T.card, color: selectedSubIndex === k ? '#fff' : T.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {SUB_LABELS[k]}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { l: 'Global Average', v: avg.toFixed(4) },
            { l: 'Maximum', v: max.toFixed(4) + ` (${sorted[0]?.name || ''})` },
            { l: 'Minimum', v: min.toFixed(4) + ` (${sorted[sorted.length - 1]?.name || ''})` },
            { l: 'Median', v: median.toFixed(4) }
          ].map((k, i) => (
            <div key={i} style={kpiS}>
              <div style={kpiLabel}>{k.l}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginTop: 4 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={cardS}>
            <div style={secTitle}>Top 25 Countries by {label}</div>
            <ResponsiveContainer width="100%" height={520}>
              <BarChart data={top25} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.sub }} />
                <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 10, fill: T.sub }} />
                <Tooltip {...tip} formatter={(v) => [v.toFixed(4), label]} />
                <ReferenceLine x={avg} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Avg', fontSize: 10, fill: T.gold }} />
                <Bar dataKey={si} fill={T.indigo} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardS}>
              <div style={secTitle}>Distribution Histogram</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={histogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: T.sub }} />
                  <YAxis tick={{ fontSize: 10, fill: T.sub }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="count" fill={T.gold} radius={[4, 4, 0, 0]} name="Countries" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardS}>
              <div style={secTitle}>{label} vs Vulnerability Index</div>
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="subIndex" name={label} tick={{ fontSize: 10, fill: T.sub }} />
                  <YAxis dataKey="vi" name="Vulnerability" tick={{ fontSize: 10, fill: T.sub }} />
                  <Tooltip {...tip} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: T.navy }}>{d.name}</div>
                      <div>{label}: {d.subIndex}</div>
                      <div>Vulnerability: {d.vi}</div>
                    </div>;
                  }} />
                  <Scatter data={scatterData} fill={T.navy} fillOpacity={0.5} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════ TAB 4: TRADE FLOW ANALYSIS ═══════════════ */
  const renderTradeFlows = () => {
    const top20 = tradeAgg.slice(0, 20);

    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <select value={commodityFilter} onChange={e => setCommodityFilter(e.target.value)}
            style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.card }}>
            <option value="All">All Commodities</option>
            {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={tradeSort} onChange={e => setTradeSort(e.target.value)}
            style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.card }}>
            <option value="exports_kusd">By Export Value</option>
            <option value="totalEmissions_tco2">By Total Emissions</option>
            <option value="exports_kg">By Volume (kg)</option>
          </select>
          <button onClick={() => setTradeSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.card, cursor: 'pointer' }}>
            {tradeSortDir === 'desc' ? 'Desc' : 'Asc'}
          </button>
          <button onClick={() => exportCSV(tradeAgg.slice(0, 50), 'cbam_trade_flows.csv')}
            style={{ padding: '8px 14px', border: 'none', borderRadius: 8, background: T.gold, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Export CSV
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={cardS}>
            <div style={secTitle}>Top 20 Countries by CBAM Exports</div>
            <ResponsiveContainer width="100%" height={480}>
              <BarChart data={top20} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.sub }} tickFormatter={v => fmt(v)} />
                <YAxis dataKey="name" type="category" width={75} tick={{ fontSize: 10, fill: T.sub }} />
                <Tooltip {...tip} formatter={(v) => [fmt(v), '']} />
                <Legend />
                <Bar dataKey="exports_kusd" fill={T.navy} name="Exports ($k)" radius={[0, 4, 4, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardS}>
              <div style={secTitle}>Commodity Breakdown (Exports)</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={commodityBreakdown} dataKey="exports_kusd" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name.slice(0, 8)} ${(percent * 100).toFixed(0)}%`}>
                    {commodityBreakdown.map((_, i) => <Cell key={i} fill={CC[i % CC.length]} />)}
                  </Pie>
                  <Tooltip {...tip} formatter={(v) => [fmtUsd(v), 'Exports']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={cardS}>
              <div style={secTitle}>Direct vs Indirect Emissions by Commodity</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={commodityBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.sub }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10, fill: T.sub }} tickFormatter={v => fmt(v)} />
                  <Tooltip {...tip} formatter={(v) => [fmt(v) + ' tCO2', '']} />
                  <Legend />
                  <Bar dataKey="directEmissions_tco2" fill={T.navy} name="Direct" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="indirectEmissions_tco2" fill={T.gold} name="Indirect" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed trade table */}
        <div style={cardS}>
          <div style={secTitle}>Detailed Trade Flows ({commodityFilter === 'All' ? 'All Commodities' : commodityFilter})</div>
          <div style={{ overflowX: 'auto', maxHeight: 400 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surface, position: 'sticky', top: 0 }}>
                  {['Country', 'Exports ($k)', 'Volume (kg)', 'Direct Em. (tCO2)', 'Indirect Em.', 'Total Em.'].map(h => (
                    <th key={h} style={{ padding: '10px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tradeAgg.slice(0, 40).map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px', fontWeight: 600, color: T.navy }}>{r.name}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(r.exports_kusd)}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(r.exports_kg)}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(r.directEmissions_tco2)}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(r.indirectEmissions_tco2)}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(r.totalEmissions_tco2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════ TAB 5: CARBON COST SIMULATOR ═══════════════ */
  const renderCostSimulator = () => {
    const c = selCountry;
    const pf = phaseIn.find(p => p.year === phaseYear) || { factor: 1 };
    const countryFlows = tradeFlows.filter(f => f.iso3 === c.iso3);

    const costByCommodity = COMMODITIES.map(comm => {
      const flows = countryFlows.filter(f => f.commodity === comm);
      const totalEm = flows.reduce((s, f) => s + (f.totalEmissions_tco2 || 0), 0);
      const grossCost = totalEm * carbonPrice;
      const netCost = grossCost * pf.factor;
      return { name: comm.length > 10 ? comm.slice(0, 10) + '..' : comm, totalEmissions: +totalEm.toFixed(1), grossCost: +grossCost.toFixed(0), netCost: +netCost.toFixed(0), fullName: comm };
    }).filter(d => d.totalEmissions > 0);

    const phaseTimeline = phaseIn.map(p => {
      const totalEm = countryFlows.reduce((s, f) => s + (f.totalEmissions_tco2 || 0), 0);
      return { year: p.year, factor: +(p.factor * 100).toFixed(1), cost: +(totalEm * carbonPrice * p.factor).toFixed(0) };
    });

    return (
      <div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
            style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.card, minWidth: 220 }}>
            {[...countries].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.iso3} value={c.iso3}>{c.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.sub }}>Carbon Price ($/tCO2):</span>
            <input type="range" min={0} max={200} step={10} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)}
              style={{ width: 180 }} />
            <span style={{ fontWeight: 700, color: T.navy, fontSize: 14, minWidth: 40 }}>${carbonPrice}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.sub }}>Phase-In Year:</span>
            <select value={phaseYear} onChange={e => setPhaseYear(+e.target.value)}
              style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.card }}>
              {phaseIn.map(p => <option key={p.year} value={p.year}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { l: 'Carbon Price', v: `$${carbonPrice}/tCO2` },
            { l: 'Phase-In Factor', v: fmtPct(pf.factor) },
            { l: 'Total Emissions', v: fmt(countryFlows.reduce((s, f) => s + (f.totalEmissions_tco2 || 0), 0)) + ' tCO2' },
            { l: 'Net CBAM Cost', v: '$' + fmt(costByCommodity.reduce((s, d) => s + d.netCost, 0)) }
          ].map((k, i) => (
            <div key={i} style={kpiS}>
              <div style={kpiLabel}>{k.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginTop: 4 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={cardS}>
            <div style={secTitle}>CBAM Cost by Commodity ({c.name})</div>
            {costByCommodity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={costByCommodity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.sub }} />
                  <YAxis tick={{ fontSize: 10, fill: T.sub }} tickFormatter={v => fmt(v)} />
                  <Tooltip {...tip} formatter={(v, n) => ['$' + fmt(v), n]} />
                  <Legend />
                  <Bar dataKey="grossCost" fill={T.navy} name="Gross Cost ($)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netCost" fill={T.gold} name={`Net Cost (${fmtPct(pf.factor)})`} radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: T.sub }}>No CBAM trade flows for {c.name}</div>
            )}
          </div>
          <div style={cardS}>
            <div style={secTitle}>Phase-In Cost Timeline ({c.name} at ${carbonPrice}/tCO2)</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={phaseTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.sub }} />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: T.sub }} tickFormatter={v => fmt(v)} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: T.sub }} unit="%" />
                <Tooltip {...tip} />
                <Legend />
                <Area yAxisId="l" type="monotone" dataKey="cost" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="CBAM Cost ($)" />
                <Line yAxisId="r" type="monotone" dataKey="factor" stroke={T.gold} strokeWidth={2} name="Phase-In %" dot />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost table */}
        {costByCommodity.length > 0 && (
          <div style={cardS}>
            <div style={secTitle}>Detailed Cost Breakdown</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {['Commodity', 'Total Emissions (tCO2)', 'Gross Cost ($)', `Net Cost (${fmtPct(pf.factor)})`, 'Share of Total'].map(h => (
                    <th key={h} style={{ padding: '10px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {costByCommodity.map((d, i) => {
                  const totalNet = costByCommodity.reduce((s, x) => s + x.netCost, 0) || 1;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: T.navy }}>{d.fullName}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(d.totalEmissions)}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace' }}>${fmt(d.grossCost)}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace', color: T.red }}>${fmt(d.netCost)}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace' }}>{((d.netCost / totalNet) * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════ TAB 6: EC DEFAULT VALUES ═══════════════ */
  const renderDefaultValues = () => {
    const doSort = col => {
      if (dvSort === col) setDvSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setDvSort(col); setDvSortDir('desc'); }
      setDvPage(0);
    };

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { l: 'Total CN Codes', v: defaultValues.length },
            { l: 'Product Groups', v: productGroups.length },
            { l: 'Filtered Results', v: filteredDV.length }
          ].map((k, i) => (
            <div key={i} style={kpiS}>
              <div style={kpiLabel}>{k.l}</div>
              <div style={kpiVal}>{k.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={cardS}>
            <div style={secTitle}>Average Default Values by Product Group</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dvByGroup}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.sub }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: T.sub }} />
                <Tooltip {...tip} />
                <Legend />
                <Bar dataKey="avgDirect" fill={T.navy} name="Avg Direct (tCO2e/t)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgIndirect" fill={T.gold} name="Avg Indirect (tCO2e/t)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={secTitle}>CN Codes by Product Group</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={dvByGroup} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {dvByGroup.map((_, i) => <Cell key={i} fill={CC[i % CC.length]} />)}
                </Pie>
                <Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Searchable table */}
        <div style={cardS}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <input value={dvSearch} onChange={e => { setDvSearch(e.target.value); setDvPage(0); }}
              placeholder="Search CN code or product group..."
              style={{ flex: 1, padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.surface }} />
            <button onClick={() => exportCSV(filteredDV, 'cbam_default_values.csv')}
              style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: T.gold, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Export CSV
            </button>
          </div>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>{filteredDV.length} records | Page {dvPage + 1}/{dvTotalPages}</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {[
                    { col: 'cnCode', label: 'CN Code', w: 120 },
                    { col: 'productGroup', label: 'Product Group', w: 130 },
                    { col: 'directDefault', label: 'Direct Default', w: 120 },
                    { col: 'indirectDefault', label: 'Indirect Default', w: 120 },
                    { col: 'unit', label: 'Unit', w: 200 }
                  ].map(h => (
                    <th key={h.col} onClick={() => doSort(h.col)} style={{ cursor: 'pointer', padding: '10px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.sub, width: h.w, userSelect: 'none' }}>
                      {h.label}{dvSort === h.col ? (dvSortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dvPaged.map((v, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px', fontFamily: 'monospace', color: T.navy, fontWeight: 600 }}>{v.cnCode}</td>
                    <td style={{ padding: '8px' }}>{v.productGroup}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', color: v.directDefault > 1 ? T.red : T.text }}>{v.directDefault.toFixed(3)}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', color: v.indirectDefault > 0.5 ? T.amber : T.text }}>{v.indirectDefault.toFixed(3)}</td>
                    <td style={{ padding: '8px', fontSize: 11, color: T.sub }}>{v.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
            <button onClick={() => setDvPage(p => Math.max(0, p - 1))} disabled={dvPage === 0}
              style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, cursor: dvPage === 0 ? 'default' : 'pointer', opacity: dvPage === 0 ? 0.4 : 1, fontSize: 12 }}>Prev</button>
            <span style={{ padding: '6px 12px', fontSize: 12, color: T.sub }}>{dvPage + 1} / {dvTotalPages}</span>
            <button onClick={() => setDvPage(p => Math.min(dvTotalPages - 1, p + 1))} disabled={dvPage >= dvTotalPages - 1}
              style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, cursor: dvPage >= dvTotalPages - 1 ? 'default' : 'pointer', opacity: dvPage >= dvTotalPages - 1 ? 0.4 : 1, fontSize: 12 }}>Next</button>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════ TAB 7: PHASE-IN TIMELINE ═══════════════ */
  const renderPhaseIn = () => {
    const totalGlobalEmissions = tradeFlows.reduce((s, f) => s + (f.totalEmissions_tco2 || 0), 0);
    const selFlows = tradeFlows.filter(f => f.iso3 === selectedCountry);
    const selEmissions = selFlows.reduce((s, f) => s + (f.totalEmissions_tco2 || 0), 0);

    const globalTimeline = phaseIn.map(p => ({
      year: p.year,
      factorPct: +(p.factor * 100).toFixed(1),
      globalRevenue: +(totalGlobalEmissions * carbonPrice * p.factor / 1e6).toFixed(2),
      countryRevenue: +(selEmissions * carbonPrice * p.factor / 1e6).toFixed(4)
    }));

    return (
      <div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.sub }}>Carbon Price:</span>
            <input type="range" min={0} max={200} step={10} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 160 }} />
            <span style={{ fontWeight: 700, color: T.navy }}>${carbonPrice}/tCO2</span>
          </div>
          <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
            style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.card }}>
            {[...countries].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.iso3} value={c.iso3}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { l: 'Global CBAM Emissions', v: fmt(totalGlobalEmissions) + ' tCO2' },
            { l: `${selCountry.name || ''} Emissions`, v: fmt(selEmissions) + ' tCO2' },
            { l: 'Est. 2034 Global Revenue', v: '$' + fmt(totalGlobalEmissions * carbonPrice / 1e6) + 'M' }
          ].map((k, i) => (
            <div key={i} style={kpiS}>
              <div style={kpiLabel}>{k.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginTop: 4 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={cardS}>
            <div style={secTitle}>CBAM Phase-In Factor (2026-2034)</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={globalTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.sub }} />
                <YAxis tick={{ fontSize: 10, fill: T.sub }} unit="%" />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="factorPct" stroke={T.indigo} fill={T.indigo} fillOpacity={0.2} name="Phase-In Factor %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={cardS}>
            <div style={secTitle}>Estimated Revenue at ${carbonPrice}/tCO2</div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={globalTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.sub }} />
                <YAxis tick={{ fontSize: 10, fill: T.sub }} />
                <Tooltip {...tip} formatter={(v, n) => [n.includes('Global') ? '$' + v + 'M' : '$' + v + 'M', n]} />
                <Legend />
                <Area type="monotone" dataKey="globalRevenue" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Global Revenue ($M)" />
                <Line type="monotone" dataKey="countryRevenue" stroke={T.gold} strokeWidth={2} name={`${selCountry.name || ''} Revenue ($M)`} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milestone cards */}
        <div style={cardS}>
          <div style={secTitle}>Phase-In Milestones</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {phaseIn.map((p, i) => (
              <div key={p.year} style={{ border: `1px solid ${p.year <= 2028 ? T.border : p.year <= 2031 ? '#fbbf24' : T.indigo}`, borderRadius: 8, padding: 14, background: p.factor === 1 ? '#eef2ff' : T.card }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>{p.year}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.indigo, margin: '4px 0' }}>{(p.factor * 100).toFixed(1)}% Phase-In</div>
                <div style={{ fontSize: 11, color: T.sub }}>
                  Global cost: ${(totalGlobalEmissions * carbonPrice * p.factor / 1e6).toFixed(1)}M
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>
                  {p.year === 2026 ? 'Transitional period begins' : p.year === 2034 ? 'Full implementation' : p.year === 2030 ? 'Near 50% threshold' : `Year ${i + 1} of CBAM`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════ TAB 8: COUNTRY COMPARISON ═══════════════ */
  const renderComparison = () => {
    const toggleCountry = iso => {
      setCompareCountries(prev => {
        if (prev.includes(iso)) return prev.filter(x => x !== iso);
        if (prev.length >= 5) return prev;
        return [...prev, iso];
      });
    };

    const compCountryData = compareCountries.map(iso => countryMap[iso]).filter(Boolean);

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>Select up to 5 countries to compare:</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select onChange={e => { if (e.target.value) toggleCountry(e.target.value); e.target.value = ''; }}
              style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.card, minWidth: 220 }}>
              <option value="">Add country...</option>
              {[...countries].sort((a, b) => a.name.localeCompare(b.name)).filter(c => !compareCountries.includes(c.iso3)).map(c => (
                <option key={c.iso3} value={c.iso3}>{c.name}</option>
              ))}
            </select>
            {compCountryData.map((c, i) => (
              <span key={c.iso3} onClick={() => toggleCountry(c.iso3)}
                style={{ ...badgeS(CC[i % CC.length] + '22', CC[i % CC.length]), cursor: 'pointer', border: `1px solid ${CC[i % CC.length]}` }}>
                {c.name} x
              </span>
            ))}
          </div>
        </div>

        {compCountryData.length === 0 ? (
          <div style={{ ...cardS, textAlign: 'center', padding: 60, color: T.sub }}>Select countries above to begin comparison</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={cardS}>
                <div style={secTitle}>Sub-Index Comparison</div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={compData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.sub }} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10, fill: T.sub }} />
                    <Tooltip {...tip} />
                    <Legend />
                    {compCountryData.map((c, i) => (
                      <Bar key={c.iso3} dataKey={c.name} fill={CC[i % CC.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={cardS}>
                <div style={secTitle}>Radar Overlay</div>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={compData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: T.sub }} />
                    <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 8 }} />
                    {compCountryData.map((c, i) => (
                      <Radar key={c.iso3} dataKey={c.name} stroke={CC[i % CC.length]} fill={CC[i % CC.length]} fillOpacity={0.1} />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparison table */}
            <div style={cardS}>
              <div style={secTitle}>Detailed Metrics Comparison</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surface }}>
                      <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.sub }}>Metric</th>
                      {compCountryData.map((c, i) => (
                        <th key={c.iso3} style={{ padding: '10px 8px', textAlign: 'right', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: CC[i % CC.length] }}>{c.name}</th>
                      ))}
                      <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.sub }}>Global Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Vulnerability Index', key: 'vulnerabilityIndex', avg: avgVuln },
                      ...SUB_INDICES.map(k => ({ label: SUB_LABELS[k], key: k, avg: subIndexAvg[k] || 0 })),
                      { label: 'GDP ($k)', key: 'gdp_kusd', avg: countries.reduce((s, c) => s + c.gdp_kusd, 0) / (countries.length || 1), isCurrency: true },
                      { label: 'Emission Intensity', key: 'emissionsIntensity_kgco2usd', avg: avgEI },
                      { label: 'Carbon Tax', key: 'carbonTax', avg: countries.reduce((s, c) => s + c.carbonTax, 0) / (countries.length || 1) },
                      { label: 'CBAM Exports ($k)', key: 'cbamExports_kusd', avg: countries.reduce((s, c) => s + c.cbamExports_kusd, 0) / (countries.length || 1), isCurrency: true }
                    ].map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px', fontWeight: 600, color: T.navy }}>{row.label}</td>
                        {compCountryData.map(c => (
                          <td key={c.iso3} style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>
                            {row.isCurrency ? fmtUsd(c[row.key]) : (c[row.key] || 0).toFixed(4)}
                          </td>
                        ))}
                        <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace', color: T.sub }}>
                          {row.isCurrency ? fmtUsd(row.avg) : row.avg.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  /* ═══════════════ TAB 9: EMISSION INTENSITY ANALYSIS ═══════════════ */
  const renderEmissionIntensity = () => {
    const sortedEI = [...countries].sort((a, b) => b.emissionsIntensity_kgco2usd - a.emissionsIntensity_kgco2usd);
    const top30 = sortedEI.slice(0, 30);

    const commodityEI = Object.entries(commodityPrices).map(([name, data]) => ({
      name: name.length > 10 ? name.slice(0, 10) + '..' : name,
      fullName: name,
      direct: data.directEI || 0,
      indirect: data.indirectEI || 0,
      total: (data.directEI || 0) + (data.indirectEI || 0)
    }));

    const eiCorrelation = countries.map(c => ({
      name: c.name,
      emissionIntensity: +c.emissionsIntensity_kgco2usd.toFixed(4),
      vi: +c.vulnerabilityIndex.toFixed(4)
    }));

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { l: 'Avg Emission Intensity', v: avgEI.toFixed(4) + ' kg/$' },
            { l: 'Most Intensive', v: sortedEI[0]?.name || '' },
            { l: 'Least Intensive', v: sortedEI[sortedEI.length - 1]?.name || '' },
            { l: 'Countries w/ Carbon Tax', v: countries.filter(c => c.carbonTax > 0).length }
          ].map((k, i) => (
            <div key={i} style={kpiS}>
              <div style={kpiLabel}>{k.l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 4 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={cardS}>
            <div style={secTitle}>Top 30 Most Emission-Intensive Countries</div>
            <ResponsiveContainer width="100%" height={600}>
              <BarChart data={top30} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.sub }} />
                <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 10, fill: T.sub }} />
                <Tooltip {...tip} formatter={(v) => [v.toFixed(4) + ' kgCO2/$', 'Intensity']} />
                <ReferenceLine x={avgEI} stroke={T.gold} strokeDasharray="4 4" />
                <Bar dataKey="emissionsIntensity_kgco2usd" radius={[0, 4, 4, 0]}>
                  {top30.map((c, i) => <Cell key={i} fill={c.emissionsIntensity_kgco2usd > 0.3 ? T.red : c.emissionsIntensity_kgco2usd > 0.2 ? T.amber : T.navy} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardS}>
              <div style={secTitle}>Carbon Pricing Coverage</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={carbonPricingPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {carbonPricingPie.map((_, i) => <Cell key={i} fill={[T.green, T.indigo, T.navy, '#d1d5db'][i]} />)}
                  </Pie>
                  <Tooltip {...tip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={cardS}>
              <div style={secTitle}>Commodity Emission Intensity (kgCO2/kg)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={commodityEI}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.sub }} />
                  <YAxis tick={{ fontSize: 10, fill: T.sub }} />
                  <Tooltip {...tip} formatter={(v, n) => [v.toFixed(3) + ' kgCO2/kg', n]} />
                  <Legend />
                  <Bar dataKey="direct" fill={T.navy} name="Direct EI" stackId="a" />
                  <Bar dataKey="indirect" fill={T.gold} name="Indirect EI" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={cardS}>
          <div style={secTitle}>Emission Intensity vs Vulnerability Index</div>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="emissionIntensity" name="Emission Intensity" tick={{ fontSize: 10, fill: T.sub }} label={{ value: 'Emission Intensity (kgCO2/$)', position: 'bottom', fontSize: 11 }} />
              <YAxis dataKey="vi" name="Vulnerability Index" tick={{ fontSize: 10, fill: T.sub }} label={{ value: 'Vulnerability Index', angle: -90, position: 'left', fontSize: 11 }} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: T.navy }}>{d.name}</div>
                  <div>EI: {d.emissionIntensity} kgCO2/$</div>
                  <div>VI: {d.vi}</div>
                </div>;
              }} />
              <Scatter data={eiCorrelation} fill={T.indigo} fillOpacity={0.5} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ═══════════════ TAB 10: RISK & OPPORTUNITY MATRIX ═══════════════ */
  const renderRiskOpportunity = () => {
    const medianVI = sortedByVuln[Math.floor(sortedByVuln.length / 2)]?.vulnerabilityIndex || 0.25;
    const exposures = riskOppData.map(d => d.tradeExposure).filter(v => v > 0);
    const medianExposure = exposures.length > 0 ? [...exposures].sort((a, b) => a - b)[Math.floor(exposures.length / 2)] : 0.5;

    const quadrants = {
      highRiskHighExp: riskOppData.filter(d => d.vi >= medianVI && d.tradeExposure >= medianExposure),
      highRiskLowExp: riskOppData.filter(d => d.vi >= medianVI && d.tradeExposure < medianExposure),
      lowRiskHighExp: riskOppData.filter(d => d.vi < medianVI && d.tradeExposure >= medianExposure),
      lowRiskLowExp: riskOppData.filter(d => d.vi < medianVI && d.tradeExposure < medianExposure)
    };

    const opportunities = riskOppData
      .filter(d => d.vi < medianVI && d.cbamExports > 100000)
      .sort((a, b) => b.cbamExports - a.cbamExports)
      .slice(0, 10);

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { l: 'High Risk / High Exposure', v: quadrants.highRiskHighExp.length, c: T.red },
            { l: 'High Risk / Low Exposure', v: quadrants.highRiskLowExp.length, c: T.amber },
            { l: 'Low Risk / High Exposure', v: quadrants.lowRiskHighExp.length, c: T.green },
            { l: 'Low Risk / Low Exposure', v: quadrants.lowRiskLowExp.length, c: T.indigo }
          ].map((k, i) => (
            <div key={i} style={{ ...kpiS, borderLeft: `4px solid ${k.c}` }}>
              <div style={kpiLabel}>{k.l}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.c, marginTop: 4 }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={cardS}>
            <div style={secTitle}>Risk-Opportunity Matrix (Vulnerability vs Trade Exposure)</div>
            <ResponsiveContainer width="100%" height={450}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="vi" name="Vulnerability" tick={{ fontSize: 10, fill: T.sub }} domain={[0, 0.6]}
                  label={{ value: 'Vulnerability Index', position: 'bottom', fontSize: 11 }} />
                <YAxis dataKey="tradeExposure" name="Trade Exposure" tick={{ fontSize: 10, fill: T.sub }}
                  label={{ value: 'CBAM Exports / GDP (%)', angle: -90, position: 'left', fontSize: 11 }} />
                <ReferenceLine x={medianVI} stroke={T.sub} strokeDasharray="4 4" />
                <ReferenceLine y={medianExposure} stroke={T.sub} strokeDasharray="4 4" />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: T.navy }}>{d.name}</div>
                    <div>Vulnerability: {d.vi}</div>
                    <div>Trade Exposure: {d.tradeExposure.toFixed(4)}%</div>
                    <div>Carbon Pricing: {d.hasPricing ? 'Yes' : 'No'}</div>
                    <div>CBAM Exports: ${fmt(d.cbamExports * 1000)}</div>
                  </div>;
                }} />
                <Scatter data={riskOppData.filter(d => d.hasPricing === 1)} fill={T.green} fillOpacity={0.6} name="Has Carbon Pricing" />
                <Scatter data={riskOppData.filter(d => d.hasPricing === 0)} fill={T.red} fillOpacity={0.4} name="No Carbon Pricing" />
                <Legend />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardS}>
              <div style={secTitle}>Quadrant Summary</div>
              {[
                { q: 'High Risk / High Exp.', data: quadrants.highRiskHighExp, color: T.red, desc: 'Most exposed to CBAM costs' },
                { q: 'High Risk / Low Exp.', data: quadrants.highRiskLowExp, color: T.amber, desc: 'Vulnerable but limited trade' },
                { q: 'Low Risk / High Exp.', data: quadrants.lowRiskHighExp, color: T.green, desc: 'Competitive advantage potential' },
                { q: 'Low Risk / Low Exp.', data: quadrants.lowRiskLowExp, color: T.indigo, desc: 'Minimal CBAM impact' }
              ].map((q, i) => (
                <div key={i} style={{ padding: '10px 14px', borderLeft: `3px solid ${q.color}`, background: T.surface, borderRadius: 4, marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: q.color }}>{q.q} ({q.data.length})</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{q.desc}</div>
                  <div style={{ fontSize: 11, color: T.text, marginTop: 2 }}>
                    {q.data.slice(0, 3).map(d => d.name).join(', ')}{q.data.length > 3 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Opportunities */}
        <div style={cardS}>
          <div style={secTitle}>Competitive Advantage Opportunities (Low Vulnerability + High CBAM Exports)</div>
          {opportunities.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surface }}>
                    {['Country', 'Vulnerability', 'CBAM Exports ($k)', 'Carbon Pricing', 'Emission Intensity', 'Assessment'].map(h => (
                      <th key={h} style={{ padding: '10px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.sub }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((d, i) => {
                    const c = countryMap[d.iso3] || {};
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px', fontWeight: 600, color: T.navy }}>{d.name}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{d.vi.toFixed(4)}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(d.cbamExports)}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={badgeS(d.hasPricing ? '#d1fae5' : '#fee2e2', d.hasPricing ? T.green : T.red)}>
                            {d.hasPricing ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(c.emissionsIntensity_kgco2usd || 0).toFixed(4)}</td>
                        <td style={{ padding: '8px', fontSize: 11, color: T.green }}>Potential competitive advantage</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: T.sub }}>No clear opportunities identified with current thresholds</div>
          )}
        </div>
      </div>
    );
  };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.surface, minHeight: '100vh', padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: T.sub, textTransform: 'uppercase', letterSpacing: 1 }}>Carbon Border Adjustment Mechanism</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: '4px 0 0' }}>CBAM Vulnerability Monitor</h1>
          <div style={{ width: 40, height: 3, background: T.gold, borderRadius: 2, marginTop: 6 }} />
        </div>
        <ReportExporter title="CBAM Vulnerability Monitor" subtitle={`${countries.length} countries assessed`} framework="EU CBAM" sections={[{type:'kpis',title:'Overview',data:[{label:'Countries',value:countries.length},{label:'Avg Vulnerability',value:avgVuln.toFixed(3)},{label:'Most Vulnerable',value:sortedByVuln[0]?.name||'-'}]}]} />
      </div>

      {/* Global filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search countries..."
          style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.card, minWidth: 220 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.sub }}>Min Vulnerability:</span>
          <input type="range" min={0} max={0.5} step={0.05} value={vulnThreshold} onChange={e => setVulnThreshold(+e.target.value)} style={{ width: 120 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{vulnThreshold.toFixed(2)}</span>
        </div>
        <span style={{ fontSize: 12, color: T.sub }}>{filteredCountries.length} of {countries.length} countries</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `2px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '10px 16px', border: 'none', borderBottom: tab === i ? `3px solid ${T.gold}` : '3px solid transparent', background: 'transparent', color: tab === i ? T.navy : T.sub, fontWeight: tab === i ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && renderDashboard()}
      {tab === 1 && renderCountryExplorer()}
      {tab === 2 && renderSubIndexDeepDive()}
      {tab === 3 && renderTradeFlows()}
      {tab === 4 && renderCostSimulator()}
      {tab === 5 && renderDefaultValues()}
      {tab === 6 && renderPhaseIn()}
      {tab === 7 && renderComparison()}
      {tab === 8 && renderEmissionIntensity()}
      {tab === 9 && renderRiskOpportunity()}
    </div>
  );
}
