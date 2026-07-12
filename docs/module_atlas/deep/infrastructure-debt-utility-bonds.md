## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises a live **valuation engine** —
> `YTM = Σ(Coupon+Face)/(1+y)^t`, `OAS = YTM − duration-matched risk-free`, `Modified Duration = Σ(t·PV_CF)/(Price·(1+y))`,
> `FFO/Debt`, `Greenium`, `DSCR`. **None of these are computed in code.** Every bond field —
> `ytm`, `spread`, `duration`, `ffo_debt`, `dscr`, `gearing` — is a **stored constant** in the 24-row
> `BONDS` array (a curated, plausibly-realistic reference universe of named issuers). The page is a
> **filter-and-visualise dashboard** over pre-computed values, not a cash-flow pricer. Only the KPI
> aggregations and a handful of trend series are actually calculated. Sections below document what the
> code computes.

### 7.1 What the module computes

The only live computations are portfolio-level KPI reductions over the 24-bond universe:

```js
totalIssuance = (Σ b.size) / 1000            // $Bn (sizes stored in $M-equivalent)
greenPct      = round(count(certified ≠ 'None') / 24 × 100)
avgSpread     = round(Σ b.spread / 24)        // bps
avgDuration   = (Σ b.duration / 24).toFixed(1)   // years
```

Filtering is multi-axis over `type`, `sector`, and a `rating` bucket. The rating filter maps the
composite Moody's/S&P string to a coarse bucket:

```js
ratingMatch = ratingFilter==='AA'  ? b.rating.includes('Aa')
            : ratingFilter==='A'   ? b.rating.startsWith('A3') || b.rating.includes('A-')
            : true                                   // 'BBB'/'All' pass through
```

### 7.2 Parameterisation — the reference universe

| Field | Type | Provenance |
|---|---|---|
| `issuer`, `sector`, `type`, `size`, `coupon`, `tenor`, `maturity` | curated constants | Realistic named issuers (National Grid, Enel, Ørsted, Terna…) — plausible but demo-static |
| `rating` (`Baa1/BBB+` …) | curated constant | Composite Moody's/S&P — stored, not derived |
| `spread`, `ytm`, `duration` | curated constant | Stored bps/%, not priced from cash flows |
| `ffo_debt`, `gearing`, `dscr` | curated constant | Stored credit ratios, not computed from financials |
| `certified` (CBI / ICMA / SLB / None) | curated constant | ESG-label taxonomy |
| `CREDIT_CURVE` (AA/A/BBB/BB × 2–30y) | curated constant | Plausible OAS term structure, hand-set |
| `COVENANT_DATA` thresholds | curated constant | Named to real standards (Moody's ≥13% FFO/Debt, Ofwat ≤70% gearing, DSCR ≥1.50×) |
| `ISSUANCE_TREND`, `SPREAD_HISTORY`, `greenium` | `sr()`-seeded | Synthetic time series (PRNG `sr(s)=frac(sin(s+1)×10⁴)`) |
| `RADAR_INFRA_DEBT` | curated constant | 6-axis quality radar, hand-set 65–88 |

### 7.3 Calculation walkthrough

1. `BONDS` is the static universe; user filters by type/sector/rating.
2. KPI cards reduce the **full** (unfiltered) universe: total issuance, green %, avg spread, avg
   duration — these are `useMemo(…, [])` so they do not react to filters.
3. Credit-spread-curve tab plots the stored `CREDIT_CURVE` by rating across tenors.
4. Spread-history tab plots `SPREAD_HISTORY` (BBB/A utility spreads + greenium), sampled every 3rd
   quarter of a synthetic 48-month series.
5. Duration-matching tab filters bonds within `durationTarget ± 2.5y` for ALM.
6. Detail card renders the selected bond's stored fields verbatim.

### 7.4 Worked example

KPI aggregation over the 24 bonds (values from the stored array):

| KPI | Computation | Result |
|---|---|---|
| Total issuance | Σ size = 1000+750+800+…+1100 = 20,050 $M | **$20.1 Bn** |
| Green/labelled % | 20 of 24 have `certified ≠ 'None'` → 20/24 | **83 %** |
| Avg spread | (88+195+72+…+71)/24 ≈ 2,169/24 | **≈90 bps** |
| Avg duration | (9.8+6.4+8.6+…+8.5)/24 ≈ 218/24 | **≈9.1 y** |

The greenium concept is illustrated (not measured): `SPREAD_HISTORY.greenium = 8 + sr(i·9)×6`, i.e.
a synthetic 8–14 bps series — consistent with the guide's cited 8–12 bps utility greenium but not
derived from any same-issuer vanilla-vs-green pair in the data.

### 7.5 Companion analytics on the page

- **Covenant analysis** — 8 covenant thresholds keyed to real standards; the page compares a
  selected bond's stored `ffo_debt`/`gearing`/`dscr` against the thresholds (display comparison,
  no recomputation).
