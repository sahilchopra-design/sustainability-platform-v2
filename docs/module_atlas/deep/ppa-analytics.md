## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives explicit formulas for PPA valuation
> (`PPANetValue = Σ[(PPAprice − MerchantPrice_t) × Volume_t / (1+r)^t]`), a percentile-based
> `VaR_PPA = PPANetValue − PPANetValue(P05)`, and `BasisRisk = CapturePrice − HubPrice`. **None of
> these are computed.** Every risk/valuation field on a contract (`markToMarket`, `creditExposure`,
> `offtakerRisk`, `volumeRisk`, `priceRisk`) is an independent `sr()`-seeded constant — there is no
> merchant-price forward curve, no discounting, and no basis-risk decomposition anywhere in the
> code.

### 7.1 What the module computes

65 synthetic PPA contracts, each with independently-drawn fields; the only genuine computation is
portfolio-level averaging/summation over whatever subset the user has filtered:

```js
avgPrice     = Σ contractPrice / n
avgFloor     = Σ priceFloor / n
totalCredit  = Σ creditExposure                       // sum of independent random draws
avgMtM       = Σ markToMarket / n                      // sum of independent random draws
atRiskContracts = count(priceScenario < priceFloor)     // real comparison, but against a random floor
```

### 7.2 Parameterisation

| Field | Formula | Range | Provenance |
|---|---|---|---|
| `contractPrice` | `priceFloor + 5 + sr()×45` | Floor+5 to Floor+50 $/MWh | Synthetic, floor-anchored so price ≥ floor by construction |
| `priceFloor` | `25 + sr()×55` | $25–80/MWh | Synthetic |
| `markToMarket` | `(sr()−0.5)×20` | −$10 to +$10/MWh | **Fabricated** — labelled "vs current market" but no market curve exists |
| `creditExposure` | `0.5 + sr()×49.5` | $0.5–50M | **Fabricated** — labelled counterparty credit exposure, not derived from offtaker rating or volume |
| `offtakerRisk`/`volumeRisk`/`priceRisk` | `10-85`/`5-55`/`10-70` (0–100 scale) | Independent `sr()` draws | Synthetic, uncorrelated with the contract's actual `rating` field |
| `pvRatio` | `0.8 + sr()×0.6` | 0.8–1.4 | Synthetic "PPA value ratio", not computed from a discounted cash flow |
| `greenAdditionality` | `sr() > 0.5` | boolean | Synthetic coin-flip, not tied to any additionality assessment criteria |

Note `offtakerRisk` is drawn independently of the contract's `rating` field (AAA…BBB-), so a AAA-
rated offtaker can show a higher `offtakerRisk` score than a BBB- offtaker — an internal
inconsistency a real credit-risk model would not produce.

### 7.3 Calculation walkthrough

1. 65 contracts generated once at module load, each field independently seeded.
2. Filters (structure / sector / geography) narrow `filtered`; sort toggles any numeric column.
3. **Price Scenario slider** ($20–100/MWh) drives `atRiskContracts = count(priceScenario <
   priceFloor)` — a genuine comparison, but `priceFloor` itself carries no economic meaning beyond
   being a random number the contract's `contractPrice` was anchored above by construction.
4. **By-structure aggregation** (`byStructure`): groups the full 65-contract universe (not the
   filtered subset) by PPA structure type, averaging `contractPrice` and summing `creditExposure`
   per structure — real aggregation over synthetic per-contract inputs.

### 7.4 Worked example

Filtered to 3 contracts: A (price=$65, floor=$40, MtM=+$3.2, credit=$12M), B (price=$52, floor=$35,
MtM=−$1.5, credit=$8M), C (price=$78, floor=$55, MtM=+$5.0, credit=$22M).

| Output | Computation | Result |
|---|---|---|
| avgPrice | (65+52+78)/3 | $65.0/MWh |
| avgFloor | (40+35+55)/3 | $43.3/MWh |
| totalCredit | 12+8+22 | $42M |
| avgMtM | (3.2−1.5+5.0)/3 | +$2.23/MWh |
| atRiskContracts @ priceScenario=$50 | count(50<40, 50<35, 50<55) | 1 (only C) |

The "at risk" flag is a real inequality check, but since `priceFloor` is a random number rather than
a contract-specific strike derived from actual negotiated terms, the count has no forecasting value.

