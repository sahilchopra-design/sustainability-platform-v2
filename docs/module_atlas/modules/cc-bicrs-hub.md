# Biodiversity & Integrated Carbon-Removal Suite
**Module ID:** `cc-bicrs-hub` · **Route:** `/cc-bicrs-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated hub for nature-based solutions combining biodiversity co-benefit scoring, carbon removal stacking, and integrated ecosystem service valuation. Covers TNFD LEAP alignment, SBTN target-setting, and co-benefit premium quantification across ARR, REDD+, blue carbon, and soil projects.

> **Business value:** Stacked credit value captures carbon plus up to 3 verified co-benefit premiums. Premium layer typically adds 15–45% to base carbon price.

**How an analyst works this module:**
- Select nature-based solution type and geography
- Co-Benefit Stack tab shows ecosystem service layers
- TNFD LEAP Assessment runs dependency scoring
- Credit Premium Waterfall quantifies value uplift
- SBTN Alignment tab checks land and freshwater targets

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CDR_METHODS`, `Card`, `DualInput`, `FEEDSTOCKS`, `Kpi`, `PERM_TIERS`, `Section`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PERM_TIERS` | 3 | `name`, `adj`, `yrs`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PERM_TIERS` | `[{name:'Premium',adj:0,yrs:'1000+',color:'green'},{name:'Standard',adj:0.10,yrs:'100-999',color:'amber'},{name:'Basic',adj:0.30,yrs:'10-99',color:'red'}];` |
| `genBeccsProjects` | `()=>Array.from({length:4},(_,i)=>({id:i+1,` |
| `bicrsCalc` | `useMemo(()=>{ const biomassC=biomassInput*(carbonContent/100);` |
| `cStored` | `cInjected*(1-leakageRate);` |
| `co2Equiv` | `cStored*(44/12);` |
| `lifecycleEm` | `co2Equiv*(lifecyclePct/100);` |
| `finalRemoval` | `(co2Equiv-lifecycleEm)*(1-permAdj)*(1-uncertaintyAdj);` |
| `beccsSummary` | `useMemo(()=>{ const totalCap=beccsProjects.reduce((a,p)=>a+p.co2_captured,0);` |
| `totalEnergy` | `beccsProjects.reduce((a,p)=>a+p.energy_output_mwh,0);` |
| `totalNet` | `beccsProjects.reduce((a,p)=>a+p.net_removal,0);` |
| `cdrRadar` | `useMemo(()=>[ {metric:'Cost Efficiency',DAC:25,ERW:70,BiCRS:55,Biochar:65,OAE:50}, {metric:'Permanence',DAC:95,ERW:60,BiCRS:80,Biochar:50,OAE:55}, {metric:'Scalability',DAC:70,ERW:85,BiCRS:60,Biochar:45,OAE:75}, {metric:'Co-benefits',DAC:15,ERW:80,BiCRS:50,Biochar:90,OAE:40}, {metric:'MRV Maturity',DAC:85,ERW:55,BiCRS:65,Biochar:50,OAE:35` |
| `cdrTable` | `useMemo(()=>[ {method:'DAC',cost:'$250-600/t',permanence:'1000+ yr',scalability:'High',trl:7,cobenefits:'None',maturity:'Commercial'}, {method:'ERW',cost:'$50-200/t',permanence:'1000+ yr (geological)',scalability:'Very High',trl:6,cobenefits:'Soil health, crop yield',maturity:'Pilot'}, {method:'BiCRS',cost:'$100-300/t',permanence:'100-100` |
| `portfolio` | `useMemo(()=>{ const totalAlloc=allocDAC+allocERW+allocBiCRS+allocBiochar+allocOAE;` |
| `norm` | `totalAlloc>0?100/totalAlloc:0;` |
| `budgetUsd` | `budgetM*1e6;` |
| `detail` | `methods.map(m=>{` |
| `spend` | `budgetUsd*m.alloc;` |
| `tonnes` | `m.costPerT>0?spend/m.costPerT:0;` |
| `biomassSustainability` | `useMemo(()=>FEEDSTOCKS.map((f,i)=>({` |
| `hubStats` | `useMemo(()=>{ const totalBicrs=bicrsProjects.reduce((a,p)=>a+p.verified_tCO2,0);` |
| `totalBeccs` | `beccsProjects.reduce((a,p)=>a+p.net_removal,0);` |
| `avgBicrsCost` | `(bicrsProjects.reduce((a,p)=>a+p.cost_per_tCO2,0)/ Math.max(1, bicrsProjects.length)).toFixed(0);` |
| `hubTimeline` | `useMemo(()=>Array.from({length:12},(_,m)=>({ month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m], bicrs:+(sr(m*301)*3000+1000).toFixed(0), beccs:+(sr(m*303)*8000+3000).toFixed(0), biochar:+(sr(m*307)*2000+500).toFixed(0), dac:+(sr(m*309)*1500+200).toFixed(0) })),[]);` |
| `kpis` | `useMemo(()=>[ {label:'BiCRS Final Removal',value:`${bicrsCalc.finalRemoval.toLocaleString()} t`}, {label:'BiCRS Projects',value:bicrsProjects.length}, {label:'BECCS Net Removal',value:`${(beccsSummary.totalNet/1000).toFixed(0)}K t`}, {label:'BECCS Avg Cost',value:`$${beccsSummary.avgCost}/t`}, {label:'Portfolio tCO2',value:`${portfolio.to` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CDR_METHODS`, `COLORS`, `FEEDSTOCKS`, `PERM_TIERS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Co-benefit Premium | `Market-observed price uplift` | Ecosystem Marketplace | Price premium per verified additional ecosystem service |
| Stacked Credit Value | `Carbon + Σ eco-service premiums` | Model output | Total per-credit value including biodiversity and water co-benefits |
| TNFD LEAP Score | `Locate, Evaluate, Assess, Prepare` | TNFD v1.0 | Nature dependency and impact composite rating |
| SBTN Land Target | `Science-based land allocation` | SBTN v1.0 | Minimum restoration area required for sector science-based target |
- **Project registry data** → VCS/GS verification records → co-benefit flags → **Premium-adjusted credit value**
- **TNFD LEAP tool** → Dependency mapping → risk scores → **LEAP composite**

## 5 · Intermediate Transformation Logic
**Methodology:** Ecosystem service stacking with co-benefit premium
**Headline formula:** `StackedValue = CarbonValue + Σ(EcoService_i × PremiumFactor_i)`

Carbon value derived from project credit yield times shadow carbon price. Each verified ecosystem service (biodiversity, water, community) carries a premium factor calibrated from voluntary market data (10–40% per service). TNFD LEAP assessment assigns dependency scores. SBTN freshwater and land targets set science-based thresholds.

**Standards:** ['TNFD v1.0', 'SBTN v1.0', 'IUCN Ecosystem Services', 'Verra SD VISta']
**Reference documents:** TNFD Recommendations v1.0; SBTN v1 Guidance; Verra SD VISta Standard; Ecosystem Marketplace State of Voluntary Carbon Markets

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide titles this "Biodiversity & Integrated Carbon-Removal
> Suite" and describes *ecosystem-service co-benefit stacking* — TNFD LEAP scoring, SBTN targets,
> co-benefit premiums (10–40%/service), and `StackedValue = CarbonValue + Σ(EcoService × Premium)`.
> **None of that is in the code.** The page (header "BiCRS & Biomass CDR Hub", EP-BU3) implements a
> **biomass carbon-removal-and-storage** calculator, a BECCS pathway view, a cross-CDR technology
> comparison, and a budget→tonnes portfolio builder. "BiCRS" here means *Biomass Carbon Removal &
> Storage*, not "Biodiversity & Integrated Carbon-Removal Suite". Sections below document the code;
> §8 specifies the co-benefit stacking model the guide promises.

### 7.1 What the module computes

The one real mechanistic engine is `bicrsCalc` (lines 80–92):

```js
biomassC     = biomassInput × (carbonContent/100)     // t C in feedstock
cInjected    = min(injectionVol, biomassC)             // capped by injection capacity
cStored      = cInjected × (1 − leakageRate)
co2Equiv     = cStored × (44/12)                       // t C → tCO2e
lifecycleEm  = co2Equiv × (lifecyclePct/100)
finalRemoval = (co2Equiv − lifecycleEm) × (1 − permAdj) × (1 − uncertaintyAdj)
```

`uncertaintyAdj` is fixed at 0.05; `permAdj` comes from the permanence tier. The comment correctly
notes the sequencing: lifecycle emissions are deducted *before* permanence/uncertainty discounts.

The **portfolio builder** (`portfolio`, lines 136–157) converts a $ budget and 5 allocation sliders
into tonnes: `tonnes_m = (budget × alloc_m) / costPerT_m`, plus allocation-weighted permanence and
cost. Allocations are renormalised to 100% (`norm = 100/Σalloc`).

### 7.2 Parameterisation

| Parameter | Value / default | Provenance |
|---|---|---|
| Permanence tiers | Premium adj 0 (1000+ yr) · Standard 0.10 (100–999 yr) · Basic 0.30 (10–99 yr) | `PERM_TIERS` — synthetic discount ladder by storage horizon |
| `carbonContent` | 48% default | Typical dry-biomass carbon fraction |
| `uncertaintyAdj` | 0.05 (fixed) | Hard-coded uncertainty deduction |
| `leakageRate` | 0.03 default | Storage leakage assumption |
| Portfolio `costPerT` | DAC 450 · ERW 120 · BiCRS 200 · Biochar 75 · OAE 180 $/t | Literature midpoints (match `cdrTable` ranges) |
| Portfolio permanence | DAC 95 · ERW 60 · BiCRS 80 · Biochar 55 · OAE 70 /100 | Hard-coded heuristic scores |
| CDR comparison radar | Cost/Perm/Scale/Co-benefit/MRV/TRL per method | Hard-coded expert-judgement scores |
| CDR table | cost, permanence, TRL, co-benefits, maturity per method | Literature values (DAC $250–600/t, biochar TRL 7, OAE TRL 4, etc.) |

### 7.3 Calculation walkthrough

1. **BiCRS Calculator** — feedstock carbon → injectable C (capped) → stored C after leakage →
   CO₂-equivalent → net of lifecycle → net of permanence & uncertainty. Result is pushed to
   `CarbonCreditContext` as methodology `Iso-BiCRS`, family `cdr`.
2. **BECCS Pathway** — 4 named plants (Drax, Stockholm CHP, Mikawa, Illinois Basin) with fully
   synthetic capacity/capture/net-removal; summary totals capture, energy, net removal, avg cost.
3. **CDR Technology Comparison** — static radar + table across DAC/ERW/BiCRS/Biochar/OAE.
4. **Portfolio Builder** — the §7.1 budget→tonnes conversion with weighted permanence/cost.
5. **Hub Dashboard** — aggregates + a 12-month synthetic issuance timeline.

### 7.4 Worked example — BiCRS Calculator

Defaults: biomassInput 10,000 t, carbonContent 48%, injectionVol 5,000, leakage 0.03, permTier 0
(Premium, adj 0), lifecyclePct 10%:

| Step | Computation | Result |
|---|---|---|
| Biomass C | 10,000 × 0.48 | 4,800 t C |
| C injected | min(5,000, 4,800) | 4,800 t C |
| C stored | 4,800 × (1 − 0.03) | 4,656 t C |
| CO₂ equivalent | 4,656 × 3.667 | 17,072 tCO₂e |
| Lifecycle emissions | 17,072 × 0.10 | 1,707 tCO₂e |
| Net of lifecycle | 17,072 − 1,707 | 15,365 |
| × (1 − permAdj 0) | 15,365 × 1 | 15,365 |
| × (1 − 0.05) | 15,365 × 0.95 | **14,596 tCO₂e finalRemoval** |

Conversion efficiency = 4,656 / 10,000 = 46.6%.

### 7.5 Data provenance & limitations

- **BiCRS + portfolio calculators are real; everything else is synthetic or static.** BECCS plants,
  biomass-sustainability feedstock metrics, and the hub timeline all use the PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)`. The CDR radar/table are hard-coded literature scores, not
  computed.
- Permanence discount ladder (0/0.10/0.30) is a coarse synthetic proxy — production CDR standards
  (Puro.earth, Isometric) require quantified reversal-risk and durability modelling.
- No TNFD/SBTN/co-benefit logic exists despite the guide (see §8).
- Portfolio builder assumes a single point cost per method; no supply-curve or price-uncertainty.

**Framework alignment (as coded):** IPCC AR6 Ch.12 CDR taxonomy (DAC/ERW/BiCRS/biochar/OAE) ·
Puro.earth / Isometric-style biomass-CDR net accounting (lifecycle-then-permanence sequencing) ·
BECCS as IEA/IPCC negative-emissions pathway. The guide's TNFD/SBTN alignment is unimplemented.

## 8 · Model Specification — Ecosystem-Service Co-Benefit Stacking & Premium Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Deliver the guide's promise: value a nature-based credit as carbon + verified co-benefits, and
produce a TNFD-LEAP-aligned nature score. Scope: ARR, REDD+, blue-carbon, soil, and IFM projects
seeking co-benefit premiums in the voluntary market.

### 8.2 Conceptual approach

A hedonic premium model layered on carbon value — mirroring how Ecosystem Marketplace decomposes
observed VCM transaction prices by attribute, and how MSCI/Sylvera rate co-benefit quality. Nature
dependency/impact scoring follows the TNFD LEAP structure (Locate-Evaluate-Assess-Prepare) and SBTN
target hierarchy, benchmarked against IBAT/ENCORE dependency datasets.

### 8.3 Mathematical specification

```
StackedValue = P_carbon × Q + Σ_s  Premium_s × 1{verified_s} × P_carbon × Q
Premium_s    = β_s   (hedonic coefficient per co-benefit s ∈ {biodiversity, water, community, gender})
LEAP_score   = 100 × Σ_d w_d · norm(indicator_d)      d over LEAP dimensions
SBTN_gap     = max(0, Target_ha − Restored_ha)
CoBenefit_premium_total = min(cap, Σ_s Premium_s)      cap ≈ 45% (observed market ceiling)
```

| Parameter | Calibration source |
|---|---|
| `β_s` per co-benefit | Ecosystem Marketplace State-of-VCM attribute regressions (10–40%/service) |
| `cap` (≈45%) | Observed max stacked premium in VCM transaction data |
| LEAP indicator weights `w_d` | TNFD v1.0 LEAP guidance; expert elicitation |
| Dependency/impact data | IBAT, ENCORE, WWF Water Risk Filter (free) |
| SBTN land/freshwater targets | SBTN v1 sector target-setting methodology |

### 8.4 Data requirements

Project geospatial boundary, verified co-benefit certifications (Verra SD VISta, CCB labels),
observed carbon price (Ecosystem Marketplace / Xpansiv CBL). LEAP inputs: proximity to KBAs/
protected areas (IBAT), water-stress (Aqueduct — already in platform reference data), community
FPIC status. Platform already holds carbon price context and Aqueduct water-stress seeds.

### 8.5 Validation & benchmarking plan

Backtest `StackedValue` against realised premium transactions (SD VISta-labelled vs vanilla credits)
by vintage and region; reconcile LEAP_score against Sylvera/BeZero co-benefit sub-ratings; sensitivity
of premium to each `β_s`. Cap must bind rarely (<5% of sample).

### 8.6 Limitations & model risk

Co-benefit premiums are thin-market and self-reported — premium coefficients are unstable and prone
to greenwashing; require verified certification as a hard gate (`1{verified}`). LEAP scoring is
qualitative-to-quantitative and vendor-divergent; disclose methodology and treat as ordinal, not
cardinal. Never let stacked value exceed the empirical market cap.

## 9 · Future Evolution

### 9.1 Evolution A — Reconcile the identity and build the promised co-benefit stacking (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: the guide titles this "Biodiversity & Integrated Carbon-Removal Suite" and describes ecosystem-service co-benefit stacking (TNFD LEAP scoring, SBTN targets, co-benefit premiums 10-40%/service, `StackedValue = CarbonValue + Σ(EcoService × Premium)`), but the code (header "BiCRS & Biomass CDR Hub", EP-BU3) implements something different: a BiCRS/BECCS biomass-CDR removal calculator (`finalRemoval = co2Equiv × (1−permAdj) × (1−uncertaintyAdj)`), a CDR-method radar/table comparing DAC/ERW/BiCRS/Biochar/OAE, and a portfolio allocator — with a seeded 12-month timeline and BECCS projects. The removal calculator is real; the biodiversity/co-benefit-stacking product the title promises is absent. Evolution A resolves the identity mismatch.

**How.** The disposition decision first: either (a) rescope/retitle to the BiCRS biomass-CDR hub the code actually is (its removal math and CDR-method comparison are sound), or (b) build the co-benefit-stacking suite the guide describes. Given the platform already has `biodiversity-credits` (TNFD LEAP, ecosystem valuation) and `blue-carbon-finance`, option (b) risks duplication — so (a) is likely correct, with the biodiversity/stacking function consolidated into the existing biodiversity modules. For (a): ground the BiCRS/BECCS removal calculator (extract to a backend route, calibrate the biomass-carbon and permanence-tier factors) and make the CDR-method radar/cost data real (sourced from CDR literature). Rung 2 follows with real feedstock-sustainability and portfolio-optimisation scenarios. The `CarbonCreditContext` bus integration stays.

**Prerequisites (hard).** The identity decision — code and documented purpose describe different products. For (a): CDR-method cost/permanence sourcing; backend extraction. If (b): coordinate hard with `biodiversity-credits` to avoid a fourth overlapping TNFD/ecosystem module. **Acceptance:** code and documented purpose describe the same product; if (a), the removal calculator runs server-side with sourced factors and the CDR comparison uses real data; if (b), co-benefit stacking reuses the biodiversity engine rather than duplicating it.

### 9.2 Evolution B — Integrated CDR-portfolio copilot (LLM tier 2)

**What.** Assuming disposition (a): CDR portfolio buyers ask "allocate a $10M budget across DAC/ERW/BiCRS/Biochar/OAE for maximum durable tonnes", "compare these methods on permanence and cost", "what's the net removal from this BiCRS project?" — the copilot runs the Evolution-A removal calculator and portfolio allocator, reporting tonnes, cost, and the method trade-offs, every figure tool-traced.

**How.** Tool schemas over the Evolution-A removal/allocation routes; grounding corpus is this Atlas record's CDR-method radar/table (cost, permanence, scalability, co-benefits, MRV maturity per method) once sourced. The honesty duty, common to all CDR modules: permanence is the defining axis, so the copilot reports durable removal (after permanence adjustment) and states each method's permanence tier — a DAC tonne (1000+ yr) is not a biochar tonne (100 yr). If disposition (b) is chosen, the co-benefit-premium answers must route to the consolidated biodiversity engine. Portfolio-allocation reports compose into the report layer.

**Prerequisites (hard).** Evolution A's identity resolution and backend — a copilot cannot operate a product whose scope is undecided. **Acceptance:** every tonne, cost, and allocation traces to a tool response; durable removal is distinguished by permanence tier; method comparisons cite sourced CDR data; no duplication of the biodiversity engine.