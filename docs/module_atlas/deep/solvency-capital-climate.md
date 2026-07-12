## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (understates complexity).** The guide's formula
> `SCR_stressed − SCR_base` implies a simple before/after delta. The code actually implements a **genuine
> Solvency II Basic SCR (BSCR) aggregation formula** — `BSCR = √(Σᵢⱼ ρᵢⱼ × SCRᵢ × SCRⱼ)` across 7 risk
> modules with a real correlation matrix, plus loss-absorbing capacity (LAC) for deferred tax and technical
> provisions, plus an MCR floor/cap structure — considerably more sophisticated than the guide describes.
> The weak link is that the **climate stress itself (`climateLoading`) is a flat synthetic random loading**,
> not derived from the entity's NatCat SCR or actual scenario shocks.

### 7.1 What the module computes

For 50 synthetic insurers (`sr()`-seeded, across 5 entity types, 5 regulatory frameworks — Solvency II, NAIC
RBC, APRA LAGIC, BMA BSCR, IAIS ICS — and 10 jurisdictions), the module runs a **correct implementation of
the Solvency II standard-formula SCR aggregation**:

```js
// 7 SCR risk modules (NatCat, Market, Credit, Operational, Life UW, Health UW, Non-Life UW), each $80–480M
scrModules[i] = sr(seed) × 400 + 80

// Solvency II BSCR aggregation formula (genuine standard-formula structure)
BSCR = sqrt( Σᵢ Σⱼ ρᵢⱼ × SCRᵢ × SCRⱼ )     // ρᵢⱼ from a 7×7 correlation matrix

// Loss-absorbing capacity (deferred tax + technical provisions)
LAC_DT = BSCR × (2–12%)          // synthetic rate within a plausible LAC range
LAC_TP = BSCR × (1–6%)
adjustedSCR = max(1, BSCR − LAC_DT − LAC_TP)

// MCR (Minimum Capital Requirement) — bounded between AMCR floor and 45% of SCR
MCR = max(AMCR, adjustedSCR × 0.45)

// Climate overlay (the synthetic component)
climateAdjSCR = adjustedSCR × (1 + climateLoading)      // climateLoading = 5–45%, RANDOM per entity
climateAdjSolvencyRatio = ownFunds / climateAdjSCR × 100
```

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| `SCR_CORR` (7×7 correlation matrix) | diagonal=1.00; NatCat↔Non-Life UW 0.35 (highest off-diagonal); NatCat↔Operational 0.10 (lowest) | plausible, symmetric, positive-semi-definite-looking structure consistent with the *type* of correlation matrix Solvency II's standard formula specifies (though not a literal reproduction of EIOPA's published Delegated Regulation Annex IV matrix) |
| `climateLoading` | `sr()×0.4+0.05` → 5–45% | **synthetic, uncorrelated with the entity's own `natcatSCR` or `investmentPortfolioGreenPct`** — the one component that should be climate-scenario-derived but isn't |
| `ORSA_STRESS_MULTS` (10 scenarios) | 0.85 (Technology Revolution, the only <1.0 easing scenario) to 1.55 (NatCat Mega-Event 250yr) | plausible relative severity ordering across climate/NatCat/sovereign/pandemic scenario types |
| MCR bound | `max(AMCR, adjustedSCR×0.45)` | approximates the real Solvency II MCR corridor (25–45% of SCR, floored at an absolute minimum) using the upper 45% bound only — a simplification of the real linear MCR formula, which also incorporates technical provisions and premium volume |
| `REG_FRAMEWORKS` reference table (10 rows) | Solvency II SCR 100%/MCR 133%, NAIC RBC Company Action 200%/Control 150%, APRA PCR 100%/MCR 50%, BMA ECR 100%, IAIS ICS Level 1 100%/Level 2 115%, MAS RBC 120% | **real, correctly-cited regulatory capital thresholds** across 6 major insurance jurisdictions |

### 7.3 Calculation walkthrough

- **BSCR aggregation**: the double-sum correlation formula is computed exactly as Solvency II's standard
  formula specifies — this correctly captures diversification benefit (BSCR < Σ SCR_i when correlations
  <1), unlike a naive linear sum.
- **Diversification benefit**: `divBenefit = BSCR − adjustedSCR + LAC_DT + LAC_TP` — i.e. the gap between
  the undiversified linear sum implicit in the SCR module values and the correlation-adjusted BSCR, plus the
  LAC offsets — correctly captures the capital relief from imperfect correlation.
