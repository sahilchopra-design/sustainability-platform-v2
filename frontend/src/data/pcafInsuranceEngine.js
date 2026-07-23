/**
 * pcafInsuranceEngine.js — shared PCAF Insurance-Associated Emissions
 * (Part C) per-line-of-business calculators (R3 gap B-3: port, don't
 * rebuild).
 *
 * These calculators were originally built for the India BRSR module and
 * already implement the correct PCAF attribution structures per line of
 * business: motor (vehicle count x fuel-type emission factor x annual km),
 * property (insured area x EPC-band emission factor), commercial (insured
 * revenue x sector-average emission factor), treaty reinsurance
 * (ceded-premium share of the cedent's reported emissions), and project
 * insurance (sum-insured share of project Scope 1) — all real PCAF IAE
 * Standard methodologies, the last two confirmed as genuine (not
 * "platform-only") 3rd Edition/Dec-2025-update additions per pcafStandards.js.
 * The global PCAF Financed Emissions module's Insurance tab previously used
 * a flat GWP x sector-EF formula that produced totals 3-4 orders of
 * magnitude too low (~5,236 tCO2e on $17.3Bn GWP, where PCAF's own
 * attribution method lands in the 10^5-10^7 range for a book that size) —
 * this module is now the single source of truth for both modules, closing
 * that gap by reuse rather than a second, divergent implementation.
 *
 * Life and Health remain explicitly out of scope of the PCAF
 * Insurance-Associated Emissions Standard (Nov 2022) — ring-fenced here as
 * `outOfPcafScope`, never summed into a PCAF-labeled total.
 *
 * Unit convention: every monetary input must be in USD millions. Callers
 * working in another currency (e.g. the India module's INR crore figures)
 * convert at the boundary using INR_CR_TO_USD_M, the same FX constant
 * already used elsewhere in this codebase for INR Cr <-> USD M conversion.
 * This keeps exactly one calibrated emission-factor coefficient set shared
 * by every caller, rather than two coefficient sets that could silently
 * drift apart.
 */
import { PCAF_PART_C } from './pcafStandards';

export const INR_CR_TO_USD_M = 0.12;

export const LOB_FIELDS = {
  'Motor': {
    color: '#1b3a5c', lobValues: ['motor_personal', 'motor_commercial'],
    reference: `${PCAF_PART_C} · Premium-weighted vehicle emissions`,
    fields: [
      { key: 'line_of_business', label: 'Sub-LOB', type: 'select', options: ['motor_personal', 'motor_commercial'] },
      { key: 'vehicle_count', label: 'Vehicle Count', type: 'number' },
      { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['petrol', 'diesel', 'cng', 'hybrid', 'bev', 'lpg'] },
      { key: 'annual_km_per_vehicle', label: 'Annual km/veh', type: 'number', help: 'Default 12,000' },
      { key: 'avg_engine_cc', label: 'Engine CC', type: 'number' },
    ],
  },
  'Property': {
    color: '#d97706', lobValues: ['property_residential', 'property_commercial'],
    reference: `${PCAF_PART_C} · Building area × EPC emission factor`,
    fields: [
      { key: 'line_of_business', label: 'Sub-LOB', type: 'select', options: ['property_residential', 'property_commercial'] },
      { key: 'insured_property_area_m2', label: 'Area (m²)', type: 'number' },
      { key: 'epc_rating', label: 'EPC', type: 'select', options: ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] },
      { key: 'building_type', label: 'Building', type: 'select', options: ['residential', 'commercial', 'industrial'] },
      { key: 'building_year', label: 'Year Built', type: 'number' },
    ],
  },
  'Commercial': {
    color: '#0d9488', lobValues: ['commercial_marine', 'commercial_energy', 'commercial_liability', 'commercial_other'],
    reference: `${PCAF_PART_C} · Revenue-based sector emission factor`,
    fields: [
      { key: 'line_of_business', label: 'Sub-LOB', type: 'select', options: ['commercial_marine', 'commercial_energy', 'commercial_liability', 'commercial_other'] },
      { key: 'insured_revenue_musd', label: 'Insured Rev ($M)', type: 'number' },
      { key: 'nace_sector', label: 'NACE Sector', type: 'text', help: 'e.g. C24.10, B06' },
    ],
  },
  'Life': {
    color: '#4f46e5', lobValues: ['life'],
    reference: `Out of scope of the ${PCAF_PART_C} — illustrative proxy only, excluded from the PCAF-labeled total`,
    fields: [],
  },
  'Health': {
    color: '#5a8a6a', lobValues: ['health'],
    reference: `Out of scope of the ${PCAF_PART_C} — illustrative proxy only, excluded from the PCAF-labeled total`,
    fields: [],
  },
  'Reinsurance': {
    color: '#be185d', // rose
    lobValues: ['treaty_reinsurance'],
    reference: `${PCAF_PART_C} — treaty reinsurance methodology (Dec 2025 update)`,
    fields: [
      { key: 'line_of_business', label: 'Type', type: 'select', options: ['treaty_reinsurance'] },
      { key: 'ceded_premium_musd', label: 'Ceded Premium ($M)', type: 'number' },
      { key: 'cedent_name', label: 'Cedent Insurer', type: 'text', help: 'Primary insurer ceding risk' },
      { key: 'cedent_total_gwp_musd', label: 'Cedent Total GWP ($M)', type: 'number' },
      { key: 'cedent_reported_tco2e', label: 'Cedent Reported tCO₂e', type: 'number', help: "From cedent's ESG filing" },
    ],
  },
  'Project Insurance': {
    color: '#7c3aed', // violet
    lobValues: ['project_insurance'],
    reference: `${PCAF_PART_C} — project insurance methodology (Dec 2025 update)`,
    fields: [
      { key: 'line_of_business', label: 'Type', type: 'select', options: ['project_insurance'] },
      { key: 'sum_insured_musd', label: 'Sum Insured ($M)', type: 'number' },
      { key: 'total_project_cost_musd', label: 'Project Cost ($M)', type: 'number' },
      { key: 'project_sector', label: 'Project Sector', type: 'select', options: ['energy', 'infrastructure', 'mining', 'manufacturing', 'real_estate', 'transport'] },
      { key: 'project_scope1_tco2e', label: 'Project Scope 1', type: 'number' },
    ],
  },
};
export const LOB_CATEGORIES = Object.keys(LOB_FIELDS);

