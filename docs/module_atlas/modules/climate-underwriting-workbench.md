# Climate Underwriting Workbench
**Module ID:** `climate-underwriting-workbench` · **Route:** `/climate-underwriting-workbench` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COUNTRIES`, `DEFAULT_INPUTS`, `Field`, `GICS_SECTORS`, `HORIZONS`, `INSURANCE_PERILS`, `INSURANCE_SCENARIOS`, `Kpi`, `NGFS_SCENARIOS`, `PCAF_ASSET_CLASSES`, `PHYS_ASSET_CLASSES`, `Section`, `TIER_COLOR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 31 | `iso2`, `name` |
| `NGFS_SCENARIOS` | 4 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtNum` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `coc` | `num(inp.costOfCapitalPct, 6) / 100;` |
| `loading` | `Math.min(0.6, Math.max(0, num(inp.expenseLoadingPct, 15) / 100));` |
| `scrAddonUsd` | `(ins.data.scr_climate_addon_eur \|\| 0) * fx;` |
| `capitalCostUsd` | `scrAddonUsd * coc;` |
| `purePremiumUsd` | `ealUsd + capitalCostUsd;` |
| `gwpUsd` | `num(inp.gwpEur) * fx;` |
| `premiumAdequacy` | `suggestedPremiumUsd > 0 ? gwpUsd / suggestedPremiumUsd : null;` |
| `outstandingM` | `num(inp.outstandingEur) / 1e6;` |
| `feIntensity` | `outstandingM > 0 ? (pcaf.data.financed_total_tco2e \|\| 0) / outstandingM : null;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/insurance/calculate` | `calculate_insurance` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/reference-data` | `reference_data` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/assessments` | `list_assessments` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/assessments/{assessment_id}` | `get_assessment` | api/v1/routes/insurance.py |
| GET | `/api/v1/open-meteo/status` | `status` | api/v1/routes/open_meteo.py |
| GET | `/api/v1/open-meteo/current-weather` | `current_weather` | api/v1/routes/open_meteo.py |
| GET | `/api/v1/open-meteo/historical-extremes` | `historical_extremes` | api/v1/routes/open_meteo.py |
| GET | `/api/v1/open-meteo/climate-projection` | `climate_projection` | api/v1/routes/open_meteo.py |
| POST | `/api/v1/pcaf-module/calculate` | `calculate_portfolio` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/calculate/{asset_class}` | `calculate_asset_class` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/insurance` | `calculate_insurance` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/facilitated` | `calculate_facilitated` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/portfolio-summary` | `portfolio_summary` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/regulatory-disclosures` | `regulatory_disclosures` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/dqs-assessment` | `dqs_assessment` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/improvement-roadmap` | `improvement_roadmap` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/bridge/ecl` | `bridge_ecl` | api/v1/routes/pcaf_unified.py |
| POST | `/api/v1/pcaf-module/bridge/scenario` | `bridge_scenario` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/asset-classes` | `ref_asset_classes` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/emission-factors` | `ref_emission_factors` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/dqs-framework` | `ref_dqs_framework` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/regulatory-mappings` | `ref_regulatory_mappings` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/insurance-lobs` | `ref_insurance_lobs` | api/v1/routes/pcaf_unified.py |
| GET | `/api/v1/pcaf-module/ref/deal-types` | `ref_deal_types` | api/v1/routes/pcaf_unified.py |

### 2.3 Engine `facilitated_emissions_engine` (services/facilitated_emissions_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `IssuerEmissions.total_scope12` |  |  |
| `IssuerEmissions.total_all_scopes` |  |  |
| `derive_dqs` | data_source, override, has_scope1, has_scope2, verified | Derive PCAF Data Quality Score from available information. |
| `FacilitatedEmissionsEngine.calculate_facilitated` | deal | Calculate facilitated emissions for a single deal. |
| `FacilitatedEmissionsEngine.calculate_facilitated_batch` | deals | Calculate facilitated emissions for multiple deals and produce summary. |
| `FacilitatedEmissionsEngine.calculate_insurance` | policy | Calculate insurance-associated emissions for a single policy. |
| `FacilitatedEmissionsEngine.calculate_insurance_batch` | policies | Calculate insurance emissions for multiple policies and produce summary. |
| `FacilitatedEmissionsEngine.get_sector_intensities` |  | Return the full sector emission intensity registry. |
| `FacilitatedEmissionsEngine.get_vehicle_factors` |  |  |
| `FacilitatedEmissionsEngine.get_building_factors` |  |  |
| `FacilitatedEmissionsEngine.get_insurance_lob_factors` |  |  |
| `FacilitatedEmissionsEngine.get_deal_types` |  |  |
| `FacilitatedEmissionsEngine.get_insurance_lobs` |  |  |
| `FacilitatedEmissionsEngine._compute_attribution_factor` | deal, warnings | Compute AF based on deal type per PCAF Part C methodology. |
| `FacilitatedEmissionsEngine._get_bank_participation` | deal | Return the bank's $ participation in the deal. |
| `FacilitatedEmissionsEngine._calc_motor` | p, warnings | Motor insurance emissions — vehicle-count × km × gCO2/km. |
| `FacilitatedEmissionsEngine._calc_property` | p, warnings | Property insurance emissions — area × kgCO2/m². |
| `FacilitatedEmissionsEngine._calc_commercial` | p, warnings | Commercial lines — sector-based revenue intensity or premium proxy. |
| `FacilitatedEmissionsEngine._aggregate_facilitated` | results | Aggregate deal-level results into portfolio summary. |
| `FacilitatedEmissionsEngine._aggregate_insurance` | results | Aggregate policy-level results into portfolio summary. |

**Engine `facilitated_emissions_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_DQS_SOURCE_MAP` | `{'direct_measurement': 1, 'audited_report': 2, 'self_reported': 3, 'sector_average': 4, 'estimated': 5}` |

### 2.3 Engine `insurance_climate_risk` (services/insurance_climate_risk.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_insurance_climate_risk` | inp, scenario, horizon_year | Full insurance climate risk assessment. Steps: 1. Apply peril × scenario CAT loss multiplier to baseline loss estimates 2. Net for reinsurance retention 3. Compute Solvency II CAT SCR add-on 4. Compute TP uplift under scenario 5. Assess reserve adequacy (TP vs. climate-adjusted loss) 6. Compute protection gap 7. Score ESG underwriting policy |
| `get_reference_data` |  |  |

