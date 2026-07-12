## 7 · Methodology Deep Dive

### 7.1 What the module computes

80 synthetic facilities across 12 sectors carry a permit budget, a current Scope 1/2/3 emissions
snapshot, and an **EWMA (exponentially-weighted moving average) anomaly-detection** series — a
genuine, correctly-implemented statistical technique, layered on top of synthetic data.

```js
scope1Current = permitLimit × budgetUtilization                    // ktCO2e, NOT activity×EF
ewma_t = λ·ewma_{t-1} + (1−λ)·obs_t,  λ = 0.94                      // real EWMA recursion
upper/lower control band = ewma × 1.15 / ewma × 0.85                // ±15% control limits
alertType = anomalyScore>80 'Critical' : >60 'Breach' : >35 'Warning' : 'None'
```

**Guide gap:** the guide's stated formula is a true sub-hourly activity model, `Eṫ =
Σ(Aᵢ(t)×EFᵢ)` aggregated per 15-minute interval — i.e. `scope1Current` should be *derived from*
`emissionFactor` × some activity-rate field. In the code, `emissionFactor` (0.1–2.1, a per-facility
constant) is generated **independently** and never multiplies into `scope1Current`, which is
instead a direct fraction of the facility's permit limit. There is no 15-minute (or any
sub-annual) time resolution — `trend`/`ewmaHistory` are 5–20 synthetic *periods*, not timestamped
sensor readings. The EWMA/anomaly-detection layer itself, however, is real statistics correctly
applied on top of that synthetic base.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `permitLimit` | `50 + sr()×950` ktCO2e | Synthetic — spans small-to-large industrial facility scale |
| `budgetUtilization` | `0.4 + sr()×0.8` (40–120% of permit) | Synthetic — deliberately allows values >100% to generate breaches |
| EWMA decay `λ` | 0.94 | Standard EWMA smoothing constant (commonly 0.9–0.97 in SPC/process-control practice; not sourced to a specific standard but within accepted range) |
| Control band | `ewma × [0.85, 1.15]` (±15%) | Synthetic — analogous in spirit to Shewhart 3σ control limits but expressed as a flat % band, not derived from the series' own variance |
| Alert thresholds | Warning>35, Breach>60, Critical>80 (on 0–100 `anomalyScore`) | UI heuristic |
| Scope 2 location/market spread | `location = scope1×(0.1+sr()×0.3)`; `market = location×(0.5+sr()×0.8)` | Synthetic — market-based can be above or below location-based, consistent with GHG Protocol Scope 2 guidance allowing either direction depending on contractual instruments |
| `reductionTarget2030` / `2050` | `20+sr()×45` / `65+sr()×35` (%) | Synthetic, ordinally consistent with typical corporate net-zero pledge shapes (partial 2030 cut, deep 2050 cut) |

### 7.3 Calculation walkthrough

1. **Facility generation** (80 rows): sector/region/country, permit budget & current emissions,
   Scope 2 dual-reporting pair, Scope 3 upstream proxy, `anomalyScore` (0–100, independent `sr()`
   draw — not actually derived from the EWMA series described below), compliance/verification
   status, a 5-point synthetic `trend` array run through one EWMA pass at generation time.
2. **Filters & table** (`filteredFacilities`): sector/alert/compliance/region/text filters, then
   client-side sort.
3. **Portfolio KPIs** (`kpis`, computed once over all 80 facilities, not the filtered set):
   `totalEmissions`, `totalBudget`, `utilizationRate = total/budget×100`, `breaches` (count
   Breach+Critical), `compliant` (count), `avgAnomaly`.
4. **Sector rollup** (`sectorStats`): group-by sums/means of emissions, budget, anomaly, plus
   `utilization = total/budget×100` per sector.
5. **Top emitters** (`topEmitters`): top 20 facilities by `scope1Current`, actual vs budget bar.
6. **Anomaly detection tab**: `anomalyFacilities` filters the 80 by a user-adjustable
   `anomalyThreshold` (default 40) against the pre-generated `anomalyScore` — this is a static
   threshold screen, not a live recomputation of the EWMA/control-band logic.
7. **Facility drill-down EWMA** (`ewmaHistory`, on facility selection): regenerates a fresh
   20-period synthetic observation series (`obs_t = base×(0.7+sr()×0.6)`) and runs the *same*
   `λ=0.94` recursion live, plotting `observed` vs `ewma` vs `±15%` control band — this is the one
   genuinely reactive statistical computation in the module (distinct from the static
   `anomalyScore` used for filtering/alerts, which is never reconciled with this live EWMA).
8. **Scope 2 dual-reporting** (`scope2Comparison`): per-sector average location-based vs
   market-based Scope 2, `gap = location − market` — correctly implements the GHG Protocol's dual
   reporting requirement conceptually (both methods shown side by side).
9. **Reduction pathways tab**: for the first 6 sectors, projects `2025–2050` emissions declining
   linearly (`reduction = i/25`, i.e. straight-line to ~100% reduction by 2050) off each sector's
   current `scope1Current` total — a simple linear decarbonisation illustration, not a
   sector-specific abatement-cost-curve pathway.

### 7.4 Worked example

Facility `i=0` (sector index from `sr(0)`, e.g. "Power"):

| Step | Formula | Result |
|---|---|---|
| `permitLimit` | `50+sr(0)×950`; `sr(0)=frac(sin(1)×10⁴)≈0.4108` | `50+390.3=` **440.3 ktCO2e** |
| `budgetUtilization` | `0.4+sr(0)×0.8` — note: `sr(i*17)` at i=0 is `sr(0)`, same value reused across different seed multipliers when i=0 (a quirk of `i*k=0` for all k at i=0) | ≈ **0.729** |
| `scope1Current` | `440.3×0.729` | ≈ **321.0 ktCO2e** |
| `permitUtilization` | `321.0/440.3×100` | **72.9%** |
| `anomalyScore` | independent `sr(31×0)=sr(0)` (same collision) | ≈ **41.1** |
| `alertType` | `41.1>35` | **Warning** |

(Note: because every `i*k` term equals 0 when `i=0`, facility index 0 draws several of its fields
from the *same* `sr(0)` value — a minor seeding artefact of the `sr(i*k)` pattern for the
first-index row specifically; all other facilities `i≥1` have distinct seeds per field.)

### 7.5 Compliance & data-quality rubric

| Field | Categories |
|---|---|
| `complianceStatus` | Compliant / Non-Compliant / Pending Review / Exempt (uniform random) |
| `verificationStatus` | Verified / Estimated / Pending (uniform random) |
| Data-quality KPI (`dqPct`, in Summary tab) | `verifiedCount/total×100` |

### 7.6 Companion analytics

Monitoring Dashboard (KPI band + top-emitters + sector chart), Facility Table (sortable/filterable
80-row grid), Anomaly Detection (threshold-filtered list + selected-facility live EWMA chart),
Permit Compliance (utilization vs limit by sector), Scope 2 Dual-Reporting (location vs market gap
by sector), Reduction Pathways (linear 2025–2050 projection), Summary & Export.

### 7.7 Data provenance & limitations

- **All 80 facilities are synthetic**, `sr(seed)=frac(sin(seed+1)×10⁴)`; names are procedurally
  generated (Greek-letter + sector + plant number), not real industrial sites.
- No sub-hourly/15-minute IoT resolution exists despite being the guide's headline methodology —
  the "real-time" framing is aspirational; all series shown are period-indexed synthetic arrays.
- `emissionFactor` is displayed (per facility, in the compliance/EF tabs) but never actually used
  to derive `scope1Current` — the activity×EF chain the guide describes is absent.
- The static `anomalyScore` used for alerting/filtering is never reconciled with the live
  `ewmaHistory` recomputed on facility selection — two different "anomaly" signals coexist for the
  same facility without cross-validation.
- Reduction pathway is a flat linear interpolation to zero by 2050, not a sector-specific
  abatement curve (e.g. steel/cement decarbonisation is technically much harder near-term than
  power-sector decarbonisation — the model treats all 6 sectors identically).

**Framework alignment:** GHG Protocol Corporate Standard — Scope 1/2/3 categorisation and the
location-based/market-based Scope 2 dual-reporting requirement are both structurally correct ·
ISO 14064-1 — referenced for quantification, not literally implemented (no measurement-uncertainty
field) · EWMA/statistical process control — the λ=0.94 control-band technique is a legitimate,
correctly-coded anomaly-detection method, though its ±15% band is a flat heuristic rather than a
variance-derived control limit (a true Shewhart/EWMA chart would set limits from the observed
series' standard deviation, not a fixed percentage).
