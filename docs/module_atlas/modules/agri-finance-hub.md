# Agriculture Finance Hub
**Module ID:** `agri-finance-hub` · **Route:** `/agri-finance-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sustainable agriculture investment analytics platform covering smallholder blended finance structures, agri-value chain emissions mapping, and climate-adaptive lending criteria. Aggregates IFC/MDB pipeline data and CGIAR productivity benchmarks to score agri-lending portfolios against UN Food Systems ambitions. Supports climate-smart agriculture (CSA) taxonomy alignment.

> **Business value:** The Agriculture Finance Hub quantifies the development-commercial return nexus for agri-lending, helping institutional investors structure viable first-loss positions while maximising food security impact. CSA scoring and value chain emissions mapping ensure that climate-smart credentials are substantiated and comparable across the portfolio.

**How an analyst works this module:**
- Screen agri-investments against CSA taxonomy criteria
- Blended Finance tab models first-loss tranche sizing and IRR waterfall
- Value Chain Emissions maps Scope 3 Category 1 agri-emissions by commodity
- Smallholder Impact tab shows farmer reach and productivity uplift metrics
- Portfolio Climate Risk overlays CMIP6 yield projections onto loan book
- MDB Pipeline tab integrates IFC/ADB/EBRD agri-facility data

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `AUDIENCE_MODES`, `BOARD_SECTIONS`, `Badge`, `COLORS`, `CROP_TYPES`, `Card`, `ENGAGEMENTS`, `ENGAGEMENT_STAGES`, `ENGAGEMENT_TYPES`, `HOLDINGS`, `KPI`, `Pill`, `RISK_DIMENSIONS`, `SUB_MODULES`, `TABS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SUB_MODULES` | 6 | `id`, `name`, `icon`, `color`, `desc`, `route` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `AUDIENCE_MODES` | `['Board / C-Suite','Investment Committee','ESG / Sustainability','Operations / Supply Chain'];` |
| `names` | `['AgriCo Holdings','FarmFirst REIT','Green Pastures Fund','CropLink Portfolio','Sustainable Ag ETF','Food Chain Capital','Water-Smart Fund','Bio-Ag Partners','Carbon Ag Credit','Precision Farm Co','Livestock Holdings','D` |
| `crop` | `CROP_TYPES[Math.floor(s1*CROP_TYPES.length)];` |
| `dir` | `sortDir==='asc'?1:-1;` |
| `kpis` | `useMemo(()=>({ regenOps:80,regenHectares:'184k',avgSoilSeq:'1.82 tCO2e/ha',foodCompanies:60,avgEmissionsIntensity:'3.24 tCO2e/$M',flagTargetPct:'42%',waterRegions:50,highWaterRisk:'38%',avgIrrigEfficiency:'58%',landParcels:40,totalCarbonStock:'2.4M tCO2e',netSink:'+62k tCO2e',biodivOps:60,avgMSA:'0.52',pollinatorRisk:'28% high',engagement` |
| `emissionsTrend` | `useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),foodSystem:Math.floor(850-yi*15+sr(yi*23)*20),landUse:Math.floor(120-yi*10+sr(yi*29)*15),water:Math.floor(45+yi*2+sr(yi*31)*5)})),[]);` |
| `riskProfile` | `useMemo(()=>RISK_DIMENSIONS.map((d,di)=>({dimension:d,score:Math.floor(25+sr(di*17+1)*55)})),[]);` |
| `moduleHealth` | `useMemo(()=>SUB_MODULES.map((m,mi)=>({name:m.id,fullName:m.name,score:Math.floor(55+sr(mi*23+3)*40),alerts:ALERTS.filter(a=>a.module===m.id).length,engagements:ENGAGEMENTS.filter(e=>e.module===m.id).length})),[]);` |
| `cropExposure` | `CROP_TYPES.map(c=>{const h=HOLDINGS.filter(x=>x.crop===c);return{name:c,count:h.length,totalValue:h.reduce((a,x)=>a+x.value,0),avgRisk:h.length?Math.floor(h.reduce((a,x)=>a+x.riskScore,0)/h.length):0};}).filter(c=>c.coun` |
| `riskOverlay` | `HOLDINGS.map(h=>({name:h.name.slice(0,12),water:h.waterRisk,biodiv:h.biodivRisk,deforest:h.deforestRisk,soil:h.soilRisk})).slice(0,15);` |
| `stageFlow` | `ENGAGEMENT_STAGES.map(s=>({stage:s,count:filteredEng.filter(e=>e.stage===s).length,value:filteredEng.filter(e=>e.stage===s).reduce((a,e)=>a+e.value,0)}));` |
| `typeBreakdown` | `ENGAGEMENT_TYPES.map(t=>({type:t.length>16?t.slice(0,16)+'...':t,count:filteredEng.filter(e=>e.type===t).length})).filter(t=>t.count>0);` |
| `engPage` | `Math.ceil(filteredEng.length/PAGE_SIZE);const pagedEng=filteredEng.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);` |
| `flagProgress` | `[{target:'Beef sector -30%',progress:22,deadline:'2030'},{target:'Dairy sector -25%',progress:18,deadline:'2030'},{target:'Rice methane -40%',progress:12,deadline:'2035'},{target:'Palm oil deforestation-free',progress:65` |
| `sectionReady` | `BOARD_SECTIONS.map((s,si)=>({section:s,status:sr(si*17+1)>0.3?'Ready':'Draft',pages:Math.floor(1+sr(si*23+3)*4),lastUpdated:'2026-03-'+(15+Math.floor(sr(si*29+5)*13))}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AUDIENCE_MODES`, `BOARD_SECTIONS`, `COLORS`, `CROP_TYPES`, `ENGAGEMENT_STAGES`, `ENGAGEMENT_TYPES`, `RISK_DIMENSIONS`, `SUB_MODULES`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Blended Finance IRR | `Weighted commercial + concessional` | IFC/CGIAR | Blended return achievable when concessional capital absorbs first-loss |
| CSA Score | `CGIAR 3-pillar composite` | CGIAR | Climate-smart agriculture score across productivity, resilience and mitigation pillars |
| Smallholder Reach | — | CGIAR | Development impact metric tracking smallholder beneficiaries per unit of capital deployed |
- **IFC/MDB agri-facility pipeline** → Overlay CSA taxonomy criteria and compute blended IRR scenarios → **Scored agri-investment pipeline with CSA alignment tags**
- **CGIAR yield projection data** → Apply CMIP6 climate scenarios to commodity yield models → **Per-holding climate-adjusted revenue and food security impact estimates**

## 5 · Intermediate Transformation Logic
**Methodology:** CSA blended finance NPV model
**Headline formula:** `BlendedIRR = (Concessional_IRR × w_conc + Commercial_IRR × w_comm); FoodSys_score = Σ(w_j × CSA_pillar_j)`

Concessional tranches from MDB/DFI first-loss capital reduce risk for commercial co-investors, enabling viable IRRs on projects with positive development externalities. CSA scoring applies CGIAR three-pillar framework: productivity, resilience, and mitigation. Food systems alignment checks against 5 UN Food Systems Summit tracks.

**Standards:** ['IFC Performance Standards', 'CGIAR Climate-Smart Agriculture', 'OECD Blended Finance Principles']
**Reference documents:** IFC Agri-Finance Performance Standards; CGIAR Climate-Smart Agriculture Sourcebook; OECD Blended Finance Principles 2017; UN Food Systems Summit 2021 Action Tracks

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **CSA blended-finance NPV model**
> (`BlendedIRR = Concessional_IRR × w_conc + Commercial_IRR × w_comm`) and a **CGIAR three-pillar
> CSA score** (`FoodSys_score = Σ w_j × CSA_pillar_j`). **Neither formula exists in the code.**
> The module is a **navigation/aggregation hub**: it surfaces sub-module KPIs, a synthetic
> agri-portfolio risk table, an engagement pipeline and a board-report builder. No IRR blending,
> no concessional tranching, no CSA-pillar scoring is computed. Sections below document the code.

### 7.1 What the module computes

An agriculture-finance dashboard with four tabs (Executive Dashboard, Portfolio Agri Exposure,
Engagement Pipeline, Board Report) sitting above five sub-modules
(AT1 Regenerative Agriculture, AT2 Food Supply Chain Emissions, AT3 Water & Agriculture Risk,
AT4 Land Use & Carbon, AT5 Agricultural Biodiversity). It is primarily aggregation and CRM-style
tracking; the only arithmetic is portfolio means and engagement roll-ups.

**Portfolio KPIs** over 30 synthetic holdings:

```
totalValue    = Σ value_i                                   ($M)
avgRiskScore  = floor(Σ riskScore_i / n)                    (0–100 "composite")
regenAdoption = floor(Σ regenAdoption_i / n)                (%)
```

Each holding carries independent 0–100 sub-risk draws (`waterRisk`, `biodivRisk`,
`deforestRisk`, `soilRisk`) plus `emissionsIntensity` (0.5–8.5 tCO₂e/$M) and `regenAdoption`.
Notably the "composite" `riskScore` is its **own random draw** (`15 + sr·80`), *not* a
weighted combination of the four sub-risks — the cross-module risk-overlay chart stacks the
sub-risks separately for display only.

### 7.2 Parameterisation

- **Sub-modules (`SUB_MODULES`, 5)** — id, name, icon, colour, description, route.
- **Executive KPIs** are **hard-coded literals** in `kpis` (regenOps 80, regenHectares 184k,
  avgSoilSeq 1.82 tCO₂e/ha, foodCompanies 60, avgEmissionsIntensity 3.24 tCO₂e/$M, flagTargetPct
  42%, avgMSA 0.52, totalCarbonStock 2.4M tCO₂e, netSink +62k tCO₂e, …) — dashboard headline
  numbers that are not derived from any dataset on the page.
- **Alerts (20)**, **Engagements (40)**, **Holdings (30)** — all generated by the PRNG
  `sr(s)=frac(sin(s+1)×10⁴)`. Engagement pipeline uses a 6-stage funnel
  (Identified → Contacted → In Discussion → Committed → Implementing → Verified) and 8 partner
  types; each engagement has a `value` ($50–1000k) and priority (High >0.6 / Medium >0.3 / Low).
- **Module health** = `floor(55 + sr·40)` per sub-module (55–95, random), coloured ≥70 green /
  ≥50 amber / else red; **risk profile radar** = `floor(25 + sr·55)` per of 6 risk dimensions.

### 7.3 Calculation walkthrough

1. **Executive dashboard:** renders the hard-coded `kpis`, the seeded emissions trend
   (`foodSystem = 850 − 15·yi + sr·20` declining; landUse declining; water rising), the risk
   radar, module-health bars and engagement-stage pie.
2. **Portfolio tab:** `cropExposure` groups holdings by crop (Σ value, avg risk);
   `riskOverlay` = top-15 holdings' four sub-risks stacked; holdings table colour-thresholds
   each risk (composite >60 red / >35 amber, water/biodiv >60 red, deforest >50 red).
3. **Engagement tab:** filter (stage/type/module/search) → `stageFlow` (count + Σ value per
   stage) and `typeBreakdown`; sortable, paginated table with a detail panel.
4. **Board report tab:** audience selector (Board / IC / ESG / Operations) assembles the 8
   `BOARD_SECTIONS` into an exportable summary.

### 7.4 Worked example — portfolio averages

With 30 holdings summing to (say) $3,150M value, riskScores summing to 1,410, regenAdoption
summing to 1,290:

| KPI | Computation | Result |
|---|---|---|
| Total value | Σ value | **$3,150M** |
| Avg risk score | floor(1410/30) | **47/100** |
| Avg regen adoption | floor(1290/30) | **43%** |

The holdings table would flag any holding with composite risk > 60 in red; because composite
risk is an independent draw, a holding can show low water/biodiv/deforest sub-risks yet a red
composite (or vice-versa) — a demo artefact.

### 7.5 Data provenance & limitations

- **Almost entirely synthetic:** alerts, engagements and holdings are PRNG-generated; the
  executive KPIs are hard-coded editorial figures with no backing dataset.
- The `riskScore` composite is not an aggregate of its component sub-risks, so the "composite"
  label is misleading — a production build would compute
  `riskScore = weighted mean of water/biodiv/deforest/soil`.
- No financial modelling whatsoever: despite the "Finance Hub" title and the guide's blended-
  finance framing, there is no IRR, NPV, tranche, concessionality or cash-flow computation.
- Sub-module "health" and risk-radar scores are random, not derived from the sub-modules'
  actual state.

### 7.6 Framework alignment

- **CGIAR Climate-Smart Agriculture (three pillars: productivity, adaptation, mitigation)** —
  referenced by the guide and reflected in the sub-module taxonomy (regen agriculture ≈
  mitigation/soil carbon; water risk ≈ adaptation; food emissions ≈ mitigation), but the
  three-pillar weighted score is **not** computed.
- **OECD Blended Finance Principles** — the guide's concessional/commercial IRR blend is the
  standard blended-finance construct (first-loss/concessional capital crowding in commercial
  co-investors); this module does not implement it (see the dedicated blended-finance and
  additionality modules for the real logic).
- **SBTi FLAG (Forest, Land and Agriculture)** — appears as an alert type and a hard-coded
  `flagTargetPct` KPI; FLAG's actual land-sector target-setting method (separate land vs
  energy/industry pathways) is not modelled.
