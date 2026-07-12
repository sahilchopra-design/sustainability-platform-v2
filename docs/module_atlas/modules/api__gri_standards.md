# Api::Gri_Standards
**Module ID:** `api::gri_standards` · **Route:** `/api/v1/gri-standards` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/gri-standards/assess` | `assess_gri` | api/v1/routes/gri_standards.py |
| POST | `/api/v1/gri-standards/generate-content-index` | `generate_content_index` | api/v1/routes/gri_standards.py |
| POST | `/api/v1/gri-standards/materiality-screen` | `materiality_screen` | api/v1/routes/gri_standards.py |
| GET | `/api/v1/gri-standards/ref/gri-2-disclosures` | `ref_gri_2_disclosures` | api/v1/routes/gri_standards.py |
| GET | `/api/v1/gri-standards/ref/gri-300-standards` | `ref_gri_300_standards` | api/v1/routes/gri_standards.py |
| GET | `/api/v1/gri-standards/ref/material-topic-process` | `ref_material_topic_process` | api/v1/routes/gri_standards.py |
| GET | `/api/v1/gri-standards/ref/service-levels` | `ref_service_levels` | api/v1/routes/gri_standards.py |
| GET | `/api/v1/gri-standards/ref/content-index-requirements` | `ref_content_index_requirements` | api/v1/routes/gri_standards.py |

### 2.3 Engine `gri_standards_engine` (services/gri_standards_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `GRIStandardsEngine.assess` | entity_id, entity_name, reporting_period, material_topics, gri_2_disclosures_submitted, gri_300_data | Full GRI Standards compliance assessment. All scores are derived deterministically from caller-supplied evidence: - ``gri_2_disclosures_submitted``: list of GRI 2 disclosure IDs actually reported. - ``gri_300_data``: dict keyed by GRI 300 topic (e.g. "GRI_305") holding the reported environmental data for that topic. When the required evidence is absent the corresponding metric is returned as ``Non |
| `GRIStandardsEngine._identify_gri2_gaps` | submitted | Gaps = required GRI 2 disclosures not present in the submitted list (deterministic). |
| `GRIStandardsEngine._score_gri300` | material_topics, gri_300_data | Deterministic GRI 300 completeness. Measures the share of GRI 300 environmental standards that are (a) flagged material and (b) have reported data. Returns ``None`` when no material GRI 300 topics are provided (nothing to measure) rather than fabricating a score. |
| `GRIStandardsEngine._identify_gri300_gaps` | material_topics, disclosed |  |
| `GRIStandardsEngine._build_recommendations` | gaps, score |  |
| `GRIStandardsEngine.generate_content_index` | entity_id, material_topics, disclosures_status | Generate GRI Content Index per GRI 101:2023 requirements. ``disclosures_status`` maps a GRI disclosure ID to a dict describing its reported state, e.g. ``{"2-1": {"status": "disclosed", "location": "...", "assurance": "limited"}}``. A plain string status (``{"2-1": "disclosed"}``) is also accepted. Any disclosure not present in the input is marked ``"not_reported"`` with a null location — the engi |
| `GRIStandardsEngine._content_index_entry` | disc_id, supplied | Normalise a caller-supplied status into a content-index row (no fabrication). Accepts either a status string or a dict with keys among {status, location, omission_reason, assurance}. Missing fields default to honest nulls / "not_reported". |
| `GRIStandardsEngine.screen_material_topics` | entity_id, sector, stakeholder_inputs | Screen and prioritise material GRI topics using double materiality lens. Materiality scores are derived deterministically from the GRI sector-materiality weighting table plus explicit stakeholder inputs — no random noise is added. |
| `GRIStandardsEngine.ref_gri_2_disclosures` |  |  |
| `GRIStandardsEngine.ref_gri_300_standards` |  |  |
| `GRIStandardsEngine.ref_material_topic_process` |  |  |
| `GRIStandardsEngine.ref_service_levels` |  |  |
| `GRIStandardsEngine.ref_content_index_requirements` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/gri-standards/ref/content-index-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/gri-standards/ref/gri-2-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/gri-standards/ref/gri-300-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/gri-standards/ref/material-topic-process** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/gri-standards/ref/service-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**POST /api/v1/gri-standards/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/gri-standards/generate-content-index** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/gri-standards/materiality-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `gri_standards_engine` — extracted transformation lines:**
```python
gaps = gri2_gaps + self._identify_gri300_gaps(material_topics, gri300_disclosed)
impact_materiality = min(1.0, base_weight + stakeholder_boost)
financial_materiality = min(1.0, base_weight * 0.8)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded in
`backend/services/gri_standards_engine.py` and `backend/api/v1/routes/gri_standards.py`.)*

