import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, ScatterChart, Scatter, Cell,
  RadialBarChart, RadialBar, Legend
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

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── DATA ────────────────────────────────────────────────────────────────────

const FRAMEWORKS = [
  { id: 'csrd', name: 'CSRD/ESRS', deadline: '2025-01-01', deadlineTs: 2025.0, articles: 42, fineRisk: '€10M or 2% revenue', regulator: 'EFRAG/EC', color: T.blue },
  { id: 'issb', name: 'ISSB S1+S2', deadline: '2026-01-01', deadlineTs: 2026.0, articles: 28, fineRisk: 'Delisting risk', regulator: 'IOSCO/IFRS', color: T.purple },
  { id: 'tcfd', name: 'TCFD', deadline: '2024-01-01', deadlineTs: 2024.0, articles: 11, fineRisk: 'FCA enforcement', regulator: 'FSB/FCA', color: T.orange },
  { id: 'sfdr', name: 'SFDR', deadline: '2023-01-01', deadlineTs: 2023.0, articles: 18, fineRisk: 'ESG product ban', regulator: 'ESMA/EBA', color: T.red },
  { id: 'gri', name: 'GRI', deadline: 'Voluntary', deadlineTs: 2026.5, articles: 15, fineRisk: 'Reputational', regulator: 'GRI Standards Board', color: T.sage },
  { id: 'sec', name: 'SEC Climate', deadline: '2026-01-01', deadlineTs: 2026.0, articles: 9, fineRisk: 'SEC enforcement', regulator: 'SEC', color: T.amber },
  { id: 'tnfd', name: 'TNFD', deadline: '2026-01-01', deadlineTs: 2026.0, articles: 14, fineRisk: 'Investor pressure', regulator: 'TNFD Board', color: T.teal },
  { id: 'uksdr', name: 'UK SDR', deadline: '2024-07-31', deadlineTs: 2024.58, articles: 8, fineRisk: 'FCA action', regulator: 'FCA', color: T.navyL },
];

const COMPANIES = [
  'Meridian Capital Group', 'Vantage Industrial Holdings', 'Cerulean Asset Management',
  'Pinnacle Energy Corp', 'Helix Financial Services', 'Axiom Real Estate Trust',
  'Cascade Technology Partners', 'Nordic Green Fund', 'Solaris Commodities Ltd', 'Aurum Pension Fund'
];

