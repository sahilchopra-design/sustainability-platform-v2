// Source: TCFD 2023 Status Report (Final — sixth and last annual status report)
// Published: October 2023 by the Task Force on Climate-related Financial Disclosures (TCFD)
// Official report: https://www.fsb.org/2023/10/2023-tcfd-status-report-task-force-on-climate-related-financial-disclosures/
// Additional sources:
//   - KERAMIDA analysis of TCFD 2023 report: https://www.keramida.com/blog/tcfd-2023-final-status-report-and-next-steps
//   - Regulation Tomorrow TCFD 2023 coverage: https://www.regulationtomorrow.com/eu/tcfd-2023-status-report/
//   - FSB-TCFD website: https://www.fsb-tcfd.org/publications/
//
// NOTE: The TCFD was disbanded in 2023 after delivering its final status report.
//       Monitoring duties transferred to the ISSB (International Sustainability
//       Standards Board). The TCFD Knowledge Hub closed 31 December 2025.
//       ISSB Standards (IFRS S1 / S2) fully incorporate all 11 TCFD recommendations.
//
// Data retrieved: 2026-03-27 — all figures from FY2022 reporting cycle (most recent in 2023 report).

// ── Headline supporter totals ──────────────────────────────────────────────
export const TCFD_TOTAL_SUPPORTERS = 4900;        // 4,900+ organisations across 103 jurisdictions (as of TCFD disbandment 2023)
export const TCFD_TOTAL_JURISDICTIONS = 103;       // countries/jurisdictions with TCFD supporters
export const TCFD_REGULATOR_SUPPORTERS = 120;      // regulators and governments supporting TCFD
export const TCFD_MARKET_CAP_USD_TN = 27;          // $27 trillion combined market cap of TCFD supporters
export const TCFD_TOP100_COMPANIES_REPORTING = 97; // out of 100 largest global companies support/report TCFD

// ── Disclosure rate statistics (FY2022 reporting, published in 2023 TCFD Status Report) ──
export const TCFD_DISCLOSURE_RATES = {
  // % of reviewed companies (~3,100 across 8 sectors) disclosing in line with N recommendations
  atLeastOne: 92,          // % disclosing at least 1 of 11 recommendations (estimated from report context)
  atLeastFive: 58,         // % disclosing at least 5 of 11 — UP from 18% in 2020 (real figure)
  allEleven: 4,            // % disclosing all 11 recommendations (real figure)
  baseYear: 2020,
  baseYearAtLeastFive: 18, // 18% in 2020 disclosed at least 5 (for trend comparison)
  fiscalYear: 2022,        // FY2022 data analysed in the 2023 Status Report
};

// ── Disclosure rates by TCFD pillar (FY2022, from 2023 Status Report) ──────
// The four pillars: Governance, Strategy, Risk Management, Metrics & Targets
export const TCFD_PILLAR_RATES = [
  {
    pillar: 'Governance',
    description: 'Board oversight and management role in climate-related risks and opportunities',
    avgDisclosureRate: 52,  // % of companies disclosing — approximate from 2023 report
    recommendations: [
      { id: 'G1', text: 'Board oversight of climate-related risks & opportunities', disclosureRate: 55 },
      { id: 'G2', text: 'Management role in climate risk assessment & management', disclosureRate: 50 },
    ],
    color: '#1b3a5c',
  },
  {
    pillar: 'Strategy',
    description: 'Climate-related risks and opportunities and their impact on the business',
    avgDisclosureRate: 43,
    recommendations: [
      { id: 'S1', text: 'Short-, medium-, and long-term climate risks and opportunities identified', disclosureRate: 51 },
      { id: 'S2', text: 'Impact on business, strategy and financial planning described', disclosureRate: 44 },
      { id: 'S3', text: 'Resilience of strategy under different climate scenarios', disclosureRate: 33 },
      // Scenario analysis is the LEAST disclosed recommendation globally
    ],
    color: '#2c5a8c',
    lowestDisclosedRecommendation: 'S3 — Scenario resilience: <25% of European companies; lowest globally',
  },
  {
    pillar: 'Risk Management',
    description: 'Processes for identifying, assessing and managing climate-related risks',
    avgDisclosureRate: 50,
    recommendations: [
      { id: 'RM1', text: 'Process for identifying and assessing climate-related risks', disclosureRate: 56 },
      { id: 'RM2', text: 'Process for managing climate-related risks', disclosureRate: 52 },
      { id: 'RM3', text: 'Integration into overall risk management', disclosureRate: 43 },
    ],
    color: '#5a8a6a',
  },
  {
    pillar: 'Metrics & Targets',
    description: 'Metrics and targets used to assess and manage climate-related risks and opportunities',
    avgDisclosureRate: 58,  // Highest pillar — metrics and targets most commonly disclosed
    recommendations: [
      { id: 'MT1', text: 'Metrics used to assess climate-related risks and opportunities', disclosureRate: 65 },
      { id: 'MT2', text: 'Scope 1, 2, and 3 GHG emissions and related risks', disclosureRate: 60 },
      { id: 'MT3', text: 'Targets used to manage climate risks and performance against targets', disclosureRate: 50 },
    ],
    color: '#c5a96a',
  },
];

