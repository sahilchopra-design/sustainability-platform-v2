# Circular Economy Investment
**Module ID:** `circular-economy-investment` · **Route:** `/circular-economy-investment` · **Tier:** A (backend vertical) · **EP code:** EP-EJ1 · **Sprint:** EJ

## 1 · Overview
6 CE business models (PaaS/Take-Back/Industrial Symbiosis/Materials Marketplace/Repair/Closed-Loop Packaging), 22 investment companies with valuation and impact metrics, market size forecast 2024–2031, Ellen MacArthur Foundation 6 principles, and ROI analysis.

> **Business value:** Used by impact investors screening circular economy companies, corporate strategy teams modelling PaaS business transitions, and ESG analysts assessing CE readiness for ESRS E5 disclosure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CE_MODELS`, `INVESTMENTS`, `KpiCard`, `MARKET_SIZE`, `Pill`, `TABS`

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
**Frontend seed datasets:** `CE_MODELS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global CE market opportunity | `Value at stake by 2030 (EMF estimate)` | Ellen MacArthur Foundation CE100 2023 | EMF estimates $4.5Tn opportunity from circular economy; largest in construction, food, and mobility sectors. |
| Industrial symbiosis BCR | `Kalundborg industrial symbiosis park annual savings` | Kalundborg Symbiosis Annual Report 2023 | Kalundborg generates €26M annual savings on €5.4M investment; replicated in Rotterdam, Ulsan, and other cluste |
| EU CE Action Plan recycling target | `Municipal solid waste recycling by 2025` | EU Circular Economy Action Plan 2020 | Extended to 65% by 2035; EPR mandatory for all packaging by 2025; recycled content minimums in new products. |
- **EMF CE100 + EU CEAP 2020 + BS 8001 + ESRS E5 Resource Use + ISO 59000 CE Standards** → 6 CE business models + investment screener + market forecast + EMF framework + ROI analysis → **Impact investors, corporate strategy teams, ESG analysts, and circular economy fund managers**

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
**Methodology:** CE Revenue Model NPV
**Headline formula:** `CE_Revenue = ServiceFee × (1 − ChurnRate) + MaterialResidualValue + WarrantyExtension; Circular_IRR solves NPV=0 for CE business model vs linear; Material_Saving = VirginCost − RecoveredCost`
**Standards:** ['Ellen MacArthur Foundation CE100 Framework', 'EU Circular Economy Action Plan 2020', 'BS 8001:2017 CE Standard']

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
| `circular-economy-finance` | engine:circular_economy_engine |