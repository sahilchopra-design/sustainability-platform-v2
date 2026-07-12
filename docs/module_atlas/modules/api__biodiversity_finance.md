# Api::Biodiversity_Finance
**Module ID:** `api::biodiversity_finance` · **Route:** `/api/v1/biodiversity-finance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/biodiversity-finance/assess` | `assess` | api/v1/routes/biodiversity_finance.py |
| POST | `/api/v1/biodiversity-finance/msa-footprint` | `msa_footprint` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/tnfd-pillars` | `ref_tnfd_pillars` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/land-use-msa` | `ref_land_use_msa` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/sbtn-steps` | `ref_sbtn_steps` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/cbd-gbf-target15` | `ref_cbd_gbf_target15` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/encore-services` | `ref_encore_services` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/assessment-types` | `ref_assessment_types` | api/v1/routes/biodiversity_finance.py |
| GET | `/api/v1/biodiversity-finance/ref/pbaf-standard` | `ref_pbaf_standard` | api/v1/routes/biodiversity_finance.py |

### 2.3 Engine `biodiversity_finance_engine` (services/biodiversity_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `BiodiversityFinanceEngine.assess` | entity_id, entity_name, sector, assessment_type, operational_area_km2, land_use_breakdown, tnfd_pillar_maturity, tnfd_assessed_metrics |  |
| `BiodiversityFinanceEngine.calculate_msa_footprint` | entity_id, land_use_areas |  |
| `BiodiversityFinanceEngine.ref_tnfd_pillars` |  |  |
| `BiodiversityFinanceEngine.ref_land_use_msa` |  |  |
| `BiodiversityFinanceEngine.ref_sbtn_steps` |  |  |
| `BiodiversityFinanceEngine.ref_cbd_gbf_target15` |  |  |
| `BiodiversityFinanceEngine.ref_encore_services` |  |  |
| `get_engine` |  |  |

**Engine `biodiversity_finance_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `TNFD_PILLARS` | `{'governance': {'metrics': ['M1_board_oversight', 'M2_mgmt_responsibilities', 'M3_incentives'], 'weight': 0.25}, 'strategy': {'metrics': ['M4_dependency_assessment', 'M5_risk_identification', 'M6_scenario_analysis'], 'weight': 0.25}, 'risk_management': {'metrics': ['M7_risk_processes', 'M8_integrate` |
| `LAND_USE_MSA` | `{'primary_vegetation': {'msa_factor': 1.0, 'description': 'Pristine natural land'}, 'secondary_vegetation': {'msa_factor': 0.7, 'description': 'Regenerating natural land'}, 'extensive_agriculture': {'msa_factor': 0.5, 'description': 'Low-intensity farming'}, 'intensive_agriculture': {'msa_factor': 0` |
| `SBTN_STEPS` | `{1: {'name': 'Assess', 'description': 'Prioritise locations and value chain segments'}, 2: {'name': 'Interpret', 'description': 'Understand material dependencies and impacts'}, 3: {'name': 'Measure', 'description': 'Measure current state of nature'}, 4: {'name': 'Set', 'description': 'Set science-ba` |
| `CBD_GBF_TARGET15` | `{'15a': 'Assess biodiversity impacts across business operations', '15b': 'Reduce negative biodiversity impacts in operations', '15c': 'Increase positive biodiversity contributions', '15d': 'Disclose risks and dependencies', '15e': 'Provide information to consumers', '15f': 'Reduce subsidies harmful ` |
| `ENCORE_ECOSYSTEM_SERVICES` | `['biomass_provisioning', 'climate_regulation', 'flood_mitigation', 'water_supply', 'soil_quality', 'pollination', 'erosion_control', 'disease_regulation', 'soil_erosion_control', 'noise_mitigation']` |
| `ASSESSMENT_TYPES` | `['tnfd', 'msa', 'sbtn', 'cbd_gbf', 'combined']` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/biodiversity-finance/ref/assessment-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['types', 'descriptions'], 'n_keys': 2}`

**GET /api/v1/biodiversity-finance/ref/cbd-gbf-target15** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['15a', '15b', '15c', '15d', '15e', '15f'], 'n_keys': 6}`

**GET /api/v1/biodiversity-finance/ref/encore-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['services'], 'n_keys': 1}`

**GET /api/v1/biodiversity-finance/ref/land-use-msa** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['primary_vegetation', 'secondary_vegetation', 'extensive_agriculture', 'intensive_agriculture', 'plantation_forestry', 'urban_built_up', 'mining_quarrying', 'aquaculture'], 'n_keys': 8}`

**GET /api/v1/biodiversity-finance/ref/pbaf-standard** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standard', 'scope', 'methods', 'asset_classes', 'alignment_with'], 'n_keys': 5}`

**GET /api/v1/biodiversity-finance/ref/sbtn-steps** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [1, 2, 3, 4, 5], 'n_keys': 5}`

**GET /api/v1/biodiversity-finance/ref/tnfd-pillars** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['governance', 'strategy', 'risk_management', 'metrics_targets'], 'n_keys': 4}`

