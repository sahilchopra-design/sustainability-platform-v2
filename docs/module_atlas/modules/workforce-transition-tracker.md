# Workforce Transition Tracker
**Module ID:** `workforce-transition-tracker` · **Route:** `/workforce-transition-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CO1 · **Sprint:** CO

## 1 · Overview
10 regions with reskilling programme outcome tracking: enrollment, completion, job placement, wage comparison.

**How an analyst works this module:**
- Programme Dashboard shows enrollment and outcomes
- Skills Gap Analysis identifies training needs

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CASES`, `PALETTE`, `REGIONS`, `ROI_DATA`, `SKILLS_GAP`, `TABS`, `YEARLY_TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGIONS` | 11 | `workers`, `enrolled`, `completion`, `placement`, `oldWage`, `newWage`, `timeToEmploy`, `pathway` |
| `YEARLY_TREND` | 7 | `enrolled`, `completed`, `placed` |
| `SKILLS_GAP` | 9 | `demand`, `supply` |
| `ROI_DATA` | 7 | `cost`, `avgWageGain`, `payback`, `roi` |
| `CASES` | 4 | `region`, `workers`, `outcome`, `highlight` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalEnrolled` | `REGIONS.reduce((s, r) => s + r.enrolled, 0);` |
| `avgCompletion` | `Math.round(REGIONS.reduce((s, r) => s + r.completion, 0) / REGIONS.length);` |
| `avgPlacement` | `Math.round(REGIONS.reduce((s, r) => s + r.placement, 0) / REGIONS.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CASES`, `PALETTE`, `REGIONS`, `ROI_DATA`, `SKILLS_GAP`, `TABS`, `YEARLY_TREND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Regions | — | ILO | Global reskilling programme tracking |
| Avg Placement Rate | — | Programme data | Workers finding green employment after reskilling |

## 5 · Intermediate Transformation Logic
**Methodology:** Reskilling ROI calculation
**Headline formula:** `ROI = (WageGain × PlacementRate × Years - TrainingCost) / TrainingCost`

Training ROI considers: upfront training cost, wage differential (fossil vs green), placement success rate, and expected employment duration.

**Standards:** ['ILO', 'Just Transition Centre']
**Reference documents:** ILO World Employment Report; Just Transition Centre

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is unusual in this batch: it uses **no seeded-PRNG synthetic data at all** — every figure
is a static, hand-curated illustrative point value for 10 named fossil-fuel transition regions
(Appalachia, Ruhr Valley, Silesia, Queensland, Alberta, Mpumalanga, Shanxi, Jharkhand, Kuznetsk,
Yorkshire). This makes it more honest than sr()-seeded modules in one sense (no false impression of
"different data per session"), but the guide's ROI formula is still not actually computed from the
displayed cost/wage-gain fields — the `roi`/`payback` figures in `ROI_DATA` are separately hand-set,
only approximately consistent with the formula.

### 7.1 What the module computes

```js
totalEnrolled  = Σ REGIONS.enrolled                    // genuinely summed
avgCompletion  = round(Σ REGIONS.completion / REGIONS.length)   // genuinely averaged (unweighted by enrolled count)
avgPlacement   = round(Σ REGIONS.placement / REGIONS.length)
```

`REGIONS` (10 rows) carries `workers`, `enrolled`, `completion` (%), `placement` (%), `oldWage`,
`newWage`, `timeToEmploy` (months), `pathway` (e.g. "Coal→Solar") — all static values, not derived
from any formula in the component.

### 7.2 Parameterisation — the static regional dataset

| Region | Completion | Placement | Old→New wage | Pathway |
|---|---|---|---|---|
| Ruhr Valley DE | 88% | 82% | €48,000→€51,200 (**+6.7%**) | Coal→Wind |
| Yorkshire UK | 91% | 85% | £36,000→£38,500 (**+6.9%**) | Coal→Wind |
| Appalachia US | 78% | 65% | $52,000→$48,500 (**−6.7%**) | Coal→Solar |
| Silesia PL | 62% | 48% | 28,000→26,500 zł-equiv (**−5.4%**) | Coal→EV Mfg |
| Alberta CA | 74% | 59% | C$78,000→C$65,000 (**−16.7%**) | Oil→Wind |
| Jharkhand IN | 52% | 35% | ₹12,000→₹11,200 (**−6.7%**) | Coal→Solar |

The dataset **honestly encodes wage decline as a realistic outcome** in 6 of 10 regions — a
genuinely useful and non-trivial modelling choice (most "just transition" dashboards implicitly
assume wage parity or gains; here Alberta shows a 16.7% wage cut alongside only 59% placement,
correctly flagging it as a high-risk transition case). Completion and placement rates correlate
plausibly with wage outcomes (Ruhr Valley/Yorkshire, the two wage-gain cases, also have the two
highest completion rates).

### 7.3 Calculation walkthrough

1. `totalEnrolled`/`avgCompletion`/`avgPlacement` feed the Programme Dashboard KPI row.
2. **Transition Success Rates tab** likely charts `REGIONS.completion`/`placement` directly per
   region (bar/radar).
3. **Skills Gap Analysis tab** — `SKILLS_GAP` (8 skills) shows `demand` vs `supply` (0–100 scale) as
   static figures, e.g. Battery Technology: demand 85, supply 28 — a 57-point gap, the largest in the
   table — descriptive, not derived from any regional labour-market model.
4. **Training ROI tab** — `ROI_DATA` (6 programmes) shows `cost`, `avgWageGain`, `payback`, `roi` as
   independently hand-set values. Testing the guide's formula
   (`ROI = (WageGain×PlacementRate×Years−Cost)/Cost`) against Solar Install Cert
   (`cost=$8,500, avgWageGain=$4,200, roi=148%`): assuming a 5-year horizon and 100% placement,
   `(4,200×5−8,500)/8,500 = 147.6%` ≈ **148%** — close enough to suggest the figures were originally
   *derived* from something like this formula at authoring time, but the derivation isn't present as
   live code, so changing `cost` or `avgWageGain` today would not update `roi`.
5. **Regional Employment Impact / Case Studies tabs** render `YEARLY_TREND` (2020–2025 national
   enrolled/completed/placed trend) and `CASES` (3 named programme success stories) — both static.

### 7.4 Worked example

`avgCompletion = (78+88+62+81+74+55+71+52+58+91)/10 = 710/10 = 71.0%`. This is an **unweighted**
regional average — Shanxi (8,500 workers) and Yorkshire (2,100 workers) count equally, even though
Shanxi's cohort is 4× larger. A worker-weighted average
(`Σ completion_i×workers_i / Σ workers_i`) would give more weight to the larger cohorts and would
likely pull the headline completion rate down somewhat, since two of the largest-workforce regions
(Shanxi 8,500, Jharkhand 7,200, Mpumalanga 6,200) have below-average completion rates (71%, 52%, 55%).

### 7.5 Data provenance & limitations

- **All figures are static illustrative point estimates** for named real regions — plausible and
  internally consistent (wage/completion/placement correlations make directional sense), but not
  traceable to a specific ILO/Just Transition Centre dataset row despite both being cited as sources.
- **Portfolio KPIs are unweighted averages**, which can materially mis-represent programme-wide
  performance when cohort sizes vary 4× across regions (§7.4).
- **`ROI_DATA`'s `roi`/`payback` fields are not live-computed** from `cost`/`avgWageGain` — they
  appear to have been derived from something like the guide's formula once, by hand, but there is no
  code path that would keep them consistent if the underlying cost/wage-gain assumptions changed.

**Framework alignment:** ILO World Employment Report and Just Transition Centre (both named in the
guide) inform the plausible calibration of the regional dataset but are not connected to a live data
source or a reproducible ROI calculation — a production version should compute `roi` in-line from
`cost`/`avgWageGain`/`placement`/an explicit time horizon, rather than storing it as an independent
static field.

## 9 · Future Evolution

### 9.1 Evolution A — Live ROI formula and worker-weighted KPIs (analytics ladder: rung 1 → 2)

**What.** This module is refreshingly honest — no PRNG at all, and its hand-curated
10-region dataset encodes wage *decline* in 6 of 10 regions (Alberta −16.7%), which
§7.2 rightly credits as a non-trivial modelling choice. Two documented gaps: §7.3(4)
shows `ROI_DATA.roi` was evidently hand-derived from the guide's formula once (Solar
Install Cert: computed 147.6% vs stored 148%) but isn't live-computed, so editing
`cost` or `avgWageGain` today silently desynchronises the ROI; and §7.4 shows the
headline KPIs are unweighted regional means — Shanxi's 8,500-worker cohort counts the
same as Yorkshire's 2,100, overstating programme-wide completion because the largest
cohorts underperform. Evolution A makes the ROI formula live
(`ROI = (WageGain × PlacementRate × Years − Cost)/Cost` with the horizon and
placement inputs explicit and user-adjustable), switches portfolio KPIs to
worker-weighted averages, and adds a programme-entry form persisting to a
`workforce_programmes` table so the tracker can actually track — new cohorts,
quarterly outcome updates, and a region's trajectory over time instead of one static
snapshot.

