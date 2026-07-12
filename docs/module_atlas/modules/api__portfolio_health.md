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
| `_write_alert` | alert_type, severity, title, message, portfolio_id, entity_lei, metric_value, threshold | Persist a single alert to the platform_alerts table. |
| `_dedup_check` | portfolio_id, alert_type, within_hours | Return True if a non-resolved alert of this type already exists for this portfolio within the dedup window. Prevents duplicate flooding. |
| `evaluate_glidepath_deviation` | portfolio_id, sector, actual_waci, glidepath_waci | Fire a glidepath_deviation alert if actual WACI exceeds the NZBA sector glidepath by more than the warning or critical threshold. |
| `evaluate_dqs` | portfolio_id, weighted_dqs, coverage_pct | Fire alerts when data quality degrades (DQS > threshold) or PCAF coverage falls below acceptable levels. |
| `evaluate_dscr` | portfolio_id, asset_name, min_dscr, entity_lei | Fire alert when a project finance asset falls below DSCR thresholds. |
| `evaluate_sicr` | portfolio_id, asset_name, pd_uplift_bps, triggers, entity_lei | Fire alert on SICR trigger (ECL stage migration event). |
| `evaluate_transition_coverage` | portfolio_id, entity_name, exposure_pct, transition_plan_status, entity_lei | Fire alert when a large-exposure counterparty (>5% AUM) has no transition plan in place — key NZBA engagement requirement. |
| `evaluate_crrem_crossover` | portfolio_id, asset_name, stranding_year, current_year, entity_lei | Fire alert when a real estate asset crosses (or is near) its CRREM stranding year. |
| `get_portfolio_alerts` | portfolio_id, unread_only, limit | Retrieve alerts for a portfolio, newest first. Returns empty list if DB is unavailable (graceful degrade). |
| `mark_alert_read` | alert_id | Mark a single alert as read. |
| `mark_all_read` | portfolio_id | Mark all unread alerts for a portfolio as read. Returns count updated. |
| `get_unread_count` | portfolio_id | Return unread alert count for a portfolio (used by nav badge). |

