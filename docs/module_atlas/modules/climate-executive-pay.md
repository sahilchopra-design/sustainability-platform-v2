# Climate Executive Pay Analytics
**Module ID:** `climate-executive-pay` · **Route:** `/climate-executive-pay` · **Tier:** B (frontend-computed) · **EP code:** EP-DK4 · **Sprint:** DK

## 1 · Overview
Analyses the design and effectiveness of climate-linked executive remuneration. Evaluates metric selection, target ambition, weighting, and vesting verification against TCFD, SBTi, and Paris Agreement benchmarks. Models incentive alignment and greenwashing risk in executive pay structures.

> **Business value:** Directly applicable to active ownership teams engaging company boards on remuneration committee decisions, governance-focused ESG analysts rating executive accountability, and SRI mandates requiring demonstrated climate pay alignment. Aligned with PRI/IIGCC stewardship toolkit standards.

**How an analyst works this module:**
- Input executive pay structure and climate metric details
- Score metric quality and target ambition
- Evaluate weight materiality vs PRI 20% benchmark
- Assess verification rigour and greenwashing risk
- Generate PRI/IIGCC climate pay engagement letter output

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `EXECS`, `KpiCard`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `totalComp` | `parseFloat((2 + sr(i * 13) * 48).toFixed(1));` |
| `climateKpiWeight` | `parseFloat((5 + sr(i * 17) * 35).toFixed(1));` |
| `climateBonusActual` | `parseFloat((totalComp * climateKpiWeight / 100 * (0.5 + sr(i * 19) * 0.7)).toFixed(2));` |
| `scope1Reduction` | `parseFloat((sr(i * 23) * 30).toFixed(1));` |
| `scope1Target` | `parseFloat((5 + sr(i * 29) * 25).toFixed(1));` |
| `climateMetricMet` | `scope1Reduction >= scope1Target * 0.9;` |
| `carbonPricingIncentive` | `sr(i * 31) > 0.45;` |
| `longTermClimateVesting` | `sr(i * 37) > 0.4;` |
| `peerBenchmarkPct` | `parseFloat((70 + sr(i * 41) * 60).toFixed(0));` |
| `payRatio` | `Math.round(50 + sr(i * 43) * 350);` |
| `targetStatus` | `scope1Reduction >= scope1Target ? 'Met' : scope1Reduction >= scope1Target * 0.7 ? 'Partial' : 'Missed';` |
| `avgKpiWeight` | `(filtered.reduce((a, e) => a + e.climateKpiWeight, 0) / n).toFixed(1);` |
| `totalBonusPool` | `filtered.reduce((a, e) => a + e.climateBonusActual, 0).toFixed(1);` |
| `pctMet` | `((filtered.filter(e => e.targetStatus === 'Met').length / n) * 100).toFixed(0);` |
| `avgPayScore` | `(filtered.reduce((a, e) => a + e.climatePayScore, 0) / n).toFixed(1);` |
| `bySector` | `SECTORS.map(s => {` |
| `byCountry` | `COUNTRIES.map(cn => {` |
| `scatterData` | `filtered.map(e => ({ x: e.scope1Target, y: e.scope1Reduction, name: e.name, met: e.climateMetricMet }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate in FTSE 100 LTIPs | — | Willis Towers Watson Global Executive Pay 2023 | 78% of FTSE 100 companies include ESG/climate metric in long-term incentive plan |
| Typical Climate Pay Weight | — | PRI Climate Pay Survey 2023 | Average climate metric weight in executive LTIP is 5–15% — PRI recommends minimum 20% for materiality |
| Climate Metric Verification | — | Minerva Analytics 2023 | Only 32% of climate pay metrics are independently verified — high greenwashing risk |
- **Executive remuneration reports + proxy statements** → Climate pay structure analysis → **Metric, target, weight, and vesting conditions for climate components**
- **Company emissions data + SBTi targets** → Ambition verification → **Target trajectory vs SBTi-required reductions**
- **PRI/IIGCC climate pay quality frameworks** → Benchmark scoring → **Company score vs PRI recommended best practice**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Pay Alignment Score
**Headline formula:** `PayAlignScore = MetricQuality × TargetAmbition × WeightMateriality × VerificationRigor; EffectiveClimateWeight = ExplicitClimateMetric% × TotalPay`

Four-factor score evaluates whether climate metrics are material (Scope 1+2+3), ambitious (SBTi-aligned), appropriately weighted (>10% of LTIP), and verified by independent body

**Standards:** ['TCFD Implementation Guide — Executive Remuneration 2021', 'PRI Guidance on Climate-Linked Remuneration 2022', 'IIGCC Net Zero Stewardship Toolkit 2023', 'SBTi Corporate Net Zero Standard — Remuneration Section']
**Reference documents:** PRI Guidance on Climate-Related Targets in Executive Remuneration (2022); IIGCC Net Zero Stewardship Toolkit — Remuneration Guidance (2023); Willis Towers Watson Global Executive Remuneration Research 2023; Minerva Analytics — Climate Pay Quality Report 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry specifies a *multiplicative four-factor*
> pay-alignment score `PayAlignScore = MetricQuality × TargetAmbition × WeightMateriality ×
> VerificationRigor` and `EffectiveClimateWeight = ExplicitClimateMetric% × TotalPay`. **The code's
> score is additive, not multiplicative, and includes an `sr()` random term** — it is not the guide's
> four-factor product, and there is no "MetricQuality" or "VerificationRigor" input. The module
> analyses 65 `sr()`-seeded executives across a climate-pay dashboard. The sections below document the
> code.

### 7.1 What the module computes

Per executive, a climate-linked bonus and a composite climate-pay score:

```
climateBonusActual = totalComp × (climateKpiWeight/100) × (0.5 + sr(i·19)×0.7)     (achievement factor 0.5–1.2)
climateMetricMet   = scope1Reduction ≥ scope1Target × 0.9
climatePayScore    = min(100,
                       climateKpiWeight × 1.5
                       + (climateMetricMet ? 20 : 0)
                       + (carbonPricingIncentive ? 15 : 0)
                       + (longTermClimateVesting ? 15 : 0)
                       + sr(i·47) × 15 )
