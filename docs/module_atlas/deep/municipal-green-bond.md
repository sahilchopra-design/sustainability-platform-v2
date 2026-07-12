## 7 · Methodology Deep Dive

This module aligns with its MODULE_GUIDES entry — a **municipal/sub-sovereign green-bond market
explorer** with use-of-proceeds tracking, greenium, and ICMA GBP framing. It is a **filter-and-aggregate
dashboard over 70 synthetic bonds**; there is no framework-scoring engine and no yield-curve greenium
computation — the "greenium" is a stored per-bond number, not a modelled spread differential.

### 7.1 What the module computes

`BONDS` seeds 70 municipal green bonds; the page filters and sums:

```js
totalVolume = Σ filtered.issuanceSize
avgGreenium = mean(filtered.greenium)
totalCO2    = Σ filtered.estimatedCO2Saving
useData     = per use-of-proceeds { volume, count }
regionGreenium = per region mean(greenium)
```

Each bond carries region, use-of-proceeds, credit rating, tenor, greenium (bps), oversubscription,
projects financed, CO₂ saving, jobs, population served.

### 7.2 Parameterisation / scoring rubric

| Field | Generator | Range | Provenance |
|---|---|---|---|
| certificationBody | `CERT_BODIES[floor(sr(i·7)·5)]` | CICERO/Sustainalytics/S&P DJI/Vigeo/ISS | Real SPO providers, random assignment |
| creditRating | `RATINGS[floor(sr(i·11)·9)]` | AAA…BBB | Synthetic |
| issuanceSize | `50 + sr(i·3)·1950` | $50M–$2.0Bn | Synthetic |
| tenor | `5 + sr(i·17)·25` | 5–30 yr | Synthetic |
| **greenium** | `sr(i·19)·12` | **0–12 bps (always positive)** | Synthetic — see limitation |
| oversubscription | `1.5 + sr(i·23)·8.5` | 1.5×–10× | Synthetic |
| estimatedCO2Saving | `10 + sr(i·31)·990` | 10–1,000 ktCO₂ | Synthetic |

Region, use-of-proceeds and city name are assigned by modular index (`i % REGIONS.length`), so the
distribution is uniform-by-construction, not market-representative.

### 7.3 Calculation walkthrough

`BONDS` is generated once at load → user filters (region / use / year / min size / min greenium) →
`filtered` subset → KPI sums (volume, avg greenium, CO₂, jobs) → per-category and per-region breakdowns
for the charts. No pricing model runs; every headline is an aggregation of stored synthetic fields.

### 7.4 Worked example (greenium KPI)

With no filters, `avgGreenium = mean over 70 bonds of sr(i·19)·12`. Since `sr()` is ~uniform on [0,1],
the expected mean greenium ≈ `0.5·12 = 6.0 bps`. This is reported as a **positive** "greenium",
implying green bonds yield 6 bps *higher* than conventional — the opposite sign of the real market, where
a greenium is conventionally the amount green bonds trade *tighter* (yield lower), i.e. −2 to −6 bps per
the guide's own Barclays citation.

### 7.5 Data provenance & limitations

- **All 70 bonds are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`). Only the SPO-provider names, region and
  use-of-proceeds taxonomies are real labels.
- **Greenium sign error:** `sr()·12` is strictly non-negative, so the module can never show the negative
  greenium (green tighter) that defines the phenomenon; it treats greenium as a positive yield pickup.
- No ICMA GBP four-pillar scoring, no SPO-quality assessment, no issuer vanilla-curve construction — the
  greenium is asserted per bond, not derived from a matched conventional yield.

**Framework alignment:** **ICMA Green Bond Principles 2021** (use-of-proceeds taxonomy present as a
label) and **CBI municipal guidance** (SPO/certification bodies named). The framework-quality score and
greenium-vs-vanilla-curve methodology promised in the guide are not implemented (see §8; the companion
`municipal-green-bond-analytics` module carries the real greenium/tax-equivalency math).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module shows a positive stored "greenium"
and no framework quality score. Below is the production greenium + GBP-quality model.

### 8.1 Purpose & scope
Estimate the issuance and secondary greenium of each municipal green bond against a matched conventional
curve, and score ICMA GBP framework quality, for relative-value and impact-investment decisions.

### 8.2 Conceptual approach
Greenium via **matched-maturity yield-curve differencing** (per Barclays/BNEF green-bond research and the
ICMA methodology): build the issuer's (or peer-cohort's) conventional muni yield curve, price the green
bond off it, and take the residual. Framework quality via a **four-pillar ICMA GBP rubric** scored from the
bond's SPO and post-issuance impact report (benchmark: CBI certification criteria, S&P Green Evaluation).

### 8.3 Mathematical specification
Greenium `g = ŷ_conv(τ, rating) − y_green`, where `ŷ_conv` is the conventional-curve yield at the green
bond's tenor τ and rating, from a Nelson-Siegel fit `y(τ) = β₀ + β₁·(1−e^{−τ/λ})/(τ/λ) + β₂·((1−e^{−τ/λ})/(τ/λ) − e^{−τ/λ})`.
A positive `g` (bps) means green trades tighter. Framework score
`F = Σ_{p∈{UoP, evaluation, management, reporting}} wₚ·sₚ`, `sₚ ∈ [0,1]` from rubric checklist;
CBI-alignment gate on eligible-project taxonomy.

| Parameter | Source |
|---|---|
| Conventional curve | MMD/BVAL AAA muni scale + rating spread |
| NS params β,λ | Fit to issuer/cohort conventional bonds |
| Pillar weights wₚ | ICMA GBP (equal or reporting-weighted) |
| SPO quality sₚ | CICERO shades-of-green / Sustainalytics opinion |

### 8.4 Data requirements
Green + matched conventional muni yields (Bloomberg BVAL / MSRB EMMA), ratings, tenors, SPO documents,
post-issuance impact reports. Platform currently has none of these live — all synthetic.

### 8.5 Validation & benchmarking plan
Reconcile computed greeniums against Barclays/BNEF published muni greenium (−2 to −6 bps); backtest curve
fit RMSE; correlate framework score with CBI-certified vs uncertified segmentation.

### 8.6 Limitations & model risk
Matched-conventional bonds are scarce for small issuers (thin curve → wide CIs); greenium is confounded
with liquidity and issuer-specific demand. Conservative fallback: report greenium ranges with liquidity
adjustment, and flag bonds lacking a same-issuer conventional comparable.
