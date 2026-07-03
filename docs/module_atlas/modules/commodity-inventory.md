# Commodity Inventory
**Module ID:** `commodity-inventory` · **Route:** `/commodity-inventory` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks physical commodity holdings with carbon intensity benchmarking against sectoral and regional peers, computes inventory-level GHG exposure, and monitors alignment with science-based commodity procurement targets. Designed for corporate treasury and sustainability teams managing physical raw material stocks.

> **Business value:** Enables sustainability and procurement teams to identify the highest-carbon inventory positions, target supplier engagement for intensity reduction, and report accurate Scope 3 Category 1 emissions for CSRD and ISSB S2 disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CARBON_FOOTPRINT_COMPARISON`, `COMMODITY_LIST`, `COUNTRY_LIST_SORTED`, `COUNTRY_SC_DATABASE`, `Card`, `DIM_COLORS`, `KPI`, `LS_PORT`, `LS_SC`, `RiskBar`, `SC_MATURITY`, `SC_REGULATIONS`, `SECTOR_COMMODITY_MAP`, `STAGE_COLORS`, `SUPPLY_CHAINS`, `Section`, `SortTH`, `TOTAL_SC_COUNT`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `s=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x)};` |
| `pct` | `n=>n==null?'\u2014':`${Math.round(n)}%`;` |
| `sorted` | `[...(st.countries\|\|[])].sort((a,b)=>(b.share_pct\|\|0)-(a.share_pct\|\|0));` |
| `avgEnv` | `cnt?envSum/cnt:0;const avgSoc=cnt?socSum/cnt:0;const avgGov=cnt?govSum/cnt:0;` |
| `confidence` | `Math.min(95,Math.max(40,50+cnt*3));` |
| `COUNTRY_LIST_SORTED` | `Object.values(COUNTRY_SC_DATABASE).sort((a,b)=>b.supply_chains.length-a.supply_chains.length);` |
| `COMMODITY_LIST` | `Object.entries(SUPPLY_CHAINS).map(([id,c])=>({id,name:c.name,price:c.price,unit:c.unit,stages:c.supply_chain.length,countries:c.supply_chain.reduce((s` |
| `stageNames` | `stages.map(s=>s.stage);` |
| `totalCompanies` | `useMemo(()=>{let n=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.companies)n+=c.companies.length})});return n},[stages]);` |
| `totalWorkers` | `useMemo(()=>{let n=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.workers_est)n+=c.workers_est});if(st.workers_est)n+=st.workers_` |
| `avgESG` | `(dim)=>{let sum=0,count=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.esg_risk&&c.esg_risk[dim]!=null){sum+=c.esg_risk[dim];coun` |
| `avgCarbon` | `useMemo(()=>{let sum=0,count=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.carbon_intensity_kg_per_t){sum+=c.carbon_intensity_kg` |
| `childLaborStages` | `useMemo(()=>{let n=0;stages.forEach(st=>{if(st.countries)st.countries.forEach(c=>{if(c.child_labor_risk\|\|c.forced_labor_risk)n++})});return n},[stages` |
| `concentrationData` | `useMemo(()=>stages.filter(s=>s.countries).map(st=>{const sorted=[...(st.countries\|\|[])].sort((a,b)=>(b.share_pct\|\|0)-(a.share_pct\|\|0));const top=sorte` |
| `esgHeatmap` | `useMemo(()=>stages.filter(s=>s.countries).map(st=>{const envAvg=st.countries.reduce((s,c)=>s+(c.esg_risk?.env\|\|0),0)/Math.max(1,st.countries.length);c` |
| `carbonWaterfall` | `useMemo(()=>{let cum=0;return stages.filter(s=>s.countries).map(st=>{const avg=st.countries.reduce((s,c)=>s+(c.carbon_intensity_kg_per_t\|\|0),0)/Math.m` |
| `waterData` | `useMemo(()=>stages.filter(s=>s.countries).map(st=>{const intensities={'Very High':90,'Very High (arid region)':95,'Very High (arid)':95,'High':70,'Hig` |
| `portfolioRisk` | `useMemo(()=>portfolio.slice(0,15).map((c,i)=>{const sectorComms=SECTOR_COMMODITY_MAP[c.sector]\|\|[];const exposed=sectorComms.includes(selectedComm);re` |

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
**Standards:** ['GHG Protocol Scope 3 Cat.1', 'SBTi FLAG', 'ISO 14064']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).