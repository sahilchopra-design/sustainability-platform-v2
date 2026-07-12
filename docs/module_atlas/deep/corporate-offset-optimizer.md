## 7 · Methodology Deep Dive

This module largely **delivers what its guide (EP-CN3) describes**: a quality-cost frontier optimiser for
corporate carbon-credit procurement, plus a regulatory-acceptance matrix. The optimisation is a real
(greedy) algorithm over a curated, realistically-parameterised credit universe — not seeded numbers. The
one synthetic component is the Monte-Carlo *carbon-price* simulation, which is a seeded random walk rather
than a calibrated price model (flagged in §7.6 and specified in §8).

### 7.1 What the module computes

The blend optimiser maximises quality per dollar under a budget, subject to availability:

```js
autoBlend = [...eligible]
  .sort((a,b) ⇒ (b.qualityScore / max(0.01, b.costPerTonne))
              − (a.qualityScore / max(0.01, a.costPerTonne)))   // rank by quality/$
// greedy fill under budget:
maxT = min( remaining / max(0.01, c.costPerTonne) , c.maxAvailable )
totalTonnes = Σ tonnes ; totalSpend = Σ spend
avgQuality  = totalTonnes>0 ? round(Σ qualityScore·tonnes / totalTonnes) : 0   // tonne-weighted
corsiaPct   = Σ_{corsiaEligible} tonnes / totalTonnes
```

`eligible` is the subset of `CREDIT_TYPES` passing the user's quality floor / registry / eligibility
filters. The **SBTi-style mitigation hierarchy** is also computed:
```js
s1Red = round(scope1·0.42); s2Red = round(scope2·0.65); s3Red = round(scope3·0.25)
residual  = total − s1Red − s2Red − s3Red
bvcm      = round(residual·0.15)      // beyond-value-chain mitigation
neutralize= round(residual·0.60)      // durable removals for neutralisation
gap       = residual − bvcm − neutralize
```

### 7.2 Parameterisation / scoring rubric

The 20 `CREDIT_TYPES` are **curated with realistic attributes** (not seeded):

| Credit type | Quality | $/tCO₂ | Permanence | Additionality | Eligibility |
|---|---|---|---|---|---|
| DAC Puro.earth | 95 | 450 | 10,000 yr | 0.99 | CORSIA/EU-ETS/SBTi/CBAM |
| CCS Industrial (ACR) | 92 | 120 | 10,000 yr | 0.95 | CORSIA/EU-ETS/SBTi/CBAM |
| Mangrove Verra (blue carbon) | 80 | 25 | 50 yr | 0.82 | CORSIA/SBTi |
| REDD+ Verra VCS | 65 | 12 | 30 yr | 0.72 | CORSIA, voluntary only |
| Solar/Wind CDM | 38–40 | 2.5–3 | 25 yr | 0.30–0.35 | none (low quality) |

The **quality/permanence/additionality gradient is methodology-correct**: durable engineered removals
(DAC, CCS, mineralisation) score 90–96 at high cost; avoidance/renewables (CDM solar/wind) score 38–40 at
low cost — mirroring the real VCM quality-price relationship. SBTi-reduction factors (S1 42%, S2 65%, S3
25%) and the 60% neutralisation / 15% BVCM split are hard-coded heuristics consistent with SBTi Net-Zero
Standard guidance. The MC price shock is the only PRNG use: `shock = (sr(mcSeed·1000 + p·7 + y) − 0.5)·2`.

### 7.3 Calculation walkthrough

1. `eligible` filters `CREDIT_TYPES` by quality floor and regulatory flags.
2. `autoBlend` sorts by quality/cost and greedily fills the budget up to each credit's `maxAvailable`,
   producing tonnes/spend per credit and a tonne-weighted `avgQuality` and `corsiaPct`.
3. A `customBlend` mode lets the user set weights; `alloc = (w / max(1,totalW)) × budgetM`.
4. `vendorRanked` scores vendors on a weighted price/quality/reliability/risk/volume blend.
5. The MC panel simulates carbon-price paths as a random walk (`shock`) for budget-impact percentiles.

### 7.4 Worked example (blend)

Budget $5M, quality floor 60. Cookstove GS (quality 72, $9/t) has quality/$ = 8.0; REDD+ (65, $12) = 5.4;
DAC (95, $450) = 0.21. The greedy optimiser buys the cheapest-per-quality first: Cookstove up to its
`maxAvailable` (800,000 t) — but budget binds first: `$5M / $9 = 555,556 t` if unconstrained by other
filters, spending the full $5M on ~555k tonnes at quality 72 → `avgQuality ≈ 72`, `totalTonnes ≈ 555,556`.
If the corporate requires durable removals, DAC/CCS enter the blend at far higher cost, pulling
`totalTonnes` down and `avgQuality` up — the quality-cost trade-off the frontier expresses. For the
mitigation hierarchy: `residual = 515,000 − (0.42·45,000 + 0.65·120,000 + 0.25·350,000) = 515,000 −
(18,900 + 78,000 + 87,500) = 330,600 t`; `neutralize = round(0.60·330,600) = 198,360 t`,
`bvcm = 49,590 t`, `gap = 82,650 t`.

