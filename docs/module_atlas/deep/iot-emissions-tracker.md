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
