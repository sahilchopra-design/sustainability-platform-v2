# Adaptation Pathways Engine
**Module ID:** `climate-adaptation-pathways` · **Route:** `/climate-adaptation-pathways` · **Tier:** B (frontend-computed) · **EP code:** EP-CF1 · **Sprint:** CF

## 1 · Overview
8 adaptation strategies across 6 sectors with full cost-benefit analysis (BCR 3.8-14x), maladaptation risk assessment, UNEP adaptation finance gap analysis ($124B/yr), and SSP scenario sensitivity.

**How an analyst works this module:**
- Strategy Catalogue shows 8 strategies with BCR, IRR, payback, and type badges
- Click any strategy for detailed profile with effectiveness and co-benefits
- Cost-Benefit Analysis tab shows BCR ranking and cost vs benefit scatter
- Maladaptation Risk tab presents 5 documented cases with consequences and mitigation
- Adaptation Finance Gap shows UNEP data with $124B/yr gap and source breakdown
- Scenario Sensitivity shows BCR variation across 4 SSP pathways

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADAPTATION_FINANCE`, `MALADAPT_CASES`, `RADAR_DATA`, `STRATEGIES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `STRATEGIES` | 33 | `name`, `sector`, `type`, `hazard`, `cost_m`, `benefit_m`, `bcr`, `irr`, `payback`, `effectiveness`, `co_benefits`, `maladapt_risk`, `timeline`, `maturity`, `description`, `ssp_sensitivity`, `ssp` |
| `ADAPTATION_FINANCE` | 8 | `need`, `flow`, `gap` |
| `MALADAPT_CASES` | 6 | `risk`, `sector`, `hazard`, `consequence`, `mitigation` |
| `RADAR_DATA` | 7 | `val` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Strategy Catalogue', 'Cost-Benefit Analysis', 'Maladaptation Risk', 'Adaptation Finance Gap', 'Scenario Sensitivity'];` |
| `sortedByBcr` | `useMemo(() => [...STRATEGIES].sort((a, b) => b.bcr - a.bcr), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPTATION_FINANCE`, `MALADAPT_CASES`, `RADAR_DATA`, `STRATEGIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg BCR | `Investment-weighted` | Model output | Every $1 invested in adaptation returns $5.6 in avoided losses |
| Adaptation Finance Gap | `Need - Flow` | UNEP 2024 | Gap between developing country adaptation needs and current flows |
| Maladaptation Risk | `Per strategy` | IPCC AR6 WGII Ch.16 | Risk that adaptation action increases vulnerability or shifts risk |
| NbS BCR | — | Costanza et al. | Nature-based solutions deliver highest BCR due to co-benefits |

## 5 · Intermediate Transformation Logic
**Methodology:** Cost-benefit analysis with SSP sensitivity
**Headline formula:** `BCR = NPV_Benefits / NPV_Costs; SSP_BCR = BCR × scenario_hazard_multiplier`

Each strategy evaluated over 20-year NPV at 5% discount rate. Benefits = avoided physical losses + avoided business interruption + health co-benefits + carbon value. SSP sensitivity: BCR recalculated under SSP1-2.6 through SSP5-8.5 using IPCC hazard intensity multipliers. Maladaptation risk scored 0-100% based on lock-in, distributional equity, emissions impact.

**Standards:** ['UNEP Adaptation Gap Report', 'IPCC AR6 WGII', 'Global Commission on Adaptation']
**Reference documents:** UNEP Adaptation Gap Report 2024; IPCC AR6 WGII Chapter 16 (Maladaptation); Global Commission on Adaptation (2019); Costanza et al. (2014) Ecosystem Services

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Adaptation Pathways Engine (EP-CF1, Sprint CF) is a **decision-support catalogue** for eight
adaptation strategies across six sectors, with benefit-cost ranking, maladaptation cases, the UNEP
adaptation finance gap, and an SSP scenario-sensitivity view. It aligns broadly with its guide, with
one important nuance: **the headline BCR, IRR and payback are stored constants, not computed in code**
(the guide's "20-year NPV at 5% discount rate" is a *description* of how the numbers were derived
offline, not an on-page calculation).

### 7.1 What the module computes

The only live computations are sorts, a scenario lookup, and simple aggregates over the eight-row
`STRATEGIES` array:

```
sortedByBcr = [...STRATEGIES].sort by bcr desc
scenarioBCR(strategy) = strategy.ssp_sensitivity.find(ssp == selectedScenario).bcr
```

Each strategy's `bcr` is (to rounding) simply `benefit_m / cost_m` — e.g. Coastal Defence
`1820 / 450 = 4.04`, Mangrove `720 / 90 = 8.00`. The per-SSP `ssp_sensitivity` BCRs are a stored
4-point curve per strategy, monotonically decreasing from SSP1-2.6 → SSP5-8.5.

### 7.2 Parameterisation / provenance

| Field | Example (S8 Mangrove) | Provenance |
|---|---|---|
| `cost_m` / `benefit_m` | 90 / 720 ($M) | Hard-coded; benefit = "avoided physical loss + co-benefits" (guide) |
| `bcr` | 8.00 | Stored ≈ `benefit_m/cost_m`; not recomputed |
| `irr` / `payback` | 35.6 % / 3 yr | Hard-coded (offline NPV/IRR, not in code) |
| `effectiveness` / `co_benefits` / `maladapt_risk` | 76 / 95 / 3 (0–100) | Hard-coded expert scores |
| `ssp_sensitivity[]` | 9.5 / 8.0 / 6.2 / 4.8 | Hard-coded 4-point BCR curve per SSP |
| `ADAPTATION_FINANCE` | 2025 need 170 / flow 46 / gap 124 ($Bn/yr) | UNEP Adaptation Gap Report figures |
| `MALADAPT_CASES` (5) | sea-wall drainage, AC lock-in… | IPCC AR6 WGII Ch.16 maladaptation examples |
| `RADAR_DATA` | Effectiveness 77, BCR 82… | Portfolio-average composite scores |

The guide's BCR range "3.8–14x" matches `STRATEGIES` (min 3.82 S6, though the coded max is 8.00, not
14 — a guide overstatement). The finance gap $124 B/yr is the 2025 row of `ADAPTATION_FINANCE`.

### 7.3 Calculation walkthrough

1. **Strategy Catalogue** renders all 8 strategies with BCR-coloured badges (`bcrColor`: ≥6 green,
   ≥4 teal, ≥2 amber, else red).
2. **Cost-Benefit Analysis** shows `sortedByBcr` ranking and a cost-vs-benefit scatter; the "Total
   Avoided Loss $7.33B" tile is a hard-coded aggregate label.
3. **Maladaptation Risk** lists the 5 `MALADAPT_CASES` with consequence + mitigation.
4. **Adaptation Finance Gap** plots `need`/`flow`/`gap` from `ADAPTATION_FINANCE`.
5. **Scenario Sensitivity** re-reads each strategy's `ssp_sensitivity` BCR for the selected SSP.

### 7.4 Worked example — Mangrove restoration under two scenarios

Strategy **S8 Mangrove & Wetland Restoration** (`cost_m = 90`, `benefit_m = 720`):

| Step | Computation | Result |
|---|---|---|
| Base BCR | 720 / 90 | **8.00** |
| SSP1-2.6 BCR | `ssp_sensitivity` lookup | 9.5 (higher — orderly world, benefits realised earlier) |
| SSP5-8.5 BCR | `ssp_sensitivity` lookup | 4.8 (lower — severe hazard erodes NbS effectiveness) |
| BCR colour | 8.0 ≥ 6 | green |
| Maladaptation | `maladapt_risk = 3` | very low (NbS advantage) |

Note the SSP curve *falls* as warming rises for every strategy — encoding that under extreme SSPs the
hazard outpaces the adaptation's protective benefit, so avoided loss per dollar declines.

### 7.5 Data provenance & limitations

- **No seeded PRNG** and no live NPV engine: every BCR/IRR/payback/SSP figure is a hard-coded expert
  or offline-computed constant. The page presents them faithfully but cannot recompute them if inputs
  change.
- BCR is displayed as `benefit_m/cost_m` but the underlying "benefit" bundles avoided loss +
  co-benefits + carbon value into a single scalar with no visible decomposition.
- The SSP sensitivity is a stored 4-point curve, not derived from IPCC hazard-intensity multipliers
  applied to a damage function (the guide describes the intended derivation, not the code).
- `RADAR_DATA` and "$7.33B avoided loss" are static portfolio-level labels, not aggregates of the
  eight strategies.

**Framework alignment:** UNEP *Adaptation Gap Report* (the $70→340 B/yr need-vs-flow gap series is
lifted from it); IPCC AR6 WGII Ch.16 (the five maladaptation cases and the lock-in / risk-transfer
framing); Global Commission on Adaptation and Costanza et al. (2014) for the NbS BCR premium. The
module *presents* these frameworks' outputs rather than running their methodologies.

## 8 · Model Specification — Adaptation Benefit-Cost & SSP-Conditioned NPV Engine

**Status: specification — not yet implemented in code.** The guide attributes a "20-year NPV at 5%
discount" BCR and an "IPCC hazard-multiplier" SSP sensitivity; the code stores the outputs. This
specifies the model that should produce them.

### 8.1 Purpose & scope
Compute, per adaptation strategy, a discounted benefit-cost ratio, IRR and payback, and recompute
them under each SSP using hazard-intensity multipliers — so the catalogue is dynamic to cost, benefit
and scenario assumptions.

### 8.2 Conceptual approach
A **20-year discounted cash-flow CBA** (World Bank GFDRR / Global Commission on Adaptation practice)
in which benefits are avoided expected annual loss (EAL) plus monetised co-benefits, and the SSP
sensitivity applies an IPCC AR6 hazard-intensity multiplier to the avoided-loss stream. Benchmarks:
World Bank adaptation project appraisal (BCR ≥ 4 for MDB eligibility) and UNEP Adaptation Gap
methodology.

### 8.3 Mathematical specification
```
EAL_h        = Σ_i P(event_i,h) · Loss_i,h                       (expected annual loss by hazard)
Benefit_t    = effectiveness · EAL_h · m_ssp(t) + CoBenefit_t + CarbonValue_t
NPV_benefit  = Σ_{t=1}^{20} Benefit_t / (1+r)^t
NPV_cost     = Capex_0 + Σ_{t=1}^{20} Opex_t / (1+r)^t
BCR          = NPV_benefit / NPV_cost
IRR          : rate where NPV_benefit(IRR) = NPV_cost(IRR)
Payback      = min t : Σ_{≤t}(Benefit − Opex) ≥ Capex_0
m_ssp(t)     = 1 + λ_h · (ΔT_ssp(t) − ΔT_ref)                    (hazard-intensity multiplier)
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Discount rate | `r` | 5 % social discount (Global Commission on Adaptation) |
| Hazard EAL | `EAL_h` | EM-DAT / Swiss Re sigma sectoral loss data |
| Effectiveness | | Engineering/NbS literature (0–1) |
| SSP warming | `ΔT_ssp(t)` | IPCC AR6 SSP temperature pathways |
| Hazard elasticity | `λ_h` | IPCC AR6 WGII hazard-intensity response |
| Carbon value | `CarbonValue_t` | Verra/CBL price for NbS credits |