### 2.3 Engine `pcaf_unified_engine` (services/pcaf_unified_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_emission_factor_fallback` | reported_s1, reported_s2, verified, sector, revenue_eur, outstanding_eur | PCAF emission factor fallback hierarchy: 1. Verified reported data (DQS 1) 2. Unverified reported data (DQS 2) 3. Sector-average intensity x revenue (DQS 4) 4. Sector proxy x outstanding (DQS 5) Returns (scope1, scope2, scope3_est, dqs, source_description). |
| `derive_dqs_auto` | has_verified_emissions, has_reported_emissions, has_physical_activity, has_revenue, has_sector_only, asset_class | Derive PCAF DQS per the asset-class-specific tables (5.1-5.8). Hierarchy: DQS 1: Verified Scope 1+2+3 emissions (audited, ISAE 3410 / ISO 14064-3) DQS 2: Unverified reported Scope 1+2 emissions DQS 3: Physical activity data (kWh, litres, tonnes) + emission factors DQS 4: Economic activity (revenue) + sector emission factors DQS 5: Sector-average proxy from outstanding/assets |
| `PCAFUnifiedEngine.calculate_listed_equity` | holding | Listed Equity & Corporate Bonds: EVIC attribution (PCAF Table 5.1). |
| `PCAFUnifiedEngine.calculate_corporate_bonds` | holding | Corporate Bonds: EVIC attribution (PCAF Table 5.1). |
| `PCAFUnifiedEngine.calculate_business_loans` | holding | Business Loans & SME Loans: balance sheet attribution (PCAF Table 5.2). |
| `PCAFUnifiedEngine.calculate_project_finance` | holding | Project Finance: project cost attribution (PCAF Table 5.3). |
| `PCAFUnifiedEngine.calculate_commercial_re` | holding | Commercial Real Estate: property value, LTV-adjusted (PCAF Table 5.4). |
| `PCAFUnifiedEngine.calculate_mortgages` | holding | Residential Mortgages: property value, EPC-weighted (PCAF Table 5.5). |
| `PCAFUnifiedEngine.calculate_vehicle_loans` | holding | Motor Vehicle Loans: vehicle value, fuel type EF (PCAF Table 5.6). |
| `PCAFUnifiedEngine.calculate_sovereign_bonds` | holding | Sovereign Bonds: GDP-proportional, production-based (PCAF Table 5.7). |
| `PCAFUnifiedEngine.calculate_unlisted_equity` | holding | Unlisted Equity: EVIC proxy with size premium (PCAF Table 5.8). |
| `PCAFUnifiedEngine.calculate_infrastructure` | holding | Infrastructure Finance: project lifecycle attribution. |
| `PCAFUnifiedEngine.calculate_green_bonds` | holding | Green Bonds: use-of-proceeds allocation. |
| `PCAFUnifiedEngine.calculate_insurance` | policies | Calculate insurance-associated emissions for all lines of business. Supports: motor, property, commercial, life/health, marine, energy, liability, reinsurance. |
| `PCAFUnifiedEngine._calculate_insurance_policy` | p | Route to the correct LoB calculation method. |
| `PCAFUnifiedEngine._ins_motor` | p, w | Motor: fleet emissions = vehicles x km x gCO2/km. |
| `PCAFUnifiedEngine._ins_property` | p, w | Property: area x kgCO2/m2 by EPC rating. |
| `PCAFUnifiedEngine._ins_commercial` | p, w | Commercial: sector-revenue intensity or premium proxy. |
| `PCAFUnifiedEngine._ins_marine` | p, w | Marine Insurance: vessel emissions (IMO DCS data x fleet composition). |
| `PCAFUnifiedEngine._ins_energy` | p, w | Energy Insurance: asset-level generation emissions. |
| `PCAFUnifiedEngine._ins_life_health` | p, w | Life & Health: disclosure-only per PCAF (no insured emissions). |
| `PCAFUnifiedEngine._ins_reinsurance` | p, w | Reinsurance: proportional/non-proportional cedant aggregation. |
| `PCAFUnifiedEngine._ins_liability` | p, w | Liability Insurance: sector-revenue proxy. |
| `PCAFUnifiedEngine.calculate_facilitated` | deals | Delegate to existing FacilitatedEmissionsEngine. |
| `PCAFUnifiedEngine.calculate_portfolio` | holdings, insurance_policies, facilitated_deals, prior_year_emissions | Run all asset classes, aggregate, and produce comprehensive portfolio metrics. Parameters ---------- holdings : list[dict] Part A holdings. Each dict must include asset_class plus class-specific fields. insurance_policies : list[InsuranceHoldingInput], optional Part B insurance policies. facilitated_deals : list[FacilitatedDealInput], optional Part C capital markets deals. prior_year_emissions : f |
| `PCAFUnifiedEngine.generate_regulatory_disclosures` | portfolio | Produce disclosure-ready outputs for 7 regulatory/voluntary frameworks. Returns a RegulatoryDisclosurePackage with SFDR PAI, EU Taxonomy Art. 8, TCFD, CSRD ESRS E1, ISSB S2, GRI 305, and NZBA sections. |
| `PCAFUnifiedEngine.assess_data_quality` | holdings | Portfolio-level DQS assessment with uncertainty estimation. For each holding, derives DQS from available data characteristics. Produces exposure-weighted portfolio DQS, distribution, and confidence bands. |
| `PCAFUnifiedEngine.generate_improvement_roadmap` | holdings | Generate per-holding DQS gap closure actions. Prioritises holdings by exposure-weighted DQS improvement potential. |
| `PCAFUnifiedEngine.estimate_uncertainty` | portfolio_dqs, total_emissions | Estimate confidence bands from portfolio DQS. Uses PCAF's indicative uncertainty ranges: DQS 1: +/- 5% DQS 2: +/- 15% DQS 3: +/- 30% DQS 4: +/- 45% DQS 5: +/- 60% |
| `PCAFUnifiedEngine.bridge_to_ecl` | holdings, portfolio_temperature_c | Wire PCAF financed emissions data into the ECL Climate Overlay engine. Converts holdings to PCAFInvesteeProfile and delegates to pcaf_ecl_bridge. |
| `PCAFUnifiedEngine.bridge_to_scenario_analysis` | portfolio | Emit climate scenario overlays from PCAF portfolio metrics. Maps PCAF emissions to NGFS scenario impact pathways for downstream scenario analysis and stress testing. |
| `PCAFUnifiedEngine.feed_to_entity360` | holdings | Supply entity-level PCAF metrics for Entity 360 profiles. Returns a list of entity-level PCAF summaries for integration with the entity 360 counterparty master. |
| `PCAFUnifiedEngine.feed_to_regulatory_compiler` | portfolio | Supply disclosure-ready data for the regulatory report compiler. Returns a structured dict keyed by framework with all PCAF-sourced datapoints needed for CSRD, SFDR, ISSB, TCFD, GRI compilation. |
| `PCAFUnifiedEngine._get_asset_class_calculator` | asset_class | Return the calculation method for a given asset class. |
| `PCAFUnifiedEngine._calculate_standard_asset_class` | holding, asset_class | Standard calculation for EVIC/balance-sheet asset classes. Uses the emission factor fallback hierarchy and returns a normalised result dict. |
| `PCAFUnifiedEngine._apply_af_and_emissions` | holding, af, asset_class, method_note | Helper: apply AF to emissions using fallback hierarchy. |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `Open`, `PCAF`, `Standard`, `__future__` *(shared)*, `credit`, `dataclasses` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `insurance_climate_assessments` *(shared)*, `insurance_climate_entities` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `statistics` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COUNTRIES`, `GICS_SECTORS`, `HORIZONS`, `INSURANCE_PERILS`, `INSURANCE_SCENARIOS`, `NGFS_SCENARIOS`, `PCAF_ASSET_CLASSES`, `PHYS_ASSET_CLASSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 5 · Intermediate Transformation Logic

