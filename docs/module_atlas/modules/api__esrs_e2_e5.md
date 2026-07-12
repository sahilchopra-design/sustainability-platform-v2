# Api::Esrs_E2_E5
**Module ID:** `api::esrs_e2_e5` · **Route:** `/api/v1/esrs-e2-e5` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/esrs-e2-e5/assess` | `assess` | api/v1/routes/esrs_e2_e5.py |
| POST | `/api/v1/esrs-e2-e5/assess-materiality` | `assess_materiality` | api/v1/routes/esrs_e2_e5.py |
| POST | `/api/v1/esrs-e2-e5/assess-e2` | `assess_e2` | api/v1/routes/esrs_e2_e5.py |
| POST | `/api/v1/esrs-e2-e5/assess-e3` | `assess_e3` | api/v1/routes/esrs_e2_e5.py |
| POST | `/api/v1/esrs-e2-e5/assess-e4` | `assess_e4` | api/v1/routes/esrs_e2_e5.py |
| POST | `/api/v1/esrs-e2-e5/assess-e5` | `assess_e5` | api/v1/routes/esrs_e2_e5.py |
| GET | `/api/v1/esrs-e2-e5/ref/e2-disclosures` | `ref_e2_disclosures` | api/v1/routes/esrs_e2_e5.py |
| GET | `/api/v1/esrs-e2-e5/ref/e3-disclosures` | `ref_e3_disclosures` | api/v1/routes/esrs_e2_e5.py |
| GET | `/api/v1/esrs-e2-e5/ref/e4-disclosures` | `ref_e4_disclosures` | api/v1/routes/esrs_e2_e5.py |
| GET | `/api/v1/esrs-e2-e5/ref/e5-disclosures` | `ref_e5_disclosures` | api/v1/routes/esrs_e2_e5.py |
| GET | `/api/v1/esrs-e2-e5/ref/materiality-triggers` | `ref_materiality_triggers` | api/v1/routes/esrs_e2_e5.py |

### 2.3 Engine `esrs_e2_e5_engine` (services/esrs_e2_e5_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ESRSE2E5Engine.get_instance` |  |  |
| `ESRSE2E5Engine.assess_materiality` | entity_id, nace_sector |  |
| `ESRSE2E5Engine.assess_e2_pollution` | entity_id, pollution_data |  |
| `ESRSE2E5Engine.assess_e3_water` | entity_id, water_data |  |
| `ESRSE2E5Engine.assess_e4_biodiversity` | entity_id, biodiversity_data |  |
| `ESRSE2E5Engine.assess_e5_circular` | entity_id, circular_data |  |
| `ESRSE2E5Engine.assess` | entity_id, entity_name, reporting_period, nace_sector, e2_data, e3_data, e4_data, e5_data |  |
| `ESRSE2E5Engine.ref_e2_disclosures` |  |  |
| `ESRSE2E5Engine.ref_e3_disclosures` |  |  |
| `ESRSE2E5Engine.ref_e4_disclosures` |  |  |
| `ESRSE2E5Engine.ref_e5_disclosures` |  |  |
| `ESRSE2E5Engine.ref_materiality_triggers` |  |  |
| `ESRSE2E5Engine._score_completeness` | flags |  |
| `get_engine` |  |  |

**Engine `esrs_e2_e5_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_DEFAULT_MATERIALITY` | `{'E2': False, 'E3': False, 'E4': False, 'E5': False}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `dataclasses` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/esrs-e2-e5/ref/e2-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E2-1', 'E2-2', 'E2-3', 'E2-4', 'E2-5', 'E2-6'], 'n_keys': 6}`

**GET /api/v1/esrs-e2-e5/ref/e3-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E3-1', 'E3-2', 'E3-3', 'E3-4', 'E3-5'], 'n_keys': 5}`

**GET /api/v1/esrs-e2-e5/ref/e4-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E4-1', 'E4-2', 'E4-3', 'E4-4', 'E4-5', 'E4-6'], 'n_keys': 6}`

**GET /api/v1/esrs-e2-e5/ref/e5-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E5-1', 'E5-2', 'E5-3', 'E5-4', 'E5-5', 'E5-6'], 'n_keys': 6}`