### 8.4 Data requirements
Per-strategy capex/opex profile, hazard-specific EAL (from a physical-risk engine, e.g.
`physical-risk-portfolio`), effectiveness fraction, co-benefit monetisation, SSP warming paths (in
platform scenario tables), and NbS carbon price. Cost/benefit scalars already exist as `cost_m`/
`benefit_m`; the missing pieces are the time-profiled EAL and SSP multiplier.

### 8.5 Validation & benchmarking plan
Reconcile computed BCRs against the stored `STRATEGIES.bcr` (should reproduce them when opex≈0 and
20-yr benefit ≈ `benefit_m`); backtest avoided-loss against realised event losses (EM-DAT);
sensitivity-test to `r`, `λ_h`, and effectiveness; compare BCR ranking to World Bank GFDRR portfolio
averages (6.1x).

### 8.6 Limitations & model risk
EAL estimation dominates BCR uncertainty; co-benefit monetisation is contested (Nature4Climate notes
42 % under-monetisation); NbS effectiveness degrades non-linearly under extreme SSPs. Conservative
fallback: report BCR excluding co-benefits as a lower bound and flag strategies whose BCR falls
below 4 under SSP5-8.5.

## 9 · Future Evolution

### 9.1 Evolution A — Live NPV engine under user assumptions (analytics ladder: rung 1 → 2)

