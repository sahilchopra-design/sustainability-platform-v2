# Financed Emissions Attributor
**Module ID:** `financed-emissions-attributor` · **Route:** `/financed-emissions-attributor` · **Tier:** B (frontend-computed) · **EP code:** EP-CC2 · **Sprint:** CC

## 1 · Overview
PCAF 5 asset class financed emissions attribution engine. Computes attribution factors, data quality scoring (1-5), WACI benchmarking, and Scope 3 Category 15 quantification with company drill-down.

**How an analyst works this module:**
- PCAF Dashboard shows total financed emissions with asset class breakdown
- Attribution Methodology explains formulas per asset class
- Targets & Trajectories compares WACI against SBTi reduction target
- Company Drill-Down shows per-company attribution with DQ scores
- WACI Benchmarking compares portfolio against sector and peer averages

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `PCAF_CLASSES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PCAF_CLASSES` | 32 | `name`, `pcaf`, `quality`, `color`, `outstanding`, `evic`, `attribution`, `scope1`, `scope2`, `scope3`, `financed`, `cat`, `mt`, `note` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['PCAF Dashboard', 'Attribution Methodology', 'Targets & Trajectories', 'Company Drill-Down', 'WACI Benchmarking'];` |
| `totalFinanced` | `PCAF_CLASSES.reduce((s, c) => s + c.financed, 0);` |
| `totalOutstanding` | `PCAF_CLASSES.reduce((s, c) => s + c.outstanding, 0);` |
| `totalTarget2030` | `PCAF_CLASSES.reduce((s, c) => s + c.target_2030, 0);` |
| `trajectoryData` | `useMemo(() => [ { year: 2020, actual: totalFinanced * 1.28 }, { year: 2021, actual: totalFinanced * 1.18 }, { year: 2022, actual: totalFinanced * 1.10 }, { year: 2023, actual: totalFinanced * 1.04 }, { year: 2024, actual: totalFinanced }, { year: 2025, target: PCAF_CLASSES.reduce((s, c) => s + c.target_2025, 0) }, { year: 2030, target: to` |
| `pieData` | `PCAF_CLASSES.map(c => ({ name: c.name, value: c.financed, color: c.color }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PCAF_CLASSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| WACI | `Σ(w_i × Emissions_i / Revenue_i)` | PCAF | Portfolio-weighted average carbon intensity relative to revenue |
| Financed Emissions | `Σ(AF_i × Company_Emissions_i)` | PCAF Cat 15 | Total attributed GHG emissions from portfolio investments |
| Data Quality Avg | `Weighted by exposure` | PCAF DQ scale | Average PCAF data quality score (1=best, 5=worst) |
| PCAF Classes Covered | — | PCAF Standard | Listed Equity (1), Corp Bonds (2), Project Finance (3), Commercial RE (4), Mortgages (6) |

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF attribution methodology
**Headline formula:** `FinancedEmissions = AF_i × (Scope1 + Scope2 + Scope3); AF_equity = Investment / EVIC`

Attribution factors differ by asset class: Listed Equity/Bonds use EVIC (Enterprise Value Including Cash), Project Finance uses 100% attribution, Commercial RE and Mortgages use loan-to-value. WACI = Σ(w_i × Emissions_i / Revenue_i). Data quality 1 (audited) to 5 (asset-class proxy).

**Standards:** ['PCAF Global GHG Standard v3', 'GHG Protocol Scope 3 Cat 15']
**Reference documents:** PCAF Global GHG Accounting and Reporting Standard v3; GHG Protocol Scope 3 Category 15; SBTi Financial Sector Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Run PCAF over holdings instead of illustrating it (analytics ladder: rung 1 → 2)

**What.** §7 gives this module a clean methodological verdict: the PCAF attribution formulas (`AF_equity = Outstanding/EVIC`, 100% for project finance, LTV for real estate) are faithfully implemented, but the numbers are curated per-asset-class constants — "the page *illustrates* PCAF rather than *running* it over positions," covers only 5 of 8 PCAF classes, and the trajectory is back-scaled (×1.28…), not observed history. Evolution A makes it an attribution engine: compute financed emissions bottom-up from a holdings ledger, add the three missing classes (Business Loans, Motor Vehicle Loans, Sovereign Debt — the last with PCAF's PPP-adjusted-GDP attribution), and store annual snapshots so the trajectory becomes real.

**How.** (1) Backend route taking holdings from the platform's `portfolios_pg` table (per the critical-rules note, the populated portfolio store) joined to company EVIC/emissions fields; per-position `AF × (S1+S2+S3)` with DQ score assigned by data-observability per the PCAF 1–5 scale the page already documents. (2) A `financed_emissions_snapshots` table written per run, replacing the stylised back-scaling in `trajectoryData`. (3) Company drill-down reads per-position attribution instead of stored class aggregates.

**Prerequisites.** Company-level emissions/EVIC reference data for demo holdings (D0 seed — the 200–500-holding demo portfolio); sovereign attribution needs country GDP/emissions refdata (already partially in the refdata layer). **Acceptance:** class totals equal the sum of position-level attributions; a bench-pinned case (one equity position, known EVIC and scopes) reproduces the PCAF hand calculation; DQ scores derive from data provenance, not storage.

### 9.2 Evolution B — Category-15 disclosure analyst (LLM tier 2)

**What.** A copilot that operates the attribution engine for the two jobs analysts actually have: explaining and disclosing. "Why did our financed emissions rise 8% when the portfolio shrank?" becomes tool calls decomposing the delta into attribution-factor drift (EVIC changes), position changes, and company-emissions changes; "draft our Scope 3 Category 15 disclosure paragraph with DQ caveats" pulls totals, class breakdowns, and the exposure-weighted DQ score into GHG-Protocol-shaped text.

**How.** Tier-2 tool-calling over the Evolution A endpoints; grounding corpus is this page's §5/§7, which already encode the PCAF v3 attribution rules and DQ semantics accurately — the copilot explains EVIC-denominator effects using the module's own Attribution Methodology tab content. The delta-decomposition needs one small additional endpoint (two-snapshot diff), keeping arithmetic server-side per the no-fabrication contract.

**Prerequisites.** Evolution A (there is no API today — the module is tier-B frontend-computed over constants); snapshot history of ≥2 periods for delta questions. **Acceptance:** every tCO₂e figure in a disclosure draft traces to a tool response; the copilot correctly attributes an EVIC-driven decrease as denominator effect, not real-economy reduction, in the bench_llm golden set.