import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8',
  borderL: '#d5cfc5', navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a',
  goldL: '#d4be8a', sage: '#5a8a6a', sageL: '#7ba67d', teal: '#5a8a6a',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae', red: '#dc2626',
  green: '#16a34a', amber: '#d97706', blue: '#2563eb', orange: '#ea580c',
  purple: '#7c3aed', font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

function sr(s) { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); }

const SIGNALS = [
  { key: 'vagueness', label: 'Vagueness Index', short: 'Vagueness', reg: 'EU Green Claims Dir. Art.3(1)', threshold: 55 },
  { key: 'selective', label: 'Selective Disclosure', short: 'Sel. Disclosure', reg: 'ESMA ESG § 4.2.1', threshold: 50 },
  { key: 'unverifiable', label: 'Unverifiable Claims', short: 'Unverifiable', reg: 'FCA SDR COBS 4.13.2', threshold: 60 },
  { key: 'mismatch', label: 'Claim-Data Mismatch', short: 'Mismatch', reg: 'EU Green Claims Dir. Art.5', threshold: 45 },
  { key: 'framing', label: 'Positive Framing Diversion', short: 'Framing', reg: 'ASA Green Claims Code §2.4', threshold: 50 },
  { key: 'regulatory', label: 'Regulatory Breach Risk', short: 'Reg. Breach', reg: 'ESMA ESG § 5.1 / FCA SDR', threshold: 40 },
  { key: 'weakening', label: 'Target Weakening Signal', short: 'Tgt. Weakening', reg: 'ESMA ESG § 4.3 / SBTi', threshold: 35 },
];

const SECTORS = ['Energy', 'Financial', 'Industrial', 'Tech', 'Consumer', 'Real Estate'];

const COMPANIES_RAW = [
  { id: 0, name: 'PetroChem Global', ticker: 'PCG', sector: 'Energy', esgRating: 52 },
  { id: 1, name: 'GreenFuture Energy', ticker: 'GFE', sector: 'Energy', esgRating: 78 },
  { id: 2, name: 'Apex Industrial', ticker: 'AIX', sector: 'Industrial', esgRating: 61 },
  { id: 3, name: 'EcoBank Holdings', ticker: 'EBH', sector: 'Financial', esgRating: 74 },
  { id: 4, name: 'SustainTech Corp', ticker: 'STC', sector: 'Tech', esgRating: 83 },
  { id: 5, name: 'Nordic Consumer AG', ticker: 'NCA', sector: 'Consumer', esgRating: 69 },
  { id: 6, name: 'Meridian Real Est.', ticker: 'MRE', sector: 'Real Estate', esgRating: 58 },
  { id: 7, name: 'CleanPower Intl', ticker: 'CPI', sector: 'Energy', esgRating: 81 },
  { id: 8, name: 'GlobalBank PLC', ticker: 'GBP', sector: 'Financial', esgRating: 56 },
  { id: 9, name: 'Horizons Industrial', ticker: 'HZI', sector: 'Industrial', esgRating: 65 },
  { id: 10, name: 'VerdeTech Inc', ticker: 'VTI', sector: 'Tech', esgRating: 88 },
  { id: 11, name: 'Lifestyle Brands Co', ticker: 'LBC', sector: 'Consumer', esgRating: 47 },
  { id: 12, name: 'Urban Spaces REIT', ticker: 'USR', sector: 'Real Estate', esgRating: 63 },
  { id: 13, name: 'Cascade Finance', ticker: 'CFN', sector: 'Financial', esgRating: 71 },
  { id: 14, name: 'Atlas Energy Group', ticker: 'AEG', sector: 'Energy', esgRating: 44 },
];

function buildCompanyData(raw) {
  const seed = raw.id * 100;
  const scores = {
    vagueness: Math.round(20 + sr(seed + 1) * 70),
    selective: Math.round(15 + sr(seed + 2) * 75),
    unverifiable: Math.round(10 + sr(seed + 3) * 80),
    mismatch: Math.round(5 + sr(seed + 4) * 85),
    framing: Math.round(15 + sr(seed + 5) * 70),
    regulatory: Math.round(10 + sr(seed + 6) * 65),
    weakening: Math.round(5 + sr(seed + 7) * 60),
  };
  const composite = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 7);
  const prevComposite = Math.round(composite + (sr(seed + 8) - 0.5) * 20);
  const tier = composite >= 70 ? 'Critical' : composite >= 55 ? 'High' : composite >= 35 ? 'Medium' : 'Low';
  return { ...raw, ...scores, composite, prevComposite, tier };
}

const COMPANIES = COMPANIES_RAW.map(buildCompanyData);

