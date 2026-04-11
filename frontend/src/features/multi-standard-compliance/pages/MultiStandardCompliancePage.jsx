import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Forestry & Land Use', 'Renewable Energy', 'Methane Capture', 'Agriculture', 'Energy Efficiency', 'Blue Carbon', 'Cookstoves', 'Transportation'];
const COUNTRIES = ['Brazil', 'Indonesia', 'Kenya', 'India', 'Colombia', 'Ghana', 'Peru', 'Vietnam', 'Cambodia', 'Tanzania', 'Mexico', 'Ethiopia', 'Philippines', 'Malaysia', 'Uganda'];
const TYPES_MAP = { 'Forestry & Land Use': 'AFOLU', 'Renewable Energy': 'Energy', 'Methane Capture': 'Waste', 'Agriculture': 'AFOLU', 'Energy Efficiency': 'Energy', 'Blue Carbon': 'AFOLU', 'Cookstoves': 'Household', 'Transportation': 'Transport' };
const ART6_STATUSES = ['Not Applicable', 'Eligible', 'Corresponding Adjustment Applied', 'Pending CA', 'Not Applicable'];
const REG_STATUSES = ['Registered', 'Under Validation', 'Under Review', 'Registered', 'Crediting Period Renewal'];
const ARTICLE6_CA_COUNTRIES = ['Switzerland', 'Singapore', 'Japan', 'South Korea', 'Sweden'];
const ARTICLE6_PENDING_COUNTRIES = ['Ghana', 'Colombia', 'Indonesia', 'Vietnam', 'Cambodia'];

const PROJECTS = Array.from({ length: 50 }, (_, i) => {
  const sector = SECTORS[i % SECTORS.length];
  const country = COUNTRIES[i % COUNTRIES.length];
  const type = TYPES_MAP[sector];
  const cdm  = Math.round(40 + sr(i * 7  + 1) * 55);
  const gs   = Math.round(45 + sr(i * 11 + 2) * 50);
  const vcs  = Math.round(50 + sr(i * 13 + 3) * 48);
  const car  = Math.round(30 + sr(i * 19 + 4) * 60);
  const acr  = Math.round(35 + sr(i * 23 + 5) * 58);
  const corsia = Math.round(40 + sr(i * 29 + 6) * 55);
  const sdgCount = 3 + Math.floor(sr(i * 31 + 7) * 7);
  const allSdgs = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
  const sdgs = allSdgs.filter((_, idx) => sr(i * 37 + idx * 3) > (1 - sdgCount / 17));
  const regs = [];
  if (cdm > 70) regs.push('CDM');
  if (gs  > 65) regs.push('GS');
  if (vcs > 60) regs.push('VCS');
  if (regs.length === 0) regs.push('VCS');
  const ccpLabel = (gs >= 72 && vcs >= 75 && cdm >= 70) ? 'Y' : 'N';
  const corsiaEligible = corsia > 70;
  const sdgPremium = sdgs.length >= 5 ? 0.25 : 0;
  const corsiaBonus = corsiaEligible ? 0.08 : 0;
  const ccpBonus = ccpLabel === 'Y' ? 0.20 : 0;
  return {
    id: `PRJ-${String(i + 1).padStart(3, '0')}`,
    name: `${country} ${sector.split(' ')[0]} ${String(i + 1).padStart(2, '0')}`,
    type, country, sector,
    registries: regs,
    complianceScores: { cdm, gs, vcs, car, acr, corsia },
    sdgAlignment: sdgs.slice(0, Math.max(3, sdgCount)),
    bufferPool_pct: Math.round(10 + sr(i * 41 + 8) * 20),
    leakageBelt_pct: Math.round(3 + sr(i * 43 + 9) * 12),
    artSixStatus: ART6_STATUSES[i % ART6_STATUSES.length],
    corsiaEligible, ccpLabel,
    premiumFactor: 1.0 + sdgPremium + corsiaBonus + ccpBonus,
    regStatus: REG_STATUSES[i % REG_STATUSES.length],
    erMtCO2: Math.round(1000 + sr(i * 47 + 10) * 50000),
    jobs: Math.round(10 + sr(i * 53 + 11) * 490),
    households: Math.round(100 + sr(i * 59 + 12) * 4900),
    forestHa: type === 'AFOLU' ? Math.round(500 + sr(i * 61 + 13) * 19500) : 0,
    waterQuality: sr(i * 67 + 14) > 0.5,
  };
});

const CDM_REQUIREMENTS = [
  { id: 'CDM-01', label: 'PDD completeness',                              ref: 'CDM Standard v8 §3' },
  { id: 'CDM-02', label: 'Additionality demonstrated',                    ref: 'CDM EB TOOL01 v8' },
  { id: 'CDM-03', label: 'Methodology applicability confirmed',            ref: 'Per methodology applicability conditions' },
  { id: 'CDM-04', label: 'Baseline scenario documented',                   ref: 'CDM Standard v8 §4' },
  { id: 'CDM-05', label: 'Monitoring plan approved',                       ref: 'CDM Standard v8 §6' },
  { id: 'CDM-06', label: 'Host country LoA obtained',                      ref: 'CDM Modalities Article 12.5' },
  { id: 'CDM-07', label: 'Public stakeholder comments (28-day period)',    ref: 'CDM Standard v8 §7' },
  { id: 'CDM-08', label: 'VVB validation completed',                       ref: 'CDM Validation & Verification Standard v1' },
  { id: 'CDM-09', label: 'Registration by EB',                             ref: 'CDM Registration Procedure v3' },
  { id: 'CDM-10', label: 'Annual monitoring reports submitted',            ref: 'CDM Monitoring Standard v2' },
  { id: 'CDM-11', label: 'Third-party verification completed',             ref: 'CDM Validation & Verification Standard v1' },
  { id: 'CDM-12', label: 'CER issuance by EB',                            ref: 'CDM Issuance Procedure v3' },
  { id: 'CDM-13', label: 'ODA/public finance check performed',             ref: 'Decision 17/CP.7 Annex' },
];

const GS_REQUIREMENTS = [
  { id: 'GS-01', label: 'SDG contribution — minimum 3 SDGs with evidence', ref: 'GS4GG P&R §5.1' },
  { id: 'GS-02', label: 'Safeguarding — Environmental (ecosystems, water, soil, air quality)', ref: 'GS4GG P&R §4' },
  { id: 'GS-03', label: 'Safeguarding — Social (community, gender, livelihoods, indigenous rights)', ref: 'GS4GG P&R §4' },
  { id: 'GS-04', label: 'Safeguarding — Economic (local economy, supply chains)', ref: 'GS4GG P&R §4' },
  { id: 'GS-05', label: 'Stakeholder consultation (project-affected persons)', ref: 'GS4GG P&R §6' },
  { id: 'GS-06', label: 'Complaint & grievance mechanism established', ref: 'GS4GG P&R §6.4' },
  { id: 'GS-07', label: 'SDG mapping documented', ref: 'GS4GG SDG Impact Standards' },
  { id: 'GS-08', label: 'Monitoring of SDG co-benefits ongoing', ref: 'GS4GG MRV Framework' },
];

