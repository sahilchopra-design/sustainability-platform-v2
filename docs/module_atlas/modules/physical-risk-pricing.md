# Physical Risk Pricing
**Module ID:** `physical-risk-pricing` · **Route:** `/physical-risk-pricing` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrates climate physical risk premia into asset pricing using hazard-adjusted discount rates and expected loss modelling.

> **Business value:** Translates physical climate hazard into actionable pricing signals, enabling climate-adjusted bond/loan spreads and equity discount rates.

**How an analyst works this module:**
- Load asset fundamentals and hazard scores.
- Select pricing scenario (RCP/SSP) and time horizon.
- Compute hazard-adjusted PD uplift and LGD.
- Output climate risk premium and adjusted valuation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACUTE_PERILS`, `API`, `Badge`, `Btn`, `CHRONIC_LABELS`, `COUNTRIES`, `COUNTRY_ISO`, `HORIZONS`, `Inp`, `KpiCard`, `LiveBadge`, `NGFS_SCENARIOS`, `NGFS_SCENARIO_LABELS`, `PERIL_LABELS`, `PIE_COLORS`, `PRP_API`, `Row`, `Section`, `Sel`, `TABS`, `TIER_COLOR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `PRP_API` | ``${API}/api/v1/physical-risk-pricing`;` |
| `seededRandom` | `sr; // alias for backward compat` |
| `base` | `hashStr(country + assetClass + ngfs) % 997;` |
| `composite` | `Math.round(acutePerils.reduce((sum, p) => sum + p.score, 0) / acutePerils.length);` |
| `ealPct` | `(s(10) * 0.8 + 0.1).toFixed(2);` |
| `data` | `returnPeriods.map((rp, ri) => {` |
| `tableRows` | `returnPeriods.map((rp, ri) => {` |
| `pml100` | `s(2) * 0.15 + 0.05;` |
| `riskPremium` | `Math.round(s(4) * 80 + 20);` |
| `lossDistData` | `[10, 25, 50, 100, 200, 500].map((rp, i) => ({` |
| `insuredPct` | `Math.round(s(10) * 40 + 30);` |
| `barData` | `scenarios.map((sc, si) => {` |
| `lineData` | `HORIZONS.map((yr, yi) => {` |
| `trend` | `si === 0 ? -0.3 : si === 1 ? 0.1 : 0.5;` |
| `results` | `await Promise.all(combos.map(([sc, hz]) =>` |
| `liveNatcatBar` | `rpLive ? [10, 25, 50, 100, 200, 500].map(rp => {` |
| `liveNatcatTable` | `rpLive ? [10, 25, 50, 100, 200, 500].map(rp => {` |
| `liveLossDist` | `rpLive ? [10, 25, 50, 100, 200, 500].map(rp => {` |
| `total` | `ACUTE_PERILS.reduce((sum, p) => sum + (rpLive.peril_loss_table[p]?.return_period_losses?.[`${rp}yr`]?.gross_loss_usd \|\| 0), 0);` |
| `liveStrandBar` | `strandingLive ? NGFS_SCENARIOS.map(sc => {` |
| `liveStrandRows` | `strandingLive ? NGFS_SCENARIOS.flatMap(sc => HORIZONS.map(hz => {` |
| `topStressor` | `d ? Object.entries(d.stressor_detail).reduce((best, [k, v]) => !best \|\| v.contribution > best.c ? { k, c: v.contribution } : best, null) : null;` |
| `liveNgfsTrajectory` | `(ngfsRefLive && priceLive) ? HORIZONS.map(hz => {` |
| `avgAmp` | `ACUTE_PERILS.reduce((sum, p) => sum + (amps[p] \|\| 1), 0) / ACUTE_PERILS.length;` |
| `compositeScore` | `priceLive ? Math.round(priceLive.composite_physical_risk_score * 100) : peril.composite;` |
| `ealPctDisplay` | `priceLive ? ((priceLive.expected_annual_loss_usd / assetValNum) * 100).toFixed(2) : peril.ealPct;` |
| `ealUsdDisplay` | `priceLive ? (priceLive.expected_annual_loss_usd / 1e6).toFixed(3) : (parseFloat(peril.ealPct) * assetValNum / 1e6 / 100).toFixed(2);` |
| `dominantPerilName` | `liveDominantPeril ? liveDominantPeril.name : [...peril.acutePerils].sort((a, b) => b.score - a.score)[0].dimension;` |
| `dominantPerilScore` | `liveDominantPeril ? Math.round(liveDominantPeril.score * 100) : [...peril.acutePerils].sort((a, b) => b.score - a.score)[0].score;` |
| `natcatPerils` | `ACUTE_PERILS.map(p => PERIL_LABELS[p]);` |
| `finPml` | `priceLive ? `$${(priceLive.pml_100yr_usd / 1e6).toFixed(3)}M` : fin.pml100;` |
| `finVar` | `priceLive ? `${((priceLive.climate_var_95pct_usd / assetValNum) * 100).toFixed(2)}%` : fin.climateVaR;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `global_physical_risk_engine` (services/global_physical_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp01` | x |  |
| `_risk_level_score` | risk_level |  |
| `score_earthquake` | row |  |
| `score_cyclone` | row |  |
| `score_wildfire` | row |  |
| `score_flood` | row |  |
| `score_sea_level` | row |  |
| `_fetch_earthquake_zone` | db, lat, lng, radius_m |  |
| `_fetch_cyclone_zone` | db, lat, lng, radius_m |  |
| `_fetch_wildfire_zone` | db, lat, lng, radius_m |  |
| `_fetch_flood_zone` | db, lat, lng, radius_m |  |
| `_fetch_sea_level_zone` | db, lat, lng, radius_m |  |
| `_table_is_empty` | db, table |  |
| `get_point_hazard_profile` | db, lat, lon, radius_km | Query all 5 hazard tables for the zone containing (or nearest within radius_km of) the given point, and return raw zone data + normalized 0-100 score per hazard. Never raises for empty tables — reports `data_availability` per hazard instead. |
| `get_composite_score` | hazard_scores, weights | Weighted composite over whichever hazards have data. Missing hazards are excluded and the remaining weights are re-normalized to sum to 1.0 — a missing hazard is NEVER treated as a 0 score. Default weights: equal-weight (20% each of the 5 hazards) — see module docstring for rationale. Pass `weights` to override (need not sum to 1; re-normalized automatically over the available subset). |
| `build_risk_narrative` | profile | Plain-language narrative summarizing a point's hazard profile. |
| `get_region_summary` | db, min_lon, min_lat, max_lon, max_lat | Aggregate hazard stats over a bounding box: per-hazard zone counts and average/max raw driver values, plus an approximate composite computed from those per-hazard averages. Intended for portfolio/regional views, not per-asset precision (use get_point_hazard_profile per asset for that). |
| `get_coverage_stats` | db | 'Digital twin build progress' metric: row counts + spatial extent (min/max lat/lon with data) per hazard table. |

