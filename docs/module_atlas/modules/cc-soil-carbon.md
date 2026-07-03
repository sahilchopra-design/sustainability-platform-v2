# Soil Carbon Sequestration Credits
**Module ID:** `cc-soil-carbon` · **Route:** `/cc-soil-carbon` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Soil organic carbon (SOC) credit quantification for agricultural soil carbon projects under Verra VCS VM0042, Indigo Ag Protocol, and Soil Carbon Initiative. Models SOC change via IPCC Tier 2 stock-difference method, sampling design, permanence, and additionality.

> **Business value:** Net soil C credits = ΔSOC × area × 44/12 – leakage – buffer. Buffer typically 20–30% of gross. Typical yields: no-till 0.2–0.5 tCO₂e/ha/yr; compost + cover crops 0.5–1.5 tCO₂e/ha/yr.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `Kpi`, `PRACTICES`, `PROJECTS`, `REGIONS`, `STRATA`, `Section`, `TIP`, `TabBar`

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
| `practiceChartData` | `useMemo(() => PRACTICES.map(p => ({` |
| `strataCalc` | `useMemo(() => STRATA.map(s => ({` |
| `gains` | `PROJECTS.map(p=>p.project_soc - p.baseline_soc);` |
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
**Standards:** ['Verra VCS VM0042', 'Indigo Ag Soil Carbon Protocol', 'IPCC 2019 Agriculture Ch.2', 'ISO 14064-2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).