### 7.1 What the domain computes

`GRIStandardsEngine` assesses sustainability reports against the **GRI Standards 2021**
architecture. Three POST services plus five reference endpoints:

**1. Full assessment (`POST /assess`)** — deterministic completeness scoring from
caller-supplied evidence (an explicit design point: docstrings promise "honest null" rather than
fabricated values when evidence is missing):

```
gri2_completeness   = |valid submitted GRI 2 IDs| / 30 × 100
gri300_completeness = |material env topics with reported data| / |all 8 GRI 300 standards| × 100
governance_score    = share of governance disclosures (2-9…2-21) submitted × 100
environment_score   = gri300_completeness
completeness_score  = 0.6 × gri2 + 0.4 × gri300
overall_score       = 0.3 × governance + 0.3 × environment + 0.4 × completeness
```

Service level from submitted GRI 2 count: ≥ 28 → `with_reference` ("in accordance with GRI"),
≥ 18 → `core`, else `partial`; no inventory → `insufficient_data`. Assurance is always reported
`none`/null unless evidenced ("never fabricated").

**2. Content index (`POST /generate-content-index`)** — machine-readable GRI content index per
GRI 101:2023 entry format (location / omission / assurance reference per disclosure).

**3. Materiality screening (`POST /materiality-screen`)** — double-materiality scores over the
8 GRI 300 topics:

```
impact_materiality    = min(1, sector_weight + 0.1·stakeholder_mention)
financial_materiality = min(1, sector_weight × 0.8)
double_materiality    = max(impact, financial);   material if ≥ 0.55
priority: high ≥ 0.75 · medium ≥ 0.55 · low otherwise
boundary flags: outside-org ≥ 0.65, upstream ≥ 0.70, downstream ≥ 0.65
```

### 7.2 Parameterisation

**GRI 2 registry:** all 30 General Disclosures 2021 (2-1 organisational details … 2-30
collective bargaining), each with title, group (org_profile / strategy / ethics_integrity /
stakeholder_engagement / reporting_practice), and guidance notes. The governance component uses
the 13 `ethics_integrity` disclosures (2-9…2-21).

**GRI 300 registry:** the 8 environmental standards — 301 Materials, 302 Energy, 303 Water &
Effluents (2018), 304 Biodiversity, 305 Emissions, 306 Waste, 307/308 environmental compliance &
supplier assessment — with per-disclosure titles, units, and required flags matching the
published standards (e.g. 302-1 energy consumption in GJ, required; 305-1/2 scope 1/2 GHG).

**Sector materiality weights** (`screen_material_topics`, 0–1, platform calibration):

| Sector | 302 Energy | 305 Emissions | 306 Waste | 303 Water | 304 Biodiv | 308 Supplier | 301 Materials |
|---|---|---|---|---|---|---|---|
| financials | 0.5 | 0.8 | 0.3 | 0.3 | 0.6 | 0.7 | (0.5 default) |
| energy | 0.9 | 1.0 | 0.7 | 0.6 | 0.8 | 0.5 | — |
| real_estate | 0.9 | 0.9 | 0.6 | 0.7 | 0.7 | — | 0.8 |
| food_beverage | — | 0.8 | 0.8 | 0.9 | 0.9 | 0.9 | 0.9 |
| tech | 0.8 | 0.7 | 0.9 | 0.4 | 0.4 | 0.8 | — |

