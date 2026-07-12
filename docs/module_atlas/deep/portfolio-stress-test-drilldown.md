## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** The guide's headline — 5 NGFS scenarios, entity-contribution waterfall,
> taxonomy drill, reverse stress solving for `{CarbonPrice, GDP_shock}` such that loss > 20 % — is
> *structurally* implemented. But the per-holding scenario losses are **synthetic `sr()` draws**, not
> the output of any asset-repricing model; the "reverse stress" is a linear back-scaling of those
> synthetic losses, not a genuine root-finding over a stress model. §8 specifies the real engine.

### 7.1 What the module computes

Weight-aggregated scenario losses and derived drills over 20 synthetic holdings:

```js
portfolioImpact[s] = Σ_h weight_h · scenarioImpact_h[s] / 100          // % portfolio loss
entityContrib[h]   = weight_h · scenarioImpact_h[selScenario] / 100    // per-name contribution
topicDrill[t]      = Σ_h (100 − topicScore_h[t]) · weight_h · 0.01      // gap-weighted topic risk
histComparison     = portfolioImpact · (0.8 + qi·0.05)                 // synthetic time drift
reverseStress[s]:  multiplier = threshold(−20) / baseImpact;
                   carbonNeeded = carbonPrice_s · |multiplier|;
                   gdpNeeded    = gdpShock_s · |multiplier|
```

The weight×impact aggregation is a legitimate loss-attribution; the inputs are the issue.

### 7.2 Parameterisation / seed rubric

| Quantity | Formula | Provenance |
|---|---|---|
| Scenario `carbonPrice` | NZ2050 250, Below2 180, Divergent 300, Delayed 120, Current 40 ($/t) | curated NGFS-flavoured constants |
| Scenario `gdpShock` | −1.2 / −2.5 / −3.8 / −5.2 / −8.5 % | curated; hot-house worse (correct ordering) |
| `scenarioImpact_h[s]` | `−[2,4,6,8,12] + (sr(·)·2−1)·[6,8,10,12,15]` | **synthetic**; centred worse per scenario |
| `weight` | `3 + (sr(i·17)·2−1)·2.5` | synthetic demo value |
| `topicScores` | `base + (sr(·)·2−1)·spread` across 8 ESG topics | synthetic demo value |
| Reverse threshold | −20 % | configurable constant |

The scenario-impact **centres** (−2 → −12) correctly worsen from Net Zero to Current Policies, so the
portfolio loss ranking respects NGFS ordering even though each draw is random around its centre.

### 7.3 Calculation walkthrough

1. 20 holdings built with synthetic weights, ESG topic scores, and 5 scenario impacts each.
2. `portfolioImpact` sums `weight·impact/100` per scenario → total % loss.
3. `entityContrib` ranks holdings by their contribution to the selected scenario's loss (waterfall).
4. `topicDrill` weights each ESG topic's *gap from 100* by holding weight (worse scores = more risk).
5. `reverseStress` finds the multiplier that scales each scenario's base loss to the −20 % threshold,
   then scales that scenario's carbon price and GDP shock by the same factor.

### 7.4 Worked example

Under Current Policies, two holdings: A (weight 4 %, impact −12), B (weight 3 %, impact −10):

| Output | Computation | Result |
|---|---|---|
| A contribution | 4·(−12)/100 | −0.48 % |
| B contribution | 3·(−10)/100 | −0.30 % |
| portfolioImpact (2 names) | −0.48 − 0.30 | −0.78 % |
| reverse multiplier | −20 / −0.78 | 25.6× |
| carbonNeeded | 40 · 25.6 | ~$1,026/t |

The reverse-stress "carbon needed" is a **linear extrapolation** — it assumes loss scales
proportionally with the multiplier, which a real convex stress response would not.

### 7.5 Data provenance & limitations

- **Scenario losses and holdings are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); only the
  scenario carbon-price/GDP-shock parameters are curated NGFS-style constants.
- Reverse stress is a proportional back-solve, not a genuine inversion of a loss function; it will
  overstate the carbon price needed because real transition losses are nonlinear.
- Taxonomy "drill" is an ESG-gap weighting, not an EU Taxonomy alignment calculation.

**Framework alignment:** NGFS Phase-5 scenarios — the five scenarios and their carbon-price/GDP-shock
ordering mirror the NGFS matrix (orderly → disorderly → hot-house) · ECB Climate Stress Test (CST) —
the reverse-stress framing (find breaking conditions) follows CST practice, but the underlying loss
model is absent.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute NGFS-scenario portfolio losses from real asset repricing, with entity attribution and a true
reverse-stress solver — for supervisory stress testing and board risk reporting.

### 8.2 Conceptual approach
A **scenario-conditioned valuation model** (transition carbon-cost pass-through + physical damage +
macro GDP-to-earnings elasticity), mirroring the ECB economy-wide climate stress test and NGFS bank
stress guidance, with reverse stress solved by numerical inversion of the loss surface (Newton /
bisection), à la RiskMetrics reverse-stress methodology.

### 8.3 Mathematical specification
```
Loss_i,s = w_i·[ δ_carbon(CarbonPrice_s, Emissions_i, passthrough_i)
               + δ_macro(GDPShock_s, β_earnings_i)
               + δ_phys(hazard_i, s) ]
Loss_pf,s = Σ_i Loss_i,s
Reverse:  solve (CarbonPrice*, GDPShock*) s.t. Loss_pf(CarbonPrice*, GDPShock*) = −θ   (θ=20%)
          via Newton on the parametric loss surface (not linear scaling)
```

| Parameter | Calibration source |
|---|---|
| `CarbonPrice_s`, `GDPShock_s` | NGFS Phase IV scenario variables |
| `passthrough_i`, `β_earnings_i` | sector cost pass-through & earnings-beta; ECB/EBA stress params |
| `Emissions_i` | PCAF financed emissions (platform engine) |
| `δ_phys` | hazard damage functions; IPCC AR6 / Swiss Re |
| `θ` | reverse-stress threshold (policy-set) |

### 8.4 Data requirements
`financed_emissions`, `earnings_beta`, `sector`, `hazard_exposure`, `weight`, `enterprise_value`.
Sources: PCAF engine, NGFS scenario data (free), ECB/EBA parameters, hazard engine. Weights and
scenario parameters already exist.

### 8.5 Validation & benchmarking plan
Reconcile scenario losses against ECB CST sector results and MSCI/Aladdin transition-VaR; verify
monotonicity (Current Policies physical loss ≥ Net Zero); check reverse-stress solution satisfies
`Loss_pf = −θ` on the true surface (not the linear proxy).

### 8.6 Limitations & model risk
Loss surface is nonlinear and may be non-monotone in some regions (reverse solver needs bracketing);
pass-through and earnings-beta are uncertain. Conservative fallback: grid-search the reverse solution
and report a feasible region of `{CarbonPrice, GDPShock}` rather than a single point.
