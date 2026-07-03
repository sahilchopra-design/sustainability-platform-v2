# Live Carbon Price Monitor
**Module ID:** `live-carbon-price-monitor` · **Route:** `/live-carbon-price-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time monitoring of global carbon market prices across EU ETS (EUA), California Cap-and-Trade (CCA), RGGI, UK ETS, and voluntary carbon markets (CBL, Xpansiv). Aggregates exchange feeds, news sentiment, and regulatory event calendars to contextualise price movements. Provides historical price series, volatility analytics, and price forward curve visualisation for carbon risk management.

> **Business value:** Provides carbon risk managers, treasury teams, and sustainability officers with a real-time, multi-market carbon price intelligence hub to inform hedging decisions, internal carbon price calibration, and TCFD physical and transition risk scenario inputs.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CURRENCIES`, `MARKETS`, `MARKET_NAMES`, `PHASES`, `POLICY_EVENTS`, `REGIONS`, `REGION_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MARKETS` | `MARKET_NAMES.map((name, i) => {` |
| `basePrice` | `5 + sr(i * 7) * 130;` |
| `change24h` | `(sr(i * 13 + 2) - 0.5) * 6;` |
| `changeYTD` | `(sr(i * 11 + 3) - 0.4) * 40;` |
| `volume` | `Math.round(50000 + sr(i * 17 + 4) * 2000000);` |
| `openInterest` | `Math.round(volume * (1 + sr(i * 19 + 5)));` |
| `hasFloor` | `sr(i * 23 + 6) > 0.4;` |
| `hasCeiling` | `sr(i * 29 + 7) > 0.6;` |
| `label` | `timeframe === '1D' ? `${i}h` : timeframe === '1Y' ? `W${i+1}` : `D${i+1}`;` |
| `priceA` | `currencyMode === 'USD' ? a.price * a.usdRate : a.price;` |
| `priceB` | `currencyMode === 'USD' ? b.price * b.usdRate : b.price;` |
| `pnl` | `positionTonnes * (m.change24h \|\| 0);` |
| `avgPrice` | `MARKETS.reduce((s, m) => s + m.price, 0) / total;` |
| `totalVol` | `MARKETS.reduce((s, m) => s + m.volume, 0);` |
| `totalPnL` | `MARKETS.reduce((s, m) => s + positionTonnes * (m.price * shock / 100), 0);` |
| `avgPrice` | `markets.reduce((s,m)=>s+m.price,0)/markets.length;` |
| `totalVol` | `markets.reduce((s,m)=>s+m.volume,0);` |
| `avgPrice` | `markets.reduce((s,m)=>s+m.price,0)/markets.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CURRENCIES`, `MARKET_NAMES`, `PHASES`, `REGIONS`, `REGION_MAP`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EUA Spot Price (€/tCO2e) | — | ICE ECX real-time feed | Current EU ETS Phase 4 allowance spot price; key reference for European carbon cost modelling |
| EUA 30-day Volatility (%) | — | Computed from ICE daily settlement prices | Annualised price volatility; above 40% indicates elevated carbon market risk |
| CCA Spot Price (USD/tCO2e) | — | ICE / CME CCA futures settlement | California Carbon Allowance current price; benchmark for US West Coast carbon exposure |
| VCM Nature-Based Credit Price (USD/tCO2e) | — | CBL / Xpansiv market data | Indicative voluntary market price for REDD+ and afforestation credits |
- **ICE / CME exchange price feeds** → Ingest real-time and end-of-day settlement data; clean and normalise to USD/tCO2e → **Live price ticker and historical daily close series per market**
- **Regulatory event calendar** → Scrape EC, ARB, RGGI event schedules; tag auction dates, MRR deadlines, policy consultations → **Event overlay on price chart with annotation and impact flags**
- **News sentiment feed** → Parse carbon market news headlines; apply sentiment classifier; correlate to price moves → **Sentiment score time series and flagged high-impact news events**

## 5 · Intermediate Transformation Logic
**Methodology:** Carbon Price Volatility
**Headline formula:** `σ_c = √(252) × σ(ln(Pₜ/Pₜ₋₁))`
**Standards:** ['EU ETS Directive 2003/87/EC as amended', 'ICAP Emissions Trading Worldwide Status Report 2024', 'Refinitiv Carbon Research â€” EUA Price Drivers', 'OPIS Carbon Markets Daily']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).