**Engine `facilitated_emissions_engine` — extracted transformation lines:**
```python
estimated_total = deal.issuer_revenue_musd * intensity
emissions.scope1_tco2e = estimated_total * 0.6  # assume 60/40 split
emissions.scope2_tco2e = estimated_total * 0.4
s1_fac = round(af * emissions.scope1_tco2e, 4)
s2_fac = round(af * emissions.scope2_tco2e, 4)
s3_fac = round(af * emissions.scope3_tco2e, 4)
total_ins = round(gwp * factor, 4) if gwp > 0 else 0.0
s1_ins = round(total_ins * 0.3, 4)
s2_ins = round(total_ins * 0.7, 4)
intensity = round(total_ins / policy.gross_written_premium_musd, 4)
af = (deal.underwritten_amount_musd / deal.total_deal_size_musd) * float(_PCAF_TIME_FACTOR)
effective_placed = placed * (1 + deal.overallotment_pct / 100.0)
af = (effective_placed / mcap) * float(_PCAF_TIME_FACTOR)
af = deal.tranche_held_musd / deal.total_pool_musd
af = deal.arranged_amount_musd / deal.total_facility_musd
total = s1 + s2
total_gco2 = vehicles * annual_km * gco2_km
total_tco2e = total_gco2 / 1_000_000  # g → t
s1 = round(total_tco2e * 0.5, 4)
s2 = round(total_tco2e * 0.5, 4)
total = round(s1 + s2, 4)
af = gco2_km / 1000.0  # effective factor per km
total = s1 + s2
total = round(p.gross_written_premium_musd * factor, 4)
s1 = round(total * 0.4, 4)  # heating/gas
s2 = round(total * 0.6, 4)  # electricity
total_kgco2 = area * kgco2_m2
total_tco2e = total_kgco2 / 1000.0
```

