/**
 * CedaEmissionFactorsPage — CEDA 2025 Emission Factor Explorer
 *
 * 10-tab interactive module for exploring the Comprehensive Environmental
 * Data Archive (CEDA) 2025 dataset. Uses CedaContext exclusively for all
 * data access. No direct JSON import, no non-deterministic PRNG, no axios.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  ComposedChart, ScatterChart, Scatter, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, ReferenceLine, Tooltip, Legend,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { useCeda } from '../../../contexts/CedaContext';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TABS = [
  'CEDA Dashboard', 'Country Explorer', 'Sector Explorer',
  'Country Comparison', 'Sector Comparison', 'Industry Group Heatmap',
  'Regional Analysis', 'Spend-Based Calculator',
  'Currency & Price Adjustment', 'Data Quality & Coverage',
];

const PALETTE = [T.navy, T.indigo, T.green, T.gold, T.red, T.amber, '#6366f1', '#059669'];

/* ------------------------------------------------------------------ */
/*  Shared UI helpers                                                 */
/* ------------------------------------------------------------------ */
const cardStyle = {
  background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
  padding: 16, marginBottom: 12,
};
const kpiStyle = {
  ...cardStyle, textAlign: 'center', flex: '1 1 160px', minWidth: 140,
};
const labelStyle = { fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5 };
const valStyle = { fontSize: 22, fontWeight: 700, color: T.navy, margin: '6px 0 2px' };
const inputStyle = {
  padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6,
  fontSize: 13, width: '100%', boxSizing: 'border-box',
};
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const btnStyle = {
  padding: '8px 18px', background: T.navy, color: '#fff', border: 'none',
  borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
};

