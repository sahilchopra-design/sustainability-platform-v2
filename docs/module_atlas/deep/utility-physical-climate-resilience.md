## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry lists four formulas — `AAEL`,
> `Hardening_ROI`, `Insurance_Gap`, `Adaptation_BCR`, `SAIDI_Improvement`. Only **one** of the five,
> `AAEL = RAV × AEP_Loss_Pct / 100`, is actually computed in code. `Insurance_Gap` is computed too
> (`RAV × (1 − coverage)`), but the other three — `Hardening_ROI`, `Adaptation_BCR`, and the SAIDI
> before/after improvement — are **hardcoded per-row attributes** (`adaptation_roi`, `bcr`,
> `saidi_before/after`) baked into the seed arrays, not derived from the stated formulas anywhere in
> the component. The sections below separate what is genuinely calculated from what is display-only.

### 7.1 What the module computes

For 15 named utility assets (substations, gas infrastructure, hydro, water treatment, offshore wind,
solar, nuclear, control centres), two portfolio KPIs are genuinely derived from per-asset primitives:

```js
AAEL_portfolio  = Σ(rav_i × aep_loss_pct_i / 100) / 1000        // $Bn, "Portfolio AAEL" KPI
InsGap_avg      = Σ(1 − insurance_coverage_i) / 15 × 100          // %, "Avg Insurance Gap" KPI
InsGap_i        = rav_i × (1 − insurance_coverage_i)              // per-asset gap, $M (INSURANCE_GAP table)
totalRAV        = Σ rav_i ;  totalHardening = Σ hardening_capex_i
```

Everything else displayed per asset — `hardening_capex`, `insurance_coverage`, `saidi_impact`,
`adaptation_roi`, `rcp45_loss`, `rcp85_loss` — is a **fixed attribute set by the author** for each of
the 15 named assets (e.g. Coastal Transmission Substation A: `rav=$85M`, `flood_risk=0.82`,
`adaptation_roi=2.8×`), not a function of the five multi-peril risk scores.

### 7.2 Parameterisation

| Field | Range across the 15 assets | Provenance |
|---|---|---|
| `rav` (regulatory asset value) | $28M – $4,200M (nuclear outlier) | Author-assigned per named asset |
| Peril scores (flood/heat/wind/wildfire/ice) | 0.02 – 0.96 | Author-assigned, plausible by asset type/region (e.g. Mojave solar `heat_risk=0.96`) |
| `insurance_coverage` | 0.55 – 0.95 | Author-assigned; nuclear highest (0.95), UK pipeline lowest (0.55) |
| `adaptation_roi` | 1.6× – 5.8× | Author-assigned "×" multiple, not derived from `HARDENING_MEASURES.risk_reduction/payback_yrs` |
| `HARDENING_MEASURES.risk_reduction` | 58% – 92% | Static table, 10 interventions, independent of the 15-asset universe |
| `SAIDI_IMPROVEMENT.bcr` | 2.8× – 5.2× | Static table, matches guide's cited EPRI 2.4–5.8× range but not computed from `cost`/`saidi_before-after` |

### 7.3 Calculation walkthrough

1. **Asset Universe tab** renders `ASSETS` directly with colour-coded thresholds (peril `>0.7` red,
   `>0.45` amber) — pure display logic, no aggregation.
2. **Physical Risk Map tab** — `PERIL_RADAR` averages each of the 5 peril scores across all 15 assets
   (`Σ score_i / 15 × 100`) for the portfolio radar; selecting an asset swaps in its own row.
3. **Hardening Economics tab** — lists the 10 `HARDENING_MEASURES` sorted/filtered by
   `risk_reduction`, `payback_yrs`, and an `ercot_credit` boolean flag; no linkage back to which of
   the 15 assets would receive each measure.
4. **Loss Trajectory tab** — `LOSS_TIMELINE` (2025–2044) plots RCP 2.6/4.5/8.5 and an "insured" loss
   series that grow via `base + i·slope + sr(seed)·noise` — an illustrative monotonically-rising
   curve, not a peril-conditioned catastrophe model.
5. **Insurance Gap tab** — `INSURANCE_GAP` (built from the first 8 `ASSETS`) shows `total_exposure`,
   `insured = round(rav × coverage)`, `gap = round(rav × (1−coverage))`, `gap_pct`.
6. **SAIDI/Reliability tab** — `SAIDI_IMPROVEMENT` bar/scatter (before vs after, cost vs BCR) is a
   static 6-row table entirely independent of the 15-asset SAIDI impact field.
7. **Adaptation Finance tab** — six named instrument templates (Green UoP Bond, SLB, ERCOT
   securitisation, FEMA BRIC grant, resilience cat bond, IFC/WB loan) with fixed size/tenor/rate —
   illustrative deal comps, not computed from portfolio hardening need.

### 7.4 Worked example

Coastal Gas Terminal I: `rav = $520M`, `aep_loss_pct = 4.8%`, `insurance_coverage = 0.72`.

| Step | Computation | Result |
|---|---|---|
| AAEL (this asset) | 520 × 4.8 / 100 | **$24.96M/yr** |
| Insurance gap $ | 520 × (1 − 0.72) | **$145.6M** |
| Insurance gap % | (1 − 0.72) × 100 | **28%** |
| RCP 8.5 loss (2044, illustrative) | `rcp85_loss` field | **12.4%** (static, not derived from AAEL) |