**Engine `insurance_climate_risk` — extracted transformation lines:**
```python
gross_1in100 = inp.gross_loss_1in100_baseline_eur * multiplier
gross_1in250 = inp.gross_loss_1in250_baseline_eur * multiplier
aal          = inp.average_annual_loss_baseline_eur * multiplier
pml          = inp.probable_max_loss_baseline_eur * multiplier
cat_change_pct = (multiplier - 1.0) * 100.0
net_1in100 = gross_1in100 * ret
net_1in250 = gross_1in250 * ret
ri_limit = inp.reinsurance_limit_eur or (gross_1in250 * (1 - ret) * 1.1)
ri_gap    = max(0.0, gross_1in250 * (1 - ret) - ri_limit)
climate_scr_factor = base_cat_scr_factor * max(0, multiplier - 1.0)
scr_addon = inp.gross_written_premium_eur * climate_scr_factor
total_scr  = inp.scr_eur + scr_addon
sol_ratio_pre  = inp.own_funds_eur / inp.scr_eur if inp.scr_eur > 0 else 0.0
sol_ratio_post = inp.own_funds_eur / total_scr    if total_scr > 0  else 0.0
climate_adj_tp   = inp.technical_provisions_eur * (1 + tp_uplift_frac)
tp_uplift_pct    = tp_uplift_frac * 100.0
reserve_benchmark = max(aal * 1.15, net_1in100 * 0.5)
reserve_deficiency = reserve_benchmark - climate_adj_tp
prot_gap_eur  = max(0.0, econ_loss - insured_loss)
prot_gap_pct  = prot_gap_eur / econ_loss * 100.0 if econ_loss > 0 else 0.0
```

**Engine `pcaf_unified_engine` — extracted transformation lines:**
```python
s3_est = (s1 + s2) * 2.0
rev_m = revenue_eur / 1_000_000.0
total_est = rev_m * intensity
s1 = total_est * 0.6
s2 = total_est * 0.4
s3_est = total_est * 1.5
out_m = outstanding_eur / 1_000_000.0
total_est = out_m * proxy_intensity
s1 = total_est * 0.6
s2 = total_est * 0.4
s3_est = total_est * 1.5
af = min(outstanding / property_value, 1.0) if property_value > 0 else 1.0
annual_tco2e = (floor_area * kgco2_m2) / 1000.0
s1 = annual_tco2e * 0.4  # gas heating
s2 = annual_tco2e * 0.6  # electricity
financed_s1 = round(af * s1, 4)
financed_s2 = round(af * s2, 4)
financed_total = round(financed_s1 + financed_s2, 4)
af = min(outstanding / vehicle_value, 1.0) if vehicle_value > 0 else 1.0
annual_tco2e = (km * gco2_km) / 1_000_000.0
s1 = annual_tco2e * 0.5
s2 = annual_tco2e * 0.5
financed_s1 = round(af * s1, 4)
financed_s2 = round(af * s2, 4)
financed_total = round(financed_s1 + financed_s2, 4)
af = min(outstanding / gdp_f, 1.0) if gdp_f > 0 else 0.0
production_tco2 = production_mtco2 * 1_000_000.0
financed_tco2e = round(af * production_tco2, 4)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **90** other module(s).
**Shared engines (edits propagate!):** `insurance_climate_risk` (used by 5 modules)

| Connected module | Shared via |
|---|---|
| `insurance-transition` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `insurance-portfolio-climate` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `insurance-protection-gap` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `insurance-climate-hub` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `carbon-offtake-structurer` | table:dataclasses, table:sqlalchemy |
| `supply-chain-esg-hub` | table:exc, table:sqlalchemy |
| `supply-chain-resilience` | table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The workbench is a single-counterparty underwriting view that composes **three independently
live backend engines** and derives a fourth "decision summary" panel locally from their outputs.
No numbers are fabricated at any stage — every KPI on the page traces to either a live engine
response or a simple arithmetic combination of two live responses, both shown in the UI with
"● Live" / "○ Demo" badges per section (`ClimateUnderwritingWorkbenchPage.jsx` lines 135-159).

1. **Insurance capital** — `POST /api/v1/insurance/calculate` → `services/insurance_climate_risk.py:calculate_insurance_climate_risk()`. Solvency II Art. 44a-aligned CAT loss climate-adjustment, technical-provision (TP) uplift, SCR climate add-on, reserve adequacy and reinsurance sufficiency.
2. **Physical peril pricing** — `POST /api/v1/physical-risk-pricing/price` and `/return-period-losses` → `services/physical_risk_pricing_engine.py`. NGFS-amplified composite physical risk score, Expected Annual Loss (EAL), 100yr PML, Climate VaR 95%, and risk-premium bps by tier.
3. **Financed emissions** — `POST /api/v1/pcaf-module/calculate/{asset_class}` → `services/pcaf_unified_engine.py`. PCAF v2.0 Part A attribution of the counterparty's Scope 1/2/3 emissions to the financed exposure.
4. **Underwriting decision summary** — computed client-side in `useMemo` (lines 302-339) purely from the three live responses: a risk-adjusted premium, premium adequacy ratio, financed-emissions intensity, and an ACCEPT/REFER/DECLINE heuristic.

### 7.2 Engine 1 — Solvency II climate CAT / SCR / TP (`insurance_climate_risk.py`)

Seven perils (`flood`, `tropical_cyclone`, `wildfire`, `drought`, `winter_storm`, `hail`,
`earthquake`) each carry a **CAT loss multiplier** per climate scenario (`1.5C`/`2C`/`3C`),
sourced to Swiss Re sigma 2023 / EIOPA CCRST 2022 / Lloyd's MRC:

```python
_CAT_LOSS_MULTIPLIER = {
    "flood":      {"1.5C": 1.15, "2C": 1.35, "3C": 1.80},
    "wildfire":   {"1.5C": 1.25, "2C": 1.55, "3C": 2.20},
    "winter_storm": {"1.5C": 0.95, "2C": 0.90, "3C": 0.85},  # decreasing trend
    "earthquake": {"1.5C": 1.00, "2C": 1.00, "3C": 1.00},    # climate-independent
    ...
}
```

Computation chain (`calculate_insurance_climate_risk`, lines 152-238):

```python
gross_1in100 = gross_loss_1in100_baseline_eur * multiplier
net_1in100   = gross_1in100 * reinsurance_retention_pct
ri_gap       = max(0, gross_1in250*(1-retention) - reinsurance_limit)

