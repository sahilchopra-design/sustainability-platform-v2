# Adaptation Finance Hub
**Module ID:** `adaptation-finance` · **Route:** `/adaptation-finance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate adaptation finance tracking covering bilateral ODA, MDB climate finance, private adaptation investment, and innovative instruments (catastrophe bonds, weather insurance, resilience bonds).

> **Business value:** The adaptation finance gap is widening as climate impacts worsen. Developing countries need $300-500B/yr but receive $50-60B. This module tracks flows, identifies gaps, and supports impact investors designing climate adaptation finance solutions.

**How an analyst works this module:**
- Finance Overview shows adaptation finance flows by source
- Gap Analysis compares flows vs needs by region
- Instrument Catalogue shows adaptation finance products

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `Inp`, `KpiCard`, `PIE_COLORS`, `PROJECT_CATEGORIES`, `RCP_SCENARIOS`, `Row`, `Section`, `Sel`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RCP_SCENARIOS` | 5 | `label` |
| `PROJECT_CATEGORIES` | 9 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `projectAlignmentData` | `gfmaCategoryData.map((c, i) => ({` |
| `portfolioBreakdown` | `gfmaCategoryData.map((c, i) => ({` |
| `gfmaTotal` | `gfmaCategoryData.reduce((s, c) => s + c.value, 0);` |
| `gfmaAlignment` | `Math.round(seed(101) * 20 + 72);` |
| `gariComposite` | `Math.round(gariCriteria.reduce((s, c) => s + c.score, 0) / gariCriteria.length);` |
| `avgRiskReduction` | `Math.round(hazardResilienceData.reduce((s, h) => s + h.reduction, 0) / hazardResilienceData.length);` |
| `bcrValue` | `(Math.round(seed(102) * 20 + 18) / 10).toFixed(1);` |
| `costPerBeneficiary` | `Math.round(seed(103) * 200 + 150);` |
| `livesProtected` | `Math.round(seed(104) * 80000 + 40000);` |
| `totalInvestment` | `Math.round(seed(105) * 200 + 150);` |
| `blendedRatio` | `Math.round(seed(106) * 30 + 40);` |
| `napAlignment` | `Math.round(seed(107) * 20 + 72);` |
| `portfolioScore` | `Math.round((gfmaAlignment + gariComposite) / 2);` |
| `reduction` | `r.baseline - r.postInvest;` |
| `pct` | `Math.round((reduction / r.baseline) * 100);` |
| `gap` | `benchmark - c.score;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/adaptation-finance/gfma-alignment` | `gfma_alignment` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/resilience-delta` | `resilience_delta` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/gari-scoring` | `gari_scoring` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/adaptation-npv` | `adaptation_npv` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/mdb-eligibility` | `mdb_eligibility` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/nap-ndc-alignment` | `nap_ndc_alignment` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/full-assessment` | `full_assessment` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/portfolio-assessment` | `portfolio_assessment` | api/v1/routes/adaptation_finance.py |
| GET | `/api/v1/adaptation-finance/ref/gfma-categories` | `ref_gfma_categories` | api/v1/routes/adaptation_finance.py |
| GET | `/api/v1/adaptation-finance/ref/mdb-facilities` | `ref_mdb_facilities` | api/v1/routes/adaptation_finance.py |
| GET | `/api/v1/adaptation-finance/ref/nap-profiles` | `ref_nap_profiles` | api/v1/routes/adaptation_finance.py |
| GET | `/api/v1/adaptation-finance/ref/hazard-risk-profiles` | `ref_hazard_risk_profiles` | api/v1/routes/adaptation_finance.py |

### 2.3 Engine `adaptation_finance_engine` (services/adaptation_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AdaptationFinanceEngine.assess_gfma_alignment` | project_data | Assess project alignment with the GFMA Adaptation Finance Framework. Args: project_data: primary_sector (maps to GFMA category), project_description, co_benefits (list), country_code. Returns: dict with gfma_category, subcategory, alignment_score, co_benefit_mapping, bcr_range, taxonomy_reference. |
| `AdaptationFinanceEngine.calculate_resilience_delta` | baseline_risk, project_data, rcp_scenario | Quantify climate risk reduction from an adaptation project. Args: baseline_risk: current annual average loss or risk score (0-100 or USD M). project_data: hazard_type, adaptation_measure, time_horizon_years. rcp_scenario: '1.5C', '2C', '3C', '4C'. Returns: dict with risk_reduction_pct, post_investment_risk, resilience_delta, residual_risk, maladaptation_risk, rcp_hazard_multiplier. |
| `AdaptationFinanceEngine.score_gari` | project_data | Score project against 6 GARI (Global Adaptation & Resilience Investment) criteria. Args: project_data: additionality_evidence, effectiveness_data, sustainability_plan, scalability_potential, co_benefits_data, governance_structure (each: 0-100 self-assessment score or text). Returns: dict with criterion_scores, composite_gari_score, gari_tier, actionable_gaps. |
| `AdaptationFinanceEngine.calculate_adaptation_npv` | project_data, discount_rate, horizon_years | Compute adaptation project NPV, benefit-cost ratio (BCR), SROI, and human-welfare metrics. Args: project_data: total_investment_m, annual_benefits_m, annual_om_m, beneficiaries_count, discount_rate (%), horizon_years. Returns: dict with npv_m, bcr, sroi, cost_per_beneficiary, lives_protected, payback_years, irr_approx. |
| `AdaptationFinanceEngine.assess_mdb_eligibility` | project_data | Assess project eligibility across 8 MDB climate finance facilities. Args: project_data: country_code, sector, total_investment_m, public_component_m, adaptation_category, gfma_aligned. Returns: dict with eligible_facilities, gcf_gcef_eligibility, estimated_finance_mix. |
| `AdaptationFinanceEngine.assess_nap_ndc_alignment` | project_data, country_code | Assess alignment of project adaptation measures with the country's National Adaptation Plan (NAP) and NDC adaptation component. Args: project_data: adaptation_measures (list), sectors (list). country_code: ISO 3166-1 alpha-2. Returns: dict with nap_priority_match, ndc_adaptation_alignment, country_adaptation_ambition_score, alignment_gap. |
| `AdaptationFinanceEngine.run_full_assessment` | entity_id, project_data | Orchestrate all adaptation finance sub-modules. Composite adaptation_score: GFMA alignment 20% GARI scoring 30% NPV/BCR 25% MDB eligibility 15% NAP/NDC 10% bankability_tier: ≥75 → Highly Bankable ≥55 → Bankable ≥35 → Conditionally Bankable <35 → Pre-Bankable |
| `AdaptationFinanceEngine.aggregate_portfolio` | entity_id, projects | Aggregate adaptation metrics across a portfolio of projects. Args: entity_id: portfolio owner identifier. projects: list of project_data dicts. Returns: dict with portfolio-level weighted scores, total investment, sector diversification, bankability distribution. |
| `_parse_score` | value | Convert evidence text or numeric score to 0-100 float. |
| `_approx_irr` | investment, net_annual_benefit, n | Approximate IRR using binary search (simplified DCF). Returns IRR as a decimal (e.g. 0.15 for 15%). |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `an` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `PIE_COLORS`, `PROJECT_CATEGORIES`, `RCP_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Public Adaptation Finance | — | OECD DAC | Far below UNEP estimated need |
| Adaptation Finance Gap | — | UNEP 2024 | Gap between developing country needs and current flows |
- **OECD DAC data** → Adaptation classification → **Public finance flows**
- **MDB reports** → Adaptation fraction → **MDB adaptation finance**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/adaptation-finance/ref/gfma-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_categories', 'categories'], 'n_keys': 4}`

