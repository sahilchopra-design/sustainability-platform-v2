# ARR Reforestation Credits
**Module ID:** `cc-arr-reforestation` · **Route:** `/cc-arr-reforestation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Afforestation, reforestation, and revegetation (ARR) carbon credit methodology engine. Models baseline carbon stocks, additionality tests, permanence buffers, leakage deductions, and net removal credits under Verra VCS VM0047 and Gold Standard LR.

> **Business value:** Net tradeable ARR credits = gross removal × (1–leakage) × (1–buffer). Buffer typically reduces gross credits by 15–25%.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CARBON_POOLS`, `Card`, `DualInput`, `Kpi`, `METHODOLOGIES`, `PROJECTS`, `SENS_PARAMS`, `Section`, `TIP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `biomassGrowth` | `(t, max_agb, k, p) => max_agb * Math.pow(1 - Math.exp(-k * t), p);` |
| `carbon_stock` | `total_biomass * cf * (44 / 12); // tCO2e per ha` |
| `project_cs` | `carbon_stock * area_ha;` |
| `baseline_total` | `baseline_cs * area_ha;` |
| `gross` | `Math.max(0, project_cs - baseline_total);` |
| `leakage` | `gross * (leakage_pct / 100);` |
| `after_leakage` | `gross - leakage;` |
| `buffer` | `after_leakage * (buffer_pct / 100);` |
| `after_buffer` | `after_leakage - buffer;` |
| `uncertainty_ded` | `after_buffer * (uncertainty_pct / 100);` |
| `net` | `Math.max(0, after_buffer - uncertainty_ded);` |
| `prior_cumulative` | `years[t - 2]?.cumulative_net \|\| 0;` |
| `cumulative_net` | `prior_cumulative + net;` |
| `total_net` | `years.length > 0 ? years[years.length - 1].cumulative_net : 0;` |
| `area` | `Math.round(5000 + sr(i * 7) * 95000);` |
| `credits` | `Math.round(area * (8 + sr(i * 11) * 12) * (15 + sr(i * 13) * 15));` |
| `species` | `['Mixed tropical','Eucalyptus+native','Teak+mahogany','Acacia+native','Mixed Atlantic Forest','Mangrove+upland','Afromontane','Dry deciduous','Pine+br` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_POOLS`, `METHODOLOGIES`, `SENS_PARAMS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Gross Removal | `(AGC + BGC + SOC) × Area` | Field measurement + allometric | Above-ground, below-ground, and soil organic carbon increments |
| Leakage Deduction | `Activity-shifting + market leakage` | VM0047 guidance | Emission displacement outside project boundary |
| Buffer Pool % | `Non-permanence risk rating` | Verra AFOLU NPR tool | Proportion withheld in buffer to cover reversal risk |
| Net Credit Yield | `Gross × (1–Leakage) × (1–Buffer)` | Model output | Tradeable verified carbon units per hectare per year |
- **Field biomass plots** → Allometric equations → carbon stock → **Gross removal tCO₂/ha**
- **VM0047 risk tool** → Non-permanence score → buffer % → **Buffer-adjusted net credits**

## 5 · Intermediate Transformation Logic
**Methodology:** VCS VM0047 ARR Net Removal Accounting
**Headline formula:** `NetCredits = (ProjectCarbon – BaselineCarbon) × (1 – LeakagePct) × (1 – BufferPct)`
**Standards:** ['Verra VM0047', 'Gold Standard LR v2', 'IPCC GPG LULUCF']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).