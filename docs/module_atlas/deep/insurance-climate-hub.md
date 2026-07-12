## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Climate-Loaded Combined
> Ratio** engine — `CRclimate = (Claims×(1+ClimateLoading)+Expenses)/NetPremium` — with peril-specific
> loading factors. **The frontend page computes no combined ratio.** It is a **KRI (Key Risk
> Indicator) scorecard**: 40 synthetic KRIs across 8 actuarial domains, aggregated into a
> weighted domain score and an overall climate-risk score, plus peer benchmarking and scenario
> stress. A well-built **backend engine** (`insurance_climate_risk.py`) *does* implement Solvency II
> CAT/TP/SCR maths, but the page does not call it — the four `GET/POST /api/v1/insurance/*` trace
> labels are declared, yet all rendered numbers come from local `sr()`-seeded `KRIS`. Sections below
> document the page as coded, then §8 specifies the missing loaded-CR model.

### 7.1 What the module computes

Each of 40 KRIs is a PRNG draw with a threshold and a 5-quarter trend:

```js
value      = sr(i·19+4)·90 + 10          // 10–100
threshold  = sr(i·19+3)·80 + 20          // 20–100
breaching  = value > threshold
```

Domain and overall scores invert the mean KRI value into a 0–100 health score:

```js
avgValue   = Σ domainKRIs.value / domainKRIs.length
score      = clamp(100 − avgValue·0.3, 0, 100)              // per domain
weightedSum= Σ domainScores·domainWeights ; overallScore = weightedSum / Σ weights
```

Peer percentile ranking counts how many of 10 peers a domain outscores:

