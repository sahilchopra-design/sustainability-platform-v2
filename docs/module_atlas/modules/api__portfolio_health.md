# Api::Portfolio_Health
**Module ID:** `api::portfolio_health` · **Route:** `/api/v1/portfolio-health` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/portfolio-health/{portfolio_id}/scores` | `get_health_scores` | api/v1/routes/portfolio_health.py |
| GET | `/api/v1/portfolio-health/{portfolio_id}/alerts` | `get_alerts` | api/v1/routes/portfolio_health.py |
| GET | `/api/v1/portfolio-health/{portfolio_id}/history` | `get_score_history_endpoint` | api/v1/routes/portfolio_health.py |
| POST | `/api/v1/portfolio-health/{portfolio_id}/refresh` | `refresh_health_scores` | api/v1/routes/portfolio_health.py |
| PATCH | `/api/v1/portfolio-health/alerts/{alert_id}/read` | `mark_alert_as_read` | api/v1/routes/portfolio_health.py |
| PATCH | `/api/v1/portfolio-health/{portfolio_id}/read-all` | `mark_all_alerts_read` | api/v1/routes/portfolio_health.py |
| GET | `/api/v1/portfolio-health/{portfolio_id}/unread-count` | `get_unread_alert_count` | api/v1/routes/portfolio_health.py |

### 2.3 Engine `alert_engine` (services/alert_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_engine` |  | Lazy-import to avoid circular imports at module load time. |
| `_write_alert` | alert_type, severity, title, message, portfolio_id, entity_lei | Persist a single alert to the platform_alerts table. |
| `_dedup_check` | portfolio_id, alert_type, within_hours | Return True if a non-resolved alert of this type already exists for |
| `evaluate_glidepath_deviation` | portfolio_id, sector, actual_waci, glidepath_waci | Fire a glidepath_deviation alert if actual WACI exceeds the NZBA sector |
| `evaluate_dqs` | portfolio_id, weighted_dqs, coverage_pct | Fire alerts when data quality degrades (DQS > threshold) or PCAF coverage |
| `evaluate_dscr` | portfolio_id, asset_name, min_dscr, entity_lei | Fire alert when a project finance asset falls below DSCR thresholds. |
| `evaluate_sicr` | portfolio_id, asset_name, pd_uplift_bps, triggers, entity_lei | Fire alert on SICR trigger (ECL stage migration event). |
| `evaluate_transition_coverage` | portfolio_id, entity_name, exposure_pct, transition_plan_status, entity_lei | Fire alert when a large-exposure counterparty (>5% AUM) has no transition |
| `evaluate_crrem_crossover` | portfolio_id, asset_name, stranding_year, current_year, entity_lei | Fire alert when a real estate asset crosses (or is near) its CRREM stranding year. |
| `get_portfolio_alerts` | portfolio_id, unread_only, limit | Retrieve alerts for a portfolio, newest first. |
| `mark_alert_read` | alert_id | Mark a single alert as read. |
| `mark_all_read` | portfolio_id | Mark all unread alerts for a portfolio as read. Returns count updated. |
| `get_unread_count` | portfolio_id | Return unread alert count for a portfolio (used by nav badge). |

### 2.3 Engine `portfolio_health_engine` (services/portfolio_health_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_rag` | value |  |
| `_clamp` | v |  |
| `_get_engine` |  |  |
| `_exec` | engine, query, params |  |
| `_scalar` | engine, query, params |  |
| `_compute_climate_health` | engine, portfolio_id | Compare actual WACI per sector (from pcaf_time_series) against glidepath_value. |
| `_compute_financial_resilience` | engine, portfolio_id | Estimates credit health from two signals: |
| `_compute_transition_readiness` | engine, portfolio_id | Measures how prepared counterparties are for net-zero: |
| `compute_portfolio_health` | portfolio_id | Compute all three health scores for a portfolio. |
| `get_score_history` | portfolio_id, weeks | Return weekly score history for sparkline charts. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `DB` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/portfolio-health/{portfolio_id}/alerts** — status `passed`, provenance ['db-empty'], source tables: `platform_alerts`
Output: `{'type': 'object', 'keys': ['portfolio_id', 'alerts', 'total'], 'n_keys': 3}`

**GET /api/v1/portfolio-health/{portfolio_id}/history** — status `passed`, provenance ['db-empty'], source tables: `pcaf_time_series`
Output: `{'type': 'object', 'keys': ['portfolio_id', 'history', 'periods'], 'n_keys': 3}`

**GET /api/v1/portfolio-health/{portfolio_id}/scores** — status `passed`, provenance ['real-db'], source tables: `assets_pg`, `ecl_exposures`, `pcaf_time_series`, `platform_alerts`, `portfolios_pg`, `project_finance_assessments`
Output: `{'type': 'object', 'keys': ['portfolio_id', 'portfolio_name', 'climate_health', 'financial_resilience', 'transition_readiness', 'overall_score', 'alert_count', 'data_available', 'last_updated'], 'n_keys': 9}`

**GET /api/v1/portfolio-health/{portfolio_id}/unread-count** — status `passed`, provenance ['real-db'], source tables: `platform_alerts`
Output: `{'type': 'object', 'keys': ['portfolio_id', 'unread_count'], 'n_keys': 2}`

**PATCH /api/v1/portfolio-health/alerts/{alert_id}/read** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `alert_engine` — extracted transformation lines:**
```python
deviation = (actual_waci - glidepath_waci) / glidepath_waci
deviation_pct = round(deviation * 100, 1)
metric_value=coverage_pct * 100,
threshold=PCAF_COVERAGE_CRITICAL_PCT * 100,
metric_value=coverage_pct * 100,
threshold=PCAF_COVERAGE_WARNING_PCT * 100,
metric_value=exposure_pct * 100,
threshold=LARGE_EXPOSURE_PCT * 100,
years_to_strand = stranding_year - current_year
```

**Engine `portfolio_health_engine` — extracted transformation lines:**
```python
0   = 50%+ above glidepath
0   = >20% AUM in Stage 2/3 ECL or DSCR breach
100 = all large exposures SBTi-aligned with validated plans
Score = 100 - average_glidepath_deviation_pct (capped at 0–100).
dev = (float(r.actual_value) - float(r.glidepath_value)) / float(r.glidepath_value)
avg_dev = sum(deviations) / len(deviations)
score = _clamp(100.0 - (avg_dev / 0.50) * 100.0)
stage_fraction = (stage2_3_exposure / total_ecl_exposure) if total_ecl_exposure > 0 else 0.0
ecl_score = _clamp(100.0 - (stage_fraction / 0.20) * 100.0)
dscr_score = _clamp((float(min_dscr) - 1.25) / (1.40 - 1.25) * 100.0)
score = 0.6 * ecl_score + 0.4 * dscr_score
sbti_pct = sbti_exposure / total_exposure
plan_pct = plan_exposure / total_exposure
dqs_pct = good_dqs_exposure / total_exposure
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).