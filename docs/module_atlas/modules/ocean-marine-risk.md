# Ocean & Marine Risk
**Module ID:** `ocean-marine-risk` · **Route:** `/ocean-marine-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies climate-driven ocean and marine risks including acidification, sea level rise, storm surge, and marine heatwaves for coastal assets, fisheries, and blue economy finance.

> **Business value:** Enables coastal asset owners, blue economy investors, and marine insurers to quantify and manage climate-driven ocean and marine risks using IPCC-aligned hazard science and financial impact modelling.

**How an analyst works this module:**
- Map coastal and marine assets to sea level rise, storm surge, and acidification hazard layers
- Apply IPCC AR6 sea level projections at 0.5° resolution under SSP2-4.5 and SSP5-8.5
- Score fisheries and aquaculture exposure to ocean warming and acidification using species sensitivity curves
- Compute MCRI by asset; estimate damage costs and adaptation investment requirements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `TABS`, `ZONES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `healthIdx` | `Math.round(sr(i*7)*40+40);const sst=+(sr(i*11)*4+22).toFixed(1);const acidification=+(sr(i*13)*0.3+7.8).toFixed(2);const o2=+(sr(i*17)*3+4).toFixed(1);` |
| `fishStockPct` | `Math.round(sr(i*19)*50+30);const overfished=Math.round(sr(i*23)*40);const mpasPct=+(sr(i*29)*30+2).toFixed(1);const plasticDensity=Math.round(sr(i*31)*50000+500);` |
| `blueGDP` | `+(sr(i*37)*50+2).toFixed(1);const shippingRoutes=Math.round(sr(i*41)*200+10);const coralCoverage=Math.round(sr(i*43)*60);const mangroveKm2=Math.round(sr(i*47)*5000);` |
| `yearly` | `Array.from({length:6},(_,y)=>({year:2019+y,health:Math.round(healthIdx-5+y*1.5+sr(i*100+y)*4),sst:+(sst+y*0.1+sr(i*100+y*3)*0.3).toFixed(1),plastic:Math.round(plasticDensity+y*1000+sr(i*100+y*7)*3000)}));` |
| `filtered` | `useMemo(()=>{let d=[...ZONES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(oceanF!=='All')d=d.filter(r=>r.ocean===oceanF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,oceanF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1)*P` |
| `stats` | `useMemo(()=>({count:filtered.length,avgHealth:Math.round(filtered.reduce((s,r)=>s+r.healthIndex,0)/filtered.length\|\|0),avgSST:(filtered.reduce((s,r)=>s+r.sst,0)/filtered.length\|\|0).toFixed(1),critical:filtered.filter(r=>` |
| `oceanAgg` | `useMemo(()=>{const m={};ZONES.forEach(z=>{if(!m[z.ocean])m[z.ocean]={o:z.ocean,health:0,sst:0,fish:0,n:0};m[z.ocean].health+=z.healthIndex;m[z.ocean].sst+=z.sst;m[z.ocean].fish+=z.fishStockHealthy;m[z.ocean].n++;});retur` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sea Level Rise by 2100 (SSP5-8.5) | — | IPCC AR6 WG1 2021 | Likely range of global mean sea level rise by 2100 under high-emission SSP5-8.5 scenario. |
| Ocean Acidification Change (pH, since 1850) | — | IPCC SROCC 2019 | Observed reduction in global average ocean pH since pre-industrial period, representing ~30% increase in hydrogen ion concentration. |
- **IPCC AR6 sea level projections, GEBCO bathymetry, CoSMO storm surge models, NOAA acidification data** → Hazard layer mapping, MCRI computation, damage cost estimation → **Coastal risk maps, asset MCRI scores, fisheries impact assessments**

## 5 · Intermediate Transformation Logic
**Methodology:** Marine Climate Risk Index
**Headline formula:** `MCRI = Σ (Hazardᵢ × Exposureᵢ × Sensitivityᵢ) / AdaptiveCapacity`

Multi-hazard composite combining ocean acidification intensity, sea level rise trajectory, storm surge probability, and marine heatwave frequency weighted by asset exposure and sensitivity.

