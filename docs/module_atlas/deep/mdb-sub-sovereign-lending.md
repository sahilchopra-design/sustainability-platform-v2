## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry's headline formulas —
> `Fiscal Space = Revenue × Coverage Ratio − Existing Debt Service` and
> `Co-Financing Ratio = Private Finance Mobilised / MDB Climate Finance Committed` — **are not
> implemented anywhere in the code.** There is no revenue, coverage-ratio, or private-mobilisation
> field in this module at all. What the code *does* implement, correctly, is an **OECD DAC-style
> grant-element and concessionality calculator** plus a blended-rate mixer — a genuinely useful,
> textbook-correct piece of MDB loan-structuring finance that the guide doesn't mention. Sections
> below document the calculator as written; §8 specifies the missing Fiscal Space model.

### 7.1 What the module computes

Three live financial calculators operate on 7 MDBs (World Bank/IBRD, IFC, ADB, AIIB, IADB, AfDB,
EBRD) and a fixed instrument menu:

```js
// Grant element (OECD DAC methodology)
PV = Σ_{t=1}^{n} (FaceValue × Coupon) / (1+dr)^t  +  FaceValue / (1+dr)^n
GrantElement = max(0, (FaceValue − PV) / FaceValue × 100)      // dr = fixed 10% benchmark rate

// Concessionality benefit (PV of interest savings vs commercial rate)
AnnualBenefit = FaceValue × (CommercialRate − MdbRate) / 100
PVSaving = Σ_{t=1}^{n} AnnualBenefit / (1 + CommercialRate/100)^t

// Blended finance rate
BlendedRate = (BlendRatio/100) × MdbRate + (1 − BlendRatio/100) × CommercialRate
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Grant-element discount rate | 10% (hard-coded `benchmarkRate: 10`) | Matches the **pre-2018 OECD DAC flat discount rate** used to classify ODA concessionality (post-2018 DAC uses differentiated rates by income group, 1–10%; the code retains the simpler flat-10% convention) |
| `mdbRate` slider default | 4.85% | Roughly matches World Bank IBRD variable-spread lending rate order of magnitude |
| `commercialRate` slider default | 7.5% | Illustrative EM commercial benchmark spread over the MDB rate |
| MDB universe (`MDBS`) | 7 rows: `avgRate` 4.50–5.30%, `avgTenor` 10–25yr, `climateTarget` 35–50%, `guaranteeCap` $2–10Bn | Static, plausible-order-of-magnitude reference table, not sourced from live MDB treasury pricing |
| `COUNTRY_ALLOCATIONS` (8 rows) | amount, sector, climateShare, tenor, rating | Static illustrative allocations (e.g. India $9.8Bn, 62% climate share) |
| `INSTRUMENTS` menu (6 rows) | pricing spread ranges, tenor, guarantee type | Static reference table styled after real MDB instrument categories (sovereign OCR loan, PCG, green bond anchor, blended facility, PBG, local-currency loan) |

### 7.3 Calculation walkthrough

1. **Concessionality Engine tab** — user sets loan amount, MDB rate, commercial rate, tenor via
   sliders; `calcGrantElement` and `calcConcessionality` recompute on every change (`useMemo`-free,
   direct call each render).
2. **Grant element** discounts both the coupon stream and the face-value repayment at the fixed 10%
   benchmark, giving the DAC-standard "how much of this loan is effectively a grant" percentage.
3. **PV interest saving** discounts the *annual rate differential* (not the full debt service) at the
   commercial rate — this isolates the value of concessionality alone, separate from the loan's face
   value.
4. **Cost-saving curve** (`costSavingCurve`) sweeps 10 points of decreasing spread
   (`commercialRate − mdbRate − i×0.3`) against a linearly-decayed saving (`pvSaving × (1 − i×0.08)`)
   — a stylised sensitivity curve, not a re-run of the PV formula at each spread.
5. **Blended Finance tab** — `blendedRate` and the accompanying `LineChart` sweep `blendRatio` from
   0–75% in 5pp steps, re-applying the same linear-mix formula at each point.

### 7.4 Worked example

Defaults: `loanAmount=$100M`, `mdbRate=4.85%`, `commercialRate=7.5%`, `tenor=20yr`, `blendRatio=30%`,
benchmark discount rate `10%`.

**Grant element:**

| Step | Computation | Result |
|---|---|---|
| Annuity factor @10%, 20yr | (1 − 1.10⁻²⁰)/0.10 = (1 − 0.1486)/0.10 | 8.514 |
| PV of coupons | 100 × 0.0485 × 8.514 | $41.29M |
| PV of principal | 100 × 1.10⁻²⁰ = 100 × 0.1486 | $14.86M |
| Total PV | 41.29 + 14.86 | $56.15M |
| **Grant element** | (100 − 56.15)/100 × 100 | **43.9%** |

**PV interest saving:**

| Step | Computation | Result |
|---|---|---|
| Annual benefit | 100 × (7.5 − 4.85)/100 | $2.65M |
| Annuity factor @7.5%, 20yr | (1 − 1.075⁻²⁰)/0.075 ≈ (1 − 0.2354)/0.075 | 10.195 |
| **PV saving** | 2.65 × 10.195 | **$27.0M** |

**Blended rate:** `0.30 × 4.85 + 0.70 × 7.5 = 1.455 + 5.25 = 6.71%` — saves 0.79pp vs full commercial.

### 7.5 Companion analytics

- **MDB Landscape radar** — 5-metric radar (`climateTarget`, `greenShare`, `subSovShare`, tenor/3,
  guaranteeCap×10) is a display normalisation only, not a composite score.
- **Guarantee Instruments tab** — static KPIs (WB PCG utilisation 42%, IFC PRG pipeline $8.4Bn, MIGA
  exposure $25Bn) are hard-coded text, not computed.
- **Currency Risk tab** — entirely narrative reference cards (TCX Fund, IFC local-currency programme);
  no FX-hedging cost model.

### 7.6 Data provenance & limitations

- The grant-element and PV-saving formulas are **genuine, textbook-correct finance** — this is the
  one module in this batch where the calculation engine matches professional MDB loan-structuring
  practice, even though its inputs are illustrative sliders rather than live loan terms.
- The guide's Fiscal Space and Co-Financing Ratio metrics are **entirely absent** — no revenue,
  debt-service, or private-mobilisation field exists in the data model to support them (see §8).
- MDB reference table (`MDBS`) and country allocations are static, illustrative constants, not
  sourced from IMF Article IV, World Bank ARAP, or ADB PPIS as the guide's `dataLineage` claims.

**Framework alignment:** OECD DAC concessionality/grant-element methodology (implemented, flat 10%
discount-rate convention) · World Bank Sub-Sovereign Finance Guidelines and IFC Performance Standards
1–8 (referenced narratively, not computed) · MDB Paris Alignment Common Approach 2021 (named, not
scored).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Implement the guide's Fiscal Space and Co-Financing Ratio metrics so sub-sovereign lending decisions
(city, utility, SOE borrowers) can be screened for both *borrowing capacity* and *MDB catalytic
effect*, alongside the existing (and correct) grant-element/blended-rate calculator.

### 8.2 Conceptual approach
Fiscal space follows the **IMF Debt Sustainability Analysis (DSA)** framework used in Article IV
consultations — revenue capacity net of existing debt service against a sustainable coverage
threshold — the same approach BlackRock Aladdin's sovereign risk module and Moody's sub-sovereign
methodology use to bound incremental borrowing capacity.

### 8.3 Mathematical specification

```
FiscalSpace = Revenue × CoverageRatio_max − ExistingDebtService
   where CoverageRatio_max is the maximum sustainable debt-service-to-revenue ratio
   for the entity's rating/income class (IMF DSA thresholds, typically 20–35% for sub-sovereigns)

