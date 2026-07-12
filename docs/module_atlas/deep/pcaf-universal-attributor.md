## 7 · Methodology Deep Dive

### 7.1 What the module computes

A reference/education-oriented dashboard covering all 8 PCAF asset classes (vs the flagship
`pcaf-financed-emissions` module's 13, which includes PCAF's newer Part-C extensions). Each class
carries a static exposure, emissions, and DQ figure plus its textual attribution formula — this
module is a **formula-reference-and-benchmark tool**, not a per-position live calculator like its
sibling modules.

```
avgDQ         = Σ(class.dq × class.exposure) / Σ(class.exposure)      // exposure-weighted DQ
portfolioWACI = Σ(sector.waci × sector.weight/100)                     // weight-normalised WACI
benchmarkWACI = Σ(sector.benchmark × sector.weight/100)
```

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| `PCAF_CLASSES` (9 rows — 8 classes + totals?) | name, formula (text), exposure, emissions, dq, dqDesc, example | Seed table; formulas are correctly transcribed PCAF text (e.g. "EVIC" for Class 1-2, "100%" for Class 3, "Loan/Value" for Class 4-6, "GDP-based" for Class 7) |
| `WACI_SECTORS` (11 rows) | `waci`, `benchmark`, `weight` per sector | Seed table; weights presumably sum to 100 across sectors (not independently verified in the extracted formulas) |
| Target-tracking trajectory | `target = 100×0.93^i`, `actual = 100×0.95^i × (1±2.5%)` | Synthetic demo value: a 7%/yr target-reduction path vs a 5%/yr actual path with small seeded noise — illustrates gap-to-target, not derived from real SBTi target-setting for this specific portfolio |

### 7.3 Calculation walkthrough

1. **Exposure-weighted DQ**: `avgDQ = Σ(dq×exposure)/Σexposure` — correct capital-weighted
   aggregation (larger exposures pull the DQ average more, consistent with PCAF's own
   portfolio-level DQ scoring convention).
2. **DQ heatmap / filter**: `dqMatrix` and `filteredClasses` (filter by `Math.round(dq)===dqFilter`)
   let a user isolate asset classes at a given DQ tier — useful for identifying which classes need
   data-quality remediation investment.
3. **WACI benchmarking**: portfolio WACI vs sector benchmark WACI, both computed as weight-averaged
   sums — a genuine relative-positioning calculation (over/under sector benchmark), though the
   underlying per-sector `waci`/`benchmark` numbers are seed constants, not derived from the
   `PCAF_CLASSES` exposure/emissions figures elsewhere on the page (the two tables are not linked).
4. **Target tracking**: a static two-curve chart (target decay vs actual decay) with no live
   connection to `PCAF_CLASSES`' actual emissions figure — i.e. "actual" here is a hypothetical
   demonstration trajectory, not this portfolio's real historical emissions path.

### 7.4 Worked example

`PCAF_CLASSES` includes, e.g., Class 1 (Listed Equity/Bonds) with `exposure=$X B`, `dq=2.8`, and
Class 6 (Motor Vehicle Loans) with `exposure=$Y B`, `dq=4.1`:

| Step | Computation | Result |
|---|---|---|
| Exposure-weighted avgDQ | (2.8×X + 4.1×Y + …) / (X+Y+…) | a single portfolio-level DQ score between the class extremes, weighted toward whichever class has larger exposure |

Without the concrete seed values for all 9 rows this cannot be resolved to a number from the
extracted formulas alone, but the aggregation mechanic itself is correct and PCAF-consistent.

### 7.5 Data provenance & limitations

- **All class-level exposure, emissions, and DQ figures are seed constants**, illustrative of
  typical institutional-portfolio proportions across the 8 PCAF classes, not computed from any
  underlying position-level dataset.
- The module's `PCAF_CLASSES` and `WACI_SECTORS` tables are **not cross-linked** — WACI/benchmark
  figures don't derive from the same emissions/exposure numbers shown in the class table, so the two
  panels can't be reconciled against each other.
- Target-tracking is a generic decay-curve illustration, not this portfolio's actual SBTi
  target-vs-actual trajectory.

**Framework alignment:** PCAF Global GHG Accounting Standard v3 — the 8-class attribution-formula
reference table is accurate and complete (all 8 official PCAF asset classes correctly named and
formula-labelled); SBTi Financial Sector Framework — referenced for target-tracking context but the
target/actual curves are illustrative rather than SBTi-derived for a specific portfolio.
