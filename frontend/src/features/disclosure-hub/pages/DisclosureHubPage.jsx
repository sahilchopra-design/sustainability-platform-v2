import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  LineChart, Line, PieChart, Pie,
} from 'recharts';

/* ================================================================= THEME */
const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7',
  border: '#e5e0d8', borderL: '#d5cfc5',
  navy: '#1b3a5c', navyL: '#2c5a8c',
  gold: '#c5a96a', goldL: '#d4be8a',
  sage: '#5a8a6a', sageL: '#7ba67d',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  card: '0 1px 4px rgba(27,58,92,0.06)',
  cardH: '0 4px 16px rgba(27,58,92,0.1)',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

/* ================================================================= SHARED COMPONENTS */
const Card = ({ children, style = {} }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: '18px 20px', boxShadow: T.card, ...style,
  }}>
    {children}
  </div>
);

const KPICard = ({ label, value, sub, color = T.navy }) => (
  <Card style={{ textAlign: 'center', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut, marginTop: 3 }}>{sub}</div>}
  </Card>
);

const Badge = ({ label, color = T.navy, bg }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11,
    fontWeight: 600, color, background: bg || `${color}18`, border: `1px solid ${color}30`,
  }}>{label}</span>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{children}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const severityColor = (s) => ({ Critical: T.red, High: T.amber, Medium: T.navyL, Low: T.sage }[s] || T.textMut);
const statusColor = (s) => ({ Active: T.green, Upcoming: T.amber, 'Under Review': T.navyL }[s] || T.textMut);

/* ================================================================= STATIC DATA */

/* --- Tab 1 --- */
const FRAMEWORKS = [
  { code: 'EP-AH1', name: 'CSRD ESRS', status: 'Active', score: 78, nextDeadline: 'Q1 2025 (FY2024)', keyMetric: '82 ESRS data points collected', color: '#2c5a8c' },
  { code: 'EP-AH2', name: 'SFDR v2', status: 'Under Review', score: 71, nextDeadline: 'Jan 2026 (Level 2 RTS)', keyMetric: '62 PAI indicators tracked', color: '#5a8a6a' },
  { code: 'EP-AH3', name: 'ISSB S1/S2', status: 'Active', score: 80, nextDeadline: 'FY2025 annual report', keyMetric: 'TCFD alignment 100%', color: '#c5a96a' },
  { code: 'EP-AH4', name: 'UK SDR', status: 'Active', score: 69, nextDeadline: 'July 2024 (labels)', keyMetric: '4 labels assessed', color: '#7c3aed' },
  { code: 'EP-AH5', name: 'SEC Climate Rule', status: 'Upcoming', score: 65, nextDeadline: 'FY2025 10-K filing', keyMetric: 'Scope 1+2 GHG ready', color: '#dc2626' },
];

const READINESS_TREND = [
  { month: 'Jan', score: 52 }, { month: 'Feb', score: 54 }, { month: 'Mar', score: 57 },
  { month: 'Apr', score: 59 }, { month: 'May', score: 61 }, { month: 'Jun', score: 63 },
  { month: 'Jul', score: 65 }, { month: 'Aug', score: 67 }, { month: 'Sep', score: 69 },
  { month: 'Oct', score: 71 }, { month: 'Nov', score: 72 }, { month: 'Dec', score: 74 },
];

const RISK_HEATMAP = [
  { framework: 'CSRD', risk: 'High', color: T.red },
  { framework: 'SFDR', risk: 'Medium', color: T.amber },
  { framework: 'ISSB', risk: 'Low', color: T.green },
  { framework: 'UK SDR', risk: 'Medium', color: T.amber },
  { framework: 'SEC', risk: 'Low*', color: T.sage },
];

/* --- Tab 2 --- */
const DATA_POINTS = [
  { name: 'Scope 1 GHG', csrd: true, sfdr: true, issb: true, sdr: true, sec: true },
  { name: 'Scope 2 GHG', csrd: true, sfdr: true, issb: true, sdr: true, sec: true },
  { name: 'Scope 3 GHG', csrd: true, sfdr: true, issb: true, sdr: false, sec: false },
  { name: 'WACI', csrd: true, sfdr: true, issb: false, sdr: true, sec: false },
  { name: 'Board gender %', csrd: true, sfdr: true, issb: false, sdr: true, sec: false },
  { name: 'CEO pay ratio', csrd: true, sfdr: false, issb: false, sdr: false, sec: true },
  { name: 'Energy consumption', csrd: true, sfdr: true, issb: true, sdr: false, sec: false },
  { name: 'Renewable energy %', csrd: true, sfdr: true, issb: false, sdr: true, sec: false },
  { name: 'Water consumption', csrd: true, sfdr: true, issb: false, sdr: false, sec: false },
  { name: 'Waste generated', csrd: true, sfdr: true, issb: false, sdr: false, sec: false },
  { name: 'Employee TRIR', csrd: true, sfdr: false, issb: false, sdr: false, sec: false },
  { name: 'Training hours', csrd: true, sfdr: false, issb: false, sdr: false, sec: false },
  { name: 'Living wage %', csrd: true, sfdr: true, issb: false, sdr: false, sec: false },
  { name: 'Human rights DD', csrd: true, sfdr: true, issb: false, sdr: false, sec: false },
  { name: 'Tax paid', csrd: true, sfdr: false, issb: false, sdr: false, sec: true },
  { name: 'Anti-corruption policy', csrd: true, sfdr: false, issb: false, sdr: false, sec: false },
  { name: 'Biodiversity assessment', csrd: true, sfdr: true, issb: false, sdr: false, sec: false },
  { name: 'Community investment', csrd: true, sfdr: false, issb: false, sdr: false, sec: false },
  { name: 'GHG reduction target', csrd: true, sfdr: true, issb: true, sdr: true, sec: true },
  { name: 'Net zero commitment', csrd: true, sfdr: true, issb: true, sdr: true, sec: true },
];

const DATA_REUSE_CHART = DATA_POINTS.map(dp => ({
  name: dp.name.length > 16 ? dp.name.slice(0, 15) + '…' : dp.name,
  frameworks: [dp.csrd, dp.sfdr, dp.issb, dp.sdr, dp.sec].filter(Boolean).length,
})).sort((a, b) => b.frameworks - a.frameworks);

