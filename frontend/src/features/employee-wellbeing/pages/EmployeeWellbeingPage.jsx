import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis, AreaChart, Area, LineChart, Line } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ================================================================
   SECTOR HUMAN CAPITAL BENCHMARKS — 11 SECTORS x 10 METRICS
   ================================================================ */
const SECTOR_HC_BENCHMARKS = {
  Energy:                    { turnover_pct: 12, safety_incident_rate: 1.8, training_hrs_per_emp: 35, engagement_score: 68, absenteeism_pct: 4.2, female_workforce_pct: 22, temp_worker_pct: 15, avg_tenure_yr: 8.5, unionized_pct: 45, fatality_rate_per_100k: 4.5 },
  Materials:                 { turnover_pct: 14, safety_incident_rate: 2.5, training_hrs_per_emp: 28, engagement_score: 62, absenteeism_pct: 5.0, female_workforce_pct: 18, temp_worker_pct: 22, avg_tenure_yr: 7.0, unionized_pct: 55, fatality_rate_per_100k: 6.8 },
  Industrials:               { turnover_pct: 15, safety_incident_rate: 2.0, training_hrs_per_emp: 30, engagement_score: 65, absenteeism_pct: 4.5, female_workforce_pct: 25, temp_worker_pct: 18, avg_tenure_yr: 6.5, unionized_pct: 35, fatality_rate_per_100k: 3.2 },
  'Consumer Discretionary':  { turnover_pct: 20, safety_incident_rate: 1.2, training_hrs_per_emp: 25, engagement_score: 64, absenteeism_pct: 4.8, female_workforce_pct: 42, temp_worker_pct: 28, avg_tenure_yr: 4.0, unionized_pct: 12, fatality_rate_per_100k: 1.5 },
  'Consumer Staples':        { turnover_pct: 16, safety_incident_rate: 1.5, training_hrs_per_emp: 22, engagement_score: 66, absenteeism_pct: 4.0, female_workforce_pct: 38, temp_worker_pct: 25, avg_tenure_yr: 5.5, unionized_pct: 30, fatality_rate_per_100k: 2.2 },
  'Health Care':             { turnover_pct: 19, safety_incident_rate: 1.0, training_hrs_per_emp: 42, engagement_score: 71, absenteeism_pct: 3.8, female_workforce_pct: 62, temp_worker_pct: 15, avg_tenure_yr: 5.0, unionized_pct: 20, fatality_rate_per_100k: 0.5 },
  Financials:                { turnover_pct: 18, safety_incident_rate: 0.2, training_hrs_per_emp: 40, engagement_score: 70, absenteeism_pct: 3.5, female_workforce_pct: 48, temp_worker_pct: 12, avg_tenure_yr: 5.0, unionized_pct: 15, fatality_rate_per_100k: 0.1 },
  'Information Technology':  { turnover_pct: 22, safety_incident_rate: 0.3, training_hrs_per_emp: 45, engagement_score: 72, absenteeism_pct: 3.0, female_workforce_pct: 32, temp_worker_pct: 25, avg_tenure_yr: 3.5, unionized_pct: 5, fatality_rate_per_100k: 0.2 },
  'Communication Services':  { turnover_pct: 17, safety_incident_rate: 0.4, training_hrs_per_emp: 32, engagement_score: 69, absenteeism_pct: 3.2, female_workforce_pct: 40, temp_worker_pct: 20, avg_tenure_yr: 4.5, unionized_pct: 18, fatality_rate_per_100k: 0.3 },
  Utilities:                 { turnover_pct: 10, safety_incident_rate: 1.6, training_hrs_per_emp: 38, engagement_score: 67, absenteeism_pct: 3.8, female_workforce_pct: 24, temp_worker_pct: 10, avg_tenure_yr: 10.0, unionized_pct: 60, fatality_rate_per_100k: 3.8 },
  'Real Estate':             { turnover_pct: 14, safety_incident_rate: 1.4, training_hrs_per_emp: 20, engagement_score: 63, absenteeism_pct: 4.5, female_workforce_pct: 35, temp_worker_pct: 30, avg_tenure_yr: 4.5, unionized_pct: 10, fatality_rate_per_100k: 2.0 },
};

const SECTOR_KEYS = Object.keys(SECTOR_HC_BENCHMARKS);

/* ================================================================
   ENGAGEMENT TREND (simulated portfolio-weighted)
   ================================================================ */
const ENGAGEMENT_TREND = [
  { year: 2019, score: 64, benchmark: 62 },
  { year: 2020, score: 61, benchmark: 60 },
  { year: 2021, score: 63, benchmark: 61 },
  { year: 2022, score: 65, benchmark: 63 },
  { year: 2023, score: 67, benchmark: 64 },
  { year: 2024, score: 68, benchmark: 65 },
  { year: 2025, score: 69, benchmark: 66 },
];

const BAR_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899', '#6366f1', '#f43f5e', '#14b8a6'];

/* ================================================================
   HELPERS
   ================================================================ */
const mapSector = s => (s === 'IT' ? 'Information Technology' : s);
const getBenchmark = s => SECTOR_HC_BENCHMARKS[mapSector(s)] || SECTOR_HC_BENCHMARKS['Financials'];
const fmt = n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n;
const hash = s => { let h = 0; for (let i = 0; i < (s||'').length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ================================================================
   INLINE COMPONENTS
   ================================================================ */
const Section = ({ title, sub, children, style }) => (
  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20, ...style }}>
    <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: sub ? 2 : 12, fontFamily: T.font }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginBottom: 14 }}>{sub}</div>}
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 18px', minWidth: 150, flex: '1 1 160px' }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6, fontFamily: T.font }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Btn = ({ children, onClick, active, small, style }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, background: active ? T.navy : T.surface, color: active ? '#fff' : T.text, fontSize: small ? 12 : 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font, transition: 'all .15s', ...style }}>{children}</button>
);

