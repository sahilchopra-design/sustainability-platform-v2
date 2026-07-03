# Biodiversity & Integrated Carbon-Removal Suite
**Module ID:** `cc-bicrs-hub` · **Route:** `/cc-bicrs-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated hub for nature-based solutions combining biodiversity co-benefit scoring, carbon removal stacking, and integrated ecosystem service valuation. Covers TNFD LEAP alignment, SBTN target-setting, and co-benefit premium quantification across ARR, REDD+, blue carbon, and soil projects.

> **Business value:** Stacked credit value captures carbon plus up to 3 verified co-benefit premiums. Premium layer typically adds 15–45% to base carbon price.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CDR_METHODS`, `Card`, `DualInput`, `FEEDSTOCKS`, `Kpi`, `PERM_TIERS`, `Section`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PERM_TIERS` | `[{name:'Premium',adj:0,yrs:'1000+',color:'green'},{name:'Standard',adj:0.10,yrs:'100-999',color:'amber'},{name:'Basic',adj:0.30,yrs:'10-99',color:'red` |
| `genBeccsProjects` | `()=>Array.from({length:4},(_,i)=>({id:i+1,` |
| `biomassC` | `biomassInput*(carbonContent/100);` |
| `cStored` | `cInjected*(1-leakageRate);` |
| `co2Equiv` | `cStored*(44/12);` |
| `lifecycleEm` | `co2Equiv*(lifecyclePct/100);` |
| `finalRemoval` | `(co2Equiv-lifecycleEm)*(1-permAdj)*(1-uncertaintyAdj);` |
| `totalCap` | `beccsProjects.reduce((a,p)=>a+p.co2_captured,0);` |
| `totalEnergy` | `beccsProjects.reduce((a,p)=>a+p.energy_output_mwh,0);` |
| `totalNet` | `beccsProjects.reduce((a,p)=>a+p.net_removal,0);` |
| `totalAlloc` | `allocDAC+allocERW+allocBiCRS+allocBiochar+allocOAE;` |
| `norm` | `totalAlloc>0?100/totalAlloc:0;` |
| `budgetUsd` | `budgetM*1e6;` |
| `detail` | `methods.map(m=>{` |
| `spend` | `budgetUsd*m.alloc;` |
| `tonnes` | `m.costPerT>0?spend/m.costPerT:0;` |
| `biomassSustainability` | `useMemo(()=>FEEDSTOCKS.map((f,i)=>({` |
| `totalBicrs` | `bicrsProjects.reduce((a,p)=>a+p.verified_tCO2,0);` |

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
**Standards:** ['TNFD v1.0', 'SBTN v1.0', 'IUCN Ecosystem Services', 'Verra SD VISta']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).