const GAP_TEMPLATES = {
  csrd: [
    { article: 'ESRS E1-6', topic: 'Scope 3 GHG Emissions', description: 'Upstream Scope 3 categories 1–8 not quantified; only categories 11–15 partially disclosed', severity: 'critical', evidence: 'Our Scope 3 emissions include business travel and downstream product use. Full upstream quantification is ongoing.', recommendation: 'Commission Scope 3 screening using GHGP Corporate Value Chain Standard across all 15 categories', effort: 'High' },
    { article: 'ESRS E1-9', topic: 'Climate Risk Financial Effects', description: 'Transition risk financial quantification absent; narrative only without monetary estimates', severity: 'critical', evidence: 'We face risks from carbon pricing mechanisms. The financial impact of these risks is subject to ongoing assessment.', recommendation: 'Deploy scenario-based financial modelling using 1.5°C, 2°C and 4°C pathways', effort: 'High' },
    { article: 'ESRS S1-7', topic: 'Collective Bargaining Coverage', description: 'Percentage of workforce covered by collective agreements not disclosed by country', severity: 'medium', evidence: 'We respect workers\' rights to collective bargaining in all jurisdictions where we operate.', recommendation: 'Collect HR data by country; report coverage rate per ESRS S1-7 datapoint requirement', effort: 'Medium' },
    { article: 'ESRS G1-1', topic: 'Business Conduct Policies', description: 'Anti-corruption policy not linked to OECD Guidelines; third-party due diligence process absent', severity: 'medium', evidence: 'We maintain a Code of Conduct that prohibits bribery and corruption in all forms.', recommendation: 'Update policy with explicit OECD Guidelines reference; implement third-party compliance screening', effort: 'Medium' },
    { article: 'ESRS E3-1', topic: 'Water & Marine Resources Policy', description: 'No water stewardship policy referencing water-stressed basins; no targets for withdrawal reduction', severity: 'low', evidence: 'Water conservation is part of our environmental management approach.', recommendation: 'Adopt Alliance for Water Stewardship standard; disclose withdrawal by source type and stressed basin', effort: 'Low' },
  ],
  issb: [
    { article: 'IFRS S2 para 29', topic: 'Climate Risk Transition Plan', description: 'Credible transition plan not disclosed; no interim milestones or capital allocation commitments', severity: 'critical', evidence: 'We are committed to net zero by 2050 and are developing our transition roadmap.', recommendation: 'Publish ISSB-aligned transition plan with 5-year capital expenditure plan and interim 2030 targets', effort: 'High' },
    { article: 'IFRS S2 para 21', topic: 'Climate-Related Opportunities', description: 'Opportunities section limited to renewables capex; green product revenue potential not quantified', severity: 'medium', evidence: 'We see significant opportunities in the transition to a low-carbon economy.', recommendation: 'Quantify green revenue opportunity by business line with probability-weighted financial projections', effort: 'Medium' },
    { article: 'IFRS S1 para 12', topic: 'Sustainability Governance', description: 'Board-level sustainability oversight body not described; skill matrix absent', severity: 'medium', evidence: 'The Board oversees our sustainability strategy and progress.', recommendation: 'Disclose board committee charter, member ESG expertise, and frequency of climate risk reviews', effort: 'Low' },
    { article: 'IFRS S2 para 33', topic: 'GHG Emission Metrics', description: 'Biogenic CO2 emissions and removals excluded from reporting; prior period restatement policy absent', severity: 'medium', evidence: 'Total Scope 1, 2 (market-based) and selected Scope 3 emissions are reported.', recommendation: 'Add biogenic CO2 disclosure per IFRS S2 cross-reference to GHG Protocol Land Sector guidance', effort: 'Medium' },
  ],
  tcfd: [
    { article: 'TCFD Gov-a', topic: 'Board Oversight Process', description: 'Process for informing board of climate matters not described; no frequency or escalation triggers', severity: 'critical', evidence: 'Climate change is a standing agenda item at our quarterly board meetings.', recommendation: 'Document board oversight process including information flow, decision rights, and committee structure', effort: 'Low' },
    { article: 'TCFD Risk-a', topic: 'Climate Risk Identification', description: 'Short-, medium- and long-term time horizons not explicitly defined; risk identification process opaque', severity: 'medium', evidence: 'We identify climate risks across our operations and supply chain.', recommendation: 'Define three time horizons (0–3yr, 3–10yr, 10yr+) with explicit risk horizon alignment', effort: 'Low' },
    { article: 'TCFD Met-b', topic: 'Scope 1 & 2 GHG Metrics', description: 'Scope 2 market-based figure not separately reported; location-based only provided', severity: 'medium', evidence: 'Our Scope 2 emissions reflect energy consumption across all facilities.', recommendation: 'Report both location-based and market-based Scope 2 per TCFD supplemental guidance', effort: 'Low' },
  ],
  sfdr: [
    { article: 'Art. 4 SFDR', topic: 'PAI Statement Completeness', description: '18 mandatory PAI indicators: 6 missing — PAI 4 (Fossil fuel exposure), PAI 7 (Non-renewable energy), PAI 10 (Land degradation), PAI 11 (Water stress), PAI 14 (Social violations), PAI 18 (Unadjusted pay gap)', severity: 'critical', evidence: 'We consider the principal adverse impacts of our investment decisions on sustainability factors.', recommendation: 'Complete all 18 mandatory PAI indicators using ESMA RTS template; engage data provider for coverage gaps', effort: 'High' },
    { article: 'Art. 8 SFDR', topic: 'E/S Characteristics Disclosure', description: 'Pre-contractual documents for Art. 8 funds do not include binding sustainable investment commitment percentage', severity: 'critical', evidence: 'This fund promotes environmental and social characteristics as described herein.', recommendation: 'Add minimum sustainable investment percentage commitment with methodology in fund prospectus', effort: 'Medium' },
    { article: 'Art. 9 SFDR', topic: 'Taxonomy Alignment', description: 'EU Taxonomy alignment percentage for Art. 9 fund not reported; Do No Significant Harm assessment absent', severity: 'medium', evidence: 'The fund has sustainable investment as its objective.', recommendation: 'Calculate and disclose EU Taxonomy alignment % using DNSH technical screening criteria per Delegated Regulation', effort: 'High' },
  ],
  gri: [
    { article: 'GRI 305-3', topic: 'Scope 3 Downstream Emissions', description: 'Category 12 (End-of-life treatment) emissions not estimated; sold products lifecycle analysis absent', severity: 'medium', evidence: 'We track Scope 3 emissions for the most material categories identified in our screening.', recommendation: 'Commission product LCA for top 5 product lines; estimate category 12 per GRI 305-3 guidance', effort: 'High' },
    { article: 'GRI 403-9', topic: 'Work-related Injuries', description: 'High-consequence injury rate by gender and employment type not reported; contractor data excluded', severity: 'medium', evidence: 'Our TRIR was 0.4 per 200,000 hours worked in 2024, below industry average.', recommendation: 'Disaggregate injury data by gender, employment type, and contractor status; include near-miss data', effort: 'Medium' },
    { article: 'GRI 207-4', topic: 'Country-by-Country Tax Reporting', description: 'CbCR data not publicly disclosed; tax transparency report not published', severity: 'low', evidence: 'We comply with all applicable tax laws and regulations in each jurisdiction.', recommendation: 'Publish voluntary CbCR aligning with GRI 207-4 and B Team Responsible Tax Principles', effort: 'Medium' },
  ],
  sec: [
    { article: 'SEC Rule 14b', topic: 'Material Climate Risks in 10-K', description: 'Climate risk disclosure in Risk Factors section lacks quantification; generic language used', severity: 'critical', evidence: 'Climate change poses risks to our operations that could materially impact financial results.', recommendation: 'Quantify top 3 climate risks with scenario-based financial impact estimates; link to MD&A', effort: 'Medium' },
    { article: 'SEC Rule 14c', topic: 'GHG Emissions Attestation', description: 'Third-party assurance on Scope 1 and 2 emissions not obtained; self-reported figures only', severity: 'critical', evidence: 'Our GHG emissions are reported in accordance with the GHG Protocol Corporate Standard.', recommendation: 'Engage Big 4 or specialist assurance provider for limited assurance on Scope 1+2 per PCAOB guidance', effort: 'High' },
    { article: 'SEC Rule 14f', topic: 'Capitalized Costs Disclosure', description: 'Climate-related capitalized costs not separately identified in financial statements', severity: 'medium', evidence: 'Capital expenditures include investments in renewable energy and energy efficiency.', recommendation: 'Tag and disclose climate-related capex separately in financial statements with materiality threshold', effort: 'Medium' },
  ],
  tnfd: [
    { article: 'TNFD Req C', topic: 'Nature-Related Dependencies', description: 'Dependency mapping on natural capital (water, soil, biodiversity) not completed for operations', severity: 'critical', evidence: 'We recognize our operations are dependent on healthy ecosystems.', recommendation: 'Deploy LEAP methodology (Locate, Evaluate, Assess, Prepare) across Tier 1 operations', effort: 'High' },
    { article: 'TNFD Req D', topic: 'Biodiversity Impact Assessment', description: 'Biodiversity footprint not quantified; no Mean Species Abundance or Species Threat Abatement metric', severity: 'critical', evidence: 'Protecting biodiversity is a priority for our environmental management programme.', recommendation: 'Implement Biodiversity Footprint Financial Institutions (BFFI) methodology; report MSA.km² impact', effort: 'High' },
    { article: 'TNFD Met-3', topic: 'Nature-Related Financial Risks', description: 'Physical and transition nature-related financial risks not separately quantified from climate risks', severity: 'medium', evidence: 'Nature-related risks are considered as part of our broader sustainability risk framework.', recommendation: 'Separate nature risk from climate risk in financial risk quantification; use ENCORE tool', effort: 'Medium' },
  ],
  uksdr: [
    { article: 'SDR Rule 4.1', topic: 'Sustainability Label Integrity', description: 'Product labelled "Sustainable Focus" but 23% of holdings lack sustainability data', severity: 'critical', evidence: 'This fund is classified as Sustainable Focus under the UK SDR regime.', recommendation: 'Increase data coverage to 90%+ before label use; implement data gap remediation plan with custodian', effort: 'High' },
    { article: 'SDR Rule 4.2', topic: 'Consumer-Facing Disclosure', description: 'Consumer-facing document exceeds FCA prescribed format; technical language not simplified', severity: 'medium', evidence: 'The fund\'s sustainability objective, investment policy and characteristics are disclosed herein.', recommendation: 'Rewrite consumer document using FCA plain language templates; conduct user testing', effort: 'Low' },
    { article: 'SDR Rule 6.1', topic: 'Ongoing Product Monitoring', description: 'Quarterly sustainability assessment process not documented; no board sign-off procedure', severity: 'medium', evidence: 'We regularly review our fund\'s sustainability characteristics.', recommendation: 'Document quarterly review process with named responsible persons and board escalation triggers', effort: 'Low' },
  ],
};

