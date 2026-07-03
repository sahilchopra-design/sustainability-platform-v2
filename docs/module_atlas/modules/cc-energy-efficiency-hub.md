# Energy Efficiency Carbon Credits Hub
**Module ID:** `cc-energy-efficiency-hub` · **Route:** `/cc-energy-efficiency-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Emission reduction quantification for industrial and building energy efficiency projects under IPMVP Option A/B/C/D measurement and verification protocols. Covers baseline setting, adjustment factors, and credit issuance under ISO 50001 and CDM AMS-II series.

> **Business value:** Verified ER = (adjusted baseline – project energy) × grid EF. Adjustment factors typically explain 70–90% of baseline variation in industrial applications.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUILDING_TYPES`, `Badge`, `CATEGORIES`, `CAT_COLORS`, `Card`, `DER_TYPES`, `DualInput`, `INDUSTRIAL_TYPES`, `Kpi`, `PROJECTS`, `Section`, `TIP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `DER_TYPES` | `['Rooftop Solar','Battery Storage','CHP System','Micro-Wind'];` |
| `subtype` | `cat===CATEGORIES[0]?BUILDING_TYPES[i%BUILDING_TYPES.length]:cat===CATEGORIES[1]?INDUSTRIAL_TYPES[(i-4)%INDUSTRIAL_TYPES.length]:DER_TYPES[(i-7)%DER_TY` |
| `capacity` | `Math.round(50+sr(i*7)*950);` |
| `opHours` | `Math.round(2000+sr(i*11)*6000);` |
| `blEff` | `parseFloat((0.50+sr(i*17)*0.30).toFixed(2));` |
| `pjEff` | `parseFloat((0.75+sr(i*19)*0.20).toFixed(2));` |
| `gridEF` | `parseFloat((0.3+sr(i*23)*0.7).toFixed(3));` |
| `blEnergy` | `Math.round(capacity*opHours*lf/blEff);` |
| `pjEnergy` | `Math.round(capacity*opHours*lf/pjEff);` |
| `savings` | `blEnergy-pjEnergy;` |
| `credits` | `Math.round(savings*gridEF*1e-3*0.92);` |
| `blEnergy` | `capacity*opHours*lf/blEff;` |
| `pjEnergy` | `capacity*opHours*lf/pjEff;` |
| `savingsPct` | `(1-pjEnergy/blEnergy)*100;` |
| `ratio` | `hddNormal/Math.max(hddActual,1);` |
| `adjusted` | `measured*ratio;` |
| `generation` | `derCapacity*derHours*derLF;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BUILDING_TYPES`, `CATEGORIES`, `DER_TYPES`, `INDUSTRIAL_TYPES`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Baseline Energy Intensity | `Regression vs production variable` | Utility metering | Energy per unit production in reference period |
| Adjustment Factors | `Regression coefficients` | IPMVP 2022 | Variables used to normalize baseline for changed conditions |
| Grid Emission Factor | `Regional annual average` | IEA Electricity EF database | Carbon intensity of grid electricity displaced by efficiency measures |
| Verified Savings | `Baseline – Project (adjusted)` | M&V report | Energy savings verified under selected IPMVP option |
- **Utility bills / smart meters** → Consumption data → baseline model → **Adjusted baseline kWh**
- **Grid operator data** → Regional EF → tCO₂ per MWh → **Verified ER tCO₂e**

## 5 · Intermediate Transformation Logic
**Methodology:** IPMVP M&V baseline-adjusted ER
**Headline formula:** `ER = (BaselineEnergy – ProjectEnergy) × EF_grid; BaselineAdj = Baseline × Σ(Adj_i)`
**Standards:** ['IPMVP 2022', 'CDM AMS-II.A/C/E', 'ISO 50001', 'GHG Protocol Scope 2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).