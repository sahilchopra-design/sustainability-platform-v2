import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend, AreaChart, Area, LineChart, Line } from 'recharts';
import { GLOBAL_COMPANY_MASTER, globalSearch } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const CONTROVERSY_DB = [
  { id: 'C001', company: 'TotalEnergies', ticker: 'TTE', date: '2024-11-15', category: 'Environmental', severity: 5, headline: 'Oil spill in Mozambique LNG project area', source: 'Reuters', status: 'Active', esgImpact: -8, sector: 'Energy' },
  { id: 'C002', company: 'Meta Platforms', ticker: 'META', date: '2024-10-28', category: 'Governance', severity: 4, headline: 'EU Digital Markets Act non-compliance investigation', source: 'FT', status: 'Under Review', esgImpact: -5, sector: 'Communication Services' },
  { id: 'C003', company: 'Volkswagen', ticker: 'VOW3', date: '2024-09-12', category: 'Environmental', severity: 4, headline: 'Battery supply chain cobalt sourcing controversy', source: 'Bloomberg', status: 'Active', esgImpact: -6, sector: 'Consumer Discretionary' },
  { id: 'C004', company: 'Amazon', ticker: 'AMZN', date: '2024-12-03', category: 'Social', severity: 3, headline: 'Warehouse worker safety complaints in peak season', source: 'NYT', status: 'Resolved', esgImpact: -3, sector: 'Consumer Discretionary' },
  { id: 'C005', company: 'Rio Tinto', ticker: 'RIO', date: '2024-08-20', category: 'Environmental', severity: 5, headline: 'Tailings dam structural concerns at Australian mine', source: 'ABC News', status: 'Active', esgImpact: -9, sector: 'Materials' },
  { id: 'C006', company: 'Shell plc', ticker: 'SHEL', date: '2024-11-01', category: 'Environmental', severity: 4, headline: 'Nigerian oil field remediation lawsuit', source: 'Guardian', status: 'Active', esgImpact: -7, sector: 'Energy' },
  { id: 'C007', company: 'Nestl\u00e9', ticker: 'NESN', date: '2024-07-15', category: 'Social', severity: 3, headline: 'Palm oil deforestation supply chain linkage', source: 'Greenpeace', status: 'Under Review', esgImpact: -4, sector: 'Consumer Staples' },
  { id: 'C008', company: 'HSBC', ticker: 'HSBA', date: '2024-10-05', category: 'Governance', severity: 3, headline: 'Fossil fuel financing exceeds net-zero commitment', source: 'ShareAction', status: 'Active', esgImpact: -4, sector: 'Financials' },
  { id: 'C009', company: 'Reliance Industries', ticker: 'RELIANCE', date: '2024-09-22', category: 'Environmental', severity: 3, headline: 'Jamnagar refinery emissions exceed state limits', source: 'Economic Times', status: 'Resolved', esgImpact: -3, sector: 'Energy' },
  { id: 'C010', company: 'Adani Group', ticker: 'ADANIENT', date: '2024-06-18', category: 'Governance', severity: 5, headline: 'Carmichael coal mine water management violations', source: 'ABC Australia', status: 'Active', esgImpact: -10, sector: 'Energy' },
  { id: 'C011', company: 'Tesla', ticker: 'TSLA', date: '2024-11-20', category: 'Governance', severity: 3, headline: 'Autopilot safety investigation by NHTSA expanded', source: 'WSJ', status: 'Under Review', esgImpact: -4, sector: 'Consumer Discretionary' },
  { id: 'C012', company: 'Glencore', ticker: 'GLEN', date: '2024-08-30', category: 'Social', severity: 4, headline: 'DRC cobalt mine child labour allegations', source: 'Amnesty Int.', status: 'Active', esgImpact: -8, sector: 'Materials' },
  { id: 'C013', company: 'Samsung Electronics', ticker: '005930', date: '2024-10-12', category: 'Social', severity: 3, headline: 'Worker union dispute at semiconductor facility', source: 'Nikkei', status: 'Resolved', esgImpact: -3, sector: 'IT' },
  { id: 'C014', company: 'BHP Group', ticker: 'BHP', date: '2024-07-25', category: 'Environmental', severity: 5, headline: 'Samarco dam disaster ongoing litigation', source: 'Reuters', status: 'Active', esgImpact: -9, sector: 'Materials' },
  { id: 'C015', company: 'JPMorgan Chase', ticker: 'JPM', date: '2024-11-08', category: 'Governance', severity: 2, headline: 'Shareholder resolution on climate lending targets', source: 'FT', status: 'Resolved', esgImpact: -2, sector: 'Financials' },
  { id: 'C016', company: 'NTPC', ticker: 'NTPC', date: '2024-09-05', category: 'Environmental', severity: 4, headline: 'Fly ash management breach at Vindhyachal plant', source: 'Down to Earth', status: 'Under Review', esgImpact: -5, sector: 'Utilities' },
  { id: 'C017', company: 'Tata Steel', ticker: 'TATASTEEL', date: '2024-08-15', category: 'Environmental', severity: 3, headline: 'Port Talbot green hydrogen transition delays', source: 'Financial Times', status: 'Active', esgImpact: -3, sector: 'Materials' },
  { id: 'C018', company: 'Barclays', ticker: 'BARC', date: '2024-10-22', category: 'Governance', severity: 3, headline: 'Climate Action 100+ escalation on fossil fuel lending', source: 'ShareAction', status: 'Active', esgImpact: -4, sector: 'Financials' },
  { id: 'C019', company: 'Vale S.A.', ticker: 'VALE3', date: '2024-06-30', category: 'Environmental', severity: 5, headline: 'Brumadinho dam reparations deadline missed', source: 'Reuters', status: 'Active', esgImpact: -10, sector: 'Materials' },
  { id: 'C020', company: 'Infosys', ticker: 'INFY', date: '2024-12-01', category: 'Governance', severity: 2, headline: 'Related party transaction disclosure gap identified', source: 'SEBI Filing', status: 'Resolved', esgImpact: -2, sector: 'IT' },
];

