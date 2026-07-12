# DME Alerts
**Module ID:** `dme-alerts` · **Route:** `/dme-alerts` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time alert feed from the Dynamic Materiality Engine surfacing threshold breaches across entity-level materiality scores, topic momentum shifts, and emerging risk signals. Alerts are classified by severity, topic, and affected entity, with configurable notification routing to risk owners. Historical alert archive supports trend analysis.

> **Business value:** Ensures material ESG risks surface to the attention of responsible risk owners before they escalate into regulatory or reputational incidents. Configurable thresholds and routing prevent alert fatigue while ensuring critical signals are never missed.

**How an analyst works this module:**
- Configure materiality score thresholds and momentum triggers per topic in DME Settings
- Review open critical alerts first, sorted by APS descending
- Acknowledge alerts and assign to the responsible risk owner with a response deadline
- Archive closed alerts and review recurring patterns in the 30-day trend analysis

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `KpiCard`, `LS_PORTFOLIO`, `PILLARS`, `SectionHeader`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `seededRandom` | `seed => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `exposure` | `(c.market_cap_usd_mn \|\| 500) * (0.01 + sr(h, 1) * 0.04);` |
| `ghgInt` | `c.ghg_intensity_tco2e_per_mn \|\| (c.scope1_mt ? c.scope1_mt * 1e6 / Math.max(c.revenue_usd_mn \|\| 1, 1) : sr(h, 20) * 1200);` |
| `weekStart` | `Date.now() - w * 7 * 86400000;` |
| `weekEnd` | `weekStart + 7 * 86400000;` |
| `allAlerts` | `useMemo(() => generateAlerts(companies), [companies]);  /* Apply filters */ const filteredAlerts = useMemo(() => { let filtered = allAlerts;` |
| `diff` | `TIERS[b.tier].severity - TIERS[a.tier].severity;` |
| `kpis` | `useMemo(() => { const totalPD = allAlerts.reduce((s, a) => s + (a.estimated_pd_impact \|\| 0), 0);` |
| `totalVaR` | `allAlerts.reduce((s, a) => s + (a.estimated_var_impact \|\| 0), 0);` |
| `trendData` | `useMemo(() => buildTrendData(allAlerts), [allAlerts]);  /* Pillar pie data */ const pillarPieData = useMemo(() => { return Object.entries(PILLARS).map(([key, p]) => ({ name: p.label, value: pillarCounts[key] \|\| 0, color: p.color, })).filter(d => d.value > 0);` |
| `rows` | `filteredAlerts.map(a => ({` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dme-alerts/process-signal` | `process_signal` | api/v1/routes/dme_alerts.py |
| POST | `/api/v1/dme-alerts/process-batch` | `process_batch` | api/v1/routes/dme_alerts.py |
| GET | `/api/v1/dme-alerts/ref/thresholds` | `get_thresholds` | api/v1/routes/dme_alerts.py |

### 2.3 Engine `dme_alert_engine` (services/dme_alert_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AlertEngine.classify_tier` | z_score, acceleration, thresholds | Compound condition: V > k·σ AND A > 0. |
| `AlertEngine.priority_score` | z_velocity, z_acceleration, exposure_share, sensitivity_alpha, max_z_v, max_z_a | PS = 0.30×norm(Z_V) + 0.20×norm(Z_A) + 0.30×norm(Exposure) + 0.20×norm(Sensitivity) |
| `AlertEngine.priority_band` | score |  |
| `AlertEngine.process_signal` | sig, rules | Process one velocity signal, return AlertRecord or None. |
| `AlertEngine.process_batch` | req | Process multiple signals, return alerts grouped by tier. |
| `AlertEngine.get_reference_data` |  |  |

**Engine `dme_alert_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SLA_HOURS` | `{'LOW': 72, 'MEDIUM': 24, 'HIGH': 4, 'CRITICAL': 0}` |
| `SUPPRESSION_HOURS` | `{'WATCH': 48, 'ELEVATED': 24, 'CRITICAL': 4, 'EXTREME': 0}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `services` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Open Alerts (Unacknowledged) | — | DME alert engine | Count of active alerts not yet acknowledged by an assigned risk owner |
| Critical Alerts (APS > P95) | — | DME alert engine | Count of alerts exceeding the 95th percentile priority score threshold |
| Avg Resolution Time | — | Alert workflow audit | Mean time from alert generation to owner acknowledgement and closure |
| Alert Volume (30d) | — | Alert archive | Total alerts generated in the trailing 30 days across all monitored entities |
- **DME materiality score time series (all topics, all entities)** → Threshold comparison and momentum calculation (Δ score / Δ time) → **Alert inventory with APS, topic, entity, and timestamp**
- **External signal coverage data (news, filings, NGO reports)** → Coverage multiplier calculation from signal count and source diversity → **Alert context pack with supporting evidence**
- **Alert workflow database** → Owner assignment, acknowledgement tracking, and resolution time calculation → **Alert resolution audit trail and trend analytics**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dme-alerts/ref/thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['tier_thresholds', 'priority_bands', 'sla_hours', 'suppression_hours', 'priority_formula', 'compound_condition'], 'n_keys': 6}`

**POST /api/v1/dme-alerts/process-batch** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-alerts/process-signal** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Alert Priority Score
**Headline formula:** `APS = Materiality Score × Momentumβ × Coverage Multiplier`

The priority score weights materiality severity by the rate of score change (momentum) and the breadth of coverage in external data signals. Alerts with APS above the 90th percentile trigger push notifications; those above the 95th percentile escalate to the risk committee feed.

**Standards:** ['EFRAG Materiality Assessment Guidance', 'TCFD Scenario-Driven Materiality']
**Reference documents:** EFRAG (2022) Materiality Assessment Implementation Guidance; TCFD (2021) Guidance on Scenario Analysis for Non-Financial Companies; ESRS 1 (2023) Chapter 3 â€” Materiality Assessment Process

**Engine `dme_alert_engine` — extracted transformation lines:**
```python
v_norm = min(abs(z_velocity), max_z_v) / max_z_v * 100
a_norm = min(abs(z_acceleration), max_z_a) / max_z_a * 100
e_norm = exposure_share * 100
s_norm = min(sensitivity_alpha, 0.30) / 0.30 * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (and frontend↔backend) mismatch flag.** The guide names an *Alert Priority Score*
> `APS = Materiality × Momentumβ × Coverage`. The **backend engine** (`dme_alert_engine.py`) actually
> implements a rigorous, different model — a **four-tier z-score velocity framework** with a
> 30/20/30/20 priority score. But the **frontend page does not call that engine**: it generates alerts
> client-side from `GLOBAL_COMPANY_MASTER` fields using threshold rules and a hash-seeded PRNG, and
> fabricates `estimated_pd_impact` / `estimated_var_impact` with ad-hoc scaling constants. Below,
> §7.1–7.3 document the real backend engine (the production logic) and §7.4 the frontend's heuristic
> alert generation. The PD/VaR impacts shown on-screen have **no validated model behind them** →
> triggers the §8 spec.

### 7.1 Backend engine — four-tier velocity framework (real)

```python
classify_tier(z, acceleration, thresholds):
    if acceleration is not None and acceleration <= 0: return None   # compound gate: A>0 required
    abs_z = |z|
    EXTREME  if abs_z ≥ 4.0   ; CRITICAL if abs_z ≥ 3.0
    ELEVATED if abs_z ≥ 2.0   ; WATCH    if abs_z ≥ 1.5   ; else None
priority_score = 0.30·norm(Z_V) + 0.20·norm(Z_A) + 0.30·norm(exposure) + 0.20·norm(sensitivity)
    norm(Z_V)=min(|Z_V|,4)/4·100 ; norm(Z_A)=min(|Z_A|,3)/3·100 ;
    norm(exp)=exposure_share·100 ; norm(sens)=min(α,0.30)/0.30·100
priority_band: ≤25 LOW, ≤50 MEDIUM, ≤75 HIGH, else CRITICAL
SLA_hours = {LOW 72, MEDIUM 24, HIGH 4, CRITICAL 0}
```

This is a **compound velocity+acceleration alert**: a metric's rate-of-change z-score must exceed the
tier threshold *and* its acceleration must be positive (worsening) — a genuine, defensible signal
design with suppression windows (WATCH 48h → EXTREME 0h) to prevent alert fatigue.

### 7.2 Backend parameterisation

| Element | Value | Provenance |
|---|---|---|
| Tier thresholds (σ) | WATCH 1.5, ELEVATED 2.0, CRITICAL 3.0, EXTREME 4.0 | standard control-chart z-bands |
| Priority weights | Z_V 0.30, Z_A 0.20, exposure 0.30, sensitivity 0.20 | engine design |
| Priority bands | 0-25 / 26-50 / 51-75 / 76-100 | engine |
| SLA hours | 72 / 24 / 4 / 0 | ops policy |
| Suppression hours | 48 / 24 / 4 / 0 | ops policy |

### 7.3 Backend calculation walkthrough

`process_signal` looks up any per-factor rule (thresholds override), classifies the tier from
`z_velocity` + `acceleration`, computes the priority score from the four normalised inputs, maps to a
band and SLA, and emits an `AlertRecord` with a UUID alert id. `process_batch` runs many signals and
returns tier-breakdown counts. The engine is **stateless** — suppression state lives in the DB.

### 7.4 Frontend — heuristic alert generation (what the page shows)

The page **does not** post to `/process-batch`. Instead `generateAlerts(companies)` scans
`GLOBAL_COMPANY_MASTER` and emits alerts on fixed field thresholds, deriving impacts by ad-hoc scaling:

| Rule | trigger | tier logic | est_pd_impact | est_var_impact |
|---|---|---|---|---|
| Transition risk | `transition_risk_score > 70` | >85 Extreme, >78 Critical, else Elevated | `TR × 0.5` | `exposure × 0.01 × TR/100` |
| ESG critically low | `esg_score < 30` | Critical | `(50−ESG) × 0.3` | `exposure × 0.015` |
| GHG intensity | `ghgInt > 500` | >1000 Extreme else Elevated | `ghgInt × 0.002` | `exposure × ghgInt × 1e-5` |
| No SBTi + high S1 | `!sbti ∧ scope1 > 5` | Watch | `0.5` (flat) | `exposure × 0.005` |

`exposure = market_cap × (0.01 + sr(hash)·0.04)` — the exposure base is **seeded** (1–5% of market cap
via `sr(hashStr(ticker))`). The `trigger_z_score` fields are pseudo-z's (`(score−50)/15` etc.), not the
backend's true velocity z-scores. The PD/VaR scaling constants (0.5, 0.3, 0.002, 0.01…) are arbitrary.

### 7.5 Worked example (frontend)

Company with `transition_risk_score = 82`, `market_cap = 4000`, `sr(hash)=0.5`:
- `exposure = 4000 × (0.01 + 0.5·0.04) = 4000 × 0.03 = $120M`.
- Tier: 82 > 78 → **Critical**. `trigger_z = (82−50)/15 = 2.13`.
- `est_pd_impact = 82 × 0.5 = 41.0` (bp? %? — units undefined).
- `est_var_impact = 120 × 0.01 × 82/100 = 120 × 0.0082 = $0.98M`.
These numbers populate the KPIs (`totalPD`, `totalVaR`) — but they are heuristic scalings, not outputs
of any credit model. A model-validation team would reject `PD = transition_risk × 0.5` outright.

### 7.6 Data provenance & limitations

- Backend engine is **real and sound** but **not wired to the page**. Frontend alerts run off
  `GLOBAL_COMPANY_MASTER` (mixed real/curated) with `sr()`-seeded exposure and hard-coded impact
  scalings.
- PD/VaR "impacts" have no term structure, no calibration, and undefined units — purely illustrative.
- The two systems use different methodologies (compound velocity z-score vs static field thresholds),
  so the on-screen figures are not what the documented engine would produce.

## 8 · Model Specification

**Status: specification — not yet implemented in code (on the frontend path).** The backend engine's
tiering is production-grade for *signal detection*, but the **PD/VaR impact translation** shown to
users is unmodelled. This spec covers the missing link: converting a materiality velocity alert into a
calibrated credit-risk repricing.

**8.1 Purpose & scope.** Given a DME velocity alert on an entity/factor, estimate the ΔPD and ΔVaR it
implies for exposures to that entity, for risk-owner triage and limit management.

**8.2 Conceptual approach.** Map the alert's z-scored materiality shock to a rating/PD migration via a
**factor-sensitivity (beta) model**, then to VaR via exposure × LGD × ΔPD — mirroring Moody's
climate-adjusted EDF (materiality shock → asset-value drift → PD) and Aladdin transition-risk
repricing. Wire the frontend to the real backend `process_batch` for tiering; add this repricing layer
on top.

**8.3 Mathematical specification.**
```
shock_z   = alert.velocity_z_score                       # from backend engine
ΔPD       = PD₀ · (exp(β_f · shock_z · σ_f) − 1)         # factor-beta PD lift, capped
            β_f = entity's sensitivity to factor f (sensitivity_alpha), σ_f = factor vol
ΔVaR      = EAD · LGD · ΔPD · horizon_adj                # incremental credit VaR
priority  = backend PS (0.30 Z_V + 0.20 Z_A + 0.30 exp + 0.20 sens)   # already implemented
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Baseline PD | PD₀ | internal rating / Moody's EDF |
| Factor beta | β_f | regression of PD moves on ESG-factor shocks (NGFS/EBA data) |
| Factor volatility | σ_f | historical materiality-score vol |
| LGD | LGD | Basel/IFRS 9 downturn LGD |
| Exposure | EAD | portfolio holdings (`portfolio_holdings`) |

**8.4 Data requirements.** Entity PD₀, factor betas, EAD/LGD from `portfolio_holdings`, and the live
velocity signals feeding the backend engine. Reuse `climate-credit-integration` for the PD/LGD
conditioning machinery.

**8.5 Validation & benchmarking.** Backtest: do entities that triggered CRITICAL/EXTREME alerts show
subsequent rating downgrades or spread widening? Reconcile ΔPD against Moody's climate-adjusted EDF and
ΔVaR against the platform's `climate-credit-integration` ECL uplift for the same shock.

**8.6 Limitations & model risk.** Factor betas are noisy and regime-dependent; cap ΔPD and floor at
zero. Alert velocity z-scores can spike on data artefacts — require the compound A>0 gate (already in
the engine) plus a minimum coverage threshold before repricing. Conservative fallback: surface the
tier/priority (validated) and label PD/VaR as "indicative, pending model calibration" until betas are
backtested.

**Framework alignment:** the backend engine reflects statistical process-control z-banding; the
repricing spec aligns with **NGFS** transition-risk transmission, **Moody's/KMV EDF** structural PD,
Basel/**IFRS 9** ECL (EAD × LGD × PD), and BlackRock Aladdin-style factor repricing — the frameworks
the guide's APS gestures at but does not implement.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the real velocity engine and calibrate its thresholds (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents a frontend↔backend split: `dme_alert_engine.py` implements a rigorous four-tier z-score velocity framework (compound gate `V > k·σ AND A > 0`, 30/20/30/20 priority score, SLA/suppression tables) — but the page never calls it, instead generating alerts client-side from `GLOBAL_COMPANY_MASTER` with a hash-seeded PRNG and fabricating `estimated_pd_impact`/`estimated_var_impact` with ad-hoc constants. Both POST endpoints show `skipped` in the lineage trace — the production path is effectively unexercised. Evolution A makes the engine the only alert source and calibrates it.

**How.** (1) Feed: a scheduled job computes topic-score velocity/acceleration from the DME materiality time series (dme-index/dme-entity outputs) and posts to `POST /process-batch`; alerts persist to a new `dme_alert_archive` table (currently no persistence — "historical alert archive" in the overview is aspirational). (2) Page renders archive + `GET /ref/thresholds`, deleting `generateAlerts()` and the fabricated PD/VaR fields (or replacing them with honest links to `dme-pd-engine` outputs where an entity mapping exists). (3) Calibration: fit tier thresholds (currently fixed 3.0/4.0 σ) to the empirical signal distribution per topic, and backtest alert precision against subsequently-confirmed controversies from `esg-controversy` data.

**Prerequisites.** A real score time series (the DME family must persist history first); the §8-flagged PD/VaR fabrication removed before anything ships. **Acceptance:** lineage re-sweep shows both POSTs `passed` with `dme_alert_archive` as source table; zero client-side alert generation; threshold calibration documented in the response payload.

### 9.2 Evolution B — Alert-triage copilot that explains and simulates escalations (LLM tier 2)

**What.** An on-page analyst that answers "why is this CRITICAL?" by citing the engine's own decomposition — z-velocity, acceleration gate, exposure share, sensitivity — from the alert record, and runs what-ifs as tool calls: "would this still fire at a 3.5σ threshold?" → `POST /process-signal` with modified thresholds; "show me everything that would breach if suppression dropped to 12h" → `POST /process-batch` re-run. It also drafts the owner-notification message with the SLA deadline from `SLA_HOURS`.

**How.** Tool schemas from the module's 3 existing OpenAPI operations (all engine-backed, Pydantic-typed); grounding corpus = this Atlas record's §5 formula block and §7.1–7.3 engine documentation. The no-fabrication validator matches every z-score and priority figure to tool outputs. Escalation drafting is text-only — acknowledgment/assignment mutations wait for the alert-workflow tables from Evolution A and sit behind explicit confirmation per tier-2 RBAC convention.

**Prerequisites (hard).** Evolution A first — a copilot narrating the current client-side fabricated alerts (with their unvalidated PD/VaR impacts) would explain numbers no engine produced, precisely the failure mode the exemplar module warns about. **Acceptance:** every numeric in a triage answer traces to a `/process-signal` or archive response; asking for the alert's "expected loss" refuses until a validated impact model exists.