## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is a **loss-cession waterfall**:
> `TreatyLoss = max(0, PortfolioLoss − Retention) × TreatyShare; LossRatio = TreatyLoss/Premium` —
> i.e. treaty loss should be *derived* from a simulated portfolio loss run through the treaty's
> attachment structure. **The code never computes a `PortfolioLoss` or applies a retention
> subtraction anywhere.** `historicalLR` and `climateAdjLR` are each independent seeded-random
> draws per treaty, not outputs of the retention/share waterfall the guide describes. The sections
> below document the independent-random-field pricing model the code actually implements.

### 7.1 What the module computes

For 60 synthetic reinsurance treaties across 8 reinsurers, 4 treaty types, and multiple perils/
regions:

```js
premium         = limit×0.02 + s7×limit×0.07                    // technical base premium
technicalPrice  = premium × (0.85 + s8×0.3)                     // actuarial repricing, ±15%/+15%
climateAdjPrice = technicalPrice × (1.05 + s9×0.35)              // climate loading, +5% to +40%
historicalLR    = 0.3 + s1×0.5                                   // 30–80%, independent draw
climateAdjLR    = historicalLR × (1.1 + s2×0.3)                  // scaled 10–40% above historical
rateOnLine      = premium / limit × 100
climateUplift   = 1.05 + s3×0.40                                 // 5–45% climate premium loading factor
```

`climateAdjPrice` and `climateAdjLR` are each independently derived from their own base value by a
*separate* random multiplier — they are not two views of the same underlying stochastic loss
process, so a treaty's priced climate loading and its modelled climate-adjusted loss ratio can
move in unrelated directions across renders of the same seed structure.

### 7.2 Parameterisation

| Constant | Range | Provenance |
|---|---|---|
| `premium` base rate | 2%–9% of limit | Synthetic — plausible rate-on-line order of magnitude for property cat XL |
| `technicalPrice` adjustment | 0.85×–1.15× premium | Synthetic actuarial repricing band |
| `climateAdjPrice` loading | 1.05×–1.40× technical price | Consistent with the guide's own cited "Climate Loading 5–25%" range at the low end, extending somewhat above it at the high end |
| `historicalLR` | 30%–80% | Synthetic — plausible cat-treaty loss-ratio range |
| `climateAdjLR` scaling | 1.10×–1.40× historical | Synthetic — directionally correct (climate-adjusted LR should exceed historical) |
| `collateral` | 30%–80% of limit | Synthetic — plausible ILS/collateralised-reinsurance collateral range |
| Rating scale | A++ through B+ | Real AM Best financial-strength rating scale, correctly ordered |

### 7.3 Calculation walkthrough

1. **Treaty Portfolio tab**: 60 synthetic treaties (reinsurer/type/peril/region/limit/retention/
   premium/technicalPrice/climateAdjPrice/historicalLR/climateAdjLR/rateOnLine/climateUplift/
   yearsOnBook/rating/collateral/reinstatements/inception), paginated table.
2. **Climate-Adjusted Pricing tab**: `CLIMATE_UPLIFT_BY_PERIL` and `REGION_UPLIFT` — per-peril and
   per-region average uplift factors, aggregated from the treaty-level `climateUplift` field.
3. **Portfolio aggregates** (on `active` — the currently filtered/selected treaty subset):
   `totalLimit = Σlimit`, `totalPremium = Σpremium`, `avgLR = Σ historicalLR / max(1,
   active.length)`, `avgClimateAdj = Σ climateUplift / max(1, active.length)` — the `Math.max(1,
   ·)` guard on both averages correctly prevents division by zero when a filter empties the
   selection (this matches the platform-wide REM-40/41 division-guard remediation pattern).
4. **ILS & Cat Bond Market tab**: separate synthetic cat-bond dataset (`triggerType`, `size`,
   `coupon`, `expectedLoss`, `spread = coupon+1+noise`, `climateRiskPremium`, `maturity`,
   `attachmentProb`, `exhaustionProb`) — `totalCatBonds = Σsize` for `status==='Outstanding'` bonds.
