# Circular Economy Investment
**Module ID:** `circular-economy-investment` · **Route:** `/circular-economy-investment` · **Tier:** A (backend vertical) · **EP code:** EP-EJ1 · **Sprint:** EJ

## 1 · Overview
6 CE business models (PaaS/Take-Back/Industrial Symbiosis/Materials Marketplace/Repair/Closed-Loop Packaging), 22 investment companies with valuation and impact metrics, market size forecast 2024–2031, Ellen MacArthur Foundation 6 principles, and ROI analysis.

> **Business value:** Used by impact investors screening circular economy companies, corporate strategy teams modelling PaaS business transitions, and ESG analysts assessing CE readiness for ESRS E5 disclosure.

**How an analyst works this module:**
- Review 6 CE business models with financial metrics and market examples
- Analyse 22 investment companies with valuation, revenue CAGR, material saving, and CO₂ saving
- Explore market size forecast for CE market, recycling tech, and PaaS 2024–2031
- Review Ellen MacArthur Foundation 6 principles and ROI attribution analysis

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CE_MODELS`, `INVESTMENTS`, `KpiCard`, `MARKET_SIZE`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CE_MODELS` | 7 | `sector`, `revenueModel`, `marginUplift`, `resourceSaving`, `scalability`, `exampleCo` |

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
**Frontend seed datasets:** `CE_MODELS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global CE market opportunity | `Value at stake by 2030 (EMF estimate)` | Ellen MacArthur Foundation CE100 2023 | EMF estimates $4.5Tn opportunity from circular economy; largest in construction, food, and mobility sectors. |
| Industrial symbiosis BCR | `Kalundborg industrial symbiosis park annual savings` | Kalundborg Symbiosis Annual Report 2023 | Kalundborg generates €26M annual savings on €5.4M investment; replicated in Rotterdam, Ulsan, and other clusters. |
| EU CE Action Plan recycling target | `Municipal solid waste recycling by 2025` | EU Circular Economy Action Plan 2020 | Extended to 65% by 2035; EPR mandatory for all packaging by 2025; recycled content minimums in new products. |
- **EMF CE100 + EU CEAP 2020 + BS 8001 + ESRS E5 Resource Use + ISO 59000 CE Standards** → 6 CE business models + investment screener + market forecast + EMF framework + ROI analysis → **Impact investors, corporate strategy teams, ESG analysts, and circular economy fund managers**

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
**Methodology:** CE Revenue Model NPV
**Headline formula:** `CE_Revenue = ServiceFee × (1 − ChurnRate) + MaterialResidualValue + WarrantyExtension; Circular_IRR solves NPV=0 for CE business model vs linear; Material_Saving = VirginCost − RecoveredCost`

PaaS models show 18–28% higher asset utilisation and 15–22% lower total material cost vs linear ownership models per EMF research.

**Standards:** ['Ellen MacArthur Foundation CE100 Framework', 'EU Circular Economy Action Plan 2020', 'BS 8001:2017 CE Standard']
**Reference documents:** Ellen MacArthur Foundation (2023) – Circular Economy 100 Annual Report; EU Commission (2020) – Circular Economy Action Plan; BSI (2017) – BS 8001 Framework for Implementing CE Principles

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
| `circular-economy-finance` | engine:circular_economy_engine |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry cites a *CE Revenue Model NPV*
> methodology — `CE_Revenue = ServiceFee × (1 − ChurnRate) + MaterialResidualValue +
> WarrantyExtension`, a `Circular_IRR` that "solves NPV=0", and `Material_Saving = VirginCost −
> RecoveredCost`. **None of these are implemented.** There is no NPV, IRR, churn, or cost
> calculation anywhere in `CircularEconomyInvestmentPage.jsx`. The page is a curated CE
> business-model catalogue plus a synthetic 22-company pipeline whose valuation/CAGR/savings
> metrics are seeded-PRNG draws. The tier-A backend (`circular_economy_engine.py`) provides real
> MCI/CTI/EPR/LCA math for this domain, but this page makes no API calls. The sections below
> document what the code actually does.

### 7.1 What the module computes

Three data blocks drive six tabs (Overview · CE Business Models · Investment Pipeline · Market
Sizing · ROI Analysis · Ellen MacArthur Framework):

1. **`CE_MODELS`** — 6 hand-curated business-model rows (the record's `seed_schemas` counts 7
   rows including the header pattern; the array has 6):

| Model | Margin uplift | Resource saving | Scalability | Example |
|---|---|---|---|---|
| Product-as-a-Service | +15% | 40% | 75 | Philips Circular Lighting |
| Take-Back / Remanufacturing | +22% | 60% | 65 | Caterpillar Reman; Renault Re-Factory |
| Industrial Symbiosis | +8% | 55% | 50 | Kalundborg Symbiosis |
| Materials Marketplace | +5% | 45% | 90 | Excess Materials Exchange |
| Repair & Refurbish Platform | +18% | 35% | 80 | Back Market; iFixit |
| Closed-Loop Packaging | +6% | 70% | 85 | Loop (TerraCycle) |

   These constants carry no inline citations — treat as synthetic demo values loosely
   consistent with EMF case-study literature (guide's "18–28% higher asset utilisation" claim
   is not reproduced anywhere in code).

2. **`INVESTMENTS`** — 22 pipeline companies with real-world names (Carbios, Novamont,
   Circulor, Greyparrot, Closed Loop Partners…) but **synthetic financials**:

```js
valuation      = Math.round(10 + sr(i·13) × 490)   // $10–500M
revCagr        = Math.round(25 + sr(i·19) × 75)    // 25–100 %
materialSaving = Math.round(20 + sr(i·23) × 55)    // 20–75 %
co2Saving      = Math.round(15 + sr(i·29) × 60)    // 15–75 kt
```

   Model, sector, stage and lead investor cycle deterministically via `i % 6`.

3. **`MARKET_SIZE`** — linear ramps, not forecasts: `ceMarket = 1200 + i·380` ($Bn, 2024–2031,
   i.e. $1.2Tn → $3.86Tn), `recyclingTech = 250 + i·110`, `productService = 180 + i·95`.
   The $4.5Tn headline KPI is a hard-coded string (EMF 2015/2023 "value at stake" figure).

### 7.2 Parameterisation / scoring rubric

There is no scoring rubric. The only derived quantities are the four filtered-pipeline KPIs:

```js
avgValuation      = Σ valuation / n
avgRevCagr        = Σ revCagr / n
avgMaterialSaving = Σ materialSaving / n
totalCo2          = Σ co2Saving / 1000        // kt → "ktpa" display (unit mislabel, see §7.5)
```

with `n = filtered.length || 1` guarding empty filters. The "ROI Analysis" tab is a CAGR
histogram (buckets <30 / 30–50 / 50–75 / >75 %) plus a bar chart of `resourceSaving` by model —
no ROI is computed.

### 7.3 Calculation walkthrough

`modelFilter` (All + 6 model names) → `filtered` subset of `INVESTMENTS` → KPI means →
pipeline table. `CE_MODELS` feeds the margin-uplift bar chart and the scalability-vs-resource-
saving scatter unfiltered. Tab 5 renders 6 static Ellen MacArthur principle cards (eliminate
waste, circulate products, regenerate nature, design for longevity, business-model innovation,
systemic thinking) with suggested metrics — descriptive text only.

### 7.4 Worked example — pipeline company i = 0 (Loop Industries)

`sr(s) = frac(sin(s+1)·10⁴)`. For i = 0 every seed is `sr(0) = frac(sin(1)·10⁴) =
frac(8414.71) ≈ 0.7098`: valuation = `round(10 + 0.7098·490)` = **$358M**; revCagr =
`round(25 + 0.7098·75)` = **78%**; materialSaving = `round(20 + 0.7098·55)` = **59%**;
co2Saving = `round(15 + 0.7098·60)` = **58 kt**. (Identical percentile across all four metrics
because i·13 = i·19 = 0 — a seed-collision artefact at index 0.) With filter = All, this row
contributes to `avgValuation = Σ/22` etc.

### 7.5 Data provenance & limitations

- **Pipeline financials are synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`), attached to real
  company names — a presentation risk: readers may mistake fabricated valuations/CAGRs for
  actual market data. Real Carbios/Novamont valuations are public and differ.
