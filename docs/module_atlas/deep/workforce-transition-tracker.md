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
