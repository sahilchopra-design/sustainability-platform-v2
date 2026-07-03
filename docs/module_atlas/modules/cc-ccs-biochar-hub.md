# CCS & Biochar Carbon Removal Hub
**Module ID:** `cc-ccs-biochar-hub` · **Route:** `/cc-ccs-biochar-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Techno-economic and MRV engine for carbon capture & storage (CCS) and biochar carbon removal (BCR) projects. Models capture efficiency, storage permanence, co-firing scenarios, and BCR stability classes under EBC and IBI standards.

> **Business value:** Net CCS credits = captured tonnes × (1–fugitive rate). Net BCR credits = biochar carbon × permanence fraction (88–97% by stability class).

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIOCHAR_PROJECTS`, `Badge`, `CCS_PROJECTS`, `Card`, `DualInput`, `Kpi`, `Section`, `TIP`, `TabBar`, `UTILIZATION_PATHWAYS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `types` | `['Saline Aquifer','Depleted Gas','Saline Aquifer','Saline Aquifer','Pre-salt','Saline Aquifer','Saline Aquifer','Depleted Gas'];` |
| `transport_ef` | `transport_mode === 'Pipeline' ? 0.006 : 0.012; // kgCO2/(t-km) → divide by 1000 for tCO2` |
| `transport_emissions` | `co2_captured_tpa * distance_km * transport_ef / 1000; // tCO2/yr` |
| `compression_emissions` | `co2_captured_tpa * compression_energy_kwh * grid_ef_tco2_per_kwh;` |
| `process_emissions` | `transport_emissions + compression_emissions;` |
| `net_stored` | `co2_captured_tpa - process_emissions;` |
| `years_to_fill` | `storage_capacity_mt * 1e6 / co2_captured_tpa;` |
| `utilization_rate` | `injection_rate_tpd * 365 / co2_captured_tpa * 100;` |
| `carbon_in` | `biomass_input_t * carbon_content_pct / 100; // t Carbon in feedstock` |
| `biochar_mass_yield` | `Math.max(0.12, 0.68 * Math.exp(-0.0026 * pyrolysis_temp_c));` |
| `biochar_carbon_pct` | `Math.min(0.90, 0.40 + 0.0006 * pyrolysis_temp_c);` |
| `biochar_carbon` | `biomass_input_t * biochar_mass_yield * biochar_carbon_pct;` |
| `durable_carbon` | `biochar_carbon * stability;` |
| `pyrolysis_energy` | `carbon_in * 0.10 * (44 / 12); // tCO2` |
| `co2_equiv` | `Math.max(0, durable_carbon * (44 / 12) + counterfactual_avoided - pyrolysis_energy); // clamp: very low temp pyrolysis with high energy can produce ne` |
| `biochar_yield` | `biochar_mass_yield; // expose for display` |
| `total` | `(ccsResult?.net_stored \|\| 0) + (bcResult?.co2_equiv \|\| 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `UTILIZATION_PATHWAYS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CCS Capture Efficiency | `CO₂ captured / total emissions` | IEA CCS | Fraction of process emissions captured before atmosphere release |
| Fugitive Leakage Rate | `Monitoring survey data` | Storage operator reports | Annual CO₂ seepage from geological storage |
| BCR H:C​org Ratio | `Elemental analysis` | EBC lab protocol | Proxy for biochar recalcitrance; lower = more stable |
| BCR Net Permanence | `Stability class oxidation table` | EBC Carbon Standard | Fraction of biochar carbon credited as permanent over 100-year horizon |
- **Plant monitoring data** → Capture efficiency + fugitive rates → net CCS → **tCO₂ net stored**
- **EBC lab reports** → H:C ratio + oxidation table → permanence fraction → **BCR net credits**

## 5 · Intermediate Transformation Logic
**Methodology:** CCS net removal + BCR stability-weighted permanence
**Headline formula:** `NetCCS = Captured × (1 – FugitiveRate); NetBCR = Biochar_C × (1 – OxidationFraction)`
**Standards:** ['IEA CCS Tracking', 'EBC Carbon Standard', 'IBI Biochar Standard', 'ISO 14064-2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).