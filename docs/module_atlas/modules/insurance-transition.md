# Insurance Transition Risk
**Module ID:** `insurance-transition` · **Route:** `/insurance-transition` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Transition risk assessment for insurance companies covering underwriting, investment, and liability sides. Includes stranded asset exposure, carbon-intensive underwriting, and regulatory Solvency II overlay.

> **Business value:** Insurers face a triple climate exposure: underwriting risk (carbon clients become uninsurable), investment risk (stranded asset losses), and liability risk (climate D&O claims). EIOPA and IAIS are embedding climate into Solvency II requirements. This module provides the integrated climate risk view needed for ORSA and regulatory stress tests.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FUEL_TYPES`, `GREEN_CATEGORIES`, `GREEN_PRODUCTS`, `INSURERS`, `INSURER_TYPES`, `MEMBERSHIPS`, `PIE_COLORS`, `REGIONS`, `REGULATORY_FRAMEWORKS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MEMBERSHIPS` | `['NZIA','PSI','PCAF','TCFD','SBTi','Net-Zero AOA','ClimateWise'];` |
| `GREEN_CATEGORIES` | `['Renewable Energy','EV Insurance','Green Building','Climate Adaptation','Sustainable Agriculture','Circular Economy','Carbon Capture','Nature-Based']` |
| `type` | `INSURER_TYPES[Math.floor(s1*INSURER_TYPES.length)];` |
| `region` | `REGIONS[Math.floor(s2*REGIONS.length)];` |
| `gwp` | `Math.round(5+s3*95);` |
| `fossilExposure` | `+(1+s4*25).toFixed(1);` |
| `coalExposure` | `+(s5*fossilExposure*0.4).toFixed(1);` |
| `oilGasExposure` | `+(fossilExposure-coalExposure).toFixed(1);` |
| `nzTarget` | `s6>0.3?`Net-zero ${2040+Math.floor(s7*10)}`:'No target';` |
| `transitionScore` | `Math.round(20+s5*75);` |
| `envScore` | `Math.round(15+s6*80);` |
| `disclosureScore` | `Math.round(25+s7*70);` |
| `targetScore` | `Math.round(10+s8*85);` |
| `engagementScore` | `Math.round(20+s9*75);` |
| `overallScore` | `Math.round((transitionScore+envScore+disclosureScore+targetScore+engagementScore)/5);` |
| `coalPhaseOut` | `s1>0.5?`${2025+Math.floor(s2*8)}`:'None';` |
| `oilPhaseOut` | `s3>0.6?`${2028+Math.floor(s4*12)}`:'None';` |
| `gasPhaseOut` | `s5>0.7?`${2030+Math.floor(s6*15)}`:'None';` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/insurance/calculate` | `calculate_insurance` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/reference-data` | `reference_data` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/assessments` | `list_assessments` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/assessments/{assessment_id}` | `get_assessment` | api/v1/routes/insurance.py |

### 2.3 Engine `insurance_climate_risk` (services/insurance_climate_risk.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_insurance_climate_risk` | inp, scenario, horizon_year | Full insurance climate risk assessment. |
| `get_reference_data` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `insurance_climate_assessments` *(shared)*, `insurance_climate_entities` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `FUEL_TYPES`, `GREEN_CATEGORIES`, `INSURER_TYPES`, `MEMBERSHIPS`, `PIE_COLORS`, `REGIONS`, `REGULATORY_FRAMEWORKS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fossil Fuel Underwriting Exposure | — | Sector analysis | Gross written premium from carbon-intensive clients |
| Stranded Asset Exposure | — | Investment | Bonds/equity in coal, O&G at high stranding risk |
| Climate D&O Exposure | — | Liability | Directors and officers liability from climate disclosures |
- **Underwriting portfolio** → Fossil fuel exposure analysis → **Transition underwriting risk**
- **Investment portfolio** → Stranded asset screen → **Investment transition risk**
- **Combined risks** → Solvency II calibration → **Climate SCR add-on**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/insurance/assessments** — status `passed`, provenance ['db-empty'], source tables: `insurance_climate_assessments`, `insurance_climate_entities`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/insurance/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `insurance_climate_assessments`, `insurance_climate_entities`
Output: `None`

**GET /api/v1/insurance/reference-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cat_loss_multipliers', 'solvency_ii_cat_factors', 'tp_uplift_by_scenario', 'supported_perils', 'supported_scenarios', 'sources'], 'n_keys': 6}`

**POST /api/v1/insurance/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Insurance transition risk aggregation
**Headline formula:** `TotalRisk = UnderwritingRisk + InvestmentRisk + LiabilityRisk`
**Standards:** ['EIOPA Consultation CP-23-012', 'ORSA', 'Solvency II']

**Engine `insurance_climate_risk` — extracted transformation lines:**
```python
gross_1in100 = inp.gross_loss_1in100_baseline_eur * multiplier
gross_1in250 = inp.gross_loss_1in250_baseline_eur * multiplier
aal          = inp.average_annual_loss_baseline_eur * multiplier
pml          = inp.probable_max_loss_baseline_eur * multiplier
cat_change_pct = (multiplier - 1.0) * 100.0
net_1in100 = gross_1in100 * ret
net_1in250 = gross_1in250 * ret
ri_limit = inp.reinsurance_limit_eur or (gross_1in250 * (1 - ret) * 1.1)
ri_gap    = max(0.0, gross_1in250 * (1 - ret) - ri_limit)
climate_scr_factor = base_cat_scr_factor * max(0, multiplier - 1.0)
scr_addon = inp.gross_written_premium_eur * climate_scr_factor
total_scr  = inp.scr_eur + scr_addon
sol_ratio_pre  = inp.own_funds_eur / inp.scr_eur if inp.scr_eur > 0 else 0.0
sol_ratio_post = inp.own_funds_eur / total_scr    if total_scr > 0  else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **90** other module(s).
**Shared engines (edits propagate!):** `insurance_climate_risk` (used by 4 modules)

| Connected module | Shared via |
|---|---|
| `insurance-portfolio-climate` | engine:insurance_climate_risk, table:datetime, table:db, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities |
| `insurance-protection-gap` | engine:insurance_climate_risk, table:datetime, table:db, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities |
| `insurance-climate-hub` | engine:insurance_climate_risk, table:datetime, table:db, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities |
| `supply-chain-map` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-network-viz` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-labor-climate` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:datetime, table:db, table:exc, table:sqlalchemy |