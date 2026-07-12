# Critical Minerals Analytics
**Module ID:** `critical-minerals` · **Route:** `/critical-minerals` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Projects clean energy critical mineral demand through 2050 under IEA and BNEF transition scenarios, tracks recycling rate evolution and secondary supply contributions, and analyses investment gaps in mining and processing capacity required to meet energy transition demand.

> **Business value:** Enables clean energy investors and corporate strategists to quantify mineral supply risks for specific technologies, size investment gaps, and develop procurement strategies resilient to the structural supply-demand imbalances of the energy transition.

**How an analyst works this module:**
- Select mineral from the filter panel to view demand projection charts
- Demand Build-Up tab decomposes demand by clean technology application and scenario
- Supply Pipeline tab shows committed mine production and processing capacity
- Recycling tab models secondary supply contribution under different recycling rate trajectories
- Investment Gap tab quantifies capex shortfall and maps to private and public financing sources
- Commodity Price Outlook tab links supply-demand balance to price trajectory models

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `CRM_API`, `EU_CRMA_ANNEX_II_CRITICAL`, `EU_CRMA_ANNEX_I_STRATEGIC`, `Inp`, `KpiCard`, `LiveBadge`, `MINERAL_OPTIONS`, `MINERAL_TO_BACKEND`, `Row`, `SECTOR_OPTIONS`, `Section`, `Sel`, `TABS`, `TECH_OPTIONS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTOR_OPTIONS` | 6 | `label` |
| `MINERAL_OPTIONS` | 11 | `label` |
| `TECH_OPTIONS` | 6 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `CRM_API` | ``${API}/api/v1/critical-minerals`;` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `composite` | `Math.round(subScores.reduce((s, x) => s + x.value, 0) / 4);` |
| `strategic` | `EU_CRMA_ANNEX_I_STRATEGIC.has(mineral); // Annex I: Strategic` |
| `critical` | `EU_CRMA_ANNEX_II_CRITICAL.has(mineral);   // Annex II: Critical` |
| `compliance` | `Math.round(seed(mi * 29) * 35 + 50);` |
| `total` | `parseFloat(exposures.reduce((s, e) => s + e.value, 0).toFixed(1));` |
| `hhi` | `total > 0 ? parseFloat((exposures.reduce((s, e) => s + Math.pow(e.value / total, 2), 0) * 10000).toFixed(0)) : 0;` |
| `priceVolatility` | `years.map((yr, i) => ({` |
| `supplyDisruptionProb` | `Math.round(seed(mi * 107) * 35 + 15);` |
| `top3CountryShare` | `Math.round(seed(mi * 109) * 30 + 55);` |
| `geo` | `risk ? risk.conflict_risk.replace('_', ' ') : 'n/a';` |
| `geoLabel` | `row.geo.replace(/^\w/, c => c.toUpperCase());` |
| `geoColor` | `/very high/i.test(row.geo) ? 'red' : /high/i.test(row.geo) ? 'orange' : /medium/i.test(row.geo) ? 'yellow' : 'green';` |

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
**Frontend seed datasets:** `MINERAL_OPTIONS`, `SECTOR_OPTIONS`, `TABS`, `TECH_OPTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Lithium Demand Growth (NZE 2040) | — | IEA Critical Minerals 2024 | Cumulative demand increase for lithium carbonate equivalent under Net Zero Emissions scenario |
| Cobalt Demand Peak | — | IEA / BNEF | Peak cobalt demand before recycling and chemistry innovation (NMC to LFP shift) reduces intensity |
| Battery Recycling Rate (2040) | — | IEA Critical Minerals | Projected secondary supply contribution from EV and storage battery recycling by 2040 |
| Mining Investment Gap (2024–2035) | — | IEA / World Bank | Gap between committed mining capex and investment needed to meet NZE scenario demand |
| Nickel Supply Concentration | — | USGS 2024 | Indonesia’s dominance of Class-1 nickel supply for battery-grade production |
- **IEA technology deployment scenarios** → Apply mineral intensity coefficients per technology type → **Technology-specific mineral demand by year**
- **Mine production and project pipeline data** → Aggregate committed production, compute supply ramp-up curve → **Mineral supply projection by scenario**
- **IEA recycling rate projections** → Model secondary supply from end-of-life volumes × recovery rate → **Recycling contribution to supply balance**

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
**Methodology:** Critical Mineral Demand Projection Model
**Headline formula:** `Demand(t) = Σ_tech (Deployment(t) × MineralIntensity(tech) × (1 - RecyclingRate(t)))`

Technology deployment follows IEA scenario pathways (NPS, SDS, NZE). Mineral intensity per technology uses IEA material composition data (e.g., NMC811 battery: 8.8kg/kWh nickel, 1.1kg/kWh cobalt, 0.9kg/kWh lithium). Recycling rate increases over time as end-of-life battery and solar panel volumes grow (battery recycling: 5% in 2025 to 40% in 2040 under SDS). Supply gap = projected demand minus committed mine supply.

**Standards:** ['IEA Critical Minerals Outlook 2024', 'BNEF Electric Vehicle Outlook', 'BloombergNEF Energy Storage Monitor']
**Reference documents:** IEA The Role of Critical Minerals in Clean Energy Transitions 2024; BNEF New Energy Outlook â€” Critical Materials 2024; USGS Mineral Commodity Summaries 2024; World Bank Minerals for Climate Action Report

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
| `critical-minerals-climate` | engine:critical_minerals_engine, table:EU |
| `ai-governance` | table:EU |
| `api-gateway-monitor` | table:EU |
| `climate-policy` | table:EU |
| `climate-policy-intelligence` | table:EU |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *Critical Mineral
> Demand Projection Model* — `Demand(t) = Σ_tech Deployment(t) × MineralIntensity(tech) × (1 −
> RecyclingRate(t))`, IEA scenario pathways, supply gaps and investment gaps. **The React page
> implements none of that.** The frontend (`CriticalMineralsPage.jsx`) fabricates every score with a
> seeded PRNG and never calls the demand-projection formula. Ironically a *real* IEA-calibrated
> reference dataset exists in the backend engine (`critical_minerals_engine.py`) — 15 minerals with
> genuine HHI, top-3 country shares, demand-growth multipliers and recycling rates — but the page
> does **not** consume it: it fires one fire-and-forget `POST /assess` whose response is discarded
> ("`API fallback to seed data`"). The sections below document the page as it actually behaves and
> flag where the engine's real numbers should replace the PRNG.

### 7.1 What the module computes

Five tabs, each derived from the selected `mineral` via the platform PRNG
`seed(s) = frac(sin(s+1)×10⁴)` seeded on the mineral's 1-based index `mi`:

```js
// IEA criticality — 4 sub-scores averaged
subScores = [demand_growth, supply_concentration, geopolitical_risk, substitutability]
composite = round(Σ subScores.value / 4)
tier      = composite≥80 Critical | ≥65 High | ≥50 Medium | else Low

