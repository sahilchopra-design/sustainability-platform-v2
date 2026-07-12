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
