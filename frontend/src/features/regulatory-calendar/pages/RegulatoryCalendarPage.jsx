import React, { useState, useMemo } from 'react';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const FW_COLOR = {
  CSRD: '#7c3aed', SFDR: '#2563eb', ISSB: '#0d9488',
  SEC: '#1d4ed8', SEBI: '#f97316', Basel: '#1b3a5c', Other: '#6b7280',
};

const BADGE = (label, color) => (
  <span style={{
    fontSize: 9, fontWeight: 700, color, background: `${color}18`,
    border: `1px solid ${color}44`, borderRadius: 3, padding: '2px 6px',
  }}>{label}</span>
);

const STATUS_COLOR = { Upcoming: T.blue, Due: T.amber, Overdue: T.red, Completed: T.green };
const EFFORT_COLOR = { Low: T.green, Medium: T.amber, High: T.red };

const DEADLINES = [
  {
    id: 1, framework: 'CSRD', title: 'CSRD Wave 1 — FY2024 Annual Report Filing',
    date: '2025-01-31', jurisdiction: 'EU', regulator: 'EFRAG / EC',
    description: 'Large listed EU companies (>500 employees, NFRD in-scope) must include ESRS-compliant sustainability information in their management reports for FY2024. First wave covers approximately 11,700 companies.',
    entityTypes: ['Large Listed Co', 'Asset Manager'], effort: 'High', status: 'Completed',
    requirements: ['Double materiality assessment per ESRS 1', 'ESRS E1 (Climate) mandatory disclosure', 'Value chain GHG data collection', 'External limited assurance', 'XBRL inline tagging'],
    links: ['efrag.eu/esrs-standards', 'ec.europa.eu/csrd-guidance', 'efrag.eu/dma-guidance'],
    actions: ['Complete DMA and document methodology', 'Collect scope 1/2/3 data from subsidiaries', 'Engage assurance provider', 'Tag disclosures in iXBRL format'],
  },
  {
    id: 2, framework: 'CSRD', title: 'CSRD Wave 2 — Large Non-Listed EU Companies FY2025',
    date: '2026-01-31', jurisdiction: 'EU', regulator: 'EFRAG / EC',
    description: 'Extends CSRD obligations to large non-listed EU companies meeting two of three criteria (>250 employees, >€40M turnover, >€20M balance sheet). Covers approx. 49,000 additional companies.',
    entityTypes: ['Large Non-Listed Co', 'Insurer'], effort: 'High', status: 'Upcoming',
    requirements: ['Full ESRS suite (E1-E5, S1-S4, G1)', 'Sector-specific ESRS where applicable', 'Supply chain due diligence linkage', 'Board sign-off on materiality assessment', 'EU Taxonomy alignment disclosure'],
    links: ['efrag.eu/wave2-guidance', 'ec.europa.eu/csrd-faq', 'efrag.eu/sector-esrs'],
    actions: ['Gap analysis against full ESRS suite', 'Build internal data collection workflows', 'Train finance and sustainability teams', 'Select and brief assurance provider'],
  },
  {
    id: 3, framework: 'SFDR', title: 'SFDR Level 2 RTS — PAI Statement FY2024',
    date: '2025-06-30', jurisdiction: 'EU', regulator: 'ESMA / EC',
    description: 'Asset managers and financial advisers must publish the Principal Adverse Impact (PAI) statement for FY2024 reference period. Covers 18 mandatory PAI indicators on environmental and social topics.',
    entityTypes: ['Asset Manager', 'Bank'], effort: 'Medium', status: 'Upcoming',
    requirements: ['14 mandatory environmental PAIs (incl. GHG intensity, fossil fuel exposure)', '4 mandatory social PAIs (gender pay, UN GC violations)', 'Engagement policy disclosure', 'Reduction targets or comply-and-explain', 'Article 8/9 product-level PAI disclosure'],
    links: ['esma.europa.eu/sfdr-rts', 'ec.europa.eu/sfdr-faq', 'esma.europa.eu/pai-templates'],
    actions: ['Collect PAI data from holdings via ESG data provider', 'Calculate weighted PAI metrics at fund level', 'Draft PAI statement narrative', 'Publish on firm website before June 30'],
  },
  {
    id: 4, framework: 'SEC', title: 'SEC Climate Disclosure Rule — Large Accelerated Filers',
    date: '2026-02-01', jurisdiction: 'USA', regulator: 'SEC',
    description: 'The SEC\'s climate-related disclosure rules require large accelerated filers to disclose material climate-related risks, governance, strategy, and Scope 1/2 GHG emissions (with phased Scope 3). First filings on 10-K for FY2025.',
    entityTypes: ['Large Listed Co', 'Bank'], effort: 'High', status: 'Upcoming',
    requirements: ['Material climate risk and opportunity disclosure', 'Governance of climate risk (board/management)', 'Scope 1 and 2 GHG emissions with assurance', 'Scenario analysis where material', 'Financial statement impacts: climate-related expenditure'],
    links: ['sec.gov/climate-rules-final', 'sec.gov/climate-faq-2024', 'sec.gov/form-10k-guidance'],
    actions: ['Assess materiality of climate risks under SEC standard', 'Establish GHG emissions accounting methodology', 'Engage external assurance provider for Scope 1/2', 'Update 10-K disclosure controls and procedures'],
  },
  {
    id: 5, framework: 'SEBI', title: 'SEBI BRSR Core — Top 150 Listed Companies FY2024',
    date: '2024-09-30', jurisdiction: 'India', regulator: 'SEBI',
    description: 'SEBI mandates the Business Responsibility and Sustainability Report (BRSR) Core — a subset of 49 key performance indicators — with reasonable assurance for the top 150 listed companies by market capitalisation for FY2024.',
    entityTypes: ['Large Listed Co'], effort: 'High', status: 'Completed',
    requirements: ['49 BRSR Core KPIs with third-party assurance', 'Energy intensity and water intensity metrics', 'Scope 1 & 2 emissions with methodology', 'Value chain disclosures (top 75% by spend)', 'Board-approved BRSR statement'],
    links: ['sebi.gov.in/brsr-circular-2023', 'sebi.gov.in/brsr-core-format', 'mca.gov.in/brsr-guidance'],
    actions: ['Identify top 75% supply chain by value', 'Conduct third-party reasonable assurance', 'File BRSR Core with annual report', 'Submit confirmation to stock exchanges'],
  },
  {
    id: 6, framework: 'SEBI', title: 'SEBI BRSR Core — Top 500 Companies FY2025',
    date: '2025-09-30', jurisdiction: 'India', regulator: 'SEBI',
    description: 'BRSR Core with reasonable assurance expands to the top 500 listed companies by market capitalisation for FY2025. Companies 151-500 face first-time mandatory assurance obligations.',
    entityTypes: ['Large Listed Co'], effort: 'High', status: 'Upcoming',
    requirements: ['Same 49 BRSR Core KPIs as Wave 1', 'Reasonable assurance from accredited body', 'Value chain disclosure for 75% of procurement', 'Transition plan disclosure encouraged', 'ESG risk management framework disclosure'],
    links: ['sebi.gov.in/brsr-expansion-2025', 'sebi.gov.in/brsr-core-v2', 'icai.org/brsr-assurance'],
    actions: ['Gap analysis vs. existing sustainability reports', 'Engage BRSR assurance provider', 'Build supply chain data collection process', 'Train board and management on BRSR obligations'],
  },
  {
    id: 7, framework: 'Other', title: 'EU Taxonomy — Alignment Reporting FY2024 (NFRD)',
    date: '2025-03-31', jurisdiction: 'EU', regulator: 'EC / ESMA',
    description: 'Companies in scope of NFRD/CSRD must report on EU Taxonomy-eligible and aligned economic activities for FY2024, covering the six environmental objectives including climate change mitigation and adaptation.',
    entityTypes: ['Large Listed Co', 'Asset Manager'], effort: 'High', status: 'Completed',
    requirements: ['Turnover, capex, opex KPIs aligned to Taxonomy', 'Technical Screening Criteria (TSC) assessment', 'Do No Significant Harm (DNSH) checks', 'Minimum Social Safeguards compliance', 'Delegated Act activity coverage'],
    links: ['ec.europa.eu/taxonomy-regulation', 'ec.europa.eu/taxonomy-compass', 'platform-sustainable-finance.eu'],
    actions: ['Map revenue streams to Taxonomy NACE codes', 'Assess TSC and DNSH criteria per activity', 'Calculate eligible vs. aligned KPIs', 'Disclose in management report with auditor review'],
  },
  {
    id: 8, framework: 'ISSB', title: 'ISSB S1/S2 — Australia Mandatory FY2025',
    date: '2025-07-01', jurisdiction: 'Australia', regulator: 'ASIC / AASB',
    description: 'Australia mandates IFRS S1 (general sustainability disclosures) and IFRS S2 (climate-related disclosures) for large listed and unlisted entities from FY commencing 1 July 2025. First reporting cycle for Group 1 entities.',
    entityTypes: ['Large Listed Co', 'Bank', 'Insurer'], effort: 'High', status: 'Upcoming',
    requirements: ['IFRS S2 climate-related risks and opportunities', 'Scope 1, 2 and material Scope 3 GHG emissions', 'Climate scenario analysis (1.5°C and higher)', 'Governance and risk management disclosures', 'Industry-based metrics per SASB standards'],
    links: ['aasb.gov.au/issb-adoption', 'asic.gov.au/climate-disclosures', 'ifrs.org/s1-s2-standards'],
    actions: ['Map current TCFD disclosures to IFRS S2 gaps', 'Develop climate scenario analysis capability', 'Establish Scope 3 data collection', 'Brief audit committee on new requirements'],
  },
  {
    id: 9, framework: 'ISSB', title: 'ISSB S1/S2 — Singapore Mandatory FY2025',
    date: '2025-01-01', jurisdiction: 'Singapore', regulator: 'MAS / SGX',
    description: 'SGX-listed issuers in specified industries (financial services, energy, materials, transport) must provide climate-related disclosures aligned with IFRS S2 from FY2025. MAS has endorsed the ISSB standards as the baseline.',
    entityTypes: ['Large Listed Co', 'Bank'], effort: 'Medium', status: 'Upcoming',
    requirements: ['IFRS S2 climate disclosures for in-scope sectors', 'Transition plan disclosure for financial institutions', 'Scope 1 and 2 emissions mandatory; Scope 3 encouraged', 'Physical risk assessment using scenario analysis', 'SGX-specific commentary on material risks'],
    links: ['sgx.com/issb-requirements', 'mas.gov.sg/climate-reporting', 'ifrs.org/singapore-adoption'],
    actions: ['Confirm in-scope sector applicability', 'Update sustainability report to IFRS S2 format', 'Complete climate scenario analysis', 'Engage SGX on transition period options'],
  },
  {
    id: 10, framework: 'ISSB', title: 'ISSB S1/S2 — UK Mandatory Disclosure (SSUKS) from 2026',
    date: '2026-01-01', jurisdiction: 'UK', regulator: 'FCA / BEIS',
    description: 'The UK has developed UK Sustainability Reporting Standards (UK SRS) based on IFRS S1 and S2. Mandatory disclosure for UK-listed companies is expected from reporting years beginning January 2026, following FCA endorsement.',
    entityTypes: ['Large Listed Co', 'Asset Manager'], effort: 'High', status: 'Upcoming',
    requirements: ['UK SRS 1 and UK SRS 2 full compliance', 'Climate scenario analysis under Paris-aligned pathways', 'Scope 1, 2, 3 GHG emissions disclosure', 'Net zero transition plan (FCA expectation)', 'Financial effects of climate on IFRS financial statements'],
    links: ['fca.org.uk/uk-srs-consultation', 'gov.uk/uk-sustainability-reporting', 'ifrs.org/uk-endorsement'],
    actions: ['Monitor FCA final endorsement statement', 'Gap analysis: TCFD vs. UK SRS requirements', 'Develop transition plan per TPT guidance', 'Engage auditors on climate financial integration'],
  },
  {
    id: 11, framework: 'Other', title: 'TCFD Mandatory Disclosure — UK Premium Listed',
    date: '2024-04-01', jurisdiction: 'UK', regulator: 'FCA / BEIS',
    description: 'TCFD-aligned climate disclosures are mandatory for UK premium listed commercial companies and large UK registered companies (>500 employees, >£500M turnover). Now in its third reporting cycle.',
    entityTypes: ['Large Listed Co'], effort: 'Medium', status: 'Completed',
    requirements: ['Four TCFD pillars: Governance, Strategy, Risk Management, Metrics & Targets', 'Scenario analysis including 1.5°C pathway', 'Scope 1 and 2 (Scope 3 encouraged)', 'Board oversight and executive accountability', 'Comply-or-explain for individual recommendations'],
    links: ['fca.org.uk/tcfd-rules', 'gov.uk/tcfd-mandatory-guidance', 'tcfdhub.org/uk-guidance'],
    actions: ['Update TCFD report for current year', 'Expand scenario analysis to include physical risk', 'Align with FCA\'s transition to UK SRS', 'Review board governance structures for climate'],
  },
  {
    id: 12, framework: 'Basel', title: 'Basel Climate Risk Guidance — Full Implementation',
    date: '2025-12-31', jurisdiction: 'Global', regulator: 'BCBS',
    description: 'The Basel Committee on Banking Supervision\'s Principles for the Effective Management and Supervision of Climate-Related Financial Risks require banks to integrate climate risk into governance, strategy, risk management, and Pillar 3 disclosures.',
    entityTypes: ['Bank'], effort: 'High', status: 'Upcoming',
    requirements: ['Climate risk integration into ICAAP/ILAAP', 'Scenario analysis for transition and physical risk', 'Sector-level concentration risk limits', 'Pillar 3 climate risk disclosure tables', 'Climate risk appetite statement at board level'],
    links: ['bis.org/bcbs-climate-principles', 'bis.org/publ/d532.htm', 'fsb.org/climate-risk-supervision'],
    actions: ['Integrate climate risk into existing risk taxonomy', 'Develop transition and physical risk scenarios', 'Update Pillar 3 report templates', 'Train credit underwriting teams on climate risk'],
  },
  {
    id: 13, framework: 'Basel', title: 'ECB Climate Risk Supervisory Expectations — Ongoing',
    date: '2024-12-31', jurisdiction: 'EU', regulator: 'ECB',
    description: 'ECB expects all significant institutions to fully integrate climate and environmental risk into their risk frameworks by end of 2024. Banks failing supervisory expectations face capital add-ons via Pillar 2 guidance.',
    entityTypes: ['Bank'], effort: 'High', status: 'Completed',
    requirements: ['Full SREP climate risk materiality assessment', 'Climate risk in credit, market, liquidity risk frameworks', 'Climate stress testing capability', 'Counterparty climate risk assessment', 'Green asset ratio (GAR) Pillar 3 disclosure'],
    links: ['bankingsupervision.europa.eu/climate', 'ecb.europa.eu/climate-guide-2020', 'eba.europa.eu/climate-risk'],
    actions: ['Complete ECB self-assessment questionnaire', 'Address supervisory feedback from prior SREP', 'Build internal climate risk quantification models', 'Disclose GAR in Pillar 3 report'],
  },
  {
    id: 14, framework: 'Basel', title: 'EBA Climate Stress Test — EU Banking Sector',
    date: '2025-06-30', jurisdiction: 'EU', regulator: 'EBA',
    description: 'The European Banking Authority\'s one-off fit-for-purpose climate risk stress test covers transition risk (carbon price shock) and physical risk (flood/drought scenarios) for the top 100 EU banks.',
    entityTypes: ['Bank'], effort: 'High', status: 'Upcoming',
    requirements: ['Transition scenario: carbon price to €150/tCO2 by 2030', 'Physical risk: 1-in-100yr flood and drought', 'Counterparty and sector exposure mapping', 'Static balance sheet assumption', 'Submission of templates to national CA by June 2025'],
    links: ['eba.europa.eu/climate-stress-test-2025', 'eba.europa.eu/stress-test-methodology', 'esrb.europa.eu/climate-scenarios'],
    actions: ['Map loan book exposure to climate-sensitive sectors', 'Build climate stress test modelling capability', 'Complete EBA data templates', 'Submit results to national competent authority'],
  },
  {
    id: 15, framework: 'Other', title: 'RBI Climate Risk Framework — Indian Banks',
    date: '2025-06-30', jurisdiction: 'India', regulator: 'RBI',
    description: 'The Reserve Bank of India has issued a discussion paper on climate risk and sustainable finance, with final guidance expected in 2025. Banks are expected to integrate climate risk into credit and operational risk frameworks.',
    entityTypes: ['Bank'], effort: 'Medium', status: 'Upcoming',
    requirements: ['Climate risk policy at board level', 'Integration into credit appraisal process', 'Sector exposure limits for high-carbon industries', 'BRSR Core alignment for bank-financed corporates', 'Green finance taxonomy adoption'],
    links: ['rbi.org.in/climate-risk-paper', 'rbi.org.in/sustainable-finance', 'fidc.org.in/green-finance'],
    actions: ['Respond to RBI consultation paper', 'Draft climate risk policy for board approval', 'Update credit manual with climate risk criteria', 'Map loan book to green/brown taxonomy'],
  },
  {
    id: 16, framework: 'Other', title: 'IOSCO Sustainability Disclosure Standards',
    date: '2025-09-30', jurisdiction: 'Global', regulator: 'IOSCO',
    description: 'IOSCO has recommended securities regulators adopt or otherwise be informed by ISSB standards. Member jurisdictions are expected to confirm adoption roadmaps by end-2025.',
    entityTypes: ['All'], effort: 'Low', status: 'Upcoming',
    requirements: ['Jurisdiction-level adoption plan for IFRS S1/S2', 'Consultation with market participants', 'Alignment with local legal frameworks', 'Capacity building for preparers and auditors', 'Regulatory implementation timeline publication'],
    links: ['iosco.org/sustainability-disclosures', 'iosco.org/issb-recommendation', 'ifrs.org/iosco-endorsement'],
    actions: ['Monitor IOSCO member jurisdiction updates', 'Engage with local securities regulator', 'Assess jurisdiction-specific derogations', 'Update disclosure strategy for each jurisdiction'],
  },
  {
    id: 17, framework: 'Other', title: 'CBAM Full Implementation — EU Carbon Border Adjustment',
    date: '2026-01-01', jurisdiction: 'EU', regulator: 'EC / DG TAXUD',
    description: 'The Carbon Border Adjustment Mechanism (CBAM) enters full implementation from January 2026, requiring EU importers of covered goods (steel, aluminium, cement, fertilisers, electricity, hydrogen) to purchase CBAM certificates.',
    entityTypes: ['Insurer', 'Bank', 'All'], effort: 'High', status: 'Upcoming',
    requirements: ['CBAM certificate purchase for embedded emissions', 'Quarterly emission declarations for covered imports', 'Third-country carbon price deductions', 'Supply chain embedded carbon footprinting', 'Authorised CBAM declarant registration'],
    links: ['ec.europa.eu/cbam-regulation', 'taxation-customs.ec.europa.eu/cbam', 'cbam.eu/guidance'],
    actions: ['Register as authorised CBAM declarant', 'Map import flows to covered CBAM goods', 'Establish embedded emissions tracking', 'Budget for CBAM certificate costs in FY2026'],
  },
  {
    id: 18, framework: 'CSRD', title: 'CSDDD Supply Chain Due Diligence — EU Phase-in',
    date: '2027-07-26', jurisdiction: 'EU', regulator: 'EC',
    description: 'The Corporate Sustainability Due Diligence Directive (CSDDD) requires large EU companies to conduct human rights and environmental due diligence across their value chains. Phase-in starts with the largest companies in 2027.',
    entityTypes: ['Large Listed Co', 'Bank'], effort: 'High', status: 'Upcoming',
    requirements: ['Value chain due diligence policy', 'Risk-based supplier assessment process', 'Remediation plans for identified harms', 'Grievance mechanism for affected stakeholders', 'Annual public reporting on due diligence'],
    links: ['ec.europa.eu/csddd-directive', 'ec.europa.eu/csddd-faq', 'business-humanrights.org/csddd'],
    actions: ['Map tier 1 and 2 suppliers by risk profile', 'Develop supplier code of conduct aligned with CSDDD', 'Implement grievance mechanism', 'Train procurement teams on due diligence procedures'],
  },
  {
    id: 19, framework: 'Other', title: 'TNFD — Nature-Related Disclosure Adoption',
    date: '2025-09-30', jurisdiction: 'Global', regulator: 'TNFD',
    description: 'The Taskforce on Nature-related Financial Disclosures (TNFD) v1.0 framework is available for voluntary adoption. Companies committing to TNFD-aligned reporting should publish first disclosures in 2025 reporting season.',
    entityTypes: ['Asset Manager', 'All'], effort: 'Medium', status: 'Upcoming',
    requirements: ['LEAP (Locate, Evaluate, Assess, Prepare) approach', 'Nature-related dependencies and impacts disclosure', 'Priority locations assessment (ecoregion mapping)', 'Biome-specific core global metrics', 'Integration with CSRD ESRS E4 (Biodiversity)'],
    links: ['tnfd.global/framework-v1', 'tnfd.global/leap-approach', 'tnfd.global/sector-guidance'],
    actions: ['Register TNFD adoption commitment on website', 'Apply LEAP approach to material operations', 'Source biodiversity data (IBAT, GFW)', 'Align TNFD disclosures with ESRS E4'],
  },
  {
    id: 20, framework: 'Other', title: 'SBTi Financial Sector Guidance v2.0',
    date: '2025-12-31', jurisdiction: 'Global', regulator: 'SBTi',
    description: 'The Science Based Targets initiative is updating its Financial Sector Science-Based Targets Guidance to v2.0, incorporating PACTA methodology, absolute contraction approach, and portfolio coverage metric updates.',
    entityTypes: ['Bank', 'Asset Manager', 'Insurer'], effort: 'Medium', status: 'Upcoming',
    requirements: ['Submit SBT for validation under new methodology', 'Portfolio coverage targets for listed equity', 'Absolute contraction for corporate lending', 'PACTA-based engagement metric reporting', 'Annual progress disclosure on SBTi dashboard'],
    links: ['sciencebasedtargets.org/financial-sector', 'sciencebasedtargets.org/target-validation', 'transitionmonitor.com/pacta'],
    actions: ['Review draft SBTi FI v2.0 methodology', 'Recalibrate portfolio targets under new guidance', 'Engage SBTi for target resubmission', 'Update net zero commitment disclosures'],
  },
  {
    id: 21, framework: 'Other', title: 'MAS Sustainable Finance Taxonomy Update',
    date: '2025-06-30', jurisdiction: 'Singapore', regulator: 'MAS',
    description: 'The Monetary Authority of Singapore is updating its Singapore-Asia Taxonomy for Sustainable Finance, expanding sector coverage and introducing amber category for transition activities aligned with regional energy mix.',
    entityTypes: ['Bank', 'Asset Manager'], effort: 'Low', status: 'Upcoming',
    requirements: ['Taxonomy alignment reporting for green loans/bonds', 'Amber category disclosure for transition finance', 'Sector coverage expansion to agriculture and shipping', 'Science-based thresholds for traffic light categories', 'Linkage to SGX ISSB disclosure requirements'],
    links: ['mas.gov.sg/taxonomy-v2', 'mas.gov.sg/green-finance', 'greenfinanceinstitute.com/mas-taxonomy'],
    actions: ['Map portfolio to updated MAS Taxonomy', 'Update green finance product frameworks', 'Brief credit teams on amber category criteria', 'Align taxonomy disclosures with ISSB S2 reports'],
  },
];

