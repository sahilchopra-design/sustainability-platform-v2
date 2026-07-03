# Circular Economy Finance Analytics
**Module ID:** `circular-economy-finance` · **Route:** `/circular-economy-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DL1 · **Sprint:** DL

## 1 · Overview
Analyses investment opportunities and risk management implications of the circular economy transition. Models product-as-a-service revenue models, material loop closure economics, reverse logistics NPV, and EU Circular Economy Action Plan regulatory compliance costs.

> **Business value:** Directly applicable to consumer goods manufacturers, materials companies, and impact investors targeting circular economy. Provides financial business case for circular model transition, WBCSD CTI reporting metrics, and EU CEAP regulatory compliance gap analysis.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CIRCULARITY_TIERS`, `COMPANIES`, `COUNTRIES`, `KpiCard`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 13) * COUNTRIES.length)];` |
| `circularityScore` | `Math.round(20 + sr(i * 3) * 75);` |
| `avgCircularity` | `(filtered.reduce((s, c) => s + c.circularityScore, 0) / n).toFixed(1);` |
| `totalCarbonSaving` | `filtered.reduce((s, c) => s + c.carbonSaving, 0);` |
| `totalCapex` | `filtered.reduce((s, c) => s + c.circularCapex, 0);` |
| `pctBonds` | `filtered.length ? ((filtered.filter(c => c.circularBondIssued).length / n) * 100).toFixed(0) : '0';` |
| `carbonValueM` | `((totalCarbonSaving * carbonPrice) / 1e6).toFixed(1);` |
| `sectorBarData` | `SECTORS.map(sec => {` |
| `scos` | `filtered.filter(c => c.sector === sec).map(c => c.circularityScore);` |
| `wasteBarData` | `SECTORS.map(sec => {` |
| `wrs` | `filtered.filter(c => c.sector === sec).map(c => c.wasteRecoveryRate);` |
| `countryRevData` | `COUNTRIES.map(cn => {` |
| `revs` | `filtered.filter(c => c.country === cn).map(c => c.revenueFromCircular);` |
| `scatterData` | `filtered.map(c => ({ x: c.circularCapex, y: c.carbonSaving / 1000, name: c.name }));` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |
| `scos` | `filtered.filter(c => c.sector.startsWith(d.sector.substring(0, 6))).map(c => c.materialEfficiency);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/circular-economy/esrs-e5` | `esrs_e5` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/mci` | `mci` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/wbcsd-cti` | `wbcsd_cti` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/epr-compliance` | `epr_compliance` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/crm-risk` | `crm_risk` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/lca` | `lca` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/material-flows` | `material_flows` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/overall-circularity` | `overall_circularity` | api/v1/routes/circular_economy.py |
| GET | `/api/v1/circular-economy/ref/crm-list` | `ref_crm_list` | api/v1/routes/circular_economy.py |
| GET | `/api/v1/circular-economy/ref/epr-rates` | `ref_epr_rates` | api/v1/routes/circular_economy.py |

### 2.3 Engine `circular_economy_engine` (services/circular_economy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CircularEconomyEngine.assess_esrs_e5` | entity_id, resource_inflows_t, recycled_inflows_pct, resource_outflows_t, waste_t, crm_identified | CSRD ESRS E5 — Resource use and circular economy disclosure scoring. |
| `CircularEconomyEngine.calculate_mci` | entity_id, recycled_input_fraction, waste_recovery_fraction, product_lifetime_multiplier, sector | Ellen MacArthur Foundation Material Circularity Indicator (0-1). |
| `CircularEconomyEngine.assess_wbcsd_cti` | entity_id, entity_name, sector, circular_product_design, waste_recovery, recycled_content | WBCSD Circular Transition Indicators v4.0 — 4 dimensions, A-D tier. |
| `CircularEconomyEngine.calculate_epr_compliance` | entity_id, packaging_tonnes, ewaste_tonnes, battery_tonnes, country, compliance_gaps | EU EPR cost calculation for packaging (DIR 94/62/EC), e-waste (WEEE DIR), |
| `CircularEconomyEngine.assess_crm_risk` | entity_id, materials_used, material_data | EU CRM Act 2023 dependency assessment for critical raw materials. |
| `CircularEconomyEngine.perform_lca` | entity_id, product_name, annual_production, sector, circularity_benefit_pct | ISO 14044 Life Cycle Assessment: cradle-to-gate vs cradle-to-cradle. |
| `CircularEconomyEngine.analyse_material_flows` | entity_id, materials | Material flow analysis: for each material compute recycled content % |
| `CircularEconomyEngine.compute_overall_circularity` | entity_id, esrs_score, mci_score, cti_score, lca_benefit_pct, cost_per_score_point_usd | Aggregated circularity score combining ESRS E5, MCI, CTI, and LCA benefit. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CIRCULARITY_TIERS`, `COUNTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Circular Economy Value Opportunity | — | Ellen MacArthur Foundation 2015 | Global circular economy transition could generate $4.5Tn in economic benefits by 2030 |
| EU CEAP Market Impact | — | European Commission CEAP 2020 | EU Circular Economy Action Plan creates €250Bn in new market opportunities in materials, design, and waste |
| Material Productivity Gap | — | Circle Economy Circularity Gap Report 2023 | Only 8.6% of global materials are cycled back into economy — huge gap vs circular potential |
- **Product material composition + use phase data** → Circularity scoring → **Material loop closure rate and critical material retention**
- **Reverse logistics cost data + material market prices** → Circular economics modelling → **NPV of circular business model vs linear alternative**
- **EU CEAP regulatory requirements by product category** → Compliance cost modelling → **Ecodesign and EPR compliance cost and market access implications**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/circular-economy/ref/crm-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_crm_count', 'critical_raw_materials', 'strategic_raw_materials', 'eu_2030_targets', 'regulation', 'review_cycle', 'strategic_stockpiling'], 'n_keys': 7}`

**GET /api/v1/circular-economy/ref/epr-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['rates', 'categories', 'currency', 'unit', 'directives', 'note'], 'n_keys': 6}`

**POST /api/v1/circular-economy/crm-risk** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/epr-compliance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/esrs-e5** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Circular Economy Value Model
**Headline formula:** `CircularValue = ResaleRevenue + MaterialRecoveryValue + CustomerRetentionUplift - ReverseLogisticsCost - RemanufacturingCost; CircularityScore = MaterialsRetained / TotalMaterialsInput`
**Standards:** ['EU Circular Economy Action Plan 2020', 'Ellen MacArthur Foundation CE Economics 2015', 'WBCSD Circular Transition Indicators v3.0', 'SBTi Material Use Sector Guidance']

**Engine `circular_economy_engine` — extracted transformation lines:**
```python
utility_factor = round(1.0 / plm, 4)
raw_mci = (rif + wrf) / 2.0 * utility_factor
gap = round(benchmark - mci_score, 4)
sector_benchmark = round(MCI_BENCHMARKS[sector_l] * 100.0, 1)
pkg_cost = round(packaging_tonnes * pkg_rate, 0) if packaging_tonnes > 0 else 0.0
ew_cost = round(ewaste_tonnes * ew_rate, 0) if ewaste_tonnes > 0 else 0.0
bat_cost = round(battery_tonnes * bat_rate, 0) if battery_tonnes > 0 else 0.0
total_cost = round(pkg_cost + ew_cost + bat_cost, 0)
c2c = round(c2g * (1 - benefit_pct / 100.0), 2)
annual_co2_saving = round((c2g - c2c) * annual_production / 1000.0, 2)  # tCO2
total = primary + recycled + bio_based
rec_pct = round(recycled / total * 100.0 if total > 0 else 0.0, 2)
portfolio_recycled_pct = round(total_recycled / total_inflow * 100.0 if total_inflow > 0 else 0.0, 2)
crm_exposure_pct = round(crm_inflow / total_inflow * 100.0 if total_inflow > 0 else 0.0, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `circular_economy_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `circular-economy-tracker` | engine:circular_economy_engine |
| `circular-economy-investment` | engine:circular_economy_engine |