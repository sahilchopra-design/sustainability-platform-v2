## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch.** The guide describes an *Eisenberg-Noe network contagion* model with the
> fixed-point formula `P(contagion) = 1 − ∏(1 − P(default_i) × Connectivity_ij)`, scale-free topology, and
> 3–5 propagation rounds to equilibrium. **The code implements none of that.** It uses a **pre-scripted,
> linear cascade chain** (`CHAIN_STEPS`, 6 hard-coded stages) whose accumulated losses are simply scaled by
> user severity and carbon price: `lossAccum × severity × (carbonPrice/120)`. There is no network fixed-
> point solve, no ∏-product contagion probability, no propagation rounds. `ΔCoVaR` and `capitalHit` are
> stored per-entity constants, not computed. The 8 entities carry PD/LGD/exposure but they never actually
> default one another. Sections below document the code.

### 7.1 What the module computes

Two deterministic transforms over hand-set data:

```js
cascadeData = CHAIN_STEPS.map(s => lossAccum = round(s.lossAccum × severity × carbonPrice/120))
loanLoss    = ENTITIES.map(e => ({ el:  exposure×pd×lgd×severity,          // expected loss
                                   uel: exposure×pd×lgd×severity×2.5 }))    // "unexpected" = 2.5×EL
totalExposure = Σ exposure ; totalCapHit = Σ capitalHit ; avgCoVaR = mean(ΔCoVaR)
```

The "cascade" is a scripted 6-step storyline (Stranded Asset → Covenant Breach → Loan Default → Bank Capital
Hit → Credit Tightening → Sector Contagion) with pre-assigned cumulative losses, scaled linearly by the two
sliders. The loan-loss panel is a standard `EL = EAD × PD × LGD` calculation with a flat 2.5× multiplier
labelled "unexpected loss".

### 7.2 Parameterisation

**Entities** (`ENTITIES`, 8 high-carbon obligors — provenance: hand-curated illustrative, realistic PD/LGD):

| Entity | Sector | Exposure ($M) | PD | LGD | ΔCoVaR |
|---|---|---|---|---|---|
| PetroGlobal | Oil & Gas | 5,200 | 0.12 | 0.55 | 0.068 |
| PowerGen Alpha | Power Gen | 4,500 | 0.11 | 0.48 | 0.058 |
| MiningDeep | Mining | 3,600 | 0.16 | 0.60 | 0.055 |
| CoalCo | Coal Mining | 2,400 | 0.18 | 0.65 | 0.042 |

`interconnections` lists 3 counterparties per entity (a network *is* declared) but the edges are never used
in a contagion calculation. `ΔCoVaR` (systemic-risk contribution) and `capitalHit` are stored constants.

**Cascade chain** (`CHAIN_STEPS`): pre-set cumulative losses 0 → 420 → 1,240 → 2,100 → 3,800 → 6,200 ($M)
with narrative triggers (carbon price >$120/t, leverage >4.5×, CET1 below buffer). The `carbonPrice/120`
divisor anchors the base case at $120/t.

### 7.3 Calculation walkthrough

Sliders set `severity` (1.0 base) and `carbonPrice` (120 base). The cascade chart multiplies each stage's
stored `lossAccum` by `severity × carbonPrice/120`. The loan-loss table computes `EL` and `UEL = 2.5×EL`
per entity, scaled by severity. Concentration limits sum exposure per sector against a `5000 + i×500` limit.
None of these steps propagate a default through the `interconnections` graph.

### 7.4 Worked example (cascade + loan loss)

Base cascade at severity=1.0, carbonPrice=120: multiplier = `1.0 × 120/120 = 1.0`, so stages read
0/420/1,240/2,100/3,800/6,200. Stress to carbonPrice=180, severity=1.5: multiplier = `1.5 × 180/120 = 2.25`
→ Sector Contagion stage = `6,200 × 2.25 = 13,950 $M`. The amplification is purely the linear scalar, not a
network effect.

