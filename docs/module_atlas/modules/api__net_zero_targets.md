# Api::Net_Zero_Targets
**Module ID:** `api::net_zero_targets` · **Route:** `/api/v1/net-zero-targets` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/net-zero-targets/assess` | `run_full_assessment` | api/v1/routes/net_zero_targets.py |
| POST | `/api/v1/net-zero-targets/temperature-score` | `calculate_temperature_score` | api/v1/routes/net_zero_targets.py |
| GET | `/api/v1/net-zero-targets/assessments/{entity_id}` | `list_assessments` | api/v1/routes/net_zero_targets.py |
| GET | `/api/v1/net-zero-targets/assessment/{assessment_id}` | `get_assessment` | api/v1/routes/net_zero_targets.py |
| GET | `/api/v1/net-zero-targets/ref/frameworks` | `get_frameworks` | api/v1/routes/net_zero_targets.py |
| GET | `/api/v1/net-zero-targets/ref/pathways` | `get_pathways` | api/v1/routes/net_zero_targets.py |
| GET | `/api/v1/net-zero-targets/ref/sector-pathways` | `get_sector_pathways` | api/v1/routes/net_zero_targets.py |

### 2.3 Engine `net_zero_targets_engine` (services/net_zero_targets_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `NetZeroTargetsEngine._derive_temperature_score` | reduction_pct_2030 |  |
| `NetZeroTargetsEngine._derive_pathway` | reduction_pct_near |  |
| `NetZeroTargetsEngine._derive_validation_status` | cfg, validation_issues, supplied_status | Deterministic SBTi commitment-lifecycle stage. Uses the caller-supplied status when given (must be one of VALIDATION_STATUSES). Otherwise reports the earliest honest stage: an entity that has set targets but not obtained third-party validation is 'committed'; if the framework does not require validation and there are no open issues, the targets are considered 'submitted'. Never a random draw. |
| `NetZeroTargetsEngine.assess_targets` | entity_id, entity_type, framework, base_year, base_year_emissions, scope1, scope2, scope3 | Validate targets and derive pathway classification. Optional keyword inputs (all default to None → honest null when absent): long_term_reduction_pct : entity's stated long-term reduction % scope3_coverage_pct : % of Scope-3 categories covered by targets offset_reliance_pct : % of the target met via offsets/removals validation_status : reported SBTi lifecycle stage sbti_validated : True only if thi |
| `NetZeroTargetsEngine.generate_pathway` | entity_id, assessment_id, base_year, base_emissions, net_zero_year, reduction_pct_2030, reduction_pct_2050, projected_emissions_by_year | Generate year-by-year decarbonisation pathway records. The REQUIRED pathway is computed deterministically by linear interpolation between the base year, the 2030 milestone, and net-zero. Optional caller inputs (default None → honest neutral / null): projected_emissions_by_year : entity's own emissions projection per year. When absent, the projection equals the required pathway (on-track baseline,  |
| `NetZeroTargetsEngine.calculate_temperature_score` | entity_id, scope1, scope2, scope3, reduction_targets, portfolio_coverage_pct | Calculate implied portfolio/entity temperature score. The implied temperature is driven by the 2030 reduction target. If the caller supplies no reduction target, the score cannot be computed and an honest ``insufficient_data`` result is returned rather than a fabricated temperature derived from a random reduction figure. Optional: portfolio_coverage_pct : % of AUM/portfolio covered by the target s |
| `NetZeroTargetsEngine.check_framework_compliance` | entity_id, entity_type, framework, assessment_data | Check detailed compliance against a specific framework. |
| `NetZeroTargetsEngine.run_full_assessment` | entity_id, entity_type, framework | Orchestrate full assessment including pathway generation. All quantitative inputs (emissions, scope split, reduction targets) must be supplied by the caller. Missing inputs are treated as honest zeros / nulls rather than fabricated with random values, so an under-specified request yields an under-specified (but truthful) assessment. |
| `NetZeroTargetsEngine.get_reference_data` |  | Return all reference constants. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `SET` *(shared)*, `fastapi` *(shared)*, `net_zero_pathway_records`, `net_zero_target_assessments`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/net-zero-targets/assessment/{assessment_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/net-zero-targets/assessments/{entity_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/net-zero-targets/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks'], 'n_keys': 1}`

**GET /api/v1/net-zero-targets/ref/pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pathways'], 'n_keys': 1}`

**GET /api/v1/net-zero-targets/ref/sector-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_pathways'], 'n_keys': 1}`