**Standards:** ['IPCC SROCC 2019', 'UNEP-WCMC Ocean Risk and Resilience Action Alliance']
**Reference documents:** IPCC Special Report on the Ocean and Cryosphere in a Changing Climate (SROCC) 2019; IPCC AR6 WG1 Chapter 9 Ocean, Cryosphere and Sea Level; UNEP-WCMC Ocean Risk and Resilience Action Alliance; Swiss Re Ocean Risk Initiative

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** MODULE_GUIDES describes a **Marine Climate Risk Index (MCRI)**
> composite — `MCRI = Σ(Hazardᵢ × Exposureᵢ × Sensitivityᵢ) / AdaptiveCapacity`, aligned to IPCC
> SROCC 2019 and the UNEP-WCMC Ocean Risk and Resilience Action Alliance. **No such formula exists
> in the code.** The page instead generates five *independent* random indicators per ocean zone
> (health index, sea-surface temperature, acidification, dissolved O₂, fish-stock health) from the
> platform's seeded PRNG, with no hazard/exposure/sensitivity/adaptive-capacity structure connecting
> them. The sections below document what the code actually computes; §8 specifies the MCRI model
> the guide describes, for future implementation.

### 7.1 What the module computes

For each of a fixed set of ocean zones, five independently-seeded metrics are drawn per zone index `i`:

```js
healthIdx        = round(sr(i*7)*40 + 40)          // 40–80
sst               = sr(i*11)*4 + 22                 // 22–26 °C
acidification     = sr(i*13)*0.3 + 7.8               // pH 7.8–8.1
o2                = sr(i*17)*3 + 4                   // 4–7 mg/L
fishStockPct      = round(sr(i*19)*50 + 30)          // 30–80%
overfished        = round(sr(i*23)*40)               // 0–40%
mpasPct           = sr(i*29)*30 + 2                  // 2–32%
plasticDensity    = round(sr(i*31)*50000 + 500)      // particles/km²
blueGDP           = sr(i*37)*50 + 2                  // $2–52B
shippingRoutes    = round(sr(i*41)*200 + 10)
coralCoverage     = round(sr(i*43)*60)
mangroveKm2       = round(sr(i*47)*5000)
```

A 6-year trend series per zone extrapolates `healthIdx` linearly (−5 baseline, +1.5/yr drift) and
`sst` (+0.1 °C/yr) with additional seeded noise — a crude warming trend overlay, not a physically
modelled SST projection.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Health index base range | 40–80 | Synthetic demo value, no source |
| SST range | 22–26 °C | Synthetic demo value; plausible tropical/temperate SST but not location-specific |
| Acidification (pH) range | 7.8–8.1 | Broadly consistent with observed global mean ocean pH (~8.05, IPCC SROCC) but not derived from it |
| SST warming drift | +0.1 °C/yr | Synthetic; roughly in the observed range (IPCC AR6: +0.88 °C since 1850 for upper ocean) but arbitrary per-zone |
| Risk tier bands | composite > 65 High / > 40 Medium / else Low (pattern shared across platform) | Not present in this module's `computed` list at all — no risk tier field is derived from the five random indicators |

None of these constants are IPCC SROCC- or Aqueduct-sourced; they are seeded pseudo-random draws
bounded to plausible-looking ranges.

### 7.3 Calculation walkthrough

1. `ASSETS`/zone table is generated once at module load via `sr(seed)`, seeded by zone index and a
   per-metric offset (7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47) so each metric is statistically
   independent of the others for a given zone.
2. `filtered` applies search/ocean-basin filters and an in-place `.sort()` on the filtered copy.
3. `stats` aggregates `avgHealth`, `avgSST`, and a `critical` count over `filtered`, each guarded
   with `|| 0` division-safety.
4. `oceanAgg` re-aggregates the *unfiltered* `ZONES` array by ocean basin (health/SST/fish-stock
   sums ÷ zone count `n`), independent of the page's search/filter state — a display inconsistency
   worth noting (basin roll-up ignores active filters while the KPI cards respect them).
5. `yearly` builds the 6-year trend overlay described above, purely cosmetic (chart-only).

