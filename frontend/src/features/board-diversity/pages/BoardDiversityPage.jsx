import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine, LineChart, Line } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899', '#6366f1', '#f43f5e', '#14b8a6'];

/* ================================================================
   SECTOR BOARD BENCHMARKS
   ================================================================ */
const SECTOR_BOARD_BENCHMARKS = {
  Energy:      { female_pct: 28, independent_pct: 72, avg_age: 62, avg_tenure_yr: 8.5, ethnic_diversity_pct: 18, skills_coverage: 0.65, ceo_chair_split_pct: 75, board_size_avg: 11 },
  Materials:   { female_pct: 25, independent_pct: 68, avg_age: 61, avg_tenure_yr: 9.2, ethnic_diversity_pct: 15, skills_coverage: 0.60, ceo_chair_split_pct: 70, board_size_avg: 10 },
  Industrials: { female_pct: 30, independent_pct: 75, avg_age: 60, avg_tenure_yr: 7.8, ethnic_diversity_pct: 20, skills_coverage: 0.68, ceo_chair_split_pct: 78, board_size_avg: 11 },
  Utilities:   { female_pct: 32, independent_pct: 78, avg_age: 61, avg_tenure_yr: 7.5, ethnic_diversity_pct: 22, skills_coverage: 0.70, ceo_chair_split_pct: 80, board_size_avg: 12 },
  Financials:  { female_pct: 35, independent_pct: 82, avg_age: 59, avg_tenure_yr: 6.8, ethnic_diversity_pct: 25, skills_coverage: 0.75, ceo_chair_split_pct: 85, board_size_avg: 13 },
  IT:          { female_pct: 32, independent_pct: 76, avg_age: 55, avg_tenure_yr: 5.5, ethnic_diversity_pct: 28, skills_coverage: 0.72, ceo_chair_split_pct: 72, board_size_avg: 10 },
  'Health Care': { female_pct: 34, independent_pct: 80, avg_age: 58, avg_tenure_yr: 6.5, ethnic_diversity_pct: 26, skills_coverage: 0.74, ceo_chair_split_pct: 82, board_size_avg: 11 },
  'Consumer Discretionary': { female_pct: 33, independent_pct: 74, avg_age: 57, avg_tenure_yr: 6.2, ethnic_diversity_pct: 24, skills_coverage: 0.68, ceo_chair_split_pct: 76, board_size_avg: 10 },
  'Consumer Staples': { female_pct: 36, independent_pct: 78, avg_age: 58, avg_tenure_yr: 7.0, ethnic_diversity_pct: 27, skills_coverage: 0.72, ceo_chair_split_pct: 80, board_size_avg: 12 },
  'Communication Services': { female_pct: 30, independent_pct: 70, avg_age: 54, avg_tenure_yr: 5.8, ethnic_diversity_pct: 22, skills_coverage: 0.65, ceo_chair_split_pct: 68, board_size_avg: 9 },
  'Real Estate': { female_pct: 28, independent_pct: 72, avg_age: 60, avg_tenure_yr: 8.0, ethnic_diversity_pct: 18, skills_coverage: 0.62, ceo_chair_split_pct: 74, board_size_avg: 10 },
};

/* ================================================================
   COUNTRY BOARD REGULATIONS
   ================================================================ */
const COUNTRY_BOARD_REGULATIONS = [
  { country: 'Norway', iso2: 'NO', quota: '40% female', mandatory: true, year_enacted: 2006, penalty: 'Dissolution', current_avg: 42 },
  { country: 'France', iso2: 'FR', quota: '40% female', mandatory: true, year_enacted: 2011, penalty: 'Board fees suspended', current_avg: 45 },
  { country: 'Germany', iso2: 'DE', quota: '30% female (supervisory)', mandatory: true, year_enacted: 2015, penalty: 'Empty chair', current_avg: 36 },
  { country: 'Italy', iso2: 'IT', quota: '33% female', mandatory: true, year_enacted: 2011, penalty: 'Fines + dissolution', current_avg: 38 },
  { country: 'India', iso2: 'IN', quota: '1 female director', mandatory: true, year_enacted: 2013, penalty: 'Fines', current_avg: 18 },
  { country: 'UK', iso2: 'GB', quota: '40% target', mandatory: false, year_enacted: 2022, penalty: 'Comply or explain', current_avg: 40 },
  { country: 'USA', iso2: 'US', quota: 'None (NASDAQ: 1 diverse)', mandatory: false, year_enacted: 2021, penalty: 'Disclosure', current_avg: 32 },
  { country: 'Japan', iso2: 'JP', quota: '30% target by 2030', mandatory: false, year_enacted: 2023, penalty: 'None', current_avg: 15 },
  { country: 'Australia', iso2: 'AU', quota: '30% target', mandatory: false, year_enacted: 2015, penalty: 'Comply or explain', current_avg: 35 },
  { country: 'Singapore', iso2: 'SG', quota: '25% target', mandatory: false, year_enacted: 2022, penalty: 'None', current_avg: 22 },
  { country: 'South Korea', iso2: 'KR', quota: '1 female (large co.)', mandatory: true, year_enacted: 2020, penalty: 'Disclosure', current_avg: 12 },
  { country: 'Brazil', iso2: 'BR', quota: 'None', mandatory: false, year_enacted: null, penalty: 'None', current_avg: 15 },
];

/* ================================================================
   BOARD SKILLS MATRIX DEFINITION
   ================================================================ */
const BOARD_SKILLS = ['Finance', 'Technology', 'ESG/Sustainability', 'Industry Expertise', 'Legal/Compliance', 'International', 'Risk Management', 'Digital/Innovation'];

/* ================================================================
   BOARD DIVERSITY TREND DATA (3-year historical + 2-year forecast)
   ================================================================ */
