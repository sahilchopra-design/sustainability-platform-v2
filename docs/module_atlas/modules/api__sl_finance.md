# Api::Sl_Finance
**Module ID:** `api::sl_finance` · **Route:** `/api/v1/sl-finance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sl-finance/assess` | `assess` | api/v1/routes/sl_finance.py |
| POST | `/api/v1/sl-finance/assess/batch` | `assess_batch` | api/v1/routes/sl_finance.py |
| POST | `/api/v1/sl-finance/validate-kpi` | `validate_kpi` | api/v1/routes/sl_finance.py |
| POST | `/api/v1/sl-finance/calibrate-spt` | `calibrate_spt` | api/v1/routes/sl_finance.py |
| GET | `/api/v1/sl-finance/ref/kpi-library` | `ref_kpi_library` | api/v1/routes/sl_finance.py |
| GET | `/api/v1/sl-finance/ref/icma-components` | `ref_icma_components` | api/v1/routes/sl_finance.py |
| GET | `/api/v1/sl-finance/ref/lma-components` | `ref_lma_components` | api/v1/routes/sl_finance.py |
| GET | `/api/v1/sl-finance/ref/coupon-guidance` | `ref_coupon_guidance` | api/v1/routes/sl_finance.py |

### 2.3 Engine `sl_finance_engine` (services/sl_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `KPIAssessment.dict` |  |  |
| `SLFinanceResult.dict` |  |  |
| `SLFinanceEngine.validate_kpi` | kpi | Assess a single KPI against SMART criteria and SPT trajectory. |
| `SLFinanceEngine._assess_components` | inp, kpi_results | Assess ICMA or LMA principles components. |
| `SLFinanceEngine.assess` | inp | Full SLB/SLL principles compliance assessment. |
| `SLFinanceEngine.calibrate_spt` | kpi_id, baseline, target_pct_improvement, baseline_year, target_year | Calculate target value and ambition assessment for a given SPT. |
| `SLFinanceEngine.get_kpi_library` |  |  |
| `SLFinanceEngine.get_icma_components` |  |  |
| `SLFinanceEngine.get_lma_components` |  |  |
| `SLFinanceEngine.get_cross_framework` |  |  |
| `SLFinanceEngine.get_coupon_guidance` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `KPI`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sl-finance/ref/coupon-guidance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['typical_range_bps', 'max_step_up_bps', 'trigger_mechanism', 'remedy_period', 'use_of_step_up'], 'n_keys': 5}`

**GET /api/v1/sl-finance/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['csrd_esrs', 'sbti', 'tcfd', 'gri', 'eu_taxonomy'], 'n_keys': 5}`

**GET /api/v1/sl-finance/ref/icma-components** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': ['id', 'name', 'description', 'blocking', 'article']}`

**GET /api/v1/sl-finance/ref/kpi-library** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ghg_scope1_2_intensity', 'ghg_scope3_intensity', 'renewable_energy_pct', 'water_intensity', 'waste_recycling_pct', 'women_in_leadership_pct', 'employee_injury_rate', 'supply_chain_sustainability_pct', 'board_diversity_pct', 'esg_rating_score'], 'n_keys': 10}`

**GET /api/v1/sl-finance/ref/lma-components** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': ['id', 'name', 'description', 'blocking', 'article']}`

**POST /api/v1/sl-finance/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sl-finance/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sl-finance/calibrate-spt** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `sl_finance_engine` — extracted transformation lines:**
```python
achieved = (kpi.baseline_value - kpi.current_value) / abs(kpi.baseline_value) * 100
achieved = (kpi.current_value - kpi.baseline_value) / abs(kpi.baseline_value) * 100
on_track = improvement_achieved_pct >= improvement_required_pct * 0.5
score = min(score + 20.0, 100.0)
avg_smart = sum(ka.smart_score for ka in kpi_results) / len(kpi_results)
overall_score = (weighted_sum / total_weight) if total_weight > 0 else 0.0
target_value = baseline * (1 - target_pct_improvement / 100)
target_value = baseline * (1 + target_pct_improvement / 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/sl-finance` (engine E17, `sl_finance_engine.py`) assesses **sustainability-linked bonds
(SLB) and loans (SLL)** against the ICMA SLB Principles 2023 and LMA/APLMA/LSTA SLL Principles
2023. Three operations: `POST /assess` (full 5-component compliance assessment, batch variant
available), `POST /calibrate-spt` (target-value and ambition calibration), and `GET /ref/*`
(KPI library, ICMA/LMA components, coupon guidance, cross-framework notes).