**POST /api/v1/biodiversity-finance/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'assessment'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `biodiversity_finance_engine` — extracted transformation lines:**
```python
result.tnfd_overall_maturity = int(sum(scored) / len(scored)) if scored else None
area_lt = area * frac / total_fraction
msa_loss = area_lt * (1 - msa_factor)
sbtn.overall_readiness_score = round(steps_done / 5 * 100, 1)
sbtn.next_priority_step = min(steps_done + 1, 5)
cbd.average_score = round(sum(sub_scores.values()) / len(sub_scores), 1)
msa_loss = area * (1 - factor)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Grounded in `backend/services/biodiversity_finance_engine.py` (E23; routes:
`api/v1/routes/biodiversity_finance.py`). A biodiversity-finance assessment engine spanning five
frameworks: TNFD v1.0 (14 metrics / 4 pillars), SBTN Steps 1–5, CBD GBF Target 15 (sub-elements
a–f), MSA.km² land-use footprint, and ENCORE/PBAF cross-framework linkage.

### 7.1 What the engine computes

The single `assess()` method assembles a `BiodiversityAssessment`. Its one *genuine ecological
computation* is the **Mean Species Abundance (MSA) footprint**:

```
area_lt   = total_area × frac_lt / Σ frac        (allocate area to each land-use type)
msa_loss  = area_lt × (1 − msa_factor_lt)         (biodiversity-integrity loss, km²·MSA)
total_footprint_km2 = Σ msa_loss
hotspot   = land-use types where msa_loss > 25% of total footprint
```

Everything else is *scoring / status assembly* from caller-supplied inputs:

| Output | Formula |
|---|---|
| TNFD pillar maturity | caller-supplied 1–5 per pillar, clamped; overall = `int(mean of supplied pillar scores)` |
| TNFD gaps | metrics in a pillar not in the caller's `assessed` list |
| SBTN readiness | `steps_complete / 5 × 100`; status ladder complete/partial/not_started |
| CBD GBF alignment | `avg(sub_element_scores)` → aligned ≥70 / progressing ≥40 / else early-stage |
| Nature-positive score | `Σ` of available components: `TNFD/5×40 + SBTN_readiness×0.30 + CBD_avg×0.30` |
| PBAF 2023 status | derived from SBTN: `partial` if steps < 3 else `compliant` |

### 7.2 Parameterisation

**Land-use MSA factors** (fraction of pristine species abundance retained) — the core reference
table, consistent with GLOBIO/MSA convention:

| Land use | MSA factor | Loss weight (1 − factor) |
|---|---|---|
| Primary vegetation | 1.00 | 0.00 |
| Secondary vegetation | 0.70 | 0.30 |
| Extensive agriculture | 0.50 | 0.50 |
| Aquaculture | 0.40 | 0.60 |
| Intensive agriculture | 0.30 | 0.70 |
| Plantation forestry | 0.20 | 0.80 |
| Mining / quarrying | 0.10 | 0.90 |
| Urban built-up | 0.05 | 0.95 |

Unmapped land use defaults to msa_factor 0.5. **TNFD pillars**: governance / strategy / risk
management / metrics & targets, each weighted 0.25, with the 14 named metrics (M1–M14)
distributed 3/3/3/5. **SBTN steps**: 1 Assess · 2 Interpret · 3 Measure · 4 Set · 5 Act. **CBD
GBF Target 15 sub-elements** 15a–15f (assess / reduce / increase-positive / disclose / consumer
information / harmful-subsidy reduction). **Nature-positive weights** 40/30/30 across TNFD/SBTN/
CBD are a platform composite (no external standard prescribes this blend).

### 7.3 Calculation walkthrough

The engine is built around an **honest-null discipline** (extensive inline comments): every input
that was "previously fabricated via `random.Random(hash(entity_id))`" is now either caller-supplied
or reported as `None` / `insufficient_data` with a warning. So:

- TNFD: absent pillar maturity → `tnfd_overall_maturity = None` + warning; a pillar with no
  `assessed` list has all its metrics counted as gaps.
- MSA: computed only when both `operational_area_km2 > 0` and `land_use_breakdown` are supplied;
  otherwise a warning and empty footprint.
- SBTN: `steps_complete` (clamped 0–5) drives the readiness % and the complete/partial/not_started
  ladder; `next_priority_step = min(steps+1, 5)`.
- CBD: needs `cbd_sub_element_scores`; otherwise `overall_alignment = "insufficient_data"`.
- Nature-positive score sums *only the components that exist* — no zero-fill — so it is `None`
  if no framework input is present.
- Priority actions are all null-guarded (`x is not None and x < threshold`) so honest nulls can
  never raise.

### 7.4 Worked example (MSA footprint)

A caller supplies `operational_area_km2 = 1,000` and
`land_use_breakdown = {intensive_agriculture: 0.6, primary_vegetation: 0.3, mining_quarrying: 0.1}`
(fractions sum to 1.0):

| Land use | Area (km²) | 1 − MSA factor | MSA loss (km²·MSA) |
|---|---|---|---|
| Intensive agriculture | 600 | 0.70 | 420.0 |
| Primary vegetation | 300 | 0.00 | 0.0 |
| Mining / quarrying | 100 | 0.90 | 90.0 |
| **Total footprint** | | | **510.0** |

Hotspots (loss > 25% × 510 = 127.5): only intensive agriculture (420 > 127.5). Because the total
footprint 510 > 500, the priority action "MSA footprint >500 km² — initiate site-level
biodiversity management plans" is emitted. If the same entity supplies `sbtn_steps_complete = 2`
and `cbd_sub_element_scores` averaging 55, and TNFD maturity averages 3, then
`nature_positive = 3/5×40 + 40×0.30 + 55×0.30 = 24 + 12 + 16.5 = 52.5`.

Note `calculate_msa_footprint()` (a second entry point taking absolute areas) uses a **20%**
hotspot threshold rather than 25% — a minor inconsistency between the two code paths.

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data in the current code** — the module was explicitly de-randomised;
  inline comments repeatedly note that TNFD maturity, SBTN steps, CBD scores, sensitive-ecosystem
  %, and finance metrics "were previously fabricated via `random.Random(hash(entity_id))`" and
  are now honest nulls. This is a model example of the platform's fabrication remediation.
- MSA factors are static GLOBIO-style constants; the engine does *not* apply pressure-specific
  MSA (fragmentation, N-deposition, climate, encroachment) — only land-use MSA, a first-order
  footprint. It also does not weight by ecosystem sensitivity/irreplaceability.
- TNFD maturity is a self-declared 1–5 input, not an evidence-based assessment; the engine
  scores completeness/gaps, not disclosure quality.
- The 40/30/30 nature-positive blend and the ≥70/≥40 CBD alignment cut-points are platform
  conventions, not from the respective standards.
- PBAF status is inferred purely from SBTN step count — a proxy, since PBAF conformance actually
  concerns impact/dependency accounting methodology, not SBTN progress.

### 7.6 Framework alignment

- **TNFD v1.0** — the four recommended-disclosure pillars (Governance, Strategy, Risk & Impact
  Management, Metrics & Targets) and the 14 core global disclosure metrics are catalogued; the
  engine scores self-declared pillar maturity and metric coverage rather than running the TNFD
  LEAP (Locate-Evaluate-Assess-Prepare) process itself.
- **SBTN (Science Based Targets for Nature)** — the five-step Assess→Interpret→Measure→Set→Act
  methodology; readiness is linear in completed steps.
- **CBD Kunming-Montreal GBF Target 15** — sub-elements a–f on business assessment, impact
  reduction, disclosure, consumer information and harmful-subsidy reform; alignment tiered from
  a 0–100 self-score average.
- **GLOBIO / MSA** — MSA (Mean Species Abundance) measures intactness on a 0–1 scale vs pristine
  reference; the land-use MSA factors implement the land-use pressure component of GLOBIO,
  yielding a km²·MSA "biodiversity footprint".
- **ENCORE** — the ecosystem-services list (pollination, water supply, flood mitigation…)
  mirrors ENCORE's natural-capital dependency taxonomy; carried as a cross-framework reference.
- **PBAF Standard (2023)** — the Partnership for Biodiversity Accounting Financials disclosure
  standard for financed impacts/dependencies; here only a derived conformance flag.
- **Cross-framework** — ESRS E4, EU Taxonomy biodiversity DNSH, and GRI 304 fields are passed
  through from caller inputs as honest nulls when absent.

## 9 · Future Evolution

### 9.1 Evolution A — Pressure-specific MSA and evidence-based TNFD scoring (analytics ladder: rung 1 → 3)

**What.** A clean tier-A domain (E23) spanning five frameworks (TNFD v1.0, SBTN, CBD GBF Target 15,
MSA footprint, ENCORE/PBAF), and a model example of the platform's fabrication remediation — §7.5
records that TNFD maturity, SBTN steps, CBD scores and finance metrics "were previously fabricated
via `random.Random(hash(entity_id))`" and are now honest nulls. Its genuine ecological computation
is the land-use MSA footprint; §7.5 names the deepening opportunities: MSA is **land-use-only** (no
pressure-specific MSA for fragmentation, N-deposition, climate, encroachment) and unweighted by
ecosystem sensitivity/irreplaceability; TNFD maturity is a self-declared 1–5 input scoring
completeness not disclosure quality; and there is a minor inconsistency (the two MSA code paths use
25% vs 20% hotspot thresholds). Evolution A adds the pressure-specific MSA components GLOBIO defines
and an irreplaceability weighting, lifting the footprint from first-order to a fuller GLOBIO model.

**How.** `calculate_msa_footprint` gains pressure inputs (fragmentation, N-deposition, infrastructure
encroachment) combined multiplicatively per GLOBIO, plus an ecosystem-sensitivity weight; the 25/20%
hotspot threshold is unified. Rung 3: calibrate MSA factors against GLOBIO 4 regional baselines and
validate the nature-positive 40/30/30 blend (currently a platform composite) against emerging TNFD/
SBTN scoring guidance.

**Prerequisites.** The honest-null discipline is a strength to preserve — new pressure inputs must
default to null, not fabricated values; the 40/30/30 nature-positive weights and ≥70/≥40 CBD
cut-points are platform conventions to keep documented as such. **Acceptance:** the §7.4 MSA worked
example (510 km²·MSA footprint) reproduces under land-use-only inputs; adding fragmentation pressure
raises the footprint; both MSA code paths use the same hotspot threshold.

### 9.2 Evolution B — Nature-risk analyst with tool-called TNFD/MSA assessment (LLM tier 2)

**What.** A tool-calling analyst for nature-finance teams: "assess our TNFD maturity and gaps"
(calls `/assess`), "what's our MSA biodiversity footprint by land use?" (`/msa-footprint`), and
"what does CBD GBF Target 15 require?" (reads the reference endpoints) — narrating the engine's real
scores and, crucially, its honest nulls (an absent pillar maturity returns `insufficient_data`, not
a fabricated score). The copilot walks the TNFD LEAP structure and SBTN five steps the reference
data enumerates.

**How.** Tool schemas from the 2 POST + 8 GET operations (all passing the harness); the seven
reference endpoints (TNFD pillars, land-use MSA, SBTN steps, CBD Target 15, ENCORE services,
assessment types, PBAF standard) are ideal RAG grounding for "what's the MSA factor for intensive
agriculture?" questions — a tier-1 explainer over a tier-2 operator. The no-fabrication validator
checks every score and km²·MSA figure against tool output; because the engine reports
`insufficient_data` honestly, the copilot must request missing inputs rather than assume them.

**Prerequisites.** Atlas + reference corpus embedded (roadmap D3); the copilot's grounding must
carry the honest-null discipline so it never presents a null as a computed zero. **Acceptance:**
every figure cited traces to an engine tool call; a TNFD query with no pillar maturity returns the
engine's honest-null with the copilot requesting the input; the MSA footprint cited matches
`/msa-footprint` exactly.