- **GRI 2-29 / stakeholder engagement** — the 6-stage engagement funnel operationalises a
  standard stakeholder-engagement pipeline for tracking, consistent with GRI engagement
  disclosure expectations.

## 9 · Future Evolution

### 9.1 Evolution A — Real blended-finance and CSA scoring engine (analytics ladder: rung 1 → 2)

**What.** Per §7 this is a navigation/aggregation hub, not the finance engine its title
implies: despite the guide's `BlendedIRR = Concessional_IRR × w_conc + Commercial_IRR ×
w_comm` and `FoodSys_score = Σ w_j × CSA_pillar_j`, **neither formula exists** — the module
shows hard-coded executive KPIs (regenOps 80, avgSoilSeq 1.82, etc.), PRNG-generated
holdings/engagements/alerts, and a "composite" `riskScore` that is its own random draw
rather than a weighted mean of the four sub-risks (§7.5). Evolution A builds the missing
quantitative core: a blended-finance waterfall engine (first-loss tranche sizing,
concessional/commercial IRR blend, cash-flow waterfall) and a CGIAR three-pillar CSA score
(`Σ w_j × pillar_j` over productivity/resilience/mitigation), plus a genuine composite risk
= weighted mean of water/biodiv/deforest/soil.

**How.** `POST /api/v1/agri-finance/blended-irr` (tranche structure → IRR by tranche +
blended return) and `/csa-score` (pillar inputs → composite), backed by an `agri_holdings`
table replacing the synthetic 30-holding array; the executive KPIs become roll-ups over that
table instead of literals. Rung 2 via CMIP6/SSP yield-overlay scenarios on the loan book, as
the guide's climate-risk tab promises.

**Prerequisites (hard).** Purge the `sr()` draws and hard-coded KPI literals per the no-
fabricated-random guardrail; fix the misleading "composite" `riskScore` label. The real
blended-finance logic already exists in sibling modules (blended-finance-structurer,
additionality-assessment) — reuse rather than re-derive. **Acceptance:** blended IRR responds
to first-loss tranche size; the composite risk equals the documented weighted mean of its
sub-risks; executive KPIs reconcile to the holdings table.

### 9.2 Evolution B — Agri-desk orchestrator across the five sub-modules (LLM tier 3)

**What.** This hub sits above five sub-modules (AT1 Regenerative Ag, AT2 Food Supply Chain
Emissions, AT3 Water Risk, AT4 Land Use & Carbon, AT5 Agri Biodiversity) — the natural home
for a desk-orchestrator. "Assess AgriCo Holdings" would route: pull the holding's crop/water/
deforestation exposure, call AT5's biodiversity site-assessment, AT2's Scope 3 commodity
emissions, and AT4's carbon-stock, then synthesise a board-ready agri-finance memo via the
report layer — replacing today's static Board Report tab (whose section-ready flags are
themselves `sr()` draws).

**How.** Tier-3 routing per the roadmap: `module_tags.json` + the Atlas interconnection graph
identify the five sub-modules as the agri cluster; the orchestrator tool-calls each sub-
module's endpoints (post their Evolution-A verticals) and composes output into the audience-
selected board sections (Board/IC/ESG/Operations). No-fabrication validator enforces that
every synthesised figure traces to a sub-module tool call.

**Prerequisites (hard).** The five sub-modules need real backend verticals first (several,
including AT5, are currently synthetic); this hub's own Evolution A; the desk-orchestrator
framework (Phase 2–3). **Acceptance:** a memo for a named holding cites which sub-module
produced each figure; removing a sub-module's data yields an honest gap in the memo, not a
fabricated number.