const EVIDENCE_MAP = {
  vagueness: [
    { snippet: '"We are committed to a greener, more sustainable future for all stakeholders."', page: '12', type: 'Weasel phrasing', severity: 'High' },
    { snippet: '"Our eco-friendly product range reflects our responsibility to the planet."', page: '34', type: 'Unquantified claim', severity: 'High' },
    { snippet: '"Sustainability is at the core of everything we do."', page: '5', type: 'Aspirational without metric', severity: 'Medium' },
  ],
  selective: [
    { snippet: 'Scope 1 & 2 emissions disclosed (142 ktCO₂e) — Scope 3 value chain emissions absent.', page: '28', type: 'Scope 3 omission', severity: 'Critical' },
    { snippet: 'Intensity metric (tCO₂/revenue) improved 12% — absolute emissions rose 8% YoY.', page: '41', type: 'Absolute vs intensity gap', severity: 'High' },
    { snippet: 'Land use disclosed at 24,000 ha — biodiversity impact assessment not provided.', page: '55', type: 'Biodiversity omission', severity: 'High' },
  ],
  unverifiable: [
    { snippet: '"We will achieve net zero by 2050." — No interim 2030 milestone disclosed.', page: '7', type: 'Milestone absence', severity: 'High' },
    { snippet: 'Net zero commitment not subject to third-party assurance or SBTi validation.', page: '9', type: 'No assurance', severity: 'Critical' },
    { snippet: '"Carbon neutral supply chain by 2040" — methodology and boundary undefined.', page: '22', type: 'Boundary undefined', severity: 'High' },
  ],
  mismatch: [
    { snippet: '"Scope 1 emissions reduced 20% through operational efficiency." Scope 1 data: +5.3% YoY.', page: '31', type: 'Narrative vs data conflict', severity: 'Critical' },
    { snippet: '"Water stewardship improvements delivered." Water withdrawal intensity up 11%.', page: '47', type: 'Metric inconsistency', severity: 'High' },
    { snippet: '"Waste-to-landfill reduced significantly." Absolute landfill tonnage +3% YoY.', page: '53', type: 'Direction contradiction', severity: 'High' },
  ],
  framing: [
    { snippet: 'Renewable energy share (34%) prominently featured — absolute GHG emissions page 2 vs pg 1.', page: '2', type: 'Strategic ordering', severity: 'Medium' },
    { snippet: 'Social initiatives given 40% of ESG report space; carbon performance 6%.', page: 'Various', type: 'Topic weighting diversion', severity: 'High' },
    { snippet: '"Solar installations up 300% YoY" — baselined from near-zero in 2021.', page: '19', type: 'Low base effect', severity: 'Medium' },
  ],
  regulatory: [
    { snippet: 'Product labelled "sustainable" without substantiation per EU Green Claims Dir. Art.3(1).', page: '66', type: 'Unsubstantiated label', severity: 'Critical' },
    { snippet: 'ESG fund name includes "Green" without SFDR Art.9 alignment — ESMA §4.1 risk.', page: 'Fund Docs', type: 'Naming guideline breach', severity: 'Critical' },
    { snippet: 'UK SDR sustainability label criteria not met — FCA COBS 4.13 potential breach.', page: 'Prospectus', type: 'SDR labelling risk', severity: 'High' },
  ],
  weakening: [
    { snippet: '2030 target revised: from 50% absolute reduction to 50% intensity reduction in 2024 restatement.', page: '14', type: 'Scope reduction', severity: 'Critical' },
    { snippet: 'Base year shifted from 2019 to 2021 — removes pandemic-era emission reductions.', page: '16', type: 'Base year restatement', severity: 'High' },
    { snippet: 'Net zero date extended from 2040 to 2050 citing "operational constraints".', page: '8', type: 'Timeline extension', severity: 'High' },
  ],
};

const REGULATIONS = [
  { name: 'EU Green Claims Directive', short: 'EU GCD', year: '2023/2441', signals: ['vagueness', 'mismatch', 'regulatory'], article: 'Art. 3, 5, 7' },
  { name: 'ESMA ESG Naming Guidelines', short: 'ESMA ESG', year: '2024', signals: ['selective', 'weakening', 'regulatory'], article: '§ 4.1, 4.2, 5.1' },
  { name: 'FCA SDR', short: 'FCA SDR', year: '2023', signals: ['unverifiable', 'framing', 'regulatory'], article: 'COBS 4.13' },
  { name: 'ASA Green Claims Code', short: 'ASA', year: '2021', signals: ['vagueness', 'framing'], article: '§ 2.4, 3.1' },
  { name: 'SEC Climate Disclosure', short: 'SEC', year: '2024', signals: ['selective', 'mismatch'], article: 'Rule 14a-21' },
  { name: 'ASIC Greenwashing Guidance', short: 'ASIC', year: '2022', signals: ['unverifiable', 'vagueness'], article: 'RG 65, INFO 271' },
  { name: 'CMA Green Claims Code', short: 'CMA', year: '2021', signals: ['vagueness', 'framing', 'mismatch'], article: 'Principles 1–6' },
];

