# Climate Adaptation Portfolio
**Module ID:** `climate-adaptation-portfolio` · **Route:** `/climate-adaptation-portfolio` · **Tier:** B (frontend-computed) · **EP code:** EP-EK5 · **Sprint:** EK

## 1 · Overview
28-asset multi-hazard adaptation portfolio (coastal/flood/heat/NbS/water/EWS) with BCR, IRR, adaptation score, risk-return scatter, benefit attribution (physical risk reduction/productivity/co-benefits/carbon credits), regional radar (EU/APAC/LATAM/Africa/MENA), and 30-year cash flow.

> **Business value:** Used by adaptation fund managers constructing climate resilience portfolios, DFI project teams screening adaptation investments, and sovereign planners prioritising BCR-optimal climate-proofing expenditure.

**How an analyst works this module:**
- Filter portfolio by asset type and region; sort by BCR, IRR, adaptation score, or CapEx
- Use risk-return scatter to identify optimal BCR/IRR positioning relative to climate risk score
- Review benefit attribution waterfall showing physical risk reduction, productivity, co-benefits, and carbon credits
- Analyse regional radar comparing BCR, adaptation depth, finance readiness, and climate urgency across 6 regions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALLOCATION_BY_TYPE`, `ATTRIBUTION`, `CASHFLOW`, `KpiCard`, `PORTFOLIO_ASSETS`, `Pill`, `REGION_RADAR`, `RISK_RETURN`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ALLOCATION_BY_TYPE` | 7 | `allocation`, `count`, `avgBCR` |
| `ATTRIBUTION` | 7 | `contribution` |
| `REGION_RADAR` | 7 | `EU`, `APAC`, `LATAM`, `Africa`, `MENA`, `NAm` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RISK_RETURN` | `PORTFOLIO_ASSETS.slice(0, 20).map(a => ({` |
| `prev` | `idx > 0 ? acc[idx - 1].cumulative : 0;` |
| `TABS` | `['Portfolio Overview', 'Asset Scorecard', 'Risk-Return Map', 'Benefit Attribution', 'Regional Analysis', 'Cash Flow Model'];` |
| `sorted` | `useMemo(() => [...filtered].sort((a, b) => b[sortField] - a[sortField]), [filtered, sortField]);` |
| `avgBCR` | `filtered.length ? filtered.reduce((a, b) => a + b.bcr, 0) / filtered.length : 0;` |
| `totalCapex` | `filtered.reduce((a, b) => a + b.capexM, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALLOCATION_BY_TYPE`, `ATTRIBUTION`, `REGION_RADAR`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Adaptation portfolio avg BCR | `World Bank 2022 project portfolio` | World Bank Adaptation Finance Review 2022 | Early warning systems BCR 12–32x at $18–180M cost; coastal barriers BCR 6.2x at $850M; NbS BCR 7.6x at $65–280M. |
| Adaptation finance gap | `Annual gap by 2030 (UNEP)` | UNEP Adaptation Gap Report 2023 | Developing countries need $215–387Bn/yr; MDB disbursements ~$21Bn/yr; private adaptation finance <$5Bn/yr; 40:1 gap. |
| End-of-life value leakage | `Adaptation co-benefits under-monetised` | Nature4Climate 2023 | Ecosystem service co-benefits rarely monetised in project finance; if captured, NbS BCR rises from 7.6x to 12–18x. |
- **UNEP AGR 2023 + World Bank GFDRR + GCF Adaptation Results Framework + IPCC AR6 WG2 + TCFD + AIIB CSF** → 28-asset portfolio + BCR screener + risk-return map + attribution + regional radar + 30yr CF model → **Adaptation fund managers, DFI portfolio teams, sovereign planners, and MDB climate finance officers**

## 5 · Intermediate Transformation Logic
**Methodology:** Adaptation Portfolio Construction
**Headline formula:** `PortfolioBCR = Σ(weight_i × BCR_i); Adaptation_Score = 0.4 × PhysicalRisk_reduction + 0.3 × CommunityResilience + 0.3 × Cobenefits; Risk_Adjusted_IRR = IRR / sqrt(ClimateRiskScore); CumulativeNCF grows to positive payback year`

World Bank GFDRR portfolio average BCR 6.1x; EWS shows highest BCR at lowest cost; NbS increasingly preferred over grey infrastructure for blended finance eligibility.

**Standards:** ['UNEP Adaptation Gap Report 2023', 'World Bank GFDRR Portfolio Review 2022', 'GCF Adaptation Results Framework 2023']
**Reference documents:** UNEP (2023) – Adaptation Gap Report; World Bank (2022) – GFDRR Climate Resilience Finance Portfolio Review; GCF (2023) – Adaptation Results Framework and Metrics

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry gives a specific calculation engine —
> `PortfolioBCR = Σ(weight_i × BCR_i)`, `Adaptation_Score = 0.4×PhysicalRisk_reduction +
> 0.3×CommunityResilience + 0.3×Cobenefits`, `Risk_Adjusted_IRR = IRR / √ClimateRiskScore`,
> "CumulativeNCF grows to positive payback year". **Only the last of these is implemented.** In the
> code, `bcr`, `adaptScore`, `irrPct`, `climateRisk` are **independent `sr()`-seeded random fields**
> on each asset — not composite scores. The portfolio "Avg BCR" is an unweighted mean, not the
> weighted `Σ(weight×BCR)`. There is no adaptation-score weighting and no risk-adjusted IRR. The
> only genuine computation is the 30-year cumulative net cash flow. The sections below document the
> code.

### 7.1 What the module computes

A 28-asset adaptation portfolio (`PORTFOLIO_ASSETS`) generated once with the platform PRNG, plus
six static tables (allocation, attribution, region radar) and one real cash-flow accumulation:

```
filtered  = assets where (type ∈ typeFilter) AND (region ∈ regionFilter)
avgBCR    = Σ bcr / count(filtered)                    // unweighted mean
totalCapex= Σ capexM
sorted    = [...filtered].sort by sortField desc        // bcr | irrPct | adaptScore | capexM
CASHFLOW.cumulative[t] = cumulative[t-1] + capex_t + opex_t + benefit_t   // real running NCF
```

### 7.2 Parameterisation / synthetic asset generation

Each of the 28 assets draws every quantitative field from `sr()` (all synthetic demo values):

| Field | Generation | Range |
|---|---|---|
| `capexM` | `sr(i·11)×450 + 20` | $20–470 M |
| `annualBenefitM` | `sr(i·13)×80 + 5` | $5–85 M |
| `bcr` | `sr(i·9)×10 + 2` | 2.0–12.0x |
| `climateRisk` | `sr(i·3)×40 + 40` | 40–80 |
| `adaptScore` | `sr(i·17)×40 + 50` | 50–90 |
| `irrPct` | `sr(i·19)×10 + 4` | 4–14 % |
| `tenor` | `sr(i·23)×25 + 15` | 15–40 yr |
| `type`/`region`/`financeSource`/`status` | index picks via `sr()` | categorical |

Because `bcr` and `annualBenefitM/capexM` are independent draws, an asset's stated BCR is **not**
consistent with its own benefit/cost — a model-validation red flag.

Static tables: `ALLOCATION_BY_TYPE` (6 rows, hard-coded allocation %/count/avgBCR — note EWS avgBCR
12.4x per the guide), `ATTRIBUTION` (6 benefit drivers summing to 100 %), `REGION_RADAR` (6 metrics
× 6 regions), and `CASHFLOW` (30 years of seeded capex/opex/benefit).

### 7.3 Calculation walkthrough

1. Filters slice `PORTFOLIO_ASSETS` → `filtered`; KPIs are `avgBCR` (mean) and `totalCapex` (sum).
2. `sorted` orders the filtered set by the chosen field for the Asset Scorecard.
3. `RISK_RETURN` maps the first 20 assets to (climateRisk, irrPct, capex) for the scatter.
4. **Cash Flow Model** is the only compounding computation: capex loaded in years 0–2, benefits from
   year 2, opex throughout, accumulated into `cumulative` — payback is the year `cumulative` crosses
   zero.

### 7.4 Worked example — cumulative NCF payback

The `CASHFLOW` accumulator (illustrative, seed-dependent values):

| Year | capex | opex | benefit | cumulative |
|---|---|---|---|---|
| 2024 (i=0) | ≈ −105 | ≈ −10 | 0 | −115 |
| 2025 (i=1) | ≈ −95 | ≈ −12 | 0 | −222 |
| 2026 (i=2) | ≈ −110 | ≈ −8 | +30 | −310 |
| … | 0 | −9 | +32 | rises ~ +23/yr |
| ~2038 | 0 | −9 | +30 | crosses 0 → **payback** |

Payback is the first year `cumulative ≥ 0`. This is a faithful running sum; only the inputs are
seeded-random.

### 7.5 Companion analytics

- **Benefit Attribution** — waterfall of the 6 `ATTRIBUTION` drivers (Physical Risk Reduction 42 %,
  Productivity 28 %, Co-benefits 14 %, Carbon Credits 8 %, Insurance 6 %, Land Value 2 %).
- **Regional Analysis** — `REGION_RADAR` compares BCR/Adaptation Depth/Finance Readiness/Climate
  Urgency/Co-benefits/Policy Support across EU/APAC/LATAM/Africa/MENA/NAm.
- **Adaptation Gap 2030 = $194 Bn/yr** — hard-coded KPI from UNEP Adaptation Gap Report 2023.

### 7.6 Data provenance & limitations

- **All 28 assets and the 30-year cash flow are synthetic**, generated by
  `sr(seed) = frac(sin(seed+1)×10⁴)`. Asset names are real projects but their financials are PRNG.
- `bcr`, `adaptScore`, `irrPct`, `climateRisk` are **not** the composite scores the guide describes —
  they are unrelated random draws, so cross-field consistency (BCR vs benefit/cost, IRR vs risk) is
  not enforced.
- `avgBCR` is an unweighted mean; the guide's `Σ(weight×BCR)` weighting and `IRR/√ClimateRisk`
  risk-adjustment are absent.
- `ALLOCATION_BY_TYPE`, `ATTRIBUTION`, `REGION_RADAR` are static hard-coded tables not derived from
  the asset set.

**Framework alignment:** UNEP Adaptation Gap Report 2023 ($194 Bn/yr gap KPI); World Bank GFDRR
portfolio practice (BCR-based screening, the 6.1x reference in the guide); GCF Adaptation Results
Framework (the adaptation-score concept). The module presents these as static references; the
composite adaptation-score and risk-adjusted-return maths that would operationalise them is
specified in §8.

## 8 · Model Specification — Adaptation Portfolio Construction & Scoring Engine

**Status: specification — not yet implemented in code.** The guide's `PortfolioBCR`,
`Adaptation_Score`, and `Risk_Adjusted_IRR` have no implementation (fields are `sr()`-seeded); this
specifies the model.

### 8.1 Purpose & scope
Construct a multi-hazard adaptation portfolio with internally consistent asset-level BCR, IRR, and a
composite adaptation score, and rank by risk-adjusted return, for DFI/fund allocation decisions.

### 8.2 Conceptual approach
A **CBA-driven portfolio optimiser** in the spirit of World Bank GFDRR project appraisal and GCF
Adaptation Results Framework: each asset's BCR/IRR is derived from a real discounted cash flow, a
composite adaptation score aggregates effectiveness dimensions, and portfolio metrics are value-
weighted. Benchmarks: World Bank adaptation portfolio review (avg BCR 6.1x) and GCF results-based
metrics.

### 8.3 Mathematical specification
```
BCR_i             = NPV(Benefit_i) / NPV(Cost_i)                      (r = 5%, 20–30 yr)
IRR_i             : NPV(Benefit_i − Cost_i ; IRR_i) = 0
Adaptation_Score_i= 0.4·PRR_i + 0.3·CommunityResilience_i + 0.3·CoBenefit_i     (0–100)
RiskAdjIRR_i      = IRR_i / √(ClimateRisk_i / 50)                     (normalised)
w_i               = Capex_i / Σ Capex
PortfolioBCR      = Σ w_i · BCR_i
Portfolio NCF(t)  = Σ_i (Benefit_i,t − Capex_i,t − Opex_i,t) ; payback = min t: cumNCF ≥ 0
```
| Parameter | Source |
|---|---|
| Discount rate `r` | 5 % (Global Commission on Adaptation) |
| Physical risk reduction `PRR_i` | Physical-risk engine avoided EAL |
| Co-benefit fraction | Nature4Climate / TEEB ecosystem-service valuation |
| ClimateRisk normaliser | ND-GAIN / WRI Aqueduct exposure index |
| Benefit/cost profiles | Project appraisal (capex/opex/benefit schedules) |

### 8.4 Data requirements
Per-asset capex/opex/benefit schedule, hazard-specific avoided EAL, community-resilience and
co-benefit scores, and a normalised climate-risk exposure. `capexM`/`annualBenefitM` exist; the
missing inputs are the time-profiled benefit stream and the resilience/co-benefit components.

### 8.5 Validation & benchmarking plan
Verify `BCR_i` reproduces `NPV(benefit)/NPV(cost)` (self-consistency the current random fields fail);
reconcile PortfolioBCR against World Bank GFDRR average (6.1x); sensitivity-test to `r` and the
adaptation-score weights; check risk-adjusted ranking stability under exposure-index perturbation.

### 8.6 Limitations & model risk
BCR sensitive to benefit horizon and discount rate; adaptation-score weights are judgemental;
√-risk normalisation is heuristic. Conservative fallback: rank by unadjusted BCR and flag any asset
whose BCR falls below the MDB-eligibility floor of 4x.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the composite scores the guide publishes (analytics ladder: rung 1 → 2)

**What.** §7 shows only one of the guide's four formulas exists: the 30-year
cumulative net cash flow is real, but `PortfolioBCR = Σ(w_i × BCR_i)` is actually an
unweighted mean, and `Adaptation_Score = 0.4·PhysRiskReduction + 0.3·Community +
0.3·Cobenefits` and `Risk_Adjusted_IRR = IRR/√ClimateRiskScore` are absent — the
28 assets carry *independent* `sr()`-seeded bcr/adaptScore/irr/climateRisk fields, so
the risk-return scatter plots noise against noise. Evolution A implements the three
missing formulas and makes the asset attributes internally consistent: BCR derived
from each asset's own capex and benefit fields, adaptation score composed from
sub-scores (which then must exist as fields), risk-adjusted IRR computed, and the
portfolio aggregate capex-weighted as published.

**How.** (1) Asset schema extension: physical-risk-reduction, community-resilience,
and co-benefit sub-scores per asset — seeded from the benefit-attribution categories
the `ATTRIBUTION` table already names, or entered per real asset. (2) The three pure
functions with the guide's exact weights, unit-tested; the scatter re-keyed to
computed values so position finally means something. (3) The PRNG asset generator
replaced by a fixtures file with per-field provenance notes, per the platform's
random-as-data guardrail.

**Prerequisites.** Decision whether the 28 assets stay as labelled fixtures or connect
to real DFI project data (GCF/GFDRR project databases are public); mismatch flag
clears when all four formulas compute. **Acceptance:** portfolio BCR changes when
weights (capex) shift even with constituent BCRs fixed; an asset's scatter position
moves when and only when its underlying fields change.

### 9.2 Evolution B — Portfolio-construction copilot (LLM tier 2)

**What.** An assistant for adaptation fund managers: "build me a mix with portfolio
BCR ≥ 5 and ≥30% nature-based solutions", "why does the EWS asset dominate on
risk-adjusted IRR?" (post-Evolution A this has a real answer: low capex, high BCR —
the World Bank GFDRR pattern §5 cites), "walk through the benefit attribution for the
coastal cluster". Screening and evaluation run as client-side tool calls over the
Evolution A functions and the cash-flow accumulator — the module has no backend
routes.

**How.** Tool schemas over `portfolioBCR`, `adaptationScore`, `riskAdjustedIRR`, and
the filter/aggregate pipeline; every BCR/IRR/score in an answer validated against
invocations; GFDRR/GCF benchmark comparisons cited from the §5 corpus with the 6.1x
portfolio-average figure attributed to its report.

**Prerequisites (hard).** Evolution A first — an allocation recommendation computed
over independent random fields would be indistinguishable from advice and completely
ungrounded. **Acceptance:** a recommended allocation's stated portfolio BCR is
reproducible by re-running the function; the copilot refuses country-specific hazard
claims (that belongs to the digital-twin modules, not this catalogue).