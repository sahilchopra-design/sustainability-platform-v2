# Real Assets Climate Risk
**Module ID:** `real-assets-climate` · **Route:** `/real-assets-climate` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses climate physical and transition risk across real estate and infrastructure asset portfolios using scenario-based hazard modelling and stranding analysis.

> **Business value:** Delivers an integrated climate risk lens across real estate and infrastructure portfolios, supporting TCFD disclosures and climate-adjusted investment decision-making.

**How an analyst works this module:**
- Classify assets by type (RE, infrastructure, agriculture).
- Apply physical hazard scoring by location and SSP scenario.
- Model transition risk via CRREM pathway or carbon cost.
- Compute climate-adjusted valuations and priority capex needs.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ASSETS`, `ASSET_TYPES`, `CRREM`, `KPI`, `PAGE_SIZE`, `REGIONS`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#0c4a6e';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `CRREM` | `Array.from({length:10},(_,i)=>({year:2025+i*3,office:Math.round(80-i*6+sr(i*7)*5),retail:Math.round(90-i*5+sr(i*11)*6),logistics:Math.round(70-i*4+sr(i*13)*4),target:Math.round(75-i*7)}));` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgPhys:Math.round(30+sr(i*7)*15),avgTrans:Math.round(35+sr(i*11)*12),stranded:Math.round(5+i*0.3+sr(i*13)*3)}));` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...ASSETS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(typeF!=='All')d=d.filter(r=>r.type===typeF);if(regF!=='All')d=d.filter(r=>r.region===regF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,typeF,regF,sortCol,sortDir]); ` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(ASSETS.reduce((s,c)=>s+c[k],0)/ASSETS.length);const totalVal=ASSETS.reduce((s,c)=>s+c.valuationM,0);const strandedSoon=ASSETS.filter(c=>c.strandingYear<=2030).length;return{avgPhys:avg('physicalRisk'),avgTrans:avg('transitionRisk'),totalVal,strandedSoon,avgCrrem:avg('crremScore')};},[]); const typeDi` |
| `typeRisk` | `useMemo(()=>{const m={};ASSETS.forEach(c=>{if(!m[c.type])m[c.type]={type:c.type,phys:0,trans:0,n:0};m[c.type].phys+=c.physicalRisk;m[c.type].trans+=c.transitionRisk;m[c.type].n++;});return Object.values(m).map(s=>({...s,` |
| `radarData` | `useMemo(()=>{const dims=['physicalRisk','transitionRisk','crremScore','carbonIntensity','floodRisk','heatStress'];const avg=(k)=>Math.round(ASSETS.reduce((s,c)=>s+c[k],0)/ASSETS.length);return dims.map(d=>({dim:d.replace` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Physical Risk Haircut (%) | — | Hazard Modelling | Portfolio average valuation reduction from modelled physical climate hazards under RCP 4.5. |
| Transition Risk Haircut (%) | — | Carbon Pricing Model | Valuation reduction from energy efficiency capital requirements and carbon cost under net-zero policy. |
| At-Risk AUM (%) | — | Climate Screen | Share of real assets AUM exposed to high or extreme combined climate risk. |
- **Asset register + hazard scores + energy data + carbon pathways** → Physical and transition risk haircut modelling; climate-adjusted valuation → **Asset-level climate risk report and adjusted valuation outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Adjusted Value
**Headline formula:** `V_climate = V_base × (1 – δ_physical) × (1 – δ_transition)`

Valuation haircut applying multiplicative adjustments for physical damage probability and transition-driven obsolescence.

