# Water Risk Analytics
**Module ID:** `water-risk-analytics` · **Route:** `/water-risk-analytics` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Detailed water stress, scarcity, quality and flood analytics platform providing granular basin-level assessment integrating WRI Aqueduct, GEMS/Water quality data and IPCC hydrology projections.

> **Business value:** Freshwater quality degradation affects 40% of global river length (UN 2023); combined stress and quality risk is most acute in South Asia, North Africa and Northern China where industrial and agricultural demand converges.

**How an analyst works this module:**
- Integrate WRI Aqueduct, GEMS/Water and flood hazard layers by catchment
- Compute sub-indicator scores for stress, quality, flood and regulatory risk
- Aggregate to CWRI using sector-adjusted weights
- Project forward to 2030/2050 under IPCC scenarios
- Report to ESRS E3, TNFD and CDP Water with basin-level evidence

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `API`, `BASIN_BENCHMARK_KEY`, `BASIN_COUNTRY`, `REGIONS`, `RISK_TIER_LABEL`, `TABS`, `WATER_API`, `WRI_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `WATER_API` | ``${API}/api/v1/water-risk`;` |
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TABS` | `['Water Risk Dashboard','Regional Analysis','Corporate Exposure','Projections'];const RISKF=['All','Extremely High','High','Medium-High','Medium','Low'];const PAGE=12;` |
| `names` | `['Ganges Basin','Indus Basin','Yellow River','Yangtze Delta','Mekong Delta','Nile Valley','Murray-Darling','Colorado Basin','California Central','Sao Francisco','Tigris-Euphrates','Lake Chad','Aral Sea','Jordan River','O` |
| `stressLevel` | `+(sr(i*7)*4+1).toFixed(1);const riskCat=stressLevel>4?'Extremely High':stressLevel>3?'High':stressLevel>2.5?'Medium-High':stressLevel>1.5?'Medium':'Low';` |
| `supply` | `Math.round(sr(i*11)*500+10);const demand=Math.round(supply*(sr(i*13)*0.5+0.6));const deficit=stressLevel>3?Math.max(supply*0.1,demand-supply):Math.max(0,demand-supply);` |
| `floodRisk` | `Math.round(sr(i*17)*100);const droughtRisk=Math.round(sr(i*19)*100);const pollutionIdx=Math.round(sr(i*23)*100);const groundwater=Math.round(sr(i*29)*80+10);` |
| `yearly` | `Array.from({length:6},(_,y)=>({year:2020+y,stress:+(stressLevel+y*0.08+sr(i*100+y)*0.3).toFixed(1),supply:Math.round(supply-y*5+sr(i*100+y*3)*10),demand:Math.round(demand+y*8+sr(i*100+y*7)*5)}));` |
| `WRI_MAP` | `Object.fromEntries((WRI_AQUEDUCT_WATER_RISK\|\|[]).map(c=>[c.country,c]));` |
| `REGIONS` | `isIndiaMode() ? adaptForWaterRisk().map((c, i) => ({` |
| `results` | `await Promise.all(REGIONS.map(r=>` |
| `enrichedRegions` | `useMemo(()=>REGIONS.map(r=>{` |
| `filtered` | `useMemo(()=>{let d=[...enrichedRegions];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())\|\|r.basin.toLowerCase().includes(search.toLowerCase()));if(riskF!=='All')d=d.filter(r=>r.riskCategory===riskF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[enrichedRegio` |
| `stats` | `useMemo(()=>{const d=Math.max(1,filtered.length);return{count:filtered.length,avgStress:(filtered.reduce((s,r)=>s+r.waterStress,0)/d).toFixed(1),extreme:filtered.filter(r=>r.riskCategory==='Extremely High').length,totalD` |
| `riskDist` | `useMemo(()=>['Extremely High','High','Medium-High','Medium','Low'].map(r=>({name:r,value:enrichedRegions.filter(reg=>reg.riskCategory===r).length})),[enrichedRegions]);` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type` |
| `rBdg` | `r=>({color:r==='Extremely High'?T.red:r==='High'?T.amber:r==='Medium-High'?T.gold:r==='Medium'?T.sage:T.green,fontWeight:600,fontSize:11});` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/water-risk/aqueduct-risk` | `aqueduct_risk` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/cdp-water` | `cdp_water` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/esrs-e3` | `esrs_e3` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/tnfd-water-dependency` | `tnfd_water_dependency` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/water-footprint` | `water_footprint` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/financial-impact` | `financial_impact` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/physical-risk-scenarios` | `physical_risk_scenarios` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/materiality` | `materiality` | api/v1/routes/water_risk.py |
| GET | `/api/v1/water-risk/ref/risk-tiers` | `ref_risk_tiers` | api/v1/routes/water_risk.py |
| GET | `/api/v1/water-risk/ref/cdp-methodology` | `ref_cdp_methodology` | api/v1/routes/water_risk.py |
| POST | `/api/v1/water-risk/assess` | `assess_water_risk_endpoint` | api/v1/routes/water_stewardship.py |
| POST | `/api/v1/water-risk/stewardship-target` | `stewardship_target_endpoint` | api/v1/routes/water_stewardship.py |
| GET | `/api/v1/water-risk/ref/aqueduct-benchmarks` | `get_aqueduct_benchmarks` | api/v1/routes/water_stewardship.py |
| GET | `/api/v1/water-risk/ref/cdp-criteria` | `get_cdp_criteria` | api/v1/routes/water_stewardship.py |
| GET | `/api/v1/water-risk/ref/aws-standard` | `get_aws_standard` | api/v1/routes/water_stewardship.py |
| GET | `/api/v1/water-risk/ref/stewardship-bond` | `get_stewardship_bond_framework` | api/v1/routes/water_stewardship.py |

### 2.3 Engine `water_risk_engine` (services/water_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `WaterRiskEngine.assess_aqueduct_risk` | entity_id, country_code, sector, basin_name, indicator_scores | WRI Aqueduct 4.0 — 7 physical risk indicators on 0-5 scale. Weighted composite determines risk tier. `indicator_scores` accepts caller-supplied Aqueduct 0-5 raw scores keyed by indicator name (from a real Aqueduct basin lookup). Any indicator not supplied falls back to the country's reference base-stress level (COUNTRY_STRESS × 5), which is a documented deterministic proxy — never a random draw. |
| `WaterRiskEngine.assess_cdp_water` | entity_id, governance_score, risk_score, target_score | CDP Water Security questionnaire scoring. Grade bands: A(90+), A-(80+), B+(70+), B(60+), C(50+), D(<50). |
| `WaterRiskEngine.assess_esrs_e3` | entity_id, withdrawal_m3_pa, consumption_m3_pa, discharge_m3_pa, recycled_pct, water_stress_areas_disclosed, targets_set, water_policy_documented | CSRD ESRS E3 mandatory water disclosure completeness and compliance. The quantitative components (withdrawal/consumption/discharge/recycled) are derived directly from the supplied figures. The three qualitative components (water-stress-area disclosure, targets set, water policy documented) are entity-reported facts — they must be supplied by the caller. When absent they are treated as not-yet-disc |
| `WaterRiskEngine.assess_tnfd_water_dependency` | entity_id, sector, value_chain_stage, dependency_score | TNFD ENCORE-based water dependency assessment. Rates dependency by sector and value chain position. `dependency_score` accepts a caller-supplied 0-100 ENCORE materiality-of- dependency rating. When absent, the score is left null and the rating is derived qualitatively from ENCORE's high-water-dependency sector list (deterministic band), rather than a random draw. ENCORE water services are the full |
| `WaterRiskEngine.calculate_water_footprint` | entity_id, product_name, annual_volume, sector, blue_m3_per_unit, green_m3_per_unit, grey_m3_per_unit, scarcity_multiplier | Water footprint accounting: Blue (surface/ground), Green (rain), Grey (dilution). Per-unit blue/green/grey intensities default to the sector reference (SECTOR_WATER_INTENSITY) but can be overridden with entity-specific measured values. `scarcity_multiplier` is the AWARE/Aqueduct water-scarcity characterisation factor for the operating basin; when absent the scarcity-adjusted footprint is returned  |
| `WaterRiskEngine.assess_financial_impact` | entity_id, water_stress_score, annual_revenue_usd, withdrawal_m3_pa | Financial materiality of water risk: revenue-at-risk, compliance costs, capex resilience, and insurance premium impact. All outputs are deterministic functions of the supplied water-stress score, revenue, and withdrawal volume using documented model coefficients. |
| `WaterRiskEngine.assess_physical_risk_scenarios` | entity_id, country_code, sector | IPCC AR6 RCP 2.6/4.5/8.5 physical water risk projections per country. Scenario deltas are deterministic central estimates from the calibrated RCP model tables (_RCP_SCENARIO_CENTRAL), scaled by the country's qualitative hazard tier (_HAZARD_TIER_SCALE). These are documented model parameters, not random draws or entity-reported figures. |
| `WaterRiskEngine.compute_overall_water_materiality` | entity_id, aqueduct_score, cdp_score, esrs_score, tnfd_score, ceo_water_mandate_score | Aggregated water materiality score across four frameworks. `ceo_water_mandate_score` is an entity self-assessment against the CEO Water Mandate's six commitment areas (0-100). It is caller-supplied; when absent it is returned as null (never fabricated). SDG 6 alignment is derived deterministically from the computed materiality score. |

**Engine `water_risk_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `AQUEDUCT_INDICATORS` | `['water_stress', 'water_depletion', 'interannual_variability', 'seasonal_variability', 'groundwater_decline', 'coastal_eutrophication', 'untreated_wastewater']` |
| `ENCORE_WATER_SERVICES` | `['Surface water regulation', 'Groundwater recharge', 'Water purification', 'Flood regulation', 'Sediment regulation', 'Coastal wetland services']` |
| `ADAPTATION_OPTIONS` | `['Water recycling and reuse systems', 'Rainwater harvesting', 'Efficiency upgrades (drip irrigation, low-flow)', 'Groundwater recharge programs', 'Water rights diversification', 'Supplier watershed stewardship programs', 'Real-time monitoring and leakage detection', 'Product reformulation to reduce ` |