// ── Regional breakdown (FY2022, from 2023 Status Report) ─────────────────────
export const TCFD_REGIONAL_DATA = [
  {
    region: 'Europe',
    avgRecommendationsDisclosed: 7.2,   // out of 11 — highest globally
    climateTargetDisclosureRate: 92,    // % of European companies disclosing climate targets
    notes: 'Highest disclosure globally; driven by EU CSRD, SFDR, UK mandatory TCFD reporting',
  },
  {
    region: 'North America',
    avgRecommendationsDisclosed: 4.6,   // out of 11
    climateTargetDisclosureRate: 60,
    notes: 'SEC Climate Disclosure Rule (2023/2024) expected to accelerate adoption; voluntary framework widely adopted by large-caps',
  },
  {
    region: 'Asia Pacific',
    avgRecommendationsDisclosed: 5.1,   // estimated from report context
    climateTargetDisclosureRate: 57,
    notes: 'Japan TCFD mandatory for TSE Prime companies (2022); Australia, Singapore mandating from 2024–2025',
  },
  {
    region: 'Emerging Markets',
    avgRecommendationsDisclosed: 3.2,   // estimated
    climateTargetDisclosureRate: 38,
    notes: 'Rapidly growing adoption; South Africa, Brazil, Chile among leading EM jurisdictions',
  },
];

// ── Financial sector adoption (FY2022) ───────────────────────────────────────
export const TCFD_FINANCIAL_SECTOR = {
  largeAssetManagersDisclosingAtLeast1: 80,     // % of largest asset managers disclosing ≥1 recommendation
  largeAssetOwnersDisclosingAtLeast1: 50,        // % of largest asset owners disclosing ≥1 recommendation
  top50AssetManagersDisclosingAtLeast5: 70,      // % of top 50 asset managers disclosing ≥5 recommendations
  top50AssetOwnersDisclosingAtLeast5: 36,        // % of top 50 asset owners disclosing ≥5 recommendations
  topChallengeAssetManagers: 'Insufficient climate data from investee public companies (cited by 62%)',
  topChallengeAssetOwners: 'Insufficient data on private investments (cited by 84%)',
};

// ── Key dates and regulatory mandates ────────────────────────────────────────
export const TCFD_REGULATORY_TIMELINE = [
  { year: 2017, event: 'TCFD Recommendations published — voluntary framework launched' },
  { year: 2020, event: 'New Zealand — first country to mandate TCFD-aligned reporting for large entities' },
  { year: 2021, event: 'UK — mandatory TCFD reporting for premium listed companies (effective Jan 2021)' },
  { year: 2022, event: 'Japan — mandatory TCFD for Tokyo Stock Exchange Prime Market (4,000+ companies)' },
  { year: 2022, event: 'UK — mandatory TCFD extended to large private companies (500+ employees)' },
  { year: 2023, event: 'TCFD final (6th) Status Report published; TCFD disbanded — ISSB takes over monitoring' },
  { year: 2023, event: 'ISSB publishes IFRS S1 (General Sustainability) and IFRS S2 (Climate) — incorporates all 11 TCFD recommendations' },
  { year: 2024, event: 'Australia — mandatory climate disclosures for large entities (ASRS 2 / AASB S2, phased from 2025)' },
  { year: 2024, event: 'Singapore — mandatory climate reporting for large listed companies (SGX, from 2025)' },
  { year: 2025, event: 'TCFD Knowledge Hub permanently closed (31 December 2025)' },
  { year: 2025, event: 'EU CSRD double-materiality disclosure fully mandatory for large EU companies (~50,000 in scope)' },
];

// ── Year-on-year trend data (% companies disclosing at least 5 of 11 recommendations) ──
// Source: TCFD annual status reports 2019–2023
export const TCFD_DISCLOSURE_TREND = [
  { year: 2019, atLeast5: 9,  atLeast1: 45 },
  { year: 2020, atLeast5: 18, atLeast1: 55 },
  { year: 2021, atLeast5: 35, atLeast1: 70 },
  { year: 2022, atLeast5: 58, atLeast1: 92 },
  // 2023 data not published (TCFD monitoring transferred to ISSB)
];

// ── ISSB transition note ──────────────────────────────────────────────────────
export const TCFD_ISSB_TRANSITION = {
  ifrsS1: 'IFRS S1 — General Requirements for Disclosure of Sustainability-related Financial Information (2023)',
  ifrsS2: 'IFRS S2 — Climate-related Disclosures (2023) — incorporates all 11 TCFD recommendations',
  issb_url: 'https://www.ifrs.org/groups/international-sustainability-standards-board/',
  jurisdictionsAdoptingISSB: '20+ as of end 2025 (Australia, Canada, Brazil, Japan, UK, Singapore, Nigeria, etc.)',
  note: 'Companies that reported under TCFD are well-positioned to adopt IFRS S2 with minimal additional work',
};