Portfolio AAEL (all 15 assets) sums to the "$X.XB" KPI — with the $4.2Bn nuclear RAV at only 0.8%
AEP loss contributing $33.6M, comparable in magnitude to the $520M gas terminal's $25M despite being
8× the asset value, because AAEL is loss-rate-driven, not RAV-driven.

### 7.5 Data provenance & limitations

- **All 15 assets, the 10 hardening measures, the SAIDI table, and the 6 finance instruments are
  synthetic/illustrative** — author-curated point values, not sourced from an actual utility asset
  register, EPRI cost-effectiveness study, or live bond pricing feed, despite plausible calibration
  to the guide's cited ranges (EPRI BCR 2.4–5.8×, Lloyd's 32% insurance gap).
- Only `AAEL` and `Insurance_Gap` are formulaically derived; `Hardening_ROI`, `Adaptation_BCR`, and
  SAIDI improvement are **not computed from the AAEL-before/AAEL-after difference the guide's formula
  implies** — they are independent hardcoded fields, so changing `hardening_capex` for an asset does
  not move its displayed `adaptation_roi`.
- No peril-specific damage function (Jensen wind-loss curve, FEMA HAZUS flood-depth-damage curve,
  etc.) underlies the loss trajectory — RCP curves are smoothed random-walk illustrations.
- No linkage between the 10 generic hardening measures and the 15 specific assets — a production
  tool would need an asset-to-measure applicability matrix.

**Framework alignment:** NERC CIP-014 (named, physical security standard — not implemented as a
compliance check) · IPCC AR6 Ch.6 adaptation-limits framing (RCP labels only) · Swiss Re thermal-
stress research (cited as `brief`, not wired into `heat_risk`) · EU Taxonomy Art. 10 climate
adaptation (named in Key Frameworks panel, descriptive only).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production Grid Hardening Investment model would let a utility CFO or infrastructure lender size
and prioritise capex across a real asset register, answering: which hardening measures at which
sites maximise avoided AAEL per dollar, and what SAIDI/insurance-premium benefit follows. Scope:
transmission, generation, gas and water utility assets with multi-peril physical exposure.

### 8.2 Conceptual approach
Combine (1) **catastrophe-model-style average annual loss (AAL)** estimation per FEMA HAZUS / RMS
methodology — hazard intensity × exposure × vulnerability (damage) function, aggregated over a
peril-frequency distribution — with (2) **EPRI Grid Resilience Investment Framework** benefit-cost
ranking, which nets avoided AAL and avoided customer-minutes-lost against measure capex. Benchmark:
Moody's RMS North Atlantic Hurricane Model for peril severity curves; EPRI's public BCR framework for
measure ranking (this platform's own cited source, currently unimplemented).

### 8.3 Mathematical specification

```
AAL_i,peril   = Σ_k P(intensity_k) · DamageFn_peril(intensity_k) · RAV_i      // per asset, per peril
AAL_i         = Σ_peril AAL_i,peril  (with peril-correlation adjustment, not simple sum, if compound events matter)
AAL_after_i,m = AAL_i · (1 − RiskReduction_m)                                 // after hardening measure m
NPV_avoided_i,m = Σ_{t=1..T} (AAL_i − AAL_after_i,m) / (1+r)^t
BCR_i,m       = NPV_avoided_i,m / Capex_m
SAIDI_Δ_i,m   = (SAIDI_before_i − SAIDI_after_i,m) · CustomerMinutesValue     // $ reliability benefit
InsGapValue_i = RAV_i · (1 − Coverage_i) · P(loss > deductible)              // risk-adjusted, not flat
```

| Parameter | Calibration source |
|---|---|
| `DamageFn_peril` (vulnerability curves) | FEMA HAZUS depth-damage functions (flood); NOAA/ASCE 7 wind-damage curves |
| `P(intensity_k)` | NOAA Atlas 14 (flood), ASCE 7-22 wind maps, NIFC wildfire probability layers |
| Discount rate `r` | Utility regulatory WACC (Ofgem/FERC allowed return), typically 5–7% real |
| `RiskReduction_m` per measure | EPRI Grid Resilience Investment Framework 2022 (public) |
| `CustomerMinutesValue` | Regulator-published VoLL (Value of Lost Load), e.g. Ofgem CDCM |

### 8.4 Data requirements
Real asset register with geocodes (for hazard-layer intersection), FEMA/NOAA/ASCE hazard raster
data (public), EPRI measure cost-effectiveness table (licensed), utility SAIDI/SAIFI regulatory
filings (public via PUC dockets), and bond/insurance market pricing feeds. The platform's existing
`ASSETS`/`HARDENING_MEASURES` schemas are directly reusable containers once populated from real
sources; `reference_data` tables would need new `hazard_layers` and `epri_measures` entries.

### 8.5 Validation & benchmarking plan
Backtest AAL estimates against realised storm losses (e.g. Winter Storm Uri, Hurricane Ian) for
comparable asset classes; reconcile against RMS/Verisk cat-model outputs where licensed; sensitivity-
test BCR ranking stability under ±20% hazard-frequency perturbation (NGFS-style scenario stress).

### 8.6 Limitations & model risk
Compound/cascading perils (e.g. flood-triggered grid failure amplifying heat-stress outages) are not
captured by a peril-additive AAL sum — a production model needs a correlation/copula structure for
tail events. Vulnerability curves are asset-type generic; site-specific engineering assessment
(structural condition, elevation) should override generic curves where available, with the generic
curve as a conservative fallback.
