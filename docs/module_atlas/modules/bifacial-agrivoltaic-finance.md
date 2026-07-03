# Bifacial & Agrivoltaic Finance Analytics
**Module ID:** `bifacial-agrivoltaic-finance` · **Route:** `/bifacial-agrivoltaic-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EC1 · **Sprint:** EC

## 1 · Overview
Bifacial PV module and agrivoltaic co-location project finance analytics. Quantifies bifacial energy gain from rear-side irradiance, agrivoltaic crop yield retention by type, dual land revenue economics, and financing structures for solar-agriculture co-deployment.

> **Business value:** Used by solar developers, agricultural landowners, DFIs, and project finance banks to evaluate bifacial and agrivoltaic projects combining solar electricity with continued agricultural land use.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CF_BY_COUNTRY`, `COUNTRIES`, `CROP_TYPES`, `IRRIGATION_SYSTEMS`, `KPI_CARD`, `POLICY_DATA`, `PROJECTS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capacityMw` | `5 + Math.round(sr(i * 7) * 145);` |
| `bifacialGainPct` | `3 + sr(i * 13) * 9;` |
| `albedoCoeff` | `0.15 + sr(i * 17) * 0.30;` |
| `groundClearanceM` | `1.5 + sr(i * 11) * 2.0;` |
| `agriYieldRetentionPct` | `60 + sr(i * 19) * 25;` |
| `lcoe` | `28 + sr(i * 23) * 27;` |
| `irr` | `6.5 + sr(i * 29) * 7.0;` |
| `irrigationSaving` | `15 + sr(i * 31) * 35;` |
| `cropRevenue` | `800 + sr(i * 37) * 2200;` |
| `solarRevenue` | `capacityMw * (38 + sr(i * 41) * 22) * 1000;` |
| `totalMw` | `filtered.reduce((s, p) => s + p.capacityMw, 0);` |
| `avgBifacialGain` | `filtered.length ? filtered.reduce((s, p) => s + p.bifacialGainPct, 0) / filtered.length : 0;` |
| `avgLcoe` | `filtered.length ? filtered.reduce((s, p) => s + p.lcoe, 0) / filtered.length : 0;` |
| `avgIrr` | `filtered.length ? filtered.reduce((s, p) => s + p.irr, 0) / filtered.length : 0;` |
| `avgAgriRetention` | `filtered.length ? filtered.reduce((s, p) => s + p.agriYieldRetentionPct, 0) / filtered.length : 0;` |
| `totalLandHa` | `filtered.reduce((s, p) => s + p.landAreaHa, 0);` |
| `baseAep` | `p.capacityMw * cf * 8760;` |
| `bifacialAep` | `baseAep * (1 + p.bifacialGainPct / 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `CROP_TYPES`, `IRRIGATION_SYSTEMS`, `POLICY_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Bifacial Energy Gain (%) | `AEP_uplift = bifaciality_factor × GHI_rear/GHI_front × base_AEP` | IEA PVPS Task 13 | Depends on ground albedo, module elevation, row spacing; higher albedo and elevated mounts maximise rear-side  |
| Agri Yield Retention (%) | `yield_retained = crop_yield_full × (1 - shade_loss_factor)` | Fraunhofer ISE agrivoltaic trials | Shade-tolerant crops retain 80-95%; cereal crops 60-75%; optimal panel height and E-W orientation minimise yie |
| LCOE ($/MWh) | `(CAPEX × CRF + OPEX) / AEP + agri_credit` | IEA WEO 2024 | IRA dual-use land credit reduces effective LCOE by $5-15/MWh in the US. |
- **Irradiance + albedo + crop yield trials + land cost data** → Bifacial gain model + agri yield retention + dual revenue stack → **Project LCOE, IRR, NPV for bifacial agrivoltaic project finance**

## 5 · Intermediate Transformation Logic
**Methodology:** Bifacial Gain & Agrivoltaic Dual Revenue
**Headline formula:** `AEP_uplift = base_AEP × bifaciality_factor × GHI_rear/GHI_front; Land_revenue = solar_$/ha + crop_$/ha`
**Standards:** ['IEA PVPS Task 13 – Bifacial PV', 'EU Agrivoltaic Pilot Guidelines', 'India KUSUM Scheme PM-KUSUM']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).