climate_scr_factor = base_cat_scr_factor(peril) * max(0, multiplier - 1.0)
scr_addon    = gross_written_premium_eur * climate_scr_factor
total_scr    = scr_eur + scr_addon
solvency_ratio_post_addon = own_funds_eur / total_scr

climate_adjusted_tp = technical_provisions_eur * (1 + TP_UPLIFT_PCT[scenario])   # 4%/9%/18% for 1.5C/2C/3C

reserve_benchmark = max(aal * 1.15, net_1in100 * 0.5)
# adequate if climate_adj_tp >= benchmark*1.1, marginal if >= benchmark, else deficient

econ_loss = total_economic_loss_baseline_eur * multiplier   # or gross_1in100*1.6 fallback
protection_gap_pct = max(0, econ_loss - gross_1in100) / econ_loss * 100

esg_score = 60 + 15*coal_exclusion + 10*oil_sands_exclusion + 10*arctic_exclusion + 5*(ff_cap<=50%)
```

The SCR add-on base factors are the Solvency II Delegated Regulation (EU) 2015/35 Annex XIII
natural-catastrophe shock factors (e.g. flood 0.97% of GWP, tropical cyclone 1.50%), scaled by
`max(0, multiplier − 1.0)` so that only the *incremental climate stress* — not the whole
baseline CAT charge — drives the add-on. This is a first-order approximation of a full internal
model recalibration, appropriate for an ORSA-style what-if screen rather than a Pillar 1 SCR
filing.

### 7.3 Engine 2 — NGFS physical peril pricing (`physical_risk_pricing_engine.py`)

30 countries carry hand-authored baseline peril scores (0–1) for flood/cyclone/wildfire/
drought/heatwave/sea-level/earthquake (sourced to INFORM Risk Index 2023, ND-GAIN 2023, Swiss Re
CatNet, IPCC AR6). The composite baseline score is a fixed-weight blend:

```python
weights = {flood:.22, cyclone:.18, wildfire:.14, drought:.12, heatwave:.12, sea_level:.12, earthquake:.10}
composite_baseline_score = Σ profile[k] * weight[k]
```

NGFS scenario × horizon **amplifiers** (`orderly`/`disorderly`/`hot_house` × `2030`/`2040`/`2050`)
scale each peril baseline; the stressed composite score uses the *average* amplifier across the
five acute perils, clamped to [0,1], and maps to a 6-tier scale (`low`→`extreme`) at fixed
thresholds (0.15/0.28/0.42/0.58/0.72).

**Expected Annual Loss** is a genuine trapezoidal integration over the exceedance-probability
(EP) curve, not a single-point estimate:

```python
# EAL = Σ_perils [ Σ_i 0.5*(loss(rp_i) + loss(rp_{i+1})) * |P(rp_i) − P(rp_{i+1})| ] × asset_value
l(rp) = RETURN_PERIOD_LOSS_TABLES[peril][asset_class][rp]/100 * baseline * amplifier * vulnerability_coeff
```
over return periods 10/25/50/100/200/500yr with annual exceedance probabilities
0.100/0.040/0.020/0.010/0.005/0.002. PML(100yr) instead takes the single worst-peril 100yr loss
scaled the same way. Climate VaR 95% is a **heuristic proxy**, not a modeled tail statistic: it
reuses the tier's `climate_var_pct` from `RISK_PREMIUM_TABLE` and floors at `3× EAL`
(`physical_risk_pricing_engine.py` lines 800-802) — the docstring's "95th percentile" language
describes the *table's* calibration intent, not a Monte Carlo or copula tail computed in code.

### 7.4 Engine 3 — PCAF v2.0 Part A financed emissions (`pcaf_unified_engine.py`)

For `business_loans` (and `corporate_bonds`/`listed_equity`/`project_finance`), the engine calls
`_calculate_standard_asset_class`, which picks the attribution denominator by asset class —
`business_loans` uses `total_equity_eur + total_debt_eur` (balance-sheet attribution, PCAF Table
5.2) rather than EVIC (used for listed equity/corporate bonds):

```python
af = min(outstanding_eur / (total_equity_eur + total_debt_eur), 1.0)
financed_scopeN = af * investee_scopeN
```

Emissions are resolved through a four-level PCAF fallback hierarchy
(`_emission_factor_fallback`, lines 428-474): verified reported data (DQS 1) → unverified
reported (DQS 2) → sector-intensity × revenue (DQS 4) → sector-proxy × outstanding (DQS 5).
Scope 3 is always *estimated* as 2× (Scope 1 + Scope 2) when not reported. Sector intensities
(`SECTOR_EMISSION_INTENSITIES` in `facilitated_emissions_engine.py`) are hand-authored per GICS
sector, e.g. Energy 820, Utilities 950, Industrials 180, Financials 12 tCO2e/€M revenue.

### 7.5 Worked example — traced against the live engines

Using the page's own `DEFAULT_INPUTS` (Mekong Delta Logistics Hub Co., Vietnam, flood peril, 2C
scenario/2050 for insurance; infrastructure asset class, disorderly/2050 for physical pricing;
business_loans/Industrials for PCAF), I ran the three real service functions directly
(`insurance_climate_risk.calculate_insurance_climate_risk`, `physical_risk_pricing_engine.price_physical_risk`,
`PCAFUnifiedEngine.calculate_business_loans`) to confirm the arithmetic:

**Engine 1 (Solvency II), flood @ 2C (multiplier 1.35):**

| Step | Computation | Result |
|---|---|---|
| Gross 1-in-100 | €60M × 1.35 | €81.0M |
| Gross 1-in-250 | €95M × 1.35 | €128.25M |
| Net 1-in-100 (30% retention) | €81.0M × 0.30 | €24.3M |
| Reinsurance gap | max(0, €128.25M×0.70 − €70M limit) | **€19.775M — inadequate** |
| SCR climate add-on | €85M GWP × (0.0097 × 0.35) | €288,575 |
| Total SCR | €120M + €288,575 | €120.289M |
| Solvency ratio post-addon | €210M ÷ €120.289M | **174.58%** (pre-addon 175%) |
| Climate-adj. TP | €240M × 1.09 | €261.6M |
| Reserve benchmark | max(€12.15M×1.15, €24.3M×0.5) | €13.9725M → **adequate** (TP well above) |
| Economic loss | €150M × 1.35 | €202.5M |
| Protection gap | (€202.5M − €81M)/€202.5M | **60.0%** |
| ESG underwriting score | 60 + 15(coal) + 10(oil sands) + 10(arctic) | **95.0** |

**Engine 2 (physical pricing), infrastructure/VNM/disorderly/2050:**

Vietnam's baseline composite = 0.22×0.80(flood) + 0.18×0.75(cyclone) + 0.14×0.20(wildfire) +
0.12×0.38(drought) + 0.12×0.60(heatwave) + 0.12×0.72(sea-level) + 0.10×0.25(earthquake) =
**0.568**. Average acute-peril amplifier for disorderly/2050 = (1.45+1.35+1.55+1.00+1.70)/5 =
**1.41**. Stressed composite = 0.568×1.41 = **0.8009 → tier "extreme"** (≥0.72), so `risk_premium_bps
= 300`, `climate_var_pct = 25.0`.

Flood's contribution to EAL alone (baseline 0.80 × amplifier 1.45 × vulnerability 0.55 for
infrastructure = k=0.638 applied against the flood/infrastructure RP-loss table via trapezoidal
integration) is the dominant term; **total EAL across all 5 perils = $1,784,674.38** on a $250M
asset (confirmed by direct call to `price_physical_risk`). PML(100yr) = flood's 100yr loss
(15%×0.638) × $250M = **$23,925,000**. Climate VaR 95% floors at 3×EAL = $5.35M but the tier
formula (25% × pml_100yr/pml_100yr × asset_value... simplifies to 25% of asset value) actually
returns **$62,500,000** (25.0% × $250M), confirming the code's VaR is a tier-driven % of asset
value, not derived from the peril-specific PML at all.

**Engine 3 (PCAF), business_loans/Industrials, no reported emissions:**

AF = €45M outstanding ÷ (€180M equity + €120M debt) = 45/300 = **0.15**. No Scope 1/2 reported →
falls to the sector-intensity level: Industrials intensity = 180 tCO2e/€M revenue × €210M
revenue = 37,800 tCO2e total (investee), split 60/40 Scope1/Scope2 → investee S1 = 22,680,
S2 = 15,120, S3 = 37,800×1.5 = 56,700. Financed = AF × each = **S1 3,402 / S2 2,268 / S3 8,505 /
total 14,175 tCO2e**, **PCAF DQS 4** ("Sector intensity × revenue").

**Combined decision summary** (`summary` useMemo, lines 302-339), with defaults cost-of-capital
6%, expense loading 15%, EUR/USD 1.08:

| Step | Computation | Result |
|---|---|---|
| SCR add-on in USD | €288,575 × 1.08 | $311,661 |
| Cost of climate capital | $311,661 × 6% | $18,700 |
| Pure risk premium | $1,784,674 EAL + $18,700 | $1,803,374 |
| Suggested premium (grossed 15%) | $1,803,374 / 0.85 | $2,121,617 |
| GWP in USD | €85M × 1.08 | $91,800,000 |
| Premium adequacy | $91.8M ÷ $2.12M | **4,327%** (portfolio-level GWP vs single-asset premium) |
| Financed intensity | 14,175 tCO2e ÷ €45M | **315 tCO2e/€M** (below 500 referral threshold) |

Flags raised: physical risk tier "extreme" and reinsurance programme inadequate (2 flags).
Solvency ratio stays ≥100% and premium adequacy is far above the 60% decline threshold, so the
heuristic (lines 330-333) resolves to **REFER**, not DECLINE — correctly reflecting that this is
a referral-worthy but not unequivocally unacceptable submission.

### 7.6 Data provenance & limitations

- All three backend engines are genuine, deterministic calculators over hand-authored reference
  tables (peril multipliers, country risk profiles, sector intensities) cited to named external
  sources (Solvency II Delegated Reg., NGFS CGFI, Swiss Re sigma, PCAF Standard). None of the
  three uses random-number fabrication.
- The submission form (`DEFAULT_INPUTS`) is explicitly labelled "hand-authored illustrative
  submission — NOT live data"; every field is user-editable before running the engines.
- Climate VaR 95% is a tier-table percentage of asset value floored at 3×EAL, not a modeled
  quantile — this is a genuine methodological simplification, not a bug, but users should not
  read it as a backtested 95th-percentile loss.
- The decision heuristic (ACCEPT/REFER/DECLINE) and the FX/cost-of-capital/expense-loading
  assumptions are explicitly local, presentation-layer logic layered on top of the three live
  engines — the page states this plainly ("Derived locally from live engine outputs — no
  fabricated data").
- Insurance route persistence: a 2026-07-03 remediation note in `insurance.py` documents that the
  route previously used non-existent dataclass fields and DB columns and was **never callable**
  before the rewrite — worth flagging as a very recent fix, not a hypothetical risk.

**Framework alignment:** Solvency II Art. 44a / EIOPA ORSA Climate Guide 2022 / EIOPA CCRST 2022
(insurance capital) · NGFS CGFI Physical Risk Assessment 2021/2023, Swiss Re sigma 1/2024, IPCC
AR6 WGI Ch.11 (physical pricing) · PCAF Global GHG Accounting and Reporting Standard v2.0,
Tables 5.1–5.3 (financed emissions).

## 8 · Model Specification

**Status: implemented.** All three composed engines are live, callable FastAPI routes backed by
deterministic Python service modules (no stubs, no TODO placeholders); the decision-summary layer
is genuinely computed client-side from their responses.

**8.1 Purpose & scope.** Give an underwriter or portfolio manager a single-counterparty view that
answers three linked questions in one pass: (i) does climate change materially move this
counterparty's Solvency II CAT capital and reserve position; (ii) how large is the physical peril
loss exposure under a chosen NGFS scenario; (iii) what is the counterparty's financed-emissions
footprint. It composes existing engines rather than introducing new physics.

**8.2 Conceptual approach.** Three independent, previously-existing calculators
(`insurance_climate_risk.py`, `physical_risk_pricing_engine.py`, `pcaf_unified_engine.py`) are
called in parallel from one React page. A fourth, purely local, layer combines the *live outputs*
(EAL, SCR add-on, financed emissions) into a risk-adjusted premium and a rule-based accept/
refer/decline recommendation — deliberately kept simple and transparent (linear formulas, fixed
thresholds) rather than a fitted underwriting model.

**8.3 Mathematical specification.**
```
Risk-adjusted premium:
  pure_premium   = EAL + (SCR_climate_addon × cost_of_capital)
  suggested_prem = pure_premium / (1 − expense_loading)
  adequacy       = GWP / suggested_prem

