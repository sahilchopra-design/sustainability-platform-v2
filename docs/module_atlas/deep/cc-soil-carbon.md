## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is faithful: the code implements the IPCC Tier 2 **stock-difference** SOC
method, a bulk-density × carbon% × depth stock calculation, a Cochran statistical **sample-size**
formula, and stacked leakage/buffer/uncertainty deductions. One notational detail: the guide's
`ΔSOC/yr = (SOC_t2−SOC_t1)/T` divides by time T; the code computes a total ΔSOC (project − baseline
stock) and spreads it linearly over crediting years rather than treating the inputs as annualised —
functionally similar, documented below.

### 7.1 What the module computes

**SOC stock** (`calcSOC_BL`) — the standard stock equation:
```
SOC (tC/ha) = conc_pct · bulk_density · depth_cm · 100/100    // = %C · BD · depth
```
(The `·100/100` is a no-op; the effective formula is `%C · BD(g/cm³) · depth(cm)`, giving tC/ha.)

**Credits** (`calcCredits`):
```
ΔSOC        = max(0, project_soc − baseline_soc)      // tC/ha
gross       = ΔSOC · area_ha · (44/12)                // C→CO2
after_leak  = gross · (1 − leakage%/100)
after_buf   = after_leak · (1 − buffer%/100)
net         = after_buf · (1 − uncertainty%/100)
```
Cumulative credits are spread linearly: `cum_net(t) = net · t/crediting_yrs`.

**Sample size** (`calcSampleSize`) — Cochran's formula:
```
n = ceil( z² · variance / margin² ),   z = {90:1.645, 95:1.96, 99:2.576}
```

### 7.2 Parameterisation / scoring rubric

| Parameter | Value | Provenance |
|---|---|---|
| Carbon→CO₂ | 44/12 | Exact molar ratio |
| SOC accrual rates (tC/ha/yr) | No-Till 0.15–0.4, Cover Crops 0.2–0.5, Compost 0.35–0.8, Biochar 0.5–1.2, Regen Grazing 0.25–0.6 (by climate) | `PRACTICES` — IPCC/literature-consistent, uncited |
| Practice cost/ha | $35–280 | `PRACTICES` — Biochar highest |
| z-scores | 1.645 / 1.96 / 2.576 | Standard normal critical values (90/95/99%) |
| Strata (soil, texture, %C, BD) | 5 zones, %C 1.0–3.2, BD 1.15–1.40 | `STRATA` — soil-taxonomy-consistent demo |
| Leakage / buffer / uncertainty | UI-set (buffer typically 20–30%) | Verra AFOLU NPR |

The 8 `PROJECTS` (area, baseline_soc, project_soc, credits) are **synthetic** (`sr()` PRNG).

### 7.3 Calculation walkthrough

The baseline calculator turns %C, bulk density and depth into a per-hectare SOC stock. The credit
calculator differences project vs baseline SOC (flooring at zero), scales by area and 44/12, then
applies the three sequential deductions to net credits, with a waterfall chart. The sampling-design
tab uses Cochran's n for a target margin/confidence and allocates points to strata by area share
(`pts = ceil(n · area_pct/100)`). Practice comparison plots per-region SOC rate vs cost/ha.

### 7.4 Worked example (compost, temperate)

Baseline %C=2.0 → `SOC_bl = 2.0·1.25·30 = 75 tC/ha`. Project after compost adds Δ%C to give
`project_soc = 80 tC/ha` (Δ = 5 tC/ha across the measurement interval). Area 10,000 ha,
leakage=5%, buffer=25%, uncertainty=15%.

| Step | Computation | Result |
|---|---|---|
| ΔSOC | 80 − 75 | 5 tC/ha |
| Gross | 5·10,000·(44/12) | 183,333 tCO₂e |
| After leakage (5%) | 183,333·0.95 | 174,167 |
| After buffer (25%) | 174,167·0.75 | 130,625 |
| Net (uncertainty 15%) | 130,625·0.85 | **≈ 111,031 tCO₂e** |

Net/gross = 61% after the three haircuts. Sample size for variance=0.25, 95% CI, margin=0.1:
`n = ceil(1.96²·0.25/0.1²) = ceil(96.04) = 97` cores — a realistic soil-sampling burden.

### 7.5 Data provenance & limitations
- Portfolio and strata rows are **synthetic seeded/hard-coded demo data**; calculator inputs user-set.
- ΔSOC is treated as a level difference spread linearly, not a measured t1→t2 rate over an explicit
  interval; no re-measurement/re-verification cadence modelled.
- No SOC saturation/sink-reversal dynamics (SOC accrual decelerates toward equilibrium); buffer is a
  flat percentage rather than a data-driven non-permanence risk score.
- Sample-size uses a single global variance, not stratum-specific variance (stratified Cochran).

**Framework alignment:** **Verra VM0042** (improved agricultural land management) and **IPCC 2019
Refinement Agriculture Ch.2** — the stock-difference SOC quantification with 44/12 conversion is their
core. **ISO 14064-2** governs the project-level quantification and uncertainty treatment; the Cochran
sample-size and buffer deduction reflect Verra's AFOLU Non-Permanence Risk Tool and monitoring
uncertainty requirements. **Indigo Ag / Soil Carbon Initiative** are the commercial protocol analogues.
