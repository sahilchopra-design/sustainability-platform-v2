## 7 · Methodology Deep Dive

The guide frames a **greenium** tool (`Greenium = YTM_conventional − YTM_green`). The code presents a
curated 31-issuer GSS-bond dataset with yield/spread/greenPct/climateScore fields and derives greenium,
credit-risk and yield-curve panels from those stored fields — it does not interpolate a real conventional
yield curve to compute matched-maturity greenium at runtime; the greenium is embedded in the seed data.

### 7.1 What the module computes

The page is dataset-driven (`ISSUERS`, 31 rows). Derived views:
```js
YIELD_CURVE   : map of ['2Y'..'30Y'] tenors → representative yields
GREENIUM_DATA : ISSUERS filtered to AA/AAA, first 14 → greenium display
CREDIT_RISK_DATA : first 20 issuers → spread/rating/outlook
kpis          : n = max(1, filtered.length); portfolio averages (yield, greenPct, climateScore, spread)
total         : Σ outstanding (issuance volume)
pfStats       : portfolio-holdings roll-up (weighted metrics)
```
Greenium per issuer is the stored `spread`/yield differential vs its conventional comparator; the guide's
negative-greenium convention (green yields less) is reflected in the seeded `spread`/`greenPct` fields.

### 7.2 Parameterisation / scoring rubric

| Seed schema | Key fields | Provenance |
|---|---|---|
| `ISSUERS` (31) | rating, yield, spread, greenPct, sdg, verifier, framework, climateScore, debtGdp | curated demo (sovereign GSS market) |
| `BOND_TYPES` (8) | color, description | Green/Social/Sustainability/SLB taxonomy |
| `SDG_ALLOCATION` (8) | pct, count, amount | use-of-proceeds SDG mapping |
| `REGULATORY_STANDARDS` (7) | body, status, scope | ICMA GBP / EU GBS / CBI reference |

Interpretation anchors from guide: sovereign issuance ~$150B (2023, OECD); average greenium −1 to −5 bp
(BIS 2021 / OECD 2023).

### 7.3 Calculation walkthrough

Region/type filters subset `ISSUERS` → `kpis` compute averages with an `n = max(1, length)` divide-guard →
`total` sums outstanding → `GREENIUM_DATA` restricts to AA/AAA for cleaner greenium comparison →
`CREDIT_RISK_DATA` shows spread/outlook for the top 20 → CSV export quotes all fields. Portfolio tab
(`pfStats`) weights holdings.

### 7.4 Worked example

A sovereign green bond with `yield = 3.10%` and a matched conventional comparator at `3.14%`:
```
Greenium = YTM_conventional − YTM_green = 3.14 − 3.10 = +0.04% = 4 bp
```
By the guide's sign convention this is a **−4 bp greenium** (green bond yields 4 bp *less*), inside the BIS/
OECD −1 to −5 bp range — the investor accepts a small yield concession for the green label. Averaged across
the 14 AA/AAA issuers in `GREENIUM_DATA`, the portfolio greenium KPI reports the mean concession.

### 7.5 Data provenance & limitations

- The 31-issuer dataset is **curated demo data**, not live prospectus/EMMA feeds; greenium is embedded in
  the stored yield/spread, not computed by interpolating a real conventional curve to matched maturity.
- No use-of-proceeds verification, no NDC-alignment scoring engine — `sdg`/`framework`/`climateScore` are
  stored attributes, not assessed outputs.
- `YIELD_CURVE` is a representative tenor grid, not bootstrapped from the issuer set.

**Framework alignment:** ICMA Green Bond Principles 2021 (use-of-proceeds, verifier, framework fields) ·
BIS WP-923 (2021) and OECD Green Bond Monitor 2023 (greenium magnitude) · Climate Bonds Initiative State of
the Market (issuance context) · sovereign NDC alignment (guide's intended overlay).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Compute a statistically clean matched-maturity greenium per sovereign GSS bond and
an issuer climate-credibility score, for green fixed-income allocation.

**8.2 Conceptual approach.** **Nelson-Siegel-Svensson yield-curve fitting** on each sovereign's conventional
curve, then greenium as the green bond's yield residual to the fitted curve — the BIS/ECB green-bond-pricing
method — plus a use-of-proceeds credibility score from framework/verification quality (CBI second-party-
opinion practice).

**8.3 Mathematical specification.**
```
Fit conventional curve:  y(τ) = β0 + β1·f1(τ,λ1) + β2·f2(τ,λ1) + β3·f3(τ,λ2)   (NSS)
Greenium_bond = y_green(τ_bond) − y_hat_conventional(τ_bond)     (basis points, matched maturity)
Credibility = w1·FrameworkRobustness + w2·ReportingQuality + w3·ImpactMetricCoverage + w4·NDCAlignment
Controls: match currency, seniority, liquidity (bid-ask), issue size before comparing
```

| Parameter | Source |
|---|---|
| NSS β, λ | least-squares fit to conventional sovereign bonds (EMMA/refinitiv) |
| Framework/reporting weights | ICMA GBP + CBI SPO rubric |
| NDC alignment | country NDC sectoral targets (UNFCCC registry) |

**8.4 Data requirements.** Full conventional + green bond price/yield curves per sovereign; issue
characteristics; framework/SPO documents; NDC data. Free: EMMA, UNFCCC NDC registry; vendor: Bloomberg
BVAL, CBI database.

**8.5 Validation & benchmarking.** Reconcile fitted greenium against BIS/OECD −1 to −5 bp; liquidity-control
robustness; backtest greenium persistence in secondary market.

**8.6 Limitations & model risk.** Sparse conventional comparators for some sovereigns; liquidity confounds
greenium; framework quality subjective. Fallback: nearest-maturity spread differential with liquidity flag
when curve fit is under-identified.
