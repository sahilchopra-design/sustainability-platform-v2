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