Unknown sectors fall back to `financials`; unmapped topics get the fixed default 0.5.
Composite weights (0.6/0.4, 0.3/0.3/0.4), thresholds (28/18, 0.55/0.75, 0.65/0.70) are all
platform design constants.

### 7.3 Calculation walkthrough

`/assess` validates the submitted GRI 2 IDs against the registry ("count only recognised
IDs to avoid inflating completeness"), derives gaps (first 6 missing GRI 2 items + material
GRI 300 topics without data), builds recommendations (score < 60 → complete GRI 2; missing
GRI 305 → "disclose scope 1/2 per GHG Protocol"), and stamps `data_completeness_flag` with any
missing inputs. Note the GRI 300 denominator is **all 8 standards**, not just the material ones
— an entity with 3 material env topics, all reported, scores 3/8 = 37.5%, not 100%.

### 7.4 Worked example

Entity submits 25 valid GRI 2 disclosures including 10 of the 13 governance IDs; material topics
{GRI_302, GRI_305, GRI_306}; data reported for 302 and 305 only.

| Metric | Computation | Result |
|---|---|---|
| GRI 2 completeness | 25/30 | 83.3% |
| GRI 300 completeness | 2 reported material / 8 standards | 25.0% |
| Governance | 10/13 | 76.9% |
| Environment | = GRI 300 | 25.0% |
| Completeness | 0.6×83.3 + 0.4×25.0 | 60.0 |
| **Overall** | 0.3×76.9 + 0.3×25.0 + 0.4×60.0 | **54.6** |
| Service level | 25 submitted (18–27) | `core` |

Gap raised: "GRI_306 (Waste) identified as material but not disclosed — management approach
(GRI 3-3) required". Materiality cross-check (sector `energy`): GRI_305 → impact 1.0, financial
0.8, double 1.0 → material/high, all boundary flags true; GRI_303 → 0.6/0.48/0.6 →
material/medium, outside-org false at 0.6 < 0.65.

### 7.5 Reference layer

`GET /ref/gri-2-disclosures`, `/ref/gri-300-standards`, `/ref/material-topic-process` (the four
GRI 3 steps with key activities and GRI 3-1/3-2 references), `/ref/service-levels` (2021
"in accordance" + legacy Core/Comprehensive with deprecation notes), and
`/ref/content-index-requirements`.

### 7.6 Data provenance & limitations

