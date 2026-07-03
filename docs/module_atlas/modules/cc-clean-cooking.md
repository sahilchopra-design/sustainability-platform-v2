# Clean Cooking Carbon Credits
**Module ID:** `cc-clean-cooking` · **Route:** `/cc-clean-cooking` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Emission reduction quantification for clean cookstove projects under Gold Standard Metered Methodology and UNFCCC CDM AMS-II.G. Models baseline fuel consumption, stove efficiency, fNRB factors, and household monitoring protocols.

> **Business value:** Annual ER per household = (baseline – project fuel) × NCV × EF × fNRB. fNRB is the single largest uncertainty driver (CV ±15%).

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COUNTRIES_CC`, `Card`, `DualInput`, `Kpi`, `PROJECTS_CC`, `SDG_GOALS`, `Section`, `TECH_TYPES_CC`, `TIP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `stoves` | `Math.round(5000+sr(i*7)*95000);` |
| `adoption` | `parseFloat((0.60+sr(i*11)*0.35).toFixed(2));` |
| `fnrb` | `parseFloat((0.50+sr(i*13)*0.45).toFixed(2));` |
| `fuelKg` | `parseFloat((3.5+sr(i*17)*4.5).toFixed(1));` |
| `stackFactor` | `parseFloat((0.70+sr(i*19)*0.25).toFixed(2));` |
| `rebound` | `parseFloat((0.05+sr(i*23)*0.12).toFixed(2));` |
| `blFuel` | `fuelKg*365;` |
| `pjFuel` | `blFuel*(tech.baseline_eff/tech.project_eff)*stackFactor;` |
| `sdgScores` | `SDG_GOALS.map(g=>Math.round(40+sr(i*31+g.sdg*7)*55));` |
| `blFuelAnnual` | `fuelKg*365;` |
| `bePerHH` | `blFuelAnnual*ncv*ef*1e-6*fnrb;` |
| `pjFuelAnnual` | `blFuelAnnual*(blEff/pjEff)*stackFactor;` |
| `pjEmissions` | `pjFuelAnnual*ncv*ef*1e-6*fnrb;` |
| `erPerHH` | `bePerHH*(1-rebound)-pjEmissions;` |
| `totalER` | `erPerHH*stoves*adoption;` |
| `TABS` | `['Methodology Overview','Baseline Emissions Calculator','Emission Reductions','fNRB Assessment','SDG Co-Benefits','Usage Monitoring'];` |
| `fnrb` | `Math.min(1,Math.max(0,(fnrbDemand-fnrbSupply)/Math.max(fnrbDemand,1)));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_CC`, `SDG_GOALS`, `TABS`, `TECH_TYPES_CC`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| fNRB Factor | `Country-level WISDOM analysis` | Gold Standard fNRB tool | Fraction of wood fuel harvested unsustainably; drives net credit calculation |
| Baseline Fuel Use | `Kitchen Performance Test` | Field survey | Daily wood or charcoal consumption on traditional stove |
| Stove Efficiency Gain | `(FC_base – FC_proj) / FC_base` | Controlled Cooking Test | Efficiency improvement of improved cookstove vs baseline |
| Annual ER per HH | `ER_HH formula` | Model output | Verified emission reductions per household per year |
- **WISDOM database** → Country wood balance → fNRB → **Non-renewable fraction**
- **KPT field data** → Fuel weighing surveys → consumption rates → **Baseline and project fuel use**

## 5 · Intermediate Transformation Logic
**Methodology:** Gold Standard Metered Cookstove Methodology
**Headline formula:** `ER_HH = (FC_baseline – FC_project) × NCV × EF_fuelwood × fNRB`
**Standards:** ['Gold Standard Metered v2', 'CDM AMS-II.G', 'IPCC Tier 2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).