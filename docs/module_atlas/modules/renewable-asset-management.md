# Renewable Asset Management Analytics
**Module ID:** `renewable-asset-management` · **Route:** `/renewable-asset-management` · **Tier:** B (frontend-computed) · **EP code:** EP-DO6 · **Sprint:** DO

## 1 · Overview
Provides operational analytics for managing renewable energy asset portfolios — performance monitoring, O&M optimisation, degradation tracking, repowering economics, and SCADA data integration. Models asset life extension value, repowering IRR, and portfolio yield optimisation.

> **Business value:** Essential for renewable energy fund asset managers, independent power producers, and infrastructure investors managing operating wind/solar portfolios. Provides IEA/WindEurope best practice O&M analytics and repowering economics for yield optimisation and lender reporting.

**How an analyst works this module:**
- Monitor operating portfolio performance vs P50 budget
- Track degradation vs expected profile
- Optimise O&M spend by component and intervention type
- Model repowering economics and timing decision
- Generate lender reporting and insurance compliance documentation

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSETS`, `ASSET_STATUS`, `KpiCard`, `MiniBar`, `OM_CONTRACTS`, `REGIONS`, `TABS`, `TECHNOLOGIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TECHNOLOGIES` | `['Solar PV','Wind Onshore','Wind Offshore','Battery Storage','Hybrid Solar+Wind'];` |
| `OM_CONTRACTS` | `['Full-Service O&M','Limited O&M','Self-Perform','Hybrid'];` |
| `tech` | `TECHNOLOGIES[Math.floor(sr(i*7+1)*TECHNOLOGIES.length)];` |
| `status` | `ASSET_STATUS[Math.floor(sr(i*11+2)*ASSET_STATUS.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*13+3)*REGIONS.length)];` |
| `omContract` | `OM_CONTRACTS[Math.floor(sr(i*17+4)*OM_CONTRACTS.length)];` |
| `capacityMw` | `Math.round(10 + sr(i*19+5)*490);` |
| `ageYears` | `parseFloat((0.5 + sr(i*23+6)*19.5).toFixed(1));` |
| `p50Gwh` | `parseFloat((capacityMw * 0.25 * 8760 / 1000 * (0.8 + sr(i*29+7)*0.4)).toFixed(1));` |
| `p90Gwh` | `parseFloat((p50Gwh * (0.75 + sr(i*31+8)*0.15)).toFixed(1));` |
| `actualGwh` | `parseFloat((p50Gwh * (0.85 + sr(i*37+9)*0.3)).toFixed(1));` |
| `degradationPct` | `parseFloat((0.3 + ageYears * (0.3 + sr(i*41+1)*0.4)).toFixed(2));` |
| `availability` | `parseFloat((90 + sr(i*43+2)*9).toFixed(1));` |
| `omCostMwh` | `parseFloat((8 + sr(i*47+3)*22).toFixed(1));` |
| `revenueM` | `parseFloat((actualGwh * (45 + sr(i*53+4)*35) / 1000).toFixed(1));` |
| `ebitdaMargin` | `parseFloat((55 + sr(i*59+5)*30).toFixed(1));` |
| `remainingLife` | `Math.round(25 - ageYears);` |
| `insuranceValue` | `parseFloat((capacityMw * (0.6 + sr(i*61+6)*0.6)).toFixed(0));` |
| `curtailmentPct` | `parseFloat((sr(i*67+7)*12).toFixed(1));` |
| `nextMajorService` | `Math.round(1 + sr(i*71+8)*7);` |
| `TABS` | `['Asset Overview','Asset Register','P50 / P90 Generation','Degradation Analysis','O&M Optimisation','Availability & Curtailment','Revenue Performance','Asset Life Management'];` |
| `totalRevenue` | `filtered.reduce((s, a) => s + a.revenueM, 0);` |
| `totalP50` | `filtered.reduce((s, a) => s + a.p50Gwh, 0);` |
| `totalActual` | `filtered.reduce((s, a) => s + a.actualGwh, 0);` |
| `avgAvailability` | `filtered.reduce((s, a) => s + a.availability, 0) / n;` |
| `avgDegradation` | `filtered.reduce((s, a) => s + a.degradationPct, 0) / n;` |
| `p50Achievement` | `totalP50 > 0 ? (totalActual / totalP50 * 100) : 0;` |
| `byTech` | `TECHNOLOGIES.map(t => {` |
| `colors` | `{ 'Solar PV': T.gold, 'Wind Onshore': T.sage, 'Wind Offshore': T.blue, 'Battery Storage': T.purple, 'Hybrid Solar+Wind': T.teal };` |
| `rev` | `arr.reduce((s,a)=>s+a.revenueM,0);` |
| `p50` | `arr.reduce((s,a)=>s+a.p50Gwh,0);` |
| `p90` | `arr.reduce((s,a)=>s+a.p90Gwh,0);` |
| `actual` | `arr.reduce((s,a)=>s+a.actualGwh,0);` |
| `ach` | `p50 > 0 ? (actual / p50 * 100) : 0;` |
| `avgP50` | `arr.length ? arr.reduce((s,a)=>s+a.p50Gwh,0)/arr.length : 0;` |
| `avgP90` | `arr.length ? arr.reduce((s,a)=>s+a.p90Gwh,0)/arr.length : 0;` |
| `downside` | `avgP50 > 0 ? ((avgP50-avgP90)/avgP50*100) : 0;` |
| `avg` | `arr.length ? arr.reduce((s,a)=>s+a.omCostMwh,0)/arr.length : 0;` |
| `avgCost` | `arr.length ? arr.reduce((s,a)=>s+a.omCostMwh,0)/arr.length : 0;` |
| `avgAvail2` | `arr.length ? arr.reduce((s,a)=>s+a.availability,0)/arr.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_STATUS`, `OM_CONTRACTS`, `REGIONS`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Solar Degradation Rate | — | NREL Degradation Study 2023 | c-Si solar module output degrades 0.5–0.7% per year — important for 25–30 year asset life modelling |
| Wind O&M Cost | — | WindEurope O&M 2023 | Onshore wind O&M cost €15–25/MWh representing 20–30% of LCOE over asset life |
| Repowering Value | — | BloombergNEF Repowering 2023 | Turbine repowering can increase capacity 30–50% on same grid connection and planning permission |
- **SCADA/inverter data (5-min intervals)** → Performance monitoring → **Actual vs expected generation, losses by category (shading, soiling, inverter)**
- **Component failure database + replacement costs** → O&M optimisation → **Predictive maintenance scheduling and budget optimisation**
- **Repowering cost models + updated energy yield assessment** → Repowering decision → **IRR improvement and capacity uplift from repowering options**

## 5 · Intermediate Transformation Logic
**Methodology:** Renewable Asset Performance
**Headline formula:** `PR_actual = ActualGeneration / (Irradiation × InstalledCapacity); Availability = OperatingHours / TotalHours; CapexPerMWh = LifetimeCapex / LifetimeGeneration`

Performance ratio benchmarks actual vs theoretical generation; availability tracks technical reliability; lifetime CapEx/MWh incorporates repowering and major component replacement economics

**Standards:** ['IEA PVPS Task 13 — O&M Best Practices Solar PV', 'WindEurope O&M Best Practices 2023', 'IRENA Renewable Asset Management 2022', 'IEC 61400 Wind Turbine Performance Standards']
**Reference documents:** IEA PVPS Task 13 — Best Practices in PV O&M (2022); WindEurope O&M and Asset Management Best Practices 2023; IRENA Renewable Power Generation — Best Practices Asset Management 2022; IEC 61400-12-1 Wind Energy Performance Measurement

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

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

## 9 · Future Evolution

### 9.1 Evolution A — Weather-adjusted performance analytics on ingested resource data (analytics ladder: rung 1 → 2)

**What.** §7 documents three unimplemented guide formulas: no true performance ratio (`PR = Actual/(Irradiation × Capacity)` needs measured irradiance that isn't in the schema — the code substitutes a capacity-factor proxy that conflates resource quality with technical performance), no availability from a downtime log (it's a 90–99% random draw), and no repowering/CapEx-per-MWh economics at all. Worse, a flat 25% capacity factor is applied to all five technologies including offshore wind (~45%+) and battery storage, where the metric doesn't even apply. Evolution A builds the weather-adjusted layer using resource data the platform already ingests.

**How.** (1) Per-asset expected generation from location: NASA POWER GHI/wind-speed (already wired into `renewable_project_engine` as an optional lat/lon path — reuse it) gives the irradiation denominator, so `PR = actual / (irradiance × capacity × η_ref)` becomes computable for solar, with wind analogues via the engine's Weibull machinery; technology-appropriate metrics per class (PR for solar, energy-based availability for wind, round-trip efficiency and cycles for storage — retiring the misapplied CF). (2) Generation/downtime intake via CSV (monthly meter data is universally exportable; SCADA integration is a later increment) into `ram_asset_readings`. (3) Repowering economics as a real calculation: incremental capex vs uplifted yield, reusing the platform's LCOE/CRF engine (`/renewable-ppa/lcoe`). (4) Technology-specific CF defaults where measurements are absent, flagged as estimates.

**Prerequisites.** Reading-intake schema; NASA POWER call budget for portfolio-scale enrichment. **Acceptance:** a solar asset's PR responds to both its meter data and its location's irradiance; offshore wind default CF differs from solar's; a repowering case reproduces a hand-computed IRR.

### 9.2 Evolution B — Portfolio-performance review copilot (LLM tier 2)

**What.** Asset managers run monthly performance reviews. The copilot drafts them: "which assets underperformed P50 by more than 5% this quarter, and is it resource or technical?" — the resource-vs-technical split being exactly what the Evolution-A PR decomposition answers (low irradiance vs low PR); "draft the lender report section on availability and degradation trends"; "rank repowering candidates by computed IRR". Each is a tool call over readings, PR calculations, and the repowering endpoint.

**How.** Tier-2 tool schemas over the Evolution-A endpoints; the underperformance decomposition is mechanical (generation delta = resource delta × capacity + PR delta × resource) and the copilot must present both terms so weather excuses are quantified, not asserted. Lender-report drafts follow the module's cited IEA/WindEurope conventions from the corpus and render via report studio. Guardrails: assets with estimate-flagged CFs are labelled as such in any ranking; no forecast claims (this module is operational analytics; forecasting belongs to `renewable-ml-forecasting`, and the copilot routes there).

**Prerequisites (hard).** Evolution A's readings and PR machinery — reviewing seeded availability draws would produce fictional performance narratives; per-field estimate flags. **Acceptance:** the resource/technical split sums to the observed delta; report figures match endpoint output; estimate-based rows carry their flag into generated text.