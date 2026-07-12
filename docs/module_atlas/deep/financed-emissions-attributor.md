## 7 · Methodology Deep Dive

The Financed Emissions Attributor (EP-CC2) is a **PCAF Category-15 attribution dashboard** covering 5
of PCAF's 8 asset classes. It faithfully implements the guide's methodology (`FinancedEmissions =
AF × (S1+S2+S3)`, `AF_equity = Outstanding/EVIC`), but the numbers are **hand-authored illustrative
PCAF figures stored per asset class**, not computed from a live holdings ledger. There is no `sr()`
PRNG here — the demo data is curated (real company names, plausible attribution factors), not random.
No guide↔code mismatch.

### 7.1 What the module computes

Each asset class stores its PCAF primitives (outstanding amount, EVIC, attribution factor, Scope 1/2/3,
financed emissions, WACI, DQ score, targets). The page aggregates:

```js
totalFinanced    = Σ class.financed          // MtCO₂e (5 classes)
totalOutstanding = Σ class.outstanding        // $M
totalTarget2030  = Σ class.target_2030
offTrack         = # classes with on_track === false
```

The **attribution factor** and **financed emissions** are pre-computed to *demonstrate* the PCAF
formula rather than derived at render time — e.g. Listed Equity: `attribution = 4,200/12,400 = 0.339`,
and each company's `financed_mt = attribution_company × company(S1+S2+S3)`. The **trajectory** scales
the 2024 total backward (×1.28/1.18/1.10/1.04 for 2020–23) and plots 2025/2030/2050 target sums.

### 7.2 Parameterisation / scoring rubric — the 5 PCAF classes

| Class | PCAF cat | Attribution basis | Outstanding | EVIC | AF | Financed (Mt) | WACI | DQ |
|---|---|---|---|---|---|---|---|---|
| Listed Equity | 1 | Outstanding / EVIC | 4,200 | 12,400 | 0.339 | 8.48 | 68.4 | 2.1 |
| Corporate Bonds | 2 | Outstanding / (Debt+Equity) | 2,800 | 9,600 | 0.292 | 4.32 | 54.2 | 2.4 |
| Project Finance | 3 | 100% × loan share | 680 | — | 1.00 | 2.80 | 412.0 | 1.8 |
| Commercial RE | 4 | Outstanding / property value | 1,200 | — | ~0.35–0.41 | 0.99 | 82.5 | 3.2 |
| Residential Mortgages | 6 | EPC × grid EF × fraction | 3,400 | — | (EPC-based) | 1.84 | 54.1 | 4.0 |