/* --- Tab 3 --- */
const DISCLOSURE_OUTPUTS = [
  { id: 1, name: 'CSRD Sustainability Statement (iXBRL)', pages: 142, autoRate: 91, platformHrs: 2.5, manualHrs: 40, lastGen: '2025-03-15', framework: 'CSRD' },
  { id: 2, name: 'SFDR Pre-contractual Disclosure (Annex II/III)', pages: 28, autoRate: 88, platformHrs: 1.0, manualHrs: 20, lastGen: '2025-03-10', framework: 'SFDR' },
  { id: 3, name: 'SFDR Periodic Report ESG Annex', pages: 35, autoRate: 85, platformHrs: 1.5, manualHrs: 30, lastGen: '2025-02-28', framework: 'SFDR' },
  { id: 4, name: 'ISSB S2 Climate Disclosure (standalone)', pages: 48, autoRate: 89, platformHrs: 2.0, manualHrs: 35, lastGen: '2025-03-20', framework: 'ISSB' },
  { id: 5, name: 'UK SDR Consumer-Facing 2-Page Disclosure', pages: 2, autoRate: 94, platformHrs: 0.5, manualHrs: 8, lastGen: '2025-03-18', framework: 'UK SDR' },
  { id: 6, name: 'UK SDR Annual Report Sustainability Section', pages: 22, autoRate: 86, platformHrs: 1.5, manualHrs: 28, lastGen: '2025-03-12', framework: 'UK SDR' },
  { id: 7, name: 'SEC 10-K Climate Section (Items 1501-1507)', pages: 18, autoRate: 82, platformHrs: 2.5, manualHrs: 60, lastGen: '2025-03-05', framework: 'SEC' },
  { id: 8, name: 'Integrated Annual Report ESG Chapter', pages: 55, autoRate: 84, platformHrs: 3.0, manualHrs: 59, lastGen: '2025-03-22', framework: 'Multi' },
];

const VERSION_HISTORY = [
  { version: 'Draft 1', date: '2025-02-01', changes: 48, status: 'Superseded' },
  { version: 'Draft 2', date: '2025-02-22', changes: 23, status: 'Superseded' },
  { version: 'Draft 3', date: '2025-03-08', changes: 11, status: 'In Review' },
  { version: 'Final', date: '2025-03-20', changes: 5, status: 'Approved' },
  { version: 'Filed', date: '—', changes: 0, status: 'Pending' },
];

const WORKFLOW_STEPS = [
  { step: 1, label: 'Draft', owner: 'Sustainability Team', status: 'Complete', date: '02 Mar' },
  { step: 2, label: 'Sustainability Review', owner: 'ESG Lead', status: 'Complete', date: '12 Mar' },
  { step: 3, label: 'Legal Review', owner: 'General Counsel', status: 'In Progress', date: '25 Mar' },
  { step: 4, label: 'CFO Sign-off', owner: 'CFO', status: 'Pending', date: '—' },
  { step: 5, label: 'Filing', owner: 'Company Secretary', status: 'Pending', date: '—' },
];

/* --- Tab 4 --- */
const GAPS = [
  { id: 'G01', desc: 'Scope 3 Category 11 (use of sold products) not measured', frameworks: ['CSRD', 'ISSB'], severity: 'Critical', owner: 'ESG Data Team', closeDate: '2025-06-30', pct: 15 },
  { id: 'G02', desc: 'Double materiality assessment not externally verified', frameworks: ['CSRD'], severity: 'Critical', owner: 'External Assurance', closeDate: '2025-05-31', pct: 40 },
  { id: 'G03', desc: 'Transition plan not formally board-approved', frameworks: ['CSRD', 'ISSB', 'SEC'], severity: 'Critical', owner: 'Board Committee', closeDate: '2025-04-30', pct: 60 },
  { id: 'G04', desc: 'Physical climate risk quantification not scenario-tested', frameworks: ['CSRD', 'ISSB'], severity: 'Critical', owner: 'Risk Function', closeDate: '2025-07-31', pct: 25 },
  { id: 'G05', desc: 'Biodiversity footprint methodology not documented', frameworks: ['CSRD', 'SFDR'], severity: 'High', owner: 'ESG Data Team', closeDate: '2025-08-31', pct: 10 },
  { id: 'G06', desc: 'Supply chain Scope 3 data coverage <50%', frameworks: ['CSRD', 'SFDR', 'SEC'], severity: 'High', owner: 'Procurement', closeDate: '2025-09-30', pct: 30 },
  { id: 'G07', desc: 'SFDR PAI indicator 9 (board gender) below 40% target', frameworks: ['SFDR'], severity: 'High', owner: 'HR', closeDate: '2025-12-31', pct: 45 },
  { id: 'G08', desc: 'Water withdrawal data not split by stress region', frameworks: ['CSRD'], severity: 'High', owner: 'Operations', closeDate: '2025-06-30', pct: 20 },
  { id: 'G09', desc: 'Human rights due diligence process not formalised', frameworks: ['CSRD', 'SFDR'], severity: 'High', owner: 'Legal', closeDate: '2025-05-31', pct: 55 },
  { id: 'G10', desc: 'UK SDR label criteria mapping not completed for Fund C', frameworks: ['UK SDR'], severity: 'High', owner: 'Product Team', closeDate: '2025-04-15', pct: 70 },
  { id: 'G11', desc: 'SEC Reg S-K climate risk disclosure narrative not drafted', frameworks: ['SEC'], severity: 'High', owner: 'Legal / ESG', closeDate: '2025-09-30', pct: 20 },
  { id: 'G12', desc: 'GHG verification at limited assurance level only', frameworks: ['CSRD', 'ISSB'], severity: 'Medium', owner: 'External Assurance', closeDate: '2026-03-31', pct: 50 },
  { id: 'G13', desc: 'Internal audit process for ESG data not established', frameworks: ['CSRD'], severity: 'Medium', owner: 'Internal Audit', closeDate: '2025-10-31', pct: 30 },
  { id: 'G14', desc: 'Energy consumption disaggregation by country missing', frameworks: ['CSRD'], severity: 'Medium', owner: 'ESG Data Team', closeDate: '2025-07-31', pct: 40 },
  { id: 'G15', desc: 'CEO pay ratio calculation methodology not published', frameworks: ['CSRD', 'SEC'], severity: 'Medium', owner: 'HR / Legal', closeDate: '2025-06-30', pct: 60 },
  { id: 'G16', desc: 'TCFD scenario narrative older than 12 months', frameworks: ['ISSB', 'UK SDR'], severity: 'Medium', owner: 'Risk Function', closeDate: '2025-05-31', pct: 75 },
  { id: 'G17', desc: 'Community investment data not tracked by geography', frameworks: ['CSRD'], severity: 'Medium', owner: 'Communications', closeDate: '2025-08-31', pct: 35 },
  { id: 'G18', desc: 'Anti-corruption training completion rate not reported', frameworks: ['CSRD'], severity: 'Low', owner: 'Compliance', closeDate: '2025-06-30', pct: 80 },
  { id: 'G19', desc: 'Renewable energy certificate documentation incomplete', frameworks: ['CSRD', 'SFDR'], severity: 'Low', owner: 'Operations', closeDate: '2025-04-30', pct: 85 },
  { id: 'G20', desc: 'Living wage compliance data for Tier-2 suppliers missing', frameworks: ['CSRD', 'SFDR'], severity: 'Low', owner: 'Procurement', closeDate: '2025-09-30', pct: 20 },
  { id: 'G21', desc: 'Disclosure committee terms of reference not formalised', frameworks: ['CSRD'], severity: 'Medium', owner: 'Legal', closeDate: '2025-04-15', pct: 90 },
  { id: 'G22', desc: 'Whistleblower channel for ESG breaches not publicised', frameworks: ['CSRD'], severity: 'High', owner: 'HR / Compliance', closeDate: '2025-05-31', pct: 50 },
  { id: 'G23', desc: 'ISSB S1 general requirements narrative not drafted', frameworks: ['ISSB'], severity: 'Medium', owner: 'ESG Team', closeDate: '2025-07-31', pct: 45 },
  { id: 'G24', desc: 'Taxonomy alignment % not calculated for capital expenditures', frameworks: ['CSRD', 'SFDR'], severity: 'High', owner: 'Finance', closeDate: '2025-06-30', pct: 30 },
  { id: 'G25', desc: 'SFDR principal adverse impact statement not published', frameworks: ['SFDR'], severity: 'Critical', owner: 'ESG / Legal', closeDate: '2025-04-30', pct: 65 },
];

