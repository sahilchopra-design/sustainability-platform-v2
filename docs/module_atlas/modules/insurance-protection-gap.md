# Insurance Protection Gap
**Module ID:** `insurance-protection-gap` · **Route:** `/insurance-protection-gap` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies the gap between total economic losses from natural catastrophe events and the portion covered by insurance, exposing uninsured climate risk. Tracks protection gap trends by peril, region, and sector using sigma and NatCat database methodologies. Supports capital allocation decisions, product development, and public-private partnership structuring for residual risk.

> **Business value:** Enables underwriters, reinsurers, and development finance institutions to locate and size underinsurance concentrations globally. Drives product innovation, sovereign risk pooling design, and regulatory capital adequacy assessment for climate-exposed books.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLIMATE_STRESS`, `COUNTRIES`, `GAP_TREND`, `INCOME_COLORS`, `INCOME_GROUPS`, `Kpi`, `PERILS_GAP`, `PERIL_PENETRATION`, `PP_SCHEMES`, `REGION_GAP`, `RiskBadge`, `Section`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => n >= 1e12 ? `$${(n / 1e12).toFixed(d)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(d)}M` : `$${n.toFix` |
| `INCOME_GROUPS` | `['High Income', 'Upper-Middle', 'Lower-Middle', 'Low Income'];` |
| `PERIL_PENETRATION` | `PERILS_GAP.map((p, pi) => {` |
| `CLIMATE_STRESS` | `['2030 RCP4.5', '2030 RCP8.5', '2050 RCP4.5', '2050 RCP8.5', '2100 RCP8.5'].map((s, i) => ({` |
| `globalGap` | `Math.round(1.8 * 1e12);` |
| `latestTrend` | `GAP_TREND[GAP_TREND.length - 1];` |
| `TABS` | `['Protection Gap', 'Country Analysis', 'Penetration Rates', 'Climate Stress', 'Public-Private Schemes'];` |

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
**Frontend seed datasets:** `CLIMATE_STRESS`, `COUNTRIES`, `INCOME_COLORS`, `INCOME_GROUPS`, `PERILS_GAP`, `PP_SCHEMES`, `REGION_GAP`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Protection Gap Index | — | Swiss Re sigma 2024 | Proportion of economic losses uninsured; higher values flag systemic underinsurance |
| Insured Loss (USD bn) | — | Munich Re NatCatSERVICE | Paid + reserved indemnity from primary and reinsurance markets |
| Economic Loss (USD bn) | — | EMDAT / Swiss Re | Total direct damage to assets and infrastructure from catastrophe events |
| Mortality-Adjusted Gap Score | — | UNDRR | Gap index weighted by fatality rate to capture humanitarian severity |
- **NatCatSERVICE / sigma databases** → Filter by peril, year, and geography; deflate to real USD → **Annual insured and economic loss time series by region**
- **Reinsurance cedant data** → Aggregate by treaty layer; apply loss development factors → **Insured loss market share and protection gap by portfolio**
- **Climate scenario outputs** → Apply AAL uplift factors per RCP/SSP pathway → **Forward-looking protection gap under 1.5°C / 2°C / 3°C warming**

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
**Methodology:** Protection Gap Index
**Headline formula:** `PGI = (Economic Loss − Insured Loss) / Economic Loss`
**Standards:** ['Swiss Re sigma', 'Munich Re NatCatSERVICE', 'UNDRR Sendai Framework']

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
| `insurance-transition` | engine:insurance_climate_risk, table:datetime, table:db, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities |
| `insurance-portfolio-climate` | engine:insurance_climate_risk, table:datetime, table:db, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities |
| `insurance-climate-hub` | engine:insurance_climate_risk, table:datetime, table:db, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities |
| `supply-chain-map` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-network-viz` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-labor-climate` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:datetime, table:db, table:exc, table:sqlalchemy |