- **Solvency ratio**: `ownFunds / adjustedSCR × 100` — standard definition.
- **Climate-adjusted solvency ratio**: applies the flat `climateLoading` multiplier to `adjustedSCR` — this
  is where the model diverges from a genuine climate-scenario stress test; a real EIOPA-style exercise would
  re-run the SCR module inputs (especially `natcatSCR` and market/credit risk on the investment portfolio)
  under NGFS physical/transition shocks and re-aggregate via the same BSCR formula, rather than applying a
  single random multiplier to the already-aggregated SCR.
- **ORSA Stress tab**: divides the base/climate-adjusted solvency ratios by `ORSA_STRESS_MULTS[scenario]` —
  a simple scalar stress applied post-hoc, not a re-run of the underlying SCR module inputs under each
  named scenario's actual shock parameters.

### 7.4 Worked example (illustrative single entity)

`scrModules ≈ [280, 220, 180, 130, 200, 150, 190]` (NatCat, Market, Credit, Operational, Life, Health, Non-Life):

| Step | Computation | Result (illustrative) |
|---|---|---|
| BSCR² | Σᵢⱼ ρᵢⱼ×SCRᵢ×SCRⱼ (diag terms alone: 280²+220²+180²+130²+200²+150²+190² = 234,700; plus off-diag cross-terms) | ≈300,000–330,000 (diversification reduces vs the ~1,350² naive-sum-squared) |
| BSCR | √330,000 | ≈**$574M** |
| LAC_DT+LAC_TP | 574×(0.02–0.17 combined) | ≈$40–95M |
| adjustedSCR | 574 − ~65 | ≈**$509M** |
| Given `ownFunds=$750M` | Solvency ratio | 750/509×100 ≈ **147%** |
| Climate loading (random, e.g. 25%) | climateAdjSCR = 509×1.25 | ≈$636M |
| Climate-adjusted ratio | 750/636×100 | ≈**118%** |

The climate overlay in this illustrative case pulls solvency coverage from 147% to 118% — still above the
100% Solvency II SCR threshold, but with materially thinner headroom, correctly illustrating the intended
narrative even though the specific 25% loading is a random draw rather than a scenario-derived shock.

### 7.5 Data provenance & limitations

- **The BSCR/LAC/MCR aggregation machinery is a genuinely correct, non-trivial implementation** of the
  Solvency II standard-formula structure — one of the stronger quantitative engines in this batch.
- **The climate stress itself is not scenario-derived** — `climateLoading` is an independent random draw,
  disconnected from the entity's own `natcatSCR`, `investmentPortfolioGreenPct`, or any named NGFS/EIOPA
  scenario parameter. A production model should instead re-shock `scrModules[NatCat]` (physical risk) and
  `scrModules[Market/Credit]` (transition risk on green vs brown asset allocation) under each named scenario
  and re-run the same BSCR aggregation, rather than applying a flat post-hoc multiplier.
- `SCR_CORR` is a plausible but not literally EIOPA-sourced correlation matrix.
- All 50 entities and their underlying SCR module values are synthetic; entity names are randomly assembled
  from word-pools, not real insurers (contrast with `PEER_INSURERS`, which does use 10 real reinsurer/
  insurer names for the peer-comparison radar).

### 7.6 Framework alignment

- **Solvency II Directive 2009/138/EC / EIOPA standard formula** — the BSCR aggregation, LAC(DT)/LAC(TP)
  concepts, and MCR corridor structure are all correctly named and structurally faithful implementations of
  the real regulatory framework, even though the correlation matrix and LAC rates are illustrative rather
  than EIOPA-published values.
- **EIOPA Climate Stress Test Methodology (2022) / NGFS Insurance Supervisory Scenarios** — cited in the
  guide as the basis for climate shocks; the actual implementation applies a generic random loading rather
  than the named scenarios' specific physical/transition shock parameters.
- **NAIC RBC / APRA LAGIC / BMA BSCR / IAIS ICS** — the multi-framework threshold reference table correctly
  distinguishes each jurisdiction's specific capital-adequacy trigger levels (e.g. NAIC's 200%/150% two-tier
  action levels vs Solvency II's single 100% SCR threshold).