const VIEWS = ['Timeline', 'Calendar', 'By Framework'];
const FRAMEWORKS_LIST = ['All', 'CSRD', 'SFDR', 'ISSB', 'SEC', 'SEBI', 'Basel', 'Other'];
const JURISDICTIONS = ['All', 'EU', 'USA', 'India', 'UK', 'Australia', 'Singapore', 'Global'];
const STATUSES = ['All', 'Upcoming', 'Due', 'Overdue', 'Completed'];
const ENTITIES = ['All', 'Bank', 'Asset Manager', 'Insurer', 'Large Listed Co'];

export default function RegulatoryCalendarPage() {
  const [view, setView] = useState('Timeline');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filterFW, setFilterFW] = useState('All');
  const [filterJur, setFilterJur] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterEntity, setFilterEntity] = useState('All');
  const [expanded, setExpanded] = useState({});

  const filtered = useMemo(() => DEADLINES.filter(d => {
    const q = search.toLowerCase();
    if (q && !d.title.toLowerCase().includes(q) && !d.description.toLowerCase().includes(q) && !d.framework.toLowerCase().includes(q)) return false;
    if (filterFW !== 'All' && d.framework !== filterFW) return false;
    if (filterJur !== 'All' && d.jurisdiction !== filterJur) return false;
    if (filterStatus !== 'All' && d.status !== filterStatus) return false;
    if (filterEntity !== 'All' && !d.entityTypes.includes(filterEntity) && !d.entityTypes.includes('All')) return false;
    return true;
  }), [search, filterFW, filterJur, filterStatus, filterEntity]);

  const kpis = useMemo(() => ({
    upcoming: DEADLINES.filter(d => d.status === 'Upcoming').length,
    due: DEADLINES.filter(d => d.status === 'Due').length,
    overdue: DEADLINES.filter(d => d.status === 'Overdue').length,
    completed: DEADLINES.filter(d => d.status === 'Completed').length,
  }), []);

  const byFramework = useMemo(() => {
    const groups = {};
    filtered.forEach(d => { if (!groups[d.framework]) groups[d.framework] = []; groups[d.framework].push(d); });
    return groups;
  }, [filtered]);

  const sel = selected ? DEADLINES.find(d => d.id === selected) : null;

  const DeadlineRow = ({ d, compact = false }) => (
    <div onClick={() => setSelected(d.id)} style={{
      display: 'flex', gap: 14, padding: compact ? '10px 14px' : '12px 16px',
      borderRadius: 8, cursor: 'pointer', marginBottom: 6,
      background: selected === d.id ? `${FW_COLOR[d.framework] || T.sub}12` : T.card,
      border: `1px solid ${selected === d.id ? FW_COLOR[d.framework] || T.sub : T.border}`,
      borderLeft: `3px solid ${FW_COLOR[d.framework] || T.sub}`,
      transition: 'all 0.15s',
    }}>
      <div style={{ minWidth: 80, textAlign: 'right' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>{d.date.slice(0, 7)}</div>
        <div style={{ fontSize: 10, color: T.sub }}>{d.date.slice(8)}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' }}>
          {BADGE(d.framework, FW_COLOR[d.framework] || T.sub)}
          {BADGE(d.jurisdiction, T.navy)}
          <span style={{ fontSize: 9, fontWeight: 600, color: STATUS_COLOR[d.status], background: `${STATUS_COLOR[d.status]}15`, borderRadius: 3, padding: '2px 6px', border: `1px solid ${STATUS_COLOR[d.status]}33` }}>{d.status}</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: EFFORT_COLOR[d.effort], marginLeft: 2 }}>● {d.effort} effort</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
        <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{d.entityTypes.join(' · ')}</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* PAGE HEADER */}
      <div style={{ background: T.navy, padding: '18px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>EP-F5</span>
          <span style={{ color: T.gold, fontWeight: 700, fontSize: 18 }}>Regulatory Compliance Calendar</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['CSRD', 'SFDR', 'ISSB', 'SEC Climate', 'SEBI BRSR'].map(b => BADGE(b, T.gold))}
        </div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'flex', gap: 16, padding: '16px 32px', background: T.card, borderBottom: `1px solid ${T.border}` }}>
        {[
          { label: 'Upcoming (≤30d)', value: kpis.upcoming, color: T.blue },
          { label: 'Due This Quarter', value: kpis.due, color: T.amber },
          { label: 'Overdue', value: kpis.overdue, color: T.red },
          { label: 'Completed', value: kpis.completed, color: T.green },
        ].map(k => (
          <div key={k.label} style={{ flex: 1, background: `${k.color}0d`, border: `1px solid ${k.color}30`, borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: T.sub, fontWeight: 500, marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div style={{ padding: '12px 32px', background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search regulations..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 12px', fontSize: 13, fontFamily: T.font, color: T.text, width: 220 }} />
        {[
          { label: 'Framework', val: filterFW, set: setFilterFW, opts: FRAMEWORKS_LIST },
          { label: 'Jurisdiction', val: filterJur, set: setFilterJur, opts: JURISDICTIONS },
          { label: 'Status', val: filterStatus, set: setFilterStatus, opts: STATUSES },
          { label: 'Entity Type', val: filterEntity, set: setFilterEntity, opts: ENTITIES },
        ].map(f => (
          <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: T.font, color: T.text, background: T.card }}>
            {f.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span style={{ fontSize: 12, color: T.sub, marginLeft: 'auto' }}>{filtered.length} of {DEADLINES.length} items</span>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'flex', height: 'calc(100vh - 224px)', overflow: 'hidden' }}>

        {/* LEFT PANEL */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minWidth: 0 }}>
          {/* VIEW TOGGLE */}
          <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 7, overflow: 'hidden', width: 'fit-content', marginBottom: 18 }}>
            {VIEWS.map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '7px 18px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: T.font,
                background: view === v ? T.navy : T.card, color: view === v ? '#fff' : T.sub,
                borderRight: `1px solid ${T.border}`,
              }}>{v}</button>
            ))}
          </div>

          {/* TIMELINE VIEW */}
          {view === 'Timeline' && (
            <div>
              {filtered.length === 0 && <div style={{ textAlign: 'center', color: T.sub, padding: 40 }}>No regulations match your filters.</div>}
              {filtered.sort((a, b) => a.date.localeCompare(b.date)).map(d => <DeadlineRow key={d.id} d={d} />)}
            </div>
          )}

          {/* CALENDAR VIEW */}
          {view === 'Calendar' && (
            <div>
              {['2024', '2025', '2026', '2027'].map(yr => {
                const yrItems = filtered.filter(d => d.date.startsWith(yr)).sort((a, b) => a.date.localeCompare(b.date));
                if (!yrItems.length) return null;
                return (
                  <div key={yr} style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.navy, borderBottom: `2px solid ${T.gold}`, paddingBottom: 6, marginBottom: 12 }}>{yr}</div>
                    {yrItems.map(d => <DeadlineRow key={d.id} d={d} compact />)}
                  </div>
                );
              })}
            </div>
          )}

          {/* BY FRAMEWORK VIEW */}
          {view === 'By Framework' && (
            <div>
              {Object.entries(byFramework).sort().map(([fw, items]) => (
                <div key={fw} style={{ marginBottom: 20 }}>
                  <div onClick={() => setExpanded(p => ({ ...p, [fw]: !p[fw] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: `${FW_COLOR[fw] || T.sub}12`, borderRadius: 7, cursor: 'pointer', marginBottom: expanded[fw] !== false ? 10 : 0, border: `1px solid ${FW_COLOR[fw] || T.sub}30` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: FW_COLOR[fw] || T.sub }}>{fw}</span>
                    <span style={{ fontSize: 11, color: T.sub }}>{items.length} regulation{items.length !== 1 ? 's' : ''}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 14, color: T.sub }}>{expanded[fw] === false ? '▶' : '▼'}</span>
                  </div>
                  {expanded[fw] !== false && items.map(d => <DeadlineRow key={d.id} d={d} compact />)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT DETAIL PANEL */}
        <div style={{ width: 360, background: T.card, borderLeft: `1px solid ${T.border}`, overflowY: 'auto', padding: 24, flexShrink: 0 }}>
          {!sel ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', color: T.sub, textAlign: 'center', gap: 12 }}>
              <div style={{ fontSize: 32 }}>📋</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Select a regulation</div>
              <div style={{ fontSize: 11 }}>Click any item in the list to view full details, requirements, and action items.</div>
            </div>
          ) : (
            <div>
              {/* DETAIL HEADER */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {BADGE(sel.framework, FW_COLOR[sel.framework] || T.sub)}
                  {BADGE(sel.jurisdiction, T.navy)}
                  <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLOR[sel.status], background: `${STATUS_COLOR[sel.status]}15`, border: `1px solid ${STATUS_COLOR[sel.status]}33`, borderRadius: 3, padding: '2px 6px' }}>{sel.status}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, lineHeight: 1.4, marginBottom: 6 }}>{sel.title}</div>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>Deadline: <span style={{ color: T.text }}>{sel.date}</span> &nbsp;·&nbsp; Effort: <span style={{ color: EFFORT_COLOR[sel.effort] }}>{sel.effort}</span></div>
              </div>

              <hr style={{ border: 'none', borderTop: `1px solid ${T.border}`, margin: '14px 0' }} />

              {/* REGULATOR & ENTITIES */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>Regulator</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{sel.regulator}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>Jurisdiction</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{sel.jurisdiction}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Entity Types</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {sel.entityTypes.map(e => <span key={e} style={{ fontSize: 10, background: `${T.navy}0f`, color: T.navy, borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>{e}</span>)}
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Description</div>
                <p style={{ fontSize: 12, color: T.text, lineHeight: 1.7, margin: 0 }}>{sel.description}</p>
              </div>

              <hr style={{ border: 'none', borderTop: `1px solid ${T.border}`, margin: '14px 0' }} />

              {/* KEY REQUIREMENTS */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Key Requirements</div>
                {sel.requirements.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: FW_COLOR[sel.framework] || T.sub, fontWeight: 700, fontSize: 11, marginTop: 1, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>

              {/* ACTION ITEMS */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Action Items</div>
                {sel.actions.map((a, i) => (
                  <label key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, cursor: 'pointer', alignItems: 'flex-start' }}>
                    <input type="checkbox" style={{ accentColor: FW_COLOR[sel.framework] || T.navy, marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{a}</span>
                  </label>
                ))}
              </div>

              {/* LINKS */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Reference Links</div>
                {sel.links.map((link, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.blue, fontFamily: 'monospace', marginBottom: 3, padding: '3px 8px', background: `${T.blue}08`, borderRadius: 4 }}>
                    https://{link}
                  </div>
                ))}
              </div>

              {/* STATUS TOGGLE */}
              <div style={{ display: 'flex', gap: 8 }}>
                {['Upcoming', 'Completed'].map(s => (
                  <button key={s} style={{
                    flex: 1, padding: '8px 0', borderRadius: 7, border: `1px solid ${STATUS_COLOR[s]}44`,
                    background: sel.status === s ? STATUS_COLOR[s] : `${STATUS_COLOR[s]}10`,
                    color: sel.status === s ? '#fff' : STATUS_COLOR[s], fontWeight: 600, fontSize: 11,
                    cursor: 'pointer', fontFamily: T.font,
                  }}>{s === 'Completed' ? 'Mark Complete' : 'Mark Upcoming'}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
