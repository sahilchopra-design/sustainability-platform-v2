/**
 * engines/carbonCredits.js — Shared Carbon Credit Calculation Engine
 *
 * Pure functions only — no React, no Math.random(), no side effects.
 * All calculations reference VM0010, VM0007, VM0033, VM0047, AR6 methodologies.
 *
 * Consumed by:
 *   CcIfmCreditsPage          → calcIFM()
 *   CcReddWetlandsHubPage     → calcREDD(), calcWetlands()
 *   CcArrReforestationPage    → calcARR()
 *   CcSoilCarbonPage          → calcSOC()
 *   CcLivestockMethanePage    → calcLivestock()
 *   CcRiceCultivationPage     → calcRice()
 *   CcGridRenewablesPage      → calcGrid()
 *   CcCleanCookingPage        → calcCooking()
 *   CcEnergyEfficiencyHubPage → calcEE()
 */

import { gwp, combinedMarginEF } from './gwp';

// ── Utility ───────────────────────────────────────────────────────────────────

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ── IFM — Improved Forest Management (VM0010 v1.3) ───────────────────────────

/**
 * Calculate IFM net credits for a single year.
 *
 * VM0010 Section 7 uncertainty deduction:
 *   pre_unc      = gross_seq - leakage - buffer_pool
 *   unc_deduction = pre_unc × (1 - uncertainty_factor)   // deduction, not multiplier
 *   net           = pre_unc - unc_deduction = pre_unc × uncertainty_factor
 *
 * Note: uncertainty_factor ∈ [0.7, 1.0] (higher = more confident, fewer deducted credits)
 *
 * @param {object} p
 * @param {number} p.gross_seq_ha     — Gross carbon sequestration tCO2e/ha
 * @param {number} p.area_ha          — Forest area in hectares
 * @param {number} p.leakage_pct      — Leakage % (0–30)
 * @param {number} p.buffer_pct       — Buffer pool % (0–40)
 * @param {number} p.uncertainty_pct  — Uncertainty deduction % (0–30); 1 - uncertainty_factor
 * @param {number} p.years            — Crediting period in years
 * @returns {Array<{year, gross, leakage, buffer, uncertainty_ded, net, cumulative}>}
 */
export function calcIFM(p) {
  const {
    gross_seq_ha = 3.2,
    area_ha = 50000,
    leakage_pct = 15,
    buffer_pct = 20,
    uncertainty_pct = 10,
    years = 30,
  } = p;

  const gross_annual = gross_seq_ha * area_ha;
  const uncertainty_factor = clamp(1 - uncertainty_pct / 100, 0.5, 1.0);
  const rows = [];
  let cumulative = 0;

  for (let t = 1; t <= years; t++) {
    const gross   = Math.round(gross_annual);
    const leakage = Math.round(gross * leakage_pct / 100);
    const after_leak = gross - leakage;
    const buffer  = Math.round(after_leak * buffer_pct / 100);
    const pre_unc = after_leak - buffer;

    // VM0010 uncertainty deduction (explicit, not multiplicative)
    const uncertainty_ded = Math.round(pre_unc * (1 - uncertainty_factor));
    const net = Math.max(0, pre_unc - uncertainty_ded);

    cumulative += net;

    rows.push({
      year: t,
      gross,
      leakage,
      buffer,
      uncertainty_ded,
      net,
      cumulative,
    });
  }
  return rows;
}

// ── REDD+ (VM0007 / VM0033) ───────────────────────────────────────────────────

/**
 * Calculate REDD+ avoided deforestation credits.
 *
 * Gross emissions baseline = BDR × Area × (CS_forest - CS_post) × 44/12
 *   BDR = baseline deforestation rate (% of area per year)
 *
 * Leakage decomposition (VM0033):
 *   Activity-shifting leakage: displaced agricultural activity
 *   Market leakage (timber substitution): VM0033 Table 4 proxy
 *
 * @param {object} p
 * @param {number} p.bdr_pct           — Baseline deforestation rate (% per year)
 * @param {number} p.forest_area_ha    — Project area in ha
 * @param {number} p.cs_forest         — Carbon stock in standing forest (tC/ha)
 * @param {number} p.cs_post           — Carbon stock after deforestation (tC/ha)
 * @param {number} p.crediting_yrs     — Crediting period
 * @param {number} p.leakage_act_pct   — Activity-shifting leakage (%)
 * @param {number} p.leakage_mkt_pct   — Market leakage / timber substitution (%)
 * @param {number} p.buffer_pct        — Buffer pool (%)
 * @param {number} p.uncertainty_pct   — Uncertainty deduction (%)
 * @returns {{ gross, leak_act, leak_mkt, leak, buffer, uncertainty_ded, net, annualRows }}
 */
