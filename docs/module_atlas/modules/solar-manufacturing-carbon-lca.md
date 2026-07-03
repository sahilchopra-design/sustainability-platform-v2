# Solar Manufacturing Carbon LCA
**Module ID:** `solar-manufacturing-carbon-lca` · **Route:** `/solar-manufacturing-carbon-lca` · **Tier:** B (frontend-computed) · **EP code:** EP-ED4 · **Sprint:** ED

## 1 · Overview
Lifecycle carbon assessment of solar PV module manufacturing. Quantifies cradle-to-gate carbon intensity (gCO2e/kWh), scope 1/2/3 emissions, energy payback period, and carbon payback across manufacturing locations and technology types per IEC 63274 and ISO 14040/44.

> **Business value:** Used by solar manufacturers seeking EU Taxonomy compliance, project developers requiring EPDs, and ESG investors assessing supply chain scope 3 emissions of solar portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `LCA_PRODUCTS`, `PAYBACK_SCENARIOS`, `STAGE_BREAKDOWN`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `avgCarbon` | `useMemo(() => filtered.length ? (filtered.reduce((a, p) => a + p.carbonFp, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);` |
| `avgPayback` | `useMemo(() => filtered.length ? (filtered.reduce((a, p) => a + p.carbonPayback, 0) / filtered.length).toFixed(2) : '0.00', [filtered]);` |
| `avgRecyclability` | `useMemo(() => filtered.length ? (filtered.reduce((a, p) => a + p.eolRecyclability, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);` |
| `minPayback` | `useMemo(() => filtered.length ? Math.min(...filtered.map(p => p.carbonPayback)).toFixed(1) : '0.0', [filtered]);` |
| `totalStageCO2` | `STAGE_BREAKDOWN.reduce((a, s) => a + s.gco2e, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LCA_PRODUCTS`, `PAYBACK_SCENARIOS`, `STAGE_BREAKDOWN`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Intensity (gCO2e/kWh) | `Lifecycle_GHG / (AEP × lifetime); IEC 63274` | NREL LCA Harmonization + IEA PVPS Task 12 | Xinjiang polysilicon (coal) can double CI vs European or US-manufactured polysilicon. |
| Energy Payback Period (years) | `EPBT = E_manufacturing / E_annual` | IEA PVPS Task 12 (2020) | MENA/India 2000+ kWh/m²/yr → 0.5-0.8 yr; central Europe → 1.5-2.5 yr. |
| Scope 3 Share (%) | `Upstream materials extraction + processing` | ISO 14040/44 + GHG Protocol Category 1 | Cell manufacturing 60-70% of module carbon; upstream polysilicon 15-25%. |
- **Manufacturing energy + grid emission factors + irradiance data + ISO 14040 inventory** → LCA carbon intensity + EPBT calculator + scope 1-2-3 breakdown → **Carbon intensity benchmarking for EU Taxonomy, CBAM compliance, and EPD certification**

## 5 · Intermediate Transformation Logic
**Methodology:** Carbon Intensity & Energy Payback Calculation
**Headline formula:** `CI = mfg_emissions_gCO2e / (AEP_kWh × lifetime_yrs); EPBT = E_mfg / P_annual`
**Standards:** ['ISO 14040/44 LCA Methodology', 'IEC 63274 Solar PV LCA Standard', 'NREL LCA Harmonization']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).