# Api::Dme_Policy_Tracker
**Module ID:** `api::dme_policy_tracker` · **Route:** `/api/v1/dme-policy-tracker` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/dme-policy-tracker/composite-velocity` | `composite_velocity` | api/v1/routes/dme_policy_tracker.py |
| POST | `/api/v1/dme-policy-tracker/from-events` | `from_events` | api/v1/routes/dme_policy_tracker.py |
| GET | `/api/v1/dme-policy-tracker/ref/sector-weights` | `get_sector_weights` | api/v1/routes/dme_policy_tracker.py |
| GET | `/api/v1/dme-policy-tracker/ref/components` | `get_components` | api/v1/routes/dme_policy_tracker.py |

### 2.3 Engine `dme_policy_tracker_engine` (services/dme_policy_tracker_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PolicyTrackerEngine.get_sector_weights` | isic_code |  |
| `PolicyTrackerEngine.carbon_price_velocity` | inp | d(ETS_Price)/dt × Embedded_Emissions_Volume |
| `PolicyTrackerEngine.regulatory_pipeline_velocity` | inp | Stage-weighted: introduced × 0.2, committee × 0.3, enacted × 0.5 |
| `PolicyTrackerEngine.enforcement_velocity` | inp | sanctions(0.4) + litigation_monthly(0.4) + penalty_log(0.2) |
| `PolicyTrackerEngine.disclosure_mandate_velocity` | inp | adoptions/month × (1 + coverage_fraction) |
| `PolicyTrackerEngine.composite_velocity` | req | Calculate full composite policy velocity index. |
| `PolicyTrackerEngine.from_events` | req | Calculate composite velocity from discrete policy events. |
| `PolicyTrackerEngine.get_reference_data` |  | Reference: sector weights and component descriptions. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `component`, `discrete`, `fastapi` *(shared)*, `services` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/dme-policy-tracker/ref/components** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 4, 'item0_keys': ['id', 'description']}`

**GET /api/v1/dme-policy-tracker/ref/sector-weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['6419', '0610', '3510', '2410', '4100', 'default'], 'n_keys': 6}`

**POST /api/v1/dme-policy-tracker/composite-velocity** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/dme-policy-tracker/from-events** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `dme_policy_tracker_engine` — extracted transformation lines:**
```python
weighted = inp.bills_introduced * 0.2 + inp.bills_in_committee * 0.3 + inp.bills_enacted * 0.5
lit_monthly = inp.litigation_filings_per_quarter / 3.0
v_composite = sum(component_sums[c] * weights[c] for c in PolicyComponent)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).