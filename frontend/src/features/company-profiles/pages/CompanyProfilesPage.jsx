import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMPANY_MASTER, SECTORS } from '../../../data/companyMaster';
import { KEY_FIELDS, SOURCE_META } from '../../../data/enrichmentService';
import { useEnrichment } from '../../../context/CompanyEnrichmentContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const RISK_COLOR = { 'Very High': T.red, 'High': '#ea580c', 'Medium': T.amber, 'Low': T.sage, 'Very Low': T.teal };
const DQS_COLOR  = { 1: T.green, 2: '#65a30d', 3: T.amber, 4: '#ea580c', 5: T.red };
const SECTOR_COLOR = {
  'Energy': '#dc2626', 'Mining': '#92400e', 'Utilities': '#1d4ed8',
  'Materials': '#7c3aed', 'Industrials': '#0d9488', 'Financials': '#1b3a5c',
  'Information Technology': '#4f46e5', 'Consumer Discretionary': '#d97706',
  'Consumer Staples': '#16a34a', 'Health Care': '#be185d', 'Real Estate': '#0891b2',
};

const fmt = n => n == null ? '—' : n >= 1e6 ? `₹${(n/1e5).toFixed(0)}K Cr` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K Cr` : `₹${n} Cr`;
const fmtCO2 = n => n == null ? '—' : n >= 1e6 ? `${(n/1e6).toFixed(2)}M tCO₂e` : n >= 1000 ? `${(n/1000).toFixed(0)}K tCO₂e` : `${n} tCO₂e`;

/* ── Sub-components ────────────────────────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase',
      letterSpacing: .6, marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${T.border}` }}>
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {children}
    </div>
  </div>
);

const Row = ({ l, v, vc, bold, mono, badge }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12, gap: 4 }}>
    <span style={{ color: T.sub, flexShrink: 0, marginRight: 8 }}>{l}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      {badge && <SourceBadge source={badge} />}
      <span style={{ fontWeight: bold ? 700 : 500, color: vc || T.navy,
        fontFamily: mono ? "'JetBrains Mono','Courier New',monospace" : T.font,
        fontSize: mono ? 10 : 12, textAlign: 'right' }}>
        {v || '—'}
      </span>
    </div>
  </div>
);

const SourceBadge = ({ source }) => {
  if (!source || !SOURCE_META[source]) return null;
  const meta = SOURCE_META[source];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color: meta.color,
      background: `${meta.color}18`, border: `1px solid ${meta.color}44`,
      borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap',
    }}>
      {meta.icon} {source === 'alpha_vantage' ? 'AV' : source === 'eodhd' ? 'EODHD' : source === 'brsr_p6' ? 'BRSR' : meta.label}
    </span>
  );
};

