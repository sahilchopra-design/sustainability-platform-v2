# Double Materiality Workshop
**Module ID:** `double-materiality-workshop` · **Route:** `/double-materiality-workshop` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Collaborative stakeholder workshop facilitation tool for double materiality assessment, enabling multi-participant scoring, deliberation, and consensus building. Real-time aggregation of stakeholder ratings produces facilitated materiality heat maps. Workshop outputs are automatically formatted for ESRS 2 IRO-1 stakeholder engagement documentation.

> **Business value:** Transforms the stakeholder engagement requirement of ESRS double materiality from a logistical challenge into a structured, data-driven process. Real-time consensus analytics help facilitators focus deliberation time where it matters most, producing defensible materiality conclusions.

**How an analyst works this module:**
- Invite stakeholders via email and assign them to participant groups (internal, value chain, civil society)
- Launch a scoring round: participants rate topics on financial and impact materiality 0–100
- Review the live heat map and flag high-disagreement topics for facilitated deliberation
- Close the workshop and export the consensus materiality matrix and ESRS 2 stakeholder engagement log

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ESRS_TOPICS`, `EsrsGapAnalysis`, `IRO_TYPES`, `IroRegistry`, `MaterialityAssessment`, `MaterialityMatrix`, `NACE_TRIGGERS`, `SECTOR_SCORES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESRS_TOPICS` | 11 | `id`, `name`, `pillar`, `standard`, `subtopics`, `color`, `mandatory` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `genTopicScores` | `(n)=>ESRS_TOPICS.map((t,ti)=>({` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});` |
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
| `DoubleMaterialityEngine.conduct_double_materiality` | entity_name, nace_sector, employee_count, reporting_year, topic_assessments, csrd_wave | Run full ESRS 1 double materiality assessment for all 10 ESRS topics. Impact materiality: max(scale x scope x irremediability / 125, likelihood x scale / 25) -> 0-1 Financial materiality: likelihood x magnitude / 25 -> 0-1 Double material if either score >= MATERIALITY_THRESHOLD (default 0.40). NACE materiality triggers applied as baseline for unassessed topics. |
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

**GET /api/v1/double-materiality/ref/omission-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['omission_criteria', 'esrs_ref', 'note'], 'n_keys': 3}`

**GET /api/v1/double-materiality/ref/stakeholder-groups** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['stakeholder_groups', 'total_groups', 'esrs_ref'], 'n_keys': 3}`

**POST /api/v1/double-materiality/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Consensus Materiality Score
**Headline formula:** `CMSᵢ = μ(Scoresᵢ) ± 1.96 × σ(Scoresᵢ) / √N`

The consensus score is the mean of all participant ratings on each topic-dimension combination, with a 95% confidence interval. Topics where the CI is wide (high participant disagreement) are flagged for deliberation. The workshop facilitator can trigger live polling rounds to resolve disagreements.

**Standards:** ['ESRS 1 § 3.7 Stakeholder Engagement in DMA', 'EFRAG IGMA Stakeholder Module', 'ISO 14064-3 Verification Guidance']
**Reference documents:** ESRS 1 (2023) § 3.7 Engaging with Stakeholders in the Materiality Assessment; EFRAG (2023) IGMA — Module 3: Stakeholder Engagement in DMA; AA1000 Stakeholder Engagement Standard (2015); ISO 26000:2010 Guidance on Social Responsibility — Stakeholder Identification

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

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code / engine↔page note.** The Double Materiality Workshop (EP-AZ1) shares the
> `double_materiality_engine.py` reference (ESRS 1 / EFRAG IG 1), but the **frontend page does not call
> that engine** — it generates all topic scores with the seeded PRNG `genTopicScores` and applies a
> **different, simpler threshold** (impact/financial ≥ **2.5 on a 1–5 scale**) than the engine's
> normalised **0.40** cutoff. It is the *facilitation UI* (assess → IRO registry → matrix → gap analysis)
> for capturing the 1–5 ratings the engine would consume, but here those ratings are demo-seeded, not
> workshop-captured. Below documents the page.

### 7.1 What the module computes

Per ESRS topic (10 topics, E1–E5/S1–S4/G1), `genTopicScores(n)` synthesises:
```js
impact       = sr(n·31+ti·7)·3.5 + 1      → 1.0–4.5 (1–5 scale)
financial    = sr(n·37+ti·11)·3.5 + 1     → 1.0–4.5
completeness = ⌊sr(…)·50 + 45⌋            → 45–95 %
dpCoverage   = ⌊sr(…)·40 + 55⌋            → 55–95 %
iros[6]      = { type, score = sr(…)·3+1, identified = sr(…) > 0.45 }
stakeholders = filter of 4 sources by sr(…) > 0.4
```
**Materiality classification** (page rule, NOT the engine's):
```js
matQuadrant(imp, fin):
   imp≥2.5 && fin≥2.5 → Material (Both)
   imp≥2.5            → Impact Material
   fin≥2.5            → Financial Material
   else               → Not Material
material = count(imp≥2.5 || fin≥2.5)
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Materiality threshold | 2.5 / 5 | page rule (engine uses 0.40 normalised — different) |
| Impact score range | 1.0–4.5 | `sr()·3.5 + 1` |
| IRO types | 6 (actual/potential ± impact, Risk, Opportunity) | `IRO_TYPES` — ESRS 1 IRO taxonomy |
| NACE triggers | per topic (E1: B/C/D/E; S1/S2/G1: ALL) | `NACE_TRIGGERS` (simplified vs engine's full matrix) |
| ESRS topics | 10 (with 3–5 sub-topics each) | `ESRS_TOPICS` |
| Tabs | Assessment / IRO Registry / Matrix / Gap Analysis | workshop flow |

The topic taxonomy, IRO types and NACE-trigger concept are **standards-correct** (ESRS 1 / EFRAG IG 1),
but the numeric scores are `sr(seed)=frac(sin(seed+1)×10⁴)` **synthetic**. `SECTOR_SCORES = genTopicScores(1)`
seeds the whole workshop from a single index; users can then edit scores via `updateScore` (live sliders).

### 7.3 Calculation walkthrough

1. `SECTOR_SCORES` seeds the 10 topics with impact/financial/completeness/IRO/stakeholder values.
2. **Assessment tab** — KPI tiles (material count, doubly-material, avg impact, avg financial); editable
   per-topic scores grouped by E/S/G pillar.
3. **IRO Registry** — lists the 6 IRO types per topic with score and identified flag.
4. **Matrix** — impact (y) vs financial (x) scatter with the 2.5×2.5 quadrant lines.
5. **Gap Analysis** — DP coverage / completeness vs mandatory expectations; NACE-trigger check.

### 7.4 Worked example

Topic E1, n=1, ti=0: `impact = sr(31)·3.5 + 1`. If sr(31) ≈ 0.71 → impact = 3.49 → **3.5**.
`financial = sr(37)·3.5 + 1`; if sr(37) ≈ 0.62 → 3.17 → **3.2**. Both ≥ 2.5 → `matQuadrant(3.5, 3.2)` =
**Material (Both)**. Contrast the engine: to reach its 0.40 threshold, E1 would need impact = 0.64 on the
0–1 scale (as in the Double Materiality worked example) — the two modules use different scales and cutoffs
and are **not** directly comparable numerically.

### 7.5 Data provenance & limitations

- **All workshop scores are synthetic** (`genTopicScores` via `sr()`), including impact, financial, IRO
  scores, completeness and DP coverage. The page is a **facilitation shell**, not a scoring engine.
- The **threshold and scale differ from the backend engine** (2.5/5 here vs 0.40 normalised there), so a
  topic "material" in the workshop is not computed the same way as in Double Materiality — a consistency
  gap that should be reconciled to the engine.
- NACE triggers are a simplified per-topic list, not the engine's full 50-row NACE×ESRS matrix.

**Framework alignment:** **ESRS 1 / EFRAG IG 1** double-materiality process (impact vs financial, IRO
registry, materiality matrix, ESRS gap/completeness), **CSRD** disclosure scope. The workshop correctly
mirrors the *process* an assurer expects (documented assessment → IRO → matrix → gap) but the numbers are
placeholders.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (wire the page to the real engine).**

### 8.1 Purpose & scope
A workshop tool that captures real 1–5 impact/financial ratings per ESRS topic and runs them through the
`double_materiality_engine.py` scoring — producing an assurer-ready double-materiality determination for a
single reporting entity.

### 8.2 Conceptual approach
Replace `genTopicScores` seeds with **facilitator-captured ratings** and delegate scoring to the existing
engine (impact = max(scale·scope·irremediability/125, likelihood·scale/25); financial = likelihood·magnitude/25;
threshold 0.40; NACE baseline for unassessed topics). Benchmarks: ESRS 1, EFRAG IG 1, big-4 CSRD
materiality methodologies.

### 8.3 Mathematical specification
```
Inputs per topic: {scale, scope, irremediability, impact_likelihood, fin_likelihood, magnitude} ∈ 1..5
Impact = max(scale·scope·irremediability/125, impact_likelihood·scale/25)
Financial = fin_likelihood·magnitude/25
Double material if max(Impact, Financial) ≥ 0.40
Assurance readiness = Σ w_c · criterion_score_c  (ASSURANCE_CRITERIA weights)
Completeness = reportedDPs / mandatoryDPs(sector)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Threshold | 0.40 | engine `MATERIALITY_THRESHOLD` (ESRS 1) |
| NACE baseline | — | engine `NACE_MATERIALITY_MATRIX` |
| Assurance weights | 0.25/0.20/0.25/0.15/0.15 | engine `ASSURANCE_CRITERIA` |

### 8.4 Data requirements
Facilitator-entered ratings, entity NACE sector and employee count, stakeholder-engagement evidence,
reported DP inventory. Platform holds the full engine reference data (`ESRS_TOPICS`, NACE matrix, IRO
definitions, CSRD waves) and LocalStorage `ra_materiality_assessment_v1`.

### 8.5 Validation & benchmarking plan
Consistency check: workshop output must equal the Double Materiality engine output for the same ratings;
audit-trail completeness; inter-rater reliability across facilitators; reconcile against a big-4 CSRD
materiality assessment on a pilot entity.

### 8.6 Limitations & model risk
Materiality ratings are inherently subjective; facilitator bias and stakeholder-selection bias are the
main risks. Conservative fallback: default unassessed topics to the NACE "high" baseline (material) rather
than "not material", so nothing material is silently omitted.

## 9 · Future Evolution

### 9.1 Evolution A — A real multi-participant session backend (analytics ladder: rung 1 → 2)

**What.** The module rides on the genuine `double_materiality_engine` (same 12 endpoints as the sibling `double-materiality` page — ESRS 1 scoring, IRO identification, omission checks, all reference GETs lineage-`passed`), but everything workshop-*specific* in the overview — email invites, participant groups, live scoring rounds, consensus statistics, disagreement flags (CI > 20 pts) — has no backend: the page's `genTopicScores(n)` generates participant ratings client-side. Evolution A builds the collaboration layer, which is the module's actual reason to exist.

**How.** (1) Tables `dma_workshops`, `dma_participants` (group: internal/value-chain/civil-society), `dma_score_submissions` (participant × topic × dimension × timestamp) with the platform's existing email-invite system (built in the 2026-04-07 admin work) handling registration. (2) Consensus endpoints: per-topic mean/σ/spread by group, the >20-point disagreement flag, and completion tracking — server-computed so all facilitator screens agree. (3) On close, submissions feed `POST /assess` as the entity's topic assessments and the participant log becomes the ESRS 2 IRO-1 stakeholder-engagement evidence pack — timestamps and attribution intact. (4) Rung 2: group-weighting sensitivity ("does the matrix change if civil-society voices weight 2×?") as a what-if over stored submissions.

**Prerequisites.** RBAC roles for facilitator vs participant (participants must not see each other's raw scores mid-round); the sibling module's `dma_assessments` persistence so workshop output lands somewhere durable. **Acceptance:** two browsers submit scores and the facilitator heat map reflects both within a refresh; the exported engagement log lists real timestamped submissions; `genTopicScores` is deleted.

### 9.2 Evolution B — Live facilitation copilot for deliberation rounds (LLM tier 2)

**What.** The facilitator's hardest task is mid-workshop synthesis: "topic E3 has a 34-point spread — what are the two camps saying?" A tool-calling copilot reads the live session state (score distributions by group, submitted comments), summarizes the disagreement structure (e.g. internal raters scoring financial materiality low vs value-chain stakeholders scoring impact high), suggests the deliberation queue ordered by spread × topic weight, and — post-consensus — drafts the stakeholder-engagement narrative for the IRO-1 pack from the recorded session log.

**How.** Tools: Evolution A's session-state endpoints (`get_topic_distribution`, `get_group_breakdown`, `get_comments`) plus the engine's `POST /materiality-matrix` for the closing matrix. Summaries quote actual participant comments (attributed by group, anonymized by name per workshop etiquette); every statistic cited comes from the consensus endpoints, validator-checked. The copilot never scores topics itself — it surfaces disagreement, humans deliberate, the engine computes.

**Prerequisites (hard).** Evolution A — there is no session state to read today, and summarizing the current client-side generated scores would fabricate stakeholder views, precisely what ESRS 2 engagement documentation must not contain. **Acceptance:** in a scripted 10-participant fixture session, the copilot's spread figures match the consensus endpoint exactly; camp summaries only quote stored comments; the drafted engagement narrative contains zero claims not backed by session-log rows.