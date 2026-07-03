# Agriculture Finance Hub
**Module ID:** `agri-finance-hub` · **Route:** `/agri-finance-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sustainable agriculture investment analytics platform covering smallholder blended finance structures, agri-value chain emissions mapping, and climate-adaptive lending criteria. Aggregates IFC/MDB pipeline data and CGIAR productivity benchmarks to score agri-lending portfolios against UN Food Systems ambitions. Supports climate-smart agriculture (CSA) taxonomy alignment.

> **Business value:** The Agriculture Finance Hub quantifies the development-commercial return nexus for agri-lending, helping institutional investors structure viable first-loss positions while maximising food security impact. CSA scoring and value chain emissions mapping ensure that climate-smart credentials are substantiated and comparable across the portfolio.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `AUDIENCE_MODES`, `BOARD_SECTIONS`, `Badge`, `COLORS`, `CROP_TYPES`, `Card`, `ENGAGEMENTS`, `ENGAGEMENT_STAGES`, `ENGAGEMENT_TYPES`, `HOLDINGS`, `KPI`, `Pill`, `RISK_DIMENSIONS`, `SUB_MODULES`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `AUDIENCE_MODES` | `['Board / C-Suite','Investment Committee','ESG / Sustainability','Operations / Supply Chain'];` |
| `names` | `['AgriCo Holdings','FarmFirst REIT','Green Pastures Fund','CropLink Portfolio','Sustainable Ag ETF','Food Chain Capital','Water-Smart Fund','Bio-Ag Pa` |
| `crop` | `CROP_TYPES[Math.floor(s1*CROP_TYPES.length)];` |
| `dir` | `sortDir==='asc'?1:-1;` |
| `emissionsTrend` | `useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),foodSystem:Math.floor(850-yi*15+sr(yi*23)*20),landUse:Math.floor(120-yi*10+sr(yi*29)*15),water:Math.` |
| `riskProfile` | `useMemo(()=>RISK_DIMENSIONS.map((d,di)=>({dimension:d,score:Math.floor(25+sr(di*17+1)*55)})),[]);` |
| `moduleHealth` | `useMemo(()=>SUB_MODULES.map((m,mi)=>({name:m.id,fullName:m.name,score:Math.floor(55+sr(mi*23+3)*40),alerts:ALERTS.filter(a=>a.module===m.id).length,en` |
| `cropExposure` | `CROP_TYPES.map(c=>{const h=HOLDINGS.filter(x=>x.crop===c);return{name:c,count:h.length,totalValue:h.reduce((a,x)=>a+x.value,0),avgRisk:h.length?Math.f` |
| `riskOverlay` | `HOLDINGS.map(h=>({name:h.name.slice(0,12),water:h.waterRisk,biodiv:h.biodivRisk,deforest:h.deforestRisk,soil:h.soilRisk})).slice(0,15);` |
| `stageFlow` | `ENGAGEMENT_STAGES.map(s=>({stage:s,count:filteredEng.filter(e=>e.stage===s).length,value:filteredEng.filter(e=>e.stage===s).reduce((a,e)=>a+e.value,0)` |
| `typeBreakdown` | `ENGAGEMENT_TYPES.map(t=>({type:t.length>16?t.slice(0,16)+'...':t,count:filteredEng.filter(e=>e.type===t).length})).filter(t=>t.count>0);` |
| `engPage` | `Math.ceil(filteredEng.length/PAGE_SIZE);const pagedEng=filteredEng.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);` |
| `flagProgress` | `[{target:'Beef sector -30%',progress:22,deadline:'2030'},{target:'Dairy sector -25%',progress:18,deadline:'2030'},{target:'Rice methane -40%',progress` |
| `sectionReady` | `BOARD_SECTIONS.map((s,si)=>({section:s,status:sr(si*17+1)>0.3?'Ready':'Draft',pages:Math.floor(1+sr(si*23+3)*4),lastUpdated:'2026-03-'+(15+Math.floor(` |

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
**Standards:** ['IFC Performance Standards', 'CGIAR Climate-Smart Agriculture', 'OECD Blended Finance Principles']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).