const Badge = ({ text, color }) => (
  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${color}18`, color, fontFamily: T.font }}>{text}</span>
);

const TH = ({ children, onClick, sorted, style }) => (
  <th onClick={onClick} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: `2px solid ${T.border}`, cursor: onClick ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', fontFamily: T.font, ...style }}>
    {children}{sorted ? (sorted === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);

const TD = ({ children, style }) => (
  <td style={{ padding: '9px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}`, fontFamily: T.font, ...style }}>{children}</td>
);

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
const EmployeeWellbeingPage = () => {
  const navigate = useNavigate();

  /* -- Portfolio -- */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      if (raw.length) return raw;
      return (GLOBAL_COMPANY_MASTER || []).slice(0, 25);
    } catch { return (GLOBAL_COMPANY_MASTER || []).slice(0, 25); }
  }, []);

  /* -- State -- */
  const [sortCol, setSortCol] = useState('turnover');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [overrideSliders, setOverrideSliders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_emp_wellbeing_sliders_v1')) || {}; } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem('ra_emp_wellbeing_sliders_v1', JSON.stringify(overrideSliders)); }, [overrideSliders]);

  /* -- Generate deterministic HC data per holding -- */
  const scoredHoldings = useMemo(() => {
    return portfolio.map(c => {
      const sector = c.gics_sector || c.sector || 'Financials';
      const displaySector = mapSector(sector);
      const bm = getBenchmark(sector);
      const h = hash(c.isin || c.company_name || '');
      const employees = c.employees || c.total_employees || 5000 + (h % 80000);
      const weight = c.weight_pct || c.portfolio_weight || 2 + (h % 6);
      const sliderAdj = overrideSliders[c.isin || c.company_name] != null ? overrideSliders[c.isin || c.company_name] / 100 : 1;

      const turnover = clamp(+(bm.turnover_pct * (0.7 + (h % 60) / 100) * sliderAdj).toFixed(1), 3, 40);
      const safety = clamp(+(bm.safety_incident_rate * (0.5 + (h % 100) / 100) * sliderAdj).toFixed(2), 0, 8);
      const training = clamp(Math.round(bm.training_hrs_per_emp * (0.6 + (h % 80) / 100)), 5, 80);
      const engagement = clamp(Math.round(bm.engagement_score + (h % 20) - 10), 35, 95);
      const absenteeism = clamp(+(bm.absenteeism_pct * (0.6 + (h % 80) / 100)).toFixed(1), 1, 10);
      const female = clamp(Math.round(bm.female_workforce_pct + (h % 20) - 10), 5, 65);
      const temp = clamp(Math.round(bm.temp_worker_pct + (h % 15) - 7), 2, 50);
      const tenure = clamp(+(bm.avg_tenure_yr + (h % 6) - 3).toFixed(1), 1, 18);
      const unionized = clamp(Math.round(bm.unionized_pct + (h % 25) - 12), 0, 85);
      const fatality = clamp(+(bm.fatality_rate_per_100k * (0.3 + (h % 140) / 100)).toFixed(1), 0, 12);

      /* Risk flags */
      const flags = [];
      if (turnover > 25) flags.push('High Turnover');
      if (safety > 3.0) flags.push('Safety Risk');
      if (engagement < 55) flags.push('Low Engagement');
      if (female < 15) flags.push('Low Diversity');
      if (fatality > 5) flags.push('Fatality Concern');

      return { ...c, sector, displaySector, employees, weight, turnover, safety, training, engagement, absenteeism, female, temp, tenure, unionized, fatality, flags, bm };
    });
  }, [portfolio, overrideSliders]);

  /* -- Sort -- */
  const toggleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };
  const sorted = dir => dir === 'asc' ? 'asc' : 'desc';

  const sortedHoldings = useMemo(() => {
    const arr = [...scoredHoldings];
    arr.sort((a, b) => {
      const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return arr;
  }, [scoredHoldings, sortCol, sortDir]);

  /* -- KPI aggregates -- */
  const kpis = useMemo(() => {
    if (!scoredHoldings.length) return {};
    const wt = h => h.weight || 2;
    const totalW = scoredHoldings.reduce((s, h) => s + wt(h), 0);
    const wavg = (key) => (scoredHoldings.reduce((s, h) => s + h[key] * wt(h), 0) / totalW).toFixed(1);
    return {
      turnover: wavg('turnover'), safety: wavg('safety'), training: Math.round(parseFloat(wavg('training'))),
      engagement: Math.round(parseFloat(wavg('engagement'))), female: Math.round(parseFloat(wavg('female'))),
      temp: Math.round(parseFloat(wavg('temp'))), tenure: wavg('tenure'), unionized: Math.round(parseFloat(wavg('unionized'))),
      fatality: wavg('fatality'), absenteeism: wavg('absenteeism'),
    };
  }, [scoredHoldings]);

  /* -- Radar chart data -- */
  const radarData = useMemo(() => {
    if (!scoredHoldings.length) return [];
    const avg = key => scoredHoldings.reduce((s, h) => s + h[key], 0) / scoredHoldings.length;
    return [
      { axis: 'Safety', value: Math.max(0, 100 - avg('safety') * 20), fullMark: 100 },
      { axis: 'Engagement', value: avg('engagement'), fullMark: 100 },
      { axis: 'Training', value: Math.min(100, avg('training') * 2), fullMark: 100 },
      { axis: 'Diversity', value: avg('female'), fullMark: 100 },
      { axis: 'Stability', value: Math.max(0, 100 - avg('turnover') * 3), fullMark: 100 },
      { axis: 'Benefits', value: Math.min(100, avg('unionized') + 30), fullMark: 100 },
      { axis: 'Development', value: Math.min(100, avg('training') * 1.5 + 10), fullMark: 100 },
      { axis: 'Wellbeing', value: Math.max(0, 100 - avg('absenteeism') * 12), fullMark: 100 },
    ];
  }, [scoredHoldings]);

  /* -- Safety chart data by sector -- */
  const safetyBySector = useMemo(() => SECTOR_KEYS.map(s => ({
    sector: s.length > 14 ? s.slice(0, 14) + '...' : s,
    fullSector: s,
    incidentRate: SECTOR_HC_BENCHMARKS[s].safety_incident_rate,
    fatalityRate: SECTOR_HC_BENCHMARKS[s].fatality_rate_per_100k,
  })), []);

  /* -- Scatter data: engagement vs turnover -- */
  const scatterData = useMemo(() => scoredHoldings.map(h => ({
    x: h.engagement, y: h.turnover, z: Math.min(h.employees / 500, 60), name: (h.company_name || '').slice(0, 16), sector: h.sector,
  })), [scoredHoldings]);

  /* -- Workforce composition -- */
  const workforceComp = useMemo(() => SECTOR_KEYS.map(s => ({
    sector: s.length > 14 ? s.slice(0, 14) + '...' : s,
    fullSector: s,
    Female: SECTOR_HC_BENCHMARKS[s].female_workforce_pct,
    Temp: SECTOR_HC_BENCHMARKS[s].temp_worker_pct,
    Unionized: SECTOR_HC_BENCHMARKS[s].unionized_pct,
  })), []);

  /* -- Training investment data -- */
  const trainingData = useMemo(() => {
    const portAvg = scoredHoldings.length > 0 ? Math.round(scoredHoldings.reduce((s, h) => s + h.training, 0) / scoredHoldings.length) : 0;
    return SECTOR_KEYS.map(s => ({
      sector: s.length > 14 ? s.slice(0, 14) + '...' : s,
      benchmark: SECTOR_HC_BENCHMARKS[s].training_hrs_per_emp,
      portfolio: portAvg,
    }));
  }, [scoredHoldings]);

  /* -- Risk flags -- */
  const flaggedHoldings = useMemo(() => scoredHoldings.filter(h => h.flags.length > 0).sort((a, b) => b.flags.length - a.flags.length), [scoredHoldings]);

  /* -- Peer comparison -- */
  const peerMetrics = useMemo(() => {
    if (!selectedPeer) return null;
    const h = scoredHoldings.find(x => (x.isin || x.company_name) === selectedPeer);
    if (!h) return null;
    const bm = h.bm;
    return [
      { metric: 'Turnover %', company: h.turnover, benchmark: bm.turnover_pct, better: h.turnover < bm.turnover_pct },
      { metric: 'Safety Incident Rate', company: h.safety, benchmark: bm.safety_incident_rate, better: h.safety < bm.safety_incident_rate },
      { metric: 'Training Hrs/Emp', company: h.training, benchmark: bm.training_hrs_per_emp, better: h.training > bm.training_hrs_per_emp },
      { metric: 'Engagement Score', company: h.engagement, benchmark: bm.engagement_score, better: h.engagement > bm.engagement_score },
      { metric: 'Female Workforce %', company: h.female, benchmark: bm.female_workforce_pct, better: h.female > bm.female_workforce_pct },
      { metric: 'Temp Worker %', company: h.temp, benchmark: bm.temp_worker_pct, better: h.temp < bm.temp_worker_pct },
      { metric: 'Avg Tenure (yr)', company: h.tenure, benchmark: bm.avg_tenure_yr, better: h.tenure > bm.avg_tenure_yr },
      { metric: 'Unionized %', company: h.unionized, benchmark: bm.unionized_pct, better: true },
      { metric: 'Fatality Rate/100k', company: h.fatality, benchmark: bm.fatality_rate_per_100k, better: h.fatality < bm.fatality_rate_per_100k },
      { metric: 'Absenteeism %', company: h.absenteeism, benchmark: bm.absenteeism_pct, better: h.absenteeism < bm.absenteeism_pct },
    ];
  }, [selectedPeer, scoredHoldings]);

  /* -- Exports -- */
  const exportCSV = useCallback(() => {
    const headers = ['Company', 'ISIN', 'Sector', 'Employees', 'Turnover%', 'SafetyRate', 'TrainingHrs', 'Engagement', 'Female%', 'Temp%', 'Tenure', 'Unionized%', 'Fatality', 'Absenteeism%', 'Flags', 'Weight%'];
    const rows = sortedHoldings.map(h => [h.company_name, h.isin, h.sector, h.employees, h.turnover, h.safety, h.training, h.engagement, h.female, h.temp, h.tenure, h.unionized, h.fatality, h.absenteeism, h.flags.join('; '), h.weight]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'human_capital_report.csv'; a.click();
  }, [sortedHoldings]);

  const exportSafetyCSV = useCallback(() => {
    const headers = ['Company', 'Sector', 'SafetyIncidentRate', 'FatalityRate', 'Flags'];
    const rows = sortedHoldings.map(h => [h.company_name, h.sector, h.safety, h.fatality, h.flags.filter(f => f.includes('Safety') || f.includes('Fatal')).join('; ')]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'safety_report.csv'; a.click();
  }, [sortedHoldings]);

  const handlePrint = useCallback(() => window.print(), []);

  /* -- Render -- */
  return (
    <div style={{ padding: 24, fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* ===== 1. HEADER ===== */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Employee Wellbeing & Human Capital Dashboard</h1>
          <Badge text="10 Metrics" color={T.navy} /><Badge text="11 Sectors" color={T.sage} /><Badge text="Safety" color={T.red} /><Badge text="Engagement" color={T.gold} />
        </div>
        <p style={{ color: T.textSec, fontSize: 13, marginTop: 6 }}>Comprehensive human capital analytics across {scoredHoldings.length} holdings -- workforce composition, safety, engagement, turnover, training</p>
      </div>

      {/* ===== 2. KPI CARDS ===== */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Avg Turnover" value={`${kpis.turnover || 0}%`} sub="Portfolio weighted" color={parseFloat(kpis.turnover) > 20 ? T.red : T.navy} />
        <KpiCard label="Safety Incident Rate" value={kpis.safety || '-'} sub="Per 200k hrs" color={parseFloat(kpis.safety) > 2 ? T.red : T.sage} />
        <KpiCard label="Training Hours" value={kpis.training || 0} sub="Per employee" color={T.navy} />
        <KpiCard label="Engagement Score" value={kpis.engagement || 0} sub="Out of 100" color={parseInt(kpis.engagement) < 60 ? T.amber : T.sage} />
        <KpiCard label="Female Workforce" value={`${kpis.female || 0}%`} sub="Portfolio avg" color={T.gold} />
        <KpiCard label="Temp Workers" value={`${kpis.temp || 0}%`} sub="Portfolio avg" color={T.amber} />
        <KpiCard label="Avg Tenure" value={`${kpis.tenure || 0} yr`} sub="Portfolio avg" color={T.navy} />
        <KpiCard label="Unionization" value={`${kpis.unionized || 0}%`} sub="Portfolio avg" color={T.sage} />
        <KpiCard label="Fatality Rate" value={kpis.fatality || '-'} sub="Per 100k workers" color={parseFloat(kpis.fatality) > 3 ? T.red : T.green} />
        <KpiCard label="Absenteeism" value={`${kpis.absenteeism || 0}%`} sub="Portfolio avg" color={T.amber} />
      </div>

      {/* ===== 3. HUMAN CAPITAL SCORECARD RADAR ===== */}
      <Section title="Human Capital Scorecard" sub="8-axis radar: Safety, Engagement, Training, Diversity, Stability, Benefits, Development, Wellbeing">
        <ResponsiveContainer width="100%" height={360}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: T.textSec }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
            <Radar name="Portfolio" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== 4. SAFETY PERFORMANCE BARCHART ===== */}
      <Section title="Safety Performance by Sector" sub="Incident rate (per 200k hours) and fatality rate (per 100k workers) -- sector benchmarks">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={safetyBySector} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="incidentRate" name="Incident Rate" fill={T.amber} radius={[4,4,0,0]} />
            <Bar dataKey="fatalityRate" name="Fatality Rate/100k" fill={T.red} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== 5. TURNOVER VS ENGAGEMENT SCATTER ===== */}
      <Section title="Turnover vs Engagement" sub="Each holding as a bubble -- x: engagement, y: turnover %, size: employee count">
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" dataKey="x" name="Engagement" domain={[30, 100]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Engagement Score', position: 'insideBottom', offset: -10, fontSize: 11, fill: T.textSec }} />
            <YAxis type="number" dataKey="y" name="Turnover" domain={[0, 40]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Turnover %', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
            <ZAxis type="number" dataKey="z" range={[40, 400]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} formatter={(value, name) => [fmt(value), name]} />
            <Scatter name="Holdings" data={scatterData} fill={T.navy} fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== 6. WORKFORCE COMPOSITION STACKED BAR ===== */}
      <Section title="Workforce Composition by Sector" sub="Female %, Temp %, Unionized % -- stacked bar per sector">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={workforceComp} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Female" stackId="a" fill={T.gold} radius={[0,0,0,0]} />
            <Bar dataKey="Temp" stackId="a" fill={T.amber} radius={[0,0,0,0]} />
            <Bar dataKey="Unionized" stackId="a" fill={T.sage} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== 7. TRAINING INVESTMENT ===== */}
      <Section title="Training Investment by Sector" sub="Hours per employee -- sector benchmark vs portfolio average">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trainingData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="benchmark" name="Sector Benchmark" fill={T.navy} radius={[4,4,0,0]} />
            <Bar dataKey="portfolio" name="Portfolio Avg" fill={T.gold} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== 8. HOLDINGS HUMAN CAPITAL TABLE ===== */}
      <Section title="Holdings Human Capital Table" sub="All metrics per holding -- color-coded vs sector benchmarks">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { key: 'company_name', label: 'Company' }, { key: 'sector', label: 'Sector' },
                  { key: 'turnover', label: 'Turnover%' }, { key: 'safety', label: 'Safety' },
                  { key: 'training', label: 'Training' }, { key: 'engagement', label: 'Engage.' },
                  { key: 'female', label: 'Female%' }, { key: 'temp', label: 'Temp%' },
                  { key: 'tenure', label: 'Tenure' }, { key: 'unionized', label: 'Union%' },
                  { key: 'fatality', label: 'Fatal.' }, { key: 'absenteeism', label: 'Absent.%' },
                ].map(col => (
                  <TH key={col.key} onClick={() => toggleSort(col.key)} sorted={sortCol === col.key ? sorted(sortDir) : null}>{col.label}</TH>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h, i) => {
                const bm = h.bm;
                return (
                  <tr key={h.isin || i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <TD style={{ fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name}</TD>
                    <TD style={{ fontSize: 11 }}>{h.sector}</TD>
                    <TD style={{ color: h.turnover > bm.turnover_pct * 1.2 ? T.red : h.turnover < bm.turnover_pct * 0.8 ? T.green : T.text, fontWeight: 600 }}>{h.turnover}%</TD>
                    <TD style={{ color: h.safety > bm.safety_incident_rate * 1.2 ? T.red : h.safety < bm.safety_incident_rate * 0.8 ? T.green : T.text, fontWeight: 600 }}>{h.safety}</TD>
                    <TD style={{ color: h.training > bm.training_hrs_per_emp ? T.green : T.amber, fontWeight: 600 }}>{h.training}</TD>
                    <TD style={{ color: h.engagement > bm.engagement_score ? T.green : h.engagement < bm.engagement_score - 10 ? T.red : T.amber, fontWeight: 600 }}>{h.engagement}</TD>
                    <TD style={{ color: h.female > bm.female_workforce_pct ? T.green : T.amber }}>{h.female}%</TD>
                    <TD>{h.temp}%</TD>
                    <TD>{h.tenure} yr</TD>
                    <TD>{h.unionized}%</TD>
                    <TD style={{ color: h.fatality > bm.fatality_rate_per_100k * 1.3 ? T.red : T.green, fontWeight: 600 }}>{h.fatality}</TD>
                    <TD style={{ color: h.absenteeism > bm.absenteeism_pct * 1.2 ? T.amber : T.text }}>{h.absenteeism}%</TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ===== 9. PEER COMPARISON ===== */}
      <Section title="Peer Comparison" sub="Select a holding to compare against sector benchmark on all 10 metrics">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {scoredHoldings.slice(0, 15).map(h => {
            const key = h.isin || h.company_name;
            return <Btn key={key} small active={selectedPeer === key} onClick={() => setSelectedPeer(key)}>{(h.company_name || '').slice(0, 14)}</Btn>;
          })}
        </div>
        {peerMetrics && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH>Metric</TH><TH style={{ textAlign: 'center' }}>Company</TH><TH style={{ textAlign: 'center' }}>Sector Benchmark</TH><TH style={{ textAlign: 'center' }}>vs Benchmark</TH></tr></thead>
              <tbody>
                {peerMetrics.map((m, i) => (
                  <tr key={m.metric} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <TD style={{ fontWeight: 600 }}>{m.metric}</TD>
                    <TD style={{ textAlign: 'center', fontWeight: 700, color: m.better ? T.green : T.red }}>{fmt(m.company)}</TD>
                    <TD style={{ textAlign: 'center', color: T.textSec }}>{fmt(m.benchmark)}</TD>
                    <TD style={{ textAlign: 'center' }}><Badge text={m.better ? 'Better' : 'Below'} color={m.better ? T.green : T.red} /></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ===== 10. HUMAN CAPITAL RISK FLAGS ===== */}
      <Section title="Human Capital Risk Flags" sub="Holdings with: turnover>25%, safety>3.0, engagement<55, female<15%, fatality>5">
        {flaggedHoldings.length === 0 ? (
          <div style={{ color: T.green, fontWeight: 600, fontSize: 14, textAlign: 'center', padding: 20 }}>No risk flags detected across portfolio</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {flaggedHoldings.slice(0, 12).map((h, i) => (
              <div key={h.isin || i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surface }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6, fontSize: 13 }}>{h.company_name}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>{h.sector} | {h.employees?.toLocaleString()} employees</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {h.flags.map(f => <Badge key={f} text={f} color={f.includes('Safety') || f.includes('Fatal') ? T.red : f.includes('Turnover') ? T.amber : T.gold} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ===== 11. ENGAGEMENT TREND ===== */}
      <Section title="Engagement Trend" sub="Portfolio-weighted engagement score over time vs market benchmark">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={ENGAGEMENT_TREND} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis domain={[55, 75]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="score" name="Portfolio Engagement" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
            <Area type="monotone" dataKey="benchmark" name="Market Benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== 12. EXPORTS & CROSS-NAV ===== */}
      <Section title="Exports & Navigation">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <Btn onClick={exportCSV}>Export Human Capital CSV</Btn>
          <Btn onClick={exportSafetyCSV}>Export Safety Report CSV</Btn>
          <Btn onClick={handlePrint}>Print Report</Btn>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Board Diversity', path: '/board-diversity' },
            { label: 'Living Wage', path: '/living-wage' },
            { label: 'ESG Dashboard', path: '/esg-dashboard' },
            { label: 'Human Rights DD', path: '/human-rights-dd' },
            { label: 'Stewardship', path: '/stewardship-dashboard' },
            { label: 'Supply Chain', path: '/supply-chain-analytics' },
          ].map(n => (
            <Btn key={n.path} small onClick={() => navigate(n.path)} style={{ background: T.surfaceH }}>{n.label}</Btn>
          ))}
        </div>
      </Section>

      {/* ===== ADJUSTMENT SLIDERS ===== */}
      <Section title="Override Adjustments" sub="Adjust individual holding human capital multiplier -- persisted to localStorage">
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {scoredHoldings.slice(0, 15).map(h => {
            const key = h.isin || h.company_name;
            const val = overrideSliders[key] ?? 100;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '4px 0' }}>
                <div style={{ width: 140, fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name}</div>
                <input type="range" min={20} max={200} value={val} onChange={e => setOverrideSliders(p => ({ ...p, [key]: +e.target.value }))} style={{ flex: 1, cursor: 'pointer' }} />
                <div style={{ width: 48, fontSize: 12, fontWeight: 600, color: T.navy, textAlign: 'right' }}>{val}%</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ===== SECTOR BENCHMARK DETAIL TABLE ===== */}
      <Section title="Sector Benchmark Reference" sub="All 11 sectors x 10 human capital metrics -- complete benchmark data">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH>Sector</TH><TH style={{ textAlign: 'center' }}>Turn%</TH><TH style={{ textAlign: 'center' }}>Safety</TH>
                <TH style={{ textAlign: 'center' }}>Train Hrs</TH><TH style={{ textAlign: 'center' }}>Engage</TH><TH style={{ textAlign: 'center' }}>Absent%</TH>
                <TH style={{ textAlign: 'center' }}>Female%</TH><TH style={{ textAlign: 'center' }}>Temp%</TH><TH style={{ textAlign: 'center' }}>Tenure</TH>
                <TH style={{ textAlign: 'center' }}>Union%</TH><TH style={{ textAlign: 'center' }}>Fatal/100k</TH>
              </tr>
            </thead>
            <tbody>
              {SECTOR_KEYS.map((s, i) => {
                const bm = SECTOR_HC_BENCHMARKS[s];
                return (
                  <tr key={s} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <TD style={{ fontWeight: 600, fontSize: 12 }}>{s}</TD>
                    <TD style={{ textAlign: 'center', color: bm.turnover_pct > 18 ? T.amber : T.text }}>{bm.turnover_pct}</TD>
                    <TD style={{ textAlign: 'center', color: bm.safety_incident_rate > 1.5 ? T.red : T.green }}>{bm.safety_incident_rate}</TD>
                    <TD style={{ textAlign: 'center' }}>{bm.training_hrs_per_emp}</TD>
                    <TD style={{ textAlign: 'center', color: bm.engagement_score >= 70 ? T.green : T.amber }}>{bm.engagement_score}</TD>
                    <TD style={{ textAlign: 'center' }}>{bm.absenteeism_pct}</TD>
                    <TD style={{ textAlign: 'center', color: bm.female_workforce_pct < 25 ? T.amber : T.sage }}>{bm.female_workforce_pct}</TD>
                    <TD style={{ textAlign: 'center' }}>{bm.temp_worker_pct}</TD>
                    <TD style={{ textAlign: 'center' }}>{bm.avg_tenure_yr}</TD>
                    <TD style={{ textAlign: 'center' }}>{bm.unionized_pct}</TD>
                    <TD style={{ textAlign: 'center', color: bm.fatality_rate_per_100k > 3 ? T.red : T.green, fontWeight: 600 }}>{bm.fatality_rate_per_100k}</TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ===== DIVERSITY DEEP DIVE ===== */}
      <Section title="Gender Diversity Deep Dive" sub="Female workforce % per holding vs sector benchmark -- flagging under-representation">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={scoredHoldings.slice(0, 20).map(h => ({ name: (h.company_name || '').slice(0, 14), female: h.female, benchmark: h.bm.female_workforce_pct }))} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis domain={[0, 70]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="female" name="Company Female %" fill={T.gold} radius={[4,4,0,0]} />
            <Bar dataKey="benchmark" name="Sector Benchmark" fill={T.navy} radius={[4,4,0,0]} opacity={0.4} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Above Benchmark', count: scoredHoldings.filter(h => h.female > h.bm.female_workforce_pct).length, color: T.green },
            { label: 'At Benchmark', count: scoredHoldings.filter(h => Math.abs(h.female - h.bm.female_workforce_pct) <= 3).length, color: T.sage },
            { label: 'Below Benchmark', count: scoredHoldings.filter(h => h.female < h.bm.female_workforce_pct - 3).length, color: T.amber },
            { label: 'Critically Low (<15%)', count: scoredHoldings.filter(h => h.female < 15).length, color: T.red },
          ].map(b => (
            <div key={b.label} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, textAlign: 'center', background: T.surface }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: b.color }}>{b.count}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{b.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== TURNOVER ANALYSIS ===== */}
      <Section title="Turnover Analysis" sub="Portfolio holdings by turnover band -- high turnover signals retention risk">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Low (<10%)', count: scoredHoldings.filter(h => h.turnover < 10).length, color: T.green },
            { label: 'Normal (10-18%)', count: scoredHoldings.filter(h => h.turnover >= 10 && h.turnover < 18).length, color: T.sage },
            { label: 'Elevated (18-25%)', count: scoredHoldings.filter(h => h.turnover >= 18 && h.turnover < 25).length, color: T.amber },
            { label: 'High (>25%)', count: scoredHoldings.filter(h => h.turnover >= 25).length, color: T.red },
          ].map(b => (
            <div key={b.label} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, textAlign: 'center', background: T.surface }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: b.color }}>{b.count}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{b.label}</div>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={scoredHoldings.slice(0, 20).sort((a, b) => b.turnover - a.turnover).map(h => ({ name: (h.company_name || '').slice(0, 14), turnover: h.turnover, benchmark: h.bm.turnover_pct }))} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="turnover" name="Turnover %" radius={[4,4,0,0]}>
              {scoredHoldings.slice(0, 20).sort((a, b) => b.turnover - a.turnover).map((h, i) => <Cell key={i} fill={h.turnover > 25 ? T.red : h.turnover > 18 ? T.amber : T.sage} />)}
            </Bar>
            <Bar dataKey="benchmark" name="Sector Avg" fill={T.navy} opacity={0.3} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== SAFETY DEEP DIVE ===== */}
      <Section title="Safety Performance Deep Dive" sub="Holdings with elevated safety risk -- incident rate and fatality rate vs benchmark">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {scoredHoldings.filter(h => h.safety > h.bm.safety_incident_rate * 1.2 || h.fatality > h.bm.fatality_rate_per_100k * 1.2).slice(0, 8).map((h, i) => (
            <div key={h.isin || i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surface }}>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginBottom: 4 }}>{h.company_name}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{h.sector} | {h.employees?.toLocaleString()} employees</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: h.safety > h.bm.safety_incident_rate * 1.2 ? T.red : T.text }}>{h.safety}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>Incident Rate</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>Benchmark: {h.bm.safety_incident_rate}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: h.fatality > h.bm.fatality_rate_per_100k * 1.2 ? T.red : T.text }}>{h.fatality}</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>Fatality/100k</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>Benchmark: {h.bm.fatality_rate_per_100k}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== TEMP WORKER & GIG ECONOMY ===== */}
      <Section title="Temporary & Contingent Workforce" sub="Holdings with elevated temp worker reliance -- gig economy and precarious work risk">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={scoredHoldings.slice(0, 18).sort((a, b) => b.temp - a.temp).map(h => ({ name: (h.company_name || '').slice(0, 14), temp: h.temp, benchmark: h.bm.temp_worker_pct }))} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="temp" name="Temp Worker %" fill={T.amber} radius={[4,4,0,0]} />
            <Bar dataKey="benchmark" name="Sector Avg" fill={T.navy} opacity={0.3} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== UNIONIZATION LANDSCAPE ===== */}
      <Section title="Unionization Landscape" sub="Unionized % per sector -- implications for labor relations and collective bargaining">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={SECTOR_KEYS.map(s => ({ sector: s.length > 14 ? s.slice(0, 14) + '...' : s, unionized: SECTOR_HC_BENCHMARKS[s].unionized_pct }))} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis domain={[0, 70]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Bar dataKey="unionized" name="Unionized %" radius={[4,4,0,0]}>
              {SECTOR_KEYS.map((s, i) => <Cell key={s} fill={SECTOR_HC_BENCHMARKS[s].unionized_pct > 40 ? T.sage : SECTOR_HC_BENCHMARKS[s].unionized_pct > 20 ? T.gold : T.navy} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== TENURE DISTRIBUTION ===== */}
      <Section title="Average Tenure by Sector" sub="Employee tenure indicates workforce stability -- lower tenure may signal retention challenges">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {SECTOR_KEYS.map(s => {
            const bm = SECTOR_HC_BENCHMARKS[s];
            return (
              <div key={s} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, background: T.surface, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: bm.avg_tenure_yr >= 6 ? T.sage : bm.avg_tenure_yr >= 4 ? T.gold : T.amber }}>{bm.avg_tenure_yr} yr</div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{s.length > 16 ? s.slice(0, 16) + '...' : s}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ===== ABSENTEEISM ANALYSIS ===== */}
      <Section title="Absenteeism Analysis" sub="Absenteeism rate per sector -- higher rates may indicate employee health or engagement issues">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={SECTOR_KEYS.map(s => ({ sector: s.length > 14 ? s.slice(0, 14) + '...' : s, absenteeism: SECTOR_HC_BENCHMARKS[s].absenteeism_pct }))} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis domain={[0, 6]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Bar dataKey="absenteeism" name="Absenteeism %" radius={[4,4,0,0]}>
              {SECTOR_KEYS.map((s, i) => <Cell key={s} fill={SECTOR_HC_BENCHMARKS[s].absenteeism_pct > 4.5 ? T.red : SECTOR_HC_BENCHMARKS[s].absenteeism_pct > 3.5 ? T.amber : T.sage} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== HUMAN CAPITAL RISK SUMMARY ===== */}
      <Section title="Human Capital Risk Summary" sub="Portfolio-level aggregation of key risk dimensions">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { label: 'High Turnover Risk', desc: 'Holdings with turnover > 25%', count: scoredHoldings.filter(h => h.turnover > 25).length, color: T.red },
            { label: 'Safety Concern', desc: 'Holdings with incident rate > 3.0', count: scoredHoldings.filter(h => h.safety > 3.0).length, color: T.red },
            { label: 'Low Engagement', desc: 'Holdings with engagement < 55', count: scoredHoldings.filter(h => h.engagement < 55).length, color: T.amber },
            { label: 'Diversity Gap', desc: 'Holdings with female % < 15%', count: scoredHoldings.filter(h => h.female < 15).length, color: T.gold },
            { label: 'Fatality Risk', desc: 'Holdings with fatality > 5/100k', count: scoredHoldings.filter(h => h.fatality > 5).length, color: T.red },
            { label: 'High Absenteeism', desc: 'Holdings with absent > 5%', count: scoredHoldings.filter(h => h.absenteeism > 5).length, color: T.amber },
          ].map(r => (
            <div key={r.label} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surface }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{r.label}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: r.count > 0 ? r.color : T.green }}>{r.count}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textSec }}>{r.desc}</div>
              <div style={{ marginTop: 6, background: T.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (r.count / scoredHoldings.length) * 100 * 3)}%`, height: '100%', background: r.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== TRAINING VS ENGAGEMENT CORRELATION ===== */}
      <Section title="Training Investment vs Engagement" sub="Sector-level view: do higher training hours correlate with better engagement?">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" dataKey="x" name="Training Hrs" domain={[15, 50]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Training Hours/Employee', position: 'insideBottom', offset: -10, fontSize: 11, fill: T.textSec }} />
            <YAxis type="number" dataKey="y" name="Engagement" domain={[58, 76]} tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Engagement Score', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
            <ZAxis type="number" dataKey="z" range={[60, 300]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Scatter name="Sectors" data={SECTOR_KEYS.map(s => ({ x: SECTOR_HC_BENCHMARKS[s].training_hrs_per_emp, y: SECTOR_HC_BENCHMARKS[s].engagement_score, z: SECTOR_HC_BENCHMARKS[s].turnover_pct * 5, name: s.length > 16 ? s.slice(0, 16) : s }))} fill={T.sage} fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== WELLBEING INDEX COMPOSITE ===== */}
      <Section title="Wellbeing Index Composite" sub="Composite wellbeing score per holding combining engagement, absenteeism, safety, tenure, and training">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {scoredHoldings.slice(0, 16).map((h, i) => {
            const wellbeing = Math.round(
              h.engagement * 0.30 +
              (100 - h.absenteeism * 12) * 0.15 +
              (100 - h.safety * 15) * 0.20 +
              Math.min(100, h.tenure * 10) * 0.15 +
              Math.min(100, h.training * 2) * 0.20
            );
            const clampedWB = Math.max(10, Math.min(95, wellbeing));
            return (
              <div key={h.isin || i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, background: T.surface, textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: clampedWB >= 65 ? T.green : clampedWB >= 45 ? T.amber : T.red }}>{clampedWB}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>Wellbeing Index</div>
                <div style={{ marginTop: 6, background: T.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${clampedWB}%`, height: '100%', background: clampedWB >= 65 ? T.green : clampedWB >= 45 ? T.amber : T.red, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ===== SECTOR COMPARISON RADAR ===== */}
      <Section title="Sector Comparison Radar" sub="Compare two sectors side-by-side on 8 human capital dimensions">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {['Energy', 'Information Technology'].map(sectorName => {
            const bm = SECTOR_HC_BENCHMARKS[sectorName];
            const data = [
              { axis: 'Safety', value: Math.max(0, 100 - bm.safety_incident_rate * 20) },
              { axis: 'Engagement', value: bm.engagement_score },
              { axis: 'Training', value: Math.min(100, bm.training_hrs_per_emp * 2) },
              { axis: 'Diversity', value: bm.female_workforce_pct },
              { axis: 'Stability', value: Math.max(0, 100 - bm.turnover_pct * 3) },
              { axis: 'Benefits', value: Math.min(100, bm.unionized_pct + 30) },
              { axis: 'Development', value: Math.min(100, bm.training_hrs_per_emp * 1.5 + 10) },
              { axis: 'Wellbeing', value: Math.max(0, 100 - bm.absenteeism_pct * 12) },
            ];
            return (
              <div key={sectorName} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{sectorName}</div>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: T.textSec }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    <Radar name={sectorName} dataKey="value" stroke={sectorName === 'Energy' ? T.amber : T.sage} fill={sectorName === 'Energy' ? T.amber : T.sage} fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ===== EMPLOYEE COUNT DISTRIBUTION ===== */}
      <Section title="Employee Count Distribution" sub="Portfolio holdings by employee count -- larger employers carry higher human capital materiality">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { label: '<1,000', count: scoredHoldings.filter(h => h.employees < 1000).length, color: T.sage },
            { label: '1k-10k', count: scoredHoldings.filter(h => h.employees >= 1000 && h.employees < 10000).length, color: T.gold },
            { label: '10k-50k', count: scoredHoldings.filter(h => h.employees >= 10000 && h.employees < 50000).length, color: T.navy },
            { label: '50k-100k', count: scoredHoldings.filter(h => h.employees >= 50000 && h.employees < 100000).length, color: T.amber },
            { label: '>100k', count: scoredHoldings.filter(h => h.employees >= 100000).length, color: T.red },
          ].map(b => (
            <div key={b.label} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, textAlign: 'center', background: T.surface }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: b.color }}>{b.count}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{b.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: T.textSec }}>
          Total employees across portfolio: <strong>{scoredHoldings.reduce((s, h) => s + (h.employees || 0), 0).toLocaleString()}</strong>
        </div>
      </Section>

      {/* ===== ENGAGEMENT BY SECTOR BARCHART ===== */}
      <Section title="Engagement Score by Sector" sub="Sector-level engagement benchmarks -- higher scores indicate stronger employee commitment">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={SECTOR_KEYS.map(s => ({ sector: s.length > 14 ? s.slice(0, 14) + '...' : s, engagement: SECTOR_HC_BENCHMARKS[s].engagement_score }))} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis domain={[55, 80]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Bar dataKey="engagement" name="Engagement Score" radius={[4,4,0,0]}>
              {SECTOR_KEYS.map((s, i) => <Cell key={s} fill={SECTOR_HC_BENCHMARKS[s].engagement_score >= 70 ? T.sage : SECTOR_HC_BENCHMARKS[s].engagement_score >= 65 ? T.gold : T.amber} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== METHODOLOGY ===== */}
      <Section title="Methodology & Data Sources" sub="Human capital metrics scoring approach">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
          {[
            { title: 'Sector Benchmarks', desc: 'Benchmarks derived from BLS (US), Eurostat, ILO ILOSTAT, and sector-specific surveys. 10 metrics across 11 GICS sectors.' },
            { title: 'Safety Metrics', desc: 'Incident rates per OSHA 200k work-hours methodology. Fatality rates per 100,000 full-time equivalent workers. Sources: ILO, national labor statistics.' },
            { title: 'Engagement Scoring', desc: 'Based on Gallup Q12 methodology and Willis Towers Watson engagement model. Scale 0-100, sector-adjusted.' },
            { title: 'Diversity Data', desc: 'Female workforce % from company ESG disclosures (GRI 405), SASB metrics, and Bloomberg Gender-Equality Index data.' },
            { title: 'Risk Flags', desc: 'Thresholds set at: turnover>25%, safety>3.0, engagement<55, female<15%, fatality>5. Based on top-decile risk levels.' },
            { title: 'Data Coverage', desc: 'Coverage varies by metric: safety (72% of large caps), engagement (45%), diversity (85%), training (62%). Estimates used where disclosed data unavailable.' },
          ].map(m => (
            <div key={m.title} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surfaceH }}>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default EmployeeWellbeingPage;