**POST /api/v1/net-zero-targets/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/net-zero-targets/temperature-score** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_id', 'total_emissions_tco2e', 'scope1_tco2e', 'scope2_tco2e', 'scope3_tco2e', 'scope3_share_pct', 'reduction_pct_2030', 'reduction_pct_2050', 'implied_temperature_c', 'temperature_classification', 'sbti_pathway', 'alignment_status', 'warming_gap_c', 'portfolio_cov`

## 5 · Intermediate Transformation Logic

**Engine `net_zero_targets_engine` — extracted transformation lines:**
```python
years = list(range(base_year + 5, net_zero_year + 1, 5))
total_years = max(1, net_zero_year - base_year)
frac = (yr - base_year) / max(1, 2030 - base_year)
required_reduction = reduction_pct_2030 * frac
frac = (yr - 2030) / max(1, net_zero_year - 2030)
required_reduction = reduction_pct_2030 + (reduction_pct_2050 - reduction_pct_2030) * frac
required_emissions = base_emissions * (1 - required_reduction / 100)
gap = projected_emissions - required_emissions
total_emissions = scope1 + scope2 + scope3
scope3_share = (scope3 / total_emissions * 100) if total_emissions > 0 else 0
compliance_pct = max(0, 100 - len(gaps) * 20 - len(warnings) * 5)
s3 = max(0.0, base_emissions - s1 - s2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `net_zero_targets` domain (`/api/v1/net-zero-targets`) is powered by
`net_zero_targets_engine.py` (E33). It validates corporate/FI decarbonisation targets
against SBTi, SBTi FLAG, NZBA, NZAMI and NZAOA, derives an implied temperature score, and
generates a year-by-year decarbonisation pathway.

### 7.1 What the module computes

Four deterministic operations, all pure functions of caller inputs:

1. **Pathway classification** (`_derive_pathway`) — maps a near-term reduction % to an SBTi
   pathway by threshold.
2. **Temperature score** (`_derive_temperature_score`) — a lookup from 2030 reduction % to
   an implied warming °C.
3. **Pathway generation** (`generate_pathway`) — linear interpolation of a required-emissions
   glidepath between base year, the 2030 milestone, and net-zero.
4. **Compliance check** (`check_framework_compliance`) — a penalty-based 0–100 compliance %.

The engine's docstring stresses honesty: any metric requiring data the caller has **not**
supplied (Scope-3 coverage, abatement cost, achieved-vs-required projection) is returned as
`None` / `"insufficient_data"` rather than fabricated.

### 7.2 Parameterisation / scoring rubric

**SBTi pathway minimums** (`SBTI_PATHWAYS`):

| Pathway | Near-term min % | Long-term min % | Residual max % | Implied °C |
|---|---|---|---|---|
| 1.5 °C | 50 | 90 | 10 | 1.5 |
| Well-below 2 °C | 30 | 80 | 20 | 1.7 |
| 2 °C | 25 | 70 | 30 | 2.0 |

**Temperature benchmarks** (`TEMPERATURE_SCORE_BENCHMARKS`, first threshold that a 2030
reduction % meets or exceeds):

| 2030 reduction ≥ | Implied °C | Classification |
|---|---|---|
| 60% | 1.5 | 1.5 °C aligned |
| 45% | 1.7 | Well-below 2 °C |
| 30% | 2.0 | 2 °C aligned |
| 20% | 2.5 | Below 3 °C |
| 10% | 3.0 | 3 °C pathway |
| 0% | 4.0 | No credible target |

**Framework configs** (`FRAMEWORK_CONFIGS`) set per-framework minimums and eligible entity
types — e.g. SBTi Corporate near-term 42% / long-term 90% (validation required); SBTi FLAG
30% / 72% (land-sink credits allowed); NZBA banks-only with 2030 financed-emissions coverage.
**Sector pathways** (`SECTOR_PATHWAYS`) carry IEA/SBTi 2030/2040/2050 decarbonisation % for
12 sectors (power 45/80/100, oil & gas 15/40/60, steel 20/50/90 …). **Provenance:** values
are the public SBTi/NZBA/IEA-NZE headline figures encoded as constants.

### 7.3 Calculation walkthrough

`assess_targets` derives `sbti_pathway` and `temperature_score` from `near_term_reduction_pct`,
computes `pathway_gap_pct = max(0, framework_near_min − near_term_pct)`, then accumulates
validation issues (below-minimum reduction, ineligible entity type, net-zero year beyond the
framework deadline). `framework_compliant = (len(issues) == 0)`.

`generate_pathway` builds records at 5-year steps. Required reduction is piecewise linear:

```
yr ≤ 2030:  required = reduction_2030 · (yr−base)/(2030−base)
yr > 2030:  required = reduction_2030 + (reduction_2050−reduction_2030)·(yr−2030)/(nz−2030)
required_emissions = base_emissions · (1 − required/100)
```

When the caller supplies no per-year projection, `projected == required` (on-track, gap = 0)
— no fabricated deviation.

`check_framework_compliance`: `compliance_pct = max(0, 100 − 20·gaps − 5·warnings)`;
compliant when ≥ 80.

### 7.4 Worked example

Corporate, framework `sbti`, base year 2019, base emissions 1,000,000 tCO₂e,
near-term reduction 55% by 2030, long-term 92% by 2050, net-zero 2050.

- **Pathway:** 55 ≥ 50 → **1.5 °C**. **Temperature:** 55 < 60 but ≥ 45 → **1.7 °C /
  "Well-below 2 °C"**. (The 55% target *classifies* as 1.5 °C pathway but its 2030 depth maps
  to 1.7 °C implied warming — the two lookups are intentionally distinct.)
- **Pathway gap:** `max(0, 42 − 55) = 0`. No near-term issue.
- **Glidepath 2030:** required `= 55·(2030−2019)/(2030−2019) = 55%` → `1,000,000·0.45 =
  450,000 tCO₂e`. **2050:** `55 + (92−55)·1 = 92%` → `80,000 tCO₂e`.
- **Compliance:** near-term 55 ≥ 42 OK; long-term 92 ≥ 90 OK; if `sbti_validated` not
  confirmed and validation required → 1 gap → `100 − 20 = 80` → **compliant (=80)**.

### 7.5 Data provenance & limitations

- **No synthetic-PRNG fabrication.** All outputs are deterministic; missing inputs surface as
  explicit nulls / `insufficient_data`.
- Temperature scoring is a coarse 6-band step function of the 2030 reduction only; it does not
  integrate the full emissions trajectory or overshoot, as a genuine ITR model would.
- Pathway interpolation is linear between three anchor points — no sectoral decarbonisation
  curve conditioning even though `SECTOR_PATHWAYS` is available as reference data.
- Validation status is a lifecycle stage (committed/submitted), not a live SBTi registry lookup.

**Framework alignment:** **SBTi Corporate Net-Zero Standard** — near-term ≥42% (1.5 °C
cross-sector) and long-term ≥90% with ≤10% residual offsetting are the actual standard's
thresholds. **SBTi FLAG** — land-sector guidance with land-sink removals. **NZBA / NZAMI /
NZAOA** — the three finance-sector alliances; the engine encodes their coverage and interim
targets (NZAOA's 5-year interim, NZBA's 2030 financed-emissions coverage). Implied
temperature scoring approximates the **SBTi/CDP temperature-rating** approach of mapping
target ambition to a warming outcome.

## 9 · Future Evolution

### 9.1 Evolution A — Sector-pathway-anchored temperature scoring and achieved-vs-required tracking (analytics ladder: rung 2 → 4)

**What.** The E33 engine validates decarbonisation targets against SBTi/FLAG/NZBA/NZAMI/
NZAOA, derives an implied temperature score, and generates a linear-interpolated
required-emissions glidepath between base year, the 2030 milestone, and net-zero. The
temperature score is a coarse lookup from 2030 reduction % to warming °C
(`_derive_temperature_score`), and the pathway is straight-line interpolation. The engine
is admirably honest — it returns `None`/`insufficient_data` for anything the caller didn't
supply (Scope-3 coverage, achieved-vs-required projection). Evolution A upgrades the
science while preserving that honesty.

**How.** (1) Replace the reduction-%-to-temperature lookup with the SBTi/CDP-WWF temperature
methodology anchored to real sector pathways (`/ref/sector-pathways` already exists as a
scaffold; wire it to the platform's NGFS/glidepath data). (2) Add achieved-vs-required
tracking: when the entity supplies an emissions time series, compute the gap trajectory and
project whether the target is on track (rung 4 predictive) — currently the projection is an
input, not a computation. (3) Fix the persistence path: `/assessment/{id}` and
`/assessments/{entity_id}` trace **failed**, so saved assessments aren't retrievable. (4)
Bench-pin the glidepath interpolation and compliance penalty.

**Prerequisites.** Sector-pathway data linked (glidepath modules); assessment persistence
repaired (`net_zero_target_assessments` write/read path). **Acceptance:** temperature score
derives from sector pathways, not a flat lookup; achieved-vs-required is computed from a
supplied series with an on-track verdict; `/assessment/{id}` returns `passed`; honest-null
behaviour retained and bench-pinned.

### 9.2 Evolution B — Net-zero target-setting copilot (LLM tier 2)

**What.** A copilot that runs `/assess` and explains the verdict — "your near-term target
(42% by 2030) qualifies as 1.5°C-aligned under SBTi, but your net-zero year of 2060 exceeds
the framework maximum; Scope-3 coverage is insufficient to score" — each figure tool-sourced,
with what-ifs on target ambition.

**How.** Two POST endpoints (`/assess`, `/temperature-score`) plus three reference GETs
(frameworks, pathways, sector-pathways) that ground every SBTi/NZBA threshold. The
penalty-based compliance % lets the copilot enumerate exactly which gaps and warnings cost
points. What-ifs ("what 2030 reduction do we need for a 1.5°C score?") re-run statelessly.
The engine's `insufficient_data` returns are a strong refusal-path test — the copilot must
report them, not fill them in. Cross-links to the glidepath and PCAF copilots.

**Prerequisites.** None hard for tier-1; assessment persistence (Evolution A) for
"show my saved targets". **Acceptance:** every reduction %, temperature score, and
compliance figure traces to a tool response; the copilot reports `insufficient_data` for
unsupplied inputs rather than estimating; it cites the specific framework minimum behind
each pass/fail from the reference endpoints.