# Real Assets Climate Risk
**Module ID:** `real-assets-climate` · **Route:** `/real-assets-climate` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses climate physical and transition risk across real estate and infrastructure asset portfolios using scenario-based hazard modelling and stranding analysis.

> **Business value:** Delivers an integrated climate risk lens across real estate and infrastructure portfolios, supporting TCFD disclosures and climate-adjusted investment decision-making.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ASSETS`, `ASSET_TYPES`, `CRREM`, `KPI`, `PAGE_SIZE`, `REGIONS`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#0c4a6e';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `CRREM` | `Array.from({length:10},(_,i)=>({year:2025+i*3,office:Math.round(80-i*6+sr(i*7)*5),retail:Math.round(90-i*5+sr(i*11)*6),logistics:Math.round(70-i*4+sr(` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgPhys:Math.round(30+sr(i*7)*15),avgTrans:Math.r` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `typeDist` | `useMemo(()=>{const m={};ASSETS.forEach(c=>{m[c.type]=(m[c.type]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `typeRisk` | `useMemo(()=>{const m={};ASSETS.forEach(c=>{if(!m[c.type])m[c.type]={type:c.type,phys:0,trans:0,n:0};m[c.type].phys+=c.physicalRisk;m[c.type].trans+=c.` |
| `radarData` | `useMemo(()=>{const dims=['physicalRisk','transitionRisk','crremScore','carbonIntensity','floodRisk','heatStress'];const avg=(k)=>Math.round(ASSETS.red` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Physical Risk Haircut (%) | — | Hazard Modelling | Portfolio average valuation reduction from modelled physical climate hazards under RCP 4.5. |
| Transition Risk Haircut (%) | — | Carbon Pricing Model | Valuation reduction from energy efficiency capital requirements and carbon cost under net-zero policy. |
| At-Risk AUM (%) | — | Climate Screen | Share of real assets AUM exposed to high or extreme combined climate risk. |
- **Asset register + hazard scores + energy data + carbon pathways** → Physical and transition risk haircut modelling; climate-adjusted valuation → **Asset-level climate risk report and adjusted valuation outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Adjusted Value
**Headline formula:** `V_climate = V_base × (1 – δ_physical) × (1 – δ_transition)`
**Standards:** ['TCFD Guidance for Infrastructure', 'CRREM Global Pathways v2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).