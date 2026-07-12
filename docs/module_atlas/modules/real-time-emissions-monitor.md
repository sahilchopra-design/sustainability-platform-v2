# Real-Time Emissions Monitor
**Module ID:** `real-time-emissions-monitor` · **Route:** `/real-time-emissions-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Live GHG emissions monitoring dashboard ingesting IoT sensor data, smart meter feeds, and real-time activity data for near-real-time Scope 1 and 2 tracking.

> **Business value:** Enables facilities and sustainability teams to move beyond annual GHG accounting to continuous operational emissions monitoring with real-time anomaly detection.

**How an analyst works this module:**
- Connect IoT and smart meter data feeds via API or MQTT.
- Configure emission factors per source and energy type.
- Monitor live emission dashboard with site and source drilldown.
- Set anomaly alerts for emission rate exceedances.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_TYPES`, `COMPLIANCE_STATUSES`, `FACILITIES`, `PATHWAY_YEARS`, `REGIONS`, `SECTORS`, `VERIFICATION_STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COMPLIANCE_STATUSES` | `['Compliant','Non-Compliant','Pending Review','Exempt'];` |
| `sectorIdx` | `Math.floor(sr(i * 7) * SECTORS.length);` |
| `regionIdx` | `Math.floor(sr(i * 11) * REGIONS.length);` |
| `permitLimit` | `50 + sr(i * 13) * 950; // ktCO2e` |
| `budgetUtilization` | `0.4 + sr(i * 17) * 0.8;` |
| `scope1Current` | `parseFloat((permitLimit * budgetUtilization).toFixed(1));` |
| `scope1Variance` | `parseFloat((scope1Current - scope1Budget).toFixed(1));` |
| `scope2Location` | `parseFloat((scope1Current * (0.1 + sr(i * 19) * 0.3)).toFixed(1));` |
| `scope2Market` | `parseFloat((scope2Location * (0.5 + sr(i * 23) * 0.8)).toFixed(1));` |
| `scope3Up` | `parseFloat((scope1Current * (0.3 + sr(i * 29) * 0.7)).toFixed(1));` |
| `anomalyScore` | `parseFloat((sr(i * 31) * 100).toFixed(1));` |
| `complianceIdx` | `Math.floor(sr(i * 37) * COMPLIANCE_STATUSES.length);` |
| `verIdx` | `Math.floor(sr(i * 41) * VERIFICATION_STATUSES.length);` |
| `emissionFactor` | `parseFloat((0.1 + sr(i * 43) * 2).toFixed(3));` |
| `obs` | `scope1Current * (0.8 + sr(i * 100 + t) * 0.4);` |
| `PATHWAY_YEARS` | `Array.from({ length: 26 }, (_, i) => 2025 + i);` |
| `tabs` | `['Monitoring Dashboard','Facility Table','Anomaly Detection','Permit Compliance','Scope 2 Dual-Reporting','Reduction Pathways','Summary & Export'];` |
| `kpis` | `useMemo(() => { const total = FACILITIES.reduce((s, f) => s + f.scope1Current, 0);` |
| `budget` | `FACILITIES.reduce((s, f) => s + f.scope1Budget, 0);` |
| `avgAnomaly` | `FACILITIES.reduce((s, f) => s + f.anomalyScore, 0) / FACILITIES.length;` |
| `topEmitters` | `useMemo(() => { return [...FACILITIES].sort((a, b) => b.scope1Current - a.scope1Current).slice(0, 20).map(f => ({ name: f.name.split(' ').slice(0, 3).join(' '), actual: f.scope1Current, budget: f.scope1Budget, }));` |
| `anomalyFacilities` | `useMemo(() => { return [...FACILITIES].filter(f => f.anomalyScore >= anomalyThreshold).sort((a, b) => b.anomalyScore - a.anomalyScore);` |
| `scope2Comparison` | `useMemo(() => { return sectorStats.map(s => { const facilities = FACILITIES.filter(f => f.sector === s.sector);` |
| `avgLocation` | `facilities.length > 0 ? facilities.reduce((a, f) => a + f.scope2Location, 0) / facilities.length : 0;` |
| `avgMarket` | `facilities.length > 0 ? facilities.reduce((a, f) => a + f.scope2Market, 0) / facilities.length : 0;` |
| `baseTotal` | `facilities.reduce((a, f) => a + f.scope1Current, 0);` |
| `complianceColor` | `(c) => ({ Compliant: T.green, 'Non-Compliant': T.red, 'Pending Review': T.amber, Exempt: T.teal }[c] \|\| T.muted);` |
| `avgUtil` | `secFacilities.reduce((s,f)=>s+f.permitUtilization,0)/secFacilities.length;` |
| `avgEF` | `secFacilities.length>0 ? secFacilities.reduce((s,f)=>s+f.emissionFactor,0)/secFacilities.length : 0;` |
| `minEF` | `secFacilities.length>0 ? Math.min(...secFacilities.map(f=>f.emissionFactor)) : 0;` |
| `maxEF` | `secFacilities.length>0 ? Math.max(...secFacilities.map(f=>f.emissionFactor)) : 0;` |
| `totalEmissions` | `countryFacilities.reduce((s,f)=>s+f.scope1Current,0);` |
| `qualityScore` | `secFacilities.length>0 ? ((verified*100+pending*50)/secFacilities.length).toFixed(0) : 0;` |
| `count` | `Math.floor(sr(seed+ai*7)*15);` |
| `avgS1` | `facilities.length>0 ? facilities.reduce((a,f)=>a+f.scope1Current,0)/facilities.length : 0;` |
| `avgS3` | `facilities.length>0 ? facilities.reduce((a,f)=>a+f.scope3Upstream,0)/facilities.length : 0;` |
| `ratio` | `avgS1>0 ? avgS3/avgS1 : 0;` |
| `dqPct` | `total>0 ? Math.round(verifiedCount/total*100) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERT_TYPES`, `COMPLIANCE_STATUSES`, `REGIONS`, `SECTORS`, `VERIFICATION_STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Live Scope 1 Rate (tCO₂e/hr) | — | IoT Sensor Network | Current Scope 1 emission rate from connected on-site combustion and process sources. |
| MTD Emissions (tCO₂e) | — | Accumulated Totals | Month-to-date accumulated GHG emissions across all monitored sites. |
| Sensor Uptime (%) | — | IoT Telemetry | Proportion of monitored sensors reporting within expected latency threshold. |
- **IoT sensor streams + smart meter feeds + manual activity data** → Real-time EF multiplication; aggregation; anomaly detection → **Live emissions dashboard, MTD totals, and anomaly alerts**

## 5 · Intermediate Transformation Logic
**Methodology:** Real-Time Emission Rate
**Headline formula:** `Eẖ = Σ(Aᵢ(t) × EFᵢ) aggregated per 15-min interval`

Summation of activity-rate-times-emission-factor across all monitored sources at sub-hourly resolution.

**Standards:** ['GHG Protocol Corporate Standard', 'IPIECA Continuous Emissions Monitoring']
**Reference documents:** GHG Protocol Corporate Accounting and Reporting Standard (2015); ISO 14064-1:2018 Quantification of GHG Emissions

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — A real activity×EF ingestion chain with reconciled anomaly signals (analytics ladder: rung 1 → 2)

**What.** §7.7 shows the "real-time" framing is aspirational: 80 procedurally named facilities, period-indexed synthetic series (no sub-hourly resolution despite the guide's headline), an `emissionFactor` field displayed but never used to derive `scope1Current` (the activity×EF chain is absent), and two coexisting unreconciled anomaly signals (static `anomalyScore` vs live `ewmaHistory`). Evolution A builds the module's first genuine pipeline: metered activity data in, emission factors applied server-side, one anomaly detector.

**How.** (1) A `facility_meter_readings` table plus `POST /api/v1/emissions-monitor/readings` ingest (CSV/API; MQTT can wait — honest batch beats fake streaming), with `emissions = activity × EF` computed per reading using per-source factors from the refdata EF tables, finally implementing the guide's chain. (2) One anomaly method: the EWMA control-band logic the page already computes per selection becomes the stored, alert-generating signal; the static `anomalyScore` draw is deleted. (3) Scope-2 dual reporting derives from metered kWh × location-based grid factor vs contractual instruments — structurally correct in the current UI, now with real operands. (4) Reduction pathways gain sector-specific shapes (the flat linear-to-zero treats steel and power identically, as §7.7 notes) sourced from documented sector trajectories.

**Prerequisites.** At least one real or fixture meter dataset for development (open smart-meter samples suffice); EF table coverage for the six sectors. **Acceptance:** a facility's displayed emissions reproduce as Σ(activity × EF) over its readings; exactly one anomaly signal exists and alerts fire from stored breaches, not seeded scores.

### 9.2 Evolution B — Operations copilot on the alert stream (LLM tier 2)

**What.** Facilities teams live in the alert queue. The copilot triages it: "why did Delta Cement Plant 3 breach its EWMA band on Tuesday?" (decomposed from the readings: which meter, which source category, activity spike vs EF change), "summarize this month's permit-utilization risk for the compliance report", "which sectors are drifting from their reduction pathway?" — every claim from readings, computed bands, and permit rows.

**How.** Tier-2 tool schemas over the Evolution-A endpoints (readings query, anomaly history, permit compliance, pathway status); the copilot's decomposition follows the module's own arithmetic — an emissions delta must be attributed to activity or factor terms that sum to it, enforced by the no-fabrication validator. Permit-compliance narratives quote the stored permit limit and current utilization; the copilot never speculates about regulatory consequences beyond the module's status taxonomy (Compliant/Non-Compliant/Pending/Exempt). Alert-response suggestions are constrained to the source-category vocabulary in the data.

**Prerequisites (hard).** Evolution A — a triage copilot over seeded anomalies would generate confident nonsense about facilities that don't exist; alert persistence. **Acceptance:** a breach explanation's activity/EF decomposition sums to the observed delta; monthly summaries reproduce from stored aggregates; no facility outside the register is ever discussed.