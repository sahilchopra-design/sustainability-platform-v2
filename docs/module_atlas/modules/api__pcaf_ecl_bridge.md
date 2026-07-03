# Api::Pcaf_Ecl_Bridge
**Module ID:** `api::pcaf_ecl_bridge` · **Route:** `/api/v1/pcaf-ecl` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf-ecl/bridge` | `bridge_single_investee` | api/v1/routes/pcaf_ecl_bridge.py |
| POST | `/api/v1/pcaf-ecl/bridge-portfolio` | `bridge_portfolio_endpoint` | api/v1/routes/pcaf_ecl_bridge.py |
| POST | `/api/v1/pcaf-ecl/bridge-from-db` | `bridge_from_db` | api/v1/routes/pcaf_ecl_bridge.py |
| GET | `/api/v1/pcaf-ecl/scenario-weights` | `get_scenario_weights` | api/v1/routes/pcaf_ecl_bridge.py |
| GET | `/api/v1/pcaf-ecl/transition-risk` | `get_transition_risk` | api/v1/routes/pcaf_ecl_bridge.py |
| GET | `/api/v1/pcaf-ecl/dqs-confidence` | `get_dqs_confidence` | api/v1/routes/pcaf_ecl_bridge.py |

### 2.3 Engine `pcaf_ecl_bridge` (services/pcaf_ecl_bridge.py)
| Function | Args | Purpose |
|---|---|---|
| `_temperature_bucket` | temp_c | Classify temperature into scenario weight bucket. |
| `_waci_to_transition_risk` | waci | Map WACI intensity to sector transition risk level. |
| `_waci_to_transition_score` | waci | Convert WACI intensity to a 0-100 transition risk score. |
| `_carbon_price_sensitivity` | waci, sector_gics | Estimate carbon price sensitivity (0-1) from emissions intensity. |
| `map_investee_to_ecl_climate` | profile, physical_risk_override, collateral_flood_risk, energy_rating | Map a single PCAF investee profile to ECL ClimateRiskInputs. |
| `bridge_portfolio` | investee_profiles, portfolio_temperature_c, physical_risk_overrides | Map an entire portfolio of PCAF investees to ECL climate inputs. |
| `db_row_to_profile` | row | Convert a pcaf_investees DB row (dict) to PCAFInvesteeProfile. |
| `demo_bridge` |  | Demonstrate the bridge with sample data. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `DB` *(shared)*, `ECL`, `PCAF` *(shared)*, `WACI` *(shared)*, `dataclasses` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pcaf_investees` *(shared)*, `pcaf_portfolios` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pcaf-ecl/dqs-confidence** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['description', 'methodology', 'weights'], 'n_keys': 3}`

**GET /api/v1/pcaf-ecl/scenario-weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['temperature_c', 'temperature_bucket', 'scenario_weights', 'all_buckets'], 'n_keys': 4}`

**GET /api/v1/pcaf-ecl/transition-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['waci_tco2e_per_meur', 'sector_gics', 'transition_risk_level', 'transition_risk_score', 'carbon_price_sensitivity', 'risk_thresholds'], 'n_keys': 6}`

**POST /api/v1/pcaf-ecl/bridge** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/pcaf-ecl/bridge-from-db** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `pcaf_ecl_bridge` — extracted transformation lines:**
```python
score = min(100.0, 15.0 * math.log10(waci + 1) + 5.0)
result.avg_confidence = round(total_confidence / total_weight, 3)
result.avg_transition_risk_score = round(total_transition_score / total_weight, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).