# Insurance Climate Hub
**Module ID:** `insurance-climate-hub` · **Route:** `/insurance-climate-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides an integrated climate analytics hub for insurance companies spanning underwriting risk (physical hazard exposure), reserving adjustments (climate trend loading), investment portfolio climate alignment, and regulatory stress testing under EIOPA and PRA climate scenario requirements.

> **Business value:** Enables insurance companies to integrate climate risk across underwriting, reserving, and investment functions, meet EIOPA and PRA regulatory climate risk management expectations, and produce quantitative climate scenario analyses for TCFD disclosures and regulatory stress test submissions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DATA_SOURCES`, `DOMAINS`, `DOMAIN_COLORS`, `DOMAIN_WEIGHTS_DEFAULT`, `KRIS`, `KpiCard`, `MATERIALITY_RATINGS`, `PEER_INSURERS`, `PEER_SCORES`, `REGULATORS`, `REGULATORY_MILESTONES`, `TabBtn`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DATA_SOURCES` | `['Internal Models','Third-Party Data','Regulator Data','Market Data','Climate Science'];` |
| `domainIdx` | `Math.floor(sr(i * 19 + 1) * 8);` |
| `matIdx` | `Math.floor(sr(i * 19 + 2) * 4);` |
| `threshold` | `+(sr(i * 19 + 3) * 80 + 20).toFixed(1);` |
| `value` | `+(sr(i * 19 + 4) * 90 + 10).toFixed(1);` |
| `trend` | `Array.from({ length: 5 }, (_, j) => +(value * (0.85 + sr(i * 19 + 5 + j) * 0.3)).toFixed(1));` |
| `peer` | `+(sr(i * 19 + 10) * 70 + 25).toFixed(1);` |
| `PEER_SCORES` | `PEER_INSURERS.map((p, i) => DOMAINS.map((_, di) => +(sr(i * 89 + di + 1) * 45 + 40).toFixed(1)));` |
| `totalWeight` | `domainWeights.reduce((a, b) => a + b, 0);` |
| `domainScores` | `DOMAINS.map((domain, di) => {` |
| `avgValue` | `domainKRIs.reduce((s, k) => s + k.value, 0) / domainKRIs.length;` |
| `weightedSum` | `domainScores.reduce((s, score, i) => s + score * domainWeights[i], 0);` |
| `domainCards` | `useMemo(() => DOMAINS.map((domain, di) => {` |
| `avgValue` | `kris.length ? +(kris.reduce((s, k) => s + k.value, 0) / kris.length).toFixed(1) : 0;` |
| `score` | `Math.min(100, Math.max(0, +(100 - avgValue * 0.3).toFixed(1)));` |
| `obj` | `{ period: `Q${ti + 1}` };` |
| `avg` | `kris.reduce((s, k) => s + (k.trend[ti] \|\| k.value), 0) / kris.length;` |
| `breachData` | `useMemo(() => DOMAINS.map((domain, di) => ({` |

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
**Frontend seed datasets:** `DATA_SOURCES`, `DOMAINS`, `DOMAIN_COLORS`, `DOMAIN_WEIGHTS_DEFAULT`, `MATERIALITY_RATINGS`, `PEER_INSURERS`, `REGULATORS`, `REGULATORY_MILESTONES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Loading Factor (%) | — | IPCC AR6 / Cat model vendors | Percentage uplift applied to base expected losses for climate-sensitive perils; flood loading 15â€“25%; windst |
| Climate-Adjusted Combined Ratio | — | EIOPA stress test benchmarks | Combined ratio after applying climate loading; above 100% indicates technical underwriting loss; EIOPA 2022 st |
| Physical Risk Underwriting Exposure (%) | — | Cat model / GIS analysis | Share of gross written premium exposed to climate-sensitive perils in high-risk geographies as defined by IPCC |
| Investment Portfolio Climate VaR (%) | — | NGFS scenario analysis | Maximum investment portfolio loss at 95% confidence under NGFS Disorderly transition scenario; relevant for So |
- **Underwriting portfolio data by peril and geography** → Apply climate loading factors from IPCC AR6 hazard trajectories → **Climate-adjusted expected loss ratio by peril**
- **Investment portfolio holdings** → Run NGFS climate scenario stress test on asset values → **Investment portfolio climate VaR**
- **Catastrophe model outputs (RMS/AIR)** → Integrate climate change module, compare to base case → **Climate-loaded cat model loss estimates**

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
**Methodology:** Climate-Loaded Combined Ratio
**Headline formula:** `CRclimate = (Claims_base × (1 + ClimateLoading) + Expenses) / Net_Premium`
**Standards:** ['EIOPA Opinion on Sustainability in Solvency II (2021)', 'PRA SS3/19 Climate Financial Risk', "Lloyd's of London Climate Risk Appetite Framework"]

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
| `insurance-protection-gap` | engine:insurance_climate_risk, table:datetime, table:db, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities |
| `supply-chain-map` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-network-viz` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-labor-climate` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:datetime, table:db, table:exc, table:sqlalchemy |