```
improvement_required % = |target − baseline| / |baseline| × 100
improvement_achieved % = (baseline − current)/|baseline| × 100      (lower-is-better KPIs)
                       = (current − baseline)/|baseline| × 100      (higher-is-better), floored at 0
on_track      = achieved ≥ 0.5 × required
SMART score   = 20 pts each: name set · unit set · required ≥ typical improvement ·
                KPI in library · target_year > baseline_year
overall_score = Σ w·component_score / Σ w        w = 1.5 blocking, 1.0 non-blocking
principles_compliant = every blocking component score ≥ 70
step_up_triggered    = any KPI not on_track
```

### 7.2 Parameterisation

**KPI library** (10 KPIs) with per-KPI *typical SPT improvement* used as the ambition benchmark:

| KPI | Category | Typical improvement | Benchmark sources (as coded) |
|---|---|---|---|
| GHG Scope 1+2 intensity | E | 25 % | SBTi, IEA sector pathways, CRREM |
| GHG Scope 3 intensity | E | 20 % | PCAF, CDP |
| Renewable energy % | E | 20 % | RE100, IEA |
| Recordable injury rate | S | 20 % | OSHA, ISO 45001 |
| Water intensity | E | 15 % | AWS, CDP Water |
| Sustainable supply chain % | S | 15 % | CDP Supply Chain, SEDEX |
| Waste recycling % | E | 10 % | EU CEAP |
| Women in leadership / board diversity | S/G | 10 % | 30% Club, WEF |
| ESG rating score | G | 5 % (not "widely recognized") | MSCI, Sustainalytics, ISS |

Lower-is-better set: GHG S1+2, GHG S3, water intensity, injury rate.

**Component registries**: 5 ICMA SLB components (§1 KPI selection, §2 SPT calibration, §3 bond
characteristics, §4 reporting, §5 verification) and the 5 mirrored LMA SLL components — §1–§3
flagged *blocking*, §4–§5 non-blocking. **Coupon guidance**: typical 12.5–25 bps per missed SPT,
max 50 bps, ICMA-recommended no cure period for GHG targets.

**Ambition bands** (calibration): high ≥ 1.25 × typical; medium ≥ typical; low ≥ 0.5 × typical;
else insufficient. Component compliance threshold 70; default step-up input 25 bps. All scoring
weights/thresholds are platform conventions (the principles themselves are qualitative).

### 7.3 Calculation walkthrough

1. Each KPI gets a `KPIAssessment` (improvements, on-track, SMART score, ambition band from SMART
   score: ≥80 high, ≥60 medium, ≥40 low).
2. Component scoring: §1 = 80 if any KPI is in the library (+20 if all SMART ≥ 60, else gap);
   §2 = mean SMART score with a gap if any KPI rates low/insufficient; §3 = 80 if step-up > 0
   (downgraded to 60 with a gap if step-up exceeds 50 bps; 0 if absent — structurally
   non-compliant); §4 = 100/30 on annual reporting; §5 = 100 if annual verification and all KPIs
   verified, 70 if verification but partial coverage, else 20.
3. `spo_required` is true for SLBs; status string reflects provider. Recommendations are
   rule-generated (obtain SPO, fix blocking gaps, note triggered step-up, arrange verification).
4. `calibrate_spt` converts a % improvement into a target value in the correct direction and
   returns the ambition band vs the library's typical improvement.

### 7.4 Worked example — SLB with one GHG KPI

Input: SLB, step-up 25 bps, annual reporting ✓, annual verification ✓, one KPI
`ghg_scope1_2_intensity` (verified ✓): baseline 100 tCO₂e/unit (2022), target 70 (2030),
current 88.

| Step | Computation | Result |
|---|---|---|
| Required improvement | \|70−100\|/100 | 30 % |
| Achieved (lower-better) | (100−88)/100 | 12 % |
| On track | 12 ≥ 0.5×30 = 15? | **No** → step-up triggered |
| SMART | name ✓ + unit ✓ + 30 ≥ 25 ✓ + in library ✓ + 2030 > 2022 ✓ | **100** → ambition "high" |
| slb_c1 | 80 + 20 (all SMART ≥ 60) | 100 ✓ |
| slb_c2 | mean SMART | 100 ✓ |
| slb_c3 | step-up 25 bps > 0 | 80 ✓ |
| slb_c4 / c5 | reporting ✓ / verification ✓ + 1/1 verified | 100 / 100 ✓ |
| Overall | (100+100+80)×1.5 + (100+100)×1.0 = 620 / 6.5 | **95.38** |
| Verdict | all blocking ≥ 70 | compliant; recommendation: "coupon step-up of 25.0 bps will apply at next assessment date" |

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic seeds** — the engine is a deterministic rules assessor over
  caller-supplied instrument data; the only generated value is a `uuid4` assessment id.
- "Typical SPT improvement" percentages are the platform's market-calibration heuristics (the
  ICMA/LMA principles do not publish numeric ambition floors); ambition is judged against these,
  not against actual SBTi pathway math.
