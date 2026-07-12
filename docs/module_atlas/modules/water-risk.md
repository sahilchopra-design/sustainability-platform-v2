# Water Risk
**Module ID:** `water-risk` · **Route:** `/water-risk` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Corporate water risk assessment using WRI Aqueduct methodology; scores facility and supply chain exposure to physical, regulatory and reputational water risk across five sub-indicators.

> **Business value:** Water is identified as a top 3 systemic risk in the World Economic Forum Global Risks Report 2024; 40% of global industrial facilities are in high water stress catchments, rising to 60% by 2050.

**How an analyst works this module:**
- Geocode facility locations to WRI Aqueduct catchment polygons
- Extract Aqueduct sub-indicator scores for each facility
- Compute weighted overall risk score
- Identify high-priority facilities for water stewardship interventions
- Report to CDP Water Security questionnaire and ESRS E3

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANNUAL`, `API`, `BASINS`, `BASIN_BENCHMARK_KEY`, `BASIN_DATA`, `COMPANIES`, `PAGE`, `RISK_LEVELS`, `RISK_TIER_LABEL`, `SECTORS`, `TABS`, `WATER_API`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `WATER_API` | ``${API}/api/v1/water-risk`;` |
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `BASINS` | `['Ganges','Yangtze','Nile','Amazon','Colorado','Murray-Darling','Rhine','Danube','Mekong','Indus','Yellow River','Tigris-Euphrates','Niger','Zambezi','Orange'];` |
| `RISK_LEVELS` | `['Extremely High','High','Medium-High','Medium','Low-Medium','Low'];` |
| `names` | `['Nestle','Coca-Cola','PepsiCo','AB InBev','Danone','Unilever','P&G','BHP','Rio Tinto','Glencore','BASF','Dow','DuPont','Intel','TSMC','Samsung','Bayer','Syngenta','Cargill','ADM','Deere','Monsanto','Shell','TotalEnergie` |
| `sect` | `SECTORS[Math.floor(sr(i*3)*SECTORS.length)];` |
| `basin` | `BASINS[Math.floor(sr(i*7)*BASINS.length)];` |
| `BASIN_DATA` | `BASINS.map((b,i)=>({` |
| `results` | `await Promise.all(COMPANIES.map(c=>` |
| `enrichedCompanies` | `useMemo(()=>COMPANIES.map(c=>{` |
| `enrichedBasins` | `useMemo(()=>BASIN_DATA.map(b=>{` |
| `paged` | `filtered.slice(page*PAGE,page*PAGE+PAGE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE);` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.create` |
| `avgStress` | `filtered.reduce((s,c)=>s+parseFloat(c.waterStressScore),0)/filtered.length;` |
| `avgRecycle` | `filtered.reduce((s,c)=>s+parseFloat(c.recyclingRate),0)/filtered.length;` |
| `sectDist` | `useMemo(()=>{const m={};SECTORS.forEach(s=>m[s]=0);filtered.forEach(c=>m[c.sector]++);return Object.entries(m).map(([name,value])=>({name:name.length>12?name.slice(0,12)+'..':name,value}));},[filtered]);` |
| `riskDist` | `useMemo(()=>{const m={};RISK_LEVELS.forEach(r=>m[r]=0);filtered.forEach(c=>m[c.physicalRisk]++);return Object.entries(m).map(([name,value])=>({name,value}));},[filtered]);` |

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
**Frontend seed datasets:** `BASINS`, `RISK_LEVELS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Facilities in High Stress | — | WRI Aqueduct 4.0 | Proportion of facilities in high or extremely high water stress catchments (Aqueduct score >3). |
| Avg Aqueduct Score | — | WRI Aqueduct 4.0 | Portfolio-weighted mean Aqueduct risk score; 3–4 = High, 4–5 = Extremely High stress. |
| Water Withdrawal Intensity | — | Operational Data | Revenue-normalised water withdrawal; benchmark against sector median. |
- **Facility Geocodes, WRI Aqueduct 4.0 Geodata, Water Withdrawal Data** → Catchment join + Aqueduct scoring + stewardship prioritisation → **Water risk heatmap, CDP Water disclosures, ESRS E3 data package, stewardship action plans**

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
**Methodology:** Aqueduct Water Risk Score
**Headline formula:** `AWRI = Σ (Sub-indicator Score × Weight)`

Weighted composite of five sub-indicators: baseline water stress, interannual variability, seasonal variability, groundwater depletion and return flow ratio.

**Standards:** ['WRI Aqueduct 4.0 2023', 'CEO Water Mandate']
**Reference documents:** WRI Aqueduct Water Risk Atlas 4.0 2023; CEO Water Mandate Disclosure Framework; CDP Water Security Questionnaire; ESRS E3 Water and Marine Resources; Alliance for Water Stewardship Standard

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
| `water-risk-analytics` | engine:water_risk_engine, engine:water_stewardship_engine |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** A genuine, methodologically sound WRI Aqueduct 4.0 engine exists
> at `backend/services/water_risk_engine.py` (`WaterRiskEngine.assess_aqueduct_risk`), with weighted
> 7-indicator scoring and an explicit, honestly-documented proxy mechanism. **The frontend never calls
> it** — there is no `axios`/`fetch` call anywhere in `WaterRiskPage.jsx`. The page instead renders a
> fully synthetic 60-company directory built with the seeded PRNG, with no relationship to the
> backend's real indicator-weighting logic. This deep dive documents both: the real backend
> methodology (§7.2) and what the disconnected frontend actually shows (§7.3–7.4).

### 7.1 What the backend engine computes (not currently displayed)

```python
indicators[ind] = supplied[ind] if ind in supplied else country_base   # NEVER a random draw
overall = Σ indicators[k] × AQUEDUCT_WEIGHTS[k]                        # weighted composite, 7 indicators
risk_tier = band(overall)  # Low → Extremely High, with an explicit ≥4.0 override to "Extremely High"
```

Critically, when an indicator isn't supplied by the caller, the engine falls back to a **deterministic
country reference base-stress level** (`COUNTRY_STRESS[country] × 5`), explicitly documented in the
docstring as "never a random draw" — this is a materially more honest design than most sibling
modules' seeded-PRNG fallbacks, and the engine tracks which indicators were proxied (`proxied_indicators`)
so a caller can distinguish real Aqueduct lookups from country-level defaults.

### 7.2 Backend parameterisation

| Element | Detail |
|---|---|
| `AQUEDUCT_INDICATORS` | 7 WRI Aqueduct 4.0 physical indicators (water stress, groundwater decline, coastal eutrophication, untreated wastewater, etc.), each 0–5 |
| `AQUEDUCT_WEIGHTS` | Weighted combination for `overall_score` |
| `COUNTRY_STRESS` multipliers | 0.50 (unlisted default) up to ~1.90 ("Extreme") — used only as the deterministic proxy base |
| `risk_tier` bands | `RISK_TIER_BANDS` lookup + explicit `≥4.0 → "Extremely High"` override |
| `basin_specific_factors` | Rule-based flags (e.g. groundwater_decline > 3.0 → "Groundwater over-exploitation risk") |

### 7.3 What the frontend actually displays (disconnected synthetic data)

60 synthetic companies (`COMPANIES`), named after real corporates (Nestlé, Coca-Cola, BHP, Shell,
Thames Water, …) but with entirely random attributes: `waterWithdrawal`/`consumption`/`discharge`/
`intensity` (all independent `sr()` draws), `waterStressScore` (`sr(i·23)·100`, a flat 0–100 uniform,
unrelated to the company's `primaryBasin`), `physicalRisk`/`regulatoryRisk`/`reputationalRisk` (each
an independent random pick from the 6 `RISK_LEVELS`, so a company can show "Low" physical risk and
"Extremely High" regulatory risk with no logical linkage), `cdpScore` (random letter grade), `sbtnStatus`.
`BASIN_DATA` (15 named basins) is a second, entirely independent synthetic dataset — a company's
`primaryBasin` field never actually looks up `BASIN_DATA` for that basin's real stress level.

### 7.4 Worked example

If the backend engine assessed a company in India (`country_code='IN'`) with no supplied Aqueduct
indicators, `country_base = COUNTRY_STRESS['IN'] × 5` (a high multiplier given India's documented
water stress) would deterministically drive every one of the 7 proxied indicators to the same
elevated value, producing a consistent, explainable "Extremely High" tier with a `data_note` flagging
that all indicators were proxied. **The frontend, by contrast**, for the same nominal "India" company
(if `country` were even tracked, which it isn't in `COMPANIES`), would show a `waterStressScore`
drawn independently at `sr(i·23)·100` — potentially "Low" for an Indian company and "Extremely High"
for a Norwegian one, purely by chance of company index `i`, with no country signal at all.

### 7.5 Data provenance & limitations

- **The backend engine's country-stress proxying is a genuinely defensible design** (deterministic,
  documented, distinguishes real from proxied data) — but it is not reachable from this page.
- **The frontend's 60 companies and 15 basins are both fully synthetic and mutually disconnected** —
  no company's basin, sector, or stress score is derived from any real WRI Aqueduct value, despite
  real basin names (Ganges, Colorado, Murray-Darling, etc.) suggesting otherwise to a reader.
- The sibling module `water-risk-analytics` (see its own deep dive) *does* wire in real
  `WRI_AQUEDUCT_WATER_RISK` reference data for 40 named basins — that data source, or the backend
  engine here, would be the natural fix for this module's synthetic gap.

**Framework alignment:** WRI Aqueduct 4.0 (2023) — correctly weighted and deterministically proxied
in the **backend only**; CDP Water Security and Alliance for Water Stewardship (both named in the
guide) appear only as label/badge text in the frontend, with no scoring logic behind them.
**Recommended remediation:** call `WaterRiskEngine.assess_aqueduct_risk()` per company (using each
company's real country + sector) instead of generating `COMPANIES` client-side, and join `BASIN_DATA`
to `WRI_AQUEDUCT_WATER_RISK` (already available via the `water-risk-analytics` module) rather than
generating a second independent basin dataset.

## 9 · Future Evolution

### 9.1 Evolution A — Connect the page to its own engine and repair the POST surface (analytics ladder: rung 1 (UI) / 2 (engine) → 3)

**What.** The backend is one of the platform's most honest: `assess_aqueduct_risk`
does weighted 7-indicator Aqueduct 4.0 scoring with a deterministic country-stress
proxy that is documented "never a random draw" and tracks `proxied_indicators` — yet
§7's flag shows the frontend contains **no axios/fetch call at all**, rendering 60
synthetic companies whose `waterStressScore` is a flat `sr()` draw unrelated to their
`primaryBasin` (an Indian company can show "Low" and a Norwegian one "Extremely High"
by index luck, per §7.4). The lineage harness also reports `physical-risk-scenarios`
failed and six POSTs skipped. Evolution A executes §7.5's own remediation: call
`assess_aqueduct_risk()` per company with real country+sector; join `BASIN_DATA` to
the `WRI_AQUEDUCT_WATER_RISK` reference data already wired into the sibling
`water-risk-analytics` module (which shares both engines — blast radius 1); surface
`proxied_indicators` as a data-quality badge per row; and fix the failing
physical-risk-scenarios route.

**How.** Frontend rewiring (the 16 endpoints already exist across two route files);
company records gain `country_code` (currently absent); rung-3 step: pin the
India-proxy worked example from §7.4 in `bench_quant` and validate `COUNTRY_STRESS`
multipliers against published Aqueduct country rankings.

**Prerequisites.** The disconnected-page defect acknowledged; the three mutually
independent risk fields (physical/regulatory/reputational as unlinked random picks)
replaced by engine outputs. **Acceptance:** lineage harness passes the POST surface;
an India-based company always outranks a Norway-based one on proxied stress; each row
shows whether its indicators are Aqueduct-sourced or country-proxied.

### 9.2 Evolution B — CDP/ESRS E3 disclosure assistant (LLM tier 2)

**What.** The engine already computes the exact artefacts water disclosure teams
need — CDP grade bands with `gap_to_a_list`, ESRS E3 completeness with honest
not-yet-disclosed handling, water footprint with AWARE scarcity adjustment, financial
impact (revenue-at-risk, compliance cost, insurance uplift) — across 16 endpoints.
Evolution B is a tool-calling assistant that runs a company's full disclosure
workflow: "assess our 12 facilities, tell me what's blocking a CDP A-, and draft the
ESRS E3 quantitative section." It orchestrates `POST /aqueduct-risk`, `/cdp-water`,
`/esrs-e3`, `/water-footprint`, and `/materiality`, then drafts disclosure text where
every m³, score, and grade traces to a tool response — and where the engine's null-
not-fabricated convention (CEO Water Mandate score returned null when absent) is
carried through as explicit "not yet disclosed" statements rather than papered over.

**How.** Tier-2 stack: tool schemas from the existing OpenAPI operations (unusually
rich here — 16 routes); grounding corpus is this Atlas page plus the two `/ref/*`
methodology payloads. The `proxied_indicators` field feeds the mandatory data-quality
caveat in any drafted disclosure.

**Prerequisites (hard).** Evolution A's POST repairs and page rewiring (a copilot and
a page showing different numbers for the same company is disqualifying); facility
geocodes or country codes per entity. **Acceptance:** drafted E3 text distinguishes
measured, proxied, and undisclosed values explicitly; the CDP gap analysis cites
`gap_to_a_list` from the payload; asked for a basin's raw Aqueduct sub-indicator the
engine wasn't given, the assistant reports the proxy basis instead of a fabricated
precision.