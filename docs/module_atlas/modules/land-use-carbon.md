# Land Use Carbon Analytics
**Module ID:** `land-use-carbon` · **Route:** `/land-use-carbon` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements IPCC 2006 LULUCF accounting methodologies to quantify carbon stocks and fluxes from land use change, forestry, agriculture, and wetland restoration activities. Supports Article 6 land sector credit origination, REDD+ programme monitoring, and Scope 3 Category 1 land-use emissions attribution for agricultural commodity supply chains. Integrates satellite-derived biomass estimates with national forest inventories.

> **Business value:** Provides forest developers, agri-commodity traders, and land sector financiers with IPCC-consistent carbon accounting tools for REDD+ project development, supply chain deforestation attribution, and voluntary carbon market credit origination.

**How an analyst works this module:**
- Define land use categories and boundaries using the spatial file uploader or jurisdiction selector
- Import or connect satellite biomass estimates and cross-validate against national forest inventory reference levels
- Run LULUCF carbon stock change calculation across all five IPCC carbon pools
- Apply permanence and leakage adjustments for credit origination or voluntary market issuance
- Export land sector GHG accounts in UNFCCC common reporting format or Verra registry submission format

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `COUNTRIES`, `Card`, `IPCC_TIERS`, `KPI`, `LAND_COLORS`, `LAND_TYPES`, `METHODOLOGIES`, `NBS_TYPES`, `PARCELS`, `Pill`, `TABS`, `VINTAGES`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `METHODOLOGIES` | `['VCS VM0007','VCS VM0042','Gold Standard AR','CDM AR-AM','Puro.earth Biochar','ACR Improved Forest','Plan Vivo','REDD+ Jurisdictional'];` |
| `landType` | `LAND_TYPES[Math.floor(s1*LAND_TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `area` | `Math.floor(50+s3*9950);` |
| `carbonStock` | `landType==='Forest'?Math.floor(150+s4*350):landType==='Peatland'?Math.floor(500+s4*1500):landType==='Mangrove'?Math.floor(300+s4*700):landType==='Wetland'?Math.floor(100+s4*400):landType==='Grassland'?Math.floor(30+s4*70` |
| `annualFlux` | `landType==='Forest'\|\|landType==='Mangrove'\|\|landType==='Wetland'?+(2+s5*8).toFixed(1):landType==='Peatland'?+(s5>0.4?3+s5*5:-2-s5*8).toFixed(1):landType==='Degraded'?+(-1-s5*5).toFixed(1):+(0.5+s5*3).toFixed(1);` |
| `priorLandUse` | `LAND_TYPES[Math.floor(sr(i*29+13)*LAND_TYPES.length)];` |
| `conversionYear` | `2000+Math.floor(sr(i*31+15)*25);` |
| `conversionEmissions` | `priorLandUse!==landType?Math.floor(50+sr(i*37+17)*500):0;` |
| `ipccTier` | `IPCC_TIERS[Math.floor(sr(i*41+19)*IPCC_TIERS.length)];` |
| `methodology` | `METHODOLOGIES[Math.floor(sr(i*43+21)*METHODOLOGIES.length)];` |
| `vintage` | `VINTAGES[Math.floor(sr(i*47+23)*VINTAGES.length)];` |
| `verified` | `sr(i*53+25)>0.35;` |
| `creditPrice` | `Math.floor(8+sr(i*59+27)*52);` |
| `eligibleArea` | `Math.floor(area*(0.3+sr(i*61+29)*0.6));` |
| `annualCredits` | `Math.floor(eligibleArea*annualFlux*0.7);` |
| `permanenceBuffer` | `Math.floor(10+sr(i*67+31)*20);` |
| `leakageDeduction` | `Math.floor(5+sr(i*71+33)*15);` |
| `projectedRevenue` | `Math.floor(annualCredits*creditPrice/1000);` |
| `soilCarbon` | `Math.floor(carbonStock*0.3+sr(i*73+35)*carbonStock*0.2);` |
| `biomassCarbon` | `carbonStock-soilCarbon;` |
| `yearlyStock` | `YEARS.map((_,yi)=>Math.floor(carbonStock+annualFlux*yi+sr(i*79+yi*13)*20));` |
| `TABS` | `['Land Carbon Inventory','LULUCF Accounting','Nature-Based Solutions','Carbon Credit Potential'];` |
| `dir` | `sortDir==='asc'?1:-1;` |
| `stats` | `useMemo(()=>{ const totalArea=filtered.reduce((a,p)=>a+p.area,0);` |
| `totalStock` | `filtered.reduce((a,p)=>a+p.totalStock,0);` |
| `avgStock` | `filtered.length?Math.floor(filtered.reduce((a,p)=>a+p.carbonStock,0)/filtered.length):0;` |
| `netFlux` | `+(filtered.reduce((a,p)=>a+p.annualFlux*p.area,0)/1000).toFixed(0);` |
| `sinkPct` | `filtered.length?Math.floor(filtered.filter(p=>p.netSink).length/filtered.length*100):0;` |
| `verifiedPct` | `filtered.length?Math.floor(filtered.filter(p=>p.verified).length/filtered.length*100):0;` |
| `totalCredits` | `filtered.reduce((a,p)=>a+p.annualCredits,0);` |
| `totalRevenue` | `filtered.reduce((a,p)=>a+p.projectedRevenue,0);` |
| `landTypeBreakdown` | `useMemo(()=>LAND_TYPES.map((lt,lti)=>{const ps=filtered.filter(p=>p.landType===lt);return{name:lt,count:ps.length,totalArea:ps.reduce((a,p)=>a+p.area,0),avgStock:ps.length?Math.floor(ps.reduce((a,p)=>a+p.carbonStock,0)/p` |
| `yearTrend` | `useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),totalStockMt:Math.floor(filtered.reduce((a,p)=>a+p.yearlyStock[yi]*p.area,0)/1000000)})),[filtered]);` |
| `PAGE_SIZE` | `10;const totalPages=Math.ceil(filtered.length/PAGE_SIZE);const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);` |
| `conversionMatrix` | `LAND_TYPES.map(from=>({from,conversions:LAND_TYPES.map(to=>filtered.filter(p=>p.priorLandUse===from&&p.landType===to).length)}));` |
| `tierBreakdown` | `IPCC_TIERS.map(t=>({tier:t,count:filtered.filter(p=>p.ipccTier===t).length}));` |
| `nbsData` | `NBS_TYPES.map((n,ni)=>({name:n.length>16?n.slice(0,16)+'...':n,fullName:n,seqRate:+(2+sr(ni*17+1)*12).toFixed(1),costPerHa:Math.floor(500+sr(ni*23+3)*4500),costPerTCO2:Math.floor(5+sr(ni*29+5)*35),cobenefits:Math.floor(3` |
| `costBenefitCurve` | `nbsData.map(n=>({name:n.name,abatement:n.seqRate,cost:n.costPerTCO2})).sort((a,b)=>a.cost-b.cost);` |
| `methBreakdown` | `METHODOLOGIES.map(m=>{const ps=filtered.filter(p=>p.methodology===m);return{name:m.length>18?m.slice(0,18)+'...':m,fullName:m,count:ps.length,totalCredits:ps.reduce((a,p)=>a+p.annualCredits,0),avgPrice:ps.length?Math.flo` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COUNTRIES`, `IPCC_TIERS`, `LAND_COLORS`, `LAND_TYPES`, `METHODOLOGIES`, `NBS_TYPES`, `TABS`, `VINTAGES`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Above-Ground Biomass Density (tC/ha) | — | ESA CCI Biomass / national forest inventory | Carbon stock in live above-ground tree biomass per hectare of forest land |
| Soil Organic Carbon (tC/ha) | — | ISRIC SoilGrids / IPCC default tables | Carbon stored in mineral and organic soils to 30 cm depth |
| Annual Net Flux (MtCO2e/yr) | — | IPCC LULUCF accounts / satellite change detection | Net land sector emission or removal in the analysis area per year |
| Permanence Buffer (% of credits) | — | Verra buffer pool methodology | Proportion of earned credits held in risk buffer account against reversal events |
- **ESA CCI / Copernicus satellite biomass products** → Mosaic to analysis boundary; validate against field plots; apply uncertainty envelope → **Spatially explicit biomass density map in tC/ha**
- **National forest inventory databases** → Extract species-specific allometric equations; compute per-plot biomass and extrapolate → **Tier 2 biomass expansion factors by land use category and region**
- **Land use change detection layers** → Apply transition matrices to compute area converted per land use class pair per year → **Annual land use change area matrix for LULUCF flux calculation**

## 5 · Intermediate Transformation Logic
**Methodology:** LULUCF Carbon Stock Change
**Headline formula:** `ΔC = (Cₜ − Cₜ₋₁) × CF× 44/12`

Carbon stock change is computed for five pools: above-ground biomass, below-ground biomass, dead wood, litter, and soil organic carbon. Stocks are derived from Tier 2 biomass expansion factors or Tier 3 allometric equations. The 44/12 conversion converts carbon mass to CO2-equivalent. Permanence and leakage buffers follow Verra or Gold Standard registry requirements.

**Standards:** ['IPCC 2006 Guidelines Vol. 4 Agriculture, Forestry and Other Land Use', 'UNFCCC REDD+ Warsaw Framework', 'Verra VM0007 REDD+ Methodology', 'GHG Protocol Land Sector & Removals Guidance 2022']
**Reference documents:** IPCC 2006 Guidelines for National GHG Inventories â€” Volume 4 AFOLU; UNFCCC Warsaw Framework for REDD+ 2013; Verra VM0007 REDD+ Methodology Framework v1.6; GHG Protocol Land Sector and Removals Guidance 2022; FAO Global Forest Resources Assessment 2020

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide advertises a five-pool IPCC LULUCF stock-change model
> (`ΔC = (Cₜ − Cₜ₋₁) × CF × 44/12` across above-ground biomass, below-ground biomass, dead wood,
> litter and soil organic carbon, with Tier-2/Tier-3 biomass expansion factors). **The code does not
> implement pool-by-pool stock change or the 44/12 conversion.** It generates 40 synthetic parcels
> with a single `carbonStock` number split only two ways (soil 30–50%, biomass = remainder), and
> issues credits by a flat heuristic `annualCredits = eligibleArea × annualFlux × 0.7`. IPCC tier and
> methodology are decorative labels drawn at random. Sections below document the code.

### 7.1 What the module computes

For 40 parcels (`genParcels(40)`), each field is a PRNG draw `sr(s)=frac(sin(s+1)×10⁴)`:

```js
landType   = LAND_TYPES[floor(s1·8)]           // Cropland/Grassland/Forest/Wetland/Urban/Degraded/Peatland/Mangrove
area       = floor(50 + s3·9950)               // ha
carbonStock= { Forest:150+s4·350, Peatland:500+s4·1500, Mangrove:300+s4·700,
               Wetland:100+s4·400, Grassland:30+s4·70, Cropland:20+s4·60,
               Degraded:5+s4·25, else:2+s4·15 }        // tC/ha — land-type-conditioned band
annualFlux = Forest|Mangrove|Wetland: 2+s5·8;  Peatland: (s5>0.4? +3..8 : −2..−10);
             Degraded: −1..−6;  else: 0.5..3.5           // tC/ha/yr (sign = sink/source)
```

The credit engine (Carbon Credit Potential tab):

```js
eligibleArea    = floor(area × (0.3 + sr·0.6))          // 30–90% of parcel eligible
annualCredits   = floor(eligibleArea × annualFlux × 0.7)  // 0.7 = combined buffer/uncertainty haircut
permanenceBuffer= floor(10 + sr·20)   %                 // 10–30% buffer pool
leakageDeduction= floor(5  + sr·15)   %                 // 5–20%
creditPrice     = floor(8  + sr·52)   $/tCO₂            // $8–60
projectedRevenue= floor(annualCredits × creditPrice / 1000)   // $ thousands
soilCarbon      = floor(carbonStock×0.3 + sr·carbonStock×0.2)  // 30–50% of stock
biomassCarbon   = carbonStock − soilCarbon
yearlyStock[yi] = floor(carbonStock + annualFlux·yi + sr·20)   // 8-year projection
```

Note `annualCredits` uses **flux in tC** but is labelled tCO₂ credits — the guide's 44/12 (=3.667)
carbon→CO₂ conversion is **not applied**, so credits are understated ~3.7× relative to a correct
IPCC accounting. The `0.7` factor is the only deduction actually applied to issuance (the separately
computed `permanenceBuffer`/`leakageDeduction` are displayed but not subtracted from `annualCredits`).

### 7.2 Parameterisation / scoring rubric

| Constant | Values | Provenance |
|---|---|---|
| `LAND_TYPES` (8) | Cropland…Mangrove | Hard-coded; IPCC land categories |
| `carbonStock` bands per type | Forest 150–500, Peatland 500–2000, Mangrove 300–1000 tC/ha | **Plausible IPCC-consistent magnitudes** but PRNG-drawn within band, not from `EMISSION_FACTORS` (imported but unused for stock) |
| `IPCC_TIERS` | Tier 1/2/3 | Label only — assigned `IPCC_TIERS[floor(sr·3)]`, no tier-specific maths |
| `METHODOLOGIES` (8) | VCS VM0007, VM0042, Gold Standard AR, CDM AR-AM, Puro.earth Biochar, ACR IFM, Plan Vivo, REDD+ Jurisdictional | Real registry methodology names; assigned at random |
| Issuance haircut | `×0.7` | Synthetic combined buffer proxy |
| Permanence buffer | 10–30% | Verra buffer-pool range (guide cites 10–40%) |

### 7.3 Calculation walkthrough

`PARCELS` built once → filtered by land type/country/methodology/search → four tabs aggregate:
- **Land Carbon Inventory** — `totalStock = Σ carbonStock×area`, avg stock, net-sink %.
- **LULUCF Accounting** — `conversionMatrix` (prior→current land-use counts), tier breakdown,
  `conversionEmissions` (50–550 tC where prior≠current land type).
- **Nature-Based Solutions** — 8 NBS types with PRNG seq rate (2–14 tCO₂/ha/yr), cost/ha, cost/tCO₂.
- **Carbon Credit Potential** — `totalCredits`, `totalRevenue`, methodology & land-type breakdowns.

### 7.4 Worked example (a Forest parcel)

Suppose parcel i gives `landType=Forest, area=4000 ha, carbonStock=300 tC/ha, annualFlux=6 tC/ha/yr,
creditPrice=$30`, with `eligibleArea = floor(4000×0.6)=2400 ha`:

| Step | Formula | Value |
|---|---|---|
| Annual credits | 2400 × 6 × 0.7 | **10,080** (labelled tCO₂, actually tC) |
| Correct IPCC credits | 10,080 × 44/12 | 36,960 tCO₂ (**not** computed by code) |
| Projected revenue | 10,080 × 30 / 1000 | **$302k** |
| Soil carbon | 300×0.3 + sr×300×0.2 (say sr=0.5) | 90 + 30 = **120 tC/ha** |
| Biomass carbon | 300 − 120 | **180 tC/ha** |
| Total stock | 300 × 4000 | **1.2 MtC** |

The 3.7× understatement of issued credits (missing 44/12) is the headline methodological gap.

### 7.5 Data provenance & limitations

- **All 40 parcels are synthetic** (`sr()` PRNG). Land-type carbon-stock bands and NBS rates are
  IPCC-plausible but not sourced from the imported `EMISSION_FACTORS` reference table.
- **No true five-pool ΔC accounting**, no Tier-2/3 biomass expansion factors, no 44/12 conversion —
  credits are a flat `flux × area × 0.7`. Permanence and leakage are shown but not deducted.
- IPCC tier and registry methodology are random labels with no effect on numbers.

**Framework alignment:** IPCC 2006 Guidelines Vol. 4 AFOLU — the module names the five pools and
uses land-category stock bands, but implements only a lumped stock (soil/biomass split), not the
gain-loss or stock-difference methods. Verra VM0007 (REDD+) / VM0042 (ALM) — methodology labels only.
GHG Protocol Land Sector & Removals (2022) — permanence/leakage vocabulary surfaced, not enforced.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (Credits are a synthetic `flux×area×0.7`
with no 44/12 conversion and no pool accounting.)

### 8.1 Purpose & scope
A production LULUCF carbon-accounting model that issues defensible removal/avoidance credits per
land parcel across all five IPCC pools, for REDD+ / ARR / IFM project developers and Scope-3 land
attribution. Coverage: forest, wetland, peatland, mangrove, grassland, cropland parcels.

### 8.2 Conceptual approach
IPCC stock-difference (or gain-loss) accounting with registry buffer/leakage deductions. Benchmarks:
IPCC 2006 Vol. 4 Tier-2/3 methods; Verra VCS VM0007/VM0033 crediting; Trucost/S&P land-use factors
for portfolio attribution; ESA CCI Biomass + ISRIC SoilGrids for spatial calibration.

### 8.3 Mathematical specification

```
For each pool p ∈ {AGB, BGB, deadwood, litter, SOC}:
  ΔC_p = (C_{p,t} − C_{p,t−1}) × Area                  [tC]
Net_ΔC = Σ_p ΔC_p
Gross_removals_tCO2 = max(0, Net_ΔC) × 44/12           ← the missing conversion
Issuable = Gross_removals × (1 − buffer%) × (1 − leakage%) × (1 − uncertainty_deduction%)
BGB = AGB × R (root:shoot);  SOC from IPCC reference SOC × F_LU × F_MG × F_I
Revenue = Issuable × credit_price;  NPV = Σ_t Revenue_t/(1+r)^t − dev_cost
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Carbon fraction | CF ≈ 0.47 | IPCC default |
| C→CO₂ | 44/12 = 3.667 | Stoichiometric |
| Root:shoot ratio | R | IPCC 2006 Table 4.4 by ecozone |
| SOC land-use/mgmt/input factors | F_LU,F_MG,F_I | IPCC 2006 Vol.4 Ch.5 |
| Buffer pool % | 10–40% | Verra non-permanence risk tool |
| Leakage % | 5–20% | Methodology-specific (VM0007) |

### 8.4 Data requirements
- AGB density map (ESA CCI Biomass / national forest inventory), SOC (ISRIC SoilGrids), land-use
  change layers (Hansen/GFW), ecozone → root:shoot, registry buffer tool inputs.
- Platform already has `EMISSION_FACTORS` (`data/referenceData`) — wire it into stock/flux instead
  of PRNG bands.

### 8.5 Validation & benchmarking plan
- Reconcile issued credits against Verra registry issuances for comparable projects.
- Backtest stock projections vs remote-sensed biomass change; report bias.
- Sensitivity on buffer/leakage and SOC factors; Monte-Carlo the uncertainty deduction.

### 8.6 Limitations & model risk
- Greatest risk: baseline/additionality gaming and non-permanence (reversal). Enforce dynamic buffer.
- Tier-1 defaults carry wide uncertainty; require Tier-2 EFs before high-value issuance.
- Peatland can be a large source — sign errors in flux must be caught by mass-balance checks.

## 9 · Future Evolution

### 9.1 Evolution A — Five-pool IPCC accounting with the 44/12 fix and real buffer arithmetic (analytics ladder: rung 1 → 2)

**What.** §7.1 documents both fabrication and a genuine calc bug: the 40 parcels are `sr()` draws (with land-type-conditioned bands that are at least directionally sensible — peatland 500–2000 tC/ha), but `annualCredits = eligibleArea × annualFlux × 0.7` uses **flux in tC while labelling the output tCO₂ credits — the 44/12 (×3.667) conversion is never applied, understating credits ~3.7×** — and the separately-computed `permanenceBuffer`/`leakageDeduction` percentages are displayed but never subtracted from issuance. The guide's five-pool model (AGB/BGB/dead wood/litter/SOC) collapses to a two-way soil/biomass split. Evolution A implements the §5 methodology properly: `ΔC` per pool per IPCC 2006 Vol. 4, `× 44/12` to CO₂e, issuance = `gross × (1 − buffer%) × (1 − leakage%)` per Verra convention, with Tier-2 defaults from the IPCC EF database and SoilGrids/ESA-CCI data paths per the §4.1 lineage.

**How.** (1) Log the missing-44/12 and unapplied-buffer defects in the calc-bug backlog first — they invalidate every revenue figure on the page. (2) A backend vertical: `land_parcels` table (geometry, land type, pools) + `POST /land-use-carbon/stock-change` computing pool-wise ΔC with tier-appropriate factors; ESA CCI biomass ingestion for AGB where coordinates exist (the digital-twin PostGIS scaffold is the pattern). (3) Methodology/tier become consequential: the chosen VCS/Gold Standard methodology drives which buffer defaults apply, instead of being a random label. (4) A worked parcel pins in bench_quant with the hand-computable five-pool arithmetic.

**Prerequisites.** The `genParcels(40)` seeding deleted; IPCC default-factor tables in refdata; parcel input UX (spatial upload per the §1 workflow). **Acceptance:** credits render in tCO₂e with the 44/12 step visible; buffer and leakage actually reduce issuance; two parcels with identical stock but different methodologies issue differently for a documented reason.

### 9.2 Evolution B — Credit-origination copilot for land-sector developers (LLM tier 2)

**What.** A tool-calling assistant for the module's stated users (forest developers, agri traders): "which methodology fits a 2,000 ha mangrove restoration in Indonesia — VM0007 or Gold Standard AR, and what buffer would each hold?", "walk me through this parcel's stock-change calculation pool by pool", "what does the Verra registry submission need that we haven't computed?" Each quantitative answer executes the Evolution A stock-change and issuance routes; methodology guidance grounds in the curated `METHODOLOGIES` list expanded with per-methodology eligibility rules.

**How.** Tier 2: tool schemas over the parcel/stock-change/issuance routes; pool-by-pool explanations mirror the engine's decomposition so nothing is narrated that wasn't computed. Registry-format answers map computed fields to Verra/UNFCCC CRF templates with gaps enumerated. Discipline rules: carbon-vs-CO₂e units always stated (the very confusion Evolution A fixes is the one users bring); permanence claims never exceed the buffer mechanics actually modelled; price/revenue projections quote the entered price assumption, not a market forecast the module doesn't have. Cross-references to the platform's carbon-credit module family (Verra registry data is already seeded platform-wide) for market context.

**Prerequisites (hard).** Evolution A — narrating the current issuance math would propagate a 3.7× unit error with fluent confidence, the worst kind of copilot failure. Phase 2 tooling. **Acceptance:** every tCO₂e figure traces to a tool call with units explicit; methodology recommendations cite eligibility rules; registry-gap lists match the computed-field inventory.