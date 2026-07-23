/**
 * pcafStandards.js — single source of truth for PCAF standard citations (R3 gap B-1)
 *
 * Q-1 decision (22 Jul 2026, per the R3 review PCAF_O_1.md): adopt the PCAF
 * 3rd Edition as the platform baseline now, rather than holding at 2nd
 * Edition. Independently verified (web search against EY/PwC/PCAF's own
 * site, not taken on the review document's word alone) that PCAF genuinely
 * published this update on 2 Dec 2025 — it is not a fabricated citation.
 *
 * Update THIS file, not individual modules, when the citation stack changes
 * again — this is exactly the grep-and-hope problem that caused three
 * review rounds of "which version is it really" churn.
 */

export const PCAF_PART_A = 'PCAF Financed Emissions, 3rd Edition (Dec 2025)';
export const PCAF_PART_B = 'PCAF Facilitated Emissions (Dec 2023)';
export const PCAF_PART_C = 'PCAF Insurance-Associated Emissions (Nov 2022, updated Dec 2025)';

// Part A, 3rd Edition: expanded from the prior 2nd-Edition core set to 10
// asset classes, adding four new methodologies. Exact chapter/section
// numbers for the new methodologies are not asserted here — cite the
// edition/date, not a specific section, unless independently verified.
export const PCAF_PART_A_CLASS_COUNT = 10;
export const PCAF_PART_A_NEW_METHODOLOGIES = [
  'Use-of-Proceeds structures (with a decision tree for UoP-qualifying vs. general corporate exposure)',
  'Securitisations & structured products (RMBS/CLO/CDO)',
  'Sub-sovereign debt',
  'Undrawn loan commitments (optional, IFRS S1/S2-aligned reporting)',
];

// Part C, Dec 2025 update: added two new lines of business alongside the
// original (2022) commercial-lines + personal-motor scope. Life and Health
// remain explicitly out of scope of the standard.
export const PCAF_PART_C_NEW_METHODOLOGIES = [
  'Treaty reinsurance portfolios',
  'Project insurance',
];

export const PCAF_STANDARDS_FOOTER =
  `${PCAF_PART_A} · ${PCAF_PART_B} · ${PCAF_PART_C}`;