**What.** §7's key nuance: the catalogue's BCR/IRR/payback figures are stored
constants — the guide's "20-year NPV at 5% discount" describes offline derivation, not
on-page computation (the only live math is sorting, an SSP lookup, and
`bcr ≈ benefit_m/cost_m`). Evolution A makes the cost-benefit engine live: each of the
8 strategies gets an explicit benefit decomposition (avoided physical losses, avoided
business interruption, health co-benefits, carbon value — the components §5 already
names), and NPV/BCR/IRR/payback are computed from user-adjustable discount rate,
horizon, and hazard-frequency assumptions rather than read from the seed. The stored
4-point SSP curves become a multiplier applied to the hazard-loss component only —
which is what SSP sensitivity physically means — instead of opaque per-strategy BCR
overrides.

**How.** (1) `evaluateStrategy(strategy, {discountRate, horizon, sspMultiplier})`
returning the full cash-flow series; IRR by bisection; the current catalogue values
become the default-assumption outputs, regression-pinned so defaults reproduce today's
BCRs within rounding. (2) Benefit components sourced: the seed's aggregate `benefit_m`
decomposed using the UNEP/GCA benchmark ratios cited in §5, with provenance displayed.
(3) The maladaptation risk score gets its documented rubric (lock-in, equity,
emissions) as visible sub-scores.

