# Double Materiality Assessment
**Module ID:** `double-materiality` · **Route:** `/double-materiality` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
CSRD-mandated double materiality assessment workflow covering both financial materiality (how sustainability matters affect the entity financially) and impact materiality (how the entity affects people and the environment). Produces an IRO register with scored impacts, risks, and opportunities for ESRS disclosure. Supports EFRAG-prescribed stakeholder engagement documentation.

> **Business value:** Provides a structured, auditable workflow for the CSRD double materiality assessment, reducing assessment time and ensuring regulatory compliance with ESRS 1 requirements. The IRO register becomes the backbone for selecting applicable ESRS topical standards and disclosure obligations.

**How an analyst works this module:**
- Define the entity scope, value chain boundaries, and stakeholder universe in DMA Settings
- Score each topic on financial materiality (magnitude, likelihood) and impact materiality (severity, likelihood)
- Review the double materiality matrix and confirm topic classifications with the sustainability committee
- Export the IRO register and ESRS 2 IRO-1 documentation pack for assurance and disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `CSRD_DISCLOSURES`, `ESG_COLORS`, `ESRS_TOPICS`, `FINANCIAL_DRIVERS`, `IMPACT_DRIVERS`, `ISSB_COMPARISON`, `KpiCard`, `LS_ASSESS`, `LS_PORT`, `SECTORS`, `SECTOR_DEFAULTS`, `STAKEHOLDER_RELEVANCE`, `Section`, `Sel`, `TOTAL_SUBTOPICS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESRS_TOPICS` | 37 | `name`, `esrs`, `category`, `subtopics`, `id`, `description` |
| `SECTORS` | 12 | `label` |

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
| `portfolioMateriality` | `useMemo(() => { return ESRS_TOPICS.map(t => { let wf = 0, wi = 0, tw = 0;` |
| `noise` | `(sRand(s) - 0.5) * 20;` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `payload` | `{ assessment_date: new Date().toISOString(), sector, threshold, topics: assessments.map(a => ({ id: a.id, name: a.name, esrs: a.esrs, category: a.category, financial_score: a.financial, impact_score: a.impact, quadrant: ` |
| `topTopic` | `ESRS_TOPICS[Math.abs(s) % ESRS_TOPICS.length];` |
| `dmc` | `Math.round(3 + sRand(s) * 5);` |
| `avg` | `Math.round((f + i) / 2);` |
| `conf` | `Math.round(60 + sRand(s + 1) * 35);` |
| `reviewed` | ``2025-0${Math.floor(1 + sRand(s + 2) * 4)}-${String(Math.floor(1 + sRand(s + 3) * 28)).padStart(2, '0')}`;` |
| `evidence` | `['Sector benchmarks + internal data','Industry reports + peer comparison','Regulatory guidance + expert judgment','Stakeholder consultation + quantitative data','Limited data - sector proxy used'][Math.floor(sRand(s + 4)` |

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

**GET /api/v1/double-materiality/ref/omission-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['omission_criteria', 'esrs_ref', 'note'], 'n_keys': 3}`

**GET /api/v1/double-materiality/ref/stakeholder-groups** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['stakeholder_groups', 'total_groups', 'esrs_ref'], 'n_keys': 3}`

**POST /api/v1/double-materiality/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Double Materiality Score
**Headline formula:** `DMSᵢ = max(FinMatᵢ, ImpMatᵢ)`

A topic is material under CSRD if it is material on either or both dimensions; the conservative max operator reflects ESRS 1 symmetry. Financial materiality is scored from magnitude and likelihood of financial effects; impact materiality from severity (scale, scope, irremediability) and likelihood of impact. Both dimensions are scored 0–100 with a threshold of 40 for materiality determination.

**Standards:** ['ESRS 1 (2023) Double Materiality', 'EFRAG DMA Implementation Guidance 2023', 'GRI 3 Material Topics']
**Reference documents:** ESRS 1 (2023) Chapters 3–5 â€” Double Materiality, IRO Identification, Materiality Assessment; EFRAG (2023) Implementation Guidance on Materiality Assessment (IGMA); GRI 3 (2021) Material Topics â€” Step-by-Step Guidance; European Commission (2023) FAQ on CSRD Implementation

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

## 7 · Methodology Deep Dive

