# Double Materiality Assessment
**Module ID:** `double-materiality` · **Route:** `/double-materiality` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
CSRD-mandated double materiality assessment workflow covering both financial materiality (how sustainability matters affect the entity financially) and impact materiality (how the entity affects people and the environment). Produces an IRO register with scored impacts, risks, and opportunities for ESRS disclosure. Supports EFRAG-prescribed stakeholder engagement documentation.

> **Business value:** Provides a structured, auditable workflow for the CSRD double materiality assessment, reducing assessment time and ensuring regulatory compliance with ESRS 1 requirements. The IRO register becomes the backbone for selecting applicable ESRS topical standards and disclosure obligations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `CSRD_DISCLOSURES`, `ESG_COLORS`, `ESRS_TOPICS`, `FINANCIAL_DRIVERS`, `IMPACT_DRIVERS`, `ISSB_COMPARISON`, `KpiCard`, `LS_ASSESS`, `LS_PORT`, `SECTORS`, `SECTOR_DEFAULTS`, `STAKEHOLDER_RELEVANCE`, `Section`, `Sel`, `TOTAL_SUBTOPICS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `TOTAL_SUBTOPICS` | `ESRS_TOPICS.reduce((s, t) => s + t.subtopics.length, 0);` |
| `ISSB_COMPARISON` | `ESRS_TOPICS.map(t => {` |
| `assessments` | `useMemo(() => ESRS_TOPICS.map(t => {` |
| `noise` | `(sRand(s) - 0.5) * 20;` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `payload` | `{ assessment_date: new Date().toISOString(), sector, threshold, topics: assessments.map(a => ({ id: a.id, name: a.name, esrs: a.esrs, category: a.cate` |
| `blob` | `new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });` |
| `topTopic` | `ESRS_TOPICS[Math.abs(s) % ESRS_TOPICS.length];` |
| `dmc` | `Math.round(3 + sRand(s) * 5);` |
| `avg` | `Math.round((f + i) / 2);` |
| `conf` | `Math.round(60 + sRand(s + 1) * 35);` |
| `reviewed` | ``2025-0${Math.floor(1 + sRand(s + 2) * 4)}-${String(Math.floor(1 + sRand(s + 3) * 28)).padStart(2, '0')}`;` |
| `evidence` | `['Sector benchmarks + internal data','Industry reports + peer comparison','Regulatory guidance + expert judgment','Stakeholder consultation + quantita` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/double-materiality/assess` | `assess_double_materiality` | api/v1/routes/double_materiality.py |
| POST | `/api/v1/double-materiality/identify-iros` | `identify_iros` | api/v1/routes/double_materiality.py |
| POST | `/api/v1/double-materiality/materiality-matrix` | `generate_materiality_matrix` | api/v1/routes/double_materiality.py |
| POST | `/api/v1/double-materiality/check-omissions` | `check_omissions` | api/v1/routes/double_materiality.py |
| POST | `/api/v1/double-materiality/completeness` | `calculate_completeness` | api/v1/routes/double_materiality.py |
| GET | `/api/v1/double-materiality/ref/esrs-topics` | `ref_esrs_topics` | api/v1/routes/double_materiality.py |
| GET | `/api/v1/double-materiality/ref/nace-materiality` | `ref_nace_materiality` | api/v1/routes/double_materiality.py |
| GET | `/api/v1/double-materiality/ref/iro-types` | `ref_iro_types` | api/v1/routes/double_materiality.py |
| GET | `/api/v1/double-materiality/ref/csrd-timeline` | `ref_csrd_timeline` | api/v1/routes/double_materiality.py |
| GET | `/api/v1/double-materiality/ref/stakeholder-groups` | `ref_stakeholder_groups` | api/v1/routes/double_materiality.py |
| GET | `/api/v1/double-materiality/ref/assurance-criteria` | `ref_assurance_criteria` | api/v1/routes/double_materiality.py |
| GET | `/api/v1/double-materiality/ref/omission-criteria` | `ref_omission_criteria` | api/v1/routes/double_materiality.py |

### 2.3 Engine `double_materiality_engine` (services/double_materiality_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `DoubleMaterialityEngine.conduct_double_materiality` | entity_name, nace_sector, employee_count, reporting_year, topic_assessments, csrd_wave | Run full ESRS 1 double materiality assessment for all 10 ESRS topics. |
| `DoubleMaterialityEngine.identify_iros` | entity_name, topic, iro_assessments | Structured IRO identification and scoring for a single ESRS topic. |
| `DoubleMaterialityEngine.generate_materiality_matrix` | entity_name, topic_scores | Generate 2D materiality matrix plot data with quadrant classification. |
| `DoubleMaterialityEngine.check_esrs_omissions` | entity_name, nace_sector, topics_not_reported | Validate omission justifications against ESRS 1 paras 29-35. |
| `DoubleMaterialityEngine.calculate_completeness_score` | entity_name, topics_reported, dps_reported, dps_mandatory_for_sector | Calculate completeness of mandatory DP coverage for the sector. |
| `DoubleMaterialityEngine.get_esrs_topic_metadata` |  | Return full ESRS topic and sub-topic reference data. |
| `DoubleMaterialityEngine._score_from_assessment` | a |  |
| `DoubleMaterialityEngine._impact_score` | scale, scope, irremediable, likelihood | ESRS 1 impact materiality = max(severity path, risk path) normalised 0-1. |
| `DoubleMaterialityEngine._financial_score` | likelihood, magnitude | ESRS 1 financial materiality = likelihood x magnitude normalised 0-1. |
| `DoubleMaterialityEngine._nace_baseline_scores` | signal | Convert NACE materiality signal to indicative baseline scores. |
| `DoubleMaterialityEngine._quadrant` | imp, fin |  |
| `DoubleMaterialityEngine._quadrant_label` | quadrant |  |
| `DoubleMaterialityEngine._iro_priority` | imp, fin, iro_type |  |
| `DoubleMaterialityEngine._estimate_completeness` | material_count, assessed_count |  |
| `DoubleMaterialityEngine._assess_assurance_readiness` | completeness, assessed_count |  |
| `DoubleMaterialityEngine._infer_wave` | employee_count |  |
| `DoubleMaterialityEngine._has_relief` | topic, reporting_year, wave |  |
| `DoubleMaterialityEngine._resolve_nace_key` | nace_sector | Resolve full NACE code to best available matrix key. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `first` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COLORS`, `ESRS_TOPICS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Material Topics Identified | — | DMA workflow engine | Total topics assessed as material on at least one dimension of the double materiality matrix |
| Financially Material Only | — | DMA classification | Topics material solely on the financial materiality dimension |
| Impact Material Only | — | DMA classification | Topics material solely on the impact materiality dimension |
| Doubly Material Topics | — | DMA classification | Topics meeting the materiality threshold on both financial and impact dimensions simultaneously |
- **Topic universe (ESRS topic list + entity-specific additions)** → Scoring of financial magnitude, likelihood, impact severity, and impact likelihood per topic → **IRO register with dimension scores and materiality determination**
- **Stakeholder engagement records (interviews, surveys, workshops)** → Stakeholder materiality input aggregation and weighting → **Stakeholder materiality perspective integrated into topic scoring**
- **EFRAG IGMA documentation templates** → Auto-population of IRO-1 disclosure fields from DMA workflow outputs → **ESRS 2 IRO-1 documentation pack ready for assurance sign-off**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/double-materiality/ref/assurance-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['assurance_criteria', 'limited_assurance_overall_threshold_pct', 'reasonable_assurance_overall_threshold_pct', 'standards'], 'n_keys': 4}`

**GET /api/v1/double-materiality/ref/csrd-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['csrd_waves', 'total_waves', 'directive', 'esrs_set', 'assurance'], 'n_keys': 5}`

**GET /api/v1/double-materiality/ref/esrs-topics** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esrs_topics', 'total_topics', 'total_sub_topics', 'mandatory_sub_topics_total'], 'n_keys': 4}`

**GET /api/v1/double-materiality/ref/iro-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['iro_types', 'total_iro_types', 'esrs_ref'], 'n_keys': 3}`

**GET /api/v1/double-materiality/ref/nace-materiality** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['nace_materiality_matrix', 'total_nace_codes', 'signal_definitions'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** Double Materiality Score
**Headline formula:** `DMSᵢ = max(FinMatᵢ, ImpMatᵢ)`
**Standards:** ['ESRS 1 (2023) Double Materiality', 'EFRAG DMA Implementation Guidance 2023', 'GRI 3 Material Topics']

**Engine `double_materiality_engine` — extracted transformation lines:**
```python
imp = min(self._impact_score(iro.impact_scale, iro.impact_scope, iro.impact_irremediable, iro.impact_likelihood) * iw, 1.0)
fin = min(self._financial_score(iro.financial_likelihood, iro.financial_magnitude) * fw, 1.0)
dp_coverage = min(dps_reported / max(dps_mandatory_for_sector, 1), 1.0)
topic_coverage = len(reported_set & set(all_codes)) / len(all_codes)
severity_path = (scale * scope * irremediable) / 125.0   # max 5x5x5=125
risk_path = (likelihood * scale) / 25.0                  # max 5x5=25
combined = (imp + fin) / 2
score = completeness * 0.60 + min(assessed_count / 10, 1.0) * 0.40
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `double_materiality_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `double-materiality-workshop` | engine:double_materiality_engine, table:first |