# IoT Emissions Tracker
**Module ID:** `iot-emissions-tracker` · **Route:** `/iot-emissions-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time GHG emission monitoring platform ingesting data from IoT sensors deployed across industrial assets, buildings, and vehicle fleets. Converts raw sensor telemetry (energy, flow, temperature, mass) into continuous Scope 1 and Scope 2 emission streams with sub-hourly granularity. Supports automated CEMS-equivalent reporting and deviation alerting against emission reduction targets.

> **Business value:** Gives operations and sustainability teams a live view of facility-level GHG performance, enabling rapid response to emission exceedances and providing auditable continuous monitoring data for regulatory reporting and voluntary disclosure.

**How an analyst works this module:**
- Configure asset registry with sensor IDs, asset type, location, and emission source category
- Set telemetry polling intervals and data quality thresholds for each sensor stream
- Review real-time emission dashboard showing current rates, cumulative totals, and target tracking
- Drill into individual assets to view time-series telemetry, anomaly flags, and gap-fill substitutions
- Schedule automated regulatory reports (daily/monthly) and export CEMS-format data for EPA or environment agency submission

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `COUNTRIES`, `FAC_NAMES`, `FAC_SUFFIX`, `INDUSTRIES`, `SENSOR_TYPES`, `SENSOR_UNITS`, `TabBtn`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SENSOR_UNITS` | `['ppm','ppm-m','mg/m3','\u00b0C','m3/h','vol%','km/h','kWh'];` |
| `ind` | `INDUSTRIES[Math.floor(sr(i*3)*12)];` |
| `sensorCt` | `Math.floor(sr(i*13)*6)+2;` |
| `emRate` | `Math.round((sr(i*17)*8+0.5)*100)/100;` |
| `fIdx` | `Math.floor(i*60/200);` |
| `typeIdx` | `Math.floor(sr(i*7)*8);` |
| `totalEmissions` | `useMemo(()=>facilities.reduce((a,f)=>a+f.scope1+f.scope2+f.scope3,0),[]);` |
| `avgQuality` | `Math.round(sensors.reduce((a,s)=>a+s.dataQuality,0)/sensors.length*10)/10;` |
| `rows` | `facilities.map(f=>[f.name,f.industry,f.country,f.city,f.scope1,f.scope2,f.scope3,` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `compData` | `compareFacilities.map(f=>({` |
| `fHourly` | `hourlyData.map((h,i)=>({` |
| `mfrCounts` | `{};sensors.forEach(s=>{mfrCounts[s.manufacturer]=(mfrCounts[s.manufacturer]\|\|0)+1;});` |
| `mfrData` | `Object.entries(mfrCounts).map(([m,c])=>({name:m,count:c})).sort((a,b)=>b.count-a.count);` |
| `industryBenchmarks` | `INDUSTRIES.map((ind,i)=>({` |
| `forecastData` | `monthlyHistory.map((m,i)=>({` |
| `rcData` | `Object.entries(rootCauseSummary).map(([k,v])=>({cause:k,count:v}));` |
| `completePct` | `filteredCompliance.length?Math.round(filteredCompliance.filter(c=>c.status==='complete').length/filteredCompliance.length*100):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `COUNTRIES`, `FAC_NAMES`, `FAC_SUFFIX`, `INDUSTRIES`, `SENSOR_TYPES`, `SENSOR_UNITS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sensor Update Frequency | — | IoT gateway configuration | Sub-hourly telemetry enabling intra-day emission trend detection |
| Data Completeness (%) | — | Internal QA threshold | Proportion of expected telemetry records received within reporting window |
| Emission Intensity (tCO2e/MWh) | — | Real-time computation | Production-normalised emission rate for operational benchmarking |
| Alert Threshold Breach Count | — | Configurable alarm rules | Number of periods exceeding set emission rate limits triggering operational review |
- **IoT sensor telemetry via MQTT / REST gateway** → Validate timestamps and unit consistency; apply QAQC flags; substitute gaps → **Clean 15-minute emission stream per asset**
- **Emission factor lookup (fuel, grid zone)** → Match asset fuel type and grid region; apply real-time marginal grid intensity where available → **Per-asset emission rate in tCO2e per interval**
- **Target baseline file** → Compare cumulative emissions to trajectory; compute variance and days-to-target breach → **Real-time target tracking dashboard and alert queue**