- Market-size series are linear interpolations with no source; the $4.5Tn KPI is the only
  externally attributable number (Ellen MacArthur Foundation / Accenture 2015 estimate).
- KPI label "CO₂ Saving (ktpa)" divides the kt sum by 1,000, so the displayed number is
  actually MtCO₂ (or the division is spurious) — unit inconsistency in code.
- No NPV/IRR machinery despite tab names; no backend integration despite the domain's live
  `/api/v1/circular-economy/*` endpoints (MCI, EPR, LCA, ESRS E5).

### 7.6 Framework alignment

- **Ellen MacArthur Foundation** — tab 5 paraphrases EMF's three core principles (expanded to
  six cards); EMF's quantitative tool for company measurement is Circulytics / MCI, neither of
  which this page computes (the backend engine does implement MCI v1.3).
- **EU CEAP 2020 / BS 8001:2017** — named in the guide; present only as context, no compliance
  logic in code.
- **ESRS E5** — the natural disclosure hook for pipeline companies' circularity claims; served
  by the backend engine (`assess_esrs_e5` completeness grading A–D) but unwired here.

## 8 · Model Specification — CE Venture Screening & Circular NPV Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Give the pipeline table a defensible economic core: (i) a circular-vs-linear NPV/IRR engine for
CE business models, and (ii) a venture screening score for the 22-company pipeline. Users:
impact-fund deal teams screening Series A–pre-IPO circular-economy companies.