CoFinancingRatio = PrivateFinanceMobilised / MDBClimateFinanceCommitted
   (unbounded ratio; report distribution, not a single point estimate, per §8.6 below)
```

| Parameter | Calibration source |
|---|---|
| `CoverageRatio_max` by rating band | IMF DSA thresholds for market-access vs. PRGT-eligible sub-sovereigns |
| Revenue base | IMF Article IV fiscal tables (own-source revenue + intergovernmental transfers) |
| Private mobilisation attribution | OECD DAC causality-attributed mobilisation (same methodology as §8 of `mdb-climate-finance-dh`) |

### 8.4 Data requirements
Sub-sovereign entity financials (revenue, existing debt stock/service, credit rating) and MDB
project-level co-financing records — the guide's own `dataLineage` already names IMF Article IV and
MDB project databases (World Bank ARAP, ADB PPIS) as sources, but neither is wired into the platform's
`reference_data` layer today.

### 8.5 Validation & benchmarking plan
Cross-check `FiscalSpace` outputs against IMF's own published DSA fiscal-space classifications
(where available) for the same entities; benchmark `CoFinancingRatio` distribution against the World
Bank Group's stated 3× mobilisation target and CPI's system-wide averages.

### 8.6 Limitations & model risk
Sub-sovereign revenue and debt data quality varies enormously by jurisdiction (many EM municipalities
lack audited financials); the model should degrade gracefully to a qualitative fiscal-space tier
(Constrained/Moderate/Ample) when point-estimate inputs are unavailable, rather than presenting a
false-precision dollar figure — consistent with how the existing grant-element calculator already
correctly floors results at zero rather than allowing negative concessionality.
