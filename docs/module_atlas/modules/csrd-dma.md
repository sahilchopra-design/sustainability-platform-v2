# Csrd Dma
**Module ID:** `csrd-dma` · **Route:** `/csrd-dma` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_TOPICS`, `API`, `Alert`, `Badge`, `Btn`, `CHART_COLORS`, `Card`, `DMA_STEPS`, `ENGAGEMENT_METHODS`, `ESRS_STANDARDS`, `ESRS_TOPICS`, `Inp`, `KpiCard`, `LIKELIHOOD_OPTIONS`, `LIKELIHOOD_SCORE`, `MATERIALITY_COLORS`, `MultiSelect`, `REVERSIBILITY_OPTIONS`, `RISK_COLORS`, `RISK_TYPE_OPTIONS`, `SCALE_OPTIONS`, `SEVERITY_SCORE`, `STAKEHOLDER_GROUPS`, `SectionHeader`, `Sel`, `TIME_HORIZON_OPTIONS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESRS_STANDARDS` | 12 | `name`, `category`, `mandatory`, `datapoints`, `description`, `keyDisclosures` |
| `DMA_STEPS` | 8 | `title`, `description` |

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
| `_opt_float` | value | Coerce a supplied value to float, returning None when absent/invalid. Used so that a missing assessment input yields an honest null rather than a fabricated number. |
| `_round_opt` | value, ndigits | Round a float, passing None through unchanged. |
| `CSRDDMAEngine.assess_impact_materiality` | entity_id, sector, topic_id, impact_data | Score impact materiality per ESRS 1 section 43. Severity = weighted average of scale, scope, irremediability (0-100 each). Positive impacts use likelihood x magnitude instead of severity. Scores must be supplied in ``impact_data`` (scale_score, scope_score, irremediability_score, likelihood_pct, and for positive impacts magnitude_score). When the inputs needed for a score are absent the derived me |
| `CSRDDMAEngine.assess_financial_materiality` | entity_id, topic_id, financial_data | Score financial materiality per ESRS 1 section 47. financial_materiality_score = magnitude x likelihood (0-100 each). Magnitude and likelihood must be supplied in ``financial_data``. When absent, the derived materiality score is returned as ``None`` — no fabricated risk figures. |
| `CSRDDMAEngine.run_stakeholder_engagement` | entity_id, stakeholder_data | Score stakeholder engagement quality across 5 elements: identification, dialogue, documentation, integration, feedback. ``engaged_types`` and the per-element scores must be supplied in ``stakeholder_data``. Coverage is a real salience-weighted computation over the engaged stakeholder types. The engagement quality score is the average of whichever element scores are supplied; if none are supplied i |
| `CSRDDMAEngine.prioritise_topics` | entity_id, sector, impact_scores, financial_scores, stakeholder_scores | Rank topics by combined score and assign materiality_basis. combined_score = max(impact_score, financial_score) x stakeholder_weight Only topics with a supplied impact or financial score are ranked; topics with no supplied dimension are excluded rather than assigned fabricated scores. The stakeholder score is a genuine salience input when supplied; when absent, no stakeholder uplift is applied (ne |
| `CSRDDMAEngine.assess_dma_process` | entity_id, process_data | Assess completeness of the DMA process across 4 steps (25% each). Also derives applicable ESRS standards and assurance readiness. Per-step scores and the documentation score must be supplied in ``process_data``. Completeness is the average of supplied step scores; if no step scores are supplied it (and the derived tier / assurance readiness) are returned as ``None`` rather than fabricated. |
| `CSRDDMAEngine.full_assessment` | entity_id, entity_name, sector, nace_code, reporting_period, full_data | Comprehensive DMA covering both materiality dimensions, stakeholder engagement, topic prioritisation and process completeness. Per-topic impact/financial/stakeholder scores must be supplied in ``full_data`` (impact_scores, financial_scores, stakeholder_scores keyed by ESRS topic id). Topics without a supplied score are not fabricated — they are simply excluded from the prioritisation. When no mate |
| `CSRDDMAEngine.get_esrs_topics` |  |  |
| `CSRDDMAEngine.get_severity_criteria` |  |  |
| `CSRDDMAEngine.get_financial_risk_types` |  |  |
| `CSRDDMAEngine.get_sector_materiality` |  |  |

**Engine `csrd_dma_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ESRS_TOPICS` | `{'E1': {'name': 'Climate Change', 'standard': 'ESRS E1', 'sub_topics': ['climate_adaptation', 'climate_mitigation', 'energy']}, 'E2': {'name': 'Pollution', 'standard': 'ESRS E2', 'sub_topics': ['air_pollution', 'water_pollution', 'soil_pollution', 'microplastics']}, 'E3': {'name': 'Water and Marine'` |
| `SEVERITY_CRITERIA` | `{'scale': {'weight': 0.35, 'description': 'Breadth of impact — how many affected'}, 'scope': {'weight': 0.35, 'description': 'Depth of impact — how seriously affected'}, 'irremediability': {'weight': 0.3, 'description': 'Ease of remediation — irreversibility'}}` |
| `FINANCIAL_RISK_TYPES` | `{'physical_risk': 'Chronic or acute physical climate risk affecting asset value or operations', 'transition_risk': 'Policy, regulatory, technology or market shift risk', 'systemic_risk': 'Broader systemic risks (biodiversity loss, social instability)', 'legal_risk': 'Litigation, liability, enforceme` |
| `STAKEHOLDER_TYPES` | `{'employees': {'salience_weight': 0.2}, 'investors': {'salience_weight': 0.2}, 'customers': {'salience_weight': 0.15}, 'suppliers': {'salience_weight': 0.1}, 'local_communities': {'salience_weight': 0.1}, 'ngos': {'salience_weight': 0.1}, 'regulators': {'salience_weight': 0.1}, 'media': {'salience_w` |
| `SECTOR_MATERIALITY` | `{'financial_services': ['E1', 'S1', 'G1', 'S2'], 'energy': ['E1', 'E2', 'E3', 'S1', 'G1'], 'manufacturing': ['E1', 'E2', 'E5', 'S1', 'S2', 'G1'], 'real_estate': ['E1', 'E3', 'E4', 'S1', 'S3'], 'agriculture': ['E1', 'E2', 'E3', 'E4', 'S2', 'S3'], 'technology': ['E1', 'S1', 'S4', 'G1'], 'retail': ['E1` |
| `IMPACT_TYPES` | `['actual_negative', 'potential_negative', 'actual_positive', 'potential_positive']` |
| `VALUE_CHAIN_LOCATIONS` | `['own_operations', 'upstream', 'downstream', 'all']` |
| `DMA_PROCESS_STEPS` | `['context_setting', 'impact_identification', 'impact_assessment', 'topic_prioritisation']` |
| `CROSS_FRAMEWORK_MAP` | `{'TCFD': 'DMA climate topics align with TCFD Governance, Strategy, Risk Management, Metrics pillars', 'GRI_3': 'GRI 3 material topics process requires stakeholder engagement and impact assessment', 'ISSB_S1': 'ISSB S1 uses significance threshold (investor focus) vs ESRS double materiality', 'EU_Taxo` |

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

**POST /api/v1/csrd-dma/financial-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/csrd-dma/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/csrd-dma/impact-assessment** — status `failed`, provenance ['computed'], source tables: —
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

## 7 · Methodology Deep Dive

No MODULE_GUIDES entry exists for this route (`guide: null`), so there is no mismatch to flag. The
module is a genuine, correctly-specified **CSRD Double Materiality Assessment (DMA)** workbench: it
implements the ESRS 1 double-materiality method with real ESRS reference data, a 7-step DMA process,
user-driven severity/likelihood scoring, and a dual-threshold material-topic determination. Scores are
computed from user inputs (with an optional backend `/csrd-dma/dma-process` call), not from a PRNG.

### 7.1 What the module computes

Each of the 10 ESRS topics (E1–E5, S1–S4, G1) is scored on two independent axes:

```js
SEVERITY_SCORE   = { critical:4, significant:3, moderate:2, low:1, none:0 }
LIKELIHOOD_SCORE = { certain:4, likely:3, possible:2, unlikely:1 }

impactScore    = SEVERITY_SCORE[scale] × LIKELIHOOD_SCORE[likelihood]      // 0 … 16
financialScore = magnitude_cr × LIKELIHOOD_SCORE[likelihood]              // €-magnitude × 1..4
```

A topic is **material** if *either* axis exceeds its threshold — the ESRS "no netting" dual-threshold
rule. The material-topic set then maps to the ESRS disclosure requirements that must be reported (ESRS
2 always applies; topical standards only if material).

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| ESRS topics | E1–E5, S1–S4, G1 (10 topical + ESRS 2) | **real** — EFRAG ESRS Set 1 |
| Datapoint counts | ESRS 2: 136, E1: 61, S1: 83, … | **real** — ESRS Set 1 datapoint tallies |
| Severity scale | none/low/moderate/significant/critical → 0–4 | ESRS 1 §43 severity (scale·scope·irremediability) proxy |
| Likelihood | unlikely/possible/likely/certain → 1–4 | ESRS 1 likelihood scale |
| Impact score range | 0–16 (4×4) | derived |
| Financial score | user `magnitude_cr` × likelihood | ESRS 1 financial-materiality magnitude×likelihood |
| Reversibility / risk-type / time-horizon options | reversible/irreversible; physical/transition/litigation/market/reputational; short/med/long | **real** — ESRS 1 dimensions |
| Stakeholder groups / engagement methods | investors/employees/…; survey/interview/workshop/panel | curated (ESRS 1 stakeholder engagement) |

All inputs are user-entered; no synthetic seeding is present in the scoring path.

### 7.3 Calculation walkthrough

User rates each topic's impact (scale + likelihood) and financial (magnitude + likelihood) →
`impactScore` and `financialScore` computed per topic → topics plotted on the double-materiality
scatter (impact axis × financial axis) → those crossing either threshold enter `material_topics` →
mapped to ESRS DRs. The `POST /csrd-dma/full-assessment` (or `dma-process` / `impact-assessment` /
`financial-assessment`) endpoints can run the same logic server-side, returning `material_topics`,
`impact_material_count`, `financial_material_count`.

### 7.4 Worked example (ESRS E1 Climate change)

User rates E1 impact as `scale = significant (3)`, `likelihood = likely (3)`; financial as
`magnitude_cr = €12` with `likelihood = certain (4)`:
```
impactScore    = SEVERITY_SCORE[significant] × LIKELIHOOD_SCORE[likely] = 3 × 3 = 9   (of 16)
financialScore = 12 × LIKELIHOOD_SCORE[certain] = 12 × 4 = 48
```
If the impact threshold is (say) ≥6 and financial threshold ≥20, E1 is material on **both** axes →
included, and triggers ESRS E1 disclosure requirements (E1-1 transition plan, E1-6 GHG Scopes 1–3,
E1-8 internal carbon pricing, E1-9 financial effects). ESRS 2 is disclosed regardless.

### 7.5 Data provenance & limitations

- **No synthetic data** in the scoring path — all severity/likelihood/magnitude values are user input;
  ESRS reference data (topics, datapoint counts, DR IDs) is real and correctly cited.
- The severity axis collapses ESRS 1's three sub-dimensions (scale, scope, irremediability) into a
  single ordinal "scale" — a simplification of the full ESRS 1 §43 severity construct.
- Thresholds are configured in-app; the module does not enforce a single regulator-blessed cut (there
  isn't one — thresholds are entity-determined and disclosed under IRO-1).

**Framework alignment:** ESRS 1 double materiality (impact OR financial, no netting) · ESRS 2 general
disclosures (always mandatory; IRO-1 documents the DMA process) · EFRAG ESRS Set 1 topical standards
E1–E5/S1–S4/G1 with their real datapoint counts and DR identifiers. ESRS 1 derives materiality by
assessing impacts on severity (scale × scope × irremediable character) and likelihood, and risks/
opportunities on financial magnitude × likelihood × time horizon — exactly the two axes this module
scores. This is one of the atlas's faithfully-implemented regulatory modules.

## 9 · Future Evolution

### 9.1 Evolution A — Fix the failed endpoints, complete the ESRS 1 severity construct (analytics ladder: rung 2 → 3)

**What.** §7 calls this "one of the atlas's faithfully-implemented regulatory
modules": genuine dual-axis double-materiality scoring (severity×likelihood impact
score, magnitude×likelihood financial score, either-threshold materiality with no
netting), real ESRS Set 1 reference data with correct datapoint counts, and no
synthetic seeding in the scoring path. Two gaps: three POST endpoints fail the
lineage harness (`/impact-assessment`, `/financial-assessment`, `/full-assessment` —
the server-side scoring path is broken while the client-side works), and §7.5 notes
the severity axis collapses ESRS 1 §43's three sub-dimensions (scale, scope,
irremediability) into one ordinal.

**How.** (1) Endpoint triage first — the failures look like the payload/500 class
the deployment-prep sweep fixed elsewhere; the client and server implementations
must also be reconciled so one scoring engine serves both (server as source of
truth, page as client). (2) Severity completion: score scale, scope, and
irremediable character separately per ESRS 1 §43 and combine them visibly (max or
documented weighting), so IRO-1 documentation can show the full construct — a
material upgrade for assurance readiness. (3) Sector calibration (rung 3): the
`/ref/sector-materiality` endpoint already passes — use it to pre-populate topic
expectations per sector (ESRS sector guidance) as a challenge layer: a company
scoring E1 immaterial in a high-impact sector gets a documented divergence prompt.
(4) Persist assessments with versioning so year-over-year DMA evolution is
auditable; connect the controversy-evidence cross-check from
`controversy-materiality`'s validation output as a second challenge layer.

**Prerequisites.** The three endpoint fixes; persistence schema. **Acceptance:**
server and client produce identical materiality sets for the same inputs; the
worked E1 example reproduces; a sector-expectation divergence renders a visible
flag with the sector source cited.

### 9.2 Evolution B — DMA facilitation copilot with IRO-1 documentation output (LLM tier 2)

**What.** A DMA's cost is facilitation and documentation, not arithmetic. Evolution B
supports both: during scoring, the copilot challenges entries with grounded
prompts ("you scored S2 value-chain workers 'low/unlikely' — your sector's ESRS
guidance and your CSDDD supplier data suggest reviewing; here's why"), drawing on
`/ref/sector-materiality`, the severity-criteria definitions, and cross-module
evidence; afterward, it drafts the IRO-1 process disclosure — methodology,
thresholds, stakeholder engagement conducted, and the materiality conclusions with
their scores — the ESRS 2 documentation every assessment must produce.

**How.** Tool-calling over the module's 10 operations (the four ref GETs ground the
challenges; the POST assessments compute), with the drafter consuming the persisted
assessment record. Challenge prompts must be suggestions with sources, never score
changes — the entity determines materiality, the copilot documents and stress-tests.
Fabrication validation on all scores and datapoint counts; the draft's threshold
statement must match the configured values exactly.

**Prerequisites (hard).** Evolution A's endpoint fixes and persistence (drafting
IRO-1 from unpersisted client state isn't auditable); sector guidance and ESRS 1
text embedded. **Acceptance:** every challenge cites its source (sector table,
severity criterion, or cross-module record); the IRO-1 draft's materiality table
matches the stored assessment exactly; the copilot never modifies a score itself.