### 2.3 Engine `water_stewardship_engine` (services/water_stewardship_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_seed_float` | entity_id, key, lo, hi | Deterministic seeded float — reproducible demo data without randomness. |
| `_normalise` | value, lo, hi | Map a raw value to 0-100 normalised score (higher = higher risk). |
| `_aqueduct_composite` | data, eid | Compute AQUEDUCT 4.0 weighted composite risk score 0-100. |
| `_tier` | score |  |
| `_cdp_grade` | composite |  |
| `_tnfd_disclosure_score` | data | Score TNFD E3 disclosure completeness 0-100. |
| `assess_water_risk` | request_data | Full water risk and stewardship assessment per: WRI AQUEDUCT 4.0 / CDP Water Security A-List / TNFD E3 / AWS Standard v2.0 / CEO Water Mandate. Returns WaterRiskResult dataclass. |
| `create_stewardship_target` | request_data | Create and validate a water stewardship target against SBTN, CDP, and AWS criteria. Returns StewardshipTargetResult dataclass. |
| `get_benchmark_data` |  | Return all reference data: AQUEDUCT basins, CDP criteria, TNFD E3, AWS, CEO WM, bond framework. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Basins Assessed | — | WRI Aqueduct | Number of HydroBASINS level-6 catchments with full CWRI assessment. |
| Critical Quality Hotspots | — | GEMS/Water | Catchments with combined high stress and poor water quality requiring operational water treatment investment. |
| 2050 Stress Increase | — | IPCC AR6 | Projected increase in population-weighted water stress by 2050 under SSP2-4.5 scenario. |
- **WRI Aqueduct Geodata, GEMS/Water Quality, Flood Hazard Maps, IPCC Projections** → Multi-source integration + CWRI computation + scenario projection → **Detailed water risk analytics, basin-level reports, ESRS E3/TNFD disclosures, CDP Water package**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/water-risk/ref/cdp-methodology** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scoring_weights', 'grade_thresholds', 'a_list_threshold', 'source', 'disclosure_cycle'], 'n_keys': 5}`

