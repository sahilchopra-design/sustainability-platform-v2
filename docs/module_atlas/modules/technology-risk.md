# Technology Risk
**Module ID:** `technology-risk` · **Route:** `/technology-risk` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate technology disruption risk platform assessing stranding and competitive risk for legacy industries from rapid clean technology cost curves including solar, wind, EVs, heat pumps and green hydrogen.

> **Business value:** Solar and wind have achieved cost parity with new fossil fuel generation in 90% of markets; battery storage learning rates of 18% per doubling of capacity threaten gas peaker and pumped hydro economics.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AiModelRisk`, `COMPANIES`, `CyberScorecard`, `INCIDENT_TREND`, `IncidentLandscape`, `MATURITY_DATA`, `RADAR_DATA`, `REGS`, `REG_READINESS`, `RISK_CATS`, `RegulatoryCompliance`, `SECTORS`, `TABS`, `VENDOR_CONC`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr, s) => arr[Math.floor(sr(s) * arr.length)];` |
| `RISK_CATS` | `["Cyber / Ransomware","AI / Model Risk","Cloud Concentration","Third-Party / Vendor","OT / ICS Security","Data Privacy","Supply Chain SW","Legacy Tech` |
| `MATURITY_DATA` | `RISK_CATS.map((c, i) => ({` |
| `sectorAvg` | `SECTORS.map(s => {` |
| `maturityDist` | `["None","Experimental","Deployed","Enterprise"].map(m => ({` |
| `aiRiskByMaturity` | `maturityDist.map((m, i) => ({` |
| `pct` | `(cnt / COMPANIES.length * 100).toFixed(0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/technology/data-centre` | `assess_data_centre` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/cloud-emissions` | `assess_cloud_emissions` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/ai-carbon` | `assess_ai_carbon` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/semiconductor-risk` | `assess_semiconductor_risk` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/ewaste` | `assess_ewaste` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/eed-compliance` | `eed_compliance` | api/v1/routes/technology.py |
| POST | `/api/v1/technology/integrated-assessment` | `integrated_assessment` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/grid-factors` | `ref_grid_factors` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/cloud-benchmarks` | `ref_cloud_benchmarks` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/pue-benchmarks` | `ref_pue_benchmarks` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/wue-benchmarks` | `ref_wue_benchmarks` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/ai-benchmarks` | `ref_ai_benchmarks` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/semiconductor` | `ref_semiconductor` | api/v1/routes/technology.py |
| GET | `/api/v1/technology/ref/ewaste-rates` | `ref_ewaste_rates` | api/v1/routes/technology.py |

### 2.3 Engine `technology_risk_engine` (services/technology_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_dc_to_dict` | r | Convert DataCentreResult dataclass to serialisable dict. |
| `TechnologyRiskEngine.assess_data_centre` | inp | Full data centre efficiency + emissions assessment. |
| `TechnologyRiskEngine.assess_cloud_emissions` | inp | Estimate Scope 3 Category 1 emissions from cloud services. |
| `TechnologyRiskEngine.assess_ai_carbon` | inp | Estimate AI model training + inference carbon footprint. |
| `TechnologyRiskEngine.assess_semiconductor_risk` | inp | Water intensity + mineral supply chain risk for semiconductor manufacturing. |
| `TechnologyRiskEngine.assess_ewaste` | inp | Hardware lifecycle e-waste and circularity assessment. |
| `TechnologyRiskEngine.eed_compliance_check` | inp | EU Energy Efficiency Directive (recast 2023/1791) Article 12 compliance. |
| `TechnologyRiskEngine.integrated_assessment` | entity_name, data_centres, cloud_usage, ai_models, semiconductor, ewaste | Comprehensive technology entity sustainability assessment. |
| `TechnologyRiskEngine.get_grid_emission_factors` |  |  |
| `TechnologyRiskEngine.get_cloud_provider_benchmarks` |  |  |
| `TechnologyRiskEngine.get_pue_benchmarks` |  |  |
| `TechnologyRiskEngine.get_wue_benchmarks` |  |  |
| `TechnologyRiskEngine.get_ai_training_benchmarks` |  |  |
| `TechnologyRiskEngine.get_semiconductor_water_data` |  |  |
| `TechnologyRiskEngine.get_ewaste_recycling_rates` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `cloud`, `disposal`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `RADAR_DATA`, `REGS`, `RISK_CATS`, `SECTORS`, `TABS`, `VENDOR_CONC`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EV Disruption Risk (ICE OEMs) | — | BloombergNEF EVO | Technology disruption risk for internal combustion engine manufacturers from battery electric vehicle cost par |
| Solar Cost Decline (10yr) | — | IRENA 2023 | Inflation-adjusted solar PV LCOE reduction 2013–2023; benchmark for technology cost curve speed. |
| At-Risk Legacy Assets | — | Carbon Tracker | Estimated global value of legacy energy assets at risk of premature retirement from technology disruption. |
- **Asset Registry, Clean Technology Cost Curves, Market Share Data** → Cost parity analysis + disruption scoring + impairment timeline modelling → **Technology risk dashboard, TCFD Strategy disclosures, asset impairment schedules**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/technology/ref/ai-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'models'], 'n_keys': 2}`

**GET /api/v1/technology/ref/cloud-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pue', 'grid_factors'], 'n_keys': 2}`

**GET /api/v1/technology/ref/ewaste-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'rates'], 'n_keys': 2}`

**GET /api/v1/technology/ref/grid-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'factors'], 'n_keys': 2}`

**GET /api/v1/technology/ref/pue-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'benchmarks'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic
**Methodology:** Technology Disruption Risk Score
**Headline formula:** `TDRS = (LegacyCost / CleanTechCost)⁻¹ × MarketPenetrationRate`
**Standards:** ['RMI Clean Energy Outlook 2023', 'Bloomberg NEF EVO 2023']

**Engine `technology_risk_engine` — extracted transformation lines:**
```python
it_mwh = inp.it_load_mw * 8760 * 0.70  # 70% avg utilization
total_mwh = it_mwh * pue
overhead_mwh = total_mwh - it_mwh
scope2_location = total_mwh * grid_ef / 1000  # tCO2e
scope2_market = scope2_location * (1 - inp.renewable_pct / 100)
cue = (scope2_market * 1_000_000) / max(it_mwh * 1000, 1)  # gCO2/kWh IT
annual_water_m3 = wue * it_mwh * 1000 / 1000  # L → m3
embodied = inp.total_floor_area_m2 * 0.35  # tCO2e amortised
total_carbon = scope2_market + embodied
carbon_intensity = (scope2_market * 1000) / max(it_mwh, 1)  # kgCO2/kWh IT
efficiency_gap = ((pue - best_pue) / best_pue) * 100 if pue > best_pue else 0
cpu_power_w = 10 * max(inp.avg_cpu_utilization / 0.5, 0.4)
compute_kwh = inp.compute_hours * cpu_power_w / 1000
gpu_kwh = inp.gpu_hours * 0.350 / 1  # assume A100-class 350W
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).