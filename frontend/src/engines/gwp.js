/**
 * engines/gwp.js — Central GWP / Emission Factor Registry
 *
 * Single source of truth for all GWP values used across modules.
 * AR5 (IPCC 2013) and AR6 (IPCC 2021) both maintained.
 *
 * Key AR5→AR6 changes modules must adopt:
 *   CH4  (fossil):  28   → 27.2
 *   N2O:           265   → 273
 *   SF6:        23,500   → 17,500
 *   HFC-134a:    1,300   → 1,526
 *   HFC-32:        677   → 771
 *   HFC-125:     3,170   → 3,740
 *
 * Usage:
 *   import { GWP, gwp, EF } from '../../../engines/gwp';
 *   const co2eq = ch4_t * gwp('CH4');                  // uses AR6 by default
 *   const co2eq_old = ch4_t * gwp('CH4', 'AR5');       // explicit AR5
 */

// ── GWP Tables ───────────────────────────────────────────────────────────────

export const GWP = {
  AR5: {
    CO2:         1,
    CH4:         28,          // fossil methane, 100-yr, biogenic = 27
    CH4_bio:     27,          // biogenic methane
    N2O:         265,
    SF6:         23500,
    NF3:         16100,
    CF4:         6630,
    C2F6:        11100,
    HFC23:       12400,
    HFC32:       677,
    HFC125:      3170,
    HFC134a:     1300,
    HFC143a:     4800,
    HFC152a:     138,
    HFC227ea:    3350,
    HFC236fa:    8060,
    HFC245fa:    858,
    HFC365mfc:   804,
    HFC4310mee:  1650,
    PFC14:       6630,        // CF4
    PFC116:      11100,       // C2F6
  },
  AR6: {
    CO2:         1,
    CH4:         27.2,        // fossil, 100-yr; IPCC AR6 WGI Table 7.SM.7
    CH4_bio:     27.9,        // biogenic (includes climate-carbon feedbacks)
    N2O:         273,
    SF6:         17500,       // IPCC AR6 WGI Table 7.SM.7
    NF3:         17400,
    CF4:         7380,
    C2F6:        12400,
    HFC23:       14600,
    HFC32:       771,
    HFC125:      3740,
    HFC134a:     1526,
    HFC143a:     5810,
    HFC152a:     164,
    HFC227ea:    3600,
    HFC236fa:    8690,
    HFC245fa:    962,
    HFC365mfc:   914,
    HFC4310mee:  1820,
    PFC14:       7380,
    PFC116:      12400,
  },
};

// Default protocol version
const DEFAULT_PROTOCOL = 'AR6';

/**
 * Look up GWP for a gas.
 * @param {string} gas     — Gas name matching a key in GWP table (e.g. 'CH4', 'SF6')
 * @param {string} version — 'AR5' | 'AR6' (default: AR6)
 * @returns {number}
 */
export function gwp(gas, version = DEFAULT_PROTOCOL) {
  const table = GWP[version] ?? GWP[DEFAULT_PROTOCOL];
  const val = table[gas];
  if (val == null) {
    console.warn(`[gwp] Unknown gas "${gas}" in ${version} table — returning 1`);
    return 1;
  }
  return val;
}

/**
 * Convert a gas mass to CO2-equivalent tonnes.
 * @param {number} mass_t  — Mass in tonnes
 * @param {string} gas     — Gas identifier
 * @param {string} version — 'AR5' | 'AR6'
 * @returns {number}       — tCO2e
 */
export function toCO2e(mass_t, gas, version = DEFAULT_PROTOCOL) {
  return mass_t * gwp(gas, version);
}

// ── Emission Factors ─────────────────────────────────────────────────────────

/**
 * Grid emission factors by region (tCO2/MWh).
 * Source: IEA Emission Factors 2023.
 */
export const GRID_EF = {
  'EU-27':       0.233,
  'UK':          0.193,
  'US-Average':  0.368,
  'US-WECC':     0.254,
  'US-SERC':     0.432,
  'China':       0.581,
  'India':       0.708,
  'Japan':       0.471,
  'Australia':   0.610,
  'Brazil':      0.098,
  'Global':      0.481,
};

/**
 * Combined margin emission factor calculation (CDM / GS methodology).
 * CM_EF = (OM_EF × w_OM + BM_EF × w_BM)
 * Defaults: OM weight 0.5, BM weight 0.5 (simple average).
 */
export function combinedMarginEF(om_ef, bm_ef, w_om = 0.5, w_bm = 0.5) {
  const total_w = w_om + w_bm;
  return (om_ef * w_om + bm_ef * w_bm) / total_w;
}

// ── Cooking / Biomass ─────────────────────────────────────────────────────────

/**
 * Clean cooking baseline emission factor (tCO2e / GJ).
 * ICS/GS TPDDTOOL02 reference values.
 */
export const COOKING_EF = {
  firewood:     0.112,   // tCO2e/GJ (AR6)
  charcoal:     0.158,
  LPG:          0.063,
  kerosene:     0.072,
  biomass:      0.108,
};

/**
 * Default fNRB (fraction of non-renewable biomass) by region.
 * TOOLS FOR CALCULATING THE FRACTION OF NON-RENEWABLE BIOMASS (CDM).
 * These are indicative; project-specific fNRB takes precedence.
 */
export const FNRB_DEFAULTS = {
  'Sub-Saharan Africa': 0.87,
  'South Asia':         0.76,
  'Southeast Asia':     0.69,
  'Latin America':      0.62,
  'Global-Default':     0.75,
};

// ── GWP Migration Helpers ─────────────────────────────────────────────────────

/**
 * Ratio to convert an AR5-computed tCO2e figure to AR6 for a single gas.
 * Useful for displaying "AR6 equivalent" of stored AR5 data.
 */
export function ar5ToAr6Ratio(gas) {
  const ar5 = gwp(gas, 'AR5');
  const ar6 = gwp(gas, 'AR6');
  if (ar5 === 0) return 1;
  return ar6 / ar5;
}

export default { GWP, gwp, toCO2e, GRID_EF, combinedMarginEF, COOKING_EF, FNRB_DEFAULTS, ar5ToAr6Ratio };