### 8.2 Conceptual approach

Circular NPV follows the **EMF/McKinsey "Growth Within" (2015)** value-driver decomposition and
**WBCSD CTI "CTI Revenue"** metric; the screening score mirrors venture-grading practice in
**BloombergNEF climate-tech scoring** and PitchBook/Preqin impact-fund frameworks (market ×
traction × impact). Both benchmarks value circularity as avoided virgin-material cost plus
retained residual value — exactly the guide's stated (unimplemented) formula.

### 8.3 Mathematical specification

Circular business-model NPV (per model m, horizon T = 10y):

```
CF_t = ServiceFee_t·(1−churn)^t + Resale_t + MatRecovery_t·(P_virgin − P_recovered)
       − RevLog_t − Reman_t − Capex_t
NPV_circular = Σ_t CF_t/(1+r)^t ;  IRR solves NPV = 0  (Newton iteration, guard f'≈0)
Δ_vs_linear = NPV_circular − NPV_linear   (same product sold, no take-back)
Screen_i = 0.30·z(RevCAGR_i) + 0.25·z(GrossMargin_i) + 0.25·Impact_i + 0.20·Scalability_m
Impact_i = min(100, 50·tCO₂e_avoided/$M_rev / sector_median)
```

| Parameter | Calibration source |
|---|---|
| `churn` (PaaS) | 5–12%/yr — EMF Philips/Michelin case studies; SaaS-analogue retention data |
| `P_virgin − P_recovered` | LME scrap spreads; ICIS recycled-polymer vs virgin PET/PE spreads (public monthly indices) |
| `r` discount rate | Stage-dependent venture hurdle: 25% Seed, 20% A/B, 15% Growth (Cambridge Associates VC benchmarks) |
| Reman cost ratio | 40–60% of new-build cost — Caterpillar Reman / Renault Re-Factory disclosures, EEA remanufacturing report |
| `tCO₂e_avoided` | Product LCA deltas from ecoinvent v3.10 factors (already patterned in engine `LCA_GATE_FACTORS`) |
| Sector medians | Circle Economy Circularity Gap Report sector tables |

### 8.4 Data requirements