### 7.5 Companion analytics on the page

Auto-blend optimiser, custom-blend builder, regulatory-acceptance matrix (`regMatrix`: which of
CORSIA/EU-ETS/SBTi/CBAM each credit meets), vintage analysis (2018–2025), procurement pace vs 2030 target,
vendor ranking, co-benefit (SDG) mapping, and a Monte-Carlo price/budget-impact panel. `CORPORATE_TARGETS`
holds a fixed 515 ktCO₂e footprint and $15M annual budget. No backend engine or route — client-side.

### 7.6 Data provenance & limitations

- **Credit universe is curated and methodology-consistent** — quality/cost/permanence/additionality/
  eligibility are realistic and internally coherent (durable removals expensive/high-quality; CDM
  avoidance cheap/low-quality). Not seeded.
- **The optimiser is greedy, not a true LP** — the guide states an LP (`Minimize Σ cost·qty s.t. quality ≥
  target, Σqty ≥ need`), but the code ranks by quality/cost and fills greedily. Greedy is optimal for a
  single budget constraint but *not* when both a quality floor **and** a tonnage target bind simultaneously
  (see §8).
- **MC carbon-price paths are seeded random walks** (`shock = (sr(...)−0.5)·2`) — not calibrated to EUA/VCM
  price dynamics; the budget-impact percentiles are illustrative only.
- `PROCUREMENT_HISTORY` and vendor reliability/risk scores are seeded.

**Framework alignment:** *ICVCM Core Carbon Principles* — the quality gradient (additionality, permanence,
co-benefits) proxies the CCP quality bar; ICVCM assesses each **carbon-crediting program + methodology
category** against 10 CCPs (governance, additionality, permanence, robust quantification, no double
counting, sustainable development safeguards…) to award a *CCP-Approved* label — this module's
`qualityScore` is a stand-in for that assessment. *CORSIA* eligibility (ICAO's aviation-offset criteria) is
a per-credit flag. *TSVCM/VCMI* frame the corporate claims context (BVCM, neutralisation). *SBTi Net-Zero
Standard* underpins the 42%/65%/25% reduction split and the removals-for-neutralisation logic.

---

## 8 · Model Specification — LP Blend Optimiser & Calibrated Carbon-Price Simulation

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Replace the greedy blend with a true linear program that honours *both* a quality floor and a tonnage
target under budget, and replace the seeded price walk with a calibrated carbon-price model for
budget-at-risk. Coverage: corporate offset procurement across the curated credit universe.

### 8.2 Conceptual approach
The procurement problem is a classic **bounded LP / knapsack with a weighted-average constraint** — solve
it exactly (simplex) rather than greedily, since greedy fails when the quality-floor constraint is
tonne-weighted. The price model uses a **mean-reverting (Ornstein-Uhlenbeck) or GBM process** calibrated to
EUA (EU-ETS) and VCM index history — the standard commodity-price approach (used by ICE/EEX carbon desks).

### 8.3 Mathematical specification
```
LP:  min Σ_i cost_i · q_i
     s.t.  Σ_i q_i ≥ OffsetNeed
           Σ_i quality_i · q_i ≥ QualityFloor · Σ_i q_i      (tonne-weighted quality)
           Σ_i cost_i · q_i ≤ Budget
           0 ≤ q_i ≤ maxAvailable_i ;  q_i ≥ minOrder_i · z_i (z_i binary → MILP)
Price:  dP = κ(θ − P)dt + σ dW      (OU mean reversion)   OR   dP = μP dt + σP dW (GBM)
BudgetAtRisk = quantile_{95%}( Σ_i q_i · P_sim )
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Mean-reversion / drift | `κ,θ` or `μ` | EUA futures (ICE/EEX); VCM indices (Xpansiv CBL) |
| Volatility | `σ` | Historical EUA/VCM returns |
| Credit attributes | cost, quality, avail | Curated universe (already present) |
| Quality floor / need | constraints | `CORPORATE_TARGETS` |

### 8.4 Data requirements
The curated credit universe already provides cost/quality/availability/min-order. New: EUA and VCM price
history (ICE/EEX public settlements; Xpansiv CBL) to calibrate `κ,θ,σ`; an LP/MILP solver (e.g. glpk.js,
HiGHS-wasm). ICVCM CCP-Approved labels would upgrade `qualityScore` to a real assessment.

### 8.5 Validation & benchmarking plan
Verify the LP reproduces greedy when only the budget binds, and beats greedy when the quality floor binds
(construct a counter-example). Backtest the price model's 95% band against realised EUA drawdowns.
Sensitivity on `κ,σ`. Benchmark blend cost against published corporate procurement (e.g. Microsoft, Shell
VCM portfolios).

### 8.6 Limitations & model risk
MILP with min-order lots is combinatorial — cap credit count or relax to LP for speed. VCM prices are
illiquid and fragmented (index basis risk). ICVCM labels lag methodology approvals. Conservative fallback:
if the LP is infeasible (quality floor unreachable within budget), report the max-achievable quality and
the budget shortfall rather than silently truncating (the greedy method's current failure mode).
