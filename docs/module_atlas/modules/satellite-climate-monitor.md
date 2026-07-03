# Satellite Climate Monitor
**Module ID:** `satellite-climate-monitor` · **Route:** `/satellite-climate-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Satellite-derived climate hazard monitoring providing near-real-time physical risk signals including fire, flood, drought, and sea-level anomaly indicators for portfolio assets.

> **Business value:** Provides near-real-time satellite-derived physical risk signals linked directly to portfolio asset locations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `ASSET_TYPES`, `Badge`, `COMMODITIES`, `COUNTRIES`, `Card`, `FOREST_ZONES`, `FilterBar`, `METHANE_FACILITIES`, `MONTHS`, `MiniBar`, `OWNERS`, `PORTFOLIO_COMPANIES`, `RISK_TIERS`, `SAT_TYPES`, `SECTORS_OG`, `SectionTitle`, `Stat`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `anomalies` | `tier==='Critical'?Math.floor(8+s2*12):tier==='High'?Math.floor(4+s2*6):` |
| `daysAgo` | `Math.floor(1+s3*14);` |
| `scanDate` | `new Date(2026,2,28-daysAgo);` |
| `baseEmission` | `50+sr(i*43)*200;` |
| `leakRate` | `parseFloat((0.5+s*80).toFixed(2));` |
| `hectaresLost` | `parseFloat((50+s*4950).toFixed(0));` |
| `reportedEmissions` | `parseFloat((100+s*900).toFixed(0));` |
| `satelliteEmissions` | `parseFloat((reportedEmissions*(0.85+s2*0.6)).toFixed(0));` |
| `discrepancy` | `parseFloat((((satelliteEmissions-reportedEmissions)/reportedEmissions)*100).toFixed(1));` |
| `totalAnomalies` | `ASSETS.reduce((s,a)=>s+a.anomalies,0);` |
| `avgDataQuality` | `parseFloat((ASSETS.reduce((s,a)=>s+a.dataQuality,0)/100).toFixed(0));` |
| `total` | `METHANE_FACILITIES.reduce((s,f)=>s+f.monthlyLeaks[mi].detected,0);` |
| `avgRate` | `parseFloat((METHANE_FACILITIES.reduce((s,f)=>s+f.monthlyLeaks[mi].rate,0)/40).toFixed(1));` |
| `totalPlumes` | `METHANE_FACILITIES.reduce((s,f)=>s+f.monthlyLeaks[mi].plumes,0);` |
| `avg` | `facs.length?parseFloat((facs.reduce((s,f)=>s+f.leakRate,0)/facs.length).toFixed(1)):0;` |
| `max` | `facs.length?parseFloat(Math.max(...facs.map(f=>f.leakRate)).toFixed(1)):0;` |
| `total` | `zones.reduce((s,z)=>s+z.hectaresLost,0);` |
| `avgSeverity` | `zones.length?parseFloat((zones.reduce((s,z)=>s+z.supplyChainRisk,0)/zones.length).toFixed(0)):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `COMMODITIES`, `COUNTRIES`, `MONTHS`, `OWNERS`, `RISK_TIERS`, `SAT_TYPES`, `SECTORS_OG`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Assets Monitored | — | Asset register | Portfolio assets with satellite hazard monitoring coverage as of latest mosaic date. |
| Active Alerts | — | Copernicus/FIRMS | Assets currently within a declared hazard anomaly zone above 2σ threshold. |
| Mosaic Refresh | — | ESA Sentinel-2 | Average time between satellite image acquisitions for monitored asset locations. |
- **Satellite image feeds, asset geocodes, historical baselines** → Raster processing, anomaly detection, perimeter intersection → **Asset-level hazard alerts, portfolio exposure maps, time-series charts**

## 5 · Intermediate Transformation Logic
**Methodology:** Hazard Anomaly Index
**Headline formula:** `(Current Reading – Baseline Mean) ÷ Baseline σ`
**Standards:** ['ESA Copernicus', 'NASA FIRMS', 'NOAA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).