const AGENT_LOG = [
  { step: 1, action: 'INITIALIZE', finding: 'Loaded CSRD framework v2.0 — 82 ESRS datapoints across 12 topical standards', confidence: 1.00 },
  { step: 2, action: 'FETCH_DOCS', finding: 'Retrieved 3 documents: Annual Report 2024 (487pg), Sustainability Report 2024 (312pg), TCFD Report 2023 (94pg)', confidence: 0.98 },
  { step: 3, action: 'PARSE_E1', finding: 'ESRS E1 climate change section found — 847 tokens extracted, 6 mandatory datapoints located', confidence: 0.94 },
  { step: 4, action: 'CROSS_REF', finding: 'Cross-referencing ESRS E1-9 financial effects against IFRS S2 para 29 — 2 disclosure overlaps identified', confidence: 0.91 },
  { step: 5, action: 'GAP_DETECT', finding: 'CSRD GAP DETECTED: ESRS E1-6 Scope 3 categories 1–8 absent — confidence 0.93', confidence: 0.93 },
  { step: 6, action: 'EVIDENCE_MAP', finding: 'Evidence for ESRS E1-6 gap: "upstream quantification is ongoing" — classified as Disclosed (partial)', confidence: 0.89 },
  { step: 7, action: 'PARSE_ISSB', finding: 'ISSB S1+S2 scan initiated — loaded IOSCO endorsement framework; 28 disclosure requirements indexed', confidence: 0.97 },
  { step: 8, action: 'GAP_DETECT', finding: 'ISSB GAP DETECTED: IFRS S2 para 29 transition plan milestones absent — severity critical', confidence: 0.95 },
  { step: 9, action: 'PARSE_TCFD', finding: 'TCFD 11-pillar scan — Governance, Strategy, Risk Management, Metrics & Targets assessed', confidence: 0.96 },
  { step: 10, action: 'GAP_DETECT', finding: 'TCFD GAP DETECTED: TCFD Gov-a board oversight process undescribed — low effort fix available', confidence: 0.88 },
  { step: 11, action: 'PARSE_SFDR', finding: 'SFDR PAI indicator scan — 18 mandatory indicators checked; cross-referencing ESMA RTS Annex I template', confidence: 0.97 },
  { step: 12, action: 'GAP_DETECT', finding: 'SFDR GAP DETECTED: 6 of 18 mandatory PAI indicators missing — critical compliance failure', confidence: 0.96 },
  { step: 13, action: 'PARSE_GRI', finding: 'GRI Universal Standards + Sector Standards (Financial Services GRI 18) scan initiated', confidence: 0.93 },
  { step: 14, action: 'PARSE_SEC', finding: 'SEC Climate Rule final guidance loaded — 10-K Risk Factors and Financial Statement items checked', confidence: 0.95 },
  { step: 15, action: 'GAP_DETECT', finding: 'SEC GAP DETECTED: Material climate risk quantification absent in 10-K Risk Factors — SEC enforcement risk', confidence: 0.92 },
  { step: 16, action: 'PARSE_TNFD', finding: 'TNFD LEAP methodology scan — Locate, Evaluate, Assess, Prepare phases cross-referenced', confidence: 0.91 },
  { step: 17, action: 'GAP_DETECT', finding: 'TNFD GAP DETECTED: No biodiversity footprint metric — MSA.km² or equivalent absent', confidence: 0.89 },
  { step: 18, action: 'PARSE_UKSDR', finding: 'UK SDR FCA Consultation Paper CP22/20 framework loaded — 4 label categories checked', confidence: 0.97 },
  { step: 19, action: 'CROSS_FRAMEWORK', finding: 'Cross-framework efficiency: ESRS E1-6 Scope 3 data satisfies TCFD Met-b and ISSB S2 para 33 simultaneously', confidence: 0.87 },
  { step: 20, action: 'COMPLETE', finding: 'Scan complete — 24 gaps identified across 8 frameworks. Critical: 9 | Medium: 11 | Low: 4. Composite score: calculated.', confidence: 0.95 },
];

function buildCompanyData(companyIdx) {
  const base = companyIdx * 100;
  const fwData = {};
  FRAMEWORKS.forEach((fw, fi) => {
    const seed = base + fi * 7;
    const compPct = Math.round(35 + sr(seed) * 60);
    const gaps = GAP_TEMPLATES[fw.id] || [];
    const gapItems = gaps.map((g, gi) => ({
      ...g,
      gapId: `${fw.id.toUpperCase()}-${String(gi + 1).padStart(2, '0')}`,
      evidenceConfidence: Math.round(70 + sr(seed + gi * 3) * 28),
      daysToDeadline: fw.deadline === 'Voluntary' ? 999 : Math.round(sr(seed + gi) * 400 - 50),
      ownerFn: ['Finance', 'Legal', 'Sustainability', 'Risk', 'Operations', 'Compliance'][Math.floor(sr(seed + gi * 2) * 6)],
      status: ['Not Started', 'In Progress', 'Under Review'][Math.floor(sr(seed + gi * 5) * 3)],
    }));
    const critical = gapItems.filter(g => g.severity === 'critical').length;
    const medium = gapItems.filter(g => g.severity === 'medium').length;
    const low = gapItems.filter(g => g.severity === 'low').length;
    fwData[fw.id] = { compliancePct: compPct, gaps: gapItems, critical, medium, low, total: gapItems.length };
  });
  return fwData;
}

const EFFORT_DAYS = { Low: 5, Medium: 15, High: 30 };
const FINE_MULTIPLIERS = { csrd: 1e7, issb: 5e6, tcfd: 2e6, sfdr: 3e6, gri: 5e5, sec: 8e6, tnfd: 1e6, uksdr: 2e6 };

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const Pill = ({ children, color = T.navy, bg, onClick, active }) => (
  <button onClick={onClick} style={{
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontFamily: T.font, cursor: 'pointer',
    border: `1px solid ${active ? color : T.border}`,
    background: active ? color : (bg || T.surface), color: active ? '#fff' : T.textSec,
    fontWeight: active ? 600 : 400, transition: 'all 0.15s'
  }}>{children}</button>
);

