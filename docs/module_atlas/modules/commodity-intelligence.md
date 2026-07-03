# Commodity Intelligence
**Module ID:** `commodity-intelligence` · **Route:** `/commodity-intelligence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Delivers commodity market intelligence with a climate transition risk overlay, mapping price sensitivity to carbon pricing scenarios, clean energy substitution timelines, and demand destruction risk for fossil and transitional materials. Supports buy-side and treasury teams in hedging climate-linked commodity exposures.

> **Business value:** Enables treasury and investment teams to understand which commodity positions face structural demand destruction under transition scenarios, size hedging requirements, and disclose transition risk in TCFD commodity sections.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_COMMODITIES`, `BALANCE_SHEETS`, `Badge`, `Btn`, `CARBON_VINTAGE_DATA`, `CATEGORY_STATISTICS`, `CAT_COLORS`, `CHOKEPOINTS`, `COMMODITY_ETFS`, `COMMODITY_UNIVERSE`, `CORRELATION_COMMODITIES`, `COUNTRY_EXPOSURE_MAP`, `CROSS_ASSET_HEAT`, `Card`, `GROUP_CORRELATIONS`, `KPI`, `LS_PORT`, `ML_PREDICTIONS`, `PRICE_HISTORY_DB`, `PRICE_TARGETS`, `REGULATORY_TIMELINE`, `SEASONAL_PATTERNS`, `SECTOR_COMMODITY_EXPOSURE`, `SECTOR_IMPACT_MATRIX`, `SUBSTITUTION_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `n=>n==null?'\u2014':`${n>0?'+':''}${Number(n).toFixed(1)}%`;` |
| `fmtPrice` | `n=>{if(n==null)return'\u2014';if(n>=1000000)return`$${(n/1000000).toFixed(1)}M`;if(n>=10000)return`$${(n/1000).toFixed(1)}K`;if(n>=1)return`$${Number(` |
| `ALL_COMMODITIES` | `Object.entries(COMMODITY_UNIVERSE).flatMap(([catKey,cat])=>cat.commodities.map(c=>({...c,catKey,catName:cat.name,catColor:cat.color,catIcon:cat.icon})` |
| `CATEGORY_STATISTICS` | `Object.entries(COMMODITY_UNIVERSE).map(([catKey,cat])=>{` |
| `avgYtd` | `comms.filter(c=>c.ytd_change!=null).reduce((s,c)=>s+c.ytd_change,0)/Math.max(1,comms.filter(c=>c.ytd_change!=null).length);` |
| `avgVol` | `comms.filter(c=>c.vol_30d).reduce((s,c)=>s+c.vol_30d,0)/Math.max(1,comms.filter(c=>c.vol_30d).length);` |
| `bestPerformer` | `[...comms].filter(c=>c.ytd_change!=null).sort((a,b)=>b.ytd_change-a.ytd_change)[0];` |
| `worstPerformer` | `[...comms].filter(c=>c.ytd_change!=null).sort((a,b)=>a.ytd_change-b.ytd_change)[0];` |
| `hist` | `genPriceHistory(comm.price,30,comm.vol_30d?(comm.vol_30d/100)*0.7:0.02,id);` |
| `url` | ``https://eodhd.com/api/eod/${ticker}?api_token=${apiKey}&fmt=json&order=d&limit=30`;` |
| `pts` | `[];let p=basePrice*(1+seed(id.length*17)*0.1-0.05);` |
| `xMean` | `xs.reduce((a,b)=>a+b,0)/n;` |
| `yMean` | `ys.reduce((a,b)=>a+b,0)/n;` |
| `slope` | `den!==0?num/den:0;` |
| `intercept` | `yMean-slope*xMean;` |
| `predicted` | `Math.round((slope*n+intercept)*100)/100;` |
| `confidence` | `Math.min(95,Math.max(20,Math.round(Math.abs(r2)*100)));` |
| `pctChange` | `history[0].price>0?Math.round((predicted-history[n-1].price)/history[n-1].price*10000)/100:0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_VINTAGE_DATA`, `CAT_COLORS`, `CHOKEPOINTS`, `COMMODITY_ETFS`, `CORRELATION_COMMODITIES`, `CROSS_ASSET_HEAT`, `GROUP_CORRELATIONS`, `PRICE_TARGETS`, `REGULATORY_TIMELINE`, `SEASONAL_PATTERNS`, `SUBSTITUTION_MAP`, `TRADE_FLOWS`, `TRANSITION_DEMAND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Oil Demand Destruction (NZ2050) | — | IEA NZ Roadmap | Reduction in oil demand under Net Zero 2050 relative to stated policies baseline |
| Carbon Price Elasticity (Oil) | — | IPCC AR6 WGIII | Change in oil demand per $1 increase in carbon price |
| Critical Mineral Demand Growth | — | IEA Critical Minerals 2024 | Cumulative demand increase for lithium, cobalt, and nickel driven by energy transition |
| Transition Risk Premium | — | BNEF / Bloomberg | Price discount applied to fossil commodities reflecting long-run transition demand destruction |
| Supply Concentration (HHI) | — | OECD | Herfindahl-Hirschman Index measuring market concentration for critical commodity supply |
- **IEA WEO demand tables** → Interpolate scenario trajectories, apply substitution rates → **Transition-adjusted demand curve per commodity**
- **BNEF price forecasts** → Compute spread vs current futures, derive transition premium → **Transition risk premium %**
- **NGFS carbon price paths** → Apply elasticity coefficients per commodity class → **Carbon price demand shock estimate**

## 5 · Intermediate Transformation Logic
**Methodology:** Transition-Adjusted Commodity Demand Model
**Headline formula:** `D_adj(t) = D_base(t) × (1 - SubstitutionRate(t)) × CarbonPriceElasticity`
**Standards:** ['IEA WEO 2024', 'BNEF Transition Scenarios', 'NGFS Phase 5']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).