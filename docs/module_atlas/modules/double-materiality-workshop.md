# Double Materiality Workshop
**Module ID:** `double-materiality-workshop` · **Route:** `/double-materiality-workshop` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Collaborative stakeholder workshop facilitation tool for double materiality assessment, enabling multi-participant scoring, deliberation, and consensus building. Real-time aggregation of stakeholder ratings produces facilitated materiality heat maps. Workshop outputs are automatically formatted for ESRS 2 IRO-1 stakeholder engagement documentation.

> **Business value:** Transforms the stakeholder engagement requirement of ESRS double materiality from a logistical challenge into a structured, data-driven process. Real-time consensus analytics help facilitators focus deliberation time where it matters most, producing defensible materiality conclusions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ESRS_TOPICS`, `EsrsGapAnalysis`, `IRO_TYPES`, `IroRegistry`, `MaterialityAssessment`, `MaterialityMatrix`, `NACE_TRIGGERS`, `SECTOR_SCORES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `genTopicScores` | `(n)=>ESRS_TOPICS.map((t,ti)=>({` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color` |
| `avgImpact` | `+(localScores.reduce((a,s)=>a+s.impact,0)/ Math.max(1, localScores.length)).toFixed(1);` |
| `avgFinancial` | `+(localScores.reduce((a,s)=>a+s.financial,0)/ Math.max(1, localScores.length)).toFixed(1);` |
| `allIros` | `scores.flatMap(s=>s.iros.filter(i=>i.identified).map(i=>({...i,topic:s.id,topicName:s.name,topicColor:s.color})));` |
| `iroTypeCounts` | `IRO_TYPES.map(t=>({type:t,count:allIros.filter(i=>i.type===t).length}));` |
| `scatterData` | `scores.map(s=>({id:s.id,name:s.name,x:s.financial,y:s.impact,color:s.color,pillar:s.pillar}));` |
| `grouped` | `esrsGroups.map(g=>({` |

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
**Frontend seed datasets:** `ESRS_TOPICS`, `IRO_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Workshop Participants | — | Workshop platform | Total stakeholders registered and active in the current DMA workshop session |
| Topics Scored | — | Workshop session | Count of ESG topics rated by participants in the current workshop round |
| High-Disagreement Topics | — | Consensus engine (CI > 20 pts) | Topics where participant score spread exceeds 20 points, flagging deliberation need |
| Workshop Completion | — | Session progress | Share of required topic-dimension scores submitted by registered participants |
- **Participant registration and group assignment** → Role-based scoring access control and group weighting configuration → **Participant roster with group classification and response status**
- **Real-time participant score submissions** → Mean and standard deviation calculation with confidence interval per topic-dimension → **Live consensus heat map and disagreement flag inventory**
- **Workshop session log** → Timestamped rating capture with participant attribution → **ESRS 2 IRO-1 stakeholder engagement evidence pack with participant list and score distribution**

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
**Methodology:** Consensus Materiality Score
**Headline formula:** `CMSᵢ = μ(Scoresᵢ) ± 1.96 × σ(Scoresᵢ) / √N`
**Standards:** ['ESRS 1 § 3.7 Stakeholder Engagement in DMA', 'EFRAG IGMA Stakeholder Module', 'ISO 14064-3 Verification Guidance']

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
| `double-materiality` | engine:double_materiality_engine, table:first |