## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an *ESG-Adjusted OAS Attribution* regression
> (`OAS_esg = OAS_benchmark + β_esg·ESG_score + β_dur·Duration + ε`). **No regression is estimated.**
> There is no OAS attribution, no β coefficients, no duration term. The **greenium is a stored
> per-bond field** (`greenium_bps`), and the portfolio outputs are notional-weighted averages over a
> curated ~80-bond universe. The sections below document the aggregation the code actually performs.

### 7.1 What the module computes

Over a labelled-bond universe (green/social/sustainability/SLB/transition/blue/sovereign, ~80 bonds)
plus a 24-country sovereign-ESG table, the page computes portfolio notional-weighted analytics:

```js
wAvgEsg      = Σ(esgScore_b × notional_b) / Σ notional_b
wAvgGreenium = Σ(greenium_bps_b × notional_b) / Σ notional_b
wAvgYield    = Σ(yield_b × notional_b) / Σ notional_b
greenSharePct= greenNotional / totalNotional × 100
yieldSpread  = tier3.avgYield − tier1.avgYield            // rating-tier yield gap
annualSaving = notional × |greenium_bps|·0.01·0.01 × 1e6  // greenium coupon saving
```

The **greenium** (green bonds pricing at a lower yield than matched conventional curves) is *not
estimated* — each bond carries a hand-set `greenium_bps` (e.g. World Bank IBRD −15 bps, France OAT
Verte −8 bps). Portfolio greenium is just the notional-weighted mean of these.

### 7.2 Parameterisation / scoring rubric — the bond universe

| Attribute | Source in code | Example |
|---|---|---|
| type (11 categories) | ICMA/CBI taxonomy | Green, Social, SLB, Transition, Blue, Sovereign Green |
| esgScore (0–100) | curated per issuer | Apple 76, PEMEX 32, World Bank 95 |
| greenium_bps | curated per bond | −1 to −15 bps (tighter for AAA/MDB) |
| yield, coupon, maturity, size_mn, rating, currency | curated | e.g. Germany Green Bund 0.00% 2031 AAA |
| framework / spo | ICMA GBP/SBP/SLBP, CBI, EU GBS; SPO provider | Sustainalytics, CICERO, Vigeo Eiris |
| sdgs, cbi_sector, frameworks_compliance | curated tags | — |

The 11 bond types map exactly to the ICMA Principles + CBI taxonomy. The **sovereign-ESG table**
(`SOVEREIGN_ESG`, 24 countries) carries E/S/G sub-scores, ND-GAIN, and rating — e.g. Germany
score 90 (E88/S92/G91, ND-GAIN 72.0, AAA). All are curated demo figures (realistic, no PRNG).

The greenium pattern is methodologically sound: MDB/AAA issuers (World Bank −15, EIB −12) show the
largest greenium, high-yield/EM issuers (PEMEX −1, Egypt −2) the smallest — consistent with the
empirical finding that greenium widens with credit quality and issuer scarcity.

### 7.3 Calculation walkthrough

1. Build portfolio `items` (bond × notional); filter by type/currency/rating/country/subtype.
2. `fiAnalytics`: notional-weighted ESG, greenium, yield; green/social/SLB notional splits.
3. Rating-tier grouping → `tierData`; `yieldSpread` = tier-3 minus tier-1 average yield.
4. `greeniumData`: 30 tightest-greenium bonds (sorted ascending greenium_bps).
5. `annualSaving`: per-bond coupon saving from the greenium; sovereign bar data; combined equity+FI WACI.

### 7.4 Worked example (portfolio greenium & saving)

A 3-bond portfolio: World Bank IBRD ($100M, −15 bps), France OAT Verte ($200M, −8 bps),
PEMEX SLB ($50M, −1 bps):
```
totalNotional  = 350
wAvgGreenium   = (−15·100 + −8·200 + −1·50) / 350 = (−1500 −1600 −50)/350 = −9.0 bps
```
Annual coupon saving on the World Bank tranche:
`saving = 100 × (|−15|·0.01·0.01) × 1e6 = 100 × 0.0015 × 1e6 = $150,000` (i.e. 15 bps × $100M).
So the −9.0 bps portfolio greenium translates into a modest but real funding-cost advantage — the
metric the ICMA/CBI market cites as the "green premium".