const ENFORCEMENT_ACTIONS = [
  { entity: 'Deutsche Finance Asset Mgmt', jurisdiction: 'BaFin / ESMA', year: 2023, action: 'ESG fund mislabelling — Art.9 downgrade', fine: '€4.2M', severity: 'Critical' },
  { entity: 'Consumer Goods Corp PLC', jurisdiction: 'ASA (UK)', year: 2024, action: '"100% sustainable" product claim withdrawn', fine: 'Advertising ban', severity: 'High' },
  { entity: 'NordicOil Energy AB', jurisdiction: 'FCA (UK)', year: 2024, action: 'Net zero claim without assurance — SDR breach', fine: '£1.8M', severity: 'Critical' },
  { entity: 'GreenGrowth Fund SA', jurisdiction: 'AMF (France)', year: 2023, action: 'SFDR PAI omissions — selective disclosure', fine: '€2.1M', severity: 'High' },
  { entity: 'Apex Retail Holdings', jurisdiction: 'CMA (UK)', year: 2022, action: '"Eco-friendly" labelling without evidence', fine: '£0.9M', severity: 'Medium' },
  { entity: 'Pacific Carbon Markets', jurisdiction: 'ASIC (AU)', year: 2024, action: 'Unverifiable offset claims — INFO 271', fine: 'A$3.4M', severity: 'Critical' },
];

const REMEDIATION_ACTIONS = [
  {
    signal: 'vagueness', priority: 'Critical',
    problem: 'Environmental claims lack quantification — "sustainable", "eco-friendly" used without metrics.',
    deadline: 'EU GCD enforcement: 2026-Q1',
    improvement: 'Replace every qualitative claim with a specific metric, unit, and time boundary.',
    example: '"Scope 1+2 emissions reduced 18.4% absolute vs 2020 baseline, verified by Bureau Veritas (ISO 14064-3)."',
  },
  {
    signal: 'selective', priority: 'Critical',
    problem: 'Scope 3 omitted despite Scope 1/2 disclosure; absolute emissions masked by intensity metrics.',
    deadline: 'CSRD ESRS E1 applicable from FY2025',
    improvement: 'Disclose full GHG inventory (Scope 1, 2, 3 by category) alongside intensity metrics.',
    example: '"Scope 3 Category 11 (use of sold products) accounts for 73% of total footprint: 1,240 ktCO₂e (2024)."',
  },
  {
    signal: 'unverifiable', priority: 'High',
    problem: 'Net zero commitments lack interim milestones and third-party validation.',
    deadline: 'FCA SDR: ongoing; SBTi validation recommended by 2025',
    improvement: 'Publish 5-year interim milestones with SBTi or SBTN validation and annual assurance.',
    example: '"2025 target: 35% absolute Scope 1+2 reduction vs 2020. Third-party assured: KPMG (ISAE 3410, 2025)."',
  },
  {
    signal: 'mismatch', priority: 'Critical',
    problem: 'Narrative claims contradict quantitative data — Scope 1 reported as declining while actually rising.',
    deadline: 'EU GCD Art.5: substantiation required at point of claim',
    improvement: 'Reconcile all narrative statements against reported data before publication.',
    example: '"Scope 1 emissions: 142 ktCO₂e (+5.3% YoY). Increase driven by expanded operations; intensity improved 2.1%."',
  },
  {
    signal: 'framing', priority: 'High',
    problem: 'Positive metrics positioned prominently; negative performance buried in appendices.',
    deadline: 'ASA Green Claims Code §2.4: balanced presentation',
    improvement: 'Follow GRI 1 materiality principle — present material negative performance prominently.',
    example: '"Total GHG footprint increased 3.2% to 890 ktCO₂e in 2024. Renewable energy share: 34% (+8pp)."',
  },
];