**GET /api/v1/adaptation-finance/ref/hazard-risk-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_hazards', 'hazard_profiles', 'rcp_hazard_projections', 'gari_scoring_criteria', 'discount_rates_by_context'], 'n_keys': 7}`

**GET /api/v1/adaptation-finance/ref/mdb-facilities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_facilities', 'facilities'], 'n_keys': 4}`

**GET /api/v1/adaptation-finance/ref/nap-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_countries', 'nap_submitted_count', 'nap_in_progress_count', 'profiles'], 'n_keys': 6}`

**POST /api/v1/adaptation-finance/adaptation-npv** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/adaptation-finance/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/adaptation-finance/gari-scoring** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/adaptation-finance/gfma-alignment** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Adaptation finance tracking
**Headline formula:** `Adaptation_finance = Public_bilateral + MDB_adaptation + Private_tracked`

Public adaptation finance ($50-60B/yr) vs need ($300-500B/yr by 2030). MDB climate finance: 50% mitigation, 50% adaptation target. Private adaptation finance: emerging but small (<10% of total).

**Standards:** ['OECD DAC', 'UNFCCC Standing Committee on Finance', 'CBI Adaptation Finance']
**Reference documents:** OECD DAC Climate Finance Tracking; UNEP Adaptation Gap Report 2024