**Engine `alert_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `GLIDEPATH_DEVIATION_WARNING_PCT` | `0.1` |
| `GLIDEPATH_DEVIATION_CRITICAL_PCT` | `0.25` |
| `DQS_WARNING_THRESHOLD` | `3.5` |
| `DQS_CRITICAL_THRESHOLD` | `4.5` |
| `PCAF_COVERAGE_WARNING_PCT` | `0.7` |
| `PCAF_COVERAGE_CRITICAL_PCT` | `0.5` |
| `DSCR_MINIMUM` | `1.25` |
| `DSCR_CAUTION` | `1.35` |
| `LARGE_EXPOSURE_PCT` | `0.05` |
| `MODULE_LINKS` | `{'glidepath_deviation': '/glidepath-tracker', 'dqs_degradation': '/financial-risk', 'pcaf_coverage_low': '/portfolio-analytics', 'dscr_breach': '/sector-assessments', 'crrem_crossover': '/real-estate-assessment', 'sicr_trigger': '/financial-risk', 'transition_plan_missing': '/regulatory', 'engagemen` |

### 2.3 Engine `portfolio_health_engine` (services/portfolio_health_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_rag` | value |  |
| `_clamp` | v |  |
| `_get_engine` |  |  |
| `_exec` | engine, query, params |  |
| `_scalar` | engine, query, params |  |
| `_compute_climate_health` | engine, portfolio_id | Compare actual WACI per sector (from pcaf_time_series) against glidepath_value. Score = 100 - average_glidepath_deviation_pct (capped at 0–100). If no time-series data exists, return neutral 50 with data_available note. |
| `_compute_financial_resilience` | engine, portfolio_id | Estimates credit health from two signals: 1. ECL stage distribution (% AUM in Stage 1 / 2 / 3 from ecl_exposures table) 2. DSCR minimum (from project_finance_assessments table if available) Score degrades based on Stage 2/3 exposure fraction and DSCR breaches. |
| `_compute_transition_readiness` | engine, portfolio_id | Measures how prepared counterparties are for net-zero: - % AUM with SBTi-aligned targets - % AUM with validated/on-track transition plans - PCAF DQS coverage (proxy for data availability to track) Score = weighted average: SBTi 40%, transition plan 40%, DQS ≤ 3 20% |
| `compute_portfolio_health` | portfolio_id | Compute all three health scores for a portfolio. Safe to call at any time — returns neutral AMBER scores if data is unavailable. |
| `get_score_history` | portfolio_id, weeks | Return weekly score history for sparkline charts. Currently returns simulated history based on pcaf_time_series; will be replaced by a snapshot store in a future sprint. |

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

**PATCH /api/v1/portfolio-health/{portfolio_id}/read-all** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/portfolio-health/{portfolio_id}/refresh** — status `passed`, provenance ['real-db'], source tables: `assets_pg`, `ecl_exposures`, `pcaf_time_series`, `platform_alerts`, `portfolios_pg`, `project_finance_assessments`
Output: `{'type': 'object', 'keys': ['message', 'scores'], 'n_keys': 2}`

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

## 7 · Methodology Deep Dive

The `portfolio_health` domain (`/api/v1/portfolio-health`) is a **three-score sustainability
pulse** (`portfolio_health_engine.py`) plus a **threshold-driven alert engine**
(`alert_engine.py`). Modelled on a WHOOP-style daily readiness score, it distils a portfolio
into Climate Health, Financial Resilience and Transition Readiness (each 0-100) with RAG bands
and a "what to do" action link.

### 7.1 What the module computes

Three scores from live DB tables, plus an overall simple average and an unread-alert count:

```
climate_health       = 100 − (avg_glidepath_deviation / 0.50)·100      (WACI vs NZBA glidepath)
financial_resilience = 0.6·ecl_score + 0.4·dscr_score
transition_readiness = 40·sbti_pct + 40·plan_pct + 20·dqs_pct
overall              = mean(three scores)
RAG                  = GREEN ≥70 · AMBER ≥40 · RED <40
```

Every score degrades gracefully to a neutral AMBER 50 when its source data is missing.

### 7.2 Parameterisation / scoring rubric

**Climate Health** (`_compute_climate_health`): reads latest-year WACI actual vs
`glidepath_value` per sector from `pcaf_time_series`; only above-glidepath deviations penalise;
0% deviation → 100, 50% → 0.

**Financial Resilience** (`_compute_financial_resilience`): ECL score `100 − (stage2/3
fraction / 0.20)·100` (0% → 100, ≥20% → 0); DSCR score `(min_dscr − 1.25)/(1.40 − 1.25)·100`
(≥1.40 → 100, ≤1.25 → 0; neutral 75 if no project-finance data); combined 60/40.

**Transition Readiness** (`_compute_transition_readiness`): exposure-weighted shares of AUM
that are SBTi-aligned (×40), have a received/validated/on-track transition plan (×40), and have
PCAF DQS ≤3 (×20).

**Alert thresholds** (`alert_engine.py`): glidepath deviation WARN 10% / CRIT 25%; DQS WARN 3.5
/ CRIT 4.5; PCAF coverage WARN 70% / CRIT 50%; DSCR CRIT 1.25 / WARN 1.35; large exposure 5%.
Alerts dedup within a 24 h window and carry a frontend module link.

**Provenance:** thresholds are platform calibration constants aligned to NZBA glidepath
practice, IFRS 9 staging and project-finance DSCR covenants.

### 7.3 Calculation walkthrough

`compute_portfolio_health(portfolio_id)` fetches the portfolio name, computes the three scores
from Postgres, averages them, attaches the unread alert count, and stamps `last_updated`. Each
score returns a `HealthScore` with value, RAG, a human label, an action string and an
`action_link` route (e.g. `/glidepath-tracker`, `/financial-risk`, `/regulatory`). If the DB is
unavailable the whole result degrades to `data_available=False` with neutral scores.

### 7.4 Worked example

Portfolio with average WACI 15% above glidepath; ECL stage-2/3 fraction 8%; min DSCR 1.35;
40% AUM SBTi-aligned, 55% with plans, 70% at DQS ≤3.

- **Climate:** `100 − (0.15/0.50)·100 = 100 − 30 = 70` → **GREEN** (label "WACI on track…").
- **Financial:** ECL `100 − (0.08/0.20)·100 = 60`; DSCR `(1.35−1.25)/(0.15)·100 = 66.7`;
  combined `0.6·60 + 0.4·66.7 = 36 + 26.7 = 62.7` → **AMBER**.
- **Transition:** `40·0.40 + 40·0.55 + 20·0.70 = 16 + 22 + 14 = 52` → **AMBER**.
- **Overall:** `(70 + 62.7 + 52)/3 = 61.6` → **AMBER**.

An alert fires: WACI 15% above glidepath exceeds the 10% WARN threshold → `glidepath_deviation`
WARNING linked to `/glidepath-tracker`.

### 7.5 Data provenance & limitations

- Scores are **computed from live portfolio tables** (`pcaf_time_series`, `ecl_exposures`,
  `assets_pg`, `project_finance_assessments`) — no synthetic fabrication. Missing tables
  degrade to neutral 50 rather than erroring.
- `get_score_history` currently returns year-by-year climate scores as a proxy for weekly
  sparklines; a true snapshot store is a noted future enhancement.
- The score mappings (e.g. 50% glidepath deviation = 0) are linear calibration choices, not
  regulatory formulas.

**Framework alignment:** **NZBA** — Climate Health measures WACI against the NZBA sectoral
decarbonisation glidepath, the alliance's core alignment metric. **IFRS 9** — Financial
Resilience uses ECL Stage 2/3 exposure (the SICR staging model) and provisioning headroom.
**PCAF** — Transition Readiness and the DQS-degradation alert use PCAF data-quality coverage.
**Project-finance covenant practice** — the DSCR 1.25/1.35/1.40 bands reflect standard minimum
debt-service-coverage thresholds. The alert engine operationalises these as continuous
supervisory monitoring.

## 9 · Future Evolution

### 9.1 Evolution A — Predictive health trajectory and calibrated alert thresholds (analytics ladder: rung 2 → 4)

**What.** A three-score sustainability pulse (Climate Health = `100 − avg_glidepath_deviation/
0.50×100`; Financial Resilience = `0.6·ecl_score + 0.4·dscr_score`; Transition Readiness =
`40·sbti_pct + 40·plan_pct + 20·dqs_pct`) plus a threshold-driven alert engine, modelled on a
WHOOP-style readiness score. Scores read live DB tables (`pcaf_time_series`, `ecl_exposures`,
`portfolios_pg`) and degrade to a neutral AMBER 50 when data is missing. The alert thresholds
(PCAF coverage, large-exposure %, stranding horizon) are static constants, and §4.2 shows
`platform_alerts` and `pcaf_time_series` history traces **db-empty**. Evolution A adds forecasting
and calibration.

**How.** (1) Add a health-trajectory forecast: from the `pcaf_time_series` history the module
already reads, project each score forward and flag portfolios trending toward a RAG downgrade
before they cross it (rung 4 predictive) — a "readiness trend", not just today's snapshot. (2)
Calibrate the alert thresholds (large-exposure %, coverage warning/critical) against portfolio
outcomes rather than fixed constants. (3) Populate `platform_alerts` and the time-series history
so `/history` and `/alerts` return real data. (4) Bench-pin the three score formulas and the
graceful-degradation neutral values.

**Prerequisites.** `pcaf_time_series` history and `platform_alerts` populated (D1); an outcome
set for threshold calibration. **Acceptance:** `/scores` includes a forward trajectory and a
pre-emptive downgrade flag; `/history` and `/alerts` return real-db data; alert thresholds carry
calibration provenance; bench pins reproduce the three scores.

### 9.2 Evolution B — Portfolio-readiness copilot with proactive alerts (LLM tier 2)

**What.** A copilot that reads a portfolio's three scores and explains them WHOOP-style — "your
Climate Health dropped to AMBER 58 because your utilities sleeve is 30% above the NZBA glidepath;
Financial Resilience is RED, driven by ECL Stage-2 migration; here's what to do" — each figure
tool-sourced, plus alert triage.

**How.** Read endpoints (`/scores`, `/alerts`, `/history`, `/unread-count`) form the tool set;
the score decomposition lets the copilot attribute a poor overall to the specific driver
(glidepath deviation vs ECL stage vs DQS). Alert read/mark actions (`PATCH .../read`,
`/read-all`) and `/refresh` are the gated write actions. The "what to do" action link each score
already carries becomes the copilot's remediation hook. This is a natural home-page/orchestrator
entry point routing to the underlying glidepath, ECL, and PCAF copilots.

**Prerequisites.** Evolution A's populated history/alerts for meaningful trend and alert answers.
**Acceptance:** every score, RAG, and alert traces to a tool response; the copilot names the
driver table behind each score; it discloses when a score is the neutral AMBER-50 fallback due to
missing data rather than a real reading; mark-read actions log to audit.