export function calcREDD(p) {
  const {
    bdr_pct = 1.2,
    forest_area_ha = 100000,
    cs_forest = 350,
    cs_post = 50,
    crediting_yrs = 30,
    leakage_act_pct = 8,
    leakage_mkt_pct = 4,
    buffer_pct = 25,
    uncertainty_pct = 10,
  } = p;

  // Annual deforested area
  const deforested_ha = forest_area_ha * (bdr_pct / 100);

  // Carbon stock difference × 44/12 = CO2 conversion
  const delta_cs = cs_forest - cs_post;
  const gross = Math.round(deforested_ha * delta_cs * (44 / 12));

  // VM0033 leakage decomposition
  const leak_act = Math.round(gross * leakage_act_pct / 100);
  const leak_mkt = Math.round(gross * leakage_mkt_pct / 100);
  const leak = leak_act + leak_mkt;

  const after_leak = gross - leak;
  const buffer = Math.round(after_leak * buffer_pct / 100);
  const pre_unc = after_leak - buffer;
  const uncertainty_ded = Math.round(pre_unc * uncertainty_pct / 100);
  const net = Math.max(0, pre_unc - uncertainty_ded);

  // Multi-year rows (gross declines ~2%/yr as forest area depletes)
  const annualRows = [];
  let cumulative = 0;
  for (let t = 1; t <= crediting_yrs; t++) {
    // Gradual BDR decline: project reduces deforestation pressure
    const yr_gross = Math.round(gross * Math.pow(0.98, t - 1));
    const yr_net = Math.round(yr_gross * (net / Math.max(gross, 1)));
    cumulative += yr_net;
    annualRows.push({ year: t, gross: yr_gross, net: yr_net, cumulative });
  }

  return { gross, leak_act, leak_mkt, leak, buffer, uncertainty_ded, net, annualRows };
}

// ── ARR — Afforestation/Reforestation (VM0047 / ACM0001) ─────────────────────

/**
 * Chapman-Richards biomass accumulation model.
 * CS(t) = CS_max × [1 - exp(-k × t)]^p
 *
 * @param {number} t      — Year
 * @param {number} cs_max — Maximum carbon stock (tCO2e/ha)
 * @param {number} k      — Growth rate constant (default 0.08)
 * @param {number} p_exp  — Shape parameter (default 2.5)
 * @returns {number} Carbon stock at year t (tCO2e/ha)
 */
export function chapmanRichards(t, cs_max, k = 0.08, p_exp = 2.5) {
  return cs_max * Math.pow(1 - Math.exp(-k * t), p_exp);
}

/**
 * Calculate ARR net credits per year.
 *
 * @param {object} p
 * @param {number} p.area_ha          — Planted area (ha)
 * @param {number} p.cs_max_ha        — Max carbon stock (tCO2e/ha)
 * @param {number} p.k                — Growth rate
 * @param {number} p.p_exp            — Shape exponent
 * @param {number} p.leakage_pct      — Leakage (%)
 * @param {number} p.buffer_pct       — Buffer pool (%)
 * @param {number} p.crediting_yrs    — Years
 * @returns {Array<{year, stock_ha, annual_seq, net, cumulative}>}
 */
export function calcARR(p) {
  const {
    area_ha = 10000,
    cs_max_ha = 280,
    k = 0.08,
    p_exp = 2.5,
    leakage_pct = 5,
    buffer_pct = 20,
    crediting_yrs = 30,
  } = p;

  const rows = [];
  let cumulative = 0;

  for (let t = 1; t <= crediting_yrs; t++) {
    const stock_ha = chapmanRichards(t, cs_max_ha, k, p_exp);
    const prev_ha  = t > 1 ? chapmanRichards(t - 1, cs_max_ha, k, p_exp) : 0;
    const annual_seq = Math.round((stock_ha - prev_ha) * area_ha);
    const leakage = Math.round(annual_seq * leakage_pct / 100);
    const after_leak = annual_seq - leakage;
    const buffer = Math.round(after_leak * buffer_pct / 100);
    const net = Math.max(0, after_leak - buffer);
    cumulative += net;

    rows.push({ year: t, stock_ha: +stock_ha.toFixed(2), annual_seq, net, cumulative });
  }
  return rows;
}

// ── Soil Carbon (VM0042 / IPCC Tier 2) ───────────────────────────────────────

/**
 * Soil Organic Carbon change.
 * ΔSOC = (SOC_post - SOC_pre) × Area
 * SOC = concentration (%) × bulk_density (g/cm³) × depth (cm) × 10000 (cm²/m²) × 1e-4 (g→t) × (44/12)
 *
 * IPCC adjustment factors: fLU × fMG × fI × SOC_REF
 */