- The on-track test (≥ 50 % of required improvement achieved) ignores elapsed time — a KPI one
  year into an eight-year target is judged by the same 50 % rule as one in its final year.
- SMART "Ambitious" is binary at the typical-improvement threshold; the §2 score reuses the SMART
  score rather than testing science-based consistency directly.
- Step-up mechanics are assessed structurally (present/size) — no cash-flow or yield impact is
  computed; trigger-date scheduling is not modelled.

### 7.6 Framework alignment

- **ICMA Sustainability-Linked Bond Principles (2023)** — five core components: (1) KPI selection
  (material, measurable, benchmarkable), (2) SPT calibration (ambitious, science-consistent,
  beyond BAU), (3) bond characteristics (financial impact — typically coupon step-up — on SPT
  miss), (4) reporting (annual, public), (5) verification (annual independent assurance,
  post-issuance mandatory). The engine encodes each as a scored component with §1–§3 blocking.
- **LMA/APLMA/LSTA SLL Principles (2023)** — the loan analogue with margin ratchets instead of
  coupon step-ups; the engine reuses the same scoring with SLL-specific component names.
- **Second Party Opinion practice** — ICMA recommends (not mandates) a pre-issuance SPO; the
  engine marks SPO "required" for SLBs on market-credibility grounds and names typical providers.
- **Cross-framework mappings** (returned verbatim by `/ref/cross-framework`): CSRD ESRS material
  topics, SBTi sector pathways for GHG ambition, TCFD scenario analysis for baselining, GRI 305/306
  measurement methodologies, EU Taxonomy as a complementary proceeds metric.

## 9 · Future Evolution

### 9.1 Evolution A — Ambition benchmarking against sector pathways and observed SLB market data (analytics ladder: rung 2 → 3)

**What.** The E17 engine assesses sustainability-linked bonds/loans against the ICMA SLB Principles
2023 and LMA/APLMA/LSTA SLL Principles 2023: per-KPI improvement required/achieved, an `on_track =
achieved ≥ 0.5 × required` rule, a 5-part SMART score (20 pts each), a weighted 5-component
compliance score (blocking components ×1.5, compliant if every blocking ≥70), a step-up trigger,
and SPT calibration. The KPI library (10 KPIs) carries *typical improvement* values that anchor
ambition testing — but those typicals are static registry entries, and the `0.5 × required`
on-track rule is a platform convention. Evolution A benchmarks ambition against real pathways.

**How.** (1) Calibrate each KPI's "typical improvement" against the platform's sector pathway data —
GHG-intensity SPTs tested against the NZBA/IEA glidepaths (`glidepath` module) and SBTi rates, so
"ambitious" means beyond-pathway, not beyond-a-static-registry-value. (2) Add coupon-impact
analytics: expected step-up cost as `P(miss) × step_up_bps × remaining tenor`, with P(miss) from the
KPI trajectory rather than a binary on-track flag. (3) Justify or calibrate the 0.5× on-track
threshold with documented rationale. (4) Bench-pin the SMART score, component weighting, and SPT
calibration.

**Prerequisites.** Glidepath/SBTi linkage for ambition benchmarks; issuer KPI history for
trajectory-based P(miss). **Acceptance:** ambition verdicts cite the sector pathway the SPT is
tested against; an expected step-up cost with a probability is returned; the on-track threshold is
documented; scoring bench-pinned.

### 9.2 Evolution B — SLB/SLL structuring copilot (LLM tier 2)

**What.** A copilot for DCM/lending teams: "assess this SLB against ICMA — is the GHG SPT
ambitious, is the KPI material, and will the step-up trigger?" (calling `/assess` and citing the
per-component and SMART decompositions), plus "calibrate an SPT for a 2030 water-intensity target"
via `/calibrate-spt`.

**How.** Four POST endpoints (`/assess`, `/assess/batch`, `/validate-kpi`, `/calibrate-spt`) plus
reference GETs (the 10-KPI library with typicals, ICMA/LMA components with blocking flags and
article citations, coupon guidance, cross-framework) — a self-contained principles corpus, so the
copilot cites the exact ICMA component behind each deduction. The calibrate endpoint is the natural
structuring action: propose a target value and test its ambition. What-ifs re-run statelessly.
Node for a sustainable-finance desk, cross-linking to `net_zero_targets` and `glidepath`.

**Prerequisites.** None hard — the engine is honest and reference-complete; ambition narration is
stronger after Evolution A's pathway benchmarks. **Acceptance:** every component score, SMART
point, and on-track verdict traces to a tool response; the copilot names the ICMA/LMA component and
its blocking status per finding; it labels ambition as registry-typical-based until Evolution A,
and refuses to predict a step-up as certain rather than probabilistic.