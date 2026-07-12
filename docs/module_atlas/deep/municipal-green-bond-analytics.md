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