Double Materiality implements the **ESRS 1 CSRD double-materiality assessment** — the strongest
standards-grounded engine in this batch. The backend `double_materiality_engine.py` scores impact and
financial materiality across all 10 ESRS topics with a proper NACE-sector trigger matrix, IRO
identification, materiality-matrix quadrants, omission checking and completeness scoring. The frontend
renders the same ESRS topic taxonomy with per-company scoring (partly seeded). The guide's `EMS = 0.5·FM
+ 0.5·IM` framing is consistent with the double-materiality logic, so **no mismatch flag** — the caveat is
that frontend company scores can be `sr()`-seeded.

### 7.1 What the module computes (engine, authoritative)

```
Impact materiality  = max( scale·scope·irremediability / 125 ,  likelihood·scale / 25 )   → 0–1
Financial materiality = likelihood · magnitude / 25                                        → 0–1
Double material if either score ≥ MATERIALITY_THRESHOLD (0.40)
```
All six inputs are 1–5 Likert ratings (ESRS 1 severity dimensions: **scale, scope, irremediability**,
plus **likelihood**; financial = **likelihood × magnitude**). The `/125` normaliser is 5³ (max of
scale·scope·irremediability); `/25` is 5² (max of the two-factor products). Where a topic is **not**
company-assessed, the engine falls back to a **NACE-sector baseline** (`NACE_MATERIALITY_MATRIX`:
high/medium/low/na per NACE section × ESRS topic).

Further engine methods: **IRO identification** (per-topic IRO scoring using `IRO_TYPE_DEFINITIONS`
weights), **materiality matrix** (2-D impact×financial with quadrant classification), **omission checker**
(validates ESRS 1 paras 29–35 justifications), **completeness scoring** (mandatory-DP coverage %), and
**assurance readiness** (`ASSURANCE_CRITERIA` weighted 0.25/0.20/0.25/0.15/0.15 vs limited/reasonable
thresholds).

### 7.2 Parameterisation / scoring rubric

| Threshold / weight | Value | Provenance |
|---|---|---|
| Materiality threshold | 0.40 | `MATERIALITY_THRESHOLD` (ESRS 1 double-materiality cutoff) |
| Limited-assurance | 0.60 | `LIMITED_ASSURANCE_THRESHOLD` |
| Reasonable-assurance | 0.85 | `REASONABLE_ASSURANCE_THRESHOLD` |
| Impact normaliser | /125 (=5³) and /25 (=5²) | max of the severity products |
| IRO impact/financial weights | e.g. actual-neg 1.0/0.5; physical-risk 0.3/1.0; transition 0.4/1.0 | `IRO_TYPE_DEFINITIONS`, ESRS 1 AR 3/AR 11 |
| ESRS topics / sub-topics | 10 / 55 | `ESRS_TOPICS` (E1–E5, S1–S4, G1) |
| NACE matrix | 20 sections + ~30 subsector overrides | `NACE_MATERIALITY_MATRIX` |
| CSRD waves | 4 (2024→2028) | `CSRD_WAVE_TIMELINE`, CSRD Art 5 |

Every sub-topic carries a real `dp_reference` (E1-6, S1-14…), an EFRAG **IG 3** implementation note,
sector applicability (NACE letters), IRO types, and per-topic impact/financial thresholds. These are
**genuine standards references**, not synthetic. IRO-type weights are the engine's calibrated priors
(physical/transition risk weight financial materiality 1.0; positive impacts weight impact only).

### 7.3 Calculation walkthrough

1. `conduct_double_materiality` iterates all 10 ESRS topics.
2. If the company supplied a `TopicAssessment` (six 1–5 ratings) → score via the formulas above; else use
   the NACE baseline for the entity's sector.
3. Flag each topic material (impact / financial / double); count IROs for material topics.
4. Build the materiality matrix (impact vs financial), completeness % vs mandatory DPs, and assurance
   readiness score.
5. Frontend: renders the ESRS topic tree, materiality scatter, and per-company scores (seeded where no
   real assessment exists in LocalStorage `ra_materiality_assessment_v1`).

### 7.4 Worked example (topic E1 Climate Change)

Company rates E1: impact scale 4, scope 5, irremediability 3, likelihood 4; financial likelihood 4,
magnitude 5.
```
Impact = max( 4·5·3/125 , 4·4/25 ) = max( 60/125 , 16/25 ) = max(0.48, 0.64) = 0.64
Financial = 4·5/25 = 20/25 = 0.80
0.64 ≥ 0.40 (impact material) AND 0.80 ≥ 0.40 (financial material) → DOUBLE MATERIAL
```
E1 has 6 sub-topics with 3–4 IRO types each → the material-topic IRO count adds ~20 IROs. If instead the
company did not assess E1 and its NACE sector is "C" (manufacturing, E1 = "high"), the NACE baseline maps
"high" to a material score, so E1 is flagged material even without a company assessment.

### 7.5 Companion analytics

- **Materiality matrix** — impact (y) vs financial (x), quadrants: double-material / impact-only /
  financial-only / not-material.
- **Omission checker** — validates each unreported topic against ESRS 1 omission grounds (not-applicable
  requires NACE evidence; immaterial/proprietary/third-party limitation require justification).
- **Completeness** — reported DPs / mandatory DPs for the sector.
- **CSRD wave** — infers reporting wave from employee count; shows first-year relief topics.
- **Stakeholder & assurance** — engagement groups (ESRS 1 para 20–22) and assurance-readiness scoring.

### 7.6 Data provenance & limitations

- **Engine reference data is real and standards-cited** (ESRS 1, EFRAG IG 3, Delegated Reg (EU) 2023/2772,
  CSRD Directive). The scoring formulas are transparent and defensible.
- **Frontend per-company scores can be synthetic** via `sRand(seed)=frac(sin(seed+1)×10⁴)` when no user
  assessment is present — the *inputs* (1–5 ratings) are what should come from a real workshop, not a seed.
- The impact formula's `max()` of two products is an engine design choice (severity-dominant OR
  likelihood-dominant), not a single ESRS-prescribed equation — ESRS 1 defines the *dimensions* but leaves
  the aggregation to the preparer.

**Framework alignment:** **ESRS 1** double materiality (impact = severity {scale, scope, irremediability}
× likelihood; financial = likelihood × magnitude; material if either crosses threshold); **EFRAG IG 1**
materiality-assessment guidance; **CSRD Directive (EU) 2022/2464** and **Delegated Regulation (EU)
2023/2772** (ESRS Set 1); **NACE** sector materiality triggers; ESRS 1 paras 29–35 omission grounds. IRO
typing follows ESRS 1 AR 3 (impacts) and AR 11–12 (risks/opportunities).

This module does **not** require a §8 model specification: the methodology is a faithful, standards-cited
implementation of ESRS 1. The only production gap is replacing seeded frontend company scores with real
assessed 1–5 ratings captured via the Double Materiality Workshop.

## 9 · Future Evolution

### 9.1 Evolution A — Persist the assessment workflow and retire the cosmetic seeds (analytics ladder: rung 1 → 2)

**What.** The backend is a real ESRS 1 vertical: `DoubleMaterialityEngine` implements the impact formula `max(scale·scope·irremediability/125, likelihood·scale/25)`, financial `likelihood·magnitude/25`, the 0.40 threshold, NACE baseline triggers, omission validation against ESRS 1 ¶29–35, completeness scoring, and CSRD wave inference — 12 endpoints, reference GETs all lineage-`passed`. The gaps: assessments live in LocalStorage (`LS_ASSESS`), and the frontend fabricates workflow metadata — `conf = 60 + sRand·35`, seeded review dates, seeded evidence labels ("Stakeholder consultation + quantitative data" chosen by PRNG). In an *assurance-facing* module, fabricated evidence labels are the worst kind of seed. Evolution A completes the vertical.

**How.** (1) Tables `dma_assessments`, `dma_topic_scores`, `dma_stakeholder_inputs` (org-scoped) so `POST /assess` results persist and the sustainability-committee sign-off in the workflow is a recorded state transition, not UI theater. (2) Delete the seeded confidence/review-date/evidence fields; confidence and evidence become user-entered with the entry's author and date — real values or honest blanks. (3) Rung 2: threshold sensitivity endpoint (how does the material-topic set change as the 0.40 threshold sweeps 0.30–0.50?) and NACE-peer comparison (which topics do sector peers typically assess material vs. this entity's results) — both cheap given the engine's existing `_nace_baseline_scores`.

**Prerequisites.** Alembic migration; RBAC on assessment records (assurance artifacts need author trails). **Acceptance:** an assessment survives a browser wipe; the lineage sweep shows the 5 POSTs `passed` with `dma_*` source tables; grep finds zero `sRand` in the page.

### 9.2 Evolution B — Omission-justification and IRO-1 assurance assistant (LLM tier 2)

**What.** The engine's most distinctive endpoint — `POST /check-omissions`, validating omission justifications against ESRS 1 ¶29–35 — pairs naturally with an LLM: a tool-calling assistant that reviews each proposed omission ("we don't report E4 because…"), runs the engine's rule check, and critiques the justification text against the actual paragraph criteria from `ref/omission-criteria`, then assembles the IRO-1 pack from persisted assessment data with completeness and assurance-readiness scores (`/completeness`, `_assess_assurance_readiness`) quoted from engine responses.

**How.** Tool surface = the module's 12 existing endpoints (unusually complete for this use); grounding corpus = this Atlas record plus the ESRS 1 reference texts already in the refdata layer. The assistant's critiques cite the specific omission criterion failed; its pack-drafting only reports scores the engine computed — the division of labor is rules-engine-decides, LLM-explains-and-drafts. Low-confidence or contested omissions route to the human committee queue rather than auto-approval.

**Prerequisites (hard).** Evolution A's persistence and seed removal — an assurance pack quoting seeded confidence values and PRNG-selected evidence labels would be a fabricated audit trail, the platform's cardinal sin. **Acceptance:** every score in a golden entity's IRO-1 pack matches an engine response; an omission justification that fails ¶30's criteria is flagged with the correct paragraph citation; the assistant refuses to invent stakeholder-engagement evidence that isn't in `dma_stakeholder_inputs`.