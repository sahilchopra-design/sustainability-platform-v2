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
