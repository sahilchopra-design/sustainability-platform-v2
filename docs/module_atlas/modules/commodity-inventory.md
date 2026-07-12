# Commodity Inventory
**Module ID:** `commodity-inventory` · **Route:** `/commodity-inventory` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks physical commodity holdings with carbon intensity benchmarking against sectoral and regional peers, computes inventory-level GHG exposure, and monitors alignment with science-based commodity procurement targets. Designed for corporate treasury and sustainability teams managing physical raw material stocks.

> **Business value:** Enables sustainability and procurement teams to identify the highest-carbon inventory positions, target supplier engagement for intensity reduction, and report accurate Scope 3 Category 1 emissions for CSRD and ISSB S2 disclosures.

**How an analyst works this module:**
- Upload or sync inventory holdings via the data ingestion panel
- Review carbon intensity ranking table comparing holdings to sector benchmarks
- Use the Supplier Map to view geographic concentration and regional emission factor quality
- Set procurement targets and view gap-to-target trajectories on the Alignment tab
- Export Scope 3 Category 1 inventory report for CSRD/ISSB disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CARBON_FOOTPRINT_COMPARISON`, `COMMODITY_LIST`, `COUNTRY_LIST_SORTED`, `COUNTRY_SC_DATABASE`, `Card`, `DIM_COLORS`, `KPI`, `LS_PORT`, `LS_SC`, `RiskBar`, `SC_MATURITY`, `SC_REGULATIONS`, `SECTOR_COMMODITY_MAP`, `STAGE_COLORS`, `SUPPLY_CHAINS`, `Section`, `SortTH`, `TOTAL_SC_COUNT`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SC_REGULATIONS` | 11 | `regulation`, `effective`, `full_enforcement`, `commodities`, `requirement`, `penalty`, `compliance_cost`, `affected_companies` |
| `SC_MATURITY` | 17 | `commodity`, `traceability`, `certification`, `transparency`, `digitization`, `resilience`, `maturity_score` |
| `CARBON_FOOTPRINT_COMPARISON` | 16 | `commodity`, `cradle_to_gate_kg`, `gate_to_grave_kg`, `total_kg`, `unit`, `best_practice`, `best_tech` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `s=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x)};` |
| `pct` | `n=>n==null?'\u2014':`${Math.round(n)}%`;` |
| `sorted` | `[...(st.countries\|\|[])].sort((a,b)=>(b.share_pct\|\|0)-(a.share_pct\|\|0));` |
| `avgEnv` | `cnt?envSum/cnt:0;const avgSoc=cnt?socSum/cnt:0;const avgGov=cnt?govSum/cnt:0;` |
| `confidence` | `Math.min(95,Math.max(40,50+cnt*3));` |
| `COUNTRY_LIST_SORTED` | `Object.values(COUNTRY_SC_DATABASE).sort((a,b)=>b.supply_chains.length-a.supply_chains.length);` |
| `COMMODITY_LIST` | `Object.entries(SUPPLY_CHAINS).map(([id,c])=>({id,name:c.name,price:c.price,unit:c.unit,stages:c.supply_chain.length,countries:c.supply_chain.reduce((s,st)=>(st.countries?s+st.countries.length:s),0)}));` |
| `stageNames` | `stages.map(s=>s.stage);` |
| `totalCountries` | `useMemo(()=>{const s=new Set();stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>s.add(c.iso2\|\|c.name))});return s.size},[stages]); const totalCompanies=useMemo(()=>{let n=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.companies)n+=c.companies.length})});return n},[stages]);` |
| `totalWorkers` | `useMemo(()=>{let n=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.workers_est)n+=c.workers_est});if(st.workers_est)n+=st.workers_est});return n},[stages]);` |
| `avgESG` | `(dim)=>{let sum=0,count=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.esg_risk&&c.esg_risk[dim]!=null){sum+=c.esg_risk[dim];count++}})});return count?Math.round(sum/count):0};` |
| `avgCarbon` | `useMemo(()=>{let sum=0,count=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.carbon_intensity_kg_per_t){sum+=c.carbon_intensity_kg_per_t;count++}})});return count?Math.round(sum/count):0},[stages]);` |
| `childLaborStages` | `useMemo(()=>{let n=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.child_labor_risk\|\|c.forced_labor_risk)n++})});return n},[stages]);` |
| `concentrationData` | `useMemo(()=>stages.filter(s=>s.countries).map(st=>{const sorted=[...(st.countries\|\|[])].sort((a,b)=>(b.share_pct\|\|0)-(a.share_pct\|\|0));const top=sorted[0];return{stage:st.stage,topCountry:top?.name\|\|'N/A',topShare:top?.s` |
| `esgHeatmap` | `useMemo(()=>stages.filter(s=>s.countries).map(st=>{const envAvg=st.countries.reduce((s,c)=>s+(c.esg_risk?.env\|\|0),0)/Math.max(1,st.countries.length);const socAvg=st.countries.reduce((s,c)=>s+(c.esg_risk?.social\|\|0),0)/Ma` |
| `carbonWaterfall` | `useMemo(()=>{let cum=0;return stages.filter(s=>s.countries).map(st=>{const avg=st.countries.reduce((s,c)=>s+(c.carbon_intensity_kg_per_t\|\|0),0)/Math.max(1,st.countries.length);cum+=avg;return{stage:st.stage,stageCarbon:M` |
| `waterData` | `useMemo(()=>stages.filter(s=>s.countries).map(st=>{const intensities={'Very High':90,'Very High (arid region)':95,'Very High (arid)':95,'High':70,'High (irrigated)':65,'Very High (10,000L/kg)':95,'Very High (Indus)':92,'` |
| `portfolioRisk` | `useMemo(()=>portfolio.slice(0,15).map((c,i)=>{const sectorComms=SECTOR_COMMODITY_MAP[c.sector]\|\|[];const exposed=sectorComms.includes(selectedComm);return{company:c.company_name,sector:c.sector,weight:c.weight,exposed,ri` |
| `sortedCountries` | `useMemo(()=>{if(!currentStage?.countries)return[];return[...currentStage.countries].sort((a,b)=>{const av=a[sort.field],bv=b[sort.field];if(av==null)return 1;if(bv==null)return -1;return sort.asc?(av>bv?1:-1):(av<bv?1:-1)})},[currentStage,sort]); const compareChain=SUPPLY_CHAINS[compareComm];` |
| `exportJSON` | `()=>{const blob=new Blob([JSON.stringify({chains:SUPPLY_CHAINS,timestamp:new Date().toISOString()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='esg_` |
| `workerCt` | `st.countries?.reduce((s,c)=>s+(c.workers_est\|\|0),0)\|\|(st.workers_est\|\|0);` |
| `priceStages` | `stages.filter(s=>s.countries).map(st=>{` |
| `avgPrice` | `st.countries.reduce((s,c)=>s+(c.price_at_stage\|\|0),0)/Math.max(1,st.countries.filter(c=>c.price_at_stage).length);` |
| `margin` | `i>0?Math.round((p.avgPrice-priceStages[i-1].avgPrice)/Math.max(1,priceStages[i-1].avgPrice)*100):0;` |
| `top` | `[...(st.countries\|\|[])].sort((a,b)=>(b.share_pct\|\|0)-(a.share_pct\|\|0))[0];` |
| `total` | `0;ch.supply_chain.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.workers_est)total+=c.workers_est});if(st.workers_est)total+=st.workers_est});` |
| `hhi` | `sorted.reduce((s,c)=>s+Math.pow(c.share_pct\|\|0,2),0);` |
| `stageWorkers` | `stages.filter(s=>s.countries\|\|s.workers_est).map(st=>{` |
| `composite` | `Math.round((row.Environmental+row.Social+(100-row.Governance))/3);` |
| `reduction` | `Math.round((1-c.best_practice/c.cradle_to_gate_kg)*100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_FOOTPRINT_COMPARISON`, `SC_MATURITY`, `SC_REGULATIONS`, `STAGE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Carbon Intensity | — | GHG Protocol / Ecoinvent | Weighted average carbon intensity of current inventory holdings |
| Benchmark Intensity Gap | — | SBTi / IEA | Deviation of portfolio intensity from sector science-based benchmark |
| High-Risk Holdings % | — | Internal scoring | Proportion of inventory with carbon intensity >1 standard deviation above benchmark |
| Supplier Coverage Rate | — | Procurement data | Proportion of inventory volume with supplier-specific emission factors (vs generic) |
| Inventory GHG Exposure | — | GHG Protocol | Absolute Scope 3 Category 1 emissions embodied in current inventory |
- **Procurement/ERP systems** → Extract inventory volumes by commodity code and supplier → **Holdings inventory table**
- **Ecoinvent / supplier data** → Match to emission factors, fill gaps with regional averages → **Per-holding carbon intensity**
- **SBTi/IEA benchmarks** → Compare holding intensity to pathway, compute gap → **Benchmark intensity gap %**

## 5 · Intermediate Transformation Logic
**Methodology:** Inventory Carbon Intensity Benchmarking
**Headline formula:** `CI_relative = (CI_holding - CI_benchmark) / CI_benchmark × 100`

Carbon intensity per tonne is calculated using supplier-specific emission factors where available, falling back to regional and process-level LCA averages. Benchmark intensity follows SBTi sector pathways for agricultural commodities (FLAG guidance) and IEA sectoral benchmarks for energy and metals. Relative intensity score drives procurement decarbonisation prioritisation.

**Standards:** ['GHG Protocol Scope 3 Cat.1', 'SBTi FLAG', 'ISO 14064']
**Reference documents:** GHG Protocol Scope 3 Standard â€” Category 1 Purchased Goods; SBTi FLAG Guidance for Forest, Land and Agriculture; ISO 14064-1 Quantification and Reporting of GHG Emissions; Ecoinvent 3.10 Life Cycle Inventory Database

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes **Inventory Carbon Intensity Benchmarking**
> `CI_relative = (CI_holding − CI_benchmark)/CI_benchmark·100` against SBTi-FLAG / IEA sector pathways, for
> corporate treasury inventory holdings. **The page does not benchmark inventory against SBTi/IEA pathways.**
> It is a **supply-chain ESG/carbon traceability explorer**: for each commodity's multi-stage supply chain it
> aggregates country-level ESG risk, carbon intensity, water intensity, worker counts and country
> concentration (HHI) from a curated `SUPPLY_CHAINS` structure. There is no CI_relative, no benchmark
> pathway, and no inventory tonnage. The computations it *does* run (means, HHI, waterfall) operate on stored
> reference data, not seeded random numbers. §8 specifies the benchmarking model the guide names.

### 7.1 What the module computes

Over a commodity's supply-chain stages (each with a `countries` array carrying `esg_risk`,
`carbon_intensity_kg_per_t`, `share_pct`, `workers_est`):
```js
totalCountries = unique(iso2|name) across stages
avgESG(dim)  = round( Σ_countries esg_risk[dim] / count )        // env / social / governance
avgCarbon    = round( Σ carbon_intensity_kg_per_t / count )
hhi          = Σ (share_pct)²                                    // country-concentration (Herfindahl)
composite    = round( (Environmental + Social + (100 − Governance)) / 3 )   // ESG heat composite
reduction    = round( (1 − best_practice/cradle_to_gate_kg) · 100 )        // decarb potential
margin       = round( (avgPrice − prevAvgPrice)/prevAvgPrice · 100 )       // stage value-add
```
Carbon is accumulated across stages as a waterfall (`cum += stage avg`). Water intensity maps qualitative
labels ("Very High (10,000L/kg)", "High (irrigated)") to numeric scores.

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `SUPPLY_CHAINS` / `COUNTRY_SC_DATABASE` (stages, countries, esg_risk, carbon, share_pct, workers) | dataset | curated real-flavoured reference data |
| `SC_REGULATIONS` (11: effective, enforcement, penalty, compliance_cost) | seed schema | curated (CSDDD/UFLPA/EUDR/LkSG…) |
| `SC_MATURITY` (17: traceability, certification, digitization, resilience) | seed schema | curated maturity scores |
| `CARBON_FOOTPRINT_COMPARISON` (16: cradle_to_gate, gate_to_grave, best_practice) | seed schema | curated LCA figures |
| `composite` ESG formula | `(Env + Soc + (100−Gov))/3` | heuristic (governance inverted) |
| Water label→score map | fixed dictionary | heuristic mapping |
| `confidence` | `clamp(40,95, 50 + count·3)` | heuristic (more data → higher) |

Note: governance is inverted in `composite` (`100 − Governance`), implying the stored governance field is a
*quality* score where higher = better, unlike env/social where higher = worse risk.

### 7.3 Calculation walkthrough

Select commodity → its supply-chain stages loaded → per-stage country arrays aggregated into `avgESG`,
`avgCarbon`, `totalWorkers`, `childLaborStages` (count of countries flagged) → `concentrationData` finds the
top country and its share per stage → `esgHeatmap` builds per-stage env/social averages → `carbonWaterfall`
accumulates stage carbon → `waterData` scores water intensity → `hhi` measures country concentration →
`priceStages`/`margin` trace value-add across stages → portfolio tab links holdings to exposed commodities.
JSON/CSV export of the full chain.

### 7.4 Worked example

A stage sourced from three countries with `share_pct = [55, 30, 15]`:
```
HHI = 55² + 30² + 15² = 3025 + 900 + 225 = 4150   (highly concentrated; >2500 = concentrated)
```
Carbon comparison for a commodity with `cradle_to_gate_kg = 8.0`, `best_practice = 5.0`:
```
reduction = round((1 − 5.0/8.0)·100) = round(37.5) = 38%   (decarbonisation potential via best tech)
```
ESG composite for a stage with `Environmental = 70`, `Social = 60`, `Governance = 80` (quality):
```
composite = round((70 + 60 + (100 − 80))/3) = round(150/3) = 50
```

### 7.5 Data provenance & limitations

- The supply-chain structure is **curated reference data** (country ESG risk, carbon intensity, worker
  estimates, shares) — richer and more real than most platform modules; the `seed()` PRNG is defined but
  barely used (a few fallback values). HHI, ESG means, carbon waterfall and margins are **real computations**
  on that stored data.
- The guide's inventory-CI-benchmarking (CI_relative vs SBTi-FLAG/IEA pathway) is **not implemented** — there
  is no inventory tonnage, no benchmark pathway, no relative-intensity score.
- Water-intensity mapping is a hand-coded label dictionary, not a WFN water-footprint calculation; the
  governance-inversion convention in `composite` should be documented for consistency.

**Framework alignment:** GHG Protocol Scope 3 Category 1 (carbon-intensity basis the module aggregates) ·
SBTi FLAG / IEA sector benchmarks (the guide's intended benchmark, not wired) · ISO 14064 (GHG quantification)
· supply-chain due-diligence regimes in `SC_REGULATIONS` (EU CSDDD, UFLPA, EUDR, German LkSG). Herfindahl HHI
is the standard concentration measure.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Benchmark physical inventory carbon intensity against science-based sector pathways
(the guide's stated purpose) and flag high-carbon holdings for procurement decarbonisation and CSRD/ISSB
Scope-3-Cat-1 reporting.

**8.2 Conceptual approach.** Supplier-specific emission factors where available, ecoinvent/regional fallback
otherwise, benchmarked against SBTi-FLAG (agri) and IEA (energy/metals) sector pathways — the standard
inventory-footprint + benchmark approach (PCAF-style DQ hierarchy applied to physical stocks).

**8.3 Mathematical specification.**
```
CI_holding = Σ_supplier volumeShare_s · EF_s   (EF supplier-specific → regional → global, PCAF DQ scored)
CI_benchmark = SBTi-FLAG or IEA sector pathway value at reporting year
CI_relative = (CI_holding − CI_benchmark)/CI_benchmark · 100
InventoryGHG = Σ_holding volume_t · CI_holding_t    (absolute Scope 3 Cat 1, ktCO₂e)
HighRiskShare = Σ_holding[ CI_holding > CI_benchmark + σ ] volume / Σ volume
```

| Parameter | Source |
|---|---|
| Emission factors EF | supplier data → ecoinvent 3.10 → IEA/DEFRA regional |
| DQ score | PCAF data-quality hierarchy (1–5) |
| Benchmark pathway | SBTi-FLAG (agri), IEA sector (energy/metals) |
| Standard deviation σ | cross-supplier EF dispersion |

**8.4 Data requirements.** Inventory volumes by commodity+supplier; EFs; SBTi/IEA benchmarks. Free: DEFRA
EFs, IEA summaries; vendor: ecoinvent, supplier primary data. Platform: supply-chain carbon data already in
this module's `SUPPLY_CHAINS`.

**8.5 Validation & benchmarking.** Reconcile CI_holding vs GHG-Protocol 0.8–3.2 tCO₂e/t range; DQ coverage
audit; CI_relative vs SBTi pathway; sensitivity to EF fallback tier.

**8.6 Limitations & model risk.** Supplier EF coverage typically 60–85%; benchmark-pathway country gaps;
allocation across co-products. Fallback: regional average EF with PCAF DQ=5 flag when supplier data is
missing.

## 9 · Future Evolution

### 9.1 Evolution A — Add the missing inventory layer: tonnage × CI vs SBTi-FLAG/IEA benchmarks (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag cuts one way that's unusual for this platform: the page's
actual computations (stage-level ESG means, Herfindahl HHI, carbon waterfall, margin
trace) are *real math on curated reference data* — the `seed()` PRNG is barely used —
but the guide's product, `CI_relative = (CI_holding − CI_benchmark)/CI_benchmark×100`
against SBTi-FLAG/IEA pathways, doesn't exist: there is no inventory tonnage, no
benchmark pathway, no relative-intensity score. Evolution A adds that inventory layer
on top of the sound traceability base.

**How.** (1) Holdings model: an upload/entry path (the overview already promises an
ingestion panel) capturing commodity, tonnage, supplier, origin — persisted to a new
`commodity_inventory_holdings` table, this module's first vertical. (2) CI resolution
cascade per the guide: supplier-specific factor → the module's own stage-level
`carbon_intensity_kg_per_t` country data → `CARBON_FOOTPRINT_COMPARISON` cradle-to-gate
LCA fallback, with the resolution tier reported (mirroring the platform's GLEIF
pattern). (3) Benchmarks: digitise SBTi FLAG commodity pathways and IEA sectoral
intensities as a refdata table; compute CI_relative and the gap-to-target trajectory.
(4) Scope 3 Cat 1 export: tonnage × resolved CI, formatted for the CSRD/ISSB
disclosure the overview promises; document the governance-inversion convention §7.5
flags in the composite.

**Prerequisites.** SBTi FLAG pathway digitisation (public, versioned); no PRNG purge
needed — a genuine rarity. **Acceptance:** a 3-holding test book produces CI_relative
values hand-checkable against the stored factors; each holding shows its CI resolution
tier; the Scope 3 export total equals Σ(tonnage × CI) exactly.

### 9.2 Evolution B — Supplier-engagement prioritizer with regulation mapping (LLM tier 1)

**What.** The module already holds the raw material for engagement decisions — country
ESG risk by stage, HHI concentration, `SC_REGULATIONS` (CSDDD, UFLPA, EUDR, LkSG with
penalties and timelines), `SC_MATURITY` traceability scores — but leaves synthesis to
the analyst. Evolution B drafts the supplier-engagement brief: for a commodity (and,
post-Evolution A, a holding), which stage carries the concentration risk, which
regulations bite on which origin countries and when, and what the decarbonisation
potential is (`reduction` vs best practice), each claim cited to the stored dataset.

**How.** Tier-1 RAG: corpus is this Atlas record plus the curated
`SUPPLY_CHAINS`/`SC_REGULATIONS` structures themselves (they are reference data, ideal
grounding); page state supplies the selected commodity. The prompt encodes §7.5's
caveats — water intensity is a label dictionary, worker counts are estimates — so
briefs carry proportionate confidence. Tier 2 becomes meaningful only after Evolution
A creates endpoints (re-resolve a holding's CI, recompute gap-to-target as tool
calls).

**Prerequisites.** Corpus embedding (roadmap D3); Evolution A for holding-specific
briefs. **Acceptance:** a cocoa engagement brief cites the actual stage HHI and the
specific regulations (with real effective dates) from `SC_REGULATIONS`; asked about a
commodity not in `SUPPLY_CHAINS`, the copilot says the chain isn't mapped rather than
generalizing.