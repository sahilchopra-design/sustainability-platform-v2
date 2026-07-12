# Digital MRV Platform
**Module ID:** `digital-mrv` · **Route:** `/digital-mrv` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Digital Measurement, Reporting, and Verification for GHG emissions. Covers IoT sensor integration, automated data collection, third-party verification workflow, and registry connectivity.

> **Business value:** Digital MRV is transforming GHG accounting from annual surveys to continuous measurement. High-frequency verified data enables real-time emission monitoring, more credible carbon credits, and reduced assurance costs. Critical for project-level carbon credit issuance under VCS, Gold Standard, and Article 6.

**How an analyst works this module:**
- Sensor Management connects IoT devices to data pipeline
- Automated Inventory generates GHG statement from sensor data
- Verification Workflow manages third-party audit process
- Registry Connectivity issues digital carbon credits

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `METHODS`, `PROJECT_NAMES`, `SENSOR_TYPES`, `STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODS` | `['Satellite','IoT','AI','Hybrid','Satellite+IoT','AI+Satellite'];` |
| `PROJECT_NAMES` | `['Amazon Reforestation','Borneo Palm Oil','Gujarat Solar Farm','Nairobi Wind Park','Lagos Waste-to-Energy','Bogota Transit','Mekong Delta Mangrove','Bangkok Industrial','Mexico City Air','Queensland Mining','Alberta Oil ` |
| `genVerifiedCerts` | `()=>Array.from({length:20},(_,i)=>({id:i+1,project:PROJECT_NAMES[i],method:METHODS[Math.floor(sr(i*163)*METHODS.length)],verifiedMt:+(sr(i*167)*4+0.5).toFixed(2),date:`2026-0${Math.floor(sr(i*169)*3)+1}-${String(Math.flo` |
| `badge` | `(text,color)=>({display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,fontFamily:T.font,background:color==='green'?'#dcfce7':color==='amber'?'#fef3c7':color==='red'?'#fee2e2':color==='blue'` |
| `kpis` | `useMemo(()=>{ const tot=projects.reduce((a,p)=>a+p.verified,0);` |
| `avgAcc` | `projects.length?projects.reduce((a,p)=>a+parseFloat(p.accuracy),0)/projects.length:0;` |
| `avgConf` | `projects.length?projects.reduce((a,p)=>a+parseFloat(p.confidence),0)/projects.length:0;` |
| `satCov` | `satSites.length?satSites.filter(s=>s.status!=='Critical').length/satSites.length*100:0;` |
| `costSav` | `certs.reduce((a,c)=>a+(c.tradCost-c.digiCost),0);` |
| `avgTurn` | `certs.length?certs.reduce((a,c)=>a+c.digiDays,0)/certs.length:0;` |
| `typeCounts` | `SENSOR_TYPES.map(t=>({name:t,count:sensors.filter(s=>s.type===t).length}));` |
| `avgQuality` | `(sensors.reduce((a,s)=>a+parseFloat(s.dataQuality),0)/sensors.length).toFixed(1);` |
| `avgCoverage` | `(sensors.reduce((a,s)=>a+parseFloat(s.coverage),0)/sensors.length).toFixed(1);` |
| `costData` | `certs.slice(0,10).map(c=>({name:c.project.split(' ')[0],traditional:c.tradCost,digital:c.digiCost}));` |
| `timeData` | `certs.slice(0,10).map(c=>({name:c.project.split(' ')[0],traditional:c.tradDays,digital:c.digiDays}));` |
| `ruleOptions` | `['Cross-reference satellite + IoT','AI anomaly detection','Historical baseline comparison','Peer verification','Statistical threshold check','Blockchain immutability'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `METHODS`, `PROJECT_NAMES`, `SENSOR_TYPES`, `STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IoT Data Frequency | — | Sensor spec | High-frequency measurement vs annual survey |
| MRV Quality | — | Standard | Level 1 = highest certainty; Level 3 = estimated |
- **IoT sensor data** → Emission calculation → **Verified GHG inventory**
- **GHG inventory** → Third-party audit → **Verified emission statement**
- **Verified emissions** → Credit issuance → **Carbon credit registry entry**

## 5 · Intermediate Transformation Logic
**Methodology:** Digital MRV pipeline
**Headline formula:** `Verified_emission = Raw_sensor × (1 - Uncertainty) × GWP; MRV = Measure + Report + Verify`

IoT layer: energy meters, gas analysers, flow meters. Calculation layer: emission factors, GWP values. Reporting layer: automated GHG inventory. Verification layer: third-party audit workflow with evidence management.

**Standards:** ['ISO 14064', 'VERRA VCS', 'Gold Standard MRV']
**Reference documents:** ISO 14064 GHG Quantification; VERRA VCS Standard; Gold Standard for Global Goals

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a working Digital MRV pipeline —
> `Verified_emission = Raw_sensor × (1 − Uncertainty) × GWP`, IoT integration, third-party audit
> workflow, registry issuance. **The code computes none of this equation.** Every project, satellite
> site, sensor and verified certificate is **fully synthetic**, generated by the seeded PRNG `sr()`.
> Verified emissions are drawn directly (`verified = sr(i·19)·5 + 0.1`), not derived from raw sensor
> readings × (1−uncertainty) × GWP. There is no emission-factor application, no GWP conversion, no real
> uncertainty propagation. Sections below document the synthetic demonstration.

### 7.1 What the module computes

```js
genProjects (80):  verified = sr(i·19)·5 + 0.1      // MtCO₂e, drawn — NOT from sensors
                   accuracy = 85 + sr·14 ; confidence = 88 + sr·11 ; intervals {85+…, 93+…}
genSatSites (30):  methane, deforestation, flares, landUseChange, status — all sr()
genSensors (50):   type ∈ {CEM, Methane, Water, Air}; dataQuality 70+sr·29; coverage 60+sr·39
genVerifiedCerts (20): tradCost vs digiCost, tradDays vs digiDays, hash, auditor
KPIs: totalVerified = Σ verified ; avgAccuracy ; avgConfidence ; satCoverage ;
      costSavings = Σ(tradCost − digiCost) ; avgTurnaround = mean(digiDays)
```

The "verification" is a KPI roll-up over synthetic records; the cost-savings narrative (digital vs
traditional MRV) is the main analytic and is entirely seeded.

### 7.2 Parameterisation

| Element | Count | key seeded fields | provenance |
|---|---|---|---|
| Projects | 80 | verified MtCO₂e, method, accuracy, confidence | synthetic (`sr()`) |
| Satellite sites | 30 | methane, deforestation, flares, anomalies | synthetic |
| IoT sensors | 50 | type, dataQuality, coverage, threshold | synthetic |
| Verified certs | 20 | tradCost/digiCost, tradDays/digiDays, auditor, hash | synthetic |
| Methods | 6 | Satellite, IoT, AI, Hybrid, Satellite+IoT, AI+Satellite | labels |
| Auditors | 5 | Bureau Veritas, SGS, DNV, TÜV SÜD, ERM | real assurance firms (labels) |

Countries, methods, sensor types and auditor names are real labels; every numeric value is drawn from
`sr(seed) = frac(sin(seed+1)×10⁴)`. The "blockchain hash" per cert is a seeded hex string, not a real
digest.

### 7.3 Calculation walkthrough

`genProjects/genSatSites/genSensors/genVerifiedCerts` seed all records once (memoised). KPIs sum/mean
over them. The dashboard filters projects by method/country/status; the satellite tab shows anomaly
trends; the sensor tab a searchable device table; the verification-engine tab is a UI-only wizard
(`runVerification` just delays 2.5 s then flips a "done" flag — no computation). Cost-savings charts
compare the seeded `tradCost/tradDays` against `digiCost/digiDays`.

### 7.4 Worked example

Project i=0: `verified = sr(0)·5 + 0.1`. `sr(0) = frac(sin(1)·10⁴) = 0.7099` → `0.7099·5 + 0.1 =
3.65 MtCO₂e`. `accuracy = 85 + sr(0)·14 = 85 + 9.94 = 94.9%`. A cert with `tradCost = 60,000`,
`digiCost = 8,000` contributes `52,000` to `costSavings`; the KPI reports `$Σ/1000 K`. None of these
reflect a real measurement — a genuine MRV would compute `verified = Σ(sensor_reading × EF × GWP × (1
− uncertainty))` per source, which this page does not do.

### 7.5 Data provenance & limitations

- **Entirely synthetic**: all projects, sites, sensors, certs and their emissions/costs are seeded by
  `sr()`. There is no sensor ingestion, no emission-factor library, no GWP table, no uncertainty
  model, no registry connection.
- The guide's core equation `Raw × (1−Uncertainty) × GWP` is absent — verified tonnes are drawn, not
  computed.
- Verification/scan workflows are timed UI stubs; the "immutable hash" is decorative.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** A credible digital-MRV engine must turn raw
multi-source measurements into a verified emission with a defensible uncertainty, per ISO 14064-1/-3
and Article 6.4 MRV — the discipline behind Verra/Gold Standard digital-MRV pilots and Climate TRACE's
sensor-fusion inventories.

**8.1 Purpose & scope.** Produce, per project × period, a verified GHG quantity `E` with a quantified
uncertainty `U` and a data-quality tier, from IoT/satellite/activity data, fit for credit issuance.

**8.2 Conceptual approach.** Bottom-up **activity × emission-factor** accounting with **measurement-
based** override where continuous monitoring exists, fused by inverse-variance weighting and
uncertainty-propagated per the IPCC error-propagation rules. Benchmarks: (a) **IPCC 2006 GL Vol.1
Ch.3** uncertainty propagation; (b) **ISO 14064-1** quantification + **14064-3** verification; (c)
Climate TRACE satellite-plus-inventory fusion; (d) Verra VCS/Gold Standard digital-MRV methodologies.

**8.3 Mathematical specification.**
```
Source-level:  eⱼ = ADⱼ · EFⱼ · GWPⱼ            # activity data × factor × GWP (CH₄=28, N₂O=265, AR5)
Measured src:  eₖ = ∫ Qₖ(t)·cₖ(t) dt · GWPₖ      # flow × concentration integrated (CEM)
Uncertainty:   u(eⱼ)² = (u_AD/AD)² + (u_EF/EF)²  # relative, added in quadrature
Fusion:        Ê = Σ wⱼ eⱼ,  wⱼ = 1/u(eⱼ)²        # inverse-variance combine of overlapping estimates
Total U (95%): U = 1.96 · √(Σ u(eⱼ)²·eⱼ²) / Ê    # IPCC propagation across independent sources
DQ tier:       f(U): U<7.5%→Tier1, <15%→Tier2, <30%→Tier3   # maps to a discount factor
Issuable:      E_credit = Ê · (1 − conservativeness(U))       # uncertainty deduction per VCS
```

| Parameter | Symbol | Source |
|---|---|---|
| GWP (100-yr) | GWPⱼ | IPCC AR5/AR6 |
| Emission factors | EFⱼ | IPCC EFDB / EPA GHGRP |
| CEM concentration/flow uncertainty | u_Q, u_c | instrument spec (±2–5%) |
| Satellite retrieval uncertainty | u_sat | TROPOMI/Climate TRACE reported σ |
| Conservativeness deduction | c(U) | VCS uncertainty-deduction schedule |

**8.4 Data requirements.** Fields: `project_id, source_id, activity_data, unit, EF, EF_source, GWP,
sensor_reading{Q,c,t}, instrument_uncertainty, satellite_estimate, satellite_sigma`. Platform sources:
Climate TRACE (already registered in `data-source-manager`), IPCC EF library (needed), sensor feed
(needed). Reuse `carbon_calculator` engine EF tables where present.

**8.5 Validation & benchmarking.** Reconcile verified `Ê` against (a) the facility's audited GHG
inventory, (b) Climate TRACE independent satellite estimate for the same asset/sector. Backtest the
uncertainty interval's coverage (should contain audited value ~95% of the time). Cross-check credit
issuance vs Verra/Gold Standard-registered volumes for pilot projects.

**8.6 Limitations & model risk.** Overlapping-source independence is often violated (satellite and IoT
may share systematic bias) → understated U; mitigate with a correlation-adjusted covariance. Missing
EF provenance degrades DQ tier. Conservative fallback: when only one source exists or uncertainty is
unquantifiable, apply the maximum VCS uncertainty deduction and tag DQ Tier 3.

**Framework alignment:** ISO 14064-1/-3 (quantification + verification), IPCC 2006 GL uncertainty
propagation, Verra VCS / Gold Standard MRV, and Paris Article 6.4 digital-MRV requirements — all named
in the guide but only labelled, not implemented, in the current code.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the MRV equation on a real measurement stream (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: nothing in the promised pipeline
`Verified_emission = Raw_sensor × (1 − Uncertainty) × GWP` is computed — all 80
projects, 30 satellite sites, 50 sensors, and 20 certificates are `sr()`-generated,
with "verified" emissions drawn directly (`sr(i·19)·5 + 0.1`) rather than derived
from readings, and no emission-factor application, GWP conversion, or uncertainty
propagation anywhere. Evolution A builds the calculation layer on a measurement
stream the platform can actually obtain, deferring physical IoT integration to
when a real deployment exists.

**How.** (1) Measurement substrate: start with obtainable streams — metered energy
data (the capture hub's records, utility interval data) and satellite-derived
observations (the platform's GWIS/NASA-POWER integrations provide genuine remote
sensing precedent) — ingested as timestamped readings in an `mrv_readings` table.
(2) Calculation layer: readings × emission factors (from the refdata factor
library) × GWP (AR6 values, curated) with uncertainty propagated per ISO 14064's
quantification guidance — each verified figure decomposable into
reading/factor/GWP/uncertainty. (3) Verification workflow: evidence packages per
reporting period (readings, factors applied, calculation trace) with
verifier-role sign-off states — the audit machinery AuditMiddleware supports.
(4) The registry-connectivity tab stays aspirational until a real registry API
relationship exists; label it so. (5) Purge all four synthetic generators.

**Prerequisites (hard).** PRNG purge; a first real measurement source (metered
energy is realistic; methane sensing is not, yet); AR6 GWP and factor tables in
refdata. **Acceptance:** a verified emission decomposes on screen into its
reading × factor × GWP × (1−uncertainty) chain; changing the GWP vintage
recomputes visibly; no displayed project carries generated data.

### 9.2 Evolution B — Verification-evidence reviewer for MRV audits (LLM tier 2)

**What.** The economic pitch of digital MRV — "reduced assurance costs" — comes
from making verification review faster. Evolution B assists the third-party audit
workflow: for a reporting period's evidence package, the reviewer checks
completeness against the ISO 14064 quantification requirements, flags anomalies in
the reading stream (gaps, step changes, values outside the sensor's plausible
band — deterministic checks the assistant orchestrates and explains), verifies
factor-vintage consistency, and drafts the verification-findings memo with each
finding citing the specific readings and calculation-trace rows involved.

**How.** Tier-2 read tools over the readings, factors, and calculation traces from
Evolution A; anomaly detection is deterministic statistics (the assistant
prioritizes and narrates, never invents thresholds); the findings memo queues for
the human verifier's sign-off — the module supports verification, it does not
perform it, a boundary the carbon-credit standards require. Grounding: ISO 14064
and the VCS/Gold Standard MRV requirement texts.

**Prerequisites (hard).** Evolution A's calculation layer and evidence packages
(there is nothing real to review today); standards texts embedded; verifier RBAC
role. **Acceptance:** findings cite specific reading IDs and trace rows; a
constructed gap in the stream is flagged; the memo's completeness checklist maps
to the standard's clauses; sign-off remains human.