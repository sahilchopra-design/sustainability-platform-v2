import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic hash simulation (hex chars from sr())
// ─────────────────────────────────────────────────────────────────────────────
const HEX = '0123456789abcdef';
const simHash = (seed, len = 16) => Array.from({ length: len }, (_, i) => HEX[Math.floor(sr(seed * 31 + i * 7) * 16)]).join('');

// ─────────────────────────────────────────────────────────────────────────────
// Reference data
// ─────────────────────────────────────────────────────────────────────────────
const PROJECT_NAMES = [
  'Madre de Dios REDD+', 'Borneo Peat Restoration', 'Kenya Cookstoves', 'Gujarat Solar Array',
  'Amazon Buffer Forest', 'Mekong Blue Carbon', 'Colombian Methane Capture', 'Ghana Reforestation',
  'Vietnam Clean Cook', 'Peru Agroforestry', 'Sumatra Peat Forest', 'Tanzania Wind Farm',
  'Ethiopia Clean Energy', 'Philippines Mangrove', 'Malaysia Biomass CHP', 'Uganda Biogas',
  'Cambodia REDD+ JIRP', 'Mexico Rangeland', 'Indonesia Smallholder', 'Brazil Native Vegetation',
  'Costa Rica PES', 'Senegal Savanna', 'South Africa Landfill Gas', 'Zimbabwe Solar',
  'Mozambique Cook Stoves', 'Rwanda Afforestation', 'Malawi Cookstoves', 'Nepal Biogas',
  'Bangladesh EE Buildings', 'Sri Lanka Wind',
];

const EVENT_TYPES = [
  'CALCULATION_CREATED', 'DATA_SUBMITTED', 'VALIDATION_STARTED', 'CAR_RAISED',
  'CAR_RESOLVED', 'VERIFICATION_COMPLETED', 'ISSUANCE_APPROVED', 'METHODOLOGY_UPDATE',
  'PARAMETER_AMENDED', 'REPORT_GENERATED',
];

const EVENT_SEVERITIES = ['INFO', 'NOTICE', 'WARNING', 'CRITICAL'];

const USERS = [
  'j.smith@verifier.com', 'a.patel@vcs.org', 'k.nguyen@gs.org', 'r.osei@cdm.un.org',
  'm.garcia@rina.it', 'l.chen@dnvgl.com', 's.kim@tuvsud.com', 'f.mwangi@sgsa.com',
];

const VVB_NAMES = ['SGS SA', 'DNV GL', 'Bureau Veritas', 'TÜV SÜD', 'RINA Services', 'Afri-Cert', 'ACM International', 'SCS Global Services'];

const METHODOLOGIES = ['VM0007 REDD+', 'VM0010 Improved Cook', 'VM0015 Methane Capture', 'AMS-I.D Solar', 'AMS-III.R REDD', 'ACM0002 Grid', 'GS-TPDDTEC', 'ACR-AF'];

const REG_REFS = [
  'CDM Standard v8 §9', 'ISO 14064-3:2019 §6.7', 'VCS Standard v4 §4.2',
  'GS4GG Verification §6', 'CDM V&V Standard v1 §5', 'CORSIA SARPs §3.6.2',
  'ACR Standard v8 §3', 'CAR Verification Requirements',
];

const ISO_REFS = [
  'ISO 14064-3:2019 §6.3', 'ISO 14064-3:2019 §6.7.2', 'ISO 14064-3:2019 §6.7.3',
  'ISO 14064-1:2018 §8', 'ISO 14065:2020 §7', 'ISO 14064-3:2019 §5.4',
];

const CALC_VERSIONS = ['1.0.0', '1.0.1', '1.0.2', '1.1.0', '1.1.1', '1.2.0', '2.0.0', '2.0.1'];

// ─────────────────────────────────────────────────────────────────────────────
// Generate 600 audit events (30 projects × 20 events)
// ─────────────────────────────────────────────────────────────────────────────
const AUDIT_EVENTS = [];
let eventCounter = 0;
for (let pi = 0; pi < 30; pi++) {
  const projName = PROJECT_NAMES[pi];
  const projId   = `PRJ-${String(pi + 1).padStart(3, '0')}`;
  let prevHash   = simHash(pi * 1000, 8);

  for (let ei = 0; ei < 20; ei++) {
    const globalIdx  = pi * 20 + ei;
    const eventType  = EVENT_TYPES[ei % EVENT_TYPES.length];
    const severity   = EVENT_SEVERITIES[Math.floor(sr(globalIdx * 7 + 2) * 4)];
    const vvbSigned  = eventType === 'VERIFICATION_COMPLETED' || eventType === 'ISSUANCE_APPROVED' || sr(globalIdx * 11) > 0.6;
    const inputHash  = simHash(globalIdx * 53 + 1, 8);
    const outputHash = simHash(globalIdx * 67 + 3, 8);
    const daysAgo    = Math.floor(sr(globalIdx * 13 + 4) * 180);
    const erResult   = Math.round(500 + sr(globalIdx * 19 + 5) * 45000);
    const calcVer    = CALC_VERSIONS[Math.floor(sr(globalIdx * 23 + 6) * CALC_VERSIONS.length)];
    const user       = USERS[Math.floor(sr(globalIdx * 29 + 7) * USERS.length)];
    const regRef     = REG_REFS[Math.floor(sr(globalIdx * 31 + 8) * REG_REFS.length)];
    const isoRef     = ISO_REFS[Math.floor(sr(globalIdx * 37 + 9) * ISO_REFS.length)];
    const methodology = METHODOLOGIES[pi % METHODOLOGIES.length];

    const ts = new Date(Date.now() - daysAgo * 86400000);
    const tsStr = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(ts.getDate()).padStart(2,'0')} ${String(ts.getHours()).padStart(2,'0')}:${String(ts.getMinutes()).padStart(2,'0')} UTC`;

    const descMap = {
      CALCULATION_CREATED:   `Emission reduction calculation v${calcVer} created for ${methodology}`,
      DATA_SUBMITTED:        `Monitoring data submitted for verification period ${ts.getFullYear()}-Q${Math.floor(ts.getMonth()/3)+1}`,
      VALIDATION_STARTED:    `Validation initiated by ${VVB_NAMES[pi % VVB_NAMES.length]} — PDD review commenced`,
      CAR_RAISED:            `Corrective Action Required: ${severity === 'CRITICAL' ? 'Major' : 'Minor'} non-conformance in monitoring plan`,
      CAR_RESOLVED:          `CAR-${String(globalIdx).padStart(4,'0')} resolved — supporting documentation accepted by VVB`,
      VERIFICATION_COMPLETED:`Verification opinion issued: ${sr(globalIdx * 41) > 0.8 ? 'Qualified Positive' : 'Positive'} by ${VVB_NAMES[pi % VVB_NAMES.length]}`,
      ISSUANCE_APPROVED:     `CU issuance approved: ${erResult.toLocaleString()} tCO₂e — serial assigned`,
      METHODOLOGY_UPDATE:    `Methodology updated to v${calcVer} — re-assessment of baseline parameters`,
      PARAMETER_AMENDED:     `Parameter amendment: baseline emission factor revised per IPCC AR6 Table 2.2`,
      REPORT_GENERATED:      `Monitoring report generated — ${ts.getFullYear()} annual compliance submission`,
    };

    AUDIT_EVENTS.push({
      eventId:          `#${simHash(globalIdx * 41 + 10, 7)}`,
      projectId:        projId,
      projectName:      projName,
      eventType,
      severity,
      description:      descMap[eventType] || 'Audit event recorded',
      user,
      timestamp:        tsStr,
      daysAgo,
      calculationVersion: calcVer,
      inputHash,
      outputHash,
      parentHash:       prevHash,
      vvbSigned,
      regRef,
      isoRef,
      erResult,
      methodology,
      vvb:              VVB_NAMES[pi % VVB_NAMES.length],
    });

    prevHash = simHash(globalIdx * 43 + 11, 8);
    eventCounter++;
  }
}

