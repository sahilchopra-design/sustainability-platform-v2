# Api::Esg_Ma
**Module ID:** `api::esg_ma` · **Route:** `/api/v1/esg-ma` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/esg-ma/ungp-alignment` | `ungp_alignment_endpoint` | api/v1/routes/esg_ma.py |
| POST | `/api/v1/esg-ma/valuation-impact` | `valuation_impact_endpoint` | api/v1/routes/esg_ma.py |
| POST | `/api/v1/esg-ma/integration-plan` | `integration_plan_endpoint` | api/v1/routes/esg_ma.py |
| POST | `/api/v1/esg-ma/dd-report` | `dd_report_endpoint` | api/v1/routes/esg_ma.py |
| GET | `/api/v1/esg-ma/ref/dd-checklist` | `get_dd_checklist` | api/v1/routes/esg_ma.py |
| GET | `/api/v1/esg-ma/ref/ungp-principles` | `get_ungp_principles` | api/v1/routes/esg_ma.py |
| GET | `/api/v1/esg-ma/ref/valuation-ranges` | `get_valuation_ranges` | api/v1/routes/esg_ma.py |
| GET | `/api/v1/esg-ma/ref/deal-breakers` | `get_deal_breakers` | api/v1/routes/esg_ma.py |
| GET | `/api/v1/esg-ma/ref/csddd-scope` | `get_csddd_scope` | api/v1/routes/esg_ma.py |

### 2.3 Engine `esg_ma_engine` (services/esg_ma_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_resolve_checklist_status` | raw | Map a caller-supplied checklist finding to (status, risk_level, score). |
| `assess_esg_due_diligence` | entity_id, deal_name, target_sector, target_country, deal_value_usd, checklist_assessments | Assess ESG due diligence across the 85-item checklist. |
| `score_ungp_alignment` | entity_id, target_company, sector, principle_scores_input, ilo_compliance_input, oecd_rbc_input | Score UNGP 31-principle alignment from caller-supplied evidence. |
| `_opt_num` | source, key | Return a numeric input from ``source`` or None (bool excluded). |
| `calculate_esg_valuation_impact` | entity_id, base_valuation_usd, esg_findings, quant_inputs | Quantify ESG purchase-price adjustments. |
| `plan_post_merger_integration` | entity_id, acquirer_profile, target_profile, close_date, integration_cost_usd | Build a 100-day post-merger ESG integration plan. |
| `generate_dd_report` | entity_id, deal_name, target_sector, target_country, deal_value_usd, checklist_assessments | Compose an investment-committee ESG DD report from real sub-assessments. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `DD`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/esg-ma/ref/csddd-scope** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['directive', 'reference', 'published', 'transposition_deadline', 'scope_note', 'thresholds', 'value_chain_obligations', 'civil_liability'], 'n_keys': 8}`

**GET /api/v1/esg-ma/ref/dd-checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_items', 'categories_count', 'categories', 'all_items'], 'n_keys': 4}`

**GET /api/v1/esg-ma/ref/deal-breakers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_criteria', 'category_breakdown', 'threshold', 'criteria'], 'n_keys': 4}`

**GET /api/v1/esg-ma/ref/ungp-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'endorsed', 'total_principles', 'pillar_I_count', 'pillar_II_count', 'pillar_III_count', 'pillars', 'ilo_core_conventions'], 'n_keys': 8}`

**GET /api/v1/esg-ma/ref/valuation-ranges** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodology', 'data_sources', 'adjustment_types_count', 'ranges'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic

**Engine `esg_ma_engine` — extracted transformation lines:**
```python
e_score = e_score_sum / e_count if e_count else None
s_score = s_score_sum / s_count if s_count else None
g_score = g_score_sum / g_count if g_count else None
adj_pct = (overall_esg_score - 0.5) * 20  # -10% to +10% base
overall_ungp = round(sum(scored_pillars) / len(scored_pillars), 3) if scored_pillars else None
oecd_overall = round(sum(scored_steps) / len(scored_steps), 3) if scored_steps else None
adj_usd = base_valuation_usd * adj_pct / 100
stranded_asset_usd = base_valuation_usd * stranded_asset_pct if stranded_asset_pct is not None else None
g_adj_pct = (board_score - 0.5) * 6 - (ownership_conc - 0.3) * 4
adjusted_valuation = base_valuation_usd + total_adjustment_usd
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).