# Api::Tnfd_Assessment
**Module ID:** `api::tnfd_assessment` · **Route:** `/api/v1/tnfd` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/tnfd/assess-disclosures` | `assess_disclosures` | api/v1/routes/tnfd_assessment.py |
| POST | `/api/v1/tnfd/assess-materiality` | `assess_materiality` | api/v1/routes/tnfd_assessment.py |
| POST | `/api/v1/tnfd/assess-leap-readiness` | `assess_leap_readiness` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/recommended-disclosures` | `ref_recommended_disclosures` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/leap-phases` | `ref_leap_phases` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/ecosystem-services` | `ref_ecosystem_services` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/nature-risk-categories` | `ref_nature_risk_categories` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/sector-guidance` | `ref_sector_guidance` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/pillar-structure` | `ref_pillar_structure` | api/v1/routes/tnfd_assessment.py |
| GET | `/api/v1/tnfd/ref/priority-areas` | `ref_priority_areas` | api/v1/routes/tnfd_assessment.py |

### 2.3 Engine `tnfd_assessment_engine` (services/tnfd_assessment_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `TNFDAssessmentEngine.assess_disclosures` | entity_name, reporting_year, disclosure_data, sector | Score each of the 14 TNFD recommended disclosures, run LEAP phase scoring, build a nature risk profile, generate cross-framework mapping, and identify gaps with recommendations. Parameters ---------- entity_name : str Name of the reporting entity. reporting_year : int The fiscal / reporting year being assessed. disclosure_data : dict / None Mapping of disclosure ID (e.g. "GOV-A") to a dict with ke |
| `TNFDAssessmentEngine.assess_nature_materiality` | entity_name, reporting_year, sector, dependencies, impacts | Evaluate which ecosystem services are material, score financial vs impact materiality, identify double-materiality topics, and generate recommendations. Parameters ---------- entity_name : str reporting_year : int sector : str Key in TNFD_SECTOR_GUIDANCE. dependencies : list[dict] / None Each dict: {"service_id": "ES04", "magnitude": "high", "scope": "direct"} impacts : list[dict] / None Each dict |
| `TNFDAssessmentEngine.assess_leap_readiness` | entity_name, reporting_year, leap_data | Score each LEAP phase and sub-component and return an overall readiness level. Parameters ---------- entity_name : str reporting_year : int leap_data : dict / None Mapping of component ID (e.g. "L1") to status string: "completed", "in_progress", "planned", "not_started" Returns ------- dict with keys: entity_name, reporting_year, phase_results, overall_score, readiness_level, gaps, recommendations |
| `TNFDAssessmentEngine.get_recommended_disclosures` |  | Return the 14 TNFD recommended disclosures. |
| `TNFDAssessmentEngine.get_leap_phases` |  | Return LEAP phases with sub-components. |
| `TNFDAssessmentEngine.get_encore_ecosystem_services` |  | Return the 21 ENCORE ecosystem services. |
| `TNFDAssessmentEngine.get_nature_risk_categories` |  | Return the 3 nature risk categories with sub-types. |
| `TNFDAssessmentEngine.get_sector_guidance` |  | Return sector-specific TNFD guidance for 8 sectors. |
| `TNFDAssessmentEngine.get_cross_framework_map` |  | Return TNFD-to-peer-framework mapping. |
| `TNFDAssessmentEngine.get_disclosure_pillar_structure` |  | Return pillar-grouped disclosure structure for UI rendering. |
| `TNFDAssessmentEngine.get_priority_area_criteria` |  | Return priority area criteria (KBAs, protected areas, etc.). |
| `TNFDAssessmentEngine._status_to_score` | status | Convert a compliance status string to a numeric score. |
| `TNFDAssessmentEngine._build_disclosure_findings` | disclosure_id, status, evidence | Build findings list for a single disclosure. |
| `TNFDAssessmentEngine._score_leap_phases` | leap_data | Score each LEAP phase and its sub-components. |
| `TNFDAssessmentEngine._build_risk_profile` | risk_data | Build a nature risk profile from provided risk scores. risk_data mapping: category -> score (0-100). |
| `TNFDAssessmentEngine._resolve_ecosystem_services` | service_ids | Resolve ES IDs to full ENCORE ecosystem service records. |
| `TNFDAssessmentEngine._find_ecosystem_service` | service_id | Find a single ENCORE ecosystem service by ID. |
| `TNFDAssessmentEngine._build_cross_framework_mapping` | scored | Map scored disclosures to equivalent requirements in peer frameworks. |
| `TNFDAssessmentEngine._identify_gaps` | scored, leap_results, sector | Identify disclosure and LEAP gaps. |
| `TNFDAssessmentEngine._generate_recommendations` | scored, leap_results, gaps, sector, overall_pct | Generate prioritised recommendations based on assessment results. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/tnfd/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework_mapping'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/ecosystem-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ecosystem_services'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/leap-phases** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['leap_phases'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/nature-risk-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['nature_risk_categories'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/pillar-structure** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillar_structure'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/priority-areas** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['priority_area_criteria'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/recommended-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['recommended_disclosures'], 'n_keys': 1}`