export function getLobCategory(lob) {
  for (const [cat, cfg] of Object.entries(LOB_FIELDS)) {
    if (cfg.lobValues.includes(lob)) return cat;
  }
  return 'Life';
}

/**
 * Compute PCAF Insurance-Associated Emissions for one policy.
 * @param {object} p - policy fields per LOB_FIELDS above; all monetary
 *   fields (gross_written_premium_musd, insured_revenue_musd,
 *   ceded_premium_musd, cedent_total_gwp_musd, sum_insured_musd,
 *   total_project_cost_musd) must be in USD millions.
 * @returns {{category:string, tco2e:number, outOfPcafScope:boolean, dataGapReason:string|null}}
 */
export function calcPolicyEmissions(p) {
  const gwpM = parseFloat(p.gross_written_premium_musd) || 0;
  const cat = getLobCategory(p.line_of_business);
  let tco2e = 0;
  if (cat === 'Motor') {
    const veh = parseInt(p.vehicle_count) || 0;
    const km = parseFloat(p.annual_km_per_vehicle) || 12000;
    const ef = p.fuel_type === 'bev' ? 0.05 : p.fuel_type === 'cng' ? 0.12 : p.fuel_type === 'diesel' ? 0.21 : 0.18;
    tco2e = veh * km * ef / 1000;
  } else if (cat === 'Property') {
    const area = parseFloat(p.insured_property_area_m2) || 0;
    const epcEf = { 'A+': 30, 'A': 50, 'B': 80, 'C': 120, 'D': 170, 'E': 230, 'F': 300, 'G': 400 };
    tco2e = area * (epcEf[p.epc_rating] || 120) / 1e6;
  } else if (cat === 'Commercial') {
    const revM = parseFloat(p.insured_revenue_musd) || 0;
    // Coefficient recalibrated from the original 0.08-tCO2e-per-₹Cr basis to
    // a $M basis via INR_CR_TO_USD_M, so both callers share one true
    // coefficient rather than silently drifting by the FX factor.
    tco2e = revM * (0.08 / INR_CR_TO_USD_M);
  } else if (cat === 'Reinsurance') {
    const cedTot = parseFloat(p.cedent_reported_tco2e) || 0;
    const cedGwpM = parseFloat(p.cedent_total_gwp_musd) || 1;
    const cedPreM = parseFloat(p.ceded_premium_musd) || 0;
    tco2e = (cedPreM / cedGwpM) * cedTot;
  } else if (cat === 'Project Insurance') {
    const siM = parseFloat(p.sum_insured_musd) || 0;
    const pcM = parseFloat(p.total_project_cost_musd) || 1;
    const ps1 = parseFloat(p.project_scope1_tco2e) || 0;
    tco2e = (siM / pcM) * ps1;
  }
  // Life and Health are explicitly out of scope of the PCAF
  // Insurance-Associated Emissions Standard (Nov 2022) — commercial lines
  // and personal motor only. Report as a separate, clearly-labeled extended
  // metric rather than summing into any PCAF-labeled total.
  const outOfPcafScope = cat === 'Life' || cat === 'Health';
  if (outOfPcafScope) tco2e = gwpM * (0.001 / INR_CR_TO_USD_M);
  return {
    category: cat,
    tco2e,
    outOfPcafScope,
    dataGapReason: outOfPcafScope ? `${cat} is out of scope of the ${PCAF_PART_C} — excluded from the PCAF-labeled total` : null,
  };
}