Loan loss, PetroGlobal at severity=1.0: `EL = 5,200 × 0.12 × 0.55 = 343.2 $M`; `UEL = 343.2 × 2.5 = 858 $M`.
The `EL` is a correct Basel expected-loss; the 2.5× UEL multiplier is a heuristic, not a modelled tail.

### 7.5 Data provenance & limitations

- Entities are **hand-curated illustrative** (realistic PD/LGD/exposure); the cascade losses are pre-scripted
  constants. Severity/carbon-price scaling is linear.
- **No network contagion is actually computed** — the guide's Eisenberg-Noe fixed point and ∏-product
  formula are unimplemented; `interconnections` is decorative.
- `ΔCoVaR` is stored, not estimated from a quantile regression; UEL is a flat 2.5×EL, not a modelled 99.9%
  tail.

**Framework alignment:** Basel IRB — the `EL = EAD × PD × LGD` loan-loss core is correct · Eisenberg-Noe
(2001) systemic risk — *named* but not implemented (see §8) · Adrian-Brunnermeier CoVaR — the ΔCoVaR metric
is displayed but not estimated · NGFS — carbon price as the exogenous transition trigger. See §8 for the
production contagion model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The scripted cascade should be replaced by a real
network-contagion solve.

### 8.1 Purpose & scope
Quantify systemic amplification when a climate/carbon-price shock triggers correlated defaults that propagate
through a corporate credit network, identifying cascade-hub obligors for supervisory attention and sizing
the capital buffer that arrests contagion.

### 8.2 Conceptual approach
Eisenberg-Noe clearing-payment fixed point on an interbank/counterparty liability matrix, with a climate
shock as the exogenous asset-value hit, benchmarked against the FSB/ECB systemic-risk frameworks and
Battiston et al. (2017) climate stress-test networks (DebtRank). ΔCoVaR estimated by quantile regression of
system loss on entity distress.

### 8.3 Mathematical specification

```
Shock:   A_i' = A_i × (1 − δ_i(carbonPrice))          asset value after carbon shock, δ from PD uplift
Clearing (Eisenberg-Noe): p*_i = min( L_i ,  A_i' + Σ_j Π_ji p*_j )    relative liability matrix Π
Default set:  D = { i : p*_i < L_i }
DebtRank:    h_i(t+1) = min(1, h_i(t) + Σ_j W_ij h_j(t))    W = impact-weighted edges
SystemicLoss = Σ_i (L_i − p*_i)
ΔCoVaR_i = CoVaR(system | i distressed) − CoVaR(system | i median)
```

| Parameter | Symbol | Source |
|---|---|---|
| Liability matrix | Π, L | counterparty exposures (supervisory/credit data) |
| Carbon-shock asset hit | δ_i | NGFS transition path × sector carbon intensity |
| Recovery | 1−LGD | Basel/issuer LGD |
| Impact weights | W_ij | exposure_ij / equity_j (DebtRank) |

### 8.4 Data requirements
Bilateral exposure/liability matrix, per-entity assets/equity, sector carbon intensity, NGFS carbon path.
Platform holds entity PD/LGD/exposure and a declared `interconnections` graph; missing: the bilateral
liability matrix and a fixed-point solver.

### 8.5 Validation & benchmarking plan
Verify Eisenberg-Noe existence/uniqueness (convergence of the clearing vector). Backtest against historical
credit-event clusters. Compare DebtRank hub ranking against ΔCoVaR ranking. Buffer analysis: minimum capital
injection that empties the default set. Reconcile against ECB climate stress-test contagion figures.

### 8.6 Limitations & model risk
The liability matrix is rarely fully observed — reconstruction (max-entropy) introduces topology error;
conservative fallback assumes denser connectivity (worse contagion). Fixed-point models omit fire-sale price
dynamics and funding-liquidity spirals, which can amplify beyond the clearing solution — flag results as a
lower bound on systemic loss.