**Engine `adaptation_finance_engine` — extracted transformation lines:**
```python
matched_rr = sum(measure_reductions.values()) / len(measure_reductions)  # average
horizon_adj = 1.0 - max(0, (horizon - 20) / 100)
effective_rr = matched_rr * horizon_adj
post_investment_risk = max(baseline_risk * (1 - effective_rr), baseline_risk * residual_floor)
resilience_delta = baseline_risk - post_investment_risk
dr_dec = dr / 100.0
pv_benefits = ann_ben * n
pv_costs = inv + ann_om * n
annuity_factor = (1 - (1 + dr_dec) ** -n) / dr_dec
pv_benefits = ann_ben * annuity_factor
pv_costs = inv + ann_om * annuity_factor
npv = round(pv_benefits - pv_costs, 2)
bcr = round(pv_benefits / pv_costs, 2) if pv_costs > 0 else 0.0
sroi = round(pv_benefits / inv, 2) if inv > 0 else 0.0
total_lifecycle_cost_m = inv + ann_om * n
cost_per_beneficiary = round(total_lifecycle_cost_m * 1_000_000 / beneficiaries, 2)
lives_protected = int(pv_benefits * 1_000_000 / 50_000)
net_annual_benefit = ann_ben - ann_om
payback_years = round(inv / net_annual_benefit, 1) if net_annual_benefit > 0 else 999
irr_approx = _approx_irr(inv, ann_ben - ann_om, n)
nap_match_score = round(len(matched_sectors) / max(len(priority_sectors), 1) * 100, 1)
npv_raw_score = min(100, max(0, bcr * 40))   # BCR 2.5 → 100
npv_contrib = npv_raw_score * 0.25
mdb_contrib = mdb_score * 0.15
nap_contrib = nap_score * 0.10
mid = (low + high) / 2
pv = net_annual_benefit * n
pv = net_annual_benefit * (1 - (1 + mid) ** -n) / mid
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **47** other module(s).
**Shared engines (edits propagate!):** `adaptation_finance_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `api-gateway-monitor` | engine:adaptation_finance_engine, table:an, table:exc |
| `project-finance-debt-sizer` | table:an |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *flow-tracking* module
> (`Adaptation_finance = Public_bilateral + MDB_adaptation + Private_tracked`, OECD DAC data,
> $50–60B/yr vs $300–500B/yr gap analysis). **No flow-tracking logic exists in the code.** What
> is actually implemented is a *project-level investment appraisal* stack: the backend
> `AdaptationFinanceEngine` (E83) computes GFMA taxonomy alignment, resilience delta, GARI
> 6-criteria scoring, adaptation NPV/BCR/SROI, 8-facility MDB eligibility, NAP/NDC alignment,
> and a weighted composite `adaptation_score` with a bankability tier. Sections below document
> the code.

### 7.1 What the module computes

