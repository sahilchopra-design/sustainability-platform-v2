# Climate Resilient Design
**Module ID:** `climate-resilient-design` · **Route:** `/climate-resilient-design` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies physical climate adaptation options for infrastructure and real estate assets, scoring resilience measures by cost-benefit, hazard reduction, and asset life extension.

> **Business value:** Helps infrastructure owners, real estate investors, and lenders optimise adaptation investment decisions using rigorous cost-benefit analysis grounded in climate hazard science.

**How an analyst works this module:**
- Map asset to primary physical hazards using lat/long and hazard return-period layers
- Generate adaptation option menu (elevation, flood barriers, green infrastructure, materials upgrade)
- Model residual risk post-adaptation for each measure using engineering reduction factors
- Calculate ABCR, payback period, and carbon co-benefits; rank options by combined score

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `HAZARDS`, `HAZARD_COLORS`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Office','Retail','Residential','Industrial','Logistics','Mixed-Use'];` |
| `type` | `TYPES[Math.floor(s*6)];const city=CITIES[Math.floor(s2*CITIES.length)];` |
| `area` | `Math.floor(1000+s3*48000);const value=Math.floor(area*(type==='Office'?4500:type==='Retail'?3200:type==='Residential'?5500:2000)*(0.8+s4*0.4));` |
| `yearBuilt` | `Math.floor(1960+s5*63);` |
| `hazards` | `HAZARDS.map((h,j)=>{const score=Math.floor(10+sr(i*31+j*7)*90);return{hazard:h,score,rating:score>70?'Critical':score>50?'High':score>30?'Medium':'Low'};});` |
| `composite` | `Math.floor(hazards.reduce((sum,h)=>sum+h.score,0)/hazards.length);` |
| `resilience` | `Math.floor(100-composite*(0.6+s6*0.4));` |
| `costOfInaction` | `Math.floor(value*(composite/100)*0.15);` |
| `uhiEffect` | `+(1.5+sr(i*37)*4.5).toFixed(1);` |
| `coolingDemand` | `Math.floor(20+uhiEffect*15+s*30);` |
| `adaptationBudget` | `Math.floor(value*0.02*(0.5+s4));` |
| `insurancePremium` | `Math.floor(value*0.003*(1+composite/100));` |
| `adaptedInsurance` | `Math.floor(insurancePremium*(0.6+resilience/100*0.3));` |
| `floodProjection` | `Array.from({length:8},(_,i)=>({decade:`${2020+i*10}s`,zone3b:Math.floor(buildings.filter(b=>b.floodZone==='Zone 3b').length*(1+i*0.15)),zone3a:Math.floor(buildings.filter(b=>b.floodZone==='Zone 3a').length*(1+i*0.1)),zon` |
| `heatProjection` | `Array.from({length:8},(_,i)=>({decade:`${2020+i*10}s`,avgUHI:+(2.5+i*0.4).toFixed(1),maxTemp:+(35+i*1.2).toFixed(1),coolingDays:Math.floor(30+i*8),coolingDemand:Math.floor(40+i*12)}));` |
| `avgComposite` | `useMemo(()=>Math.floor(filtered.reduce((s,b)=>s+b.composite,0)/(filtered.length\|\|1)),[filtered]);` |
| `totalCostInaction` | `useMemo(()=>filtered.reduce((s,b)=>s+b.costOfInaction,0),[filtered]);` |
| `criticalCount` | `useMemo(()=>filtered.filter(b=>b.composite>70).length,[filtered]); const avgResilience=useMemo(()=>Math.floor(filtered.reduce((s,b)=>s+b.resilience,0)/(filtered.length\|\|1)),[filtered]);` |
| `hazardDist` | `useMemo(()=>HAZARDS.map((h,i)=>({hazard:h,critical:filtered.filter(b=>b.hazards[i].score>70).length,high:filtered.filter(b=>b.hazards[i].score>50&&b.hazards[i].score<=70).length,medium:filtered.filter(b=>b.hazards[i].score>30&&b.hazards[i].score<=50).length,low:filtered.filter(b=>b.hazards[i].score<=30).length})),[filtered]);  const selBl` |
| `benefit` | `Math.floor(selBldg.costOfInaction*m.riskReduction/100);` |
| `cost` | `Math.floor(m.costPerSqm*selBldg.area);` |
| `roi` | `cost>0?+((benefit*m.paybackYrs-cost)/cost*100).toFixed(1):0;` |
| `insuranceData` | `useMemo(()=>filtered.map(b=>({name:b.name,composite:b.composite,premium:b.insurancePremium,adaptedPremium:b.adaptedInsurance,saving:b.insurancePremium-b.adaptedInsurance,resilience:b.resilience,value:b.value})),[filtered` |
| `valuationImpact` | `useMemo(()=>TYPES.map(t=>{` |
| `avgVal` | `Math.floor(bs.reduce((s,b)=>s+b.value,0)/bs.length);` |
| `avgRisk` | `Math.floor(bs.reduce((s,b)=>s+b.composite,0)/bs.length);` |
| `adjustedVal` | `Math.floor(avgVal*(1-avgRisk/100*0.2));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `HAZARDS`, `HAZARD_COLORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Average ABCR for Flood Adaptation | — | UNEP Adaptation Gap Report 2023 | Benefit-cost range for flood resilience measures in urban infrastructure documented in global literature. |
| Asset Life Extension from Adaptation | — | IPCC AR6 WG2 Chapter 17 | Estimated additional asset service life from implementing appropriate physical resilience upgrades. |
- **Asset coordinates, engineering specifications, hazard return-period maps, adaptation cost databases** → Hazard linkage, residual risk modelling, NPV and ABCR calculation → **Adaptation option rankings, ABCR heat maps, resilience certification inputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Adaptation Benefit-Cost Ratio
**Headline formula:** `ABCR = NPV(Risk Reduction) / AdaptationCapEx`

