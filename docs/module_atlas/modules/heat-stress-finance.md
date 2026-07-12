# Heat Stress Finance Analytics
**Module ID:** `heat-stress-finance` · **Route:** `/heat-stress-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DP1 · **Sprint:** DP

## 1 · Overview
Quantifies the financial costs of extreme heat — worker productivity loss, energy demand spikes, agricultural yield reduction, and heat-related health system costs. Models heat stress exposure by sector and geography using WBGT index and IPCC temperature projections.

> **Business value:** Critical for insurers pricing heat-related health products, agricultural banks, industrial company CHRO teams assessing heat risk, and government public health authorities. Provides Lancet Countdown-aligned heat stress economic quantification for TCFD and TNFD physical risk disclosure.

**How an analyst works this module:**
- Select geography and sector for heat stress exposure
- Apply WBGT projections under SSP scenarios
- Calculate worker productivity loss by intensity
- Model heat-related health costs and VSL-adjusted mortality
- Generate Lancet Countdown-aligned heat risk financial report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `CITIES`, `KpiCard`, `REGIONS`, `SECTORS`, `SECTOR_DATA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['South Asia', 'Southeast Asia', 'Sub-Saharan Africa', 'MENA', 'Latin America', 'Southern Europe', 'Caribbean', 'Pacific Islands'];` |
| `rIdx` | `Math.floor(sr(i * 3) * REGIONS.length);` |
| `wbgt` | `24 + sr(i * 7) * 17;` |
| `prodLoss` | `3 + sr(i * 11) * 22;` |
| `adaptCost` | `0.2 + sr(i * 13) * 4.8;` |
| `labourRisk` | `Math.min(100, 20 + sr(i * 17) * 70);` |
| `heatDeaths` | `Math.round(10 + sr(i * 19) * 490);` |
| `gdpImpact` | `0.5 + sr(i * 23) * 6.5;` |
| `workdaysLost` | `Math.round(5 + sr(i * 29) * 55);` |
| `insuranceGap` | `20 + sr(i * 31) * 70;` |
| `SECTOR_DATA` | `SECTORS.map((s, i) => ({` |
| `avgWbgt` | `filtered.length ? (filtered.reduce((a, c) => a + c.wbgt, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgProdLoss` | `filtered.length ? (filtered.reduce((a, c) => a + c.prodLoss, 0) / filtered.length).toFixed(1) : '0.0';` |
| `totalAdaptCost` | `filtered.reduce((a, c) => a + c.adaptCost, 0).toFixed(1);` |
| `totalHeatDeaths` | `filtered.reduce((a, c) => a + c.heatDeaths, 0).toLocaleString();` |
| `avgGdpImpact` | `filtered.length ? (filtered.reduce((a, c) => a + c.gdpImpact, 0) / filtered.length).toFixed(2) : '0.00';` |
| `avgInsGap` | `filtered.length ? (filtered.reduce((a, c) => a + c.insuranceGap, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgW` | `rcities.length ? (rcities.reduce((a, c) => a + c.wbgt, 0) / rcities.length).toFixed(1) : '-';` |
| `avgP` | `rcities.length ? (rcities.reduce((a, c) => a + c.prodLoss, 0) / rcities.length).toFixed(1) : '-';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Workers Exposed to Heat Stress | — | ILO 2023 | 2.4 billion workers exposed to excessive heat by 2030 — agriculture (60%), construction (20%) most exposed |
| GDP Loss from Heat Stress | — | ILO Climate and Work 2023 | Annual global GDP loss from heat productivity reduction — equivalent to 40M full-time jobs |
| Excess Heat Deaths 2023 | — | Lancet Countdown 2023 | Europe recorded 61,000+ excess heat deaths in 2022 — highest on record; growing 3% yr-on-yr |
- **WBGT projections by SSP/region (NASA GISS)** → Heat exposure calculation → **Annual hours above safe WBGT by sector and geography**
- **Sectoral employment data + wage rates** → Productivity loss calculation → **Annual GDP loss from heat-induced productivity reduction**
- **Health system utilisation + mortality data** → Health cost modelling → **Heat-related excess mortality and morbidity costs**

## 5 · Intermediate Transformation Logic
**Methodology:** Heat Stress Economic Cost
**Headline formula:** `ProductivityLoss = ExposedWorkers × HoursLostPerWorker × WageRate × (1 + ProductivityMultiplier); HeatEAL_health = ΔMortality × VSL + ΔMorbidity × DailyCost`

Productivity loss from WBGT threshold exceedance using ILO epidemiological model; health EAL from excess mortality × Value of Statistical Life (WHO VSL methodology)

**Standards:** ['ILO Heat and Work Safety Report 2023', 'WHO Environmental Burden of Disease 2022', 'IPCC AR6 WGII Chapter 7 — Health', 'Lancet Countdown on Health and Climate Change 2023']
**Reference documents:** ILO — Ensuring Safety and Health at Work in a Changing Climate 2023; Lancet Countdown on Health and Climate Change — Annual Report 2023; WHO Environmental Burden of Disease Framework; IPCC AR6 WGII Chapter 7 — Human Health

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** The guide (EP-DP1) gives an ILO productivity formula
> `ProductivityLoss = ExposedWorkers × HoursLost × WageRate × (1+multiplier)` and a VSL-based health EAL.
> The code does **not** compute either — each city's `prodLoss`, `heatDeaths`, `gdpImpact` and
> `insuranceGap` are `sr()` PRNG draws, and productivity loss is *not* derived from WBGT via an exposure-
> response function (WBGT and prodLoss are independent seeds). The only live formula is a flat RCP
> scenario multiplier. Sections below document the seeded model the code runs.

### 7.1 What the module computes

`CITIES` (60) are seeded from independent PRNG streams (`sr(seed)=frac(sin(seed+1)×10⁴)`):

```js
wbgt        = 24 + sr(i×7)×17          // 24–41 °C WBGT (independent of prodLoss)
prodLoss    = 3 + sr(i×11)×22          // 3–25% (its own seed — not a WBGT function)
adaptCost   = 0.2 + sr(i×13)×4.8       // $bn
labourRisk  = min(100, 20 + sr(i×17)×70)
heatDeaths  = round(10 + sr(i×19)×490)
gdpImpact   = 0.5 + sr(i×23)×6.5       // % GDP
insuranceGap= 20 + sr(i×31)×70         // %
```

Scenario overlay:
```js
scenarioMultiplier = RCP8.5 ? 1.8 : RCP6.0 ? 1.4 : 1.0     // applied to impacts in scenario tab
```

### 7.2 Parameterisation

| Field | Seeded range | Anchor |
|---|---|---|
| WBGT | 24–41 °C | >33 °C = dangerous for outdoor work (ILO) |
| Productivity loss | 3–25% | tropical outdoor 15–28% (ILO) |
| Insurance gap | 20–90% | protection-gap ranges |
| RCP multiplier | 1.0 / 1.4 / 1.8 | RCP 4.5 / 6.0 / 8.5 |

`SECTOR_DATA` (8 sectors: Construction, Agriculture, Mining…) seeds exposed workers, productivity loss,
adaptation capex, heat mortality, insurance coverage and NGFS RCP 4.5/8.5 impacts. 60 real city names
(Karachi, Delhi, Dubai, Lagos, Athens…) across 8 regions. No ILO exposure-response constants or wage
rates appear — the guide's `ExposedWorkers × HoursLost × Wage` chain is absent.

### 7.3 Calculation walkthrough

Cities filter by region and a WBGT-minimum slider. KPIs aggregate the seeded fields: `avgWbgt`,
`avgProdLoss`, `totalAdaptCost`, `totalHeatDeaths`, `avgGdpImpact`, `avgInsGap`. The scenario tab
multiplies impacts by the RCP multiplier. Sector tab shows per-sector exposure and NGFS RCP projections.

### 7.4 Worked example (filtered aggregate)

Filter to WBGT ≥ 33 °C, MENA region — suppose 6 cities pass with mean prodLoss 18.2%, summed adaptCost
$14.3bn, summed heatDeaths 1,840, under RCP 8.5 (×1.8):

| KPI | Computation | Result |
|---|---|---|
| avgWbgt | mean(filtered wbgt) | e.g. 35.4 °C |
| avgProdLoss | mean(filtered prodLoss) | 18.2% |
| totalAdaptCost | Σ adaptCost | $14.3bn |
| scenario-adjusted deaths | 1,840 × 1.8 | 3,312 |

The RCP 8.5 multiplier scales the (synthetic) impacts by 1.8× — a coarse scenario overlay, not a
downscaled climate projection. WBGT filtering correctly surfaces the hottest cities, but their
productivity loss is drawn independently, so a 41 °C city can show a lower prodLoss than a 34 °C one.

### 7.5 Data provenance & limitations

- **Entirely synthetic** (`sr()` PRNG). Only the 60 city names, 8 regions and 8 sectors are real.
- **WBGT and productivity loss are decoupled** — prodLoss is its own seed, not the ILO exposure-response
  of WBGT, so the core physical→economic linkage the guide describes is not present.
- No wage rates, exposed-worker hours, or VSL — the guide's `ProductivityLoss` and `HeatEAL_health`
  formulas are not implemented; the RCP multiplier (1.0/1.4/1.8) is the only scenario mechanism.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** Below is the ILO/VSL model the guide describes.

**8.1 Purpose & scope.** Quantify the financial cost of extreme heat (labour productivity loss, health
EAL) by city and sector under WBGT projections, for insurers, agri-banks and corporate heat-risk teams.

**8.2 Conceptual approach.** The ILO heat-stress productivity function (WBGT → work-hours lost) combined
with a VSL/DALY health cost, per ILO Working on a Warmer Planet and WHO Environmental Burden of Disease;
WBGT projected from downscaled SSP/RCP.

**8.3 Mathematical specification.**
```
WorkHoursLost_s = ExposedWorkers_s × hours_lost(WBGT, workload_intensity_s)   // ILO ERF
   hours_lost rises sharply above WBGT 26–33 °C, workload-dependent
ProductivityLoss$_s = WorkHoursLost_s × AvgWage_s
HeatEAL_health = ΔMortality × VSL + ΔMorbidity × DailyCost
GDP_impact = Σ_s ProductivityLoss$_s / GDP
Scenario: WBGT(SSP, horizon) from downscaled projections → re-evaluate ERF
```

| Parameter | Source |
|---|---|
| WBGT→hours-lost ERF | ILO Heat and Human Performance 2019 (workload-specific) |
| VSL | WHO VSL (LMIC ~$1M, HIC ~$5M) |
| Exposed workers/wages | ILOSTAT sectoral employment |
| WBGT projections | NASA GISS / downscaled SSP-RCP |
| Morbidity cost | WHO EBD |

**8.4 Data requirements.** City WBGT (historical + projected), sectoral employment and wages, mortality/
morbidity baselines, workload-intensity by sector. The page has city/sector taxonomy but not the ERF
inputs.

**8.5 Validation.** Reconcile GDP loss against ILO's $2.4tn/yr-by-2030 estimate; back-test heat deaths
against Lancet Countdown (Europe 2022 61k); sensitivity on VSL and WBGT thresholds.

**8.6 Limitations & model risk.** ERF is workload- and acclimatisation-dependent; wage and employment
data are coarse in LMICs; VSL is contested. Conservative fallback: report work-hours-lost and GDP-impact
ranges rather than point VSL-monetised figures.

**Framework alignment:** ILO Working on a Warmer Planet (2019) — the productivity ERF; WHO Environmental
Burden of Disease — health EAL; Lancet Countdown (2023) — heat-mortality tracking; IPCC AR6 WG2 Ch7 —
SSP heat projections; the WBGT index (>33 °C dangerous) — the physical exposure metric.

## 9 · Future Evolution

### 9.1 Evolution A — Couple WBGT to productivity via the ILO exposure-response function (analytics ladder: rung 1 → 2)

**What.** The §7 deep dive documents the module's core defect precisely: WBGT and productivity loss are **independent PRNG seeds** (`wbgt = 24 + sr(i×7)×17`, `prodLoss = 3 + sr(i×11)×22`), so a 41°C city can show lower productivity loss than a 34°C one — the physical→economic linkage that is the entire point of EP-DP1 does not exist. Evolution A builds the §8 chain as a backend vertical: `WorkHoursLost = ExposedWorkers × hours_lost(WBGT, workload_intensity)` per the ILO ERF, monetised with sectoral wages, plus the VSL health EAL, replacing the decoupled seeds.

**How.** (1) Encode the published ILO workload-specific hours-lost curves (loss rises sharply above WBGT 26–33°C by workload class) as a deterministic lookup engine. (2) Seed city WBGT baselines from NASA-POWER/Open-Meteo (already-wired platform sources) instead of `sr(i×7)`; sectoral employment/wages from ILOSTAT for the existing 8 sectors. (3) The RCP scenario tab replaces its flat 1.0/1.4/1.8 multiplier with ΔWBGT per scenario re-evaluated through the ERF — a nonlinear response, which is the honest behaviour. (4) Reconcile the global aggregate against ILO's $2.4tn/yr-by-2030 figure per §8.5.

**Prerequisites.** Removal of the seven independent `sr()` streams per city (fabrication in the platform-guardrail sense); ILOSTAT sectoral data for the 8 regions. **Acceptance:** productivity loss is monotonic in WBGT within a workload class; the worked-example inconsistency in §7.4 (hot city, low loss) becomes impossible by construction.

### 9.2 Evolution B — Heat-risk analyst for sector screening (LLM tier 2)

**What.** A tool-calling analyst for the module's stated buyers (insurers, agri-banks, CHRO teams): "which MENA cities exceed the WBGT 33°C danger threshold and what does that cost in work hours?", "compare construction vs agriculture exposure in South Asia under RCP 8.5", "estimate the health EAL if this city adds 2°C." Each query executes against the Evolution A endpoints and narrates real ERF output with the ILO/Lancet framing already in this page's §4 corpus.

**How.** Tool schemas from the new module routes via the Atlas endpoint map; system prompt built from this page (§7.2 anchor table and §8.3 formulas). The no-fabrication validator checks each $/deaths/hours figure against tool responses. The copilot must expose parameter provenance — which VSL, which workload class — because §8.6 flags VSL as contested. A tier 1 explanation-only slice (narrating the current filtered KPIs with the synthetic-data caveat from §7.5) can ship immediately without backend work.

**Prerequisites (hard).** Evolution A first — the module currently has no backend endpoints, and narrating decoupled seeded data would launder the exact defect §7 documents. **Acceptance:** every numeric traceable to a tool call; asked about a region or sector outside the seeded taxonomy, the analyst refuses with a scope statement.