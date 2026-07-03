# DME Alerts
**Module ID:** `dme-alerts` · **Route:** `/dme-alerts` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time alert feed from the Dynamic Materiality Engine surfacing threshold breaches across entity-level materiality scores, topic momentum shifts, and emerging risk signals. Alerts are classified by severity, topic, and affected entity, with configurable notification routing to risk owners. Historical alert archive supports trend analysis.

> **Business value:** Ensures material ESG risks surface to the attention of responsible risk owners before they escalate into regulatory or reputational incidents. Configurable thresholds and routing prevent alert fatigue while ensuring critical signals are never missed.

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
| `diff` | `TIERS[b.tier].severity - TIERS[a.tier].severity;` |
| `totalPD` | `allAlerts.reduce((s, a) => s + (a.estimated_pd_impact \|\| 0), 0);` |
| `totalVaR` | `allAlerts.reduce((s, a) => s + (a.estimated_var_impact \|\| 0), 0);` |
| `rows` | `filteredAlerts.map(a => ({` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `csv` | `[keys.join(','), ...trendData.map(r => keys.map(k => r[k]).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `csv` | `['pillar,count', ...pillarPieData.map(d => `${d.name},${d.value}`)].join('\n');` |
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
**Standards:** ['EFRAG Materiality Assessment Guidance', 'TCFD Scenario-Driven Materiality']

**Engine `dme_alert_engine` — extracted transformation lines:**
```python
v_norm = min(abs(z_velocity), max_z_v) / max_z_v * 100
a_norm = min(abs(z_acceleration), max_z_a) / max_z_a * 100
e_norm = exposure_share * 100
s_norm = min(sensitivity_alpha, 0.30) / 0.30 * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).