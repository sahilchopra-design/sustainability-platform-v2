# Api::Regulatory_Penalties
**Module ID:** `api::regulatory_penalties` · **Route:** `/api/v1/regulatory-penalties` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/regulatory-penalties/assess` | `run_full_assessment` | api/v1/routes/regulatory_penalties.py |
| POST | `/api/v1/regulatory-penalties/regulation-penalty` | `calculate_regulation_penalty` | api/v1/routes/regulatory_penalties.py |
| POST | `/api/v1/regulatory-penalties/whistleblower-risk` | `assess_whistleblower_risk` | api/v1/routes/regulatory_penalties.py |
| GET | `/api/v1/regulatory-penalties/assessments/{entity_id}` | `list_assessments` | api/v1/routes/regulatory_penalties.py |
| GET | `/api/v1/regulatory-penalties/assessment/{assessment_id}` | `get_assessment` | api/v1/routes/regulatory_penalties.py |
| GET | `/api/v1/regulatory-penalties/ref/regulations` | `get_regulations` | api/v1/routes/regulatory_penalties.py |
| GET | `/api/v1/regulatory-penalties/ref/enforcement-timeline` | `get_enforcement_timeline` | api/v1/routes/regulatory_penalties.py |
| GET | `/api/v1/regulatory-penalties/ref/authorities` | `get_authorities` | api/v1/routes/regulatory_penalties.py |

### 2.3 Engine `regulatory_penalties_engine` (services/regulatory_penalties_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RegulatoryPenaltiesEngine._compliance_to_violation_severity` | compliance_pct |  |
| `RegulatoryPenaltiesEngine._expected_penalty_factor` | compliance_pct, enforcement_intensity | Fraction of max penalty likely to be imposed, given compliance level. |
| `RegulatoryPenaltiesEngine.calculate_regulation_penalty` | entity_id, regulation, annual_turnover_mn, compliance_pct, violation_details, enforcement_intensity | Calculate penalty exposure for a single regulation. |
| `RegulatoryPenaltiesEngine.assess_all_regulations` | entity_id, annual_turnover_mn, compliance_scores, enforcement_intensity | Assess penalty exposure across all 5 regulations. |
| `RegulatoryPenaltiesEngine.assess_whistleblower_risk` | entity_id, compliance_scores, sector, jurisdiction | Assess whistleblower / internal reporting risk. |
| `RegulatoryPenaltiesEngine.generate_remediation_priorities` | entity_id, penalty_assessment | Generate prioritised remediation actions from penalty assessment. |
| `RegulatoryPenaltiesEngine.run_full_assessment` | entity_id, entity_name, annual_turnover_mn, compliance_scores | Orchestrate full penalty assessment. |
| `RegulatoryPenaltiesEngine.get_reference_data` |  | Return all reference constants. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `SET` *(shared)*, `fastapi` *(shared)*, `individual`, `pydantic` *(shared)*, `regulatory_penalty_assessments`, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/regulatory-penalties/assessment/{assessment_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/regulatory-penalties/assessments/{entity_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/regulatory-penalties/ref/authorities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['supervisory_authorities'], 'n_keys': 1}`

**GET /api/v1/regulatory-penalties/ref/enforcement-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['enforcement_timeline', 'high_risk_jurisdictions'], 'n_keys': 2}`

**GET /api/v1/regulatory-penalties/ref/regulations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulations', 'violation_severity'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `regulatory_penalties_engine` — extracted transformation lines:**
```python
base_non_compliance = max(0, (100 - compliance_pct) / 100)
expected_penalty_mn = round(max_penalty_mn * enforcement_factor * severity_mult, 3)
effective_total = min(total_expected, annual_turnover_mn * 0.10)
avg_compliance = sum(compliance_scores.values()) / len(compliance_scores)
base_risk = 100 - avg_compliance
risk_score = min(100, base_risk + sector_premium + jurisdiction_premium)
avg_compliance = round(sum(compliance_scores.values()) / len(compliance_scores), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).