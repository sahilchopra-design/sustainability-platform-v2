# Climate-Adjusted Financial Statements
**Module ID:** `climate-financial-statements` · **Route:** `/climate-financial-statements` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted income statement, balance sheet, and cash flow statement engine. Applies NGFS scenario overlays to financial projections, quantifies stranded asset impairments, carbon cost line items, and physical damage provisions under IFRS and ISSB S2 disclosure requirements.

> **Business value:** Climate P&L impact = carbon cost + physical damage provision. Balance sheet adjusted via IAS 36 impairment for stranded assets. ISSB S2 requires quantitative disclosure of material climate financial impacts across all 4 TCFD pillars.

**How an analyst works this module:**
- Select NGFS scenario and projection horizon
- Income Statement tab shows carbon cost and physical damage overlays
- Balance Sheet tab applies stranded asset impairments
- Cash Flow tab shows capex shifts for decarbonisation
- ISSB S2 Disclosure tab formats financial impact narrative

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `Inp`, `KpiCard`, `PIE_COLORS`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `ifrsS2Score` | `Math.round(seed(15) * 20 + 64);` |
| `climateRiskScore` | `Math.round(seed(16) * 15 + 58);` |
| `disclosureCompleteness` | `Math.round(seed(17) * 20 + 68);` |
| `totalImpairment` | `impairmentTriggers.filter(t => t.activated).reduce((s, t) => s + t.impactM, 0);` |
| `carbonProvision` | `Math.round(seed(30) * 20 + 32);` |
| `etsAllocationDeficit` | `Math.round(seed(31) * 15 + 18);` |
| `totalStrandedExposure` | `strandedAssetTypes.reduce((s, a) => s + a.exposureM, 0);` |
| `earliestWritedown` | `Math.min(...strandedAssetTypes.map(a => a.writedownYr));` |
| `largestWritedown` | `[...strandedAssetTypes].sort((a, b) => b.exposureM - a.exposureM)[0];` |
| `plData` | `years.map((yr, i) => ({` |
| `latestPl` | `plData[plData.length - 1];` |
| `ebitdaImpact` | `((latestPl.reportedEbitda - latestPl.climateEbitda) / latestPl.reportedEbitda * 100).toFixed(1);` |
| `scenarioData` | `scenarioCategories.map((cat, i) => ({` |
| `writedown` | `Math.round(a.exposureM * 0.7);` |
| `yrsToTrigger` | `a.writedownYr - 2025;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-financial-statements/assess` | `full_assessment` | api/v1/routes/climate_financial_statements.py |
| POST | `/api/v1/climate-financial-statements/ifrs-s2-effects` | `ifrs_s2_financial_effects` | api/v1/routes/climate_financial_statements.py |
| POST | `/api/v1/climate-financial-statements/ias36-impairment` | `ias36_climate_impairment` | api/v1/routes/climate_financial_statements.py |
| POST | `/api/v1/climate-financial-statements/carbon-provisions` | `carbon_provisions` | api/v1/routes/climate_financial_statements.py |
| POST | `/api/v1/climate-financial-statements/stranded-assets` | `stranded_asset_assessment` | api/v1/routes/climate_financial_statements.py |
| POST | `/api/v1/climate-financial-statements/climate-financials` | `climate_adjusted_financials` | api/v1/routes/climate_financial_statements.py |
| GET | `/api/v1/climate-financial-statements/ref/financial-effect-categories` | `ref_financial_effect_categories` | api/v1/routes/climate_financial_statements.py |
| GET | `/api/v1/climate-financial-statements/ref/impairment-indicators` | `ref_impairment_indicators` | api/v1/routes/climate_financial_statements.py |
| GET | `/api/v1/climate-financial-statements/ref/scenario-multipliers` | `ref_scenario_multipliers` | api/v1/routes/climate_financial_statements.py |
| GET | `/api/v1/climate-financial-statements/ref/carbon-provision-thresholds` | `ref_carbon_provision_thresholds` | api/v1/routes/climate_financial_statements.py |
| GET | `/api/v1/climate-financial-statements/ref/stranded-asset-triggers` | `ref_stranded_asset_triggers` | api/v1/routes/climate_financial_statements.py |

