## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (EP-CD3) is **accurate in scope**: the code implements a GHG
Protocol-style Scope 1/2/3 comparison for exactly the 4 companies the guide names (Microsoft,
BP, Apple, Unilever). One nuance: the guide's formula `Intensity = Total / Revenue` is *not
computed* in code — `intensity_rev` and `intensity_fte` are stored seed fields, and the "SBTi
trajectory" is a stored per-company array, not a derived pathway. No mismatch blockquote is
warranted, but the guide overstates the amount of live calculation.

### 7.1 What the module computes

Only three quantities are derived at runtime; everything else is seed-table display:

```
totalS123     = scope1 + scope2_mkt + scope3                    // market-based total
scope3Pct     = totalS123 > 0 ? scope3 / totalS123 × 100 : 0     // Scope 3 dominance
reduction2030 = (actual_2023 − target_2030) / actual_2023 × 100  // required cut vs 2023 base
```

Note the total uses **market-based Scope 2** (`scope2_mkt`), per GHG Protocol Scope 2 Guidance
dual-reporting convention; the location-based figure (`scope2_loc`) is carried in the data but
not summed.

### 7.2 Seed dataset (per company, MtCO₂e)

| Company | S1 | S2 mkt | S2 loc | S3 | Dominant S3 category | Intensity (t/$M) | SBTi |
|---|---|---|---|---|---|---|---|
| Microsoft | 0.15 | 0.00 | 0.68 | 13.8 | Cat 11 Use of Products 8.2 | 28.4 | ✓ |
| BP plc | 48.2 | 3.8 | 4.2 | 360.0 | Cat 11 354.0 (98% of S3) | 1,480 | ✗ |
| Apple | 0.061 | 0.00 | 0.58 | 20.6 | Cat 11 14.8 | 51.8 | ✓ |
| Unilever | 1.42 | 0.38 | 0.58 | 59.8 | Cat 1 Purchased Goods 42.8 | 820 | ✓ |

Values are hard-coded but directionally consistent with the companies' FY2023 CDP/annual-report
disclosures (e.g. Microsoft's zero market-based Scope 2 via 100% renewable procurement; BP's
Scope 3 dominated by use of sold products ~360 Mt). Trajectories carry `actual` points 2019–2023
plus `target` points for 2025/2030. `SCOPE3_CATS_META` tags 7 of the GHG Protocol's 15 Scope 3
categories with typical materiality (High/Medium/Low).

### 7.3 Calculation walkthrough

1. Company selector sets `co`; KPI cards render S1, S2(mkt), S3, and `totalS123` with
   `scope3Pct` as the Scope 3 share caption.
2. Tab 1 renders `co.s3_cats` as a horizontal bar chart (disclosed material categories only —
   not all 15).
3. Tab 2 sorts all four companies ascending by stored `intensity_rev` (tCO₂e/$M revenue) —
   labelled as a WACI-style benchmark, but no portfolio weighting occurs.
4. Tab 3 computes `reduction2030` per company and renders a **hard-coded "~30% progress toward
   2030 target" bar** (width fixed at 30% for every company — a display placeholder, not a
   calculation).
5. Tab 4 stacks S1/S2mkt/S3 across the peer set.

### 7.4 Worked example (BP, Reduction Pathways tab)

| Step | Computation | Result |
|---|---|---|
| 2023 base | trajectory.find(2023).actual | 412 MtCO₂e |
| 2030 target | trajectory.find(2030).target | 290 MtCO₂e |
| Required reduction | (412 − 290)/412 × 100 | **30%** |
| Total S1+S2mkt+S3 | 48.2 + 3.8 + 360.0 | **412.0 MtCO₂e** |
| Scope 3 share | 360/412 × 100 | **87.4%** |

The identity `total ≈ 2023 trajectory actual` holds for BP by construction of the seeds.

### 7.5 Data provenance & limitations