**How.** Small backend vertical (module is Tier B, EP-CO1): `POST /programmes`,
`GET /programmes`, `POST /roi` in a new route; Alembic migration for the table; the
static 10-region dataset becomes the seed fixture with provenance labels.

**Prerequisites.** Time-horizon assumption in the ROI made explicit (the hand-derived
figures implied 5 years); decision on currency normalisation for cross-region wage
comparison. **Acceptance:** editing a programme's cost updates its ROI on render;
the headline completion rate is worker-weighted (and visibly lower than the current
71.0% given the large underperforming cohorts); a newly entered cohort appears after
reload.

### 9.2 Evolution B — Just-transition programme advisor (LLM tier 1 → 2)

**What.** The module's users — just-transition funds, development banks, policy
teams — ask comparative questions the dataset can genuinely answer: "why do Ruhr
Valley and Yorkshire outperform — what do the wage-gain regions have in common?",
"is Alberta's Oil→Wind pathway viable at 59% placement and a 16.7% wage cut, and what
would placement need to reach for ROI break-even?" Tier-1 first: a copilot grounded
in this Atlas page and the on-page dataset, whose honest wage-decline structure gives
it unusually substantive material. Tier-2 adds Evolution A's `POST /roi` as a tool so
break-even questions are computed ("placement rate at which Alberta's ROI turns
positive") rather than estimated, and `GET /programmes` for portfolio queries once
real cohorts accumulate.

**How.** Standard copilot stack (`llm_corpus_chunks` embedding;
`POST /api/v1/copilot/workforce-transition-tracker/ask`); the system prompt carries
§7.5's provenance statement — plausible ILO-consistent illustrative estimates, not
traceable dataset rows — so answers about "the data" are correctly framed.

**Prerequisites.** pgvector corpus; Evolution A for any computed break-even claims.
**Acceptance:** every %, wage, and ROI in an answer matches the dataset or a tool
response; break-even answers cite the ROI tool run with its horizon assumption;
asked for a region outside the 10 tracked, the advisor says so rather than
generalising.