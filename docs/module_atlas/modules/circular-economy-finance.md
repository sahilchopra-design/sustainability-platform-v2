# Circular Economy Finance Analytics
**Module ID:** `circular-economy-finance` · **Route:** `/circular-economy-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DL1 · **Sprint:** DL

## 1 · Overview
Analyses investment opportunities and risk management implications of the circular economy transition. Models product-as-a-service revenue models, material loop closure economics, reverse logistics NPV, and EU Circular Economy Action Plan regulatory compliance costs.

> **Business value:** Directly applicable to consumer goods manufacturers, materials companies, and impact investors targeting circular economy. Provides financial business case for circular model transition, WBCSD CTI reporting metrics, and EU CEAP regulatory compliance gap analysis.

**How an analyst works this module:**
- Input product system for circularity assessment
- Model circular business model economics (PaaS, refurbishment, resale)
- Calculate material loop closure and virgin resource reduction
- Assess EU CEAP regulatory compliance requirements
- Generate WBCSD CTI-aligned circularity report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CIRCULARITY_TIERS`, `COMPANIES`, `COUNTRIES`, `KpiCard`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 13) * COUNTRIES.length)];` |
| `circularityScore` | `Math.round(20 + sr(i * 3) * 75);` |
| `avgCircularity` | `(filtered.reduce((s, c) => s + c.circularityScore, 0) / n).toFixed(1);` |
| `totalCarbonSaving` | `filtered.reduce((s, c) => s + c.carbonSaving, 0);` |
| `totalCapex` | `filtered.reduce((s, c) => s + c.circularCapex, 0);` |
| `pctBonds` | `filtered.length ? ((filtered.filter(c => c.circularBondIssued).length / n) * 100).toFixed(0) : '0';` |
| `carbonValueM` | `((totalCarbonSaving * carbonPrice) / 1e6).toFixed(1);` |
| `sectorBarData` | `SECTORS.map(sec => {` |
| `scos` | `filtered.filter(c => c.sector === sec).map(c => c.circularityScore);` |
| `wasteBarData` | `SECTORS.map(sec => {` |
| `wrs` | `filtered.filter(c => c.sector === sec).map(c => c.wasteRecoveryRate);` |
| `countryRevData` | `COUNTRIES.map(cn => {` |
| `revs` | `filtered.filter(c => c.country === cn).map(c => c.revenueFromCircular);` |
| `scatterData` | `filtered.map(c => ({ x: c.circularCapex, y: c.carbonSaving / 1000, name: c.name }));` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/circular-economy/esrs-e5` | `esrs_e5` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/mci` | `mci` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/wbcsd-cti` | `wbcsd_cti` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/epr-compliance` | `epr_compliance` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/crm-risk` | `crm_risk` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/lca` | `lca` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/material-flows` | `material_flows` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/overall-circularity` | `overall_circularity` | api/v1/routes/circular_economy.py |
| GET | `/api/v1/circular-economy/ref/crm-list` | `ref_crm_list` | api/v1/routes/circular_economy.py |
| GET | `/api/v1/circular-economy/ref/epr-rates` | `ref_epr_rates` | api/v1/routes/circular_economy.py |

### 2.3 Engine `circular_economy_engine` (services/circular_economy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CircularEconomyEngine.assess_esrs_e5` | entity_id, resource_inflows_t, recycled_inflows_pct, resource_outflows_t, waste_t, crm_identified, circular_targets_set, transition_plan | CSRD ESRS E5 — Resource use and circular economy disclosure scoring. The three qualitative disclosure components (CRM identification, circular targets, transition plan) are entity-reported facts. Supply them explicitly via ``crm_identified`` / ``circular_targets_set`` / ``transition_plan`` to include them in the disclosure-completeness score. When left as None they are recorded as unreported (``No |
| `CircularEconomyEngine.calculate_mci` | entity_id, recycled_input_fraction, waste_recovery_fraction, product_lifetime_multiplier, sector | Ellen MacArthur Foundation Material Circularity Indicator (0-1). Linear economy = 0; fully circular = 1. The MCI score itself is always a real computation from the caller's inputs. The peer benchmark requires a ``sector`` (EMF sector key); when supplied the benchmark/gap are looked up from ``MCI_BENCHMARKS``, otherwise they are returned as None (no random sector is assigned). |
| `CircularEconomyEngine.assess_wbcsd_cti` | entity_id, entity_name, sector, circular_product_design, waste_recovery, recycled_content, product_lifetime | WBCSD Circular Transition Indicators v4.0 — 4 dimensions, A-D tier. The four dimension scores (0-100) are entity-reported/assessed inputs. Supply them explicitly to compute the CTI composite via the WBCSD weighting (0.30/0.25/0.25/0.20). If a dimension is not provided its weight is dropped and the remaining weights are renormalised. If no dimensions are provided the composite/tier are returned as  |
| `CircularEconomyEngine.calculate_epr_compliance` | entity_id, packaging_tonnes, ewaste_tonnes, battery_tonnes, country, compliance_gaps | EU EPR cost calculation for packaging (DIR 94/62/EC), e-waste (WEEE DIR), and batteries (Regulation (EU) 2023/1542). Costs are a real computation: tonnes x published PRO reference rate (``EPR_COSTS``) for the country. Compliance-gap flags are caller-reported findings; pass ``compliance_gaps`` as {category: description} to record them. When not supplied, gaps are reported as unknown (empty) with a  |
| `CircularEconomyEngine.assess_crm_risk` | entity_id, materials_used, material_data | EU CRM Act 2023 dependency assessment for critical raw materials. Includes supply concentration, recycled content, and 2030 target gaps. Which inputs map to which materials are found is a real screen against ``EU_CRM_LIST`` / ``EU_STRATEGIC_RM``. Per-material quantitative metrics (supply-risk score, recycled-content %, HHI concentration, main supplier) are entity/market data; supply them via ``mat |
| `CircularEconomyEngine.perform_lca` | entity_id, product_name, annual_production, sector, circularity_benefit_pct | ISO 14044 Life Cycle Assessment: cradle-to-gate vs cradle-to-cradle. Circularity benefit quantifies CO2 savings from circular design. The cradle-to-gate intensity is a real reference factor (``LCA_GATE_FACTORS``) for the sector. The circularity benefit (% reduction achievable cradle-to-cradle) is a product-specific outcome: supply it via ``circularity_benefit_pct`` to compute cradle-to-cradle inte |
| `CircularEconomyEngine.analyse_material_flows` | entity_id, materials | Material flow analysis: for each material compute recycled content % and recovery rate. Flag CRM exposure. Recycled-input % and the portfolio aggregates are real computations from the supplied tonnages. ``recovery_rate_pct`` and ``risk_score`` are entity/market metrics read from each material dict when present (keys ``recovery_rate_pct`` / ``risk_score``); when absent they are returned as None rat |
| `CircularEconomyEngine.compute_overall_circularity` | entity_id, esrs_score, mci_score, cti_score, lca_benefit_pct, cost_per_score_point_usd | Aggregated circularity score combining ESRS E5, MCI, CTI, and LCA benefit. The overall score, gaps and priority actions are real deterministic computations. The investment needed to close the gap to the Low-risk threshold requires an entity-specific unit cost: supply ``cost_per_score_point_usd`` (USD per point of score improvement) and it is multiplied by the remaining gap. When not supplied the i |

**Engine `circular_economy_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `EU_CRM_2030_TARGETS` | `{'extraction_pct': 10.0, 'processing_pct': 40.0, 'recycling_pct': 25.0, 'single_country_max_pct': 65.0}` |
| `ESRS_E5_GRADES` | `{(80, 100): 'A', (65, 80): 'B', (50, 65): 'C', (0, 50): 'D'}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CIRCULARITY_TIERS`, `COUNTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Circular Economy Value Opportunity | — | Ellen MacArthur Foundation 2015 | Global circular economy transition could generate $4.5Tn in economic benefits by 2030 |
| EU CEAP Market Impact | — | European Commission CEAP 2020 | EU Circular Economy Action Plan creates €250Bn in new market opportunities in materials, design, and waste |
| Material Productivity Gap | — | Circle Economy Circularity Gap Report 2023 | Only 8.6% of global materials are cycled back into economy — huge gap vs circular potential |
- **Product material composition + use phase data** → Circularity scoring → **Material loop closure rate and critical material retention**
- **Reverse logistics cost data + material market prices** → Circular economics modelling → **NPV of circular business model vs linear alternative**
- **EU CEAP regulatory requirements by product category** → Compliance cost modelling → **Ecodesign and EPR compliance cost and market access implications**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/circular-economy/ref/crm-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_crm_count', 'critical_raw_materials', 'strategic_raw_materials', 'eu_2030_targets', 'regulation', 'review_cycle', 'strategic_stockpiling'], 'n_keys': 7}`

**GET /api/v1/circular-economy/ref/epr-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['rates', 'categories', 'currency', 'unit', 'directives', 'note'], 'n_keys': 6}`

**POST /api/v1/circular-economy/crm-risk** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/epr-compliance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/esrs-e5** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/lca** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/material-flows** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/mci** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Circular Economy Value Model
**Headline formula:** `CircularValue = ResaleRevenue + MaterialRecoveryValue + CustomerRetentionUplift - ReverseLogisticsCost - RemanufacturingCost; CircularityScore = MaterialsRetained / TotalMaterialsInput`

Circularity score (0–100%) measures material loop closure; economic value adds product extension revenue plus material recovery minus collection and reprocessing costs

**Standards:** ['EU Circular Economy Action Plan 2020', 'Ellen MacArthur Foundation CE Economics 2015', 'WBCSD Circular Transition Indicators v3.0', 'SBTi Material Use Sector Guidance']
**Reference documents:** Ellen MacArthur Foundation — Towards a Circular Economy: Business Rationale (2015); European Commission — Circular Economy Action Plan 2020; WBCSD Circular Transition Indicators (CTI) v3.0 Framework; EU Ecodesign for Sustainable Products Regulation 2024

**Engine `circular_economy_engine` — extracted transformation lines:**
```python
utility_factor = round(1.0 / plm, 4)
raw_mci = (rif + wrf) / 2.0 * utility_factor
gap = round(benchmark - mci_score, 4)
sector_benchmark = round(MCI_BENCHMARKS[sector_l] * 100.0, 1)
pkg_cost = round(packaging_tonnes * pkg_rate, 0) if packaging_tonnes > 0 else 0.0
ew_cost = round(ewaste_tonnes * ew_rate, 0) if ewaste_tonnes > 0 else 0.0
bat_cost = round(battery_tonnes * bat_rate, 0) if battery_tonnes > 0 else 0.0
total_cost = round(pkg_cost + ew_cost + bat_cost, 0)
c2c = round(c2g * (1 - benefit_pct / 100.0), 2)
annual_co2_saving = round((c2g - c2c) * annual_production / 1000.0, 2)  # tCO2
total = primary + recycled + bio_based
rec_pct = round(recycled / total * 100.0 if total > 0 else 0.0, 2)
portfolio_recycled_pct = round(total_recycled / total_inflow * 100.0 if total_inflow > 0 else 0.0, 2)
crm_exposure_pct = round(crm_inflow / total_inflow * 100.0 if total_inflow > 0 else 0.0, 2)
gap = round(max(0.0, 70.0 - overall_score), 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `circular_economy_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `circular-economy-tracker` | engine:circular_economy_engine |
| `circular-economy-investment` | engine:circular_economy_engine |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *Circular Economy Value
> Model* (`CircularValue = ResaleRevenue + MaterialRecoveryValue + CustomerRetentionUplift −
> ReverseLogisticsCost − RemanufacturingCost`) and a circularity score defined as
> `MaterialsRetained / TotalMaterialsInput`. **Neither formula exists in this module's code.**
> The page (`CircularEconomyFinancePage.jsx`) renders 65 synthetic companies whose every metric —
> including the 0–100 circularity score — is drawn from the seeded PRNG `sr()`, then aggregated
> with means/sums. The domain's *real* deterministic methodology lives in
> `backend/services/circular_economy_engine.py` (EMF MCI, WBCSD CTI, ESRS E5, EPR, CRM, LCA) and
> is exposed via `/api/v1/circular-economy/*` routes — **but this page never calls those
> endpoints** (no fetch/axios in the file). Sections below document both layers.

### 7.1 What the frontend actually computes

65 companies are fabricated at module load: `sector = SECTORS[⌊sr(i·7)·8⌋]`, `country =
COUNTRIES[⌊sr(i·13)·10⌋]`, and per-company metrics all follow `lo + sr(i·k)·range`:

| Field | Formula | Range |
|---|---|---|
| `circularityScore` | `Math.round(20 + sr(i·3)·75)` | 20–95 |
| `materialEfficiency` | `40 + sr(i·5)·55` | 40–95 % |
| `wasteRecoveryRate` | `30 + sr(i·9)·65` | 30–95 % |
| `productLifeExtension` | `1 + sr(i·17)·8` | 1–9 yr |
| `revenueFromCircular` | `10 + sr(i·23)·490` | $10–500M |
| `circularCapex` | `5 + sr(i·29)·295` | $5–300M |
| `carbonSaving` | `500 + sr(i·31)·49500` | 500–50,000 tCO₂e/yr |
| `circularBondIssued` | `sr(i·43) > 0.6` | ~40 % true |

Tier is a threshold rubric on the score: `<35 Emerging, <55 Developing, <75 Advanced, else
Leader`. Derived headline outputs are straight aggregations over the filter set:
`avgCircularity = Σscore/n`, `totalCarbonSaving = Σ`, `pctBonds = issued/n·100`, and the one
what-if calculation `carbonValueM = totalCarbonSaving × carbonPrice / 10⁶` driven by the
carbon-price slider ($20–200/t, default $65 — close to the 2024–25 EU ETS range). The
`materialCostMultiplier` slider (×1.0–3.0) is displayed as a caption on the Capex KPI but is
**not multiplied into any number** — it is cosmetic.

### 7.2 The backend engine (real, deterministic — currently unwired to this page)

`circular_economy_engine.py` (E55) is explicitly "no metric fabricated with a random draw":

- **MCI (EMF v1.3):** `utility_factor = 1/lifetime_multiplier`; `MCI = min(1, (RIF + WRF)/2 ×
  utility_factor)` where RIF = recycled input fraction, WRF = waste recovery fraction. Sector
  benchmarks table (`MCI_BENCHMARKS`): metals 0.55, automotive 0.45, chemicals 0.40,
  construction 0.35, electronics 0.30, plastics 0.28, textiles 0.25, food 0.20.
  *Note:* this is a simplified proxy of EMF's published MCI (`MCI = 1 − LFI·F(X)`, with
  `LFI = (V+W)/(2M + (W_F−W_C)/2)` and utility `X = (L/L_av)(U/U_av)`); the code replaces the
  Linear Flow Index with a symmetric mean of RIF and WRF.
- **WBCSD CTI v4.0:** composite = weighted mean of 4 dimensions — circular product design 0.30,
  waste recovery 0.25, recycled content 0.25, product lifetime 0.20 — with weight renormalisation
  when dimensions are unreported; tiers A ≥80, B ≥60, C ≥40, D otherwise.
- **ESRS E5:** disclosure completeness = share of reported components that are true (4
  quantitative + up to 3 caller-reported qualitative booleans); grades A ≥80, B 65–80, C 50–65,
  D <50; `recycled_outflows_pct = (outflows − waste)/outflows`.
- **EPR:** `cost = tonnes × rate(country)` with published PRO reference rates, e.g. packaging
  DE €130/t, FR €120/t; e-waste DE €550/t; battery EU €300/t (Dir 94/62/EC, WEEE 2012/19/EU,
  Batteries Reg (EU) 2023/1542).
- **CRM risk:** screen against the EU CRM Act 2023 34-material list; dependency = mean of
  caller-supplied supply-risk scores; ratings Critical ≥70, High ≥50, Medium ≥30.
- **LCA (ISO 14044):** cradle-to-gate sector factors (automotive 8,000 kgCO₂e/unit, metals
  3,000, construction 2,000…); cradle-to-cradle = gate × (1 − benefit%); annual saving in tCO₂.
- **Overall circularity:** `0.30·ESRS + 0.30·(MCI×100) + 0.20·CTI + 0.20·LCA_benefit%`, risk
  rating Low ≥70 / Medium ≥50 / High ≥30 / Critical; green-finance eligible if score ≥55 and
  LCA benefit ≥15%; EU-Taxonomy-aligned flag at score ≥60.

### 7.3 Calculation walkthrough (page)

Filters (sector/country/tier) → `filtered` → KPI aggregations (§7.1) → per-sector bar charts
(`sectorBarData`, `wasteBarData` = sector means of score / waste recovery), top-8 country
revenue totals (`countryRevData`), and a Capex-vs-carbon scatter
(`{x: circularCapex, y: carbonSaving/1000}`). Division guards: `n = Math.max(1,
filtered.length)` and a ternary on `pctBonds` prevent NaN on empty filters.

### 7.4 Worked example — company i = 2

`sr(s) = frac(sin(s+1)·10⁴)`. For i = 2: `sr(6) ≈ 0.5697` → sector = `SECTORS[⌊0.5697·8⌋=4]` =
Construction; `sr(4) ≈ 0.5892` → circularityScore = `round(20 + 0.5892·75)` = **64** →
tier **Advanced** (55 ≤ 64 < 75). If this company's carbonSaving were 25,000 tCO₂e and it were
the only row after filtering, the KPI row would show Avg Circularity 64.0 and carbon value
`25,000 × $65 / 10⁶ = $1.6M` at the default slider.

### 7.5 Data provenance & limitations

- **All 65 companies are synthetic**, generated by the platform PRNG
  `sr(seed) = frac(sin(seed+1)×10⁴)`; names are template combinations ("CircuTech AG"…). No
  real issuer data, no backend call, no reference_data usage.
- Frontend "circularity score" has no methodology — it is a random level, not the guide's
  `MaterialsRetained/TotalMaterialsInput` nor the engine's MCI.
- The material-cost slider is display-only; carbon value uses a single flat price with no
  discounting or vintage curve.
- The backend engine is methodologically sound but simplified: MCI omits the EMF linear-flow
  denominator `2M + (W_F−W_C)/2`; ESRS E5 scoring is completeness-based, not datapoint-level
  (EFRAG lists ~30 E5 datapoints); EPR rates are single reference points, not eco-modulated fee
  schedules.

### 7.6 Framework alignment

- **CSRD ESRS E5** — engine grades disclosure completeness across E5-1…E5-5 (policies, actions,
  targets, resource inflows, resource outflows); real E5 compliance is datapoint-level per EFRAG IG.
- **EMF MCI v1.3** — engine computes a simplified MCI; the authentic indicator combines virgin
  feedstock V, unrecoverable waste W and a utility factor X into `MCI = 1 − LFI·(0.9/X)`.
- **WBCSD CTI v4.0** — CTI's actual framework measures %-circular inflow/outflow, water and
  energy circularity; the engine approximates it with 4 weighted dimensions.
- **EU CRM Act 2023** — 34 CRMs, 2030 targets (10% extraction / 40% processing / 25% recycling /
  ≤65% single-country) reproduced verbatim in `EU_CRM_2030_TARGETS`.
- **ISO 14044** — LCA sub-module follows the cradle-to-gate vs cradle-to-cradle comparison
  pattern with sector emission factors.

## 8 · Model Specification — Circular Economy Company Scoring & Value Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Replace the synthetic 65-company universe with a real scored universe supporting (i) circular
bond/loan screening and (ii) ESRS E5 client benchmarking. Coverage: listed corporates in the 8
page sectors, EU + OECD; annual refresh.

### 8.2 Conceptual approach

Two-block design mirroring **WBCSD CTI v4.0** (measured circularity) and the **Ellen MacArthur
/ Granta MCI** (product-material flow), with a financial overlay modelled on **ING's Circular
Economy Finance framework** and **S&P Trucost** resource-intensity data. The existing backend
engine already implements the score arithmetic — the model work is data-driven calibration and
wiring, not new math.

### 8.3 Mathematical specification

```
RIF_i = recycled_inflow_t / total_inflow_t              (from ESRS E5-4 disclosures)
WRF_i = recovered_outflow_t / total_outflow_t           (E5-5)
X_i   = (L_i/L_av)·(U_i/U_av)                           (EMF utility factor)
MCI_i = max(0, 1 − LFI_i · 0.9/X_i),  LFI_i = (V_i+W_i)/(2M_i + (W_Fi−W_Ci)/2)
CTI_i = 0.30·Design + 0.25·WRF·100 + 0.25·RIF·100 + 0.20·Lifetime   (engine weights)
Score_i = 0.30·ESRS_i + 0.30·MCI_i·100 + 0.20·CTI_i + 0.20·LCAbenefit_i   (engine §8 weights)
CircularValue_i = ResaleRev + MatRecovery·P_mat − RevLog − Reman        (guide formula, per EMF 2015)
CarbonValue_i = ΔtCO₂e_i × P_CO₂(s,t)                                    (scenario carbon price)
```

| Parameter | Calibration source |
|---|---|
| Sector MCI benchmarks | Circle Economy *Circularity Gap Report* (global 7.2–8.6%); EMF sector studies |
| `P_mat` recovered-material prices | LME/Fastmarkets scrap indices; EEX recycled-plastic futures |
| `P_CO₂(s,t)` | NGFS Phase IV scenario prices; EU ETS forward curve (ICE) |
| EPR fee schedules | National PRO published tariffs (e.g. CITEO FR, Der Grüne Punkt DE) — replaces single-point `EPR_COSTS` |
| LCA factors | ecoinvent v3.10 or EPA USEEIO (free) — replaces the 9 hard-coded `LCA_GATE_FACTORS` |

### 8.4 Data requirements

ESRS E5 quantitative datapoints (inflows/outflows/waste, from CSRD filings 2025+), company BoM
or Trucost material-intensity estimates, EPR registrations, recovered-material price feeds.
Already in platform: `circular_economy_engine` functions, `/api/v1/circular-economy/*` routes,
`reference_data` ingestion pattern (CEDA/OWID) reusable for ecoinvent-lite factors.

### 8.5 Validation & benchmarking plan

Reconcile MCI against EMF's published product case studies (tolerance ±0.05); benchmark company
scores against WBCSD CTI pilot disclosures and Circulytics archive; backtest the circular-bond
flag against actual CBI-labelled circular issuance 2021–25 (target AUC ≥ 0.7); sensitivity on
material prices ±30% and carbon price ±50%.

### 8.6 Limitations & model risk

CSRD E5 data availability is thin pre-2026 (first wave filings) — fallback to Trucost-style
sector estimates flagged with a PCAF-analogue data-quality score; recovered-material prices are
volatile and regionally fragmented; MCI is product-level while scoring is entity-level, so
aggregation across product lines needs revenue weights (disclosure-limited). Conservative
fallback: report score ranges (P25–P75) rather than point values when ≥2 inputs are estimated.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own real engine; purge the fabricated screener (analytics ladder: rung 1 → 2)

**What.** §7 documents the platform's classic wiring gap in its sharpest form: a real
tier-A backend (`circular_economy_engine.py` — EMF MCI, WBCSD CTI, ESRS E5, EPR
compliance costing, CRM risk, LCA) is live behind eight
`POST /api/v1/circular-economy/*` routes plus two passing ref GETs (`ref/crm-list`,
`ref/epr-rates`), while `CircularEconomyFinancePage.jsx` never issues a single fetch —
its 65 companies and every metric including the 0–100 circularity score are seeded-PRNG
draws (`circularityScore = 20 + sr(i·3)·75`). Evolution A deletes the fabricated
company book and rebuilds the page as a working client of its own engine: input panels
posting to `/mci`, `/wbcsd-cti`, `/esrs-e5`, `/epr-compliance`, and `/overall-
circularity`, with the EPR cost calculator (packaging/e-waste/battery tonnes × real
directive rates) as the finance-page centrepiece.

**How.** (1) Replace the screener with an entity-based workflow: user-entered or
seeded-fixture product systems, each scored by the engine, results persisted.
(2) Lineage harness upgrade: the six `skipped` POSTs in §4.2 get request fixtures so
the sweep exercises them. (3) The guide's unimplemented `CircularValue` revenue formula
either implemented as a small addition to the engine or excised from the guide —
the mismatch flag must clear one way.

**Prerequisites (hard).** The `sr()` company fabrication is a documented defect class
(random-as-data) and its removal is the point, not a side effect; REQUIRE_AUTH posture
for POSTs applies. **Acceptance:** zero PRNG-derived metrics remain on the page; every
rendered score matches an engine response payload; lineage sweep shows the 8 POSTs
`passed`.

### 9.2 Evolution B — Circularity analyst over the engine's tool surface (LLM tier 2)

**What.** This domain is unusually tier-2-ready: eight Pydantic-typed POST endpoints
already exist. An analyst assistant that runs them conversationally — "compute MCI for
a product with 40% recycled input, 60% waste recovery, 1.3x lifetime", "what would EPR
compliance cost us in Germany for 2,000t packaging?", "screen our material basket
against the EU CRM list" — narrating only engine responses, with the CRM/EPR ref
endpoints supplying the regulatory context.

**How.** Tool schemas auto-generated from the OpenAPI spec filtered to this module's
routes per the atlas endpoint map; the no-fabrication validator checks every score,
cost, and percentage against tool outputs; "show work" expander lists the engine calls
made. The per-module system prompt draws on §5's real engine transformation lines
(utility factor, raw MCI, benchmark gap) so explanations match the implementation.

**Prerequisites.** Evolution A's page rewiring is not strictly blocking (the endpoints
work today), but the guide's phantom CircularValue formula must be corrected before
entering the corpus. **Acceptance:** every numeric in an answer appears in a logged
engine response; asked for a company's circularity score without running the engine,
the assistant runs it or refuses — it never estimates.