targetStatus       = scope1Reduction ≥ scope1Target       ? 'Met'
                     : scope1Reduction ≥ scope1Target×0.7  ? 'Partial' : 'Missed'
```

`climateBonusActual` is a genuine derivation (comp × weight × achievement); `climatePayScore` is an
**additive rubric with a seeded 0–15 noise term**, capped at 100.

### 7.2 Parameterisation / synthetic executive generation

| Field | Generation | Range |
|---|---|---|
| `totalComp` | `2 + sr(i·13)×48` | $2–50 M |
| `climateKpiWeight` | `5 + sr(i·17)×35` | 5–40 % |
| `climateBonusActual` | comp × weight/100 × (0.5 + sr(i·19)×0.7) | derived |
| `scope1Reduction` | `sr(i·23)×30` | 0–30 % |
| `scope1Target` | `5 + sr(i·29)×25` | 5–30 % |
| `carbonPricingIncentive` | `sr(i·31) > 0.45` | boolean |
| `longTermClimateVesting` | `sr(i·37) > 0.4` | boolean |
| `peerBenchmarkPct` | `70 + sr(i·41)×60` | 70–130 |
| `payRatio` | `50 + sr(i·43)×350` | 50–400 (CEO-to-median) |
| `climatePayScore` weights | 1.5 / 20 / 15 / 15 / +noise | Hard-coded rubric |

### 7.3 Calculation walkthrough

1. `EXECS` builds 65 executives with seeded comp, KPI weight, Scope 1 target/actual, and boolean
   incentive flags.
2. `climateMetricMet` and `targetStatus` classify performance against the 90 %/70 % thresholds.
3. `climatePayScore` sums the KPI-weight term, met/incentive/vesting bonuses, and seeded noise.
4. Filters slice by sector/country/status/min-KPI/min-comp; KPIs: `avgKpiWeight`, `totalBonusPool`,
   `pctMet`, `avgPayScore`.
5. `bySector`/`byCountry` compute per-group average weight, score, and % with long-term vesting.
6. `scatterData` plots Scope 1 target vs actual, coloured by whether the metric was met.

### 7.4 Worked example — one executive's score & bonus

Exec with `totalComp = 20`, `climateKpiWeight = 25`, `scope1Reduction = 18`, `scope1Target = 20`,
`carbonPricingIncentive = true`, `longTermClimateVesting = false`, seeds giving achievement 0.9 and
noise 8:

| Step | Computation | Result |
|---|---|---|
| Metric met? | 18 ≥ 20×0.9 = 18 | **true** |
| Target status | 18 ≥ 20? no; 18 ≥ 14? yes | **Partial** |
| Climate bonus | 20 × 0.25 × 0.9 | **$4.5 M** |
| Pay score | 25×1.5 + 20 + 15 + 0 + 8 | 37.5 + 43 = **80.5 → 81** |

The exec hits the 90 % metric threshold (met) but not the full target (partial status) — the two
gates use different cutoffs (0.9 for the score bonus, 1.0/0.7 for the status label).

### 7.5 Data provenance & limitations

- **All 65 executives are synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`. Names,
  comp, KPI weights, Scope 1 performance and incentive flags are fabricated.