const CHECKLIST_ITEMS = [
  { item: 'All environmental claims quantified with specific metrics', signals: ['vagueness'] },
  { item: 'Scope 1 emissions disclosed with boundary definition', signals: ['selective'] },
  { item: 'Scope 2 (market + location-based) disclosed', signals: ['selective'] },
  { item: 'Scope 3 material categories identified and quantified', signals: ['selective'] },
  { item: 'Absolute and intensity metrics both reported', signals: ['selective'] },
  { item: 'Net zero / climate target subject to SBTi or equivalent validation', signals: ['unverifiable'] },
  { item: '2025 and 2030 interim milestones published', signals: ['unverifiable'] },
  { item: 'Third-party assurance obtained (ISAE 3410 / ISO 14064-3)', signals: ['unverifiable'] },
  { item: 'Narrative claims cross-checked against quantitative data', signals: ['mismatch'] },
  { item: 'Material negative performance disclosed in executive summary', signals: ['framing'] },
  { item: 'Biodiversity impact assessed for land-use operations', signals: ['selective'] },
  { item: 'Product sustainability claims substantiated per EU GCD Art.3', signals: ['vagueness', 'regulatory'] },
  { item: 'ESG fund naming compliant with ESMA §4.1 guidelines', signals: ['regulatory'] },
  { item: 'UK SDR sustainability label criteria satisfied', signals: ['regulatory'] },
  { item: 'Base year emissions restated per GHG Protocol if boundary changed', signals: ['weakening'] },
  { item: 'Target scope not narrowed without disclosed rationale', signals: ['weakening'] },
  { item: 'Supply chain (Scope 3) net zero pathway documented', signals: ['weakening'] },
  { item: 'Water withdrawal absolute data disclosed alongside intensity', signals: ['selective'] },
  { item: 'Forward-looking statements include risk / uncertainty language', signals: ['unverifiable'] },
  { item: 'Offset quality: registry, vintage, additionality all disclosed', signals: ['unverifiable', 'mismatch'] },
];

const tierColor = (tier) => {
  if (tier === 'Critical') return T.red;
  if (tier === 'High') return T.orange;
  if (tier === 'Medium') return T.amber;
  return T.green;
};

const scoreColor = (score) => {
  if (score >= 70) return T.red;
  if (score >= 55) return T.orange;
  if (score >= 35) return T.amber;
  return T.green;
};

