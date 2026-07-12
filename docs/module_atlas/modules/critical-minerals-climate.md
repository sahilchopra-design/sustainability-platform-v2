# Critical Minerals Climate Analytics
**Module ID:** `critical-minerals-climate` · **Route:** `/critical-minerals-climate` · **Tier:** A (backend vertical) · **EP code:** EP-DL5 · **Sprint:** DL

## 1 · Overview
Analyses supply security, geopolitical risks, and sustainability of critical minerals essential for clean energy transition (lithium, cobalt, nickel, rare earths, copper). Models supply-demand gaps, price volatility, ESG risk in mining, and circular economy solutions.

> **Business value:** Critical for clean energy investors, battery supply chain companies, automotive OEMs, and sovereign resource security analysts. Provides IEA-aligned demand forecasting, EU CRM Act compliance analysis, and supply chain ESG due diligence for responsible sourcing strategies.

**How an analyst works this module:**
- Select critical mineral and review supply-demand outlook
- Calculate supply gap under IEA transition scenarios
- Assess geopolitical concentration and ESG risk in supply chain
- Model circular economy recycling and substitution options
- Generate EU CRM Act compliance gap report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ALL_COUNTRIES`, `COUNTRIES_BY_REGION`, `KpiCard`, `MINERALS`, `PROJECTS`, `REGIONS`, `SUPPLY_RISK_TIERS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `mineral` | `MINERALS[Math.floor(sr(i * 7) * MINERALS.length)];` |
| `region` | `REGIONS[Math.floor(sr(i * 11) * REGIONS.length)];` |
| `country` | `countryPool[Math.floor(sr(i * 13) * countryPool.length)];` |
| `supplyConcentration` | `Math.round(500 + sr(i * 17) * 4500);` |
| `totalReserves` | `(filtered.reduce((s, p) => s + p.reservesMt, 0)).toFixed(0);` |
| `avgCarbonIntensity` | `(filtered.reduce((s, p) => s + p.carbonIntensity, 0) / n).toFixed(1);` |
| `avgSupplyConcentration` | `Math.round(filtered.reduce((s, p) => s + p.supplyConcentration, 0) / n);` |
| `avgTransitionScore` | `(filtered.reduce((s, p) => s + p.transitionCriticalScore, 0) / n).toFixed(1);` |
| `evDemandMultiplier` | `(1 + (evAdoption / 100) * 2).toFixed(2);` |
| `carbonCostM` | `((filtered.reduce((s, p) => s + p.productionKt * p.carbonIntensity, 0) * carbonPrice) / 1e6).toFixed(0);` |
| `mineralProdData` | `MINERALS.map(m => {` |
| `mineralHHIData` | `MINERALS.map(m => {` |
| `mineralEVData` | `MINERALS.map(m => {` |
| `scatterData` | `filtered.map(p => ({ x: p.carbonIntensity, y: p.recyclingRate, name: p.name, mineral: p.mineral }));` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |
| `avgWI` | `ps.length ? Math.round(ps.reduce((s, p) => s + p.waterIntensity, 0) / ps.length) : 0;` |
| `maxWI` | `Math.max(...MINERALS.map(mm => {` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/critical-minerals/assess` | `assess_critical_minerals_endpoint` | api/v1/routes/critical_minerals.py |
| POST | `/api/v1/critical-minerals/supply-chain-map` | `supply_chain_map_endpoint` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/iea-minerals` | `get_iea_minerals` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/eu-crm-act` | `get_eu_crm_act` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/irma-criteria` | `get_irma_criteria` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/oecd-5step` | `get_oecd_5step` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/country-concentration` | `get_country_concentration` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/mineral-profile/{mineral_name}` | `get_single_mineral_profile` | api/v1/routes/critical_minerals.py |

### 2.3 Engine `critical_minerals_engine` (services/critical_minerals_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_seed_float` | entity_id, key, lo, hi | Deterministic seeded float — reproducible demo data. |
| `_weighted_irma_score` | data, eid |  |
| `_irma_tier` | score |  |
| `_oecd_5step_scores` | data, eid |  |
| `_oecd_composite` | step_scores |  |
| `_iea_mineral_composite` | minerals | Aggregate IEA scores across a portfolio of minerals (simple average). |
| `_crm_tier` | score |  |
| `assess_critical_minerals` | request_data | Full critical minerals risk assessment per: IEA CRM 2024 / EU CRM Act 2024/1252 / IRMA Standard v1.0 / OECD DDG 5-step. Returns CriticalMineralsResult dataclass. |
| `map_supply_chain` | request_data | Map mineral supply chain tiers for a specific mineral and technology application. Identifies conflict region exposure, RMAP audit need, and OECD Annex II risks. |
| `get_mineral_profile` | mineral_name | Return IEA CRM 2024 profile and EU CRM Act status for a single mineral. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `EU` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `MINERALS`, `REGIONS`, `SUPPLY_RISK_TIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Lithium Demand Increase | — | IEA Critical Minerals 2023 | Lithium demand for batteries grows 42× by 2040 under IEA Net Zero scenario — concentrated in 3 countries |
| Cobalt Supply Concentration | — | USGS Minerals Commodity Summary 2024 | 73% of global cobalt from Democratic Republic of Congo — high ESG and geopolitical risk |
| EU CRM Act Benchmarks | — | EU Critical Raw Materials Act 2023 | EU targets: extract 10%, process 40%, recycle 15% of annual critical mineral consumption domestically by 2030 |
- **USGS/BGS production and reserve data by mineral** → Supply gap modelling → **Supply-demand balance under IEA transition scenarios**
- **Mine-level ESG assessment data (RMI, Sustainalytics)** → Supply chain ESG risk → **Weighted ESG risk score by mineral and supply chain**
- **Recycling rates and battery chemistry evolution** → Circular economy modelling → **Recycled content contribution to supply by decade**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/critical-minerals/ref/country-concentration** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'mineral_count', 'concentration_analysis', 'eu_65pct_limit_breaches', 'breach_count', 'hhi_classification_thresholds', 'conflict_high_risk_countries'], 'n_keys': 8}`

