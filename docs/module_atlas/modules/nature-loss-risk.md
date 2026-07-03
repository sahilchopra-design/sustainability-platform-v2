# Nature Loss Risk
**Module ID:** `nature-loss-risk` · **Route:** `/nature-loss-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies portfolio exposure to financial risks arising from nature loss and ecosystem service degradation through supply chain dependency mapping and physical nature risk scoring. Assesses how biodiversity decline, deforestation, soil degradation, and freshwater stress translate to revenue disruption, cost escalation, and regulatory liability for investee companies. Supports TNFD Assess pillar and CSRD ESRS E4 biodiversity disclosure.

> **Business value:** Helps portfolio managers and sustainability analysts translate the abstract risk of nature loss into quantified revenue-at-risk estimates, enabling prioritised engagement with high-exposure companies and credible TNFD and ESRS E4 disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `BIO_DRIVERS`, `COMPANIES`, `KPI`, `PAGE_SIZE`, `SECTORS`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#059669';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgDep:Math.round(40+sr(i*7)*15),avgImpact:Math.r` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/ Math.max(1, COMPANIES.length));return{avgDep:avg('natureDep'),avgImpact:avg(` |
| `sectorChart` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,avgDep:0,avgImp:0,n:0};m[c.sector].avgDep+=c.natureDep;m[c.` |
| `radarData` | `useMemo(()=>{const dims=['natureDep','natureImpact','tnfdReadiness','leapScore','waterDep','supplyChainNature'];const avg=(k)=>Math.round(COMPANIES.re` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BIO_DRIVERS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NLFRS (0–100) | — | ENCORE + IPBES composite | Composite nature loss financial risk score; above 60 indicates material revenue exposure to ecosystem degradat |
| High Dependency Services Count | — | ENCORE sector dependency matrix | Number of ecosystem services on which the business has high dependency, heightening nature loss exposure |
| Revenue at Risk from Nature Loss (%) | — | WEF ecosystem service valuation | Proportion of business revenue dependent on ecosystem services that are in significant decline globally |
| Freshwater Stress Exposure (%) | — | WRI Aqueduct water risk overlay | Share of operations or supply chain sourcing in high or extremely high water stress basins |
- **ENCORE ecosystem service dependency database** → Match company sector to dependency intensity matrix; rank services by dependency level → **Ecosystem service dependency profile per company and sector**
- **IPBES ecosystem degradation assessments** → Extract service-specific degradation index by geography; map to company supply chain sourcing regions → **Ecosystem service degradation trajectory per dependency and geography**
- **Operational and supply chain geographies** → Overlay with freshwater stress, soil carbon, and forest cover datasets → **Nature risk spatial exposure heatmap by site and sourcing region**

## 5 · Intermediate Transformation Logic
**Methodology:** Nature Loss Financial Risk Score
**Headline formula:** `NLFRSᵢ = Σⱼ (Dependencyᵢⱼ × ServiceDegradationⱼ × RevenueExposureᵢⱼ)`
**Standards:** ['TNFD LEAP Approach v1.1 2023', 'CSRD ESRS E4 Biodiversity and Ecosystems 2023', 'ENCORE Ecosystem Service Dependency Data', 'WEF Nature Risk Rising Report 2020', 'IPBES Global Assessment Report on Biodiversity 2019']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).