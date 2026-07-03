# Nature Risk & Opportunities Hub
**Module ID:** `nature-hub` · **Route:** `/nature-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated hub for nature-related risk and opportunity assessment following the TNFD LEAP (Locate, Evaluate, Assess, Prepare) framework. Combines biodiversity footprint analysis, ecosystem service dependency mapping, and nature-positive target tracking across portfolio companies. Integrates IBAT biodiversity data, ENCORE ecosystem service database, and TNFD disclosure templates to support A15 nature disclosures and SBTN target alignment.

> **Business value:** Gives corporate sustainability teams and institutional investors the framework, data, and analytics to identify, assess, and disclose nature-related financial risks and opportunities in line with TNFD recommendations and emerging regulatory requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ITEMS`, `PAGE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].j` |
| `paged` | `filtered.slice(page*PAGE,page*PAGE+PAGE);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `kpis` | `useMemo(()=>[{l:'Entities',v:filtered.length},{l:'Avg Biodiv Score',v:filtered.length?(filtered.reduce((s,x)=>s+parseFloat(x.biodivScore),0)/filtered.` |
| `dist1` | `useMemo(()=>{const m={};F1.forEach(s=>m[s]=0);filtered.forEach(x=>m[x.sector]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({na` |
| `dist2` | `useMemo(()=>{const m={};F2.forEach(r=>m[r]=0);filtered.forEach(x=>m[x.region]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({na` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Biodiversity Footprint Score (MSA·km²) | — | GLOBIO / GBS methodology | Mean Species Abundance impact per square kilometre; higher values indicate greater biodiversity loss contribut |
| Critical Habitat Proximity (%) | — | IBAT spatial overlay | Proportion of operational sites within or adjacent to IUCN Key Biodiversity Areas or critical habitats |
| Ecosystem Service Dependency (High/Med/Low) | — | ENCORE database | Level of business model dependency on ecosystem services (water, pollination, climate regulation, etc.) |
| Nature-Positive Target Progress (%) | — | SBTN Step 3 target tracking | Progress toward company-level nature-positive commitments relative to SBTN no-net-loss baseline |
- **Corporate facility location data** → Geocode to biome and ecoregion; overlay IBAT KBA and critical habitat layers → **Site-level critical habitat proximity flags and biome classification**
- **ENCORE dependency database** → Match sector to ecosystem service dependency matrix; rank services by dependency level → **Ecosystem service dependency profile by business segment and sector**
- **Supply chain commodity data** → Map sourcing geographies to deforestation and ecosystem degradation risk by commodity → **Upstream nature impact footprint by commodity and sourcing region**

## 5 · Intermediate Transformation Logic
**Methodology:** Biodiversity Footprint Score
**Headline formula:** `BFS = Σᵢ (Impact Driverᵢ × Ecosystem Sensitivityᵢ × Areaᵢ)`
**Standards:** ['TNFD LEAP Approach v1.1 2023', 'SBTN Science-Based Targets for Nature 2023', 'ENCORE Ecosystem Services Database (UNEP-WCMC)', 'IBAT Integrated Biodiversity Assessment Tool', 'GBS Global Biodiversity Score (CDC Biodiversité)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).