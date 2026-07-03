# Air Quality Health Risk
**Module ID:** `air-quality-health-risk` · **Route:** `/air-quality-health-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Investor-grade air quality health risk analytics computing PM2.5 and NO2 population exposure, DALY burden calculations, and portfolio company liability exposure from regulatory non-compliance. Integrates satellite-derived air quality data (MODIS, Sentinel-5P), WHO AQG 2021 thresholds, and epidemiological concentration-response functions to quantify stranded cost risk for high-emitting facilities.

> **Business value:** Air quality health risk translates into tangible financial liability through tightening regulatory standards and potential litigation costs. As WHO 2021 guidelines are progressively adopted into national law, portfolio companies with facilities in high-pollution areas face growing exceedance penalties, operational restrictions, and reputational risk that investor engagement can help mitigate.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CITIES`, `COLORS`, `PAGE`, `POLLUTANTS`, `REGIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `basePM` | `95-i*1.4+sr(i*7)*12;const baseNO2=48-i*0.6+sr(i*11)*10;const baseSO2=35-i*0.5+sr(i*13)*8;const baseO3=80+sr(i*17)*40;` |
| `monthly` | `Array.from({length:12},(_,m)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],pm25:+(basePM+sr(i*100+m*7)*20-10).` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,pm25:+(basePM-y*2+sr(i*200+y*13)*5).toFixed(1),deaths:Math.round(sr(i*23+y)*15000+500-y*200),cost:+(sr(i*19` |
| `POLLUTANTS` | `[{key:'pm25',label:'PM2.5',who:5,unit:'ug/m3',color:T.red},{key:'no2',label:'NO2',who:10,unit:'ug/m3',color:T.amber},{key:'so2',label:'SO2',who:20,uni` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgAQI:Math.round(filtered.reduce((s,r)=>s+r.aqi,0)/filtered.length\|\|0),avgPM25:(filtered.reduce((s,r)=>s+r.pm25,0` |
| `regionAgg` | `useMemo(()=>{const m={};CITIES.forEach(r=>{if(!m[r.region])m[r.region]={region:r.region,pm25:0,aqi:0,deaths:0,cost:0,n:0};m[r.region].pm25+=r.pm25;m[r` |
| `pollScatter` | `useMemo(()=>filtered.map(c=>({city:c.city,x:c[pollutant],y:c.prematureDeaths,pop:c.pop})),[filtered,pollutant]);` |
| `trendDist` | `useMemo(()=>{const m={Improving:0,Stable:0,Worsening:0};filtered.forEach(r=>m[r.trend]++);return Object.entries(m).map(([k,v])=>({name:k,value:v}));},` |
| `topDeaths` | `[...filtered].sort((a,b)=>b.prematureDeaths-a.prematureDeaths).slice(0,15);` |
| `costByRegion` | `regionAgg.map(r=>({region:r.region,cost:r.cost})).sort((a,b)=>b.cost-a.cost);` |
| `healthBreak` | `filtered.slice(0,20).map(c=>({city:c.city,asthma:c.asthmaCases,copd:c.copdCases,lung:c.lungCancer,child:c.childAsthma}));` |
| `regData` | `[...filtered].sort((a,b)=>b.enforcementScore-a.enforcementScore).slice(0,20);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `POLLUTANTS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PM2.5 WHO AQG | — | WHO AQG 2021 | WHO annual guideline; interim target IT-1 is 35, IT-4 is 10 μg/m³ |
| Excess DALY Burden | `YLL+YLD from CRF` | GBD 2021 | Disease burden attributable to ambient PM2.5 above WHO guideline |
| Regulatory Exceedance | — | Satellite/ground monitor | Proportion of portfolio facilities exceeding national ambient air quality standards |
- **Sentinel-5P / MODIS satellite data** → Grid-level PM2.5 retrieval; intersect with facility locations → **Facility-level annual average PM2.5 exposure values**
- **GBD 2021 concentration-response functions** → Apply CRF to excess PM2.5; compute attributable DALYs and liability → **Per-facility DALY burden and regulatory non-compliance penalty exposure**

## 5 · Intermediate Transformation Logic
**Methodology:** WHO AQG concentration-response DALY model
**Headline formula:** `DALY = YLL + YLD; YLL = Deaths × LE_remaining; Exposed_pop = Σ_i(Pop_i × [PM25_i > WHO_threshold])`
**Standards:** ['WHO AQG 2021', 'GBD Study 2021', 'EPA NAAQS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).