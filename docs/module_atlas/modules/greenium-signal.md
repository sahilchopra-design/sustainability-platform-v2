# Greenium Signal
**Module ID:** `greenium-signal` · **Route:** `/greenium-signal` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Detects and quantifies the green bond premium (greenium) against conventional bond benchmarks using matched-pair analysis, cross-sectional regression, and interpolated yield curve methodologies. Provides real-time greenium signal tracking across currencies, sectors, and maturities to support green bond issuance timing and secondary market trading.

> **Business value:** Provides traders and portfolio managers with a real-time greenium signal to optimise green bond issuance timing, identify secondary market relative value opportunities, and demonstrate the ESG pricing premium achieved by labelled green bonds versus conventional peers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BACKTEST`, `Backtest`, `MAX_POSITION_PCT`, `MAX_SECTOR_CONC`, `MODEL_WEIGHTS`, `ModelDecomposition`, `RiskControls`, `SECTORS`, `STOP_LOSS_PCT`, `SignalDashboard`, `TABS`, `UNIVERSE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr, s) => arr[Math.floor(sr(s) * arr.length)];` |
| `SECTORS` | `["Clean Energy","EV / Mobility","Green Buildings","Water","Circular Economy","Biodiversity","Climate Tech","Agri-Tech"];` |
| `drift` | `(sr(seed + i) - 0.48) * 0.03;` |
| `ret1` | `prices[n-1] / prices[n-2]  - 1;` |
| `ret5` | `prices[n-1] / prices[n-6]  - 1;` |
| `ret20` | `prices[n-1] / prices[n-21] - 1;` |
| `rets20` | `Array.from({length:20},(_,i)=>prices[n-20+i]/prices[n-21+i]-1);` |
| `vol20` | `Math.sqrt(rets20.reduce((s,r)=>s+r*r,0)/20);` |
| `rsi` | `al===0 ? 100 : 100 - 100/(1+ag/al);` |
| `ma20` | `prices.slice(-20).reduce((s,v)=>s+v,0)/20;` |
| `ma50` | `prices.slice(-50).reduce((s,v)=>s+v,0)/50;` |
| `sharpe` | `feat.vol20 > 0 ? feat.ret20 / feat.vol20 : 0;` |
| `maRatio` | `feat.ma20 / feat.ma50;` |
| `composite` | `m1 + m2 + m3 + m4 + m5;` |
| `confidence` | `Math.min(1, Math.abs(composite) / 0.4);` |
| `prices` | `genPrices(90, i * 7, 50 + sr(i*11)*200);` |
| `volumes` | `Array.from({length:90},(_,j)=>Math.round(100000+sr((i*7+j)*3)*900000));` |
| `esg` | `Math.round(30 + sr(i*17)*65);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MODEL_WEIGHTS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EUR IG Corporate Greenium (bps) | — | Bloomberg / ECB (2024) | Green bonds in EUR investment-grade corporate universe trade on average 4â€“8 bps richer than matched conventi |
| Sovereign Greenium (bps) | — | ECB / DMO data | Government green bonds show smaller but persistent greenium vs conventional sovereign curves; German Bund twin |
| Greenium Volatility (σ, bps) | — | Bloomberg rolling 90-day | Rolling standard deviation of greenium signal; elevated volatility may signal new green bond supply disruption |
| Greenium by Maturity (bps per year duration) | — | Cross-sectional regression | Greenium tends to be larger at longer durations reflecting greater ESG investor demand for longer-dated green  |
- **Green bond universe (ICMA registry / Bloomberg)** → Identify matched conventional bonds by issuer, maturity, seniority → **Matched-pair greenium dataset**
- **Bond pricing data (Bloomberg BVAL / ICE)** → Compute ASW for green and conventional bonds, apply cubic spline interpolation → **Greenium in basis points by bond**
- **Market issuance calendar** → Flag new green bond supply events, correlate with greenium compression → **Greenium signal time series with supply events**

## 5 · Intermediate Transformation Logic
**Methodology:** Greenium via Asset Swap Spread
**Headline formula:** `Greenium = ASW_conventional_matched - ASW_green`
**Standards:** ['ICMA Greenium Working Group (2022)', 'Bloomberg BVAL Methodology', 'ECB Occasional Paper: Greenium (2022)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).