## 5 · Intermediate Transformation Logic
**Methodology:** Continuous Emission Monitoring
**Headline formula:** `Eᵤₜ = Σᵢ (Fᵢₜ × Cᵢₜ × MW_CO₂ / MWᵢ)`

Mass emission is computed from measured flow rate (F) and measured or default concentration (C) for each pollutant stream. For energy-based sensors, stack emission factors replace concentration measurement. Data gaps are filled using EPA-approved substitution algorithms (hourly averages, look-back periods) to maintain reporting continuity.

**Standards:** ['US EPA 40 CFR Part 75 CEMS', 'ISO 14064-1:2018', 'IEC 62056 DLMS/COSEM metering standard', 'GHG Protocol Corporate Standard']
**Reference documents:** US EPA 40 CFR Part 75 â€” Continuous Emission Monitoring Systems; ISO 14064-1:2018 â€” GHG Quantification and Reporting; IEA Energy Efficiency Indicators Manual 2014; IPCC 2006 Guidelines for National GHG Inventories â€” Volume 2 Energy

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **CEMS continuous-monitoring
> engine** — mass emission from measured flow × concentration `Eᵤₜ = Σᵢ(Fᵢₜ × Cᵢₜ × MW_CO₂/MWᵢ)`,
> EPA 40 CFR Part 75 substitution algorithms, real-time grid-marginal factors. **The code implements
> none of that.** Facility Scope 1/2/3, sensor readings, data quality, emission rates and hourly
> telemetry are all **independent PRNG draws** — there is no flow×concentration mass balance, no gap
> substitution, no grid-factor lookup. It is a **synthetic IoT monitoring dashboard**: 60 facilities,
> 200 sensors, an hourly/monthly time series, and a curated anomaly log. Sections below document the
> code.

### 7.1 What the module computes

Every quantity is a scaled `sr()` draw (`sr(s)=frac(sin(s+1)×10⁴)`):

```js
// facilities (×60)
scope1 = round(sr(i·41)·5000 + 500)   scope2 = round(sr(i·43)·3000 + 300)   scope3 = round(sr(i·47)·8000 + 1000)
emissionsRate = round((sr(i·17)·8 + 0.5)·100)/100
// sensors (×200)
reading = round(sr(i·23)·1000·100)/100      dataQuality = sr(i·13)·30 + 70      uptime = sr(i·31)·10 + 90
```

The page's genuine computations are honest **aggregations** of those draws:

```js
totalEmissions = Σ facilities.(scope1+scope2+scope3)
avgQuality     = round(Σ sensors.dataQuality / sensors.length · 10)/10
completePct    = round(compliance.filter(complete).length / filteredCompliance.length · 100)
```

### 7.2 Parameterisation / provenance

| Element | Range / rule | Provenance |
|---|---|---|
| Facility `scope1/2/3` | 500–5,500 / 300–3,300 / 1,000–9,000 tCO₂e | `sr()` draws |
| `emissionsRate` | 0.5–8.5 (unit implied) | `sr()` draw |
| Sensor `reading`, `dataQuality`, `uptime` | 0–1000 / 70–100 / 90–100 | `sr()` draws |
| Sensor `type`/`unit` | CEMS/Methane/Flow/Energy… paired to ppm/m³/h/kWh | Realistic sensor taxonomy |
| `manufacturer`/`model` | Siemens, ABB, Honeywell… | Real vendor names, synthetic assignment |
| `hourlyData` (24h) | emissions/temp/flow/energy/methane draws | `sr()`-seeded diurnal series |
| `monthlyHistory` (12mo) | emissions/forecast/scopes/anomalies | `sr()`-seeded |
| `anomalies` | curated log (flaring, demand surge…) | Hand-authored illustrative events |
| Industries/countries/cities | 12 each | Fixed taxonomies |

