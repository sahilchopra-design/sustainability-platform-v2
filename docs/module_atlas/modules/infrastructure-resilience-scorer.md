# Infrastructure Resilience Scorer
**Module ID:** `infrastructure-resilience-scorer` · **Route:** `/infrastructure-resilience-scorer` · **Tier:** B (frontend-computed) · **EP code:** EP-CF2 · **Sprint:** CF

## 1 · Overview
5-pillar resilience scoring for 10 global infrastructure assets. Includes retrofit prioritisation by BCR, climate haircut valuation (2-33%), and 5-year trend analysis.

**How an analyst works this module:**
- Portfolio Overview shows all 10 assets with score, band, haircut, and retrofit BCR
- Asset Deep-Dive shows 5-pillar radar chart and hazard exposure
- Retrofit Prioritisation ranks assets by BCR for investment allocation
- Climate Haircut shows value impairment per asset as percentage
- Trend Analysis tracks 5-year resilience improvement

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSETS` | 21 | `name`, `type`, `location`, `value_m`, `age`, `pillars`, `structural`, `operational`, `financial`, `environmental`, `social` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Portfolio Overview', 'Asset Deep-Dive', 'Retrofit Prioritisation', 'Climate Haircut', 'Trend Analysis'];` |
| `sortedAssets` | `useMemo( () => [...ASSETS].sort((a, b) => sortField === 'retrofit_bcr' ? b.retrofit_bcr - a.retrofit_bcr : sortField === 'climate_haircut' ? b.climate_haircut - a.climate_haircut : b.resilience_score - a.resilience_score), [sortField] );` |
| `portfolioAvg` | `Math.round(ASSETS.reduce((s, a) => s + a.resilience_score, 0) / ASSETS.length);` |
| `totalValue` | `ASSETS.reduce((s, a) => s + a.value_m, 0);` |
| `totalHaircut` | `Math.round(ASSETS.reduce((s, a) => s + a.value_m * a.climate_haircut / 100, 0));` |
| `totalRetrofitCost` | `ASSETS.reduce((s, a) => s + a.retrofit_cost_m, 0);` |
| `totalRetrofitBenefit` | `ASSETS.reduce((s, a) => s + a.retrofit_benefit_m, 0);` |
| `radarData` | `selectedAsset ? Object.entries(selectedAsset.pillars).map(([k, v]) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Resilience | `Equal-weighted avg` | Model output | Average score across 10 infrastructure assets |
| Climate Haircut | `Σ(asset_value × haircut_pct)` | UNEP FI CVC | Total portfolio value impairment from physical climate risk |
| Top Retrofit BCR | `Bangladesh Delta` | Model output | Highest return per dollar of climate-proofing investment |

## 5 · Intermediate Transformation Logic
**Methodology:** 5-pillar weighted resilience scoring
**Headline formula:** `Composite = avg(Structural, Operational, Financial, Environmental, Social)`

Each asset scored 0-100 across 5 pillars. Bands: RESILIENT(≥80), ADEQUATE(≥65), VULNERABLE(≥50), CRITICAL(<50). Climate haircut = f(HazardExposure, Vulnerability, AdaptiveCapacity) calibrated from IPCC damage functions. Retrofit BCR ranks investments by return per dollar of climate-proofing.

**Standards:** ['GRESB Infrastructure', 'RICS Resilience', 'UNEP FI']
**Reference documents:** GRESB Infrastructure Resilience; RICS Resilience Practice Alert; UNEP FI Climate Value-at-Risk

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is broadly faithful here: the code does implement a 5-pillar equal-weighted
resilience composite, retrofit BCR ranking, and a climate-haircut valuation view. The important
caveat is that **every driver is a hard-coded constant** in a 10-asset curated array — the
`resilience_score`, `retrofit_bcr`, and `climate_haircut` are *stored*, not derived from any hazard/
vulnerability/adaptive-capacity model. (The guide says "10 global infrastructure assets"; the code
defines 10 — the JSON `rows:21` count is stale.)

### 7.1 What the module computes

The one genuine derivation is that the stored `resilience_score` equals the mean of the five stored
pillars, and the page recomputes portfolio aggregates from the array:

```
resilience_score ≡ avg(structural, operational, financial, environmental, social)   // e.g. A01
portfolioAvg   = round(Σ resilience_score / N)
totalValue     = Σ value_m
totalHaircut   = round(Σ value_m × climate_haircut/100)          // $M value impairment
totalRetrofitCost/Benefit = Σ retrofit_cost_m / Σ retrofit_benefit_m
```

Verification of the pillar→score identity: A01 `(82+78+75+68+72)/5 = 75.0 = resilience_score`;
A02 `(90+85+82+78+80)/5 = 83.0`; A05 `(95+92+88+85+90)/5 = 90.0`. The composite is thus the pillar
average, but the pillar values themselves are hand-authored, not modelled.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| Pillars | Structural, Operational, Financial, Environmental, Social (each 0–100) | Hand-set per asset; equal-weight composite |
| Band cut-offs | ≥80 RESILIENT, ≥65 ADEQUATE, ≥50 VULNERABLE, else CRITICAL | `scoreBand()` — display rubric |
| `retrofit_cost_m` / `retrofit_benefit_m` / `retrofit_bcr` | hard-coded per asset | Curated; BCR ≈ benefit/cost (e.g. A07 620/85 ≈ 7.3) |
| `climate_haircut` (%) | 2.1–32.5 | Hard-coded; guide says `f(HazardExposure, Vulnerability, AdaptiveCapacity)` per IPCC damage functions — **not computed** |
| `trend` (5-year) | hand-set arrays trending up to current score | Illustrative improvement path |
| `remaining_life`, `age`, `value_m`, `hazards`, `condition` | curated constants | Realistic named assets (Thames Barrier, Rotterdam, Changi T5, Bangladesh Delta…) |

The BCR values are internally consistent with benefit/cost (A07 = 620/85 = 7.29 ≈ 7.3, the guide's
"Top Retrofit BCR 7.3× Bangladesh Delta"), confirming BCR is a stored quotient rather than a live
`Σ ΔEAL/(1+r)^t` optimisation.

### 7.3 Calculation walkthrough

1. `ASSETS` (10 curated rows) is the data source; `sortedAssets` orders by the selected field
   (resilience / BCR / haircut), using a non-mutating `[...ASSETS].sort`.
2. Portfolio KPIs sum the stored fields (avg score, total value, total $ haircut, total retrofit
   cost/benefit).
3. Asset deep-dive renders a 5-axis pillar radar from `selectedAsset.pillars`.
4. Retrofit tab ranks by `retrofit_bcr`; climate-haircut tab shows `value_m × haircut%`.
5. Trend tab plots each asset's 5-point `trend` array.

### 7.4 Worked example (Bangladesh Delta Embankments, A07)

| Metric | Computation | Result |
|---|---|---|
| Composite score | (42+38+30+55+48)/5 | **42.6 → stored 43** |
| Band | 43 < 50 | CRITICAL |
| Retrofit BCR | 620 / 85 | **7.3×** (highest in portfolio) |
| Value haircut | 320 × 32.5/100 | **$104M** impairment |
| Contribution to portfolioAvg | +43 to Σ, /10 | — |

Portfolio total haircut = Σ `value_m × haircut%` across all 10 assets (e.g. Rotterdam 5200×4.2% =
$218M, California 3400×18.2% = $619M, …), summing to the headline "$1.2B" figure in the guide.

### 7.5 Companion analytics on the page

- **Retrofit prioritisation** — BCR-ranked bar for capital allocation.
- **Climate-haircut waterfall** — per-asset % and $ impairment.
- **Trend analysis** — 5-year resilience trajectory per asset (all trend upward by construction).

### 7.6 Data provenance & limitations

- **All 10 assets are curated static demo data** — no PRNG here, but equally not real data; scores,
  BCRs, and haircuts are author-assigned.
- `climate_haircut` is the key unbacked quantity: the guide claims it is calibrated from IPCC damage
  functions and hazard/vulnerability/adaptive-capacity, but in code it is a single hard-coded number
  per asset with no derivation.
- Retrofit BCR is a stored benefit/cost quotient, not a discounted avoided-loss optimisation; no
  discount rate, EAL curve, or intervention efficacy model is present.
- Pillar scores are hand-set, so the composite carries no traceable evidence chain.

**Framework alignment:** *GRESB Infrastructure* — the 5-pillar structure loosely mirrors GRESB's
management/performance aspects but no GRESB scoring runs. *RICS Resilience* — referenced for the
resilience-band framing. *UNEP FI Climate Value-at-Risk* — the climate haircut is presented as a
UNEP-FI-style value impairment, but UNEP FI CVaR derives impairment from discounting climate-adjusted
cash flows under transition/physical scenarios; here it is a stored percentage.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Derive each asset's resilience pillars, climate haircut, and retrofit BCR from data rather than
hand-authored constants, for a real infrastructure portfolio — supporting capital-allocation and
TCFD physical-risk disclosure.

### 8.2 Conceptual approach
(1) Resilience pillars from an evidenced indicator library; (2) climate haircut as a **discounted
value impairment** under physical-risk scenarios, mirroring UNEP FI CVaR and MSCI Climate VaR; (3)
retrofit BCR from an EAL-reduction optimisation, per World Bank LIFELINES resilience economics.

### 8.3 Mathematical specification
For asset *a*, value `V_a`, discount rate `r`, horizon `H`:

```
Pillar_p,a = Σ_j w_{p,j}·norm(indicator_{a,j})              // per-pillar weighted indicator score
Resilience_a = Σ_p ω_p · Pillar_p,a                         // ω equal (0.2) by default
EAL_a(t,scn) = Σ_h ∫ DF_{h,a}(i)·V_a dλ  · m_h(t,scn)       // physical damage, §infra-climate-resilience 8.3
Haircut_a  = [ Σ_{t=1}^H (EAL_a(t,scn) + Δinsurance_a(t)) /(1+r)^t ] / V_a   // % of value
BCR_a      = Σ_t [EAL_a^base(t) − EAL_a^adapt(t)]/(1+r)^t  /  CapexAdapt_a
```

| Parameter | Source |
|---|---|
| Indicator weights `w`, pillar weights `ω` | GRESB/RICS materiality; expert elicitation |
| Fragility curves `DF` | JRC / HAZUS / LIFELINES sector curves |
| Scenario multipliers `m_h(t,scn)` | IPCC AR6 Atlas; NGFS Phase IV downscaled |
| Discount rate `r` | Asset WACC or social discount 3–5% |
| Insurance escalation `Δinsurance` | Swiss Re sigma |

### 8.4 Data requirements
Asset register (value, geolocation, class, age/condition); indicator inputs per pillar (structural
condition surveys, financial ratios, environmental & social metrics); hazard maps + fragility library;
intervention catalogue with capex and residual damage. Platform has band/rubric scaffolding; needs
real indicator and hazard feeds.

### 8.5 Validation & benchmarking plan
Reconcile haircut against UNEP FI CVaR / MSCI Climate VaR for overlapping assets; benchmark BCR
against LIFELINES 4:1–9:1; sensitivity of composite to pillar weights; backtest EAL against observed
loss history (EM-DAT) for calibration regions.

### 8.6 Limitations & model risk
Pillar-weight and fragility-curve subjectivity dominate uncertainty; haircut is sensitive to discount
rate and horizon; cascading service-disruption losses omitted. Fallback: report resilience as a band
and haircut/BCR as ranges across scenarios.

## 9 · Future Evolution

### 9.1 Evolution A — Derive haircut and BCR instead of storing them (analytics ladder: rung 1 → 2)

**What.** The module is honest curation with one genuine identity: `resilience_score ≡ avg(5 pillars)` verifies across the 10 hand-authored assets (Thames Barrier, Rotterdam, Bangladesh Delta…), and the stored BCRs are internally consistent quotients (A07: 620/85 = 7.3). But §7.6 names the unbacked quantities: `climate_haircut` (2.1–32.5%) is a single hard-coded number per asset despite the guide claiming IPCC-damage-function calibration; retrofit BCR is a stored quotient, not a discounted avoided-loss calculation; pillar scores carry no evidence chain; and every trend line goes up by construction. Evolution A implements the §8 spec: haircut as discounted EAL impairment (`Σ EAL(t,scn)/(1+r)^t / V_a` per UNEP FI CVaR logic), BCR as `Σ ΔEAL/(1+r)^t / Capex`, and pillars from a weighted indicator library.

**How.** (1) Reuse the hazard/EAL machinery specified for the sibling `infrastructure-climate-resilience` module (§8.3 cross-references it directly) — one EAL engine on the digital-twin grids should serve both modules rather than two parallel builds. (2) The 10 curated assets become the calibration set: computed haircuts compared against the stored ones, divergences documented (Bangladesh Delta's 32.5% is a strong prior to test). (3) Pillar indicators mapped to evidence fields (condition surveys, financial ratios) with per-indicator provenance. (4) Fix the stale atlas row count (JSON says 21, code defines 10) when the record is next rebuilt.

**Prerequisites.** The shared EAL engine (sequence after or with `infrastructure-climate-resilience` Evolution A); fragility-curve library; discount-rate convention chosen and disclosed. **Acceptance:** haircut and BCR are computed outputs with visible EAL/discounting inputs; the A07 BCR reproduces from a cash-flow trace, not a stored quotient; trends derive from dated records.

### 9.2 Evolution B — Retrofit capital-allocation copilot (LLM tier 1 → 2)

**What.** The module's decision is capital allocation: which retrofits to fund first. Evolution B answers that conversationally: "why is Bangladesh Delta the top BCR at 7.3×?", "how much portfolio haircut do we remove per $100M of retrofit spend?", "what moves the California asset out of the CRITICAL band?" Tier 1 grounds on the curated table and this page's worked examples (§7.4 traces A07's full decomposition); tier 2, post-Evolution-A, executes allocation what-ifs against the computed BCR engine — including a budget-constrained ranking ("allocate $200M across the 10 assets to maximise discounted avoided loss"), which is a natural greedy/knapsack ordering over computed BCRs.

**How.** Tier 1: atlas record + `ASSETS` into the corpus; the sort-field state passes as context. The copilot must distinguish stored from derived values with the §7.6 caveat — "haircut is author-assigned pending the EAL engine" — and must not present the illustrative all-upward trend arrays as measured improvement. Tier 2: tool schema over the Evolution A scoring/EAL routes; allocation answers show the BCR-ordered greedy trace. Band explanations quote the rubric cut-offs (≥80 RESILIENT … <50 CRITICAL) from §7.2.

**Prerequisites.** Copilot infrastructure (Phase 1); Evolution A for allocation math on computed values. **Acceptance:** stored-vs-derived provenance stated in every quantitative answer pre-Evolution-A; post, allocation recommendations reproduce from the logged BCR ordering and budget arithmetic.