### 2.3 Engine `climate_financial_statements_engine` (services/climate_financial_statements_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_safe_float` | val, default |  |
| `_clamp` | val, lo, hi |  |
| `ClimateFinancialStatementsEngine.assess_ifrs_s2_financial_effects` | entity_data, category_impact_overrides | Identify and quantify the 8 IFRS S2 financial effect categories. Returns disclosure completeness score (0-100) and gap identification. Magnitude estimates are deterministic: base_magnitude = driver input (revenue / EBITDA / total_assets / emissions) × documented sector-relevance model factor. Where a caller has a genuine entity estimate for a category it may be supplied via ``category_impact_overr |
| `ClimateFinancialStatementsEngine.assess_ias36_climate_impairment` | entity_data, indicator_overrides | Evaluate all 12 IAS 36 climate impairment indicators. Returns triggered indicators, estimated impairment amount and impairment-tested assets. Triggering is deterministic: an indicator is flagged as triggered when its climate-adjusted probability reaches the IAS 36 / IAS 37 "probable" threshold (>= 0.50). Estimated impairment per triggered indicator is the documented write-down range MIDPOINT (mode |
| `ClimateFinancialStatementsEngine.calculate_carbon_provisions` | entity_data, carbon_price_cagr_pct | Calculate IAS 37 carbon provision for ETS allowance deficit. Returns provision amount, basis, probability and ETS compliance cost. The 3-year forward provision uses a deterministic carbon-price CAGR. Supply a real forward assumption via ``carbon_price_cagr_pct`` (or ``entity_data['carbon_price_cagr_pct']``); when absent a documented model midpoint of 13%/yr (EU ETS Phase IV analyst-consensus band  |
| `ClimateFinancialStatementsEngine.assess_stranded_assets` | entity_data, trigger_overrides | Identify triggered stranded asset write-down scenarios. Returns write-down estimate, timeline and affected assets. Triggering is deterministic: a scenario fires when its scenario-scaled write-down probability reaches the "probable" threshold (>= 0.50). The write-down percentage applied is the MIDPOINT of each trigger's documented ``write_down_range_pct_of_carrying_value`` band (published range mid |
| `ClimateFinancialStatementsEngine.compute_climate_adjusted_financials` | entity_data | Compute climate-adjusted revenue, EBITDA and PAT across three temperature scenarios (1.5°C / 2°C / 3°C). |
| `ClimateFinancialStatementsEngine.run_full_assessment` | entity_data | Orchestrate all sub-assessments and produce consolidated E86 scores. Returns: ifrs_s2_score (0-100), climate_financial_risk_score (0-100), materiality_tier, disclosure_completeness_pct, potential_impairment_m, carbon_provision_required_m, stranded_asset_exposure_m, climate_adjusted_ebitda_m, scenario_1_5c_impact_m — plus full detail blocks. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `request`, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Cost (P&L) | `Scope 1 × Carbon Price(t,scenario)` | NGFS carbon price trajectory | Annual P&L impact of internal or regulatory carbon pricing on operations |
| Physical Damage Provision | `Asset value × annual loss probability` | CAT model | Provision for climate-related physical asset damage in financial period |
| Stranded Asset Impairment | `IAS 36 recoverable amount shortfall` | Climate DCF model | Write-down of assets where climate-adjusted NPV < carrying value |
| IFRS 9 ECL Uplift | `ECL base + climate overlay` | IFRS 9 model | Expected credit loss increase from climate transition risk on loan book |
- **Financial model** → Base 3-statement → climate overlay → adjusted statements → **Climate-adjusted financials**
- **NGFS carbon price database** → Scenario-specific price trajectory → carbon cost line → **P&L carbon cost by scenario**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-financial-statements/ref/carbon-provision-thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'standard', 'sector_count', 'data'], 'n_keys': 4}`

**GET /api/v1/climate-financial-statements/ref/financial-effect-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'standard', 'category_count', 'data'], 'n_keys': 4}`