**GET /api/v1/water-risk/ref/risk-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scale', 'tiers', 'source', 'indicators'], 'n_keys': 4}`

**POST /api/v1/water-risk/aqueduct-risk** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/water-risk/cdp-water** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/water-risk/esrs-e3** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/water-risk/financial-impact** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/water-risk/materiality** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/water-risk/physical-risk-scenarios** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Water Risk Index
**Headline formula:** `CWRI = 0.4 × Stress + 0.25 × Quality + 0.2 × FloodRisk + 0.15 × Regulatory`

Weighted composite spanning physical water stress, quality degradation, flood exposure and regulatory risk; enables multi-dimensional water risk prioritisation.

**Standards:** ['WRI Aqueduct 4.0', 'GEMS/Water Quality Database', 'IPCC AR6 WG1 Chapter 8']
**Reference documents:** WRI Aqueduct Water Risk Atlas 4.0 2023; UNEP GEMS/Water Quality Database; IPCC AR6 WG1 Chapter 8: Water Cycle Changes; GRI 303: Water and Effluents 2018

**Engine `water_risk_engine` — extracted transformation lines:**
```python
country_base = round(base_mult * 5.0, 2)
gap_to_a_list = round(max(0.0, 80.0 - cdp_weighted), 2)
efficiency_ratio = round(consumption_m3_pa / withdrawal_m3_pa, 4) if withdrawal_m3_pa > 0 else 0.0
disclosure_score = round(sum(components.values()) / len(components) * 100, 2)
total_m3 = round(blue_m3 + green_m3 + grey_m3, 3)
annual_total = round(total_m3 * annual_volume, 1)
water_scarcity_adjusted = round(annual_total * stress_multiplier, 1)
revenue_at_risk_pct = round(min(water_stress_score * 0.6, 3.0), 3)
revenue_at_risk_usd = round(annual_revenue_usd * revenue_at_risk_pct / 100.0, 0)
compliance_cost_usd_pa = round(withdrawal_m3_pa * 0.05, 0)
capex_resilience_usd = round(revenue_at_risk_pct / 100.0 * annual_revenue_usd * 0.3, 0)
insurance_premium_uplift_pct = round(water_stress_score * 1.5, 2)
stress_norm = water_stress_score / 5.0 if water_stress_score <= 5.0 else 1.0
aqueduct_norm = round((aqueduct_score / 5.0) * 100.0, 2)
sdg6_alignment = round(max(0.0, min(100.0, 100.0 - materiality_score * 0.5)), 2)
```