- **Green/SLB analytics** — counts by `type`/`certified`; `ISSUANCE_TREND` green/SLB/transition
  split (synthetic, green ramps `42+18i`, SLB appears after year 2, transition after year 4).
- **Infra-debt radar** — static 6-axis quality profile.

### 7.6 Data provenance & limitations

- **Core bond universe is curated static data** (realistic named issuers), not `sr()`-seeded and not
  live-priced. Trend/history/greenium series **are** `sr()`-seeded synthetic data.
- No cash-flow valuation: `ytm`, `spread`, `duration`, `dscr`, `ffo_debt` are inputs, not outputs —
  the guide's YTM/OAS/duration formulas are **not implemented**.
- KPI cards ignore active filters (memoised on `[]`), so headline numbers describe the whole
  universe regardless of the filter state — a UX/consistency gap.
- Greenium is illustrated with a synthetic series, not computed from matched issuer pairs.

**Framework alignment:** *ICMA Green/Social/SLB Principles* — the `certified`/`type` taxonomy
mirrors ICMA labels (GBP use-of-proceeds vs SLB KPI-linked coupon step-up). *Climate Bonds Initiative
Utilities Criteria* — `CBI` certification flag references CBI's sector-specific eligibility screening.
*Moody's Regulated Utilities methodology* — covenant thresholds (FFO/Debt ≥13% for Baa1) echo Moody's
scorecard factors, though no scorecard is run. *Solvency II* — relevant to the ALM/duration-matching
use case but capital treatment is not modelled.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Turn the static bond dashboard into a live **fixed-income analytics engine** that prices each
utility/infra bond from its cash-flow schedule, derives OAS/duration/convexity, computes a
same-issuer greenium, and runs a covenant/rating scorecard — for credit analysts and ALM teams.

### 8.2 Conceptual approach
Standard discounted-cash-flow bond maths (Fabozzi) plus a duration-matched benchmark curve for OAS,
benchmarked against Bloomberg/ICE analytics and, for the greenium, the BIS matched-pair regression
approach. Covenant/rating logic mirrors Moody's Regulated Utilities and S&P utility scorecards.

### 8.3 Mathematical specification
For a bond with annual coupon `c`, face `F`, price `P`, cash flows `CF_t` at times `t`:

```
Price      P = Σ_t CF_t /(1+y)^t                       // solve y (YTM) by Newton–Raphson
MacDur     D = Σ_t t·CF_t/(1+y)^t / P
ModDur     D* = D/(1+y);   Convexity = Σ_t t(t+1)CF_t/(1+y)^{t+2} / P
OAS        = y − r(D)      // r(D) = duration-matched risk-free (govt) yield, w/ option adj. for calls
FFO/Debt   = (CFO + Interest) / NetDebt
DSCR       = EBITDA / (Interest + ScheduledPrincipal)
Greenium   = β̂ from  spread_i = α + β·GreenFlag_i + γ·Rating_i + δ·Duration_i + ε   // matched panel
```

| Parameter | Source |
|---|---|
| Risk-free curve `r(·)` | UST/Bund/Gilt par curves (Treasury, ECB, BoE) |
| Cash-flow schedule | Bond indenture (coupon, dates, amortisation, call schedule) |
| Issuer financials (CFO, EBITDA, NetDebt) | Company filings / Bloomberg |
| Rating scorecard weights | Moody's Regulated Utilities 2022; S&P utility criteria |
| Greenium panel controls | ICMA/CBI label flags; BIS 2022 greenium methodology |

### 8.4 Data requirements
Per bond: full cash-flow schedule, embedded-option terms, day-count; live benchmark curves; issuer
FFO/EBITDA/NetDebt; ESG label + framework. Platform already stores the label taxonomy and covenant
thresholds; benchmark curves and issuer financials would be new feeds (Bloomberg, ICE, or free FRED
curves + EDGAR/Companies House financials).

### 8.5 Validation & benchmarking plan
Reconcile computed YTM/duration/OAS to Bloomberg YAS or ICE analytics for a sample; backtest greenium
`β̂` against BIS/academic estimates (5–15 bps IG utilities); sensitivity of OAS to curve choice and
call-option assumptions; covenant-breach recall against historical utility downgrades.

### 8.6 Limitations & model risk
OAS depends on the option model for callable bonds (lattice vs Monte-Carlo); greenium `β̂` is fragile
with few matched pairs and confounded by issuance timing/liquidity; illiquidity premium for private
infra debt is not observable from public spreads. Conservative fallback: report OAS with a stated
benchmark curve and greenium as a range with confidence interval, not a point estimate.
