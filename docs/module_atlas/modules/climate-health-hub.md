# Climate-Health Nexus
**Module ID:** `climate-health-hub` · **Route:** `/climate-health-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate change health impacts analytics. Covers heat mortality, air quality degradation, vector-borne disease expansion, food security, and mental health impacts with investment implications.

> **Business value:** Climate change is the defining public health challenge of our time. Healthcare costs, workforce productivity, and supply chain disruptions from climate-health impacts create material financial risks. This module quantifies these impacts for healthcare sector investors and ESG analysts.

**How an analyst works this module:**
- Health Impact Map shows regional climate-health vulnerability
- Heat Mortality shows temperature-mortality curves
- Air Quality shows wildfire PM2.5 exposure by region
- Productivity Loss shows economic output impact of heat stress

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `ALERT_TYPES`, `AUDIENCE_TYPES`, `BOARD_SECTIONS`, `COLORS`, `COUNTRY_NAMES`, `COUNTRY_RISK`, `ENGAGEMENTS`, `KPI_DATA`, `MODULES`, `QUARTERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `MODULES` | `['Heat Mortality','Air Quality','Pandemic-Climate','Health Adaptation','Worker Heat Stress'];` |
| `AUDIENCE_TYPES` | `['Board / ExCo','Investment Committee','Risk Committee','ESG Team','External Stakeholders'];` |
| `heatRisk` | `Math.floor(s1*100);` |
| `aqRisk` | `Math.floor(s2*100);` |
| `pandemicRisk` | `Math.floor(s3*100);` |
| `adaptGap` | `Math.floor(s4*100);` |
| `workerRisk` | `Math.floor(s5*100);` |
| `composite` | `Math.floor((heatRisk+aqRisk+pandemicRisk+adaptGap+workerRisk)/5);` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],composite:Math.floor(composite*(0.9+qi*0.015+sr(i*31+qi*7)*0.05))}));` |
| `BOARD_SECTIONS` | `['Executive Summary','Heat Mortality Risk Overview','Air Quality & Health Costs','Pandemic-Climate Nexus','Health Adaptation Finance','Worker Heat Stress Exposure','Engagement Progress','Recommendations & Next Steps'];` |
| `fmt` | `(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `TABS` | `['Executive Dashboard','Country Health-Climate View','Engagement Pipeline','Board Report'];` |
| `moduleDistribution` | `useMemo(()=>MODULES.map(m=>({name:m,alerts:ALERTS.filter(a=>a.module===m).length,engagements:ENGAGEMENTS.filter(e=>e.module===m).length})),[]);` |
| `csv` | `[headers.join(','),...data.map(row=>headers.map(h=>JSON.stringify(row[h]\|\|'')).join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERT_TYPES`, `AUDIENCE_TYPES`, `BOARD_SECTIONS`, `COLORS`, `COUNTRY_NAMES`, `MODULES`, `QUARTERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Heat Deaths (2°C) | — | Lancet Countdown | Additional heat-attributable deaths globally |
| Productivity Loss | — | IPCC WGII | Labour output decline above heat stress thresholds |
- **Temperature projections** → Exposure-response function → **Heat mortality estimate**
- **Wildfire data** → PM2.5 mapping → **Air quality health impact**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-health impact pathways
**Headline formula:** `HeatMortality = Excess_deaths(T - T_threshold); AirQuality = PM2.5 µg/m³ from wildfire smoke`

Heat mortality: exposure-response function calibrated from epidemiological studies. PM2.5: satellite-tracked wildfire smoke. Vector-borne disease: IPCC AR6 range expansion for malaria, dengue, Lyme. Financial impact: healthcare costs, labour productivity loss.

**Standards:** ['WHO Climate and Health', 'Lancet Countdown', 'IPCC AR6 WGII Ch.7']
**Reference documents:** Lancet Countdown on Health and Climate Change; WHO Special Report on Climate Change and Health; IPCC AR6 WGII Chapter 7

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes real epidemiological pathways —
> `HeatMortality = Excess_deaths(T − T_threshold)` via an "exposure-response function calibrated from
> epidemiological studies", PM2.5 from "satellite-tracked wildfire smoke", IPCC AR6 vector-borne
> disease range expansion, DALYs and labour-productivity loss. **None of these functions exist.**
> Every KPI (heat mortality index, PM2.5, DALYs, pandemic risk, worker exposure) is a single
> `sr()`-seeded number, and the only derived quantity is a simple mean of five seeded sub-risks. This
> is a **climate-health command centre dashboard** over 40 seeded countries and 20 seeded alerts, not
> a health-impact model. The sections below document the code.

### 7.1 What the module computes

12 seeded KPIs (`genKPIs`), 40 seeded countries with a composite risk, 20 alerts, 40 engagements.
The one real computation is the composite country risk (equal-weight mean of 5 sub-risks):

```
heatRisk, aqRisk, pandemicRisk, adaptGap, workerRisk = ⌊sr(·)×100⌋           (each 0–100, seeded)
composite = ⌊ (heatRisk + aqRisk + pandemicRisk + adaptGap + workerRisk) / 5 ⌋
tier      = composite>70 ? Critical : >50 ? High : >30 ? Medium : Low
qTrend[q] = ⌊ composite × (0.9 + q×0.015 + sr(·)×0.05) ⌋                     (seeded quarterly drift)
```

### 7.2 Parameterisation / synthetic generation

| KPI / field | Generation | Provenance |
|---|---|---|
| Heat Mortality Index | `⌊sr(701)×100⌋` | **Seeded** (not excess-deaths) |
| Avg PM2.5 | `⌊30 + sr(703)×80⌋` µg/m³ | **Seeded** (not satellite smoke) |
| Total DALYs | `sr(711)×50 + 10` M | **Seeded** |
| Pandemic Risk Index | `⌊sr(705)×100⌋` | Seeded |
| Healthcare Cost | `sr(713)×100 + 20` $B | Seeded |
| UHI Intensity | `2 + sr(715)×4` °C | Seeded |
| 5 country sub-risks | `⌊sr(·)×100⌋` each | Seeded |
| composite | mean of the 5 | **Derived** (real average) |
| alerts / engagements | seeded picks | Seeded |

### 7.3 Calculation walkthrough

1. `genKPIs` produces 12 dashboard KPIs from fixed seeds (701–724).
2. `genCountryRisk(40)` builds 40 countries: 5 seeded sub-risks → composite mean → tier → seeded
   12-quarter trend.
3. `genAlerts(20)` and `genEngagements(40)` produce seeded alert/engagement rows.
4. Views: executive KPI grid, country risk table/radar (sorted by composite), engagement pipeline,
   and a board-report builder (8 sections).

### 7.4 Worked example — a country's composite risk

Country with seeded sub-risks `heatRisk 82, aqRisk 68, pandemicRisk 55, adaptGap 74, workerRisk 61`:

| Step | Computation | Result |
|---|---|---|
| Sum | 82+68+55+74+61 | 340 |
| Composite | ⌊340 / 5⌋ | **68** |
| Tier | 68 > 50 (not > 70) | **High** |
| Q1-25 trend point | ⌊68 × (0.9 + 8×0.015 + seed×0.05)⌋ | ≈ 69–73 (seed-dependent) |

The composite is a genuine equal-weight average, but its five inputs are unrelated random draws — so
a country's "heat" and "air quality" risks carry no epidemiological relationship.

### 7.5 Data provenance & limitations

- **All 40 countries, 12 KPIs, 20 alerts and 40 engagements are synthetic**, generated by
  `sr(seed) = frac(sin(seed+1)×10⁴)` with fixed offset seeds.
- **No exposure-response function, no wildfire-smoke PM2.5, no DALY model, no vector-borne range
  expansion** despite the guide — heat mortality and DALYs are seeded scalars.
- The composite risk weights all five hazards equally with no epidemiological or financial weighting.
- Healthcare cost and labour-productivity loss are seeded values, not derived from mortality/morbidity.

**Framework alignment:** The page *references* WHO Climate and Health, the Lancet Countdown, and IPCC
AR6 WGII Ch.7 as conceptual anchors, but implements none of their methods. §8 specifies the
health-impact pathway model the guide describes.

## 8 · Model Specification — Climate-Health Impact Pathway Model

**Status: specification — not yet implemented in code.** The guide's excess-deaths and PM2.5 pathways
have no implementation (KPIs are `sr()`-seeded); this specifies them.

### 8.1 Purpose & scope
Estimate climate-attributable health burden (heat mortality, air-quality DALYs, vector-borne disease)
and its financial impact (healthcare cost, labour-productivity loss) by country, for portfolio and
sovereign health-risk analytics.

### 8.2 Conceptual approach
**Epidemiological exposure-response functions** applied to climate and exposure data, following WHO
Climate & Health and Lancet Countdown methodology. Benchmarks: Lancet Countdown indicators and the
GBD (Global Burden of Disease) attributable-risk framework.

### 8.3 Mathematical specification
```
HeatExcessDeaths_c = Σ_d Pop_c · baselineMort_c · [ RR(T_d − T_threshold) − 1 ] · 1{T_d > T_threshold}
   RR(ΔT)          = exp( β_heat · ΔT )                       (log-linear exposure-response)
PM25_c             = background_c + wildfireSmokeContribution_c(satellite)
AQ_DALYs_c         = Pop_c · [ IHD + stroke + COPD + LC + LRI attributable fractions(PM2.5) ]
VectorBorne_c      = suitabilityShift(temp, precip; IPCC AR6) · Pop_at_risk_c
LabourLoss_c       = outdoorWorkers_c · WBGT_lost_hours(T,humidity) · wage_c
HealthcareCost_c   = (excessDeaths + morbidity) · unitCost_c
```
| Parameter | Source |
|---|---|
| β_heat (exposure-response) | Epidemiological meta-analyses (e.g. MCC network) |
| baseline mortality | WHO / GBD |
| PM2.5 attributable fractions | GBD integrated exposure-response |
| WBGT loss function | ISO 7243 / Lancet Countdown labour indicator |
| Wildfire smoke | Satellite AOD → PM2.5 (e.g. NASA MODIS) |

### 8.4 Data requirements
Gridded population, baseline mortality, daily temperature/humidity, satellite PM2.5/AOD, outdoor-
worker share, and unit healthcare/wage costs. Country list exists; the climate/exposure/epi inputs
are all missing.

### 8.5 Validation & benchmarking plan
Reconcile heat-excess-deaths against Lancet Countdown country estimates; validate PM2.5 DALYs against
GBD; backtest WBGT labour loss against ILO heat-stress projections; sensitivity-test β_heat and
temperature thresholds.

### 8.6 Limitations & model risk
Exposure-response transfer across populations is uncertain; PM2.5 attribution assumes GBD IER;
acclimatisation shifts thresholds over time. Conservative fallback: report ranges from low/high β
and flag countries lacking baseline-mortality data as model-out-of-scope.

## 9 · Future Evolution

### 9.1 Evolution A — Ground the country risk in published health-climate data (analytics ladder: rung 1 → 2)

**What.** §7 flags that none of the guide's epidemiological pathways exist — every
KPI (heat mortality, PM2.5, DALYs, pandemic risk, worker exposure) is a single
seeded number over 40 real country names, and the only computation is an equal-weight
mean of five seeded sub-risks. The composite structure is sound; the inputs are
fiction. Evolution A populates the five sub-risks from published, public sources the
§5 reference list already points at: heat exposure from the Lancet Countdown
indicator set (published per country annually), PM2.5 from WHO ambient air-quality
data, vector-suitability from published IPCC AR6/modelling-consortium range maps,
adaptation capacity from WHO climate-health country profiles, and labour heat stress
from ILO's published productivity-loss estimates — keeping the existing composite
mean and tiering logic, now over sourced components.

**How.** (1) `ref_country_health_climate(iso3, indicator, value, source, year)` —
five indicators × ~190 countries, all from downloadable public compilations; a
bounded annual-refresh curation. (2) The equal-weight composite retained but weights
made explicit and adjustable (rung-2 sensitivity); tier thresholds documented.
(3) The seeded KPI cards, alerts, and engagements either derived from the new data or
clearly relabelled as workflow fixtures — real country names must not carry seeded
health metrics.

**Prerequisites (hard).** PRNG purge on country metrics; source licensing (WHO/ILO/
Lancet data are publicly published with attribution). **Acceptance:** each country's
five sub-risks trace to indicator rows with source+year; the composite reproduces the
documented mean; zero seeded health numbers remain.

### 9.2 Evolution B — Health-exposure briefing copilot (LLM tier 1)

**What.** A copilot for healthcare-sector investors and ESG analysts: "why is
Pakistan tier-Critical?" (decomposition into the five sourced sub-risks with
citations), "which portfolio countries face the steepest labour heat-stress
exposure?", "what does the Lancet Countdown say about heat mortality trends here?" —
retrieval and composite narration over the Evolution A tables plus the §5 corpus
(WHO, Lancet Countdown, IPCC AR6 Ch.7). Tier 1: the module aggregates published
epidemiology; it does not model it, and the copilot must inherit that modesty.

**How.** Atlas record + indicator tables as corpus; decompositions cite indicator
source and year per component; the copilot distinguishes exposure indicators from
health outcomes explicitly (an exposure index is not a mortality forecast); refusal
on financial-impact quantification the module doesn't compute.

**Prerequisites (hard).** Evolution A first — narrating seeded DALYs about real
countries is the fabrication-on-real-names pattern at its most sensitive, given the
subject matter. **Acceptance:** a tier explanation reconciles to the composite's
component values with citations; asked to forecast heat deaths for 2030, the copilot
reports published projections if present in the corpus, else refuses.