```js
percentile = rank / (PEER_INSURERS.length + 1) × 100
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| Domains (8) | Physical, Transition, Underwriting, Reserve Adequacy, Solvency Capital, Regulatory, Governance, Cat Modelling | Fixed taxonomy |
| Default domain weights | 15,15,12,12,12,12,11,11 (Σ=100) | Author judgement |
| KRI `value`/`threshold`/`trend`/`peer` | `sr()`-seeded | Synthetic (`sr(s)=frac(sin(s+1)×10⁴)`) |
| Score inversion factor | `100 − avgValue×0.3` | Heuristic mapping value→health |
| Stress multipliers | 1.5 °C Orderly ×0.97; Hot House 3 °C ×0.82; NatCat Mega ×(lower) | Hard-coded scenario haircuts on overallScore |
| `PEER_SCORES` (10 insurers × 8 domains) | `sr(i·89+di+1)·45+40` | Synthetic peer matrix (AXA, Allianz, Munich Re…) |
| `REGULATORY_MILESTONES` | 20 curated deadlines | Real regulators (EIOPA, PRA, NAIC, IAIS…), demo dates |

### 7.3 Calculation walkthrough

1. 40 KRIs seeded → grouped by domain via `domainIdx`.
2. Per-domain average value → inverted to a 0–100 `score`.
3. Domain scores weighted (adjustable via `domainWeights`, renormalised by `totalWeight`) → overall.
4. Trajectory tab averages KRI `trend[ti]` per domain over 5 quarters.
5. Breach tab computes `breachProb = clamp((value−threshold)/threshold×100, 0, 200)`.
6. Peer tabs build a radar and percentile ranking against the synthetic peer matrix.
7. Stress tab applies fixed scenario multipliers to `overallScore` and adds KRI-breach counts.

### 7.4 Worked example (one domain)

Suppose "Physical Risk" contains 5 KRIs with values {72, 55, 88, 40, 61}:

| Step | Computation | Result |
|---|---|---|
| avgValue | (72+55+88+40+61)/5 | 63.2 |
| domain score | clamp(100 − 63.2×0.3, 0, 100) | **81.0** |
| weight | 15 (default) | — |
| contribution to overall | 81.0 × 15 | 1,215 |
| overall (illustrative) | Σ contributions / Σ weights (100) | e.g. **~78** |
| Hot House 3 °C stress | 78 × 0.82 | **64.0** |

### 7.5 Companion analytics on the page

- **Breach dashboard** — per-domain breach probability and count.
- **Peer radar / percentile** — domain vs synthetic peer matrix; Leader/Follower/Laggard status
  from `gap = ourScore − peerBest`.
- **What-if weighting** — raising a domain weight (+10, cap 50) recomputes the weighted overall.
- **Regulatory calendar** — 20 milestones with days-remaining and priority.

### 7.6 Data provenance & limitations

- **Frontend is 100 % synthetic** — all 40 KRIs, trends, and the 10×8 peer matrix are `sr()`-seeded.
- The **backend engine is real and unused by this page**: `insurance_climate_risk.py` implements
  peril×scenario CAT multipliers (Swiss Re sigma / EIOPA CCRST), Solvency II CAT-SCR add-ons
  (Delegated Reg. Annex XIII factors), TP uplift (EIOPA 2024), reserve adequacy, and protection gap
  — none of which the hub page invokes.
- The score inversion (`100 − value×0.3`) is a display heuristic, not an actuarial transform.
- The combined-ratio methodology in the guide is entirely absent from code.

**Framework alignment:** *EIOPA Opinion on Sustainability in Solvency II* / *PRA SS3/19* — the domain
taxonomy and regulatory calendar reference these regimes; the backend engine encodes Solvency II CAT
SCR and TP uplift, but the page surfaces only KRI scores. *Lloyd's RDS* — cited in the engine header.
*IPCC AR6 hazard trajectories* — the guide's loading factors derive from AR6, but the page uses fixed
scenario multipliers instead.

## 8 · Model Specification

**Status: specification — not yet implemented in code (on the frontend; the backend implements the
CAT/SCR portion but is not wired to this page).**

### 8.1 Purpose & scope
Compute a **climate-loaded combined ratio** and Solvency II climate-capital view per line of business
and peril, driving underwriting-appetite and reserving decisions — the metric the guide promises but
the page omits.

### 8.2 Conceptual approach
Load the expected loss ratio with peril-specific climate multipliers calibrated to IPCC AR6 hazard
trajectories and vendor cat-model climate-conditioned event sets (mirroring the platform's own
`insurance_climate_risk.py`, plus RMS/Verisk climate-conditioned catalogues and EIOPA's CCRST 2022
stress design). Combine with Solvency II CAT SCR to give a capital-aware CR.

### 8.3 Mathematical specification
For line of business *l*, peril *p*, scenario *s*, horizon *t*:

```
Loading_{p,s,t}  = m_{p}(s,t) − 1                              // m from _CAT_LOSS_MULTIPLIER table
ExpLoss_l(s,t)   = ExpLoss_l^base · (1 + Σ_p share_{l,p}·Loading_{p,s,t})
CR_l(s,t)        = (ExpLoss_l(s,t) + Expenses_l) / NetPremium_l
CATSCR_addon_l   = GWP_l · Σ_p f_p^{SII} · max(0, m_p(s,t)−1)  // f from Annex XIII factors
SolvencyRatio    = OwnFunds / (SCR_base + Σ_l CATSCR_addon_l)
```

| Parameter | Source |
|---|---|
| Peril×scenario multipliers `m_p(s,t)` | Swiss Re sigma; EIOPA CCRST 2022; already in `_CAT_LOSS_MULTIPLIER` |
| SII CAT factors `f_p^{SII}` | Solvency II Delegated Reg. (EU) 2015/35 Annex XIII; already in engine |
| Peril exposure shares `share_{l,p}` | Portfolio GWP by peril/geography |
| Base loss/expense ratios | Actuarial pricing basis |

### 8.4 Data requirements
Portfolio by LOB × peril × geography (GWP, exposure, base loss ratio, expenses), reinsurance
structure, own funds, SCR. The platform **already has** the multiplier tables, SII factors, TP-uplift
table and a full `calculate_insurance_climate_risk` function — the gap is wiring the page to
`POST /api/v1/insurance/calculate` instead of local `sr()` data.

### 8.5 Validation & benchmarking plan
Reconcile CR loadings and CAT-SCR add-ons against EIOPA CCRST published results and the insurer's own
cat-model output; backtest loaded loss ratios against realised catastrophe years; sensitivity of
solvency ratio to peril mix and scenario.

### 8.6 Limitations & model risk
Single-peril multipliers ignore correlation/clustering; climate conditioning of vendor catalogues is
itself uncertain; the linear loading understates tail convexity. Fallback: report CR as a scenario
range and flag any post-add-on solvency ratio <120% (as the backend already does).