### 7.3 Calculation walkthrough

1. 60 facilities and 200 sensors seeded; sensors mapped to facilities via `fIdx = floor(i·60/200)`.
2. KPI cards aggregate: total emissions (Σ scopes), average data quality, sensor status counts.
3. Hourly/monthly tabs plot the seeded time series; forecast is a separate seeded series (not a model).
4. Anomaly tab renders the curated event log; `rcData` counts root causes.
5. Manufacturer/industry benchmark tabs bucket counts; compliance tab computes `completePct`.

### 7.4 Worked example (one facility)

Facility *i = 0* with draws `scope1 = 2,700, scope2 = 1,600, scope3 = 4,500 tCO₂e`,
`dataQuality` over its sensors averaging 88.4:

| Output | Computation | Result |
|---|---|---|
| Facility total | 2,700 + 1,600 + 4,500 | 8,800 tCO₂e |
| Contribution to portfolio total | +8,800 to Σ | — |
| Status | `statArr[floor(sr(i·23)·12)]` | e.g. nominal |
| Avg data quality (portfolio) | Σ sensor dataQuality / 200 | e.g. 84.6 |

No step derives the 8,800 t from any flow×concentration measurement — it is simply the sum of three
random draws.

### 7.5 Companion analytics on the page

- **Facility comparison** and **manufacturer mix**.
- **Hourly telemetry** (emissions/temperature/flow/energy/methane/particulate).
- **Monthly history + forecast** and **anomaly/root-cause** analysis.
- **Industry benchmarks** and **compliance completeness**.

### 7.6 Data provenance & limitations

- **100 % synthetic** — all facility, sensor, telemetry and quality values are `sr()`-seeded; only
  the anomaly log is (curated) hand-authored.
- No mass-balance emission computation, no EPA Part 75 gap substitution, no grid-marginal factors —
  the guide's CEMS methodology is entirely absent.
- The "forecast" is an independent seeded series, not a projection of the history.
- Data-quality scores are random, not derived from actual telemetry completeness/QAQC.

**Framework alignment:** *US EPA 40 CFR Part 75 CEMS* — referenced for the continuous-monitoring
concept (sensor taxonomy, alert thresholds), but no Part-75 mass-emission or substitution logic runs.
*ISO 14064-1* — the Scope 1/2/3 structure nods to the standard's quantification categories. *IEC 62056
DLMS/COSEM* — cited for metering, not implemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Convert real IoT sensor telemetry into an auditable, CEMS-equivalent continuous Scope 1/2 emission
stream per asset, with EPA-compliant gap-filling and target-tracking alerts.

### 8.2 Conceptual approach
Implement the EPA 40 CFR Part 75 mass-emission methodology (flow × concentration) for stack sensors
and an activity × emission-factor path for energy meters, with Part-75 data-substitution for gaps —
mirroring vendor CEMS DAHS (Data Acquisition & Handling Systems) and ISO 14064-1 quantification.

### 8.3 Mathematical specification
For asset *a*, interval *t*:

```
Stack CO2:  E_a(t) = Σ_i F_i(t)·C_i(t)·(MW_CO2/MW_i)·k        // F flow (m³/h), C conc (vol%), k unit const
Energy:     E_a(t) = Σ_m Q_m(t)·EF_{fuel(m)}  +  Elec_a(t)·GI_{grid(a),t}   // metered fuel + electricity
Gap-fill:   Ê_a(t) = substitution(look-back hourly avg, 90th-percentile)     // Part 75 §75.31–.37
Intensity:  I_a(t) = E_a(t) / Production_a(t)                 // tCO2e/MWh or per unit output
Variance:   ΔTarget_a(t) = Σ_{≤t} E_a − Budget_a(t)          // days-to-breach from trajectory
```

| Parameter | Source |
|---|---|
| Molecular weights `MW_i` | Physical constants |
| Fuel EFs `EF` | EPA/IPCC/DEFRA factor tables |
| Grid intensity `GI` | IEA/eGRID real-time or marginal where available |
| Substitution rules | EPA 40 CFR Part 75 Subpart D |