5. **Retrocession & Systemic Risk tab**: `RETRO_LAYERS`, 6 static layers (attachment/limit/
   premium/expectedLoss/rateOnLine) representing a retrocession programme tower — hand-specified,
   not derived from the treaty portfolio's aggregate exposure.
6. **Catastrophe event context** (`totalLoss`/`insuredLoss`/`avgInsuredRatio`): summed from what
   appears to be a real or curated regional catastrophe-loss event dataset (`regionEvs`, fields
   `total_losses_usd_bn`/`insured_losses_usd_bn`), with a correctly-guarded ratio
   (`totalLoss>0 ? insuredLoss/totalLoss : null`).

### 7.4 Worked example

Treaty with `limit=$300M`, seeds giving `s7=0.5`, `s8=0.5`, `s9=0.5`:

| Step | Formula | Result |
|---|---|---|
| `premium` | `300×0.02 + 0.5×300×0.07` | `6+10.5=` **$16.5M** |
| `technicalPrice` | `16.5×(0.85+0.5×0.3)` | `16.5×1.0=` **$16.5M** |
| `climateAdjPrice` | `16.5×(1.05+0.5×0.35)` | `16.5×1.225=` **$20.2M** |
| `rateOnLine` | `16.5/300×100` | **5.5%** |
| Climate loading implied | `(20.2−16.5)/16.5` | **+22.4%** |

This +22.4% loading is within, but near the top of, the guide's own cited "5–25%" climate-loading
range.

### 7.5 Rating & structure rubric

| Field | Values |
|---|---|
| Treaty type | Quota Share, Excess of Loss, Aggregate Stop Loss, and one more (4 total) |
| AM Best-style rating | A++, A+, A, A-, B++, B+ |
| ILS trigger type | Indemnity, Industry Loss, Parametric, Modelled Loss |

### 7.6 Companion analytics

Treaty Portfolio (60-row paginated table), Climate-Adjusted Pricing (peril/region uplift bars),
ILS & Cat Bond Market (bond table + outstanding total), Retrocession & Systemic Risk (6-layer
tower + catastrophe event loss/insured-ratio context).

### 7.7 Data provenance & limitations

- **All 60 treaties and the cat-bond dataset are synthetic**, `sr(seed)=frac(sin(seed+1)×10⁴)`;
  reinsurer names, treaty types, and perils are real taxonomy categories, individual treaty terms
  are fabricated.
- **No `PortfolioLoss`/retention waterfall exists** — the guide's `TreatyLoss = max(0,
  PortfolioLoss−Retention)×Share` formula is not implemented; `historicalLR`/`climateAdjLR` are
  independent random fields rather than outputs of a simulated loss-cession calculation, so the
  "attachment probability" and "exhaustion probability" fields cannot be interpreted as genuinely
  derived from the treaty's actual attachment/limit structure.
- `climateAdjPrice` and `climateAdjLR` (price loading vs loss-ratio impact) are independently
  seeded, so a treaty could show high climate price loading with a low climate-adjusted loss
  ratio or vice versa — an internal inconsistency a pricing actuary would need reconciled.
- Division guards (`Math.max(1, active.length)`) are correctly in place for the portfolio-average
  calculations, consistent with the platform-wide division-by-zero remediation.

**Framework alignment:** IAIS ICP 25 (climate risk supervision) / Swiss Re ClimateWise / Lloyd's
Realistic Disaster Scenarios — cited by the guide as standards context; the module's climate-
loading concept (5–40% premium uplift) is directionally consistent with published industry
commentary on climate repricing, but no RDS (Realistic Disaster Scenario) event set or ICP 25
supervisory capital methodology is actually implemented · ILS/Cat Bond structure (trigger types,
coupon, expected loss, spread) — correctly modelled taxonomy, values are illustrative.
