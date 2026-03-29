import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
} from 'recharts';
import { REGULATORY_THRESHOLDS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

/* ── Data ──────────────────────────────────────────────────────────────────── */

const TABS = [
  'Rule Overview & Applicability',
  'Reg S-K Items 1500–1507',
  'Reg S-X Financial Disclosures',
  'GHG Emissions Reporting',
  '10-K Integration Workflow',
  'Legal Landscape & Strategy',
];

const FILER_TIMELINE = [
  { filer: 'LAF (>$700M)', float: '>$700M', skFY: 'FY 2025', sxFY: 'FY 2026', ghg: 'FY 2026', attestLimited: 'FY 2029', attestReasonable: 'FY 2033' },
  { filer: 'AF ($75M–$700M)', float: '$75M–$700M', skFY: 'FY 2026', sxFY: 'FY 2028', ghg: 'FY 2028', attestLimited: 'FY 2031', attestReasonable: 'N/A' },
  { filer: 'Non-AF / SRC', float: '<$75M', skFY: 'FY 2027', sxFY: 'N/A', ghg: 'N/A', attestLimited: 'N/A', attestReasonable: 'N/A' },
];

const SK_ITEMS = [
  {
    item: 'Item 1500', title: 'Definitions', location: 'Part II, Item 7 (MD&A)',
    summary: 'Establishes definitions for climate-related risks, physical risks, transition risks, scenario analysis, targets, and GHG emissions applicable throughout the climate disclosures.',
    sample: '"The Company defines climate-related risk as the potential adverse effects of climate change on our operations, including both physical and transition risk factors as defined in Item 1500."',
    completion: 95,
    checklist: ['Defined physical risk (acute & chronic)', 'Defined transition risk', 'Defined Scope 1 & 2 GHG', 'Defined scenario analysis as used', 'Aligned with TCFD terminology', 'Cross-referenced to financial statement disclosures'],
  },
  {
    item: 'Item 1501', title: 'Climate-Related Risks', location: 'Part II, Item 7 (MD&A)',
    summary: 'Requires disclosure of material climate-related risks (physical and transition) that have materially affected or are reasonably likely to materially affect the company\'s strategy, business model, or outlook.',
    sample: '"We face material transition risks from carbon pricing in our EU operations (~$42M annual exposure at $85/tCO2e) and physical risks from coastal flooding affecting 3 manufacturing facilities."',
    completion: 78,
    checklist: ['Identified physical risks (acute)', 'Identified physical risks (chronic)', 'Identified transition risks (regulatory)', 'Identified transition risks (market/technology)', 'Assessed materiality threshold', 'Quantified financial impact where material', 'Time horizon specified (short/medium/long-term)', 'Connected to business strategy'],
  },
  {
    item: 'Item 1502', title: 'Risk Management', location: 'Part II, Item 7 (MD&A)',
    summary: 'Requires disclosure of processes for identifying, assessing, and managing climate-related risks and how they are integrated into overall enterprise risk management.',
    sample: '"Climate risk is integrated into our ERM framework through quarterly board-level review. Physical risk assessments use IPCC RCP 4.5/8.5 scenarios across our 47 facilities using third-party geospatial tools."',
    completion: 71,
    checklist: ['Risk identification process described', 'Risk assessment methodology', 'Risk management/mitigation actions', 'Integration with overall ERM', 'Board/management oversight described', 'Third-party tools/data sources disclosed', 'Frequency of assessment stated'],
  },
  {
    item: 'Item 1503', title: 'Targets & Goals', location: 'Part II, Item 7 (MD&A)',
    summary: 'If the company has publicly disclosed climate-related targets or goals, must disclose the target, metric, baseline year, interim milestones, and progress against them.',
    sample: '"Our net zero 2050 target covers Scope 1 and 2 emissions (2019 baseline: 2.4 MtCO2e). We achieved a 31% reduction by FY2025 vs. our 2030 interim target of 50%."',
    completion: 84,
    checklist: ['Target scope defined', 'Baseline year & emissions stated', 'Interim milestones disclosed', 'Progress quantified', 'Carbon offset strategy (if used)', 'REC usage methodology (if used)', 'Third-party verification of progress'],
  },
  {
    item: 'Item 1504', title: 'Transition Plan', location: 'Part II, Item 7 (MD&A)',
    summary: 'If the company has publicly disclosed a transition plan, must disclose the relevant details including the decarbonization levers, capital allocation, and key assumptions.',
    sample: '"Our published 2035 transition plan allocates $2.1B in capex to renewable energy transitions (FY2025–2030), including 420 MW of solar PPA procurement and electrification of the light vehicle fleet."',
    completion: 68,
    checklist: ['Transition plan publicly disclosed reference', 'Key decarbonization levers described', 'Capital expenditure associated', 'Key assumptions stated', 'Dependency on emerging technology noted', 'Consistency with financial projections'],
  },
  {
    item: 'Item 1505', title: 'Scenario Analysis', location: 'Part II, Item 7 (MD&A)',
    summary: 'If the company uses scenario analysis internally to assess climate risks, must disclose the scenarios used, parameters, assumptions, and analytical results.',
    sample: '"We conducted scenario analysis using IEA Net Zero 2050 and NGFS Hot House World scenarios to assess our $14B asset portfolio\'s value-at-risk under 1.5°C and 4°C pathways."',
    completion: 62,
    checklist: ['Scenarios identified (name & source)', 'Parameters & assumptions disclosed', 'Time horizons specified', 'Quantitative or qualitative results disclosed', 'Sensitivity to scenario variables', 'Connection to strategy decisions'],
  },
  {
    item: 'Item 1506', title: 'Governance', location: 'Part II, Item 7 (MD&A)',
    summary: 'Requires disclosure of board and management oversight of climate-related risks and opportunities, including committee responsibilities and frequency of review.',
    sample: '"The Nominating & Governance Committee oversees climate strategy quarterly. The Chief Sustainability Officer reports to the CFO with monthly climate KPI dashboards distributed to the full board."',
    completion: 88,
    checklist: ['Board committee responsible named', 'Board expertise in climate matters', 'Management role described (C-suite)', 'Frequency of board review stated', 'Climate performance tied to compensation', 'Climate in board materials disclosed'],
  },
  {
    item: 'Item 1507', title: 'GHG Attestation', location: 'Part II, Item 7 (MD&A)',
    summary: 'Requires attestation of Scope 1 and Scope 2 GHG emissions by a qualified third-party attestation provider. Limited assurance from FY2029, reasonable assurance from FY2033 (LAFs).',
    sample: '"Scope 1 and Scope 2 GHG emissions have been independently verified by [Provider] to a limited assurance standard under ISAE 3410 for the period ending December 31, 2029."',
    completion: 55,
    checklist: ['Attestation provider identified', 'Assurance standard referenced (ISAE 3410 / AA1000AS)', 'Scope of attestation defined', 'Material misstatement findings (if any)', 'Provider independence confirmed', 'Timeline aligned to phased requirement'],
  },
];

const SK_CHART_DATA = SK_ITEMS.map(i => ({ name: i.item.replace('Item ', ''), completion: i.completion }));

const SX_COMPANIES = [
  { name: 'EnergyMajor Corp',     assets: 142.3, pretaxIncome: 8.4,  capexClimate: 2.1,  opexClimate: 0.18, losses: 0.09, rule1401: true,  rule1402: true,  rule1403: true,  rule1404: true  },
  { name: 'RetailChain Inc',      assets: 28.7,  pretaxIncome: 1.2,  capexClimate: 0.12, opexClimate: 0.008, losses: 0.005, rule1401: false, rule1402: false, rule1403: false, rule1404: false },
  { name: 'MidstreamPipeline LLC',assets: 54.1,  pretaxIncome: 3.1,  capexClimate: 0.61, opexClimate: 0.04, losses: 0.06, rule1401: true,  rule1402: false, rule1403: true,  rule1404: true  },
  { name: 'FinancialHoldings PLC',assets: 310.2, pretaxIncome: 12.6, capexClimate: 2.8,  opexClimate: 0.15, losses: 0.02, rule1401: true,  rule1402: true,  rule1403: false, rule1404: false },
  { name: 'AgriSupply Co',        assets: 9.4,   pretaxIncome: 0.45, capexClimate: 0.08, opexClimate: 0.006, losses: 0.02, rule1401: false, rule1402: false, rule1403: false, rule1404: false },
];

const SX_ITEMS_DATA = [
  { rule: 'Rule 14-01', title: 'Capitalized Climate Costs', threshold: '1% of total assets', statement: 'Balance Sheet', audit: 'Full audit', description: 'Capitalized costs for climate-related activities (renewable energy, adaptation investments). Triggered when climate capex ≥ 1% of total assets.' },
  { rule: 'Rule 14-02', title: 'Climate OpEx Expenditures', threshold: '1% of pre-tax income', statement: 'Income Statement', audit: 'Full audit', description: 'Operating expenditures related to climate activities (carbon offset purchases, efficiency investments, climate consulting). Triggered at 1% of pre-tax income.' },
  { rule: 'Rule 14-03', title: 'Severe Weather Losses', threshold: 'Material / >1% pre-tax income', statement: 'Income Statement / Notes', audit: 'Full audit', description: 'Losses and recoveries from severe weather events and natural conditions affecting property, business interruption, and related insurance recoveries.' },
  { rule: 'Rule 14-04', title: 'Climate Target Charges/Gains', threshold: 'Material', statement: 'Income Statement / Notes', audit: 'Full audit', description: 'Charges and gains related to meeting climate targets: carbon credit purchases, stranded asset write-downs, gains from green asset sales.' },
];

const GHG_GASES = [
  { gas: 'CO₂', gwp: 1, source: 'Combustion, industrial processes', typical: 85 },
  { gas: 'CH₄', gwp: 28, source: 'Natural gas leakage, agriculture', typical: 8 },
  { gas: 'N₂O', gwp: 265, source: 'Fertilizers, combustion', typical: 4 },
  { gas: 'HFCs', gwp: '4–14,800', source: 'Refrigerants, AC systems', typical: 2 },
  { gas: 'PFCs', gwp: '6,630–11,100', source: 'Semiconductor manufacturing', typical: 0.5 },
  { gas: 'SF₆', gwp: 23500, source: 'Electrical equipment', typical: 0.3 },
  { gas: 'NF₃', gwp: 16100, source: 'Display panel manufacturing', typical: 0.2 },
];

const GHG_COMPARISON = [
  { framework: 'SEC Rule', scope1: true, scope2: true, scope3: false, industryMetrics: false, sectorSpecific: false, assurance: 'Limited→Reasonable', timeline: 'FY2026 (LAF)' },
  { framework: 'CSRD/ESRS E1', scope1: true, scope2: true, scope3: true, industryMetrics: true, sectorSpecific: true, assurance: 'Limited', timeline: 'FY2024 (large EU)' },
  { framework: 'ISSB S2', scope1: true, scope2: true, scope3: true, industryMetrics: true, sectorSpecific: true, assurance: 'Encouraged', timeline: 'FY2024 (adopted)' },
  { framework: 'TCFD', scope1: true, scope2: true, scope3: 'If material', industryMetrics: true, sectorSpecific: true, assurance: 'Voluntary', timeline: 'Voluntary' },
];

const ATTEST_TIMELINE = [
  { year: 'FY2025', laf: 'Scope 1+2 Disclosed', af: '—', assurance: 'None required' },
  { year: 'FY2026', laf: 'Scope 1+2 + S-X', af: 'Scope 1+2 Disclosed', assurance: 'None required' },
  { year: 'FY2028', laf: 'S-X Established', af: 'Scope 1+2 + S-X', assurance: 'None required' },
  { year: 'FY2029', laf: 'Limited Assurance', af: '—', assurance: 'LAF: Limited' },
  { year: 'FY2031', laf: '—', af: 'Limited Assurance', assurance: 'AF: Limited' },
  { year: 'FY2033', laf: 'Reasonable Assurance', af: '—', assurance: 'LAF: Reasonable' },
];

const WORKFLOW_STAGES = [
  { stage: 1, title: 'Material Risk Identification', quarter: 'Q1 (Jan–Mar)', owner: 'Sustainability + Legal', tasks: ['IPCC/NGFS scenario screening', 'Asset-level exposure mapping', 'Materiality threshold assessment (1% pre-tax income)', 'Board risk committee briefing'], icfr: false },
  { stage: 2, title: 'Quantification of Climate Impacts', quarter: 'Q2 (Apr–Jun)', owner: 'Finance + ESG Analytics', tasks: ['GHG Scope 1 & 2 calculation by gas type', 'Severe weather cost aggregation (Rule 14-03)', 'Climate capex/opex identification (Rule 14-01/02)', 'Carbon offset and REC accounting (if applicable)'], icfr: true },
  { stage: 3, title: 'Target & Transition Plan Review', quarter: 'Q2 (Apr–Jun)', owner: 'Sustainability + IR', tasks: ['Verify publicly stated targets are achievable', 'Update progress metrics against baselines', 'Transition plan capital allocation reconciliation', 'Ensure consistency with financial guidance'], icfr: false },
  { stage: 4, title: 'Internal Controls Implementation', quarter: 'Q3 (Jul–Sep)', owner: 'CFO + Internal Audit', tasks: ['Document climate data controls (SOX 302/906)', 'Map climate data to ICFR control framework', 'Identify and remediate control gaps', 'Prepare sub-certifications for CEO/CFO sign-off'], icfr: true },
  { stage: 5, title: 'Disclosure Committee Review', quarter: 'Q3 (Jul–Sep)', owner: 'CFO + General Counsel + CSO', tasks: ['Cross-functional disclosure review session', 'Legal accuracy review of climate claims', 'Consistency check: 10-K narrative vs. financial statements', 'External communications alignment (press releases, ESG reports)'], icfr: false },
  { stage: 6, title: 'Auditor Pre-Filing Review', quarter: 'Q4 (Oct–Dec)', owner: 'External Auditor + CFO', tasks: ['S-X items subject to full financial audit procedures', 'Auditor testing of climate control environment', 'GHG attestation provider engagement (if required year)', 'Management representation letters for climate data'], icfr: true },
  { stage: 7, title: 'SEC EDGAR Filing', quarter: 'Annual (60–90 days post FY end)', owner: 'Legal + Finance', tasks: ['10-K submission with all Item 1500–1507 disclosures', 'XBRL tagging of climate-related financial data', 'S-X financial note disclosures in audited financials', 'Inline XBRL climate taxonomy tagging'], icfr: false },
  { stage: 8, title: 'Investor Relations Readiness', quarter: 'Ongoing', owner: 'IR + Sustainability', tasks: ['Analyst Q&A preparation on GHG methodology', 'Proxy season ESG questionnaire responses', 'Rating agency data submissions (MSCI, Sustainalytics)', 'SEC comment letter response preparedness'], icfr: false },
];

const SEC_COMMENT_THEMES = [
  { theme: 'Consistency', description: 'SEC staff flags inconsistency between climate risk narrative and forward-looking financial disclosures — e.g., disclosing climate as material risk but projecting flat capex.', frequency: 78, sample: '"You disclose material transition risk from carbon pricing but do not reflect this in your 5-year capex guidance. Please reconcile."' },
  { theme: 'Specificity', description: 'Vague language such as "climate may affect our business" without identifying specific risks, geographies, or assets. SEC requires particular and concrete risk identification.', frequency: 64, sample: '"Your disclosure states climate change \'may\' affect operations. Identify specific facilities, operations, or business lines at material risk."' },
  { theme: 'Quantification', description: 'Failure to quantify climate-related costs that were otherwise material — e.g., stating a hurricane caused "significant damage" without a dollar figure in the financial statements.', frequency: 71, sample: '"You disclose that Hurricane Ian caused \'significant property damage\'. Quantify losses and any insurance recovery as required by existing MD&A guidance."' },
];

const COMPLIANCE_SCENARIOS = [
  {
    scenario: 'Full Compliance Now',
    color: T.sage,
    risk: 'Low',
    cost: 'High (near-term)',
    rationale: 'ISSB S2 and CSRD require similar or broader data infrastructure. Investment pays off across jurisdictions regardless of SEC rule legal outcome. Demonstrates leadership to investors and proxy advisors.',
    actions: ['Implement ISSB S2-aligned GHG measurement', 'Establish Reg S-X financial controls', 'Engage attestation provider for FY2026', 'Full ICFR integration of climate data'],
  },
  {
    scenario: 'Wait and See',
    color: T.amber,
    risk: 'High',
    cost: 'Low (near-term)',
    rationale: 'Relies on 8th Circuit stay being upheld or rule vacated. If rule survives, last-minute data infrastructure build is costly and error-prone. Reputational risk from investor perception of non-readiness.',
    actions: ['Monitor 8th Circuit proceedings', 'Maintain minimal voluntary TCFD disclosure', 'Track California SB 253/261 separately', 'Contingency plan for rapid compliance pivot'],
  },
  {
    scenario: 'Voluntary TCFD/ISSB Now',
    color: T.navyL,
    risk: 'Medium',
    cost: 'Medium',
    rationale: 'Best hedge strategy. Builds data capability and demonstrates good faith. Satisfies investor expectations (78% want ISSB-aligned disclosure). Positions company for California compliance regardless of SEC outcome.',
    actions: ['Publish annual TCFD report', 'Measure Scope 1+2+3 per GHG Protocol', 'Engage third-party verifier voluntarily', 'Align with ISSB S2 disclosure structure'],
  },
];

const STATE_LAWS = [
  { law: 'California SB 253', scope: 'Scope 1, 2 & 3', threshold: '>$1B revenue', deadline: 'FY 2026 (Scope 1+2)', auditor: 'Third-party verification', penalty: 'Up to $500K/year' },
  { law: 'California SB 261', scope: 'Climate financial risk disclosure', threshold: '>$500M revenue', deadline: 'FY 2026', auditor: 'No attestation required', penalty: 'Up to $50K/year' },
  { law: 'SEC Climate Rule', scope: 'Scope 1+2 (no Scope 3)', threshold: 'LAF/AF public registrants', deadline: 'FY 2025–2028 phased', auditor: 'Limited→Reasonable assurance', penalty: 'SEC enforcement / restatement' },
];

const INVESTOR_PREF = [
  { pref: 'Want full ISSB-aligned disclosure', pct: 78 },
  { pref: 'Satisfied with SEC minimum (S-K only)', pct: 12 },
  { pref: 'No preference / insufficient data', pct: 10 },
];

/* ── Shared UI ─────────────────────────────────────────────────────────────── */

const Card = ({ style, children }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: T.card, ...style }}>
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, color }) => (
  <Card style={{ textAlign: 'center', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>{sub}</div>}
  </Card>
);

const Badge = ({ text, color, bg }) => (
  <span style={{ display: 'inline-block', background: bg || T.surfaceH, color: color || T.textSec, fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px', border: `1px solid ${T.border}`, letterSpacing: '0.3px' }}>
    {text}
  </span>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>
    {children}
  </div>
);

const Check = ({ ok }) => (
  <span style={{ color: ok ? T.green : T.textMut, fontSize: 13, marginRight: 6 }}>{ok ? '✓' : '○'}</span>
);

const Bool = ({ v }) => (
  <span style={{ fontWeight: 700, color: v === true ? T.green : v === false ? T.textMut : T.amber }}>
    {v === true ? 'Required' : v === false ? 'Not Required' : v}
  </span>
);

/* ── Tab 1: Rule Overview ───────────────────────────────────────────────────── */
function Tab1() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyL} 100%)`, borderRadius: 14, padding: 24, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1, marginBottom: 6 }}>RELEASE NO. 33-11275 · MARCH 6, 2024</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>SEC Climate Disclosure Rule</div>
            <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
              The SEC's final rule requires public companies to disclose material climate-related risks in their annual filings (10-K / 20-F). The rule amends Regulation S-K and Regulation S-X, adding Items 1500–1507 and Article 14 respectively. Scope 1 and Scope 2 GHG emissions required for Large Accelerated and Accelerated Filers only. Scope 3 not required.
            </div>
          </div>
          <div style={{ background: 'rgba(197,169,106,0.18)', border: '1px solid rgba(197,169,106,0.4)', borderRadius: 10, padding: 16, minWidth: 220 }}>
            <div style={{ fontSize: 11, color: T.goldL, fontWeight: 700, marginBottom: 8 }}>LEGAL STATUS</div>
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, marginBottom: 4 }}>Stay Granted — 8th Circuit</div>
            <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>
              Consolidated challenges filed by 10 states and industry groups. 8th Circuit granted voluntary stay March 2024 pending judicial review. Rule enforcement suspended pending outcome.
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge text="Stay Active" color={T.amber} bg="rgba(217,119,6,0.15)" />
              <Badge text="8th Circuit" color="#fff" bg="rgba(255,255,255,0.1)" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <KpiCard label="US Public Companies Affected" value="6,800+" sub="Across all filer categories" />
        <KpiCard label="Scope 1+2 First Required FY" value="FY 2026" sub="Large Accelerated Filers" color={T.sage} />
        <KpiCard label="Attestation Begins (Limited)" value="FY 2029" sub="LAFs · Reasonable by FY2033" color={T.gold} />
        <KpiCard label="S&P 500 Voluntary Disclosers" value="72%" sub="Already disclosing some climate data" color={T.navyL} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <Card>
          <SectionTitle>Key Requirements Summary</SectionTitle>
          {[
            { req: 'Climate risks material to strategy/outlook', sk: true },
            { req: 'Scope 1 GHG emissions (LAF/AF only)', sk: true },
            { req: 'Scope 2 GHG emissions (LAF/AF only)', sk: true },
            { req: 'Scope 3 GHG emissions', sk: false },
            { req: 'Severe weather costs (if >1% pre-tax income)', sk: true },
            { req: 'Carbon offsets/RECs methodology (if used for targets)', sk: true },
            { req: 'Climate targets & goals (if publicly disclosed)', sk: true },
            { req: 'Transition plan (if publicly disclosed)', sk: true },
            { req: 'Scenario analysis (if used internally)', sk: true },
            { req: 'Governance oversight of climate risk', sk: true },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '7px 0', borderBottom: i < 9 ? `1px solid ${T.border}` : 'none' }}>
              <Check ok={r.sk} />
              <span style={{ fontSize: 12, color: r.sk ? T.text : T.textMut }}>{r.req}</span>
              {!r.sk && <Badge text="NOT Required" color={T.amber} bg="rgba(217,119,6,0.08)" style={{ marginLeft: 'auto' }} />}
            </div>
          ))}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <SectionTitle>Phase-In Timeline by Filer Category</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Filer', 'Float', 'S-K Narrative', 'S-X / GHG', 'Limited Assur.', 'Reasonable Assur.'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FILER_TIMELINE.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: T.navy }}>{r.filer}</td>
                      <td style={{ padding: '8px 10px', color: T.textSec }}>{r.float}</td>
                      <td style={{ padding: '8px 10px', color: T.sage, fontWeight: 600 }}>{r.skFY}</td>
                      <td style={{ padding: '8px 10px', color: r.sxFY === 'N/A' ? T.textMut : T.gold, fontWeight: 600 }}>{r.sxFY}</td>
                      <td style={{ padding: '8px 10px', color: r.attestLimited === 'N/A' ? T.textMut : T.amber }}>{r.attestLimited}</td>
                      <td style={{ padding: '8px 10px', color: r.attestReasonable === 'N/A' ? T.textMut : T.red }}>{r.attestReasonable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <SectionTitle>Challenger States & Industry Groups</SectionTitle>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['West Virginia', 'Texas', 'Georgia', 'Alabama', 'Alaska', 'Indiana', 'New Hampshire', 'Oklahoma', 'South Carolina', 'Virginia'].map(s => (
                <Badge key={s} text={s} />
              ))}
              {['US Chamber of Commerce', 'Business Roundtable', 'American Petroleum Institute'].map(g => (
                <Badge key={g} text={g} color={T.amber} bg="rgba(217,119,6,0.08)" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Tab 2: Reg S-K Items ───────────────────────────────────────────────────── */
function Tab2() {
  const [selected, setSelected] = useState(0);
  const item = SK_ITEMS[selected];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SK_ITEMS.map((it, i) => (
          <button key={i} onClick={() => setSelected(i)}
            style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${selected === i ? T.navy : T.border}`, background: selected === i ? T.navy : T.surface, color: selected === i ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>
            {it.item}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ background: T.navy, color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>{item.item}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{item.title}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Location: {item.location}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.65, marginBottom: 14 }}>{item.summary}</div>
          <div style={{ background: T.surfaceH, borderRadius: 8, padding: 14, borderLeft: `3px solid ${T.gold}`, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMut, marginBottom: 6, letterSpacing: 0.5 }}>SAMPLE DISCLOSURE LANGUAGE</div>
            <div style={{ fontSize: 11, color: T.textSec, fontStyle: 'italic', lineHeight: 1.55 }}>{item.sample}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Sample Completion Score</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: item.completion >= 80 ? T.green : item.completion >= 65 ? T.amber : T.red }}>{item.completion}%</span>
          </div>
          <div style={{ background: T.surfaceH, borderRadius: 4, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${item.completion}%`, height: '100%', background: item.completion >= 80 ? T.green : item.completion >= 65 ? T.amber : T.red, borderRadius: 4 }} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Compliance Checklist</SectionTitle>
          {item.checklist.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 0', borderBottom: i < item.checklist.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <Check ok={i < Math.round(item.checklist.length * item.completion / 100)} />
              <span style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{c}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SectionTitle>Completion Rate by S-K Item — Sample S&P 500 Company (Overall: 82%)</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={SK_CHART_DATA} margin={{ left: -10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={tip} formatter={v => [`${v}%`, 'Completion']} />
            <Bar dataKey="completion" radius={[4, 4, 0, 0]}>
              {SK_CHART_DATA.map((d, i) => (
                <Cell key={i} fill={d.completion >= 80 ? T.sage : d.completion >= 65 ? T.gold : T.amber} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ── Tab 3: Reg S-X ─────────────────────────────────────────────────────────── */
function Tab3() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
        {SX_ITEMS_DATA.map((item, i) => (
          <Card key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 3 }}>{item.rule}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{item.title}</div>
              </div>
              <Badge text="Full Audit" color={T.red} bg="rgba(220,38,38,0.08)" />
            </div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.55, marginBottom: 10 }}>{item.description}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge text={item.threshold} />
              <Badge text={item.statement} color={T.navyL} bg="rgba(44,90,140,0.08)" />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle>Materiality Threshold Analysis — 5 Sample Companies</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', minWidth: 620 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Company', 'Total Assets ($B)', 'Pre-Tax Income ($B)', '14-01 Triggered', '14-02 Triggered', '14-03 Triggered', '14-04 Triggered'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SX_COMPANIES.map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                  <td style={{ padding: '9px 12px', color: T.textSec }}>{c.assets}</td>
                  <td style={{ padding: '9px 12px', color: T.textSec }}>{c.pretaxIncome}</td>
                  {[c.rule1401, c.rule1402, c.rule1403, c.rule1404].map((r, j) => (
                    <td key={j} style={{ padding: '9px 12px', fontWeight: 700, color: r ? T.green : T.textMut }}>{r ? 'YES' : 'No'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: T.textSec, background: T.surfaceH, borderRadius: 8, padding: '10px 14px' }}>
          <strong>Methodology:</strong> Rule 14-01 triggered when climate capex &ge;1% of total assets. Rule 14-02 triggered when climate opex &ge;1% of pre-tax income. Rule 14-03 triggered when severe weather losses are material (also &ge;1% threshold). Rule 14-04 triggered when climate target-related charges/gains are material.
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Financial Statement Mapping</SectionTitle>
          {[
            { rule: 'Rule 14-01', fs: 'Balance Sheet', line: 'PP&E / Intangibles / ROU Assets', note: 'Disclose gross capitalized cost and accumulated depreciation' },
            { rule: 'Rule 14-02', fs: 'Income Statement', line: 'COGS / SG&A / R&D', note: 'OpEx for climate activities broken out by nature' },
            { rule: 'Rule 14-03', fs: 'Income Statement + Notes', line: 'Other Income/Expense', note: 'Gross losses and insurance recovery shown separately' },
            { rule: 'Rule 14-04', fs: 'Income Statement + Notes', line: 'Other Income/Expense / Asset Write-downs', note: 'Carbon credit cost, stranded asset charges, gain/loss on green asset disposal' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <Badge text={m.rule} color={T.gold} bg="rgba(197,169,106,0.12)" />
                <Badge text={m.fs} color={T.navyL} bg="rgba(44,90,140,0.08)" />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>{m.line}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{m.note}</div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>Auditor Considerations</SectionTitle>
          {[
            { point: 'S-X disclosures subject to full financial statement audit', level: 'High' },
            { point: 'Auditors must test climate data controls and underlying records', level: 'High' },
            { point: 'Reg S-K narrative (Items 1501–1507) subject to limited assurance only (not full audit)', level: 'Medium' },
            { point: 'GHG attestation is separate engagement from financial audit', level: 'Medium' },
            { point: 'Material weakness risk if ICFR over climate data is inadequate', level: 'High' },
            { point: 'Consistency between S-X financial notes and S-K narrative required', level: 'Medium' },
            { point: 'Transition period: S-X effective 1 fiscal year after S-K requirements', level: 'Low' },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < 6 ? `1px solid ${T.border}` : 'none' }}>
              <Badge text={p.level} color={p.level === 'High' ? T.red : p.level === 'Medium' ? T.amber : T.sage} bg={p.level === 'High' ? 'rgba(220,38,38,0.08)' : p.level === 'Medium' ? 'rgba(217,119,6,0.08)' : 'rgba(90,138,106,0.08)'} />
              <span style={{ fontSize: 12, color: T.text, lineHeight: 1.45 }}>{p.point}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ── Tab 4: GHG Emissions ───────────────────────────────────────────────────── */
function Tab4() {
  const orgBoundaryData = [
    { method: 'Operational Control', usage: 68 },
    { method: 'Financial Control', usage: 22 },
    { method: 'Equity Share', usage: 10 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
        <Card style={{ borderTop: `3px solid ${T.red}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 6 }}>SCOPE 1 — Direct Emissions</div>
          <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>Stationary combustion, mobile combustion, process emissions, fugitive emissions. Must disclose by gas type (CO₂, CH₄, N₂O, HFCs, PFCs, SF₆, NF₃). Units: metric tonnes CO₂ equivalent (tCO₂e).</div>
          <div style={{ marginTop: 10 }}><Badge text="Required: LAF & AF" color={T.red} bg="rgba(220,38,38,0.08)" /></div>
        </Card>
        <Card style={{ borderTop: `3px solid ${T.gold}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 6 }}>SCOPE 2 — Purchased Energy</div>
          <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>Indirect emissions from purchased electricity, heat, steam, and cooling. <strong>Both location-based AND market-based methods required</strong>. RECs and PPAs affect market-based calculation.</div>
          <div style={{ marginTop: 10 }}><Badge text="Required: LAF & AF" color={T.amber} bg="rgba(217,119,6,0.08)" /></div>
        </Card>
        <Card style={{ borderTop: `3px solid ${T.textMut}`, opacity: 0.85 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMut, marginBottom: 6 }}>SCOPE 3 — Value Chain</div>
          <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>Upstream and downstream emissions. <strong>NOT required by SEC rule</strong> — major departure from CSRD, ISSB S2, and California SB 253. Companies may disclose voluntarily.</div>
          <div style={{ marginTop: 10 }}><Badge text="NOT Required" color={T.textMut} /></div>
        </Card>
      </div>

      <Card>
        <SectionTitle>GHG Gases — Disclosure by Type (Required for Scope 1)</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Gas', 'GWP (AR6)', 'Common Sources', 'Typical % of Scope 1'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GHG_GASES.map((g, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>{g.gas}</td>
                  <td style={{ padding: '8px 12px', color: T.textSec }}>{g.gwp.toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', color: T.textSec }}>{g.source}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: T.surfaceH, borderRadius: 4, height: 6, maxWidth: 80 }}>
                        <div style={{ width: `${Math.min(g.typical * 1.1, 100)}%`, height: '100%', background: T.navy, borderRadius: 4 }} />
                      </div>
                      <span style={{ color: T.textSec }}>{g.typical}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Attestation Timeline (LAFs)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ATTEST_TIMELINE.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                <div style={{ width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.assurance.includes('Reasonable') ? T.green : r.assurance.includes('Limited') ? T.amber : T.border, marginTop: 12, flexShrink: 0, border: `2px solid ${T.border}` }} />
                  {i < ATTEST_TIMELINE.length - 1 && <div style={{ width: 2, flex: 1, background: T.border, margin: '0 auto' }} />}
                </div>
                <div style={{ flex: 1, padding: '10px 0 10px 10px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{r.year}</span>
                    <Badge text={r.assurance} color={r.assurance.includes('Reasonable') ? T.green : r.assurance.includes('Limited') ? T.amber : T.textMut} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>LAF: {r.laf || '—'} · AF: {r.af || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>SEC vs CSRD vs ISSB S2 — GHG Comparison</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Framework', 'Scope 1+2', 'Scope 3', 'Sector Metrics', 'Assurance'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GHG_COMPARISON.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.navy, fontSize: 11 }}>{r.framework}</td>
                    <td style={{ padding: '8px 10px' }}><Bool v={r.scope1} /></td>
                    <td style={{ padding: '8px 10px' }}><Bool v={r.scope3} /></td>
                    <td style={{ padding: '8px 10px' }}><Bool v={r.sectorSpecific} /></td>
                    <td style={{ padding: '8px 10px', fontSize: 10, color: T.textSec }}>{r.assurance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, background: T.surfaceH, borderRadius: 8, padding: 12, borderLeft: `3px solid ${T.amber}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 4 }}>Organizational Boundary Requirement</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.55 }}>
              Registrants must use the same organizational boundary for GHG reporting as used for financial statement consolidation — operational control, financial control, or equity share method. Must disclose which method is used and why.
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>Organizational Boundary Method — Industry Usage</SectionTitle>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={orgBoundaryData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `${v}%`} domain={[0, 80]} />
            <YAxis type="category" dataKey="method" tick={{ fontSize: 11, fill: T.textSec }} width={130} />
            <Tooltip contentStyle={tip} formatter={v => [`${v}%`, 'Companies Using']} />
            <Bar dataKey="usage" radius={[0, 4, 4, 0]}>
              {orgBoundaryData.map((d, i) => (
                <Cell key={i} fill={[T.navy, T.navyL, T.sage][i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ── Tab 5: 10-K Integration ─────────────────────────────────────────────────── */
function Tab5() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
        {WORKFLOW_STAGES.map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.icfr ? T.red : T.navy}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.icfr ? T.red : T.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{s.stage}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{s.title}</div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{s.quarter} · {s.owner}</div>
              </div>
              {s.icfr && <Badge text="ICFR Impact" color={T.red} bg="rgba(220,38,38,0.08)" />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {s.tasks.map((t, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: T.textSec }}>
                  <span style={{ color: T.gold, marginTop: 1, flexShrink: 0 }}>▸</span>
                  {t}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle>ICFR Implications — SOX 302/906 CEO/CFO Certifications</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
          {[
            { title: 'SOX Section 302', desc: 'CEO/CFO must certify that climate disclosures in the 10-K (both S-K narrative and S-X financial notes) do not contain material misstatements and that internal controls are effective.', risk: 'High' },
            { title: 'SOX Section 906', desc: 'Criminal certification — CEO/CFO certify climate data in financial statements is accurate. Criminal penalties up to $5M/20 years for willful misrepresentation of climate-related financial data.', risk: 'Critical' },
            { title: 'Material Weakness Risk', desc: 'Inadequate controls over climate data collection, GHG calculation, or financial statement mapping could constitute a material weakness requiring disclosure and potentially audit qualification.', risk: 'High' },
            { title: 'Climate Control Framework', desc: 'Companies need to document: data sources, calculation methodology controls, review/approval workflows, segregation of duties for GHG data, and evidence of control effectiveness.', risk: 'Medium' },
          ].map((item, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, borderTop: `3px solid ${item.risk === 'Critical' ? T.red : item.risk === 'High' ? T.amber : T.gold}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{item.title}</div>
                <Badge text={item.risk} color={item.risk === 'Critical' ? T.red : item.risk === 'High' ? T.amber : T.gold} bg={item.risk === 'Critical' ? 'rgba(220,38,38,0.1)' : item.risk === 'High' ? 'rgba(217,119,6,0.1)' : 'rgba(197,169,106,0.1)'} />
              </div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.55 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>SEC Comment Letter Themes — Early Voluntary Climate Disclosures</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SEC_COMMENT_THEMES.map((c, i) => (
            <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{c.theme}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 180 }}>
                  <div style={{ flex: 1, background: T.surfaceH, borderRadius: 4, height: 8, maxWidth: 200 }}>
                    <div style={{ width: `${c.frequency}%`, height: '100%', background: T.amber, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, color: T.textSec }}>{c.frequency}% of comment letters</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>{c.description}</div>
              <div style={{ background: T.surfaceH, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${T.gold}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMut, marginBottom: 4 }}>EXAMPLE SEC COMMENT</div>
                <div style={{ fontSize: 11, color: T.textSec, fontStyle: 'italic', lineHeight: 1.5 }}>{c.sample}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Tab 6: Legal & Strategy ─────────────────────────────────────────────────── */
function Tab6() {
  const investorData = INVESTOR_PREF.map(p => ({ name: p.pref, value: p.pct }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: `linear-gradient(135deg, rgba(220,38,38,0.06) 0%, rgba(217,119,6,0.04) 100%)`, border: `1px solid rgba(220,38,38,0.2)`, borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 8 }}>Legal Status: Stay Granted — 8th Circuit Court of Appeals</div>
        <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.65 }}>
          On March 15, 2024, the 8th Circuit granted a voluntary stay of the SEC climate rule, suspending its effective date pending judicial review. Consolidated petitions were filed by 10 state attorneys general and multiple industry groups. The court has not yet ruled on the merits. The SEC has defended the rule as within its authority under the Securities Act. Potential outcomes: (1) Rule upheld and enforced, (2) Rule vacated, (3) Rule remanded for revision. Legal uncertainty does not eliminate California SB 253/261 obligations.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        {COMPLIANCE_SCENARIOS.map((s, i) => (
          <Card key={i} style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{s.scenario}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge text={`Risk: ${s.risk}`} color={s.risk === 'Low' ? T.green : s.risk === 'High' ? T.red : T.amber} bg={s.risk === 'Low' ? 'rgba(22,163,74,0.08)' : s.risk === 'High' ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)'} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6, marginBottom: 12 }}>{s.rationale}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {s.actions.map((a, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: T.text }}>
                  <span style={{ color: s.color, flexShrink: 0, marginTop: 1 }}>▸</span>
                  {a}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle>State Climate Disclosure Laws — Proceed Regardless of SEC Rule</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Law', 'Scope Required', 'Revenue Threshold', 'First Deadline', 'Attestation', 'Penalty'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STATE_LAWS.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding: '9px 12px', fontWeight: 700, color: T.navy }}>{r.law}</td>
                  <td style={{ padding: '9px 12px', color: T.textSec }}>{r.scope}</td>
                  <td style={{ padding: '9px 12px', color: T.sage, fontWeight: 600 }}>{r.threshold}</td>
                  <td style={{ padding: '9px 12px', color: T.gold, fontWeight: 600 }}>{r.deadline}</td>
                  <td style={{ padding: '9px 12px', color: T.textSec }}>{r.auditor}</td>
                  <td style={{ padding: '9px 12px', color: T.red, fontWeight: 600 }}>{r.penalty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, background: 'rgba(220,38,38,0.04)', border: `1px solid rgba(220,38,38,0.15)`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 4 }}>California vs SEC — Conflict of Laws</div>
          <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
            California SB 253 requires Scope 3 reporting (unlike SEC). For companies subject to both regimes, California law proceeds independently regardless of SEC rule legal status. Companies with &gt;$1B CA revenue doing business in California must comply with SB 253 by FY2026 even if SEC rule is vacated. A&quot;minimum compliance&quot; strategy relying solely on SEC requirements will leave California obligations unmet for most large registrants.
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Minimum vs Best Practice — Sample LAF Company</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { category: 'GHG Scope', minimum: 'Scope 1+2 only', best: 'Scope 1+2+3 (15 categories)' },
              { category: 'Assurance', minimum: 'None until FY2029', best: 'Limited assurance now (voluntary)' },
              { category: 'Scenario Analysis', minimum: 'Disclose only if used internally', best: 'Full 1.5°C, 2°C, 4°C NGFS scenarios' },
              { category: 'Scope 3 Detail', minimum: 'Not required', best: 'All 15 categories per GHG Protocol' },
              { category: 'Industry Metrics', minimum: 'Not required', best: 'ISSB S2 industry-based metrics' },
              { category: 'Target Ambition', minimum: 'Disclose only if set', best: 'SBTi-validated 1.5°C target' },
              { category: 'Transition Plan', minimum: 'Disclose only if public', best: 'IEA-aligned net zero transition plan' },
              { category: 'TCFD Alignment', minimum: 'Partial (via S-K items)', best: 'Full TCFD + ISSB S2 alignment' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '7px 0', borderBottom: i < 7 ? `1px solid ${T.border}` : 'none', alignItems: 'start' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{r.category}</div>
                <div style={{ fontSize: 11, color: T.amber, background: 'rgba(217,119,6,0.06)', borderRadius: 6, padding: '3px 8px' }}>{r.minimum}</div>
                <div style={{ fontSize: 11, color: T.sage, background: 'rgba(90,138,106,0.06)', borderRadius: 6, padding: '3px 8px' }}>{r.best}</div>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div />
              <div style={{ fontSize: 10, fontWeight: 700, color: T.amber, textAlign: 'center' }}>MINIMUM (SEC only)</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.sage, textAlign: 'center' }}>BEST PRACTICE (ISSB/CSRD)</div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Investor Disclosure Expectations (2024 Survey — S&P 500 Investors)</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={investorData} layout="vertical" margin={{ left: 10, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v}%`} domain={[0, 85]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={180} />
              <Tooltip contentStyle={tip} formatter={v => [`${v}%`, 'Investors']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {investorData.map((d, i) => (
                  <Cell key={i} fill={[T.sage, T.amber, T.textMut][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, background: T.surfaceH, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Key Finding</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.55 }}>
              <strong>78%</strong> of S&P 500 institutional investors in 2024 surveys want full ISSB S2-aligned disclosure regardless of SEC rule legal status. Proxy advisors ISS and Glass Lewis both incorporate climate disclosure quality into voting recommendations.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function SecClimateRulePage() {
  const [activeTab, setActiveTab] = useState(0);

  const TAB_COMPONENTS = [Tab1, Tab2, Tab3, Tab4, Tab5, Tab6];
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <Badge text="EP-AH5" color={T.navy} bg="rgba(27,58,92,0.08)" />
              <Badge text="SEC March 2024" color={T.amber} bg="rgba(217,119,6,0.08)" />
              <Badge text="Reg S-K/S-X" />
              <Badge text="Scope 1+2 Attestation" />
              <Badge text="6,000+ Registrants" />
              <Badge text="10-K" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>SEC Climate Rule Compliance</h1>
            <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0' }}>Release No. 33-11275 · Enhanced Climate Disclosures for Public Companies · Items 1500–1507 & Article 14</p>
          </div>
          <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 16px', fontSize: 12, color: T.red, fontWeight: 600 }}>
            Stay Active · 8th Circuit
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 6 }}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: activeTab === i ? T.navy : 'transparent', color: activeTab === i ? '#fff' : T.textSec, fontSize: 12, fontWeight: activeTab === i ? 700 : 500, cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s' }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <ActiveComponent />
    </div>
  );
}
