# Commodity Deforestation Risk
**Module ID:** `commodity-deforestation` · **Route:** `/commodity-deforestation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses supply chain deforestation risk embedded in commodity exposure across soy, palm oil, beef, timber, cocoa, and coffee using satellite-verified land-use change data and EUDR compliance frameworks.

> **Business value:** Helps financial institutions, corporates, and supply chain managers identify, quantify, and mitigate deforestation risk in commodity supply chains while preparing for EUDR and TNFD disclosure requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CERT_DATA`, `CERT_SCHEMES`, `CERT_TYPES`, `COMMODITIES`, `COMMODITY_RADAR`, `COMM_COLORS`, `COMPANIES`, `COMPANY_NAMES`, `COUNTRIES`, `COUNTRY_DATA`, `Card`, `CertTraceability`, `CommodityRisk`, `CustomTooltip`, `EudrDashboard`, `FinancialImpact`, `KPI`, `RADAR_DIMS`, `REGIONS`, `STATUSES`, `STATUS_CLR`, `SUPPLY_PATHS`, `Tabs`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,s)=>arr[Math.floor(sr(s)*arr.length)];` |
| `rng` | `(min,max,s)=>Math.floor(sr(s)*(max-min+1))+min;` |
| `pct` | `(s)=>Math.round(sr(s)*100);` |
| `fmt` | `n=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toString();` |
| `STATUSES` | `['Compliant','Partial','Non-Compliant','Not Assessed'];` |
| `STATUS_CLR` | `{Compliant:T.green,Partial:T.amber,'Non-Compliant':T.red,'Not Assessed':T.textMut};` |
| `CERT_TYPES` | `{RSPO:'Palm Oil',RTRS:'Soy','Rainforest Alliance':'Multi',FSC:'Wood',UTZ:'Multi',ProTerra:'Soy',ISCC:'Multi',RSB:'Multi',Bonsucro:'Sugar/Ethanol',ASI:` |
| `COMPANY_NAMES` | `['Cargill','Wilmar International','Bunge','ADM','Louis Dreyfus','Olam','Barry Callebaut','Sime Darby','Golden Agri-Resources','Musim Mas','IOI Group',` |
| `genCountryRisk` | `()=>COUNTRIES.map((c,i)=>({name:c,region:REGIONS[c],deforestRate:+(sr(i*31)*4.5+0.2).toFixed(2),forestCover:rng(15,85,i*17),riskScore:rng(20,98,i*23),` |
| `_FAO_MAP_CD` | `Object.fromEntries(FAO_FOREST_AREA_2020.map(d => [d.country, d]));` |
| `_COMM_MAP_CD` | `Object.fromEntries(COMMODITY_DEFORESTATION_RISK.map(d => [`${d.commodity}::${d.country}`, d]));` |
| `genCertData` | `()=>CERT_SCHEMES.map((s,i)=>({name:s,commodity:CERT_TYPES[s],coverage:rng(5,85,i*31),credibility:rng(40,98,i*37),cost:rng(2,25,i*41),deforestFree:rng(` |
| `genYearlyDeforest` | `comm=>{const base=rng(100,500,COMMODITIES.indexOf(comm)*31);return Array.from({length:8},(_,i)=>({year:2018+i,area:Math.max(20,base+rng(-80,80,comm.le` |
| `genCommodityRadar` | `()=>COMMODITIES.map((c,i)=>{const obj={commodity:c};RADAR_DIMS.forEach((d,di)=>{obj[d]=rng(15,95,i*31+di*13);});obj.color=COMM_COLORS[i];return obj;})` |
| `commDonut` | `useMemo(()=>COMMODITIES.map((c,i)=>({name:c,value:COMPANIES.filter(co=>co.commodities.includes(c)).length,color:COMM_COLORS[i]})),[]);` |
| `countryRiskTop` | `useMemo(()=>[...COUNTRY_DATA].sort((a,b)=>b.riskScore-a.riskScore).slice(0,15),[]);` |
| `toggleSort` | `col=>{if(sortCol===col)setSortDir(-sortDir);else{setSortCol(col);setSortDir(1);}};` |
| `lgDeadline` | `new Date('2025-12-30');` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERT_SCHEMES`, `COMMODITIES`, `COMM_COLORS`, `COMPANY_NAMES`, `COUNTRIES`, `RADAR_DIMS`, `STATUSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forest Loss Attributable to Commodity Production (2023) | — | Global Forest Watch 2024 | Annual tropical forest loss directly linked to commercial commodity agriculture and logging globally. |
| EUDR Affected Trade Value | — | European Commission Impact Assessment 2021 | Estimated value of EU commodity imports subject to EU Deforestation Regulation due diligence requirements. |
- **Trase trade flows, GFW deforestation alerts, CDP forest questionnaire, supplier disclosures** → Origin mapping, hazard overlay, DRS computation, EUDR readiness scoring → **Commodity risk heat maps, supplier-level flags, EUDR compliance dashboards**

## 5 · Intermediate Transformation Logic
**Methodology:** Deforestation Risk Score
**Headline formula:** `DRS = Σ (Commodityᵢ × SourceCountryRiskᵢ × SupplyChainOpacityᵢ)`
**Standards:** ['Trase Supply Chains 2024', 'Global Forest Watch']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).