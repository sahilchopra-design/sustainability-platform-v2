# Integrated Carbon Emissions
**Module ID:** `integrated-carbon-emissions` · **Route:** `/integrated-carbon-emissions` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Unified Scope 1/2/3 emissions dashboard aggregating across all portfolio companies. Multi-year trend, sector decomposition, intensity normalisation, and reduction target progress tracking.

> **Business value:** A consolidated emissions view across the portfolio is the foundation for all climate metrics reporting (WACI, ITR, GFANZ alignment). This module provides the single source of truth for financed emissions, enabling coherent target-setting and progress measurement.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AlertCard`, `Badge`, `BarChart`, `Btn`, `DQSBadge`, `FilterBar`, `KPICard`, `Panel`, `ScopeBar`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,seed)=>arr[Math.floor(sr(seed)*arr.length)];` |
| `range` | `(min,max,seed)=>+(min+sr(seed)*(max-min)).toFixed(2);` |
| `rangeInt` | `(min,max,seed)=>Math.floor(min+sr(seed)*(max-min+1));` |
| `fmt` | `(n)=>{if(n==null)return'--';if(Math.abs(n)>=1e9)return(n/1e9).toFixed(1)+'B';if(Math.abs(n)>=1e6)return(n/1e6).toFixed(1)+'M';if(Math.abs(n)>=1e3)retu` |
| `fmtPct` | `(n)=>n!=null?(n>=0?'+':'')+n.toFixed(1)+'%':'--';` |
| `fmtCO2` | `(n)=>{if(n==null)return'--';if(Math.abs(n)>=1e9)return(n/1e9).toFixed(2)+' GtCO2e';if(Math.abs(n)>=1e6)return(n/1e6).toFixed(2)+' MtCO2e';if(Math.abs(` |
| `weight` | `h.weightPct\|\|range(0.1,3.5,seed+3);` |
| `mktVal` | `h.marketValueMn\|\|range(10,1500,seed+4);` |
| `intensity` | `sec.carbonIntensity\|\|+(total/(Math.max(sec.revenueBn\|\|1,0.01)*1e6)*1e6).toFixed(1);` |
| `waci_contrib` | `+(weight/100*intensity).toFixed(2);` |
| `temp` | `sec.temperatureScore\|\|range(1.3,3.8,seed+5);` |
| `sbti` | `sec.sbtiStatus\|\|pick(['Committed','Target Set \u2014 1.5\u00B0C','Target Set \u2014 WB2C','None'],seed+6);` |
| `dqs` | `rangeInt(1,5,seed+7);` |
| `financedEm` | `Math.round(total*(weight/100));` |
| `carbonCostEU` | `+(financedEm*65.2/1000).toFixed(1);` |
| `greenRev` | `sec.greenRevenuePct\|\|range(0,60,seed+8);` |
| `yoyReduction` | `range(-15,8,seed+9);` |
| `totalS1` | `d.reduce((a,r)=>a+r.s1,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Emissions | — | Aggregation | Portfolio-wide attributed greenhouse gas emissions |
| WACI | — | PCAF | Weighted average carbon intensity |
| Reduction Progress | — | Year-over-year | Absolute and intensity reduction vs target trajectory |
- **Company-level GHG data** → PCAF attribution → **Portfolio emissions inventory**
- **Revenue/AUM data** → Intensity normalisation → **WACI and AUM-based metrics**
- **Baseline year emissions** → Target pathway comparison → **Reduction progress tracking**

## 5 · Intermediate Transformation Logic
**Methodology:** Integrated emissions aggregation
**Headline formula:** `Total = Σ(Scope1_i + Scope2_i + Cat15_i); Normalised = Total / PortfolioRevenue`
**Standards:** ['GHG Protocol', 'PCAF', 'TCFD Metrics']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).