### 7.5 Companion analytics

- **Rating-tier yield spread** — proxies the credit-quality slope across the labelled universe.
- **Greenium ranking** — the 30 tightest bonds, dominated by MDBs and AAA sovereigns.
- **Combined WACI** — merges equity holdings' carbon intensity with the FI book's weighted ESG (note:
  the FI "WACI" here is actually the weighted ESG score, not a tCO₂e/$M intensity — a labelling quirk).
- **Sovereign-ESG** — country E/S/G scores for sovereign-bond context.

### 7.6 Data provenance & limitations

- **Curated demo data** — realistic named bonds and greeniums, but not a live pricing feed; no PRNG.
- **Greenium is stored, not estimated** — the guide's OAS regression (the actual way greenium is
  isolated in practice, by matching to a conventional issuer curve and regressing residual spread on
  ESG) is entirely absent.
- The "FI WACI" is a mislabelled weighted-ESG; no financed-emissions intensity is computed here.
- No option-adjusted spread, no duration, no matched-curve construction.

**Framework alignment:** ICMA Green/Social/Sustainability Bond Principles + Sustainability-Linked Bond
Principles (the 11 type taxonomy) · Climate Bonds Initiative Standard + sector taxonomy (cbi_sector,
certification) · EU Green Bond Standard (frameworks_compliance) · ND-GAIN (sovereign adaptation score).
The greenium concept is the ICMA/CBI market metric; a production implementation would estimate it via
matched-maturity conventional-bond spread differentials.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The greenium is hand-set per bond; the guide's
OAS-attribution regression is the missing model. Below is the production greenium/ESG-spread model.

### 8.1 Purpose & scope
Estimate the ESG/green premium (greenium) in bond spreads and attribute portfolio option-adjusted
spread to ESG quality, controlling for credit, duration, sector and liquidity — for relative-value and
green-bond issuance decisions.

### 8.2 Conceptual approach
A **panel fixed-effects OAS regression** (matched green-vs-conventional twin bonds where available,
else curve-residual) benchmarked against **Barclays/MSCI green-bond index research** and
**Bloomberg BVAL** greenium studies, plus a **matched-pair estimator** (the twin-bond method used for
Germany's green Bund) as the gold-standard identification.

### 8.3 Mathematical specification
```
OAS_b = α + β_ESG·ESGscore_b + β_D·Duration_b + β_R·RatingNotch_b
        + β_sector·Sector_b + β_liq·log(IssueSize_b) + γ_issuer + ε_b
Greenium_b = OAS_conventional-curve(rating,dur,ccy) − OAS_b        (matched-curve residual)
Twin greenium = yield_green,twin − yield_conventional,twin          (cleanest identification)
Portfolio greenium = Σ w_b · Greenium_b ,  w_b = notional_b / Σnotional
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| β_ESG | spread sensitivity to ESG | estimated on panel; MSCI/Barclays priors |
| conventional curve | rating×duration×ccy spread | Bloomberg BVAL / ICE curves |
| RatingNotch | numeric rating | S&P/Moody's scale |
| γ_issuer | issuer fixed effect | panel estimation |

### 8.4 Data requirements
Per bond: OAS/yield time series, rating, duration, sector, issue size, ESG score, green-label flag,
twin-bond identifier where it exists. Sources: Bloomberg/ICE (OAS, curves), MSCI/Sustainalytics (ESG),
CBI database (labels). Curated universe here provides the static attributes.

### 8.5 Validation & benchmarking plan
Reconcile estimated greenium against published twin-bond spreads (Germany, Netherlands) and against
Barclays/MSCI index greenium (target ±3 bps); out-of-sample test on new issues; check β_ESG stability
across rating buckets and time.

### 8.6 Limitations & model risk
Greenium is small and time-varying; matched-curve residuals confound liquidity; twin bonds are rare.
Conservative fallback: report the twin-bond greenium where available and a wide confidence band on the
regression-based estimate elsewhere; never present a single point greenium without an interval.
