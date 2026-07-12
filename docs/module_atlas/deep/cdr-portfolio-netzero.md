## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is faithful: the code implements a **CDR portfolio blending** calculator
(weight-averaged levelised cost of carbon, IRR, risk, and permanent-% across four CDR types), a
net-zero emissions trajectory, a marginal cost curve, and a frontier-buyer alignment view. The
blending math is genuine; the trajectory and cost curve are deterministic (some `sr()` noise).

### 7.1 What the module computes

**Portfolio blend** (`portfolioStats`) — weights normalise to 1, then attributes are credit-weighted:
```
total = dacPct + beccsPct + biocharPct + ewPct  (or 1)
w_i   = pct_i / total
avgLcoc = Σ w_i · LCOC_i        // blended $/tCO2
avgIrr  = Σ w_i · IRR_i         // blended %
avgRisk = Σ w_i · risk_i        // blended 0–100
permanencePct = w_dac·100 + w_beccs·100     // Tier-1 (permanent) share only
annualCDR  = carbonTarget · 1000            // tCO2
annualCost = annualCDR · avgLcoc / 1e6      // $M
```

### 7.2 Parameterisation / scoring rubric

| Instrument | LCOC $/t | Perm. tier | IRR % | Risk | Additionality | Maturity |
|---|---|---|---|---|---|---|
| DAC-Geological | 600 | 1 | 6 | 25 | 98 | Early Commercial |
| BECCS | 200 | 1 | 9 | 45 | 90 | Commercial |
| Biochar | 130 | 3 | 12 | 35 | 85 | Commercial |
| Enhanced Weathering (Basalt) | 120 | 2 | 11 | 40 | 88 | Pilot |
| OAE | 80 | 1 | 8 | 60 | 80 | R&D |

All `CDR_INSTRUMENTS` values are **hard-coded, realistic** (DAC most expensive/lowest-risk, biochar
highest-IRR). `PORTFOLIO_TEMPLATES` (Conservative/Balanced/High-Yield/Frontier) and `FRONTIER_BUYERS`
(Stripe Frontier, Microsoft, Shopify, Holcim) are hard-coded. Cost-curve has minor `sr()` noise.

### 7.3 Calculation walkthrough

The user allocates percentages across DAC, BECCS, biochar and EW; weights normalise and each
instrument attribute is credit-weighted to a blended LCOC, IRR, risk, and permanent-%. A carbon
target (kt) scales to annual CDR volume and annual cost. The net-zero trajectory decays baseline
emissions at 5%/2.5-yr step, grows avoidance and CDR, and computes residual. The cost curve stacks
volume vs marginal/average cost. Buyer alignment maps the portfolio against Frontier-buyer preferences.

### 7.4 Worked example (Conservative Net-Zero template)

Template: DAC 40%, BECCS 30%, biochar 20%, EW 10% (total 100 → weights 0.4/0.3/0.2/0.1).

| Metric | Computation | Result |
|---|---|---|
| avgLcoc | 0.4·600 + 0.3·200 + 0.2·130 + 0.1·120 | 240 + 60 + 26 + 12 = **$338/t** |
| avgIrr | 0.4·6 + 0.3·9 + 0.2·12 + 0.1·11 | 2.4 + 2.7 + 2.4 + 1.1 = **8.6%** |
| avgRisk | 0.4·25 + 0.3·45 + 0.2·35 + 0.1·40 | 10 + 13.5 + 7 + 4 = **34.5** |
| permanentPct | (0.4 + 0.3)·100 | **70%** |
| annualCost (target 100 kt) | 100,000·338/1e6 | **$33.8M** |

The 8.6% blended IRR closely matches the template's stated `targetIrr` of 8.5% — internally
consistent — and 70% permanent (Tier-1 DAC+BECCS) reflects the "high permanence" positioning.

### 7.5 Data provenance & limitations
- Instrument economics, templates and buyer profiles are **hard-coded, realistic** reference data;
  only the cost curve carries `sr()` noise.
- Blended metrics are simple linear credit-weighted averages — no covariance/diversification benefit
  in the risk blend (portfolio risk = weighted mean risk, ignoring correlation), and no efficient
  frontier optimisation despite a risk/return scatter.
- Permanent-% counts only DAC+BECCS as Tier-1; EW (Tier-2) and OAE (nominally Tier-1) treatment is
  simplified.
- Net-zero trajectory uses fixed decay/growth constants, not a calibrated SBTi pathway.

**Framework alignment:** **SBTi Corporate Net-Zero Standard** (neutralise ≤10% residual with permanent
CDR) drives the permanent-% and residual logic. **Oxford Principles for Net-Zero Aligned Offsetting**
(shift to durable removal over time) frames the trajectory. **GFANZ CDR integration** and **IFRS S2**
disclosure are referenced for the reporting view. **VCMI** claim tiers inform buyer alignment. The
blended LCOC/IRR is a standard portfolio weighted-average, not a mean-variance optimisation.