Backend engine (`backend/services/adaptation_finance_engine.py`, exposed via
`/api/v1/adaptation-finance/*`) — eight sub-modules; the composite orchestrator is:

```
adaptation_score = 0.20·GFMA_alignment + 0.30·GARI_composite + 0.25·min(100, BCR×40)
                 + 0.15·min(100, eligible_facilities×20)
                 + 0.10·(0.5·NAP_match + 0.5·NDC_alignment)
```

Bankability tier: ≥75 Highly Bankable · ≥55 Bankable · ≥35 Conditionally Bankable ·
<35 Pre-Bankable. Note `min(100, BCR×40)` means a BCR of 2.5 saturates the NPV component
(inline comment: "BCR 2.5 → 100").

### 7.2 Parameterisation

**GFMA alignment (sub-module 1):** 8 adaptation categories (water infrastructure, coastal
protection, agriculture resilience, urban heat, health systems, transport, energy, NbS), each
with a typical BCR range (e.g. NbS 5.0–15.0, coastal 4.0–11.0), primary hazards, SDG mapping
and a `gfma_ref` citation. Score heuristic: `60 base + min(8×matched_co_benefits, 30) + 10 if
description mentions a primary hazard`, capped at 100.

**GARI scoring (sub-module 3):** 6 criteria with explicit weights — Additionality 0.20,
Effectiveness 0.25, Sustainability 0.15, Scalability 0.15, Co-benefits 0.15, Governance 0.10
(cited to "GARI Framework — CPI / Global Adaptation Commission 2023"). Tiers: ≥75 Tier 1
Investment Grade, ≥55 Tier 2, else Tier 3. Text evidence is converted to a 0–100 score by
`_parse_score`: base 40, +8 per positive keyword (comprehensive/robust/quantified/verified/
approved/third-party), −10 per negative keyword (none/missing/draft/tbc).

**Resilience delta (sub-module 2):** 10 hazard profiles, each mapping adaptation measures to
risk-reduction fractions (e.g. flooding: dyke/levee 0.70, floodplain restoration 0.40, EWS
0.30; sea-level rise: managed retreat 0.90, surge barrier 0.80), plus a `residual_risk_floor`
(3–15%) and average-annual-loss %GDP by income group. RCP projections table gives intensity/
frequency multipliers and damage %GDP for 1.5C/2C/3C/4C (e.g. heat-wave frequency ×2 at 1.5°C,
×9 at 4°C — consistent with IPCC AR6 WG1 heat-extreme scaling).

**Discount rates:** context table with provenance in code — sovereign HIC 3.5% (HM Treasury
Green Book 2022), UMIC 5.0% (World Bank), LMIC 7.0% (GCF), LIC 10.0%, concessional 2.0%
(OECD DAC/GCF floor), commercial 12.0%, social 1.5% (Stern/Ramsey).

**MDB facilities:** GCF, GEF, AIIB, ADB, IADB, EIB, AFD, World Bank — with min project size,
max grant %, typical adaptation grant % and eligibility criteria; geographic screens are
hard-coded country lists (AIIB 11 Asian codes, IADB 11 LAC codes) and "developing" =
membership of the 30-country `NAP_COUNTRY_PROFILES` table (Bangladesh 82 … Somalia 35
ambition scores).

### 7.3 Calculation walkthrough

1. **Resilience delta:** `effective_rr = matched_rr × (1 − max(0,(horizon−20)/100))` (10% decay
   per decade beyond 20y); `post_risk = max(baseline×(1−effective_rr), baseline×residual_floor)`;
   maladaptation flag = High when grey infrastructure (wall/levee/dyke/dam) meets a 3C/4C
   scenario.
2. **NPV (annuity model):** `AF = (1−(1+r)^−n)/r`; `PV_benefits = annual_benefits × AF`;
   `PV_costs = investment + annual_O&M × AF`; `NPV = PV_b − PV_c`; `BCR = PV_b/PV_c`;
   `SROI = PV_b/investment`; `cost_per_beneficiary = lifecycle_cost/beneficiaries`;
   `lives_protected = PV_benefits/$50k` (explicit rough proxy); IRR via 50-iteration bisection
   on the annuity PV.