Decision rule (heuristic, editable thresholds):
  DECLINE  if solvency_ratio_post < 100%  OR
           (adequacy < 60% AND physical_tier ∈ {very_high, extreme})
  REFER    if any flag raised (solvency, adequacy, tier, reserve, reinsurance, carbon intensity)
  ACCEPT   otherwise
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| CAT loss multiplier | peril × scenario table | Swiss Re sigma 2023 / EIOPA CCRST 2022 |
| Solvency II CAT SCR factor | per-peril % of GWP | Solvency II Delegated Reg. (EU) 2015/35 Annex XIII |
| TP uplift | 4%/9%/18% by scenario | EIOPA Supervisory Statement on Climate Risk 2024 |
| NGFS peril amplifier | scenario × horizon × peril | NGFS CGFI Phase IV 2023 |
| Vulnerability coefficient | peril × asset class | RMS/AIR/Verisk-style industry benchmark |
| PCAF attribution denominator | equity+debt (loans) / EVIC (bonds/equity) | PCAF Standard Tables 5.1–5.2 |
| Sector emission intensity | tCO2e/€M revenue | Hand-authored per GICS sector |

**8.4 Data requirements.** Per-counterparty: baseline CAT loss estimates (1-in-100/250, AAL, PML),
technical provisions, SCR, own funds, reinsurance structure; asset value and country/asset-class
for physical pricing; balance-sheet figures (equity, debt, EVIC or project cost) and optionally
reported Scope 1/2 emissions for PCAF. All are currently entered by the underwriter in the
submission form — none are pulled from a policy administration system or loss-run database.

