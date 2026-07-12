## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/entity360` wraps the **Entity 360 Engine** (`backend/services/entity360_engine.py`),
which assembles a single cross-module profile for any counterparty/investee/issuer: per-module
data availability and quality, a composite risk score, an ESG summary rating, regulatory-framework
status flags, and a counterparty-master deduplication service. It is an **aggregation and scoring
engine over other modules' outputs** — it computes no primary risk quantities itself. Headline
formulas quoted from code:

```
data_completeness = modules_with_data / 10 registry modules × 100
credit_score      = min(PD_1yr × 1000, 100)                # PD → 0–100 scale
reg_risk          = 100 − taxonomy_aligned_pct
composite         = Σ w_i·score_i / Σ w_i   over available scores
                    (w: credit 0.3, climate 0.3, nature 0.2, regulatory 0.2; default 50 if none)
ESG score         = 50 + 10·[GHG < 100k t] + 10·[intensity < 100] + 10·[taxonomy > 20%] + 10·[PAI flags ≤ 2]
```

### 7.2 Parameterisation / scoring rubrics

**Module registry** (`MODULE_REGISTRY`, `GET /ref/module-registry`): 10 platform modules with
expected output lists — carbon_calculator, climate_risk, ecl_calculator, pcaf_calculator,
nature_risk, taxonomy_alignment, scenario_analysis, sfdr_pai, real_estate, supply_chain. Module
data quality: provided/expected outputs ≥ 80% → high, ≥ 50% → medium, else low; none → gap.

| Rubric | Thresholds |
|---|---|
| Risk band | composite ≤ 25 low · ≤ 50 medium · ≤ 75 high · > 75 very_high |
| ESG rating | score ≥ 80 A · ≥ 60 B · ≥ 40 C · ≥ 20 D · else NR (baseline 50 ⇒ C minimum in practice) |
| EU Taxonomy status | aligned ≥ 20% · partially_aligned > 0 · else not_assessed |
| SFDR PAI status | compliant ≤ 3 flags · else review_needed |
| CSRD E1 / TCFD | "data_available" if carbon_calculator / climate_risk data present |

**Counterparty-master data quality score** (additive, capped 100 — synthetic rubric): LEI +30,
sector +20, ≥ 3 modules linked +30 (≥ 1 → +15), country +10, parent/group +10; "low quality"
< 50. Duplicates are detected by exact match on lower-cased, space-stripped names; the first ID
in each collision group becomes canonical.

All thresholds and weights are **platform design choices** (no cited external calibration); the
engine header references CSRD double-materiality entity scope, PCAF counterparty attribution and
EBA Pillar 3 counterparty credit risk as framing.

### 7.3 Calculation walkthrough

- **`POST /profile`** — caller supplies `module_data` (list of `{module_id, values}`); the engine
  walks the 10-module registry, scores availability/quality, builds the risk profile (only
  available scores enter the weighted average — weights renormalise over what is present), ESG
  profile, regulatory status map, gaps, and up to 6 recommendations (e.g. "High composite risk —
  initiate enhanced due diligence"; missing-module prompts; low-completeness warning at > 5 gaps).
- **`POST /counterparty-master`** — batch of counterparty records → quality-scored master list,
  name-collision duplicate groups, sector and entity-type distributions, average quality and
  low-quality count.
- **`GET /by-lei/{lei}`** — the DB-powered path: validates 20-char LEI, calls
  `EntityResolutionService.build_entity_graph(lei)` (the shared cross-module spine over GLEIF +
  module tables), infers name/sector/type from the best available record (FI record forces
  `entity_type="fi"`, energy record forces `sector="energy"`), maps the first PCAF investee and
  first ECL assessment into `module_data`, then runs `build_profile` (reporting year hardcoded
  2025) and attaches a `cross_module_graph` presence summary (module_count, per-domain booleans,
  asset/investee/assessment counts).
- **`GET /ref/entity-types`** (7 archetypes) and **`GET /ref/sectors`** (12-sector label map)
  expose the classification vocabularies.

### 7.4 Worked example

Profile request with three modules populated: `ecl_calculator {pd_1yr: 0.03, …}` (6/6 outputs),
`climate_risk {combined_risk_score: 62, …}` (2/4 outputs), `taxonomy_alignment
{taxonomy_aligned_pct: 15}` (1/4 outputs).

| Step | Computation | Result |
|---|---|---|
| Credit score | min(0.03 × 1000, 100) | 30.0 |
| Climate score | pass-through | 62.0 |
| Regulatory risk | 100 − 15 | 85.0 |
| Composite | (30×0.3 + 62×0.3 + 85×0.2)/(0.3+0.3+0.2) | **55.75 → "high"** |
| Completeness | 3/10 × 100 | 30% (7 gap records) |
| Module quality | ECL high (100%), climate medium (50%), taxonomy low (25%) | — |
| EU Taxonomy status | 0 < 15 < 20 | partially_aligned |
| ESG score | 50 + 0 + 0 + 0 + 10 (0 PAI flags ≤ 2) | 60 → **rating B** |

Note the ESG-rating subtlety visible here: with no `sfdr_pai` data, `pai_count_flagged` defaults
to 0, which *passes* the ≤ 2 test — absence of PAI data improves the rating.

### 7.5 Data provenance & limitations

- **No PRNG or seeded demo data** — the engine only rearranges caller- or DB-supplied values.
  The `by-lei` path reads real ingested registries (GLEIF LEI, module tables) via
  `EntityResolutionService`.
- The PD→score mapping (×1000, cap 100) makes 10% PD the "maximum risk" saturation point —
  a linear convenience, not a calibrated transform; likewise the 0.3/0.3/0.2/0.2 weights and the
  ±10-point ESG rubric are illustrative.
- The ESG rating rewards missing data twice: default composite 50 when nothing is available, and
  the PAI-flag default noted above. Consumers should read `data_completeness_pct` alongside the
  rating.
- `by-lei` currently maps only sparse fields (ECL total, PCAF outstanding amount + an
  `asset_class_code: 1.0` existence sentinel) into module_data — most of the graph arrives as
  presence booleans, so DB-driven profiles typically score "low" module quality by construction.
- Duplicate detection is exact-normalised-name only — no fuzzy matching, no LEI-based merge.

### 7.6 Framework alignment

- **GLEIF / ISO 17442:** LEI is the join key for the DB-powered profile, consistent with the
  platform-wide entity-resolution spine.
- **EU Taxonomy Art. 8:** the ≥ 20% alignment threshold used for "aligned" status loosely mirrors
  the ambition levels discussed for green-ratio benchmarks; real taxonomy reporting is
  KPI-specific (turnover/CapEx/OpEx), not a single percentage.
- **SFDR PAI regime:** PAI indicators are counted as "flags"; the ≤ 3 compliance heuristic is a
  monitoring convention, not an SFDR rule (SFDR mandates disclosure, not thresholds).
- **CSRD/ESRS E1 & TCFD/ISSB:** status flags indicate data-readiness for these disclosure
  frameworks rather than assessed compliance.
- **PCAF:** counterparty-level attribution outputs (financed emissions, attribution factor, DQS)
  are first-class registry citizens, reflecting PCAF's borrower/investee-level accounting unit.
- **BCBS 239 (in spirit):** the counterparty-master dedup + data-quality scoring addresses risk
  data aggregation hygiene, though no formal lineage requirements are implemented.
