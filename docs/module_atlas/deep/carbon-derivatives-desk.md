## 7 · Methodology Deep Dive

### 7.1 What the module computes

`frontend/src/features/carbon-derivatives-desk/pages/CarbonDerivativesDeskPage.jsx` (1,413 lines)
is an EU-allowance (EUA) compliance-hedging desk. All quant primitives live in the sibling,
React-free, CommonJS module `frontend/src/features/carbon-derivatives-desk/lib/deskMath.js`
(137 lines) so the exact same functions price what the UI shows and what a Node verification
script asserts on — "zero re-implementation drift" per the file's own header comment. The desk
covers: (1) a cost-of-carry forward curve, (2) a user-editable 5×4 strike-moneyness × tenor
implied-vol surface with bilinear interpolation, (3) Black-76 European options on that surface with
a live BSM cross-check, (4) a multi-leg strategy builder (collar/spreads/straddle/calendar) with
aggregate payoff and net greeks, (5) EUA–UKA / EUA–CCA cross-market spread ladders, (6) EU Market
Stability Reserve (MSR) intake/release mechanics on a user TNAC path, (7) a compliance hedge
program priced off a live EU ETS scenario-forecast engine with quarterly auction planning and cost
averaging, (8) an IFRS 9 own-use/derivative decision tree, (9) a futures-book margin estimate, and
(10) a sustainability/ICP overlay. Nothing in the desk uses a PRNG — every model is closed-form or
a documented deterministic scenario ladder.

### 7.2 Cost-of-carry forward: `cocForward`

```
F = S · e^{(r + u)·τ}
```
EUAs are electronic registry entries (no physical storage), so the fair forward is simply the
funded spot: `u` is a user-set funding/holding spread (default 0). The engine's own reference curve
(`GET /api/v1/climate-derivatives/ref/eua-market → futures_curve`) is a **fundamentals-based**
curve (not cost-of-carry), so the gap between the two, when both are live, is read as an implied
risk premium — documented directly in the UI, not silently reconciled.

### 7.3 Black-76 on futures (`black76`, deskMath.js lines 22–43)

```
d1 = [ln(F/K) + σ²τ/2] / (σ√τ),   d2 = d1 − σ√τ
Call = e^{−rτ}[F·N(d1) − K·N(d2)]
Put  = e^{−rτ}[K·N(−d2) − F·N(−d1)]
Δcall = e^{−rτ}N(d1);  Δput = −e^{−rτ}N(−d1)
Γ = e^{−rτ}·n(d1) / (F·σ·√τ);   vega (per 1 vol-pt) = F·e^{−rτ}·n(d1)·√τ / 100
```
`N(·)` is the Abramowitz & Stegun rational approximation (Handbook of Mathematical Functions,
formula 26.2.17, |error| < 7.5×10⁻⁸) — not a library call, coded directly in `normCdf`. The
platform's backend cross-check (`POST /api/v1/climate-derivatives/price-eua-option`,
`backend/services/climate_derivatives_engine.py::price_eua_option`) prices BSM **on spot** (not on
the forward); with carry `u = 0` the two formulations are mathematically identical because
`F = S·e^{rτ}` makes Black-76-on-F collapse to BSM-on-S — the desk explicitly uses this identity as
its own correctness check (`runXcheck`), flagging Δ ≈ 0 as validating both implementations and any
non-zero gap under `u ≠ 0` as the carry effect, not a bug.

### 7.4 Implied-vol surface: bilinear interpolation (`bilinearVol`, deskMath.js lines 49–70)

Grid axes: strike moneyness `K/S ∈ {0.8, 0.9, 1.0, 1.1, 1.2}` (ascending), tenor
`τ ∈ {0.5, 1, 2, 3}` years (ascending); `grid[i][j]` = vol% at that node. A query point is located
between its bracketing nodes on each axis, weights computed as fractional distance
(`wm, wt ∈ [0,1]`), and the four corner values combined as
`(1−wm)(1−wt)·v00 + wm(1−wt)·v10 + (1−wm)wt·v01 + wm·wt·v11`. Queries outside the grid are **clamped
flat** to the hull (no extrapolated smile is invented). At an exact node the weights collapse to
{1,0}, so quoted node values reproduce exactly. The default smile (`defaultSurface`) is a **labeled
market-typical shape, not observed quotes**: OTM puts rich (carbon downside/compliance-demand skew:
smile offsets `{0.8: +6, 0.9: +3, 1.0: 0, 1.1: +1.5, 1.2: +3}` vol points over the flat base), with
the skew flattening by tenor via `flatten(τ) = 1/(1 + 0.4·(τ − τ_min))`. All 20 nodes are
user-editable in the UI.

### 7.5 Worked example — one option price, traced and numerically verified