// Supply-chain HHI on 5 tech exposures (this IS a real formula, on fake inputs)
total = Σ exposures.value
hhi   = total>0 ? round(Σ (value/total)² × 10000) : 0     // Herfindahl-Hirschman
```

Only the EU CRMA Annex-I/II strategic/critical flags and the HHI arithmetic are genuine; every
numeric magnitude fed into them is synthetic.

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula (from code) | Provenance |
|---|---|---|
| IEA demand growth | `round(seed(mi×7)×40+55)` → 55–95 | synthetic seeded |
| IEA supply concentration | `round(seed(mi×11)×35+50)` → 50–85 | synthetic seeded |
| IEA geopolitical risk | `round(seed(mi×13)×38+45)` → 45–83 | synthetic seeded |
| IEA substitutability | `round(seed(mi×17)×30+40)` → 40–70 | synthetic seeded |
| EU strategic flag | `EU_CRMA_ANNEX_I_STRATEGIC.has(mineral)` | **real** — Reg (EU) 2024/1252 Annex I |
| EU critical flag | `EU_CRMA_ANNEX_II_CRITICAL.has(mineral)` | **real** — Annex II |
| CRM compliance | `round(seed(mi×29)×35+50)` → 50–85 | synthetic seeded |
| IRMA 6 areas | `round(seed(mi×5x)×~30+~47)` | synthetic seeded |
| Supply-disruption prob | `round(seed(mi×107)×35+15)` → 15–50% | synthetic seeded |
| Top-3 country share | `round(seed(mi×109)×30+55)` → 55–85% | synthetic seeded |

The IEA framework reference card (Demand 30%, Concentration 30%, Geopolitical 25%,
Substitutability 15%) is displayed as static text but the composite is a flat 4-way average, so the
displayed weights are **not applied**.

### 7.3 Calculation walkthrough

`mineral` selector → `mi = index+1` → each tab's `get*Data(mineral)` reseeds the PRNG on `mi ×
prime`. Tiers are threshold cuts on the resulting composites. Producer-country table (China/DRC/
Australia/Chile/Russia) reseeds shares on `supply.total × prime`. The HHI is the only value that
propagates a computed quantity (`total`) into a downstream metric.

### 7.4 Worked example (lithium, `mi = 1`)

| Step | Computation | Result |
|---|---|---|
| Demand growth | `round(frac(sin(8)×10⁴)×40+55)` = round(0.848×40+55) | ≈ **89** |
| Supply conc. | `round(frac(sin(12)×10⁴)×35+50)` | ≈ **68** |
| Geo risk | `round(frac(sin(14)×10⁴)×38+45)` | ≈ **83** |
| Substitutability | `round(frac(sin(18)×10⁴)×30+40)` | ≈ **63** |
| Composite | `(89+68+83+63)/4` | **75.75 → 76** |
| Tier | 76 ≥ 65 | **High** |
| EU strategic | `'lithium' ∈ Annex I` | **Yes** |

The engine's *real* lithium record would instead report composite 88, HHI 7200, top-3 = Australia
47 / Chile 26 / China 15 — materially different and correctly sourced.

### 7.5 Backend engine (unused by page)

`assess_critical_minerals()` is a genuine multi-standard model: IEA composite (portfolio average of
real per-mineral scores), EU CRMA compliance (0.40 audit + 0.30 strategic + 0.30 concentration,
with the real 65% single-country breach test on `top3_country_share_pct`), IRMA weighted score
(Ch2 0.10 / Ch3 0.15 / Ch4 0.15 / Ch5 0.15 / Ch6 0.25 / Ch7 0.20 — matches IRMA v1.0 chapter
weights), OECD 5-step composite (0.20/0.20/0.25/0.20/0.15), and overall `crm_risk_score = IEA×0.40 +
OECD_gap×0.30 + concentration×0.30`. Where fields are absent it falls back to `_seed_float` (a
hash-based deterministic demo value) — so even the engine synthesises inputs, but its *reference
tables* (HHI, shares, recycling rates) are real IEA CRM 2024 values.

### 7.6 Data provenance & limitations

- **Frontend: 100% synthetic** via `seed()`; the real engine dataset is present but disconnected.
- Engine reference data (`IEA_CRITICAL_MINERALS_2024`, `EU_CRM_ACT_MINERALS`, IRMA/OECD tables) is
  authentic and citable; per-entity scores fall back to `_seed_float` hash when not supplied.
- No demand-projection time series exists anywhere — the guide's flagship formula is unimplemented.

**Framework alignment:** IEA *Critical Minerals Outlook 2024* (criticality dimensions) · EU Critical
Raw Materials Act, Reg (EU) 2024/1252 (Annex I strategic / Annex II critical; Art 5 10/40/25%
benchmarks + 65% concentration cap; Art 11/14 stockpiling & due-diligence) · IRMA Standard for
Responsible Mining v1.0 (6 chapters, tiered 50/70/85%) · OECD Due Diligence Guidance 5-step ·
Dodd-Frank §1502 / EU Reg 2017/821 (3TG conflict minerals). The engine encodes all of these
correctly; the page approximates them with seeded placeholders.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (The page displays criticality, supply-gap
and disruption numbers with no model; the demand-projection model named in the guide does not exist.)

**8.1 Purpose & scope.** Project clean-energy critical-mineral demand, secondary (recycled) supply,
and the resulting supply–demand balance / investment gap per mineral, 2024–2050, under IEA scenario
pathways. Supports procurement diversification and transition-capex sizing for 15 minerals × 6
clean-energy technologies.

**8.2 Conceptual approach.** Bottom-up material-flow model, mirroring the **IEA Critical Minerals
demand model** and **BNEF Transition Metals Outlook**: technology deployment (GW, GWh) × material
intensity (t/unit) minus recycled secondary supply, netted against committed mine + refining
capacity. Concentration/geopolitical risk overlays follow **USGS Mineral Commodity Summaries** and
the **HHI** market-structure convention used by the EU CRMA supply-risk score.

**8.3 Mathematical specification.**
```
Demand_m(t) = Σ_tech  Deploy_tech(t) × Intensity_{m,tech}(t) × (1 − Recycle_m(t))
Recycle_m(t)= min(R_max,m , R0_m + k_m·(t − t0))        # linear recycling ramp
Supply_m(t) = Σ_projects Capacity_p · Ramp_p(t) · (1 − Attrition)
Gap_m(t)    = max(0, Demand_m(t) − Supply_m(t))
InvGap_m    = Σ_t Gap_m(t) · Capex_intensity_m · DF(t)   # $ needed to close gap
HHI_m       = Σ_country share²_{country,m}·10⁴ ;  SupplyRisk_m = f(HHI_m, GeoRisk_m)
```

| Parameter | Symbol | Value / source |
|---|---|---|
| Deployment path | `Deploy_tech(t)` | IEA WEO/NZE, BNEF NEO scenario GW/GWh |
| Material intensity | `Intensity` | IEA 2024 (e.g. NMC811 8.8 kg Ni/kWh) — engine `TRANSITION_TECHNOLOGY_MINERAL_INTENSITY` |
| Recycling ramp | `R0,R_max,k` | IEA CRM 2024 (battery 5%→40% by 2040) |
| Mine capacity | `Capacity_p` | S&P Global / USGS project pipeline |
| Capex intensity | `Capex_intensity_m` | World Bank *Minerals for Climate Action* |
| Country shares | `share_country,m` | USGS MCS 2024 — engine `top3_country_share_pct` (real) |

**8.4 Data requirements.** Deployment GW/GWh by tech-scenario-year; material-intensity matrix
(exists in engine); recycling-rate trajectories; mine/refinery capacity pipeline; capex-intensity;
country production shares (exist, real). Vendor: S&P Global Market Intelligence, Benchmark Mineral
Intelligence; free: IEA, USGS, World Bank. Platform already holds the intensity matrix and
country-share tables in `critical_minerals_engine.py`.

**8.5 Validation & benchmarking.** Backtest 2015–2024 demand vs USGS reported consumption; reconcile
2030/2040 demand to published IEA CRM 2024 headline figures (lithium ≈6.5× 2023→2040); sensitivity
on chemistry mix (NMC↔LFP) and recycling ramp; benchmark investment-gap against IEA's $360–500bn
2024–35 mining gap.

**8.6 Limitations & model risk.** Chemistry-substitution (LFP displacing Ni/Co) is the dominant
uncertainty; recycling ramps are policy-sensitive; single-scalar geopolitical overlays cannot
capture export-ban shocks (e.g. gallium/germanium). Conservative fallback: report demand ranges
across ≥3 scenarios rather than a point estimate.

## 9 · Future Evolution

### 9.1 Evolution A — Consume the engine's real IEA data; build the demand projection (analytics ladder: rung 1 → 2)

**What.** §7 describes a self-inflicted wiring failure: the backend
`critical_minerals_engine` holds authentic IEA CRM 2024 reference tables (real HHI,
top-3 country shares, recycling rates), real EU CRMA Annex I/II flags, IRMA chapter
weights matching v1.0, and OECD 5-step composites — but the page fires one
fire-and-forget `POST /assess`, discards the response, and renders `seed()`-generated
scores instead; even the IEA card's displayed 30/30/25/15 weights aren't applied
(the composite is a flat 4-way average). And nowhere does the guide's flagship
`Demand(t) = Σ_tech Deployment × Intensity × (1 − Recycling)` time series exist.
Evolution A wires the real data, then builds the projection.

**How.** (1) Wiring: the criticality tab consumes `POST /assess` and
`GET /ref/mineral-profile/{name}` — fixing that profile route first (harness status
`failed`) — so displayed HHI and shares are the engine's authentic values; apply the
stated 30/30/25/15 weights or correct the card. (2) Demand projection: implement the
formula in the engine using IEA deployment pathways × material-intensity coefficients
(the guide quotes NMC811 kg/kWh figures — that granularity exists publicly), with the
recycling-rate trajectories already in the engine's tables; supply gap = demand −
committed supply. (3) The engine's `_seed_float` hash fallback for absent entity
fields gets an explicit `provenance: fallback` marker in responses so downstream
consumers can distinguish. (4) Shared-engine caution: `critical_minerals_engine`
serves 2 modules — coordinate with `critical-minerals-climate`.

**Prerequisites (hard).** Frontend `seed()` purge; the mineral-profile route fix;
deployment/intensity table curation. **Acceptance:** page HHI matches
`ref/country-concentration` exactly; lithium 2035 demand reproduces from the
deployment×intensity decomposition; the CRMA 65% single-country breach test fires on
real shares.

### 9.2 Evolution B — Multi-standard sourcing-assessment analyst (LLM tier 2)

**What.** The engine already composes four real frameworks (IEA criticality, EU CRMA
compliance with the Art. 5 benchmarks, IRMA chapter scoring, OECD 5-step) — a
multi-standard assessment an analyst currently reads as separate numbers. Evolution B
is a tool-calling analyst that runs `POST /assess` for a described sourcing
portfolio and narrates the composite: which framework drives the risk score (the
engine's own 0.40/0.30/0.30 weighting), where the CRMA breach test bites, what the
IRMA gap means operationally — and drills into `GET /ref/irma-criteria` and
`/ref/oecd-5step` to quote requirement text rather than paraphrasing from memory.

**How.** Tool schemas over the 8 mapped operations (6 ref GETs are citable grounding;
`/assess` is the computation; `/supply-chain-map` needs its skipped-fixture added).
The provenance marker from Evolution A matters here: the analyst must disclose when
an entity score came from the engine's hash fallback rather than supplied data —
"assessed from defaults" is a materially different statement than "assessed from
your disclosures". Fabrication validator on all scores and shares.

**Prerequisites.** Evolution A's wiring and provenance marker; supply-chain-map
fixture. **Acceptance:** every framework score in a narrative matches the assess
payload; requirement quotes match the ref endpoints verbatim; fallback-scored fields
are disclosed as such in the prose.