- The **pay score is additive with a seeded noise term**, not the guide's multiplicative four-factor
  product; "MetricQuality" and "VerificationRigor" factors do not exist in code.
- Climate metrics are Scope 1 only (guide expects Scope 1+2+3 materiality); SBTi-alignment of targets
  is not checked despite the guide.
- The 0.9-vs-1.0 threshold split between `climateMetricMet` and `targetStatus` is an internal
  inconsistency (an exec can be "met" for scoring but "partial" for status).

**Framework alignment:** The page references TCFD Executive Remuneration guidance, PRI climate-linked
remuneration, IIGCC Net Zero Stewardship, and the SBTi remuneration section as conceptual anchors.
It approximates the "climate weight in variable pay" idea but implements an ad-hoc additive score;
§8 specifies the four-factor alignment model the guide describes.

## 8 · Model Specification — Climate Pay-Alignment Score

**Status: specification — not yet implemented in code.** The guide's multiplicative four-factor
score is not implemented (the code uses an additive rubric with seeded noise); this specifies it.

### 8.1 Purpose & scope
Score whether an issuer's executive remuneration credibly links pay to climate performance —
material metrics, ambitious targets, meaningful weight, independent verification — for stewardship
and engagement teams.

### 8.2 Conceptual approach
A **four-factor multiplicative quality score** (a weakness in any factor collapses the score),
mirroring PRI's climate-linked remuneration assessment and the IIGCC Net Zero Stewardship Toolkit's
remuneration criteria. Benchmarks: PRI Guidance on Climate-Linked Remuneration and IIGCC toolkit.

### 8.3 Mathematical specification
```
MetricQuality     = scopeCoverage(1+2+3) ∈ {0.3, 0.6, 1.0}          (breadth of GHG scope)
TargetAmbition    = min(1, targetReduction / SBTi_pathway_reduction) (vs 1.5°C SDA)
WeightMateriality = min(1, climateWeight% / 10%)                     (≥10% LTIP = full credit)
VerificationRigor = {0.4 self, 0.7 audit-firm, 1.0 independent assurance}
PayAlignScore     = 100 · MetricQuality · TargetAmbition · WeightMateriality · VerificationRigor
EffectiveClimateWeight = ExplicitClimateMetric% × TotalPay
```
| Parameter | Source |
|---|---|
| Scope coverage | Company remuneration report |
| SBTi pathway reduction | SBTi SDA sector pathway |
| Climate weight % | LTIP/annual-bonus disclosure |
| Verification level | Assurance statement |