**Engine `global_physical_risk_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_RISK_LEVEL_NEUTRAL` | `50.0` |
| `_SCORERS` | `{'earthquake': score_earthquake, 'cyclone': score_cyclone, 'wildfire': score_wildfire, 'flood': score_flood, 'sea_level': score_sea_level}` |
| `_FETCHERS` | `{'earthquake': _fetch_earthquake_zone, 'cyclone': _fetch_cyclone_zone, 'wildfire': _fetch_wildfire_zone, 'flood': _fetch_flood_zone, 'sea_level': _fetch_sea_level_zone}` |

### 2.3 Engine `physical_risk_pricing_engine` (services/physical_risk_pricing_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | v, lo, hi |  |
| `_composite_baseline_score` | profile | Weighted composite of all peril baselines. |
| `_determine_risk_tier` | composite_score |  |
| `_expected_annual_loss` | country_iso, asset_class, asset_value_usd, amplifiers | EAL = Σ_perils [ annualised_loss_rate_peril × vulnerability_coeff × amplifier × asset_value ] Using trapezoidal integration over return periods. |
| `price_physical_risk` | entity_id, asset_class, country_iso, asset_value_usd, ngfs_scenario, time_horizon, lat, lng | Full physical risk pricing for a single asset. Returns: composite_score, EAL, PML (100yr), insurance_gap, climate_VaR (95%), risk_premium_bps, risk_tier, per-peril breakdown. |
| `calculate_return_period_losses` | country_iso, asset_class, asset_value_usd | Returns full loss table: peril × return period → expected loss USD and %. |
| `calculate_stranding_probability` | country_iso, asset_class, ngfs_scenario, time_horizon | Estimates stranding probability for an asset given chronic physical risk amplification under a specified NGFS scenario and time horizon. Methodology: weighted composite of chronic stressors × asset class sensitivity weights, mapped to stranding probability via logistic function. |
| `get_country_physical_risk_profile` | country_iso | Returns full baseline risk profile for a country. |
| `get_all_country_profiles` |  |  |
| `get_damage_functions` |  |  |
| `get_ngfs_amplifiers` |  |  |
| `get_insurance_gaps` |  |  |
| `get_risk_premium_table` |  |  |

