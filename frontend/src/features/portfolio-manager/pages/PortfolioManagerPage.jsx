import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER, EXCHANGES, globalSearch } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const SECTOR_COLORS = {
  'Information Technology': '#4f46e5', 'Financials': '#1b3a5c',
  'Health Care': '#be185d', 'Consumer Discretionary': '#d97706',
  'Consumer Staples': '#16a34a', 'Energy': '#dc2626', 'Materials': '#7c3aed',
  'Industrials': '#0d9488', 'Utilities': '#1d4ed8', 'Real Estate': '#0891b2',
  'Communication Services': '#ea580c', 'Mining': '#92400e',
};

const RISK_C = { 'Very High': '#dc2626', 'High': '#ea580c', 'Medium': '#d97706', 'Low': '#16a34a', 'Very Low': '#0d9488' };

const fmtB = n => n == null ? '—' : n >= 1000 ? `$${(n / 1000).toFixed(1)}T` : `$${n.toFixed(0)}B`;
const fmtMn = n => n == null ? '—' : n >= 1000000 ? `$${(n / 1000000).toFixed(2)}T` : n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n}M`;
const fmtCO2 = n => n == null ? '—' : n >= 1e9 ? `${(n / 1e9).toFixed(2)} Gt` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} Mt` : `${(n / 1000).toFixed(0)} Kt`;
const pct = (v, t) => t > 0 ? ((v / t) * 100).toFixed(1) : '0.0';

const STORAGE_KEY = 'ra_portfolio_v1';
const DEFAULT_PORTFOLIOS = {
  'My Portfolio': [],
};

/* ── Implied Temperature lookup ───────────────────────────────────────────── */
function impliedTemp(waci) {
  if (waci == null || waci === 0) return null;
  if (waci < 50)   return 1.5;
  if (waci < 120)  return 1.7;
  if (waci < 250)  return 2.0;
  if (waci < 500)  return 2.5;
  if (waci < 900)  return 3.0;
  return 3.5;
}