const SEVERITY_COLORS = { 5: T.red, 4: '#ea580c', 3: T.amber, 2: '#eab308', 1: T.green };
const SEVERITY_LABELS = { 5: 'Critical', 4: 'High', 3: 'Medium', 2: 'Low', 1: 'Minimal' };
const STATUS_COLORS = { 'Active': T.red, 'Under Review': T.amber, 'Resolved': T.green };
const CATEGORY_COLORS = { 'Environmental': '#059669', 'Social': '#7c3aed', 'Governance': T.navy };
const PIE_COLORS = ['#059669', '#7c3aed', T.navy];

const RECOMMENDATIONS = {
  5: 'Immediate engagement required. Consider divestment if unresolved within 6 months.',
  4: 'Priority engagement. Monitor monthly.',
  3: 'Standard monitoring. Quarterly review.',
  2: 'Watch brief. Annual review.',
  1: 'No action required. Log for record.',
};

/* ── Portfolio loader ── */
function loadPortfolio() {
  try {
    const saved = localStorage.getItem('ra_portfolio_v1');
    const { portfolios, activePortfolio } = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    return portfolios?.[activePortfolio]?.holdings || [];
  } catch { return []; }
}

/* ── Dynamic Risk Alert Generation ── */
const generatePortfolioAlerts = (holdings) => {
  const alerts = [];
  holdings.forEach(h => {
    const c = h.company || {};
    const ticker = h.ticker || c.ticker || '';
    const name = h.company_name || h.entity_name || c.name || ticker;
    const sector = c.sector || h.sector || '';
    const weight = h.weight || 0;

    // High transition risk
    if ((c.transition_risk || '').toLowerCase() === 'high' || (c.transition_risk || '').toLowerCase() === 'very high') {
      alerts.push({
        id: `AUTO-TR-${ticker}`, company: name, ticker,
        date: new Date().toISOString().slice(0, 10), category: 'Environmental',
        severity: 4, headline: `High transition risk (${c.transition_risk}) \u2014 portfolio exposure ${weight.toFixed(1)}%`,
        source: 'AA Impact Risk Analytics', status: 'Active', esgImpact: -5, sector,
        isAutoGenerated: true,
      });
    }

    // Material emitter without SBTi
    if (!c.sbti_committed && (c.scope1_co2e || 0) > 1000000) {
      const scope1Mt = ((c.scope1_co2e || 0) / 1e6).toFixed(2);
      alerts.push({
        id: `AUTO-SBTI-${ticker}`, company: name, ticker,
        date: new Date().toISOString().slice(0, 10), category: 'Environmental',
        severity: 3, headline: `Material emitter without SBTi commitment \u2014 Scope 1: ${scope1Mt} Mt CO\u2082e`,
        source: 'Portfolio Analysis', status: 'Active', esgImpact: -3, sector,
        isAutoGenerated: true,
      });
    }

    // High GHG intensity
    if ((c.ghg_intensity_tco2e_cr || 0) > 50) {
      alerts.push({
        id: `AUTO-GHG-${ticker}`, company: name, ticker,
        date: new Date().toISOString().slice(0, 10), category: 'Environmental',
        severity: 3, headline: `High GHG intensity (${(c.ghg_intensity_tco2e_cr || 0).toFixed(1)} tCO\u2082e/Cr) \u2014 engagement recommended`,
        source: 'ESG Screening', status: 'Active', esgImpact: -4, sector,
        isAutoGenerated: true,
      });
    }

    // Physical risk high
    if ((c.physical_risk || '').toLowerCase() === 'high' || (c.physical_risk || '').toLowerCase() === 'very high') {
      alerts.push({
        id: `AUTO-PHY-${ticker}`, company: name, ticker,
        date: new Date().toISOString().slice(0, 10), category: 'Environmental',
        severity: 3, headline: `High physical risk exposure (${c.physical_risk}) \u2014 portfolio weight ${weight.toFixed(1)}%`,
        source: 'Climate Risk Model', status: 'Active', esgImpact: -3, sector,
        isAutoGenerated: true,
      });
    }
  });
  return alerts;
};

