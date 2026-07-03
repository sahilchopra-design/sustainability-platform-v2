# Sovereign Climate Risk
**Module ID:** `sovereign-climate-risk` · **Route:** `/sovereign-climate-risk` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sovereign-level climate physical and transition risk scoring assessing country vulnerability to climate hazards, fossil fuel dependence, and policy transition trajectories.

> **Business value:** Provides country-level physical and transition climate risk scores for integration into sovereign bond risk management frameworks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `NGFS_SCENARIOS`, `SCENARIO_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_SOVMACRO_MAP` | `Object.fromEntries((SOVEREIGN_MACRO_2024\|\|[]).map(c=>[c.country,c]));` |
| `vulnAdj` | `Math.max(0, (60 - ndGain) * 3.5);` |
| `fossilAdj` | `fossilPct * 4.2;` |
| `regions` | `['All', ...new Set(COUNTRIES.map(c => c.region))];` |
| `fossilExporters` | `COUNTRIES.filter(c => c.fossilPct > 5).sort((a, b) => b.fossilPct - a.fossilPct);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sovereign-climate-risk/assess` | `assess_sovereign` | api/v1/routes/sovereign_climate_risk.py |
| POST | `/api/v1/sovereign-climate-risk/portfolio` | `assess_portfolio` | api/v1/routes/sovereign_climate_risk.py |
| GET | `/api/v1/sovereign-climate-risk/ref/profiles` | `ref_profiles` | api/v1/routes/sovereign_climate_risk.py |
| GET | `/api/v1/sovereign-climate-risk/ref/scenarios` | `ref_scenarios` | api/v1/routes/sovereign_climate_risk.py |
| GET | `/api/v1/sovereign-climate-risk/ref/countries` | `ref_countries` | api/v1/routes/sovereign_climate_risk.py |

### 2.3 Engine `sovereign_climate_risk_engine` (services/sovereign_climate_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SovereignClimateRiskEngine.assess_sovereign` | country_iso2, scenario, horizon, physical_risk_override, transition_readiness_override | Compute climate-adjusted sovereign risk for one country. |
| `SovereignClimateRiskEngine.assess_portfolio` | portfolio_name, holdings, scenario, horizon | Assess climate risk for a sovereign bond portfolio. |
| `SovereignClimateRiskEngine.get_sovereign_profiles` |  |  |
| `SovereignClimateRiskEngine.get_climate_scenarios` |  |  |
| `SovereignClimateRiskEngine.get_country_list` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COUNTRIES`, `NGFS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg Physical Score | — | ND-GAIN/IPCC | Portfolio-weighted mean physical hazard score across sovereign bond holdings. |
| Fossil Revenue Exposure | — | IEA/IMF | Share of portfolio sovereign issuers with fossil fuel revenues >10% of GDP. |
| NDC Alignment Rate | — | Climate Action Tracker | Proportion of sovereign issuers with NDCs assessed as compatible with 2°C pathway. |
- **ND-GAIN, IEA, IMF, Climate Action Tracker country data** → Pillar scoring, composite weighting, portfolio aggregation → **Country risk scores, sovereign comparison tables, portfolio risk dashboard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sovereign-climate-risk/ref/countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/sovereign-climate-risk/ref/profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sovereign_profiles'], 'n_keys': 1}`

**GET /api/v1/sovereign-climate-risk/ref/scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['climate_scenarios'], 'n_keys': 1}`

**POST /api/v1/sovereign-climate-risk/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sovereign-climate-risk/portfolio** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign Climate Risk Score
**Headline formula:** `(Physical Hazard × 0.4) + (Transition Sensitivity × 0.35) + (Policy Risk × 0.25)`
**Standards:** ['NGFS', 'World Bank CCDR', 'IEA WEO']

**Engine `sovereign_climate_risk_engine` — extracted transformation lines:**
```python
physical_score = min(100.0, (phys / 10.0) * 100 * phys_mult)
transition_score = min(100.0, ((10.0 - trans_ready) / 10.0) * 100 * trans_press)
fiscal_score = min(100.0, ((10.0 - fiscal) / 10.0) * 100 * (0.7 + 0.3 * debt_factor))
adaptation_score = max(0.0, 100.0 - nd_gain)
adjusted_notch = max(1, baseline_notch + notch_adj)
spread_delta = round((composite - 30) * 2.0 + 5, 1)
weight = exposure / total_exposure if total_exposure > 0 else 0
climate_var = total_exposure * (weighted_spread / 10000) * assumed_duration
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).