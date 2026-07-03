# Api::Am
**Module ID:** `api::am` · **Route:** `/api/v1/am` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/am/esg-attribution` | `esg_attribution` | api/v1/routes/am.py |
| POST | `/api/v1/am/paris-alignment` | `paris_alignment` | api/v1/routes/am.py |
| POST | `/api/v1/am/green-bond-screening` | `green_bond_screening` | api/v1/routes/am.py |
| POST | `/api/v1/am/climate-spreads` | `climate_spreads` | api/v1/routes/am.py |
| POST | `/api/v1/am/lp-analytics` | `lp_analytics` | api/v1/routes/am.py |
| POST | `/api/v1/am/optimise` | `optimise` | api/v1/routes/am.py |
| GET | `/api/v1/am/reference-data` | `reference_data` | api/v1/routes/am.py |

### 2.3 Engine `am_engine` (services/am_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_esg_attribution` | holdings, benchmark_esg_score | Decompose portfolio returns into Fama-French 5-factor + ESG factors. |
| `calculate_paris_alignment` | holdings, target_pathway, base_year | Compute portfolio implied temperature rise using weighted carbon intensity |
| `screen_green_bonds` | bonds | Screen bond universe against ICMA GBS criteria and EU GBS Regulation. |
| `calculate_climate_adjusted_spreads` | issuers, carbon_price_eur, warming_scenario | Compute climate-adjusted credit spreads incorporating transition risk, |
| `calculate_lp_analytics` | fund_aum_eur, investors, liquid_assets_pct, side_pocket_pct | Analyse investor base concentration, liquidity coverage, and redemption |
| `optimise_esg_portfolio` | holdings, constraints, risk_free_rate | Simple ESG-tilted portfolio optimisation using analytical mean-variance |
| `get_am_reference_data` |  | Return all reference data used by the AM Engine. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `am_assessments`, `datetime` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/am/reference-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['factor_premia_bps', 'sbti_sector_pathways_pct_pa', 'icma_uop_categories', 'sector_carbon_intensity_tco2e_m', 'pathway_targets_c', 'transition_spread_factors_bps', 'greenium_bps_by_rating', 's`

**POST /api/v1/am/climate-spreads** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/am/esg-attribution** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/am/green-bond-screening** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/am/lp-analytics** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `am_engine` — extracted transformation lines:**
```python
port_ret = sum(h.weight_pct / 100.0 * h.return_pct for h in holdings)
bench_ret = sum(h.benchmark_weight_pct / 100.0 * h.benchmark_return_pct for h in holdings)
active_bps = (port_ret - bench_ret) * 100.0
port_esg = sum(h.weight_pct / total_weight * h.esg_score for h in holdings)
esg_tilt = (port_esg - benchmark_esg_score) / 100.0
port_carbon = sum(h.weight_pct / total_weight * h.carbon_intensity_tco2e_m for h in holdings)
carbon_tilt = (avg_sector_carbon - port_carbon) / avg_sector_carbon
total_factor_explained = esg_contribution + low_carbon_contribution
remaining = active_bps - total_factor_explained
factor_contributions[f] = remaining * (_FACTOR_PREMIA_BPS[f] / factor_total) * 0.6
residual = remaining - sum(factor_contributions.values())
wp = sum(h.weight_pct for h in sec_holdings) / 100.0
wb = sum(h.benchmark_weight_pct for h in sec_holdings) / 100.0
rp = sum(h.weight_pct * h.return_pct for h in sec_holdings) / max(sum(h.weight_pct for h in sec_holdings), 0.01)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).