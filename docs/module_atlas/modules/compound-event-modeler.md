# Compound Event Modeler
**Module ID:** `compound-event-modeler` · **Route:** `/compound-event-modeler` · **Tier:** B (frontend-computed) · **EP code:** EP-CG5 · **Sprint:** CG

## 1 · Overview
10 compound event pairs with copula-based joint probability, loss amplification factors (1.5-3x), and historical precedents.

**How an analyst works this module:**
- Compound Event Catalogue lists 10 pairs with dependence structure
- Joint Probability Matrix compares P(A∩B) vs P(A)×P(B)
- Loss Amplification shows multiplier effect per event pair

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPOUND_PAIRS`, `HISTORICAL_COMPOUND`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPOUND_PAIRS` | 11 | `eventA`, `eventB`, `pA`, `pB`, `pAB`, `pIndep`, `depRatio`, `ampFactor`, `region`, `lossIndiv`, `lossCompound` |
| `HISTORICAL_COMPOUND` | 9 | `event`, `region`, `lossB`, `ampFact`, `detail` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ampData` | `COMPOUND_PAIRS.map(p => ({` |
| `jointProbData` | `COMPOUND_PAIRS.map(p => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPOUND_PAIRS`, `HISTORICAL_COMPOUND`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Event Pairs | — | IPCC | e.g., drought+wildfire, heatwave+drought, flood+landslide |
| Amplification Factor | `Historical calibration` | Zscheischler (2020) | Compound loss relative to sum of individual losses |

## 5 · Intermediate Transformation Logic
**Methodology:** Copula-based joint probability
**Headline formula:** `P(A∩B) = C(F_A(a), F_B(b); θ) where C is Clayton/Gumbel copula`

Joint probability exceeds independent assumption (P(A)×P(B)) due to climate-driven dependence. Loss amplification: compound events typically cause 1.5-3x the loss of individual events summed, due to cascading failures and overwhelmed response capacity.

**Standards:** ['IPCC AR6 WGI Ch.11', 'Zscheischler et al.']
**Reference documents:** IPCC AR6 WGI Chapter 11; Zscheischler et al. (2020) Compound Events

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states the joint probability is
> computed via a **Clayton/Gumbel copula**: `P(A∩B) = C(F_A(a), F_B(b); θ)`. **No copula is fitted
> or evaluated anywhere in the code.** All joint probabilities `pAB` are hard-coded constants in
> the `COMPOUND_PAIRS` seed array, and the "Clayton θ" shown on the Joint Probability tab is a
> cosmetic label computed as `θ = depRatio × 0.8` — an ad-hoc scaling with no statistical meaning.
> The sections below document what the code actually does; §8 specifies the copula model the page
> claims to run.

### 7.1 What the module computes

For 10 hard-coded compound event pairs the page derives dependence and amplification diagnostics
from stored probabilities and losses:

```
depRatio   = pAB / (pA × pB)              (stored, but arithmetically consistent with pAB/pIndep)
ampFactor  = lossCompound / lossIndiv     (stored, consistent to rounding)
θ_display  = depRatio × 0.8               (decorative "Clayton theta")
```

Each pair carries: `pA`, `pB` (annual marginal probabilities, 4–25%), `pAB` (joint, 2.2–9.8%),
`pIndep = pA×pB`, `depRatio` (2.8–8.67×), `ampFactor` (1.6–3.0×), `lossIndiv` and `lossCompound`
($B), and a region tag. A second seed, `HISTORICAL_COMPOUND` (8 events 2020–2023, e.g. Winter Storm
Uri + ERCOT grid failure, amp 3.2×; Pakistan floods + landslides, $30B), grounds the amplification
range in real events.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `pA`, `pB`, `pAB` per pair | e.g. Cyclone/Storm-Surge 0.10 / 0.06 / 0.052 | Synthetic demo values (plausible but uncited) |
| `ampFactor` range | 1.6–3.0× | Consistent with guide's "1.5–3× (Zscheischler 2020)" claim |
| Scenario ladder probabilities | `pAB × {0.6, 1.0, 0.4, 0.15}` | Ad-hoc weights, no source |
| Scenario ladder losses | `lossIndiv×1.5`, `lossCompound×{1, 1.3, 2}` | Ad-hoc multipliers, no source |
| Cascade timeline fractions | cumLoss at day 3/7/12/18/25 = 0.2·L_ind, 0.4·L_ind, 0.6·L_c, 0.85·L_c, 1.0·L_c | Hand-authored narrative shape |
| KPI cards "2.3×" avg amp, "4.4×" avg dep | Hard-coded strings | **Inconsistent with the seeds**: true means are 2.19× and 4.66× |

Internal consistency checks (verified): every `depRatio` equals `pAB/pIndep` to 2 dp, and every
`ampFactor` equals `lossCompound/lossIndiv` to 1 dp. The two headline KPI values, however, are
typed literals that do not match the table averages.

### 7.3 Calculation walkthrough

1. **Catalogue (tab 0):** table of the 10 pairs; a bar chart re-sorts by `depRatio` with a
   reference line at 1 (independence).
2. **Joint Probability Matrix (tab 1):** `jointProbData` plots `pAB` vs `pIndep` per pair; the
   selected pair's panel prints the marginals, the dependence ratio, and the decorative
   `θ = 0.8 × depRatio`.
3. **Concurrent Hazard Scenarios (tab 2):** builds a 5-point scenario ladder around the selected
   pair, scaled by two user sliders (`customAmpA`, `customAmpB` ∈ [0.5, 2.0]):
   Baseline (loss `lossIndiv`, prob `pIndep`), Low (`lossIndiv×1.5×A` @ `0.6·pAB`), Central
   (`lossCompound×A` @ `pAB`), High (`lossCompound×1.3×B` @ `0.4·pAB`), Extreme
   (`lossCompound×2×B` @ `0.15·pAB`).
4. **Cascade Timeline (tab 3):** an 8-milestone day-0-to-60 storyline with severity indices
   (40→95→25) and cumulative loss interpolated between `lossIndiv` and `lossCompound` at fixed
   fractions (§7.2). Note cumLoss *decreases* from 0.95·L_c to 0.9·L_c across days 40→60 — a
   narrative artefact, not a model.
5. **Loss Amplification (tab 4):** grouped bars of `lossIndiv` vs `lossCompound` per pair, plus
   sorted `ampFactor` bars; insight panel states `Compound_Loss = Amp_Factor × Σ(Individual_Losses)`.
6. **Historical (tab 5):** renders `HISTORICAL_COMPOUND` as table + charts.

### 7.4 Worked example — Cyclone + Storm Surge (Caribbean/Gulf), sliders at 1.0

| Quantity | Computation | Result |
|---|---|---|
| Independence benchmark | 0.10 × 0.06 | 0.60% |
| Stored joint probability | `pAB` | 5.2% |
| Dependence ratio | 0.052 / 0.006 | **8.67×** |
| Displayed "Clayton θ" | 8.67 × 0.8 | 6.93 |
| Amplification | 61.6 / 22.0 | **2.8×** |
| Scenario ladder | Baseline $22.0B @ 0.60% · Low $33.0B @ 3.12% · Central $61.6B @ 5.20% · High $80.1B @ 2.08% · Extreme $123.2B @ 0.78% | — |

The 8.67× dependence ratio is the catalogue's strongest, encoding that storm surge is essentially
*caused by* cyclones — the pair the guide flags as physically coupled rather than co-occurring.

### 7.5 Data provenance & limitations

- **All quantitative content is hard-coded demo data** (no `sr()` PRNG; literal constants).
  Probabilities and losses are plausible order-of-magnitude values, not calibrated to EM-DAT or
  reanalysis data. The `HISTORICAL_COMPOUND` losses broadly track published figures (e.g. Uri
  ≈$23B insured-plus-economic estimates; Pakistan 2022 ≈$30B World Bank PDNA) but carry no citation
  in code.
- No copula, no marginal fitting, no simulation — dependence is asserted via `pAB`, not modelled.
- Headline KPIs (2.3×, 4.4×) are stale literals inconsistent with the seed averages (2.19×, 4.66×).
- Scenario-ladder probabilities do not sum to anything meaningful and the ladder is not a
  discretised loss distribution; the slider multipliers rescale losses without touching
  probabilities.

**Framework alignment:** IPCC AR6 WGI Ch.11 (compound events typology — the module's pair
catalogue follows the preconditioned / multivariate / spatially-compounding classes of
Zscheischler et al. 2020) · Zscheischler et al. (2018, 2020) — source of the 1.5–3× amplification
narrative · Leonard et al. (2014) compound-event framework · EM-DAT / Munich Re NatCatSERVICE /
Swiss Re sigma cited as reference context for the historical table.

## 8 · Model Specification — Copula-Based Compound Event Model

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate joint annual occurrence probabilities and compound loss
distributions for hazard pairs affecting a portfolio's insured/operational assets, supporting
catastrophe risk appetite, reinsurance structuring, and ORSA climate scenarios. Coverage: the 10
catalogued pairs, extensible to any hazard pair with ≥30 years of co-located observations.

**8.2 Conceptual approach.** Two-stage frequency–severity model with copula dependence — the
standard architecture of vendor cat models (Moody's RMS HD models, Verisk AIR) and the approach
EIOPA and the Bank of England's GI stress tests accept for multi-peril aggregation. Marginals are
fitted per hazard; dependence is captured by an extreme-value copula fitted to paired annual
maxima, following McNeil, Frey & Embrechts (2005) and the compound-event literature (Zscheischler
et al. 2018). Benchmarks: **RMS HD multi-peril correlation module** and **Swiss Re internal
multi-peril aggregation** (sigma methodology); loss amplification follows the cascading-failure
uplift used in **Cambridge Centre for Risk Studies** scenario suites.

**8.3 Mathematical specification.**

Marginals (per hazard h, per region): annual max intensity `X_h ~ GEV(μ_h, σ_h, ξ_h)`; occurrence
count `N_h ~ Poisson(λ_h)`. Joint occurrence for pair (A,B):

```
u = F_A(x_A),  v = F_B(x_B)
Gumbel copula:  C(u,v; θ) = exp(−[(−ln u)^θ + (−ln v)^θ]^{1/θ}),  θ ≥ 1
θ̂ from Kendall's tau:  θ = 1 / (1 − τ̂)
Upper tail dependence:  λ_U = 2 − 2^{1/θ}
P(A∩B) = 1 − F_A(a) − F_B(b) + C(F_A(a), F_B(b))   (exceedance form at thresholds a, b)
```

Compound loss: `L_c = (L_A + L_B) × M`, with amplification `M ~ LogNormal(μ_M, σ_M)` truncated to
[1, 4], calibrated so median M matches the empirical event set. Climate conditioning: scale λ_h and
GEV location μ_h by scenario factors from NGFS Phase IV / IPCC AR6 regional projections.

| Parameter | Role | Calibration source |
|---|---|---|
| GEV (μ, σ, ξ) per hazard/region | Marginal severity | ERA5 reanalysis + EM-DAT losses (1980–2024) |
| λ_h | Annual frequency | EM-DAT event counts; Munich Re NatCatSERVICE |
| θ (Gumbel) per pair | Tail dependence | MLE / inversion of Kendall's τ on paired annual maxima; cross-check IPCC AR6 WGI Ch.11 co-occurrence assessments |
| M distribution | Loss amplification | Fit to historical compound set (Uri 3.2×, Pakistan 2.5×, …); Zscheischler et al. (2020) 1.5–3× prior |
| Scenario multipliers on λ, μ | Climate conditioning | NGFS Phase IV hazard projections; IPCC AR6 regional fact sheets |

Outputs: `P(A∩B)` per pair and scenario, λ_U, full compound-loss exceedance curve via 100k Monte
Carlo draws (sample (u,v) from C, invert marginals, draw M).

**8.4 Data requirements.** Paired hazard time series by region (ERA5/CHIRPS, free), EM-DAT event
and loss records (free, academic licence), Munich Re / Swiss Re sigma loss data (vendor), asset
exposure by region (already in platform: `physical-hazard-map` asset seeds, `reference_data`
tables), NGFS scenario hazard multipliers (free, NGFS portal — partially present in platform
scenario contexts).

**8.5 Validation & benchmarking.** (i) Backtest: hold out 2015–2024, compare modelled `P(A∩B)`
against observed co-occurrence frequencies; score with Brier scores. (ii) Copula goodness-of-fit:
Cramér–von Mises test on the empirical copula; compare Gumbel vs Clayton vs Student-t by AIC.
(iii) Sensitivity: ±20% on θ and λ; verify exceedance-curve monotonicity. (iv) Reconcile pair-level
AALs against RMS/AIR multi-peril outputs and Swiss Re sigma regional loss benchmarks.

**8.6 Limitations & model risk.** Short joint-extreme records make θ estimation noisy (bootstrap
CIs mandatory); non-stationarity under climate change violates the stationary-GEV assumption
(mitigate with time-varying location parameter); amplification M conflates infrastructure cascade
and response-capacity effects that are region-specific; conservative fallback: floor θ at the
value implying λ_U ≥ 0.2 for physically coupled pairs (cyclone/surge, drought/wildfire).

## 9 · Future Evolution

### 9.1 Evolution A — Fit the copulas the page claims to use (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: no Clayton/Gumbel copula is fitted or evaluated — the
joint probabilities `pAB` are hard-coded constants, the displayed "Clayton θ" is the
decorative scaling `depRatio × 0.8`, the scenario-ladder weights are ad-hoc, and the
two headline KPIs (2.3× amp, 4.4× dep) are stale literals inconsistent with the seed
averages (2.19×, 4.66×). The catalogue structure itself is good — 10 pairs typed to
the Zscheischler et al. compound-event classes, with a historical table that broadly
tracks published losses. Evolution A replaces asserted dependence with estimated
dependence.

**How.** (1) Data: the platform already ingests IBTrACS (cyclone tracks/intensities)
and has wildfire/flood grids; pair those with reanalysis-derived marginals (e.g.
Open-Meteo historical extremes, already integrated) to build co-occurrence series for
at least 3 of the 10 pairs — cyclone/surge, heat/drought, drought/wildfire — where
data coverage is honest. (2) Estimation: fit Clayton and Gumbel copulas by maximum
likelihood to the ranked marginals (scipy/statsmodels); report fitted θ, tail
dependence λ, and a goodness-of-fit comparison against independence — the real
version of the Joint Probability Matrix tab. (3) Pairs without adequate data keep
curated `pAB` values but must be labelled curated, with the fitted pairs badged
distinctly. (4) Fix the stale KPI literals by computing them from the table; source
the `HISTORICAL_COMPOUND` losses with citations (EM-DAT IDs).

**Prerequisites.** Co-occurrence data engineering is the real cost — define each
pair's event threshold and window before fitting; document per Atlas §8 model-card
convention. **Acceptance:** fitted θ reproduces under re-run; a fitted pair's
`P(A∩B)` exceeds `P(A)·P(B)` by its estimated (not asserted) ratio; headline KPIs
equal the computed table means.

### 9.2 Evolution B — Compound-scenario narrator for stress-test design (LLM tier 1)

**What.** Compound events are where risk committees most need translation: the
difference between `pAB` and `pA×pB` is exactly the thing executives misjudge.
Evolution B is a copilot that turns a selected pair into a stress-scenario brief:
what the dependence ratio means operationally, which historical precedent
(`HISTORICAL_COMPOUND`) anchors the amplification factor, how the 1.5–3× loss
amplification arises (cascading failures, response saturation — the Zscheischler
framing §5 cites), and a suggested stress-test parameterization the sibling
`climate-stress-test` module could consume.

**How.** Tier-1 RAG: this Atlas record (§7.2's parameter table with its
curated-vs-fitted provenance after Evolution A), the IPCC AR6 Ch.11 typology, and the
historical event table as grounding corpus; selected-pair state passes into the
prompt. The copilot's discipline: quote `pAB`, θ, and amplification only as displayed,
flag curated pairs as uncalibrated, and never extrapolate to unlisted pairs. The
handoff artifact — a scenario parameter block — is structured JSON another module can
ingest, not prose numbers.

**Prerequisites.** Evolution A materially changes the copilot's honesty surface
(fitted vs curated badging must exist first, else every explanation needs a blanket
demo-data caveat); corpus embedding (D3). **Acceptance:** briefs cite the correct
historical precedent rows; a curated pair's brief carries the uncalibrated flag; the
exported scenario block validates against the stress-test module's input schema.