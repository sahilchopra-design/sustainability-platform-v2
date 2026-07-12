## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies a **two-level PCAF look-through**
> `CF_FoF = Σ_f w_f × Σ_i (w_fi × EVIC_fi⁻¹ × Emissions_fi)` — weighting each fund by its FoF allocation,
> then each underlying holding by its sub-fund weight, normalising by EVIC at both levels. **The code
> implements only the first level:** a commitment-weighted average of each fund's stored
> `carbon_intensity`. There is no holding-level roll-up, no EVIC normalisation — the sub-fund look-
> through is absent. The rest of the module (TVPI/IRR/ESG aggregation, SFDR/GRESB analytics, editable
> portfolio) is genuine and correctly weighted.

### 7.1 What the module computes

A commitment-weighted PE fund-of-funds engine over 12 funds (editable, localStorage-persisted):

```js
wAvg(funds, field) = Σ(field_f × commitment_f) / Σ commitment_f      // commitment-weighted
wTVPI   = wAvg(tvpi)
wIRR    = wAvg(irr) over funds with irr ≠ null
wESG    = wAvg(esg_score)
wCarbon = wAvg(carbon_intensity)          // ← the "look-through carbon footprint" (single level)
art89pct = #(sfdr_article ≥ 8) / count × 100
```

The IRR aggregation correctly **excludes null-IRR funds** (early-vintage funds without a meaningful IRR)
before weighting — a proper treatment. TVPI, DPI, ESG and carbon are all commitment-weighted.

### 7.2 Parameterisation / scoring rubric — the fund book

`DEFAULT_FUNDS` (12) carry realistic PE/RE/Infra/Credit/VC attributes:

| Fund | Type | Commit $M | TVPI | IRR | ESG | Carbon int. | SFDR |
|---|---|---|---|---|---|---|---|
| Climate Transition I | PE | 50 | 1.18 | 14.5 | 74 | 45 | 9 |
| NA Buyout V | PE | 150 | 1.32 | 18.5 | 55 | 155 | 6 |
| Global Equity ESG Leaders | Listed Eq | 200 | 1.85 | 12.8 | 76 | 68 | 8 |
| Impact Ventures I | VC | 15 | 1.05 | null | 82 | 18 | 9 |
| Japan Transition | PE | 60 | 1.05 | 8.0 | 70 | 180 | 8 |

`carbon_intensity` values are plausible (heavy-industry Japan Transition 180, Impact Ventures 18) but
are **stored per fund**, not derived from underlying holdings. SFDR Article (6/8/9), GRESB score
(populated for RE/Infra funds), DPI/TVPI/vintage are all realistic. Data is curated demo, no PRNG.

`esgColor`: ≥75 green, ≥60 amber, else red. `sfdrBadge`: Art 9 green / Art 8 amber / Art 6 red.

### 7.3 Calculation walkthrough

1. Load funds (localStorage or defaults); filter by type/SFDR/ESG floor; sort.
2. `kpis`: total commitment/NAV/AUM, commitment-weighted TVPI/IRR/ESG/carbon, Art 8+9 %, GRESB %.
3. Charts: asset allocation by type (commitment), ESG-vs-IRR scatter (bubble = commitment), SFDR
   buckets, geography and vintage distributions.
4. Add/edit funds → recompute + persist.

### 7.4 Worked example (commitment-weighted carbon)

Three funds: Climate Transition ($50M, carbon 45), NA Buyout ($150M, carbon 155), Impact Ventures
($15M, carbon 18):
```
totalCommit = 50 + 150 + 15 = 215
wCarbon = (45·50 + 155·150 + 18·15) / 215 = (2250 + 23250 + 270) / 215 = 25,770 / 215 = 119.9
```
So the portfolio carbon intensity is 119.9, dominated by the large NA Buyout commitment — the correct
commitment-weighted result. But note this treats each fund's `carbon_intensity` as a black box; the
guide's method would instead roll up from each fund's holdings, normalising each holding's emissions by
its EVIC, which would surface *which portfolio companies* drive the 119.9.

### 7.5 Data provenance & limitations

- **Curated demo funds** (12, realistic PE metrics); editable and localStorage-persisted; no PRNG.
- **Carbon look-through is single-level only** — commitment-weighted fund carbon intensity, not the
  guide's two-level holding × EVIC roll-up.
- Carbon intensities are stored per fund, not computed from underlying positions.
- IRR excludes null funds (correct); TVPI/ESG include all funds.

**Framework alignment:** PCAF Financed Emissions (the guide's look-through — PCAF requires FoF investors
to weight underlying-fund emissions by their allocation and normalise by EVIC/AUM at each level) · SFDR
Article 6/8/9 product classification · GRESB (real-asset ESG benchmark) · standard PE performance metrics
(TVPI = total value/paid-in, DPI = distributions/paid-in, IRR). The performance and classification
analytics are sound; the carbon method is a simplification of the PCAF look-through.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The carbon footprint is a single-level fund-
weighted average; the PCAF two-level look-through is unbuilt. Below is the production model.

### 8.1 Purpose & scope
Compute a fund-of-funds financed-emissions footprint via full PCAF look-through to underlying holdings,
with data-quality scoring — for LP climate reporting (PCAF, SFDR PAI, CSRD).

### 8.2 Conceptual approach
The **PCAF two-level attribution** for funds/FoFs, benchmarked against **PCAF's Facilitated Emissions /
Fund investment guidance** and **MSCI/S&P Trucost** fund-carbon datasets, with a DQ score that degrades
where holding-level data is missing (fund-average proxy).

### 8.3 Mathematical specification
```
FE_fund_f = Σ_i AF_fi · (S1+S2+S3)_fi ,   AF_fi = Investment_fi / EVIC_fi        holding attribution
w_f       = Commitment_f / Σ Commitment                                          FoF weight
FE_FoF    = Σ_f w_f · FE_fund_f
Carbon_FoF= FE_FoF / Σ_f (w_f · NAV_f)                                           WACI-style intensity
DQ_FoF    = Σ_f w_f · DQ_f  ,  DQ_f = holding-weighted PCAF data-quality (1–5)
   fund-average fallback when holdings unavailable → DQ 5
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| S1/S2/S3_fi | holding emissions | CDP / vendor / EXIOBASE proxy |
| EVIC_fi | holding enterprise value | Bloomberg / Refinitiv |
| Commitment_f, NAV_f | FoF allocation | LP records (present) |
| DQ_f | PCAF data quality | PCAF DQ table |

### 8.4 Data requirements
Per fund: holding list with investment amount, EVIC, S1/S2/S3, or (fallback) a reported fund carbon
intensity + DQ. Sources: GP ESG reports, PCAF-aligned fund disclosures, MSCI/Trucost. The module already
holds commitment/NAV; it needs the holding-level layer.

### 8.5 Validation & benchmarking plan
Reconcile FE_FoF against GP-reported fund emissions and MSCI fund carbon data; validate the look-through
against a manual holding roll-up for one fund; track DQ improvement as holding data is sourced; check
SFDR PAI-1 consistency.

### 8.6 Limitations & model risk
Holding-level data from GPs is sparse (drives DQ to 5); EVIC timing distorts attribution; double-counting
across funds. Conservative fallback: use the fund-average intensity with DQ 5 where holdings are missing,
and flag the % of the book on proxy data.
