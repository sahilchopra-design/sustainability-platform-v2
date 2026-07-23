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

/**
 * R3 gap B-2: PCAF's scope-3 phase-in schedule. Per Anthesis's PCAF reporting
 * guidance, the phase-in is complete for reports covering 2025 onward — every
 * sector, every asset class must report scope 3 alongside scope 1+2 (reported
 * separately, never blended into one headline number). Earlier reporting
 * years keep the historical sector-tiered phase-in so a report for, say,
 * FY2022 doesn't retroactively claim scope-3 was required for a sector before
 * it actually was.
 */
export const SCOPE3_ALL_SECTOR_YEAR = 2025;
export const SCOPE3_PHASE_IN_2021_SECTORS = ['Energy', 'Oil & Gas', 'Mining'];
export const SCOPE3_PHASE_IN_2024_SECTORS = [
  'Transport', 'Automotive', 'Aviation', 'Shipping', 'Construction',
  'Real Estate', 'Cement', 'Steel', 'Chemicals', 'Industrials', 'Materials',
];

export function isScope3Required(sector, reportingYear) {
  const s = sector || '';
  const year = reportingYear != null ? +reportingYear : SCOPE3_ALL_SECTOR_YEAR;
  if (year >= SCOPE3_ALL_SECTOR_YEAR) return true;
  if (year >= 2024 && SCOPE3_PHASE_IN_2024_SECTORS.some(x => s.includes(x))) return true;
  if (year >= 2021 && SCOPE3_PHASE_IN_2021_SECTORS.some(x => s.includes(x))) return true;
  return false;
}
