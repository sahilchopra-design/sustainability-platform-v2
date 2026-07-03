# Api::Supply_Chain_Workflow
**Module ID:** `api::supply_chain_workflow` · **Route:** `/api/v1/supply-chain-workflow` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/supply-chain-workflow/assess/batch` | `assess_batch` | api/v1/routes/supply_chain_workflow.py |
| GET | `/api/v1/supply-chain-workflow/ref/esrs-e4-disclosures` | `ref_esrs_e4` | api/v1/routes/supply_chain_workflow.py |
| GET | `/api/v1/supply-chain-workflow/ref/eudr-commodities` | `ref_eudr_commodities` | api/v1/routes/supply_chain_workflow.py |
| GET | `/api/v1/supply-chain-workflow/ref/country-tiers` | `ref_country_tiers` | api/v1/routes/supply_chain_workflow.py |

### 2.3 Engine `supply_chain_workflow_engine` (services/supply_chain_workflow_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SupplyChainWorkflowEngine.assess` | entity_name, suppliers, assessment_date | Run the full supply chain workflow for *entity_name* across *suppliers*. |
| `SupplyChainWorkflowEngine._assess_supplier` | s |  |
| `SupplyChainWorkflowEngine._eudr_country_tier` | country |  |
| `SupplyChainWorkflowEngine._eudr_traceability_score` | s |  |
| `SupplyChainWorkflowEngine._eudr_risk_score` | r, s | Higher score = higher EUDR non-compliance risk (0–100). |
| `SupplyChainWorkflowEngine._csddd_impacts` | s |  |
| `SupplyChainWorkflowEngine._csddd_dd_score` | s | Higher score = better CSDDD due diligence posture (0–100). |
| `SupplyChainWorkflowEngine._esrs_e4_risk_level` | s |  |
| `SupplyChainWorkflowEngine._esrs_e4_flags` | s | Returns which ESRS E4 disclosures are triggered for this supplier. |
| `SupplyChainWorkflowEngine._combined_risk` | r | Weighted combined risk score (higher = higher non-compliance risk). |
| `SupplyChainWorkflowEngine._build_gaps` | r, s |  |
| `SupplyChainWorkflowEngine._build_actions` | r, s |  |
| `SupplyChainWorkflowEngine._aggregate` | run_id, entity_name, assessment_date, supplier_results, suppliers |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/supply-chain-workflow/ref/country-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['high_risk', 'low_risk', 'standard_risk', 'reference', 'note'], 'n_keys': 5}`

**GET /api/v1/supply-chain-workflow/ref/esrs-e4-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['disclosure_count', 'disclosures', 'reference'], 'n_keys': 3}`

**GET /api/v1/supply-chain-workflow/ref/eudr-commodities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['commodity_count', 'commodities', 'reference'], 'n_keys': 3}`

**GET /api/v1/supply-chain-workflow/ref/regulatory-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mapping_count', 'regulatory_mapping', 'reference'], 'n_keys': 3}`

**POST /api/v1/supply-chain-workflow/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `supply_chain_workflow_engine` — extracted transformation lines:**
```python
traceability_discount = r.eudr_traceability_score * 0.5
eudr_component = r.eudr_risk_score * eudr_weight
csddd_component = (100.0 - r.csddd_dd_score) * csddd_weight
workflow_score = round(100.0 - avg_risk, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).