function Kpi({ label, value, sub: subText }) {
  return (
    <div style={kpiStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valStyle}>{value}</div>
      {subText && <div style={{ fontSize: 11, color: T.sub }}>{subText}</div>}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      style={inputStyle}
      placeholder={placeholder || 'Search...'}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

const fmt = v => v === null || v === undefined ? '--' : typeof v === 'number' ? v.toFixed(4) : v;
const fmtK = v => {
  if (v === null || v === undefined) return '--';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(2);
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
export default function CedaEmissionFactorsPage() {
  const ceda = useCeda();
  const [tab, setTab] = useState(0);

  /* shared state */
  const [countrySearch, setCountrySearch] = useState('');
  const [sectorSearch, setSectorSearch] = useState('');
  const [selCountry, setSelCountry] = useState('USA');
  const [selSector, setSelSector] = useState('221100');
  const [compCountries, setCompCountries] = useState(['USA', 'CHN', 'IND', 'DEU', 'BRA']);
  const [compSectors, setCompSectors] = useState(['221100', '211000', '324110', '327310', '331110']);
  const [selGroup, setSelGroup] = useState('22');
  const [selRegion, setSelRegion] = useState('Northern America');
  const [calcCountry, setCalcCountry] = useState('USA');
  const [calcSector, setCalcSector] = useState('221100');
  const [calcSpend, setCalcSpend] = useState(1000000);
  const [calcLines, setCalcLines] = useState([]);
  const [fxYear, setFxYear] = useState(2025);
  const [sortCol, setSortCol] = useState('ef');
  const [sortDir, setSortDir] = useState('desc');
  const [convAmount, setConvAmount] = useState(1000);
  const [convCountry, setConvCountry] = useState('GBR');

  /* derived data: all country EFs for a sector */
  const allCountryEFs = useMemo(() => {
    return ceda.countries.map(c => {
      const ef = ceda.getEmissionFactor(c.code, selSector);
      return { code: c.code, name: c.name, ef: ef || 0, region: ceda.getCountryRegion(c.code) || '' };
    });
  }, [ceda, selSector]);

  /* derived: all sector EFs for a country */
  const allSectorEFs = useMemo(() => {
    const efs = ceda.countryEFMap[selCountry];
    if (!efs) return [];
    return Object.entries(efs).map(([code, ef]) => ({
      code, name: (ceda.sectorMap[code] || {}).name || code, ef,
      group: code.slice(0, 2),
    }));
  }, [ceda, selCountry]);

  /* global avg EF */
  const globalAvgEF = useMemo(() => {
    let sum = 0, cnt = 0;
    ceda.countries.forEach(c => {
      Object.values(c.code ? ceda.countryEFMap[c.code] || {} : {}).forEach(v => { sum += v; cnt++; });
    });
    return cnt > 0 ? sum / cnt : 0;
  }, [ceda]);

  /* sort helper */
  const doSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const sorted = useCallback((arr, col) => {
    return [...arr].sort((a, b) => {
      const va = a[col], vb = b[col];
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [sortDir]);

  /* ================================================================ */
  /*  TAB 0 — CEDA Dashboard                                         */
  /* ================================================================ */
  const renderDashboard = () => {
    const topSectors = [...allCountryEFs].length > 0
      ? ceda.sectors.map(s => {
          let sum = 0, cnt = 0;
          ceda.countries.forEach(c => {
            const ef = ceda.getEmissionFactor(c.code, s.code);
            if (ef !== null) { sum += ef; cnt++; }
          });
          return { code: s.code, name: s.name, avgEF: cnt > 0 ? sum / cnt : 0 };
        }).sort((a, b) => b.avgEF - a.avgEF).slice(0, 20)
      : [];

    /* histogram: distribute all EFs into buckets */
    const buckets = Array(20).fill(0);
    const maxBucket = 15; // kgCO2e/USD
    ceda.countries.forEach(c => {
      Object.values(ceda.countryEFMap[c.code] || {}).forEach(ef => {
        const idx = Math.min(19, Math.floor(ef / maxBucket * 20));
        buckets[idx]++;
      });
    });
    const histData = buckets.map((count, i) => ({
      range: `${(i * maxBucket / 20).toFixed(1)}-${((i + 1) * maxBucket / 20).toFixed(1)}`,
      count,
    }));

    /* highest / lowest EF country (avg across all sectors) */
    const countryAvgs = ceda.countries.map(c => {
      const efs = Object.values(ceda.countryEFMap[c.code] || {});
      const avg = efs.length > 0 ? efs.reduce((a, b) => a + b, 0) / efs.length : 0;
      return { code: c.code, name: c.name, avg };
    });
    const highest = [...countryAvgs].sort((a, b) => b.avg - a.avg)[0] || { name: '--', avg: 0 };
    const lowest = [...countryAvgs].filter(c => c.avg > 0).sort((a, b) => a.avg - b.avg)[0] || { name: '--', avg: 0 };

    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Kpi label="Total Sectors" value={ceda.stats.totalSectors} />
          <Kpi label="Total Countries" value={ceda.stats.totalCountries} />
          <Kpi label="Total Regions" value={ceda.stats.totalRegions} />
          <Kpi label="Global Avg EF" value={globalAvgEF.toFixed(4)} sub="kgCO2e/USD" />
          <Kpi label="Highest EF Country" value={highest.name} sub={`${highest.avg.toFixed(4)} avg`} />
          <Kpi label="Lowest EF Country" value={lowest.name} sub={`${lowest.avg.toFixed(4)} avg`} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Global EF Distribution (kgCO2e/USD)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill={T.indigo} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Top 20 High-Intensity Sectors (Global Avg)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topSectors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => v.toFixed(4)} />
                <Bar dataKey="avgEF" fill={T.gold} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>CEDA Dataset Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 13, color: T.sub }}>
            <div><strong>Source:</strong> Open CEDA 2025</div>
            <div><strong>Version:</strong> {ceda.version}</div>
            <div><strong>Unit:</strong> kgCO2e per USD spent</div>
            <div><strong>Sector Granularity:</strong> NAICS 6-digit</div>
            <div><strong>Coverage:</strong> {ceda.stats.totalCountries} countries, {ceda.stats.totalSectors} sectors</div>
            <div><strong>Currency Base:</strong> 2022 USD (purchaser prices)</div>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  TAB 1 — Country Explorer                                       */
  /* ================================================================ */
  const renderCountryExplorer = () => {
    const filteredCountries = ceda.searchCountries(countrySearch);
    const topSectors = ceda.getTopSectors(selCountry, 30);
    const allEFs = allSectorEFs;
    const avg = allEFs.length > 0 ? allEFs.reduce((s, e) => s + e.ef, 0) / allEFs.length : 0;
    const median = (() => {
      const s = [...allEFs].sort((a, b) => a.ef - b.ef);
      return s.length > 0 ? s[Math.floor(s.length / 2)].ef : 0;
    })();
    const mostIntensive = topSectors[0] || { name: '--', ef: 0 };
    const leastIntensive = allEFs.length > 0 ? [...allEFs].sort((a, b) => a.ef - b.ef)[0] : { name: '--', ef: 0 };
    const region = ceda.getCountryRegion(selCountry) || '--';

    /* regional avg for overlay */
    const regAvgs = {};
    if (region !== '--') {
      topSectors.forEach(s => {
        const ref = ceda.getRegionalEF(region, s.code);
        regAvgs[s.code] = ref;
      });
    }
    const chartData = topSectors.map(s => ({
      name: s.name.length > 25 ? s.name.slice(0, 22) + '...' : s.name,
      ef: s.ef, regional: regAvgs[s.code] || 0,
    }));

    /* sortable table */
    const tableData = sorted(
      (sectorSearch ? allEFs.filter(s => s.name.toLowerCase().includes(sectorSearch.toLowerCase())) : allEFs),
      sortCol,
    );

    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Select Country</label>
            <select style={selectStyle} value={selCountry} onChange={e => setSelCountry(e.target.value)}>
              {filteredCountries.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Search Countries</label>
            <SearchInput value={countrySearch} onChange={setCountrySearch} placeholder="Filter countries..." />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Kpi label="Avg EF" value={avg.toFixed(4)} sub="kgCO2e/USD" />
          <Kpi label="Median EF" value={median.toFixed(4)} />
          <Kpi label="Most Intensive" value={mostIntensive.name} sub={fmt(mostIntensive.ef)} />
          <Kpi label="Least Intensive" value={leastIntensive.name} sub={fmt(leastIntensive.ef)} />
          <Kpi label="Region" value={region} />
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            Top 30 Sectors by EF for {ceda.countryNameMap[selCountry] || selCountry}
            <span style={{ fontSize: 11, color: T.sub, marginLeft: 8 }}>(orange = regional avg)</span>
          </div>
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={200} tick={{ fontSize: 9 }} />
              <Tooltip formatter={v => v.toFixed(4)} />
              <Legend />
              <Bar dataKey="ef" name="Country EF" fill={T.navy} radius={[0, 3, 3, 0]} />
              <Bar dataKey="regional" name="Regional Avg" fill={T.gold} radius={[0, 3, 3, 0]} opacity={0.6} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, color: T.navy }}>Full Sector EF Table ({tableData.length} sectors)</div>
            <SearchInput value={sectorSearch} onChange={setSectorSearch} placeholder="Search sectors..." />
          </div>
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surface, position: 'sticky', top: 0 }}>
                  <th style={{ padding: 6, cursor: 'pointer', textAlign: 'left' }} onClick={() => doSort('code')}>Code</th>
                  <th style={{ padding: 6, cursor: 'pointer', textAlign: 'left' }} onClick={() => doSort('name')}>Sector Name</th>
                  <th style={{ padding: 6, cursor: 'pointer', textAlign: 'right' }} onClick={() => doSort('ef')}>EF (kgCO2e/USD)</th>
                  <th style={{ padding: 6, textAlign: 'left' }}>Group</th>
                </tr>
              </thead>
              <tbody>
                {tableData.slice(0, 200).map((s, i) => (
                  <tr key={s.code} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : T.surface }}>
                    <td style={{ padding: 6, fontFamily: 'monospace', fontSize: 11 }}>{s.code}</td>
                    <td style={{ padding: 6 }}>{s.name}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontWeight: 600 }}>{s.ef.toFixed(6)}</td>
                    <td style={{ padding: 6, fontSize: 11, color: T.sub }}>{ceda.industryGroups[s.group] || s.group}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  TAB 2 — Sector Explorer                                        */
  /* ================================================================ */
  const renderSectorExplorer = () => {
    const sectorInfo = ceda.sectorMap[selSector] || { code: selSector, name: '--', desc: '' };
    const topCountries = ceda.getTopEmitters(selSector, 30);
    const allEFs = allCountryEFs.filter(c => c.ef > 0);
    const globalAvg = allEFs.length > 0 ? allEFs.reduce((s, c) => s + c.ef, 0) / allEFs.length : 0;

    /* distribution histogram for this sector */
    const buckets = Array(15).fill(0);
    const maxB = Math.max(...allEFs.map(c => c.ef), 1);
    allEFs.forEach(c => {
      const idx = Math.min(14, Math.floor(c.ef / maxB * 15));
      buckets[idx]++;
    });
    const histData = buckets.map((count, i) => ({
      range: `${(i * maxB / 15).toFixed(2)}-${((i + 1) * maxB / 15).toFixed(2)}`,
      count,
    }));

    /* regional averages for this sector */
    const regData = ceda.regions.map(r => {
      const ef = ceda.getRegionalEF(r, selSector);
      return { region: r.length > 18 ? r.slice(0, 15) + '...' : r, ef: ef || 0 };
    }).filter(r => r.ef > 0).sort((a, b) => b.ef - a.ef);

    /* searchable sector list */
    const groupKeys = Object.keys(ceda.sectorGroups);
    const filteredSectors = ceda.searchSectors(sectorSearch);

    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Select Sector</label>
            <select style={selectStyle} value={selSector} onChange={e => setSelSector(e.target.value)}>
              {groupKeys.map(gk => (
                <optgroup key={gk} label={ceda.industryGroups[gk] || gk}>
                  {(ceda.sectorGroups[gk]?.sectors || []).map(sc => {
                    const s = ceda.sectorMap[sc];
                    return s ? <option key={sc} value={sc}>{s.name} ({sc})</option> : null;
                  })}
                </optgroup>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Search Sectors</label>
            <SearchInput value={sectorSearch} onChange={setSectorSearch} placeholder="Search..." />
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, fontSize: 15 }}>{sectorInfo.name}</div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{sectorInfo.desc}</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 13 }}>
            <span><strong>Code:</strong> {sectorInfo.code}</span>
            <span><strong>Global Avg EF:</strong> {globalAvg.toFixed(6)} kgCO2e/USD</span>
            <span><strong>Countries with data:</strong> {allEFs.length}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Top 30 Countries by EF</div>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={topCountries} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toFixed(6)} />
                <ReferenceLine x={globalAvg} stroke={T.red} strokeDasharray="5 5" label={{ value: 'Global Avg', fontSize: 10 }} />
                <Bar dataKey="ef" fill={T.indigo} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <div style={cardStyle}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>EF Distribution Across Countries</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={histData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardStyle}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Regional Averages</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={regData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="region" type="category" width={130} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={v => v.toFixed(6)} />
                  <Bar dataKey="ef" fill={T.gold} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  TAB 3 — Country Comparison                                     */
  /* ================================================================ */
  const renderCountryComparison = () => {
    const toggleCountry = (code) => {
      setCompCountries(prev => {
        if (prev.includes(code)) return prev.filter(c => c !== code);
        if (prev.length >= 5) return prev;
        return [...prev, code];
      });
    };

    /* top 20 sectors for comparison */
    const topSectorCodes = ceda.sectors
      .map(s => {
        let sum = 0;
        compCountries.forEach(cc => { sum += ceda.getEmissionFactor(cc, s.code) || 0; });
        return { code: s.code, name: s.name, total: sum };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    const barData = topSectorCodes.map(s => {
      const row = { name: s.name.length > 20 ? s.name.slice(0, 17) + '...' : s.name };
      compCountries.forEach(cc => { row[cc] = ceda.getEmissionFactor(cc, s.code) || 0; });
      return row;
    });

    /* radar: industry group averages */
    const groupKeys = Object.keys(ceda.industryGroups).slice(0, 12);
    const radarData = groupKeys.map(gk => {
      const row = { group: (ceda.industryGroups[gk] || gk).slice(0, 18) };
      compCountries.forEach(cc => {
        const sectors = ceda.sectorGroups[gk]?.sectors || [];
        let sum = 0, cnt = 0;
        sectors.forEach(sc => { const ef = ceda.getEmissionFactor(cc, sc); if (ef !== null) { sum += ef; cnt++; } });
        row[cc] = cnt > 0 ? sum / cnt : 0;
      });
      return row;
    });

    /* summary table */
    const summaryRows = compCountries.map(cc => {
      const efs = Object.values(ceda.countryEFMap[cc] || {});
      const avg = efs.length > 0 ? efs.reduce((a, b) => a + b, 0) / efs.length : 0;
      const allAvgs = ceda.countries.map(c => {
        const e = Object.values(ceda.countryEFMap[c.code] || {});
        return e.length > 0 ? e.reduce((a, b) => a + b, 0) / e.length : 0;
      }).sort((a, b) => b - a);
      const rank = allAvgs.findIndex(v => Math.abs(v - avg) < 0.0001) + 1;
      return { code: cc, name: ceda.countryNameMap[cc] || cc, avg, rank, delta: avg - globalAvgEF };
    });

    return (
      <div>
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            Select Countries to Compare (max 5): {compCountries.join(', ')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ceda.countries.map(c => (
              <button
                key={c.code}
                onClick={() => toggleCountry(c.code)}
                style={{
                  padding: '3px 8px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                  border: `1px solid ${compCountries.includes(c.code) ? T.indigo : T.border}`,
                  background: compCountries.includes(c.code) ? T.indigo : '#fff',
                  color: compCountries.includes(c.code) ? '#fff' : T.text,
                }}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Grouped EF Comparison (Top 20 Sectors)</div>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 9 }} />
              <Tooltip formatter={v => v.toFixed(4)} />
              <Legend />
              {compCountries.map((cc, i) => (
                <Bar key={cc} dataKey={cc} fill={PALETTE[i % PALETTE.length]} radius={[0, 2, 2, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Industry Group Radar</div>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="group" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                {compCountries.map((cc, i) => (
                  <Radar key={cc} name={cc} dataKey={cc} stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.15} />
                ))}
                <Legend />
                <Tooltip formatter={v => v.toFixed(4)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Summary Table</div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  <th style={{ padding: 6, textAlign: 'left' }}>Country</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Avg EF</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Rank</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>vs Global</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((r, i) => (
                  <tr key={r.code} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{r.avg.toFixed(4)}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>#{r.rank}</td>
                    <td style={{ padding: 6, textAlign: 'right', color: r.delta > 0 ? T.red : T.green }}>
                      {r.delta > 0 ? '+' : ''}{r.delta.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  TAB 4 — Sector Comparison                                      */
  /* ================================================================ */
  const renderSectorComparison = () => {
    const toggleSector = (code) => {
      setCompSectors(prev => {
        if (prev.includes(code)) return prev.filter(c => c !== code);
        if (prev.length >= 8) return prev;
        return [...prev, code];
      });
    };

    /* grouped bar: top 20 countries */
    const topCountryCodes = ceda.countries
      .map(c => {
        let sum = 0;
        compSectors.forEach(sc => { sum += ceda.getEmissionFactor(c.code, sc) || 0; });
        return { code: c.code, name: c.name, total: sum };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    const barData = topCountryCodes.map(c => {
      const row = { name: c.name.length > 15 ? c.name.slice(0, 12) + '...' : c.name };
      compSectors.forEach(sc => {
        const s = ceda.sectorMap[sc];
        const lbl = s ? (s.name.length > 15 ? s.name.slice(0, 12) + '...' : s.name) : sc;
        row[lbl] = ceda.getEmissionFactor(c.code, sc) || 0;
      });
      return row;
    });
    const sectorLabels = compSectors.map(sc => {
      const s = ceda.sectorMap[sc];
      return s ? (s.name.length > 15 ? s.name.slice(0, 12) + '...' : s.name) : sc;
    });

    /* line chart: EF across all countries sorted */
    const lineData = ceda.countries
      .map(c => {
        const row = { name: c.code };
        let hasAny = false;
        compSectors.forEach(sc => {
          const ef = ceda.getEmissionFactor(c.code, sc);
          const s = ceda.sectorMap[sc];
          const lbl = s ? (s.name.length > 15 ? s.name.slice(0, 12) + '...' : s.name) : sc;
          row[lbl] = ef || 0;
          if (ef) hasAny = true;
        });
        return hasAny ? row : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b[sectorLabels[0]] || 0) - (a[sectorLabels[0]] || 0));

    /* intensity ratio table */
    const ratioRows = compSectors.map(sc => {
      const s = ceda.sectorMap[sc];
      const efs = ceda.countries.map(c => ceda.getEmissionFactor(c.code, sc)).filter(v => v !== null);
      const avg = efs.length > 0 ? efs.reduce((a, b) => a + b, 0) / efs.length : 0;
      const max = efs.length > 0 ? Math.max(...efs) : 0;
      const min = efs.length > 0 ? Math.min(...efs) : 0;
      return { code: sc, name: s?.name || sc, avg, max, min, ratio: min > 0 ? max / min : 0 };
    });

    return (
      <div>
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            Select Sectors to Compare (max 8): {compSectors.length} selected
          </div>
          <div style={{ maxHeight: 150, overflow: 'auto' }}>
            {Object.keys(ceda.sectorGroups).map(gk => (
              <div key={gk} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>{ceda.industryGroups[gk]}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(ceda.sectorGroups[gk]?.sectors || []).map(sc => {
                    const s = ceda.sectorMap[sc];
                    return (
                      <button key={sc} onClick={() => toggleSector(sc)} style={{
                        padding: '2px 6px', fontSize: 10, borderRadius: 3, cursor: 'pointer',
                        border: `1px solid ${compSectors.includes(sc) ? T.green : T.border}`,
                        background: compSectors.includes(sc) ? T.green : '#fff',
                        color: compSectors.includes(sc) ? '#fff' : T.text,
                      }}>
                        {s?.name?.slice(0, 20) || sc}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>EF Comparison by Country (Top 20)</div>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => v.toFixed(4)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {sectorLabels.map((lbl, i) => (
                <Bar key={lbl} dataKey={lbl} fill={PALETTE[i % PALETTE.length]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>EF Line Across Countries (sorted)</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData.slice(0, 60)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toFixed(4)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {sectorLabels.map((lbl, i) => (
                  <Line key={lbl} type="monotone" dataKey={lbl} stroke={PALETTE[i % PALETTE.length]} dot={false} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Intensity Ratio Table</div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  <th style={{ padding: 6, textAlign: 'left' }}>Sector</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Avg EF</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Min</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Max</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Max/Min</th>
                </tr>
              </thead>
              <tbody>
                {ratioRows.map((r, i) => (
                  <tr key={r.code} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6 }}>{r.name.slice(0, 30)}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{r.avg.toFixed(4)}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{r.min.toFixed(4)}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{r.max.toFixed(4)}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontWeight: 600 }}>{r.ratio.toFixed(1)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  TAB 5 — Industry Group Heatmap                                 */
  /* ================================================================ */
  const renderGroupHeatmap = () => {
    const groupKeys = Object.keys(ceda.industryGroups);
    const topCountryCodes = ceda.countries
      .map(c => {
        const efs = Object.values(ceda.countryEFMap[c.code] || {});
        return { code: c.code, name: c.name, avg: efs.length > 0 ? efs.reduce((a, b) => a + b, 0) / efs.length : 0 };
      })
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 20);

    /* heatmap data: group avg per country */
    const heatRows = groupKeys.map(gk => {
      const secs = ceda.sectorGroups[gk]?.sectors || [];
      const row = { group: gk, label: (ceda.industryGroups[gk] || gk).slice(0, 30) };
      topCountryCodes.forEach(c => {
        let sum = 0, cnt = 0;
        secs.forEach(sc => { const ef = ceda.getEmissionFactor(c.code, sc); if (ef !== null) { sum += ef; cnt++; } });
        row[c.code] = cnt > 0 ? sum / cnt : 0;
      });
      return row;
    });

    /* find max for color scaling */
    let maxVal = 0;
    heatRows.forEach(r => {
      topCountryCodes.forEach(c => { if (r[c.code] > maxVal) maxVal = r[c.code]; });
    });

    const heatColor = (v) => {
      const ratio = maxVal > 0 ? Math.min(1, v / maxVal) : 0;
      const r = Math.round(255 * ratio);
      const g = Math.round(255 * (1 - ratio * 0.7));
      const b = Math.round(100 * (1 - ratio));
      return `rgb(${r},${g},${b})`;
    };

    /* group-level bar */
    const groupBar = groupKeys.map(gk => {
      const secs = ceda.sectorGroups[gk]?.sectors || [];
      let sum = 0, cnt = 0;
      ceda.countries.forEach(c => {
        secs.forEach(sc => { const ef = ceda.getEmissionFactor(c.code, sc); if (ef !== null) { sum += ef; cnt++; } });
      });
      return { group: (ceda.industryGroups[gk] || gk).slice(0, 25), avgEF: cnt > 0 ? sum / cnt : 0 };
    }).sort((a, b) => b.avgEF - a.avgEF);

    /* drill-down sectors */
    const drillSectors = ceda.getSectorsByGroup(selGroup);
    const drillData = drillSectors.map(s => {
      let sum = 0, cnt = 0;
      ceda.countries.forEach(c => { const ef = ceda.getEmissionFactor(c.code, s.code); if (ef !== null) { sum += ef; cnt++; } });
      return { name: s.name.slice(0, 30), avgEF: cnt > 0 ? sum / cnt : 0 };
    }).sort((a, b) => b.avgEF - a.avgEF);

    return (
      <div>
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Industry Group x Country Heatmap (Avg EF)</div>
          <div style={{ overflow: 'auto', maxHeight: 600 }}>
            <table style={{ fontSize: 10, borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ padding: 4, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>Group</th>
                  {topCountryCodes.map(c => (
                    <th key={c.code} style={{ padding: 4, textAlign: 'center', writingMode: 'vertical-rl', height: 80 }}>{c.code}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatRows.map(r => (
                  <tr key={r.group}>
                    <td style={{ padding: 4, fontWeight: 600, position: 'sticky', left: 0, background: '#fff', zIndex: 1, whiteSpace: 'nowrap' }}>
                      <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setSelGroup(r.group)}>
                        {r.label}
                      </span>
                    </td>
                    {topCountryCodes.map(c => (
                      <td key={c.code} style={{ padding: 4, textAlign: 'center', background: heatColor(r[c.code]), color: r[c.code] / maxVal > 0.6 ? '#fff' : T.text, fontWeight: 600 }}>
                        {r[c.code].toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Group-Level Average EF (Global)</div>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart data={groupBar} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="group" type="category" width={180} tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => v.toFixed(4)} />
                <Bar dataKey="avgEF" fill={T.navy} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Drill-Down: {ceda.industryGroups[selGroup] || selGroup} ({drillSectors.length} sectors)
            </div>
            <select style={{ ...selectStyle, marginBottom: 8 }} value={selGroup} onChange={e => setSelGroup(e.target.value)}>
              {groupKeys.map(gk => <option key={gk} value={gk}>{ceda.industryGroups[gk]}</option>)}
            </select>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={drillData.slice(0, 25)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={200} tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => v.toFixed(6)} />
                <Bar dataKey="avgEF" fill={T.gold} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  TAB 6 — Regional Analysis                                      */
  /* ================================================================ */
  const renderRegionalAnalysis = () => {
    /* avg EF per region across all sectors */
    const regBar = ceda.regions.map(r => {
      const efs = ceda.regionalEFMap[r];
      if (!efs) return { region: r, avgEF: 0 };
      const vals = Object.values(efs);
      return { region: r.length > 20 ? r.slice(0, 17) + '...' : r, fullName: r, avgEF: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
    }).sort((a, b) => b.avgEF - a.avgEF);

    /* radar: 5 supercategories per region */
    const superGroups = {
      Agriculture: ['11'], Manufacturing: ['31', '32', '33'],
      Services: ['52', '53', '54', '55', '56'], Utilities: ['22'],
      Transport: ['48', '49'],
    };
    const radarData = Object.entries(superGroups).map(([label, groups]) => {
      const row = { category: label };
      ceda.regions.slice(0, 8).forEach(r => {
        let sum = 0, cnt = 0;
        groups.forEach(gk => {
          (ceda.sectorGroups[gk]?.sectors || []).forEach(sc => {
            const ef = ceda.getRegionalEF(r, sc);
            if (ef !== null) { sum += ef; cnt++; }
          });
        });
        row[r.length > 15 ? r.slice(0, 12) + '...' : r] = cnt > 0 ? sum / cnt : 0;
      });
      return row;
    });
    const radarRegions = ceda.regions.slice(0, 8).map(r => r.length > 15 ? r.slice(0, 12) + '...' : r);

    /* member countries for selected region */
    const memberCountries = ceda.countries.filter(c => ceda.getCountryRegion(c.code) === selRegion);

    /* regional vs country comparison */
    const compData = memberCountries.slice(0, 15).map(c => {
      const cEFs = Object.values(ceda.countryEFMap[c.code] || {});
      const cAvg = cEFs.length > 0 ? cEFs.reduce((a, b) => a + b, 0) / cEFs.length : 0;
      const rEFs = Object.values(ceda.regionalEFMap[selRegion] || {});
      const rAvg = rEFs.length > 0 ? rEFs.reduce((a, b) => a + b, 0) / rEFs.length : 0;
      return { name: c.name.slice(0, 15), country: cAvg, regional: rAvg };
    });

    return (
      <div>
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Average EF by UN Subregion</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={regBar} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="region" type="category" width={160} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => v.toFixed(4)} />
              <ReferenceLine x={globalAvgEF} stroke={T.red} strokeDasharray="5 5" />
              <Bar dataKey="avgEF" fill={T.indigo} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Regional Radar (Super-categories, Top 8 Regions)</div>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                {radarRegions.map((r, i) => (
                  <Radar key={r} name={r} dataKey={r} stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.1} />
                ))}
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Tooltip formatter={v => v.toFixed(4)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Region Selector</div>
            <select style={selectStyle} value={selRegion} onChange={e => setSelRegion(e.target.value)}>
              {ceda.regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div style={{ marginTop: 8, fontSize: 12, color: T.sub }}>
              <strong>{memberCountries.length}</strong> member countries:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {memberCountries.map(c => (
                <span key={c.code} style={{ padding: '2px 6px', background: T.surface, borderRadius: 3, fontSize: 11 }}>
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Country vs Regional Average ({selRegion})</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={compData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => v.toFixed(4)} />
              <Legend />
              <Bar dataKey="country" name="Country Avg" fill={T.navy} radius={[3, 3, 0, 0]} />
              <Bar dataKey="regional" name="Regional Avg" fill={T.gold} radius={[3, 3, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  TAB 7 — Spend-Based Calculator                                 */
  /* ================================================================ */
  const renderSpendCalculator = () => {
    const result = ceda.calculateSpendEmissions(calcCountry, calcSector, calcSpend);
    const sectorName = (ceda.sectorMap[calcSector] || {}).name || calcSector;
    const countryName = ceda.countryNameMap[calcCountry] || calcCountry;
    const ef = ceda.getEmissionFactor(calcCountry, calcSector);
    const region = ceda.getCountryRegion(calcCountry);
    const regEF = region ? ceda.getRegionalEF(region, calcSector) : null;

    const addLine = () => {
      setCalcLines(prev => [
        ...prev,
        {
          id: Date.now(),
          country: calcCountry, sector: calcSector,
          spend: calcSpend, ...result,
          countryName, sectorName,
        },
      ]);
    };
    const removeLine = (id) => setCalcLines(prev => prev.filter(l => l.id !== id));

    const totalKg = calcLines.reduce((s, l) => s + l.kgCO2e, 0);
    const totalT = calcLines.reduce((s, l) => s + l.tCO2e, 0);

    /* sector groups for selector */
    const groupKeys = Object.keys(ceda.sectorGroups);

    return (
      <div>
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Scope 3 Spend-Based Emission Calculator</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Country</label>
              <select style={selectStyle} value={calcCountry} onChange={e => setCalcCountry(e.target.value)}>
                {ceda.countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sector</label>
              <select style={selectStyle} value={calcSector} onChange={e => setCalcSector(e.target.value)}>
                {groupKeys.map(gk => (
                  <optgroup key={gk} label={ceda.industryGroups[gk]}>
                    {(ceda.sectorGroups[gk]?.sectors || []).map(sc => {
                      const s = ceda.sectorMap[sc];
                      return s ? <option key={sc} value={sc}>{s.name}</option> : null;
                    })}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Spend (USD)</label>
              <input
                type="number" style={inputStyle} value={calcSpend}
                onChange={e => setCalcSpend(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <button style={btnStyle} onClick={addLine}>+ Add Line</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Kpi label="kgCO2e" value={fmtK(result.kgCO2e)} />
          <Kpi label="tCO2e" value={result.tCO2e.toFixed(3)} />
          <Kpi label="Source" value={result.source === 'country' ? 'Country-Specific' : result.source === 'regional' ? 'Regional Fallback' : 'No Data'} sub={result.source === 'country' ? 'High confidence' : result.source === 'regional' ? 'Medium confidence' : 'N/A'} />
          <Kpi label="Emission Factor" value={ef !== null ? ef.toFixed(6) : regEF !== null ? regEF.toFixed(6) : '--'} sub="kgCO2e/USD" />
          <Kpi label="Scope 3 Category" value="Cat. 1" sub="Purchased Goods" />
          <Kpi label="Region" value={region || '--'} />
        </div>

        {calcLines.length > 0 && (
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Bulk Calculation ({calcLines.length} line items)</div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  <th style={{ padding: 6, textAlign: 'left' }}>Country</th>
                  <th style={{ padding: 6, textAlign: 'left' }}>Sector</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Spend (USD)</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>kgCO2e</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>tCO2e</th>
                  <th style={{ padding: 6, textAlign: 'center' }}>Source</th>
                  <th style={{ padding: 6 }}></th>
                </tr>
              </thead>
              <tbody>
                {calcLines.map(l => (
                  <tr key={l.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6 }}>{l.countryName}</td>
                    <td style={{ padding: 6 }}>{l.sectorName.slice(0, 30)}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>${l.spend.toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{fmtK(l.kgCO2e)}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>{l.tCO2e.toFixed(3)}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, background: l.source === 'country' ? '#d1fae5' : l.source === 'regional' ? '#fef3c7' : '#fee2e2', color: l.source === 'country' ? T.green : l.source === 'regional' ? T.amber : T.red }}>
                        {l.source}
                      </span>
                    </td>
                    <td style={{ padding: 6 }}>
                      <button onClick={() => removeLine(l.id)} style={{ border: 'none', background: 'none', color: T.red, cursor: 'pointer', fontSize: 14 }}>x</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: T.surface, fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: 6 }}>TOTAL</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{fmtK(totalKg)}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{totalT.toFixed(3)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    );
  };

  /* ================================================================ */
  /*  TAB 8 — Currency & Price Adjustment                            */
  /* ================================================================ */
  const renderCurrency = () => {
    const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    const fxEntries = ceda.countries.map(c => {
      const entry = ceda.fxMap[c.code];
      if (!entry) return null;
      return { code: c.code, name: c.name, currency: entry.currency, rate: entry.rates[fxYear] || null };
    }).filter(Boolean).filter(e => e.rate !== null);

    const sortedFx = [...fxEntries].sort((a, b) => sortDir === 'asc' ? a[sortCol === 'rate' ? 'rate' : 'name'].toString().localeCompare(b[sortCol === 'rate' ? 'rate' : 'name'].toString()) : b[sortCol === 'rate' ? 'rate' : 'name'].toString().localeCompare(a[sortCol === 'rate' ? 'rate' : 'name'].toString()));

    /* converter */
    const converted = ceda.convertCurrency(convAmount, convCountry, fxYear);
    const fxEntry = ceda.fxMap[convCountry];

    return (
      <div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Currency Converter</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Amount (USD)</label>
                <input type="number" style={inputStyle} value={convAmount} onChange={e => setConvAmount(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label style={labelStyle}>Target Country</label>
                <select style={selectStyle} value={convCountry} onChange={e => setConvCountry(e.target.value)}>
                  {ceda.countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Year</label>
                <select style={selectStyle} value={fxYear} onChange={e => setFxYear(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700, color: T.navy }}>
              ${convAmount.toLocaleString()} USD = {converted !== null ? converted.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '--'} {fxEntry?.currency || ''}
            </div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
              Rate: 1 USD = {ceda.getExchangeRate(convCountry, fxYear)?.toFixed(4) || '--'} {fxEntry?.currency || ''}
            </div>
          </div>

          <div style={{ ...cardStyle, flex: 1 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Price Adjustment Notes</div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>
              <p><strong>Purchaser vs Producer Prices:</strong> CEDA emission factors are expressed in purchaser prices (what the buyer pays), which include trade margins, transport costs, and taxes. Producer (basic) prices exclude these. The difference matters for accurate Scope 3 calculations.</p>
              <p><strong>Currency Conversion:</strong> All EFs use USD as the base currency. When applying EFs to spend data in local currencies, convert to USD first using the appropriate year's exchange rate, then multiply by the EF.</p>
              <p><strong>Price Index:</strong> EFs are benchmarked to 2022 USD. For spend data from other years, consider PPP adjustments for cross-country comparisons.</p>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, color: T.navy }}>Exchange Rate Table ({fxYear})</div>
            <select style={{ ...selectStyle, width: 100 }} value={fxYear} onChange={e => setFxYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surface, position: 'sticky', top: 0 }}>
                  <th style={{ padding: 6, textAlign: 'left', cursor: 'pointer' }} onClick={() => doSort('code')}>Code</th>
                  <th style={{ padding: 6, textAlign: 'left', cursor: 'pointer' }} onClick={() => doSort('name')}>Country</th>
                  <th style={{ padding: 6, textAlign: 'left' }}>Currency</th>
                  <th style={{ padding: 6, textAlign: 'right', cursor: 'pointer' }} onClick={() => doSort('rate')}>Rate (per USD)</th>
                </tr>
              </thead>
              <tbody>
                {sortedFx.map((e, i) => (
                  <tr key={e.code} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : T.surface }}>
                    <td style={{ padding: 6, fontFamily: 'monospace' }}>{e.code}</td>
                    <td style={{ padding: 6 }}>{e.name}</td>
                    <td style={{ padding: 6, fontSize: 11, color: T.sub }}>{e.currency}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontWeight: 600 }}>{e.rate.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  TAB 9 — Data Quality & Coverage                                */
  /* ================================================================ */
  const renderDataQuality = () => {
    /* coverage: % of countries with data per sector */
    const sectorCoverage = ceda.sectors.map(s => {
      let has = 0;
      ceda.countries.forEach(c => { if (ceda.getEmissionFactor(c.code, s.code) !== null) has++; });
      const pct = ceda.stats.totalCountries > 0 ? (has / ceda.stats.totalCountries) * 100 : 0;
      return { code: s.code, name: s.name, pct, missing: ceda.stats.totalCountries - has };
    });

    /* missing by country */
    const countryCoverage = ceda.countries.map(c => {
      const efs = ceda.countryEFMap[c.code] || {};
      const has = Object.keys(efs).length;
      const pct = ceda.stats.totalSectors > 0 ? (has / ceda.stats.totalSectors) * 100 : 0;
      return { code: c.code, name: c.name, has, missing: ceda.stats.totalSectors - has, pct };
    });

    /* top missing sectors */
    const topMissingSectors = [...sectorCoverage].sort((a, b) => a.pct - b.pct).slice(0, 20);
    const topMissingCountries = [...countryCoverage].sort((a, b) => a.pct - b.pct).slice(0, 20);

    /* overall coverage pct */
    const totalCells = ceda.stats.totalSectors * ceda.stats.totalCountries;
    let filledCells = 0;
    ceda.countries.forEach(c => { filledCells += Object.keys(ceda.countryEFMap[c.code] || {}).length; });
    const overallCoverage = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;

    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Kpi label="Overall Coverage" value={`${overallCoverage.toFixed(1)}%`} sub={`${filledCells.toLocaleString()} / ${totalCells.toLocaleString()} cells`} />
          <Kpi label="Full-Coverage Countries" value={countryCoverage.filter(c => c.pct === 100).length} />
          <Kpi label="Full-Coverage Sectors" value={sectorCoverage.filter(s => s.pct === 100).length} />
          <Kpi label="Data Points" value={filledCells.toLocaleString()} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Lowest Coverage Sectors (% of countries with data)</div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topMissingSectors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => `${v.toFixed(1)}%`} />
                <ReferenceLine x={overallCoverage} stroke={T.gold} strokeDasharray="5 5" />
                <Bar dataKey="pct" fill={T.red} radius={[0, 3, 3, 0]}>
                  {topMissingSectors.map((s, i) => (
                    <Cell key={s.code} fill={s.pct > 80 ? T.green : s.pct > 50 ? T.amber : T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Lowest Coverage Countries (% of sectors with data)</div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topMissingCountries} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `${v.toFixed(1)}%`} />
                <ReferenceLine x={overallCoverage} stroke={T.gold} strokeDasharray="5 5" />
                <Bar dataKey="pct" fill={T.red} radius={[0, 3, 3, 0]}>
                  {topMissingCountries.map((c, i) => (
                    <Cell key={c.code} fill={c.pct > 80 ? T.green : c.pct > 50 ? T.amber : T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Data Source Attribution</div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
              <div><strong>Primary Source:</strong> Open CEDA 2025</div>
              <div><strong>Base Year:</strong> 2022</div>
              <div><strong>Methodology:</strong> Environmentally-Extended Multi-Region Input-Output (EE-MRIO)</div>
              <div><strong>Classification:</strong> NAICS 2017 (6-digit)</div>
              <div><strong>Scope:</strong> Cradle-to-gate (Scope 1 + 2 + upstream 3)</div>
              <div><strong>GHG Coverage:</strong> CO2, CH4, N2O, HFCs, PFCs, SF6, NF3</div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Methodology Notes</div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
              <div>Emission factors represent the total GHG emissions per USD of output in a given sector and country.</div>
              <div style={{ marginTop: 6 }}>The EE-MRIO model traces supply chains across 149 countries and 400 sectors, capturing both direct and indirect (upstream) emissions.</div>
              <div style={{ marginTop: 6 }}>Regional averages are production-weighted means across member countries.</div>
              <div style={{ marginTop: 6 }}>Exchange rates are annual averages from IMF IFS data.</div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Version History</div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
              <div><strong>v2025-11-12</strong> (current) -- 400 sectors, 149 countries, 21 regions</div>
              <div><strong>v2024-09-01</strong> -- 395 sectors, 145 countries</div>
              <div><strong>v2023-06-15</strong> -- 388 sectors, 140 countries</div>
              <div style={{ marginTop: 8 }}>Updates include: expanded country coverage, refined MRIO coefficients, updated FX rates through 2025, and improved sector granularity for agriculture and transport.</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */
  const tabRenderers = [
    renderDashboard, renderCountryExplorer, renderSectorExplorer,
    renderCountryComparison, renderSectorComparison, renderGroupHeatmap,
    renderRegionalAnalysis, renderSpendCalculator,
    renderCurrency, renderDataQuality,
  ];

  return (
    <div style={{ padding: 24, background: T.surface, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>
          CEDA Emission Factor Explorer
        </h1>
        <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>
          Comprehensive Environmental Data Archive -- {ceda.stats.totalSectors} sectors, {ceda.stats.totalCountries} countries, {ceda.stats.totalRegions} regions | v{ceda.version}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 16, borderBottom: `2px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500,
              border: 'none', cursor: 'pointer', borderRadius: '6px 6px 0 0',
              background: tab === i ? T.navy : 'transparent',
              color: tab === i ? '#fff' : T.sub,
              transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tabRenderers[tab]()}
    </div>
  );
}