const DIVERSITY_TREND = [
  { year: 2021, portfolio_female: 24.1, benchmark_female: 25.5, portfolio_indep: 68.2, benchmark_indep: 70.0 },
  { year: 2022, portfolio_female: 26.3, benchmark_female: 27.0, portfolio_indep: 70.1, benchmark_indep: 71.5 },
  { year: 2023, portfolio_female: 28.8, benchmark_female: 29.2, portfolio_indep: 72.4, benchmark_indep: 73.0 },
  { year: 2024, portfolio_female: 30.5, benchmark_female: 30.8, portfolio_indep: 74.0, benchmark_indep: 74.5 },
  { year: 2025, portfolio_female: 32.2, benchmark_female: 32.5, portfolio_indep: 75.8, benchmark_indep: 76.0 },
  { year: 2026, portfolio_female: 33.8, benchmark_female: 34.0, portfolio_indep: 77.2, benchmark_indep: 77.5 },
  { year: 2027, portfolio_female: 35.5, benchmark_female: 35.5, portfolio_indep: 78.5, benchmark_indep: 79.0 },
];

/* ================================================================
   GOVERNANCE SCORING METHODOLOGY
   ================================================================ */
const GOV_SCORE_WEIGHTS = [
  { component: 'Gender Diversity', weight: 20, description: 'Female board representation relative to 50% parity target' },
  { component: 'Board Independence', weight: 20, description: 'Independent directors as percentage of total board' },
  { component: 'Leadership Separation', weight: 15, description: 'CEO and Chair role separation (binary)' },
  { component: 'Ethnic Diversity', weight: 15, description: 'Ethnic/racial minority representation on board' },
  { component: 'Skills Coverage', weight: 15, description: 'Coverage of 8 essential board competency areas' },
  { component: 'Tenure Freshness', weight: 10, description: 'Avg director tenure below 12 years (board renewal)' },
  { component: 'Board Size', weight: 5, description: 'Board size within optimal 7-15 director range' },
];

/* ================================================================
   HELPERS
   ================================================================ */
const mapSector = s => { if (s === 'IT' || s === 'Information Technology') return 'IT'; return s; };
const getSectorBench = s => {
  const k = mapSector(s);
  return SECTOR_BOARD_BENCHMARKS[k] || SECTOR_BOARD_BENCHMARKS['Financials'];
};

const COUNTRY_ISO_MAP = { IN: 'IN', US: 'US', GB: 'GB', DE: 'DE', FR: 'FR', JP: 'JP', AU: 'AU', SG: 'SG', KR: 'KR', CN: 'CN', BR: 'BR', ZA: 'ZA', CA: 'CA', IT: 'IT', NO: 'NO', HK: 'HK', SA: 'SA' };

const getCountryReg = iso2 => COUNTRY_BOARD_REGULATIONS.find(r => r.iso2 === iso2);

const seededRandom = (seed) => { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; }; };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* Generate board data per holding */
const genBoardData = (holding, idx) => {
  const bench = getSectorBench(holding.sector);
  const rng = seededRandom(idx * 137 + 42 + (holding.name || '').charCodeAt(0));
  const vary = (base, spread) => clamp(base + (rng() - 0.5) * spread * 2, 0, 100);
  const countryReg = getCountryReg(holding.countryCode);
  const countryAvg = countryReg ? countryReg.current_avg : bench.female_pct;

  const female_pct = Math.round(vary((bench.female_pct + countryAvg) / 2, 12));
  const independent_pct = Math.round(vary(bench.independent_pct, 15));
  const board_size = Math.round(clamp(bench.board_size_avg + (rng() - 0.5) * 6, 5, 18));
  const avg_age = Math.round(clamp(bench.avg_age + (rng() - 0.5) * 10, 42, 72));
  const avg_tenure = +(clamp(bench.avg_tenure_yr + (rng() - 0.5) * 6, 2, 16)).toFixed(1);
  const ethnic_diversity_pct = Math.round(vary(bench.ethnic_diversity_pct, 12));
  const ceo_chair_split = rng() < (bench.ceo_chair_split_pct / 100);
  const skills_coverage = +(clamp(bench.skills_coverage + (rng() - 0.5) * 0.3, 0.3, 1.0)).toFixed(2);

  const skillsMap = {};
  BOARD_SKILLS.forEach(sk => {
    const v = rng();
    skillsMap[sk] = v > 0.65 ? 'full' : v > 0.3 ? 'partial' : 'none';
  });

  const govScore = Math.round(
    (female_pct / 50) * 20 +
    (independent_pct / 100) * 20 +
    (ceo_chair_split ? 15 : 0) +
    (ethnic_diversity_pct / 40) * 15 +
    skills_coverage * 15 +
    (avg_tenure < 12 ? 10 : 5) +
    (board_size >= 7 && board_size <= 15 ? 5 : 0)
  );

  let quotaCompliance = 'N/A';
  if (countryReg) {
    if (countryReg.mandatory) {
      if (countryReg.iso2 === 'IN') quotaCompliance = female_pct >= 8 ? 'Compliant' : 'Non-Compliant';
      else {
        const reqPct = parseInt(countryReg.quota) || 30;
        quotaCompliance = female_pct >= reqPct ? 'Compliant' : 'Non-Compliant';
      }
    } else {
      const tgtPct = parseInt(countryReg.quota) || 30;
      quotaCompliance = female_pct >= tgtPct ? 'Meets Target' : 'Below Target';
    }
  }

  return {
    ...holding,
    female_pct, independent_pct, board_size, avg_age, avg_tenure, ethnic_diversity_pct,
    ceo_chair_split, skills_coverage, skillsMap, govScore: clamp(govScore, 15, 98),
    quotaCompliance, countryReg,
  };
};

