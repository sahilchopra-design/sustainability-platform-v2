## 7 · Methodology Deep Dive

### 7.1 What the module computes

`ppa-xva-engine` (`backend/api/v1/routes/ppa_xva.py`, 998 lines; frontend
`PpaXvaEnginePage.jsx`, 801 lines) is a contract-level XVA suite for long-dated
renewable PPAs: **`POST /cva`** prices CVA/DVA/FVA/KVA/MVA/ColVA on a single
contract via a deterministic merchant-price lattice, and **`POST /netting`**
extends the same lattice to a 2-3 contract netting set against one
counterparty. Both are fully deterministic — "no PRNG anywhere in this
module" (module docstring) — every number is a closed-form function of the
request payload plus three hand-authored, labeled reference tables (rating PD
curve, annual migration matrix, CRE22 haircuts) that are themselves served
transparently at `GET /ref/*`.

The engine's own docstring lays out an 11-part method (merchant-price lattice
→ MtM → exposure profiles → CSA/collateral → static PD curve → migration-based
PD → CVA/DVA → full XVA stack → wrong-way risk → netting → sustainability
overlay); the sections below trace the code as implemented, with one 3-year
worked example carried through by hand.

### 7.2 The merchant-price lattice (CRR binomial, annual steps)

```python
u = math.exp(sigma * math.sqrt(dt))
d = 1.0 / u
p_raw = (math.exp(mu * dt) - d) / (u - d)
p = min(max(p_raw, 0.001), 0.999)
...
price = req.current_merchant_price_usd_mwh * (u ** j) * (d ** (t - j))
prob = math.comb(t, j) * (p ** j) * ((1.0 - p) ** (t - j))
```
(`compute_cva`, lines 451–482). `dt = 1.0` (annual steps), so at year `t` the
lattice has exactly `t+1` recombining nodes indexed by up-count `j`. `sigma`
and `mu` are the request's `annual_vol_pct`/`annual_drift_pct`. `p` is clamped
to `[0.001, 0.999]`; the response's `lattice.p_clamped` flag and a
`method_notes` line surface it whenever the raw drift/vol combination would
imply an out-of-range probability — the model never silently produces a
degenerate lattice.

### 7.3 Mark-to-market and exposure profiles

```python
ann = annuity(remaining)                                    # Σ_{k=1..rem} (1+r)^-k
mtm = sign * (req.fixed_price_usd_mwh - price) * req.annual_volume_mwh * ann
pos, neg = max(mtm, 0.0), max(-mtm, 0.0)
ee  += prob * pos      # expected positive exposure
ene += prob * neg       # expected negative exposure (DVA leg)
```
(lines 468–498). `sign = +1` for `holder="generator"` (receives fixed, so MtM
rises as merchant price falls) and `-1` for `offtaker`. The node price is
treated as the flat forward for the remaining delivery term — a documented
approximation (§7.1 of the docstring) rather than a full forward curve.
PFE95/PFE99 are **exact lattice quantiles**, not a parametric approximation:

```python
def _exposure_quantile(nodes, q):
    ordered = sorted(nodes, key=lambda x: x[0])
    cum = 0.0
    for e, prob in ordered:
        cum += prob
        if cum >= q - 1e-12:
            return e
    return ordered[-1][0]
```
(lines 274–283), and the code asserts `pfe99 >= pfe95 - 1e-9` at every period
at runtime (line 526) — quantile monotonicity is a structural guarantee, not
just an expectation.

### 7.4 CSA / collateral and the XVA stack

Collateral called at a node: `c = floor(max(mtm - threshold, 0)/rounding) *
rounding`, waived if `c < mta` (`_collateral_called`, lines 427–438), valued
after a CRE22-style haircut (`COLLATERAL_HAIRCUTS_PCT`: cash 0%, sovereigns
2%, IG corporates 6%, main-index equities 20%). Residual (collateralised)
exposure adds a margin-period-of-risk add-on before flooring:

```python
mpr_addon = price * annual_volume_mwh * sigma * sqrt(mpr_years)
pos_coll = max(min(mtm, mtm - eff_coll + mpr_addon), 0.0)
```
The full stack (lines 544–566, 603–604):