**GET /api/v1/tnfd/ref/sector-guidance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_guidance'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `tnfd_assessment_engine` — extracted transformation lines:**
```python
avg = sum(scores) / len(scores) if scores else 0.0
mag_score = min(mag_score + 15.0, 100.0)
fin_materiality = round(sum(fin_scores) / len(fin_scores), 1) if fin_scores else 0.0
adjusted = min(base * mult, 100.0)
imp_materiality = round(sum(imp_scores) / len(imp_scores), 1) if imp_scores else 0.0
avg = sum(scores_list) / len(scores_list) if scores_list else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/tnfd_assessment_engine.py` implements three assessments against **TNFD Recommendations v1.0 (Sept 2023)**:

1. **Disclosure assessment** (`assess_disclosures`) — scores the 14 TNFD recommended disclosures (GOV-A/B/C, STR-A/B/C/D, RIM-A/B/C, MT-A/B/C/D) from caller-supplied statuses, rolls up to a pillar-weighted overall compliance %.
2. **LEAP readiness** (`assess_leap_readiness`) — scores the 16 LEAP sub-components (L1–L4, E1–E4, A1–A4, P1–P4) from status strings and maps to a 4-level readiness ladder.
3. **Double materiality** (`assess_nature_materiality`) — separate financial (dependency-driven) and impact (severity × reversibility) materiality scores with a ≥60/≥60 double-materiality gate.

The eight `GET /api/v1/tnfd/ref/*` endpoints in the assignment serve the engine's reference tables verbatim: 14 disclosures, LEAP phases, 21 ENCORE ecosystem services, 3 nature-risk categories (10 sub-types), 8 sector guidance packages, cross-framework map, pillar structure, and 8 priority-area criteria (KBAs, WDPA, Ramsar, UNESCO natural WHS, IUCN Red List habitat, WRI Aqueduct water-stressed basins, IFLs, HCS areas).

### 7.2 Parameterisation

**Status→score maps (engine-authored):**

| Input | Disclosure score | LEAP score |
|---|---|---|
| full / completed | 100 | 100 |
| partial / in_progress | 50 | 60 |
| — / planned | — | 25 |
| not_addressed / not_started | 0 | 0 |

**Pillar weights** (`_PILLAR_WEIGHTS`): Governance 0.20, Strategy 0.30, Risk & Impact Management 0.25, Metrics & Targets 0.25 — same weighting scheme as the platform's TCFD engine (design symmetry, not a TNFD-published weighting).

**LEAP phase weights** (`_LEAP_WEIGHTS`): LOCATE 0.20, EVALUATE 0.25, **ASSESS 0.35**, PREPARE 0.20 — the ASSESS overweight encodes the view that risk/materiality assessment is the pivotal phase. Readiness ladder: ≥80 advanced, ≥55 developing, ≥25 early, else not_started.

