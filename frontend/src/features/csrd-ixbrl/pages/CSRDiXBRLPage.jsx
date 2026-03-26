import React, { useState, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import DataUploadPanel from '../../../components/DataUploadPanel';
import { useTestData } from '../../../context/TestDataContext';

const API = 'http://localhost:8001';
const T = {
  bg: '#f6f4f0', navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  card: '#ffffff', border: '#e2ddd5', text: '#2c2c2c', sub: '#6b7280',
  red: '#dc2626', amber: '#d97706', green: '#16a34a', blue: '#2563eb', indigo: '#4f46e5',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const FRAMEWORKS = ['ESRS', 'GRI', 'ISSB', 'EU_TAXONOMY', 'BRSR'];
const FW_COLOR   = { ESRS: T.indigo, GRI: T.sage, ISSB: T.blue, EU_TAXONOMY: T.green, BRSR: T.amber };
const BASE_COVERAGE = { ESRS: 89, GRI: 74, ISSB: 68, EU_TAXONOMY: 61, BRSR: 55 };

const ESRS_STANDARDS = [
  { standard: 'ESRS 1',  name: 'General Requirements',  mapped: 78,  total: 82  },
  { standard: 'ESRS 2',  name: 'General Disclosures',   mapped: 112, total: 116 },
  { standard: 'ESRS E1', name: 'Climate Change',         mapped: 185, total: 198 },
  { standard: 'ESRS E2', name: 'Pollution',              mapped: 78,  total: 89  },
  { standard: 'ESRS E3', name: 'Water & Marine',         mapped: 64,  total: 76  },
  { standard: 'ESRS E4', name: 'Biodiversity',           mapped: 76,  total: 94  },
  { standard: 'ESRS E5', name: 'Circular Economy',       mapped: 55,  total: 68  },
  { standard: 'ESRS S1', name: 'Own Workforce',          mapped: 132, total: 148 },
  { standard: 'ESRS S2', name: 'Workers in Value Chain', mapped: 75,  total: 92  },
  { standard: 'ESRS S3', name: 'Affected Communities',   mapped: 58,  total: 72  },
  { standard: 'ESRS S4', name: 'Consumers',              mapped: 48,  total: 62  },
  { standard: 'ESRS G1', name: 'Business Conduct',       mapped: 50,  total: 54  },
];

const MULTI_FW = [
  { indicator: 'GHG Scope 1',          esrs: 'ESRS E1-6', gri: 'GRI 305-1', issb: 'IFRS S2-22a', eu_tax: 'Annex I',   brsr: 'P6 C1' },
  { indicator: 'GHG Scope 2',          esrs: 'ESRS E1-6', gri: 'GRI 305-2', issb: 'IFRS S2-22b', eu_tax: '—',         brsr: 'P6 C2' },
  { indicator: 'GHG Scope 3',          esrs: 'ESRS E1-6', gri: 'GRI 305-3', issb: 'IFRS S2-22c', eu_tax: '—',         brsr: 'P6 C3' },
  { indicator: 'Energy Consumption',   esrs: 'ESRS E1-5', gri: 'GRI 302-1', issb: 'IFRS S2-22',  eu_tax: 'Annex I',   brsr: 'P6 E1' },
  { indicator: 'Water Withdrawal',     esrs: 'ESRS E3-4', gri: 'GRI 303-3', issb: '—',           eu_tax: 'Annex III', brsr: 'P6 W1' },
  { indicator: 'Biodiversity Impact',  esrs: 'ESRS E4-6', gri: 'GRI 304-3', issb: '—',           eu_tax: 'Annex II',  brsr: 'P6 B1' },
  { indicator: 'TCFD Climate Strategy',esrs: 'ESRS 2-GOV',gri: 'GRI 201-2', issb: 'IFRS S2-10',  eu_tax: '—',         brsr: 'P1 L4' },
  { indicator: 'Carbon Price Internal',esrs: 'ESRS E1-7', gri: 'GRI 201-2', issb: 'IFRS S2-29',  eu_tax: '—',         brsr: '—'     },
];

const BADGE = (label, color) => !label || label === '—'
  ? <span style={{ color: T.sub }}>—</span>
  : <span style={{ fontSize: 9, fontWeight: 600, color, background: `${color}18`,
      border: `1px solid ${color}33`, borderRadius: 3, padding: '1px 5px' }}>{label}</span>;

const MANUAL_FIELDS = [
  { key: 'company_id',     label: 'Company ID / CIN',   type: 'text',   defaultValue: '' },
  { key: 'company_name',   label: 'Company Name',        type: 'text',   defaultValue: '' },
  { key: 'reporting_year', label: 'Reporting Year',      type: 'number', defaultValue: 2024 },
  { key: 'framework',      label: 'Primary Framework',   type: 'select', options: FRAMEWORKS, defaultValue: 'ESRS' },
  { key: 'scope1_co2e',    label: 'Scope 1 (tCO₂e)',    type: 'number', defaultValue: 0 },
  { key: 'scope2_co2e',    label: 'Scope 2 (tCO₂e)',    type: 'number', defaultValue: 0 },
  { key: 'scope3_co2e',    label: 'Scope 3 (tCO₂e)',    type: 'number', defaultValue: 0 },
  { key: 'energy_mwh',     label: 'Energy (MWh)',         type: 'number', defaultValue: 0 },
  { key: 'water_m3',       label: 'Water Withdrawal (m³)',type: 'number', defaultValue: 0 },
  { key: 'revenue_usd',    label: 'Revenue (USD)',         type: 'number', defaultValue: 0 },
];

export default function CSRDiXBRLPage() {
  const ctx = useTestData();
  const [framework, setFramework]       = useState(ctx.csrdFramework);
  const [companyId, setCompanyId]       = useState(ctx.csrdCompanyId);
  const [repYear, setRepYear]           = useState(ctx.csrdReportingYear);
  const [emissions, setEmissions]       = useState({ s1: 0, s2: 0, s3: 0, energy: 0, water: 0, revenue: 0 });
  const [threshold, setThreshold]       = useState(80);
  const [compareAll, setCompareAll]     = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [genResult, setGenResult]       = useState(null);
  const [inputOpen, setInputOpen]       = useState(false);
  const [ixbrlMode, setIxbrlMode]       = useState('preview');

  // Sync from context
  const linkedCINs = useMemo(() =>
    ctx.portfolioHoldings.filter(h => h.cin).map(h => ({ cin: h.cin, name: h.company_name })),
    [ctx.portfolioHoldings]
  );

  const handleDataParsed = (rows) => {
    const r = rows[0];
    if (!r) return;
    if (r.company_id) { setCompanyId(r.company_id); ctx.setCsrdCompanyId(r.company_id); }
    if (r.framework)  { setFramework(r.framework);  ctx.setCsrdFramework(r.framework);  }
    if (r.reporting_year) { setRepYear(Number(r.reporting_year)); ctx.setCsrdReportingYear(Number(r.reporting_year)); }
    setEmissions({
      s1: Number(r.scope1_co2e || 0), s2: Number(r.scope2_co2e || 0), s3: Number(r.scope3_co2e || 0),
      energy: Number(r.energy_mwh || 0), water: Number(r.water_m3 || 0), revenue: Number(r.revenue_usd || 0),
    });
  };

  const filledCount = [emissions.s1, emissions.s2, emissions.s3, emissions.energy, emissions.water].filter(v => v > 0).length;
  const factCount   = Math.round(1111 * (filledCount / 5));
  const totalGHG    = emissions.s1 + emissions.s2 + emissions.s3;
  const intensity   = emissions.revenue > 0 ? (totalGHG / (emissions.revenue / 1e6)).toFixed(1) : '—';

  // Coverage with data boost
  const coverage = Object.fromEntries(
    FRAMEWORKS.map(fw => [fw, Math.min(100, BASE_COVERAGE[fw] + filledCount * 2)])
  );

  const radarData = [
    { axis: 'ESRS',        ESRS: coverage.ESRS,        GRI: coverage.GRI,        ISSB: coverage.ISSB        },
    { axis: 'GRI',         ESRS: coverage.ESRS - 5,    GRI: coverage.GRI + 5,    ISSB: coverage.ISSB - 8   },
    { axis: 'ISSB',        ESRS: coverage.ESRS - 10,   GRI: coverage.GRI - 3,    ISSB: coverage.ISSB + 8   },
    { axis: 'EU Taxonomy', ESRS: coverage.EU_TAXONOMY,  GRI: coverage.EU_TAXONOMY - 5, ISSB: coverage.EU_TAXONOMY - 10 },
    { axis: 'BRSR',        ESRS: coverage.BRSR + 5,     GRI: coverage.BRSR + 10,  ISSB: coverage.BRSR        },
  ];

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await axios.post(`${API}/api/v1/csrd/generate-ixbrl`, {
        company_id: companyId, framework, reporting_year: repYear, emissions,
      });
      setGenResult({ ...r.data, source: 'api' });
    } catch {
      setGenResult({
        demo: true, company_id: companyId, framework, fact_count: factCount,
        coverage: coverage[framework], unmapped: ['ESRS S3-5', 'ESRS E4-7'],
        taxonomy_version: 'EFRAG ESRS XBRL 2024',
        ixbrl_preview: `<!-- iXBRL for ${companyId} / ${framework} / ${repYear} -->\n<html xmlns:esrs="http://esrs.eu/xbrl/2024">\n  <body>\n    <!-- ${factCount} facts tagged -->\n  </body>\n</html>`,
      });
    } finally { setGenerating(false); }
  };

  const coverageBarData = ESRS_STANDARDS.map(e => ({
    name: e.standard, mapped: e.mapped, gap: e.total - e.mapped,
    pct: Math.round(e.mapped / e.total * 100),
    belowThreshold: Math.round(e.mapped / e.total * 100) < threshold,
  }));

  const allFWResults = compareAll ? FRAMEWORKS.map(fw => ({
    fw, coverage: coverage[fw], facts: Math.round(factCount * coverage[fw] / 100),
  })) : null;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>CSRD / iXBRL Builder</h1>
          <p style={{ color: T.sub, fontSize: 12, margin: '4px 0 0' }}>
            Upload company metrics · Map to 5 frameworks · EFRAG ESRS XBRL 2024 · Coverage gap analysis · Synced CINs from Portfolio VaR · EP-D3
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {FRAMEWORKS.map(fw => (
            <button key={fw} onClick={() => { setFramework(fw); ctx.setCsrdFramework(fw); }} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: framework === fw ? (FW_COLOR[fw] || T.navy) : T.card,
              color: framework === fw ? '#fff' : T.sub,
              border: `1px solid ${framework === fw ? (FW_COLOR[fw] || T.navy) : T.border}`,
            }}>{fw}</button>
          ))}
          <button onClick={() => setCompareAll(!compareAll)} style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: compareAll ? T.navy : T.card, color: compareAll ? '#fff' : T.sub,
            border: `1px solid ${compareAll ? T.navy : T.border}`,
          }}>⇄ Compare All</button>
        </div>
      </div>

      {/* Regulatory Context Bar */}
      <div style={{
        background: `${T.navy}08`, border: `1px solid ${T.navy}20`,
        borderLeft: `3px solid ${T.indigo}`, borderRadius: 8,
        padding: '8px 16px', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 4 }}>REGULATORY BASIS</span>
          {[
            { label: 'CSRD Art.29 / ESRS E1 Mandatory', color: T.indigo },
            { label: 'SEBI BRSR Core NSE/BSE Top-1000', color: T.amber },
            { label: 'EFRAG ESRS XBRL Taxonomy 2024', color: T.blue },
            { label: 'GRI 2021 / ISSB S1-S2', color: T.sage },
          ].map(r => (
            <span key={r.label} style={{ fontSize: 10, fontWeight: 700, color: r.color,
              background: `${r.color}12`, border: `1px solid ${r.color}30`,
              borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>{r.label}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>METHOD</span>
          <span style={{ fontSize: 11, color: T.navy, fontWeight: 600 }}>Multi-Framework XBRL Tagging · 1,111 ESRS Datapoints</span>
          <span style={{ fontSize: 9, color: T.blue, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 3, padding: '1px 6px' }}>EFRAG 2024</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>PRIMARY USER</span>
          <span style={{ fontSize: 11, color: T.navy, fontWeight: 600, background: `${T.gold}22`, border: `1px solid ${T.gold}44`, borderRadius: 4, padding: '2px 8px' }}>Sustainability Reporting / External Auditor</span>
        </div>
      </div>

      {/* Analyst Workflow Steps */}
      <div style={{ display: 'flex', alignItems: 'stretch', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        {[
          { n: 1, title: 'Load Company Data', desc: 'Set CIN/ISIN + reporting year · enter GHG emissions, energy, water, revenue' },
          { n: 2, title: 'Select Framework', desc: 'Choose primary framework (ESRS mandatory for EU CSRD; BRSR for SEBI; GRI/ISSB optional)' },
          { n: 3, title: 'Validate Coverage', desc: 'Review ESRS standard gaps · check audit readiness panel · ≥80% required for limited assurance' },
          { n: 4, title: 'Generate & Submit', desc: 'Generate iXBRL file · submit to XBRL India / MCA portal or EFRAG validator' },
        ].map((s, i) => (
          <div key={s.n} style={{ flex: 1, padding: '10px 14px', borderRight: i < 3 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: T.indigo, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{s.title}</div>
                <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Input */}
      <DataUploadPanel
        isOpen={inputOpen}
        onToggle={() => setInputOpen(o => !o)}
        title={`Company Metrics Input — ${companyId || 'no company set'}`}
        manualFields={MANUAL_FIELDS}
        csvTemplate="company_id,company_name,reporting_year,framework,scope1_co2e,scope2_co2e,scope3_co2e,energy_mwh,water_m3,revenue_usd"
        onDataParsed={handleDataParsed}
        contextBanner={linkedCINs.length > 0
          ? `🔗 ${linkedCINs.length} company CINs available from Portfolio VaR: ${linkedCINs.slice(0,3).map(c=>c.name).join(', ')}${linkedCINs.length > 3 ? '…' : ''}`
          : null}
      />

      {/* Linked company selector */}
      {linkedCINs.length > 0 && (
        <div style={{ background: '#fffbeb', border: `1px solid #fde68a`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
          <strong>Portfolio companies — click to load:</strong>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {linkedCINs.map(c => (
              <button key={c.cin} onClick={() => { setCompanyId(c.cin); ctx.setCsrdCompanyId(c.cin); }} style={{
                padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                background: companyId === c.cin ? T.navy : T.card, color: companyId === c.cin ? '#fff' : T.navy,
                border: `1px solid ${companyId === c.cin ? T.navy : T.border}`, fontWeight: 600,
              }}>{c.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Company ID',           value: companyId.slice(0,10)+'…', sub: 'CIN / ISIN',        color: T.navy },
          { label: `${framework} Coverage`, value: `${coverage[framework]}%`,   sub: 'With uploaded data', color: FW_COLOR[framework] },
          { label: 'iXBRL Facts',           value: factCount,                   sub: `${filledCount}/5 metrics`, color: T.indigo },
          { label: 'Total GHG',             value: totalGHG > 0 ? `${(totalGHG/1000).toFixed(0)}ktCO₂` : '—', sub: 'Sc.1+2+3', color: T.red },
          { label: 'GHG Intensity',         value: intensity !== '—' ? `${intensity} t/$M` : '—', sub: 'tCO₂/$M revenue', color: T.amber },
          { label: 'Coverage Threshold',    value: `${threshold}%`,            sub: 'Min acceptable', color: T.sage },
        ].map((k, i) => (
          <div key={i} style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
            borderTop: `3px solid ${k.color}`, padding: '12px 14px',
            boxShadow: '0 1px 4px rgba(27,58,92,0.06)',
          }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.navy }}>{k.value}</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 3 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: T.sage, marginTop: 1 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Coverage Bar with threshold */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>ESRS Standard Coverage</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: T.sub }}>Threshold: <strong>{threshold}%</strong></span>
              <input type="range" min={50} max={100} step={5} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: 80, accentColor: T.red }} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={coverageBarData} margin={{ top: 4, right: 12, bottom: 28, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 10 }}
                formatter={(v, name) => [v, name === 'mapped' ? 'Mapped' : 'Gap']} />
              <Bar dataKey="mapped" stackId="a" name="mapped"
                fill={T.sage} radius={[0,0,0,0]} />
              <Bar dataKey="gap" stackId="a" name="gap"
                fill="#e5e7eb" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Framework Coverage Radar (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9 }} />
              <Radar name="ESRS" dataKey="ESRS" stroke={T.indigo} fill={T.indigo} fillOpacity={0.15} strokeWidth={1.5} />
              <Radar name="GRI"  dataKey="GRI"  stroke={T.sage}   fill={T.sage}   fillOpacity={0.12} strokeWidth={1.5} />
              <Radar name="ISSB" dataKey="ISSB" stroke={T.blue}   fill={T.blue}   fillOpacity={0.10} strokeWidth={1.5} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Emissions Calculator */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>
          Emissions Intensity Calculator
          <span style={{ fontSize: 11, fontWeight: 400, color: T.sub, marginLeft: 8 }}>Enter data below or upload via panel above</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 12 }}>
          {[
            { key: 's1', label: 'Scope 1 (tCO₂e)', val: emissions.s1 },
            { key: 's2', label: 'Scope 2 (tCO₂e)', val: emissions.s2 },
            { key: 's3', label: 'Scope 3 (tCO₂e)', val: emissions.s3 },
            { key: 'energy', label: 'Energy (MWh)', val: emissions.energy },
            { key: 'water', label: 'Water (m³)', val: emissions.water },
            { key: 'revenue', label: 'Revenue (USD)', val: emissions.revenue },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 10, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 3 }}>{f.label}</label>
              <input type="number" value={f.val || ''} placeholder="0"
                onChange={e => setEmissions(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                style={{ width: '100%', padding: '7px 8px', borderRadius: 6, border: `1px solid ${T.border}`,
                  fontSize: 12, color: T.navy, background: T.bg, fontFamily: T.font, boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>
        {totalGHG > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Total GHG', value: `${(totalGHG/1000).toFixed(1)} ktCO₂e` },
              { label: 'GHG Intensity', value: `${intensity} tCO₂/$M revenue` },
              { label: 'Scope 3 Share', value: `${((emissions.s3/totalGHG)*100).toFixed(0)}%` },
              { label: 'iXBRL Facts Est.', value: `~${factCount} facts` },
            ].map(s => (
              <div key={s.label} style={{ padding: '10px 14px', borderRadius: 8, background: T.bg,
                border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.gold}` }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{s.value}</div>
                <div style={{ fontSize: 10, color: T.sub }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Framework Cross-Reference */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
            Multi-Framework Cross-Reference — active: <span style={{ color: FW_COLOR[framework] }}>{framework}</span>
          </div>
          <button onClick={() => {
            const csv = ['Indicator,ESRS,GRI,ISSB,EU_Taxonomy,BRSR',
              ...MULTI_FW.map(r => [r.indicator, r.esrs, r.gri, r.issb, r.eu_tax, r.brsr].join(','))
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const lnk = document.createElement('a');
            lnk.href = URL.createObjectURL(blob);
            lnk.download = `csrd_framework_crosswalk_${new Date().toISOString().slice(0,10)}.csv`;
            lnk.click();
          }} style={{
            padding: '6px 14px', background: T.card, color: T.navy,
            border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>↓ Export Crosswalk CSV</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f8f7f4' }}>
              {['Indicator','ESRS','GRI','ISSB','EU Taxonomy','BRSR'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, fontWeight: 600,
                  color: FRAMEWORKS.includes(h.replace(' ','_')) ? T.navy : T.sub,
                  borderBottom: `1px solid ${T.border}`,
                  background: h === framework ? `${FW_COLOR[h] || T.navy}12` : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MULTI_FW.map((row, i) => (
              <tr key={row.indicator} style={{ background: i%2===0?'#fff':'#fafaf8', borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{row.indicator}</td>
                <td style={{ padding: '7px 10px' }}>{BADGE(row.esrs,  FW_COLOR.ESRS)}</td>
                <td style={{ padding: '7px 10px' }}>{BADGE(row.gri,   FW_COLOR.GRI)}</td>
                <td style={{ padding: '7px 10px' }}>{BADGE(row.issb,  FW_COLOR.ISSB)}</td>
                <td style={{ padding: '7px 10px' }}>{BADGE(row.eu_tax, FW_COLOR.EU_TAXONOMY)}</td>
                <td style={{ padding: '7px 10px' }}>{BADGE(row.brsr,  FW_COLOR.BRSR)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compare All */}
      {compareAll && allFWResults && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>All Frameworks Coverage</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {allFWResults.map(r => (
              <div key={r.fw} style={{ padding: '14px 16px', borderRadius: 10,
                border: `2px solid ${FW_COLOR[r.fw]}`,
                background: `${FW_COLOR[r.fw]}08` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: FW_COLOR[r.fw] }}>{r.coverage}%</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginTop: 4 }}>{r.fw}</div>
                <div style={{ fontSize: 11, color: T.sub }}>~{r.facts} iXBRL facts</div>
                <div style={{ marginTop: 8, height: 6, background: '#e5e7eb', borderRadius: 3 }}>
                  <div style={{ width: `${r.coverage}%`, height: '100%', borderRadius: 3, background: FW_COLOR[r.fw] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Readiness Pre-Flight */}
      {(() => {
        const missingMandatory = (!companyId || companyId === 'L17110MH1973PLC019786') || emissions.s1 <= 0 || emissions.s2 <= 0;
        return null; // rendered below
      })()}
      <div style={{ background: T.card, borderRadius: 10, padding: '12px 16px', marginBottom: 14,
        border: `1px solid ${(!companyId || companyId === 'L17110MH1973PLC019786' || emissions.s1 <= 0 || emissions.s2 <= 0) ? T.amber : T.border}`,
        borderLeft: `3px solid ${(!companyId || companyId === 'L17110MH1973PLC019786' || emissions.s1 <= 0 || emissions.s2 <= 0) ? T.amber : T.sage}`,
      }}>
        {(() => {
          const checks = [
            { label: 'Company ID set (not demo default)', pass: !!companyId && companyId !== 'L17110MH1973PLC019786', mandatory: true },
            { label: 'Scope 1 GHG — ESRS E1-6 (mandatory under CSRD Art.29)', pass: emissions.s1 > 0, mandatory: true },
            { label: 'Scope 2 GHG — ESRS E1-6 (mandatory under CSRD Art.29)', pass: emissions.s2 > 0, mandatory: true },
            { label: 'Scope 3 GHG — ESRS E1-6 (encouraged, material if >40% of total)', pass: emissions.s3 > 0, mandatory: false },
            { label: 'Energy consumption — ESRS E1-5', pass: emissions.energy > 0, mandatory: false },
            { label: 'Revenue for intensity calculation', pass: emissions.revenue > 0, mandatory: false },
          ];
          const mandatoryFails = checks.filter(c => c.mandatory && !c.pass).length;
          return (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                Pre-Generation Audit Readiness Checklist
                {mandatoryFails > 0
                  ? <span style={{ fontSize: 11, color: T.amber, fontWeight: 400 }}>⚠ {mandatoryFails} mandatory field{mandatoryFails > 1 ? 's' : ''} missing — generation will produce incomplete iXBRL</span>
                  : <span style={{ fontSize: 11, color: T.sage, fontWeight: 400 }}>✓ All mandatory fields present — ready for limited assurance review</span>
                }
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {checks.map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11 }}>
                    <span style={{ color: c.pass ? T.sage : c.mandatory ? T.amber : T.sub, fontSize: 13, flexShrink: 0 }}>
                      {c.pass ? '✓' : c.mandatory ? '!' : '○'}
                    </span>
                    <span style={{ color: c.pass ? T.text : c.mandatory ? T.amber : T.sub, lineHeight: 1.4 }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* iXBRL Generator */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>iXBRL Report Generator</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
              {companyId} · {framework} · {repYear} · EFRAG ESRS XBRL 2024
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['preview','full'].map(m => (
                <button key={m} onClick={() => setIxbrlMode(m)} style={{
                  padding: '5px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: ixbrlMode === m ? T.navy : T.card, color: ixbrlMode === m ? '#fff' : T.sub,
                  border: `1px solid ${ixbrlMode === m ? T.navy : T.border}`,
                }}>{m === 'preview' ? 'Preview' : 'Full iXBRL'}</button>
              ))}
            </div>
            <button onClick={generate} disabled={generating} style={{
              padding: '8px 18px', background: FW_COLOR[framework] || T.navy, color: '#fff',
              border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700,
              cursor: generating ? 'wait' : 'pointer', opacity: generating ? 0.7 : 1,
            }}>{generating ? 'Generating…' : `Generate ${framework} →`}</button>
          </div>
        </div>

        {genResult && (
          <div style={{ padding: '12px 14px', borderRadius: 8,
            background: genResult.demo ? '#fffbeb' : '#f0fdf4',
            border: `1px solid ${genResult.demo ? '#fde68a' : '#bbf7d0'}`, fontSize: 12 }}>
            {genResult.demo && <div style={{ color: T.amber, fontWeight: 600, marginBottom: 8 }}>Demo mode — API unavailable</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: ixbrlMode === 'full' ? 12 : 0 }}>
              {[
                ['iXBRL Facts', genResult.fact_count],
                ['Coverage', `${genResult.coverage || coverage[framework]}%`],
                ['Framework', genResult.framework],
                ['Taxonomy', genResult.taxonomy_version || 'EFRAG ESRS XBRL 2024'],
              ].map(([k,v]) => (
                <div key={k} style={{ padding: '8px 12px', background: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{v}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{k}</div>
                </div>
              ))}
            </div>
            {ixbrlMode === 'full' && genResult.ixbrl_preview && (
              <pre style={{ fontSize: 10, background: '#1e293b', color: '#7dd3fc', padding: 12,
                borderRadius: 8, overflow: 'auto', maxHeight: 180, margin: 0 }}>
                {genResult.ixbrl_preview}
              </pre>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: T.sub, marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
        EFRAG ESRS XBRL 2024 · 5 frameworks · 1,251 datapoints · CINs synced from Portfolio VaR · dme_esrs_xbrl_taxonomy · EP-D3
      </div>
    </div>
  );
}