**Provenance:** the attribution methodology per class is the genuine PCAF Global GHG Standard rule
(equity/bonds use EVIC, project finance 100%, real estate loan-to-value, mortgages EPC-energy). The
specific $ and Mt figures are curated demo values chosen to be realistic (e.g. Project Finance WACI
412 tCO₂/$M reflects a coal-plant-heavy book; DQ 1.8–4.0 spans PCAF's 1–5 scale). Company-level
`financed_mt` (Shell 1.84, ArcelorMittal 2.60) are illustrative.

**Scope-3 category breakdown** (Listed Equity, Corporate Bonds) uses the real GHG Protocol Cat 1–15
taxonomy, with Cat 11 "Use of Sold Products" dominating for O&G/utilities — the methodologically
correct dominant category.

### 7.3 Calculation walkthrough

1. Sum `financed`, `outstanding`, `target_2030` across the 5 classes → header KPIs.
2. `offTrack` counts classes flagged `on_track:false` (Listed Equity, Project Finance).
3. Trajectory: 2024 actual = `totalFinanced`; prior years back-scaled; target years = target sums.
4. Pie: financed emissions share by class. Drill-down: per-class attribution table + Scope-3 cats.
5. WACI benchmark: bar of each class's stored `waci`.

### 7.4 Worked example (Listed Equity attribution)

For Shell in the Listed Equity book:
```
AF_Shell        = 0.148            (Shell outstanding / Shell EVIC)
Financed_Shell  = AF_Shell × (S1+S2+S3)_Shell = 1.84 MtCO₂e   (stored)
```
The class-level attribution `0.339 = outstanding 4,200 / EVIC 12,400` is the exposure-weighted average
of the individual company attribution factors. The class financed total `8.48 Mt` is the sum of the 5
listed companies' financed emissions plus the residual book. Data quality `2.1` is the exposure-weighted
average of the company DQ scores (Shell 2, Glencore 3, BASF 2, BP 1, ArcelorMittal 3), reflecting mostly
reported-but-unverified data (PCAF DQ 2).

### 7.5 Companion analytics

- **Attribution Methodology tab** displays the per-class `formula` string so the PCAF rule is explicit.
- **Targets & Trajectories** compares the actual path against 2025/2030/2050 target sums (an SBTi-style
  linear-decarbonisation reference).
- **WACI Benchmarking** contrasts class WACIs — Project Finance (412) vs Mortgages (54) shows the
  intensity gap between fossil project lending and residential.

### 7.6 Data provenance & limitations

- **All figures are curated demo constants** — realistic but not sourced from a live portfolio; no PRNG.
- Only **5 of 8 PCAF classes** are covered (missing: Business Loans, Motor Vehicle Loans, Sovereign Debt).
- Attribution factors and financed emissions are stored, not recomputed from holdings — the page
  *illustrates* PCAF rather than *running* it over positions.
- Trajectory back-scaling (×1.28…) is a stylised decline, not observed history.

**Framework alignment:** PCAF Global GHG Accounting & Reporting Standard (attribution by asset class:
EVIC for equity/bonds, 100% for project finance, LTV for real estate, EPC for mortgages; DQ scale 1–5) ·
GHG Protocol Scope 3 Category 11/15 (financed emissions are the investor's Cat-15) · SBTi Financial
Sector framework (the target trajectory). PCAF derives its DQ score from the *observability* of the
underlying data: 1 = audited/verified actuals, 5 = asset-class-average proxy — exactly the `quality`
field here.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page stores pre-computed attribution and
financed-emissions figures; a production system must derive them live from the loan/investment ledger.

### 8.1 Purpose & scope
Compute portfolio financed emissions (PCAF Cat-15) across all 8 asset classes at position level, with
attribution, WACI, DQ scoring and SBTi target tracking — the regulatory basis for CSRD E1-6 and
NZBA/SBTi disclosures.

### 8.2 Conceptual approach
The PCAF attribution engine, benchmarked against **PCAF's own accounting standard** and
**S&P Trucost / MSCI** financed-emissions datasets for reconciliation. Attribution is exposure/enterprise-
value share; emissions are the best-available data at each DQ tier.

### 8.3 Mathematical specification
```
AF_i        = Outstanding_i / EVIC_i                        (equity/bonds)   ∈ [0,1]
AF_i        = Outstanding_i / (Debt_i + Equity_i)           (private/loans)
AF_i        = LoanAmount_i / PropertyValue_i                (real estate)
FE_i        = AF_i · (S1_i + S2_i + S3_i)                   financed emissions
WACI        = Σ_i (value_i/Σvalue) · (S1+S2)_i / Revenue_i  weighted intensity
DQ_portfolio= Σ_i (Outstanding_i/ΣOutstanding) · DQ_i       exposure-weighted DQ
SBTi_gap    = FE_actual,t − FE_target,t   ;  target linear to 1.5°C SDA pathway
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| EVIC_i | enterprise value incl. cash | Bloomberg / Refinitiv market data |
| S1/S2/S3_i | company emissions | CDP, company reports, EXIOBASE proxy |
| Revenue_i | company revenue | financial data vendor |
| DQ_i | 1–5 data-quality tier | PCAF DQ table by data source |
| SDA pathway | sector decarbonisation | SBTi Sectoral Decarbonisation Approach |

### 8.4 Data requirements
Per position: outstanding amount, asset class, counterparty ID (ISIN/LEI), EVIC or property value,
company S1/S2/S3, revenue, EPC (mortgages/CRE), grid emission factor. Sources: internal ledger; CDP +
vendor emissions; EXIOBASE for economic-proxy tier; national grid factors. Already on platform: the PCAF
financed-emissions engine and reference-data EF tables.

### 8.5 Validation & benchmarking plan
Reconcile FE against S&P Trucost / MSCI for overlapping issuers (target ±15%); backtest DQ-weighted
totals as data improves (DQ should fall over time); sensitivity-test EVIC timing (year-end vs average);
tie SBTi gap to the validated target.

### 8.6 Limitations & model risk
EVIC volatility distorts AF year-on-year; DQ-5 proxy tiers dominate mortgage/SME books; Scope-3 double-
counting across the value chain. Conservative fallback: report a DQ-weighted uncertainty band around FE
and floor mortgage/CRE emissions at the regional PCAF proxy.