**Standards:** ['TCFD Guidance for Infrastructure', 'CRREM Global Pathways v2']
**Reference documents:** TCFD Guidance on Metrics, Targets and Transition Plans for Infrastructure; CRREM Global Carbon Risk Pathways v2 (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states the calculation engine is a
> **"Climate Adjusted Value"** model: `V_climate = V_base × (1 – δ_physical) × (1 – δ_transition)`,
> citing TCFD Infrastructure guidance and CRREM Global Pathways v2, with headline data points
> "Physical Risk Haircut 6.2%" / "Transition Risk Haircut 11.4%" / "At-Risk AUM 34%". **None of
> this exists in the code.** `RealAssetsClimatePage.jsx` draws `valuationM`, `physicalRisk` and
> `transitionRisk` as three **independent** seeded-random numbers per asset — `valuationM` is never
> multiplied by any haircut derived from the risk scores, so there is no `δ_physical`/`δ_transition`
> anywhere in the file. A genuine cap-rate-based climate valuation haircut *is* implemented
> elsewhere on the platform (`real-estate-valuation` module, §7 of its own deep dive) but this
> module does not call it or replicate its logic. The sections below describe what this module's
> code actually computes: a 40-asset physical/transition risk screen with CRREM pathway and
> stranding-year analytics, all independently randomised.

### 7.1 What the module computes

40 named trophy real-estate/infrastructure assets (One World Trade Center, The Shard, Marina Bay
Sands, Hudson Yards, Amazon HQ2, six data centres, five logistics parks, etc. — real building
names used only as labels) are each assigned, purely from a seeded PRNG, 16 independent
attributes:

```js
physicalRisk   = round(5   + sr(i*7)  * 85)   // 5–90
transitionRisk = round(10  + sr(i*11) * 80)   // 10–90
crremScore     = round(10  + sr(i*13) * 85)   // 10–95
strandingYear  = 2025 + floor(sr(i*17) * 20)  // 2025–2044
epcRating      = A..F  from sr(i*19)
carbonIntensity= round(20  + sr(i*23) * 180)  // kgCO2/sqm
retrofitCostM  = round(1   + sr(i*37) * 49)   // $M
valuationM     = round(50  + sr(i*41) * 2950) // $M
floodRisk/heatStress/windExposure/seaLevelRisk = round(sr(i*k) * ~50–80)
greenCert, netZeroReady, adaptationPlan        = threshold flags on further sr() draws
```

No attribute is derived from another — `valuationM` (the "Portfolio Value" KPI) has **zero
mathematical relationship** to `physicalRisk`/`transitionRisk`/`carbonIntensity` for the same
asset, even though the dashboard visually juxtaposes them as if the valuation reflects the risk.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Risk score ranges | Physical 5–90, Transition 10–90, CRREM 10–95 | Synthetic demo ranges, no external calibration |
| Stranding-year window | 2025–2044 (uniform) | Synthetic — no CRREM-derived breach-year calculation |
| `badge()` colour thresholds | 25/50/75 (on `100 − risk`) | UI heuristic, not a regulatory scale |
| CRREM pathway seeds (`office`,`retail`,`logistics`) | `80/90/70 − i·(6/5/4) + noise`, target `75 − i·7` | Synthetic decay curve loosely shaped like CRREM's declining intensity budget, not sourced from actual CRREM sector pathway files |

### 7.3 Calculation walkthrough

1. **Asset screen** (`filtered`): text/type/region filters plus a client-side sort over the 16
   attributes; no aggregation logic beyond filtering.
2. **KPIs** (`kpis`): straight `reduce`/`length` averages of `physicalRisk`, `transitionRisk`,
   `crremScore` across the fixed 40-asset array (not the filtered set), `totalVal = Σ valuationM`,
   `strandedSoon = count(strandingYear ≤ 2030)`.
3. **Type-level risk** (`typeRisk`): per-`type` mean of `physicalRisk`/`transitionRisk` — a
   groupby-average, not a value-weighted portfolio metric.
4. **Radar** (`radarData`): mean of 6 dimensions (`physicalRisk`, `transitionRisk`, `crremScore`,
   `carbonIntensity`, `floodRisk`, `heatStress`), each capped at 100 — note `carbonIntensity`
   (20–200 raw kgCO₂/sqm) is plotted on the same 0–100 axis as the 0–100 risk scores without
   rescaling, so it is visually understated relative to its true range.
5. **CRREM pathway tab**: a separate, portfolio-independent synthetic time series (`CRREM`
   array, 10 points from 2025 to 2052) — not derived from any of the 40 assets' own
   `crremScore`/`carbonIntensity`.
6. **Stranding tab**: buckets the 40 assets by `strandingYear` into `By 2030` / `2031–2035` /
   `2036–2040` / `After 2040`, and cross-plots `carbonIntensity` vs `retrofitCostM` for the 15
   earliest-stranding assets — purely descriptive, no NPV/valuation impact computed.

### 7.4 Worked example

Asset index `i=0` ("One World Trade Center", Office, North America):

| Field | Formula | Result |
|---|---|---|
| `physicalRisk` | `round(5 + sr(7)·85)` | `sr(7)=frac(sin(8)×10⁴)=0.9894` → `5+84.1=89` |
| `transitionRisk` | `round(10 + sr(11)·80)` | `sr(11)=frac(sin(12)×10⁴)=0.6603` → `10+52.8=63` |
| `crremScore` | `round(10 + sr(13)·85)` | `sr(13)=frac(sin(14)×10⁴)=0.9906` → `10+84.2=94` |
| `strandingYear` | `2025+floor(sr(17)·20)` | `sr(17)≈0.9358` → `2025+18=2043` |
| `valuationM` | `round(50+sr(41)·2950)` | independent draw, e.g. ≈`$1,800M` |

Despite `physicalRisk=89` (top-quintile physical exposure) and `crremScore=94` (near-worst CRREM
alignment), `valuationM` is whatever its own independent seed produces — a bank model-validation
reviewer would flag this immediately: **the headline "Portfolio Value" KPI carries no climate risk
signal at all**, contradicting the dashboard's implied narrative that value and risk are linked.

### 7.5 Stranding-year rubric (as coded)

| Bucket | Colour | Meaning in UI |
|---|---|---|
| ≤ 2030 | Red | "stranded soon" — counted in KPI `strandedSoon` |
| 2031–2035 | Amber | near-term watch |
| 2036–2040 / >2040 | Green/neutral | longer runway |

No formal stranding definition (e.g. CRREM budget breach year) drives this bucket — it is read
directly off the random `strandingYear` field.

### 7.6 Data provenance & limitations

- **100% synthetic.** All 16 numeric/categorical fields per asset use the platform's seeded PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)`, deterministic across renders but not sourced from any real
  hazard model, CRREM pathway file, or valuation feed. Asset *names* are real buildings; every
  other field is fabricated.
- No cross-field correlation: physical risk, transition risk, CRREM score, carbon intensity and
  valuation are drawn from independent seeds, so no scenario, sector, or geography coherence
  exists (e.g. a Middle East asset need not have elevated heat stress).
- CRREM pathway tab is disconnected from the per-asset `crremScore` — two unrelated
  representations of "CRREM" appear on the same page.
- No discounting, no NPV impact of retrofit capex, no link between `retrofitCostM` and the
  stranding year it is nominally meant to avert.

### 7.7 Framework alignment

- **CRREM** (Carbon Risk Real Estate Monitor): the module borrows CRREM terminology (pathway
  chart, "1.5°C Target" line, stranding year) but does not compute an actual property/sector
  carbon-budget breach year — CRREM proper derives stranding year as the year a property's
  operational carbon intensity first exceeds the science-based sector decarbonisation budget;
  here it is a uniform random draw.
- **TCFD**: the module reports physical and transition risk scores per asset, aligned in spirit
  with TCFD's physical/transition risk categorisation, but the scores are not built from TCFD's
  recommended hazard/scenario methodology.
- **NGFS/IPCC scenario framework**: absent — no SSP/RCP or NGFS scenario selector conditions any
  number on this page (contrast with `real-estate-climate-risk`, which does implement an
  NGFS/SSP-conditioned VaR).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support a real-assets portfolio manager's decision to hold, retrofit, or divest a real estate /
infrastructure asset by producing a defensible **climate-adjusted valuation** and a genuine
CRREM-based stranding year, replacing the current uncorrelated random fields. Scope: office,
retail, logistics, hotel, data-centre, healthcare, and mixed-use assets globally.

### 8.2 Conceptual approach
Adopt a **multiplicative valuation-haircut model** consistent with the guide's original intent —
`V_climate = V_base × (1 − δ_physical) × (1 − δ_transition)` — mirroring **MSCI Real Estate
Climate Value-at-Risk** (which applies separate physical-damage and transition-cost haircuts to
appraised value) and **CRREM's own CapEx/valuation bridge tool** (which converts pathway breach
year into a stranding discount). This is preferable to a full climate-adjusted DCF (as used in
`real-estate-valuation`) here because the module's asset set spans non-real-estate infrastructure
where a full NOI/cap-rate build-up is not always available; a haircut-on-appraised-value approach
generalises better across asset classes.