**Engine `water_stewardship_engine` — extracted transformation lines:**
```python
span = max(hi - lo, 1e-9)
cdp_composite = cdp_gov * 0.25 + cdp_risk * 0.25 + cdp_tgt * 0.25 + cdp_perf * 0.25
cdp_composite = min(cdp_composite * 1.04, 1.0)
aws_overall = (aws_wb + aws_gov + aws_sws + aws_eng + aws_out) / 5.0
aws_pct     = round(aws_overall * 100.0, 1)
opex_risk_m   = round(opex_m * (stress_mult - 1.0), 2)
reg_risk_m    = round(assets_m * (rev_pct / 100.0) * 0.032 * stress_mult, 2)
strand_risk_m = round(assets_m * (rev_pct / 100.0) * 0.048 * (aq_score / 100.0), 2)
total_fin_m   = round(opex_risk_m + reg_risk_m + strand_risk_m, 2)
governance_bonus = round((cdp_composite * 0.50 + aws_overall * 0.50) * 22.0, 2)
risk_score = round(min(max(aq_score - governance_bonus, 0.0), 100.0), 1)
years     = max(tgt_yr - base_yr, 1)
target_ml = round(base_ml * (1.0 - red_pct / 100.0), 1)
annual_ml = round((base_ml - target_ml) / years, 1)
cagr      = round((1.0 - (target_ml / base_ml) ** (1.0 / years)) * 100.0, 2)
tq = min(tq * 1.05, 1.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `water_risk_engine` (used by 2 modules), `water_stewardship_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `water-risk` | engine:water_risk_engine, engine:water_stewardship_engine |

## 7 · Methodology Deep Dive

This is one of the better-grounded modules in this batch: it wires in **real WRI Aqueduct 4.0 water
stress data** (`WRI_AQUEDUCT_WATER_RISK` from `frontend/src/data/publicDataSeed.js`, GAP-015) for 40
named river basins, overriding synthetic placeholders wherever a basin can be matched to a country.
It still does not call the real backend `WaterRiskEngine` (`backend/services/water_risk_engine.py`,
documented in the sibling `water-risk` deep dive) — the real-data wiring happens entirely client-side
via a static import, not a live API call — but this is meaningfully more grounded than most sibling
modules that generate 100% synthetic data.

### 7.1 What the module computes

`_DEFAULT_REGIONS` (40 basins) is first generated with the seeded PRNG (`stressLevel = 1+sr(i·7)·4`,
`aqueductScore = min(5, stressLevel·0.9+sr(i·31)·0.5)`, plus `supply`/`demand`/`deficit`,
`floodRisk`/`droughtRisk`/`pollutionIndex`, water-use splits, `desalCapacity`, `recycleRate`). It is
then **overwritten in place** for any basin with a `BASIN_COUNTRY` mapping:

```js
if (w) {                                    // w = WRI_AQUEDUCT_WATER_RISK lookup by country
  r.waterStress = w.baseline_water_stress;
  r.aqueductScore = w.baseline_water_stress;
  r.droughtRisk = round(w.drought_risk × 20);
  r.floodRisk = round(w.riverine_flood_risk × 20);
  r.groundwaterDepletion = round(w.groundwater_depletion × 20);
  r.riskCategory = w.overall_water_risk_category;
}
```

All 40 basins have a `BASIN_COUNTRY` entry (Ganges→India, Colorado→USA, Murray-Darling→Australia,
etc.), so in practice **`waterStress`, `aqueductScore`, `droughtRisk`, `floodRisk`,
`groundwaterDepletion`, and `riskCategory` for all 40 regions are real WRI Aqueduct 4.0 values**, not
synthetic. `supply`/`demand`/`deficit`, water-use splits, `desalCapacity`, `recycleRate`, `waterPrice`,
`infraInvestBn`, and the 6-year `yearly` trend series remain synthetic — WRI Aqueduct doesn't publish
those metrics at basin level, so they're plausible illustrative fill-in.

### 7.2 Parameterisation

| Field | Source | Real or synthetic |
|---|---|---|
| `waterStress`, `aqueductScore` | `WRI_AQUEDUCT_WATER_RISK[country].baseline_water_stress` | **Real** (WRI Aqueduct 4.0) |
| `droughtRisk` | `w.drought_risk × 20` (0–5 scale → 0–100) | **Real**, rescaled |
| `floodRisk` | `w.riverine_flood_risk × 20` | **Real**, rescaled |
| `groundwaterDepletion` | `w.groundwater_depletion × 20` | **Real**, rescaled |
| `riskCategory` | `w.overall_water_risk_category` | **Real** |
| `supplyBCM`, `demandBCM`, `deficitBCM` | `sr()`-seeded | Synthetic |
| `desalCapacity`, `recycleRate`, `waterPrice`, `infraInvestBn` | `sr()`-seeded | Synthetic |
| `popAffectedM` | `sr()`-seeded | Synthetic |

The `×20` rescaling assumes the WRI source fields are on a 0–5 scale being mapped to a 0–100 display
scale — consistent with Aqueduct's standard 0–5 risk categorisation.

### 7.3 Calculation walkthrough

1. Basin data is built once at module load (`_DEFAULT_REGIONS`, then real-data overlay, then an
   `isIndiaMode()` branch that swaps in `adaptForWaterRisk()` India-specific data when that context
   flag is set).
2. Dashboard KPIs (`stats`) are simple means/counts over `filtered`: `avgStress`, `extreme` (count of
   "Extremely High"), `totalDeficit`, `popAffected`, `avgGroundwater`, `totalInfra`.
3. Regional Analysis tab cross-plots `droughtRisk` vs `floodRisk` (both real WRI values) and ranks
   basins by `groundwaterDepletion` (also real) — these charts are genuinely evidence-based.
4. Corporate Exposure and Projections tabs mix real (`pollutionIndex` is actually synthetic, not
   WRI-sourced) and synthetic fields without visual distinction — a reader cannot tell from the UI
   which numbers are real WRI Aqueduct data and which are illustrative fill-in.

### 7.4 Worked example

