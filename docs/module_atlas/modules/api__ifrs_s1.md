# Api::Ifrs_S1
**Module ID:** `api::ifrs_s1` · **Route:** `/api/v1/ifrs-s1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ifrs-s1/assess` | `assess` | api/v1/routes/ifrs_s1.py |
| POST | `/api/v1/ifrs-s1/assess/pillar` | `assess_pillar` | api/v1/routes/ifrs_s1.py |
| POST | `/api/v1/ifrs-s1/assess/batch` | `assess_batch` | api/v1/routes/ifrs_s1.py |
| GET | `/api/v1/ifrs-s1/ref/pillars` | `ref_pillars` | api/v1/routes/ifrs_s1.py |
| GET | `/api/v1/ifrs-s1/ref/disclosure-requirements` | `ref_disclosure_requirements` | api/v1/routes/ifrs_s1.py |
| GET | `/api/v1/ifrs-s1/ref/reliefs` | `ref_reliefs` | api/v1/routes/ifrs_s1.py |

### 2.3 Engine `ifrs_s1_engine` (services/ifrs_s1_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `S1PillarResult.dict` |  |  |
| `IFRSS1Result.dict` |  |  |
| `IFRSS1Engine.assess_pillar` | pillar_id, entity_id, entity_name, disclosures | Assess a single IFRS S1 pillar. |
| `IFRSS1Engine.assess` | inp | Full IFRS S1 compliance assessment across all 4 pillars. |
| `IFRSS1Engine.get_pillars` |  |  |
| `IFRSS1Engine.get_disclosure_requirements` |  |  |
| `IFRSS1Engine.get_industry_sasb_mapping` |  |  |
| `IFRSS1Engine.get_cross_framework` |  |  |
| `IFRSS1Engine.get_reliefs` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ifrs-s1/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ifrs_s2', 'csrd_esrs', 'tcfd', 'gri', 'sasb', 'sec_climate'], 'n_keys': 6}`

**GET /api/v1/ifrs-s1/ref/disclosure-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['S1.15', 'S1.16', 'S1.22', 'S1.23', 'S1.24', 'S1.25', 'S1.33', 'S1.34', 'S1.35', 'S1.38', 'S1.39', 'S1.40', 'S1.42'], 'n_keys': 13}`

**GET /api/v1/ifrs-s1/ref/industry-sasb-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_services', 'energy', 'real_estate', 'technology', 'healthcare', 'consumer_goods', 'industrials'], 'n_keys': 7}`

**GET /api/v1/ifrs-s1/ref/pillars** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['governance', 'strategy', 'risk_management', 'metrics_targets'], 'n_keys': 4}`

**GET /api/v1/ifrs-s1/ref/reliefs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['prior_period_comparative', 'scope3_grace_period', 'industry_metrics_grace'], 'n_keys': 3}`

**POST /api/v1/ifrs-s1/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ifrs-s1/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ifrs-s1/assess/pillar** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `ifrs_s1_engine` — extracted transformation lines:**
```python
pillar_score = (weighted_sum / total_weight) if total_weight > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded in
`backend/services/ifrs_s1_engine.py` (E18) and `backend/api/v1/routes/ifrs_s1.py`.)*

### 7.1 What the domain computes

`IFRSS1Engine` scores an entity's disclosures against **IFRS S1** (ISSB, June 2023, effective
1 Jan 2024) — the general (non-climate-specific) sustainability disclosure standard — organised
into the four TCFD-inherited pillars:

```
per requirement:  quality_score = full 100 / partial 50 / none 0
                  weight w = 1.5 if blocking else 1.0