// Pre-sorted by recency
const EVENTS_BY_DATE = [...AUDIT_EVENTS].sort((a, b) => a.daysAgo - b.daysAgo);

// CAR events
const CAR_EVENTS = AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RAISED' || e.eventType === 'CAR_RESOLVED');

// VVB verification events
const VERIF_EVENTS = AUDIT_EVENTS.filter(e => e.eventType === 'VERIFICATION_COMPLETED');

// Unique projects
const UNIQUE_PROJECTS = PROJECT_NAMES.map((name, i) => ({
  id: `PRJ-${String(i+1).padStart(3,'0')}`,
  name,
  methodology: METHODOLOGIES[i % METHODOLOGIES.length],
  vvb: VVB_NAMES[i % VVB_NAMES.length],
  country: ['Brazil','Indonesia','Kenya','India','Colombia','Ghana','Peru','Vietnam','Cambodia','Tanzania','Mexico','Ethiopia','Philippines','Malaysia','Uganda','Uganda','Cambodia','Mexico','Indonesia','Brazil','Costa Rica','Senegal','South Africa','Zimbabwe','Mozambique','Rwanda','Malawi','Nepal','Bangladesh','Sri Lanka'][i],
}));

const CAR_ROOT_CAUSES = ['Data quality', 'Methodology application', 'Monitoring equipment', 'Calculation error', 'Documentation gap'];
const CHANGE_TYPES    = ['Minor', 'Standard', 'Major'];

const EQUIPMENT = Array.from({ length: 12 }, (_, i) => ({
  id:          `EQP-${String(i+1).padStart(3,'0')}`,
  type:        ['Flow meter', 'Gas analyser', 'Power meter', 'Temperature sensor', 'GPS unit', 'Data logger'][i % 6],
  manufacturer:['ABB', 'Emerson', 'Siemens', 'Endress+Hauser', 'Yokogawa', 'Honeywell'][i % 6],
  model:       `Model-${String(Math.round(100 + sr(i * 71) * 900)).padStart(4,'0')}`,
  lastCal:     `${2024 + (i % 2)}-${String(1 + Math.floor(sr(i*13)*11)).padStart(2,'0')}-${String(1+Math.floor(sr(i*17)*27)).padStart(2,'0')}`,
  nextCal:     `${2025 + (i % 2)}-${String(1 + Math.floor(sr(i*19)*11)).padStart(2,'0')}-${String(1+Math.floor(sr(i*23)*27)).padStart(2,'0')}`,
  calLab:      ['SGS Calibration Lab (NABL/ISO 17025)', 'TÜV SÜD Calibration (ISO 17025)', 'Bureau Veritas Cal. (ISO 17025)', 'Intertek (ISO 17025 Accredited)'][i % 4],
  certRef:     `CAL-${simHash(i*97+1, 6).toUpperCase()}`,
  status:      sr(i*29) > 0.15 ? 'Calibrated' : 'Due for calibration',
}));

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
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function SeverityBadge({ sev }) {
  const map = {
    CRITICAL: { color: T.red,    bg: '#fef2f2' },
    WARNING:  { color: T.amber,  bg: '#fffbeb' },
    NOTICE:   { color: T.blue,   bg: '#eff6ff' },
    INFO:     { color: T.textSec, bg: T.sub    },
  };
  const s = map[sev] || map.INFO;
  return <Badge label={sev} color={s.color} bg={s.bg} />;
}