const Badge = ({ sev }) => {
  const map = { critical: [T.red, '#fef2f2'], medium: [T.amber, '#fffbeb'], low: [T.green, '#f0fdf4'] };
  const [c, bg] = map[sev] || [T.textMut, T.surfaceH];
  return <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontFamily: T.mono, background: bg, color: c, fontWeight: 600, border: `1px solid ${c}22` }}>{sev?.toUpperCase()}</span>;
};

const EffortBadge = ({ effort }) => {
  const map = { Low: [T.green, '#f0fdf4'], Medium: [T.amber, '#fffbeb'], High: [T.red, '#fef2f2'] };
  const [c, bg] = map[effort] || [T.textMut, T.surfaceH];
  return <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontFamily: T.mono, background: bg, color: c, fontWeight: 600 }}>{effort}</span>;
};

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 120 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: color || T.navy, fontFamily: T.mono, margin: '4px 0 2px' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.font }}>{sub}</div>}
  </div>
);

// ─── TAB 1: AGENT CONSOLE ────────────────────────────────────────────────────

function TabAgentConsole({ company, setCompany, companyData }) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);
  const logRef = useRef(null);

  const startScan = () => {
    setRunning(true); setIsComplete(false); setCurrentStep(0);
    let s = 0;
    intervalRef.current = setInterval(() => {
      s++;
      setCurrentStep(s);
      if (s >= AGENT_LOG.length) {
        clearInterval(intervalRef.current);
        setRunning(false); setIsComplete(true);
      }
    }, 150);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [currentStep]);

  const visibleLog = AGENT_LOG.slice(0, currentStep);
  const totalGaps = FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.total || 0), 0);
  const criticalGaps = FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.critical || 0), 0);
  const mediumGaps = FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.medium || 0), 0);
  const compositeScore = Math.round(FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.compliancePct || 0), 0) / FRAMEWORKS.length);

  const confidenceHist = useMemo(() => {
    const bins = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
    return bins.slice(0, -1).map((b, i) => ({
      range: `${Math.round(b * 100)}–${Math.round(bins[i + 1] * 100)}%`,
      count: AGENT_LOG.filter(s => s.confidence >= b && s.confidence < bins[i + 1]).length
    }));
  }, []);

  const actionColors = { INITIALIZE: T.blue, FETCH_DOCS: T.sage, PARSE_E1: T.purple, CROSS_REF: T.amber, GAP_DETECT: T.red, EVIDENCE_MAP: T.orange, PARSE_ISSB: T.purple, PARSE_TCFD: T.navyL, PARSE_SFDR: T.red, PARSE_GRI: T.sage, PARSE_SEC: T.amber, PARSE_TNFD: T.teal, PARSE_UKSDR: T.navyL, CROSS_FRAMEWORK: T.gold, COMPLETE: T.green };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 11, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>COMPANY</label>
          <select value={company} onChange={e => { setCompany(e.target.value); setIsComplete(false); setCurrentStep(0); }}
            style={{ fontFamily: T.font, fontSize: 14, color: T.text, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 12px', minWidth: 220 }}>
            {COMPANIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 18 }}>
          <button onClick={isComplete ? startScan : running ? undefined : startScan}
            disabled={running}
            style={{ padding: '8px 20px', background: running ? T.textMut : T.navy, color: '#fff', border: 'none', borderRadius: 6, fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            {running ? <><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22d3ee', animation: 'pulse 1s infinite' }} />Scanning...</> : isComplete ? 'Rerun Scan' : 'Run Full Compliance Scan'}
          </button>
        </div>
      </div>

      {/* Terminal panel */}
      <div ref={logRef} style={{
        background: '#0f172a', borderRadius: 8, padding: 16, minHeight: 220, maxHeight: 280, overflowY: 'auto',
        fontFamily: T.mono, fontSize: 12, border: `1px solid #1e293b`
      }}>
        {currentStep === 0 && !running && (
          <div style={{ color: '#475569', fontStyle: 'italic' }}>$ ai-compliance-agent --mode full --company "{company}"</div>
        )}
        {visibleLog.map((s, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <span style={{ color: '#64748b' }}>[{String(s.step).padStart(2, '0')}]</span>{' '}
            <span style={{ color: actionColors[s.action] || '#22d3ee', fontWeight: 600 }}>{s.action}</span>{' '}
            <span style={{ color: '#e2e8f0' }}>{s.finding}</span>{' '}
            <span style={{ color: '#64748b' }}>conf={s.confidence.toFixed(2)}</span>
          </div>
        ))}
        {running && <div style={{ color: '#22d3ee', marginTop: 4 }}>▌</div>}
      </div>

      {isComplete && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatCard label="Composite Score" value={`${compositeScore}%`} sub="avg across 8 frameworks" color={compositeScore > 70 ? T.green : compositeScore > 50 ? T.amber : T.red} />
            <StatCard label="Critical Gaps" value={criticalGaps} sub="immediate action required" color={T.red} />
            <StatCard label="Medium Gaps" value={mediumGaps} sub="action within 90 days" color={T.amber} />
            <StatCard label="Total Gaps" value={totalGaps} sub="across all frameworks" color={T.navy} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
            {FRAMEWORKS.map(fw => {
              const d = companyData[fw.id];
              const pct = d?.compliancePct || 0;
              return (
                <div key={fw.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font, marginBottom: 6 }}>{fw.name}</div>
                  <div style={{ background: T.surfaceH, borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct > 70 ? T.green : pct > 50 ? T.amber : T.red, borderRadius: 4, transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono }}>
                    <span style={{ color: T.textMut }}>{fw.regulator}</span>
                    <span style={{ fontWeight: 700, color: pct > 70 ? T.green : pct > 50 ? T.amber : T.red }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font, marginBottom: 12 }}>Agent Reasoning Confidence Distribution</div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={confidenceHist} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fontFamily: T.mono, fill: T.textMut }} />
                <YAxis tick={{ fontSize: 11, fontFamily: T.mono, fill: T.textMut }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Bar dataKey="count" name="Steps" fill={T.navyL} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAB 2: GAP ANALYSIS MATRIX ──────────────────────────────────────────────

function TabGapAnalysis({ companyData }) {
  const [activeFw, setActiveFw] = useState('csrd');
  const [sevFilter, setSevFilter] = useState('all');
  const [expandedGap, setExpandedGap] = useState(null);

  const fw = FRAMEWORKS.find(f => f.id === activeFw);
  const fwData = companyData[activeFw] || { gaps: [], critical: 0, medium: 0, low: 0, total: 0 };

  const filtered = useMemo(() => {
    let g = [...fwData.gaps];
    if (sevFilter !== 'all') g = g.filter(x => x.severity === sevFilter);
    return g.sort((a, b) => ({ critical: 0, medium: 1, low: 2 }[a.severity] - { critical: 0, medium: 1, low: 2 }[b.severity]));
  }, [fwData.gaps, sevFilter]);

  const totalDays = fwData.gaps.reduce((a, g) => a + EFFORT_DAYS[g.effort], 0);
  const quickFix = fwData.gaps.filter(g => g.effort === 'Low' && g.severity === 'critical');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FRAMEWORKS.map(f => <Pill key={f.id} active={activeFw === f.id} color={f.color} onClick={() => { setActiveFw(f.id); setSevFilter('all'); setExpandedGap(null); }}>{f.name}</Pill>)}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="Total Gaps" value={fwData.total} color={T.navy} />
        <StatCard label="Critical" value={fwData.critical} color={T.red} />
        <StatCard label="Avg Effort" value={fwData.gaps.length ? `${Math.round(totalDays / fwData.gaps.length)}d` : '—'} color={T.amber} />
        <StatCard label="Person-Days Total" value={totalDays} sub="to remediate all gaps" color={T.purple} />
      </div>

      {quickFix.length > 0 && (
        <div style={{ background: '#fef9ec', border: `1px solid ${T.gold}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, fontFamily: T.mono, marginBottom: 8 }}>QUICK FIX OPPORTUNITIES — Low Effort + Critical Severity</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quickFix.map(g => <span key={g.gapId} style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontFamily: T.font, color: T.amber }}>{g.gapId} — {g.topic}</span>)}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: T.textMut, fontFamily: T.font }}>Filter:</span>
        {['all', 'critical', 'medium', 'low'].map(s => <Pill key={s} active={sevFilter === s} color={{ all: T.navy, critical: T.red, medium: T.amber, low: T.green }[s]} onClick={() => setSevFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</Pill>)}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Gap ID', 'Article', 'Topic', 'Severity', 'Description', 'Effort', 'Agent Conf.'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((g, i) => (
              <React.Fragment key={g.gapId}>
                <tr style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, cursor: 'pointer', borderLeft: expandedGap === g.gapId ? `3px solid ${T.gold}` : '3px solid transparent' }}
                  onClick={() => setExpandedGap(expandedGap === g.gapId ? null : g.gapId)}>
                  <td style={{ padding: '8px 10px', fontFamily: T.mono, color: fw.color, fontWeight: 600 }}>{g.gapId}</td>
                  <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.textSec, whiteSpace: 'nowrap' }}>{g.article}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: T.text }}>{g.topic}</td>
                  <td style={{ padding: '8px 10px' }}><Badge sev={g.severity} /></td>
                  <td style={{ padding: '8px 10px', color: T.textSec, maxWidth: 280 }}>{g.description}</td>
                  <td style={{ padding: '8px 10px' }}><EffortBadge effort={g.effort} /></td>
                  <td style={{ padding: '8px 10px', fontFamily: T.mono, color: g.evidenceConfidence > 85 ? T.green : g.evidenceConfidence > 70 ? T.amber : T.red }}>{g.evidenceConfidence}%</td>
                </tr>
                {expandedGap === g.gapId && (
                  <tr>
                    <td colSpan={7} style={{ background: '#f8f6ff', padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 4 }}>Evidence (Verbatim)</div>
                          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, fontSize: 12, fontFamily: T.font, color: T.text, fontStyle: 'italic', lineHeight: 1.6 }}>"{g.evidence}"</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 4 }}>Recommendation</div>
                          <div style={{ background: '#f0fdf4', border: `1px solid #bbf7d0`, borderRadius: 6, padding: 10, fontSize: 12, fontFamily: T.font, color: T.green, lineHeight: 1.6 }}>{g.recommendation}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB 3: REGULATORY DEADLINE RISK ─────────────────────────────────────────

function TabDeadlineRisk({ companyData }) {
  const TODAY_YR = 2026 + 3 / 12; // April 2026

  const fwRisk = FRAMEWORKS.map((fw, i) => {
    const pct = companyData[fw.id]?.compliancePct || 50;
    const daysLeft = fw.deadline === 'Voluntary' ? 999 : Math.round((fw.deadlineTs - TODAY_YR) * 365);
    const status = pct > 70 ? 'green' : pct > 50 ? 'amber' : 'red';
    const fine = FINE_MULTIPLIERS[fw.id] || 1e6;
    const exposure = Math.round(fine * (1 - pct / 100));
    const urgencyW = daysLeft < 0 ? 3 : daysLeft < 180 ? 2 : 1;
    const totalDays = (companyData[fw.id]?.gaps || []).reduce((a, g) => a + EFFORT_DAYS[g.effort], 0) || 1;
    const priority = (exposure * urgencyW) / totalDays;
    return { ...fw, pct, daysLeft, status, fine, exposure, priority };
  }).sort((a, b) => b.priority - a.priority);

  const timelineData = FRAMEWORKS.map(fw => ({
    name: fw.name, start: 2023, end: fw.deadlineTs, pct: companyData[fw.id]?.compliancePct || 50, color: fw.color
  }));

  const matrixData = fwRisk.map(fw => ({
    name: fw.name.replace('/', '\n'), x: fw.pct, y: FINE_MULTIPLIERS[fw.id] / 1e6, color: fw.color
  }));

  const exposureData = fwRisk.map(fw => ({ name: fw.name, exposure: Math.round(fw.exposure / 1e6 * 10) / 10 }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Timeline */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font, marginBottom: 12 }}>Framework Deadline Timeline (2023–2027)</div>
        <div style={{ position: 'relative', height: 200, overflowX: 'auto' }}>
          {FRAMEWORKS.map((fw, i) => {
            const pct = companyData[fw.id]?.compliancePct || 50;
            const leftPct = ((fw.deadlineTs - 2023) / (2027 - 2023)) * 100;
            const todayPct = ((TODAY_YR - 2023) / (2027 - 2023)) * 100;
            return (
              <div key={fw.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ width: 90, fontSize: 11, fontFamily: T.mono, color: T.textSec, textAlign: 'right', paddingRight: 10 }}>{fw.name}</div>
                <div style={{ flex: 1, position: 'relative', height: 20, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, width: `${leftPct}%`, height: '100%', background: `${fw.color}33`, borderRight: `2px solid ${fw.color}` }} />
                  <div style={{ position: 'absolute', left: `${leftPct}%`, top: 0, transform: 'translateX(-50%)', background: fw.color, color: '#fff', fontSize: 10, fontFamily: T.mono, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{pct}%</div>
                  <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, width: 2, height: '100%', background: T.red }} title="Today" />
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 100, fontSize: 10, fontFamily: T.mono, color: T.textMut, marginTop: 4 }}>
            {['2023', '2024', '2025', '2026', '2027'].map(y => <span key={y}>{y}</span>)}
          </div>
        </div>
      </div>

      {/* Fine Exposure */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font, marginBottom: 12 }}>Estimated Fine Exposure (€M / Worst-Case × Compliance Gap)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={exposureData} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fontFamily: T.mono, fill: T.textMut }} tickFormatter={v => `€${v}M`} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontFamily: T.mono, fill: T.textSec }} width={80} />
            <Tooltip formatter={v => [`€${v}M`, 'Est. Exposure']} contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
            <Bar dataKey="exposure" radius={[0, 3, 3, 0]}>
              {exposureData.map((_, i) => <Cell key={i} fill={FRAMEWORKS[i]?.color || T.navy} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Priority Ranking */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font, marginBottom: 12 }}>Regulatory Priority Ranking (Fine Exposure × Urgency / Effort)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Rank', 'Framework', 'Readiness', 'Days Left', 'Est. Exposure', 'Fine Risk', 'Status'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fwRisk.map((fw, i) => (
              <tr key={fw.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ padding: '8px 10px', fontFamily: T.mono, fontWeight: 700, color: i < 3 ? T.red : T.textSec }}>#{i + 1}</td>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: fw.color }}>{fw.name}</td>
                <td style={{ padding: '8px 10px', fontFamily: T.mono, color: fw.pct > 70 ? T.green : fw.pct > 50 ? T.amber : T.red }}>{fw.pct}%</td>
                <td style={{ padding: '8px 10px', fontFamily: T.mono, color: fw.daysLeft < 0 ? T.red : fw.daysLeft < 180 ? T.amber : T.textSec }}>{fw.daysLeft < 0 ? `${Math.abs(fw.daysLeft)}d overdue` : fw.deadline === 'Voluntary' ? 'Voluntary' : `${fw.daysLeft}d`}</td>
                <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.red, fontWeight: 600 }}>€{(fw.exposure / 1e6).toFixed(1)}M</td>
                <td style={{ padding: '8px 10px', color: T.textSec }}>{fw.fineRisk}</td>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: { green: T.green, amber: T.amber, red: T.red }[fw.status], marginRight: 6 }} />
                  <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{fw.status.toUpperCase()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB 4: EVIDENCE MAPPER ───────────────────────────────────────────────────

function TabEvidenceMapper({ companyData }) {
  const [selectedGap, setSelectedGap] = useState(null);

  const allGaps = useMemo(() => FRAMEWORKS.flatMap(fw =>
    (companyData[fw.id]?.gaps || []).map(g => ({ ...g, fwName: fw.name, fwColor: fw.color, fwId: fw.id }))
  ), [companyData]);

  const classifyEvidence = (evidence) => {
    if (!evidence || evidence === 'Not disclosed') return 'None';
    if (evidence.includes('ongoing') || evidence.includes('ongoing assessment') || evidence.includes('regularly') || evidence.includes('consider')) return 'Partial';
    return 'Full';
  };

  const evidenceStats = FRAMEWORKS.map(fw => {
    const gaps = companyData[fw.id]?.gaps || [];
    return {
      name: fw.name,
      Full: gaps.filter(g => classifyEvidence(g.evidence) === 'Full').length,
      Partial: gaps.filter(g => classifyEvidence(g.evidence) === 'Partial').length,
      None: gaps.filter(g => classifyEvidence(g.evidence) === 'None').length,
    };
  });

  const zeroEvidenceGaps = allGaps.filter(g => classifyEvidence(g.evidence) === 'None');
  const crossFwOpportunities = [
    { gap1: 'CSRD-01 (ESRS E1-6 Scope 3)', gap2: 'TCFD Met-b (Scope 1&2)', saving: 'Single Scope 3 dataset satisfies both; est. 15 person-days saved' },
    { gap1: 'ISSB S2 para 33 (GHG Metrics)', gap2: 'SEC Rule 14b (Material Climate Risks)', saving: 'ISSB disclosure template covers SEC climate risk narrative; est. 10 person-days saved' },
    { gap1: 'CSRD E1-9 (Financial Effects)', gap2: 'ISSB S2 para 29 (Transition Plan)', saving: 'CSRD E1-9 scenario analysis directly populates ISSB S2 requirements; est. 20 person-days saved' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Evidence Strength Chart */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font, marginBottom: 12 }}>Evidence Coverage by Framework (Full / Partial / None)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={evidenceStats} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textMut }} />
            <YAxis tick={{ fontSize: 11, fontFamily: T.mono, fill: T.textMut }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
            <Bar dataKey="Full" stackId="a" fill={T.green} />
            <Bar dataKey="Partial" stackId="a" fill={T.amber} />
            <Bar dataKey="None" stackId="a" fill={T.red} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cross-Framework Efficiency */}
      <div style={{ background: '#f0fdf4', border: `1px solid #bbf7d0`, borderRadius: 8, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.green, fontFamily: T.mono, marginBottom: 10 }}>CROSS-FRAMEWORK EFFICIENCY OPPORTUNITIES</div>
        {crossFwOpportunities.map((o, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, padding: '8px 10px', background: T.surface, borderRadius: 6, border: `1px solid #dcfce7` }}>
            <span style={{ fontSize: 16, marginTop: 1 }}>🔗</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font }}>{o.gap1} ↔ {o.gap2}</div>
              <div style={{ fontSize: 11, color: T.green, fontFamily: T.font, marginTop: 2 }}>{o.saving}</div>
            </div>
          </div>
        ))}
      </div>

      {/* All Gaps Evidence Table */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font, marginBottom: 10 }}>Full Evidence Map — Click Row to Expand Verbatim Text</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Framework', 'Gap ID', 'Article', 'Topic', 'Evidence Status', 'Severity', 'Agent Conf.'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allGaps.map((g, i) => {
              const evType = classifyEvidence(g.evidence);
              const evColor = evType === 'Full' ? T.green : evType === 'Partial' ? T.amber : T.red;
              return (
                <React.Fragment key={g.gapId + i}>
                  <tr style={{ background: i % 2 === 0 ? T.surface : T.surfaceH, cursor: 'pointer', borderLeft: selectedGap === g.gapId + i ? `3px solid ${T.gold}` : '3px solid transparent' }}
                    onClick={() => setSelectedGap(selectedGap === g.gapId + i ? null : g.gapId + i)}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: g.fwColor, fontFamily: T.mono, fontSize: 11 }}>{g.fwName}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.mono, color: T.textSec }}>{g.gapId}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.mono, color: T.textSec, whiteSpace: 'nowrap', fontSize: 11 }}>{g.article}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{g.topic}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: evColor + '22', color: evColor, border: `1px solid ${evColor}44`, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontFamily: T.mono, fontWeight: 600 }}>{evType}</span>
                    </td>
                    <td style={{ padding: '7px 10px' }}><Badge sev={g.severity} /></td>
                    <td style={{ padding: '7px 10px', fontFamily: T.mono, color: g.evidenceConfidence > 85 ? T.green : g.evidenceConfidence > 70 ? T.amber : T.red }}>{g.evidenceConfidence}%</td>
                  </tr>
                  {selectedGap === g.gapId + i && (
                    <tr>
                      <td colSpan={7} style={{ background: '#fffbeb', padding: '10px 14px', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 4 }}>Verbatim Evidence from Disclosure Document</div>
                        <div style={{ fontSize: 12, fontFamily: T.font, color: T.text, fontStyle: 'italic', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, lineHeight: 1.7 }}>
                          "{g.evidence}"
                          <span style={{ display: 'inline-block', marginLeft: 8, background: evColor + '22', color: evColor, fontSize: 10, fontFamily: T.mono, padding: '1px 6px', borderRadius: 4, fontStyle: 'normal' }}>
                            {evType === 'Full' ? 'FULLY DISCLOSED' : evType === 'Partial' ? 'PARTIALLY DISCLOSED' : 'NOT DISCLOSED'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {zeroEvidenceGaps.length > 0 && (
        <div style={{ background: '#fef2f2', border: `1px solid ${T.red}44`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.red, fontFamily: T.mono, marginBottom: 8 }}>ZERO EVIDENCE GAPS — HIGHEST REMEDIATION URGENCY ({zeroEvidenceGaps.length} gaps)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {zeroEvidenceGaps.map(g => (
              <span key={g.gapId} style={{ background: T.surface, border: `1px solid ${T.red}44`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontFamily: T.mono, color: T.red }}>{g.gapId} / {g.topic}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB 5: REMEDIATION ROADMAP ───────────────────────────────────────────────

function TabRemediationRoadmap({ company, companyData }) {
  const allGaps = useMemo(() => {
    let priority = 0;
    return FRAMEWORKS.flatMap(fw =>
      (companyData[fw.id]?.gaps || []).map(g => {
        priority++;
        const q = g.daysToDeadline < 90 ? 'Q2 2025' : g.daysToDeadline < 270 ? 'Q3 2025' : g.daysToDeadline < 450 ? 'Q4 2025' : g.daysToDeadline < 630 ? 'Q1 2026' : 'Q2 2026';
        return { ...g, fwName: fw.name, fwColor: fw.color, priority, quarter: q };
      })
    ).sort((a, b) => { const sm = { critical: 0, medium: 1, low: 2 }; return sm[a.severity] - sm[b.severity] || a.priority - b.priority; });
  }, [companyData]);

  const quarters = ['Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'];
  const qData = quarters.map(q => ({
    q,
    gaps: allGaps.filter(g => g.quarter === q),
    days: allGaps.filter(g => g.quarter === q).reduce((a, g) => a + EFFORT_DAYS[g.effort], 0)
  }));

  const quickWins = allGaps.filter(g => g.effort === 'Low').slice(0, 5);
  const critCount = allGaps.filter(g => g.severity === 'critical').length;
  const topFw = FRAMEWORKS.reduce((a, fw) => (companyData[fw.id]?.compliancePct || 0) < (companyData[a?.id]?.compliancePct || 100) ? fw : a, FRAMEWORKS[0]);
  const compositeNow = Math.round(FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.compliancePct || 0), 0) / FRAMEWORKS.length);
  const compositeAfterQ1 = Math.min(compositeNow + 12, 98);

  const boardReport = `BOARD SUSTAINABILITY COMMITTEE — COMPLIANCE STATUS REPORT
Prepared: April 2026 | Company: ${company} | Classification: Confidential

EXECUTIVE SUMMARY
Current composite compliance score across 8 regulatory frameworks: ${compositeNow}%. ${critCount} critical gaps identified requiring immediate board attention.

CRITICAL GAP 1 — ${topFw.name} (Current: ${companyData[topFw.id]?.compliancePct || 0}% compliant)
Issue: Core disclosure requirements unmet. Regulator: ${topFw.regulator}. Fine exposure: €${(FINE_MULTIPLIERS[topFw.id] / 1e6).toFixed(0)}M.
Action Required: Appoint dedicated workstream lead; complete gap remediation by Q3 2025.

CRITICAL GAP 2 — SFDR PAI Statement (6 of 18 mandatory indicators missing)
Issue: Regulatory non-compliance with ESMA RTS mandatory PAI template. ESG product restrictions at risk.
Action Required: Engage data provider immediately; complete all 18 indicators within 60 days.

CRITICAL GAP 3 — TCFD Governance Disclosure (Board oversight process undescribed)
Issue: FCA enforcement risk escalating; UK-listed entities subject to mandatory TCFD per LR 9.8.6R.
Action Required: Document board process, assign Climate Committee terms of reference — est. 5 person-days.

RECOMMENDED TIMELINE
• Q2 2025: Address all critical low-effort gaps (quick wins) — projected score improvement: +8 pts
• Q3 2025: Complete data collection for Scope 3 categories 1–8 and PAI indicators
• Q4 2025: Third-party assurance engagement for SEC-compliant GHG attestation
• Q1 2026: Full ISSB S1+S2 transition plan publication ahead of 2026 reporting season

Board approval requested for €2.1M remediation budget allocation for FY2026.`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Quick Wins */}
      <div style={{ background: '#f0fdf4', border: `1px solid #bbf7d0`, borderRadius: 8, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.green, fontFamily: T.mono, marginBottom: 10 }}>TOP 5 QUICK WINS — Low Effort + Highest Regulatory Urgency</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {quickWins.map((g, i) => (
            <div key={g.gapId} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.surface, borderRadius: 6, padding: '8px 12px', border: `1px solid #dcfce7` }}>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textMut, width: 20 }}>#{i + 1}</span>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: g.fwColor, fontWeight: 600, width: 80 }}>{g.gapId}</span>
              <span style={{ fontFamily: T.font, fontSize: 12, color: T.text, flex: 1 }}>{g.topic}</span>
              <Badge sev={g.severity} />
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{EFFORT_DAYS[g.effort]}d</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resource by Quarter */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font, marginBottom: 12 }}>Person-Days Required by Quarter</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={qData.map(q => ({ q: q.q, 'Person-Days': q.days }))} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="q" tick={{ fontSize: 12, fontFamily: T.mono, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11, fontFamily: T.mono, fill: T.textMut }} />
            <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
            <Bar dataKey="Person-Days" fill={T.navyL} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Projection */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 6 }}>Current Composite Score</div>
          <div style={{ fontSize: 36, fontWeight: 700, fontFamily: T.mono, color: compositeNow > 70 ? T.green : compositeNow > 50 ? T.amber : T.red }}>{compositeNow}%</div>
          <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.font }}>avg across 8 frameworks</div>
        </div>
        <div style={{ background: '#f0fdf4', border: `1px solid #bbf7d0`, borderRadius: 8, padding: 16, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 6 }}>After Q2 2025 Remediations</div>
          <div style={{ fontSize: 36, fontWeight: 700, fontFamily: T.mono, color: T.green }}>{compositeAfterQ1}%</div>
          <div style={{ fontSize: 11, color: T.green, fontFamily: T.font }}>+{compositeAfterQ1 - compositeNow} pts projected improvement</div>
        </div>
      </div>

      {/* Quarterly Roadmap Table */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font, marginBottom: 10 }}>Quarterly Remediation Roadmap</div>
        {qData.map(q => q.gaps.length > 0 && (
          <div key={q.q} style={{ marginBottom: 14 }}>
            <div style={{ background: T.navy, color: T.gold, fontFamily: T.mono, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: '6px 6px 0 0', display: 'flex', justifyContent: 'space-between' }}>
              <span>{q.q}</span>
              <span>{q.days} person-days | {q.gaps.length} gaps</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font, border: `1px solid ${T.border}` }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Framework', 'Gap ID', 'Topic', 'Severity', 'Effort', 'Owner', 'Status'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q.gaps.map((g, i) => (
                  <tr key={g.gapId} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '6px 10px', color: g.fwColor, fontWeight: 600, fontSize: 11, fontFamily: T.mono }}>{g.fwName}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono, color: T.textSec }}>{g.gapId}</td>
                    <td style={{ padding: '6px 10px', color: T.text }}>{g.topic}</td>
                    <td style={{ padding: '6px 10px' }}><Badge sev={g.severity} /></td>
                    <td style={{ padding: '6px 10px' }}><EffortBadge effort={g.effort} /></td>
                    <td style={{ padding: '6px 10px', color: T.textSec }}>{g.ownerFn}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{ fontSize: 11, fontFamily: T.mono, color: g.status === 'In Progress' ? T.amber : g.status === 'Under Review' ? T.green : T.textMut }}>{g.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Board Report */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          Board Report Summary
          <span style={{ fontSize: 11, background: T.navy, color: T.gold, padding: '2px 8px', borderRadius: 4, fontFamily: T.mono }}>AUTO-GENERATED</span>
        </div>
        <pre style={{ background: T.surfaceH, borderRadius: 6, padding: 14, fontSize: 11, fontFamily: T.mono, color: T.text, whiteSpace: 'pre-wrap', lineHeight: 1.7, border: `1px solid ${T.border}`, overflowX: 'auto' }}>{boardReport}</pre>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AIComplianceAgentPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [company, setCompany] = useState(COMPANIES[0]);

  const companyData = useMemo(() => buildCompanyData(COMPANIES.indexOf(company)), [company]);

  const TABS = [
    { label: 'Agent Console', short: 'AGENT' },
    { label: 'Gap Analysis Matrix', short: 'GAPS' },
    { label: 'Deadline Risk', short: 'DEADLINES' },
    { label: 'Evidence Mapper', short: 'EVIDENCE' },
    { label: 'Remediation Roadmap', short: 'ROADMAP' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      {/* Gold accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${T.navy}, ${T.gold}, ${T.navy})` }} />

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '14px 28px' }}>
        <div style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          RISK ANALYTICS / AI AGENTS / EP-BZ3
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0, letterSpacing: -0.5 }}>AI Compliance Agent</h1>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2, fontFamily: T.font }}>
              Agentic 8-framework compliance scanner: CSRD · ISSB · TCFD · SFDR · GRI · SEC · TNFD · UK SDR
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {FRAMEWORKS.map(fw => (
              <div key={fw.id} style={{ background: fw.color + '18', border: `1px solid ${fw.color}44`, borderRadius: 4, padding: '3px 8px', fontSize: 10, fontFamily: T.mono, color: fw.color, fontWeight: 600 }}>{fw.name}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 28px', display: 'flex', gap: 0 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '12px 18px', background: 'none', border: 'none', borderBottom: activeTab === i ? `2px solid ${T.gold}` : '2px solid transparent',
            color: activeTab === i ? T.navy : T.textMut, fontFamily: T.font, fontSize: 13, fontWeight: activeTab === i ? 700 : 400, cursor: 'pointer',
            transition: 'all 0.15s', marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
        {activeTab === 0 && <TabAgentConsole company={company} setCompany={setCompany} companyData={companyData} />}
        {activeTab === 1 && <TabGapAnalysis companyData={companyData} />}
        {activeTab === 2 && <TabDeadlineRisk companyData={companyData} />}
        {activeTab === 3 && <TabEvidenceMapper companyData={companyData} />}
        {activeTab === 4 && <TabRemediationRoadmap company={company} companyData={companyData} />}
      </div>

      {/* Terminal Status Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.navy, padding: '5px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>EP-BZ3 · AI COMPLIANCE AGENT · {FRAMEWORKS.length} FRAMEWORKS</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>COMPANY: <span style={{ color: '#94a3b8' }}>{company.toUpperCase()}</span></span>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>TAB: <span style={{ color: T.gold }}>{TABS[activeTab].short}</span></span>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>STATUS: <span style={{ color: T.green }}>READY</span></span>
        </div>
      </div>

      <div style={{ height: 32 }} />

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${T.surfaceH}; }
        ::-webkit-scrollbar-thumb { background: ${T.borderL}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