**Engine `physical_risk_pricing_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `CHRONIC_STRESSORS` | `['sea_level', 'drought', 'precipitation_change', 'temperature_increase']` |
| `ACUTE_PERILS` | `['flood', 'cyclone', 'wildfire', 'earthquake', 'heatwave']` |
| `VALID_ASSET_CLASSES` | `['property', 'infrastructure', 'agriculture', 'energy', 'marine']` |
| `VALID_SCENARIOS` | `['orderly', 'disorderly', 'hot_house']` |
| `VALID_HORIZONS` | `['2030', '2040', '2050']` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Swiss`, `__future__` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ACUTE_PERILS`, `HORIZONS`, `NGFS_SCENARIOS`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Baseline Spread (bps) | — | Market Data | Pre-climate credit spread for reference asset. |
| Climate Risk Premium (bps) | — | Physical Hazard Engine | Incremental spread from modelled physical risk exposure under RCP 8.5. |
| Climate VaR (95%) | — | Loss Distribution Model | 95th percentile climate-adjusted value-at-risk over 30-year horizon. |
- **Hazard scores + credit fundamentals + market spreads** → PD uplift mapping; LGD adjustment; climate premium calculation → **Climate-adjusted pricing outputs and valuation adjustments**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/physical-risk-pricing/ref/country-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'countries', 'metadata'], 'n_keys': 3}`

**GET /api/v1/physical-risk-pricing/ref/damage-functions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['acute_perils', 'vulnerability_coefficients', 'return_period_probabilities', 'asset_classes', 'notes'], 'n_keys': 5}`

**GET /api/v1/physical-risk-pricing/ref/insurance-gaps** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['data', 'interpretation', 'sources', 'coverage_note'], 'n_keys': 4}`

**GET /api/v1/physical-risk-pricing/ref/ngfs-amplifiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scenarios', 'horizons', 'amplifiers', 'interpretation', 'sources'], 'n_keys': 5}`

