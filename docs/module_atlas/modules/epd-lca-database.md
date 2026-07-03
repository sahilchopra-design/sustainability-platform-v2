# EPD & LCA Database
**Module ID:** `epd-lca-database` · **Route:** `/epd-lca-database` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages and queries a curated database of Environmental Product Declarations and lifecycle assessment records for construction materials, manufactured goods, and industrial products. Supports EPD search, comparison, version control, and gap analysis against ISO 14025 and EN 15804+A2 requirements. Enables systematic material substitution analysis, EPD data quality auditing, and green procurement workflows.

> **Business value:** Streamlines the EPD procurement and verification workflow for project teams, dramatically reducing the time to build LEED v4 MRc credit submissions and RICS whole-life carbon calculations while maintaining a living database of product-level embodied carbon benchmarks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_CATEGORIES`, `ALTERNATIVES`, `Badge`, `Btn`, `CAT_COLORS`, `Card`, `EPD_DATABASE`, `EPD_LCA_SOURCES`, `KPI`, `LS_API_KEYS`, `LS_CUSTOM_EPD`, `LS_PORT`, `RADAR_METRICS`, `Section`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ALL_CATEGORIES` | `[...new Set(EPD_DATABASE.map(e=>e.category))];` |
| `fmtUSD` | `n=>{if(n==null)return'\u2014';if(n>=1e6)return`$${(n/1e6).toFixed(1)}M`;if(n>=1000)return`$${(n/1000).toFixed(1)}K`;return`$${Number(n).toFixed(2)}`};` |
| `url` | ``https://api.environdec.com/api/v1/EPD?search=${encodeURIComponent(query)}&pageSize=20`;` |
| `url` | ``https://etl-api.cqd.io/api/materials?search=${encodeURIComponent(query)}&limit=20`;` |
| `allEPDs` | `useMemo(()=>[...EPD_DATABASE,...customEPDs.map((c,i)=>({...c,id:`CUSTOM_${i}`,source:'custom',verified:false}))]  ,[customEPDs]);` |
| `gwps` | `allEPDs.filter(e=>e.gwp_kg_co2e!=null).map(e=>e.gwp_kg_co2e);` |
| `avgGWP` | `gwps.length?gwps.reduce((s,x)=>s+x,0)/gwps.length:0;` |
| `cats` | `{};allEPDs.forEach(e=>{cats[e.category]=(cats[e.category]\|\|0)+1});` |
| `lowest` | `allEPDs.filter(e=>e.gwp_kg_co2e!=null).sort((a,b)=>a.gwp_kg_co2e-b.gwp_kg_co2e)[0];` |
| `highest` | `allEPDs.filter(e=>e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e)[0];` |
| `catAvgGWP` | `useMemo(()=>ALL_CATEGORIES.map(cat=>{` |
| `avg` | `items.length?items.reduce((s,e)=>s+e.gwp_kg_co2e,0)/items.length:0;` |
| `constructionMats` | `useMemo(()=>allEPDs.filter(e=>e.category==='Construction'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice` |
| `foodData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Food'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,18),g` |
| `textileData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Textiles').map(e=>({name:e.product.slice(0,20),gwp:e.gwp_kg_co2e,water:e.water_l\|\|0})),[allEPDs]);` |
| `electronicsData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Electronics'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(` |
| `transportData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Transport'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,` |
| `energyData` | `useMemo(()=>allEPDs.filter(e=>e.category==='Energy'&&e.gwp_kg_co2e!=null).sort((a,b)=>b.gwp_kg_co2e-a.gwp_kg_co2e).map(e=>({name:e.product.slice(0,22)` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_CATEGORIES`, `ALTERNATIVES`, `CAT_COLORS`, `EPD_DATABASE`, `EPD_LCA_SOURCES`, `RADAR_METRICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| GWP100 A1â€“A3 (kgCO2e/declared unit) | — | EPD Programme Operators | Product stage embodied carbon; primary metric for material comparison; must be verified EPD (not self-declared |
| EPD Validity Status | — | ISO 14025 Â§8.1.4 | EPDs expire after 5 years; validity flag alerts users to expired records requiring renewal before use in compl |
| PCR Version | — | EPD Programme Operator | Product Category Rule version underpinning the EPD; different PCR versions may use different system boundaries |
| Third-Party Verifier | — | IBU / BRE / EPD International | Independent verifier name; critical for LEED v4, BREEAM, and green bond compliance requiring Type III EPDs. |
- **EPD programme operator databases (ECO Platform, EPD International, IBU, BRANZ)** → Parse XML/PDF EPD documents; extract GWP100 by lifecycle module and validate verifier signature → **Structured EPD record with GWP, validity, PCR version**
- **Project bill of materials** → Fuzzy-match material descriptions to EPD product names and declared units → **Matched EPD coverage rate and unmatched material list**
- **LEED/BREEAM credit requirements** → Filter EPD records by programme compliance criteria (Type III, third-party verified, within validity) → **Compliant EPD count and certification gap analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** EPD Carbon Factor Comparator
**Headline formula:** `CF_delta = (CF_incumbent − CF_alternative) / CF_incumbent × 100%`
**Standards:** ['ISO 14025:2006', 'EN 15804+A2:2022', 'ISO 14044:2006']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).