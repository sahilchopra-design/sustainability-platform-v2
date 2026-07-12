## 7 · Methodology Deep Dive

### 7.1 What the module computes

For 16 seeded offset types (`OFFSET_TYPES`, spanning Nature/Blue Carbon/Soil/Engineered/Industrial
categories), the module models three linked risk mechanics:

```
remaining(t)     = exp(-0.693 × t / halfLife) × 100          // permanence decay curve
halfLife         = permanenceYrs × 0.7
P(reversal, t)   = 1 − (1 − reversalDecade)^(t/10)            // cumulative reversal by year t
reversalMult(RCP)= RCP_MULT[scenario] × (1 + fireRisk + droughtRisk)   // climate-conditioned uplift
```

`reversalDecade` and `permanenceYrs` are seed-table constants per offset type (e.g. ARR Tropical:
12%/decade reversal, 35yr permanence; DAC Geological: 0.1%/decade, 10,000yr). The 0.693 constant is
`ln(2)`, so `remaining(t)` is a textbook radioactive-decay-style half-life curve applied to credit
permanence — i.e. a heuristic analogy, not a fitted survival model.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Half-life fraction | `permanenceYrs × 0.7` | Synthetic demo value — no cited survival-analysis basis |
| RCP reversal multiplier | RCP2.6=1.00, RCP4.5=1.25, RCP6.0=1.55, RCP8.5=2.10 | Synthetic demo value; ordinally consistent with NGFS-style scenario severity but not sourced from a published wildfire/drought-frequency model |
| `reversalDecade` per offset type | 0.02%–20% | Seed table; directionally consistent with published ranges (forest 5–15%/decade per guide, DAC <0.1%) |
| VaR/CVaR confidence | 95% / 99% | Standard risk-management convention |
| `expLoss95` heuristic | `reversalDecade × 1.65 × 100` | 1.65 ≈ z-score for the 95th percentile of a standard normal — applied directly to a decade reversal *rate*, not to a fitted loss distribution; a simplification flagged as heuristic, not a proper VaR |

### 7.3 Calculation walkthrough

1. **Permanence decay** (`PERMANENCE_DECAY_CURVES`): for each offset type and year 0–~2×half-life,
   `remaining(t)` traces the exponential decay of surviving credits — used for the "Permanence
   Dashboard" chart and to compute the effective discount factor `discount = r50/100` (fraction of
   credits remaining at year 50).
2. **Reversal probability** (`reversalByBand`): cumulative probability of reversal by year `yr`,
   `1 − (1−reversalDecade)^(yr/10)`, averaged across the filtered offset set for the trend chart.
3. **Climate-driven reversal** (`compoundRisk`): fire/drought/flood component risks are each scaled
   by the selected RCP's `RCP_MULT`, and policy risk is left unscaled (climate scenarios don't move
   policy risk) — this is the module's genuine SSP/RCP-conditioning mechanism, matching the guide's
   "ClimateAmplifier(SSP)" concept using RCP as the scenario axis.
4. **Buffer pool stress test** (`bufferStress`): `effective = actualPct − actualPct×(bufferRelease/100)`
   models a regulator-mandated buffer-pool release scenario; `stressedDraw` averages five seeded
   annual drawdown observations × a stress multiplier.
5. **Monte Carlo tail risk** (`rand = sr(p*1000 + oi*100 + y)`): per portfolio position `p`, offset
   `oi`, and simulated year `y`, a pseudo-random loss draw feeds a sorted loss vector from which
   `var95`, `var99` (percentile losses) and `cvar95`, `cvar99` (tail-conditional means) are computed
   — a real Monte-Carlo VaR/CVaR mechanic, just fed by synthetic draws rather than a fitted loss
   distribution.
6. **Optimal allocation**: a simple mean-variance-style scorer —
   `score = permScore − riskPenalty + bufBonus`, where `permScore = min(permanenceYrs,1000)/1000`,
   `riskPenalty = reversalDecade×10`, `bufBonus = ±0.1` depending on buffer adequacy — normalised by
   `totalScore` to produce portfolio weights.

### 7.4 Worked example

**ARR Tropical** (`permanenceYrs=35`, `reversalDecade=0.12`, `fireRisk=0.15`, `droughtRisk=0.08`),
evaluated at year 20 under **RCP 8.5**:

| Step | Computation | Result |
|---|---|---|
| Half-life | 35 × 0.7 | 24.5 yr |
| Remaining at t=20 | exp(−0.693×20/24.5)×100 | **43.9%** |
| Cumulative reversal P(t=20) | 1 − (1−0.12)^(20/10) | **22.6%** |
| RCP 8.5 multiplier | fixed | 2.10 |
| Climate-adjusted fire risk | 0.15 × 2.10 × 100 | **31.5%** |
| Climate-adjusted drought risk | 0.08 × 2.10 × 100 | **16.8%** |
| Expected loss (95%, heuristic) | 0.12 × 1.65 × 100 | **19.8%** |

Under RCP 2.6 (multiplier 1.0) the same offset's climate-adjusted fire risk would be 15.0% instead
of 31.5% — the 2.1× compounding is the module's explicit representation of the wildfire/drought
feedback loop described in the guide ("warming → more fire → more reversal").

### 7.5 Buffer pool & VaR rubric

| Metric | Rule |
|---|---|
| Buffer adequacy score | `BUFFER_POOL_DATA.adequacyScore` averaged across pool (seed-table field, not derived from `actualPct` vs `requiredPct` in the extracted formulas) |
| VaR95/99 | Percentile of sorted simulated portfolio loss vector |
| CVaR95/99 | Mean of losses at/beyond the VaR percentile, floored at `Math.max(1, …)` tail-length to avoid divide-by-zero on thin tails |

### 7.6 Data provenance & limitations

- **Offset type table (17 rows) and regulatory framework table (9 rows) are hand-curated seed
  data**, not sourced from a live registry feed (Verra/Gold Standard/ACR APIs); reversal rates are
  directionally consistent with published ranges cited in the guide but not independently sourced
  per-row.
- **Monte Carlo loss draws use the platform PRNG** `sr(seed)=frac(sin(seed+1)×10⁴)`, not a fitted
  loss severity distribution — VaR/CVaR outputs are illustrative, not calibrated to real reversal
  event data.
- The half-life decay model is an analogy borrowed from radioactive decay, not a hazard/survival
  model fitted to actual project failure data (which the Verra Non-Permanence Risk Tool and ICVCM
  do maintain empirically).
- `insurable` flag and `INSURANCE_PRODUCTS` premium rates are seed-table constants, not derived
  from the reversal probabilities they nominally price.

**Framework alignment:** ICVCM Core Carbon Principles (CCP 5/6 — permanence and MRV) motivate the
module's structure but are not scored explicitly; the Verra Non-Permanence Risk Tool's buffer-pool
concept is implemented (buffer adequacy, stress-tested drawdown) but with synthetic contribution
data rather than registry-sourced buffer account balances.
