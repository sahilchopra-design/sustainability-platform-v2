# Municipal Green Bond Analytics
**Module ID:** `municipal-green-bond-analytics` · **Route:** `/municipal-green-bond-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DY1 · **Sprint:** DY

## 1 · Overview
Municipal green bond analytics covering use-of-proceeds allocation (transport 35%, energy 25%, water 20%), ICMA GBP compliance, impact reporting KPIs, yield spread versus vanilla munis, and credit enhancement structures.

> **Business value:** Provides comprehensive municipal green bond analytics integrating ICMA GBP compliance scoring, greenium measurement, and impact KPI tracking to support issuance and investor decisions.

**How an analyst works this module:**
- Classify use-of-proceeds across ICMA GBP eligible categories and quantify per-category allocation
- Calculate greenium by constructing issuer vanilla yield curve and spread to green bond yield
- Score ICMA GBP four-component compliance (proceeds, project evaluation, management, reporting)
- Model credit enhancement structures (bond insurance, reserve fund, intercept mechanism) and rating uplift

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_TYPES`, `GREENIUM_DATA`, `ISSUERS`, `Kpi`, `RATING_SPREADS`, `TABS`, `USE_OF_PROCEEDS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ISSUERS` | 9 | `name`, `type`, `rating`, `size`, `greenShare`, `spread`, `coupon`, `maturity`, `useOfProceeds`, `greenium`, `iceScore`, `population` |
| `BOND_TYPES` | 7 | `security`, `callProt`, `amtStatus`, `defaultRate`, `example` |
| `USE_OF_PROCEEDS` | 7 | `share`, `projects`, `co2AvoidedMt` |
| `RATING_SPREADS` | 8 | `spread10yr`, `spread20yr`, `spread30yr`, `defaultRate`, `taxEqvYield` |
| `GREENIUM_DATA` | 8 | `greeniumBps`, `issuanceGbn`, `pct` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annualSaving` | `faceValue * (greeniumBps / 10000);` |
| `dsr` | `calcDsr({ annualRevenue: faceValue * 0.15, annualDebtService: faceValue * coupon / 100 });` |
| `yieldCurveData` | `useMemo(() => [2, 5, 7, 10, 15, 20, 30].map((yr, i) => ({` |
| `spreadByRating` | `useMemo(() => RATING_SPREADS.map(r => ({ rating: r.rating, '10yr': r.spread10yr, '20yr': r.spread20yr })), []);` |
| `portfolioData` | `useMemo(() => [...ISSUERS].sort((a, b) => b.iceScore - a.iceScore).slice(0, portfolioSize).map((iss, i) => ({` |
| `impactData` | `USE_OF_PROCEEDS.map(u => ({ category: u.category, co2Mt: u.co2AvoidedMt, share: u.share }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_TYPES`, `GREENIUM_DATA`, `ISSUERS`, `RATING_SPREADS`, `TABS`, `USE_OF_PROCEEDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenium vs Vanilla Muni | `YTM(green) - YTM(vanilla) by matched maturity/rating issuer` | Bloomberg BVAL municipal pricing | Negative greenium (green trades tighter) observed for high-quality issuers; averages -3 to -8 bps in established markets |
| Use of Proceeds Alignment | `Eligible green expenditure / total proceeds × 100` | Municipal annual impact report | ICMA GBP requires all proceeds allocated to eligible categories; 92%+ typical; residual in liquidity management |
| Impact KPI Coverage | `KPIs reported / KPIs committed in framework × 100` | Post-issuance impact report | High KPI coverage strengthens investor confidence and secondary market liquidity; below 70% risks reputational downgrade |
- **Bloomberg BVAL municipal pricing** → Real-time and historical muni yields by issuer, maturity, rating → greenium calculation → **Green vs vanilla pricing differential**
- **Issuer annual impact reports** → Use-of-proceeds allocation and KPI achievement data → compliance scoring → **ICMA GBP compliance score**
- **Climate Bonds Initiative certified issuance data** → CBI-certified muni bonds with verified impact metrics → benchmark comparison → **Peer issuance and impact benchmarking**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Bond Impact & Pricing Analytics
**Headline formula:** `Greenium = Yield(Vanilla Muni) - Yield(Green Muni) in bps; Impact KPI Score = Σ(Category Weight × KPI Achievement Rate)`

Measures green bond quality through ICMA GBP four-component compliance and greenium analysis relative to issuer vanilla curve

**Standards:** ['ICMA Green Bond Principles 2021', 'MSRB Rule G-17 and Muni Disclosure Standards', 'Climate Bonds Initiative Municipal Bonds Guidance']
**Reference documents:** ICMA (2021) Green Bond Principles — Updated June 2021; Climate Bonds Initiative (2023) Municipal Bonds Briefing and Market Intelligence; MSRB (2023) Muni Green Bond Market Report; Moody's (2023) Municipal Green Bond Ratings Methodology

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module matches its MODULE_GUIDES entry and is the **more genuinely-quantitative** of the two
municipal-green-bond pages. Over 8 hand-authored real US/EU city issuers it runs **correct muni-finance
math**: tax-equivalent yield, after-tax yield, greenium dollar value, and a debt-service ratio. The
rating-spread and greenium-trend tables carry realistic values; the greenium is treated with the correct
positive-tighter convention.

### 7.1 What the module computes

Four closed-form finance functions:

```js
calcAfterTaxYield      = isAmt ? coupon : coupon·(1 − taxRate/100)
calcTaxEquivalentYield = taxRate>0 ? muniYield/(1 − taxRate/100) : muniYield
calcGreeniumValue      = faceValue·(greeniumBps/10000)·maturity     // undiscounted $ saving
calcDsr                = annualDebtService>0 ? annualRevenue/annualDebtService : 0
```

`calcTaxEquivalentYield` is the standard muni TEY formula (`muni / (1 − marginal tax rate)`) —
economically correct. `calcAfterTaxYield` correctly returns the full coupon when the bond is **AMT-exempt**
(`isAmt`) versus taxing it otherwise. The DSR proxy uses `annualRevenue = faceValue·0.15` and
`annualDebtService = faceValue·coupon/100`.

### 7.2 Parameterisation / scoring rubric

| Dataset | Content | Provenance |
|---|---|---|
| `ISSUERS` (8) | NYC/LA/Chicago/Boston/Seattle/Denver/London/Paris — real ratings, sizes, coupons, greenShare, iceScore, population | Hand-authored, realistic (Chicago BBB+ spread 95bps; Paris AA+ greenium 18bps) |
| `RATING_SPREADS` (7) | AAA→BBB+ spreads at 10/20/30yr + default rate + tax-equiv yield | Hand-authored, realistic muni curve (AAA 15bps → BBB+ 110bps at 10yr) |
| `GREENIUM_DATA` (7) | 2019→2025 greenium 4→16 bps, issuance $Gbn, % labelled | Hand-authored trend |
| `BOND_TYPES` (6) | GO/Revenue/Green/BAB/QECB/Resilience with default rates | Real instrument taxonomy |
| `USE_OF_PROCEEDS` (6) | Transport 28% … Green Buildings 7%, CO₂ avoided Mt | Realistic allocation |
| `yieldCurveData` | muni/TEY/UST by tenor | `sr()`-jittered around coupon |

The **iceScore** (0–100 impact/credit-ESG composite, e.g. Paris 91, Chicago 55) is a hand-set headline
with no documented sub-factor derivation.

### 7.3 Calculation walkthrough

User selects an issuer and sets coupon / tax rate / face value / greenium bps / maturity / AMT flag →
`afterTax`, `teq`, `greeniumVal`, `dsr` recompute live. `yieldCurveData` builds a muni-vs-TEY-vs-Treasury
curve; `spreadByRating` and `portfolioData` (top-N by iceScore) drive the charts. `RATING_SPREADS` and
`GREENIUM_DATA` are static reference series.

### 7.4 Worked example (Paris, 37 % tax bracket, $100 face, 18 bps greenium, 10yr)

| Metric | Computation | Result |
|---|---|---|
| Tax-equivalent yield | `2.95 / (1 − 0.37)` | **4.68 %** |
| After-tax yield (exempt) | full coupon (muni tax-exempt) | **2.95 %** |
| Greenium $ value | `100 · (18/10000) · 10` | **$1.80** per $100 over life |
| DSR | `(100·0.15) / (100·2.95/100)` = `15 / 2.95` | **5.08×** |

The TEY of 4.68 % correctly shows why a 2.95 % tax-exempt muni competes with a ~4.7 % taxable bond for a
37 %-bracket investor — the central muni-finance insight. The greenium value ($1.80 per $100) is the
undiscounted lifetime coupon saving from the 18 bps tighter pricing.

### 7.5 Data provenance & limitations

- **Issuer, rating-spread and greenium datasets are hand-authored realistic values**, not live feeds. Only
  `yieldCurveData` is `sr()`-seeded (jitter around the user's coupon).
- `calcGreeniumValue` is **undiscounted** — it sums nominal annual savings rather than PV-ing them; a
  production tool would discount at the muni yield.
- The DSR uses a flat 15 % revenue-to-face assumption, not issuer-specific pledged revenue; it is
  illustrative, not a covenant-grade coverage test.
- `iceScore` is an opaque composite with no published sub-weights.

**Framework alignment:** **ICMA Green Bond Principles 2021** (four-component use-of-proceeds framing) ·
**MSRB muni-disclosure** context · tax-equivalent-yield and AMT treatment follow standard **US municipal
bond tax law**. The greenium sign convention (positive = green tighter) is correct here, unlike the sibling
`municipal-green-bond` module. The framework-quality *scoring* and issuer-curve greenium *estimation*
promised in the guide remain heuristic (stored greenium/iceScore), warranting §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Greenium and iceScore are hand-set; TEY/DSR are
correct but illustrative. Below is the production greenium + credit + impact model.

### 8.1 Purpose & scope
Estimate each issuer's green-bond greenium against its own conventional curve, compute a covenant-grade
debt-service coverage, and produce an auditable green-impact/credit-ESG score, for muni portfolio
relative-value and issuance advisory.

### 8.2 Conceptual approach
Greenium from **same-issuer curve differencing** (Barclays/BNEF muni greenium research); credit via a
**muni default/recovery model** (Moody's US Public Finance default study rates by rating); impact via an
**ICMA GBP + CBI-aligned rubric**. Benchmarks: Bloomberg BVAL muni pricing, Moody's muni default study,
S&P Green Evaluation.

### 8.3 Mathematical specification
Greenium `g = y_conv(τ,rating,issuer) − y_green`. PV greenium value `V = Σ_t (g·F/10000)/(1+y)^t`.
Coverage `DSCR = NetPledgedRevenue / (Principal_t + Interest_t)` from the issuer's actual pledged stream
(GO: general fund; Revenue: project revenue). Credit `EL = PD_rating·(1−Recovery)`, PD from Moody's muni
cumulative default table by rating and horizon. Composite iceScore `= w₁·GBP_alignment + w₂·(1−EL_norm) +
w₃·CO₂_intensity_percentile`.

| Parameter | Source |
|---|---|
| Conventional curve | Bloomberg BVAL / MMD AAA scale + rating spread |
| Muni PD by rating | Moody's US Public Finance default study |
| Recovery | Moody's muni recovery (typically high, 60–90 %) |
| GBP alignment | SPO + impact report rubric |

### 8.4 Data requirements
Same-issuer green + conventional yields, pledged-revenue statements, Moody's muni default table, SPO and
impact reports. Platform has hand-authored issuer data as a starting spine.

### 8.5 Validation & benchmarking plan
Reconcile greeniums to BNEF muni greenium series; DSCR against official statement coverage covenants;
credit EL against Moody's realised muni default rates.

### 8.6 Limitations & model risk
Thin same-issuer conventional curves; muni defaults are rare (sparse PD calibration); pledged-revenue
forecasting is issuer-specific. Conservative fallback: cohort-level greenium where same-issuer data is
absent, and stress DSCR under revenue haircuts.

## 9 · Future Evolution

### 9.1 Evolution A — Curve-based greenium and DSR from real financials (analytics ladder: rung 1 → 3)

**What.** §7 rates this the more genuinely quantitative of the two municipal-green-bond pages: the four closed-form functions (`calcTaxEquivalentYield`, `calcAfterTaxYield` with correct AMT handling, `calcGreeniumValue`, `calcDsr`) are economically correct muni math. But the greenium itself is a stored per-issuer number over 8 hand-authored issuers, `calcGreeniumValue` is undiscounted, and the DSR uses a fixed `annualRevenue = faceValue·0.15` proxy. Evolution A computes greenium against a constructed vanilla curve — the workflow §1 already describes but the code skips.

**How.** (1) Build the issuer vanilla curve from the hand-authored `RATING_SPREADS` table (a realistic AAA→BBB+ muni curve already in the page) plus a benchmark AAA curve, then `greenium = interpolated vanilla yield at the green bond's maturity − green yield` — turning two static tables into an actual spread model. (2) Discount `calcGreeniumValue` (PV of the bps saving over remaining life at the issuer's own curve) instead of the current `face × bps × years`. (3) Replace the DSR revenue proxy with issuer-entered or ACFR-sourced pledged revenue, falling back to the labelled proxy with a `proxy: true` flag — honest-nulls convention. Backend optional; this can stay tier-B if the curve math is unit-tested in the page.

**Prerequisites.** Agreement with the sibling `municipal-green-bond` module on shared greenium conventions (that page's synthetic book uses the opposite sign); interpolation method pinned on a hand-computed case. **Acceptance:** moving a bond's maturity or rating changes its computed greenium via the curve; discounted greenium value < undiscounted for any positive rate.

### 9.2 Evolution B — Muni-desk copilot for TEY and issuance what-ifs (LLM tier 1 → 2)

**What.** A copilot that answers the questions muni analysts actually ask this page: "what's the tax-equivalent yield of Chicago's green GO for a 37% bracket investor?", "how much does Paris's 18bps greenium save over the bond's life?", "which credit enhancement lifts a BBB+ issuer most?" — computed through the page's own four functions and the `RATING_SPREADS`/`BOND_TYPES` tables, never by the LLM doing yield arithmetic in its head.

**How.** Tier 1 ships now: the four formulas are deterministic and client-side, so expose them as a small calculation tool set (either a thin `POST /api/v1/muni-gb/calc` endpoint or sandboxed page-side function calls) and assemble the system prompt from this Atlas page's §7.1 formula block so explanations state the TEY formula exactly. Tier 2 adds scenario chains: "compare after-tax economics of the AMT vs non-AMT structure across tax brackets" becomes a sweep of `calcAfterTaxYield` calls rendered as a table. Fabrication validator matches every yield/bps figure to a function result.

**Prerequisites.** None hard — the math is real today; Evolution A improves the greenium answers but tier-1 TEY/DSR explanation is safe immediately, provided the copilot discloses that greenium and issuer data are hand-authored reference values, not live market quotes. **Acceptance:** every numeric traceable to a calc invocation; asking for live secondary-market pricing yields a refusal naming the data limitation.