# Improved Forest Management Credits
**Module ID:** `cc-ifm-credits` · **Route:** `/cc-ifm-credits` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Carbon credit quantification for Improved Forest Management (IFM) projects including extended rotation, reduced harvest, and conservation easements under Verra VCS VM0010/VM0012 and Climate Action Reserve Forest Protocol.

> **Business value:** Net IFM credits = (project – baseline C stock) – leakage – buffer. Extended rotation projects typically yield 1.5–4 tCO₂e/ha/yr net.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `HARVEST_SCHEDULE`, `IFM_TYPES`, `Kpi`, `PROJECTS_IFM`, `Section`, `TIP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `bl_cs` | `initial_cs + annual_increment * t - harvest_rate_bl * t * cf;` |
| `pj_cs` | `initial_cs + annual_increment * t - harvest_rate_pj * t * cf;` |
| `cs_diff` | `(pj_cs - bl_cs); // tCO2e per ha difference` |
| `gross` | `Math.max(0, cs_diff * area_ha * (44/12));` |
| `mkt_leak` | `gross * (leakage_mkt_pct / 100);` |
| `act_leak` | `gross * (leakage_act_pct / 100);` |
| `total_leak` | `mkt_leak + act_leak;` |
| `after_leak` | `gross - total_leak;` |
| `buffer` | `after_leak * (buffer_pct / 100);` |
| `pre_unc` | `after_leak - buffer;` |
| `uncertainty_ded` | `pre_unc * (1 - uncertainty_factor); // VM0010: uncertainty deduction = (1 - UF)` |
| `net` | `Math.max(0, pre_unc - uncertainty_ded); // ≡ pre_unc × UF but expressed as explicit deduction` |
| `prior_cumulative` | `years.length > 0 ? years[years.length-1].cumulative : 0;` |
| `cumulative` | `prior_cumulative + net; // true running sum` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `IFM_TYPES`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Baseline C Stock | `Forest growth model` | Yield tables / FVS | Carbon stock under business-as-usual harvest schedule |
| Project C Stock | `Extended rotation model` | Verra VM0010 | Carbon stock under improved management regime |
| Leakage Belt | `Activity-shifting analysis` | VM0010 guidance | Geographic area within which harvest displacement leakage is assessed |
| Buffer Pool % | `Non-permanence risk rating` | CAR Forest Protocol | Share of gross credits withheld for reversal insurance |
- **Yield table / FVS model** → Growth equations → carbon stock → **tCO₂e/ha by year**
- **Activity-shifting model** → Leakage belt harvest data → leakage deduction → **Net IFM credits**

## 5 · Intermediate Transformation Logic
**Methodology:** VM0010 IFM baseline-project carbon stock difference
**Headline formula:** `ER = (C_project – C_baseline) – Leakage – BufferContribution`
**Standards:** ['Verra VCS VM0010 v1.3', 'VM0012 v1.2', 'CAR Forest Protocol v4', 'IPCC LULUCF']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).