export function calcSOC(p) {
  const {
    area_ha = 5000,
    soc_ref_t_ha = 45,      // Reference SOC stock (tC/ha) from IPCC Table 2.3
    f_lu_baseline = 1.0,    // Land-use factor baseline
    f_lu_project  = 1.08,   // Land-use factor with improved practices
    f_mg_baseline = 1.0,    // Management factor baseline
    f_mg_project  = 1.11,   // Management factor with tillage changes
    f_i_baseline  = 1.0,    // Input factor baseline
    f_i_project   = 1.05,   // Input factor with cover crops
    crediting_yrs = 20,
    permanence_pct = 90,    // % of sequestration considered permanent
  } = p;

  const soc_baseline = soc_ref_t_ha * f_lu_baseline * f_mg_baseline * f_i_baseline;
  const soc_project  = soc_ref_t_ha * f_lu_project  * f_mg_project  * f_i_project;
  const delta_soc_ha = (soc_project - soc_baseline) * (44 / 12); // tCO2e/ha
  const annual_seq   = Math.round(delta_soc_ha * area_ha / crediting_yrs); // linear accrual
  const net_annual   = Math.round(annual_seq * permanence_pct / 100);

  const rows = [];
  let cumulative = 0;
  for (let t = 1; t <= crediting_yrs; t++) {
    cumulative += net_annual;
    rows.push({ year: t, annual_seq, net: net_annual, cumulative });
  }

  return { soc_baseline, soc_project, delta_soc_ha: +delta_soc_ha.toFixed(2), rows };
}

// ── Livestock Methane (IPCC Tier 2 / VM0042) ─────────────────────────────────

/**
 * Enteric fermentation methane (Tier 2).
 * CH4 (kg/head/yr) = GE × Ym / 55.65
 * tCO2e = CH4_kg × N_animals / 1000 × GWP(CH4)
 *
 * @param {object} p
 * @param {number} p.ge_mj_day        — Gross energy intake (MJ/head/day)
 * @param {number} p.ym_pct           — Methane conversion factor (%)
 * @param {number} p.n_animals        — Herd size
 * @param {number} p.reduction_pct    — % reduction from intervention
 * @param {string} p.gwp_version      — 'AR5' | 'AR6'
 */
export function calcLivestock(p) {
  const {
    ge_mj_day = 180,
    ym_pct = 6.5,
    n_animals = 50000,
    reduction_pct = 20,
    gwp_version = 'AR6',
  } = p;

  const ch4_kg_head_yr = (ge_mj_day * 365 * ym_pct / 100) / 55.65;
  const baseline_tCH4  = ch4_kg_head_yr * n_animals / 1000;
  const baseline_tCO2e = baseline_tCH4 * gwp('CH4', gwp_version);
  const project_tCO2e  = baseline_tCO2e * (1 - reduction_pct / 100);
  const net_credits    = Math.round(baseline_tCO2e - project_tCO2e);

  return {
    ch4_kg_head_yr: +ch4_kg_head_yr.toFixed(2),
    baseline_tCH4:  +baseline_tCH4.toFixed(1),
    baseline_tCO2e: Math.round(baseline_tCO2e),
    project_tCO2e:  Math.round(project_tCO2e),
    net_credits,
    gwp_ch4: gwp('CH4', gwp_version),
  };
}

// ── Rice Cultivation (IPCC Tier 1 / AM0002) ───────────────────────────────────

/**
 * Rice paddy methane emissions.
 * CH4 = EF_daily × t_season × A × S (scaling factors) × 10^-6 × GWP
 *
 * @param {object} p
 */
export function calcRice(p) {
  const {
    ef_daily = 1.30,         // kgCH4/ha/day (IPCC default for continuously flooded)
    season_days = 120,
    area_ha = 80000,
    sf_water = 1.0,          // Water regime scaling (pre-season)
    sf_straw = 1.0,          // Organic amendment scaling
    sf_soil = 1.0,           // Soil type scaling
    seasons_yr = 2,
    reduction_pct = 35,
    gwp_version = 'AR6',
  } = p;

  const ef_season = ef_daily * season_days * sf_water * sf_straw * sf_soil;
  const baseline_tCH4_yr = (ef_season * area_ha * seasons_yr) * 1e-6 * 1000; // t
  const baseline_tCO2e   = Math.round(baseline_tCH4_yr * gwp('CH4', gwp_version));
  const net_credits       = Math.round(baseline_tCO2e * reduction_pct / 100);

  return { ef_season: +ef_season.toFixed(2), baseline_tCH4_yr: +baseline_tCH4_yr.toFixed(1),
           baseline_tCO2e, net_credits, gwp_ch4: gwp('CH4', gwp_version) };
}

