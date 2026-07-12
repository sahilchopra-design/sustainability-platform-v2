## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is a large (2,160-line), multi-tool module implementing the UNDP's real 6-pillar blended
finance framework alongside several **genuinely correct financial calculators** — a notable
departure from the mostly-decorative PRNG dashboards seen elsewhere in this batch. Three formulas
stand out as faithful implementations of real development-finance methodology:

```
Grant Element (OECD-DAC) = (1 − PV(repayment schedule) / FaceValue) × 100     // discounted at 10% (OECD-DAC standard)
Leverage Ratio            = CommercialCapital / PublicInput
Mobilization Ratio         = TotalDealSize / PublicInput
```

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| Grant Element discount rate | **10% fixed** | Matches the **actual official OECD-DAC discount rate** used to compute grant element for ODA-eligible loans — a precise, correct real-world calibration |
| GE classification bands | Highly Concessional ≥50%, Concessional ≥25% (ODA threshold), Non-Concessional <25% | The 25% threshold is the **real OECD-DAC minimum grant-element requirement** for a loan to count as Official Development Assistance |
| `PILLARS` (24 rows across 6 UNDP pillars) | Public Sector Coordination, Policy & Regulatory Environment, Concessional Capital Supply, Market Development, Innovation & Impact Instruments, Knowledge & Capacity | Faithful to UNDP's real published 6-pillar Blended Finance Framework structure |
| `INSTRUMENTS` (11) | First-Loss Guarantee, Subordinated Debt/Equity, Technical Assistance, Results-Based Finance, Concessional Loans, Design-Stage Grants, etc., each with `leverage` and `concessionality` | Real Convergence-style blended-finance instrument taxonomy |
| `MARKETS` (13 regions) | Transaction count, financing volume, top sector, main DFI, average leverage | Illustrative regional benchmarks; DFI names (IFC, AfDB, ADB, EBRD, EIB, KfW, FMO, CDC, Proparco, JICA per the guide) are real institutions |
| `DFI_BENCHMARKS` (7) | Region, avg leverage, avg concessionality %, climate focus, min project size | Illustrative, directionally plausible per-region DFI performance figures |
| `FACTORS` (10, deal-scoring) | Weighted criteria for the composite deal-quality score | Platform-defined weighting scheme |

### 7.3 Calculation walkthrough

1. **Grant Element Calculator**: builds a full amortisation schedule (grace period + equal
   principal repayment thereafter), computes interest on the declining outstanding balance, and
   discounts every cash flow at the fixed 10% OECD-DAC rate — a textbook-correct implementation of
   the real DAC grant-element methodology, not a shortcut approximation.
2. **Leverage/Mobilization calculators** (2 separate implementations appear in the file — one in a
   scenario-blending tool, one in a benchmark-comparison tool): both correctly divide commercial
   capital mobilised by the public/concessional capital deployed, consistent with the real
   OECD-DAC/Convergence definitions of leverage and mobilization ratios.
3. **Scenario blending** (`blendedLev`): combines optimistic/base/stressed leverage estimates using
   confidence-weighted averaging (`optWeight=min(2×confidence,1)`, `stressWeight=min(2×(1−confidence),1)`,
   each scenario contributing ~1/3 base weight) — a reasonable heuristic for scenario blending, though
   the specific weighting scheme is a platform design choice rather than a named statistical method.
4. **Deal scoring composite**: `Σ (score_i/10) × weight_i` across the `FACTORS` criteria — a standard
   weighted-average scoring rubric.
5. **DFI benchmark comparison**: flags whether a proposed deal's leverage ratio meets or exceeds the
   selected region's DFI benchmark (`leverageOk = leverageRatio >= bench.leverage`).

### 7.4 Worked example (Grant Element Calculator, defaults: $100M loan, 3% rate, 3yr grace, 15yr maturity)

| Year(s) | Payment structure | 
|---|---|
| 1–3 (grace) | Interest-only: `100 × 3% = $3.0M/yr` |
| 4–15 (12yr amortisation) | Principal `$100M/12 = $8.33M/yr` + declining-balance interest |

```
Total PV of all 15 payments (discounted at 10%) = $59.86M
Grant Element = (1 − 59.86/100) × 100 = 40.1%
Classification: 40.1% ≥ 25% → "Concessional" (but below the 50% "Highly Concessional" threshold)
```

This is a genuinely correct application of the OECD-DAC methodology: a below-market 3% loan with a
grace period, discounted at the DAC's 10% reference rate, correctly registers as moderately
concessional (comfortably above the 25% ODA-eligibility floor).

### 7.5 Companion analytics

- **Vehicle Structuring tab** — 4 vehicle types (SPV, Pooled Fund, DFI Facility, Syndication
  Platform) with governance/fee-model comparison, consistent with real blended-finance vehicle
  design practice.
- **IRIS+ Impact Measurement tab** — 19 real IRIS+ metric definitions (GIIN taxonomy) with unit and
  methodology per metric.
- **Deal Pipeline tab** — origination-to-exit stage tracking with conversion-rate analysis.
- **Risk Matrix tab** — 5-category (Market/Credit/Political/Currency/Climate) L/M/H risk framework
  with mitigation-instrument mapping.

### 7.6 Data provenance & limitations

- **The Grant Element and Leverage/Mobilization calculators are the module's strongest assets** —
  correctly implemented, named-standard financial methodology (OECD-DAC grant element at the
  official 10% discount rate; Convergence-consistent leverage/mobilization definitions).
- **Regional market intelligence, DFI benchmarks, and instrument-level figures are illustrative**,
  not live-sourced from the Convergence database or DFI annual reports despite being presented
  alongside genuinely correct calculators — a user should not treat the 13-region `MARKETS` table
  or `DFI_BENCHMARKS` as current market data.
- Scenario-blending confidence weights (`optWeight`/`stressWeight`) are a platform heuristic, not a
  named probabilistic scenario-weighting methodology (e.g. not a formal Bayesian blend).
- Deal-scoring composite weights are platform-defined and not benchmarked against any external
  DFI investment-committee scoring rubric.

### 7.7 Framework alignment

- **OECD-DAC Grant Element methodology**: correctly implemented at the real 10% discount rate with
  the real 25%/50% concessionality thresholds — this module can be trusted as a genuine grant-element
  calculator, unlike many other "concessionality" claims across the platform that are decorative.
- **UNDP Blended Finance Framework (2018/2022)**: the 6-pillar structure and maturity-level scoring
  (No Strategy→Awareness→Planning→Implementation→Scaling) are faithful to UNDP's actual published
  framework.
- **Convergence blended-finance taxonomy**: instrument types, leverage/mobilization ratio
  definitions, and regional benchmarking structure are consistent with Convergence's real State of
  Blended Finance reporting conventions.
- **GIIN IRIS+**: the 19-metric impact taxonomy (lives improved, tCO2e avoided, MW installed,
  hectares protected, jobs created, SMEs financed) matches real IRIS+ metric categories.
- **GCF Investment Framework**: referenced for private-sector-facility concessionality guidance;
  not independently modelled as a distinct calculation.