**GET /api/v1/physical-risk-pricing/ref/risk-premium-table** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['risk_premium_table', 'risk_tier_thresholds', 'sources', 'notes'], 'n_keys': 4}`

**POST /api/v1/physical-risk-pricing/price** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/physical-risk-pricing/price-with-geo** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/physical-risk-pricing/return-period-losses** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Risk Premium
**Headline formula:** `δr = PD_climate × LGD × (1 + β_hazard)`

Hazard-adjusted spread addition derived from climate-driven probability of default uplift and loss-given-default.

**Standards:** ['NGFS Physical Risk Scenarios', 'ECB Climate Risk Stress Test 2022']
**Reference documents:** NGFS Scenarios for Central Banks and Supervisors; ECB Economy-Wide Climate Stress Test Methodology (2022)

**Engine `global_physical_risk_engine` — extracted transformation lines:**
```python
wildfire_score = 100 * clamp(fwi_mean / 50.0, 0, 1)
magnitude_component = _clamp01(float(magnitude) / 9.0)
frequency_component = _clamp01(float(events or 0) / 100.0)
score = 100.0 * (0.70 * magnitude_component + 0.30 * frequency_component)
wind_component = _clamp01(float(wind) / 200.0)
density_component = _clamp01(float(density or 0) / 50.0)
score = 100.0 * (0.65 * wind_component + 0.35 * density_component)
score = 100.0 * _clamp01(float(fwi) / 50.0)
depth_component = _clamp01(float(depth) / 5.0)
aep = 1.0 / float(return_period)
frequency_component = _clamp01(aep / 0.10)
score = 100.0 * (0.60 * depth_component + 0.40 * frequency_component)
depth_component = _clamp01(float(depth) / 5.0)
score = 100.0 * depth_component
slr_component = _clamp01(float(slr) / 1.5)
years_out = max(float(horizon) - CURRENT_YEAR, 0.0) if horizon else 100.0
proximity_component = _clamp01(1.0 - years_out / 100.0)
score = 100.0 * (0.60 * slr_component + 0.40 * proximity_component)
radius_m = radius_km * 1000.0
normalized_weights = {h: w / total_weight for h, w in weight_subset.items()}
composite = sum(available[h] * normalized_weights[h] for h in available)
```

**Engine `physical_risk_pricing_engine` — extracted transformation lines:**
```python
l1 = rp_table[rp1] / 100 * baseline * amp * vuln
l2 = rp_table[rp2] / 100 * baseline * amp * vuln
avg_amp = sum(amplifiers[p] for p in ACUTE_PERILS if p in amplifiers) / len(ACUTE_PERILS)
composite_score_stressed = _clamp(composite_score * avg_amp)
avg_insured = sum(gap_ratios.values()) / len(gap_ratios) if gap_ratios else 0.1
insurance_gap_usd = eal_usd * (1.0 - avg_insured)
climate_var_usd = max(climate_var_usd, eal_usd * 3.0)  # floor at 3× EAL
scaled_loss_pct = loss_pct * baseline * vuln
loss_usd = scaled_loss_pct / 100 * asset_value_usd
stranding_prob = 1.0 / (1.0 + math.exp(-k * (composite_chronic - x0)))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **52** other module(s).
**Shared engines (edits propagate!):** `global_physical_risk_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `global-physical-risk-atlas` | engine:global_physical_risk_engine, table:sqlalchemy |
| `carbon-market-intelligence` | table:sqlalchemy |
| `reference-data-explorer` | table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:sqlalchemy |
| `supply-chain-esg-hub` | table:sqlalchemy |
| `geothermal-market-intelligence` | table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:sqlalchemy |
| `supply-chain-resilience` | table:sqlalchemy |
| `carbon-footprint-intelligence` | table:sqlalchemy |
| `carbon-reduction-projects` | table:sqlalchemy |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** This is a tier-A module with a genuinely well-built backend
> engine — `backend/services/physical_risk_pricing_engine.py` implements real trapezoidal
> exceedance-probability integration, 30-country baseline peril profiles sourced from INFORM
> Risk Index / ND-GAIN / Swiss Re CatNet, NGFS Phase-IV physical damage amplifiers, and a logistic
> stranding-probability function. **But the frontend page never calls it for anything it displays.**
> `PhysicalRiskPricingPage.jsx` imports `axios` and POSTs to `/price` on button click, but the
> response is discarded (`catch { void 0 /* API fallback to seed data */ }`) and every number shown
> — peril scores, loss tables, EAL/PML/Climate-VaR, stranding probabilities — comes from a separate
> `hashStr(country+assetClass+ngfs) % 997` seeded-random generator local to the page. The sections
> below document what actually renders; §7.6 documents the real engine that exists but is unwired.

### 7.1 What the module computes (as rendered)

A deterministic hash of the three selected inputs seeds a local `s(n) = seededRandom(base+n)`
generator; every displayed figure is `s(n)` scaled into a plausible-looking range — there is no
dependency on real country hazard data:

```js
base = hashStr(country + assetClass + ngfsScenario) % 997
composite = mean(9 peril scores), each peril = round(s(i)×60 + 30)   // 20-100 band, uncalibrated
ealPct    = s(10) × 0.8 + 0.1                                          // 0.1%-0.9% of asset value
pml100    = s(2) × 0.15 + 0.05                                         // 5%-20% of asset value
climateVaR = (lossDist[25yr] / assetValue) × 100                       // relabeled loss-table entry
riskPremium = round(s(4) × 80 + 20)                                    // 20-100 bps
```

### 7.2 Parameterisation (frontend, illustrative)

| Quantity | Range | Provenance |
|---|---|---|
| 9 acute/chronic peril scores | 15–95 (varies by peril) | `sr()`-seeded, hash keyed on country+assetClass+scenario — stable per selection but not tied to real hazard maps |
| EAL | 0.1%–0.9% of asset value | Arbitrary band |
| PML(100yr) | 5%–20% of asset value | Arbitrary band |
| Risk premium | 20–100 bps | Arbitrary band |
| Stranding probability | 10%–60% per scenario×horizon cell | Arbitrary band |

### 7.3 Calculation walkthrough (frontend)

1. User selects country / asset class / NGFS scenario / horizon.
2. `hashStr()` folds the three strings into an integer seed `base`.
3. Five independent generator functions (`getPerilData`, `getNatCatData`, `getFinancialData`,
   `getStrandingData`, `getNGFSData`) each derive their own `s(n)` sequence from `base` and produce
   tab-specific numbers — none of the five functions share state or reconcile with each other (e.g.
   the "Composite Risk Score" on tab 1 and the "EAL" on tab 3 are drawn from unrelated seed offsets).
4. "Run Physical Risk Pricing" fires a POST to the backend engine but the UI does not read the
   response — clicking the button changes nothing on screen.

### 7.4 Worked example

Country = United Kingdom, assetClass = property, ngfsScenario = orderly →
`base = hashStr("UKpropertyorderly") % 997` (a fixed integer, call it `b`).
`peril.composite` = round(mean of 9 values, each `round(s(i)*60+30)` for i=1..9) — e.g. if the 9
draws average ≈0.55, composite ≈ round(30 + 0.55×60) = **63/100 → "High" tier** (composite≥55).
`ealPct = s(10)×0.8+0.1` — if `s(10)≈0.4`, `ealPct = 0.42` → displayed as "0.42% of AV" ≈
$21,000 on a $5M reference asset. None of these numbers change if the user swaps United Kingdom for
Bangladesh unless the hash happens to differ meaningfully — country choice has no causal link to
INFORM/ND-GAIN reality in this rendering path.

### 7.5 Regulatory-readiness checklist (tab 5)
8 checklist items, 2 hard-coded `true` ("Physical risk quantification", "NGFS scenario coverage"),
6 driven by `s(20)`..`s(25)` thresholds (e.g. "Insurance gap analysis" ready if `s(21)>0.35`) — a
cosmetic readiness score, not a real audit.

### 7.6 The real, unwired backend engine

`backend/services/physical_risk_pricing_engine.py` (1,103 lines) is a legitimate physical-risk
pricing model:
- **30-country baseline risk profiles** (flood/cyclone/wildfire/drought/heatwave/SLR/earthquake,
  0–1 scale) sourced from INFORM Risk Index 2023, ND-GAIN 2023, Swiss Re CatNet, IPCC AR6.
- **NGFS Physical Damage Amplifiers** — scenario(`orderly`/`disorderly`/`hot_house`) × horizon
  (2030/2040/2050) multiplier tables per peril, e.g. hot-house 2050 heatwave amplifier = 2.20×.
- **EAL via trapezoidal EP-curve integration** (`_expected_annual_loss`) over 6 return periods
  (10–500yr), combining `RETURN_PERIOD_LOSS_TABLES` × country baseline × NGFS amplifier ×
  `VULNERABILITY_COEFFICIENTS` (asset-class-specific damage sensitivity).
- **Climate VaR** = `max(PML(100yr) × climate_var_pct_of_tier, EAL×3)` — a 3×-EAL floor plus a
  tier-based percentage-of-asset-value ceiling from `RISK_PREMIUM_TABLE`.
- **Stranding probability** — logistic function `1/(1+exp(-10×(chronic_composite-0.5)))` on an
  asset-class-weighted blend of SLR/drought/heatwave/flood chronic stressors.
- **Insurance protection gaps** by country×peril, Swiss Re sigma / Munich Re NatCatSERVICE sourced.

This is close to production-grade methodology and should be the target the frontend calls.

### 7.7 Data provenance & limitations

- **Frontend rendering path is 100% synthetic**, seeded by `hashStr()+sr()`, despite tab labels
  ("NGFS-aligned physical risk classification", "TCFD / NGFS / ECB CST 2022 aligned") implying
  regulatory rigor.
- **Backend engine is real but disconnected** — `/api/v1/physical-risk-pricing/price` and 7 sibling
  routes exist (`api/v1/routes/physical_risk_pricing.py`) and are POSTed to, but the response is
  never read into component state.
- No caching/versioning of NGFS amplifier vintage — engine uses NGFS Phase IV (2023) tables that
  should be refreshed on each NGFS scenario release.

## 8 · Model Specification

**Status: implemented in `backend/services/physical_risk_pricing_engine.py` — not yet wired to
this page's UI.** This section specifies the wiring, not a new model.

### 8.1 Purpose & scope
Deliver asset-level EAL / PML(100yr) / Climate-VaR(95%) / risk-premium-bps / stranding-probability
for a single asset, replacing the page's disconnected synthetic renderer with the real engine's
output — coverage: property, infrastructure, agriculture, energy, marine asset classes across the
engine's 30 supported countries.

### 8.2 Conceptual approach
No new methodology is needed — the engine already mirrors the RMS/AIR/Verisk EP-curve architecture
(§7.6) and the NGFS CGFI physical-risk assessment framework used by ECB's economy-wide climate
stress test. The gap is purely an integration gap.

### 8.3 Wiring specification

```
onSubmit → POST /api/v1/physical-risk-pricing/price {entity_id, asset_class, country_iso,
           asset_value_usd, ngfs_scenario, time_horizon, lat, lng}
        → setState(engineResponse)
        → replace getPerilData/getNatCatData/getFinancialData/getStrandingData/getNGFSData
          local generators with engineResponse.{acute_peril_breakdown, chronic_stressor_breakdown,
          expected_annual_loss_usd, pml_100yr_usd, climate_var_95pct_usd, risk_premium_bps,
          risk_tier}
        → GET /ref/return-period-losses for the NatCat Loss Table tab (calculate_return_period_losses)
        → GET /ref/stranding for the Stranding Analysis tab (calculate_stranding_probability)