const VCS_REQUIREMENTS = [
  { id: 'VCS-01', label: 'VCS methodology eligibility confirmed', ref: 'VCS Standard v4 §3.1' },
  { id: 'VCS-02', label: 'Project boundary defined (GIS polygon)', ref: 'VCS Standard v4 §3.5' },
  { id: 'VCS-03', label: 'Net GHG benefit positive', ref: 'VCS Standard v4 §3.2' },
  { id: 'VCS-04', label: 'Permanence — AFOLU buffer pool contribution', ref: 'VCS Standard v4 §3.7' },
  { id: 'VCS-05', label: 'No double counting demonstrated', ref: 'VCS Standard v4 §3.8 + Article 6.2 PA' },
  { id: 'VCS-06', label: 'Leakage assessed and quantified', ref: 'VCS Standard v4 §3.6' },
  { id: 'VCS-07', label: 'VVB validation completed', ref: 'VCS Standard v4 §4.1' },
  { id: 'VCS-08', label: 'VVB verification completed', ref: 'VCS Standard v4 §4.2' },
];

const CCP_PRINCIPLES = [
  { id: 1,  label: 'Effective governance',                                         cat: 'Governance' },
  { id: 2,  label: 'Tracking — unique serialization, registry',                    cat: 'Tracking' },
  { id: 3,  label: 'Transparency — public disclosure',                             cat: 'Transparency' },
  { id: 4,  label: 'Robust independent third-party validation & verification',     cat: 'Validation & Verification' },
  { id: 5,  label: 'Additionality',                                                cat: 'Additionality' },
  { id: 6,  label: 'Permanence',                                                   cat: 'Permanence' },
  { id: 7,  label: 'Robust quantification of GHG reductions/removals',            cat: 'Quantification' },
  { id: 8,  label: 'No double counting',                                           cat: 'Double Counting' },
  { id: 9,  label: 'Sustainable development benefits',                             cat: 'SDGs' },
  { id: 10, label: 'No net harm (do no significant harm)',                         cat: 'No Net Harm' },
];

const CORSIA_ELIGIBLE_STANDARDS = [
  { name: 'Verra VCS (with CORSIA label)',       phase: '2021–2035', status: 'Approved' },
  { name: 'Gold Standard (with CORSIA label)',   phase: '2021–2035', status: 'Approved' },
  { name: 'ACR (with CORSIA label)',             phase: '2021–2035', status: 'Approved' },
  { name: 'CAR (with CORSIA label)',             phase: '2021–2035', status: 'Approved' },
  { name: 'ART TREES (jurisdictional REDD+)',    phase: '2024–2035', status: 'Approved' },
  { name: 'CDM pre-2020 (Phase 1 only)',         phase: '2021–2023', status: 'Limited' },
];

const CAR_PROTOCOLS = [
  { name: 'Forest Protocol v3.5 (US Forest)',          carbApproved: true },
  { name: 'Livestock Protocol v2.1 (Methane digesters)', carbApproved: true },
  { name: 'Rice Cultivation Protocol v1.1',            carbApproved: false },
  { name: 'Urban Forest Protocol v1.0',                carbApproved: true },
  { name: 'Ozone Depleting Substances Protocol v2.1',  carbApproved: true },
];

const ACR_REQUIREMENTS = [
  { id: 'ACR-01', label: 'ACR Emission Offset Project Report submitted',         ref: 'ACR Standard v8 §3' },
  { id: 'ACR-02', label: 'ACR-approved third-party verifier engaged',            ref: 'ACR Verification Requirements' },
  { id: 'ACR-03', label: 'Public comment period (30 days) completed',            ref: 'ACR Registration Procedure' },
  { id: 'ACR-04', label: 'Conservative crediting — buffer account contribution', ref: 'ACR Buffer Pool Requirements' },
  { id: 'ACR-05', label: 'Additional environmental/social benefits documented',  ref: 'ACR Co-benefits Framework' },
];

// ─────────────────────────────────────────────────────────────────────────────
// UI Primitives
// ─────────────────────────────────────────────────────────────────────────────

function Badge({ label, color, bg }) {
  return (
    <span style={{ fontSize: 10, fontFamily: T.fontMono, background: bg || T.sub, color: color || T.textSec, padding: '2px 7px', borderRadius: 3, fontWeight: 700, letterSpacing: 0.4, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? T.green : score >= 60 ? T.amber : T.red;
  const icon  = score >= 80 ? '✓' : score >= 60 ? '⚠' : '✗';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontFamily: T.fontMono, color, fontWeight: 700 }}>
      {icon} {score}
    </span>
  );
}

function ComplianceCell({ score, applicable }) {
  if (!applicable) return <td style={{ background: '#f9fafb', textAlign: 'center', padding: '4px 6px', fontSize: 11, color: T.textSec }}>—</td>;
  const bg   = score >= 80 ? '#f0fdf4' : score >= 60 ? '#fffbeb' : '#fef2f2';
  const color = score >= 80 ? T.green : score >= 60 ? T.amber : T.red;
  const icon  = score >= 80 ? '✓' : score >= 60 ? '⚠' : '✗';
  return (
    <td style={{ textAlign: 'center', padding: '4px 6px', background: bg }}>
      <span style={{ color, fontWeight: 700, fontSize: 12 }}>{icon}</span>
      <div style={{ fontSize: 9, color, fontFamily: T.fontMono }}>{score}</div>
    </td>
  );
}

