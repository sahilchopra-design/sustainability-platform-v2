# REDD+ & Wetlands Carbon Hub
**Module ID:** `cc-redd-wetlands-hub` · **Route:** `/cc-redd-wetlands-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated hub for REDD+ avoided deforestation and wetland carbon (blue carbon) projects. Covers Verra VCS JNR jurisdiction-level REDD+, ART TREES crediting, and VM0033 tidal wetland restoration with methane co-assessment.

> **Business value:** REDD+ ER = (reference level – project emissions) × (1–uncertainty) – leakage. Wetland projects add soil C accumulation minus CH₄ penalty. Combined nature-based projects often achieve 5–15 tCO₂e/ha/yr.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLUE_CARBON`, `Badge`, `Card`, `DualInput`, `GWP_AR5`, `GWP_AR6`, `HUB_PROJECTS`, `Kpi`, `PIE_COLORS`, `RISK_FACTORS`, `Section`, `TIP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `bdr` | `bdr_pct / 100;` |
| `deforested` | `remaining * bdr;` |
| `baseline_emissions` | `deforested * (cs_forest - cs_post) * (44/12);` |
| `leak_act` | `Math.round(gross * leakage_act_pct / 100); // Activity-shifting leakage` |
| `leak_mkt` | `Math.round(gross * leakage_mkt_pct / 100); // Market leakage (timber substitution)` |
| `leak` | `leak_act + leak_mkt;` |
| `buf` | `Math.round((gross - leak) * buffer_pct / 100);` |
| `unc` | `Math.round((gross - leak - buf) * uncertainty_pct / 100);` |
| `net` | `Math.max(0, gross - leak - buf - unc);` |
| `cum` | `(years.length > 0 ? years[years.length-1].cumulative : 0) + net;` |
| `bl_co2` | `co2_rate * area_ha * gwp.CO2;` |
| `bl_ch4` | `ch4_rate * area_ha * gwp.CH4;` |
| `bl_n2o` | `n2o_rate * area_ha * gwp.N2O;` |
| `bl_total` | `bl_co2 + bl_ch4 + bl_n2o;` |
| `pj_co2` | `project_co2_rate * area_ha * gwp.CO2;` |
| `pj_ch4` | `project_ch4_rate * area_ha * gwp.CH4;` |
| `pj_n2o` | `project_n2o_rate * area_ha * gwp.N2O;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLUE_CARBON`, `PIE_COLORS`, `RISK_FACTORS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Reference Level | `10-yr historical deforestation × CF` | National forest monitoring | Baseline deforestation rate against which project is measured |
| Activity Data Uncertainty | `Remote sensing classification error` | Hansen GFC / PRODES | Uncertainty in deforestation area detection used for discount |
| Wetland Soil C Accumulation | `Peat accretion × carbon density` | VM0033 guidance | Soil carbon sequestration rate in restored tidal wetland |
| Methane Penalty (VM0033) | `CH₄ flux × GWP` | Eddy covariance | Methane emission penalty applied in non-tidal or impermanently flooded zones |
- **Hansen GFC / PRODES** → Annual forest loss maps → activity data → **Deforestation area tCO₂e**
- **VM0033 soil surveys** → Peat accretion rate → C accumulation → **Wetland credit yield**

## 5 · Intermediate Transformation Logic
**Methodology:** JNR jurisdictional REDD+ reference level and ART TREES accounting
**Headline formula:** `ER_REDD = (RefLevel – ProjectEmissions) × (1–Uncertainty) – Leakage`
**Standards:** ['Verra JNR v3', 'ART TREES v2.0', 'Verra VM0033 v2', 'IPCC LULUCF GPG']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).