# Api::Issb_S2
**Module ID:** `api::issb_s2` · **Route:** `/api/v1/issb-s2` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/issb-s2/assess` | `assess_issb_s2` | api/v1/routes/issb_s2.py |
| POST | `/api/v1/issb-s2/scenario-analysis` | `scenario_analysis` | api/v1/routes/issb_s2.py |
| POST | `/api/v1/issb-s2/risk-identification` | `risk_identification` | api/v1/routes/issb_s2.py |
| GET | `/api/v1/issb-s2/ref/pillars` | `ref_pillars` | api/v1/routes/issb_s2.py |
| GET | `/api/v1/issb-s2/ref/scenarios` | `ref_scenarios` | api/v1/routes/issb_s2.py |
| GET | `/api/v1/issb-s2/ref/physical-risks` | `ref_physical_risks` | api/v1/routes/issb_s2.py |
| GET | `/api/v1/issb-s2/ref/transition-risks` | `ref_transition_risks` | api/v1/routes/issb_s2.py |
| GET | `/api/v1/issb-s2/ref/sasb-sectors` | `ref_sasb_sectors` | api/v1/routes/issb_s2.py |
| GET | `/api/v1/issb-s2/ref/tcfd-crossref` | `ref_tcfd_crossref` | api/v1/routes/issb_s2.py |

### 2.3 Engine `issb_s2_engine` (services/issb_s2_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ISSBS2Engine.assess` | entity_id, entity_name, industry_sector, reporting_period, scope1_tco2e, scope2_tco2e | Full IFRS S2 disclosure assessment. |
| `ISSBS2Engine._pillar_disclosure_items` | pillar | Flat list of every disclosure-item key defined for a pillar in |
| `ISSBS2Engine._score_pillar_completeness` | pillar, disclosed | Deterministic pillar score = % of the pillar's IFRS S2 disclosure items |
| `ISSBS2Engine._score_metrics_targets` | disclosed, s1, s2, s3, financed, carbon_price | Metrics & Targets pillar score. |
| `ISSBS2Engine._classify_risk` | score |  |
| `ISSBS2Engine._build_sasb_metrics` | sector, metric_values | Build the SASB metric set for a sector. |
| `ISSBS2Engine._identify_gaps` | gov, strat, rm, mt, scope3, carbon_price |  |
| `ISSBS2Engine._priority_actions` | gaps |  |
| `ISSBS2Engine.run_scenario_analysis` | entity_id, entity_type, scenarios, entity_financials | Run 3-scenario climate resilience analysis per IFRS S2 §22-24. |
| `ISSBS2Engine.identify_risks` | entity_id, sector, include_opportunities, risk_scores, opportunity_values | Identify physical and transition risks per IFRS S2 §10-12. |
| `ISSBS2Engine.ref_pillars` |  |  |
| `ISSBS2Engine.ref_scenarios` |  |  |
| `ISSBS2Engine.ref_physical_risks` |  |  |
| `ISSBS2Engine.ref_transition_risks` |  |  |
| `ISSBS2Engine.ref_sasb_sectors` |  |  |
| `ISSBS2Engine.ref_tcfd_crossref` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/issb-s2/ref/physical-risks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/issb-s2/ref/pillars** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/issb-s2/ref/sasb-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/issb-s2/ref/scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/issb-s2/ref/tcfd-crossref** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `issb_s2_engine` — extracted transformation lines:**
```python
total_ghg = scope1_tco2e + scope2_tco2e + scope3_tco2e
ghg_intensity = (total_ghg / revenue_usd_mn) if revenue_usd_mn > 0 else 0.0
complete = round(overall / 100 * total_disclosures)
completeness_pct=round(complete / total_disclosures * 100, 1),
quant_pct = sum(1 for x in quant_signals if x) / len(quant_signals) * 100.0
qual_pct = matched / len(catalog) * 100.0
score = 0.6 * qual_pct + 0.4 * quant_pct
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).