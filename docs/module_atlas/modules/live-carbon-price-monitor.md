# Live Carbon Price Monitor
**Module ID:** `live-carbon-price-monitor` · **Route:** `/live-carbon-price-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time monitoring of global carbon market prices across EU ETS (EUA), California Cap-and-Trade (CCA), RGGI, UK ETS, and voluntary carbon markets (CBL, Xpansiv). Aggregates exchange feeds, news sentiment, and regulatory event calendars to contextualise price movements. Provides historical price series, volatility analytics, and price forward curve visualisation for carbon risk management.

> **Business value:** Provides carbon risk managers, treasury teams, and sustainability officers with a real-time, multi-market carbon price intelligence hub to inform hedging decisions, internal carbon price calibration, and TCFD physical and transition risk scenario inputs.

**How an analyst works this module:**
- Select compliance markets and voluntary registries to display on the multi-market price dashboard
- Review real-time price ticker, 24-hour change, and intraday price chart for each selected market
- Analyse 30-day and 90-day price volatility trends and correlation heatmap across markets
- Cross-reference price movements with the regulatory event calendar (auctions, MRR deadlines, policy decisions)
- Export historical price series and forward curve data for use in carbon cost model and TCFD scenario analysis

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
| `portfolioPnL` | `useMemo(() => { return MARKETS.map(m => { const pnl = positionTonnes * (m.change24h \|\| 0);` |
| `budgetAdequacy` | `useMemo(() => { return MARKETS.map(m => ({ name: m.name.length > 18 ? m.name.slice(0, 18) + '…' : m.name, price: m.price, ndcRequired: m.ndcPrice, adequacy: parseFloat((m.price / m.ndcPrice * 100).toFixed(1)), }));` |
| `avgPrice` | `MARKETS.reduce((s, m) => s + m.price, 0) / total;` |
| `totalVol` | `MARKETS.reduce((s, m) => s + m.volume, 0);` |
| `totalPnL` | `MARKETS.reduce((s, m) => s + positionTonnes * (m.price * shock / 100), 0);` |

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

Annualised price volatility is computed from daily log returns over a rolling 30-day window, scaled by √252 trading days. Forward curve estimation uses interpolation across exchange-traded futures contracts. Price correlation between compliance markets and voluntary credits is tracked using rolling 90-day Pearson correlation.

**Standards:** ['EU ETS Directive 2003/87/EC as amended', 'ICAP Emissions Trading Worldwide Status Report 2024', 'Refinitiv Carbon Research â€” EUA Price Drivers', 'OPIS Carbon Markets Daily']
**Reference documents:** ICAP Emissions Trading Worldwide Status Report 2024; European Commission EU ETS Directive 2003/87/EC consolidated 2023; World Bank State and Trends of Carbon Pricing Report 2023; OPIS Carbon Markets Methodology Note 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states annualised volatility
> `σ_c = √252 × σ(ln(Pₜ/Pₜ₋₁))` computed from "ICE ECX real-time feed" daily settlements, plus a
> rolling 90-day Pearson correlation between compliance and voluntary markets. **Neither calculation
> exists in the code.** There is no log-return computation, no standard-deviation function, no
> annualisation factor, and no correlation matrix anywhere in the file. Prices, volumes, and forward
> curves are entirely `sr()`-seeded synthetic series, not an ICE/CME feed. Sections below document
> the code as it actually behaves.

### 7.1 What the module computes

40 named ETS/carbon-tax jurisdictions (`MARKET_NAMES`) — EU ETS (4 sub-markets), UK ETS, California
CCA, RGGI, 3 more North American programmes, New Zealand, Australia, Korea, 3 Japan programmes,
8 China ETS sectoral pilots, Singapore, Switzerland, CORSIA, Mexico, Brazil, 2 India schemes, Israel,
Kazakhstan, 3 Latin American carbon taxes, Thailand, Vietnam, Taiwan — each with a full synthetic
market-data record generated once at module load:

```js
basePrice   = 5 + sr(i*7)*130            // $5-135
change24h   = (sr(i*13+2) - 0.5) * 6      // ±3%
changeYTD   = (sr(i*11+3) - 0.4) * 40     // -16% to +24%
volume      = round(50000 + sr(i*17+4)*2000000)
openInterest= round(volume * (1 + sr(i*19+5)))
capTrajectory = -2 - sr(i*31+8)*6         // -2% to -8% p.a.
ndcPrice    = 20 + sr(i*53+13)*180        // synthetic "required" carbon price for NDC alignment
usdRate     = 0.5 + sr(i*59+14)*3
```

### 7.2 Parameterisation

| Field | Provenance |
|---|---|
| Market names, regions, currencies, policy phases, regulator names | **Real** — 40 correctly-named jurisdictions, correct regulator acronyms (ECHA/DESNZ-adjacent EU bodies are actually simplified to "ECHA" for all 4 EU ETS sub-markets — a minor inaccuracy since ECHA is the EU chemicals agency, not the ETS regulator; the real EU ETS authority is DG CLIMA/national competent authorities), correct currency codes |
| Price, change%, volume, open interest, cap trajectory, NDC price, FX rate | Synthetic demo values, `sr()`-seeded per market index |
| `hasFloor`/`hasCeiling` | `sr(i×23+6)>0.4` / `sr(i×29+7)>0.6` — arbitrary probability thresholds, not researched per-market floor/ceiling policy |
| `linkage` status | `sr(i×37+9)` tri-band → Linked/Considering/Standalone — not sourced to actual linking agreements (e.g. real EU-Switzerland linkage, real California-Quebec linkage are not specifically hard-coded; they are as likely to be randomly assigned "Standalone" as any other market) |
| `POLICY_EVENTS` (30 events) | Fully synthetic: random market, random event type from a 9-item list, random 2025 date, random ±10% impact, random status |
| NDC "required" price | Synthetic demo value; a real NDC-price-adequacy metric would need a modelled carbon price consistent with each country's NDC abatement pathway (e.g. from IEA/NGFS), not a random draw |

### 7.3 Calculation walkthrough

- **Price history / forward curve**: for the selected market, `priceHistory` regenerates a fresh
  series on every timeframe change using `sr(selectedMarket×100+i)` — i.e. switching timeframes
  produces a **different** synthetic price path each time (not a consistent underlying series
  resampled at different granularities), which is a notable internal-consistency gap for a "price
  history" feature.
- **Forward curve**: `forward = base × (1 + (i+1)×0.04 + sr(...)×0.03)` — a deterministic +4%/year
  contango slope plus small noise, for 7 years (2025–2031); `implied` uses a slightly gentler 3.5%/yr
  slope. Neither is derived from an actual futures curve or cost-of-carry model.
- **Arbitrage Calculator**: `spread = priceA − priceB`, `basis = spread/priceA×100` between any two
  selected markets — correct arithmetic, but operating on synthetic prices, so the "arbitrage
  opportunity" it surfaces is not real.
- **Portfolio P&L**: `pnl = positionTonnes × change24h` (i.e. treats the % change value as a
  per-tonne $ move directly, since `change24h` is a percentage-point number, not a fraction — the
  code effectively assumes `1% change = $1/tonne P&L`, which is dimensionally inconsistent unless
  `change24h` is reinterpreted as an absolute price move rather than a percentage).
- **Sensitivity scenarios (Tab 6)**: `totalPnL = Σ_markets positionTonnes × (price × shock/100)` for
  shock ∈ {−20,−10,0,+10,+20}% — a straightforward linear price-shock P&L, correctly implemented
  arithmetic given the (synthetic) price inputs.

### 7.4 Worked example

EU ETS (Power) is `i=0`: `basePrice = 5 + sr(0)×130`. `sr(0) = frac(sin(1)×10000) = frac(8414.7) =
0.7095` → `basePrice ≈ 5 + 0.7095×130 = 97.2`. `change24h = (sr(0×13+2)-0.5)×6 = (sr(2)-0.5)×6`;
`sr(2) = frac(sin(3)×10000) = frac(1411.2) = 0.2200` → `change24h ≈ (0.22-0.5)×6 = -1.68%`. At a
10,000-tonne position, `pnl = 10000 × (-1.68) = -16,800` "units" (per the code's direct
percentage-as-dollar treatment) — displayed as the Portfolio P&L tab's per-market figure.

### 7.5 Companion analytics

- **Regional Analysis tab** — groups the 40 markets by 6 regions (EU, Americas, Asia, Pacific,
  Africa, Global) and computes simple means (`avgPrice`, `avgChangeYTD`) and sums (`totalVolume`) —
  correct aggregation arithmetic over synthetic inputs.
- **Budget Adequacy** — `adequacy = price / ndcPrice × 100`, both synthetic, plotted against a 100%
  "NDC aligned" reference line.
- **Full Market Export Table (Tab 6)** — regenerates a second, independent 7-year forward projection
  per market (same formula as §7.3 but recomputed inline) for the top-10-by-price markets — a second
  live `sr()` call with the same seed pattern, so numerically identical to the Forward Curves tab's
  output for the same market/year, but computed via a separate code path.

### 7.6 Data provenance & limitations

- **Every price, volume, and volatility-adjacent figure in this module is synthetic**, generated by
  `sr(seed) = frac(sin(seed+1)×10⁴)`. Despite the module's name and the guide's description of an
  "ICE ECX real-time feed" / "OPIS Carbon Markets Daily" integration, there is no live market-data
  ingestion anywhere in the code.
- No volatility, correlation, or risk-adjusted metric is computed at all — the guide's entire
  "Carbon Price Volatility" methodology section describes a feature that does not exist.
- The Portfolio P&L formula treats a percentage-point value as a per-unit dollar amount without a
  clarifying unit label, which would mislead a real trading desk if taken at face value.
- Regulator-name assignment ("ECHA" for all 4 EU ETS sub-markets) is imprecise; the real EU ETS is
  administered by the European Commission (DG CLIMA) with national competent authorities executing
  compliance, not the European Chemicals Agency.

**Framework alignment:** EU ETS Directive 2003/87/EC, ICAP Emissions Trading Worldwide, and World
Bank State and Trends of Carbon Pricing are referenced in the guide as real, authoritative sources
for global carbon-market structure — the module's market/region/currency/phase taxonomy is a
reasonable static rendering of that real-world structure, but none of the guide's quantitative
methodology (volatility, correlation, live feeds) is implemented; this module functions as an
**illustrative carbon-market dashboard shell**, not a live pricing or risk-analytics tool.

## 9 · Future Evolution

### 9.1 Evolution A — Actual price feeds for the flagship markets, honest static for the rest (analytics ladder: rung 1 → 2)

**What.** The module's name promises what §7 shows it lacks: prices, volumes, forward curves and all 30 policy events are `sr()`-seeded; the guide's volatility formula (`√252 × σ(ln returns)`) and 90-day correlation matrix are never computed; the price history *regenerates differently on every timeframe switch* (§7.3 — the same market shows inconsistent paths); floor/ceiling and linkage statuses are probability draws rather than researched facts (real EU–Switzerland and California–Québec linkages may randomly render "Standalone"); and the "ECHA" regulator label for EU ETS is factually wrong (§7.2). Evolution A: (1) wire genuinely obtainable price series — the platform already ingests EU ETS prices for other modules (live-carbon-price feeds are referenced by internal-carbon-price and india-ccts), ICAP publishes allowance prices for most systems, and World Bank Carbon Pricing Dashboard covers taxes — into a `carbon_prices` table with vintage; (2) compute the §5 volatility and correlation for markets with real daily series; (3) convert the per-market policy facts (floors, ceilings, linkages, regulators) into researched, cited constants — this is curation, not code; (4) honest coverage tiers: markets without daily feeds show latest-known price + date, never a synthetic ticker.

**How.** (1) One ingester over ICAP/World-Bank data serving the whole carbon module family. (2) Volatility/correlation server-side (`GET /carbon-prices/analytics`) so downstream modules (hedging, ICP calibration) share it. (3) The synthetic `ndcPrice` replaced by cited NDC-consistent price estimates (NGFS/IEA) or dropped. (4) Policy-event calendar re-based on real auction calendars (EEX publishes EU ETS auctions).

**Prerequisites.** The `sr()` market generation deleted; the regulator/linkage curation pass; feed source licensing checked (settlement data redistribution varies). **Acceptance:** EU ETS shows the real price with source and timestamp; volatility recomputes from stored returns; timeframe switches render consistent history; linkage facts match reality with citations.

### 9.2 Evolution B — Carbon-market intelligence copilot (LLM tier 2)

**What.** Once real, this becomes the treasury desk's question surface: "why did EUAs move this week and what auctions are coming?" (price series + real event calendar), "what's our P&L on 500kt of CCA exposure under a −10% shock?" (the portfolio-PnL machinery exists and becomes meaningful with real prices), "which markets are actually linked, and what does that mean for basis risk?", "is the current EUA price adequate against NDC-consistent estimates?"

**How.** Tier 2: tool schemas over the price/analytics routes and the event calendar; every price cites source and timestamp — a market-data copilot quoting stale or synthetic prices is worse than none, so the coverage tier (live / latest-known / uncovered) prefixes every answer. Volatility and correlation figures come from the computed analytics with window stated; linkage and floor/ceiling claims quote the curated policy constants with citations; event-impact commentary links price moves to calendar entries without asserting causality the data can't support ("the move coincided with the auction" not "was caused by"). Hedging suggestions are framed as scenarios, never trade recommendations.

**Prerequisites (hard).** Evolution A — this module is unusable as a copilot substrate while prices are seeded; the name "live monitor" makes fabrication here uniquely misleading. Phase 2 tooling. **Acceptance:** every price/vol figure carries source+timestamp; coverage tier always stated; zero synthetic numbers in any answer.