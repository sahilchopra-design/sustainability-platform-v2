# Csrd Dma
**Module ID:** `csrd-dma` · **Route:** `/csrd-dma` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_TOPICS`, `API`, `Alert`, `Badge`, `Btn`, `CHART_COLORS`, `Card`, `DMA_STEPS`, `ENGAGEMENT_METHODS`, `ESRS_STANDARDS`, `ESRS_TOPICS`, `Inp`, `KpiCard`, `LIKELIHOOD_OPTIONS`, `LIKELIHOOD_SCORE`, `MATERIALITY_COLORS`, `MultiSelect`, `REVERSIBILITY_OPTIONS`, `RISK_COLORS`, `RISK_TYPE_OPTIONS`, `SCALE_OPTIONS`, `SEVERITY_SCORE`, `STAKEHOLDER_GROUPS`, `SectionHeader`, `Sel`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8000';` |
| `topics` | `ALL_TOPICS.map(t => {` |
| `updateStakeholder` | `(idx, field, val) => setStakeholders(p => p.map((s, i) => i === idx ? { ...s, [field]: val } : s));` |
| `buildScatterData` | `() => ALL_TOPICS.map(t => {` |
| `impactScore` | `SEVERITY_SCORE[imp.scale] * LIKELIHOOD_SCORE[imp.likelihood];` |
| `financialScore` | `(Number(fin.magnitude_cr) \|\| 0) * LIKELIHOOD_SCORE[fin.likelihood];` |
| `score` | `SEVERITY_SCORE[d.scale] * LIKELIHOOD_SCORE[d.likelihood];` |
| `fScore` | `(Number(d.magnitude_cr) \|\| 0) * LIKELIHOOD_SCORE[d.likelihood];` |
| `matrixData` | `ALL_TOPICS.map(t => {` |
| `impactScore` | `SEVERITY_SCORE[imp.scale] * LIKELIHOOD_SCORE[imp.likelihood];` |
| `financialScore` | `(Number(fin.magnitude_cr) \|\| 0) * LIKELIHOOD_SCORE[fin.likelihood];` |
| `catColor` | `cat === 'Cross-cutting' ? T.navy : cat === 'Environmental' ? T.green : cat === 'Social' ? T.blue : T.gold;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/csrd-dma/impact-assessment` | `impact_assessment` | api/v1/routes/csrd_dma.py |
| POST | `/api/v1/csrd-dma/financial-assessment` | `financial_assessment` | api/v1/routes/csrd_dma.py |
| POST | `/api/v1/csrd-dma/stakeholder-engagement` | `stakeholder_engagement` | api/v1/routes/csrd_dma.py |
| POST | `/api/v1/csrd-dma/topic-prioritisation` | `topic_prioritisation` | api/v1/routes/csrd_dma.py |
| POST | `/api/v1/csrd-dma/dma-process` | `dma_process` | api/v1/routes/csrd_dma.py |
| POST | `/api/v1/csrd-dma/full-assessment` | `full_assessment` | api/v1/routes/csrd_dma.py |
| GET | `/api/v1/csrd-dma/ref/topics` | `ref_topics` | api/v1/routes/csrd_dma.py |
| GET | `/api/v1/csrd-dma/ref/severity-criteria` | `ref_severity_criteria` | api/v1/routes/csrd_dma.py |
| GET | `/api/v1/csrd-dma/ref/financial-risk-types` | `ref_financial_risk_types` | api/v1/routes/csrd_dma.py |
| GET | `/api/v1/csrd-dma/ref/sector-materiality` | `ref_sector_materiality` | api/v1/routes/csrd_dma.py |

### 2.3 Engine `csrd_dma_engine` (services/csrd_dma_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_opt_float` | value | Coerce a supplied value to float, returning None when absent/invalid. |
| `_round_opt` | value, ndigits | Round a float, passing None through unchanged. |
| `CSRDDMAEngine.assess_impact_materiality` | entity_id, sector, topic_id, impact_data | Score impact materiality per ESRS 1 section 43. |
| `CSRDDMAEngine.assess_financial_materiality` | entity_id, topic_id, financial_data | Score financial materiality per ESRS 1 section 47. |
| `CSRDDMAEngine.run_stakeholder_engagement` | entity_id, stakeholder_data | Score stakeholder engagement quality across 5 elements: |
| `CSRDDMAEngine.prioritise_topics` | entity_id, sector, impact_scores, financial_scores, stakeholder_scores | Rank topics by combined score and assign materiality_basis. |
| `CSRDDMAEngine.assess_dma_process` | entity_id, process_data | Assess completeness of the DMA process across 4 steps (25% each). |
| `CSRDDMAEngine.full_assessment` | entity_id, entity_name, sector, nace_code, reporting_period, full_data | Comprehensive DMA covering both materiality dimensions, stakeholder |
| `CSRDDMAEngine.get_esrs_topics` |  |  |
| `CSRDDMAEngine.get_severity_criteria` |  |  |
| `CSRDDMAEngine.get_financial_risk_types` |  |  |
| `CSRDDMAEngine.get_sector_materiality` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CHART_COLORS`, `DMA_STEPS`, `ENGAGEMENT_METHODS`, `ESRS_STANDARDS`, `LIKELIHOOD_OPTIONS`, `REVERSIBILITY_OPTIONS`, `RISK_TYPE_OPTIONS`, `SCALE_OPTIONS`, `STAKEHOLDER_GROUPS`, `TABS`, `TIME_HORIZON_OPTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/csrd-dma/ref/financial-risk-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['physical_risk', 'transition_risk', 'systemic_risk', 'legal_risk', 'reputational_risk'], 'n_keys': 5}`

**GET /api/v1/csrd-dma/ref/sector-materiality** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_services', 'energy', 'manufacturing', 'real_estate', 'agriculture', 'technology', 'retail', 'healthcare', 'transport', 'mining'], 'n_keys': 10}`

**GET /api/v1/csrd-dma/ref/severity-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scale', 'scope', 'irremediability'], 'n_keys': 3}`

**GET /api/v1/csrd-dma/ref/topics** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E1', 'E2', 'E3', 'E4', 'E5', 'S1', 'S2', 'S3', 'S4', 'G1'], 'n_keys': 10}`

**POST /api/v1/csrd-dma/dma-process** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `csrd_dma_engine` — extracted transformation lines:**
```python
Severity = weighted average of scale, scope, irremediability (0-100 each).
impact_materiality_score = severity_score * (likelihood_pct / 100)
impact_materiality_score = magnitude * (likelihood_pct / 100)
financial_materiality_score = magnitude x likelihood (0-100 each).
coverage_pct = round(min(100.0, total_salience * 100 / 1.0), 2)
dim_avg = sum(present) / len(present)
stk_mult = 0.7 + 0.3 * stk / 100 if stk is not None else 1.0
combined_score = round(dim_avg * stk_mult, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).