const GAPS_BY_FRAMEWORK = [
  { framework: 'CSRD', Critical: 4, High: 5, Medium: 5, Low: 3 },
  { framework: 'SFDR', Critical: 2, High: 4, Medium: 1, Low: 2 },
  { framework: 'ISSB', Critical: 2, High: 2, Medium: 2, Low: 0 },
  { framework: 'UK SDR', Critical: 0, High: 2, Medium: 1, Low: 0 },
  { framework: 'SEC', Critical: 1, High: 2, Medium: 1, Low: 0 },
];

const QUICK_WINS = [
  { gap: 'G18', action: 'Extract anti-corruption training report from LMS', effort: '0.5 days' },
  { gap: 'G19', action: 'Upload REC documentation to platform data room', effort: '1 day' },
  { gap: 'G21', action: 'Adopt standard disclosure committee ToR template', effort: '1 day' },
  { gap: 'G10', action: 'Complete Fund C SDR label mapping using existing data', effort: '3 days' },
  { gap: 'G16', action: 'Update TCFD scenario narrative — use existing risk data', effort: '5 days' },
];

/* --- Tab 5 --- */
const REG_EVENTS = [
  { date: '2024-05', label: 'UK SDR Anti-Greenwashing Rule in force', framework: 'UK SDR', impact: 'High', color: '#7c3aed' },
  { date: '2024-07', label: 'UK SDR Labels in force (Sustainable Focus etc.)', framework: 'UK SDR', impact: 'High', color: '#7c3aed' },
  { date: '2024-10', label: 'IAASB ISSA 5000 sustainability assurance standard finalised', framework: 'Assurance', impact: 'Medium', color: '#9aa3ae' },
  { date: '2025-01', label: 'CSRD FY2024 reports due (Wave 1 — large PIEs)', framework: 'CSRD', impact: 'Critical', color: '#2c5a8c' },
  { date: '2025-01', label: 'ISSB S1/S2 mandatory — Australia (ASRS)', framework: 'ISSB', impact: 'High', color: '#c5a96a' },
  { date: '2025-01', label: 'ISSB S1/S2 mandatory — Singapore (SCTDS)', framework: 'ISSB', impact: 'High', color: '#c5a96a' },
  { date: '2025-01', label: 'SFDR v2 Level 1 revision consultation closes', framework: 'SFDR', impact: 'Medium', color: '#5a8a6a' },
  { date: '2025-03', label: 'ISSB/IOSCO assurance guidance published', framework: 'Assurance', impact: 'Medium', color: '#9aa3ae' },
  { date: '2025-06', label: 'SEC climate rule legal challenge resolution expected', framework: 'SEC', impact: 'High', color: '#dc2626' },
  { date: '2025-07', label: 'UK SRS (ISSB-aligned) mandatory — UK listed companies', framework: 'ISSB', impact: 'High', color: '#c5a96a' },
  { date: '2025-09', label: 'ISSB mandatory — Canada (CSDS)', framework: 'ISSB', impact: 'Medium', color: '#c5a96a' },
  { date: '2025-12', label: 'ESMA CSRD enforcement guidance issued', framework: 'CSRD', impact: 'Medium', color: '#2c5a8c' },
  { date: '2026-01', label: 'CSRD Wave 2 — all large companies', framework: 'CSRD', impact: 'Critical', color: '#2c5a8c' },
  { date: '2026-01', label: 'SFDR new Level 2 RTS effective', framework: 'SFDR', impact: 'High', color: '#5a8a6a' },
  { date: '2026-01', label: 'SEC LAF Regulation S-K climate items (FY2025)', framework: 'SEC', impact: 'High', color: '#dc2626' },
  { date: '2026-04', label: 'UK Green Taxonomy Framework (UK GTF) expected', framework: 'UK SDR', impact: 'Medium', color: '#7c3aed' },
  { date: '2026-06', label: 'EU Taxonomy financial sector guidance updated', framework: 'EU Taxonomy', impact: 'Medium', color: '#06b6d4' },
  { date: '2026-07', label: 'CSRD sector-specific ESRS standards (draft)', framework: 'CSRD', impact: 'High', color: '#2c5a8c' },
  { date: '2026-09', label: 'SEC LAF GHG attestation requirement (FY2026)', framework: 'SEC', impact: 'High', color: '#dc2626' },
  { date: '2026-12', label: 'SFDR full v2 implementation — product reclassification deadline', framework: 'SFDR', impact: 'Critical', color: '#5a8a6a' },
  { date: '2027-01', label: 'CSRD Wave 3 — listed SMEs (opt-out until 2028)', framework: 'CSRD', impact: 'Medium', color: '#2c5a8c' },
  { date: '2027-06', label: 'EU Social Taxonomy — consultation outcome expected', framework: 'EU Taxonomy', impact: 'Low', color: '#06b6d4' },
  { date: '2027-09', label: 'TNFD — UK considering mandatory adoption', framework: 'TNFD', impact: 'Medium', color: '#16a34a' },
  { date: '2027-12', label: 'ISSB — global baseline adoption by 30+ jurisdictions expected', framework: 'ISSB', impact: 'High', color: '#c5a96a' },
  { date: '2028-01', label: 'CSRD limited assurance transitions to reasonable assurance', framework: 'CSRD', impact: 'Critical', color: '#2c5a8c' },
  { date: '2028-06', label: 'Singapore TNFD mandatory pilot expanded', framework: 'TNFD', impact: 'Low', color: '#16a34a' },
  { date: '2029-01', label: 'SEC GHG Scope 1+2 attestation at reasonable assurance (LAF)', framework: 'SEC', impact: 'High', color: '#dc2626' },
  { date: '2030-01', label: 'EU Extended Environmental Taxonomy — full scope', framework: 'EU Taxonomy', impact: 'Medium', color: '#06b6d4' },
  { date: '2030-06', label: 'CSRD SME standard — full mandatory adoption', framework: 'CSRD', impact: 'Medium', color: '#2c5a8c' },
];