**GET /api/v1/climate-financial-statements/ref/impairment-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'standard', 'total_indicators', 'external_count', 'internal_count', 'external_indicators', 'internal_indicators'], 'n_keys': 7}`

**GET /api/v1/climate-financial-statements/ref/scenario-multipliers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'methodology', 'sector_count', 'data'], 'n_keys': 4}`

**GET /api/v1/climate-financial-statements/ref/stranded-asset-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'methodology', 'trigger_count', 'data'], 'n_keys': 4}`

**POST /api/v1/climate-financial-statements/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-financial-statements/carbon-provisions** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-financial-statements/climate-financials** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate overlay on 3-statement financial model
**Headline formula:** `EBIT_adj = EBIT_base – CarbonCost(t) – PhysicalDamage(t); AssetValue_adj = AssetValue × (1–ImpairmentPct)`

Carbon cost line = Scope 1 emissions × internal carbon price (NGFS scenario-specific trajectory). Physical damage provision = asset replacement cost × annual loss probability from hazard model. Stranded asset impairment per IAS 36: recoverable amount test using climate-adjusted DCF. IFRS 9 ECL adjustment for climate transition risk in loan books. ISSB S2 requires quantitative financial impact disclosure for material climate risks.

**Standards:** ['ISSB IFRS S2 Climate Disclosures', 'IAS 36 Impairment Testing', 'IFRS 9 Expected Credit Loss', 'TCFD Financial Impact Guidance']
**Reference documents:** ISSB IFRS S2 Climate-Related Disclosures 2023; IAS 36 Impairment of Assets; IFRS 9 Financial Instruments (ECL); TCFD Guidance on Financial Impact Disclosure 2021

**Engine `climate_financial_statements_engine` — extracted transformation lines:**
```python
provision_deficit_pct = max(0.0, (_emiss_kt - _free_kt)) / _emiss_kt
income_m = abs(ebitda_m * 0.12 * base_relevance)  # model coefficient
bs_m = income_m * 0.6  # CapEx component capitalised
_phys_base = abs(total_assets_m * 0.03 * base_relevance)  # model coefficient
income_m = _phys_base * 0.4
income_m = abs(revenue_m * 0.05 * base_relevance)  # model coefficient
annual_emissions_kt = carbon_intensity * revenue_m / 1_000
income_m = annual_emissions_kt * 1_000 * provision_deficit_pct * price_mid / 1_000_000
income_m = abs(total_assets_m * 0.08 * base_relevance)  # model coefficient
bs_m = abs(total_assets_m * 0.04 * base_relevance)  # model coefficient
_lit_base = abs(revenue_m * 0.015 * base_relevance)  # model coefficient
income_m = _lit_base * 0.5
bs_m = _lit_base * 0.3
adjusted_prob = base_prob * 0.30
adjusted_prob = min(0.95, adjusted_prob * 1.30)
adjusted_prob = min(0.92, adjusted_prob * 1.20)
impairment_m = ppe_m * 0.235          # midpoint of 0.12–0.35
impairment_m = ppe_m * 0.40 * 0.15     # midpoint of 0.08–0.22
impairment_m = (goodwill_m + intangibles_m) * 0.20  # midpoint of 0.10–0.30
impairment_m = ppe_m * 0.115           # midpoint of 0.05–0.18
deficit_kt = max(0.0, annual_verified_emissions_kt - free_allocation_kt)
deficit_pct = deficit_kt / max(annual_verified_emissions_kt, 1.0) * 100
provision_probability = min(0.97, provision_probability * 1.15)
ets_purchase_cost_m = deficit_kt * 1_000 * eua_spot_price / 1_000_000
carbon_tax_cost_m = annual_verified_emissions_kt * 1_000 * carbon_tax_rate / 1_000_000
corsia_offset_kt = annual_verified_emissions_kt * 0.10  # Phase I indicative rate
corsia_cost_m = corsia_offset_kt * 1_000 * voluntary_offset_price / 1_000_000
forward_carbon_price = eua_spot_price * (1.0 + carbon_price_cagr) ** 3
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a full climate-adjusted
> 3-statement engine: carbon cost = Scope 1 × NGFS carbon price, a physical damage provision
> (asset value × annual loss probability from a CAT model), IAS 36 impairment via climate DCF,
> an **IFRS 9 ECL uplift for loan books**, and a **Cash Flow tab** for decarbonisation capex.
> The code is narrower on two counts. (1) The backend engine
> (`backend/services/climate_financial_statements_engine.py`, E86) is real and deterministic —
> IFRS S2 §29 effect quantification, IAS 36 indicator testing, IAS 37 carbon provisions,
> stranded-asset write-downs, scenario-adjusted P&L — but implements **no IFRS 9 ECL overlay
> and no hazard-model damage provision**, and produces no cash-flow statement. (2) The React
> page fires `POST /assess` but **discards the response** (it even posts `entity_name` where
> the route model requires `entity_id`, so the call can 422 silently); every number rendered in
> its 5 tabs is synthetic `seed()` demo data, unconnected to the engine.