**GET /api/v1/critical-minerals/ref/eu-crm-act** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'effective_date', 'strategic_mineral_count', 'critical_mineral_count', 'strategic_minerals', 'critical_minerals', 'eu_benchmark_targets', 'mineral_detail', 'compliance_obligations'], 'n_keys': 10}`

**GET /api/v1/critical-minerals/ref/iea-minerals** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'reference_year', 'mineral_count', 'minerals', 'transition_mineral_intensity', 'criticality_composite_methodology'], 'n_keys': 7}`

**GET /api/v1/critical-minerals/ref/irma-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'standard_version', 'chapter_count', 'certification_tiers', 'chapters', 'applicability', 'third_party_verification', 'conflict_mineral_overlap'], 'n_keys': 9}`

**GET /api/v1/critical-minerals/ref/mineral-profile/{mineral_name}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/critical-minerals/ref/oecd-5step** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'regulatory_underpinning', 'step_count', 'steps', 'conflict_high_risk_countries', 'recognised_certification_schemes', 'minimum_compliance_score'], 'n_keys': 8}`

**POST /api/v1/critical-minerals/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'entity_id', 'entity_name', 'sector', 'minerals_assessed', 'iea_crm_2024', 'eu_crm_act', 'irma', 'oecd_ddg', 'transition_exposure', 'supply_chain_metrics', 'overall', 'key_findings', 'recommendations', 'standards_applied'], 'n_keys': 15}`

**POST /api/v1/critical-minerals/supply-chain-map** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Critical Mineral Supply Risk
**Headline formula:** `SupplyRisk_i = (DemandGrowth_i - SupplyCapacity_i) / SupplyCapacity_i × ConcentrationHHI_i; ESGRisk_mining = Σ [w_j × ESGScore_j × ProductionShare_j]`

Supply gap combines demand growth from clean energy deployment with existing capacity; concentration HHI captures geopolitical supply security; ESG risk weights producer country ESG scores by production share

**Standards:** ['IEA Critical Minerals for Clean Energy Transitions 2023', 'EU Critical Raw Materials Act 2023', 'OECD Due Diligence Guidance for Responsible Mineral Supply Chains', 'Responsible Minerals Initiative (RMI)']
**Reference documents:** IEA — Critical Minerals Market Review 2023; EU Critical Raw Materials Act — Regulation (EU) 2024/1252; OECD Due Diligence Guidance for Responsible Mineral Supply Chains (4th Edition); World Bank Minerals for Climate Action Report 2020

**Engine `critical_minerals_engine` — extracted transformation lines:**
```python
total_m  = round(ev_m + solar_m + wind_m + grid_m, 2)
disruption_prob = round(min((avg_hhi / 100.0) * (iea_geo / 100.0) * 15.0, 35.0), 1)
oecd_gap_score = round((1.0 - oecd_composite) * 100.0, 1)
concentration_score = round(min(avg_hhi / 100.0, 100.0), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **5** other module(s).
**Shared engines (edits propagate!):** `critical_minerals_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `critical-minerals` | engine:critical_minerals_engine, table:EU |
| `ai-governance` | table:EU |
| `api-gateway-monitor` | table:EU |
| `climate-policy` | table:EU |
| `climate-policy-intelligence` | table:EU |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-DL5) describes a *Critical Mineral Supply Risk*
> engine — `SupplyRisk_i = (DemandGrowth_i − SupplyCapacity_i)/SupplyCapacity_i × HHI_i` and an
> ESG-weighted mining-risk score. **Neither formula is in the code.** `CriticalMineralsClimatePage.jsx`
> builds 75 fully synthetic mine projects with the platform PRNG `sr(s)=frac(sin(s+1)×10⁴)` and every
> supply-concentration, carbon-intensity, water, tailings, EV-demand, recycling and just-transition
> figure is a seeded number. The listed backend engine (`critical_minerals_engine.py`) — which *does*
> hold real IEA HHI and country shares — is not imported. The page is a filterable descriptive
> dashboard over fabricated data.

### 7.1 What the module computes

A fixed universe of 75 projects (`PROJECTS`, seeded on index `i`), each with:
`supplyConcentration ∈ [500, 5000]` (→ risk tier), `reservesMt`, `productionKt`, `carbonIntensity`,
`waterIntensity`, `tailingsRisk`, `evDemandGrowth`, `recyclingRate`, `justiceConcerns`,
`transitionCriticalScore`. Eight tabs aggregate the filtered subset. The genuine computations are
simple averages/sums plus two interactive scalars:

```js
evDemandMultiplier = (1 + (evAdoption/100)·2)                     // 5%→1.10× , 80%→2.60×
carbonCostM        = Σ(productionKt·carbonIntensity)·carbonPrice / 1e6   // $M carbon liability
supplyRisk         = conc<1500 Low | <2500 Med | <3500 High | else Critical  // HHI tiers
```

### 7.2 Parameterisation / scoring rubric

| Field | Formula | Provenance |
|---|---|---|
| Supply concentration (HHI proxy) | `round(500 + sr(i×17)×4500)` | synthetic seeded |
| Carbon intensity | `2 + sr(i×19)×48` tCO₂e/t | synthetic seeded |
| Water intensity | `50 + sr(i×23)×950` (units unlabelled) | synthetic seeded |
| Tailings risk | `1 + sr(i×29)×9` (1–10) | synthetic seeded |
| EV demand growth | `5 + sr(i×31)×45` % | synthetic seeded |
| Recycling rate | `round(5 + sr(i×37)×65)` % | synthetic seeded |
| Transition-critical score | `round(30 + sr(i×43)×65)` | synthetic seeded |
| Risk tiers 1500/2500/3500 | hard cuts | HHI market-structure convention (DOJ/FTC bands are 1500/2500) |

Mineral, region and country are also drawn by `sr()` from fixed lists, so the geographic
attribution is random rather than reflecting real deposit locations.

### 7.3 Calculation walkthrough

Filters (mineral/region/risk) subset `PROJECTS` → KPI cards recompute `avgCarbonIntensity`,
`avgSupplyConcentration`, `avgTransitionScore`, `carbonCostM` over the subset (guarded by
`n = max(1, len)`). The two sliders (`evAdoption`, `carbonPrice`) drive the multiplier and carbon-cost
cards live. Per-mineral bar charts (`mineralProdData`, `mineralHHIData`, `mineralEVData`) group and
average within each mineral; the carbon-vs-recycling scatter plots each project.

### 7.4 Worked example (carbon cost)

Take the unfiltered set with (illustratively) `Σ productionKt·carbonIntensity ≈ 1.9×10⁶` t·(tCO₂/t)
and `carbonPrice = 65`:
```
carbonCostM = 1.9e6 × 65 / 1e6 = $123.5M   (rounds to "$124M")
```
At `carbonPrice = 130` it doubles to ~$247M — a linear carbon-price sensitivity, correct arithmetic
on synthetic tonnages. `evDemandMultiplier` at `evAdoption=30` = `1+0.30×2 = 1.60×`.

### 7.5 Data provenance & limitations

- **All 75 projects are synthetic** (`sr()` PRNG); mineral/country pairings are random, not real
  deposits. HHI, carbon and water intensities carry no external calibration.
- The genuine IEA reference dataset in `critical_minerals_engine.py` (real HHI 7200 lithium, 8900
  cobalt; real top-3 shares) is available but unused — the page could be re-anchored to it directly.
- Water-intensity units unlabelled; tailings and justice scores are 1–10 heuristics with no standard.

**Framework alignment:** IEA *Critical Minerals for Clean Energy Transitions 2024* (mineral list,
HHI concept) · EU CRMA Reg (EU) 2024/1252 (supply-security framing) · HHI (Herfindahl-Hirschman,
1500/2500 concentration bands) · GISTM 2020 (tailings, referenced conceptually by "tailingsRisk").
The page names these frameworks but implements only tier cut-offs over seeded data.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The displayed supply-risk, carbon-cost and
EV-demand quantities have no calibrated model behind them.

**8.1 Purpose & scope.** Produce a defensible supply-security + climate-footprint score per mineral
and per producing region, and a portfolio carbon-liability estimate, across the 8 tracked minerals.

**8.2 Conceptual approach.** Two coupled sub-models mirroring **IEA CRM supply-risk** and **S&P
Trucost mine-level carbon**: (a) a supply-risk index from real HHI + governance overlays (WGI,
INFORM), (b) a life-cycle carbon-intensity model per mineral/route calibrated to peer-reviewed LCA.
Carbon liability then prices production × intensity at a carbon price.

**8.3 Mathematical specification.**
```
HHI_m      = Σ_c share²_{c,m}·10⁴                              # real USGS shares
GeoRisk_m  = Σ_c share_{c,m}·(1 − WGI_c_normalised)            # governance-weighted
SupplyRisk_m = 0.6·norm(HHI_m) + 0.4·GeoRisk_m
CI_{m,route}(LCA)  →  ProjectCI = Σ_route mix·CI_route          # tCO2e/t, IEA/ecoinvent
CarbonLiability = Σ_project Production·ProjectCI·CarbonPrice
EVDemand_m(t) = Base_m·(1 + EVpenetration(t)·Elasticity_m)
```

| Parameter | Source |
|---|---|
| Country shares `share_{c,m}` | USGS MCS 2024 (real; in engine) |
| Governance `WGI_c` | World Bank Worldwide Governance Indicators |
| Route carbon intensity | IEA / ecoinvent / Skarn Associates mine-level LCA |
| Carbon price | EU ETS / ICE settlement, or user scenario |
| EV elasticity | IEA EV Outlook mineral-intensity coefficients |

**8.4 Data requirements.** Per-mine production, ore route, energy mix, country; LCA intensity
factors; carbon-price curve. Vendors: Skarn Associates (mine carbon), Benchmark Mineral
Intelligence; free: USGS, IEA, World Bank WGI. The engine already supplies HHI and shares.

**8.5 Validation & benchmarking.** Reconcile mineral HHI to USGS; benchmark route carbon intensities
against Skarn/Trucost published ranges (e.g. Class-1 nickel HPAL vs sulphide); backtest EV-demand
elasticity against 2020–2024 observed lithium demand.

**8.6 Limitations & model risk.** LCA intensity varies 3–5× by route (laterite HPAL nickel vs
sulphide) — a single per-mineral scalar is inadequate; governance overlays are slow-moving and miss
acute export-ban shocks. Fallback: publish intensity ranges and flag routes lacking primary LCA.

## 9 · Future Evolution

### 9.1 Evolution A — Real projects, engine-anchored risk (analytics ladder: rung 1 → 2)

**What.** EP-DL5's 75 mine projects are fully synthetic — mineral/country pairings
are random rather than real deposits, HHI proxies are `sr()` draws, water intensity
has unlabelled units — while §7.5 notes the fix sitting one import away: "the genuine
IEA reference dataset in `critical_minerals_engine.py` (real HHI 7200 lithium, 8900
cobalt; real top-3 shares) is available but unused". The guide's
`SupplyRisk = (DemandGrowth − Capacity)/Capacity × HHI` and ESG-weighted mining risk
are absent. Evolution A anchors the page to the engine and replaces the fabricated
project universe with real assets.

**How.** (1) Engine anchoring: mineral-level HHI, shares, and demand multipliers
from `GET /ref/iea-minerals` and `/ref/country-concentration` (both passing the
harness) — coordinated with the sibling `critical-minerals` module's identical
rewiring, since the shared engine serves both. (2) Project universe: replace the 75
seeded projects with a curated real-asset table (the S&P/USGS-derived major-mines
lists are public at the top-of-market level; ~50 named mines with real mineral,
country, and capacity beats 75 random ones). (3) Implement the supply-risk formula
per mineral from engine demand growth and capacity; ESG mining risk =
Σ w_j × country-ESG × production share using WGI/EPI country scores (curated,
cited). (4) The two genuinely interactive scalars — the EV-adoption multiplier and
`carbonCostM = Σ(production × intensity) × price` — survive, now over real
production figures with labelled units.

**Prerequisites (hard).** PRNG purge; real-asset table curation with source
citations; cross-module coordination on the shared engine. **Acceptance:** lithium's
displayed HHI equals the engine's 7200; each project row names a real mine with a
citable source; the supply-risk formula reproduces by hand for cobalt.

### 9.2 Evolution B — Responsible-sourcing gap reporter (LLM tier 1 → 2)

**What.** The module's workflow ends at "generate EU CRM Act compliance gap report" —
unbuilt today. Evolution B drafts it from real state: the (post-Evolution A) computed
supply risks against the CRMA Art. 5 benchmarks, the OECD due-diligence step
assessment from the engine's 5-step composite, ESG mining-risk hotspots by producing
country, and the circular-economy levers (recycling rates from the engine's real
tables) — each figure tool-traced, each regulatory requirement quoted from the
`/ref/eu-crm-act` endpoint rather than paraphrased.

**How.** Tier 1 for explanation over the wired page; tier 2 for the report: tool
calls to `POST /assess` and the ref endpoints, output through the report-studio
layer. Shared grounding with the sibling `critical-minerals` module's analyst is
intentional — same engine, same corpus, different framing (this module is
supply-security and ESG-in-mining; the sibling is criticality assessment) — one
prompt family, two configurations, per the roadmap's per-desk specialization
pattern.

**Prerequisites (hard).** Evolution A (a compliance gap report over random
mineral/country pairings would be fiction with a regulation's name on it); the
`/ref/mineral-profile/{name}` route fix shared with the sibling. **Acceptance:**
report figures match tool outputs; CRMA benchmark citations are verbatim from the
ref endpoint; countries appear in the ESG-hotspot section only with cited scores.