Default state: spot `S = €65`, `r = 3.5%`, carry `u = 0`, flat vol 35% (all labeled defaults near
the engine's own reference); option panel default strike `K = €70`, tenor `τ = 1y`, vol source =
surface.

**Forward:** `F = 65 · e^{0.035×1} = 65 × 1.035620 = €67.315/t`.

**Surface vol at K/S = 70/65 = 1.07692, τ = 1y:** the default-smile grid gives node values
(vol%) at `m=1.0`: {35.0, 35.0, 35.0, 35.0} across all four tenors (smile offset 0 at ATM), and at
`m=1.1`: {36.5, 36.3, 35.9, 35.8} for τ = {0.5, 1, 2, 3}. At τ=1 exactly, the tenor weight is 0
(the query sits on the τ=1 node), so only the moneyness axis interpolates:
`wm = (1.07692 − 1.0)/(1.1 − 1.0) = 0.76923`;
`σ = (1 − 0.76923)×35.0 + 0.76923×36.3 = 8.0769 + 27.923 = 36.0%` exactly.

**Black-76:** `d1 = [ln(67.315/70) + 0.5×0.36²×1] / (0.36×1) = [−0.03911 + 0.0648] / 0.36 =
0.02569/0.36 = 0.07137`; `d2 = 0.07137 − 0.36 = −0.28863`. Discount `e^{−0.035} = 0.965605`.
`N(d1) = 0.51027`, `N(d2) = 0.38657` (Abramowitz–Stegun). **Call = 0.965605 × (67.315×0.51027 −
70×0.38657) = 0.965605 × (34.348 − 27.060) = 0.965605 × 7.288 ≈ €8.229/t.** **Put = 0.965605 ×
(70×0.61343 − 67.315×0.48973) = 0.965605 × (42.940 − 32.966) = 0.965605 × 9.974 ≈ €10.822/t.**
Delta_call = 0.5103, delta_put = −0.4553, gamma ≈ 0.01586, vega (per 1 vol-pt) ≈ €0.2587.
Put-call parity check: `Call − Put − e^{−rτ}(F−K) = 8.229 − 10.822 − 0.965605×(67.315−70) =
−2.593 − (−2.593) ≈ 2×10⁻¹⁵` — confirms the closed-form is internally consistent (verified by
direct Python re-implementation of the exact JS rounding behavior, not just approximated by hand).

### 7.6 Multi-leg strategy payoff & EU MSR mechanics

**Strategy payoff** (`legPayoff`/`strategyPayoff`, deskMath.js lines 84–94): each leg's intrinsic
value at terminal price `ST` is `max(ST−K,0)` (call) or `max(K−ST,0)` (put), signed by
`side ∈ {+1 long, −1 short}` and scaled by quantity; the aggregate strategy payoff is the pointwise
sum — e.g. the default **collar preset** (long put @ 90% strike + short call @ 110% strike) is
literally `legPayoff(put) + legPayoff(call)` with no cross term, which the desk's own verification
suite asserts directly. Calendar legs beyond the nearest expiry are re-marked with Black-76 at their
remaining tenor and the same surface vol — a documented static-vol simplification, not a
stochastic-vol calendar model.

**EU Market Stability Reserve** (`MSR_PARAMS`/`msrAction`, deskMath.js lines 96–129), citing
**Decision (EU) 2015/1814, as amended by Decision (EU) 2018/410 and Decision (EU) 2023/959
("Fit for 55")** exactly as coded:
```
TNAC > 1,096 Mt              → intake = 24% of TNAC (2019–2030), 12% from 2031
833 Mt < TNAC ≤ 1,096 Mt      → intake = TNAC − 833 Mt          (2023/959 anti-cliff buffer band)
TNAC < 400 Mt                 → release 100 Mt to auctions
400–833 Mt                    → no action
```
Worked example on the page's own default TNAC path (`MSR_DEFAULT_PATH`), year **2025, TNAC = 1,050
Mt**: since `833 < 1,050 ≤ 1,096`, the buffer-band rule applies (not the 24% headline rate):
`intake = 1,050 − 833 = 217 Mt` (no `ratePct` shown for this band, by design — it is not a
percentage-of-TNAC rule). Contrast with the illustrative full-intake case the UI parameterizes:
at `TNAC = 1,200 Mt` (> 1,096, year ≤ 2030) intake would be `24% × 1,200 = 288 Mt`; and at
`TNAC = 350 Mt` (< 400) the mechanism instead **releases** the fixed `100 Mt` regardless of how far
below 400 the TNAC sits (the release amount is a flat rule, not proportional). The desk explicitly
notes this is a rules-mechanics illustration on a *user* TNAC path (labeled illustrative shape),
not a TNAC forecast, and that in reality each year's intake shrinks the following year's TNAC — a
feedback loop the model deliberately does not auto-couple (the user supplies a self-consistent path
if desired).

### 7.7 Data provenance & limitations

- **Real, hand-authored regulatory parameters, quoted exactly as coded**: the MSR thresholds
  (833/1,096/400 Mt) and rates (24% to 2030, 12% after) trace to the cited EU decisions; the
  EU ETS Phase 4 linear reduction factor default (4.3%/yr) cites Directive 2023/958.
- **Live engine data**: `GET /api/v1/climate-derivatives/ref/eua-market` prefills spot/vol/rate
  (labeled defaults €65, 35%, 3.5% approximate this reference even when the endpoint is
  unreachable); `POST /price-eua-option` cross-checks the desk's own Black-76; `POST
  /api/v1/carbon-price-ets/eu-ets-forecast` supplies the only scenario price path the hedge program,
  cost-of-delay and cost-averaging panels ever use — none of those three panels fabricate a
  fallback price when the engine is offline.
- **Labeled desk conventions, editable**: the default vol-surface smile shape, UKA/CCA levels and
  their historical-range notes, MSR TNAC path, margin IM%/VM-stress%, hedge-ratio ladder, and the
  ICP/abatement-rate sustainability inputs are all explicitly flagged as non-data assumptions.
- The strategy builder's calendar-leg repricing uses one static vol per remaining tenor rather than
  a full stochastic-vol term structure — a documented simplification for multi-tenor books.
- Cross-market EUA–UKA/EUA–CCA spread "arbitrage" is explicitly labeled non-executable by physical
  delivery (the underlyings are not fungible); the ladder is a scenario P&L table, not a tradeable
  basis model.

**Framework alignment:** Black, F. (1976), "The pricing of commodity contracts" · Abramowitz &
Stegun, *Handbook of Mathematical Functions* 26.2.17 · Decision (EU) 2015/1814 as amended by
2018/410 and 2023/959 (MSR) · Directive (EU) 2023/958 (Phase 4 LRF) · IFRS 9 §§2.4–2.5 (own-use),
6.4.1(c) (economic relationship), B6.2.4 (written options).

## 8 · Model Specification

**Status: implemented.** `deskMath.js` is the single source of truth for every formula below,
imported unmodified by the page and (per its own header) intended to be `require()`-able directly
by Node verification scripts — i.e. the numbers in this spec are the numbers the desk renders.

**8.1 Purpose & scope.** Price and risk-manage EU Allowance compliance exposure: forward curve
construction, vanilla and multi-leg option pricing, a hedge program against a declining free
allocation, EU MSR supply-mechanics analysis, and IFRS 9 hedge-accounting classification — for a
compliance-obligated entity's EUA desk.

**8.2 Conceptual approach.** A cost-of-carry forward curve anchors Black-76 option pricing off a
user-editable, bilinearly-interpolated implied-vol surface; a multi-leg payoff engine sums
per-leg intrinsic values (with a static-vol calendar approximation for mixed-tenor books); a
rules-based (not stochastic) EU MSR engine applies the exact legislated thresholds to a
user-supplied TNAC path; the hedge program combines locked-forward costs for the hedged fraction
with live scenario-engine prices for the open fraction.

**8.3 Mathematical specification.**
```
F(τ)      = S·e^{(r+u)τ}
σ(K,τ)    = bilinear interpolation of the strike-moneyness×tenor grid, clamped to the hull
d1,d2     = [ln(F/K) ± σ²τ/2] / (σ√τ)  (± as defined in Black-76)
Call, Put = e^{−rτ}[F·N(d1)−K·N(d2)],  e^{−rτ}[K·N(−d2)−F·N(−d1)]
Strategy payoff(ST) = Σ_legs side·qty·intrinsic(leg, ST)
MSR(TNAC, year): 24%/12% intake above 1,096 Mt; TNAC−833 in the 833–1,096 buffer band;
                 100 Mt release below 400 Mt; no action 400–833 Mt
HedgedCost = hedgedVol · F(τ) [futures] or hedgedVol · (collarEff + netPremium) [collar]
OpenCost   = openVol · scenarioPrice(year)   [live EU ETS forecast engine only]
```

**8.4 Data requirements.** Live: EUA spot/vol/rate reference and BSM cross-check
(`climate_derivatives_engine`), EU ETS Phase-4 scenario price path
(`carbon_price_ets_engine.forecast_eu_ets_price`). User: vol-surface node overrides, strategy legs,
UKA/CCA levels and FX, TNAC path, hedge-program emissions/allocation/ratios, margin and
sustainability assumptions. No external market-data feed is wired in; live figures come exclusively
from the platform's own two engines named above.

**8.5 Validation & benchmarking.** Already implemented in-code: put-call parity check on every
Black-76 quote (`parity = (Call−Put) − e^{−rτ}(F−K)`, displayed to the user); the BSM cross-check
against the backend engine (identical under `u=0`); bilinear-interpolation exactness at grid nodes;
the collar-is-literally-its-legs identity for the strategy builder. Recommended external
benchmark: compare the desk's default vol-surface shape and UKA/CCA range notes against live ICE/EEX
screens periodically (both explicitly labeled as needing verification, not live-sourced).

**8.6 Limitations & model risk.** Vol surface, MSR TNAC path, and cross-market levels are user
inputs or labeled desk conventions, not live market data — treat every "labeled default" as a
placeholder to override before real use. The MSR projection does not self-couple intake to next
year's TNAC (the user must supply an internally consistent path). Calendar-spread legs use a
static-vol re-mark rather than a full term-structure model. Margin figures are a documented planning
convention, explicitly not an exchange IM/VM schedule. Cost-of-delay and cost-averaging compare
against exactly one scenario path — this is scenario arithmetic, not a probability-weighted expected
value.