// ── Grid Renewables (ACM0002) ─────────────────────────────────────────────────

/**
 * Baseline Emission Reduction = Net Generation × Combined Margin EF
 * ACM0002 v22.0
 *
 * @param {object} p
 * @param {number} p.capacity_mw
 * @param {number} p.capacity_factor
 * @param {number} p.om_ef            — Operating margin EF (tCO2/MWh)
 * @param {number} p.bm_ef            — Build margin EF (tCO2/MWh)
 * @param {number} p.w_om             — OM weight (default 0.5)
 * @param {number} p.w_bm             — BM weight (default 0.5)
 * @param {number} p.transmission_loss_pct
 */
export function calcGrid(p) {
  const {
    capacity_mw = 100,
    capacity_factor = 0.35,
    om_ef = 0.58,
    bm_ef = 0.52,
    w_om = 0.5,
    w_bm = 0.5,
    transmission_loss_pct = 5,
  } = p;

  const gross_mwh = capacity_mw * capacity_factor * 8760;
  const net_mwh   = gross_mwh * (1 - transmission_loss_pct / 100);
  const cm_ef     = combinedMarginEF(om_ef, bm_ef, w_om, w_bm);
  const credits   = Math.round(net_mwh * cm_ef);

  return { gross_mwh: Math.round(gross_mwh), net_mwh: Math.round(net_mwh),
           cm_ef: +cm_ef.toFixed(4), credits };
}

// ── Clean Cooking (TPDDTOOL03 / GS METH001) ───────────────────────────────────

/**
 * Baseline Emission Reduction for clean cookstoves.
 * BE = Fuel_saved × NCV × EF × fNRB
 *
 * CRITICAL: fNRB applies ONLY to non-renewable biomass fraction.
 * It must NOT be applied again to LPG/kerosene components.
 *
 * @param {object} p
 * @param {number} p.households       — Number of households
 * @param {number} p.fuel_saved_kg_hh — Biomass fuel saved per household per year (kg)
 * @param {number} p.ncv_gj_t         — Net calorific value (GJ/t, default firewood = 15 GJ/t)
 * @param {number} p.ef_tco2_gj       — Emission factor (tCO2e/GJ)
 * @param {number} p.fnrb             — Fraction non-renewable biomass (0–1)
 * @param {number} p.leakage_pct      — Project leakage (default 0%)
 */
export function calcCooking(p) {
  const {
    households = 10000,
    fuel_saved_kg_hh = 1200,
    ncv_gj_t = 15,
    ef_tco2_gj = 0.112,
    fnrb = 0.87,
    leakage_pct = 0,
  } = p;

  const total_fuel_saved_t = (fuel_saved_kg_hh * households) / 1000;
  const energy_saved_gj    = total_fuel_saved_t * ncv_gj_t;
  // fNRB applied once: only the non-renewable fraction generates credits
  const gross_credits      = Math.round(energy_saved_gj * ef_tco2_gj * fnrb);
  const leakage            = Math.round(gross_credits * leakage_pct / 100);
  const net_credits        = gross_credits - leakage;

  return { total_fuel_saved_t: Math.round(total_fuel_saved_t),
           energy_saved_gj: Math.round(energy_saved_gj),
           gross_credits, leakage, net_credits };
}

// ── Energy Efficiency (EE) ────────────────────────────────────────────────────

/**
 * EE baseline emissions (simplified AMS-II.C / AMS-II.E).
 * BE = Capacity_saved × Hours × LF / Efficiency_ratio × EF
 *
 * @param {object} p
 */
export function calcEE(p) {
  const {
    capacity_kw = 500,
    hours_yr = 4000,
    lf = 0.7,                // Load factor
    efficiency_baseline = 0.6,
    efficiency_project  = 0.85,
    grid_ef = 0.48,          // tCO2/MWh
  } = p;

  const energy_baseline_mwh = (capacity_kw / 1000) * hours_yr * lf / efficiency_baseline;
  const energy_project_mwh  = (capacity_kw / 1000) * hours_yr * lf / efficiency_project;
  const energy_saved_mwh    = energy_baseline_mwh - energy_project_mwh;
  const credits             = Math.round(energy_saved_mwh * grid_ef);

  return { energy_baseline_mwh: +energy_baseline_mwh.toFixed(1),
           energy_project_mwh:  +energy_project_mwh.toFixed(1),
           energy_saved_mwh:    +energy_saved_mwh.toFixed(1),
           credits };
}

export default { calcIFM, calcREDD, calcARR, chapmanRichards, calcSOC,
                 calcLivestock, calcRice, calcGrid, calcCooking, calcEE };