3. **MDB eligibility:** filter by min size and geography; `estimated_finance = investment ×
   min(grant_pct/100, 0.5)`; finance mix assumes a fixed 40% concessional-loan slice.
4. **Composite & portfolio:** full assessment combines the five weighted components;
   portfolio aggregation weights `adaptation_score` by investment size and sums NPV,
   beneficiaries and grant potential.

### 7.4 Worked example — adaptation NPV

Project: investment $25M, annual benefits $4M, O&M $0.4M, 20y, r = 7% (sovereign LMIC),
50,000 beneficiaries.

| Step | Computation | Result |
|---|---|---|
| Annuity factor | (1 − 1.07⁻²⁰)/0.07 | 10.594 |
| PV benefits | 4 × 10.594 | **$42.38M** |
| PV costs | 25 + 0.4 × 10.594 | **$29.24M** |
| NPV | 42.38 − 29.24 | **$13.14M** |
| BCR | 42.38 / 29.24 | **1.45** → Viable |
| SROI | 42.38 / 25 | **1.70** |
| Cost/beneficiary | 33.0M / 50,000 | **$659.50** |
| NPV component of composite | min(100, 1.45×40) = 58 → ×0.25 | **14.5 pts** |

### 7.5 Frontend page vs engine

The React page (`AdaptationFinancePage.jsx`) exposes 5 tabs matching the engine's sub-modules
and POSTs to `/gfma-alignment`, `/gari-scoring`, `/adaptation-npv`, `/full-assessment` plus
four `GET /ref/*` reference endpoints. However, its **dashboard visuals are locally seeded**,
not engine outputs: `gfmaAlignment = round(seed(101)·20+72)`, `bcrValue = (seed(102)·20+18)/10`,
`livesProtected = seed(104)·80000+40000`, hazard baseline/post-invest bars are hand-typed, and
the RCP sensitivity simply shifts post-investment scores by −5/+8/+18 points across scenarios.
`portfolioScore = (gfmaAlignment + gariComposite)/2` — a page-only formula that differs from
the engine's 5-component composite.

### 7.6 Data provenance & limitations

- All page-level KPIs and charts use the seeded PRNG `seed(s)=frac(sin(s+1)×10⁴)` — synthetic
  demo values. Engine constants (BCR ranges, risk-reduction fractions, RCP multipliers,
  ambition scores) are hand-authored, literature-plausible values with named references in
  docstrings but no machine-readable citations; treat as stylised.
- NAP profiles (30 countries, status/year/priority sectors) approximate the UNFCCC NAP
  registry as of ~2023–24 but are static snapshots.
- Simplifications vs production: flat annuity cash flows (no benefit ramp-up, climate-change
  growth in avoided losses, or hazard-frequency escalation inside the NPV); keyword-based text
  scoring for GARI evidence; MDB geographic screens are partial country lists; the
  "lives protected" $50k proxy is not an actuarial estimate; RCP multipliers are computed but
  not fed back into the resilience-delta arithmetic (they are reported alongside it).

### 7.7 Framework alignment

- **GFMA Adaptation & Resilience Finance framework (2022)** — the real GFMA/BCG report defines
  adaptation finance categories and bankability barriers; the module operationalises it as an
  8-category taxonomy with co-benefit matching.
- **GARI (Global Adaptation & Resilience Investment working group)** — an investor coalition
  whose guidance frames resilience investment quality; the 6-criteria/weights rubric here is
  the platform's structured rendering of those principles.
- **HM Treasury Green Book 2022 / EU JASPERS** — source of the social CBA structure (annuity
  discounting, 3.5% HIC sovereign rate).
- **ISO 14091:2021 / ISO 14093:2022** — vulnerability-assessment and local-adaptation-finance
  standards referenced for the resilience-delta and financing logic.
