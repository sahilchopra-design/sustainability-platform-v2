# Api::Gar
**Module ID:** `api::gar` · **Route:** `/api/v1/gar` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/gar/calculate` | `calculate_gar` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/objectives` | `get_objectives` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/nace-mapping` | `get_nace_mapping` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/excluded-types` | `get_excluded_types` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/kpi-types` | `get_kpi_types` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/alignment-classifications` | `get_alignment_classifications` | api/v1/routes/gar.py |
| POST | `/api/v1/gar/counterparty/score` | `score_counterparty` | api/v1/routes/gar.py |
| POST | `/api/v1/gar/counterparty/batch` | `score_counterparty_batch` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/counterparty/sector-risk` | `get_sector_risk` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/counterparty/rating-scale` | `get_rating_scale` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/counterparty/weights` | `get_scoring_weights` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/auto-calculate/{entity_id}` | `auto_calculate_gar` | api/v1/routes/gar.py |
| GET | `/api/v1/gar/auto-calculate/by-lei/{lei}` | `auto_calculate_gar_by_lei` | api/v1/routes/gar.py |

### 2.3 Engine `counterparty_climate_scorer` (services/counterparty_climate_scorer.py)
| Function | Args | Purpose |
|---|---|---|
| `CounterpartyClimateScorer.score` | inp | Calculate composite climate score for a single counterparty. Args: inp: CounterpartyInput with all available data. Returns: ClimateScoreResult with score, rating, and breakdown. |
| `CounterpartyClimateScorer.score_batch` | inputs | Score multiple counterparties. |
| `CounterpartyClimateScorer._score_transition_risk` | inp, notes | Score transition risk. All sub-scores are 0-100 (100 = best). Sub-components: carbon_intensity_rank (30%): direct input 0-100 sector_risk (25%): mapped from low/medium/high/very_high policy_exposure (25%): direct input 0-100 technology_readiness (20%): direct input 0-100 |
| `CounterpartyClimateScorer._score_physical_risk` | inp, notes | Score physical risk. Sub-components (equal weight 25% each): flood_risk, heat_stress, water_stress, supply_chain_exposure All 0-100 where 100 = lowest risk. |
| `CounterpartyClimateScorer._score_alignment` | inp, notes | Score climate alignment. Sub-components: sbti_committed: bool -> +20 points (out of 100) taxonomy_aligned_pct: 0-100 mapped to 0-40 transition_plan_quality: 1-5 mapped to 0-40 |
| `CounterpartyClimateScorer._score_data_quality` | inp, notes | Score data quality. Sub-components: disclosure_level: none=0, partial=50, full=100 data_recency_years: 0->100, 5->0 (linear inverse) third_party_verified: bool -> +30 Max possible = 100+100+30 = 230, but we cap at 100 after normalize. Weighted: disclosure 40%, recency 30%, verified 30%. |
| `CounterpartyClimateScorer._score_to_rating` | score | Map composite score (0-100, higher=better) to rating and label. Bug fix: the previous implementation matched bands via `band["min"] <= score <= band["max"]` against integer-valued min/max (e.g. 80-89 and 90-100). Composite scores are floats rounded to 1 decimal place (see `score()`), so any fractional value strictly between an upper band's `max` and the next band's `min` (e.g. 89.5, 79.3) matched  |
| `CounterpartyClimateScorer.get_rating_scale` |  | Return the full rating scale. |
| `CounterpartyClimateScorer.get_sector_risk_levels` |  | Return sector-level transition risk classifications. |
| `CounterpartyClimateScorer.get_default_weights` |  | Return default scoring weights. |

### 2.3 Engine `gar_calculator` (services/gar_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `get_eligible_objectives` | nace_code | Return list of eligible EU Taxonomy environmental objectives for a NACE code. Args: nace_code: NACE Rev. 2 activity code (e.g. "D35.11") Returns: List of objective codes (e.g. ["CLIMATE_MITIGATION", "CLIMATE_ADAPTATION"]). Empty list if the NACE code is not mapped. |
| `GARCalculator.calculate` | exposures, flow_exposures | Calculate Green Asset Ratio from a set of exposures. Args: exposures: All on-balance-sheet exposures (stock). flow_exposures: New originations in period (flow), optional. Returns: GARResult with full breakdown. |
| `GARCalculator._resolve_classification` | exp | Resolve the taxonomy classification for an exposure. If a classification is explicitly provided, use it (including an explicit NOT_ASSESSED). Otherwise, auto-assess household exposures (mortgages, auto loans, renovation loans) using EPC / EV / renovation flags. When none of those signals are available -- no classification, no NACE mapping, no household auto-assess data -- the exposure is genuinely |
| `GARCalculator.get_taxonomy_objectives` |  | Return the 6 EU Taxonomy environmental objectives. |
| `GARCalculator.get_excluded_asset_types` |  | Return asset types excluded from the GAR denominator. |
| `GARCalculator.get_nace_taxonomy_map` |  | Return NACE code to taxonomy objective mapping. |
| `GARCalculator.get_kpi_types` |  | Return CRR2 ITS KPI types. |
| `GARCalculator.get_alignment_classifications` |  | Return possible alignment classification values. |