function ReqRow({ req, passed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
      <span style={{ fontSize: 14, color: passed ? T.green : T.amber, flexShrink: 0, marginTop: 1 }}>{passed ? '☑' : '☐'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: T.textPri, fontWeight: 500 }}>{req.label}</div>
        <div style={{ fontSize: 10, color: T.blue, fontFamily: T.fontMono, marginTop: 2 }}>{req.ref}</div>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: T.blue, fontFamily: T.fontMono, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MultiStandardCompliancePage() {
  const [tab, setTab]               = useState(0);
  const [filterSector, setFilterSector]   = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterRegistry, setFilterRegistry] = useState('All');
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].id);

  const TABS = [
    'Compliance Matrix', 'CDM Tracker', 'Gold Standard v4.0',
    'Verra VCS v4.0', 'CAR & ACR', 'CORSIA', 'ICVCM / CCP', 'Article 6 & DC',
  ];

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (filterSector   === 'All' || p.sector   === filterSector) &&
    (filterCountry  === 'All' || p.country  === filterCountry) &&
    (filterRegistry === 'All' || p.registries.includes(filterRegistry))
  ), [filterSector, filterCountry, filterRegistry]);

  const kpis = useMemo(() => {
    const total    = filtered.length;
    const fullyC   = filtered.filter(p => Object.values(p.complianceScores).every(s => s >= 80)).length;
    const partial  = filtered.filter(p => { const vals = Object.values(p.complianceScores); return vals.some(s => s >= 80) && !vals.every(s => s >= 80); }).length;
    const nonC     = total - fullyC - partial;
    const multiReg = filtered.filter(p => p.registries.length >= 2).length;
    const ccp      = filtered.filter(p => p.ccpLabel === 'Y').length;
    const corsia   = filtered.filter(p => p.corsiaEligible).length;
    return { total, fullyC, partial, nonC, multiReg, ccp, corsia };
  }, [filtered]);

  const selProject = useMemo(() => PROJECTS.find(p => p.id === selectedProject) || PROJECTS[0], [selectedProject]);

  const sel = { fontSize: 12, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, background: T.card, color: T.textPri, fontFamily: T.fontMono };
  const lbl = { fontSize: 10, color: T.textSec, fontFamily: T.fontMono, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.6 };

  // CDM checklist completion per project
  const cdmPassFn = (proj, ri) => sr(proj.id.charCodeAt(4) * 7 + ri * 3 + 1) > 0.28;
  const gsPassFn  = (proj, ri) => sr(proj.id.charCodeAt(4) * 11 + ri * 5 + 2) > 0.22;
  const vcsPassFn = (proj, ri) => sr(proj.id.charCodeAt(4) * 13 + ri * 7 + 3) > 0.20;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '16px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 20, color: T.gold }}>⚖</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>
            Multi-Standard Carbon Credit Compliance Intelligence
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: T.fontMono }}>
          CDM | Gold Standard v4.0 | Verra VCS v4.0 | CAR | ACR | CORSIA | ISO 14064 | IPCC AR6 | Article 6 PA
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 28px', display: 'flex', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '12px 15px', fontSize: 12, fontWeight: tab === i ? 700 : 400,
            color: tab === i ? T.indigo : T.textSec, background: 'none', border: 'none',
            borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 0 — Compliance Matrix Dashboard                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 0 && (
          <div>
            <SectionHeader
              title="Compliance Matrix Dashboard"
              sub="Traffic-light assessment across CDM · GS v4.0 · VCS v4.0 · CAR · ACR · CORSIA for all 50 projects"
            />

            {/* Filters */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <div><div style={lbl}>Sector</div>
                <select style={sel} value={filterSector} onChange={e => setFilterSector(e.target.value)}>
                  <option>All</option>{SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><div style={lbl}>Country</div>
                <select style={sel} value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
                  <option>All</option>{COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><div style={lbl}>Registry</div>
                <select style={sel} value={filterRegistry} onChange={e => setFilterRegistry(e.target.value)}>
                  <option>All</option>{['CDM','GS','VCS'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <KpiCard label="Fully Compliant"       value={kpis.fullyC}  sub="All standards ≥80"     color={T.green}  />
              <KpiCard label="Partially Compliant"   value={kpis.partial} sub="Some standards met"    color={T.amber}  />
              <KpiCard label="Non-Compliant"         value={kpis.nonC}    sub="Standards not met"     color={T.red}    />
              <KpiCard label="Multi-Standard Reg."   value={kpis.multiReg} sub="≥2 registries"        color={T.blue}   />
              <KpiCard label="CCP Labeled"           value={kpis.ccp}     sub="ICVCM CCP v2"          color={T.purple} />
              <KpiCard label="CORSIA Eligible"       value={kpis.corsia}  sub="ICAO Annex 16 Vol.IV"  color={T.teal}   />
            </div>

            {/* Matrix Table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                  COMPLIANCE MATRIX — {filtered.length} PROJECTS × 6 STANDARDS
                </span>
                <span style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>
                  ✓ ≥80 &nbsp;⚠ 60–79 &nbsp;✗ &lt;60 &nbsp;— N/A
                </span>
              </div>
              <div style={{ overflow: 'auto', maxHeight: 500 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Project', 'Type', 'Country', 'CDM', 'GS', 'VCS', 'CAR', 'ACR', 'CORSIA', 'CCP', 'Art.6'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Project' || h === 'Country' ? 'left' : 'center', padding: '8px 8px', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, position: 'sticky', top: 0, background: T.sub, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, idx) => {
                      const carApplicable  = sr(idx * 43 + 17) > 0.5;
                      const acrApplicable  = sr(idx * 47 + 19) > 0.35;
                      const corsiaAppl     = p.corsiaEligible || sr(idx * 53 + 23) > 0.6;
                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                          <td style={{ padding: '5px 8px' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, fontFamily: T.fontMono }}>{p.id}</div>
                            <div style={{ fontSize: 10, color: T.textSec }}>{p.sector.slice(0, 18)}</div>
                          </td>
                          <td style={{ padding: '5px 8px', fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{p.type}</td>
                          <td style={{ padding: '5px 8px', fontSize: 11, color: T.textPri }}>{p.country}</td>
                          <ComplianceCell score={p.complianceScores.cdm}    applicable={true} />
                          <ComplianceCell score={p.complianceScores.gs}     applicable={true} />
                          <ComplianceCell score={p.complianceScores.vcs}    applicable={true} />
                          <ComplianceCell score={p.complianceScores.car}    applicable={carApplicable} />
                          <ComplianceCell score={p.complianceScores.acr}    applicable={acrApplicable} />
                          <ComplianceCell score={p.complianceScores.corsia} applicable={corsiaAppl} />
                          <td style={{ textAlign: 'center', padding: '5px 6px' }}>
                            <Badge label={p.ccpLabel} color={p.ccpLabel === 'Y' ? T.green : T.textSec} bg={p.ccpLabel === 'Y' ? '#f0fdf4' : '#f9fafb'} />
                          </td>
                          <td style={{ padding: '5px 6px', fontSize: 9, color: T.textSec, maxWidth: 90, fontFamily: T.fontMono }}>{p.artSixStatus.slice(0, 14)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div style={{ marginTop: 10, display: 'flex', gap: 20, fontSize: 10, color: T.textSec, fontFamily: T.fontMono, flexWrap: 'wrap' }}>
              <span style={{ color: T.green }}>✓ Compliant (≥80)</span>
              <span style={{ color: T.amber }}>⚠ Partial (60–79)</span>
              <span style={{ color: T.red }}>✗ Gap (&lt;60)</span>
              <span>— Not Applicable</span>
              <span style={{ marginLeft: 'auto', color: T.textSec }}>Scores: 0–100 per standard · Cell background = compliance heat</span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1 — CDM Compliance Tracker                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 1 && (
          <div>
            <SectionHeader
              title="CDM Compliance Tracker"
              sub="UNFCCC Clean Development Mechanism | Decision 3/CMP.1 | CDM Standard v8"
            />
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div><div style={lbl}>Select Project</div>
                <select style={sel} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                  {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {/* Checklist panel */}
              <div style={{ flex: 2, minWidth: 320 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>CDM Requirement Checklist — {selProject.id}</div>
                    <Badge label={selProject.regStatus} color={selProject.regStatus === 'Registered' ? T.green : T.amber} bg={selProject.regStatus === 'Registered' ? '#f0fdf4' : '#fffbeb'} />
                  </div>
                  {CDM_REQUIREMENTS.map((req, ri) => <ReqRow key={req.id} req={req} passed={cdmPassFn(selProject, ri)} />)}
                </div>
              </div>

              {/* Stats sidebar */}
              <div style={{ flex: 1, minWidth: 230 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Project Details</div>
                  {[
                    ['CDM Score',    `${selProject.complianceScores.cdm}/100`],
                    ['ER Claimed',   `${selProject.erMtCO2.toLocaleString()} tCO₂e`],
                    ['Sector',       selProject.sector],
                    ['Country',      selProject.country],
                    ['Registries',   selProject.registries.join(', ')],
                    ['Art.6 Status', selProject.artSixStatus],
                    ['CER Serial',   `CDM-${selProject.id}-2020-2025`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                      <span style={{ color: T.textSec }}>{k}</span>
                      <span style={{ color: T.navy, fontWeight: 600, fontFamily: T.fontMono, fontSize: 11 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Checklist progress */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Checklist Completion</div>
                  {(() => {
                    const passed = CDM_REQUIREMENTS.filter((_, ri) => cdmPassFn(selProject, ri)).length;
                    const pct    = CDM_REQUIREMENTS.length > 0 ? Math.round(passed / CDM_REQUIREMENTS.length * 100) : 0;
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span style={{ color: T.textSec }}>Completion</span>
                          <span style={{ fontWeight: 700, color: pct >= 80 ? T.green : T.amber, fontFamily: T.fontMono }}>{pct}%</span>
                        </div>
                        <div style={{ height: 8, background: T.borderL, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: 8, borderRadius: 4, width: `${pct}%`, background: pct >= 80 ? T.green : T.amber, transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ fontSize: 10, color: T.textSec, marginTop: 6, fontFamily: T.fontMono }}>
                          {passed}/{CDM_REQUIREMENTS.length} met · {CDM_REQUIREMENTS.length - passed} open items
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* All projects CDM summary table */}
            <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                ALL PROJECTS — CDM CHECKLIST SUMMARY (top 30)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Project', 'Country', 'CDM Score', 'Checklist %', 'Open Items', 'Status', 'CER Serial Range'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROJECTS.slice(0, 30).map((p, idx) => {
                    const passedCount = CDM_REQUIREMENTS.filter((_, ri) => cdmPassFn(p, ri)).length;
                    const pct         = CDM_REQUIREMENTS.length > 0 ? Math.round(passedCount / CDM_REQUIREMENTS.length * 100) : 0;
                    const open        = CDM_REQUIREMENTS.length - passedCount;
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 10px', fontWeight: 600, color: T.navy, fontFamily: T.fontMono }}>{p.id}</td>
                        <td style={{ padding: '5px 10px' }}>{p.country}</td>
                        <td style={{ padding: '5px 10px' }}><ScoreBadge score={p.complianceScores.cdm} /></td>
                        <td style={{ padding: '5px 10px', fontFamily: T.fontMono }}>{pct}%</td>
                        <td style={{ padding: '5px 10px', color: open > 0 ? T.red : T.green, fontFamily: T.fontMono, fontWeight: 700 }}>{open}</td>
                        <td style={{ padding: '5px 10px' }}><Badge label={p.regStatus} color={p.regStatus === 'Registered' ? T.green : T.amber} /></td>
                        <td style={{ padding: '5px 10px', fontFamily: T.fontMono, fontSize: 10, color: T.textSec }}>CDM-{p.id}-2020-2025</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2 — Gold Standard v4.0                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 2 && (
          <div>
            <SectionHeader
              title="Gold Standard v4.0 — For the Global Goals"
              sub="Gold Standard for the Global Goals v4.0 | Principles & Requirements Document v1.2"
            />
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div><div style={lbl}>Select Project</div>
                <select style={sel} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                  {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 320 }}>
                {/* GS Checklist */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>GS4GG Requirements Checklist — {selProject.id}</div>
                  {GS_REQUIREMENTS.map((req, ri) => <ReqRow key={req.id} req={req} passed={gsPassFn(selProject, ri)} />)}
                </div>

                {/* SDG Grid */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 3 }}>SDG Contribution Grid — {selProject.id}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 12 }}>
                    GS4GG SDG Impact Standards · Min 3 SDGs with evidence required · ★ = evidence quality (1–5 stars)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 14 }}>
                    {Array.from({ length: 17 }, (_, i) => {
                      const sdgNum   = i + 1;
                      const aligned  = selProject.sdgAlignment.includes(sdgNum);
                      const stars    = aligned ? 1 + Math.floor(sr(selProject.id.charCodeAt(4) * 13 + sdgNum * 7) * 4) : 0;
                      const isPrimary = aligned && stars >= 4;
                      return (
                        <div key={sdgNum} style={{ background: aligned ? T.navy : T.sub, borderRadius: 4, padding: '6px 3px', textAlign: 'center', border: `1px solid ${aligned ? T.gold : T.border}` }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: aligned ? T.gold : T.textSec, fontFamily: T.fontMono }}>SDG {sdgNum}</div>
                          {aligned && <div style={{ fontSize: 8, color: '#fbbf24', marginTop: 2 }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</div>}
                          {isPrimary && <div style={{ fontSize: 8, color: T.gold, marginTop: 1 }}>PRIMARY</div>}
                        </div>
                      );
                    })}
                  </div>
                  {selProject.sdgAlignment.length >= 5 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: `1px solid #86efac`, borderRadius: 4, padding: '4px 10px', fontSize: 11, color: T.green, fontWeight: 600, marginBottom: 10 }}>
                      ✓ +25% SDG Premium Eligible (GS4GG SDG Impact Standards — ≥5 verified SDGs)
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11, color: T.textSec }}>
                    <span>SDGs addressed: <strong style={{ color: T.navy }}>{selProject.sdgAlignment.length}</strong></span>
                    <span>Jobs: <strong style={{ color: T.navy }}>{selProject.jobs.toLocaleString()} FTE</strong></span>
                    <span>Households (clean energy): <strong style={{ color: T.navy }}>{selProject.households.toLocaleString()}</strong></span>
                    {selProject.type === 'AFOLU' && <span>Forest: <strong style={{ color: T.navy }}>{selProject.forestHa.toLocaleString()} ha</strong></span>}
                    <span>Water quality: <strong style={{ color: selProject.waterQuality ? T.green : T.textSec }}>{selProject.waterQuality ? 'Improved' : 'Monitored'}</strong></span>
                  </div>
                </div>
              </div>

              {/* GS Score Sidebar */}
              <div style={{ flex: 1, minWidth: 230 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>GS Score Summary</div>
                  {[
                    ['GS Score',        `${selProject.complianceScores.gs}/100`],
                    ['SDGs Addressed',  `${selProject.sdgAlignment.length}/17`],
                    ['SDG Premium',     selProject.sdgAlignment.length >= 5 ? '+25%' : 'Not eligible'],
                    ['CORSIA Label',    selProject.corsiaEligible ? 'Yes' : 'No'],
                    ['Premium Factor',  `${selProject.premiumFactor.toFixed(2)}×`],
                    ['Type',            selProject.type],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                      <span style={{ color: T.textSec }}>{k}</span>
                      <span style={{ color: T.navy, fontWeight: 600, fontFamily: T.fontMono, fontSize: 11 }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Co-benefit Metrics</div>
                  {[
                    { label: 'Jobs Created',           value: `${selProject.jobs.toLocaleString()} FTE`, color: T.green },
                    { label: 'Households (clean NRG)', value: selProject.households.toLocaleString(),    color: T.blue  },
                    { label: 'Forest Protected',       value: selProject.type === 'AFOLU' ? `${selProject.forestHa.toLocaleString()} ha` : 'N/A', color: T.sage },
                    { label: 'Water Quality',          value: selProject.waterQuality ? 'Improved' : 'Monitored', color: T.teal },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 11 }}>
                      <span style={{ color: T.textSec }}>{item.label}</span>
                      <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* GS checklist completion */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', marginTop: 14 }}>
                  {(() => {
                    const passed = GS_REQUIREMENTS.filter((_, ri) => gsPassFn(selProject, ri)).length;
                    const pct    = GS_REQUIREMENTS.length > 0 ? Math.round(passed / GS_REQUIREMENTS.length * 100) : 0;
                    return (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>GS Checklist Completion</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span style={{ color: T.textSec }}>Completion</span>
                          <span style={{ fontWeight: 700, color: pct >= 80 ? T.green : T.amber, fontFamily: T.fontMono }}>{pct}%</span>
                        </div>
                        <div style={{ height: 8, background: T.borderL, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: 8, borderRadius: 4, width: `${pct}%`, background: pct >= 80 ? T.green : T.amber }} />
                        </div>
                        <div style={{ fontSize: 10, color: T.textSec, marginTop: 5, fontFamily: T.fontMono }}>{passed}/{GS_REQUIREMENTS.length} met</div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3 — Verra VCS v4.0                                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 3 && (
          <div>
            <SectionHeader
              title="Verra VCS v4.0 Compliance"
              sub="Verified Carbon Standard v4.0 | Verra Registration and Issuance Process v4.0"
            />
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div><div style={lbl}>Select Project</div>
                <select style={sel} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                  {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 320 }}>
                {/* VCS Checklist */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>VCS v4.0 Requirements — {selProject.id}</div>
                  {VCS_REQUIREMENTS.map((req, ri) => <ReqRow key={req.id} req={req} passed={vcsPassFn(selProject, ri)} />)}
                </div>

                {/* Buffer Pool (AFOLU only) */}
                {selProject.type === 'AFOLU' && (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 3 }}>AFOLU Buffer Pool Contribution Calculator</div>
                    <div style={{ fontSize: 10, color: T.blue, fontFamily: T.fontMono, marginBottom: 12 }}>VCS Standard v4 §3.7 — Non-permanence risk tool</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      {[
                        ['Risk Rating',          selProject.bufferPool_pct <= 15 ? 'Low' : selProject.bufferPool_pct <= 20 ? 'Medium' : 'High'],
                        ['Buffer Deduction',     `${selProject.bufferPool_pct}%`],
                        ['Gross ER (tCO₂e)',     selProject.erMtCO2.toLocaleString()],
                        ['Buffer Deducted',      `${Math.round(selProject.erMtCO2 * selProject.bufferPool_pct / 100).toLocaleString()} tCO₂e`],
                        ['Net VCUs Issued',      `${Math.round(selProject.erMtCO2 * (1 - selProject.bufferPool_pct / 100)).toLocaleString()} VCU`],
                        ['Buffer Reference',     'VCS NPR Tool v4'],
                      ].map(([k, v]) => (
                        <div key={k} style={{ background: T.sub, borderRadius: 4, padding: '8px 12px' }}>
                          <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono, marginBottom: 3 }}>{k}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: T.textSec }}>
                      Risk ratings: Negligible 10% · Low 15% · Medium 20% · High 30% — per VCS Non-Permanence Risk Tool v4
                    </div>
                  </div>
                )}

                {/* Leakage Analysis */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 3 }}>Leakage Belt Analysis</div>
                  <div style={{ fontSize: 10, color: T.blue, fontFamily: T.fontMono, marginBottom: 12 }}>VCS Standard v4 §3.6 — Market leakage + activity shifting leakage</div>
                  {[
                    ['Market Leakage Belt',       `${selProject.leakageBelt_pct}%`],
                    ['Activity Shifting Leakage', `${Math.round(selProject.leakageBelt_pct * 0.4)}%`],
                    ['Total Leakage Deduction',   `${Math.round(selProject.leakageBelt_pct * 1.4)}%`],
                    ['Leakage tCO₂e',             `${Math.round(selProject.erMtCO2 * selProject.leakageBelt_pct * 1.4 / 100).toLocaleString()}`],
                    ['Net After Leakage',         `${Math.round(selProject.erMtCO2 * (1 - selProject.leakageBelt_pct * 1.4 / 100)).toLocaleString()} tCO₂e`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                      <span style={{ color: T.textSec }}>{k}</span>
                      <span style={{ fontWeight: 700, color: T.amber, fontFamily: T.fontMono, fontSize: 11 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* VCS Sidebar */}
              <div style={{ flex: 1, minWidth: 230 }}>
                {/* Article 6 / CA */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 3 }}>Article 6 / CA Status</div>
                  <div style={{ fontSize: 10, color: T.blue, fontFamily: T.fontMono, marginBottom: 10 }}>VCS Standard v4 §3.8.5 — Corresponding Adjustment</div>
                  {[
                    ['Art.6 Status', selProject.artSixStatus],
                    ['CA Required',  ARTICLE6_CA_COUNTRIES.includes(selProject.country) || ARTICLE6_PENDING_COUNTRIES.includes(selProject.country) ? 'Yes' : 'No'],
                    ['CA System',    ARTICLE6_CA_COUNTRIES.includes(selProject.country) ? 'In Place' : ARTICLE6_PENDING_COUNTRIES.includes(selProject.country) ? 'Pending' : 'Not established'],
                    ['DC Risk',      selProject.artSixStatus === 'Corresponding Adjustment Applied' ? 'Cleared' : 'Monitor'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                      <span style={{ color: T.textSec }}>{k}</span>
                      <span style={{ color: T.navy, fontWeight: 600, fontFamily: T.fontMono, fontSize: 10 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* VCS Score Gauge */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>VCS Score — {selProject.id}</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: selProject.complianceScores.vcs >= 80 ? T.green : selProject.complianceScores.vcs >= 60 ? T.amber : T.red, fontFamily: T.fontMono, letterSpacing: -1 }}>{selProject.complianceScores.vcs}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 8 }}>/ 100 compliance score</div>
                  <div style={{ height: 6, background: T.borderL, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${selProject.complianceScores.vcs}%`, background: selProject.complianceScores.vcs >= 80 ? T.green : T.amber }} />
                  </div>
                </div>

                {/* Checklist completion */}
                {(() => {
                  const passed = VCS_REQUIREMENTS.filter((_, ri) => vcsPassFn(selProject, ri)).length;
                  const pct    = VCS_REQUIREMENTS.length > 0 ? Math.round(passed / VCS_REQUIREMENTS.length * 100) : 0;
                  return (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>VCS Checklist</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                        <span style={{ color: T.textSec }}>Completion</span>
                        <span style={{ fontWeight: 700, color: pct >= 80 ? T.green : T.amber, fontFamily: T.fontMono }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: T.borderL, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: 8, borderRadius: 4, width: `${pct}%`, background: pct >= 80 ? T.green : T.amber }} />
                      </div>
                      <div style={{ fontSize: 10, color: T.textSec, marginTop: 5, fontFamily: T.fontMono }}>{passed}/{VCS_REQUIREMENTS.length} met</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4 — CAR & ACR                                                 */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 4 && (
          <div>
            <SectionHeader
              title="CAR & ACR — US Voluntary Carbon Market"
              sub="Climate Action Reserve | American Carbon Registry | CARB Approved Offset Protocols"
            />
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {/* CAR */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 3 }}>Climate Action Reserve (CAR)</div>
                  <div style={{ fontSize: 10, color: T.blue, fontFamily: T.fontMono, marginBottom: 12 }}>CAR Offset Project Registry · CRT units · CARB-approved protocols</div>
                  {[
                    { label: 'Eligible project type per CAR protocol',         ref: 'CAR Protocol Requirements' },
                    { label: 'Project listed on CAR registry',                 ref: 'CAR Registry Listing Procedure' },
                    { label: 'Third-party verifier (CARB-approved list)',      ref: 'CAR Verification Requirements' },
                    { label: 'Offset Project Listing (OPL) publicly available',ref: 'CAR Transparency Policy' },
                    { label: 'Annual monitoring report submitted',             ref: 'CAR Monitoring Requirements' },
                    { label: 'Verification completed (every 1–3 years)',       ref: 'CAR Verification Frequency' },
                    { label: 'CARB approval obtained for ARB compliance offsets', ref: 'CARB §95971 (Cal. Code Regs.)' },
                  ].map((req, ri) => <ReqRow key={ri} req={req} passed={sr(ri * 19 + 5) > 0.30} />)}
                </div>

                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>CAR Protocols Supported</div>
                  {CAR_PROTOCOLS.map((proto, pi) => (
                    <div key={proto.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ fontSize: 11, color: T.textPri }}>{proto.name}</span>
                      {proto.carbApproved
                        ? <Badge label="CARB Approved" color={T.green} bg="#f0fdf4" />
                        : <Badge label="Pending" color={T.amber} bg="#fffbeb" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ACR */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 3 }}>American Carbon Registry (ACR)</div>
                  <div style={{ fontSize: 10, color: T.blue, fontFamily: T.fontMono, marginBottom: 12 }}>ACR Standard v8 · ACER units · ACR-approved VVBs</div>
                  {ACR_REQUIREMENTS.map((req, ri) => <ReqRow key={req.id} req={req} passed={sr(ri * 23 + 7) > 0.25} />)}
                </div>

                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>CARB Approved Protocols (CA Compliance)</div>
                  {['Urban Forest Protocol', 'Livestock Protocol', 'ODS Protocol', 'US Forest Protocol', 'Rice Cultivation Protocol'].map((proto, pi) => (
                    <div key={proto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ fontSize: 11, color: T.textPri }}>{proto}</span>
                      <Badge
                        label={pi <= 3 ? 'CARB Approved' : 'Under Review'}
                        color={pi <= 3 ? T.green : T.amber}
                        bg={pi <= 3 ? '#f0fdf4' : '#fffbeb'}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Project CAR/ACR status table */}
              <div style={{ flex: 1, minWidth: 250 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto', maxHeight: 520 }}>
                  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono, position: 'sticky', top: 0, background: T.card }}>
                    PROJECT CAR / ACR STATUS
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: T.sub }}>
                        {['ID', 'CAR', 'ACR', 'CARB'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PROJECTS.map((p, idx) => (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                          <td style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: T.navy, fontFamily: T.fontMono }}>{p.id}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}><span style={{ color: p.complianceScores.car >= 70 ? T.green : T.amber, fontSize: 13, fontWeight: 700 }}>{p.complianceScores.car >= 70 ? '✓' : '⚠'}</span></td>
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}><span style={{ color: p.complianceScores.acr >= 70 ? T.green : T.amber, fontSize: 13, fontWeight: 700 }}>{p.complianceScores.acr >= 70 ? '✓' : '⚠'}</span></td>
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}><span style={{ color: idx % 3 === 0 ? T.green : T.textSec, fontSize: 13 }}>{idx % 3 === 0 ? '✓' : '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5 — CORSIA                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 5 && (
          <div>
            <SectionHeader
              title="CORSIA — Aviation Offset Compliance"
              sub="ICAO CORSIA | Annex 16 Volume IV | CORSIA Eligible Emissions Units (EEU) | 2021–2035"
            />
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
              {/* Eligibility Criteria */}
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 3 }}>CORSIA Eligibility Criteria (SARPs)</div>
                  <div style={{ fontSize: 10, color: T.blue, fontFamily: T.fontMono, marginBottom: 12 }}>Annex 16 Volume IV — all 7 criteria must be satisfied for EEU status</div>
                  {[
                    { label: 'Real — quantified with specified level of confidence',      ref: 'CORSIA SARPs §3.6.2(a)' },
                    { label: 'Additional — beyond business-as-usual',                     ref: 'CORSIA SARPs §3.6.2(b)' },
                    { label: 'Quantified — using an approved methodology',                ref: 'CORSIA SARPs §3.6.2(c)' },
                    { label: 'Permanent — or non-permanence risk addressed',              ref: 'CORSIA SARPs §3.6.2(d)' },
                    { label: 'Verified — by CORSIA-approved verification body',          ref: 'CORSIA SARPs §3.6.2(e)' },
                    { label: 'Unique — registered, serialized, no double counting',      ref: 'CORSIA SARPs §3.6.2(f)' },
                    { label: 'Acceptable to ICAO — listed as CORSIA EEU',               ref: 'ICAO CORSIA EEU Approved List' },
                  ].map((req, ri) => <ReqRow key={ri} req={req} passed={sr(ri * 31 + 9) > 0.15} />)}
                </div>

                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Eligible Standards 2024–2035</div>
                  {CORSIA_ELIGIBLE_STANDARDS.map(s => (
                    <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.textPri }}>{s.name}</div>
                        <div style={{ fontSize: 9, color: T.textSec, fontFamily: T.fontMono }}>{s.phase}</div>
                      </div>
                      <Badge label={s.status} color={s.status === 'Approved' ? T.green : T.amber} bg={s.status === 'Approved' ? '#f0fdf4' : '#fffbeb'} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Context */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>CORSIA Market Context</div>
                  {[
                    ['Aviation Demand Peak',       '~160M tCO₂e/yr (2027–2035)'],
                    ['CORSIA Premium',             '+$3–7/tCO₂e vs non-eligible'],
                    ['Eligible in Portfolio',      `${PROJECTS.filter(p => p.corsiaEligible).length}/${PROJECTS.length} projects`],
                    ['Pilot Phase',                '2021–2023 (voluntary)'],
                    ['Phase 1',                    '2024–2026 (voluntary)'],
                    ['Phase 2',                    '2027–2035 (mandatory >threshold)'],
                    ['Certification Body',         'ICAO-approved DOEs / VVBs'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{k}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* KPIs */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <KpiCard label="CORSIA Eligible" value={PROJECTS.filter(p => p.corsiaEligible).length} sub="of 50 projects" color={T.teal} />
                  <KpiCard label="Non-Eligible"    value={PROJECTS.filter(p => !p.corsiaEligible).length} sub="of 50 projects" color={T.textSec} />
                </div>
              </div>
            </div>

            {/* CORSIA eligibility table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                CORSIA EEU ELIGIBILITY — {PROJECTS.filter(p => p.corsiaEligible).length} ELIGIBLE PROJECTS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Project', 'Country', 'Type', 'CORSIA Score', 'Status', 'Phase', 'Unit Type', 'Premium'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROJECTS.filter(p => p.corsiaEligible).map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '5px 10px', fontWeight: 600, color: T.navy, fontFamily: T.fontMono }}>{p.id}</td>
                      <td style={{ padding: '5px 10px' }}>{p.country}</td>
                      <td style={{ padding: '5px 10px', fontFamily: T.fontMono, fontSize: 10 }}>{p.type}</td>
                      <td style={{ padding: '5px 10px' }}><ScoreBadge score={p.complianceScores.corsia} /></td>
                      <td style={{ padding: '5px 10px' }}><Badge label="EEU" color={T.green} bg="#f0fdf4" /></td>
                      <td style={{ padding: '5px 10px', fontSize: 10, color: T.textSec }}>2024–2035</td>
                      <td style={{ padding: '5px 10px', fontFamily: T.fontMono, fontSize: 10 }}>
                        {p.registries.includes('VCS') ? 'VCU-CORSIA' : p.registries.includes('GS') ? 'GS-CORSIA' : 'ACR-CORSIA'}
                      </td>
                      <td style={{ padding: '5px 10px', color: T.green, fontFamily: T.fontMono, fontWeight: 700 }}>+$3–7</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 6 — ICVCM / CCP                                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 6 && (
          <div>
            <SectionHeader
              title="ICVCM Core Carbon Principles (CCP)"
              sub="ICVCM Core Carbon Principles v2 | Assessment Framework v2.0 | High-Integrity Carbon Markets"
            />
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div><div style={lbl}>Select Project</div>
                <select style={sel} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                  {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {/* CCP Assessment */}
              <div style={{ flex: 2, minWidth: 340 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 3 }}>CCP Assessment — {selProject.id}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 14 }}>
                    Pass threshold: all 10 principles ≥7/10 &nbsp;·&nbsp; CCP Premium: +$15–25/tCO₂e &nbsp;·&nbsp; ICVCM Assessment Framework v2.0
                  </div>
                  {CCP_PRINCIPLES.map((principle, pi) => {
                    const score = Math.round(5 + sr(selProject.id.charCodeAt(4) * 7 + pi * 11 + 4) * 5);
                    const pass  = score >= 7;
                    return (
                      <div key={principle.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, minWidth: 18, fontWeight: 700 }}>{principle.id}.</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: T.textPri, fontWeight: 500 }}>{principle.label}</div>
                          <div style={{ fontSize: 9, color: T.blue, fontFamily: T.fontMono, marginTop: 1 }}>Category: {principle.cat}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 64, height: 6, background: T.borderL, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${score * 10}%`, height: 6, borderRadius: 3, background: pass ? T.green : T.red }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: pass ? T.green : T.red, fontFamily: T.fontMono, minWidth: 32 }}>{score}/10</span>
                          <span style={{ fontSize: 13, color: pass ? T.green : T.red, fontWeight: 700 }}>{pass ? '✓' : '✗'}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* CCP verdict */}
                  {(() => {
                    const scores   = CCP_PRINCIPLES.map((_, pi) => Math.round(5 + sr(selProject.id.charCodeAt(4) * 7 + pi * 11 + 4) * 5));
                    const allPass  = scores.every(s => s >= 7);
                    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';
                    const passCount = scores.filter(s => s >= 7).length;
                    return (
                      <div style={{ marginTop: 14, padding: '12px 16px', background: allPass ? '#f0fdf4' : '#fef2f2', borderRadius: 6, border: `1px solid ${allPass ? '#86efac' : '#fca5a5'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: allPass ? T.green : T.red }}>
                              CCP Label: {allPass ? 'ELIGIBLE ✓' : 'NOT ELIGIBLE ✗'}
                            </div>
                            <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>
                              Avg score {avgScore}/10 &nbsp;·&nbsp; {passCount}/10 principles passing
                            </div>
                          </div>
                          {allPass && <Badge label="CCP Labeled" color={T.green} bg="#dcfce7" />}
                        </div>
                        {allPass && <div style={{ fontSize: 10, color: T.green, marginTop: 6, fontFamily: T.fontMono }}>Premium applicable: +$15–25/tCO₂e vs unlabeled units</div>}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Portfolio CCP sidebar */}
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Portfolio CCP Summary</div>
                  {[
                    ['CCP Labeled',     `${PROJECTS.filter(p => p.ccpLabel === 'Y').length}/50`],
                    ['CCP Eligible %',  `${Math.round(PROJECTS.filter(p => p.ccpLabel === 'Y').length / 50 * 100)}%`],
                    ['Premium Range',   '+$15–25/tCO₂e'],
                    ['Framework',       'ICVCM AF v2.0'],
                    ['Label Renewal',   'Every 3 years'],
                    ['Attribute Type',  'Governance | Tracking | Transparency | V&V | Add. | Perm. | Quant. | DC | SDG | NNH'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{k}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.navy }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto', maxHeight: 380 }}>
                  <div style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono, position: 'sticky', top: 0, background: T.card }}>
                    CCP STATUS — ALL 50 PROJECTS
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead><tr style={{ background: T.sub }}>{['Project', 'Label', 'Score'].map(h => <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {[...PROJECTS].sort((a, b) => (b.ccpLabel === 'Y' ? 1 : 0) - (a.ccpLabel === 'Y' ? 1 : 0)).map((p, idx) => (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                          <td style={{ padding: '4px 8px', fontWeight: 600, color: T.navy, fontFamily: T.fontMono, fontSize: 11 }}>{p.id}</td>
                          <td style={{ padding: '4px 8px' }}><Badge label={p.ccpLabel} color={p.ccpLabel === 'Y' ? T.green : T.textSec} bg={p.ccpLabel === 'Y' ? '#f0fdf4' : '#f9fafb'} /></td>
                          <td style={{ padding: '4px 8px' }}><ScoreBadge score={p.complianceScores.gs} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 7 — Article 6 & Double Counting Prevention                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 7 && (
          <div>
            <SectionHeader
              title="Article 6 & Double Counting Prevention"
              sub="Paris Agreement Article 6 | UNFCCC CMA3 Decision | Corresponding Adjustments | ITMOs"
            />
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
              {/* Framework */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Article 6 Framework</div>
                  {[
                    { art: 'Art. 6.2', label: 'Cooperative approaches / ITMOs (Internationally Transferred Mitigation Outcomes)', ref: 'PA Art.6.2 | CMA3 Decision §3' },
                    { art: 'Art. 6.4', label: 'New UN-supervised mechanism — replacing CDM (Decision 3/CMA.3)', ref: 'PA Art.6.4 | Decision 3/CMA.3' },
                    { art: 'Art. 6.8', label: 'Non-market approaches (NMAs) — capacity building, technology transfer', ref: 'PA Art.6.8 | CMA3 §8' },
                  ].map(item => (
                    <div key={item.art} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                        <Badge label={item.art} color={T.indigo} bg="#eef2ff" />
                        <span style={{ fontSize: 12, color: T.textPri, fontWeight: 500, lineHeight: 1.4 }}>{item.label}</span>
                      </div>
                      <div style={{ fontSize: 10, color: T.blue, fontFamily: T.fontMono }}>{item.ref}</div>
                    </div>
                  ))}
                </div>

                {/* DC Prevention Checklist */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Double Counting Prevention Checklist</div>
                  {[
                    { label: 'Project registered in one registry only',         ref: 'VCS Standard v4 §3.8 | ICVCM CCP #8' },
                    { label: 'Serial number uniqueness verified across registries', ref: 'Registry cross-check procedure' },
                    { label: 'Host country CA applied (Art.6.2 exports)',       ref: 'PA Art.6.2 | CMA3 §5' },
                    { label: 'No overlap with national NDC accounting boundary', ref: 'NDC ambiguity risk assessment' },
                    { label: 'Vintage within NDC period: CA required',          ref: 'CMA3 Decision §7.3' },
                  ].map((req, ri) => <ReqRow key={ri} req={req} passed={sr(ri * 37 + 11) > 0.20} />)}
                </div>
              </div>

              {/* CA Country Status */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 3 }}>CA Country Status</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 10 }}>Art.6.2 bilateral agreements establishing CA systems</div>
                  {[
                    ...ARTICLE6_CA_COUNTRIES.map(c => ({ country: c, status: 'CA System in Place', color: T.green, bg: '#f0fdf4' })),
                    ...ARTICLE6_PENDING_COUNTRIES.map(c => ({ country: c, status: 'CA System Pending', color: T.amber, bg: '#fffbeb' })),
                    ...['Brazil', 'Kenya', 'India', 'Vietnam', 'Ethiopia'].map(c => ({ country: c, status: 'No CA System', color: T.red, bg: '#fef2f2' })),
                  ].map(item => (
                    <div key={item.country} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{item.country}</span>
                      <Badge label={item.status} color={item.color} bg={item.bg} />
                    </div>
                  ))}
                </div>

                {/* NDC Ambiguity Risks */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>NDC Ambiguity Risk</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 10 }}>Countries where NDC scope overlaps with common project types</div>
                  {[
                    { country: 'Brazil',     risk: 'High',   note: 'REDD+ overlap with national NDC forest target' },
                    { country: 'Indonesia',  risk: 'High',   note: 'Forestry & peat projects within NDC boundary' },
                    { country: 'India',      risk: 'Medium', note: 'RE projects may fall within sectoral NDC' },
                    { country: 'Colombia',   risk: 'Medium', note: 'Agriculture NDC scope partially overlapping' },
                    { country: 'Kenya',      risk: 'Low',    note: 'Economy-wide NDC — low ambiguity for project types' },
                  ].map(item => (
                    <div key={item.country} style={{ padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{item.country}</span>
                        <Badge label={`${item.risk} Risk`} color={item.risk === 'High' ? T.red : item.risk === 'Medium' ? T.amber : T.green} bg={item.risk === 'High' ? '#fef2f2' : item.risk === 'Medium' ? '#fffbeb' : '#f0fdf4'} />
                      </div>
                      <div style={{ fontSize: 10, color: T.textSec }}>{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Art.6 / CA Assessment Table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                PROJECT ART.6 / CA RISK ASSESSMENT — ALL 50 PROJECTS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Project', 'Country', 'Art.6 Status', 'CA Required', 'CA System', 'Buyer Risk', 'Use Type'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROJECTS.map((p, idx) => {
                    const caRequired = ARTICLE6_CA_COUNTRIES.includes(p.country) || ARTICLE6_PENDING_COUNTRIES.includes(p.country);
                    const caSystem   = ARTICLE6_CA_COUNTRIES.includes(p.country) ? 'In Place' : ARTICLE6_PENDING_COUNTRIES.includes(p.country) ? 'Pending' : 'Not established';
                    const riskLevel  = caRequired && caSystem !== 'In Place' ? 'High' : caRequired ? 'Medium' : 'Low';
                    const useType    = p.artSixStatus === 'Corresponding Adjustment Applied' ? 'Compliance' : 'Voluntary Only';
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 10px', fontWeight: 600, color: T.navy, fontFamily: T.fontMono }}>{p.id}</td>
                        <td style={{ padding: '5px 10px' }}>{p.country}</td>
                        <td style={{ padding: '5px 10px', fontSize: 10, color: T.textSec }}>{p.artSixStatus}</td>
                        <td style={{ padding: '5px 10px' }}><span style={{ color: caRequired ? T.amber : T.textSec, fontWeight: 600 }}>{caRequired ? 'Yes' : 'No'}</span></td>
                        <td style={{ padding: '5px 10px' }}><Badge label={caSystem} color={caSystem === 'In Place' ? T.green : caSystem === 'Pending' ? T.amber : T.textSec} /></td>
                        <td style={{ padding: '5px 10px' }}>
                          <Badge label={riskLevel} color={riskLevel === 'High' ? T.red : riskLevel === 'Medium' ? T.amber : T.green} bg={riskLevel === 'High' ? '#fef2f2' : riskLevel === 'Medium' ? '#fffbeb' : '#f0fdf4'} />
                        </td>
                        <td style={{ padding: '5px 10px' }}>
                          <Badge label={useType} color={useType === 'Compliance' ? T.indigo : T.textSec} bg={useType === 'Compliance' ? '#eef2ff' : '#f9fafb'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Registry cross-reference footer */}
            <div style={{ marginTop: 12, padding: '10px 14px', background: T.sub, borderRadius: 6, border: `1px solid ${T.borderL}`, fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>
              REGISTRY CROSS-REFERENCE &nbsp;|&nbsp; CDM: cdm.unfccc.int/Projects &nbsp;|&nbsp; Gold Standard: registry.goldstandard.org &nbsp;|&nbsp; Verra: registry.verra.org &nbsp;|&nbsp; CAR: thereserve2.apx.com &nbsp;|&nbsp; ACR: acrcarbon.org
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
