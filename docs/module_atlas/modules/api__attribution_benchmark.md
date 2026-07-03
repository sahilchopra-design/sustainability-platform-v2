# Api::Attribution_Benchmark
**Module ID:** `api::attribution_benchmark` · **Route:** `/api/v1/attribution` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/attribution/esg-attribution` | `esg_attribution` | api/v1/routes/attribution_benchmark.py |
| POST | `/api/v1/attribution/benchmark-report` | `benchmark_report` | api/v1/routes/attribution_benchmark.py |
| GET | `/api/v1/attribution/pai-indicators` | `get_pai_indicators` | api/v1/routes/attribution_benchmark.py |

### 2.3 Engine `benchmark_analytics` (services/benchmark_analytics.py)
| Function | Args | Purpose |
|---|---|---|
| `BenchmarkAnalyticsService.compute_peer_rankings` | fund, peers | Rank a fund against peers on key ESG metrics. |
| `BenchmarkAnalyticsService.compute_period_comparison` | current, prior, directions | Compare current period metrics against prior period. |
| `BenchmarkAnalyticsService.check_climate_benchmark_compliance` | fund_waci, benchmark_waci, prior_waci, fossil_fuel_pct, controversial_weapons_pct | Check against EU Climate Benchmark Regulation: |
| `BenchmarkAnalyticsService.generate_report` | fund, peers, current_metrics, prior_metrics, metric_directions, benchmark_waci | Generate comprehensive benchmark analytics report. |
| `BenchmarkAnalyticsService._rank_metric` | name, value, all_values, lower_is_better | Rank a single metric against a peer group. |

### 2.3 Engine `esg_attribution_engine` (services/esg_attribution_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PAIIndicator.delta` |  |  |
| `PAIIndicator.is_outperforming` |  |  |
| `ESGAttributionEngine.analyse` | inp | Run full ESG attribution and benchmark comparison. |
| `ESGAttributionEngine._brinson_fachler` | port, bench, metric_fn, metric_name, direction | Brinson-Fachler attribution by sector. |
| `ESGAttributionEngine._aggregate_by_sector` | holdings, metric_fn | Aggregate holdings by sector: compute weight and weighted-average metric. |
| `ESGAttributionEngine._active_share` | port, bench | Active share = 0.5 * sum(/w_p - w_b/) using ISIN matching. |
| `ESGAttributionEngine._tracking_error_proxy` | port, bench | Simplified ex-ante TE: sqrt(sum(active_weight^2)) * vol_proxy. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/attribution/pai-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mandatory_pai_indicators'], 'n_keys': 1}`

**POST /api/v1/attribution/benchmark-report** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/attribution/esg-attribution** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `benchmark_analytics` — extracted transformation lines:**
```python
all_funds = [fund] + peers
abs_change = curr_val - prev_val
pct_change = (abs_change / prev_val * 100) if prev_val != 0 else 0.0
waci_reduction = (benchmark_waci - fund_waci) / benchmark_waci * 100
yoy_decarb = (prior_waci - fund_waci) / prior_waci * 100
rank = sorted_vals.index(value) + 1
percentile = (n - rank) / max(n - 1, 1) * 100
median = sorted_asc[n // 2] if n % 2 == 1 else (sorted_asc[n // 2 - 1] + sorted_asc[n // 2]) / 2.0
peer_mean=round(sum(all_values) / n, 4),
```

**Engine `esg_attribution_engine` — extracted transformation lines:**
```python
carbon_ir = carbon_excess / te if te > 0 else 0.0
esg_ir = esg_excess / te if te > 0 else 0.0
Allocation  = (w_p,s - w_b,s) * (M_b,s - M_b_total)
Selection   = w_b,s * (M_p,s - M_b,s)
Interaction = (w_p,s - w_b,s) * (M_p,s - M_b,s)
Total       = Allocation + Selection + Interaction
alloc = (pw - bw) / 100.0 * (bm - bench_total)
selec = bw / 100.0 * (pm - bm)
inter = (pw - bw) / 100.0 * (pm - bm)
total = alloc + selec + inter
active = port_total - bench_total
total_active_effect=round(total_alloc + total_selec + total_inter, 4),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).