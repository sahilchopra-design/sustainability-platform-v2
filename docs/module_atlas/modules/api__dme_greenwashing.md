# Api::Dme_Greenwashing
**Module ID:** `api::dme_greenwashing` · **Route:** `/api/v1/dme-greenwashing` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dme-greenwashing/detect` | `detect_greenwashing` | api/v1/routes/dme_greenwashing.py |
| POST | `/api/v1/dme-greenwashing/quick-scan` | `quick_scan` | api/v1/routes/dme_greenwashing.py |
| GET | `/api/v1/dme-greenwashing/ref/config-defaults` | `get_config_defaults` | api/v1/routes/dme_greenwashing.py |
| GET | `/api/v1/dme-greenwashing/ref/methodology` | `get_methodology` | api/v1/routes/dme_greenwashing.py |

### 2.3 Engine `dme_greenwashing_engine` (services/dme_greenwashing_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `GreenwashingEngine.credibility_weighted_score` | raw_score, pcaf_score, age_months, half_life_months | W = RawScore × QualityWeight × Freshness |
| `GreenwashingEngine._ema` | series, alpha |  |
| `GreenwashingEngine._central_diff_velocity` | ema_series | v_t = (EMA_{t+1} - EMA_{t-1}) / 2 |
| `GreenwashingEngine._cusum` | series, mean, std, k_factor, h | CUSUM change-point detection. |
| `GreenwashingEngine.detect` | req | Full detection: compare marketing vs operational over time. |
| `GreenwashingEngine.quick_scan` | req | Lightweight single-point credibility gap scan. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `services` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dme-greenwashing/ref/config-defaults** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ema_alpha', 'cusum_k_factor', 'cusum_h', 'warning_threshold', 'critical_threshold'], 'n_keys': 5}`

**GET /api/v1/dme-greenwashing/ref/methodology** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['credibility_weighting', 'detection_conditions', 'cusum', 'risk_levels_quick_scan'], 'n_keys': 4}`

**POST /api/v1/dme-greenwashing/detect** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-greenwashing/quick-scan** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `dme_greenwashing_engine` — extracted transformation lines:**
```python
QualityWeight = 1 - (PCAF - 1) × 0.2
Freshness = exp(-λ × age),  λ = ln(2) / half_life
qw = max(0.0, min(1.0, 1.0 - (pcaf_score - 1) * 0.2))
lam = np.log(2) / half_life_months
freshness = float(np.exp(-lam * age_months))
weighted_score=raw_score * qw * freshness,
k = k_factor * std
c = max(0.0, cusum[-1] + (d - mean) - k)
divergence = [m - o for m, o in zip(mw, ow)]
z_scores = [(d - div_mean) / div_std if div_std > 0 else 0.0 for d in divergence]
latest_z = z_scores[-1]
latest_v = velocity[-1] if velocity else 0.0
accel = (velocity[-1] - velocity[-2]) if len(velocity) >= 2 else 0.0
v_exceeds = abs(latest_v - vm) > vs
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).