export default function GreenwashingDetectionPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState(0);
  const [expandedSignal, setExpandedSignal] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [reportModal, setReportModal] = useState(false);

  const TABS = ['GW Radar Dashboard', 'Signal Deep Dive', 'Regulatory Risk Mapper', 'Sector Benchmark', 'Remediation Playbook'];

  const company = useMemo(() => COMPANIES[selectedCompany], [selectedCompany]);

  const sectorAvg = useMemo(() => {
    const peers = COMPANIES.filter(c => c.sector === company.sector);
    const avg = {};
    SIGNALS.forEach(s => {
      avg[s.key] = Math.round(peers.reduce((a, c) => a + c[s.key], 0) / peers.length);
    });
    return avg;
  }, [company]);

  const radarData = useMemo(() => SIGNALS.map(s => ({
    subject: s.short,
    Company: company[s.key],
    'Sector Avg': sectorAvg[s.key],
    fullMark: 100,
  })), [company, sectorAvg]);

  const topSignals = useMemo(() => {
    return [...SIGNALS].sort((a, b) => company[b.key] - company[a.key]).slice(0, 3);
  }, [company]);

  const rankedCompanies = useMemo(() => [...COMPANIES].sort((a, b) => b.composite - a.composite), []);

  const sectorBoxData = useMemo(() => SECTORS.map(sector => {
    const cos = COMPANIES.filter(c => c.sector === sector);
    const scores = cos.map(c => c.composite).sort((a, b) => a - b);
    const min = scores[0], max = scores[scores.length - 1];
    const mid = scores[Math.floor(scores.length / 2)];
    const q1 = scores[Math.floor(scores.length / 4)];
    const q3 = scores[Math.floor(3 * scores.length / 4)];
    return { sector, min, max, mid, q1, q3, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) };
  }), []);

  const signalOverlayData = useMemo(() => SIGNALS.map(s => {
    const entry = { signal: s.short };
    COMPANIES.forEach(c => { entry[c.ticker] = c[s.key]; });
    return entry;
  }), []);

  const checklistStatus = useMemo(() => {
    return CHECKLIST_ITEMS.map((item, i) => {
      const sigScore = item.signals.reduce((a, sig) => a + company[sig], 0) / item.signals.length;
      const status = sigScore < 35 ? 'pass' : sigScore < 60 ? 'partial' : 'fail';
      return { ...item, status };
    });
  }, [company]);

  const passCount = checklistStatus.filter(c => c.status === 'pass').length;
  const failCount = checklistStatus.filter(c => c.status === 'fail').length;

  const s = { fontFamily: T.font };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      {/* Gold accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${T.gold}, ${T.goldL}, ${T.gold})` }} />

      {/* Header */}
      <div style={{ background: T.navy, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2, marginBottom: 4 }}>
            RISK ANALYTICS / COMPLIANCE / EP-BY2
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>
            Greenwashing Detection Engine
          </div>
          <div style={{ fontSize: 12, color: T.textMut, marginTop: 2 }}>
            7-Signal Model · EU Green Claims Dir. 2023/2441 · ESMA ESG · FCA SDR
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.goldL }}>CORPUS: 15 COMPANIES</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut, marginTop: 2 }}>SIGNALS: 7 · REGS: 7</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', paddingLeft: 32 }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '12px 20px', fontSize: 13, fontWeight: activeTab === i ? 700 : 400,
            color: activeTab === i ? T.navy : T.textSec, background: 'none', border: 'none',
            borderBottom: activeTab === i ? `2px solid ${T.gold}` : '2px solid transparent',
            cursor: 'pointer', fontFamily: T.font, whiteSpace: 'nowrap',
          }}>{tab}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* TAB 0: GW Radar Dashboard */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: T.textSec, fontWeight: 600 }}>Company:</label>
              <select value={selectedCompany} onChange={e => setSelectedCompany(+e.target.value)}
                style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 13, background: T.surface, color: T.text }}>
                {COMPANIES.map((c, i) => <option key={i} value={i}>{c.name} ({c.ticker}) — {c.sector}</option>)}
              </select>
              <div style={{ padding: '6px 14px', borderRadius: 20, background: tierColor(company.tier), color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                {company.tier.toUpperCase()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Radar Chart */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>7-Signal Greenwashing Radar</div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{company.name} vs Sector Average ({company.sector})</div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.borderL} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.font }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
                    <Radar name="Company" dataKey="Company" stroke={T.red} fill={T.red} fillOpacity={0.25} strokeWidth={2} />
                    <Radar name="Sector Avg" dataKey="Sector Avg" stroke={T.navy} fill={T.navy} fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Net Credibility & Top Signals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Net Credibility Score</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 52, fontWeight: 800, fontFamily: T.mono, color: scoreColor(company.composite) }}>
                      {100 - company.composite}
                    </span>
                    <span style={{ fontSize: 16, color: T.textSec }}>/100</span>
                  </div>
                  <div style={{ height: 8, background: T.surfaceH, borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${100 - company.composite}%`, background: scoreColor(company.composite), borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 6 }}>
                    Composite GW Score: {company.composite} | Prev: {company.prevComposite} ({company.composite - company.prevComposite > 0 ? '+' : ''}{company.composite - company.prevComposite})
                  </div>
                </div>

                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: T.navy }}>Top 3 Risk Signals</div>
                  {topSignals.map((s, i) => (
                    <div key={s.key} style={{ marginBottom: 12, padding: '10px 12px', background: T.surfaceH, borderRadius: 8, borderLeft: `3px solid ${scoreColor(company[s.key])}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
                        <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: scoreColor(company[s.key]) }}>{company[s.key]}</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Reg: {s.reg}</div>
                      <div style={{ fontSize: 11, color: T.textMut, fontStyle: 'italic' }}>
                        "{EVIDENCE_MAP[s.key][0].snippet.slice(0, 80)}..."
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick-scan table */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>All Companies — GW Score Ranking</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['#', 'Company', 'Ticker', 'Sector', 'Composite', 'Tier', 'Signal Bar', 'ESG Rating'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rankedCompanies.map((c, idx) => (
                      <tr key={c.id} onClick={() => setSelectedCompany(c.id)}
                        style={{ cursor: 'pointer', background: c.id === selectedCompany ? '#f0ede7' : 'transparent', borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding: '8px 12px', fontFamily: T.mono, color: T.textMut }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '8px 12px', fontFamily: T.mono, color: T.textSec }}>{c.ticker}</td>
                        <td style={{ padding: '8px 12px', color: T.textSec }}>{c.sector}</td>
                        <td style={{ padding: '8px 12px', fontFamily: T.mono, fontWeight: 700, color: scoreColor(c.composite) }}>{c.composite}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 10, background: tierColor(c.tier), color: '#fff', fontSize: 10, fontWeight: 700 }}>{c.tier}</span>
                        </td>
                        <td style={{ padding: '8px 12px', minWidth: 100 }}>
                          <div style={{ height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${c.composite}%`, background: scoreColor(c.composite), borderRadius: 3 }} />
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: T.mono, color: T.sage }}>{c.esgRating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Signal Deep Dive */}
        {activeTab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={selectedCompany} onChange={e => setSelectedCompany(+e.target.value)}
                style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 13, background: T.surface, color: T.text }}>
                {COMPANIES.map((c, i) => <option key={i} value={i}>{c.name} ({c.ticker})</option>)}
              </select>
              <button onClick={() => setShowOverlay(!showOverlay)} style={{
                padding: '8px 16px', borderRadius: 6, border: `1px solid ${T.border}`,
                background: showOverlay ? T.navy : T.surface, color: showOverlay ? '#fff' : T.text,
                cursor: 'pointer', fontSize: 13, fontFamily: T.font, fontWeight: 600,
              }}>
                {showOverlay ? 'Hide' : 'Show'} All Companies Overlay
              </button>
            </div>

            {showOverlay && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>All Companies by Signal (Stacked)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={signalOverlayData} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="signal" tick={{ fontSize: 11, fontFamily: T.font }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 11 }} />
                    {COMPANIES.map((c, i) => (
                      <Bar key={c.ticker} dataKey={c.ticker} fill={`hsl(${(i * 23) % 360},55%,48%)`} stackId="a" />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {SIGNALS.map(sig => {
              const score = company[sig.key];
              const isExpanded = expandedSignal === sig.key;
              return (
                <div key={sig.key} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 12 }}>
                  <div onClick={() => setExpandedSignal(isExpanded ? null : sig.key)}
                    style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{sig.label}</div>
                      <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Regulatory basis: {sig.reg}</div>
                    </div>
                    <div style={{ minWidth: 160 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: T.textMut }}>Score</span>
                        <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: scoreColor(score) }}>{score}/100</span>
                      </div>
                      <div style={{ height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden', width: 160 }}>
                        <div style={{ height: '100%', width: `${score}%`, background: scoreColor(score), borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>Threshold: {sig.threshold} | {score > sig.threshold ? '⚠ Above' : '✓ Below'}</div>
                    </div>
                    <div style={{ fontSize: 16, color: T.textSec }}>{isExpanded ? '▲' : '▼'}</div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 20px 16px', borderTop: `1px solid ${T.borderL}` }}>
                      <div style={{ marginTop: 12, fontSize: 12, color: T.textSec, marginBottom: 8 }}>Evidence Fragments</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: T.surfaceH }}>
                            {['Verbatim Snippet', 'Page', 'Risk Type', 'Severity'].map(h => (
                              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {EVIDENCE_MAP[sig.key].map((ev, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                              <td style={{ padding: '8px 10px', fontStyle: 'italic', color: T.textSec, maxWidth: 420 }}>{ev.snippet}</td>
                              <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.textMut }}>{ev.page}</td>
                              <td style={{ padding: '8px 10px', color: T.text }}>{ev.type}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 10, background: tierColor(ev.severity), color: '#fff', fontSize: 10, fontWeight: 700 }}>{ev.severity}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Regulatory Risk Mapper */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Regulation grid */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Regulation × Signal Coverage Matrix</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.surfaceH }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Regulation</th>
                        {SIGNALS.map(s => (
                          <th key={s.key} style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{s.short}</th>
                        ))}
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Key Article</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Remediation Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {REGULATIONS.map((reg, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{reg.name}</td>
                          {SIGNALS.map(s => (
                            <td key={s.key} style={{ padding: '8px 8px', textAlign: 'center' }}>
                              {reg.signals.includes(s.key)
                                ? <span style={{ fontSize: 14, color: T.red }}>●</span>
                                : <span style={{ fontSize: 14, color: T.borderL }}>○</span>}
                            </td>
                          ))}
                          <td style={{ padding: '8px 12px', fontFamily: T.mono, fontSize: 11, color: T.textSec }}>{reg.article}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 10, background: T.navy, color: '#fff', fontSize: 10 }}>Immediate</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Heatmap: companies × regulations */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Company × Regulation Violation Risk Heatmap</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, minWidth: 140 }}>Company</th>
                      {REGULATIONS.map(r => (
                        <th key={r.short} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: T.textSec, minWidth: 80 }}>{r.short}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPANIES.map(c => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding: '6px 12px', fontWeight: 600 }}>{c.ticker}</td>
                        {REGULATIONS.map(reg => {
                          const riskScore = Math.round(reg.signals.reduce((a, sig) => a + c[sig], 0) / reg.signals.length);
                          const bg = riskScore >= 65 ? T.red : riskScore >= 45 ? T.orange : riskScore >= 25 ? T.amber : T.green;
                          return (
                            <td key={reg.short} style={{ padding: '6px 10px', textAlign: 'center' }}>
                              <div style={{ background: bg, color: '#fff', borderRadius: 4, padding: '2px 6px', fontFamily: T.mono, fontSize: 11, fontWeight: 700 }}>{riskScore}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enforcement precedents */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Enforcement Action Precedents</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Entity', 'Jurisdiction', 'Year', 'Action', 'Fine / Outcome', 'Severity'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ENFORCEMENT_ACTIONS.map((e, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{e.entity}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{e.jurisdiction}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono }}>{e.year}</td>
                      <td style={{ padding: '8px 12px', color: T.text, maxWidth: 260 }}>{e.action}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.mono, fontWeight: 700, color: T.red }}>{e.fine}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 10, background: tierColor(e.severity), color: '#fff', fontSize: 10, fontWeight: 700 }}>{e.severity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Sector Benchmark */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Box plot simulation */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>GW Score Distribution by Sector</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sectorBoxData} margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="sector" tick={{ fontSize: 12, fontFamily: T.font }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="min" name="Min" fill={T.green} opacity={0.5} />
                    <Bar dataKey="q1" name="Q1" fill={T.amber} opacity={0.6} />
                    <Bar dataKey="avg" name="Avg" fill={T.orange} />
                    <Bar dataKey="max" name="Max" fill={T.red} opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Scatter: ESG rating vs GW score */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>ESG Rating vs GW Score</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Hypothesis: higher ESG rating → lower greenwashing risk?</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="esgRating" name="ESG Rating" domain={[40, 95]} type="number" tick={{ fontSize: 11 }} label={{ value: 'ESG Rating', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                    <YAxis dataKey="composite" name="GW Score" domain={[0, 90]} tick={{ fontSize: 11 }} label={{ value: 'GW Score', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontFamily: T.font, fontSize: 12 }}
                      content={({ payload }) => payload?.[0] ? (
                        <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 8, borderRadius: 6, fontSize: 12 }}>
                          <div style={{ fontWeight: 700 }}>{payload[0].payload.ticker}</div>
                          <div>ESG: {payload[0].payload.esgRating}</div>
                          <div>GW: {payload[0].payload.composite}</div>
                        </div>
                      ) : null} />
                    <Scatter data={COMPANIES} name="Companies">
                      {COMPANIES.map((c, i) => (
                        <Cell key={c.id} fill={scoreColor(c.composite)} />
                      ))}
                    </Scatter>
                    <ReferenceLine stroke={T.textMut} strokeDasharray="4 2"
                      segment={[{ x: 40, y: 80 }, { x: 90, y: 20 }]} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Best practices */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Top 5 Best Practice Companies</div>
                {[...COMPANIES].sort((a, b) => a.composite - b.composite).slice(0, 5).map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '8px 12px', background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: T.gold, minWidth: 28 }}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{c.sector} · ESG {c.esgRating}</div>
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.green }}>{c.composite}</div>
                  </div>
                ))}
              </div>

              {/* YoY improvement */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Year-over-Year GW Score Change</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[...COMPANIES].sort((a, b) => (a.composite - a.prevComposite) - (b.composite - b.prevComposite)).slice(0, 8).map(c => ({
                    name: c.ticker, change: c.composite - c.prevComposite
                  }))} margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: T.font }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Bar dataKey="change" name="YoY Change">
                      {[...COMPANIES].sort((a, b) => (a.composite - a.prevComposite) - (b.composite - b.prevComposite)).slice(0, 8).map((c, i) => (
                        <Cell key={i} fill={(c.composite - c.prevComposite) <= 0 ? T.green : T.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Remediation Playbook */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
              <select value={selectedCompany} onChange={e => setSelectedCompany(+e.target.value)}
                style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, fontSize: 13, background: T.surface, color: T.text }}>
                {COMPANIES.map((c, i) => <option key={i} value={i}>{c.name} ({c.ticker})</option>)}
              </select>
              <button onClick={() => setReportModal(true)} style={{
                padding: '8px 20px', borderRadius: 6, border: 'none', background: T.gold, color: T.navy,
                cursor: 'pointer', fontSize: 13, fontFamily: T.font, fontWeight: 700, letterSpacing: 0.3,
              }}>Generate Report</button>
            </div>

            {/* Remediation action cards */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Remediation Action Cards — High / Critical Signals</div>
              {REMEDIATION_ACTIONS.map((r, i) => (
                <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: tierColor(r.priority), color: '#fff', fontSize: 11, fontWeight: 700 }}>{r.priority}</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{SIGNALS.find(s => s.key === r.signal)?.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 4 }}>PROBLEM</div>
                      <div style={{ fontSize: 13, color: T.text }}>{r.problem}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 4 }}>REGULATORY DEADLINE</div>
                      <div style={{ fontSize: 13, fontFamily: T.mono, color: T.amber }}>{r.deadline}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 4 }}>SUGGESTED IMPROVEMENT</div>
                      <div style={{ fontSize: 13, color: T.text }}>{r.improvement}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sage, marginBottom: 4 }}>BEST-PRACTICE EXAMPLE</div>
                      <div style={{ fontSize: 12, fontStyle: 'italic', color: T.textSec, background: T.surfaceH, padding: '8px 10px', borderRadius: 6 }}>{r.example}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclosure Checklist */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Green Claims Compliance Checklist</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <span style={{ color: T.green, fontWeight: 700 }}>✓ {passCount} Pass</span>
                  <span style={{ color: T.amber, fontWeight: 700 }}>◐ {checklistStatus.filter(c => c.status === 'partial').length} Partial</span>
                  <span style={{ color: T.red, fontWeight: 700 }}>✗ {failCount} Fail</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {checklistStatus.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 10px', background: T.surfaceH, borderRadius: 6, borderLeft: `3px solid ${item.status === 'pass' ? T.green : item.status === 'partial' ? T.amber : T.red}` }}>
                    <span style={{ fontSize: 14, color: item.status === 'pass' ? T.green : item.status === 'partial' ? T.amber : T.red, minWidth: 16, fontWeight: 700 }}>
                      {item.status === 'pass' ? '✓' : item.status === 'partial' ? '◐' : '✗'}
                    </span>
                    <span style={{ fontSize: 12, color: T.text }}>{item.item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Matrix 2x2 */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Remediation Priority Matrix</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>Ease of implementation × Impact on GW score reduction</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2, height: 280, maxWidth: 520 }}>
                {[
                  { label: 'Quick Wins', sub: 'High Impact · Easy', items: ['Unverifiable Claims', 'Vagueness Index'], bg: '#dcfce7', border: T.green },
                  { label: 'Strategic', sub: 'High Impact · Hard', items: ['Claim-Data Mismatch', 'Selective Disclosure'], bg: '#fef3c7', border: T.amber },
                  { label: 'Fill-Ins', sub: 'Low Impact · Easy', items: ['Positive Framing', 'Target Weakening'], bg: '#dbeafe', border: T.blue },
                  { label: 'Deprioritise', sub: 'Low Impact · Hard', items: ['Regulatory Breach Risk'], bg: '#f3f4f6', border: T.borderL },
                ].map((q, i) => (
                  <div key={i} style={{ background: q.bg, border: `2px solid ${q.border}`, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{q.label}</div>
                    <div style={{ fontSize: 10, color: T.textSec, marginBottom: 8 }}>{q.sub}</div>
                    {q.items.map(item => (
                      <div key={item} style={{ fontSize: 11, color: T.text, padding: '3px 8px', background: 'rgba(255,255,255,0.7)', borderRadius: 4, marginBottom: 4 }}>• {item}</div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 520, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: T.textMut }}>← Difficult</span>
                <span style={{ fontSize: 10, color: T.textMut, fontWeight: 600 }}>EASE →</span>
                <span style={{ fontSize: 10, color: T.textMut }}>Easy →</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal status bar */}
      <div style={{ background: T.navy, padding: '6px 32px', display: 'flex', gap: 24, borderTop: `1px solid ${T.navyL}` }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gold }}>EP-BY2</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>GREENWASHING DETECTION ENGINE</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>COMPANIES: 15</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>SIGNALS: 7</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>EU GCD 2023/2441 · ESMA ESG · FCA SDR</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.sageL, marginLeft: 'auto' }}>READY</span>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 32, maxWidth: 440, width: '90%' }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${T.gold}, ${T.goldL})`, borderRadius: 2, marginBottom: 20 }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Report Generated</div>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 16 }}>
              Greenwashing Detection Report for <strong>{company.name}</strong> has been compiled.
            </div>
            <div style={{ background: T.surfaceH, borderRadius: 8, padding: 14, fontSize: 12, color: T.textSec, marginBottom: 20 }}>
              <div>• 7-signal analysis with evidence citations</div>
              <div>• Regulatory violation risk mapping</div>
              <div>• Remediation action plan with deadlines</div>
              <div>• Compliance checklist: {passCount}/{CHECKLIST_ITEMS.length} items passing</div>
              <div style={{ marginTop: 8, fontFamily: T.mono, fontSize: 11, color: T.gold }}>
                GW-RPT-{company.ticker}-{new Date().toISOString().slice(0, 10)}.pdf
              </div>
            </div>
            <button onClick={() => setReportModal(false)} style={{
              padding: '10px 24px', borderRadius: 6, border: 'none', background: T.navy, color: '#fff',
              cursor: 'pointer', fontSize: 13, fontFamily: T.font, fontWeight: 700,
            }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