Deal-level: revenue, growth, gross margin, unit economics (from CIMs/data rooms); market:
recycled-vs-virgin price series (ICIS/Fastmarkets, some free aggregates); impact: product LCA
or engine `perform_lca` with entity-supplied benefit %. Platform reuse: backend
`circular_economy_engine` (MCI/LCA/EPR), `reference_data` ingestion layer for price series.

### 8.5 Validation & benchmarking plan

Backtest screen scores against realised outcomes of 2018–2022 CE venture cohort (up-round /
flat / down) — target rank correlation ρ ≥ 0.3; reconcile NPV components against published EMF
case studies (Philips lighting, Renault Choisy-le-Roi ±20%); IRR solver unit tests vs closed-form
two-cash-flow cases; sensitivity: churn ±50%, material spread ±30%, discount rate ±5pp.

### 8.6 Limitations & model risk

Venture financials are private and self-reported — score inputs carry survivorship and
selection bias; recycled-material spreads can invert (recycled PET traded above virgin in
2021–22), flipping `MatRecovery` sign; churn assumptions from case studies may not transfer
across sectors. Conservative fallback: cap Impact at 100, floor NPV inputs at contracted (not
projected) service revenue, and disclose the linear-counterfactual assumption explicitly.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the CE business-model NPV/IRR the guide advertises (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's entire methodology — `CE_Revenue = ServiceFee ×
(1−ChurnRate) + MaterialResidualValue + WarrantyExtension`, a `Circular_IRR` solving
NPV=0, `Material_Saving = VirginCost − RecoveredCost` — has **no implementation**:
the page is a curated 6-model catalogue plus a 22-company pipeline whose
valuation/CAGR/savings figures are seeded-PRNG draws, and it never calls the domain's
real backend (`circular_economy_engine.py`, live at `/api/v1/circular-economy/*`).
Evolution A builds the advertised financial model as a new engine function: a
circular-vs-linear cash-flow comparison per business model (PaaS subscription streams
with churn, take-back residual value, repair-revenue extension), returning NPV, the
IRR root, and payback — deterministic, unit-tested, exposed as
`POST /api/v1/circular-economy/business-model-npv` alongside the existing eight routes.

**How.** (1) Cash-flow constructor parameterised by the `CE_MODELS` fields the page
already curates (revenue model, margin uplift, resource saving); IRR via bisection on
the NPV polynomial. (2) The synthetic 22-company pipeline either deleted or re-labelled
as a hand-curated (not PRNG) example set — §7 shows the sr() draws, which the platform
guardrail treats as fabrication. (3) ROI-analysis tab rewired to render engine
responses.

**Prerequisites (hard).** PRNG-metric purge; route added to the module's atlas
endpoint map so tier-2 tooling can discover it. **Acceptance:** a fixture PaaS case
with known cash flows reproduces a hand-computed IRR to 4 decimals; no rendered
valuation metric lacks an engine-response source.

### 9.2 Evolution B — CE investment-screening analyst (LLM tier 2)

**What.** An assistant for investor workflows spanning the existing engine and
Evolution A's new endpoint: "model a take-back program with 12% churn and €40/unit
residual — does it beat linear?", "what's the MCI and ESRS E5 posture of this product
system?" (existing `/mci`, `/esrs-e5` routes), "which of the six business models fits
a capital-light entrant?" (catalogue reasoning from the curated `CE_MODELS` rows).
Every financial figure comes from tool calls; qualitative model-fit reasoning cites
the catalogue and EMF framework corpus.

**How.** Tool schemas from the module's OpenAPI surface (8 existing + 1 new route);
no-fabrication validator on all NPV/IRR/score numerics; the Ellen MacArthur 6-principles
tab and §5 references (EMF CE100, BS 8001) form the RAG corpus for framework questions,
kept clearly separate from computed outputs.

**Prerequisites.** Evolution A first for any valuation talk — today an investment
question could only be answered from PRNG-fabricated company metrics, which is
disqualifying. Guide corrected in the same change. **Acceptance:** an investment-case
answer decomposes into engine-returned NPV components; asked to value one of the 22
pipeline companies, the assistant states their metrics are illustrative examples, not
data.