- **UNFCCC NAP / Paris Agreement Art. 7** — NAP/NDC alignment scoring (Comprehensive 85 /
  Moderate 60 / Limited 35) mirrors the NDC adaptation-component synthesis approach.
- **GCF/GEF/MDB eligibility** — facility terms (grant ceilings, concessionality) reflect
  published facility rules in stylised form.

## 9 · Future Evolution

### 9.1 Evolution A — Climate-escalated NPV with RCP feedback and calibrated BCRs (analytics ladder: rung 2 → 3)

**What.** The `AdaptationFinanceEngine` is already a genuine tier-A vertical (8 sub-modules,
12 routes) with scenario inputs — but §7.6 documents two honest gaps: the RCP hazard
multipliers are computed yet **not fed back** into the resilience-delta arithmetic, and the
NPV is a flat annuity with no hazard-frequency escalation or benefit ramp-up. Evolution A
closes both and calibrates: avoided-loss benefits escalate along the chosen RCP's
intensity/frequency multipliers inside `calculate_adaptation_npv`, and the hand-authored
BCR ranges (NbS 5.0–15.0, coastal 4.0–11.0) get benchmarked against published GCF funding
proposals and CPI adaptation-finance datasets, with machine-readable citations replacing
docstring references.

**How.** (1) `calculate_resilience_delta` applies `rcp_hazard_multiplier` to baseline risk
before the `effective_rr` reduction, reporting both unadjusted and RCP-adjusted deltas.
(2) NPV gains a `benefit_escalation_pct` derived from the RCP damage-%GDP trajectory, so
PV_benefits is a growing annuity. (3) A `bench_quant` pin locks the §7.4 worked example
($13.14M NPV, BCR 1.45) as the zero-escalation reference case; calibration deltas versus
GCF-approved project BCRs are published in the `/ref/gfma-categories` payload.

**Prerequisites.** Lineage harness shows `POST /full-assessment` currently **fails** — fix
that before layering escalation on top; NAP profiles (static ~2023–24 snapshot, 30
countries) refreshed from the UNFCCC registry. **Acceptance:** same project under '1.5C'
vs '4C' produces different NPV and resilience delta; the pinned legacy case still
reproduces; each BCR range carries a source citation retrievable via the ref endpoint.

### 9.2 Evolution B — Bankability analyst that runs the full assessment (LLM tier 2)

**What.** A tool-calling analyst on the Adaptation Finance Hub that executes natural-
language appraisals — "assess a $25M Bangladesh flood-protection project with $4M annual
benefits over 20 years" — by calling `POST /gfma-alignment`, `/gari-scoring`,
`/adaptation-npv`, `/mdb-eligibility`, `/nap-ndc-alignment` and `/full-assessment`, then
narrating the composite (`0.20·GFMA + 0.30·GARI + 0.25·min(100,BCR×40) + 0.15·MDB +
0.10·NAP/NDC`) and bankability tier from real engine output. It can also chain the four
`GET /ref/*` endpoints to answer "which MDB facilities fit this ticket size and geography?"

**How.** Tool schemas from the module's 12 OpenAPI operations; the no-fabrication validator
checks every numeric against tool outputs; the GARI text-evidence fields are a natural LLM
fit — the copilot drafts structured `additionality_evidence`/`governance_structure` text
from user narrative, but the engine's `_parse_score` keyword rubric remains the scorer, so
the LLM shapes inputs, never scores.

**Prerequisites (hard).** The §7.5-documented page defect first: dashboard KPIs are locally
seeded (`gfmaAlignment = seed(101)·20+72`, `bcrValue`, `livesProtected`) and
`portfolioScore` uses a page-only formula that contradicts the engine composite — the page
must render engine responses before an LLM narrates them; `/full-assessment` failure fixed.
**Acceptance:** every numeric in an answer traces to a tool call in-conversation; the
copilot's composite matches `run_full_assessment` exactly, not the legacy page average.