# ESG Factor Alpha
**Module ID:** `esg-factor-alpha` · **Route:** `/esg-factor-alpha` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies and decomposes alpha generation from ESG factor exposures in equity portfolios using systematic factor modelling. Integrates ESG scores as systematic factors alongside traditional risk factors (market, size, value, momentum) in a multi-factor return attribution framework. Supports quantitative ESG strategy development, factor tilting, and portfolio construction for ESG-integrated equity funds.

> **Business value:** Enables quantitative portfolio managers to build evidence-based ESG factor strategies, demonstrate that ESG integration generates statistically significant alpha in relevant market regimes, and satisfy client mandates requiring both ESG alignment and competitive risk-adjusted returns.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `BACKTEST`, `COMPANIES`, `FACTORS`, `KPI`, `PAGE_SIZE`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#0c4a6e';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(2):v:v;` |
| `BACKTEST` | `Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,esgAlpha:+((sr(i*7)-0.4)*3).toFixed(2),eAlpha:+((` |
| `FACTORS` | `[{factor:'ESG Quality',return3m:2.4,return12m:8.7,sharpe:1.2,ir:0.85},{factor:'E - Climate',return3m:1.8,return12m:6.2,sharpe:0.9,ir:0.65},{factor:'S ` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const avg=(k)=>+(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length).toFixed(2);return{avgAlpha:avg('totalAlpha'),avgSharpe:avg('sharpe')` |
| `sectorAlpha` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,alpha:0,n:0};m[c.sector].alpha+=c.totalAlpha;m[c.sector].n+` |
| `radarData` | `useMemo(()=>[{dim:'E Return',value:Math.abs(kpis.avgAlpha)*10+40},{dim:'S Return',value:Math.abs(kpis.avgSharpe)*20+30},{dim:'G Return',value:Math.abs` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FACTORS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Factor Loading (β_esg) | — | MSCI/Barra Factor Model | Portfolio sensitivity to the long-short ESG factor; positive β indicates ESG tilt contributing positively when |
| Annualised ESG Alpha (bps) | — | Factor Regression Output | Excess return attributable to ESG exposure after stripping traditional factor premia; statistically significan |
| ESG Factor Information Ratio | — | Quant Analytics | ESG factor return divided by tracking error of ESG factor portfolio; IR >0.3 indicates exploitable systematic  |
| ESG Factor Sharpe Ratio | — | Factor Performance | Risk-adjusted return of long-short ESG factor portfolio; benchmark against size, value, and momentum factor Sh |
- **ESG score feeds (MSCI, Sustainalytics, ISS)** → Construct sector-neutral cross-sectional Z-score within each GICS sub-industry → **Normalised ESG factor scores per security**
- **Equity return data (Bloomberg/Refinitiv)** → Align monthly excess returns with factor exposures; run rolling 36-month panel regression → **ESG factor loading (β), t-stat, and annualised alpha by period**
- **Barra/FactSet factor model risk data** → Strip traditional factor contributions (mkt, size, val, mom, quality) from gross alpha → **Pure ESG alpha after multi-factor adjustment**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Alpha Model
**Headline formula:** `r_i = α + β_mkt×MKT + β_esg×ESG + β_mom×MOM + β_val×VAL + ε_i`
**Standards:** ['Fama-French 5-Factor Model', 'MSCI ESG Momentum Factor', 'Barra Global Equity Model GEM4']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).