```
Country codes must be reconciled: the frontend `COUNTRIES` list uses full names ("United Kingdom")
while the engine keys on ISO3 (`GBR`) — a lookup table is required.

### 8.4 Data requirements
All required reference data (country profiles, damage functions, amplifiers, insurance gaps,
premium table) already exists in the engine module; no new ingestion needed.

### 8.5 Validation & benchmarking plan
Once wired, validate that displayed EAL/PML change monotonically and consistently with country
selection (e.g. Bangladesh > United Kingdom for flood-driven EAL) — a property the current
synthetic path does not guarantee. Reconcile engine PML(100yr) against RMS/AIR public benchmark
loss ratios where available.

### 8.6 Limitations & model risk
Trapezoidal EP integration with only 6 return-period points is coarse relative to full event-set
catastrophe models; vulnerability coefficients are single scalars per peril×class, not
depth-damage curves; wiring the real engine will change every number on the page materially versus
current demo values, which should be communicated to users as a methodology change, not a bug fix.

## Framework alignment

**NGFS CGFI Physical Risk Assessment (2021/2023)** — genuinely implemented in the engine
(amplifier tables), absent from the rendered UI. **TCFD Physical Risk Guidance** — engine's
EAL/PML/stranding triad matches TCFD's recommended physical-risk metrics; UI currently displays
disconnected demo numbers under TCFD-branded labels. **ECB Climate Risk Stress Test 2022** — cited
correctly as the source for hazard-adjusted spread methodology; engine's risk-premium table
structure is consistent with ECB/PRA supervisory expectations for climate-adjusted credit pricing.

## 9 · Future Evolution

### 9.1 Evolution A — Asset-level hazard resolution with calibrated EP curves (analytics ladder: rung 2 → 4)

**What.** Replace the engine's country-level peril baselines with per-coordinate hazard
lookups from the platform's own digital twin (`global_physical_risk_engine`, the 5
populated `ref_*_zones` PostGIS grids), then calibrate the return-period loss tables
against observed loss history (OpenFEMA NFIP claims already ingested; IBTrACS track
intensities already gridded). Today two Miami towers and a Houston tower differ only by
value and asset class — after this, they differ by actual micro-location exposure.

**How.** (1) `price_physical_risk()` gains a resolution cascade: coordinate → zone-level
driver values (magnitude/wind/FWI/depth/SLR) → fall back to country baseline with
`resolution_tier` reported, mirroring the GLEIF pattern. (2) The 6 return-period points
per peril become fitted exceedance curves (GPD tail fit where claims density supports
it, documented per Atlas §8 model-card convention). (3) Backtest: EAL predictions vs
NFIP claims by county-year; publish calibration error in the response payload.

**Prerequisites.** Flood/sea-level grids upgraded from named-city samples to gridded
coverage (FEMA NFHL bulk or JRC global flood maps); `bench_quant` pin extended with a
coordinate-resolution reference case. **Acceptance:** same-city assets with different
coordinates produce different EAL; calibration error reported, not hidden; country
fallback still honest via `resolution_tier`.

### 9.2 Evolution B — Underwriter copilot with tool-called repricing (LLM tier 2)

**What.** The E104 page's chat copilot answers "why is this premium 88bps?" by citing
the live engine decomposition (peril contributions, NGFS amplifier, insurance-gap
factor from its own response payload), and executes natural-language what-ifs — "move
horizon to 2040 under disorderly", "assume 60% insured share" — as tool calls against
`POST /price` and `/stranding`, never by generating numbers itself.

**How.** Tool schemas derived from this module's existing OpenAPI operations (8 routes,
read-only Pydantic-typed); per-module system prompt assembled from this Atlas page
(§5 formulas + §7.6 engine description are the grounding corpus); the fabrication
validator checks every numeric in the answer against the conversation's tool outputs.
The first shippable slice is explanation-only (tier 1) using the already-computed page
state — no new backend at all.

**Prerequisites (hard).** Close the documented §7 guide↔code mismatch first — the page
must render engine output, not its legacy seeded-random path, before an LLM narrates
it; otherwise the copilot would explain numbers the engine never produced.
**Acceptance:** every numeric in a copilot answer traceable to a §4.2-listed endpoint
response; refusal on questions outside the module's computed surface (e.g. asking for
PML confidence intervals the engine doesn't produce).