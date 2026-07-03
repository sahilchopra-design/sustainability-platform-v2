# Api::Dme_Dmi
**Module ID:** `api::dme_dmi` · **Route:** `/api/v1/dme-dmi` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dme-dmi/pcaf-attribution` | `pcaf_attribution` | api/v1/routes/dme_dmi.py |
| POST | `/api/v1/dme-dmi/entity` | `entity_dmi` | api/v1/routes/dme_dmi.py |
| POST | `/api/v1/dme-dmi/portfolio` | `portfolio_dmi` | api/v1/routes/dme_dmi.py |
| GET | `/api/v1/dme-dmi/ref/pcaf-confidence` | `get_pcaf_confidence` | api/v1/routes/dme_dmi.py |

### 2.3 Engine `dme_dmi_engine` (services/dme_dmi_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `DMIEngine.pcaf_to_confidence` | pcaf_score, recency_years | Base confidence from PCAF DQS, with recency decay. |
| `DMIEngine.confidence_weighted_agg` | scores, weights, confidences | S = Σ(w × c × x) / Σ(w × c) |
| `DMIEngine.concentration_penalty` | conc, cfg | Multiplicative penalty from concentration metrics. |
| `DMIEngine.pcaf_attribution` | req | PCAF financed emissions attribution: Σ (Outstanding/EVIC) × Emissions. |
| `DMIEngine.entity_dmi` | req | Entity-level DMI: confidence-weighted factor aggregation, |
| `DMIEngine.portfolio_dmi` | req | Portfolio-level DMI with concentration penalties. |
| `DMIEngine.get_reference_data` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `services` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dme-dmi/ref/pcaf-confidence** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pcaf_confidence_map', 'recency_decay', 'aggregation_formula', 'concentration_penalties'], 'n_keys': 4}`

**POST /api/v1/dme-dmi/entity** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-dmi/pcaf-attribution** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-dmi/portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `dme_dmi_engine` — extracted transformation lines:**
```python
num = sum(w * c * x for w, c, x in zip(weights, confidences, scores))
den = sum(w * c for w, c in zip(weights, confidences))
af = h.outstanding_amount / h.entity_evic
fe = af * h.entity_emissions_tco2e
velocity_adj = avg_z * cfg.velocity_weight
adjusted = base_score * (1 + velocity_adj)
norm_weights = [w / total_w for w in raw_weights]
velocity_adj = float(np.mean(v_scores)) * cfg.velocity_weight
final = base * (1 + velocity_adj) * conc_factor
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).