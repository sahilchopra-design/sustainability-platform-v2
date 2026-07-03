# Api::Lgd_Vintage
**Module ID:** `api::lgd_vintage` · **Route:** `/api/v1/lgd-vintage` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/lgd-vintage/downturn` | `calculate_downturn_lgd` | api/v1/routes/lgd_vintage.py |
| GET | `/api/v1/lgd-vintage/downturn/regulatory-floors` | `get_regulatory_floors` | api/v1/routes/lgd_vintage.py |
| GET | `/api/v1/lgd-vintage/downturn/addons` | `get_downturn_addons` | api/v1/routes/lgd_vintage.py |
| GET | `/api/v1/lgd-vintage/downturn/sector-severity` | `get_sector_severity` | api/v1/routes/lgd_vintage.py |
| GET | `/api/v1/lgd-vintage/downturn/country-severity` | `get_country_severity` | api/v1/routes/lgd_vintage.py |
| GET | `/api/v1/lgd-vintage/downturn/climate-haircuts` | `get_climate_haircuts` | api/v1/routes/lgd_vintage.py |
| POST | `/api/v1/lgd-vintage/vintage` | `run_vintage_analysis` | api/v1/routes/lgd_vintage.py |
| GET | `/api/v1/lgd-vintage/vintage/ecb-coverage` | `get_ecb_coverage_table` | api/v1/routes/lgd_vintage.py |
| GET | `/api/v1/lgd-vintage/vintage/benchmark-rates` | `get_benchmark_rates` | api/v1/routes/lgd_vintage.py |

### 2.3 Engine `lgd_downturn_engine` (services/lgd_downturn_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `LGDDownturnEngine.calculate` | inp | Calculate downturn LGD for a single exposure. |
| `LGDDownturnEngine.calculate_batch` | inputs | Calculate downturn LGD for a batch of exposures. |
| `LGDDownturnEngine._get_floor_key` | asset_class, collateral_type | Map asset class + collateral type to regulatory floor key. |
| `LGDDownturnEngine.get_regulatory_floors` |  | Return CRR2 Art. 164 regulatory LGD floors. |
| `LGDDownturnEngine.get_downturn_addons` |  | Return downturn add-on table by collateral type. |
| `LGDDownturnEngine.get_sector_severity` |  | Return sector downturn severity multipliers. |
| `LGDDownturnEngine.get_country_cycle_severity` |  | Return country economic cycle severity factors. |
| `LGDDownturnEngine.get_climate_stranded_haircuts` |  | Return climate stranded asset haircuts by sector. |
| `LGDDownturnEngine.get_green_premium_table` |  | Return EPC rating green premium / brown discount table. |

### 2.3 Engine `vintage_analyzer` (services/vintage_analyzer.py)
| Function | Args | Purpose |
|---|---|---|
| `VintageAnalyzer.analyze` | exposures | Run full vintage analysis on exposure portfolio. |
| `VintageAnalyzer._build_cohorts` | exposures | Group exposures into vintage cohorts by year or quarter. |
| `VintageAnalyzer._compute_cohort` | label, exposures | Compute metrics for a single vintage cohort. |
| `VintageAnalyzer._build_vintage_matrix` | cohorts, exposures | Build vintage matrix (cumulative + marginal DR by vintage age). |
| `VintageAnalyzer._compute_ecb_required_coverage` | npes | Compute total required provision under ECB calendar provisioning |
| `VintageAnalyzer._compute_green_trend` | cohorts | Compute green origination trend over time. |
| `VintageAnalyzer.get_ecb_npe_coverage_table` |  | Return ECB NPE calendar provisioning backstop table. |
| `VintageAnalyzer.get_benchmark_default_rates` |  | Return benchmark cumulative default rates by vintage age. |
| `VintageAnalyzer.get_early_warning_threshold` |  | Return early warning threshold multiplier. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/lgd-vintage/downturn/addons** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['downturn_addons', 'regulation'], 'n_keys': 2}`

**GET /api/v1/lgd-vintage/downturn/climate-haircuts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['stranded_haircuts', 'physical_risk_multipliers', 'green_premium', 'scenario_multipliers'], 'n_keys': 4}`

**GET /api/v1/lgd-vintage/downturn/country-severity** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['country_cycle_severity'], 'n_keys': 1}`

**GET /api/v1/lgd-vintage/downturn/regulatory-floors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulatory_floors', 'regulation'], 'n_keys': 2}`

**GET /api/v1/lgd-vintage/downturn/sector-severity** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_severity'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `lgd_downturn_engine` — extracted transformation lines:**
```python
dt_addon = raw_addon * country_sev * sector_mult * self._scenario_mult
country_adj = raw_addon * (country_sev - 1.0) * sector_mult * self._scenario_mult
sector_adj = raw_addon * country_sev * (sector_mult - 1.0) * self._scenario_mult
climate_stranded = stranded_base * self._scenario_mult
avg_lr = sum(r.long_run_avg_lgd for r in results) / n if n > 0 else 0.0
avg_dt = sum(r.downturn_lgd for r in results) / n if n > 0 else 0.0
```

**Engine `vintage_analyzer` — extracted transformation lines:**
```python
overall_dr = total_defaults / total_count if total_count > 0 else 0.0
cum_dr = n_defaults / n if n > 0 else 0.0
s2_migration = (s2 + s3) / n * 100 if n > 0 else 0.0
npe_coverage = npe_provision / npe_balance if npe_balance > 0 else 0.0
ecb_shortfall = max(ecb_required - npe_provision, 0.0)
vintage_age = self.reference_year - year
early_warning = cum_dr > benchmark_dr * (1.0 + EARLY_WARNING_THRESHOLD)
green_pct = green_count / n * 100 if n > 0 else 0.0
age_years = max(1, (exp.months_to_default + 6) // 12)
age_labels = list(range(1, max_age + 1))
cum_dr = cumulative / n if n > 0 else 0.0
marg_dr = defaults_at_age / n if n > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).