pillar_score      = Σ(quality × w) / Σw               (missing disclosures count as "none")
overall_score     = 0.25·Gov + 0.35·Strategy + 0.20·RiskMgmt + 0.20·Metrics&Targets
overall_compliant = overall_score ≥ 70 AND no blocking requirement is undisclosed
```

Endpoints: `POST /assess` (full 4-pillar assessment), `POST /assess/pillar` (single pillar),
`POST /assess/batch` (multi-entity groups), and five reference GETs (pillars,
disclosure-requirements, industry-SASB-mapping, cross-framework, reliefs).

### 7.2 Parameterisation

**Requirement registry** (13 requirements keyed to real IFRS S1 paragraph numbers):

| ID | Pillar | Name | Blocking |
|---|---|---|---|
| S1.15 / S1.16 | Governance | Board oversight / Management's role | ✓ / ✓ |
| S1.22 / S1.23 / S1.24 | Strategy | Risks & opportunities / Time horizons / Current & anticipated effects | ✓ ✓ ✓ |
| S1.25 | Strategy | Resilience assessment (scenario analysis "or other approaches") | ✗ |
| S1.33 / S1.34 / S1.35 | Risk mgmt | Identification & assessment / Prioritisation / Monitoring | ✓ ✓ ✓ |
| S1.38 | Metrics | Metrics required by ISSB Standards (S2 + SASB) | ✓ |
| S1.39 / S1.40 | Metrics | Regulation-required / Internally-developed metrics | ✗ ✗ |
| S1.42 | Metrics | Targets | ✓ |

Pillar metadata additionally lists the full paragraph ranges (Gov S1.15–20, Strategy S1.22–30,
Risk S1.33–36, Metrics S1.38–44) — the scored registry is a 13-item *subset* of those ranges.

**Weights & thresholds:** pillar weights 0.25/0.35/0.20/0.20 (Strategy heaviest), blocking-item
weight 1.5×, quality map 100/50/0, compliance gate 70 — all platform design constants, not ISSB
values (ISSB does not score; it requires disclosure).

**Industry → SASB codes:** 7 industries mapped to real SASB industry-code prefixes
(financial_services → FN-AC…FN-EX; energy → EM-CO…EM-NR; technology → TC-HW…TC-TL; etc.),
served with results because S1.38 pulls SASB industry metrics into scope.

**Transitional reliefs** (real ISSB reliefs, with Basis-for-Conclusions citations): first-year
comparatives exemption (S1.BC125), one-year Scope 3 grace period (S2.BC99), SASB
industry-metrics phase-in when not applying S2 concurrently (S1.BC128). Reliefs claimed by the
caller are echoed in the result (`applied_reliefs`) but **do not alter scoring**.

### 7.3 Calculation walkthrough

`assess` iterates the four pillars; each pillar scores only its registered requirement IDs,
treating absent entries as quality "none" (which, for blocking items, both zero-scores at
weight 1.5 and records a named blocking gap). The overall score is the pillar-weighted average;
priority actions list up to 4 blocking requirements below 100, lowest score first. Batch
assessment maps the same routine over a list of entities.

### 7.4 Worked example

Entity disclosures: S1.15 full, S1.16 partial, S1.22 full, S1.23 full, S1.24 partial,
S1.25 none, S1.33 full, S1.34 partial, S1.35 none, S1.38 partial, S1.39 none, S1.40 none,
S1.42 full.

| Pillar | Weighted computation | Score |
|---|---|---|
| Governance (2 blocking) | (100×1.5 + 50×1.5) / 3.0 | 75.00 |
| Strategy (3 blocking + S1.25 non-blocking) | (100+100+50)×1.5 + 0×1.0 = 375 / 5.5 | 68.18 |
| Risk mgmt (3 blocking) | (100+50+0)×1.5 / 4.5 | 50.00 |
| Metrics (S1.38 ✓1.5, S1.39/40 ✗1.0, S1.42 ✓1.5) | (50×1.5 + 0 + 0 + 100×1.5) / 5.0 | 45.00 |
| **Overall** | 0.25×75 + 0.35×68.18 + 0.20×50 + 0.20×45 | **60.61** |

Result: **not compliant** — score < 70 *and* one blocking gap
("S1.35 — Monitoring: not disclosed"). Priority actions (ascending score): S1.35 (0), then the
50-scored blocking items S1.16, S1.24, S1.34, S1.38 — truncated to 4.

### 7.5 Cross-framework layer

The result embeds a static interoperability map: IFRS S2 (climate companion — governed by this
engine's sibling `issb-*` modules), CSRD ESRS 1/2 (EU equivalent; 2024 interoperability
guidance), TCFD (S1's pillar architecture is TCFD "operationalised into GAAP-quality
disclosure"), GRI Universal Standards, SASB (via S1.38), SEC climate rule 33-11275.

### 7.6 Data provenance & limitations

- No synthetic PRNG; fully deterministic over caller-supplied disclosure inventories. The
  registry text and paragraph citations are faithful summaries of the published standard.
- **Coverage subset:** only 13 of the standard's requirements are scored (e.g. Governance scores
  S1.15/16 but not the S1.17–20 detail paragraphs listed in the pillar metadata; Strategy
  S1.26–30 — financial-effects and value-chain paragraphs — are listed but unscored). The
  pillar's `total_requirements` reflects the scored subset, so completeness reads higher than a
  full-standard audit would show.
- Quality is a caller-attested 3-level label (full/partial/none) — no evidence inspection or NLP
  of the actual report.
- Scoring semantics (70 gate, 1.5× blocking weight, 100/50/0) are platform conventions; ISSB
  compliance is binary "in accordance" language in the real standard.
- Reliefs are echoed, not applied — e.g. claiming the S1.BC125 comparatives relief does not
  exempt any scored requirement.
- `S1AssessmentInput.reporting_year` defaults to 2025 and industry to "general" (which maps to
  an empty SASB list).

### 7.7 Framework alignment

- **IFRS S1 (ISSB 2023)** — the four content pillars (governance / strategy / risk management /
  metrics & targets) and the cited paragraph numbers are genuine; IFRS S1 requires disclosure of
  material sustainability-related risks and opportunities using SASB standards as a source of
  guidance — reflected in the S1.38 blocking item and industry-SASB mapping.
- **TCFD** — IFRS S1/S2 formally absorb the TCFD recommendations (the FSB handed monitoring to
  ISSB from 2024); the pillar structure here is that inheritance made explicit.
- **SASB Standards** — industry-specific metrics identified via SICS industries; the code's
  two-letter prefixes (FN, EM, TC, HC, CG, IF, CN) are real SASB sector codes.
- **CSRD/ESRS interoperability** — the ESRS–ISSB interoperability guidance (EFRAG/ISSB, May
  2024) confirms that ESRS 2 general disclosures broadly satisfy S1 content — the module's
  cross-framework note summarises exactly this.
- **Transitional reliefs** — the three reliefs match the standard's actual transition
  provisions (first-year comparatives, climate-first reporting allowing Scope 3 and
  industry-metric phase-in).

## 9 · Future Evolution

### 9.1 Evolution A — Evidence-graded scoring and cross-framework gap propagation (analytics ladder: rung 1 → 2)

**What.** The E18 `IFRSS1Engine` scores an entity against IFRS S1's 13 paragraph-keyed
requirements across the four TCFD-inherited pillars:
`quality = full 100 / partial 50 / none 0`, `weight = 1.5 if blocking else 1.0`,
`overall = 0.25·Gov + 0.35·Strategy + 0.20·RiskMgmt + 0.20·Metrics`, compliant at ≥70
with no blocking gap. It is a clean deterministic self-assessment whose weakness is that
quality is a caller-asserted 3-level flag — there's no evidence linkage and no
reuse of what the entity already disclosed under adjacent frameworks. Evolution A adds
cross-framework propagation and a what-if layer.

**How.** (1) Use the existing `/ref/cross-framework` and `/ref/industry-sasb-mapping`
tables to pre-populate S1 quality scores from the entity's IFRS S2, ESRS, TCFD, GRI, or
SASB assessments already computed elsewhere on the platform — so an entity graded on
ESRS governance inherits a defensible S1 governance draft rather than re-keying. (2) Add
a scenario sweep over the `blocking` weighting and the 70 threshold to show sensitivity
of the compliant/non-compliant verdict (rung 2). (3) Preserve the honest "missing =
none" rule and bench-pin the pillar and overall aggregation.

**Prerequisites.** A shared entity-disclosure store the sibling framework engines write
to (so cross-framework inheritance has a source); mapping confidence per inherited field.
**Acceptance:** an entity with an existing ESRS assessment gets non-null S1 governance
scores tagged `inherited` with a confidence; the compliance verdict's sensitivity to the
threshold is reported; bench pin reproduces `overall_score`.

### 9.2 Evolution B — ISSB disclosure-readiness copilot (LLM tier 2)

**What.** A copilot that runs `/assess` and explains the verdict in regulator-facing
terms — "you're non-compliant because S1.25 (a blocking requirement) is undisclosed;
your Strategy pillar is 62" — citing the requirement registry and the exact undisclosed
blocking items, then drafting the remediation order and re-scoring via `/assess/pillar`.

**How.** Three POST endpoints (`/assess`, `/assess/pillar`, `/assess/batch`) plus five
reference GETs that fully describe IFRS S1 paragraphs, reliefs, and cross-framework
mappings — a complete, self-contained grounding corpus, so the copilot never needs
outside knowledge of the standard. Batch assessment supports "score all our subsidiaries
and rank by readiness". The `/ref/reliefs` endpoint lets the copilot correctly apply
transition reliefs rather than over-flagging first-year gaps.

**Prerequisites.** None hard — engine is honest and reference-complete. **Acceptance:**
every score, pillar, and named gap in an answer maps to an `/assess` response field; the
copilot cites real S1 paragraph IDs (S1.15, S1.25…) from the registry, not invented
ones; asking for a quantitative disclosure quality the engine doesn't grade (it only
scores full/partial/none) yields an explicit refusal.