### 7.1 What the engine computes

`run_full_assessment` orchestrates five deterministic sub-assessments (post-E86 remediation the
engine uses **no pseudo-random draws** — every figure is caller input × documented model constant,
with `*_overrides` hooks for genuine entity values):

```
1. IFRS S2 effects    income_m per §29 category = driver (revenue / EBITDA / assets)
                      × model coefficient × relevance (0.80 sector-typical, else 0.35)
2. IAS 36 test        indicator fires when adjusted_prob ≥ 0.50 ("probable" threshold)
                      impairment = carrying amount × write-down band MIDPOINT
3. IAS 37 provision   deficit_kt = max(0, verified_kt − free_allocation_kt)
                      ETS cost €M = deficit_kt × 1000 × EUA_spot / 1e6
                      forward_3yr price = EUA_spot × (1 + CAGR)^3   (CAGR default 13%/yr)
4. Stranded assets    trigger fires when base_prob × scenario_severity ≥ 0.50
                      write-down = asset_base × midpoint(published write-down % band)
5. Adjusted P&L       X_scenario = X_base × (1 + impact_pct/100 × lever)
                      lever: revenue 1.0 · EBITDA 1.30 · PAT 1.80
                      EBITDA_base = EBITDA − carbon_provision − 0.15 × climate_capex
```

Composite scores:

```
ifrs_s2_score          = disclosure_completeness% × 0.60 + (1 − gaps/8) × 40
climate_risk (0–100)   = clamp(impairment/TA × 400, 0, 40)
                       + clamp(stranded/TA × 300, 0, 30)
                       + clamp((100 − completeness%) × 0.30, 0, 30)
materiality tier       ≥65 tier_1_material · ≥35 tier_2_potentially_material · else tier_3
```

### 7.2 Parameterisation

**Sector scenario multipliers** (`SCENARIO_FINANCIAL_MULTIPLIERS`; engine header cites NGFS
Phase IV 2023 and IPCC AR6 WG III as calibration references — the exact percentages are model
constants, not published values):

| Sector | 1.5 °C | 2 °C | 3 °C | Shape |
|---|---|---|---|---|
| oil_gas | −42.0% | −28.0% | −12.0% | Transition-dominated (monotonic) |
| utilities_fossil | −38.0% | −24.0% | −8.0% | Transition-dominated |
| industrials | −18.0% | −11.0% | −4.5% | CBAM/ETS cost drag |
| real_estate | −14.0% | −9.0% | −16.0% | **Non-monotonic** — physical risk dominates at 3 °C |
| financials | −8.0% | −5.5% | −11.0% | Non-monotonic — NatCat + sovereign contagion at 3 °C |
| agriculture | −6.0% | −13.0% | −28.0% | Physical-dominated (IPCC AR6 yield-loss logic) |