**GET /api/v1/esrs-e2-e5/ref/materiality-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['A01', 'A02', 'A03', 'B05', 'B06', 'C10', 'C13', 'C17', 'C20', 'C24', 'C26', 'D35', 'E36', 'E38', 'F41', 'G46', 'H50', 'I55', 'K64', 'L68'], 'n_keys': 20}`

**POST /api/v1/esrs-e2-e5/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esrs-e2-e5/assess-e2** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esrs-e2-e5/assess-e3** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `esrs_e2_e5_engine` — extracted transformation lines:**
```python
consumption = round(withdrawal_total - discharge_total, 1)
directed_to_disposal_t = round(waste_generated_t - diverted_t, 0)
diversion_rate_pct = round((diverted_t / waste_generated_t) * 100, 1)
overall_completeness = round(sum(completeness_scores) / len(completeness_scores), 1) if completeness_scores else 100.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/esrs-e2-e5` wraps the **CSRD ESRS E2–E5 Environment Topics Engine**
(`backend/services/esrs_e2_e5_engine.py`), covering the four non-climate environmental standards:
E2 Pollution, E3 Water & Marine, E4 Biodiversity & Ecosystems, E5 Circular Economy. It is a
**disclosure-completeness and derived-metric engine** in the platform's post-remediation
"honest null" style — repeated in-code comments state that quantities are "reported figures —
never fabricated" and absent inputs are "surfaced as honest nulls". The only calculations are
genuine mass-balances and one composite, quoted from code:

```
E3:  consumption_ML          = withdrawal_total − discharge_total       (only if both reported)
E5:  directed_to_disposal_t  = waste_generated − diverted
     diversion_rate_pct      = diverted / waste_generated × 100
     circularity_score       = min(100, recycled_content×0.4 + diversion_rate×0.4
                                    + (20 if circular_design_policy else 0)×0.2)
All: completeness_pct        = provided_flags / total_flags × 100  (4–5 flags per topic)
     overall_completeness    = mean of the four topic completeness scores