- No PRNG — this engine was explicitly remediated to be deterministic ("no random noise is
  added"; scores are null when evidence is absent). Registry content is a faithful transcription
  of published GRI standard titles/units.
- The GRI 300 completeness denominator (all 8 standards regardless of materiality) penalises
  entities with few material environmental topics; GRI itself requires reporting only on
  *material* topics, so this metric is stricter-than-standard by construction.
- Service-level bands (28/18) approximate but do not verify the real "in accordance"
  requirements (which also demand GRI 3-3 management-approach disclosure per topic and a content
  index — not checked by the threshold).
- Materiality screening covers only the environmental (GRI 300) series — no 200 (economic) or
  400 (social) topics; sector weights and the 0.55/0.75 thresholds are synthetic calibrations;
  `financial_materiality = 0.8 × impact weight` is a fixed proportionality assumption, not an
  independent assessment.
- Legacy Core/Comprehensive levels are correctly labelled deprecated (replaced 2023) but the
  scorer still emits `core` as a live band label.

### 7.7 Framework alignment

- **GRI 1 Foundation 2021 / GRI 2 General Disclosures 2021** — the 30-disclosure registry and
  the "in accordance with the GRI Standards" claim (which, per GRI 1, requires all GRI 2
  disclosures, GRI 3 materiality disclosures, and topic-standard disclosures for each material
  topic, with a content index) — approximated here by the ≥ 28 threshold.
- **GRI 3 Material Topics 2021** — the 4-step process (context → identify impacts → assess
  significance via scale/scope/irremediability/likelihood → prioritise) is served verbatim as
  reference data; the screening endpoint implements a simplified double-materiality scorer on
  top.
- **GRI 300 series (301–308)** — disclosure IDs, units and required flags mirror the published
  standards (303:2018 and 306:2020 revisions included).
- **ESRS double materiality** — the screening explicitly labels its financial-materiality lens
  "ESRS-aligned": ESRS/CSRD defines a topic as material if it is impact-material OR
  financially material — the code's `max(impact, financial)` operator implements exactly that
  union rule.
- **GHG Protocol** — recommended as the calculation basis for GRI 305-1/305-2 in generated
  recommendations, matching GRI 305's own reference to the GHG Protocol Corporate Standard.

## 9 · Future Evolution

### 9.1 Evolution A — Evidence-linked materiality and double-materiality calibration (analytics ladder: rung 1 → 2)

**What.** `GRIStandardsEngine` scores sustainability reports against GRI Standards 2021
deterministically and honestly (docstrings promise honest-null over fabrication):
`completeness = 0.6×gri2 + 0.4×gri300`, `overall = 0.3×gov + 0.3×env + 0.4×completeness`,
service level from submitted GRI-2 count. The materiality screen is the thin part —
`impact_materiality = min(1, base_weight + stakeholder_boost)` and
`financial_materiality = base_weight × 0.8` are coarse heuristics with no scenario or
evidence linkage. Evolution A deepens materiality into a defensible double-materiality
assessment.

**How.** (1) Replace the `×0.8` financial-materiality shortcut with a topic-to-financial
mapping (which GRI 300 topics map to which financial exposures) parameterised by sector,
so screens differ by industry rather than scaling uniformly. (2) Add a stakeholder-input
sweep: vary `stakeholder_boost` across scenarios to show which topics are robustly
material vs boundary cases (rung 2 what-if). (3) Cross-wire to the platform's Dynamic
Materiality Engine so GRI topics inherit its sector priors rather than flat base weights.
(4) Keep and bench-pin the honest-null design — an absent inventory must still yield
`insufficient_data`, not a fabricated score.

**Prerequisites.** A sector→financial-topic mapping table; DME integration point.
**Acceptance:** two entities in different sectors with identical topic evidence get
different financial-materiality scores; a stakeholder-input sweep flags boundary-material
topics; `insufficient_data` still returned for empty inventories.

### 9.2 Evolution B — GRI reporting copilot with gap-closure guidance (LLM tier 2)

**What.** A copilot that runs `/assess` on a draft report and explains the score — "you
scored `core` not `with_reference` because only 22 of the 28 required GRI-2 disclosures
are present; here are the 6 missing" — citing the completeness formula and the specific
gaps the engine returns, then re-scores after the user marks disclosures addressed.

**How.** Three POST services (`/assess`, `/generate-content-index`,
`/materiality-screen`) plus five reference GETs (`/ref/gri-2-disclosures`,
`/ref/gri-300-standards`, `/ref/material-topic-process`, etc.) — the reference endpoints
are a complete GRI-2021 grounding corpus, so definitional questions never leave the
module. The gap list from `/assess` drives an action loop; `/generate-content-index`
becomes a tier-2 action that drafts the GRI content index from the assessed evidence.
Guardrail: the copilot reports completeness scores as GRI *self-declaration* readiness,
not assurance, matching the engine's "assurance always reported none" behaviour.

**Prerequisites.** None hard — the engine is honest and reference-complete today.
**Acceptance:** every gap and score component the copilot cites appears in the `/assess`
response; a re-score after marking disclosures present reflects a real re-call, not
prompt arithmetic; the copilot refuses to claim "in accordance with GRI" beyond what the
service-level rule computes.