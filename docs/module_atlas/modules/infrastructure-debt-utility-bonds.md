# Infrastructure Debt & Utility Bond Analytics
**Module ID:** `infrastructure-debt-utility-bonds` · **Route:** `/infrastructure-debt-utility-bonds` · **Tier:** B (frontend-computed) · **EP code:** EP-EL6 · **Sprint:** EL

## 1 · Overview
Utility bond universe of 24 instruments (green bonds, SLBs, transition bonds, first mortgage bonds, securitisations) across T&D/water/gas/electric/renewables sectors, OAS spread credit curve by rating (AA/A/BBB/BB), 16-quarter spread history with greenium tracking, ESG label framework comparison (ICMA GBP/SBP/CBI/Transition), covenant analysis (FFO/Debt, gearing, DSCR thresholds), and duration matching tool for ALM/pension/insurance liability management.

> **Business value:** Used by fixed income credit analysts assessing relative value in utility bonds, pension and insurance ALM teams constructing infrastructure debt allocations, and DCM advisors structuring green bond and SLB programmes for regulated utility issuers.

**How an analyst works this module:**
- Browse 24-bond universe with multi-axis filters (bond type, sector) to find instruments matching your investment mandate
- Click any bond to load its full detail card (coupon, duration, FFO/Debt, gearing, use of proceeds, certification status)
- Review Credit Spread Curve tab for AA/A/BBB/BB utility spread curves across 2–30yr tenors to assess relative value by rating
- Use Duration Matching tab to input your target duration and find all bonds within ±2.5yr for ALM/liability-matching purposes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `COVENANT_DATA`, `CREDIT_CURVE`, `ISSUANCE_TREND`, `KpiCard`, `Pill`, `RADAR_INFRA_DEBT`, `SPREAD_HISTORY`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BONDS` | 25 | `issuer`, `sector`, `type`, `size`, `currency`, `coupon`, `tenor`, `maturity`, `rating`, `spread`, `duration`, `ffo_debt`, `gearing`, `use`, `certified`, `ytm`, `dscr` |
| `CREDIT_CURVE` | 8 | `aa`, `a`, `bbb`, `bb` |
| `COVENANT_DATA` | 9 | `threshold`, `category`, `description` |
| `RADAR_INFRA_DEBT` | 7 | `value` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `bondTypes` | `['All', ...new Set(BONDS.map(b => b.type))];` |
| `sectors` | `['All', ...new Set(BONDS.map(b => b.sector))];` |
| `ratingMatch` | `ratingFilter === 'All' \|\| (ratingFilter === 'AA' ? b.rating.includes('Aa') : ratingFilter === 'A' ? b.rating.startsWith('A3') \|\| b.rating.includes('A-') : true);` |
| `totalIssuance` | `useMemo(() => (BONDS.reduce((s,b)=>s+b.size,0)/1000).toFixed(1),[]);` |
| `greenPct` | `useMemo(() => Math.round(BONDS.filter(b=>b.certified!=='None').length/BONDS.length*100),[]);` |
| `avgSpread` | `useMemo(() => Math.round(BONDS.reduce((s,b)=>s+b.spread,0)/BONDS.length),[]);` |
| `avgDuration` | `useMemo(() => (BONDS.reduce((s,b)=>s+b.duration,0)/BONDS.length).toFixed(1),[]);` |
| `tabs` | `['Bond Universe', 'Credit Spread Curve', 'Spread History', 'Green / SLB Analytics', 'Covenant Analysis', 'Duration Matching', 'Infra Debt Radar'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BONDS`, `COVENANT_DATA`, `CREDIT_CURVE`, `RADAR_INFRA_DEBT`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global green/SLB utility issuance (2023) | `ESG-labelled bonds from utility/infrastructure issuers` | Climate Bonds Initiative H2 2023 Report | Up 28% YoY; green bonds still largest at 68% of total; SLBs growing fastest at +45%; transition bonds nascent at <5%; CBI most recognised third-party standard. |
| Greenium persistence (utilities) | `Average spread saving vs same-issuer vanilla bonds` | BIS Working Paper on Greenium 2022 | Greenium widened in 2022 risk-off (compressed to ~4bps); rebounded 2023-24 as institutional ESG demand returns; largest greenium for AAA/AA issuers where scarcity premium applies. |
| Infrastructure debt illiquidity premium | `Over equivalent public IG bonds (Baa1–A3)` | Preqin Infrastructure Debt Report 2023 | Direct infra debt fund average net return 6.8% vs public BBB utility 5.2%; premium compensates for illiquidity, complexity, and bilateral nature; Solvency II favourable capital treatment for long-dated IG infra debt. |
- **ICMA GBP/SBP/SLBP + CBI sector criteria + BIS greenium research + Moody's utility rating methodology + S&P utility scorecard + Solvency II infra debt capital treatment + ECB green bond purchase programme** → 24-bond universe + credit spread curves + spread history + greenium analytics + covenant analysis + duration matching + infra debt radar → **Fixed income credit analysts covering utility bonds, pension/insurance ALM teams building infrastructure debt allocations, ESG-labelled bond investors, and debt capital markets advisors structuring utility green/SLB issuances**

## 5 · Intermediate Transformation Logic
**Methodology:** Infrastructure Debt Valuation & Covenant Metrics
**Headline formula:** `YTM = Σ(Coupon_t + Face_t) / (1+y)^t; OAS = YTM − Risk_Free_Rate_duration_matched; Modified_Duration = Σ(t × PV_CF_t) / (Bond_Price × (1+y)); FFO_Debt = (CFO + Interest) / Net_Debt; Greenium = Spread_Vanilla − Spread_Green (same issuer, similar tenor); DSCR = EBITDA / (Interest + Scheduled_Principal)`

Enel SLB (€1.5Bn, 2032): coupon step-up 25bps if RE installed capacity KPI missed; at issuance spread 65bps vs vanilla Enel at 73bps — 8bps greenium; demonstrates SLB pricing incentive even for general-purpose proceeds.

**Standards:** ['ICMA Green Bond Principles 2021', 'Climate Bonds Initiative Utilities Sector Criteria', "Moody's Regulated Utilities Rating Methodology 2022"]
**Reference documents:** ICMA (2021) – Green Bond Principles, Social Bond Principles, Sustainability-Linked Bond Principles; Climate Bonds Initiative (2023) – Utilities Sector Criteria and Green Bond Market Summary; BIS (2022) – The Greenium and Market Pricing of Green Bonds

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Live bond pricing from cash-flow schedules and FRED curves (analytics ladder: rung 1 → 3)

**What.** The §7 flag is clear-eyed: the 24-bond universe is well-curated static reference data (real named issuers — National Grid, Enel, Ørsted — with plausible terms and covenant thresholds keyed to real Moody's/Ofwat standards), but *nothing is priced*: `ytm`, `spread`, `duration`, `ffo_debt`, `dscr` are stored constants; the guide's YTM/OAS/ModDur formulas are unimplemented; the greenium series is `sr()`-seeded (8 + sr·6 bps) rather than measured; and the KPI cards are memoised on `[]` so they ignore active filters — a documented UX bug. Evolution A implements the §8 pricing engine: Newton-Raphson YTM from each bond's cash-flow schedule, Macaulay/modified duration and convexity, OAS against a duration-matched risk-free curve — and the platform already serves FRED curve data through `/api/v1/fred-spreads/*` (built for the infra-debt-portfolio-manager), so the benchmark feed exists.

**How.** (1) Extend each `BONDS` row with its cash-flow schedule (coupon dates, day-count, call terms where public); a backend route `POST /utility-bonds/price` computes YTM/duration/convexity/OAS, reconciling computed values against the stored constants as the §8.5 validation (differences flagged, not overwritten silently). (2) Greenium re-computed via the BIS matched-pair regression across labeled/vanilla pairs in the universe, replacing the seeded series — with the honest caveat that 24 bonds give a fragile β̂, reported with its confidence interval per §8.6. (3) Fix the filter-ignoring KPI memoisation (one-line dependency fix, log it in the calc-defect backlog). (4) Covenant tab compares computed ratios once issuer financials are wired (EDGAR/Companies House per §8.4), stored constants until then, labeled.

**Prerequisites.** Cash-flow schedule data entry for 24 bonds; FRED curve join; the KPI bug fixed first. **Acceptance:** computed YTM within tolerance of the stored value for non-callable bonds (divergences explained); greenium reported as a CI, not a point; KPI cards react to filters.

### 9.2 Evolution B — Relative-value and ALM copilot over the priced universe (LLM tier 2)

**What.** A tool-calling analyst for the module's three stated users: credit analysts ("which BBB water bonds trade wide of the curve?"), ALM teams ("build me a 9-year-duration bucket within ±0.5y from certified green bonds only" — upgrading the current ±2.5y filter to an optimising selection), and DCM advisors ("what coupon step-up is market for an SLB with an RE-capacity KPI?" — grounded in the curated Enel SLB example: 25bps step-up, 8bps greenium at issuance).

**How.** Tier 2: tool schemas over the Evolution A pricing route plus the existing FRED spread endpoints; relative-value answers compute spread-to-curve from tool output and cite the `CREDIT_CURVE` tenor point used. Duration-matching runs as a small selection loop with the candidate set and tolerances shown. Framework questions (GBP use-of-proceeds vs SLB KPI-linked structure) ground in the curated ICMA/CBI taxonomy from §7.6's alignment text. Discipline: covenant-headroom answers must state whether ratios are computed or stored constants; greenium claims quote the regression CI; the copilot refuses price talk on bonds without cash-flow schedules rather than quoting the static `ytm` as if computed.

**Prerequisites.** Evolution A's pricing route (the page is currently a filter dashboard with nothing to call); Phase 2 infrastructure. **Acceptance:** every bps/year figure traces to a tool call or a named stored field with its provenance stated; ALM selections reproducible from the logged candidate set.