const IMPACT_RADAR_DATA = [
  { framework: 'CSRD', burden: 95 },
  { framework: 'SFDR v2', burden: 78 },
  { framework: 'ISSB', burden: 65 },
  { framework: 'UK SDR', burden: 55 },
  { framework: 'SEC', burden: 70 },
  { framework: 'EU Taxonomy', burden: 60 },
  { framework: 'TNFD', burden: 40 },
];

/* --- Tab 6 --- */
const AUDIT_LOG = [
  { date: '2025-03-27', framework: 'CSRD', dataPoint: 'Scope 1 GHG emissions', change: '12,450 → 11,890 tCO₂e', user: 'A. Patel', status: 'Approved' },
  { date: '2025-03-27', framework: 'SFDR', dataPoint: 'WACI (Weighted Avg. Carbon Intensity)', change: '182.4 → 176.1 tCO₂e/$M', user: 'A. Patel', status: 'Approved' },
  { date: '2025-03-26', framework: 'ISSB', dataPoint: 'Physical risk exposure score', change: '6.2 → 7.0 (methodology updated)', user: 'J. Williams', status: 'Pending' },
  { date: '2025-03-26', framework: 'CSRD', dataPoint: 'Board gender diversity %', change: '36% → 38%', user: 'L. Chen', status: 'Approved' },
  { date: '2025-03-25', framework: 'UK SDR', dataPoint: 'Sustainable investment %', change: '67% → 71%', user: 'R. Okafor', status: 'Approved' },
  { date: '2025-03-25', framework: 'CSRD', dataPoint: 'Scope 3 Cat 11 (estimate)', change: '0 → 48,200 tCO₂e (new)', user: 'A. Patel', status: 'Under Review' },
  { date: '2025-03-24', framework: 'SFDR', dataPoint: 'PAI 7 — Biodiversity sensitive area exposure', change: '2.1% → 2.4%', user: 'J. Williams', status: 'Approved' },
  { date: '2025-03-24', framework: 'SEC', dataPoint: 'GHG intensity (per $M revenue)', change: '28.6 → 27.9 tCO₂e/$M', user: 'L. Chen', status: 'Approved' },
  { date: '2025-03-23', framework: 'CSRD', dataPoint: 'Water withdrawal — water-stressed areas', change: 'Not reported → 3,450 ML', user: 'R. Okafor', status: 'Pending' },
  { date: '2025-03-22', framework: 'ISSB', dataPoint: 'Climate transition plan commitment', change: 'Updated to 2030 interim target', user: 'CEO Sign-off', status: 'Approved' },
];

const ASSURANCE_CHECKLIST = [
  { criterion: 'GHG data independently verified at limited assurance', ready: true },
  { criterion: 'Internal controls over ESG data documented', ready: true },
  { criterion: 'Data governance policy published', ready: true },
  { criterion: 'ESG data system audit trail complete', ready: true },
  { criterion: 'Disclosure committee in place with ToR', ready: false },
  { criterion: 'CFO attestation process established', ready: true },
  { criterion: 'Internal audit review of ESG processes conducted', ready: false },
  { criterion: 'Third-party data providers audited', ready: false },
  { criterion: 'Scope 3 methodology externally reviewed', ready: false },
  { criterion: 'Board oversight of ESG disclosure documented', ready: true },
  { criterion: 'Limited assurance — Scope 1, 2, 3 (all categories)', ready: false },
  { criterion: 'Limited assurance — key social & governance metrics', ready: false },
  { criterion: 'Management representation letters prepared', ready: true },
  { criterion: 'Prior year restatement policy defined', ready: true },
  { criterion: 'Whistleblower mechanism for ESG breaches in place', ready: false },
];