Net present value of avoided losses from a climate adaptation measure divided by the upfront capital expenditure; ABCR > 1 indicates cost-effective adaptation.

**Standards:** ['GCRF Economics of Adaptation', 'World Bank Adaptation Cost Tool']
**Reference documents:** UNEP Adaptation Gap Report 2023; World Bank Invest4Climate Adaptation Tool; GCRF Economics of Climate Adaptation; IPCC AR6 WG2 Chapter 17 Decision-Making

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide frames this as an **Adaptation Benefit-Cost Ratio** tool (`ABCR = NPV(RiskReduction)/CapEx`).
The code delivers a per-measure **ROI/payback** calculator plus a building-level hazard-composite and
resilience score, but the ABCR it computes is a simplified undiscounted ratio (no NPV term structure) — a
modelling simplification. All buildings are synthetic (`sr()` seeded).

### 7.1 What the module computes

Per synthetic building, an 8-hazard composite drives resilience, cost-of-inaction and insurance:
```js
hazards[j].score = floor(10 + sr(i·31 + j·7)·90)                 // 10–100 per hazard
composite   = floor( Σ hazards.score / hazards.length )          // mean hazard
resilience  = floor( 100 − composite·(0.6 + s6·0.4) )            // inverse, noise-scaled
costOfInaction = floor( value · (composite/100) · 0.15 )         // 15% of at-risk value
insurancePremium = floor( value · 0.003 · (1 + composite/100) )  // 30bp base, hazard-loaded
adaptedInsurance = floor( insurancePremium · (0.6 + resilience/100·0.3) )
```
Adaptation-measure economics (the ABCR/ROI core):
```js
benefit = floor( selBldg.costOfInaction · m.riskReduction/100 )   // avoided loss
cost    = floor( m.costPerSqm · selBldg.area )
roi     = cost>0 ? ((benefit·m.paybackYrs − cost)/cost·100) : 0    // % return over payback window
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| Hazard score | `10 + sr(i·31+j·7)·90` | synthetic demo value |
| Cost-of-inaction rate | `0.15 × value × composite/100` | heuristic (15% loss fraction) |
| Insurance base rate | `0.003` (30 bp of value) | heuristic |
| Value by type | Office 4,500 / Retail 3,200 / Resi 5,500 / Ind 2,000 £/m² | heuristic sector cap-values |
| UHI effect | `1.5 + sr(i·37)·4.5` °C | synthetic (urban-heat-island range) |
| `m.riskReduction`, `m.costPerSqm`, `m.paybackYrs` | per adaptation measure | seed-schema heuristic |

Rating bands: hazard score >70 Critical, >50 High, >30 Medium, else Low.

### 7.3 Calculation walkthrough

Seeds set type/city/area/value/yearBuilt → 8 hazards scored → `composite` mean → `resilience`
(inverse) → `costOfInaction` and `insurancePremium`. Portfolio aggregates: `avgComposite`, `criticalCount`
(composite>70), `avgResilience`, `totalCostInaction`, and a `hazardDist` stacked count per hazard. The
adaptation tab computes `benefit/cost/roi` per measure for the selected building; projection tabs
(`floodProjection`, `heatProjection`) extrapolate to the 2090s on fixed decade steps.

### 7.4 Worked example

Building: Office, `area=10,000 m²` → value ≈ 10,000·4,500·(0.8+0.4·s4≈1.0) = **£45.0M**; hazards averaging
`composite=60`. Adaptation measure with `riskReduction=40%`, `costPerSqm=£120`, `paybackYrs=8`:

| Step | Computation | Result |
|---|---|---|
| Resilience | 100 − 60·(0.6+0.4·s6≈0.8) | ≈ **52** |
| Cost of inaction | 45.0M · 0.60 · 0.15 | **£4.05M** |
| Insurance premium | 45.0M · 0.003 · (1+0.60) | **£216k** |
| Adapted premium | 216k · (0.6 + 0.52·0.3) | **£164k** |
| Measure benefit | 4.05M · 0.40 | £1.62M avoided/yr-equiv |
| Measure cost | 120 · 10,000 | £1.20M |
| ROI | (1.62M·8 − 1.20M)/1.20M·100 | **+980%** over 8-yr window |

The ROI is a multi-year cumulative figure (benefit × payback − cost), not an annualised IRR — read it as
lifetime return, not p.a.

### 7.5 Data provenance & limitations

- **All building and hazard data synthetic** (`sr()` PRNG); hazard scores are independent random draws, not
  return-period intensities from a peril model.
- ABCR/ROI omits discounting (guide's NPV term is absent) and uses `costOfInaction` as the sole benefit —
  no ecosystem-service or insurance co-benefit in the ROI, unlike the guide's multi-benefit BCR.
- Resilience is a linear inverse of composite; no engineering residual-risk factors per measure.

**Framework alignment:** UNEP *Adaptation Gap Report 2023* (flood ABCR 4:1–9:1 cited) · World Bank
*Economics of Climate Adaptation* / Invest4Climate BCR methodology · IPCC AR6 WG2 Ch.17 decision-making
(asset-life extension). The page's benefit-cost logic approximates ECA-style avoided-loss ratios.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Rank adaptation measures for an asset/portfolio by a *discounted* benefit-cost
ratio and residual-risk-adjusted payback, supporting capex prioritisation and resilience certification.

**8.2 Conceptual approach.** Probabilistic **Economics of Climate Adaptation (ECA)** loss-curve framework
(Swiss Re/McKinsey ECA) combined with damage functions from a catastrophe model (RMS/JRC), giving
discounted avoided Average Annual Loss as benefit — the industry-standard adaptation appraisal.

**8.3 Mathematical specification.**
```
AAL_baseline = Σ_rp  P(rp)·Damage(hazard_rp, asset)           (exceedance-probability loss curve)
AAL_adapted  = Σ_rp  P(rp)·Damage(hazard_rp·(1−η_measure), asset)
Benefit_PV   = Σ_t (AAL_baseline − AAL_adapted)·DF_t + EcosystemServices_PV + InsuranceSaving_PV
ABCR = Benefit_PV / (CapEx + PV(OpEx))       ;    payback = min t : Σ≤t benefit ≥ CapEx
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Return-period losses | Damage(rp) | RMS/AIR or JRC depth-damage curves |
| Measure efficacy | η | engineering attenuation studies (IUCN NbS, seawall specs) |
| Discount rate | r | HM Treasury Green Book / social discount rate |
| Ecosystem value | EcoServices | TEEB / Nature Conservancy valuations |

