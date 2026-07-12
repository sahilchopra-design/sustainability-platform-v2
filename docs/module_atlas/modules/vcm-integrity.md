# VCM Integrity Analyser
**Module ID:** `vcm-integrity` · **Route:** `/vcm-integrity` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Voluntary Carbon Market integrity assessment tool. Covers additionality, permanence, leakage, and MRV quality for carbon credits. IC-VCM Core Carbon Principles and VCMI Claims Code evaluation.

> **Business value:** Voluntary carbon credit quality varies enormously — high-integrity credits (CCP-eligible) support credible net-zero claims, while low-quality credits enable greenwashing. The IC-VCM and VCMI frameworks are restructuring the market. This module enables due diligence before purchasing and ensures only high-integrity credits support climate claims.

**How an analyst works this module:**
- Credit Universe shows 50+ credit types with integrity scores
- Additionality Test walks through 3 additionality criteria
- MRV Quality assesses measurement and verification robustness
- Leakage Analysis quantifies displacement of emissions
- CCP Eligibility shows which credits meet IC-VCM thresholds
- VCMI Claims maps credit quality to net-zero claim levels

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `Chk`, `Inp`, `KpiCard`, `OXFORD_DIMENSION_LABEL`, `PIE_COLORS`, `PROJECT_TYPES`, `PROJECT_TYPE_METHODOLOGY`, `PROJECT_TYPE_TO_ENGINE`, `PROJECT_TYPE_TO_PRICE_BENCH_KEY`, `REGISTRIES`, `Row`, `Section`, `Sel`, `TABS`, `TIER_COLORS`, `VCM_API`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PROJECT_TYPES` | 11 | `label` |
| `REGISTRIES` | 6 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `VCM_API` | ``${API}/api/v1/vcm-integrity`;` |
| `seededRandom` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `composite` | `Math.round(criteria.reduce((s, c) => s + c.score, 0) / criteria.length);` |
| `price` | `Math.round((priceBase[projectType] \|\| 10) * (0.8 + r(11) * 0.6));` |
| `currentScore` | `Math.round(r(20) * 40 + 45);` |
| `barData` | `principles.map(p => ({ name: p.dimension.split(':')[0], score: p.score }));` |
| `totalVolume` | `Math.round(r(75) * 200 + 500);` |
| `criteria` | `Object.values(r.icvcm_criteria_scores).map(c => ({` |
| `principles` | `Object.entries(OXFORD_DIMENSION_LABEL).map(([key, dimension]) => ({` |
| `seed0` | `hashStr(projectType + registry + vintage);` |
| `vcmi` | `demoVcmi; // demo gauge/thresholds chart retained only for the offline fallback view` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/vcm-integrity/assess` | `assess_credit` | api/v1/routes/vcm_integrity.py |
| POST | `/api/v1/vcm-integrity/registry-screen` | `registry_screen` | api/v1/routes/vcm_integrity.py |
| POST | `/api/v1/vcm-integrity/batch-assess` | `batch_assess` | api/v1/routes/vcm_integrity.py |
| GET | `/api/v1/vcm-integrity/ref/icvcm-criteria` | `ref_icvcm_criteria` | api/v1/routes/vcm_integrity.py |
| GET | `/api/v1/vcm-integrity/ref/vcmi-claims` | `ref_vcmi_claims` | api/v1/routes/vcm_integrity.py |
| GET | `/api/v1/vcm-integrity/ref/oxford-principles` | `ref_oxford_principles` | api/v1/routes/vcm_integrity.py |
| GET | `/api/v1/vcm-integrity/ref/price-benchmarks` | `ref_price_benchmarks` | api/v1/routes/vcm_integrity.py |
| GET | `/api/v1/vcm-integrity/ref/corsia-programmes` | `ref_corsia_programmes` | api/v1/routes/vcm_integrity.py |

### 2.3 Engine `vcm_integrity_engine` (services/vcm_integrity_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_compute_icvcm_criteria_scores` | registry, methodology, project_type, vintage_year, has_vvb_accreditation, monitoring_frequency_years, public_documentation, fpic_completed | Score all 10 ICVCM CCP criteria. |
| `_derive_ccp_composite` | criteria_scores | Aggregate per-criterion results into a CCP composite score and label. |
| `_score_oxford_principles` | reduction_pct_of_portfolio, removal_pct_of_portfolio, geological_removal_pct, price_usd_t, sbti_validated | Score the 4 Oxford Offsetting Principles. |
| `_derive_vcmi_claim` | sbti_near_term, sbti_long_term, residual_emissions_pct, ccp_label_credits, has_assurance | Determine highest achievable VCMI claim tier. |
| `_determine_quality_tier` | ccp_composite, permanence_score, additionality_score | Map scores to A/B/C/D quality tier. |
| `assess_vcm_integrity` | project_id, registry, methodology, project_type, vintage_year, volume_tco2e, price_usd_t, has_vvb_accreditation | Full VCM integrity assessment for a single carbon credit project. Parameters ---------- project_id : str Unique project identifier (e.g. VCS-1234). registry : str Registry key: verra_vcs / gold_standard / acr / car / art6_itmo. methodology : str Methodology code (e.g. VM0007, GS TPDDTEC). project_type : str Project type key (e.g. redd_plus, cookstoves, geological_storage). vintage_year : int Year  |
| `_generate_recommendations` | ccp_result, quality, vcmi, art6_status | Generate actionable recommendations based on assessment results. |
| `screen_registry_entry` | registry_name, serial_number, project_type, vintage_year, volume_tco2e, retirement_status, beneficiary | Screen a registry entry by serial number for basic integrity checks. Parameters ---------- registry_name : str Registry identifier (verra_vcs, gold_standard, acr, car, art6_itmo). serial_number : str Registry serial / batch number. project_type : str Project type category. vintage_year : int Vintage year. volume_tco2e : float Volume in tCO2e. retirement_status : str active / retired / cancelled /  |
| `get_vcm_benchmarks` |  | Return all VCM price benchmark data organised by storage class. Returns ------- dict Price benchmarks keyed by project type with storage class groupings. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `CORSIA`, `ICAO`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `PIE_COLORS`, `PROJECT_TYPES`, `REGISTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CCP Assessment Areas | — | IC-VCM | Governance, emissions impact, sustainable development |
| Additionality Types | — | Methodology | Regulatory, financial, common practice additionality tests |
| Permanence Buffer | — | VCS/VCS | Buffer pool % withheld against reversal events |
- **Carbon project data** → IC-VCM CCP assessment → **Integrity score per credit**
- **Credit registry data** → Vintage and type filtering → **Eligible credit portfolio**
- **Retired credits** → VCMI claims mapping → **Net-zero claim evidence**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/vcm-integrity/ref/corsia-programmes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'body', 'current_cycle', 'programmes', 'total_programmes', 'usage_note'], 'n_keys': 6}`

**GET /api/v1/vcm-integrity/ref/icvcm-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'body', 'total_criteria', 'pillars', 'criteria', 'ccp_label_rule'], 'n_keys': 6}`

**GET /api/v1/vcm-integrity/ref/oxford-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'published', 'body', 'publication', 'principles', 'composite_scoring'], 'n_keys': 6}`

**GET /api/v1/vcm-integrity/ref/price-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['benchmarks_by_project_type', 'benchmarks_by_storage_class', 'ccp_premium_note', 'currency', 'price_basis', 'vintage_note'], 'n_keys': 6}`

**GET /api/v1/vcm-integrity/ref/vcmi-claims** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'body', 'tier_hierarchy', 'claim_tiers', 'general_requirements', 'high_integrity_credit_definition'], 'n_keys': 6}`

**POST /api/v1/vcm-integrity/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/vcm-integrity/batch-assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/vcm-integrity/registry-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** IC-VCM Core Carbon Principles scoring
**Headline formula:** `IntegrityScore = Additionality(25) + Permanence(20) + MRV(20) + Leakage(15) + SDG(10) + Vintage(10)`

Additionality: would reductions occur without carbon finance? Permanence: duration of sequestration (forestry risk of reversal). Leakage: do reductions shift emissions elsewhere? MRV: measurement, reporting, verification quality.

**Standards:** ['IC-VCM Core Carbon Principles (2023)', 'VCMI Claims Code (2023)', 'Gold Standard', 'VCS/Verra']
**Reference documents:** IC-VCM Core Carbon Principles (2023); VCMI Claims Code of Practice (2023); Verra VCS Standard; Gold Standard for Global Goals; CORSIA Eligible Fuels

**Engine `vcm_integrity_engine` — extracted transformation lines:**
```python
vintage_penalty = max(0, (2015 - vintage_year) * 0.02) if vintage_year < 2015 else 0
score = base - vintage_penalty
score = base * (1 - (monitoring_frequency_years - 1) * 0.04)
score = base - vintage_penalty
score = min(1.0, score + 0.10)
composite = total_weighted / total_weight if total_weight > 0 else 0
p1 = min(1.0, p1 + 0.15)
p4 = (price_score + (0.20 if sbti_validated else 0)) / 1.0
composite = (p1 + p2 + p3 + p4) / 4
combined = (ccp_composite * 0.50) + (permanence_score * 0.25) + (additionality_score * 0.25)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** A genuine, sophisticated ICVCM/VCMI/Oxford scoring
> engine exists at `backend/services/vcm_integrity_engine.py` (1,431 lines) — but the frontend page
> **does not consume its output**. `runAssess()` fires `POST /api/v1/vcm-integrity/assess` and then
> discards the response entirely (`await axios.post(...)` with no `.then`, and an empty `catch`).
> Every number shown on screen — ICVCM criteria scores, VCMI tier, Oxford Principles, integrity
> flags, market prices — comes from a **separate, simpler, frontend-local `seededRandom()` generator**
> that approximates but does not match the backend's weighted/gated methodology. This deep dive
> documents both: §7.2–7.4 describe the real backend engine (the methodology that *should* drive the
> page); §7.5 documents the frontend's disconnected fallback that *actually* drives it today.

### 7.1 What the backend engine computes (not currently displayed)

`assess_vcm_integrity()` scores a single credit against three frameworks and derives a composite
quality tier:

```
ICVCM: weighted_contribution_c = score_c × weight_c          (10 criteria, weights sum to 1.0)
       ccp_composite = Σ weighted_contribution_c / Σ weight_c
       ccp_eligible  = all 10 criteria meet their threshold AND no blocking failure in {C4,C5,C6,C7}
Oxford: composite = (P1+P2+P3+P4) / 4                          (4 principles, each 0–1 banded score)
VCMI:  tier = platinum if CCP-labelled ∧ SBTi long-term ∧ residual≤10%
             gold if SBTi long-term ∧ residual≤20%
             silver if residual≤40%   else no_claim   (gated on SBTi near-term first)
Quality tier = 0.50·ccp_composite + 0.25·permanence_score + 0.25·additionality_score → A/B/C/D
```

### 7.2 ICVCM criteria scoring — parameterisation (backend)

| Criterion | Pillar | Weight | Threshold | Score driver |
|---|---|---|---|---|
| C1 Governance | Governance | 0.10 | 0.70 | `registry_base − vintage_penalty (− 0.10 if no public docs)` |
| C2 Transparency | Governance | 0.08 | 0.75 | same as C1 |
| C3 Independent V&V | Governance | 0.10 | 0.70 | `registry_base` (− 0.20 if no VVB accreditation) |
| C4 Additionality | Emissions Impact | 0.15 | 0.70 | `ADDITIONALITY_PROFILES[project_type]` (project-type lookup, not registry) |
| C5 Permanence | Emissions Impact | 0.12 | 0.65 | `PERMANENCE_PROFILES[project_type].permanence_score − vintage_penalty` |
| C6 Quantification | Emissions Impact | 0.12 | 0.70 | `registry_base × (1 − (monitoring_freq_yrs−1)×0.04)` |
| C7 No Double Counting | Emissions Impact | 0.10 | 0.80 | `0.90` if Art 6 ITMO else `registry_base − 0.05` |
| C8 Sustainable Development | Sust. Dev. | 0.08 | 0.60 | `registry_base − vintage_penalty` |
| C9 Biodiversity Safeguards | Sust. Dev. | 0.08 | 0.60 | same |
| C10 Human Rights/FPIC | Sust. Dev. | 0.07 | — | `registry_base` (± 0.10–0.20 for FPIC completion) |

`registry_base`: Gold Standard 0.88 > Art6 ITMO 0.85 > Verra VCS 0.82 > ACR 0.80 > CAR 0.78 > other 0.70.
`vintage_penalty = max(0, (2015 − vintage_year) × 0.02)` — pre-2015 vintages are penalised 2 points
per year, reflecting the market's discount on old-vintage credits under evolving methodology
standards. **CCP eligibility requires all 10 criteria pass their threshold AND none of the four
Emissions-Impact criteria (C4–C7) fail** — a hard gate consistent with ICVCM's framing that emissions
integrity is non-negotiable even if governance/SD criteria are marginal.

### 7.3 VCMI claim tiers & Oxford Principles (backend)

VCMI gating is **sequential, not additive**: no claim is possible at all without a validated SBTi
near-term target, regardless of how high other scores are — this mirrors VCMI's actual Claims Code
of Practice structure (foundational criteria must be met before claim-tier criteria apply). Oxford
Principles use banded scoring (`_band()`): e.g. P2 "Shift to long-lived storage" scores 1.0 only if
removals are ≥50% of the offset portfolio, 0.75 at ≥25%, 0.50 at ≥10%, 0.25 at ≥1%, else 0 — a
step-function, not a continuous scale, reflecting the principle's intent to reward step-changes in
portfolio composition rather than marginal moves.

### 7.4 Worked example (backend engine, Verra VCS REDD+ project, vintage 2023)

`registry_base = 0.82`, `vintage_penalty = 0` (2023 > 2015). C4 (Additionality) =
`ADDITIONALITY_PROFILES['redd_plus']` (a project-type lookup, typically ~0.65 for REDD+, reflecting
market skepticism about REDD+ baseline counterfactuals). If C4 = 0.65 < its 0.70 threshold, this is a
**blocking failure** — `ccp_label_eligible = False` regardless of how the other 9 criteria score,
because C4 is in the blocking set `{C4,C5,C6,C7}`. This correctly encodes the real-world debate that
REDD+ credits frequently fail ICVCM CCP labelling on additionality grounds even when governance is
strong (as reflected in ICVCM's actual 2023–24 category assessments, which excluded most legacy REDD+
methodologies pending revision).

### 7.5 What the frontend actually displays (disconnected local generator)

`getICVCMData(projectType, registry, vintage, seed0)` — where `seed0 = hashStr(projectType+registry+
vintage)` — draws **10 unweighted criteria scores** each `Math.round(r(n)·range + floor)` (e.g. C3
Additionality = `r(3)·35+50` → 50–85 range) and takes a simple mean for the composite. Eligibility
uses a different, hand-tuned gate: `composite≥65 AND all criteria≥50 AND C3≥60 AND C4≥55` (note: the
frontend's own C3/C4 are "Additionality"/"Permanence" — a different index mapping than the backend's
C4/C5). VCMI, Oxford, integrity-flag, and market-price data are independently seeded random draws
with no cross-reference to the ICVCM criteria computed on the same tab. Changing the "Registry"
dropdown changes `seed0` and therefore reshuffles every number on the page — including ones (like
Oxford Principles) that shouldn't logically depend on registry choice at all.

### 7.6 Data provenance & limitations

- The **backend engine's constants are grounded**: 10 ICVCM criteria titles/weights/thresholds and
  the assessment-element lists are transcribed from the actual ICVCM CCP Assessment Framework v2.0
  (2023); VCMI tier definitions and SBTi gating reflect the real VCMI Claims Code of Practice v1.1.
  `registry_base` values and `ADDITIONALITY_PROFILES`/`PERMANENCE_PROFILES` by project type are
  plausible expert-calibrated point estimates, not sourced from a specific published dataset.
- The **frontend's numbers are 100% synthetic** (`seededRandom`), calibrated only in the sense that
  score bands were chosen to look plausible; they are not currently reconcilable with the backend's
  weighted methodology, meaning two users assessing the same project via API vs UI would see
  different CCP eligibility outcomes.
- The `runAssess()` button gives a false impression of live computation — it calls the real backend,
  gets a real, more rigorous answer, and then throws it away, always re-rendering the local
  `seededRandom` values regardless of the API result.

**Framework alignment:** ICVCM Core Carbon Principles v2.0 (2023) — correctly weighted/gated in the
**backend only**. VCMI Claims Code of Practice v1.1 (2023) — SBTi-gated tiering correctly implemented
in the **backend only**. Oxford Offsetting Principles (2020, Smith School) — banded 4-principle
scoring in the **backend only**. CORSIA and Paris Agreement Article 6 corresponding-adjustment logic
are backend-only and never surfaced on the "Registry & Market" tab. **Recommended remediation:** wire
`runAssess()`'s response into component state and replace `getICVCMData`/`getVCMIData`/`getOxfordData`/
`getIntegrityData` with the values returned by `/assess` — the hard part (a correct, standards-based
model) is already built.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the real engine to the page and repair the POST routes (analytics ladder: rung 1 (UI) / 2 (engine) → 3)

**What.** The hard part is already built: a 1,431-line `vcm_integrity_engine` with
correctly weighted/gated ICVCM CCP scoring (10 criteria, blocking set {C4–C7}),
SBTi-gated VCMI tiers, and banded Oxford Principles — but §7's flag documents that
`runAssess()` posts to `/assess` and **discards the response**, re-rendering a
disconnected frontend `seededRandom()` generator whose criteria mapping doesn't even
match the backend's (frontend "C3 Additionality" vs backend C4). Two users assessing
the same project via API vs UI get different CCP eligibility. The lineage harness also
shows all three POSTs (`/assess`, `/batch-assess`, `/registry-screen`) currently
**failed** while the five `/ref/*` routes pass. Evolution A: fix the POST failures,
bind `runAssess()`'s response into component state, delete
`getICVCMData`/`getVCMIData`/`getOxfordData`/`getIntegrityData`, and then take the
engine to rung 3 by pinning worked cases in `bench_quant` (the §7.4 REDD+ blocking-
failure example is the natural first pin) and benchmarking `ADDITIONALITY_PROFILES`
against ICVCM's published 2023–24 category assessment decisions.

**How.** Diagnose POST failures (ref routes pass, so likely request-schema mismatch);
frontend refactor is removal, not construction; add `engine_version` to the response
for provenance.

**Prerequisites.** The documented false-impression defect (§7.6: the assess button
"calls the real backend... and throws it away") is the blocker and must be named in
the changelog. **Acceptance:** lineage harness passes all 8 routes; UI and API return
identical CCP eligibility for the same inputs; bench pin reproduces the REDD+ C4
blocking failure.

### 9.2 Evolution B — Credit due-diligence analyst with portfolio batch screening (LLM tier 2)

**What.** Pre-purchase due diligence is this module's stated job, and the engine's
outputs are decision-shaped: CCP eligibility with named blocking criteria, VCMI claim
ceiling, quality tier, price benchmarks. Evolution B is a tool-calling analyst:
"screen this book of 40 credits (registry, methodology, vintage, volume) and tell me
which support a VCMI Silver claim" runs `POST /batch-assess`, cross-references
`GET /ref/vcmi-claims` and `/ref/price-benchmarks`, and returns a ranked table with
per-credit rationale — e.g. "fails C4 Additionality (0.65 < 0.70 threshold), a
blocking criterion; consistent with ICVCM's exclusion of legacy REDD+ methodologies."
The engine's `_generate_recommendations` output becomes the copilot's raw material,
never its own invention.

**How.** Tier-2 stack: tool schemas from the 8 existing OpenAPI operations; grounding
corpus is this Atlas page (§7.2's criteria/weights table gives exact vocabulary) plus
the `/ref/*` payloads. The no-fabrication validator checks every score and threshold
against tool outputs; provenance caveats from §7.6 (registry_base and profiles are
expert-calibrated point estimates, not a published dataset) are surfaced when users
ask "where does 0.82 for Verra come from?".

**Prerequisites (hard).** Evolution A's POST repair and UI rewiring — an analyst
citing the engine while the page shows different seeded numbers would be incoherent;
RBAC on batch endpoints (portfolio books are client-confidential). **Acceptance:**
every criterion score in an answer matches the batch-assess payload; a credit failing
a blocking criterion is never described as CCP-eligible; asked to predict next year's
CCP decisions, the analyst refuses and distinguishes assessment from forecast.