### 2.3 Engine `gar_db_service` (services/gar_db_service.py)
| Function | Args | Purpose |
|---|---|---|
| `GARDBService.calculate_gar_for_entity` | entity_id, reporting_year, persist | Auto-calculate GAR for an FI entity from DB data. Args: entity_id: UUID of fi_entities row. reporting_year: Reporting year to filter assessments. persist: If True, write results to fi_eu_taxonomy_kpis. Returns: Dict with GAR results + metadata. |
| `GARDBService.calculate_gar_by_lei` | lei, reporting_year, persist | Auto-calculate GAR by LEI (resolves to fi_entities + regulatory_entities). |
| `GARDBService._get_entity` | conn, entity_id |  |
| `GARDBService._get_taxonomy_data` | conn, entity_name, year | Get taxonomy assessment + activities for entity (matched by name). |
| `GARDBService._get_loan_book` | conn, entity_id, year | Get loan book sector breakdown. |
| `GARDBService._build_exposures` | entity, assessment, activities, loan_book | Build GARExposure list from DB data. Strategy: 1. If we have eu_taxonomy_activities, each activity becomes an exposure with its own alignment flags and amounts. 2. If we have fi_loan_books sector_breakdown, each sector becomes an exposure. Alignment is inferred from taxonomy assessment KPIs. 3. For denormalized loan book columns (real_estate_commercial_ead, etc.), create exposures from those. |
| `GARDBService._activity_to_exposure` | act, entity_name, assessment | Convert a single eu_taxonomy_activities row to GARExposure. |
| `GARDBService._sector_to_exposure` | sector_row, entity_name, assessment | Convert a loan book sector_breakdown JSONB entry to GARExposure. |
| `GARDBService._denormalized_loan_book_to_exposures` | loan_book, entity_name, assessment | Build exposures from denormalized fi_loan_books columns. |
| `GARDBService._persist_result` | conn, entity_id, reporting_year, result, assessment | Write GAR results to fi_eu_taxonomy_kpis. |
| `GARDBService._serialise` | result, entity, reporting_year, activity_count | Serialise GARResult + metadata for API response. |

**Engine `gar_db_service` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_OBJ_MAP` | `{1: 'CLIMATE_MITIGATION', 2: 'CLIMATE_ADAPTATION', 3: 'WATER', 4: 'CIRCULAR_ECONOMY', 5: 'POLLUTION', 6: 'BIODIVERSITY'}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `DB` *(shared)*, `GAR`, `__future__` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/gar/alignment-classifications** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['classifications'], 'n_keys': 1}`

**GET /api/v1/gar/auto-calculate/by-lei/{lei}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/gar/auto-calculate/{entity_id}** — status `passed`, provenance ['db-empty'], source tables: `fi_entities`
Output: `{'type': 'object', 'keys': ['error'], 'n_keys': 1}`

**GET /api/v1/gar/counterparty/rating-scale** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['rating_scale'], 'n_keys': 1}`

**GET /api/v1/gar/counterparty/sector-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_risk_levels'], 'n_keys': 1}`

**GET /api/v1/gar/counterparty/weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['weights'], 'n_keys': 1}`

**GET /api/v1/gar/excluded-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['excluded_types'], 'n_keys': 1}`