const EsgBar = ({ score, label }) => {
  if (score == null) return null;
  const pct = Math.min(100, Math.max(0, score));
  const color = pct > 70 ? T.green : pct > 50 ? T.amber : T.red;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
        <span style={{ color: T.sub }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{pct.toFixed(1)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
};

/* ── Spinner ────────────────────────────────────────────────────────────────── */
const Spinner = () => (
  <span style={{
    display: 'inline-block', width: 12, height: 12, border: `2px solid ${T.blue}44`,
    borderTop: `2px solid ${T.blue}`, borderRadius: '50%',
    animation: 'ra-spin 0.7s linear infinite', verticalAlign: 'middle',
  }} />
);

/* ── Enrichment status pill ─────────────────────────────────────────────────── */
const EnrichPill = ({ status, score }) => {
  if (status === 'idle' || !status) return <span style={{ color: T.sub, fontSize: 11 }}>─ Not fetched</span>;
  if (status === 'loading') return <span style={{ color: T.blue, fontSize: 11 }}><Spinner /> Loading…</span>;
  if (status === 'partial') return <span style={{ color: T.amber, fontWeight: 600, fontSize: 11 }}>◑ Partial ({score}%)</span>;
  if (status === 'complete') return <span style={{ color: T.green, fontWeight: 600, fontSize: 11 }}>✓ Complete ({score}%)</span>;
  if (status === 'error') return <span style={{ color: T.red, fontWeight: 600, fontSize: 11 }}>✗ Error</span>;
  return null;
};

/* ── Data Source Config Panel ───────────────────────────────────────────────── */
function DataSourceConfig() {
  const { apiKeys, setApiKey } = useEnrichment();
  const [open, setOpen] = useState(false);
  const [eodhdInput, setEodhdInput] = useState(apiKeys.eodhd || '');
  const [avInput, setAvInput] = useState(apiKeys.alpha_vantage || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey('eodhd', eodhdInput.trim());
    setApiKey('alpha_vantage', avInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!open) {
    return (
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setOpen(true)}
          style={{ fontSize: 12, fontWeight: 600, color: T.navy, background: `${T.navy}0d`,
            border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: T.font }}>
          ⚙ Configure Data Sources
        </button>
        <span style={{ fontSize: 11, color: T.sub }}>
          EODHD: <span style={{ color: apiKeys.eodhd ? T.green : T.sub, fontWeight: 700 }}>{apiKeys.eodhd ? '● Set' : '○ Not set'}</span>
          {' '} · Alpha Vantage: <span style={{ color: apiKeys.alpha_vantage ? T.green : T.sub, fontWeight: 700 }}>{apiKeys.alpha_vantage ? '● Set' : '○ Not set'}</span>
        </span>
      </div>
    );
  }

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.navy}`,
      borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>⚙ Data Source Configuration</div>
        <button onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: T.sub, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 4 }}>
            📡 EODHD API Key
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
              background: apiKeys.eodhd ? T.green : '#d1d5db', marginLeft: 6 }} />
          </label>
          <input type="password" value={eodhdInput} onChange={e => setEodhdInput(e.target.value)}
            placeholder="Enter EODHD API key…"
            style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px',
              fontSize: 12, fontFamily: T.font, boxSizing: 'border-box' }} />
          <a href="https://eodhd.com" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: T.blue, marginTop: 3, display: 'block' }}>
            Get free key at eodhd.com →
          </a>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 4 }}>
            📊 Alpha Vantage API Key
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
              background: apiKeys.alpha_vantage ? T.green : '#d1d5db', marginLeft: 6 }} />
          </label>
          <input type="password" value={avInput} onChange={e => setAvInput(e.target.value)}
            placeholder="Enter Alpha Vantage API key…"
            style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px',
              fontSize: 12, fontFamily: T.font, boxSizing: 'border-box' }} />
          <a href="https://www.alphavantage.co" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: T.blue, marginTop: 3, display: 'block' }}>
            Get free key at alphavantage.co →
          </a>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={handleSave}
          style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: T.navy, border: 'none',
            borderRadius: 6, padding: '7px 18px', cursor: 'pointer', fontFamily: T.font }}>
          {saved ? '✓ Saved!' : 'Save Keys'}
        </button>
        <span style={{ fontSize: 10, color: T.sub }}>
          Rate limits: EODHD: 20 req/day free | Alpha Vantage: 25 req/day, 5/min free
        </span>
      </div>
    </div>
  );
}

/* ── Manual Data Entry ──────────────────────────────────────────────────────── */
function ManualDataEntry({ cin }) {
  const { setManualField, manualOverrides } = useEnrichment();
  const existing = manualOverrides[cin] || {};
  const [s1, setS1] = useState(existing.scope1_co2e ?? '');
  const [s2, setS2] = useState(existing.scope2_co2e ?? '');
  const [s3, setS3] = useState(existing.scope3_co2e ?? '');
  const [evic, setEvic] = useState(existing.evic_inr_cr ?? '');
  const [rev, setRev] = useState(existing.revenue_inr_cr ?? '');
  const [notes, setNotes] = useState(existing.notes ?? '');
  const [saved, setSaved] = useState(false);

  const hasManual = Object.keys(existing).length > 0;

  const handleSave = () => {
    if (s1 !== '') setManualField(cin, 'scope1_co2e', parseFloat(s1) || 0);
    if (s2 !== '') setManualField(cin, 'scope2_co2e', parseFloat(s2) || 0);
    if (s3 !== '') setManualField(cin, 'scope3_co2e', parseFloat(s3) || 0);
    if (evic !== '') setManualField(cin, 'evic_inr_cr', parseFloat(evic) || 0);
    if (rev !== '') setManualField(cin, 'revenue_inr_cr', parseFloat(rev) || 0);
    if (notes !== '') setManualField(cin, 'notes', notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle = {
    width: '100%', border: `1px solid ${T.border}`, borderRadius: 4,
    padding: '5px 8px', fontSize: 11, fontFamily: T.font, boxSizing: 'border-box',
  };

  return (
    <Section title="📝 Manual Data Entry">
      {hasManual && (
        <div style={{ fontSize: 10, color: '#7c3aed', background: '#7c3aed12',
          border: '1px solid #7c3aed44', borderRadius: 4, padding: '4px 8px', marginBottom: 8 }}>
          ✏️ Manually overriding API data for {Object.keys(existing).length} field(s)
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>Scope 1 (tCO₂e)</div>
          <input type="number" value={s1} onChange={e => setS1(e.target.value)} style={inputStyle} placeholder="e.g. 25600000" />
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>Scope 2 (tCO₂e)</div>
          <input type="number" value={s2} onChange={e => setS2(e.target.value)} style={inputStyle} placeholder="e.g. 890000" />
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>Scope 3 (tCO₂e)</div>
          <input type="number" value={s3} onChange={e => setS3(e.target.value)} style={inputStyle} placeholder="e.g. 180000000" />
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>EVIC (₹Cr)</div>
          <input type="number" value={evic} onChange={e => setEvic(e.target.value)} style={inputStyle} placeholder="e.g. 1850000" />
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>Revenue (₹Cr)</div>
          <input type="number" value={rev} onChange={e => setRev(e.target.value)} style={inputStyle} placeholder="e.g. 900000" />
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>Notes</div>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} placeholder="Free text…" />
        </div>
      </div>
      <button onClick={handleSave}
        style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#7c3aed',
          border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
          fontFamily: T.font, marginTop: 6, alignSelf: 'flex-start' }}>
        {saved ? '✓ Saved!' : 'Save Manual Data'}
      </button>
    </Section>
  );
}

/* ── Data Completeness Meter ────────────────────────────────────────────────── */
function CompletenessMeter({ cin, masterRecord, profile }) {
  const filled = KEY_FIELDS.filter(k => {
    if (profile?.[k]?.value != null) return true;
    if (masterRecord?.[k] != null) return true;
    return false;
  });
  const missing = KEY_FIELDS.filter(k => {
    if (profile?.[k]?.value != null) return false;
    if (masterRecord?.[k] != null) return false;
    return true;
  });
  const pct = Math.round((filled.length / KEY_FIELDS.length) * 100);
  const color = pct >= 70 ? T.green : pct >= 40 ? T.amber : T.red;

  return (
    <Section title="Profile Completeness">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: T.sub }}>Data completeness</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.4s' }} />
      </div>
      {missing.length > 0 && (
        <div style={{ fontSize: 10, color: T.sub }}>
          <span style={{ fontWeight: 600 }}>Missing fields: </span>
          {missing.map(k => (
            <span key={k} style={{ background: '#f3f4f6', borderRadius: 3, padding: '1px 5px', marginRight: 3,
              border: '1px solid #e5e7eb', display: 'inline-block', marginBottom: 3 }}>{k}</span>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function CompanyProfilesPage() {
  const navigate = useNavigate();
  const {
    status, errors, enriched, enrichCompany, enrichBulk,
    queue, queueRunning, cancelQueue, getProfile, manualOverrides,
  } = useEnrichment();

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch]       = useState('');
  const [sectorFilter, setSector] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const [sortKey, setSortKey]     = useState('evic_inr_cr');
  const [sortDir, setSortDir]     = useState('desc');
  const [selected, setSelected]   = useState(null);

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = COMPANY_MASTER;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.ticker.toLowerCase().includes(q) ||
        c.cin.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q)
      );
    }
    if (sectorFilter !== 'All') list = list.filter(c => c.sector === sectorFilter);
    if (tagFilter   !== 'All') list = list.filter(c => c.tags?.includes(tagFilter));
    const dir = sortDir === 'desc' ? -1 : 1;
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      return typeof av === 'string' ? av.localeCompare(bv) * dir : (bv - av) * (dir * -1);
    });
  }, [search, sectorFilter, tagFilter, sortKey, sortDir]);

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortHdr = ({ label, k }) => (
    <th onClick={() => toggleSort(k)} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600,
      color: sortKey === k ? T.navy : T.sub, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
      background: sortKey === k ? '#eef2ff' : '#f1f0eb' }}>
      {label} {sortKey === k ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalMktCap = COMPANY_MASTER.reduce((s, c) => s + (c.market_cap_inr_cr || 0), 0);
  const totalScope1 = COMPANY_MASTER.reduce((s, c) => s + (c.scope1_co2e || 0), 0);
  const highRiskCount = COMPANY_MASTER.filter(c => ['High','Very High'].includes(c.transition_risk)).length;
  const enrichedCount = Object.keys(enriched).length;

  // ── Enriched value helper ─────────────────────────────────────────────────
  // Returns { value, source } preferring enriched profile over master
  const getVal = useCallback((cin, field, masterVal) => {
    const profile = getProfile(cin);
    const manual = manualOverrides[cin]?.[field];
    if (manual != null && manual !== '') return { value: manual, source: 'manual' };
    if (profile?.[field]?.value != null) return { value: profile[field].value, source: profile[field].source };
    return { value: masterVal, source: 'master' };
  }, [getProfile, manualOverrides]);

  // ── Bulk enrich ───────────────────────────────────────────────────────────
  const handleBulkEnrich = () => {
    const companies = COMPANY_MASTER.filter(c => !status[c.cin] || status[c.cin] === 'idle' || status[c.cin] === 'error');
    enrichBulk(companies);
  };

  // ── Inline spin CSS ───────────────────────────────────────────────────────
  const spinStyle = `
    @keyframes ra-spin { to { transform: rotate(360deg); } }
  `;

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>
      <style>{spinStyle}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.navy, color: T.gold, borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>REF</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Company Master Reference</h1>
          <span style={{ background: '#eff6ff', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>
            {COMPANY_MASTER.length} Companies · BRSR P6 + PCAF + Climate Risk
          </span>
          {enrichedCount > 0 && (
            <span style={{ background: '#f0fdf4', color: T.green, border: `1px solid ${T.green}44`, borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>
              {enrichedCount} Enriched
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: T.sub, margin: 0 }}>
          Master entity registry — SEBI BRSR Core FY2024, MCA21 CIN, GICS Sectors, GHG Scope 1/2/3, EVIC/Revenue, PCAF DQS, Transition &amp; Physical Risk ratings. Click any row for full profile.
        </p>
      </div>

      {/* Regulatory context bar */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.navy}`,
        borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['SEBI BRSR Core P6',T.sage],['MCA21 CIN Registry',T.navy],['PCAF v3.0 DQS',T.teal],
          ['GICS Sector Classification',T.blue],['NGFS Transition Risk',T.amber],['CPCB/MoEFCC GHG',T.indigo]
        ].map(([l,c]) => (
          <span key={l} style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}15`,
            border: `1px solid ${c}44`, borderRadius: 4, padding: '2px 7px' }}>{l}</span>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: T.sub }}>
          Feeds: <strong style={{color:T.navy}}>PCAF autocomplete · Portfolio VaR · Stranded Assets · CSRD iXBRL</strong>
        </div>
      </div>

      {/* Data Source Config */}
      <DataSourceConfig />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Companies in Registry', value: COMPANY_MASTER.length, sub: 'BRSR Core Universe', color: T.navy },
          { label: 'Total Market Cap', value: `₹${(totalMktCap/100000).toFixed(1)}L Cr`, sub: 'Combined listed equity', color: T.blue },
          { label: 'Scope 1 Emissions', value: fmtCO2(totalScope1), sub: 'Registry aggregate', color: T.red },
          { label: 'Enriched Profiles', value: `${enrichedCount} / ${COMPANY_MASTER.length}`, sub: 'API data fetched', color: T.green },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, margin: '6px 0 2px' }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: T.sub }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>

        {/* ── LEFT: Registry table ──────────────────────────────────────── */}
        <div style={{ flex: selected ? '1 1 60%' : '1 1 100%' }}>

          {/* Filters + Bulk Enrich */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, CIN, ticker, sector…"
              style={{ flex: 1, minWidth: 200, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px',
                fontSize: 13, fontFamily: T.font, background: '#fff', color: T.text, outline: 'none' }} />
            <select value={sectorFilter} onChange={e => setSector(e.target.value)}
              style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: T.font, color: T.text }}>
              <option value="All">All Sectors</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
              style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: T.font, color: T.text }}>
              <option value="All">All Tags</option>
              {['NIFTY50','PSU','BRSR-Core','High-Emitter','Stranded-Risk','Renewable','Net-Zero-2030','Net-Zero-2040','SBTi-Committed','Green-Bond','PCAF-FI','Coal-Power','Coal-Mining'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: T.sub }}>{filtered.length} results</span>

            {queueRunning ? (
              <button onClick={cancelQueue}
                style={{ fontSize: 11, fontWeight: 700, color: T.red, background: `${T.red}12`,
                  border: `1px solid ${T.red}44`, borderRadius: 6, padding: '7px 14px',
                  cursor: 'pointer', fontFamily: T.font, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Spinner /> Stop ({queue.length} left)
              </button>
            ) : (
              <button onClick={handleBulkEnrich}
                style={{ fontSize: 11, fontWeight: 700, color: T.navy, background: `${T.navy}0d`,
                  border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 14px',
                  cursor: 'pointer', fontFamily: T.font }}>
                ▶▶ Bulk Enrich All ({COMPANY_MASTER.filter(c => !status[c.cin] || status[c.cin] === 'idle' || status[c.cin] === 'error').length} remaining)
              </button>
            )}
          </div>

          {/* Table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <SortHdr label="Company"       k="name" />
                  <SortHdr label="Sector"         k="sector" />
                  <SortHdr label="EVIC (₹Cr)"     k="evic_inr_cr" />
                  <SortHdr label="Revenue (₹Cr)"  k="revenue_inr_cr" />
                  <SortHdr label="Scope 1 tCO₂e"  k="scope1_co2e" />
                  <SortHdr label="GHG Intensity"  k="ghg_intensity_tco2e_cr" />
                  <SortHdr label="T-Risk"         k="transition_risk" />
                  <th style={{ padding: '9px 12px', fontWeight: 600, color: T.sub, background: '#f1f0eb' }}>DQS</th>
                  <th style={{ padding: '9px 12px', fontWeight: 600, color: T.sub, background: '#f1f0eb' }}>Enrichment</th>
                  <th style={{ padding: '9px 12px', fontWeight: 600, color: T.sub, background: '#f1f0eb' }}>Enrich</th>
                  <th style={{ padding: '9px 12px', fontWeight: 600, color: T.sub, background: '#f1f0eb' }}>Use In</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const isActive = selected?.cin === c.cin;
                  const sColor = SECTOR_COLOR[c.sector] || T.navy;
                  const cStatus = status[c.cin];
                  const cProfile = getProfile(c.cin);
                  const score = cProfile?.enrichment_score;

                  return (
                    <tr key={c.cin}
                      onClick={() => setSelected(isActive ? null : c)}
                      style={{ borderTop: `1px solid ${T.border}`, cursor: 'pointer',
                        background: isActive ? '#eef2ff' : i % 2 === 0 ? '#fff' : '#fafafa',
                        transition: 'background .1s' }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f5f3ff'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'; }}>

                      {/* Company */}
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ fontWeight: 700, color: T.navy, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: sColor, flexShrink: 0 }} />
                          {c.shortName}
                        </div>
                        <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>{c.ticker} · {c.cin.slice(-6)}</div>
                        {c.nifty50 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: T.gold, background: `${T.gold}20`,
                            border: `1px solid ${T.gold}44`, borderRadius: 3, padding: '1px 5px' }}>N50</span>
                        )}
                      </td>

                      {/* Sector */}
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: sColor, background: `${sColor}15`,
                          border: `1px solid ${sColor}33`, borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                          {c.sector.split(' ')[0]}
                        </span>
                      </td>

                      {/* EVIC */}
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy, fontVariantNumeric: 'tabular-nums' }}>
                        {(c.evic_inr_cr / 1000).toFixed(0)}K
                      </td>

                      {/* Revenue */}
                      <td style={{ padding: '9px 12px', color: T.text, fontVariantNumeric: 'tabular-nums' }}>
                        {(c.revenue_inr_cr / 1000).toFixed(0)}K
                      </td>

                      {/* Scope 1 */}
                      <td style={{ padding: '9px 12px', color: c.scope1_co2e > 10e6 ? T.red : c.scope1_co2e > 1e6 ? '#ea580c' : T.text,
                        fontWeight: c.scope1_co2e > 10e6 ? 700 : 400 }}>
                        {fmtCO2(c.scope1_co2e)}
                      </td>

                      {/* GHG Intensity */}
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: Math.min(40, c.ghg_intensity_tco2e_cr / 35), height: 6,
                            background: c.ghg_intensity_tco2e_cr > 500 ? T.red : c.ghg_intensity_tco2e_cr > 100 ? T.amber : T.sage,
                            borderRadius: 3, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: T.sub }}>{c.ghg_intensity_tco2e_cr?.toFixed(1)}</span>
                        </div>
                      </td>

                      {/* Transition Risk */}
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700,
                          color: RISK_COLOR[c.transition_risk] || T.sub,
                          background: `${RISK_COLOR[c.transition_risk] || T.sub}18`,
                          border: `1px solid ${RISK_COLOR[c.transition_risk] || T.sub}44`,
                          borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                          {c.transition_risk}
                        </span>
                      </td>

                      {/* DQS */}
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: DQS_COLOR[c.dqs_default], color: '#fff',
                          borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                          DQS {c.dqs_default}
                        </span>
                      </td>

                      {/* Enrichment status */}
                      <td style={{ padding: '9px 12px' }} onClick={e => e.stopPropagation()}>
                        <EnrichPill status={cStatus} score={score} />
                      </td>

                      {/* Enrich button */}
                      <td style={{ padding: '6px 8px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => enrichCompany(c.cin, c.ticker)}
                          disabled={cStatus === 'loading'}
                          style={{ fontSize: 11, fontWeight: 700, color: cStatus === 'loading' ? T.sub : T.navy,
                            background: cStatus === 'loading' ? '#f3f4f6' : `${T.navy}12`,
                            border: `1px solid ${T.border}`, borderRadius: 4,
                            padding: '4px 8px', cursor: cStatus === 'loading' ? 'not-allowed' : 'pointer',
                            fontFamily: T.font }}>
                          {cStatus === 'loading' ? <Spinner /> : '▶'}
                        </button>
                      </td>

                      {/* Quick-use buttons */}
                      <td style={{ padding: '6px 8px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {[
                            { label: 'VaR', path: '/portfolio-climate-var', title: 'Open in Portfolio Climate VaR' },
                            { label: 'PCAF', path: '/pcaf-india-brsr', title: 'Open in PCAF Calculator' },
                            { label: 'CSRD', path: '/csrd-ixbrl', title: 'Open in CSRD iXBRL' },
                          ].map(btn => (
                            <button key={btn.label} title={btn.title}
                              onClick={e => { e.stopPropagation(); navigate(btn.path); }}
                              style={{ fontSize: 9, fontWeight: 700, color: T.navy, background: `${T.navy}12`,
                                border: `1px solid ${T.navy}33`, borderRadius: 4, padding: '2px 6px',
                                cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: T.sub, fontSize: 13 }}>
                No companies match your search. Try clearing filters.
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Company Profile Panel ──────────────────────────────── */}
        {selected && (() => {
          const cin = selected.cin;
          const cStatus = status[cin];
          const cError = errors[cin];
          const profile = getProfile(cin);
          const sourcesUsed = profile?.data_sources_used || [];

          const ev = (field) => getVal(cin, field, selected[field]);

          return (
            <div style={{ flex: '0 0 400px', minWidth: 360, maxWidth: 420 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`,
                borderTop: `4px solid ${SECTOR_COLOR[selected.sector] || T.navy}`,
                borderRadius: 10, padding: 20, position: 'sticky', top: 24, maxHeight: '90vh', overflowY: 'auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                      {selected.ticker} · {selected.cin}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {selected.nifty50 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: T.gold, background: `${T.gold}20`,
                          border: `1px solid ${T.gold}55`, borderRadius: 4, padding: '2px 6px' }}>NIFTY50</span>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 700,
                        color: RISK_COLOR[selected.transition_risk], background: `${RISK_COLOR[selected.transition_risk]}18`,
                        border: `1px solid ${RISK_COLOR[selected.transition_risk]}44`, borderRadius: 4, padding: '2px 6px' }}>
                        T-Risk: {selected.transition_risk}
                      </span>
                      <span style={{ background: DQS_COLOR[selected.dqs_default], color: '#fff',
                        borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                        DQS {selected.dqs_default}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.sub, lineHeight: 1 }}>×</button>
                </div>

                {/* Enrichment strip */}
                <div style={{ background: '#f8f7f3', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: .5 }}>
                      Enrichment Status
                    </div>
                    {(!cStatus || cStatus === 'idle' || cStatus === 'error') && (
                      <button onClick={() => enrichCompany(cin, selected.ticker)}
                        style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: T.navy, border: 'none',
                          borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontFamily: T.font }}>
                        ▶ Enrich This Company
                      </button>
                    )}
                    {cStatus === 'loading' && (
                      <span style={{ fontSize: 11, color: T.blue, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Spinner /> Enriching…
                      </span>
                    )}
                    {(cStatus === 'complete' || cStatus === 'partial') && (
                      <button onClick={() => enrichCompany(cin, selected.ticker)}
                        style={{ fontSize: 11, fontWeight: 600, color: T.navy, background: `${T.navy}0d`, border: `1px solid ${T.border}`,
                          borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontFamily: T.font }}>
                        ↻ Re-enrich
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <EnrichPill status={cStatus} score={profile?.enrichment_score} />
                    {sourcesUsed.map(s => <SourceBadge key={s} source={s} />)}
                  </div>
                </div>

                {/* Error alert */}
                {cError && (
                  <div style={{ background: '#fffbeb', border: `1px solid ${T.amber}44`, borderLeft: `4px solid ${T.amber}`,
                    borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 3 }}>⚠ Enrichment Warning</div>
                    <div style={{ fontSize: 11, color: '#92400e' }}>{cError}</div>
                    <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>
                      Suggestion: Check API key, rate limits, or try again later.
                    </div>
                  </div>
                )}

                {/* Notes / description */}
                {(() => {
                  const desc = ev('description');
                  return desc.value ? (
                    <div style={{ fontSize: 11, color: T.sub, background: '#f8f7f3', borderRadius: 6,
                      padding: '8px 10px', marginBottom: 14, lineHeight: 1.5 }}>
                      {desc.value}
                      {desc.source !== 'master' && <SourceBadge source={desc.source} />}
                    </div>
                  ) : selected.notes ? (
                    <div style={{ fontSize: 11, color: T.sub, background: '#f8f7f3', borderRadius: 6,
                      padding: '8px 10px', marginBottom: 14, lineHeight: 1.5 }}>
                      {selected.notes}
                    </div>
                  ) : null;
                })()}

                {/* Identity */}
                <Section title="Corporate Identity">
                  <Row l="Sector (GICS)"  v={selected.sector} vc={SECTOR_COLOR[selected.sector]} />
                  <Row l="Sub-sector"     v={selected.subsector} />
                  {selected.industry && <Row l="Industry (L4)" v={selected.industry} />}
                  <Row l="Exchange"       v={selected.exchange} />
                  <Row l="CIN"            v={selected.cin} mono />
                  {selected.isin && <Row l="ISIN" v={selected.isin} mono />}
                  {(() => { const d = ev('employees'); return <Row l="Employees" v={d.value?.toLocaleString()} badge={d.source !== 'master' ? d.source : undefined} />; })()}
                  {selected.founded_year && <Row l="Founded" v={selected.founded_year} />}
                  {selected.headquarters_city && <Row l="HQ City" v={`${selected.headquarters_city}, ${selected.state}`} />}
                  <Row l="Indices" v={selected.niftyIndex?.join(' · ')} />
                  {selected.website && (
                    <Row l="Website" v={
                      <a href={selected.website} target="_blank" rel="noopener noreferrer"
                        style={{ color: T.blue, textDecoration: 'none', fontSize: 11 }}>
                        {selected.website.replace('https://', '')}
                      </a>
                    } />
                  )}
                  {selected.industry && <Row l="Data As Of" v={selected.data_as_of || 'FY2024'} />}
                </Section>

                {/* Financials */}
                <Section title="Financials (FY2024, ₹ Crore)">
                  {(() => { const d = ev('evic_inr_cr'); return <Row l="EVIC" v={`₹${(d.value/1000).toFixed(0)}K Cr`} bold badge={d.source !== 'master' ? d.source : undefined} />; })()}
                  {(() => { const d = ev('market_cap_inr_cr'); return <Row l="Market Cap" v={`₹${(d.value/1000).toFixed(0)}K Cr`} badge={d.source !== 'master' ? d.source : undefined} />; })()}
                  {(() => { const d = ev('revenue_inr_cr'); return <Row l="Revenue" v={`₹${(d.value/1000).toFixed(0)}K Cr`} badge={d.source !== 'master' ? d.source : undefined} />; })()}
                  {selected.ebitda_inr_cr && <Row l="EBITDA" v={`₹${(selected.ebitda_inr_cr/1000).toFixed(1)}K Cr`} />}
                  {selected.net_profit_inr_cr && <Row l="Net Profit" v={`₹${(selected.net_profit_inr_cr/1000).toFixed(1)}K Cr`} />}
                  {/* Bank-specific metrics */}
                  {selected.net_interest_income_inr_cr && <Row l="Net Interest Income" v={`₹${(selected.net_interest_income_inr_cr/1000).toFixed(1)}K Cr`} />}
                  {(() => { const d = ev('total_debt_inr_cr'); return d.value ? <Row l="Total Debt / Liab." v={`₹${(d.value/1000).toFixed(0)}K Cr`} badge={d.source !== 'master' ? d.source : undefined} /> : null; })()}
                  {selected.eps_inr && <Row l="EPS (₹)" v={`₹${selected.eps_inr?.toFixed(1)}`} />}
                  <Row l="GHG Intensity" v={`${selected.ghg_intensity_tco2e_cr?.toFixed(2)} tCO₂e/₹Cr`} />
                  {/* Enrichment overlay for extra fields */}
                  {profile?.ebitda_inr_cr && <Row l="EBITDA (API)" v={profile.ebitda_inr_cr.value?.toLocaleString()} badge={profile.ebitda_inr_cr.source} />}
                  {profile?.net_income_inr_cr && <Row l="Net Income (API)" v={profile.net_income_inr_cr.value?.toLocaleString()} badge={profile.net_income_inr_cr.source} />}
                  {profile?.total_assets_inr_cr && <Row l="Total Assets" v={profile.total_assets_inr_cr.value?.toLocaleString()} badge={profile.total_assets_inr_cr.source} />}
                </Section>

                {/* Profitability & Leverage Ratios */}
                <Section title="Profitability & Leverage (FY2024)">
                  {selected.pe_ratio != null && <Row l="PE Ratio" v={`${selected.pe_ratio}x`} />}
                  {selected.roe_pct != null && <Row l="ROE" v={`${selected.roe_pct?.toFixed(1)}%`} vc={selected.roe_pct > 20 ? T.green : selected.roe_pct > 10 ? T.amber : T.red} />}
                  {selected.roce_pct != null && <Row l="ROCE" v={`${selected.roce_pct?.toFixed(1)}%`} />}
                  {selected.ebitda_margin_pct != null && <Row l="EBITDA Margin" v={`${selected.ebitda_margin_pct?.toFixed(1)}%`} />}
                  {selected.debt_equity_ratio != null && <Row l="Debt / Equity" v={selected.debt_equity_ratio?.toFixed(2)} vc={selected.debt_equity_ratio > 2 ? T.red : selected.debt_equity_ratio > 0.5 ? T.amber : T.green} />}
                  {selected.interest_coverage_ratio != null && <Row l="Interest Coverage" v={`${selected.interest_coverage_ratio?.toFixed(1)}x`} vc={selected.interest_coverage_ratio < 3 ? T.red : selected.interest_coverage_ratio < 6 ? T.amber : T.green} />}
                  {selected.dividend_yield_pct != null && <Row l="Dividend Yield" v={`${selected.dividend_yield_pct?.toFixed(1)}%`} />}
                  {/* Bank-specific */}
                  {selected.crar_pct != null && <Row l="CRAR (Capital Ratio)" v={`${selected.crar_pct?.toFixed(2)}%`} vc={selected.crar_pct > 15 ? T.green : T.amber} />}
                  {selected.gnpa_pct != null && <Row l="Gross NPA" v={`${selected.gnpa_pct?.toFixed(2)}%`} vc={selected.gnpa_pct < 2 ? T.green : selected.gnpa_pct < 5 ? T.amber : T.red} />}
                  {selected.net_interest_margin_pct != null && <Row l="Net Interest Margin" v={`${selected.net_interest_margin_pct?.toFixed(2)}%`} />}
                </Section>

                {/* Market Data */}
                <Section title="Market Data (31-Mar-2024)">
                  {selected.stock_price_inr && <Row l="Last Close (₹)" v={`₹${selected.stock_price_inr?.toLocaleString()}`} bold />}
                  {selected.beta != null && <Row l="Beta (1Y vs NIFTY)" v={selected.beta?.toFixed(2)} vc={selected.beta > 1.2 ? T.red : selected.beta < 0.7 ? T.sage : T.amber} />}
                  {selected.week52_high_inr && <Row l="52W High (₹)" v={`₹${selected.week52_high_inr?.toLocaleString()}`} />}
                  {selected.week52_low_inr && <Row l="52W Low (₹)" v={`₹${selected.week52_low_inr?.toLocaleString()}`} />}
                  {/* Show price range bar */}
                  {selected.week52_high_inr && selected.week52_low_inr && selected.stock_price_inr && (() => {
                    const range = selected.week52_high_inr - selected.week52_low_inr;
                    const pos = range > 0 ? ((selected.stock_price_inr - selected.week52_low_inr) / range) * 100 : 50;
                    return (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.sub, marginBottom: 2 }}>
                          <span>52W Low</span><span style={{ fontWeight: 700, color: T.navy }}>{Math.round(pos)}% in range</span><span>52W High</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', position: 'relative', overflow: 'visible' }}>
                          <div style={{ width: `${pos}%`, height: '100%', background: T.teal, borderRadius: 3, transition: 'width .3s' }} />
                          <div style={{ position: 'absolute', left: `${pos}%`, top: -2, width: 10, height: 10, background: T.navy, borderRadius: '50%', transform: 'translateX(-50%)' }} />
                        </div>
                      </div>
                    );
                  })()}
                  {/* Enrichment-sourced market data */}
                  {profile?.pe_ratio && <Row l="PE (API)" v={profile.pe_ratio.value} badge={profile.pe_ratio.source} />}
                  {profile?.analyst_target_inr && <Row l="Analyst Target (₹)" v={profile.analyst_target_inr.value} badge={profile.analyst_target_inr.source} />}
                  {profile?.['50day_ma_inr'] && <Row l="50D MA (₹)" v={profile['50day_ma_inr'].value} badge={profile['50day_ma_inr'].source} />}
                  {profile?.['200day_ma_inr'] && <Row l="200D MA (₹)" v={profile['200day_ma_inr'].value} badge={profile['200day_ma_inr'].source} />}
                </Section>

                {/* Ownership & Credit */}
                <Section title="Ownership & Credit Rating">
                  {selected.promoter_holding_pct != null && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: T.sub }}>Promoter</span>
                        <span style={{ fontWeight: 700, color: T.navy }}>{selected.promoter_holding_pct?.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: '#e5e7eb', display: 'flex', overflow: 'hidden', marginBottom: 8 }}>
                        <div title="Promoter" style={{ width: `${selected.promoter_holding_pct}%`, background: T.navy, transition: 'width .3s' }} />
                        <div title="FII" style={{ width: `${selected.fii_holding_pct}%`, background: T.blue }} />
                        <div title="DII" style={{ width: `${selected.dii_holding_pct}%`, background: T.teal }} />
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: T.sub, flexWrap: 'wrap' }}>
                        <span><span style={{ color: T.navy, fontWeight: 700 }}>■</span> Promoter {selected.promoter_holding_pct?.toFixed(1)}%</span>
                        <span><span style={{ color: T.blue, fontWeight: 700 }}>■</span> FII {selected.fii_holding_pct?.toFixed(1)}%</span>
                        <span><span style={{ color: T.teal, fontWeight: 700 }}>■</span> DII {selected.dii_holding_pct?.toFixed(1)}%</span>
                        <span style={{ color: T.sub }}>Public {(100 - (selected.promoter_holding_pct||0) - (selected.fii_holding_pct||0) - (selected.dii_holding_pct||0)).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                  {selected.credit_rating && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: '8px 10px',
                      background: '#f8f7f3', borderRadius: 6, border: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>Domestic Credit Rating</div>
                        <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>{selected.credit_rating_agency} · {selected.credit_outlook} Outlook</div>
                      </div>
                      <span style={{ fontSize: 22, fontWeight: 900,
                        color: selected.credit_rating === 'AAA' ? T.green : selected.credit_rating?.startsWith('AA') ? T.sage : T.amber }}>
                        {selected.credit_rating}
                      </span>
                    </div>
                  )}
                </Section>

                {/* ESG Scores */}
                <Section title="ESG Scores (EODHD)">
                  {(profile?.esg_total_score || profile?.esg_env_score || profile?.esg_social_score || profile?.esg_gov_score) ? (
                    <>
                      <EsgBar score={profile?.esg_env_score?.value} label="Environment Score" />
                      <EsgBar score={profile?.esg_social_score?.value} label="Social Score" />
                      <EsgBar score={profile?.esg_gov_score?.value} label="Governance Score" />
                      {profile?.esg_total_score && (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.border}` }}>
                          <EsgBar score={profile.esg_total_score.value} label="Total ESG Score" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: T.sub, fontStyle: 'italic' }}>
                      No ESG data — enrich to fetch from EODHD
                    </div>
                  )}
                </Section>

                {/* GHG / Climate */}
                <Section title={`GHG Emissions (${selected.ghg_reporting_year} · BRSR Core P6)`}>
                  <Row l="Scope 1" v={fmtCO2(selected.scope1_co2e)} vc={selected.scope1_co2e > 10e6 ? T.red : T.text} bold />
                  <Row l="Scope 2" v={fmtCO2(selected.scope2_co2e)} />
                  <Row l="Scope 3" v={selected.scope3_co2e > 0 ? fmtCO2(selected.scope3_co2e) : 'Not reported'} />
                  <Row l="Total S1+S2" v={fmtCO2((selected.scope1_co2e||0)+(selected.scope2_co2e||0))} bold />
                  <Row l="GHG Intensity" v={`${selected.ghg_intensity_tco2e_cr?.toFixed(2)} tCO₂e/₹Cr`} />
                  <Row l="Data Source" v={selected.ghg_source} />
                  <Row l="Physical Risk"   v={selected.physical_risk}   vc={RISK_COLOR[selected.physical_risk]} bold />
                  <Row l="Transition Risk" v={selected.transition_risk} vc={RISK_COLOR[selected.transition_risk]} bold />
                  {/* Net Zero / SBTi */}
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.border}` }}>
                    <Row l="SBTi Committed" v={selected.sbti_committed ? '✅ Yes' : '○ No'} vc={selected.sbti_committed ? T.green : T.sub} />
                    <Row l="Net Zero Target" v={selected.carbon_neutral_target_year ? `${selected.carbon_neutral_target_year}` : '—'} vc={selected.carbon_neutral_target_year ? T.teal : T.sub} />
                    {selected.installed_capacity_gw && <Row l="Installed Capacity" v={`${selected.installed_capacity_gw} GW`} />}
                    {selected.re_capacity_gw && <Row l="RE Capacity" v={`${selected.re_capacity_gw} GW`} vc={T.sage} />}
                  </div>
                </Section>

                {/* PCAF Defaults */}
                <Section title="PCAF Attribution Defaults">
                  <Row l="Default DQS" v={`${selected.dqs_default} — ${['','Verified GHG','Audited','Reported','Sector proxy','Least granular'][selected.dqs_default]}`} />
                  <Row l="Default Instrument" v={selected.instrument_default} />
                  <Row l="AF Formula" v={`Exposure ÷ EVIC (₹${(selected.evic_inr_cr/1000).toFixed(0)}K Cr)`} />
                  <Row l="Data Source" v={selected.ghg_source} />
                </Section>

                {/* Manual Data Entry */}
                <ManualDataEntry cin={cin} />

                {/* Data Completeness Meter */}
                <CompletenessMeter cin={cin} masterRecord={selected} profile={profile} />

                {/* Tags */}
                {selected.tags?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase',
                      letterSpacing: .5, marginBottom: 6 }}>Tags</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {selected.tags.map(t => (
                        <span key={t} style={{ fontSize: 10, fontWeight: 600, color: T.indigo,
                          background: `${T.indigo}12`, border: `1px solid ${T.indigo}33`,
                          borderRadius: 4, padding: '2px 7px' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Radar chart — risk profile */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase',
                    letterSpacing: .5, marginBottom: 8 }}>Risk Profile</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <RadarChart data={[
                      { axis: 'GHG Intensity', val: Math.min(10, selected.ghg_intensity_tco2e_cr / 140) },
                      { axis: 'Scope 1 Scale', val: Math.min(10, selected.scope1_co2e / 25000000) },
                      { axis: 'Transition Risk', val: { 'Very High':10,'High':8,'Medium':5,'Low':2,'Very Low':1 }[selected.transition_risk] || 3 },
                      { axis: 'Physical Risk', val: { 'Very High':10,'High':8,'Medium':5,'Low':2,'Very Low':1 }[selected.physical_risk] || 3 },
                      { axis: 'Debt Leverage', val: Math.min(10, (selected.total_debt_inr_cr||0) / (selected.evic_inr_cr||1) * 20) },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: T.sub }} />
                      <Radar dataKey="val" stroke={SECTOR_COLOR[selected.sector]||T.navy}
                        fill={SECTOR_COLOR[selected.sector]||T.navy} fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* GHG bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase',
                    letterSpacing: .5, marginBottom: 8 }}>Emissions Breakdown (tCO₂e)</div>
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart layout="vertical" data={[
                      { name: 'Scope 1', val: selected.scope1_co2e||0 },
                      { name: 'Scope 2', val: selected.scope2_co2e||0 },
                      { name: 'Scope 3', val: selected.scope3_co2e||0 },
                    ]}>
                      <XAxis type="number" tick={{fontSize:9}} tickFormatter={v => v>=1e6?`${(v/1e6).toFixed(0)}M`:v>=1000?`${(v/1000).toFixed(0)}K`:v} />
                      <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={46} />
                      <Tooltip formatter={v => [fmtCO2(v)]} />
                      <Bar dataKey="val" radius={[0,4,4,0]} fill={T.red} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Use in module actions */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase',
                    letterSpacing: .5, marginBottom: 8 }}>Use In Module</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: '📊 Portfolio Climate VaR', path: '/portfolio-climate-var', desc: 'Add as holding · EP-D7' },
                      { label: '🔥 Stranded Assets', path: '/stranded-assets', desc: 'Fossil fuel risk · EP-D1' },
                      { label: '💹 PCAF Calculator', path: '/pcaf-india-brsr', desc: 'Financed emissions · E138' },
                      { label: '📋 CSRD / iXBRL', path: '/csrd-ixbrl', desc: 'Set as entity · EP-D3' },
                    ].map(btn => (
                      <button key={btn.path} onClick={() => navigate(btn.path)}
                        style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8,
                          padding: '10px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: T.font }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{btn.label}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{btn.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Bottom: Sector overview bar chart ─────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>
          Aggregate Scope 1 by Sector (Registry Total, tCO₂e)
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={(() => {
            const map = {};
            COMPANY_MASTER.forEach(c => {
              if (!map[c.sector]) map[c.sector] = 0;
              map[c.sector] += c.scope1_co2e || 0;
            });
            return Object.entries(map)
              .sort((a,b) => b[1]-a[1])
              .map(([name,val]) => ({ name: name.split(' ')[0], val, fill: SECTOR_COLOR[name]||T.navy }));
          })()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis dataKey="name" tick={{fontSize:10}} />
            <YAxis tick={{fontSize:10}} tickFormatter={v => v>=1e6?`${(v/1e6).toFixed(0)}M`:v>=1e3?`${(v/1e3).toFixed(0)}K`:v} />
            <Tooltip formatter={v => [fmtCO2(v), 'Scope 1']} />
            <Bar dataKey="val" radius={[4,4,0,0]}>
              {COMPANY_MASTER
                .reduce((sectors, c) => { if (!sectors.find(s => s === c.sector)) sectors.push(c.sector); return sectors; }, [])
                .sort((a,b) => {
                  const sa = COMPANY_MASTER.filter(c => c.sector===a).reduce((s,c) => s+(c.scope1_co2e||0), 0);
                  const sb = COMPANY_MASTER.filter(c => c.sector===b).reduce((s,c) => s+(c.scope1_co2e||0), 0);
                  return sb-sa;
                })
                .map((sector, i) => <rect key={i} fill={SECTOR_COLOR[sector]||T.navy} />)
              }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