/* ================================================================
   CUSTOM TOOLTIP
   ================================================================ */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: T.font, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || T.text }}>{p.name}: <b>{typeof p.value === 'number' ? (p.value % 1 ? p.value.toFixed(1) : p.value) : p.value}{typeof p.value === 'number' && p.name?.includes('%') ? '' : ''}</b></div>)}
    </div>
  );
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function BoardDiversityPage() {
  const navigate = useNavigate();
  const printRef = useRef(null);

  /* ── Portfolio ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      if (raw.length) return raw;
      return (GLOBAL_COMPANY_MASTER || []).slice(0, 25);
    } catch { return (GLOBAL_COMPANY_MASTER || []).slice(0, 25); }
  }, []);

  /* ── Board Data ── */
  const boardData = useMemo(() => portfolio.map((h, i) => genBoardData(h, i)), [portfolio]);

  /* ── State ── */
  const [sortCol, setSortCol] = useState('govScore');
  const [sortDir, setSortDir] = useState('desc');
  const [filterSector, setFilterSector] = useState('All');
  const [peerSelect, setPeerSelect] = useState(boardData[0]?.name || '');
  const [editData, setEditData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_board_diversity_v1') || '{}'); } catch { return {}; }
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { localStorage.setItem('ra_board_diversity_v1', JSON.stringify(editData)); }, [editData]);

  const sectors = useMemo(() => ['All', ...new Set(boardData.map(h => h.sector))].sort(), [boardData]);
  const filtered = useMemo(() => {
    let d = [...boardData];
    if (filterSector !== 'All') d = d.filter(h => h.sector === filterSector);
    d.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'boolean') return sortDir === 'asc' ? (av ? 1 : -1) : (av ? -1 : 1);
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? (av || 0) - (bv || 0) : (bv || 0) - (av || 0);
    });
    return d;
  }, [boardData, filterSector, sortCol, sortDir]);

  /* ── KPIs ── */
  const kpi = useMemo(() => {
    const n = boardData.length || 1;
    const wt = h => (h.weight || h.portfolio_weight || (1 / n));
    const wtSum = boardData.reduce((s, h) => s + wt(h), 0) || 1;
    const wavg = (arr, fn) => arr.reduce((s, h) => s + fn(h) * wt(h), 0) / wtSum;

    return {
      avgFemale: wavg(boardData, h => h.female_pct).toFixed(1),
      avgIndependent: wavg(boardData, h => h.independent_pct).toFixed(1),
      avgBoardSize: wavg(boardData, h => h.board_size).toFixed(1),
      ceoChairSplit: ((boardData.filter(h => h.ceo_chair_split).length / n) * 100).toFixed(0),
      belowQuota: boardData.filter(h => h.quotaCompliance === 'Non-Compliant' || h.quotaCompliance === 'Below Target').length,
      avgEthnic: wavg(boardData, h => h.ethnic_diversity_pct).toFixed(1),
      avgTenure: wavg(boardData, h => h.avg_tenure).toFixed(1),
      avgSkills: wavg(boardData, h => h.skills_coverage * 100).toFixed(0),
      avgGov: wavg(boardData, h => h.govScore).toFixed(0),
      regCompliance: ((boardData.filter(h => h.quotaCompliance === 'Compliant' || h.quotaCompliance === 'Meets Target' || h.quotaCompliance === 'N/A').length / n) * 100).toFixed(0),
    };
  }, [boardData]);

  /* ── Sort handler ── */
  const handleSort = col => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  /* ── Export functions ── */
  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csv = [keys.join(','), ...data.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportGovernance = () => exportCSV(filtered.map(h => ({ Company: h.name, Sector: h.sector, Country: h.countryCode, 'Female %': h.female_pct, 'Independent %': h.independent_pct, 'Board Size': h.board_size, 'CEO-Chair Split': h.ceo_chair_split ? 'Yes' : 'No', 'Avg Tenure': h.avg_tenure, 'Ethnic %': h.ethnic_diversity_pct, 'Skills Coverage': h.skills_coverage, 'Gov Score': h.govScore, 'Quota Compliance': h.quotaCompliance })), 'governance_report.csv');

  const exportSkills = () => {
    const rows = filtered.map(h => {
      const row = { Company: h.name, Sector: h.sector };
      BOARD_SKILLS.forEach(sk => { row[sk] = h.skillsMap[sk]; });
      return row;
    });
    exportCSV(rows, 'skills_matrix.csv');
  };

  const handlePrint = () => { window.print(); };

  /* ── Sector benchmark comparison data ── */
  const sectorCompData = useMemo(() => {
    const sectorMap = {};
    boardData.forEach(h => {
      const s = h.sector;
      if (!sectorMap[s]) sectorMap[s] = { holdings: [], sector: s };
      sectorMap[s].holdings.push(h);
    });
    return Object.values(sectorMap).map(g => {
      const n = g.holdings.length;
      const bench = getSectorBench(g.sector);
      return {
        sector: g.sector.length > 16 ? g.sector.slice(0, 14) + '..' : g.sector,
        'Portfolio Female %': Math.round(g.holdings.reduce((s, h) => s + h.female_pct, 0) / n),
        'Benchmark Female %': bench.female_pct,
        'Portfolio Indep. %': Math.round(g.holdings.reduce((s, h) => s + h.independent_pct, 0) / n),
        'Benchmark Indep. %': bench.independent_pct,
      };
    });
  }, [boardData]);

  /* ── Pie data ── */
  const genderPie = useMemo(() => {
    const avgF = parseFloat(kpi.avgFemale);
    return [{ name: 'Female', value: avgF }, { name: 'Male', value: +(100 - avgF).toFixed(1) }];
  }, [kpi]);
  const independencePie = useMemo(() => {
    const avgI = parseFloat(kpi.avgIndependent);
    return [{ name: 'Independent', value: avgI }, { name: 'Executive/Affiliated', value: +(100 - avgI).toFixed(1) }];
  }, [kpi]);

  /* ── Red flags ── */
  const redFlags = useMemo(() => boardData.filter(h => !h.ceo_chair_split || h.female_pct < 20 || h.independent_pct < 50 || h.avg_tenure > 12), [boardData]);

  /* ── Peer comparison ── */
  const peerData = useMemo(() => {
    const selected = boardData.find(h => h.name === peerSelect);
    if (!selected) return [];
    const bench = getSectorBench(selected.sector);
    return [
      { dimension: 'Female %', value: selected.female_pct, benchmark: bench.female_pct },
      { dimension: 'Independent %', value: selected.independent_pct, benchmark: bench.independent_pct },
      { dimension: 'Ethnic %', value: selected.ethnic_diversity_pct, benchmark: bench.ethnic_diversity_pct },
      { dimension: 'Skills Coverage', value: Math.round(selected.skills_coverage * 100), benchmark: Math.round(bench.skills_coverage * 100) },
      { dimension: 'CEO-Chair Split', value: selected.ceo_chair_split ? 100 : 0, benchmark: bench.ceo_chair_split_pct },
      { dimension: 'Board Size', value: Math.round((selected.board_size / 18) * 100), benchmark: Math.round((bench.board_size_avg / 18) * 100) },
    ];
  }, [peerSelect, boardData]);

  /* ── Engagement recommendations ── */
  const recommendations = useMemo(() => {
    const recs = [];
    boardData.forEach(h => {
      const bench = getSectorBench(h.sector);
      if (h.female_pct < bench.female_pct - 5) recs.push({ company: h.name, priority: 'High', action: `Increase female representation from ${h.female_pct}% to ${bench.female_pct}%+`, metric: 'Gender Diversity', gap: bench.female_pct - h.female_pct });
      if (h.independent_pct < 50) recs.push({ company: h.name, priority: 'Critical', action: `Raise board independence from ${h.independent_pct}% to 50%+ minimum`, metric: 'Independence', gap: 50 - h.independent_pct });
      if (!h.ceo_chair_split) recs.push({ company: h.name, priority: 'Medium', action: 'Separate CEO and Chair roles for stronger governance', metric: 'Leadership', gap: 0 });
      if (h.avg_tenure > 12) recs.push({ company: h.name, priority: 'Medium', action: `Reduce avg tenure from ${h.avg_tenure}yr; refresh board composition`, metric: 'Tenure', gap: h.avg_tenure - 8 });
    });
    return recs.sort((a, b) => { const p = { Critical: 0, High: 1, Medium: 2, Low: 3 }; return (p[a.priority] || 3) - (p[b.priority] || 3) || (b.gap || 0) - (a.gap || 0); }).slice(0, 20);
  }, [boardData]);

  /* ── Age & Tenure distribution ── */
  const ageDist = useMemo(() => {
    const buckets = { '40-49': 0, '50-54': 0, '55-59': 0, '60-64': 0, '65-69': 0, '70+': 0 };
    boardData.forEach(h => {
      const a = h.avg_age;
      if (a < 50) buckets['40-49']++;
      else if (a < 55) buckets['50-54']++;
      else if (a < 60) buckets['55-59']++;
      else if (a < 65) buckets['60-64']++;
      else if (a < 70) buckets['65-69']++;
      else buckets['70+']++;
    });
    return Object.entries(buckets).map(([k, v]) => ({ range: k, count: v }));
  }, [boardData]);

  const tenureDist = useMemo(() => {
    const buckets = { '0-3yr': 0, '3-6yr': 0, '6-9yr': 0, '9-12yr': 0, '12+yr': 0 };
    boardData.forEach(h => {
      const t = h.avg_tenure;
      if (t < 3) buckets['0-3yr']++;
      else if (t < 6) buckets['3-6yr']++;
      else if (t < 9) buckets['6-9yr']++;
      else if (t < 12) buckets['9-12yr']++;
      else buckets['12+yr']++;
    });
    return Object.entries(buckets).map(([k, v]) => ({ range: k, count: v }));
  }, [boardData]);

  /* ── Regulatory compliance per country ── */
  const regCompliance = useMemo(() => {
    return COUNTRY_BOARD_REGULATIONS.map(reg => {
      const holdings = boardData.filter(h => h.countryCode === reg.iso2);
      const compliant = holdings.filter(h => h.quotaCompliance === 'Compliant' || h.quotaCompliance === 'Meets Target').length;
      const nonCompliant = holdings.filter(h => h.quotaCompliance === 'Non-Compliant' || h.quotaCompliance === 'Below Target').length;
      return { ...reg, holdingsCount: holdings.length, compliant, nonCompliant, avgFemale: holdings.length ? Math.round(holdings.reduce((s, h) => s + h.female_pct, 0) / holdings.length) : null };
    });
  }, [boardData]);

  /* ── Gender bar chart data ── */
  const genderBarData = useMemo(() => {
    return filtered.slice(0, 30).map(h => {
      const reg = getCountryReg(h.countryCode);
      return { name: (h.name || '').slice(0, 18), female_pct: h.female_pct, quotaLine: reg ? (parseInt(reg.quota) || 30) : null };
    });
  }, [filtered]);

  /* ── Styles ── */
  const card = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 22, marginBottom: 18 };
  const kpiCard = (accent) => ({ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 20px', flex: '1 1 160px', minWidth: 155, borderTop: `3px solid ${accent}` });
  const badge = { display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${T.gold}18`, color: T.gold, fontWeight: 600, marginLeft: 10 };
  const tabStyle = (active) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: T.font, background: active ? T.navy : 'transparent', color: active ? '#fff' : T.textSec, transition: 'all 0.2s' });
  const th = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const td = { padding: '10px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };
  const pillStyle = (color) => ({ display: 'inline-block', fontSize: 11, padding: '2px 10px', borderRadius: 20, background: `${color}15`, color, fontWeight: 600 });

  if (!portfolio.length) return (
    <div style={{ fontFamily: T.font, padding: 48, textAlign: 'center', color: T.textMut }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>No portfolio loaded</div>
      <p>Import portfolio data via the Portfolio Manager to view board diversity analytics.</p>
      <button onClick={() => navigate('/portfolio')} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontFamily: T.font }}>Go to Portfolio Manager</button>
    </div>
  );

  return (
    <div ref={printRef} style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>

      {/* ── 1. HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>
            Board Diversity & Governance Scorecard
            <span style={badge}>Gender &middot; Independence &middot; Skills &middot; 12 Regulations</span>
          </h1>
          <p style={{ color: T.textSec, fontSize: 13, margin: '6px 0 0' }}>{boardData.length} holdings analyzed across {sectors.length - 1} sectors &middot; Updated {new Date().toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportGovernance} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.font }}>Export Governance CSV</button>
          <button onClick={exportSkills} style={{ background: T.sage, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.font }}>Export Skills Matrix</button>
          <button onClick={handlePrint} style={{ background: T.gold, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.font }}>Print Report</button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['overview', 'skills', 'regulation', 'engagement'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(activeTab === t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
        <div style={{ flex: 1 }} />
        <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontFamily: T.font, color: T.text, background: T.surface }}>
          {sectors.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* ── 2. KPI CARDS ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Avg Female %', value: kpi.avgFemale + '%', accent: T.sage, sub: 'Portfolio weighted' },
          { label: 'Avg Independent %', value: kpi.avgIndependent + '%', accent: T.navy, sub: 'Board independence' },
          { label: 'Avg Board Size', value: kpi.avgBoardSize, accent: T.gold, sub: 'Directors per board' },
          { label: 'CEO-Chair Split', value: kpi.ceoChairSplit + '%', accent: T.sage, sub: 'Separated roles' },
          { label: 'Below Quota', value: kpi.belowQuota, accent: T.red, sub: 'Holdings non-compliant' },
          { label: 'Ethnic Diversity', value: kpi.avgEthnic + '%', accent: '#7c3aed', sub: 'Portfolio avg' },
          { label: 'Avg Tenure', value: kpi.avgTenure + ' yr', accent: T.amber, sub: 'Board members' },
          { label: 'Skills Coverage', value: kpi.avgSkills + '%', accent: T.navyL, sub: '8-skill matrix' },
          { label: 'Governance Score', value: kpi.avgGov + '/100', accent: T.navy, sub: 'Composite score' },
          { label: 'Regulation Compliance', value: kpi.regCompliance + '%', accent: T.green, sub: 'Quota adherence' },
        ].map((k, i) => (
          <div key={i} style={kpiCard(k.accent)}>
            <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>{k.value}</div>
            <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* ── 3. GENDER DIVERSITY BAR CHART ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Portfolio Gender Diversity Distribution</h3>
            <ResponsiveContainer width="100%" height={Math.max(400, genderBarData.length * 26)}>
              <BarChart data={genderBarData} layout="vertical" margin={{ left: 120, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 60]} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: T.text }} width={110} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine x={30} stroke={T.red} strokeDasharray="5 5" label={{ value: '30% threshold', fill: T.red, fontSize: 10 }} />
                <Bar dataKey="female_pct" name="Female %" radius={[0, 4, 4, 0]}>
                  {genderBarData.map((d, i) => <Cell key={i} fill={d.female_pct >= 30 ? T.sage : d.female_pct >= 20 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── 4. SECTOR BENCHMARK COMPARISON ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Sector Benchmark Comparison</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={sectorCompData} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Portfolio Female %" fill={T.sage} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Benchmark Female %" fill={`${T.sage}50`} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Portfolio Indep. %" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Benchmark Indep. %" fill={`${T.navy}50`} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── DIVERSITY TREND OVER TIME ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Board Diversity Trend (2021-2027 Projected)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={DIVERSITY_TREND} margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[20, 85]} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="portfolio_female" name="Portfolio Female %" stroke={T.sage} strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="benchmark_female" name="Benchmark Female %" stroke={T.sage} strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="portfolio_indep" name="Portfolio Indep %" stroke={T.navy} strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="benchmark_indep" name="Benchmark Indep %" stroke={T.navy} strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                <ReferenceLine y={30} stroke={T.red} strokeDasharray="3 3" label={{ value: '30% gender target', fill: T.red, fontSize: 10, position: 'right' }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 11, color: T.textMut }}>
              <span>Solid lines = Portfolio actual/projected</span>
              <span>Dashed lines = Global benchmark</span>
              <span style={{ color: T.red }}>Red line = 30% minimum gender target</span>
            </div>
          </div>

          {/* ── GOVERNANCE SCORING METHODOLOGY ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Governance Score Methodology</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {GOV_SCORE_WEIGHTS.map((g, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: '14px 16px', border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{g.component}</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: T.gold }}>{g.weight}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, borderRadius: 3, background: T.border, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${g.weight * 5}%`, height: '100%', borderRadius: 3, background: T.navy }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4 }}>{g.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECTOR-LEVEL DIVERSITY DEEP DIVE ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Sector-Level Board Composition Detail</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Sector', 'Holdings', 'Avg Female %', 'Avg Indep %', 'Avg Board Size', 'Avg Tenure', 'CEO-Chair Split %', 'Avg Ethnic %', 'Avg Skills', 'Avg Gov Score'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    boardData.reduce((acc, h) => {
                      const s = h.sector;
                      if (!acc[s]) acc[s] = [];
                      acc[s].push(h);
                      return acc;
                    }, {})
                  ).map(([sector, holdings], i) => {
                    const n = holdings.length;
                    const avg = fn => (holdings.reduce((s, h) => s + fn(h), 0) / n);
                    return (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <td style={{ ...td, fontWeight: 600 }}>{sector}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{n}</td>
                        <td style={{ ...td, fontWeight: 600, color: avg(h => h.female_pct) >= 30 ? T.green : T.amber }}>
                          {avg(h => h.female_pct).toFixed(1)}%
                        </td>
                        <td style={{ ...td, fontWeight: 600 }}>{avg(h => h.independent_pct).toFixed(1)}%</td>
                        <td style={td}>{avg(h => h.board_size).toFixed(1)}</td>
                        <td style={td}>{avg(h => h.avg_tenure).toFixed(1)}yr</td>
                        <td style={td}>{((holdings.filter(h => h.ceo_chair_split).length / n) * 100).toFixed(0)}%</td>
                        <td style={td}>{avg(h => h.ethnic_diversity_pct).toFixed(1)}%</td>
                        <td style={td}>{(avg(h => h.skills_coverage) * 100).toFixed(0)}%</td>
                        <td style={{ ...td, fontWeight: 700, color: avg(h => h.govScore) >= 65 ? T.green : avg(h => h.govScore) >= 50 ? T.amber : T.red }}>
                          {avg(h => h.govScore).toFixed(0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── COUNTRY-LEVEL PORTFOLIO SUMMARY ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Country-Level Board Diversity Summary</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Country', 'Holdings', 'Avg Female %', 'National Avg', 'Gap', 'Quota Type', 'Compliance Rate'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    boardData.reduce((acc, h) => {
                      const c = h.countryCode || 'Unknown';
                      if (!acc[c]) acc[c] = [];
                      acc[c].push(h);
                      return acc;
                    }, {})
                  ).sort((a, b) => b[1].length - a[1].length).map(([country, holdings], i) => {
                    const n = holdings.length;
                    const avgF = holdings.reduce((s, h) => s + h.female_pct, 0) / n;
                    const reg = getCountryReg(country);
                    const natAvg = reg ? reg.current_avg : null;
                    const gap = natAvg != null ? (avgF - natAvg).toFixed(1) : 'N/A';
                    const compliant = holdings.filter(h => h.quotaCompliance === 'Compliant' || h.quotaCompliance === 'Meets Target').length;
                    return (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <td style={{ ...td, fontWeight: 600 }}>{country}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{n}</td>
                        <td style={{ ...td, fontWeight: 700, color: avgF >= 30 ? T.green : avgF >= 20 ? T.amber : T.red }}>
                          {avgF.toFixed(1)}%
                        </td>
                        <td style={td}>{natAvg != null ? natAvg + '%' : 'N/A'}</td>
                        <td style={{ ...td, fontWeight: 600, color: parseFloat(gap) > 0 ? T.green : parseFloat(gap) < 0 ? T.red : T.text }}>
                          {typeof gap === 'string' && gap !== 'N/A' ? (parseFloat(gap) > 0 ? '+' : '') + gap + 'pp' : gap}
                        </td>
                        <td style={td}>{reg ? (reg.mandatory ? 'Mandatory' : 'Voluntary') : 'None'}</td>
                        <td style={td}>
                          {n > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 50, height: 6, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
                                <div style={{ width: `${(compliant / n) * 100}%`, height: '100%', borderRadius: 3, background: T.green }} />
                              </div>
                              <span style={{ fontSize: 11 }}>{compliant}/{n}</span>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 6. BOARD COMPOSITION PIE ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 10 }}>Gender Split (Portfolio-Weighted)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={genderPie} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}%`} labelLine={{ stroke: T.textMut }}>
                    {genderPie.map((_, i) => <Cell key={i} fill={[T.sage, T.navy][i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 10 }}>Independence Split (Portfolio-Weighted)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={independencePie} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}%`} labelLine={{ stroke: T.textMut }}>
                    {independencePie.map((_, i) => <Cell key={i} fill={[T.gold, T.textMut][i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 8. RED FLAGS ── */}
          <div style={{ ...card, borderLeft: `4px solid ${T.red}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.red, marginTop: 0, marginBottom: 12 }}>Governance Red Flags ({redFlags.length} holdings)</h3>
            {redFlags.length === 0 ? <p style={{ color: T.textMut, fontSize: 13 }}>No governance red flags detected in the current portfolio.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>{['Company', 'Sector', 'Issue(s)', 'Gov Score'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {redFlags.slice(0, 15).map((h, i) => {
                      const issues = [];
                      if (!h.ceo_chair_split) issues.push('CEO = Chair');
                      if (h.female_pct < 20) issues.push(`Female ${h.female_pct}% (<20%)`);
                      if (h.independent_pct < 50) issues.push(`Indep. ${h.independent_pct}% (<50%)`);
                      if (h.avg_tenure > 12) issues.push(`Tenure ${h.avg_tenure}yr (>12yr)`);
                      return (
                        <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                          <td style={{ ...td, fontWeight: 600 }}>{h.name}</td>
                          <td style={td}>{h.sector}</td>
                          <td style={td}>{issues.map((iss, j) => <span key={j} style={{ ...pillStyle(T.red), marginRight: 4, marginBottom: 2 }}>{iss}</span>)}</td>
                          <td style={{ ...td, fontWeight: 700, color: h.govScore < 40 ? T.red : h.govScore < 60 ? T.amber : T.navy }}>{h.govScore}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── 9. AGE & TENURE DISTRIBUTION ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 10 }}>Board Age Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Holdings" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 10 }}>Board Tenure Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tenureDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Holdings" fill={T.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 10. SORTABLE HOLDINGS TABLE ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Holdings Board Governance Detail</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
                <thead>
                  <tr>
                    {[
                      { key: 'name', label: 'Company' }, { key: 'sector', label: 'Sector' }, { key: 'countryCode', label: 'Country' },
                      { key: 'female_pct', label: 'Female %' }, { key: 'independent_pct', label: 'Indep %' },
                      { key: 'board_size', label: 'Size' }, { key: 'ceo_chair_split', label: 'CEO-Chair' },
                      { key: 'avg_tenure', label: 'Tenure' }, { key: 'ethnic_diversity_pct', label: 'Ethnic %' },
                      { key: 'skills_coverage', label: 'Skills' }, { key: 'govScore', label: 'Gov Score' },
                      { key: 'quotaCompliance', label: 'Quota' },
                    ].map(c => (
                      <th key={c.key} onClick={() => handleSort(c.key)} style={th}>
                        {c.label} {sortCol === c.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h, i) => (
                    <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = `${T.gold}10`}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 ? T.surfaceH : T.surface}>
                      <td style={{ ...td, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                      <td style={{ ...td, fontSize: 11 }}>{h.sector}</td>
                      <td style={td}>{h.countryCode}</td>
                      <td style={{ ...td, color: h.female_pct >= 30 ? T.green : h.female_pct >= 20 ? T.amber : T.red, fontWeight: 700 }}>{h.female_pct}%</td>
                      <td style={{ ...td, color: h.independent_pct >= 75 ? T.green : h.independent_pct >= 50 ? T.amber : T.red, fontWeight: 600 }}>{h.independent_pct}%</td>
                      <td style={td}>{h.board_size}</td>
                      <td style={td}><span style={pillStyle(h.ceo_chair_split ? T.green : T.red)}>{h.ceo_chair_split ? 'Split' : 'Combined'}</span></td>
                      <td style={{ ...td, color: h.avg_tenure > 12 ? T.red : T.text }}>{h.avg_tenure}yr</td>
                      <td style={td}>{h.ethnic_diversity_pct}%</td>
                      <td style={td}>{(h.skills_coverage * 100).toFixed(0)}%</td>
                      <td style={{ ...td, fontWeight: 700, color: h.govScore >= 70 ? T.green : h.govScore >= 50 ? T.amber : T.red }}>{h.govScore}</td>
                      <td style={td}><span style={pillStyle(h.quotaCompliance === 'Compliant' || h.quotaCompliance === 'Meets Target' ? T.green : h.quotaCompliance === 'N/A' ? T.textMut : T.red)}>{h.quotaCompliance}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 11. PEER COMPARISON (Radar) ── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, margin: 0 }}>Peer Comparison</h3>
              <select value={peerSelect} onChange={e => setPeerSelect(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontFamily: T.font, color: T.text, background: T.surface }}>
                {boardData.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={peerData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: T.textSec }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: T.textMut }} domain={[0, 100]} />
                <Radar name={peerSelect} dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
                <Radar name="Sector Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

          {/* ── GOVERNANCE QUARTILE BREAKDOWN ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Governance Score Distribution by Quartile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Top Quartile (75-100)', range: [75, 100], color: T.green, icon: 'A' },
                { label: 'Second Quartile (50-74)', range: [50, 74], color: T.sage, icon: 'B' },
                { label: 'Third Quartile (25-49)', range: [25, 49], color: T.amber, icon: 'C' },
                { label: 'Bottom Quartile (0-24)', range: [0, 24], color: T.red, icon: 'D' },
              ].map((q, i) => {
                const holdings = boardData.filter(h => h.govScore >= q.range[0] && h.govScore <= q.range[1]);
                const pct = boardData.length ? ((holdings.length / boardData.length) * 100).toFixed(0) : 0;
                return (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, textAlign: 'center', borderTop: `3px solid ${q.color}` }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: q.color }}>{holdings.length}</div>
                    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginTop: 4 }}>{q.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginTop: 4 }}>{pct}%</div>
                    <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>of portfolio</div>
                    {holdings.slice(0, 3).map((h, j) => (
                      <div key={j} style={{ fontSize: 10, color: T.textSec, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.name} ({h.govScore})
                      </div>
                    ))}
                    {holdings.length > 3 && <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>+{holdings.length - 3} more</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── BOARD SIZE OPTIMIZATION ANALYSIS ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Board Size Optimization Analysis</h3>
            <p style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>
              Research indicates optimal board size of 7-15 members. Too small risks inadequate oversight; too large risks coordination inefficiency.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Undersized (<7)', filter: h => h.board_size < 7, color: T.amber, recommendation: 'Consider adding directors for broader perspective' },
                { label: 'Optimal (7-15)', filter: h => h.board_size >= 7 && h.board_size <= 15, color: T.green, recommendation: 'Within best-practice range' },
                { label: 'Oversized (>15)', filter: h => h.board_size > 15, color: T.red, recommendation: 'Consider streamlining for efficiency' },
              ].map((g, i) => {
                const count = boardData.filter(g.filter).length;
                return (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, borderLeft: `4px solid ${g.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: g.color }}>{g.label}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>{count}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 6 }}>{g.recommendation}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                      {boardData.filter(g.filter).slice(0, 3).map(h => h.name).join(', ')}
                      {count > 3 ? ` +${count - 3}` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

      {activeTab === 'skills' && (
        <>
          {/* ── 7. SKILLS MATRIX HEATMAP ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Board Skills Matrix</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={th}>Company</th>
                    {BOARD_SKILLS.map(sk => <th key={sk} style={{ ...th, textAlign: 'center', fontSize: 10 }}>{sk}</th>)}
                    <th style={{ ...th, textAlign: 'center' }}>Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h, i) => (
                    <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <td style={{ ...td, fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                      {BOARD_SKILLS.map(sk => {
                        const v = h.skillsMap[sk];
                        const bg = v === 'full' ? `${T.green}20` : v === 'partial' ? `${T.amber}20` : `${T.red}15`;
                        const icon = v === 'full' ? '\u2714' : v === 'partial' ? '\u25D0' : '\u2718';
                        const color = v === 'full' ? T.green : v === 'partial' ? T.amber : T.red;
                        return <td key={sk} style={{ ...td, textAlign: 'center', background: bg }}><span style={{ color, fontWeight: 700, fontSize: 14 }}>{icon}</span></td>;
                      })}
                      <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: h.skills_coverage >= 0.7 ? T.green : h.skills_coverage >= 0.5 ? T.amber : T.red }}>{(h.skills_coverage * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'regulation' && (
        <>
          {/* ── 5. REGULATORY COMPLIANCE TABLE ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Country Board Diversity Regulations & Portfolio Compliance</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Country', 'Quota', 'Mandatory', 'Year', 'Penalty', 'National Avg', 'Holdings', 'Compliant', 'Non-Compl.', 'Port. Avg Female %'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {regCompliance.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <td style={{ ...td, fontWeight: 600 }}>{r.country}</td>
                      <td style={td}>{r.quota}</td>
                      <td style={td}><span style={pillStyle(r.mandatory ? T.red : T.textMut)}>{r.mandatory ? 'Yes' : 'No'}</span></td>
                      <td style={td}>{r.year_enacted || 'N/A'}</td>
                      <td style={{ ...td, fontSize: 11 }}>{r.penalty}</td>
                      <td style={td}>{r.current_avg}%</td>
                      <td style={{ ...td, fontWeight: 600 }}>{r.holdingsCount}</td>
                      <td style={td}>{r.holdingsCount > 0 ? <span style={pillStyle(T.green)}>{r.compliant}</span> : '-'}</td>
                      <td style={td}>{r.holdingsCount > 0 ? <span style={pillStyle(r.nonCompliant > 0 ? T.red : T.textMut)}>{r.nonCompliant}</span> : '-'}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{r.avgFemale != null ? r.avgFemale + '%' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'engagement' && (
        <>
          {/* ── 12. ENGAGEMENT RECOMMENDATIONS ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Engagement Recommendations</h3>
            {recommendations.length === 0 ? <p style={{ color: T.textMut, fontSize: 13 }}>No governance gaps requiring engagement found.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>{['Priority', 'Company', 'Metric', 'Recommended Action', 'Gap'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {recommendations.map((r, i) => (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <td style={td}><span style={pillStyle(r.priority === 'Critical' ? T.red : r.priority === 'High' ? T.amber : T.textSec)}>{r.priority}</span></td>
                        <td style={{ ...td, fontWeight: 600 }}>{r.company}</td>
                        <td style={td}>{r.metric}</td>
                        <td style={{ ...td, maxWidth: 350 }}>{r.action}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{r.gap > 0 ? r.gap.toFixed(1) + 'pp' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── 13. DATA INPUT FORM ── */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginTop: 0, marginBottom: 14 }}>Board Data Input (editable, persisted to localStorage)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['Company', 'Female %', 'Independent %', 'Board Size', 'CEO-Chair Split'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {boardData.slice(0, 20).map((h, i) => {
                    const key = h.name || h.ticker || i;
                    const ed = editData[key] || {};
                    const updateField = (field, val) => {
                      setEditData(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: val } }));
                    };
                    return (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                        <td style={{ ...td, fontWeight: 600 }}>{h.name}</td>
                        <td style={td}><input type="number" min={0} max={100} value={ed.female_pct ?? h.female_pct} onChange={e => updateField('female_pct', +e.target.value)} style={{ width: 60, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font }} /></td>
                        <td style={td}><input type="number" min={0} max={100} value={ed.independent_pct ?? h.independent_pct} onChange={e => updateField('independent_pct', +e.target.value)} style={{ width: 60, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font }} /></td>
                        <td style={td}><input type="number" min={3} max={25} value={ed.board_size ?? h.board_size} onChange={e => updateField('board_size', +e.target.value)} style={{ width: 60, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font }} /></td>
                        <td style={td}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <input type="checkbox" checked={ed.ceo_chair_split ?? h.ceo_chair_split} onChange={e => updateField('ceo_chair_split', e.target.checked)} />
                            <span style={{ fontSize: 11 }}>{(ed.ceo_chair_split ?? h.ceo_chair_split) ? 'Split' : 'Combined'}</span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: T.textMut }}>Changes auto-saved to <code>ra_board_diversity_v1</code> in localStorage.</div>
          </div>
        </>
      )}

      {/* ── 14. CROSS-NAVIGATION ── */}
      <div style={{ ...card, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginRight: 8 }}>Navigate to:</span>
        {[
          { label: 'ESG Dashboard', path: '/esg-dashboard' },
          { label: 'Stewardship', path: '/stewardship' },
          { label: 'Regulatory Gap', path: '/regulatory-gap' },
          { label: 'Living Wage Analyzer', path: '/living-wage' },
          { label: 'Supply Chain', path: '/supply-chain' },
          { label: 'Portfolio Manager', path: '/portfolio' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ background: `${T.navy}08`, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.navy, fontFamily: T.font, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.background = T.navy; e.target.style.color = '#fff'; }}
            onMouseLeave={e => { e.target.style.background = `${T.navy}08`; e.target.style.color = T.navy; }}>
            {n.label}
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: 24, fontSize: 11, color: T.textMut }}>Board Diversity & Governance Scorecard &middot; Risk Analytics Platform v6.0 &middot; {boardData.length} holdings &middot; {new Date().toLocaleDateString()}</div>
    </div>
  );
}