**Materiality maps:** magnitude {high 90, medium 60, low 30} (+15 boost, capped 100, if the ecosystem service is in the sector's ENCORE priority list); impact = severity {90/60/30} × reversibility multiplier {irreversible 1.3, low 1.15, medium 1.0, high 0.85}, capped 100. Double-material when both axes ≥ 60.

**Risk profile:** caller supplies 0–100 scores per category (physical/transition/systemic); rating bands ≥70 high, ≥40 medium, else low. The engine never invents risk scores — unsupplied categories score 0.

### 7.3 Calculation walkthrough

`assess_disclosures`: per-disclosure status → score → pillar mean → weighted sum = `overall_compliance_pct`. Side channels: `STR-D.priority_locations` count passes through; `MT-B.ecosystem_services` IDs resolve against the ENCORE table; `__leap__` and `__risk__` keys feed the LEAP scorer and risk profile. Gap detection flags every not_addressed/partial disclosure and every LEAP component below 60. Recommendations are tiered by overall % (<25 / <50 / <80 / ≥80) plus pillar (<40), LEAP phase (<30), sector, and STR-D-specific rules. Assessment IDs are deterministic SHA-256 hashes of `entity_name`+`year` (idempotent, not random).

### 7.4 Worked example — disclosure assessment

Entity reports: GOV-A full, GOV-B partial, GOV-C not addressed; STR-A full, STR-B partial, STR-C not addressed, STR-D partial; RIM-A/B full, RIM-C partial; MT-A partial, MT-B full, MT-C partial, MT-D not addressed.

| Pillar | Scores | Mean | × weight |
|---|---|---|---|
| Governance | 100, 50, 0 | 50.0 | 0.20 → 10.0 |
| Strategy | 100, 50, 0, 50 | 50.0 | 0.30 → 15.0 |
| Risk & Impact Mgmt | 100, 100, 50 | 83.33 | 0.25 → 20.83 |
| Metrics & Targets | 50, 100, 50, 0 | 50.0 | 0.25 → 12.5 |

Overall = **58.3%** → recommendation tier "Good progress… focus on Metrics & Targets" (50–80 band). Gaps list: 3 not-addressed + 6 partial disclosures.

Materiality example (mining sector): dependency `{ES04 Ground water, magnitude high}` → 90 + 15 (ES04 is in mining's ENCORE list) = 100, capped → financial materiality **100**. Impact `{land_use_change, severity high, reversibility low}` → 90 × 1.15 = 103.5 → capped **100** → impact materiality 100. Both ≥ 60 → classification **double_material**, triggering the SBTN-alignment recommendation.

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic seed data** — all scores derive from caller-supplied statuses/magnitudes; unsupplied inputs default to zero rather than fabricated values. IDs are content-hashes, so repeat calls are reproducible.
- Reference tables are faithful transcriptions: the 14 disclosures and LEAP L1–P4 structure match TNFD v1.0; the 21 ecosystem services follow ENCORE's classification (note ENCORE itself has since moved to the ~25-service CICES-aligned v2 list — the engine snapshot predates that).
- Coarse scoring granularity (3-state disclosure, 4-state LEAP) measures presence, not quality; a "full" self-assessment is taken at face value with no evidence validation beyond echoing it into findings.
- Pillar/LEAP weights, the +15 sector boost, reversibility multipliers, and all band thresholds are engine calibration values with no TNFD citation.
- Double-materiality gate operates on entity-level averages, not per-topic — one high dependency plus one low can dilute below 60.

### 7.6 Framework alignment

- **TNFD Recommendations v1.0 (2023)** — the 4-pillar/14-disclosure architecture (TNFD deliberately extends TCFD's 11 with GOV-C human rights, STR-D priority locations, MT-D nature-positive contribution — all present here) and the LEAP approach (Locate→Evaluate→Assess→Prepare) with its published sub-steps.
- **ENCORE** (Natural Capital Finance Alliance / UNEP-WCMC) — the dependency-screening knowledge base linking sectors to ecosystem services; the engine uses its service taxonomy and per-sector dependency lists to drive the materiality boost.
- **CSRD ESRS E4 / IFRS S1 / GRI 304 / CBD GBF Target 15** — per-disclosure crosswalk with paragraph-level citations (e.g. STR-D ↔ ESRS E4-4 sensitive areas ↔ GRI 304-1 ↔ GBF Target 3 "30x30"). GBF Target 15 is the CBD target requiring large companies and FIs to assess and disclose nature-related risks, dependencies and impacts — which is exactly what this assessment operationalises.
- **SBTN** — referenced in recommendations for impact-driver screening and nature target-setting; not computationally implemented.

## 9 · Future Evolution

### 9.1 Evolution A — Location-evidence-backed LEAP and priority-area screening (analytics ladder: rung 1 → 3)

**What.** The engine implements three assessments against TNFD Recommendations v1.0: the 14
recommended disclosures (GOV/STR/RIM/MT) rolled to a pillar-weighted compliance %, LEAP readiness
across 16 sub-components mapped to a 4-level ladder, and double materiality (financial =
dependency-driven, impact = severity × reversibility, gated at ≥60/≥60). Its reference layer is
unusually rich — 21 ENCORE ecosystem services, 8 sector packages, and 8 priority-area criteria
(KBAs, WDPA, Ramsar, UNESCO WHS, IUCN Red List habitat, Aqueduct basins, IFLs, HCS). But all three
assessments score *caller-supplied statuses* — the priority-area criteria are listed, not checked.
Evolution A makes Locate real.

**How.** (1) Wire the priority-area criteria to the platform's actual spatial layers: WDPA
proximity via `nature_data`/`spatial`, water-stressed basins via the Aqueduct-style data in
`nature_risk`, species sensitivity via `gbif_screening` — so the LEAP "Locate" sub-components
(L1–L4) are computed from asset coordinates with an evidence tier, not self-declared. (2) Feed
double-materiality dependency scores from the ENCORE sector lookups the sibling `nature_risk` and
`nature_capital` engines already hold, making the ≥60/≥60 gate evidence-anchored. (3) Persist
assessments for readiness trajectories. (4) Bench-pin the pillar weighting, LEAP ladder, and
materiality gate.

**Prerequisites.** Spatial-layer population (nature_data/spatial Evolution As); asset-coordinate
input; ENCORE linkage. **Acceptance:** Locate sub-scores derive from real WDPA/water/biodiversity
lookups with evidence tiers; the materiality gate cites ENCORE dependencies; assessments persist
with history; scoring bench-pinned.

### 9.2 Evolution B — TNFD reporting copilot orchestrating the nature stack (LLM tier 2)

**What.** A copilot that runs the three assessments and drafts the TNFD narrative — "you're LEAP
readiness level 2: Locate is strong but Evaluate lags (E2/E3 not started); disclosure compliance is
54% with RIM-B and MT-C missing; water dependency gates you into double materiality" — every score
tool-sourced, with the sector guidance shaping the recommendations.

**How.** Three POST assessments plus eight `ref/*` endpoints (14 disclosures, LEAP phases, ENCORE
services, risk categories, sector guidance, cross-framework, pillar structure, priority-area
criteria) — the most complete reference corpus in the nature domain, so definitional questions
never leave the module. This copilot is the natural *orchestrator* of the nature stack: it routes
Locate questions to `nature_data`/`gbif_screening`, valuation to `nature_capital`, and LEAP scoring
to `nature_risk`, then assembles the TNFD-structured story — a tier-3 pattern scoped to one desk.

**Prerequisites.** None hard for narrating self-asserted assessments; Evolution A before the
copilot presents Locate results as evidence-based. **Acceptance:** every disclosure status, LEAP
score, and materiality figure traces to a tool response; cross-module claims cite the module that
computed them; the copilot discloses self-declared vs location-verified inputs and refuses to
assert TNFD "alignment" beyond the computed compliance %.