### 7.4 Worked example

Zone index `i = 5`:

| Metric | Formula | Result |
|---|---|---|
| `healthIdx` | round(sr(35)×40+40) | e.g. 62 |
| `sst` | sr(55)×4+22 | e.g. 23.8 °C |
| `acidification` | sr(65)×0.3+7.8 | e.g. 7.94 |
| `fishStockPct` | round(sr(95)×50+30) | e.g. 58% |

There is no aggregation step combining these into a single "marine climate risk" number — each is
displayed as a standalone KPI/column. A user cannot reconstruct the guide's MCRI from the page's
own outputs because none of Hazard, Exposure, Sensitivity, or Adaptive Capacity are labelled or
computed anywhere in the code.

### 7.5 Data provenance & limitations

- **All zone data is synthetic demo data** from `sr(seed) = frac(sin(seed+1)×10⁴)`; there is no
  ingestion of IPCC AR6 SLR grids, JBA/Aqueduct flood layers, or NOAA acidification time series
  despite the guide's `dataLineage` claiming this pipeline exists.
- No hazard/exposure/sensitivity decomposition, so the module cannot support the guide's stated
  user interaction "Compute MCRI by asset; estimate damage costs and adaptation investment
  requirements" — damage costs and adaptation capex are not computed anywhere in this page.
- Sea-level-rise, storm-surge, and ocean-acidification-*change* (the guide's two headline
  `dataPoints`, 0.63–1.01 m SLR by 2100 and −0.12 pH units since 1850) are absent from the code;
  the module shows only present-day pH level and SST, not the delta-since-preindustrial or a
  future SLR trajectory.

**Framework alignment:** the guide names IPCC SROCC 2019 and IPCC AR6 WG1 Ch.9 as bases for an
MCRI computation; the code implements neither — it is a generic seeded-random "ocean health"
dashboard. UNEP-WCMC ORRAA and Swiss Re Ocean Risk Initiative are cited as references but have no
corresponding logic in the page.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Score climate-driven ocean/marine risk for coastal real assets, fisheries exposure, and blue-economy
financings, producing a single composite index (MCRI) usable in underwriting, portfolio screening,
and adaptation-capex prioritisation — the decision the guide's `userInteraction` list describes.

### 8.2 Conceptual approach
Adopt the standard IPCC risk framework — **Risk = f(Hazard, Exposure, Vulnerability)** — as used in
IPCC AR6 WG2 and mirrored by Swiss Re CatNet and Aqueduct Water Risk methodologies: hazards are
scored independently per peril, combined multiplicatively with asset exposure value and a
sensitivity/vulnerability curve, then normalised by an adaptive-capacity discount (mirrors ND-GAIN
country vulnerability/readiness scoring, and Munich Re NatCatSERVICE's exposure×vulnerability
damage-function convention).

### 8.3 Mathematical specification

```
Hazard_h        = normalised 0–1 intensity of hazard h (SLR, marine heatwave, acidification, storm surge)
Exposure        = asset/fishery value at risk in the zone ($)
Sensitivity_h   = damage-function slope for asset/species class vs hazard h (0–1)
AdaptiveCap     = 0–1 composite of MPA coverage, monitoring density, early-warning infrastructure

MCRI = Σ_h (Hazard_h × Sensitivity_h) × Exposure / max(AdaptiveCap, 0.1)
```

| Parameter | Calibration source |
|---|---|
| SLR by 2100 (SSP5-8.5) | IPCC AR6 WG1 Ch.9, 0.63–1.01 m likely range |
| Acidification Δ pH | IPCC SROCC 2019, −0.12 units since 1850 |
| Marine heatwave frequency | NOAA Coral Reef Watch bleaching-alert-area time series |
| Species sensitivity curves | FAO/IPCC fisheries vulnerability assessments |
| MPA coverage / adaptive capacity | UNEP-WCMC Protected Planet database |