**8.5 Validation & benchmarking.** Each underlying engine already ships its own reference-data
endpoints (`/insurance/reference-data`, `/physical-risk-pricing/ref/*`) that can be used to
sanity-check multipliers against source publications. No backtesting harness exists for the
*combined* decision layer — the accept/refer/decline thresholds are illustrative starting points,
not calibrated against historical underwriting outcomes.

**8.6 Limitations & model risk.** (1) Climate VaR is a tier-table proxy, not a fitted tail
distribution. (2) The decision heuristic uses fixed, uncalibrated thresholds (100% solvency, 60%
adequacy) that should be recalibrated per line of business before any production use. (3) PCAF
Scope 3 is always a 2×(S1+S2) estimate when unreported — a materially different sector could
distort the total. (4) SCR add-on scaling by "multiplier − 1" is a simplification of a full
internal-model recalibration and should not substitute for an actuarial CAT model in a real
Solvency II filing.

## 9 · Future Evolution

### 9.1 Evolution A — Book-level underwriting with calibrated decision thresholds (analytics ladder: rung 2 → 3)

**What.** The workbench is one of the platform's cleanest compositions — three live
engines (`insurance_climate_risk`, `physical_risk_pricing_engine` via the pricing
routes, `pcaf_unified_engine`) with per-section Live/Demo badges and a §8 status of
"implemented" — but it underwrites **one counterparty at a time**, and the
ACCEPT/REFER/DECLINE verdict is a client-side `useMemo` heuristic. Evolution A scales
to the book: batch the three engine calls across a submission portfolio, aggregate CAT
accumulation by peril/geography, and calibrate the decision thresholds against loss
experience instead of hand-set cutoffs.