```

### 7.2 Parameterisation

**Disclosure registers** (`GET /ref/e2-disclosures` … `/ref/e5-disclosures`): each topic carries
its full DR ladder (policies → actions → targets → metrics → anticipated financial effects), with
metric schemas: E2-4 pollutants by medium (air: NOx/SOx/PM2.5/NMVOC/NH₃/HAPs in t/yr; water:
priority substances/nitrates/phosphorus in kg/yr; soil: POPs and Pb/Cd/Hg heavy metals); E3-4
water volumes in megalitres plus WRI Aqueduct stress tiers (< 10% low … > 80% extremely high
withdrawal/availability); E4-5 land-use change ha, Natura 2000 proximity %, IUCN Red List species
counts, ENCORE ecosystem-service dependencies; E5-4/5 material inflows, recycled/renewable
content %, EU critical raw materials, waste disposition splits (landfill / incineration without
recovery / other, hazardous, radioactive).

**Sector materiality triggers** (`MATERIALITY_TRIGGERS`, `GET /ref/materiality-triggers`): a
20-row NACE-division default matrix, e.g. B06 oil & gas → all four material; D35 electricity →
E2 only; K64 financial services → none; L68 real estate → E4 only; unknown NACE → all false. The
returned basis string is explicit: "sector defaults per EFRAG sectoral guidance… Final materiality
determination requires entity-specific double materiality assessment" — the matrix itself is a
**platform-authored default**, not a published EFRAG table.

**Thresholded risk flags (E4, None-guarded)**: sensitive-areas > 20% → MEDIUM-HIGH; IUCN species
> 5 → HIGH; land-use change > 100 ha → MEDIUM; missing No-Net-Loss commitment → GAP.
**E3 stress tiering from `ops_in_stressed_area_pct`**: > 40 high, > 20 medium_high, else
low_medium (null if unreported). Circularity weights 40/40/20 are a platform composite.

### 7.3 Calculation walkthrough

`POST /assess` runs the full chain: NACE-based materiality → per-topic assessment **only for
material topics** (non-material topics return "Not material" with 100% completeness — they cannot
drag the average) → overall completeness (mean of four) → concatenated gap list. `POST /assess-e2`
and `POST /assess-e3` expose single-topic assessments. Each topic assessor:

1. Copies reported values (or `None`) into the standard metric schema.
2. Computes derived metrics only when all constituents are present.
3. Emits `data_status` ∈ {reported, insufficient_data} based on whether any core quantitative
   input exists.
4. Scores completeness as the fraction of provided input groups (E2: air/water/soil/SVHC/
   financial; E3: withdrawal/stressed/recycled/financial; E4: land use/sensitive areas/species/
   ecosystem services/financial; E5: inflows/recycled/waste/diverted/financial).
5. Appends DR-cited gaps (e.g. "E2-5: SVHC list not disclosed", "E4-6: Financial effects from
   biodiversity not quantified").

E4 additionally reports `kunming_montreal_alignment` = "Partial" if a No-Net-Loss commitment
exists, else "Not declared".

### 7.4 Worked example (E5, chemicals company C20)

Inputs: inflows 120,000 t, recycled content 22%, waste 8,000 t, diverted 5,600 t,
`circular_design_policy: true`, no financial effect quantified.

| Step | Computation | Result |
|---|---|---|
| Materiality (C20) | E2 ✓, E3 ✓, E4 ✗, E5 ✓ | E5 assessed |
| Directed to disposal | 8,000 − 5,600 | 2,400 t |
| Diversion rate | 5,600/8,000 × 100 | 70.0% |
| Circularity score | 22×0.4 + 70×0.4 + 20×0.2 | 8.8 + 28 + 4 = **40.8** |
| Completeness | 4 of 5 groups provided (financial missing) | 80.0% |
| Gaps | "E5-6: Financial effects… not quantified" | 1 gap |

Note the policy term contributes at most 4 points (20 × 0.2) — the composite is dominated by the
two quantitative drivers.

### 7.5 Data provenance & limitations

- **No PRNG or seeded data**: all quantities are caller-reported; the engine never imputes. This
  is documented in-code as a deliberate remediation of the platform's random-as-data findings.
- The NACE materiality matrix is a coarse 20-division default; ESRS 1 requires an entity-specific
  double-materiality process (impact + financial), which the engine explicitly defers to via its
  disclaimer note. Non-material topics scoring 100% completeness inflates
  `overall_completeness_pct` for narrow-footprint sectors (a K64 bank scores 100% with zero data).
- Completeness is presence-based (input group provided or not) — no unit validation, no
  plausibility checks, no assurance-readiness weighting.
- The E3 consumption mass balance (withdrawal − discharge) matches the ESRS E3 definition but can
  go negative if discharge exceeds withdrawal (e.g. harvested rainwater) — not guarded.
- The circularity score is a platform composite, not an ESRS metric (ESRS E5 prescribes the
  individual inflow/outflow metrics, not a blended score); similarly the E4 risk-flag thresholds
  (20% / 5 species / 100 ha) are unsourced heuristics.

### 7.6 Framework alignment

- **CSRD (Directive 2022/2464) + Commission Delegated Regulation (EU) 2023/2772:** the DR
  structures implemented (E2-1…E2-6, E3-1…E3-5, E4-1…E4-6, E5-1…E5-6) match the adopted ESRS Set 1
  disclosure requirements, including the policies/actions/targets/metrics/financial-effects
  pattern common to all topical standards.
- **ESRS 1 double materiality (§§17–44 cited in code):** materiality gates which topics must be
  assessed — implemented as sector defaults with an explicit entity-assessment caveat.
- **WRI Aqueduct:** baseline water-stress tiers (withdrawal/availability ratio bands 10/20/40/80%)
  are Aqueduct's published categorisation, used for the E3 stress tier.
- **Kunming-Montreal Global Biodiversity Framework (Target 15):** referenced for E4 corporate
  assessment/disclosure alignment; the engine proxies alignment via the No-Net-Loss commitment
  flag.
- **ENCORE (UNEP-WCMC/Natural Capital Finance Alliance):** the ecosystem-services dependency
  categories (provisioning/regulating/cultural) follow ENCORE's dependency-mapping taxonomy;
  ENCORE derives dependency materiality ratings per production process, which the entity is
  expected to supply.
- **EU Waste Framework Directive 2008/98/EC:** the waste-hierarchy disposition splits
  (diverted vs directed to disposal, landfill/incineration) mirror WFD reporting categories.
- **EU Taxonomy DNSH (Reg. 2020/852):** listed in regulatory refs as the cross-check for the same
  four environmental objectives.

## 9 · Future Evolution

### 9.1 Evolution A — Entity-specific double materiality and standard-native metrics (analytics ladder: rung 1 → 2)

**What.** The CSRD ESRS E2–E5 Environment Topics engine — disclosure-completeness and derived-metric
assessment for Pollution, Water, Biodiversity, Circular Economy, in the honest-null style (quantities
are "reported figures, never fabricated"; the only calculations are genuine mass-balances plus one
composite). §7.5 names the deepening targets: the **NACE materiality matrix is a coarse 20-division
default** — ESRS 1 requires an entity-specific double-materiality process, and non-material topics
scoring 100% completeness **inflates `overall_completeness_pct`** for narrow-footprint sectors (a K64
bank scores 100% with zero data); completeness is presence-based (no unit/plausibility checks); the E3
consumption mass-balance can go negative (unguarded); and the circularity score is a **platform
composite, not an ESRS metric**. Evolution A wires an entity-specific double-materiality determination
and reports standard-native metrics rather than the blended composite.

**How.** `assess_materiality` accepts an entity's impact + financial materiality inputs (from the
platform's double-materiality engine) rather than defaulting to the NACE matrix; `overall_completeness`
is computed only over material topics with data (so a bank's non-material 100%s don't inflate it), or
reported separately; the circularity composite is demoted to a supplementary indicator with the ESRS-
prescribed individual inflow/outflow metrics primary; the E3 consumption balance is guarded. Rung 2:
add unit validation and plausibility checks to the completeness scoring.

**Prerequisites (hard).** Fix the harness — §4.2 shows `POST /assess`, `/assess-e2`, `/assess-e3` all
**failed** (need input payloads to trace); the NACE matrix's "platform-authored default, not a published
EFRAG table" caveat must stay visible. **Acceptance:** the §7.4 E5 worked example (circularity 40.8,
80% completeness) reproduces; a K64 bank no longer scores 100% overall completeness on zero data; the
E3 consumption balance can't go spuriously negative; materiality reflects an entity double-materiality
input where supplied; the failing endpoints pass the harness.

### 9.2 Evolution B — ESRS E2–E5 disclosure copilot with tool-called assessment (LLM tier 2)

**What.** A copilot for sustainability reporting teams: "which of E2–E5 are material for our sector and
what's our disclosure completeness?" (`/assess` → materiality, per-topic completeness, gaps), "assess
our water disclosure" (`/assess-e3` → consumption mass-balance, Aqueduct stress tier), and "assess our
circular economy metrics" (`/assess-e5` → diversion rate, circularity, gaps with DR citations) —
narrating real derived metrics and honest nulls.

**How.** Tool schemas over the 6 POST + 5 GET operations; the disclosure registers (E2-1…E5-6 DR
ladders, metric schemas, Aqueduct tiers, materiality triggers) are exceptional RAG grounding for "what
does ESRS E4-5 require?" or "what's the Aqueduct high-stress threshold?" questions. The no-fabrication
validator checks every volume, rate and completeness % against tool output; the copilot must state that
materiality uses a sector default (not entity double-materiality) until Evolution A, and that
non-material-topic 100%s can inflate the headline. Composable with `csrd_reports` and `eba_pillar3` in
a disclosure-readiness desk.

**Prerequisites.** Evolution A's harness fixes and materiality/completeness improvements (so narrated
completeness is meaningful); Atlas + register corpus embedded (roadmap D3). **Acceptance:** every figure
cited traces to an engine tool call; the derived metrics match `/assess-e3`/`/assess-e5`; the copilot
flags sector-default materiality and the non-material-100% caveat; a gap is reported with its DR
citation.