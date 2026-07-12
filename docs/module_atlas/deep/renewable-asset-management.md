## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — partial.** The guide's formulas are `PR_actual =
> ActualGeneration/(Irradiation×InstalledCapacity)` (a true performance ratio, requiring measured
> irradiation), `Availability = OperatingHours/TotalHours` (requiring an actual downtime log), and
> `CapexPerMWh = LifetimeCapex/LifetimeGeneration` (requiring cost and lifetime-generation data).
> **None of the three is computed this way in the code** — there is no irradiation field, no
> operating-hours/downtime log, and no capex or repowering-cost field anywhere in the file.
> Instead, `p50Gwh` is derived from a **capacity-factor** assumption (25% flat, ± noise) rather
> than measured irradiance, `availability` is an independent 90–99% random draw, and no CapEx/MWh
> or repowering IRR calculation exists despite being named guide data points. Degradation is the
> one metric that lands close to its cited external source (see §7.2). Below documents the
> capacity-factor-based model the code actually implements.

### 7.1 What the module computes

150 (approx.) synthetic renewable assets across 5 technologies, with P50/P90/actual generation,
degradation, availability, O&M cost, and revenue:

```js
p50Gwh        = capacityMw × 0.25 × 8760/1000 × (0.8+sr()×0.4)      // capacity-factor proxy, not irradiation-based PR
p90Gwh        = p50Gwh × (0.75+sr()×0.15)                            // P90 as a downside % of P50
actualGwh     = p50Gwh × (0.85+sr()×0.3)                             // actual vs budget
degradationPct= 0.3 + ageYears × (0.3+sr()×0.4)                      // cumulative %, annual rate 0.3–0.7%/yr embedded
availability  = 90 + sr()×9                                          // 90–99%, independent draw
omCostMwh     = 8 + sr()×22                                          // $8–30/MWh
revenueM      = actualGwh × (45+sr()×35) / 1000                      // $/MWh price 45–80
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Flat capacity factor | 25% | Synthetic — a reasonable blended average across the mixed tech set (solar ~15-25%, onshore wind ~30-40%, offshore wind ~45%+), but applying one flat 25% to *all* technologies understates offshore wind and overstates solar |
| P90 downside | 75–90% of P50 | Synthetic — directionally correct (P90 < P50 by construction) but not derived from an actual exceedance-probability distribution |
| Degradation annual rate | embedded `0.3–0.7%/yr` (from `0.3+sr()×0.4`) | **Closely matches** the guide's cited NREL 2023 figure of "0.5–0.7%/yr" at the upper half of its range, though the code's floor (0.3%/yr) sits below NREL's stated floor (0.5%/yr) — a reasonable approximation, not an exact reproduction |
| O&M cost | $8–30/MWh | Broadly consistent with the guide's cited WindEurope "€15–25/MWh" figure, though the code's range extends both below and above that band and mixes currency (guide €, code implicitly $) |
| Availability | 90–99% | Synthetic — plausible operational range for wind/solar (typical technical availability 95-98%) |
| Revenue price | $45–80/MWh | Synthetic PPA/merchant price assumption |

### 7.3 Calculation walkthrough

1. **Asset generation**: tech/status/region/O&M-contract-type drawn via `sr()`; capacity 10–500MW;
   age 0.5–20 years; P50/P90/actual generation cascade (§7.1); degradation; availability; O&M cost;
   revenue; EBITDA margin (55–85%); `remainingLife = 25 − ageYears` (flat 25-year design life
   assumption across all technologies, including offshore wind which typically has a similar or
   slightly shorter design life — reasonable as a simplification); insurance value; curtailment
   (0–12%); next major service (1–8 years out).
2. **Portfolio aggregates**: `totalRevenue`, `totalP50`, `totalActual`, `avgAvailability`,
   `avgDegradation`, `p50Achievement = totalActual/totalP50×100` (guarded for zero).
