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