### 8.4 Data requirements
Per-issuer remuneration-report disclosures: which GHG scopes are in the plan, target reduction and
horizon, % of variable pay tied to climate, and verification body. The KPI weight and Scope 1
performance exist as fields; the missing inputs are scope breadth, SBTi benchmark, and verification.

### 8.5 Validation & benchmarking plan
Reconcile scores against PRI/IIGCC published remuneration assessments for a sample of issuers;
check that a zero in any factor drives the score toward zero (multiplicative property); backtest
against realised say-on-pay dissent; sensitivity-test the 10 % materiality and SBTi ambition
benchmarks.

### 8.6 Limitations & model risk
Disclosure quality varies; SBTi pathway may not exist for all sectors; verification tiers are coarse.
Conservative fallback: report the four sub-factors alongside the composite and flag issuers with
undisclosed verification as VerificationRigor = 0.4.

## 9 · Future Evolution

### 9.1 Evolution A — The guide's four-factor score, without the random term (analytics ladder: rung 1 → 2)

**What.** §7 flags two defects in one formula: the code's climate-pay score is
additive where the guide specifies a multiplicative four-factor product
(`PayAlignScore = MetricQuality × TargetAmbition × WeightMateriality ×
VerificationRigor`), and it includes a literal `sr(i·47)×15` random term — a score
that changes with the seed, not the facts. There are no MetricQuality or
VerificationRigor inputs at all, and the 65 executives are seeded. Evolution A
implements the guide's rubric properly: four sub-scores with defined anchors
(MetricQuality: scope coverage 1/1+2/1+2+3; TargetAmbition: SBTi-validated vs
self-set; WeightMateriality: vs the PRI 20% LTIP benchmark the page already
references; VerificationRigor: independent assurance vs self-reported), combined
multiplicatively so a zero on any factor zeroes the score — the design intent of a
multiplicative form, which the additive version silently loses.

**How.** (1) Pure scoring function, unit-tested, random term deleted (guardrail
class). (2) The executive universe rebuilt from disclosed data — climate-linked pay
terms are public in proxy statements/remuneration reports, and a starter set of 20–30
real disclosures (hand-curated with citations) beats 65 seeded rows. (3) The
greenwashing-risk view derived from the score's factor pattern (high weight × low
verification = the classic red flag) rather than asserted.

**Prerequisites (hard).** Random-term removal; disclosed-data curation effort scoped
(one-time, then annual refresh per proxy season). **Acceptance:** an executive with
unverified self-set targets scores near zero regardless of KPI weight
(multiplicativity test); every scored row cites its disclosure document; the mismatch
flag clears.

### 9.2 Evolution B — Stewardship-engagement copilot (LLM tier 2)

**What.** The module's stated output is a "PRI/IIGCC climate pay engagement letter" —
a natural LLM deliverable. An assistant that takes a scored company, decomposes the
weak factors ("verification is the binding gap: targets are self-assessed"), and
drafts the engagement letter with the score evidence and the PRI/IIGCC framework
citations from §5 — every claim about the company traceable to its disclosed pay
terms, every benchmark to the framework text.

**How.** Tool call to the Evolution A scoring function for the decomposition;
letter templates per the IIGCC stewardship-toolkit structure; the no-fabrication
validator on all percentages and comp figures (drafting to a board is exactly where
invented numbers would be most damaging); human review before any external use.

**Prerequisites (hard).** Evolution A first — an engagement letter citing a score
with a random component would be indefensible in a stewardship dialogue.
**Acceptance:** a generated letter contains only disclosed figures and computed
sub-scores with citations; regenerating produces identical numbers (determinism
test); the assistant refuses to score companies lacking disclosed pay terms.