### 8.4 Data requirements
Live sensor streams (flow, concentration, temperature, energy) via MQTT/REST with timestamps and QA
flags; asset fuel/grid mapping; production/throughput for intensity; target baselines. Platform has
the sensor/facility scaffolding; needs real telemetry ingestion and factor lookups.

### 8.5 Validation & benchmarking plan
Reconcile computed mass emissions against periodic stack-test (RATA) results; verify gap-fill against
Part-75 acceptance criteria; benchmark intensity against sector CEMS norms; test alert timing against
known exceedance events.

### 8.6 Limitations & model risk
Sensor drift and calibration error propagate to mass emissions; gap-substitution is conservative by
design (may over-report); grid-marginal factors are uncertain intra-day. Fallback: apply Part-75
maximum-potential-concentration substitution during extended sensor outages.

## 9 · Future Evolution

### 9.1 Evolution A — A real telemetry-ingestion vertical with Part-75 emission math (analytics ladder: rung 1 → 2)

**What.** The §7 flag is total: no flow×concentration mass balance, no EPA Part-75 gap substitution, no grid-factor lookup — 60 facilities and 200 sensors are `sr()` draws, the "forecast" is an independent seeded series unrelated to the history, and data-quality scores are random rather than derived from telemetry completeness. Evolution A builds the §8 spec as this module's first backend vertical: a telemetry-ingestion pipeline (MQTT/REST landing table with timestamps and QA flags), stack emissions via `E = Σ F·C·(MW_CO2/MW_i)·k` for concentration sensors, activity×EF for energy meters with jurisdiction grid intensity, and Part-75 §75.31–.37 look-back substitution for gaps — so "data quality" finally means measured completeness.

**How.** (1) Tables `iot_sensors`, `iot_telemetry` (interval-partitioned), `iot_emission_intervals`; the ingestion framework's 19-ingester scaffold is the right home for a polling/webhook receiver. (2) The emission computation as a scheduled job over raw telemetry, writing per-interval tCO₂e with method flags (measured / substituted / factor-based). (3) A simulator seed mode clearly labeled as such for demo (deterministic synthetic *telemetry*, honestly framed, with the real pipeline processing it — unlike today where the *outputs* are faked). (4) Target-tracking variance and alerting per §8.3, replacing the curated anomaly log with rule-generated events.

**Prerequisites.** A telemetry source (even one real building meter, or the labeled simulator); emission-factor/grid-intensity refdata (shared with invoice-parser's factor service). **Acceptance:** every displayed tCO₂e decomposes into telemetry × method; gap-filled intervals visibly flagged with the substitution rule applied; data-quality % equals actual received/expected records.

### 9.2 Evolution B — Operations copilot for exceedance triage (LLM tier 2)

**What.** Continuous monitoring generates exactly the alert-stream that benefits from a triage copilot: "why did Facility 12's intensity spike at 14:00?", "which alerts this week are sensor-fault vs genuine exceedance?", "draft the monthly CEMS-format summary for the environment agency." Each answer reads real interval data and QA flags from the Evolution A endpoints, correlating emission spikes with telemetry anomalies (flow sensor dropout vs true concentration rise — distinguishable from the method flags).

**How.** Tier 2: tool schemas over interval-query and alert routes; root-cause suggestions are hypotheses ranked from the telemetry evidence (dropout patterns, calibration timestamps), always labeled as suggested causes for operator confirmation — the module's curated root-cause taxonomy becomes the classification vocabulary. Regulatory-report drafting maps computed intervals to the report template with substitution disclosure (Part 75 requires flagging substituted data — the copilot enforces that in generated text). The no-fabrication validator covers all emission figures; the copilot refuses forecasting questions until an actual forecasting model exists (rung 4 is future work; today's seeded "forecast" must not be narrated).

**Prerequisites (hard).** Evolution A — an operations copilot narrating random telemetry would erode exactly the operator trust continuous monitoring exists to build. Phase 2 tooling. **Acceptance:** triage suggestions cite specific telemetry evidence; generated reports flag every substituted interval; zero figures outside tool responses.