- All company data are **static seeds** (no `sr()` PRNG here) resembling public FY2023
  disclosures; they will drift stale and carry no vintage metadata.
- The module fetches nothing from the mapped backend (`carbon_calculator.py`,
  `/api/v1/carbon/*` routes are wired in the atlas but unused by the page).
- Progress bars (30%) are cosmetic; intensity is not recomputed from revenue; there is no
  location- vs market-based toggle; only 7 of 15 Scope 3 categories appear.
- Peer set of 4 is too small for the "sector average" benchmarking the guide implies.

**Framework alignment:** GHG Protocol Corporate Standard (scope definitions; market-based S2 per
the Scope 2 Guidance) · GHG Protocol Scope 3 Standard (15-category taxonomy; module shows the
material subset) · SBTi Corporate Net-Zero Standard — the ✓/✗ flag mirrors SBTi validation status;
SBTi requires 1.5 °C-aligned near-term targets (~4.2%/yr linear reduction for S1+2) which the
stored 2030 targets loosely approximate · CDP climate questionnaire as the implied disclosure
source.

## 8 · Model Specification — SBTi Pathway & Temperature-Alignment Engine

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Replace stored trajectories and the fixed 30% progress bar with a
computed target-pathway engine: required pathway, actual progress, and an implied temperature
rise (ITR) per company — supporting analyst screening of climate ambition for any issuer set.

**8.2 Conceptual approach.** Two complementary methods, both industry standard: (i) **absolute
contraction** pathway per SBTi Corporate Net-Zero Standard v1.2 (−4.2%/yr for 1.5 °C S1+2;
−2.5%/yr minimum for well-below-2 °C S3); (ii) **implied temperature rise** via linear
regression of ambition gap onto warming, per the CDP-WWF temperature-rating methodology used by
MSCI ITR and SBTi's own portfolio guidance.

**8.3 Mathematical specification.**

```
Pathway_t        = E_base × (1 − r)^(t − t_base),   r = 4.2% (1.5°C, S1+2), 2.5% (WB2C, S3)
Progress%        = (E_base − E_latest) / (E_base − Pathway_latest) × 100     // replaces the 30% stub
CAGR_target      = (E_target / E_base)^(1/(t_target − t_base)) − 1
ITR (CDP-WWF)    = T_base + β × (CAGR_target − CAGR_1.5°C)                    // T_base=1.5, β≈scoring slope per horizon
Intensity_t      = E_t / Revenue_t                                            // computed, not stored
```

| Parameter | Value / source |
|---|---|
| r (1.5 °C absolute contraction) | 4.2%/yr — SBTi Corporate Manual v2 |
| CDP-WWF slope β, default scores | CDP-WWF Temperature Rating Methodology (2020, public) |
| Sector decarbonisation (SDA) pathways for O&G, utilities | IEA NZE 2050 / SBTi SDA tools |
| Company E, revenue | CDP responses, annual reports; free: company sustainability reports + SBTi target dashboard (SBTi data already ingested in platform `reference_data`) |

**8.4 Data requirements.** Base-year and latest S1/S2(mkt & loc)/S3 by category, revenue, FTEs,
target metadata (scope coverage, % reduction, target year, SBTi status). Platform assets: SBTi
companies table in `reference_data`; `useReferenceData` hook for frontend wiring.

**8.5 Validation & benchmarking.** Reconcile computed ITR against published MSCI ITR /
CDP temperature ratings for the 4 seed names (tolerance ±0.3 °C); backtest Progress% against
five years of disclosed actuals; stability test: ±10% revenue restatement must move intensity
but not the SBTi pass/fail flag.

**8.6 Limitations & model risk.** ITR methods diverge widely across vendors (documented spread
>1 °C for the same firm); Scope 3 data quality is poor (PCAF DQ 4–5 typical); absolute
contraction ignores sector heterogeneity — use SDA for high-intensity sectors. Conservative
fallback: when targets are unvalidated, score as "no target" (ITR 3.2 °C default per CDP-WWF).