function EventTypeBadge({ et }) {
  const colorMap = {
    CALCULATION_CREATED:  { c: T.indigo, bg: '#eef2ff' },
    DATA_SUBMITTED:       { c: T.blue,   bg: '#eff6ff' },
    VALIDATION_STARTED:   { c: T.teal,   bg: '#f0fdfa' },
    CAR_RAISED:           { c: T.red,    bg: '#fef2f2' },
    CAR_RESOLVED:         { c: T.green,  bg: '#f0fdf4' },
    VERIFICATION_COMPLETED:{ c: T.sage,  bg: '#f1f5f3' },
    ISSUANCE_APPROVED:    { c: T.green,  bg: '#f0fdf4' },
    METHODOLOGY_UPDATE:   { c: T.purple, bg: '#faf5ff' },
    PARAMETER_AMENDED:    { c: T.amber,  bg: '#fffbeb' },
    REPORT_GENERATED:     { c: T.navy,   bg: '#f0f4ff' },
  };
  const s = colorMap[et] || { c: T.textSec, bg: T.sub };
  return <Badge label={et.replace(/_/g, ' ')} color={s.c} bg={s.bg} />;
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

export default function CarbonCreditAuditTrailPage() {
  const [tab, setTab]                     = useState(0);
  const [calcPage, setCalcPage]           = useState(0);
  const [filterProject, setFilterProject] = useState('All');
  const [filterEvtType, setFilterEvtType] = useState('All');
  const [filterVVB, setFilterVVB]         = useState('All');
  const [selectedProject, setSelectedProject] = useState(UNIQUE_PROJECTS[0].id);
  const [selectedSubmitProj, setSelectedSubmitProj] = useState(UNIQUE_PROJECTS[0].id);
  const PAGE_SIZE = 20;

  const TABS = [
    'Audit Command Center', 'Calculation Log', 'Data Provenance',
    'VVB Findings', 'CARs & Corrective Actions', 'Version Control',
    'Monitoring Report', 'Regulatory Submissions',
  ];

  const selProj = useMemo(() => UNIQUE_PROJECTS.find(p => p.id === selectedProject) || UNIQUE_PROJECTS[0], [selectedProject]);
  const selSubmitProj = useMemo(() => UNIQUE_PROJECTS.find(p => p.id === selectedSubmitProj) || UNIQUE_PROJECTS[0], [selectedSubmitProj]);

  // Filtered events for Calc Log tab
  const filteredEvents = useMemo(() => {
    return EVENTS_BY_DATE.filter(e =>
      (filterProject === 'All' || e.projectId === filterProject) &&
      (filterEvtType === 'All' || e.eventType === filterEvtType)
    );
  }, [filterProject, filterEvtType]);

  const calcPageEvents = useMemo(() => {
    const start = calcPage * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, calcPage]);

  const totalCalcPages = Math.ceil(filteredEvents.length / PAGE_SIZE);

  // Stats for Audit Command Center
  const cmdKpis = useMemo(() => {
    const openCARs    = AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RAISED').length - AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RESOLVED').length;
    const p0Findings  = AUDIT_EVENTS.filter(e => e.severity === 'CRITICAL').length;
    const verifCoverage = Math.round(VERIF_EVENTS.length / 30 * 100);
    const today       = EVENTS_BY_DATE.filter(e => e.daysAgo === 0).length;
    const avgRes      = Math.round(AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RESOLVED').reduce((s, e) => s + Math.floor(sr(e.projectId.charCodeAt(4) * 7) * 14 + 3), 0) / Math.max(1, AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RESOLVED').length));
    return { total: 600, openCARs: Math.max(0, openCARs), p0Findings, verifCoverage, today, avgRes };
  }, []);

  const sel = { fontSize: 12, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, background: T.card, color: T.textPri, fontFamily: T.fontMono };
  const lbl = { fontSize: 10, color: T.textSec, fontFamily: T.fontMono, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.6 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '16px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 20, color: T.gold }}>🔒</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>
            Carbon Credit Audit Trail — ISO 14064-3:2019 Immutable Record System
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: T.fontMono }}>
          ISO 14064-3:2019 | CDM V&V Standard v1 | GS4GG Verification | VCS Standard v4 | CORSIA SARPs | 600 audit events · 30 projects
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 28px', display: 'flex', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '12px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 400,
            color: tab === i ? T.indigo : T.textSec, background: 'none', border: 'none',
            borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 0 — Audit Command Center                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 0 && (
          <div>
            <SectionHeader
              title="Audit Command Center"
              sub="ISO 14064-3:2019 — Verification of GHG Assertions | CDM Validation & Verification Standard v1"
            />

            {/* Integrity Banner */}
            <div style={{ background: '#f0fdf4', border: `1px solid #86efac`, borderRadius: 6, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, color: T.green }}>🔗</span>
              <div>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, color: T.green }}>AUDIT CHAIN INTEGRITY: VERIFIED ✓</span>
                <span style={{ fontSize: 11, color: T.textSec, marginLeft: 12 }}>
                  Compliant with ISO 14064-3:2019 §6.7 — Documentation and records | 600 events | Chain: intact
                </span>
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <KpiCard label="Total Events"        value={cmdKpis.total.toLocaleString()} sub="ISO 14064-3 §6.7" color={T.navy}   />
              <KpiCard label="Open CARs"           value={cmdKpis.openCARs}   sub="Corrective actions"  color={T.red}    />
              <KpiCard label="P0 Findings"         value={cmdKpis.p0Findings} sub="Critical severity"   color={T.red}    />
              <KpiCard label="Verification Cover." value={`${cmdKpis.verifCoverage}%`} sub="Projects verified" color={T.green}  />
              <KpiCard label="Events Today"        value={cmdKpis.today}      sub="UTC 00:00–23:59"     color={T.teal}   />
              <KpiCard label="Avg Resolution"      value={`${cmdKpis.avgRes}d`} sub="CAR close time"    color={T.amber}  />
            </div>

            {/* Recent Activity Feed */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>RECENT ACTIVITY FEED — LAST 25 EVENTS</span>
                <span style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>ISO 14064-3:2019 §6.7 — Immutable record</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Timestamp', 'Hash', 'Project', 'Event Type', 'Severity', 'User', 'VVB Signed', 'Description'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVENTS_BY_DATE.slice(0, 25).map((ev, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '5px 10px', fontFamily: T.fontMono, fontSize: 10, color: T.textSec, whiteSpace: 'nowrap' }}>{ev.timestamp}</td>
                      <td style={{ padding: '5px 10px', fontFamily: T.fontMono, fontSize: 10, color: T.indigo }}>{ev.eventId}</td>
                      <td style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{ev.projectName.slice(0, 18)}</td>
                      <td style={{ padding: '5px 10px' }}><EventTypeBadge et={ev.eventType} /></td>
                      <td style={{ padding: '5px 10px' }}><SeverityBadge sev={ev.severity} /></td>
                      <td style={{ padding: '5px 10px', fontFamily: T.fontMono, fontSize: 10, color: T.textSec }}>{ev.user.split('@')[0]}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                        <span style={{ color: ev.vvbSigned ? T.green : T.textSec, fontSize: 13 }}>{ev.vvbSigned ? '✓' : '—'}</span>
                      </td>
                      <td style={{ padding: '5px 10px', fontSize: 10, color: T.textSec, maxWidth: 260 }}>{ev.description.slice(0, 55)}{ev.description.length > 55 ? '…' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note */}
            <div style={{ marginTop: 10, fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>
              Each event carries: eventId (SHA-256 prefix) · parentHash chain · inputHash · outputHash · ISO ref · regulatory ref · VVB signature status
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1 — Calculation Audit Log                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 1 && (
          <div>
            <SectionHeader
              title="Calculation Audit Log"
              sub="ISO 14064-3:2019 §6.7.2 | CDM Standard v8 §9 — Records and archiving"
            />

            {/* Hash chain explanation */}
            <div style={{ background: '#eff6ff', border: `1px solid #bfdbfe`, borderRadius: 6, padding: '10px 16px', marginBottom: 18, fontSize: 11, color: T.blue, fontFamily: T.fontMono }}>
              🔗 Each calculation result is cryptographically linked via parent_hash chain. Any tampering invalidates the chain. | ISO 14064-3:2019 §6.7.3
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
              <div><div style={lbl}>Project</div>
                <select style={sel} value={filterProject} onChange={e => { setFilterProject(e.target.value); setCalcPage(0); }}>
                  <option value="All">All</option>
                  {UNIQUE_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
              <div><div style={lbl}>Event Type</div>
                <select style={sel} value={filterEvtType} onChange={e => { setFilterEvtType(e.target.value); setCalcPage(0); }}>
                  <option value="All">All</option>
                  {EVENT_TYPES.map(et => <option key={et} value={et}>{et.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, paddingBottom: 2 }}>
                  {filteredEvents.length} events · Page {calcPage + 1}/{totalCalcPages}
                </div>
              </div>
            </div>

            {/* Log Table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Event ID', 'Timestamp', 'Project', 'Calc Ver.', 'Methodology', 'Input Hash', 'Output Hash', 'Parent Hash', 'ER (tCO₂e)', 'User', 'VVB Signed', 'Reg Ref'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 8px', fontSize: 9, color: T.textSec, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calcPageEvents.map((ev, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '4px 8px', fontFamily: T.fontMono, color: T.indigo, fontWeight: 700, fontSize: 10 }}>{ev.eventId}</td>
                      <td style={{ padding: '4px 8px', fontFamily: T.fontMono, fontSize: 9, color: T.textSec, whiteSpace: 'nowrap' }}>{ev.timestamp.slice(0, 16)}</td>
                      <td style={{ padding: '4px 8px', fontSize: 10, fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{ev.projectId}</td>
                      <td style={{ padding: '4px 8px', fontFamily: T.fontMono, color: T.purple }}>{ev.calculationVersion}</td>
                      <td style={{ padding: '4px 8px', fontSize: 9, color: T.textSec }}>{ev.methodology}</td>
                      <td style={{ padding: '4px 8px', fontFamily: T.fontMono, fontSize: 9, color: T.teal }}>{ev.inputHash}…</td>
                      <td style={{ padding: '4px 8px', fontFamily: T.fontMono, fontSize: 9, color: T.sage }}>{ev.outputHash}…</td>
                      <td style={{ padding: '4px 8px', fontFamily: T.fontMono, fontSize: 9, color: T.textSec }}>{ev.parentHash}…</td>
                      <td style={{ padding: '4px 8px', fontFamily: T.fontMono, textAlign: 'right' }}>{ev.erResult.toLocaleString()}</td>
                      <td style={{ padding: '4px 8px', fontSize: 9, color: T.textSec }}>{ev.user.split('@')[0]}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <span style={{ color: ev.vvbSigned ? T.green : T.textSec, fontSize: 12 }}>{ev.vvbSigned ? '✓' : '—'}</span>
                      </td>
                      <td style={{ padding: '4px 8px', fontSize: 9, color: T.blue, fontFamily: T.fontMono, maxWidth: 150 }}>{ev.regRef.slice(0, 24)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setCalcPage(Math.max(0, calcPage - 1))} disabled={calcPage === 0} style={{ padding: '4px 12px', fontSize: 11, background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, cursor: calcPage === 0 ? 'not-allowed' : 'pointer', color: calcPage === 0 ? T.textSec : T.navy, fontFamily: T.fontMono }}>← Prev</button>
              {Array.from({ length: Math.min(10, totalCalcPages) }, (_, i) => {
                const pg = calcPage < 6 ? i : Math.max(0, calcPage - 4) + i;
                if (pg >= totalCalcPages) return null;
                return (
                  <button key={pg} onClick={() => setCalcPage(pg)} style={{ padding: '4px 10px', fontSize: 11, background: pg === calcPage ? T.navy : T.card, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', color: pg === calcPage ? '#fff' : T.navy, fontFamily: T.fontMono, fontWeight: pg === calcPage ? 700 : 400 }}>{pg + 1}</button>
                );
              })}
              <button onClick={() => setCalcPage(Math.min(totalCalcPages - 1, calcPage + 1))} disabled={calcPage >= totalCalcPages - 1} style={{ padding: '4px 12px', fontSize: 11, background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, cursor: calcPage >= totalCalcPages - 1 ? 'not-allowed' : 'pointer', color: calcPage >= totalCalcPages - 1 ? T.textSec : T.navy, fontFamily: T.fontMono }}>Next →</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2 — Data Provenance                                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 2 && (
          <div>
            <SectionHeader
              title="Data Provenance"
              sub="ISO 14064-3:2019 §6.3 — Level of assurance and materiality | Data lineage chain"
            />
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div><div style={lbl}>Select Project</div>
                <select style={sel} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                  {UNIQUE_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Data Lineage for 5 key parameters */}
            {['Activity Data (energy consumed)', 'Emission Factor (grid)', 'Baseline Emissions', 'Project Emissions', 'Net GHG Benefit'].map((param, pi) => {
              const steps = [
                { step: 'Raw Source', party: 'Project Operator', doc: `Field measurement log FML-${String(pi+1).padStart(3,'0')}`, iso: 'ISO 14064-3:2019 §6.3.1', method: 'Direct measurement / meter reading' },
                { step: 'Data Collection', party: `${selProj.vvb} (Data QA)`, doc: 'Data collection form DCF-v4', iso: 'ISO 14064-3:2019 §6.3.2', method: 'Secondary review + cross-check' },
                { step: 'QA/QC Check', party: 'MRV Officer', doc: `QA report QAR-${String(pi*7+3).padStart(4,'0')}`, iso: 'ISO 14064-3:2019 §6.3.3', method: 'Statistical outlier analysis' },
                { step: 'Data Storage', party: 'Registry System', doc: 'Encrypted database — AES-256', iso: 'ISO 14064-3:2019 §6.7', method: 'Hash-verified storage' },
                { step: 'Calc. Input', party: 'Calculation Engine', doc: `calc-v${CALC_VERSIONS[pi % CALC_VERSIONS.length]}`, iso: 'ISO 14064-3:2019 §6.3.4', method: 'Validated formula per methodology' },
                { step: 'Final ER', party: 'VVB Verification', doc: `VVB opinion VVO-${String(pi+1).padStart(3,'0')}`, iso: 'ISO 14064-3:2019 §6.7.2', method: 'Independent verification' },
              ];
              return (
                <div key={param} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>
                    Parameter {pi+1}: {param}
                    <span style={{ fontSize: 10, color: T.blue, fontFamily: T.fontMono, marginLeft: 10 }}>ISO 14064-3:2019 §6.3</span>
                  </div>
                  <div style={{ display: 'flex', gap: 0, overflowX: 'auto', alignItems: 'stretch' }}>
                    {steps.map((s, si) => (
                      <div key={si} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 4, padding: '8px 10px', minWidth: 130, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.navy, marginBottom: 3 }}>{s.step}</div>
                          <div style={{ fontSize: 9, color: T.textSec, marginBottom: 2 }}>{s.party}</div>
                          <div style={{ fontSize: 9, color: T.blue, fontFamily: T.fontMono, marginBottom: 2 }}>{s.iso}</div>
                          <div style={{ fontSize: 9, color: T.textSec }}>{s.doc}</div>
                        </div>
                        {si < steps.length - 1 && <span style={{ fontSize: 16, color: T.textSec, margin: '0 4px', fontWeight: 700 }}>→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Equipment Calibration Registry */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, marginTop: 20, overflow: 'auto' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                EQUIPMENT CALIBRATION REGISTRY — ISO 17025 ACCREDITED LABORATORIES
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Equip ID', 'Type', 'Manufacturer', 'Model', 'Last Cal.', 'Next Due', 'Cal. Lab', 'Cert Ref', 'Status'].map(h => (
                      <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EQUIPMENT.map((eq, idx) => (
                    <tr key={eq.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{eq.id}</td>
                      <td style={{ padding: '5px 8px' }}>{eq.type}</td>
                      <td style={{ padding: '5px 8px' }}>{eq.manufacturer}</td>
                      <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 10 }}>{eq.model}</td>
                      <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 10 }}>{eq.lastCal}</td>
                      <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 10 }}>{eq.nextCal}</td>
                      <td style={{ padding: '5px 8px', fontSize: 10, color: T.textSec }}>{eq.calLab}</td>
                      <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 10, color: T.blue }}>{eq.certRef}</td>
                      <td style={{ padding: '5px 8px' }}>
                        <Badge label={eq.status} color={eq.status === 'Calibrated' ? T.green : T.amber} bg={eq.status === 'Calibrated' ? '#f0fdf4' : '#fffbeb'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3 — VVB Verification Findings                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 3 && (
          <div>
            <SectionHeader
              title="VVB Verification Findings"
              sub="CDM Validation & Verification Standard v1 §5 | Gold Standard Verification Protocol | ISO 14065:2020"
            />

            {/* VVB Accreditation Panel */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>VVB Accreditation Register</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 10 }}>CDM Designated Operational Entities (DOE) | GS & VCS Approved VVBs | ISO 14065:2020</div>
                  {VVB_NAMES.map((vvb, vi) => (
                    <div key={vvb} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.navy }}>{vvb}</div>
                        <div style={{ fontSize: 9, color: T.blue, fontFamily: T.fontMono }}>
                          {['CDM DOE', 'GS VVB', 'VCS VVB', 'ACR VVB', 'CAR VVB', 'CORSIA VVB'].slice(0, 2 + vi % 3).join(' · ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>
                          Exp: {2025 + (vi % 3)}-{String(1+Math.floor(sr(vi*7)*11)).padStart(2,'0')}-30
                        </div>
                        <Badge label="ISO 14065:2020" color={T.green} bg="#f0fdf4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finding type definitions */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Finding Type Definitions</div>
                  {[
                    { type: 'CAR', full: 'Corrective Action Required', def: 'Material non-conformance — must be resolved before verification opinion issued', ref: 'CDM V&V Standard v1 §5.3', color: T.red },
                    { type: 'CL', full: 'Clarification Request', def: 'Additional information required — response due within 15 business days', ref: 'CDM V&V Standard v1 §5.4', color: T.amber },
                    { type: 'FAR', full: 'Forward Action Request', def: 'No immediate action required — monitor and report in next verification period', ref: 'CDM V&V Standard v1 §5.5', color: T.blue },
                  ].map(item => (
                    <div key={item.type} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                        <Badge label={item.type} color={item.color} bg={item.color === T.red ? '#fef2f2' : item.color === T.amber ? '#fffbeb' : '#eff6ff'} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{item.full}</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textSec, marginBottom: 2 }}>{item.def}</div>
                      <div style={{ fontSize: 10, color: T.blue, fontFamily: T.fontMono }}>{item.ref}</div>
                    </div>
                  ))}

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Verification Opinion Types</div>
                    {[
                      { icon: '✓', label: 'Positive Verification Opinion', note: 'No material misstatement — credits issuable', color: T.green },
                      { icon: '⚠', label: 'Qualified Positive Opinion', note: 'Minor qualification noted — conditions apply', color: T.amber },
                      { icon: '✗', label: 'Adverse Opinion', note: 'Material misstatement found — credits not issuable', color: T.red },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0' }}>
                        <span style={{ color: item.color, fontSize: 14, fontWeight: 700 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: item.color }}>{item.label}</div>
                          <div style={{ fontSize: 10, color: T.textSec }}>{item.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Log */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                VERIFICATION LOG — {VERIF_EVENTS.length} COMPLETED VERIFICATIONS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Verif #', 'Project', 'VVB', 'Period', 'Site Visit', 'CARs Raised', 'CARs Closed', 'CLs', 'FARs', 'Opinion'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VERIF_EVENTS.map((ev, idx) => {
                    const carsRaised = Math.floor(sr(idx * 37 + 7) * 5);
                    const carsClosed = carsRaised > 0 ? Math.max(0, carsRaised - Math.floor(sr(idx * 41) * 2)) : 0;
                    const cls        = Math.floor(sr(idx * 43 + 9) * 3);
                    const fars       = Math.floor(sr(idx * 47 + 11) * 4);
                    const opinion    = sr(idx * 53) > 0.85 ? 'Qualified Positive' : 'Positive';
                    return (
                      <tr key={idx} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 10px', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>VRF-{String(idx+1).padStart(4,'0')}</td>
                        <td style={{ padding: '5px 10px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{ev.projectName.slice(0, 16)}</td>
                        <td style={{ padding: '5px 10px', fontSize: 10 }}>{ev.vvb}</td>
                        <td style={{ padding: '5px 10px', fontFamily: T.fontMono, fontSize: 10, color: T.textSec }}>2023–2024</td>
                        <td style={{ padding: '5px 10px', textAlign: 'center' }}><span style={{ color: T.green, fontSize: 13 }}>✓</span></td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', color: carsRaised > 0 ? T.red : T.green, fontFamily: T.fontMono, fontWeight: 700 }}>{carsRaised}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', color: carsClosed === carsRaised ? T.green : T.amber, fontFamily: T.fontMono }}>{carsClosed}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', color: T.amber, fontFamily: T.fontMono }}>{cls}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', color: T.blue, fontFamily: T.fontMono }}>{fars}</td>
                        <td style={{ padding: '5px 10px' }}>
                          <Badge label={opinion} color={opinion === 'Positive' ? T.green : T.amber} bg={opinion === 'Positive' ? '#f0fdf4' : '#fffbeb'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4 — CARs & Corrective Actions                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 4 && (
          <div>
            <SectionHeader
              title="CARs & Corrective Actions Register"
              sub="CDM Standard §5 | GS4GG Verification §6 | ISO 14064-3:2019 §6.7"
            />

            {/* SLA Info */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Major CAR SLA', value: 'Before opinion', color: T.red    },
                { label: 'Minor CAR SLA', value: 'Next period',    color: T.amber  },
                { label: 'CL Response',  value: '15 business days', color: T.blue },
                { label: 'FAR Action',   value: 'Next period',    color: T.teal   },
              ].map(item => (
                <div key={item.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>{item.label}:</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: T.fontMono }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* CAR Register Table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto', marginBottom: 20 }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                CAR REGISTER — {CAR_EVENTS.length} TOTAL (OPEN & CLOSED)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['CAR ID', 'Project', 'Raised By', 'Date Raised', 'Severity', 'Standard Ref', 'Root Cause', 'Status', 'Days Open', 'Closure VVB'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 8px', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RAISED').map((ev, idx) => {
                    const isResolved  = idx % 3 !== 0;
                    const severity    = idx % 4 === 0 ? 'Major' : 'Minor';
                    const rootCause   = CAR_ROOT_CAUSES[idx % CAR_ROOT_CAUSES.length];
                    const daysOpen    = isResolved ? Math.round(3 + sr(idx * 7) * 12) : Math.round(5 + sr(idx * 11) * 60);
                    const overdue     = !isResolved && daysOpen > 30;
                    return (
                      <tr key={idx} style={{ borderBottom: `1px solid ${T.borderL}`, background: overdue ? '#fef2f2' : idx % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontWeight: 700, color: T.red }}>CAR-{String(idx+1).padStart(4,'0')}</td>
                        <td style={{ padding: '5px 8px', fontSize: 11, color: T.navy, fontWeight: 600 }}>{ev.projectName.slice(0, 14)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10, color: T.textSec }}>{ev.vvb.slice(0, 10)}</td>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 10, color: T.textSec }}>{ev.timestamp.slice(0, 10)}</td>
                        <td style={{ padding: '5px 8px' }}>
                          <Badge label={severity} color={severity === 'Major' ? T.red : T.amber} bg={severity === 'Major' ? '#fef2f2' : '#fffbeb'} />
                        </td>
                        <td style={{ padding: '5px 8px', fontSize: 9, color: T.blue, fontFamily: T.fontMono }}>{ev.regRef.slice(0, 22)}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10, color: T.textSec }}>{rootCause}</td>
                        <td style={{ padding: '5px 8px' }}>
                          <Badge label={isResolved ? 'Closed' : 'Open'} color={isResolved ? T.green : overdue ? T.red : T.amber} bg={isResolved ? '#f0fdf4' : overdue ? '#fef2f2' : '#fffbeb'} />
                        </td>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, color: overdue ? T.red : T.textPri, fontWeight: overdue ? 700 : 400 }}>{daysOpen}{overdue ? ' ⚠' : ''}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10, color: T.textSec }}>{isResolved ? ev.vvb.slice(0, 10) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Priority Matrix */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>CAR Priority Matrix — Severity × Age</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {['0–7 days', '8–14 days', '15–30 days', '>30 days'].map((age, ai) => (
                  ['Major', 'Minor'].map((sev, si) => {
                    const count = AUDIT_EVENTS.filter(e => e.eventType === 'CAR_RAISED').filter((_, i) => {
                      const severity = i % 4 === 0 ? 'Major' : 'Minor';
                      const daysOpen = Math.round(5 + sr(i * 11) * 60);
                      const ageGroup = daysOpen <= 7 ? 0 : daysOpen <= 14 ? 1 : daysOpen <= 30 ? 2 : 3;
                      return severity === sev && ageGroup === ai && i % 3 !== 0;
                    }).length;
                    const bg = ai >= 2 && sev === 'Major' ? '#fef2f2' : ai >= 3 ? '#fffbeb' : T.sub;
                    return (
                      <div key={`${age}-${sev}`} style={{ background: bg, borderRadius: 4, padding: '8px 10px', border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 9, color: T.textSec, fontFamily: T.fontMono }}>{sev} · {age}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: ai >= 2 && sev === 'Major' ? T.red : ai >= 3 ? T.amber : T.navy, marginTop: 2 }}>{count}</div>
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5 — Version Control & Amendments                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 5 && (
          <div>
            <SectionHeader
              title="Version Control & Amendment Registry"
              sub="CDM Standard v8 §9.4 — Changes to registered PDDs | VCS Standard v4 §4.5 | ISO 14064-3:2019 §6.7.3"
            />

            {/* Integrity note */}
            <div style={{ background: '#eff6ff', border: `1px solid #bfdbfe`, borderRadius: 6, padding: '10px 16px', marginBottom: 18, fontSize: 11, color: T.blue, fontFamily: T.fontMono }}>
              All amendments fully auditable per ISO 14064-3:2019 §6.7.3 — Version history is immutable once committed
            </div>

            {/* PDD Amendment Log */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto', marginBottom: 20 }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                PDD AMENDMENT LOG
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Version', 'Date', 'Section Changed', 'Old Value', 'New Value', 'Change Type', 'Justification', 'DOE Review', 'EB/Verra Approval', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 8px', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 15 }, (_, i) => {
                    const changeType = CHANGE_TYPES[Math.floor(sr(i * 19 + 3) * CHANGE_TYPES.length)];
                    const section    = ['§3 Additionality', '§4 Baseline', '§5 Quantification', '§6 Monitoring Plan', '§7 Environmental Analysis'][i % 5];
                    const doeRequired = changeType !== 'Minor';
                    const ebRequired  = changeType === 'Major';
                    const status      = sr(i * 23 + 7) > 0.2 ? 'Approved' : 'Pending';
                    const recalc      = changeType === 'Major' || (changeType === 'Standard' && sr(i * 29) > 0.6);
                    const erDiff      = recalc ? Math.round((sr(i * 31) - 0.5) * 2000) : 0;
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontWeight: 700, color: T.purple }}>v{CALC_VERSIONS[i % CALC_VERSIONS.length]}</td>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 10, color: T.textSec }}>2024-{String(1 + i).padStart(2,'0')}-15</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{section}</td>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 9, color: T.red }}>v{i}.{Math.floor(sr(i*7)*9)}</td>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 9, color: T.green }}>v{i}.{Math.floor(sr(i*7)*9)+1}</td>
                        <td style={{ padding: '5px 8px' }}>
                          <Badge label={changeType} color={changeType === 'Major' ? T.red : changeType === 'Standard' ? T.amber : T.teal} bg={changeType === 'Major' ? '#fef2f2' : changeType === 'Standard' ? '#fffbeb' : '#f0fdfa'} />
                        </td>
                        <td style={{ padding: '5px 8px', fontSize: 10, color: T.textSec }}>
                          {changeType === 'Major' ? 'Methodology revision per IPCC AR6' : changeType === 'Standard' ? 'Baseline parameter update' : 'Typographical correction'}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}><span style={{ color: doeRequired ? T.amber : T.textSec, fontSize: 13 }}>{doeRequired ? '✓' : '—'}</span></td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}><span style={{ color: ebRequired ? T.amber : T.textSec, fontSize: 13 }}>{ebRequired ? '✓' : '—'}</span></td>
                        <td style={{ padding: '5px 8px' }}>
                          <Badge label={status} color={status === 'Approved' ? T.green : T.amber} bg={status === 'Approved' ? '#f0fdf4' : '#fffbeb'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculation Version Registry */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                CALCULATION VERSION REGISTRY — SOFTWARE RELEASES
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Version', 'Release Date', 'Change Type', 'Changes', 'Backward Compat.', 'Recalc Required', 'ER Impact (tCO₂e)', 'Financial Impact'].map(h => (
                      <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CALC_VERSIONS.map((ver, vi) => {
                    const changeType = vi === 0 ? 'Initial' : vi % 3 === 0 ? 'New Methodology' : vi % 2 === 0 ? 'Enhancement' : 'Bug Fix';
                    const backComp   = changeType !== 'New Methodology';
                    const recalcReq  = !backComp;
                    const erImpact   = recalcReq ? Math.round((sr(vi * 37) - 0.5) * 3000) : 0;
                    return (
                      <tr key={ver} style={{ borderBottom: `1px solid ${T.borderL}`, background: vi % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontWeight: 700, color: T.purple }}>v{ver}</td>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 10 }}>2024-{String(1+vi*1).padStart(2,'0')}-01</td>
                        <td style={{ padding: '5px 8px' }}><Badge label={changeType} color={changeType === 'New Methodology' ? T.red : changeType === 'Enhancement' ? T.blue : changeType === 'Bug Fix' ? T.amber : T.textSec} /></td>
                        <td style={{ padding: '5px 8px', fontSize: 10, color: T.textSec }}>
                          {changeType === 'New Methodology' ? 'VM0015 v2.0 integrated — revised methane GWP' : changeType === 'Enhancement' ? 'Improved uncertainty bounds per IPCC AR6' : changeType === 'Bug Fix' ? 'Leakage calculation correction per VCS §3.6' : 'Initial release'}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}><span style={{ color: backComp ? T.green : T.red, fontSize: 13 }}>{backComp ? '✓' : '✗'}</span></td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}><span style={{ color: recalcReq ? T.red : T.textSec, fontSize: 13 }}>{recalcReq ? '✓' : '—'}</span></td>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, color: erImpact > 0 ? T.green : erImpact < 0 ? T.red : T.textSec, fontWeight: erImpact !== 0 ? 700 : 400 }}>
                          {erImpact !== 0 ? `${erImpact > 0 ? '+' : ''}${erImpact.toLocaleString()}` : '—'}
                        </td>
                        <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 10, color: erImpact !== 0 ? T.amber : T.textSec }}>
                          {erImpact !== 0 ? `${erImpact > 0 ? '+' : ''}$${Math.abs(erImpact * 12).toLocaleString()} (@ $12/t)` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 6 — Monitoring Report Generator                                */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 6 && (
          <div>
            <SectionHeader
              title="Monitoring Report Generator"
              sub="CDM Monitoring Report v3 | GS MRV Report | VCS Monitoring Report template | ISO 14064-1:2018 §8"
            />
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div><div style={lbl}>Select Project</div>
                <select style={sel} value={selectedSubmitProj} onChange={e => setSelectedSubmitProj(e.target.value)}>
                  {UNIQUE_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Report Preview */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '20px 24px' }}>
              {/* Report Header */}
              <div style={{ background: T.navy, color: '#fff', borderRadius: 4, padding: '12px 16px', marginBottom: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>MONITORING REPORT — {selSubmitProj.name}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: T.fontMono, marginTop: 3 }}>
                  {selSubmitProj.id} | Monitoring Period: 2024-01-01 – 2024-12-31 | v1.0 | CDM Standard v2 §4
                </div>
              </div>

              {/* Section A */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, paddingBottom: 4, marginBottom: 10 }}>
                  SECTION A — Project & Methodology
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    ['Project Name',     selSubmitProj.name],
                    ['Project ID',       selSubmitProj.id],
                    ['Registry Ref',     `CDM-${selSubmitProj.id}-2020-PROJ`],
                    ['Methodology',      selSubmitProj.methodology],
                    ['Country',          selSubmitProj.country],
                    ['VVB',              selSubmitProj.vvb],
                    ['Monitoring Period','2024-01-01 – 2024-12-31'],
                    ['Crediting Period', '2021-2031 (7 years)'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: T.sub, borderRadius: 4, padding: '6px 10px' }}>
                      <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{k}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section B */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, paddingBottom: 4, marginBottom: 10 }}>
                  SECTION B — Monitoring Results
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: T.sub }}>{['Parameter', 'Unit', 'Planned', 'Actual', 'DQ Score', 'Comments'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      ['Fuel consumption displaced', 'GJ', '12,400', '11,892', '92', 'Within ±5% tolerance'],
                      ['Grid emission factor',        'tCO₂/MWh', '0.712', '0.695', '95', 'UNFCCC approved factor'],
                      ['Activity data (energy)',      'MWh', '8,340', '8,127', '88', 'Meter calibration current'],
                      ['Leakage deduction',           'tCO₂e', '1,240', '1,187', '90', 'Market leakage per §3.6'],
                      ['Buffer pool deduction',       'tCO₂e', '2,100', '2,100', '100', 'Non-permanence risk tool'],
                    ].map(([param, unit, planned, actual, dq, comment]) => {
                      const dqN = parseInt(dq);
                      return (
                        <tr key={param} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                          <td style={{ padding: '5px 8px', fontWeight: 500 }}>{param}</td>
                          <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontSize: 10, color: T.textSec }}>{unit}</td>
                          <td style={{ padding: '5px 8px', fontFamily: T.fontMono }}>{planned}</td>
                          <td style={{ padding: '5px 8px', fontFamily: T.fontMono, fontWeight: 700 }}>{actual}</td>
                          <td style={{ padding: '5px 8px' }}><span style={{ color: dqN >= 90 ? T.green : dqN >= 80 ? T.amber : T.red, fontFamily: T.fontMono, fontWeight: 700 }}>{dq}</span></td>
                          <td style={{ padding: '5px 8px', fontSize: 10, color: T.textSec }}>{comment}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Section C */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, paddingBottom: 4, marginBottom: 10 }}>
                  SECTION C — Calculation of Emission Reductions
                </div>
                <div style={{ background: T.sub, borderRadius: 4, padding: '12px 14px', fontFamily: T.fontMono, fontSize: 11, color: T.textPri, marginBottom: 10 }}>
                  <div style={{ color: T.textSec, marginBottom: 4 }}>ER_y = (BE_y − PE_y − LE_y) × (1 − BufferPool_y)</div>
                  <div style={{ color: T.textSec, marginBottom: 8 }}>Where: BE = Baseline Emissions · PE = Project Emissions · LE = Leakage · BufferPool = Non-permanence deduction</div>
                  <div style={{ color: T.green, fontWeight: 700 }}>ER_2024 = (18,450 − 8,127 − 1,187) × (1 − 0.15)</div>
                  <div style={{ color: T.green, fontWeight: 700 }}>ER_2024 = 9,136 × 0.85 = <span style={{ fontSize: 14 }}>7,766 tCO₂e</span></div>
                </div>
                <div style={{ fontSize: 10, color: T.textSec }}>
                  Uncertainty assessment: ±5.2% at 95% confidence (ISO 14064-1:2018 §7 — conservative estimate applied per VCS §3.2)
                </div>
              </div>

              {/* Section D */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.gold}`, paddingBottom: 4, marginBottom: 10 }}>
                  SECTION D — Compliance with Monitoring Plan
                </div>
                {[
                  { item: 'Deviations from monitoring plan', value: 'None', color: T.green },
                  { item: 'Equipment failures/replacements', value: '1 data logger replaced Q2 2024 — documented in EQP register', color: T.amber },
                  { item: 'Data gaps treatment',             value: 'Conservative substitution per CDM §9.3 applied for 3-day gap', color: T.amber },
                  { item: 'Sampling frequency compliance',  value: '100% — daily readings from automated meters', color: T.green },
                ].map(item => (
                  <div key={item.item} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, alignItems: 'flex-start' }}>
                    <span style={{ color: item.color, fontSize: 13, flexShrink: 0, marginTop: 1 }}>●</span>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.textPri }}>{item.item}: </span>
                      <span style={{ fontSize: 11, color: T.textSec }}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Report Metadata */}
              <div style={{ background: T.sub, borderRadius: 4, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.navy, marginBottom: 6, fontFamily: T.fontMono }}>REPORT METADATA</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11 }}>
                  {[['Preparer', USERS[0]], ['Date', '2025-01-31'], ['Version', 'v1.0'], ['Standard', 'CDM Monitoring Report v3'], ['Next Verification', '2025-Q3']].map(([k, v]) => (
                    <div key={k}><span style={{ color: T.textSec }}>{k}: </span><span style={{ fontWeight: 600, color: T.navy, fontFamily: T.fontMono }}>{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 7 — Regulatory Submission Tracker                              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 7 && (
          <div>
            <SectionHeader
              title="Regulatory Submission Tracker"
              sub="UNFCCC CDM | Gold Standard | Verra Registry | CARB | ICAO CORSIA"
            />

            {/* Upcoming Deadlines */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 20, overflow: 'auto' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                UPCOMING DEADLINES — NEXT 6 MONTHS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Project', 'Deadline Type', 'Due Date', 'Days Remaining', 'Responsible', 'Prep Status'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {UNIQUE_PROJECTS.slice(0, 12).map((p, idx) => {
                    const daysRem   = Math.round(1 + sr(idx * 43 + 17) * 180);
                    const deadlineTypes = ['Annual monitoring report', 'Verification period end', 'Crediting period renewal', 'Issuance request', 'PDD amendment'];
                    const dlType    = deadlineTypes[idx % deadlineTypes.length];
                    const prepStatus = sr(idx * 47 + 19) > 0.6 ? 'On Track' : sr(idx * 47 + 19) > 0.3 ? 'In Progress' : 'Not Started';
                    const rowBg     = daysRem < 14 ? '#fef2f2' : daysRem < 30 ? '#fffbeb' : T.card;
                    const daysColor = daysRem < 14 ? T.red : daysRem < 30 ? T.amber : T.green;
                    const dueDate   = new Date(Date.now() + daysRem * 86400000);
                    const dueDateStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth()+1).padStart(2,'0')}-${String(dueDate.getDate()).padStart(2,'0')}`;
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: rowBg }}>
                        <td style={{ padding: '5px 10px', fontWeight: 600, color: T.navy }}>{p.name.slice(0, 20)}</td>
                        <td style={{ padding: '5px 10px', fontSize: 11 }}>{dlType}</td>
                        <td style={{ padding: '5px 10px', fontFamily: T.fontMono, fontSize: 10 }}>{dueDateStr}</td>
                        <td style={{ padding: '5px 10px' }}>
                          <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: daysColor }}>{daysRem}d</span>
                          <span style={{ fontSize: 10, color: daysColor, marginLeft: 4 }}>{daysRem < 14 ? '🔴' : daysRem < 30 ? '🟡' : '🟢'}</span>
                        </td>
                        <td style={{ padding: '5px 10px', fontSize: 10, color: T.textSec }}>MRV Officer</td>
                        <td style={{ padding: '5px 10px' }}>
                          <Badge label={prepStatus} color={prepStatus === 'On Track' ? T.green : prepStatus === 'In Progress' ? T.amber : T.red} bg={prepStatus === 'On Track' ? '#f0fdf4' : prepStatus === 'In Progress' ? '#fffbeb' : '#fef2f2'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Submission Log */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'auto', marginBottom: 20 }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>
                SUBMISSION LOG — REGULATORY SUBMISSIONS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Submission #', 'Date', 'Project', 'Type', 'Registry', 'Reference', 'Status', 'Decision Date', 'Decision', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {UNIQUE_PROJECTS.map((p, idx) => {
                    const types    = ['New registration', 'Issuance request', 'PDD amendment', 'Crediting period renewal', 'Voluntary cancellation'];
                    const registries = ['UNFCCC CDM', 'Verra Registry', 'Gold Standard Registry', 'CAR Registry', 'ACR Registry'];
                    const statuses = ['Approved', 'Under Review', 'Approved', 'Pending', 'Approved'];
                    const subType  = types[idx % types.length];
                    const registry = registries[idx % registries.length];
                    const status   = statuses[idx % statuses.length];
                    const daysAgo  = Math.floor(sr(idx * 53 + 23) * 120);
                    const decDate  = new Date(Date.now() - (daysAgo - 14) * 86400000);
                    const decDateStr = `${decDate.getFullYear()}-${String(decDate.getMonth()+1).padStart(2,'0')}-${String(decDate.getDate()).padStart(2,'0')}`;
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '4px 8px', fontFamily: T.fontMono, fontWeight: 700, color: T.indigo, fontSize: 10 }}>SUB-{String(idx+1).padStart(4,'0')}</td>
                        <td style={{ padding: '4px 8px', fontFamily: T.fontMono, fontSize: 9, color: T.textSec }}>2024-{String(1+Math.floor(sr(idx*7)*11)).padStart(2,'0')}-15</td>
                        <td style={{ padding: '4px 8px', fontWeight: 600, color: T.navy, fontSize: 10 }}>{p.id}</td>
                        <td style={{ padding: '4px 8px', fontSize: 10 }}>{subType}</td>
                        <td style={{ padding: '4px 8px', fontSize: 10, color: T.textSec }}>{registry}</td>
                        <td style={{ padding: '4px 8px', fontFamily: T.fontMono, fontSize: 9, color: T.blue }}>{simHash(idx * 97 + 31, 6).toUpperCase()}</td>
                        <td style={{ padding: '4px 8px' }}>
                          <Badge label={status} color={status === 'Approved' ? T.green : status === 'Under Review' ? T.blue : T.amber} bg={status === 'Approved' ? '#f0fdf4' : status === 'Under Review' ? '#eff6ff' : '#fffbeb'} />
                        </td>
                        <td style={{ padding: '4px 8px', fontFamily: T.fontMono, fontSize: 9, color: T.textSec }}>{status !== 'Pending' ? decDateStr : '—'}</td>
                        <td style={{ padding: '4px 8px', fontSize: 10, color: status === 'Approved' ? T.green : T.textSec }}>{status === 'Approved' ? 'Accepted' : status === 'Under Review' ? 'In progress' : 'Awaiting review'}</td>
                        <td style={{ padding: '4px 8px', fontSize: 9, color: T.textSec }}>{subType === 'Issuance request' ? `${Math.round(1000 + sr(idx*59)*20000).toLocaleString()} tCO₂e` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Registry Cross-Reference */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Registry Cross-Reference</div>
              {[
                { name: 'CDM Registry (UNFCCC)',    url: 'cdm.unfccc.int/Projects',        color: T.blue  },
                { name: 'Gold Standard Registry',   url: 'registry.goldstandard.org',      color: T.gold  },
                { name: 'Verra Registry',           url: 'registry.verra.org',             color: T.teal  },
                { name: 'CAR Registry',             url: 'thereserve2.apx.com',            color: T.green },
                { name: 'ACR Registry',             url: 'acrcarbon.org',                  color: T.sage  },
              ].map(reg => (
                <div key={reg.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{reg.name}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, color: reg.color, fontWeight: 600 }}>{reg.url}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>
                All registries implement serial number uniqueness checks per ICVCM CCP #2 (Tracking) and VCS Standard v4 §3.8 (No double counting)
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