```
CVA          = Σ_t EE_t      × marginalPD_cpty(t) × (1−R_cpty) × DF_t
DVA          = Σ_t ENE_t     × marginalPD_own(t)  × (1−R_own)  × DF_t
FVA = FCA − FBA;  FCA = Σ_t EE_coll_t × s_f × DF_t,  FBA = Σ_t ENE_t × s_f × DF_t
KVA  = Σ_t [0.08 × RW × EAD_t] × cost_of_capital × DF_t
       EAD_t = 1.4 × (EE_coll_t + PFE_addon_t)          (SA-CCR α = 1.4, CRE52.1)
       PFE_addon_t = 0.40 × S0 × remaining_volume × MF   (CRE52 electricity SF)
MVA  = Σ_t IM × s_f × DF_t
ColVA= Σ_t E[collateral]_t × s_c × DF_t
Total XVA = CVA − DVA + FVA + KVA + MVA + ColVA
```
`SA_CCR_ALPHA = 1.4` and the 40% electricity supervisory factor
(`SA_CCR_COMMODITY_SF_PCT`) are the **real** Basel CRE52 constants — the
engine is explicit that RC is *proxied* by rolled-along `EE_coll_t` rather
than a true t0 SA-CCR replacement cost (`SA_CCR_LABEL`, lines 215–221).

### 7.5 Credit curves: static table vs migration matrix

The static curve (`CUMULATIVE_PD_TABLE_PCT`, 7 ratings × 8 tenors, 1–20y) is
linearly interpolated between tenors and flat-hazard-extrapolated beyond 20y,
capped at 99% (`_cumulative_pd`, lines 240–257). Independently, an **annual
rating-migration matrix** (`MIGRATION_MATRIX_PCT`, 8×8 including absorbing
`D`, each row summing to exactly 100) is propagated as a state vector:

```python
pi = [1.0 if s == rating else 0.0 for s in MIGRATION_STATES]
for _ in range(horizon):
    pi = [sum(pi[i] * m[i][j] for i in range(len(pi))) for j in range(len(pi))]
    out.append(min(pi[-1], 0.99))                      # cumulative PD_mig(t) = D-state mass
```
(`_migration_cumulative_pds`, lines 260–271). Both curves are **always**
computed and returned side-by-side (`rating_transition.curve_comparison`);
`use_rating_transitions` only switches which one drives the headline CVA
(default: static). Both tables are labeled "derived from published
rating-agency long-term corporate default studies (S&P Global 1981-2023 /
Moody's 1983-2023) — APPROXIMATE, rounded; hand-authored for transparency,
not a licensed data feed."

### 7.6 Worked example — 3-year lattice by hand

Inputs: `fixed_price=$55/MWh, annual_volume=250,000 MWh, tenor=3y,
current_price=$48, drift=1%, vol=22%, discount=4.5%, holder=generator,
counterparty_rating=BBB, recovery=40% (LGD=60%)`.

**Lattice parameters:**
```
u = e^0.22        = 1.246077
d = 1/u           = 0.802519
p = (e^0.01 − d)/(u − d) = (1.010050 − 0.802519)/0.443558 = 0.467879   (not clamped)
```

**t=1 (2 nodes):** `annuity(2) = 1/1.045 + 1/1.045² = 1.872668`.
- j=0: price = 48×d = 38.5209; prob = 1−p = 0.532121; MtM = (55−38.5209)×250,000×1.872668 = **$7,714,969**; positive → contributes fully to EE.
- j=1: price = 48×u = 59.8117; prob = p = 0.467879; MtM = (55−59.8117)×250,000×1.872668 = **−$2,252,671** → floored to 0 in EE.
- **EE₁ = 0.532121 × 7,714,969 = $4,105,298.**
- Cumulative PD (BBB, t=1) = 0.15% exactly on-anchor; marginal PD₁ = 0.15%; DF₁ = 1.045⁻¹ = 0.956938.
- **CVA₁ = 4,105,298 × 0.0015 × 0.60 × 0.956938 = $3,535.66.**

**t=2 (3 nodes):** `annuity(1) = 0.956938`.
| j | price | prob | MtM | pos |
|---|---|---|---|---|
| 0 | 48×d² = 30.9137 | 0.283153 | (55−30.9137)×250,000×0.956938 = $5,762,261 | 5,762,261 |
| 1 | 48×u×d = 48.0000 | 0.497936 | (55−48)×250,000×0.956938 = $1,674,641 | 1,674,641 |
| 2 | 48×u² = 74.5299 | 0.218911 | (55−74.53)×250,000×0.956938 = −$4,672,236 | 0 |

**EE₂ = 0.283153×5,762,261 + 0.497936×1,674,641 = $2,465,466.** Cumulative
PD(2) = 0.40% (BBB anchor exact); marginal PD₂ = 0.40%−0.15% = 0.25%; DF₂ =
1.045⁻² = 0.915730.

**Node-level CVA contribution** (the "one node's exposure and its
contribution to CVA" requested): take node (t=2, j=1) — EE contribution
`prob × pos = 0.497936 × 1,674,641 = $833,996`; its slice of CVA₂ is
`prob × pos × marginalPD₂ × LGD × DF₂ = 0.497936 × 1,674,641 × 0.0025 ×
0.60 × 0.915730 = $1,145.39`. The j=0 node contributes `0.283153 ×
5,762,261 × 0.0025 × 0.60 × 0.915730 = $2,241.16`. Together **CVA₂ =
1,145.39 + 2,241.16 = $3,386.55** — matching a direct computation of
`EE₂ × marginalPD₂ × LGD × DF₂ = 2,465,466 × 0.0025 × 0.60 × 0.915730 =
$3,386.55`. This confirms the code's summation order (per-node inside the
period, then aggregate to the period CVA) is arithmetically identical to
computing EE₂ first.

**t=3:** `remaining = 0` ⇒ `annuity(0) = 0` ⇒ every node's MtM is exactly 0
(no more deliveries to mark) ⇒ **EE₃ = CVA₃ = 0.**

**Total 3-year uncollateralised CVA = 3,535.66 + 3,386.55 + 0.00 =
$6,922.22** (contract notional here is $55/MWh × 250,000 MWh × 3y ≈ $41.25M,
so this is a small, short-dated illustrative slice — the platform default is
a 15-year tenor at $5M CSA threshold, which produces materially larger,
mostly-collateralised figures).

### 7.7 Wrong-way risk — two channels

**Generic WWR** (qualitative flag + linear EE scalar): `CVA_wwr = Σ_t EE_t ×
(1 + wwr_correlation) × mPD_t × (1−R) × DF_t`, flagged only when
`counterparty_is_merchant_utility AND holder == "generator"` — the
combination where exposure (generator receives fixed, gains when price
falls) and counterparty default risk (merchant buyer's credit weakens when
prices fall) move together (lines 606–626).

**Renewable-specific channel** (quantified, not just flagged): merit-order
effect — high renewables output depresses merchant prices, so `EE
multiplier(ρ) = 1 + 0.5ρ` where ρ is the user's RES-output/price
correlation input (`KAPPA_RES_WWR = 0.5`, explicitly "HAND-AUTHORED
pass-through scaling... not a calibrated copula", lines 628–651). A full
ρ ∈ [0,1] sweep is always returned for the frontend chart.

### 7.8 Netting sets (`POST /netting`)

2-3 PPAs against the *same* counterparty are marked on a **single** merchant-
price lattice (one price factor — documented simplification). Per period,
`gross_EE_t = Σᵢ E[max(MtM_i,0)]` vs `net_EE_t = E[max(Σᵢ MtM_i, 0)]`; because
`max(Σxᵢ,0) ≤ Σmax(xᵢ,0)` node-wise, `net_EE_t ≤ gross_EE_t` at *every*
period — asserted at runtime (`assert net_ee <= gross_ee + 1e-6`, line 907).
Netting benefit `= 1 − CVA_net/CVA_gross`, clamped to `[0,100]`.

### 7.9 Companion analytics on the page

The frontend (`PpaXvaEnginePage.jsx`) is a pure display/orchestration layer —
every number shown is either the `/cva` or `/netting` response, or a labeled
editable input; no client-side XVA math is duplicated. It wires 5 live
endpoints: `POST /cva`, `POST /netting`, `GET /ref/pd-curves`, `GET
/ref/migration-matrix`, and `GET /api/v1/renewable-ppa/ref/credit-ratings`
(cross-referenced counterparty risk scores from the renewable-PPA engine,
shown "for cross-reference, not re-derived here"). The netting-set panel
lets the user add/remove 2-3 contracts with independent fixed price, volume,
tenor and holder side.

### 7.10 Data provenance & limitations

- **No PRNG anywhere** — confirmed by direct code read; every output is a
  closed-form function of inputs plus the three labeled reference tables.
- **PD table and migration matrix are hand-authored approximations** of
  published S&P/Moody's long-term corporate studies — explicitly not a live
  agency feed ("APPROXIMATE, rounded... not a licensed data feed").
- **SA-CCR KVA is a documented proxy**, not a full netting-set SA-CCR
  calculation: RC is the rolled-along collateralised EE rather than a true t0
  replacement cost, and the PFE add-on uses a single electricity supervisory
  factor rather than the full hedging-set/maturity-factor machinery.
- **Single price-factor netting** — a real multi-PPA book would face
  distinct regional/tenor price curves; this engine intentionally marks all
  netted contracts on one lattice (documented, not hidden).
- **First-order CVA/DVA** — survival-probability cross terms are omitted
  ("conservative for CVA," per the docstring); this is standard for
  indicative desk-level XVA but understates the true joint-default discount
  at long tenors and high correlation.
- **WWR multipliers are hand-authored pass-throughs** (`1+wwr_correlation`,
  `1+0.5ρ`), not calibrated copulas — both are explicitly labeled as model
  assumptions in the response payload.
- No guide/code mismatch was found: the `NEXT_USE_CASES_2.md` spec entry
  ("XVA on long-dated PPAs... CVA/DVA from rating-based PD curves,
  collateral/netting terms, wrong-way-risk flag") undersells what the code
  actually delivers — the implementation adds FVA/KVA/MVA/ColVA, PFE 95/99,
  a full CSA depth panel (threshold/MTA/rounding/haircut/MPR sensitivity),
  rating-migration-matrix time-varying PD, and a quantified renewable WWR
  channel, all beyond the original spec.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Price the full counterparty-credit valuation-
adjustment stack on a long-dated corporate/IPP renewable PPA — CVA, DVA,
FVA, KVA, MVA, ColVA, PFE 95/99, and a netting-set analysis — for banks and
IPPs assessing counterparty risk capital and pricing on merchant-exposed
fixed-price power contracts, without requiring a licensed market-risk
simulation engine.

**8.2 Conceptual approach.** A deterministic recombining Cox-Ross-Rubinstein
binomial lattice stands in for a Monte Carlo merchant-price simulation:
because the lattice is exact and reproducible (no PRNG), every exposure,
quantile and valuation adjustment is bit-identical for identical inputs —
auditable in a way a seeded Monte Carlo engine is not. CSA mechanics
(threshold/MTA/rounding/haircut/MPR) are modeled explicitly rather than
approximated by a flat collateralisation discount. Credit risk is dual-
sourced (a static rating-based PD curve and an annual migration matrix) so
users can compare a "point-in-time" versus "time-varying" credit view on the
same contract. KVA uses the real Basel SA-CCR α and commodity supervisory
factor as a labeled EAD proxy rather than inventing a bespoke capital
formula.

**8.3 Mathematical specification.**
```
Lattice:      u = e^(σ√dt),  d = 1/u,  p = clamp((e^(μdt) − d)/(u − d), 0.001, 0.999)
Node price:   S(t,j) = S0 · u^j · d^(t−j)
Node prob:    P(t,j) = C(t,j) · p^j · (1−p)^(t−j)
MtM(t,j)  =   sign · (K − S(t,j)) · V · annuity(T−t, r)      sign = ±1 by holder
EE_t      =   Σ_j P(t,j)·max(MtM(t,j),0)
ENE_t     =   Σ_j P(t,j)·max(−MtM(t,j),0)
PFE_q(t)  =   exact lattice q-quantile of max(MtM,0)          (PFE99 ≥ PFE95 asserted)
Collateral(t,j) = floor(max(MtM−K_thr,0)/R)·R  [waived < MTA],  valued ×(1−haircut)
CVA       =   Σ_t EE_t          · ΔPD_cpty(t) · (1−R_cpty) · (1+r)^-t
DVA       =   Σ_t ENE_t         · ΔPD_own(t)  · (1−R_own)  · (1+r)^-t
FVA       =   Σ_t EE_coll,t·s_f·(1+r)^-t  −  Σ_t ENE_t·s_f·(1+r)^-t
KVA       =   Σ_t 0.08·RW·[1.4·(EE_coll,t + SF·S0·V_rem,t·MF)]·CoC·(1+r)^-t
MVA       =   Σ_t IM·s_f·(1+r)^-t
ColVA     =   Σ_t E[coll]_t·s_c·(1+r)^-t
Migration PD: π_t = π_{t−1}·M,   cumPD_mig(t) = π_t[D]
Netting:   net_EE_t = E[max(Σ_i MtM_i,0)] ≤ Σ_i E[max(MtM_i,0)] = gross_EE_t  (node-wise identity)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Cumulative PD table (7 ratings × 8 tenors) | `CUMULATIVE_PD_TABLE_PCT` | Hand-authored approximation, S&P/Moody's long-term corporate default studies |
| Annual migration matrix (8×8) | `MIGRATION_MATRIX_PCT` | Hand-authored approximation, S&P/Moody's one-year transition studies |
| SA-CCR alpha | `SA_CCR_ALPHA = 1.4` | Real Basel CRE52.1 |
| Commodity supervisory factor (electricity) | `40%` | Real Basel CRE52 commodity SF table |
| Collateral haircuts | `COLLATERAL_HAIRCUTS_PCT` | CRE22-style standard supervisory haircuts, hand-authored/rounded |
| RES-WWR pass-through | `KAPPA_RES_WWR = 0.5` | Hand-authored model assumption (labeled, not calibrated) |
| Transition-score PD multiplier | `1+(50−score)/100` | Hand-authored labeled mapping |

**8.4 Data requirements.** Contract terms (fixed price, volume, tenor,
holder side), current merchant price + drift/vol assumption for the lattice,
counterparty and own rating + recovery rates, discount rate, CSA terms
(threshold/MTA/rounding/type/collateral asset/IM), funding spread, cost of
capital, counterparty risk weight, collateral remuneration spread, and the
two WWR/sustainability inputs (merchant-utility flag + correlation, RES
correlation, transition-readiness score). For netting, 2-3 contracts sharing
one counterparty and one price factor.

**8.5 Validation & benchmarking.** `GET /ref/pd-curves`, `/ref/migration-
matrix`, `/ref/sa-ccr-params` and `/ref/collateral-haircuts` disclose every
table so a risk desk can diff them against its own agency subscriptions or
Basel implementation. Internal invariants are asserted at runtime rather
than merely documented: PFE99 ≥ PFE95 every period, migration-matrix row
sums to 1, and netted EE ≤ gross EE every period. No external backtest
harness exists in-repo; production validation would compare the lattice's
implied volatility surface against observed forward curves and revalidate
KVA against a full SA-CCR netting-set implementation.

**8.6 Limitations & model risk.** The lattice is a single-factor annual-step
approximation of a continuous merchant-price process — no intra-year price
paths, no seasonality, and the node price stands in for the full forward
curve at every horizon (a documented simplification, not a curve-consistent
model). CVA/DVA omit survival-probability cross terms (conservative for
CVA). KVA's SA-CCR EAD is a single-hedging-set proxy, not a netting-set
calculation with the full add-on aggregation formula. The two credit curves
(static vs migration) can diverge materially at long tenors for low-rated
names; only one drives the headline number by default (static), which a
user must consciously override via `use_rating_transitions` to see the
time-varying view. WWR multipliers are explicitly labeled model assumptions
rather than calibrated correlations and should be treated as sensitivity
inputs, not point estimates.

**Framework alignment:** Cox-Ross-Rubinstein binomial lattice · Basel CRE52
SA-CCR (α = 1.4, commodity supervisory factors) · CRE22 standard supervisory
haircuts · S&P Global / Moody's long-term corporate default and transition
studies (approximated) · standard sell-side XVA desk conventions (CVA/DVA/
FVA/KVA/MVA/ColVA waterfall).