**How.** (1) New `POST /api/v1/insurance/underwrite-book` orchestrating the existing
`insurance/calculate`, `physical-risk-pricing/price`, and `pcaf-module/calculate/*`
per position, persisting to the existing `insurance_climate_assessments` /
`insurance_climate_entities` tables so runs are retrievable. (2) Accumulation control:
sum net 1-in-100 by peril-region cell and flag against reinsurance limits — the engine
already computes `ri_gap` per risk; the book view is a reduction over it.
(3) Calibration: benchmark the CAT multipliers (Swiss Re sigma / EIOPA CCRST sourced)
against the platform's ingested OpenFEMA/IBTrACS loss history where perils overlap, and
move the premium-adequacy threshold from heuristic to a documented percentile of the
calibration set; pin the §7.5 Mekong Delta worked example (174.58% solvency post-addon,
60.0% protection gap) in `bench_quant.py`.

**Prerequisites.** Blast radius 90 — `insurance_climate_risk` is shared by 5 modules,
so multiplier recalibration needs the shared-engine change protocol; server-side
persistence of the decision summary moves the ACCEPT/REFER logic out of `useMemo`.
**Acceptance:** book run of N positions equals N single runs (no aggregation drift);
worked example reproduces; threshold provenance documented in the response.

### 9.2 Evolution B — Underwriting desk orchestrator across the three engines (LLM tier 3)

**What.** The workbench already *is* a manual desk orchestration — an underwriter
composing Solvency II capital, physical pricing, and PCAF financed emissions. Evolution
B automates the composition: "work up Mekong Delta Logistics, flood, 2C/2050" triggers
the full chain — `POST /insurance/calculate`, `/physical-risk-pricing/price`,
`/pcaf-module/calculate/business_loans`, plus `GET /open-meteo/historical-extremes`
for location context — and drafts the underwriting file: exposure summary, capital
impact, premium adequacy, emissions footprint, and the referral rationale, every figure
tool-traced.

**How.** This is the platform's lowest-risk tier-3 pilot because the routing is fixed
(the page's own compose order, documented in §7.1) rather than open-ended; tool schemas
come from the 24 mapped OpenAPI operations. The decision heuristic stays code, not
LLM — the orchestrator narrates and evidences the verdict, never overrides it. Referral
memos render through the report-studio layer; the per-section Live/Demo badge state
passes into the prompt so the draft discloses any demo-sourced numbers.

**Prerequisites.** Evolution A's persistence (memos must reference a stored
`assessment_id`); RBAC pass-through so the orchestrator inherits the underwriter's
session per the roadmap's Tier-2 contract. **Acceptance:** a generated file for the
DEFAULT_INPUTS case matches the §7.5 traced values exactly; the orchestrator refuses to
issue an ACCEPT/DECLINE that differs from the computed heuristic and instead flags the
disagreement for human review.