**GET /api/v1/gar/kpi-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['kpi_types'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `counterparty_climate_scorer` — extracted transformation lines:**
```python
weighted = round(raw * w, 2)
weighted = round(raw * w, 2)
tax_pts = float(np.clip(inp.taxonomy_aligned_pct, 0, 100)) / 100.0 * 40.0
tp_pts = (tp - 1) / 4.0 * 40.0  # 1->0, 2->10, 3->20, 4->30, 5->40
weighted = round(raw * w, 2)
weighted = round(raw * w, 2)
```

**Engine `gar_calculator` — extracted transformation lines:**
```python
gar_ratio = aligned_assets / covered_assets if covered_assets > 0 else 0.0
gar_eligible_ratio = eligible_assets / covered_assets if covered_assets > 0 else 0.0
gar_flow = flow_aligned / flow_covered if flow_covered > 0 else 0.0
ne = max(covered_assets - e, 0.0)
aligned_pct=round(a / covered_assets * 100, 2) if covered_assets > 0 else 0.0,
eligible_pct=round(e / covered_assets * 100, 2) if covered_assets > 0 else 0.0,
gar_ratio=round(a / covered_assets, 6) if covered_assets > 0 else 0.0,
alignment_ratio=round(a / total, 4) if total > 0 else 0.0,
```

**Engine `gar_db_service` — extracted transformation lines:**
```python
ead = float(val) * 1_000_000  # MEUR → EUR
turnover_aligned=ead * aligned_pct if has_eligible_nace else 0,
turnover_eligible=ead * aligned_pct * 1.5 if has_eligible_nace else 0,
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded in
`backend/services/gar_calculator.py`, `backend/services/counterparty_climate_scorer.py`,
`backend/services/gar_db_service.py`, and `backend/api/v1/routes/gar.py`. This is the platform's
**CRR Art. 449a Pillar-3 GAR** engine; a sibling Art. 8 Delegated Act engine lives in the
`eu_taxonomy_gar` domain.)*

### 7.1 What the domain computes

Three cooperating engines:

**1. `GARCalculator` — Green Asset Ratio per CRR Art. 449a / EBA ITS 2022/01:**

```
GAR_stock    = aligned_assets / covered_assets
GAR_eligible = eligible_assets / covered_assets
GAR_flow     = aligned new originations / covered new originations
covered_assets = total assets − exclusions {SOVEREIGN, CENTRAL_BANK, INTERBANK, HEDGING_DERIVATIVE}
```

with breakdowns by the 6 Taxonomy objectives (Arts 10–15), by CRR2 ITS KPI type
(Turnover/CapEx/OpEx — summed from per-exposure aligned/eligible amounts over the shared
covered-asset denominator), and by asset type.

**2. `CounterpartyClimateScorer` — composite climate score, 0–100 higher = better:**

```
composite = 0.40 × TransitionRisk + 0.30 × PhysicalRisk + 0.20 × Alignment + 0.10 × DataQuality
```

mapped to letters A+ (90–100) … D− (0–29). Custom weights allowed but must sum to 1 ± 0.01.

**3. `GARDBService` — auto-calculation** (`GET /auto-calculate/{entity_id}`, `/by-lei/{lei}`):
builds `GARExposure` records from stored `eu_taxonomy_activities` (per-activity SC/DNSH/MSS
flags) and loan-book tables, then runs `GARCalculator` and persists the result.

Reference endpoints expose the alignment classifications, excluded asset types, KPI types,
scorer rating scale, sector risk map, and default weights.

### 7.2 Parameterisation

**Classification resolution** (`_resolve_classification`, priority order): explicit
classification → household auto-assessment → NACE eligibility → NOT_ELIGIBLE.

| Auto-assessment rule | Result | Basis |
|---|---|---|
| Mortgage EPC A | TAXONOMY_ALIGNED | Taxonomy TSC 7.7 proxy (top-15% / NZEB evidence) |
| Mortgage EPC B–C | TAXONOMY_ELIGIBLE | eligible activity, alignment unproven |
| Mortgage EPC D–G | NOT_ELIGIBLE | fails screening proxy |
| Auto loan `is_ev_loan` | TAXONOMY_ALIGNED | TSC 6.5 zero-tailpipe proxy |
| Renovation loan flag | TAXONOMY_ALIGNED | TSC 7.2 proxy (no 30% PED test computed) |
| NACE in 32-code map | TAXONOMY_ELIGIBLE | Climate DA 2021/2139 + Env DA 2023/2486 activity list |

The NACE→objective map covers 32 activities (e.g. `D35.11` power generation →
{mitigation, adaptation}; `C23.51` cement → mitigation; `E38.32` materials recovery →
circular economy).

**Scorer rubric:**

| Component (weight) | Sub-scores (sub-weights) | Missing-data defaults |
|---|---|---|
| Transition 40% | carbon-intensity rank 30%, sector risk 25%, policy exposure 25%, tech readiness 20% | sector lookup (low 80 / medium 55 / high 30 / very_high 10); tech 50 |
| Physical 30% | flood, heat, water, supply-chain — 25% each (100 = lowest risk) | 60 each |
| Alignment 20% | SBTi +20 · taxonomy% → 0–40 · transition-plan 1–5 → 0–40 | 0 |
| Data quality 10% | disclosure (none 0/partial 50/full 100)×0.40 + recency (0–5 yr inverse)×0.30 + verified +30 flat | recency 20 ("assume stale") |

22 sectors carry a transition-risk level (Oil & Gas / Coal = very_high; Power, Steel, Cement,
Airlines, Shipping = high; Tech/Health/Financials = low). Weights and sub-weights are platform
design values inspired by EBA GL/2022/16 and the ECB Guide — not regulator-prescribed numbers.

### 7.3 Calculation walkthrough

`GARCalculator.calculate` iterates exposures once: excluded types accrue to `excluded_assets`
only; covered exposures are classified, ALIGNED contributes its full carrying amount to both
numerator and eligible total; ELIGIBLE only to the eligible total; objective totals accrue by
`primary_objective` (secondary objectives also receive the aligned amount — so objective rows
can *double-count* across objectives by design; the headline GAR does not). Methodology notes
record every aggregate. The DB service maps SC+DNSH+MSS flags → ALIGNED, eligible-only →
ELIGIBLE, and for denormalised sector books derives `turnover_eligible = EAD × aligned_pct × 1.5`
(a synthetic 1.5× eligible-to-aligned assumption).

### 7.4 Worked example — 4-exposure book

| Exposure | Type | €M | Classification path |
|---|---|---|---|
| Wind-farm loan | NFC_LOAN | 200 | explicit ALIGNED (obj: mitigation) |
| Mortgage EPC B | HOUSEHOLD_MORTGAGE | 100 | auto → ELIGIBLE |
| Cement loan, NACE C23.51 | NFC_LOAN | 150 | NACE map → ELIGIBLE |
| Government bond | SOVEREIGN | 300 | **excluded** |

- Total assets 750; excluded 300; **covered = 450**.
- Aligned = 200 → **GAR = 200/450 = 44.44%**; eligible = 200+100+150 = 450 → eligible ratio 100%.
- Mitigation objective row: aligned 200 (44.44% of covered).
- Scorer cross-check: an Oil & Gas counterparty with carbon rank 25, policy 30, tech 40,
  physical inputs {40,50,60,45}, SBTi ✓, taxonomy 10%, plan quality 2, partial disclosure,
  1-yr-old verified data:
  TR = 25×0.30+10×0.25+30×0.25+40×0.20 = 25.5 → 10.20 weighted;
  PR = (40+50+60+45)/4 = 48.75 ≈ 48.8 → 14.63;
  AL = 20+4+10 = 34 → 6.80; DQ = 50×0.4+80×0.3+30 = 74 → 7.40;
  **composite = 39.0 → rating "D+" (Poor climate posture)**.

### 7.5 Stock vs flow, and the two GAR engines

`GAR_flow` repeats the stock logic over `flow_exposures` (new originations) — the EBA templates
require both. Platform note: this domain (`/api/v1/gar`) implements the **CRR Art. 449a
Pillar-3** view with the correct broad denominator (only sovereign/central-bank/interbank/hedging
derivatives excluded), while `eu_taxonomy_gar` implements the Art. 8 Delegated Act view with a
narrower eligible-classes-only denominator; reconciling the two is a known interpretation gap.

### 7.6 Data provenance & limitations

- No synthetic PRNG. Inputs are caller-supplied exposures or DB rows
  (`eu_taxonomy_activities`, loan-book tables); the NACE map, EPC map, sector-risk levels,
  and all scorer weights are hardcoded platform calibrations.
- Alignment is binary at exposure level (full carrying amount in or out); the real EBA templates
  allow *proportional* alignment (e.g. specialised-lending percentage splits) — the DB service's
  sector path partially does this via `EAD × aligned_pct` but only for the Turnover KPI column.
- `not_assessed_count` is initialised and reported but **never incremented** — `assessed_pct`
  always returns 1.0; a data-quality metric in name only.
- The 1.5× eligible multiplier in `_denormalized_loan_book_to_exposures` is an uncited synthetic
  assumption. EPC-B/C eligibility and EV/renovation auto-alignment skip DNSH/MSS evidence.
- Scorer sub-weights, defaults (60 physical, 50 tech, 20 recency), and the A+…D− band edges are
  platform choices; missing-band gap: scores in (89,90), (79,80)… fall through to exact integer
  bands but pass because scores are rounded to 0.1 and bands use ≤ comparisons — scores like 89.5
  match **no** band and fall through to "D-". (Edge case worth a fix.)

### 7.7 Framework alignment

- **CRR Art. 449a + EBA ITS/2022/01 (Pillar 3 ESG)** — GAR stock/flow with the prescribed
  denominator exclusions and Annex XI Turnover/CapEx/OpEx KPI dimensions.
- **EU Taxonomy Regulation 2020/852** — alignment = substantial contribution + DNSH + minimum
  safeguards; the DB service consumes exactly those three per-activity flags; objective labels
  cite Arts 10–15.
- **Climate DA 2021/2139 / Environmental DA 2023/2486** — the NACE eligibility map transcribes a
  32-activity subset of the delegated acts' activity lists.
- **EBA GL/2022/16, ECB Guide (Nov 2020), BCBS Principles (2022)** — cited as the design basis
  for the composite counterparty score; these require institutions to embed climate factors in
  counterparty assessment but do not prescribe the 40/30/20/10 weights — those are this module's
  calibration.
- **SBTi** — a validated/committed science-based target earns a flat +20 alignment bonus;
  in SBTi's own framework, commitment means a public pledge with target validation to follow
  within 24 months.

## 9 · Future Evolution

### 9.1 Evolution A — Honest auto-calculation from real taxonomy evidence (analytics ladder: rung 2 → 3)

**What.** The `GARCalculator` core (CRR Art. 449a stock/flow/eligible ratios with
objective and KPI-type breakdowns) is sound deterministic work, but the §5 extract
exposes the weak link in `gar_db_service`: auto-calculation fabricates alignment via
`turnover_aligned = ead × aligned_pct if has_eligible_nace` and, worse,
`turnover_eligible = ead × aligned_pct × 1.5` — a synthetic 1.5× multiplier with no
regulatory basis. Evolution A makes `GET /auto-calculate/{entity_id}` derive alignment
from stored per-activity SC/DNSH/MSS flags instead of NACE-keyed heuristics.

**How.** (1) Rework `GARDBService` to aggregate `eu_taxonomy_activities` rows
per counterparty (the table already carries substantial-contribution and DNSH flags)
into eligible/aligned amounts, dropping the 1.5× shortcut; report `evidence_tier`
(activity-level vs NACE-inferred) per exposure, mirroring the GLEIF resolution-tier
pattern. (2) Reconcile against the sibling `eu_taxonomy_gar` Art. 8 engine so the two
GAR figures are explainably different (denominator scope), not accidentally different.
(3) Pin a reference bank book in bench_quant covering all four exclusion classes
(SOVEREIGN, CENTRAL_BANK, INTERBANK, HEDGING_DERIVATIVE).

**Prerequisites.** `eu_taxonomy_activities` populated for the demo counterparty set
(D0 seeding); a documented mapping note for NACE fallback cases. **Acceptance:** no
response contains the 1.5× eligible multiplier; every auto-calculated exposure carries
`evidence_tier`; bench pin reproduces GAR_stock to 6 decimals.

### 9.2 Evolution B — Counterparty screening analyst across score and ratio (LLM tier 2)

**What.** A tool-calling analyst on the GAR page that handles both engines
conversationally: "score this counterparty and tell me which component drags it below
BBB" (calling `POST /counterparty/score` and citing the 40/30/20/10 composite weights
from `/counterparty/weights`), and "what does our GAR become if these five exposures
reach full alignment" (re-calling `POST /calculate` with amended exposures).

**How.** The module's 13 endpoints are a rich, mostly read-only tool surface; the six
GET reference endpoints (`/objectives`, `/nace-mapping`, `/excluded-types`,
`/kpi-types`, `/alignment-classifications`, `/counterparty/rating-scale`) double as the
copilot's grounding corpus, so definitional questions never leave the module. Batch
what-ifs route through `POST /counterparty/batch`. The scorer's documented
band-boundary bug fix (§2.3 — float scores like 89.5 falling between integer bands) is
exactly the class of subtlety the copilot should surface when asked "why is 89.5 an A
not A+".

**Prerequisites.** Evolution A first for any question touching `/auto-calculate` —
narrating the 1.5× synthetic eligible figure would launder fabrication through fluent
prose. **Acceptance:** every score component quoted matches a tool-call breakdown;
a GAR what-if answer includes the re-calculated ratio from a fresh `/calculate` call;
questions about Art. 8 Delegated Act reporting are redirected to the `eu_taxonomy_gar`
sibling module by name.