3. **By-technology breakdown** (`byTech`): per-technology revenue, P50/P90/actual, achievement %,
   average P50/P90 (with `downside = (avgP50−avgP90)/avgP50×100`, correctly guarded), average
   O&M cost, average availability — all guarded with `arr.length ?` checks (no division-by-zero
   risk found in this file).
4. **Degradation Analysis tab**: plots `degradationPct` vs `ageYears` — a straight-line
   relationship by construction, since `degradationPct` is defined as a linear function of
   `ageYears`.
5. **O&M Optimisation tab**: `omCostMwh` distribution and averages by technology/contract type.
6. **Availability & Curtailment tab**: `availability` and `curtailmentPct` by technology/region.
7. **Revenue Performance tab**: `revenueM` and `ebitdaMargin` breakdowns.
8. **Asset Life Management tab**: `remainingLife`, `nextMajorService` — no repowering IRR or
   capex-per-MWh calculation despite being the guide's named methodology and a headline data point
   ("Repowering Value +30-50% capacity uplift").

### 7.4 Worked example

Asset with `capacityMw=200` (Wind Onshore), `ageYears=8.5`, illustrative mid-range noise draws:

| Step | Formula | Result |
|---|---|---|
| `p50Gwh` | `200×0.25×8760/1000×1.0` | **438.0 GWh** |
| `p90Gwh` | `438.0×0.825` (mid of 0.75–0.90) | **361.4 GWh** |
| `actualGwh` | `438.0×1.0` (mid of 0.85–1.15) | **438.0 GWh** |
| `p50Achievement` (asset-level) | `438.0/438.0×100` | **100%** |
| `degradationPct` | `0.3+8.5×0.5` (mid rate) | `0.3+4.25=` **4.55%** cumulative |
| Implied annual rate | `4.55/8.5` | **≈0.54%/yr** — within NREL's cited 0.5–0.7%/yr band |
| `omCostMwh` | mid-range | **≈$19/MWh** |
| `revenueM` | `438.0×62.5/1000` (mid price) | **≈$27.4M** |

### 7.5 Rubric

| Field | Range |
|---|---|
| Availability | 90–99% |
| Curtailment | 0–12% |
| EBITDA margin | 55–85% |
| Remaining life | `25 − age` years (flat 25-yr design life) |

### 7.6 Companion analytics

Asset Overview, Asset Register (filterable table), P50/P90 Generation, Degradation Analysis, O&M
Optimisation, Availability & Curtailment, Revenue Performance, Asset Life Management.

### 7.7 Data provenance & limitations

- **All assets are synthetic**, `sr(seed)=frac(sin(seed+1)×10⁴)`.
- **No true Performance Ratio is computed** — the guide's `PR = Actual/(Irradiation×Capacity)`
  requires measured irradiance data that doesn't exist in this schema; `p50Gwh` is a capacity-
  factor-based generation estimate instead, which is a coarser proxy (PR isolates weather-adjusted
  technical performance, whereas capacity factor conflates resource quality with technical
  performance).
- **A single flat 25% capacity factor is applied across all 5 technologies** including offshore
  wind (typically 45%+) and battery storage (not meaningfully a "capacity factor" concept at all)
  — this materially understates offshore wind generation and misapplies the metric to storage
  assets.
- **No repowering economics, CapEx/MWh, or SCADA-derived loss-category breakdown** exists despite
  all three being named in the guide's methodology and data points.
- `availability` is disconnected from any actual fault/downtime log — a genuine SCADA-integrated
  system would derive it from `OperatingHours/TotalHours`, not a random draw.

**Framework alignment:** IEA PVPS Task 13 / WindEurope O&M Best Practices — cited for O&M cost
benchmarking; the code's O&M cost range is directionally consistent but not derived from either
source's actual published cost-breakdown methodology · NREL degradation study — the code's
embedded annual degradation rate (0.3-0.7%/yr) closely tracks NREL's cited 0.5-0.7%/yr figure ·
IEC 61400 / BloombergNEF Repowering — referenced by the guide, not implemented (no wind turbine
performance-curve or repowering-uplift calculation exists in this file).
