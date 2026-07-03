# Commercial RE Climate Risk
**Module ID:** `commercial-re-climate-risk` · **Route:** `/commercial-re-climate-risk` · **Tier:** A (backend vertical) · **EP code:** EP-EI2 · **Sprint:** EI

## 1 · Overview
CRREM-aligned stranded asset analytics for commercial real estate: EPC band distribution with stranding risk, 24-asset CRREM gap and stranding year analysis, 4 NGFS scenario stress testing (LTV/NOI/cap rate/vacancy), CRREM pathways by sector, carbon price sensitivity on retrofit payback.

> **Business value:** Used by real estate lenders stress-testing mortgage book under NGFS scenarios, institutional investors screening for stranded asset exposure, and REIT teams managing CRREM pathway compliance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CRREM_PATHWAY`, `EPC_RATINGS`, `KpiCard`, `NGFS_SCENARIOS`, `PROPERTIES`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `strandedPct` | `Math.round((filtered.filter(p => p.epc >= 'D').length / n) * 100);` |
| `avgRetrofit` | `Math.round(filtered.reduce((a, p) => a + p.retrofitCost, 0) / n);` |
| `avgValRisk` | `(filtered.reduce((a, p) => a + parseFloat(p.valuationRisk), 0) / n).toFixed(1);` |
| `annualSaving` | `(r.energySave * 0.15) + (r.carbonSave * carbonPrice / 1000);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/commercial-re/crrem` | `crrem` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/epc-epbd` | `epc_epbd` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/gresb` | `gresb` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/refi` | `refi` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/nabers` | `nabers` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/green-lease` | `green_lease` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/retrofit` | `retrofit` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/full-assessment` | `full_assessment` | api/v1/routes/commercial_re.py |
| GET | `/api/v1/commercial-re/ref/crrem-pathways` | `ref_crrem_pathways` | api/v1/routes/commercial_re.py |
| GET | `/api/v1/commercial-re/ref/epc-thresholds` | `ref_epc_thresholds` | api/v1/routes/commercial_re.py |
| GET | `/api/v1/commercial-re/ref/retrofit-measures` | `ref_retrofit_measures` | api/v1/routes/commercial_re.py |
| GET | `/api/v1/commercial-re/ref/green-premium` | `ref_green_premium` | api/v1/routes/commercial_re.py |

### 2.3 Engine `commercial_re_engine` (services/commercial_re_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CommercialREEngine.assess_crrem` | entity_id, asset_type, country, energy_intensity_kwh_m2, co2_intensity_kgco2_m2 |  |
| `CommercialREEngine.assess_epc_epbd` | entity_id, country, building_type, primary_energy_kwh_m2 |  |
| `CommercialREEngine.calculate_gresb_score` | entity_id, management_data, performance_data, peer_percentile | GRESB Real Estate score from supplied management/performance criteria. |
| `CommercialREEngine.assess_refi` | entity_id, physical_risk_inputs, transition_risk_inputs | REFI Protocol physical + transition risk tiering. |
| `CommercialREEngine.calculate_nabers` | entity_id, asset_type, annual_energy_kwh, gross_area_m2, hours_pa, annual_water_kl | NABERS star ratings. |
| `CommercialREEngine.assess_green_lease` | entity_id, lease_clauses_present |  |
| `CommercialREEngine.model_retrofit` | entity_id, asset_type, current_energy_kwh_m2, floor_area_m2, discount_rate, energy_price_kwh |  |
| `CommercialREEngine.generate_full_assessment` | entity_id, asset_data |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `EPC_RATINGS`, `NGFS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EPC G stranding risk | `Of EPC G assets stranded by 2030` | CRREM v2.0 2023 analysis | EPC G buildings have highest CRREM gap; UK MEES regulations already prohibit new lettings on EPC F/G from 2023 |
| NGFS Hot House LTV impact | `LTV deterioration under 4°C scenario` | NGFS Physical Risk Financial Impacts 2023 | Property values decline as transition costs rise and physical damage increases; lenders must stress-test LTVs  |
| CRREM Office net zero pathway | `By 2050 EU average` | CRREM v2.0 Office Pathway | Current average EU office EUI ~180 kWh/m²/yr; 86% reduction required requiring systematic deep retrofit progra |
- **CRREM v2.0 + NGFS 2023 + EPC UK/EU + EU Taxonomy + TCFD Real Assets** → Stranding year analysis + NGFS stress test + CRREM pathway chart + carbon price sensitivity + EPC filter → **Real estate lenders, institutional investors, REIT ESG teams, and climate risk managers**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/commercial-re/ref/crrem-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/commercial-re/ref/epc-thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/commercial-re/ref/green-premium** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/commercial-re/ref/retrofit-measures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/commercial-re/crrem** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** CRREM Stranding Year
**Headline formula:** `CRREM_Gap = AssetEUI − Pathway_EUI(year); StrandingYear = t where AssetEUI > CRREM_Pathway(t); RetrofitPayback = RetrofitCost / (EnergySaving + RentPremium + AvoidedStrandingLoss)`
**Standards:** ['CRREM v2.0 (2023)', 'NGFS Climate Scenarios 2023', 'EU Taxonomy Art. 7.7']

**Engine `commercial_re_engine` — extracted transformation lines:**
```python
years_to_stranding = yr - 2025
overconsumption_gap = max(0.0, co2_intensity_kgco2_m2 - pathway_2030)
epc_rating = list(thresholds.keys())[-1]  # worst rating by default
current_idx = rating_order.index(epc_rating) if epc_rating in rating_order else len(rating_order) - 1
total_score = management_score + performance_score
score = sum(float(inputs[k]) * w for k, w in present.items()) / total_w
composite_score = min(100.0, max(0.0, sum(present_dims) / len(present_dims)))
energy_intensity = annual_energy_kwh / max(gross_area_m2, 1.0)  # kWh/m²
energy_stars = 1.0 + t * 2.0
energy_stars = 3.0 + t * 2.0
energy_stars = 5.0 + t * 1.0
water_intensity = float(annual_water_kl) / max(gross_area_m2, 1.0)  # kL/m²
ws = 1.0 + t * 2.0
ws = 3.0 + t * 2.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).