### 8.4 Data requirements
Per-zone: coordinates, asset class, insured/asset value ($), MPA coverage %, historical
bleaching/storm events. Public sources: NOAA Coral Reef Watch (bleaching), IPCC AR6 Atlas (SLR
grids), WRI Aqueduct 4.0 (coastal flood), UNEP-WCMC Protected Planet (MPA). None of this is
currently ingested into the platform's `reference_data` tables for this module.

### 8.5 Validation & benchmarking plan
Backtest composite scores against Swiss Re Ocean Risk Initiative loss data and EM-DAT
storm-surge/coastal-flood events; reconcile SLR outputs against IPCC AR6 regional sea-level
projections; sensitivity-test the AdaptiveCapacity denominator (it dominates the score at low
values — floor it as shown to avoid blow-up).

### 8.6 Limitations & model risk
Multiplicative hazard combination assumes independence across perils (SLR and storm surge are
correlated — a copula or max-of-perils treatment may be more conservative); species/asset
sensitivity curves are thin in public literature outside coral and mangrove ecosystems, so DQ will
be uneven across zones.

## 9 · Future Evolution

### 9.1 Evolution A — Build the MCRI composite over real hazard layers (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide describes a Marine Climate Risk Index (`MCRI = Σ(Hazardᵢ × Exposureᵢ × Sensitivityᵢ) / AdaptiveCapacity`) aligned to IPCC SROCC and ORRAA, but the code draws five *independent* `sr()` indicators per ocean zone (health index, SST, acidification, dissolved O₂, fish-stock) with no hazard/exposure/sensitivity/adaptive-capacity structure connecting them; the 6-year trend is a crude linear warming overlay. §8 already specifies the MCRI model. Evolution A implements it over real IPCC-aligned data.

**How.** (1) `POST /api/v1/ocean-marine-risk/mcri` computing the documented composite: hazard layers from IPCC AR6/SROCC sea-level and SST projections at the 0.5° resolution §1 describes (SSP2-4.5 and SSP5-8.5), joined to asset coordinates via the platform's geographic layer; exposure from asset value; sensitivity from species/asset-class curves; adaptive capacity from a coastal-defence/adaptation-investment indicator. (2) Fisheries exposure scoring (§1) from real species-sensitivity-to-warming/acidification curves rather than a seeded `fishStockPct`. (3) Reuse the Physical Risk Digital Twin's cyclone/sea-level grids for the storm-surge and SLR hazard terms rather than a parallel data path.

**Prerequisites.** This is greenfield MCRI — the current page has no real structure; IPCC projection data ingestion; the digital-twin sea-level grid is thin (152 rows, named-city samples) so coverage needs a resolution caveat per zone. **Acceptance:** MCRI decomposes into named hazard/exposure/sensitivity/adaptive-capacity terms from real data; two assets at different coordinates score differently via actual SLR/SST exposure; no `sr()` remains.

### 9.2 Evolution B — Coastal-asset risk copilot (LLM tier 1 → 2, gated on the model)

**What.** A copilot for the coastal-asset-owner/marine-insurer users §1 targets: "what's the marine climate risk for a port at these coordinates under SSP5-8.5?", "how does acidification threaten this aquaculture operation?", "which of my coastal assets face the highest MCRI?" — grounded, post-Evolution-A, in the real MCRI decomposition and the IPCC SROCC / ORRAA references named in §5.

**How.** Tier 1 near-term is framework-only: the copilot explains marine climate hazards, the MCRI structure, and IPCC SROCC findings from the standards corpus, but must refuse to score the user's assets because today's zone metrics are fabricated — a hard refusal path, since a marine insurer acting on seeded risk numbers would be a real liability. Tier 2 with Evolution A: tool calls to the MCRI endpoint per asset, decomposing scores into hazard/exposure/sensitivity terms with the fabrication validator matching every index to outputs; SSP-scenario what-ifs become recomputations. Provenance expander cites the IPCC projection vintage and resolution tier per asset.

**Prerequisites.** Tier 1 needs standards corpus + explicit current-state disclosure; asset scoring is gated on Evolution A. **Acceptance:** framework answers cite SROCC/ORRAA; asset MCRI (post-Evolution-A) traces to tool calls with hazard decomposition; the copilot refuses to score assets against the current placeholder metrics.