/* ── Small sub-components ─────────────────────────────────────────────────── */
const Chip = ({ label, color = T.navy }) => (
  <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`,
    border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>
    {label}
  </span>
);

const KpiCard = ({ label, value, sub, color = T.navy, large }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
    <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</div>
    <div style={{ fontSize: large ? 26 : 22, fontWeight: 800, color, margin: '6px 0 2px' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub }}>{sub}</div>}
  </div>
);

/* ── Portfolio weight editor ───────────────────────────────────────────────── */
function WeightInput({ value, onChange }) {
  return (
    <input type="number" min="0" max="100" step="0.1"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      style={{ width: 64, border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 6px',
        fontSize: 12, fontFamily: T.font, textAlign: 'right' }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function PortfolioManagerPage() {

  // ── Portfolios state (localStorage persisted) ─────────────────────────────
  // Storage format: { portfolios: { name: { holdings: [] } }, activePortfolio: name }
  // This format is read by ALL downstream modules (Sprint G, H)
  const [portfolios, setPortfolios] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!raw) return DEFAULT_PORTFOLIOS;
      // Migrate old format: { 'name': [holdings] } → { 'name': [holdings] } (internal only)
      // New wrapped format is written on save
      if (raw.portfolios) {
        // Already new format — unwrap for internal state
        const unwrapped = {};
        for (const [k, v] of Object.entries(raw.portfolios)) {
          unwrapped[k] = v.holdings || v || [];
        }
        return Object.keys(unwrapped).length ? unwrapped : DEFAULT_PORTFOLIOS;
      }
      return raw;
    }
    catch { return DEFAULT_PORTFOLIOS; }
  });
  const [activePortfolio, setActivePortfolio] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (raw && raw.activePortfolio) return raw.activePortfolio;
    } catch {}
    return Object.keys(portfolios)[0] || 'My Portfolio';
  });
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [showNewPortfolio, setShowNewPortfolio] = useState(false);

  // Persist in wrapped format that all downstream modules expect
  useEffect(() => {
    const wrapped = { portfolios: {}, activePortfolio };
    for (const [name, holdingsArr] of Object.entries(portfolios)) {
      wrapped.portfolios[name] = { holdings: holdingsArr || [] };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wrapped));
  }, [portfolios, activePortfolio]);

  const holdings = portfolios[activePortfolio] || [];

  const setHoldings = useCallback((updater) => {
    setPortfolios(prev => ({
      ...prev,
      [activePortfolio]: typeof updater === 'function' ? updater(prev[activePortfolio] || []) : updater,
    }));
  }, [activePortfolio]);

  // ── Search state ──────────────────────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [exchangeFilter, setExFilter] = useState('All');
  const [sectorFilter, setSFilter]    = useState('All');
  const [searchOpen, setSearchOpen]   = useState(false);

  const searchResults = useMemo(() => {
    if (!search && exchangeFilter === 'All' && sectorFilter === 'All') return GLOBAL_COMPANY_MASTER.slice(0, 30);
    let pool = search ? globalSearch(search, 60) : GLOBAL_COMPANY_MASTER;
    if (exchangeFilter !== 'All') pool = pool.filter(c => (c._displayExchange || c.exchange) === exchangeFilter);
    if (sectorFilter   !== 'All') pool = pool.filter(c => c.sector === sectorFilter);
    return pool.slice(0, 40);
  }, [search, exchangeFilter, sectorFilter]);

  // ── Merge enriched data into company object ──────────────────────────────
  // Bridges ra_enriched (from EODHD/Alpha Vantage) into portfolio holdings
  const resolveCompanyData = useCallback((company) => {
    const cin = company.cin || company.id || `${company.ticker}-${company.exchange}`;
    try {
      const enriched = JSON.parse(localStorage.getItem('ra_enriched') || '{}');
      const overrides = JSON.parse(localStorage.getItem('ra_manual_overrides') || '{}');
      const eData = enriched[cin] || {};
      const mData = overrides[cin] || {};
      // Merge: manual > enriched > master (same priority as enrichmentService)
      const resolved = { ...company };
      const mergeField = (field, enrichKey) => {
        if (mData[field] != null) return mData[field];
        if (eData[enrichKey || field]?.value != null) return eData[enrichKey || field].value;
        if (eData[field]?.value != null) return eData[field].value;
        return company[field];
      };
      resolved.esg_score = mergeField('esg_score', 'esg_total_score') ?? resolved.esg_score ?? 50;
      resolved.esg_env_score = mergeField('esg_env_score') ?? resolved.esg_env_score;
      resolved.esg_social_score = mergeField('esg_social_score') ?? resolved.esg_social_score;
      resolved.esg_gov_score = mergeField('esg_gov_score') ?? resolved.esg_gov_score;
      resolved.scope1_co2e = mergeField('scope1_co2e') ?? resolved.scope1_co2e;
      resolved.scope2_co2e = mergeField('scope2_co2e') ?? resolved.scope2_co2e;
      resolved.scope1_mt = resolved.scope1_co2e ? resolved.scope1_co2e / 1e6 : (resolved.scope1_mt || 0);
      resolved.scope2_mt = resolved.scope2_co2e ? resolved.scope2_co2e / 1e6 : (resolved.scope2_mt || 0);
      resolved.market_cap_usd_mn = mergeField('market_cap_usd_mn', 'market_cap_inr_cr') ?? resolved.market_cap_usd_mn;
      resolved.revenue_usd_mn = mergeField('revenue_usd_mn', 'revenue_inr_cr') ?? resolved.revenue_usd_mn;
      resolved.evic_usd_mn = mergeField('evic_usd_mn', 'evic_inr_cr') ?? resolved.evic_usd_mn;
      resolved.pe_ratio = mergeField('pe_ratio') ?? resolved.pe_ratio;
      resolved.beta = mergeField('beta') ?? resolved.beta;
      resolved.employees = mergeField('employees') ?? resolved.employees;
      resolved.description = mergeField('description') ?? resolved.description;
      resolved.website = mergeField('website') ?? resolved.website;
      resolved.dividend_yield_pct = mergeField('dividend_yield_pct') ?? resolved.dividend_yield_pct;
      resolved.sbti_committed = mergeField('sbti_committed') ?? resolved.sbti_committed ?? false;
      resolved.carbon_neutral_target_year = mergeField('carbon_neutral_target_year') ?? resolved.carbon_neutral_target_year;
      resolved.transition_risk_score = mergeField('transition_risk_score') ?? resolved.transition_risk_score ?? 50;
      resolved.data_quality_score = mergeField('data_quality_score') ?? resolved.data_quality_score ?? 50;
      resolved._enriched = Object.keys(eData).length > 0;
      resolved._hasOverrides = Object.keys(mData).length > 0;
      return resolved;
    } catch { return company; }
  }, []);

  // ── Add / remove / reweight holdings ─────────────────────────────────────
  const addHolding = useCallback((company) => {
    const resolved = resolveCompanyData(company);
    const id = resolved.id || resolved.cin || `${resolved.ticker}-${resolved.exchange}`;
    setHoldings(prev => {
      if (prev.some(h => h.id === id)) return prev;
      const newHolding = { id, company: resolved, weight: 5, exposure_usd_mn: 10 };
      const updated = [...prev, newHolding];
      // Auto-balance to 100
      const total = updated.reduce((s, h) => s + h.weight, 0);
      if (total > 100) {
        const factor = 100 / total;
        return updated.map(h => ({ ...h, weight: parseFloat((h.weight * factor).toFixed(2)) }));
      }
      return updated;
    });
    setSearch('');
  }, [setHoldings]);

  const removeHolding = useCallback((id) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
  }, [setHoldings]);

  const updateWeight = useCallback((id, weight) => {
    setHoldings(prev => prev.map(h => h.id === id ? { ...h, weight } : h));
  }, [setHoldings]);

  const updateExposure = useCallback((id, exposure_usd_mn) => {
    setHoldings(prev => prev.map(h => h.id === id ? { ...h, exposure_usd_mn } : h));
  }, [setHoldings]);

  const equalWeight = () => {
    if (!holdings.length) return;
    const w = parseFloat((100 / holdings.length).toFixed(2));
    setHoldings(prev => prev.map(h => ({ ...h, weight: w })));
  };

  const mktCapWeight = () => {
    const total = holdings.reduce((s, h) => s + (h.company.market_cap_usd_mn || h.company.market_cap_inr_cr || 0), 0);
    if (!total) return;
    setHoldings(prev => prev.map(h => {
      const mc = h.company.market_cap_usd_mn || h.company.market_cap_inr_cr || 0;
      return { ...h, weight: parseFloat(((mc / total) * 100).toFixed(2)) };
    }));
  };

  // ── Aggregate analytics ───────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (!holdings.length) return null;
    const totalW = holdings.reduce((s, h) => s + h.weight, 0);
    const totalExp = holdings.reduce((s, h) => s + (h.exposure_usd_mn || 0), 0);

    // WACI = Σ (weight_i × Scope1+2_i / Revenue_i)
    let waciNum = 0, waciDen = 0;
    let totalScope1 = 0, totalScope2 = 0, totalScope3 = 0;
    let totalMarketCap = 0;
    const sectorMap = {}, exchangeMap = {}, riskMap = {}, dqsMap = {};

    holdings.forEach(h => {
      const c = h.company;
      const w = h.weight / 100;
      const s1 = c.scope1_co2e || (c.scope1_mt ? c.scope1_mt * 1e6 : 0);
      const s2 = c.scope2_co2e || (c.scope2_mt ? c.scope2_mt * 1e6 : 0);
      const rev = c.revenue_usd_mn || (c.revenue_inr_cr ? c.revenue_inr_cr * 0.1203 : 0);

      totalScope1 += s1 * w;
      totalScope2 += s2 * w;
      totalScope3 += (c.scope3_co2e || 0) * w;
      if (rev > 0) { waciNum += w * (s1 + s2); waciDen += w * rev; }

      totalMarketCap += (c.market_cap_usd_mn || 0) * w;

      // Sector breakdown
      const sec = c.sector || 'Unknown';
      sectorMap[sec] = (sectorMap[sec] || 0) + h.weight;

      // Exchange breakdown
      const exch = c._displayExchange || c.exchange || 'Unknown';
      exchangeMap[exch] = (exchangeMap[exch] || 0) + h.weight;

      // Risk
      const tr = c.transition_risk || 'Unknown';
      riskMap[tr] = (riskMap[tr] || 0) + h.weight;

      // DQS
      const dqs = `DQS ${c.dqs_default || 3}`;
      dqsMap[dqs] = (dqsMap[dqs] || 0) + h.weight;
    });

    const waci = waciDen > 0 ? waciNum / waciDen : null;

    return {
      totalW, totalExp,
      waci: waci ? Math.round(waci) : null,
      impliedTemperature: impliedTemp(waci),
      totalScope1: Math.round(totalScope1),
      totalScope2: Math.round(totalScope2),
      totalScope3: Math.round(totalScope3),
      totalMarketCap: Math.round(totalMarketCap),
      holdingsCount: holdings.length,
      sectorPie: Object.entries(sectorMap).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) })).sort((a, b) => b.value - a.value),
      exchangePie: Object.entries(exchangeMap).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) })).sort((a, b) => b.value - a.value),
      riskBar: ['Very High', 'High', 'Medium', 'Low', 'Very Low'].map(r => ({ name: r, value: parseFloat((riskMap[r] || 0).toFixed(1)), color: RISK_C[r] })),
      dqsBar: ['DQS 1', 'DQS 2', 'DQS 3', 'DQS 4', 'DQS 5'].map(d => ({ name: d, value: parseFloat((dqsMap[d] || 0).toFixed(1)) })),
      sbtiPct: holdings.length > 0 ? parseFloat(((holdings.filter(h => h.company.sbti_committed).length / holdings.length) * 100).toFixed(0)) : 0,
    };
  }, [holdings]);

  const totalWeight = holdings.reduce((s, h) => s + h.weight, 0);
  const weightOk = Math.abs(totalWeight - 100) < 0.5;

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCsv = () => {
    const header = 'ID,Name,Exchange,Sector,Weight%,Exposure_USD_Mn,Scope1_tCO2e,Scope2_tCO2e,Scope3_tCO2e,EVIC_USD_Mn,Revenue_USD_Mn,Transition_Risk,DQS';
    const rows = holdings.map(h => {
      const c = h.company;
      return [
        h.id, `"${c.name}"`, c._displayExchange || c.exchange, c.sector,
        h.weight, h.exposure_usd_mn,
        c.scope1_co2e || 0, c.scope2_co2e || 0, c.scope3_co2e || 0,
        c.evic_usd_mn || '', c.revenue_usd_mn || '',
        c.transition_risk, c.dqs_default,
      ].join(',');
    });
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${activePortfolio.replace(/\s+/g, '_')}_holdings.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const EXCHANGE_LABELS = EXCHANGES.map(e => e.label.split(' — ')[1] || e.label);
  const ALL_SECTORS = [...new Set(GLOBAL_COMPANY_MASTER.map(c => c.sector).filter(Boolean))].sort();

  const tempColor = t => t <= 1.5 ? T.green : t <= 2.0 ? T.amber : t <= 2.5 ? '#ea580c' : T.red;

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ background: T.navy, color: T.gold, borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>F1</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Portfolio Manager</h1>
          <Chip label="PCAF v3.0" color={T.teal} />
          <Chip label="Paris-Aligned" color={T.green} />
          <Chip label={`${GLOBAL_COMPANY_MASTER.length} Companies`} color={T.blue} />
        </div>
        <p style={{ fontSize: 13, color: T.sub, margin: 0 }}>
          Build and manage investment portfolios. Live WACI, implied temperature, Scope 1/2/3 aggregation, and PCAF attribution factor across all global exchanges.
        </p>
      </div>

      {/* Context bar */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.navy}`,
        borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['PCAF v3.0 Part A', T.teal], ['WACI (tCO₂e / $M Revenue)', T.navy],
          ['Implied Temperature (Paris)', T.green], ['Multi-Exchange USD Normalised', T.blue], ['NGFS Scenario Ready', T.purple]
        ].map(([l, c]) => (
          <span key={l} style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}15`,
            border: `1px solid ${c}44`, borderRadius: 4, padding: '2px 7px' }}>{l}</span>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: T.sub }}>
          Feeds → <strong style={{ color: T.navy }}>PCAF Calculator · VaR · CSRD · Client Report</strong>
        </div>
      </div>

      {/* Portfolio selector */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Portfolio:</span>
        {Object.keys(portfolios).map(name => (
          <button key={name} onClick={() => setActivePortfolio(name)}
            style={{ fontSize: 12, fontWeight: activePortfolio === name ? 700 : 400,
              color: activePortfolio === name ? '#fff' : T.navy,
              background: activePortfolio === name ? T.navy : `${T.navy}0d`,
              border: `1px solid ${activePortfolio === name ? T.navy : T.border}`,
              borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: T.font }}>
            {name} ({(portfolios[name] || []).length})
          </button>
        ))}
        {showNewPortfolio ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={newPortfolioName} onChange={e => setNewPortfolioName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newPortfolioName.trim()) {
                setPortfolios(p => ({ ...p, [newPortfolioName.trim()]: [] }));
                setActivePortfolio(newPortfolioName.trim()); setNewPortfolioName(''); setShowNewPortfolio(false);
              }}}
              placeholder="Portfolio name…" autoFocus
              style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: T.font, width: 160 }} />
            <button onClick={() => { if (newPortfolioName.trim()) {
              setPortfolios(p => ({ ...p, [newPortfolioName.trim()]: [] }));
              setActivePortfolio(newPortfolioName.trim()); setNewPortfolioName(''); setShowNewPortfolio(false);
            }}}
              style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: T.navy, border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
              Create
            </button>
            <button onClick={() => setShowNewPortfolio(false)}
              style={{ fontSize: 12, color: T.sub, background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>
              ×
            </button>
          </div>
        ) : (
          <button onClick={() => setShowNewPortfolio(true)}
            style={{ fontSize: 12, color: T.blue, background: `${T.blue}0d`, border: `1px solid ${T.blue}44`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
            + New Portfolio
          </button>
        )}
        {Object.keys(portfolios).length > 1 && (
          <button onClick={() => {
            if (!window.confirm(`Delete portfolio "${activePortfolio}"?`)) return;
            const next = Object.keys(portfolios).filter(k => k !== activePortfolio)[0];
            setPortfolios(p => { const n = { ...p }; delete n[activePortfolio]; return n; });
            setActivePortfolio(next);
          }}
            style={{ fontSize: 12, color: T.red, background: `${T.red}08`, border: `1px solid ${T.red}33`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
            Delete
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>

        {/* ── LEFT: Holdings table + search ─────────────────────────────── */}
        <div style={{ flex: '1 1 62%', minWidth: 0 }}>

          {/* Search + Add */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>
              🔍 Add Holdings — Search across {GLOBAL_COMPANY_MASTER.length} global companies
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <input value={search} onChange={e => { setSearch(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search company, ticker, sector…"
                style={{ flex: 1, minWidth: 180, border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 12px', fontSize: 13, fontFamily: T.font }} />
              <select value={exchangeFilter} onChange={e => setExFilter(e.target.value)}
                style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: T.font }}>
                <option value="All">All Exchanges</option>
                {EXCHANGES.map(e => <option key={e.id} value={e.label.split(' — ')[1] || e.id}>{e.flag} {e.label}</option>)}
              </select>
              <select value={sectorFilter} onChange={e => setSFilter(e.target.value)}
                style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: T.font }}>
                <option value="All">All Sectors</option>
                {ALL_SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Results dropdown */}
            {searchOpen && searchResults.length > 0 && (
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                {searchResults.map(c => {
                  const id = c.id || c.cin || `${c.ticker}-${c.exchange}`;
                  const already = holdings.some(h => h.id === id);
                  return (
                    <div key={id}
                      onClick={() => { if (!already) addHolding(c); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderTop: `1px solid ${T.border}`,
                        cursor: already ? 'not-allowed' : 'pointer',
                        background: already ? '#f0fdf4' : '#fff',
                        opacity: already ? 0.7 : 1,
                      }}
                      onMouseEnter={e => { if (!already) e.currentTarget.style.background = '#f0f4ff'; }}
                      onMouseLeave={e => { if (!already) e.currentTarget.style.background = '#fff'; }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{c.shortName || c.name}</span>
                        <span style={{ fontSize: 11, color: T.sub, marginLeft: 8 }}>{c.ticker} · {c._displayExchange || c.exchange}</span>
                        <span style={{ fontSize: 10, marginLeft: 8, color: SECTOR_COLORS[c.sector] || T.sub }}>{c.sector}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {c.market_cap_usd_mn && <span style={{ fontSize: 10, color: T.sub }}>{fmtMn(c.market_cap_usd_mn)}</span>}
                        {already
                          ? <span style={{ fontSize: 10, color: T.green, fontWeight: 700 }}>✓ Added</span>
                          : <span style={{ fontSize: 11, color: T.blue, fontWeight: 700 }}>+ Add</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {searchOpen && searchResults.length === 0 && search && (
              <div style={{ padding: '12px', color: T.sub, fontSize: 12, textAlign: 'center' }}>No results for "{search}"</div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <button onClick={() => setSearchOpen(false)}
                style={{ fontSize: 11, color: T.sub, background: 'none', border: `1px solid ${T.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>
                Hide results
              </button>
              <span style={{ fontSize: 11, color: T.sub }}>
                Showing {searchResults.length} of {GLOBAL_COMPANY_MASTER.length} global companies
              </span>
            </div>
          </div>

          {/* Holdings table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {/* Table toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
              borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
                Holdings — {activePortfolio}
                <span style={{ fontSize: 11, fontWeight: 400, color: T.sub, marginLeft: 8 }}>
                  {holdings.length} positions · {totalWeight.toFixed(1)}% allocated
                  {!weightOk && <span style={{ color: T.amber, fontWeight: 700 }}> ⚠ ≠ 100%</span>}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={equalWeight}
                  style={{ fontSize: 11, fontWeight: 600, color: T.navy, background: `${T.navy}0d`, border: `1px solid ${T.border}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer' }}>
                  Equal Weight
                </button>
                <button onClick={mktCapWeight}
                  style={{ fontSize: 11, fontWeight: 600, color: T.navy, background: `${T.navy}0d`, border: `1px solid ${T.border}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer' }}>
                  Mkt Cap Weight
                </button>
                <button onClick={() => {
                  setHoldings(prev => prev.map(h => ({ ...h, company: resolveCompanyData(h.company) })));
                }}
                  style={{ fontSize: 11, fontWeight: 600, color: T.sage, background: `${T.sage}0d`, border: `1px solid ${T.sage}44`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer' }}>
                  🔄 Sync Enriched Data
                </button>
                <button onClick={exportCsv} disabled={!holdings.length}
                  style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: T.navy, border: 'none', borderRadius: 5, padding: '5px 12px', cursor: holdings.length ? 'pointer' : 'not-allowed', opacity: holdings.length ? 1 : 0.5 }}>
                  ⬇ Export CSV
                </button>
              </div>
            </div>

            {holdings.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: T.sub }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 6 }}>No holdings yet</div>
                <div style={{ fontSize: 12 }}>Search for companies above and click to add them to this portfolio.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f1f0eb' }}>
                      {['Company', 'Exchange', 'Sector', 'Weight %', 'Exposure $M', 'Scope 1 S2', 'T-Risk', 'DQS', ''].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h, i) => {
                      const c = h.company;
                      const s12 = (c.scope1_co2e || 0) + (c.scope2_co2e || 0);
                      return (
                        <tr key={h.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 700, color: T.navy }}>{c.shortName || c.name}</div>
                            <div style={{ fontSize: 10, color: T.sub }}>{c.ticker}</div>
                          </td>
                          <td style={{ padding: '8px 10px', fontSize: 11, color: T.sub }}>{c._displayExchange || c.exchange}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: SECTOR_COLORS[c.sector] || T.sub,
                              background: `${SECTOR_COLORS[c.sector] || T.sub}15`, borderRadius: 3, padding: '1px 5px' }}>
                              {c.sector}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <WeightInput value={h.weight} onChange={w => updateWeight(h.id, w)} />
                              <div style={{ width: 32, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, h.weight)}%`, height: '100%', background: T.navy, borderRadius: 3 }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 10, color: T.sub }}>$</span>
                              <input type="number" min="0" value={h.exposure_usd_mn}
                                onChange={e => updateExposure(h.id, parseFloat(e.target.value) || 0)}
                                style={{ width: 64, border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 5px', fontSize: 11, fontFamily: T.font }} />
                              <span style={{ fontSize: 10, color: T.sub }}>M</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', fontSize: 11, color: s12 > 10e6 ? T.red : s12 > 1e6 ? '#ea580c' : T.text, fontWeight: s12 > 10e6 ? 700 : 400 }}>
                            {fmtCO2(s12)}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: RISK_C[c.transition_risk] || T.sub,
                              background: `${RISK_C[c.transition_risk] || T.sub}18`, borderRadius: 3, padding: '1px 5px' }}>
                              {c.transition_risk || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ background: { 1: T.green, 2: '#65a30d', 3: T.amber, 4: '#ea580c', 5: T.red }[c.dqs_default] || T.sub,
                              color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                              {c.dqs_default ? `DQS ${c.dqs_default}` : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <button onClick={() => removeHolding(h.id)}
                              style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>×</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Analytics panel ─────────────────────────────────────── */}
        <div style={{ flex: '0 0 340px', minWidth: 320 }}>

          {analytics ? (
            <>
              {/* Climate KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <KpiCard label="Portfolio WACI"
                  value={analytics.waci != null ? `${analytics.waci.toLocaleString()}` : '—'}
                  sub="tCO₂e / $M Revenue" color={T.navy} />
                <KpiCard label="Implied Temp"
                  value={analytics.impliedTemperature != null ? `${analytics.impliedTemperature}°C` : '—'}
                  sub="Paris alignment" color={analytics.impliedTemperature ? tempColor(analytics.impliedTemperature) : T.sub} large />
                <KpiCard label="Agg. Scope 1" value={fmtCO2(analytics.totalScope1)} sub="Weighted tCO₂e" color={T.red} />
                <KpiCard label="Agg. Scope 1+2" value={fmtCO2(analytics.totalScope1 + analytics.totalScope2)} sub="Weighted tCO₂e" color="#ea580c" />
                <KpiCard label="SBTi Committed" value={`${analytics.sbtiPct}%`} sub="of holdings" color={T.green} />
                <KpiCard label="Portfolio Mkt Cap" value={fmtMn(analytics.totalMarketCap)} sub="Weighted USD" color={T.blue} />
              </div>

              {/* Weight check */}
              <div style={{ background: T.card, border: `1px solid ${weightOk ? T.green : T.amber}`,
                borderRadius: 8, padding: '8px 12px', marginBottom: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.sub }}>Total Weight</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: weightOk ? T.green : T.amber }}>
                  {totalWeight.toFixed(1)}% {weightOk ? '✓' : '⚠'}
                </span>
              </div>

              {/* Sector breakdown pie */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Sector Allocation</div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={analytics.sectorPie} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {analytics.sectorPie.map(({ name }) => (
                        <Cell key={name} fill={SECTOR_COLORS[name] || T.sub} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 4 }}>
                  {analytics.sectorPie.slice(0, 8).map(({ name, value }) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: SECTOR_COLORS[name] || T.sub, flexShrink: 0 }} />
                      <span style={{ color: T.sub }}>{name.split(' ')[0]} {value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transition risk bar */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>Transition Risk Distribution (%)</div>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={analytics.riskBar} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.sub }} />
                    <YAxis tick={{ fontSize: 9, fill: T.sub }} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {analytics.riskBar.map(r => <Cell key={r.name} fill={r.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Exchange breakdown */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>Exchange Allocation</div>
                {analytics.exchangePie.map(({ name, value }) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: T.sub, flex: 1 }}>{name}</span>
                    <div style={{ width: 80, height: 6, background: '#e5e7eb', borderRadius: 3, marginRight: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: T.navy, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.navy, minWidth: 32, textAlign: 'right' }}>{value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '40px 24px', textAlign: 'center', color: T.sub }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Portfolio Analytics</div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                Add holdings to see live<br />WACI, implied temperature,<br />sector allocation and risk distribution.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
