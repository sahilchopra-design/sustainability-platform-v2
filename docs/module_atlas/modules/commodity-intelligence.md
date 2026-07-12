# Commodity Intelligence
**Module ID:** `commodity-intelligence` · **Route:** `/commodity-intelligence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Delivers commodity market intelligence with a climate transition risk overlay, mapping price sensitivity to carbon pricing scenarios, clean energy substitution timelines, and demand destruction risk for fossil and transitional materials. Supports buy-side and treasury teams in hedging climate-linked commodity exposures.

> **Business value:** Enables treasury and investment teams to understand which commodity positions face structural demand destruction under transition scenarios, size hedging requirements, and disclose transition risk in TCFD commodity sections.

**How an analyst works this module:**
- Choose commodity and transition scenario from the selector panel
- Demand Trajectory tab plots base vs transition-adjusted demand curves to 2050
- Substitution Analysis tab shows technology-by-technology displacement timelines
- Carbon Price Sensitivity tab shows demand and price response to carbon pricing paths
- Transition Risk Dashboard aggregates commodity-level risk into a portfolio heatmap

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_COMMODITIES`, `BALANCE_SHEETS`, `Badge`, `Btn`, `CARBON_VINTAGE_DATA`, `CATEGORY_STATISTICS`, `CAT_COLORS`, `CHOKEPOINTS`, `COMMODITY_ETFS`, `COMMODITY_UNIVERSE`, `CORRELATION_COMMODITIES`, `COUNTRY_EXPOSURE_MAP`, `CROSS_ASSET_HEAT`, `Card`, `GROUP_CORRELATIONS`, `KPI`, `LS_PORT`, `ML_PREDICTIONS`, `PRICE_HISTORY_DB`, `PRICE_TARGETS`, `REGULATORY_TIMELINE`, `SEASONAL_PATTERNS`, `SECTOR_COMMODITY_EXPOSURE`, `SECTOR_IMPACT_MATRIX`, `SUBSTITUTION_MAP`, `Section`, `SortTH`, `TOTAL_COMM_COUNT`, `TRADE_FLOWS`, `TRANSITION_DEMAND`, `Tabs`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CARBON_VINTAGE_DATA` | 8 | `year`, `EUA`, `CCA`, `VCU`, `UKA`, `CEA` |
| `TRANSITION_DEMAND` | 13 | `mineral`, `current_kt`, `iea_2030_kt`, `iea_2040_kt`, `iea_2050_kt`, `growth`, `cagr_pct`, `driver` |
| `GROUP_CORRELATIONS` | 13 | `group1`, `group2`, `correlation`, `note` |
| `SEASONAL_PATTERNS` | 11 | `commodity`, `q1`, `q2`, `q3`, `q4`, `best_month`, `worst_month` |
| `CHOKEPOINTS` | 9 | `name`, `location`, `commodities`, `daily_volume`, `share_global_oil`, `risk`, `disruption_impact`, `alternative`, `countries_affected` |
| `COMMODITY_ETFS` | 17 | `commodity`, `etf`, `name`, `aum_bn`, `expense`, `tracking` |
| `CROSS_ASSET_HEAT` | 9 | `asset`, `WTI`, `GOLD`, `COPPER`, `WHEAT`, `EUA`, `LITHIUM` |
| `PRICE_TARGETS` | 25 | `id`, `current`, `low`, `median`, `high`, `consensus`, `analysts`, `timeframe` |
| `TRADE_FLOWS` | 21 | `commodity`, `exporter`, `importer`, `volume_mt`, `value_bn`, `route`, `transit_days` |
| `REGULATORY_TIMELINE` | 13 | `date`, `event`, `commodities`, `impact` |
| `SUBSTITUTION_MAP` | 13 | `original`, `substitute`, `readiness`, `impact`, `driver` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `n=>n==null?'\u2014':`${n>0?'+':''}${Number(n).toFixed(1)}%`;` |
| `fmtPrice` | `n=>{if(n==null)return'\u2014';if(n>=1000000)return`$${(n/1000000).toFixed(1)}M`;if(n>=10000)return`$${(n/1000).toFixed(1)}K`;if(n>=1)return`$${Number(n).toFixed(2)}`;return`$${Number(n).toFixed(4)}`};` |
| `ALL_COMMODITIES` | `Object.entries(COMMODITY_UNIVERSE).flatMap(([catKey,cat])=>cat.commodities.map(c=>({...c,catKey,catName:cat.name,catColor:cat.color,catIcon:cat.icon})));` |
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
| `bestPerf` | `useMemo(()=>[...allComms].filter(c=>c.ytd_change!=null).sort((a,b)=>b.ytd_change-a.ytd_change)[0],[allComms]);` |
| `worstPerf` | `useMemo(()=>[...allComms].filter(c=>c.ytd_change!=null).sort((a,b)=>a.ytd_change-b.ytd_change)[0],[allComms]);` |
| `companyLinkage` | `useMemo(()=>{ return portfolio.slice(0,20).map((c,i)=>{ const exp=SECTOR_COMMODITY_EXPOSURE[c.sector]\|\|{primary:[],secondary:[],carbon:[],tertiary:[]};` |
| `rows` | `allComms.map(c=>`${c.id},"${c.name}",${c.catName},${c.price},${c.unit},${c.ytd_change\|\|''},${c.supply_risk\|\|''},${c.eudr_regulated?'Yes':'No'},${c.vol_30d\|\|''},${c.supply_mt\|\|''},${c.demand_mt\|\|''},${c.balance_mt\|\|''}`);` |
| `blob` | `new Blob([hdr+'\n'+rows.join('\n')],{type:'text/csv'});` |
| `total` | `exp.primary.length+exp.secondary.length+exp.carbon.length+(exp.tertiary\|\|[]).length;` |
| `newP` | `c.price*(1+priceSlider/100);` |
| `threshold` | `c.price*(1+(seed(i*71)*0.2-0.1));` |
| `vol30` | `c.vol_30d\|\|Math.round(5+seed(i*73)*35);` |
| `riskReturn` | `Math.round(-20+seed(i*79)*50);` |
| `betaOil` | `Math.round((seed(i*83)*1.6-0.3)*100)/100;` |
| `trends` | `['\u2191 Uptrend','\u2193 Downtrend','\u2194 Range-bound','\u2197 Recovering'];` |
| `upside` | `Math.round((t.median-t.current)/t.current*100);` |
| `grade` | `c.riskScore>=80?'F':c.riskScore>=65?'D':c.riskScore>=50?'C':c.riskScore>=35?'B':c.riskScore>=20?'B+':'A';` |
| `idxComms` | `idx.comms.map(id=>allComms.find(c=>c.id===id)).filter(Boolean);` |

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

Base demand follows IEA World Energy Outlook trajectories per scenario. Substitution rate captures technology displacement (e.g., EV uptake reducing oil demand). Carbon price elasticity is sector-calibrated: oil −0.05 to −0.15/$/tCO₂ per IPCC AR6 WGIII. Transition risk premium = spread between current forward price and scenario-consistent fundamental value.

**Standards:** ['IEA WEO 2024', 'BNEF Transition Scenarios', 'NGFS Phase 5']
**Reference documents:** IEA World Energy Outlook 2024; BNEF New Energy Outlook 2024; IPCC AR6 WGIII Chapter 6 â€” Energy Systems; NGFS Climate Scenarios for Central Banks and Supervisors Phase 5

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is a **commodity price/analytics terminal** over a curated `COMMODITY_UNIVERSE` (price, YTD,
30-day vol, supply risk, EUDR flag, supply/demand balance per commodity). It runs a **genuine ordinary-least-
squares linear regression** to forecast price and compute an R²-based confidence — real statistics — but on a
*synthetic* 30-day price history generated by the platform PRNG (unless a live EODHD API key is supplied).

### 7.1 What the module computes

Category statistics and best/worst movers:
```js
avgYtd = Σ ytd_change / count(non-null) ;  avgVol = Σ vol_30d / count
bestPerformer  = max by ytd_change ;  worstPerformer = min
```
Synthetic price history and OLS forecast:
```js
hist = genPriceHistory(comm.price, 30, comm.vol_30d?(comm.vol_30d/100)·0.7:0.02, id)  // seeded walk
slope = num/den (den≠0 else 0) ;  intercept = yMean − slope·xMean
predicted  = round((slope·n + intercept)·100)/100                 // next-step forecast
r2         = ssTot>0 ? round((1 − ssRes/ssTot)·1000)/1000 : 0     // goodness-of-fit
confidence = min(95, max(20, round(|r2|·100)))
pctChange  = round((predicted − history[n−1].price)/history[n−1].price·10000)/100
```
Company linkage maps portfolio holdings to commodity exposure via `SECTOR_COMMODITY_EXPOSURE`. A commodity
risk grade: `riskScore ≥80 F, ≥65 D, ≥50 C, ≥35 B, ≥20 B+, else A`.

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `COMMODITY_UNIVERSE` (price, ytd, vol_30d, supply_risk, eudr, supply/demand_mt) | dataset | curated demo universe |
| Price history | `genPriceHistory(...)` seeded walk | synthetic unless EODHD key set |
| Live price feed | `eodhd.com/api/eod/{ticker}` | real API (optional, key-gated) |
| OLS slope/intercept/r² | computed | **real statistics** on the series |
| Confidence | `clamp(20,95, |r²|·100)` | heuristic mapping of r² to % |
| Risk grade thresholds | 80/65/50/35/20 | heuristic banding |
| `betaOil`, `riskReturn`, `threshold` | `seed()` seeded | synthetic demo value |

### 7.3 Calculation walkthrough

`ALL_COMMODITIES` flattens the universe → `CATEGORY_STATISTICS` computes per-category avgYtd/avgVol and
best/worst → selecting a commodity generates a 30-day history (seeded random walk scaled by 70% of its vol)
→ OLS fits price on time index → `predicted`, `r2`, `confidence`, `pctChange` reported → portfolio tab links
holdings to commodity exposure and applies a `priceSlider` shock → CSV export. If an EODHD API key is present,
the history is replaced by the last 30 real EOD closes.

### 7.4 Worked example

Suppose the seeded 30-day history has an OLS fit `slope = 0.8`, `intercept = 74`, `n = 30`, last price 96,
and `ssRes/ssTot = 0.19`:
```
predicted  = round((0.8·30 + 74)·100)/100 = round(98.0) = 98.00
r2         = round((1 − 0.19)·1000)/1000 = 0.810
confidence = min(95, max(20, round(0.810·100))) = 81
pctChange  = round((98.00 − 96)/96·10000)/100 = +2.08%
```
An r² of 0.81 → 81% confidence, and a +2.08% forecast to the next step. Because the input series is a seeded
random walk, the fit reflects the seed, not a real market trend — unless the EODHD feed is active.

### 7.5 Data provenance & limitations

- The **regression and R² are real**; the **price history feeding them is synthetic** (`genPriceHistory`
  seeded walk) unless a live EODHD API key is configured. The commodity universe (prices, vols, balances) is
  curated demo data.
- Linear OLS on 30 points extrapolated one step is a weak forecaster; "confidence = |r²|·100" is a heuristic,
  not a statistical prediction interval.
- `betaOil`, `riskReturn` and alert thresholds are `seed()`-generated overlays.

**Framework alignment:** ordinary least squares (standard trend estimation) · EODHD end-of-day price API
(real optional feed) · EUDR regulated-commodity flag (EU 2023/1115) · Bloomberg/CME-style commodity terminal
conventions for YTD/vol/supply-balance display.

## 8 · Model Specification

**Status: specification — not yet implemented in code** (regression is real; the *price series and forecast
model* need production data and method).

**8.1 Purpose & scope.** Provide defensible short-horizon commodity price/vol analytics and a risk-graded
watchlist for portfolio commodity exposure, driven by real market data.

**8.2 Conceptual approach.** Replace the seeded random walk with a live EOD/tick feed and upgrade the OLS
trend to an **ARIMA/EWMA forecast with a proper prediction interval**, and derive vol from realised returns —
standard commodity-desk analytics (RiskMetrics EWMA, Bloomberg realised vol).

**8.3 Mathematical specification.**
```
Returns r_t = ln(P_t/P_{t−1});  σ_realised = √(252 · EWMA(r_t², λ))     (λ≈0.94)
Forecast: P_{t+1} = ARIMA(p,d,q) or drift+EWMA;  PI_95 = P̂ ± 1.96·σ_h·√h
Confidence = f(PI width / price)     (narrower → higher)
RiskScore = w1·z(σ) + w2·z(SupplyDeficit) + w3·EUDR_flag + w4·GeopoliticalConc
```

| Parameter | Source |
|---|---|
| Price series | EODHD / Bloomberg / CME live |
| EWMA λ | RiskMetrics 0.94 daily |
| Supply/demand balance | IEA / USDA / WBMS |
| Geopolitical concentration | production HHI × GPR index |

**8.4 Data requirements.** Real EOD price series per ticker; supply/demand balances; production concentration.
Free: EODHD (key), USDA; vendor: Bloomberg, WBMS.

**8.5 Validation & benchmarking.** Backtest forecast MAPE vs naive random walk; PI coverage check; realised
vol vs Bloomberg; risk-grade stability.

**8.6 Limitations & model risk.** Short windows unstable; commodity price jumps break linear/ARIMA; supply
data lags. Fallback: EWMA drift forecast with wide PI when series is short.

## 9 · Future Evolution

### 9.1 Evolution A — Real price history by default, honest prediction intervals (analytics ladder: rung 1 → 4)

**What.** This terminal has a rare property in the slice: its OLS regression and R²
are *real statistics* — but they run on a seeded random walk (`genPriceHistory`)
unless an optional EODHD API key is configured, and §7.5 notes the one-step linear
extrapolation with `confidence = |r²|·100` is "a heuristic, not a statistical
prediction interval". Evolution A inverts the default: ingested real price series
always, synthetic never, and a forecaster whose uncertainty is statistically meant.

**How.** (1) Data: route energy commodities through the already-integrated EIA series
(wave 1) and the rest through a scheduled EODHD/stooq EOD ingest into a
`commodity_price_history` table — page reads the DB, so no per-user API key is needed
and the seeded-walk path is deleted. (2) Forecasting: replace one-step OLS with
statsmodels ARIMA/ETS on ≥250-day windows, emitting genuine 80/95% prediction
intervals in place of the clamped pseudo-confidence; backtest with rolling-origin
evaluation and publish MAPE per commodity — the rung-4 discipline of the roadmap
(never black-box, model cards per Atlas §8). (3) The seeded overlays §7.5 flags
(`betaOil`, `riskReturn`, alert thresholds) either compute from the real series
(rolling beta vs Brent) or disappear. (4) `COMMODITY_UNIVERSE` YTD/vol fields derive
from the ingested history instead of curated constants.

**Prerequisites (hard).** Price ingest job with a refresh owner; PRNG purge of
`genPriceHistory` and the seeded overlays (guardrail conventions). **Acceptance:**
with the network off, the page shows honest empty states, never a synthetic walk;
backtested interval coverage ≈ nominal (95% PI covers ~95% of held-out closes);
rolling oil beta recomputes when new closes arrive.

### 9.2 Evolution B — Position-aware market brief copilot (LLM tier 1 → 2)

**What.** A copilot for the treasury/buy-side users the overview names: "brief me on
my commodity book" reads the portfolio-linkage tab (holdings mapped via
`SECTOR_COMMODITY_EXPOSURE`), the category movers, and the forecast panel, and writes
a morning-note-style summary — best/worst performers with their actual YTD figures,
forecast direction with the *interval*, EUDR-flagged commodities in the book — every
number from page state, every forecast caveated with its backtested error.

**How.** Tier 1 against page state plus this Atlas record (§5's demand-model
framing, §7.2's provenance table so the copilot knows curated universe fields from
computed ones). Tier 2 adds tool calls once Evolution A's ingest/forecast lands as
backend endpoints: "re-run the copper forecast excluding the squeeze week" or "shock
my book at −15% oil" become parameterized calls to the forecast and price-slider
operations rather than in-context arithmetic. The fabrication validator is essential:
price forecasts are the canonical hallucination surface.

**Prerequisites (hard).** Evolution A's real data — a market brief over synthetic
walks would be professionally embarrassing at best; forecast endpoints for tier 2.
**Acceptance:** every price, YTD and forecast figure in a brief matches page state or
a tool response; the copilot always quotes the prediction interval, never the point
alone; it refuses intraday questions (the data is EOD).