For the Ganges Basin (`BASIN_COUNTRY['Ganges Basin'] = 'India'`), if
`WRI_AQUEDUCT_WATER_RISK['India'] = { baseline_water_stress: 4.4, drought_risk: 0.65,
riverine_flood_risk: 0.55, groundwater_depletion: 0.70, overall_water_risk_category: 'Extremely High' }`
(illustrative field values consistent with India's well-documented high water stress), the module
would display: `waterStress = 4.4`, `droughtRisk = round(0.65×20) = 13`... — **wait**, this reveals a
likely scale mismatch: if `w.drought_risk` is itself already on a 0–5 or 0–1 scale, multiplying by 20
either overshoots 100 (if input is 0–5, giving up to 100 correctly) or undershoots badly (if input is
0–1 fractional, as this example assumes, giving max 20 instead of 100). Whichever convention
`WRI_AQUEDUCT_WATER_RISK` actually uses, the `×20` constant should be verified against that source
file's real value range to confirm the display isn't silently compressed.

### 7.5 Data provenance & limitations

- **Genuinely real for the 6 core risk fields** across all 40 basins — a meaningful upgrade over
  sibling water modules that are 100% synthetic.
- **Not wired to the backend `WaterRiskEngine`** — the real data comes from a static frontend JSON
  import, not a live API call, so it can't reflect the engine's basin-specific indicator overrides
  or its `proxied_indicators` transparency mechanism.
- **Supply/demand/deficit and all financial/infrastructure metrics remain synthetic** and are
  displayed with the same visual weight as the real risk fields — no "estimated" or "illustrative"
  labelling distinguishes them for the end user.
- The `×20` rescaling constant in §7.4 should be double-checked against `WRI_AQUEDUCT_WATER_RISK`'s
  actual source scale to rule out a display-compression bug.

**Framework alignment:** WRI Aqueduct 4.0 (2023) — correctly sourced as real reference data for
stress/drought/flood/groundwater/risk-category, a genuine implementation. GEMS/Water and IPCC AR6 WG1
(named in the guide as sources for the "quality" and "2050 projection" dataPoints) are **not**
represented — `pollutionIndex` and the projections tab remain fully synthetic.

## 9 · Future Evolution

### 9.1 Evolution A — Verify the ×20 rescaling, label provenance per field, and go live via the engine (analytics ladder: rung 2 → 3)

**What.** This is the batch's best-grounded water module: all 40 basins carry real
WRI Aqueduct 4.0 values for the six core risk fields via the `BASIN_COUNTRY` →
`WRI_AQUEDUCT_WATER_RISK` overlay (GAP-015). Three documented issues remain. First,
§7.4 flags a possible display-compression bug: the `×20` rescaling of
`drought_risk`/`riverine_flood_risk`/`groundwater_depletion` is only correct if the
source fields are 0–5 — if they're 0–1 fractional, every rescaled value maxes at 20
instead of 100; this must be verified against the seed file's actual ranges. Second,
§7.5 notes real and synthetic fields render "with the same visual weight" — supply/
demand/deficit, desalCapacity, waterPrice, and the whole Projections tab are
illustrative but unlabelled. Third, the real data is a static frontend import; the
module never calls the shared `WaterRiskEngine` despite listing its 16 endpoints.
Evolution A: verify/fix the rescale, add per-field provenance badges (real WRI vs
illustrative), and route basin scoring through `POST /aqueduct-risk` so the engine's
`proxied_indicators` transparency reaches the UI — also replacing the synthetic
Projections tab with the engine's calibrated `physical_risk_scenarios` RCP tables
(fixing that route's currently-failed harness status).

**How.** A range assertion in the seed loader; a `provenance` field per basin metric;
`bench_quant` pin on the Ganges lookup.

**Prerequisites.** The ×20 question resolved first — calibrating on a compressed
scale would be wrong; physical-risk-scenarios route repaired. **Acceptance:** rescaled
values span the full 0–100 range where the source justifies it; every displayed metric
shows real/illustrative provenance; the Projections tab's deltas match the engine's
`_RCP_SCENARIO_CENTRAL` tables.

### 9.2 Evolution B — Basin-evidence copilot for ESRS E3/TNFD reporting (LLM tier 2)

**What.** The module's stated output is "ESRS E3, TNFD and CDP Water with basin-level
evidence" — and uniquely in this family, it actually has real basin evidence to cite.
Evolution B is a tool-calling assistant: "which of our 40 basins are Extremely High
stress with worsening groundwater, and what does that mean for our E3 disclosure?"
It queries the basin dataset (exposed as `GET /api/v1/water-risk/basins` in Evolution
A), calls `POST /esrs-e3` and `POST /physical-risk-scenarios` for entity-level
assessments, and drafts basin-evidence paragraphs where each stress score cites WRI
Aqueduct 4.0 with the country-mapping caveat (basin values are country-level
Aqueduct records, not HydroBASINS level-6 catchments — the §4.1 claim the page
doesn't actually meet).

**How.** Tier-2 stack over the existing 16-route surface plus the new basins route;
grounding corpus is this Atlas page whose §7.2 real-vs-synthetic table becomes the
copilot's provenance map. Answers must attribute every figure to WRI-real, engine-
computed, or illustrative — three-way labelling, enforced by the validator.

**Prerequisites (hard).** Evolution A's provenance fields (the copilot cannot label
what the data layer doesn't distinguish); pgvector corpus. **Acceptance:** a drafted
E3 paragraph cites only WRI-real or engine-computed figures; asked about desalination
capacity, the copilot flags it as illustrative; basin questions outside the 40-name
set are refused with the coverage list.