### 7.5 Data provenance & limitations

- **All 65 contracts are entirely synthetic**, `sr()`-seeded independently field-by-field; no two
  fields on a contract are causally linked (e.g. `creditExposure` does not scale with `volumeMwh` or
  respond to `rating`).
- No merchant/hub price forward curve exists on the platform for this module to discount against —
  the guide's NPV and VaR formulas cannot be computed without one.
- `greenAdditionality` and GHG Protocol Scope 2 market-based-method eligibility are asserted by coin
  flip, not assessed against the guide's cited quality criteria (vintage, geographic/temporal
  matching, EAC/REC/GOO type).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute genuine PPA economic value, downside VaR, and basis risk for corporate/utility renewable
offtake contracts, replacing today's per-contract random fields — supporting corporate energy
procurement, treasury hedge accounting, and RE100/Scope-2 market-based reporting decisions.

### 8.2 Conceptual approach
A **forward-curve discounted cash-flow hedge-value model**, the standard commodity-hedge valuation
approach used by utility risk desks and consistent with IRENA's Corporate PPA Guide framing of a PPA
as a financial hedge against merchant price risk; basis risk follows the standard "capture price vs
hub price" decomposition used for virtual/CfD-style PPAs (mirrors how ISO/RTO congestion-hedge
desks and RE-Source Platform materials frame VPPA risk).

### 8.3 Mathematical specification
```
PPANetValue = Σ_t [ (PPAprice − MerchantForward_t) × Volume_t ] / (1+r)^t
VaR_PPA,α   = PPANetValue(median path) − quantile_α( PPANetValue | MonteCarlo merchant-price paths )
BasisRisk_t = CapturePrice_t − HubPrice_t     # generation-weighted realised price vs settlement hub
CreditExposure = max(0, PPANetValue) × PD(offtaker_rating) × LGD      # counterparty credit risk, IFRS 9-consistent
```

| Parameter | Calibration source |
|---|---|
| `MerchantForward_t` | Regional power forward curve (ICE/EEX/PJM published forwards, or vendor) |
| Volatility for Monte Carlo | Historical merchant-price return volatility by region |
| `PD(rating)` | Standard corporate PD-by-rating table (S&P/Moody's, or platform's existing credit-risk engine) |
| `CapturePrice_t` | Generation-profile-weighted average realised price (needs asset generation shape) |
| `r` | Contract discount rate / counterparty cost of capital |

### 8.4 Data requirements
Regional forward price curves (new — not currently on platform), generation shape by technology
(solar/wind capacity factor profiles), offtaker credit ratings (present as a static field, needs PD
mapping), contract cash-flow schedule. The platform's existing credit-risk / PD-mapping engines
(used elsewhere for corporate bond pricing) could be reused for the `PD(rating)` term.

### 8.5 Validation & benchmarking plan
Reconcile `PPANetValue` against independently-priced hedge value for a known reference contract;
backtest `BasisRisk` against realised capture-price data for wind/solar generation in a liquid
market (e.g. ERCOT, EU day-ahead); stress `VaR_PPA` under historical extreme merchant-price events
(2021-22 European power crisis) as a tail-risk sanity check.

### 8.6 Limitations & model risk
Forward curves beyond 5–7 years are illiquid/extrapolated; generation-shape assumptions for capture
price are asset-specific and uncertain pre-construction; counterparty PD tables are cross-sector
averages, not offtaker-specific. Conservative fallback: present VaR as a scenario range (P10/P50/P90
merchant-price paths) rather than a single point estimate, and flag contracts beyond the liquid
forward-curve horizon as "extrapolated valuation — lower confidence."

## Framework alignment

**IRENA Renewable PPA Guide (2023)** — the hedge-value framing (PPA price vs merchant price
differential) is the correct conceptual model; not implemented in code. **GHG Protocol Scope 2
Guidance (Market-Based Method)** — the guide correctly names the criteria (vintage, geographic
matching, EAC delivery) that determine additionality/quality; the code's `greenAdditionality` field
is a coin flip, not an assessment against these criteria. **RE100 Procurement Guidelines** — cited
correctly as context for corporate PPA tenor norms (12–15 years); not tied to any contract-level
computation.