**8.4 Data requirements.** Asset geocode, replacement value, height; hazard exceedance curves per peril
(UKCP18, JRC, NOAA); measure efficacy library; discount rate. Free: JRC/NOAA hazard; vendor: RMS/AIR AAL.

**8.5 Validation & benchmarking.** Reconcile ABCR distribution against UNEP 4:1–9:1 flood range; sensitivity
on η and r; backtest avoided-loss vs observed post-retrofit claims where available.

**8.6 Limitations & model risk.** Deep-uncertainty in forward hazard intensification; efficacy transfer
across contexts; co-benefit monetisation contested. Fallback: undiscounted single-peril ratio with
conservative η when loss curves unavailable.

## 9 · Future Evolution

### 9.1 Evolution A — Discounted ABCR on twin-sourced hazards (analytics ladder: rung 1 → 2)

**What.** §7's assessment is measured: the adaptation-economics core is real
arithmetic (per-measure `benefit = costOfInaction × riskReduction%`, ROI/payback,
hazard-loaded insurance repricing) but with two honest limits — the ABCR is an
undiscounted ratio despite the guide's `NPV(RiskReduction)/CapEx` definition, and
every building's 8-hazard scores are seeded draws. Evolution A fixes both: hazard
scores come from the platform's Physical Risk Digital Twin at building coordinates
(the workflow description already says "map asset via lat/long and hazard
return-period layers" — the twin is exactly that layer), and the ABCR becomes a
proper NPV — avoided annual losses projected over the measure's life, discounted at
a user rate, with asset-life extension and the carbon co-benefits the guide mentions
entering as explicit cash-flow terms.

**How.** (1) Building schema gains coordinates; per-hazard scores via the twin's
composite-scoring endpoints with `resolution_tier` displayed; the composite formula
(mean of hazards) retained but now over sourced inputs. (2) `abcrNPV(measure,
building, discountRate, life)` replacing the flat ratio; the engineering
`riskReduction` factors per measure sourced to adaptation-economics literature (GCA/
World Bank tools in §5) or labelled expert-set. (3) The measure-ranking view re-keyed
to discounted ABCR with payback retained as a secondary metric.

**Prerequisites (hard).** Seeded-building purge (fixtures with coordinates, or
user-entered assets); twin coverage honesty for flood/SLR-sparse locations.
**Acceptance:** ABCR responds to discount rate and measure life (NPV proven); two
identical buildings in different cities rank measures differently per grid hazards;
a fixture reproduces a hand-computed discounted ABCR.

### 9.2 Evolution B — Adaptation-investment advisor (LLM tier 2)

**What.** An assistant for asset owners and lenders: "which measures pay back within
7 years for this Rotterdam logistics asset?" (tool-called ABCR ranking over the
measure menu with the twin-sourced flood score driving benefits), "why does elevation
beat barriers here?" (decomposition: hazard mix, riskReduction factors, cost per
m²), "what does adaptation do to the insurance premium?" (the module's real
repricing arithmetic narrated). Lender use: resilience-conditional term-sheet
context, with the computed residual-risk figures cited.

**How.** Tool schemas over the ABCR/ranking functions and the twin's scoring
endpoints; the validator on every ratio, payback, and premium figure; engineering-
factor provenance (sourced vs expert-set, from Evolution A) surfaces when precision
is challenged; refusal on structural-engineering judgments — the module ranks
economics, it does not certify designs.

**Prerequisites (hard).** Evolution A first — measure rankings over seeded hazards
would steer real capex to the wrong buildings. **Acceptance:** a ranking answer
reproduces via the ABCR function with stated parameters; hazard citations resolve to
grid lookups with resolution tier; the copilot redirects design-certification
questions to qualified engineers.