**Prerequisites.** Component decomposition must be sourced, not invented — where the
literature gives only totals, show totals. **Acceptance:** changing the discount rate
from 5% to 8% reorders the BCR ranking observably; default settings reproduce the
catalogue's published BCRs (e.g. Mangrove 8.0).

### 9.2 Evolution B — Adaptation-investment copilot (LLM tier 1 → 2)

**What.** A copilot for prioritisation questions: "why does mangrove restoration beat
sea walls on BCR but not on effectiveness?", "which strategies hold up under
SSP5-8.5?" (the stored sensitivity curves — genuinely informative, monotonically
decreasing), "what maladaptation risks does managed retreat carry?" (the 5 documented
cases). Tier-2 what-ifs re-run `evaluateStrategy` with LLM-proposed assumptions once
Evolution A lands; this module has no backend routes, so tools are client-side.

**How.** Tier 1: atlas record plus the strategy catalogue and maladaptation cases as
corpus — the cases are real documented failures and make unusually good grounding
material. Tier 2: tool schema over the evaluator; the validator ties every BCR/NPV to
an invocation. The UNEP finance-gap figures ($124B/yr) cited with report vintage.

**Prerequisites.** Evolution A for what-ifs; pre-A the copilot must state that
catalogue BCRs are derived offline under fixed assumptions. **Acceptance:** a
discount-rate what-if answer matches the evaluator's return; asked which strategy a
specific city should fund, the copilot presents ranked evidence and declines to decide.