### 8.3 Mathematical specification

```
δ_physical_i   = Σ_h  P(hazard_h) × Damage_h(asset_i) × ExposureWeight_h        (h ∈ {flood,heat,wind,SLR,wildfire})
δ_transition_i = min(1, CarbonPriceExposure_i / AssetEBITDA_i)                   [capped at 60%]
CarbonPriceExposure_i = CarbonIntensity_i × GIA_i × CarbonPrice_scenario × YearsToBudgetBreach_i⁻¹
StrandYear_i   = 2025 + (CRREM_budget_2025,sector − CarbonIntensity_i) / SectorAnnualDecayRate_sector
                  [floored at 2025 if already breached; capped at 2050]
V_climate_i    = V_base_i × (1 − δ_physical_i) × (1 − δ_transition_i)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `P(hazard_h)` | Annual exceedance probability by hazard/location | JRC (EU), FEMA/NOAA (US), or Aqueduct/ND-GAIN (global) — already in `reference_data` for flood/heat |
| `Damage_h()` | Vulnerability (damage-ratio) function | JRC flood depth-damage curves, ISO 7933 heat-productivity curves |
| `CRREM_budget_2025,sector` | Sector 1.5°C carbon intensity budget | CRREM Global Pathways v2 (public, per-country/sector CSV) |
| `SectorAnnualDecayRate` | Required annual kgCO₂/sqm reduction | CRREM pathway slope |
| `CarbonPrice_scenario` | $/tCO₂ under NGFS scenario | NGFS Phase IV price paths |

### 8.4 Data requirements
- Per-asset: GIA, location (lat/long or ISO3), sector, EPC/energy intensity, appraised value,
  EBITDA/NOI where available — currently only `real-estate-valuation`'s engine holds analogous
  fields (`backend/services/real_estate_valuation_engine.py`).
- Hazard layers: flood/heat/wind/SLR exceedance probabilities — platform already ingests World
  Bank/Aqueduct-style reference data (`reference_data_layer`); needs an asset-geocoding join.
- CRREM sector pathway table: not yet in `reference_data`; would need a one-time CSV import from
  CRREM's public pathway files (free, licensed for non-commercial analytics use).

### 8.5 Validation & benchmarking plan
- **Backtest**: compare modelled `StrandYear_i` against realised EPC-rating downgrades / actual
  capex events where available.
- **Sensitivity**: vary `CarbonPrice_scenario` across NGFS Orderly/Disorderly/Hot-house paths and
  confirm `δ_transition` ordering matches scenario severity (Hot-house should not always dominate
  near-term, since transition cost is orderly-scenario-driven — physical damage dominates in
  Hot-house at longer horizons).
- **Reconciliation target**: MSCI Real Estate Climate VaR outputs and CRREM's own CapEx tool
  stranding-year estimates for a shared sample of assets.

### 8.6 Limitations & model risk
- Damage functions are location/hazard-specific and highly uncertain at asset (vs regional)
  resolution; treat `δ_physical` as a range, not a point estimate.
- `δ_transition` via EBITDA ratio requires reliable NOI data, often unavailable for
  non-real-estate infrastructure — conservative fallback: cap `δ_transition` at the sector median
  from `real-estate-carbon-analytics`' `costAt100` sensitivity when asset-level EBITDA is missing.
- Model does not yet address correlated tail risk (e.g. simultaneous flood + wildfire under one
  physical scenario) — production version should use a joint hazard copula, not independent
  per-hazard summation.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the haircut identity by reusing platform engines (analytics ladder: rung 1 → 2)

**What.** §7 documents total disconnection between claim and code: the guide's `V_climate = V_base × (1 − δ_physical) × (1 − δ_transition)` exists nowhere — the 40 trophy assets (real building names as labels) carry 16 mutually independent `sr()` attributes, so `valuationM` bears zero mathematical relationship to the risk scores displayed beside it, stranding years are uniform draws rather than CRREM breach calculations, and the CRREM chart is a synthetic decay curve. Critically, the flag notes the fixes already exist on-platform: `real-estate-valuation` implements a genuine cap-rate climate haircut, and `re-portfolio-dashboard`'s backend engine does real CRREM pathway interpolation. Evolution A makes this module a consumer of those engines rather than a third implementation.

**How.** (1) Per asset, δ_transition from the `REPortfolioEngine` CRREM assessment (`POST /re-portfolio/crrem` — stranding year and carbon-cost drag from actual pathway files) and δ_physical from the digital-twin composite scorer at asset coordinates; `V_climate` computed by the guide's multiplicative identity, with both deltas' provenance in the payload. (2) The 40-asset demo book becomes an editable register with lat/lon and energy intensity (the inputs the engines need); real building names dropped or clearly flagged illustrative. (3) The infrastructure/agriculture asset types the RE engines don't cover get honest nulls with a documented scope note, not fabricated scores.

**Prerequisites.** Sibling engines' endpoints stable (dependency on `re-portfolio-dashboard` Evolution A wiring work); coordinates for register assets. **Acceptance:** raising an asset's energy intensity moves its stranding year and δ_transition in the same direction; assets outside engine scope show null haircuts, never random ones.

### 9.2 Evolution B — Cross-asset climate-screen copilot (LLM tier 2)

**What.** Once haircuts are real, the module's screen-and-prioritise workflow suits a copilot: "rank our logistics assets by climate-adjusted value loss and tell me which retrofit spends have positive NPV against their δ_transition", "summarize at-risk AUM under 1.5C vs 2C CRREM scenarios for the TCFD pack" — each a composition of tool calls to the valuation identity endpoint and the underlying CRREM/physical engines.

**How.** Tier-2 tool schemas over the Evolution-A endpoint plus the reused sibling engines (the Atlas interconnection map is the routing knowledge); the copilot's system prompt includes the module's scope note so infrastructure/agriculture questions get the documented "engine coverage does not extend here" response instead of an estimate. Retrofit-NPV answers use the register's `retrofitCostM` only after that field stops being a random draw — the prompt enumerates which register fields are user-supplied vs engine-derived, mirroring the §7.2 provenance table. Validator checks every $M and year against tool outputs.

**Prerequisites (hard).** Evolution A complete; field-provenance metadata exposed via the API so the copilot can distinguish user inputs from computed values. **Acceptance:** a prioritisation answer's ordering reproduces from the tool responses, and out-of-scope asset types are declined with the scope note cited.