**IAS 36 indicators** — 12 indicators (EXT-01…06 external, INT-01…06 internal) each carry a
documented `impairment_probability` (0.34–0.86). Adjustments: off-sector/no-asset-overlap damping
×0.30; `EUA > €80/t AND deficit > 20%` boost ×1.30 (cap 0.95); oil_gas `stranded_fossil_reserve`
boost ×1.20 (cap 0.92). Write-down midpoints applied to real carrying amounts:

| Indicator keyword | Base | Midpoint | Documented band |
|---|---|---|---|
| reserve / fossil / stranded | PP&E | 23.5% | 12–35% |
| building / real_estate / green_premium | PP&E × 0.40 | 15% | 8–22% |
| goodwill / demand / revenue | goodwill + intangibles | 20% | 10–30% |
| all other | PP&E | 11.5% | 5–18% |

**IAS 37 sector provision profiles** (`CARBON_PROVISION_THRESHOLDS`): provision probability
0.28 (financial_services) → 0.88 (utilities_fossil); mid €/t price by sector — utilities 95,
oil_gas 90, industrials 90, shipping 85, aviation 55, real_estate 55, agriculture 30, financials
20. Deficit modifiers: deficit < 5% → prob × 0.40 (contingent only); > 20% → ×1.15 (cap 0.97).
Defaults: EUA €88/t, 250 kt verified, 200 kt free allocation, 13%/yr forward CAGR ("EU ETS
Phase IV analyst-consensus band 8–18%" midpoint per inline comment).

**Stranded-asset scenario severity**: net_zero_2050 ×1.40 · below_2c ×1.00 · delayed_transition
×0.70 · current_policies ×0.40; six triggers (IEA NZE unburnable reserves, coal closure, ICE ban,
EPC brown buildings, gas infrastructure, petrochemical) with write-down probabilities 0.48–0.86
and published %-of-carrying-value bands (e.g. coal 25–90%, EPC 8–40%).

### 7.3 Calculation walkthrough

`run_full_assessment` runs sub-assessments 1–4 on the raw entity payload, then **feeds the IAS 37
provision into the adjusted-P&L step** (`entity_data_adj["carbon_provision_m"] = total_provision_m`)
so the EBITDA base already carries the carbon cost before scenario levers apply. Top-level KPIs
are lifted from each block; the climate financial-risk score converts impairment and stranding
into % of total assets (× 400 and × 300 gearing, capped at 40/30 points) and adds a disclosure-gap
penalty (30-point cap). Note the two sub-modules assume different PP&E defaults when `ppe_m` is
absent: IAS 36 uses `0.45 × total_assets`, stranded assets `0.55 × total_assets`.

### 7.4 Worked example (route defaults, sector = oil_gas, scenario = below_2c)

Inputs: revenue €1,000M · EBITDA €200M · PAT €90M · assets €2,000M · 250 kt verified / 200 kt
free · EUA €88/t · no disclosed categories.

| Step | Computation | Result |
|---|---|---|
| ETS deficit | 250 − 200 kt; 50/250 | 50 kt (20%) |
| Provision (prob 0.74 ≥ 0.5 → recognised) | 50,000 t × €88 / 10⁶ | **€4.40M** |
| Forward 3-yr price / provision | 88 × 1.13³ = €126.97; 50,000 × 126.97/10⁶ | €6.35M |
| EBITDA base | 200 − 4.40 | €195.6M |
| EBITDA 2 °C (lever 1.30) | 195.6 × (1 − 0.28 × 1.30) | **€124.40M** (−37.8% vs 200) |
| EBITDA 1.5 °C | 195.6 × (1 − 0.42 × 1.30) | €88.80M → impact **−€111.2M** |
| Revenue / PAT 2 °C | 1000 × 0.72 · 90 × (1 − 0.28 × 1.8) | €720M · €44.64M |
| IAS 36 (7 of 12 fire; PP&E 900, GW+int 360) | 5 × 900×0.115 + 900×0.235 + 360×0.20 | **€801M** → "critical" |
| Stranded (2 of 6 fire; PP&E 1,100) | 1100×0.30×0.40 + 1100×0.25×0.375 | ≈ €235.1M → "material" |
| Risk score | min(801/2000×400,40) + min(235/2000×300,30) + 30 | **100 → tier_1_material** |

(IAS 36 firing set at these defaults: EXT-01 0.72, EXT-02 0.85, EXT-03 0.58, EXT-04 0.68×1.2=0.816,
EXT-06 0.52, INT-01 0.61, INT-03 0.56; EXT-05/INT-02/INT-04/INT-05/INT-06 stay below 0.50.)

### 7.5 What the frontend actually renders

The page's only client-side arithmetic operates on seeded constants: `totalImpairment` = Σ impact
of activated triggers (3 always-on + 3 gated on `seed(k) > 0.35–0.5`); stranded write-down =
`exposure × 0.7` (hard-coded 70% haircut) with cumulative timeline 2025–2040; `ebitdaImpact %` =
`(reported − climate)/reported` on seeded P&L series; materiality tier from seeded
`ifrsS2Score ∈ [64, 84]` (≥75 Material, ≥60 Potentially Material); scenario KPIs are sums of
seeded per-category impacts for 1.5/2/3 °C. None of this reads the engine's carefully guarded
deterministic outputs.

### 7.6 Data provenance & limitations

- **Frontend: 100% synthetic.** Every displayed figure derives from the platform PRNG
  `seed(s) = frac(sin(s+1)×10⁴)` — stable across renders, but not entity data, and disconnected
  from the backend engine that this module nominally fronts.
- **Backend: deterministic model proxies.** Real inputs (emissions, allocations, carrying values)
  drive real formulas, but magnitude coefficients (0.12 × EBITDA, 0.08 × assets, band midpoints,
  13% carbon CAGR) are documented calibration constants, not entity estimates; overrides exist.
- No lifetime/multi-period projection: single-period point estimates only; no discounting in the
  IAS 36 proxy (a genuine test requires a VIU DCF); no IFRS 9 ECL despite the guide; the
  IAS 36 vs stranded PP&E default inconsistency (45% vs 55% of TA) double-counts risk in the
  composite when both fire on the same assets.

### 7.7 Framework alignment

- **IFRS S2 (ISSB, June 2023) §29(a)–(h)** — the 8 effect categories mirror §29's required
  current/anticipated financial-effect disclosures; the module's "IFRS S2 score" is 60% disclosure
  completeness (categories disclosed ÷ 8) + 40% inverse gap ratio — a coverage metric, not ISSB's
  (qualitative) compliance judgement.
- **IAS 36 §12–14** — indicator-based impairment triggering follows §12's external/internal
  indicator structure; the standard itself requires a recoverable-amount test (higher of VIU and
  FVLCD), which the engine approximates with band midpoints.
- **IAS 37 §14** — provision recognised when present obligation + probable (>50%) outflow +
  reliable estimate; the engine encodes exactly that threshold on the sector probability.
- **EU ETS Directive 2003/87/EC** — deficit × EUA spot mechanics, Phase IV free-allocation logic;
  sector benchmarks quoted in reference data (steel 1.45 tCO₂/t, clinker 0.766 tCO₂/t).
- **NGFS Phase IV / IEA NZE2050 / IPCC AR6 WG III** — named as calibration anchors for scenario
  multipliers, stranding trigger dates and severity ordering.

### 8 · Model Specification — climate-conditioned 3-statement projection

**Status: specification — not yet implemented in code.** Triggered because the page displays
climate-adjusted revenue/EBITDA/PAT, impairments and scenario impacts that are seeded synthetics,
and the guide promises IFRS 9 ECL and physical damage provisions that no code computes.

**8.1 Purpose & scope.** Support CFO/audit-committee decisions on climate items in IFRS accounts:
carbon cost accrual, IAS 36 impairment quantum, IAS 37 provisions, and scenario-conditioned
guidance. Coverage: any non-financial corporate with Scope 1/2 inventory and asset register;
extension to loan books via the ECL overlay (8.3d).

**8.2 Conceptual approach.** An integrated scenario overlay on a driver-based 3-statement model:
transition costs priced off NGFS carbon-price paths, physical losses off expected-annual-loss (EAL)
curves, and balance-sheet effects off a value-in-use DCF. This mirrors **MSCI Climate VaR**
(policy-cost + physical-cost present values per issuer), **BlackRock Aladdin Climate**
(security-level repricing of NGFS scenarios onto cash-flow models), and for credit exposure
**Moody's climate-adjusted EDF**; physical EAL construction follows **Swiss Re sigma / Verisk**
cat-model practice and S&P Trucost physical-risk scoring.

**8.3 Mathematical specification.**

```
(a) Carbon cost:       C(t,s) = max(0, S1(t) − FA(t)) × Pc(t,s) + S2(t) × pass_through × ΔPelec(t,s)
                        S1(t) = S1(0) × (1 − g_abate)^t
(b) Physical provision: EAL(t,s) = Σ_h AV_h × λ_h(t,s) × MDR_h        (per hazard h)
(c) IAS 36:            VIU_s = Σ_t FCF_t(s) / (1+r)^t ;  Impair_s = max(0, CA − max(VIU_s, FVLCD))
(d) IFRS 9 overlay:    PD_s = Φ( Φ⁻¹(PD_base) + β_sector × Z_s ) ;  ΔECL = Σ EAD×(PD_s×LGD_s − PD×LGD)
(e) Statements:        EBITDA_t(s) = EBITDA_base,t − C(t,s) − EAL(t,s) + Opp(t,s)
                        CFO_t = EBITDA_t − tax − ΔWC ;  CFI_t −= capex_green(t,s)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `Pc(t,s)` | scenario carbon price path | NGFS Phase IV/V (REMIND-MAgPIE; NZ2050 ≈ US$100–130/t by 2030) |
| `FA(t)` | free allocation decline | EU ETS Phase IV linear reduction factor 2.2%/yr; CBAM phase-in 2026–34 |
| `g_abate` | entity abatement rate | SBTi target or sector CRREM/IEA NZE pathway |
| `λ_h(t,s)` | hazard frequency by scenario | EM-DAT event rates; Swiss Re sigma loss trends; IPCC AR6 hazard scaling |
| `MDR_h` | mean damage ratio | JRC depth-damage curves (flood); Verisk/RMS vulnerability functions |
| `β_sector` | credit-factor loading | ECB 2022 climate stress test elasticities; EBA scenario parameters |
| `r` | discount rate | entity WACC; IAS 36 pre-tax requirement |
| `pass_through` | electricity carbon pass-through | 0.6–0.9, ACER/academic EU power-market estimates |

**8.4 Data requirements.** Scope 1/2 inventory (exists: platform carbon calculators), verified ETS
emissions + allocations (exists: EU ETS via `reference_data`/CBAM seed), asset register with
geocodes and carrying values (needed; vendor: Munich Re location intelligence, free: OSM +
EM-DAT), EUA forward curve (ICE; free proxy: EEX settlement), PD/LGD by obligor for (d) (exists:
credit modules), NGFS scenario paths (free download, partially in `climate_scenarios` tables).

**8.5 Validation & benchmarking.** Backtest (a) against realised 2021–24 EUA prices and disclosed
ETS costs of EU utilities (RWE, EnBW annual reports); reconcile (d) portfolio ECL uplift against
published ECB 2022 CST loss ranges; benchmark issuer-level totals against MSCI Climate VaR deciles
for the same sector; sensitivity: ±50% carbon price, ±1 notch damage ratio; stability: results
monotone in scenario severity within sector (flag the intended non-monotonic physical crossovers).

**8.6 Limitations & model risk.** Scenario paths are policy assumptions, not forecasts; EAL from
global damage curves misses site-level adaptation; Vasicek shift assumes a single climate factor;
double-count risk between (b) and (c) if damaged assets are also impaired — deduct EAL-funded
restoration from VIU cash flows; conservative fallback: report the worst of the three scenarios
and disclose the unconditioned base case alongside.

## 9 · Future Evolution

### 9.1 Evolution A — Fix the broken POST, render the engine, add the missing statements (analytics ladder: rung 2 → 3)

**What.** §7 documents a three-part gap on a strong foundation. The engine (E86) is
real and deterministic — IFRS S2 §29 effect quantification, IAS 36 indicator testing,
IAS 37 carbon provisions, stranded-asset write-downs, scenario-adjusted P&L behind
six POST routes and four passing ref GETs — but (1) the page fires `POST /assess` and
**discards the response**, even sending `entity_name` where the model requires
`entity_id` so the call can 422 silently, rendering seeded demo numbers instead;
(2) the engine has no IFRS 9 ECL overlay and no hazard-based damage provision despite
the guide claiming both; (3) no cash-flow statement exists. Evolution A: fix the
request payload and render engine output (deleting the `seed()` KPIs); then extend
the engine with the cash-flow view (decarbonisation capex schedule from the existing
scenario-adjusted P&L terms); reconcile the guide on the ECL/hazard claims — either
implement or excise.

**How.** (1) Payload fix + response binding is hours, not weeks, and converts a
tier-A module from demo to functional; lineage fixtures move the six POSTs to
`passed`. (2) Cash-flow statement derived from the engine's income/balance-sheet
effects (the `bs_m = income_m × 0.6` capitalisation split already implies the capex
line). (3) The engine's model coefficients (0.12 EBITDA relevance, 3% asset physical
base) documented per §8 model-card convention with sensitivity display.

**Prerequisites (hard).** The silent-422 wiring bug is a documented defect and step
one; guide reconciliation on IFRS 9/hazard claims mandatory. **Acceptance:** every
number in the five tabs matches an engine response field; the 422 path is impossible
(schema-validated client); a fixture entity's assessment is reproducible via direct
POST.

### 9.2 Evolution B — ISSB S2 disclosure-drafting analyst (LLM tier 2)

**What.** The module's end product is disclosure narrative — IFRS S2 requires
quantitative financial-effect disclosure with methodology explanation, and the engine
computes exactly those effects. A tier-2 analyst runs the assessment as tool calls
(`/assess`, `/ifrs-s2-effects`, `/ias36-impairment`, `/carbon-provisions`,
`/stranded-assets`) and drafts the S2 §29 disclosure text around the returned
figures: effect categories from the `/ref/financial-effect-categories` taxonomy,
impairment indicators from the ref list, every monetary amount validator-checked
against tool outputs.

**How.** Tool schemas from the six POSTs + four ref GETs per the atlas endpoint map;
drafting templates structured by the S2 pillar taxonomy the engine already encodes;
the no-fabrication validator in hard-fail mode (this is regulatory disclosure);
model-coefficient caveats from Evolution A surface as methodology notes in the draft
— S2 requires disclosing estimation approaches, and the engine's coefficients are the
estimation approach.

**Prerequisites (hard).** Evolution A's wiring fix first — an LLM narrating the
current page would describe seeded numbers the engine never produced (the exemplar
module's exact failure mode). **Acceptance:** a drafted disclosure contains only
engine-returned amounts with methodology notes; human sign-off gates export;
re-running with identical inputs yields identical draft numbers.