const ENFORCEMENT = [
  { regulator: 'FCA', action: 'Fines issued for greenwashing in fund labelling', status: 'Active', year: '2024' },
  { regulator: 'ESMA', action: 'Common enforcement priorities: ESRS E1 climate data quality', status: 'Active', year: '2025' },
  { regulator: 'SEC', action: '400+ comment letters on climate risk in 10-K filings', status: 'Ongoing', year: '2024-25' },
  { regulator: 'FCA', action: 'ESG ratings provider regulation — consultation CP23/15', status: 'Active', year: '2025' },
  { regulator: 'ESMA', action: 'Naming & marketing guidelines for ESG funds enforcement', status: 'Active', year: '2024' },
];

/* ================================================================= TABS */
const TABS = [
  'Multi-Framework Dashboard',
  'Cross-Framework Data Map',
  'Disclosure Factory',
  'Gap Analysis Engine',
  'Regulatory Horizon',
  'Audit Trail & Governance',
];

/* ================================================================= TAB COMPONENTS */

function Tab1() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI row */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KPICard label="Frameworks Tracked" value="5" sub="CSRD · SFDR · ISSB · UK SDR · SEC" color={T.navy} />
        <KPICard label="Overall Disclosure Readiness" value="74%" sub="Up from 52% Jan 2024" color={T.sage} />
        <KPICard label="Auto-Populated Data Points" value="2,847" sub="of 3,841 total (74.1%)" color={T.navyL} />
        <KPICard label="Next Regulatory Deadline" value="Q1 2025" sub="CSRD FY2024 Annual Report" color={T.amber} />
      </div>

      {/* Framework strategy cards */}
      <SectionTitle sub="Click into each framework module for detailed analysis">Framework Module Overview</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {FRAMEWORKS.map(fw => (
          <Card key={fw.code} style={{ borderLeft: `4px solid ${fw.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{fw.name}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{fw.code}</div>
              </div>
              <Badge label={fw.status} color={statusColor(fw.status)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${fw.score}%`, height: '100%', background: fw.color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: fw.color }}>{fw.score}%</span>
            </div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>
              <strong>Next deadline:</strong> {fw.nextDeadline}
            </div>
            <div style={{ fontSize: 12, color: T.textMut }}>{fw.keyMetric}</div>
          </Card>
        ))}
      </div>

      {/* Readiness trend line chart */}
      <Card>
        <SectionTitle sub="Disclosure readiness score 0–100% | Jan–Dec 2024">Overall Readiness Score — Monthly Trend 2024</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={READINESS_TREND} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textMut }} />
            <YAxis domain={[45, 80]} tick={{ fontSize: 11, fill: T.textMut }} unit="%" />
            <Tooltip formatter={v => [`${v}%`, 'Readiness']} contentStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="score" stroke={T.navyL} strokeWidth={2.5} dot={{ r: 3, fill: T.navyL }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Regulatory risk heatmap */}
      <Card>
        <SectionTitle sub="Compliance risk assessment for this organisation by framework">Regulatory Risk Heat Map</SectionTitle>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {RISK_HEATMAP.map(r => (
            <div key={r.framework} style={{
              flex: 1, minWidth: 130, padding: '16px 20px', borderRadius: 10,
              background: `${r.color}12`, border: `2px solid ${r.color}40`, textAlign: 'center',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{r.framework}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: r.color }}>{r.risk}</div>
              {r.framework === 'SEC' && <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>*jurisdiction N/A</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Tab2() {
  const [showAll, setShowAll] = useState(false);
  const visibleDPs = showAll ? DATA_POINTS : DATA_POINTS.slice(0, 12);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Data reuse stats */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KPICard label="Data Reuse Rate (CSRD→ISSB)" value="73%" sub="Data entered once, flows everywhere" color={T.sage} />
        <KPICard label="CSRD Data Satisfying SFDR PAI" value="68%" sub="Single source of truth" color={T.navyL} />
        <KPICard label="Total ESG Data Points Tracked" value="20" sub="Across all 5 frameworks" color={T.navy} />
        <KPICard label="Frameworks Using Scope 1+2" value="5/5" sub="Universal baseline data" color={T.gold} />
      </div>

      {/* Data convergence matrix */}
      <Card>
        <SectionTitle sub="Which frameworks require each ESG data point — single source of truth architecture">Data Convergence Matrix</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: T.navy, fontWeight: 700, minWidth: 180 }}>ESG Data Point</th>
                {['CSRD', 'SFDR', 'ISSB', 'UK SDR', 'SEC'].map(fw => (
                  <th key={fw} style={{ padding: '8px 10px', color: T.navy, fontWeight: 700, textAlign: 'center', minWidth: 70 }}>{fw}</th>
                ))}
                <th style={{ padding: '8px 10px', color: T.navy, fontWeight: 700, textAlign: 'center' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {visibleDPs.map((dp, i) => {
                const count = [dp.csrd, dp.sfdr, dp.issb, dp.sdr, dp.sec].filter(Boolean).length;
                return (
                  <tr key={dp.name} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '7px 10px', color: T.text, fontWeight: 500 }}>{dp.name}</td>
                    {[dp.csrd, dp.sfdr, dp.issb, dp.sdr, dp.sec].map((req, j) => (
                      <td key={j} style={{ textAlign: 'center', padding: '7px 10px', fontSize: 14 }}>
                        {req
                          ? <span style={{ color: T.green, fontWeight: 700 }}>✓</span>
                          : <span style={{ color: T.border }}>—</span>}
                      </td>
                    ))}
                    <td style={{ textAlign: 'center', padding: '7px 10px' }}>
                      <Badge label={`${count}/5`} color={count >= 4 ? T.sage : count >= 2 ? T.navyL : T.textMut} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => setShowAll(s => !s)}
          style={{
            marginTop: 12, background: 'none', border: `1px solid ${T.border}`, borderRadius: 6,
            padding: '6px 14px', fontSize: 12, color: T.navyL, cursor: 'pointer',
          }}
        >
          {showAll ? 'Show less' : `Show all ${DATA_POINTS.length} data points`}
        </button>
      </Card>

      {/* Bar chart — frameworks per data point */}
      <Card>
        <SectionTitle sub="Number of frameworks requiring each ESG data point">Framework Demand by Data Point</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={DATA_REUSE_CHART} margin={{ top: 10, right: 20, bottom: 60, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textMut }} angle={-35} textAnchor="end" interval={0} />
            <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: T.textMut }} />
            <Tooltip formatter={v => [v, 'Frameworks requiring']} contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="frameworks" radius={[4, 4, 0, 0]}>
              {DATA_REUSE_CHART.map((d, i) => (
                <Cell key={i} fill={d.frameworks === 5 ? T.sage : d.frameworks >= 3 ? T.navyL : T.gold} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Architecture note */}
      <Card style={{ background: '#f0f7f0', border: `1px solid ${T.sage}40` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.sage, marginBottom: 8 }}>Single Source of Truth Architecture</div>
        <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
          Data is entered once into the platform data layer and automatically mapped to all applicable frameworks.
          73% of CSRD data points simultaneously satisfy ISSB S2 climate requirements.
          68% of CSRD social and governance data satisfies SFDR PAI obligations.
          Changes propagate in real time — update Scope 1 GHG once, all 5 framework disclosures refresh automatically.
        </div>
      </Card>
    </div>
  );
}

function Tab3() {
  const totalPages = DISCLOSURE_OUTPUTS.reduce((a, d) => a + d.pages, 0);
  const avgAuto = Math.round(DISCLOSURE_OUTPUTS.reduce((a, d) => a + d.autoRate, 0) / DISCLOSURE_OUTPUTS.length);
  const totalPlatformHrs = DISCLOSURE_OUTPUTS.reduce((a, d) => a + d.platformHrs, 0);
  const totalManualHrs = DISCLOSURE_OUTPUTS.reduce((a, d) => a + d.manualHrs, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KPICard label="Total Pages Auto-Generated" value={totalPages} sub="Across 8 disclosure outputs" color={T.navy} />
        <KPICard label="Avg Auto-Population Rate" value={`${avgAuto}%`} sub="Data from platform sources" color={T.sage} />
        <KPICard label="Platform Review Time" value={`${totalPlatformHrs.toFixed(0)}h`} sub={`vs ${totalManualHrs}h manual`} color={T.navyL} />
        <KPICard label="Time Saved" value={`${Math.round((1 - totalPlatformHrs / totalManualHrs) * 100)}%`} sub={`${totalManualHrs - totalPlatformHrs}h saved`} color={T.gold} />
      </div>

      {/* Disclosure outputs table */}
      <Card>
        <SectionTitle sub="Auto-generated disclosure documents — click to open draft">8 Automated Disclosure Outputs</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Output', 'Framework', 'Pages', 'Auto %', 'Platform', 'Manual', 'Last Generated'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: T.navy, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISCLOSURE_OUTPUTS.map((d, i) => (
                <tr key={d.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px 10px', color: T.text, fontWeight: 500, maxWidth: 260 }}>{d.name}</td>
                  <td style={{ padding: '8px 10px' }}><Badge label={d.framework} color={T.navyL} /></td>
                  <td style={{ padding: '8px 10px', color: T.textSec, fontWeight: 600 }}>{d.pages}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${d.autoRate}%`, height: '100%', background: T.sage, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.sage }}>{d.autoRate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px', color: T.sage, fontWeight: 600 }}>{d.platformHrs}h</td>
                  <td style={{ padding: '8px 10px', color: T.textMut }}>{d.manualHrs}h</td>
                  <td style={{ padding: '8px 10px', color: T.textMut, fontSize: 11 }}>{d.lastGen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Version control */}
        <Card>
          <SectionTitle sub="CSRD FY2024 sustainability statement — draft tracking">Disclosure Versioning</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {VERSION_HISTORY.map((v, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: 8, background: T.surfaceH,
                border: `1px solid ${v.status === 'Approved' ? T.sage + '60' : v.status === 'In Review' ? T.gold + '60' : T.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{v.version}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{v.date} · {v.changes} changes</div>
                </div>
                <Badge
                  label={v.status}
                  color={v.status === 'Approved' ? T.green : v.status === 'In Review' ? T.amber : v.status === 'Pending' ? T.textMut : T.textMut}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Approval workflow */}
        <Card>
          <SectionTitle sub="Mandatory approval chain before filing">Approval Workflow</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {WORKFLOW_STEPS.map((ws) => (
              <div key={ws.step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: ws.status === 'Complete' ? T.sage : ws.status === 'In Progress' ? T.amber : T.border,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: ws.status === 'Pending' ? T.textMut : '#fff',
                }}>
                  {ws.status === 'Complete' ? '✓' : ws.step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{ws.label}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{ws.owner} · {ws.date}</div>
                </div>
                <Badge
                  label={ws.status}
                  color={ws.status === 'Complete' ? T.green : ws.status === 'In Progress' ? T.amber : T.textMut}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Tab4() {
  const criticalCount = GAPS.filter(g => g.severity === 'Critical').length;
  const highCount = GAPS.filter(g => g.severity === 'High').length;
  const avgPct = Math.round(GAPS.reduce((a, g) => a + g.pct, 0) / GAPS.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KPICard label="Total Gaps Identified" value={GAPS.length} sub="Across all 5 frameworks" color={T.navy} />
        <KPICard label="Critical Gaps" value={criticalCount} sub="Must close before filing" color={T.red} />
        <KPICard label="High Severity Gaps" value={highCount} sub="Affect disclosure quality" color={T.amber} />
        <KPICard label="Average Closure Progress" value={`${avgPct}%`} sub="Across all open gaps" color={T.sage} />
      </div>

      {/* Gaps by framework chart */}
      <Card>
        <SectionTitle sub="Gap severity distribution across frameworks">Gaps by Framework & Severity</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={GAPS_BY_FRAMEWORK} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="framework" tick={{ fontSize: 11, fill: T.textMut }} />
            <YAxis tick={{ fontSize: 11, fill: T.textMut }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Critical" stackId="a" fill={T.red} radius={[0, 0, 0, 0]} />
            <Bar dataKey="High" stackId="a" fill={T.amber} />
            <Bar dataKey="Medium" stackId="a" fill={T.navyL} />
            <Bar dataKey="Low" stackId="a" fill={T.sage} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Quick wins */}
      <Card style={{ background: '#f0f7f0', border: `1px solid ${T.sage}40` }}>
        <SectionTitle sub="Gaps closable in under 2 weeks with minimal effort">Quick Wins — Act Now</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {QUICK_WINS.map(qw => (
            <div key={qw.gap} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <Badge label={qw.gap} color={T.sage} />
              <div style={{ flex: 1, fontSize: 12, color: T.text }}>{qw.action}</div>
              <div style={{ fontSize: 11, color: T.textMut, whiteSpace: 'nowrap' }}>{qw.effort}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Full gap table */}
      <Card>
        <SectionTitle sub="Risk-based prioritisation: Critical → High → Medium → Low">All 25 Identified Gaps</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['ID', 'Gap Description', 'Frameworks', 'Severity', 'Owner', 'Target Date', '% Done'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '7px 8px', color: T.navy, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GAPS.map((g, i) => (
                <tr key={g.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: T.textMut }}>{g.id}</td>
                  <td style={{ padding: '6px 8px', color: T.text, maxWidth: 240 }}>{g.desc}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {g.frameworks.map(fw => <Badge key={fw} label={fw} color={T.navyL} />)}
                    </div>
                  </td>
                  <td style={{ padding: '6px 8px' }}><Badge label={g.severity} color={severityColor(g.severity)} /></td>
                  <td style={{ padding: '6px 8px', color: T.textSec, whiteSpace: 'nowrap' }}>{g.owner}</td>
                  <td style={{ padding: '6px 8px', color: T.textMut, whiteSpace: 'nowrap' }}>{g.closeDate}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 45, height: 5, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${g.pct}%`, height: '100%', background: g.pct >= 70 ? T.sage : g.pct >= 40 ? T.amber : T.red, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 10, color: T.textMut }}>{g.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Tab5() {
  const [filterFw, setFilterFw] = useState('All');
  const frameworks = ['All', ...Array.from(new Set(REG_EVENTS.map(e => e.framework)))];
  const filtered = filterFw === 'All' ? REG_EVENTS : REG_EVENTS.filter(e => e.framework === filterFw);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KPICard label="Regulatory Events Tracked" value={REG_EVENTS.length} sub="2024–2030 horizon" color={T.navy} />
        <KPICard label="Critical Events" value={REG_EVENTS.filter(e => e.impact === 'Critical').length} sub="Require immediate action" color={T.red} />
        <KPICard label="High Impact Events" value={REG_EVENTS.filter(e => e.impact === 'High').length} sub="Material compliance burden" color={T.amber} />
        <KPICard label="Highest Burden Framework" value="CSRD" sub="95/100 disclosure burden score" color={T.navyL} />
      </div>

      {/* Burden radar bar chart */}
      <Card>
        <SectionTitle sub="Estimated disclosure burden score 0–100 per framework">Regulatory Burden by Framework</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={IMPACT_RADAR_DATA} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textMut }} />
            <YAxis type="category" dataKey="framework" tick={{ fontSize: 11, fill: T.textSec }} width={80} />
            <Tooltip formatter={v => [`${v}/100`, 'Burden Score']} contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="burden" radius={[0, 4, 4, 0]}>
              {IMPACT_RADAR_DATA.map((d, i) => (
                <Cell key={i} fill={d.burden >= 80 ? T.red : d.burden >= 60 ? T.amber : T.sage} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Timeline */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>Regulatory Horizon 2024–2030</div>
            <div style={{ fontSize: 12, color: T.textMut }}>29 regulatory events across all frameworks</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {frameworks.map(fw => (
              <button key={fw} onClick={() => setFilterFw(fw)} style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                background: filterFw === fw ? T.navy : T.surface,
                color: filterFw === fw ? '#fff' : T.textSec,
                border: `1px solid ${filterFw === fw ? T.navy : T.border}`,
              }}>{fw}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto' }}>
          {filtered.map((ev, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '9px 12px', borderRadius: 8,
              background: ev.impact === 'Critical' ? `${T.red}08` : T.surfaceH,
              border: `1px solid ${ev.impact === 'Critical' ? T.red + '30' : T.border}`,
            }}>
              <div style={{
                minWidth: 70, fontSize: 11, fontWeight: 700, color: T.textMut, paddingTop: 1,
              }}>{ev.date}</div>
              <div style={{ width: 3, minHeight: 30, background: ev.color, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{ev.label}</div>
                <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                  <Badge label={ev.framework} color={ev.color} />
                  <Badge
                    label={ev.impact}
                    color={ev.impact === 'Critical' ? T.red : ev.impact === 'High' ? T.amber : ev.impact === 'Medium' ? T.navyL : T.textMut}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Early mover advantage */}
      <Card style={{ background: '#fffbf0', border: `1px solid ${T.gold}50` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Early Mover Advantage</div>
        <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.8 }}>
          Analysis of 200+ organisations shows firms that began CSRD data collection in 2022–2023 are 2–3 years ahead
          on data infrastructure versus late movers beginning in 2024–2025. Early movers report 40% lower compliance
          costs per data point, higher assurance readiness scores, and greater confidence from investors and regulators.
          The same pattern is emerging for ISSB S2 — organisations with established TCFD processes have 60% less
          incremental work to meet ISSB requirements.
        </div>
      </Card>
    </div>
  );
}

function Tab6() {
  const assuredCount = ASSURANCE_CHECKLIST.filter(c => c.ready).length;
  const assuranceScore = Math.round((assuredCount / ASSURANCE_CHECKLIST.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KPICard label="Audit Log Entries (30 days)" value="847" sub="Across all 5 frameworks" color={T.navy} />
        <KPICard label="Reasonable Assurance Readiness" value={`${assuranceScore}%`} sub={`${assuredCount}/${ASSURANCE_CHECKLIST.length} criteria met`} color={assuranceScore >= 70 ? T.sage : T.amber} />
        <KPICard label="Data Points Under Review" value="3" sub="Pending approval" color={T.amber} />
        <KPICard label="Assurance Standard" value="ISSA 5000" sub="IAASB — effective 2024" color={T.navyL} />
      </div>

      {/* Audit trail log */}
      <Card>
        <SectionTitle sub="Last 10 data updates — immutable audit trail with full provenance">Audit Trail Log (30-Day Sample)</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Date', 'Framework', 'Data Point', 'Change', 'User', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '7px 8px', color: T.navy, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((log, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '6px 8px', color: T.textMut, whiteSpace: 'nowrap' }}>{log.date}</td>
                  <td style={{ padding: '6px 8px' }}><Badge label={log.framework} color={T.navyL} /></td>
                  <td style={{ padding: '6px 8px', color: T.text, fontWeight: 500 }}>{log.dataPoint}</td>
                  <td style={{ padding: '6px 8px', color: T.textSec, fontFamily: 'monospace', fontSize: 10 }}>{log.change}</td>
                  <td style={{ padding: '6px 8px', color: T.textSec, whiteSpace: 'nowrap' }}>{log.user}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <Badge
                      label={log.status}
                      color={log.status === 'Approved' ? T.green : log.status === 'Pending' ? T.amber : T.navyL}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Reasonable assurance readiness */}
        <Card>
          <SectionTitle sub="Readiness for CSRD reasonable assurance (mandatory from 2028)">Reasonable Assurance Readiness</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <svg viewBox="0 0 80 80" style={{ width: 80, height: 80, transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke={T.border} strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none"
                  stroke={assuranceScore >= 70 ? T.sage : T.amber}
                  strokeWidth="8"
                  strokeDasharray={`${(assuranceScore / 100) * 201} 201`}
                  strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: T.navy }}>
                {assuranceScore}%
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.textSec }}>
              {assuredCount} of {ASSURANCE_CHECKLIST.length} criteria met.<br />
              Target: 100% by Dec 2027.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 280, overflowY: 'auto' }}>
            {ASSURANCE_CHECKLIST.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: c.ready ? T.text : T.textMut }}>
                <span style={{ color: c.ready ? T.green : T.red, fontWeight: 700, flexShrink: 0 }}>{c.ready ? '✓' : '✗'}</span>
                <span>{c.criterion}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Governance structure */}
        <Card>
          <SectionTitle sub="Required governance structures for credible CSRD disclosure">Disclosure Governance Framework</SectionTitle>
          {[
            { title: 'Board Sustainability Committee', detail: 'Oversees all ESG disclosure; quarterly review of material topics; approves final sustainability statement', status: 'In place' },
            { title: 'CFO Sign-off', detail: 'Financial aspects of climate disclosure; capex/opex taxonomy alignment; financial materiality assessments', status: 'In place' },
            { title: 'Disclosure Committee', detail: 'Legal + Finance + Sustainability; coordinates across frameworks; approves data methodology changes', status: 'Partial' },
            { title: 'External Assurance Provider', detail: 'KPMG engaged for limited assurance; scoping reasonable assurance for 2026 timeline', status: 'In place' },
            { title: 'Internal Audit Review', detail: 'Annual review of ESG data processes and controls; report to Audit Committee', status: 'Gap' },
          ].map((g, i) => (
            <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{g.title}</div>
                <Badge
                  label={g.status}
                  color={g.status === 'In place' ? T.green : g.status === 'Partial' ? T.amber : T.red}
                />
              </div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{g.detail}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Enforcement landscape */}
      <Card>
        <SectionTitle sub="What regulator enforcement actions reveal about focus areas">Regulatory Enforcement Landscape</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ENFORCEMENT.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 8, background: T.surfaceH, border: `1px solid ${T.border}` }}>
              <Badge label={e.regulator} color={T.navyL} />
              <div style={{ flex: 1, fontSize: 12, color: T.text }}>{e.action}</div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Badge label={e.status} color={T.amber} />
                <span style={{ fontSize: 11, color: T.textMut }}>{e.year}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Whistleblower / CSRD note */}
      <Card style={{ background: '#f5f0fa', border: `1px solid ${T.navyL}30` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>CSRD Whistleblower Protections & Disclosure Governance</div>
        <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.8 }}>
          CSRD Article 26 requires organisations to have internal reporting channels for breaches of sustainability
          commitments, aligned with the EU Whistleblower Directive (2019/1937). Employees who report sustainability
          misstatements in good faith are protected from retaliation. This has governance implications:
          (1) The disclosure committee must have a clear escalation path for ESG data integrity concerns;
          (2) Any material restatement of disclosed ESG metrics must be disclosed and explained;
          (3) Assurance providers must be notified of whistleblower reports affecting audited data.
          Platform audit trail functionality supports this requirement by maintaining an immutable record
          of all data changes, who made them, and when — making it possible to reconstruct the disclosure
          process in the event of a regulatory enquiry or whistleblower investigation.
        </div>
      </Card>
    </div>
  );
}

/* ================================================================= PAGE */
export default function DisclosureHubPage() {
  const [activeTab, setActiveTab] = useState(0);

  const TAB_COMPONENTS = [Tab1, Tab2, Tab3, Tab4, Tab5, Tab6];
  const ActiveTab = TAB_COMPONENTS[activeTab];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Disclosure Intelligence Hub</h1>
              <Badge label="EP-AH6" color={T.gold} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Hub', '5 Frameworks', 'Cross-Framework', 'Audit Trail', 'Disclosure Factory'].map(b => (
                <Badge key={b} label={b} color={T.navyL} />
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: T.textMut }}>Overall Readiness</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.sage }}>74%</div>
            <div style={{ fontSize: 11, color: T.textMut }}>Next: CSRD Q1 2025</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 22, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden',
        boxShadow: T.card, flexWrap: 'wrap',
      }}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              flex: '1 1 auto', padding: '11px 14px', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: T.font, transition: 'all 0.15s',
              background: activeTab === i ? T.navy : 'transparent',
              color: activeTab === i ? '#fff' : T.textSec,
              borderRight: i < TABS.length - 1 ? `1px solid ${T.border}` : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <ActiveTab />
    </div>
  );
}