/* ── CSV helper ── */
const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
    const v = r[k]; return typeof v === 'string' && (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : (v ?? '');
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ── Custom tooltips ── */
const CustomBarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>Severity {payload[0]?.payload?.severity}</div>
      <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{payload[0]?.value} controversies</div>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{payload[0]?.name}</div>
      <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{payload[0]?.value} events</div>
    </div>
  );
};

/* ── Format date ── */
const formatDate = (d) => { const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };

export default function ControversyMonitorPage() {
  const navigate = useNavigate();

  /* ── Portfolio from localStorage ── */
  const [portfolioData] = useState(() => {
    try { const s = localStorage.getItem('ra_portfolio_v1'); return s ? JSON.parse(s) : { portfolios: {}, activePortfolio: null }; } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const holdings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];

  /* ── Auto-generated alerts ── */
  const autoAlerts = useMemo(() => generatePortfolioAlerts(holdings), [holdings]);

  /* ── All events = hardcoded + auto-generated ── */
  const allEvents = useMemo(() => [...CONTROVERSY_DB, ...autoAlerts], [autoAlerts]);

  /* ── Filters ── */
  const [severityFilter, setSeverityFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAutoOnly, setShowAutoOnly] = useState(false);

  /* ── Watchlist ── */
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_watchlist_v1') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('ra_watchlist_v1', JSON.stringify(watchlist)); }, [watchlist]);
  const toggleWatchlist = useCallback((id) => {
    setWatchlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  /* ── Custom notes (localStorage ra_controversy_notes_v1) ── */
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_controversy_notes_v1') || '{}'); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem('ra_controversy_notes_v1', JSON.stringify(notes)); }, [notes]);
  const updateNote = useCallback((eventId, text) => {
    setNotes(prev => ({ ...prev, [eventId]: text }));
  }, []);

  /* ── Stewardship engagement logging ── */
  const [engagementLogged, setEngagementLogged] = useState({});
  const logEngagement = useCallback((event) => {
    const stewardship = JSON.parse(localStorage.getItem('ra_stewardship_v1') || '[]');
    stewardship.push({
      id: Date.now(), company: event.company, date: new Date().toISOString().slice(0, 10),
      topic: event.category.toLowerCase(), method: 'letter',
      objective: `Address: ${event.headline}`,
      outcome: 'pending', escalation: event.severity >= 4 ? 3 : 1,
      notes: `Auto-created from Controversy Monitor. Severity: ${event.severity}/5.`,
    });
    localStorage.setItem('ra_stewardship_v1', JSON.stringify(stewardship));
    setEngagementLogged(prev => ({ ...prev, [event.id]: true }));
  }, []);

  /* ── Selected event ── */
  const [selectedEvent, setSelectedEvent] = useState(null);

  /* ── Filtered events ── */
  const filtered = useMemo(() => {
    let items = [...allEvents];
    if (showAutoOnly) items = items.filter(c => c.isAutoGenerated);
    if (severityFilter !== null) items = items.filter(c => c.severity === severityFilter);
    if (categoryFilter !== 'All') items = items.filter(c => c.category === categoryFilter);
    if (statusFilter !== 'All') items = items.filter(c => c.status === statusFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(c => c.company.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q) || c.headline.toLowerCase().includes(q));
    }
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    return items;
  }, [allEvents, severityFilter, categoryFilter, statusFilter, searchTerm, showAutoOnly]);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const total = allEvents.length;
    const active = allEvents.filter(c => c.status === 'Active').length;
    const critical = allEvents.filter(c => c.severity >= 4).length;
    const autoCount = autoAlerts.length;
    return { total, active, critical, autoCount, watchlistCount: watchlist.length };
  }, [allEvents, autoAlerts, watchlist]);

  /* ── Portfolio exposure matching via GLOBAL_COMPANY_MASTER ── */
  const portfolioExposure = useMemo(() => {
    if (!holdings.length) return { items: [], totalWeightAtRisk: 0, totalExposureAtRisk: 0, totalEsgImpact: 0 };
    const totalExp = holdings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0) || 1;
    const tickerMap = {};
    holdings.forEach(h => {
      const t = (h.ticker || '').toUpperCase();
      if (t) tickerMap[t] = { weight: ((h.exposure_usd_mn || 0) / totalExp) * 100, exposure: h.exposure_usd_mn || 0, name: h.company_name || h.entity_name || h.ticker };
    });

    // Also try matching via GLOBAL_COMPANY_MASTER name
    const nameMap = {};
    holdings.forEach(h => {
      const n = (h.company_name || h.entity_name || '').toLowerCase();
      if (n) nameMap[n] = { weight: ((h.exposure_usd_mn || 0) / totalExp) * 100, exposure: h.exposure_usd_mn || 0, ticker: h.ticker };
    });

    const matched = allEvents.filter(c => {
      if (tickerMap[c.ticker.toUpperCase()]) return true;
      const cLower = c.company.toLowerCase();
      return Object.keys(nameMap).some(n => n.includes(cLower.split(' ')[0]) || cLower.includes(n.split(' ')[0]));
    }).map(c => {
      const tm = tickerMap[c.ticker.toUpperCase()];
      if (tm) return { ...c, portfolioWeight: tm.weight, portfolioExposure: tm.exposure, portfolioName: tm.name };
      // name-based match
      const nKey = Object.keys(nameMap).find(n => {
        const cLower = c.company.toLowerCase();
        return n.includes(cLower.split(' ')[0]) || cLower.includes(n.split(' ')[0]);
      });
      if (nKey) return { ...c, portfolioWeight: nameMap[nKey].weight, portfolioExposure: nameMap[nKey].exposure, portfolioName: nKey };
      return { ...c, portfolioWeight: 0, portfolioExposure: 0 };
    });

    const totalWeightAtRisk = matched.reduce((s, c) => s + c.portfolioWeight, 0);
    const totalExposureAtRisk = matched.reduce((s, c) => s + c.portfolioExposure, 0);
    const totalEsgImpact = matched.reduce((s, c) => s + c.esgImpact, 0);

    return { items: matched, totalWeightAtRisk, totalExposureAtRisk, totalEsgImpact };
  }, [holdings, allEvents]);

  /* ── Severity distribution chart data ── */
  const severityData = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allEvents.forEach(c => { counts[c.severity] = (counts[c.severity] || 0) + 1; });
    return [1, 2, 3, 4, 5].map(s => ({ severity: s, count: counts[s], label: SEVERITY_LABELS[s] }));
  }, [allEvents]);

  /* ── Category breakdown for pie chart ── */
  const categoryData = useMemo(() => {
    const counts = {};
    allEvents.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allEvents]);

  /* ── Severity trend over time (AreaChart) ── */
  const severityTrend = useMemo(() => {
    const monthMap = {};
    allEvents.forEach(c => {
      const d = new Date(c.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { month: key, sev5: 0, sev4: 0, sev3: 0, sev2: 0, sev1: 0, total: 0, avgSev: 0, _sevSum: 0 };
      monthMap[key][`sev${c.severity}`] += 1;
      monthMap[key].total += 1;
      monthMap[key]._sevSum += c.severity;
    });
    const sorted = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    sorted.forEach(m => { m.avgSev = m.total > 0 ? parseFloat((m._sevSum / m.total).toFixed(2)) : 0; });
    return sorted;
  }, [allEvents]);

  /* ── Watchlisted events ── */
  const watchlistedEvents = useMemo(() => allEvents.filter(c => watchlist.includes(c.id)), [allEvents, watchlist]);

  /* ── Export helpers ── */
  const exportControversyReport = () => {
    const rows = filtered.map(c => {
      const pe = portfolioExposure.items.find(p => p.id === c.id);
      return {
        ID: c.id, Company: c.company, Ticker: c.ticker, Date: c.date, Category: c.category,
        Severity: c.severity, Status: c.status, Headline: c.headline, Source: c.source,
        ESG_Impact: c.esgImpact, Sector: c.sector, Auto_Generated: c.isAutoGenerated ? 'Yes' : 'No',
        Portfolio_Weight_Pct: pe ? pe.portfolioWeight.toFixed(2) : '', Portfolio_Exposure_Mn: pe ? pe.portfolioExposure.toFixed(1) : '',
        Notes: notes[c.id] || '',
      };
    });
    downloadCSV(rows, `controversy_report_${new Date().toISOString().slice(0, 10)}.csv`);
  };
  const exportWatchlist = () => {
    const rows = watchlistedEvents.map(c => ({
      ID: c.id, Company: c.company, Ticker: c.ticker, Date: c.date, Category: c.category,
      Severity: c.severity, Status: c.status, Headline: c.headline, Notes: notes[c.id] || '',
    }));
    downloadCSV(rows, `watchlist_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  /* ── Styles ── */
  const cardStyle = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 };
  const kpiCardStyle = { ...cardStyle, padding: '18px 22px', flex: 1, minWidth: 130, marginBottom: 0 };
  const btnPrimary = { padding: '7px 14px', borderRadius: 8, border: 'none', background: T.navy, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font };
  const btnSecondary = { padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.textSec, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: T.font };
  const selectStyle = { padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: T.font, color: T.text, background: T.bg, cursor: 'pointer' };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: 32 }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>ESG Controversy &amp; Watchlist Monitor</h1>
            <span style={{ fontSize: 11, background: `${T.navy}10`, color: T.navy, padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>RepRisk &middot; UNGC &middot; Severity 1-5</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportControversyReport} style={btnSecondary}>Export Controversy Report</button>
            <button onClick={exportWatchlist} style={btnSecondary}>Export Watchlist</button>
            <button onClick={() => navigate('/stewardship-tracker')} style={btnPrimary}>Stewardship Tracker &rarr;</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Events', value: kpis.total, color: T.navy },
            { label: 'Active', value: kpis.active, color: T.red },
            { label: 'Severity 4-5', value: kpis.critical, color: '#dc2626' },
            { label: 'Auto-Detected Alerts', value: kpis.autoCount, color: T.sage },
            { label: 'Watchlist Items', value: kpis.watchlistCount, color: T.gold },
          ].map((k, i) => (
            <div key={i} style={kpiCardStyle}>
              <div style={{ fontSize: 10, color: T.textSec, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
          {portfolioExposure.items.length > 0 && (
            <div style={{ ...kpiCardStyle, border: `1px solid ${T.red}30`, background: `${T.red}04` }}>
              <div style={{ fontSize: 10, color: T.textSec, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Portfolio at Risk</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.red }}>{portfolioExposure.totalWeightAtRisk.toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>${portfolioExposure.totalExposureAtRisk.toFixed(0)} Mn</div>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 24px' }}>
          <input type="text" placeholder="Search company, ticker, or headline..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: T.font, color: T.text, outline: 'none', background: T.bg }} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={selectStyle}>
            {['All', 'Environmental', 'Social', 'Governance'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            {['All', 'Active', 'Under Review', 'Resolved'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setSeverityFilter(severityFilter === s ? null : s)}
                style={{ width: 32, height: 32, borderRadius: 8, border: severityFilter === s ? `2px solid ${SEVERITY_COLORS[s]}` : `1px solid ${T.border}`, background: severityFilter === s ? `${SEVERITY_COLORS[s]}15` : T.surface, color: SEVERITY_COLORS[s], fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: T.font }}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAutoOnly(!showAutoOnly)}
            style={{ padding: '6px 12px', border: `1px solid ${showAutoOnly ? T.sage : T.border}`, borderRadius: 8, fontSize: 12, fontFamily: T.font, color: showAutoOnly ? T.sage : T.textSec, background: showAutoOnly ? `${T.sage}12` : T.surface, cursor: 'pointer', fontWeight: showAutoOnly ? 600 : 400 }}>
            Auto-Alerts Only
          </button>
          {(severityFilter !== null || categoryFilter !== 'All' || statusFilter !== 'All' || searchTerm || showAutoOnly) && (
            <button onClick={() => { setSeverityFilter(null); setCategoryFilter('All'); setStatusFilter('All'); setSearchTerm(''); setShowAutoOnly(false); }}
              style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontFamily: T.font, color: T.textSec, background: T.surfaceH, cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Main column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Controversy Timeline */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: 0 }}>Controversy Timeline</h3>
                <span style={{ fontSize: 12, color: T.textMut }}>{filtered.length} events</span>
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textMut }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>&#x1F50D;</div>
                  <p style={{ fontSize: 13 }}>No controversies match the current filters.</p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 78, top: 0, bottom: 0, width: 2, background: T.border }} />
                  {filtered.map((c) => {
                    const isOnWatchlist = watchlist.includes(c.id);
                    const isSelected = selectedEvent?.id === c.id;
                    return (
                      <div key={c.id} style={{ display: 'flex', gap: 16, marginBottom: 16, position: 'relative', cursor: 'pointer' }}
                        onClick={() => setSelectedEvent(isSelected ? null : c)}>
                        <div style={{ width: 60, flexShrink: 0, textAlign: 'right', paddingTop: 4 }}>
                          <div style={{ fontSize: 11, color: T.textSec, fontWeight: 500 }}>{formatDate(c.date)}</div>
                        </div>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: SEVERITY_COLORS[c.severity], border: '3px solid #fff', boxShadow: `0 0 0 2px ${SEVERITY_COLORS[c.severity]}40`, flexShrink: 0, marginTop: 4, zIndex: 1 }} />
                        <div style={{ flex: 1, background: isSelected ? T.surfaceH : T.surface, border: `1px solid ${isSelected ? T.navy + '30' : T.border}`, borderRadius: 10, padding: '12px 16px', transition: 'all 0.2s' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, color: T.navy, fontSize: 14 }}>{c.company}</span>
                                <span style={{ fontSize: 10, color: T.textMut, fontWeight: 500 }}>{c.ticker}</span>
                                {c.isAutoGenerated && (
                                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: `${T.sage}18`, color: T.sage, fontWeight: 600 }}>Auto-detected</span>
                                )}
                              </div>
                              <p style={{ fontSize: 13, color: T.textSec, margin: 0, lineHeight: 1.5 }}>{c.headline}</p>
                              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${CATEGORY_COLORS[c.category]}12`, color: CATEGORY_COLORS[c.category], fontWeight: 500 }}>{c.category}</span>
                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${STATUS_COLORS[c.status]}12`, color: STATUS_COLORS[c.status], fontWeight: 500 }}>{c.status}</span>
                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${SEVERITY_COLORS[c.severity]}12`, color: SEVERITY_COLORS[c.severity], fontWeight: 500 }}>Severity {c.severity}</span>
                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${T.textMut}12`, color: T.textSec, fontWeight: 500 }}>{c.source}</span>
                              </div>
                              {notes[c.id] && <div style={{ marginTop: 6, fontSize: 11, color: T.navyL, fontStyle: 'italic' }}>Note: {notes[c.id].slice(0, 80)}{notes[c.id].length > 80 ? '...' : ''}</div>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(c.id); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: isOnWatchlist ? T.gold : T.textMut, padding: 4, lineHeight: 1, flexShrink: 0 }}
                              title={isOnWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}>
                              {isOnWatchlist ? '\u2605' : '\u2606'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ ...cardStyle, flex: 1, minWidth: 300, marginBottom: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 16px' }}>Severity Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={severityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    <XAxis dataKey="severity" tick={{ fontSize: 11, fill: T.textMut }} tickFormatter={v => `Sev ${v}`} />
                    <YAxis tick={{ fontSize: 11, fill: T.textMut }} allowDecimals={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                      {severityData.map((entry, idx) => <Cell key={idx} fill={SEVERITY_COLORS[entry.severity]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ ...cardStyle, flex: 1, minWidth: 300, marginBottom: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 16px' }}>Category Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                      {categoryData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Severity Trend Analysis */}
            {severityTrend.length > 1 && (
              <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: '0 0 16px' }}>Severity Trend Over Time</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={severityTrend} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textMut }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textMut }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                    <Area type="monotone" dataKey="sev5" stackId="1" stroke={T.red} fill={`${T.red}40`} name="Critical (5)" />
                    <Area type="monotone" dataKey="sev4" stackId="1" stroke="#ea580c" fill="#ea580c40" name="High (4)" />
                    <Area type="monotone" dataKey="sev3" stackId="1" stroke={T.amber} fill={`${T.amber}40`} name="Medium (3)" />
                    <Area type="monotone" dataKey="sev2" stackId="1" stroke="#eab308" fill="#eab30840" name="Low (2)" />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, padding: '10px 14px', background: T.surfaceH, borderRadius: 8, fontSize: 12, color: T.textSec }}>
                  Stacked area shows controversy severity distribution by month. Monitor for upward trends in high-severity events.
                </div>
              </div>
            )}

            {/* Portfolio Controversy Exposure */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: 0 }}>Portfolio Controversy Exposure</h3>
                {portfolioExposure.items.length > 0 && (
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span style={{ color: T.red, fontWeight: 600 }}>Weight at Risk: {portfolioExposure.totalWeightAtRisk.toFixed(1)}%</span>
                    <span style={{ color: T.navy, fontWeight: 600 }}>Exposure: ${portfolioExposure.totalExposureAtRisk.toFixed(0)} Mn</span>
                    <span style={{ color: T.textSec }}>Cumulative ESG Impact: {portfolioExposure.totalEsgImpact}</span>
                  </div>
                )}
              </div>
              {!holdings.length ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', color: T.textMut }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>&#x1F4BC;</div>
                  <p style={{ fontSize: 13 }}>Load a portfolio to see exposure analysis</p>
                  <button onClick={() => navigate('/portfolio-manager')} style={btnPrimary}>Go to Portfolio Manager</button>
                </div>
              ) : portfolioExposure.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', color: T.green }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>&#x2705;</div>
                  <p style={{ fontSize: 13, color: T.textSec }}>No controversy matches found in current portfolio holdings.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.surfaceH }}>
                        {['Company', 'Controversy', 'Severity', 'Weight %', 'Exposure (Mn)', 'ESG Impact', 'Type', 'Action'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', fontSize: 10, fontWeight: 600, color: T.textSec, textAlign: h === 'Company' || h === 'Controversy' ? 'left' : 'center', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioExposure.items.map((c, i) => (
                        <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedEvent(c)}>
                          <td style={{ padding: '10px 12px', fontWeight: 500, color: T.navy, borderBottom: `1px solid ${T.border}` }}>
                            {c.company} <span style={{ fontSize: 10, color: T.textMut }}>({c.ticker})</span>
                            {c.isAutoGenerated && <span style={{ marginLeft: 4, fontSize: 9, padding: '1px 4px', borderRadius: 3, background: `${T.sage}18`, color: T.sage }}>Auto</span>}
                          </td>
                          <td style={{ padding: '10px 12px', color: T.textSec, borderBottom: `1px solid ${T.border}`, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.headline}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                            <span style={{ display: 'inline-block', width: 24, height: 24, lineHeight: '24px', borderRadius: '50%', background: `${SEVERITY_COLORS[c.severity]}18`, color: SEVERITY_COLORS[c.severity], fontWeight: 700, fontSize: 11, textAlign: 'center' }}>{c.severity}</span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}` }}>{c.portfolioWeight.toFixed(1)}%</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}` }}>${c.portfolioExposure.toFixed(0)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: T.red, borderBottom: `1px solid ${T.border}` }}>{c.esgImpact}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${CATEGORY_COLORS[c.category]}12`, color: CATEGORY_COLORS[c.category], fontWeight: 500 }}>{c.category}</span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                            {engagementLogged[c.id] ? (
                              <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>Engagement logged</span>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); logEngagement(c); }}
                                style={{ ...btnSecondary, padding: '3px 8px', fontSize: 10, color: T.navyL }}>Log Engagement</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ width: 380, flexShrink: 0 }}>
            {/* Detail Panel */}
            {selectedEvent && (
              <div style={{ ...cardStyle, border: `1px solid ${SEVERITY_COLORS[selectedEvent.severity]}30`, position: 'sticky', top: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: 0 }}>Event Detail</h3>
                  <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: T.textMut, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{selectedEvent.company}</div>
                    {selectedEvent.isAutoGenerated && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${T.sage}18`, color: T.sage, fontWeight: 600 }}>Auto-detected</span>}
                  </div>
                  <div style={{ fontSize: 12, color: T.textMut, marginBottom: 12 }}>{selectedEvent.ticker} &middot; {selectedEvent.sector}</div>
                  <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6, margin: 0 }}>{selectedEvent.headline}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: '10px 12px', background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Date</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{formatDate(selectedEvent.date)}</div>
                  </div>
                  <div style={{ padding: '10px 12px', background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Source</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{selectedEvent.source}</div>
                  </div>
                  <div style={{ padding: '10px 12px', background: `${SEVERITY_COLORS[selectedEvent.severity]}08`, borderRadius: 8, border: `1px solid ${SEVERITY_COLORS[selectedEvent.severity]}20` }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Severity</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: SEVERITY_COLORS[selectedEvent.severity] }}>{selectedEvent.severity} - {SEVERITY_LABELS[selectedEvent.severity]}</div>
                  </div>
                  <div style={{ padding: '10px 12px', background: `${STATUS_COLORS[selectedEvent.status]}08`, borderRadius: 8, border: `1px solid ${STATUS_COLORS[selectedEvent.status]}20` }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Status</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLORS[selectedEvent.status] }}>{selectedEvent.status}</div>
                  </div>
                  <div style={{ padding: '10px 12px', background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Category</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: CATEGORY_COLORS[selectedEvent.category] }}>{selectedEvent.category}</div>
                  </div>
                  <div style={{ padding: '10px 12px', background: `${T.red}06`, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>ESG Impact</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.red }}>{selectedEvent.esgImpact}</div>
                  </div>
                </div>

                {/* Recommended Action */}
                <div style={{ padding: '14px 16px', background: `${SEVERITY_COLORS[selectedEvent.severity]}08`, borderRadius: 10, border: `1px solid ${SEVERITY_COLORS[selectedEvent.severity]}20`, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: SEVERITY_COLORS[selectedEvent.severity], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Recommended Action</div>
                  <p style={{ fontSize: 12, color: T.textSec, margin: 0, lineHeight: 1.6 }}>{RECOMMENDATIONS[selectedEvent.severity]}</p>
                </div>

                {/* Custom Notes */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Custom Notes</div>
                  <textarea
                    value={notes[selectedEvent.id] || ''}
                    onChange={e => updateNote(selectedEvent.id, e.target.value)}
                    placeholder="Add notes about this controversy..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontFamily: T.font, color: T.text, background: T.bg, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button onClick={() => toggleWatchlist(selectedEvent.id)}
                    style={{ flex: 1, padding: '10px 0', border: `1px solid ${watchlist.includes(selectedEvent.id) ? T.gold : T.border}`, borderRadius: 8, background: watchlist.includes(selectedEvent.id) ? `${T.gold}12` : T.surface, color: watchlist.includes(selectedEvent.id) ? T.gold : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>
                    {watchlist.includes(selectedEvent.id) ? '\u2605 On Watchlist' : '\u2606 Add to Watchlist'}
                  </button>
                  {engagementLogged[selectedEvent.id] ? (
                    <div style={{ flex: 1, padding: '10px 0', textAlign: 'center', background: `${T.green}10`, border: `1px solid ${T.green}30`, borderRadius: 8, color: T.green, fontSize: 12, fontWeight: 600 }}>
                      Engagement Logged
                    </div>
                  ) : (
                    <button onClick={() => logEngagement(selectedEvent)}
                      style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: T.navy, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>
                      Log Engagement &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Watchlist Panel */}
            <div style={{ ...cardStyle, ...(selectedEvent ? {} : { position: 'sticky', top: 32 }) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: 0 }}>Watchlist</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.textMut, fontWeight: 500 }}>{watchlistedEvents.length} items</span>
                  {watchlistedEvents.length > 0 && <button onClick={exportWatchlist} style={{ ...btnSecondary, padding: '3px 8px', fontSize: 10 }}>Export</button>}
                </div>
              </div>
              {watchlistedEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: T.textMut }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>&#x2606;</div>
                  <p style={{ fontSize: 12 }}>No items on watchlist. Click the star icon on any controversy to track it.</p>
                </div>
              ) : (
                <div>
                  {watchlistedEvents.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS[c.severity], flexShrink: 0, marginTop: 5 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, cursor: 'pointer' }} onClick={() => setSelectedEvent(c)}>
                            {c.company}
                          </div>
                          {c.isAutoGenerated && <span style={{ fontSize: 8, padding: '0px 4px', borderRadius: 3, background: `${T.sage}18`, color: T.sage, fontWeight: 600 }}>Auto</span>}
                        </div>
                        <div style={{ fontSize: 11, color: T.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.headline}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: `${STATUS_COLORS[c.status]}12`, color: STATUS_COLORS[c.status], fontWeight: 500 }}>{c.status}</span>
                          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: `${SEVERITY_COLORS[c.severity]}12`, color: SEVERITY_COLORS[c.severity], fontWeight: 500 }}>Sev {c.severity}</span>
                        </div>
                        {notes[c.id] && <div style={{ fontSize: 10, color: T.navyL, fontStyle: 'italic', marginTop: 3 }}>{notes[c.id].slice(0, 60)}{notes[c.id].length > 60 ? '...' : ''}</div>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(c.id); }}
                        style={{ background: 'none', border: 'none', fontSize: 14, color: T.red, cursor: 'pointer', padding: 2, lineHeight: 1, flexShrink: 0 }}
                        title="Remove from Watchlist">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
