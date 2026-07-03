# Sustainable Transport Hub
**Module ID:** `sustainable-transport-hub` · **Route:** `/sustainable-transport-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated transport sector decarbonisation analytics covering EV adoption, maritime IMO targets, aviation SAF and CORSIA, rail electrification, and multi-modal carbon intensity comparison.

> **Business value:** Transport is responsible for 25% of global CO2 emissions and is undergoing fundamental technology disruption. This hub provides the analytical tools needed for transport companies, fleet operators, and investors to navigate decarbonisation across all transport modes and regulatory frameworks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIENCES`, `CHART_COLORS`, `KPI_DEFS`, `MODES`, `OPPORTUNITIES`, `PERIODS`, `REGIONS`, `REPORT_SECTIONS`, `RISKS`, `RISK_TIERS`, `STAGES`, `STAGE_COLORS`, `SUBSECTORS`, `SUB_MODULES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MODES` | `['Maritime','Aviation','Road/EV','Rail','Logistics'];` |
| `REGIONS` | `['Europe','Asia-Pacific','North America','Middle East','Africa','Latin America'];` |
| `SUBSECTORS` | `{Maritime:['Container','Tanker','Bulk Carrier','LNG Carrier','Cruise','Ro-Ro'],Aviation:['Long-Haul','Short-Haul','Cargo','Regional','Business Jet','H` |
| `REPORT_SECTIONS` | `['Exec Summary','Maritime Compliance','Aviation Decarbonisation','EV Transition','SAF Markets','Cross-Modal Analysis','Investment Portfolio','Recommen` |
| `modeIdx` | `Math.floor(s*5);const mode=MODES[modeIdx];` |
| `modeIdx` | `Math.floor(i/8);` |
| `tabs` | `['Executive Dashboard','Cross-Modal Portfolio','Engagement Pipeline','Board Report'];` |
| `val` | `k.key==='batteryCost'?k.base+k.delta*(m-1):k.base+(k.delta*(m-1));` |
| `delta` | `k.delta*(m>1?m*0.3:1);` |
| `stageCounts` | `useMemo(()=>STAGES.map(st=>({stage:st,count:filteredEngagements.filter(e=>e.stage===st).length})),[filteredEngagements]);` |
| `target` | `m==='Maritime'?50:m==='Aviation'?45:m==='Road/EV'?40:m==='Rail'?35:30;` |
| `rows` | `REPORT_SECTIONS.filter(s=>activeSections[s]).map(s=>[s,reportContent[s]?.text\|\|'',reportContent[s]?.deltaQ\|\|'']);` |
| `csv` | `[headers,...rows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `modePerformance` | `useMemo(()=>MODES.map((m,i)=>{` |
| `avgDecarb` | `modeAssets.length?+(modeAssets.reduce((s,a)=>s+a.decarbScore,0)/modeAssets.length).toFixed(0):0;` |
| `totalEmissions` | `+modeAssets.reduce((s,a)=>s+a.emissions,0).toFixed(1);` |
| `totalInvest` | `+modeAssets.reduce((s,a)=>s+a.investmentExp,0).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AUDIENCES`, `CHART_COLORS`, `KPI_DEFS`, `MODES`, `OPPORTUNITIES`, `PERIODS`, `REGIONS`, `REPORT_SECTIONS`, `RISKS`, `RISK_TIERS`, `STAGES`, `STAGE_COLORS`, `SUB_MODULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Aviation CI | — | ICAO | Passenger kilometre carbon intensity |
| Maritime Decarbonisation Target | — | IMO 2023 | IMO revised GHG strategy |
| EV Cost Parity | — | BNEF | Total cost of ownership vs ICE vehicles |
- **Fleet consumption data** → WTW calculation → **Modal carbon intensity**
- **ICAO/IMO reporting** → Regulatory compliance → **CORSIA offset requirement**
- **EV adoption data** → TCO modelling → **Electrification investment case**

## 5 · Intermediate Transformation Logic
**Methodology:** Transport modal carbon intensity
**Headline formula:** `Modal_CI = Lifecycle_GHG / passenger_km (or tonne_km)`
**Standards:** ['ITF/OECD', 'ICAO CORSIA', 'IMO GHG Strategy', 'EU FuelEU Maritime']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).