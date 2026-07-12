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
