# Api::Dme_Velocity
**Module ID:** `api::dme_velocity` · **Route:** `/api/v1/dme-velocity` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dme-velocity/process-series` | `process_series` | api/v1/routes/dme_velocity.py |
| POST | `/api/v1/dme-velocity/process-single` | `process_single` | api/v1/routes/dme_velocity.py |
| POST | `/api/v1/dme-velocity/classify-alert` | `classify_alert` | api/v1/routes/dme_velocity.py |
| GET | `/api/v1/dme-velocity/ref/config-defaults` | `get_config_defaults` | api/v1/routes/dme_velocity.py |
| GET | `/api/v1/dme-velocity/ref/regimes` | `get_regime_definitions` | api/v1/routes/dme_velocity.py |

### 2.3 Engine `dme_velocity_engine` (services/dme_velocity_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_canonical_velocity` | m_current, m_previous, delta_t | V(t) = [M(t) - M(t-dt)] / dt |
| `_percentage_velocity` | m_current, m_previous | V%(t) = [M(t) - M(t-1)] / M(t-1) |
| `_z_score` | v_current, v_mean, v_std |  |
| `_canonical_acceleration` | m_current, m_prev, m_prev2, delta_t | A(t) = [M(t) - 2*M(t-1) + M(t-2)] / dt^2 |
| `_ewma` | values, alpha | Exponentially Weighted Moving Average. |
| `VelocityEngine.classify_regime` | z, cfg |  |
| `VelocityEngine.process_series` | req | Process a full metric time series through the 6-stage pipeline. |
| `VelocityEngine.process_single` | req | Process a single new observation (real-time mode). |
| `VelocityEngine.classify_alert_level` | velocity, acceleration, z_score, thresholds | FRS Section 3.1 compound condition: V > k*sigma AND A > 0. |
| `VelocityEngine.get_regime_summary` | outputs | Summarise regime distribution across a series. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `services` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dme-velocity/ref/config-defaults** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['metric_key', 'ewma_alpha', 'lookback_days', 'z_threshold_elevated', 'z_threshold_critical', 'z_threshold_extreme', 'delta_t'], 'n_keys': 7}`

**GET /api/v1/dme-velocity/ref/regimes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regimes', 'defaults', 'pipeline_stages'], 'n_keys': 3}`

**POST /api/v1/dme-velocity/classify-alert** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-velocity/process-series** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-velocity/process-single** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `dme_velocity_engine` — extracted transformation lines:**
```python
velocities = [_canonical_velocity(raw[i], raw[i - 1], dt) for i in range(1, len(raw))]
pct_vel = [_percentage_velocity(raw[i], raw[i - 1]) for i in range(1, len(raw))]
z_scores = [0.0] * len(velocities)
timestamp=ts[i + 1],
raw_value=raw[i + 1],
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).