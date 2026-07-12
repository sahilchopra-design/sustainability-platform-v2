## 7 · Methodology Deep Dive

### 7.1 What the module computes

A blue-bond market explorer. Almost all figures are read from static seed tables; the
only live arithmetic is a trivial coupon-saving identity and market aggregates:

```js
annSaving      = faceValue × (greeniumBps / 10000)          // $ saved per year from the greenium
totalIssuance  = Σ ISSUERS.sizeGbn
avgGreenium    = Σ ISSUERS.greeniumBps / n
totalCo2Impact = Σ USE_OF_PROCEEDS.co2Mt
scatterData    = ISSUERS → {x: size, y: greeniumBps, rating}
```

The greenium (`greeniumBps`) is a **stored per-issuer field**, not estimated from a
yield-curve comparison — the page displays it and multiplies by face value.

### 7.2 Parameterisation

`ISSUERS` (9 rows) — name, type, rating, size $Bn, greenium bps, coupon, maturity,
ocean focus, ISWG alignment, CBI certification, country. `USE_OF_PROCEEDS` (7 rows)
carry share %, average IRR and CO₂ impact (Mt) per category (fisheries, shipping,
coastal resilience, ocean energy, waste, etc.). `MARKET_GROWTH` (9 rows) tracks
issuance $Bn, deal count and average greenium bps over time. `FRAMEWORKS` (6 rows:
ICMA Blue Bond Principles, World Bank, ADB, UNEP FI, CBI, etc. — pillars, mandatory
flag, greenium bps) and `OCEAN_RISKS` (7 rows: severity, trend, linked assets) are
descriptive. Guide anchors: global issuance ~$5.8Bn, alignment score 81/100, blue
greenium −4.8 bps.

### 7.3 Calculation walkthrough

1. Aggregate issuance, mean greenium and total CO₂ impact across the seed tables.
2. Scatter size vs greenium (with rating) to show the pricing-premium pattern.
3. Portfolio tab sums holding amounts; `annSaving` shows the coupon benefit of the
   greenium on a chosen face value.

### 7.4 Worked example

A $500M blue bond with a stored greenium of `−5 bps` (issuer pays 5 bps *less* than a
vanilla comparable):

| Step | Computation | Result |
|---|---|---|
| Annual saving | 500,000,000 × (5/10000) | **$250,000/yr** |
| Over 10-yr tenor | 250,000 × 10 | $2.5M |

So a 5 bp greenium on a half-billion-dollar issue is worth ~$250k/yr of reduced
funding cost — the economic rationale for pursuing the "blue" label despite second-
party-opinion and reporting costs.

### 7.5 Data provenance & limitations

- The greenium is **seed data**, not measured — there is no matched vanilla curve,
  no regression controlling for rating/tenor/liquidity, so the −4.8 bps headline is
  illustrative.
- Alignment score (81/100) is a stated benchmark, not computed from use-of-proceeds
  scoring on this page.
- CO₂ impact figures are stored per category, not derived from proceeds allocation.

**Framework alignment:** ICMA Blue Bond Principles 2023 (use-of-proceeds, management,
reporting — the `FRAMEWORKS`/`USE_OF_PROCEEDS` tables) · World Bank / ADB blue-bond
structures · UNEP FI Sustainable Blue Economy Finance Principles · Climate Bonds
Initiative marine criteria (CBI certification flag). The greenium concept is standard
(yield of green/blue minus matched conventional), but here it is asserted rather than
estimated.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate the *actual* blue/greenium for a bond by controlling
for rating, tenor, currency and liquidity, and score use-of-proceeds alignment — for
issuers pricing new deals and investors screening the label.

**8.2 Conceptual approach.** A **matched-pair / curve-based greenium estimator** (the
CBI and Climate Bonds greenium methodology) plus a fixed-effects regression to isolate
the label premium — benchmarked against **CBI Green Bond Pricing reports** and
**Bloomberg BVAL** secondary spreads.

**8.3 Mathematical specification.**
```
Greenium_bps = YTM_blue − YTM_synthetic_vanilla
  YTM_synthetic_vanilla from same-issuer curve interpolated to blue-bond tenor
Panel regression: spread_i = α + β·Blue_i + γ·Rating_i + δ·Tenor_i + ζ·Liquidity_i + ε_i
  β̂ = estimated greenium (bps), with confidence interval
Alignment = Σ_k w_k · category_compliance_k   (ICMA BBP categories, SPO-scored)
AnnSaving = face · |Greenium| / 10000 ;  NPV_saving = Σ_t AnnSaving/(1+r)^t
```

| Parameter | Source |
|---|---|
| Yield/spread data | Bloomberg BVAL / ICE, secondary market |
| Issuer curve | Same-issuer vanilla bonds (interpolated) |
| Control factors | Rating (agencies), tenor, bid-ask liquidity |
| Alignment weights | ICMA Blue Bond Principles + SPO |

**8.4 Data requirements.** Bond-level yields/spreads, issuer curve constituents,
rating/tenor/liquidity, use-of-proceeds allocation, SPO. None currently ingested;
platform holds only the seed tables.

**8.5 Validation & benchmarking.** Reconcile estimated greenium against CBI Green
Bond Pricing report ranges; test regression stability across sub-samples
(sovereign vs corporate); check sign/magnitude vs the −1 to −10 bps literature.

**8.6 Limitations & model risk.** Thin blue-bond universe → few matched pairs and wide
CIs; liquidity is hard to control; greenium is time-varying and demand-driven.
Conservative fallback: report the greenium as a range with its CI and flag when the
sample is too small for a significant estimate.
