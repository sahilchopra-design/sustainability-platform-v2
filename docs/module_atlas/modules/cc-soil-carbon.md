# Soil Carbon Sequestration Credits
**Module ID:** `cc-soil-carbon` · **Route:** `/cc-soil-carbon` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Soil organic carbon (SOC) credit quantification for agricultural soil carbon projects under Verra VCS VM0042, Indigo Ag Protocol, and Soil Carbon Initiative. Models SOC change via IPCC Tier 2 stock-difference method, sampling design, permanence, and additionality.

> **Business value:** Net soil C credits = ΔSOC × area × 44/12 – leakage – buffer. Buffer typically 20–30% of gross. Typical yields: no-till 0.2–0.5 tCO₂e/ha/yr; compost + cover crops 0.5–1.5 tCO₂e/ha/yr.

**How an analyst works this module:**
- Select practice: no-till, cover crops, compost, agroforestry
- Baseline Sampling tab inputs t1 SOC measurements
- Verification tab inputs t2 measurements and computes ΔSOC
- Uncertainty tab applies statistical buffer calculation
- Credit Schedule shows issuance after buffer deduction

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `Kpi`, `PRACTICES`, `PROJECTS`, `REGIONS`, `STRATA`, `Section`, `TIP`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PRACTICES` | 11 | `name`, `desc`, `soc_rates`, `Temperate`, `Tropical`, `Boreal`, `Arid`, `Mediterranean` |
| `STRATA` | 6 | `area_pct`, `soil`, `texture`, `depth`, `soc_pct`, `bd` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `delta_soc` | `Math.max(0, project_soc - baseline_soc);` |
| `gross` | `delta_soc * area_ha * (44/12);` |
| `after_leakage` | `gross * (1 - leakage_pct/100);` |
| `after_buffer` | `after_leakage * (1 - buffer_pct/100);` |
| `net` | `after_buffer * (1 - uncertainty_pct/100);` |
| `cum_gross` | `gross * frac;` |
| `sampleN` | `useMemo(() => calcSampleSize(sVariance, sConfidence, sMargin), [sVariance, sConfidence, sMargin]);  const practiceChartData = useMemo(() => PRACTICES.map(p => ({ name: p.name, rate: p.soc_rates[compRegion], cost: p.cost_per_ha, })), [compRegion]);` |
| `strataCalc` | `useMemo(() => STRATA.map(s => ({` |
| `avgSOCGain` | `useMemo(() => { const gains = PROJECTS.map(p=>p.project_soc - p.baseline_soc);` |
| `pts` | `Math.ceil(sampleN * s.area_pct / 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PRACTICES`, `REGIONS`, `STRATA`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SOC Stock (t1) | `Lab analysis of soil cores` | MAOM + POC fractions | Baseline soil organic carbon stock measured at project start |
| SOC Stock (t2) | `Lab analysis at verification` | Certified lab | Project soil organic carbon stock at first verification event |
| Sampling Uncertainty | `Coefficient of variation across plots` | Stratified random sampling | Statistical uncertainty used to set buffer pool contribution |
| Permanence Buffer | `Non-permanence risk tool` | Verra AFOLU NPR | Share of gross credits withheld for reversal insurance |
- **Soil core lab analysis** → Bulk density × C% → tC/ha → **SOC stock per stratum**
- **Stratified random design** → Plot measurements → CV → **Sampling uncertainty buffer**

## 5 · Intermediate Transformation Logic
**Methodology:** IPCC Tier 2 stock-difference SOC change
**Headline formula:** `DSOC = (SOC_t2 – SOC_t1) / T × Area × (44/12); Net = DSOC – Leakage – Buffer`

SOC stock measured at t1 (baseline) and t2 (verification) via stratified random soil sampling to 30cm depth. Stock-difference method: ΔSOC/yr = (SOC_t2–SOC_t1)/T. Carbon fraction: multiply by 44/12 to convert C to CO₂. Sampling uncertainty drives buffer deduction (typically 20–30%). Permanence horizon: 100 years; practice reversal risk assessed via farming system stability score. Additionality: practice not common in region (common practice test).

**Standards:** ['Verra VCS VM0042', 'Indigo Ag Soil Carbon Protocol', 'IPCC 2019 Agriculture Ch.2', 'ISO 14064-2']
**Reference documents:** Verra VCS VM0042 v1.0 Soil Carbon; Indigo Ag Soil Carbon Protocol v2.1; IPCC 2019 Refinement Agriculture Ch.2; ISO 14064-2:2019 Project GHG Quantification

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Statistically honest ΔSOC with sampling-driven crediting (analytics ladder: rung 1 → 3)

**What.** §7 confirms a faithful Tier 2 stock-difference implementation: real stock
equation (`%C · BD · depth`), a genuine Cochran sample-size formula, and stacked
leakage/buffer/uncertainty deductions. The honest gaps: ΔSOC is a point difference of
two user-typed stocks with `max(0, …)` clamping, credits are spread linearly over the
crediting period, and the flat `uncertainty%` input is disconnected from the Cochran
machinery the page already ships. Evolution A closes the loop: sampling variance from
the stratified design (the 6-stratum `STRATA` table has per-stratum SOC% and bulk
density) propagates into a confidence interval on ΔSOC, and the credited amount becomes
the VM0042-style lower confidence bound rather than the point estimate minus a flat
percentage.

**How.** (1) Per-stratum variance → area-weighted portfolio variance → t-distribution
CI on ΔSOC; the uncertainty deduction becomes `(mean − LCB)/mean`, computed not typed.
(2) Practice-rate priors: the 11-practice × 5-climate `PRACTICES` matrix checked
against published meta-analyses (the §5 reference list's IPCC 2019 Ch.2 defaults) with
sources displayed. (3) Nonlinear accrual option (SOC approaches a new equilibrium —
saturating curve) replacing the linear `cum_net(t) = net·t/years` spread.

**Prerequisites.** The t1/t2 measurement workflow needs persisted sample data (first
backend table for this module) or clearly-labelled fixture campaigns. **Acceptance:**
doubling sample count per stratum measurably shrinks the deduction; a fixture with
known stratum variances reproduces a hand-computed 90% LCB.

### 9.2 Evolution B — Sampling-design copilot (LLM tier 1 → 2)

**What.** A copilot for the module's genuinely statistical questions: "how many samples
do I need for ±10% at 90% confidence?" (the page's real Cochran formula), "why did my
buffer deduction eat 25% of gross?", "which practice fits a tropical arid site?" (the
`PRACTICES` climate columns). Tier-2 what-ifs re-invoke `calcSOC_BL`, `calcCredits`,
and the sample-size function client-side — no backend routes exist today.

**How.** Tier 1: atlas §5/§7 corpus plus live inputs; deduction-stack explanations
walk gross → leakage → buffer → uncertainty in the code's actual multiplicative order
(§7 shows sequential `(1−x)` factors, not additive subtraction — a real nuance worth
narrating correctly). Tier 2: tool schemas over the three calculators with the
no-fabrication validator.

**Prerequisites.** None hard — guide and code agree per §7 (the only nuance is
annualised-vs-total ΔSOC notation, which the copilot should state plainly).
**Acceptance:** a sample-size answer matches the Cochran function's return for the
stated CV and precision; practice-rate claims cite the seed matrix and its source
status.