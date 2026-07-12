## 9 · Future Evolution

### 9.1 Evolution A — Real market-price and ancillary-service data replacing the synthetic 24h shape (analytics ladder: rung 2 → 3)

**What.** §7 credits this tier-A module with a sound revenue-stack decomposition — energy, capacity payments, ancillary services (at 1.5× energy price), and carbon credits, plus a PPA-vs-merchant comparison and grid-integration model — with genuine financial maths. Its flagged gaps are all data-realism issues: merchant volatility and the hourly demand/price series use `sr()` (`MARKET_PRICES` is a synthetic 24h shape), ancillary/capacity factors are convention-based rather than market-specific, the carbon credit uses a fixed 38 gCO₂/kWh, and grid-integration dispatch uses a stylised solar sine plus random demand. Evolution A replaces the synthetic market layer with real data: hourly wholesale prices and ancillary-service clearing prices from the platform's market feeds (ENTSO-E/EIA wired in wave-1), so the merchant revenue and AS premium reflect an actual market rather than a seeded shape.

**How.** (1) `MARKET_PRICES` reads real hourly wholesale prices for the selected region; the merchant `weightedRev` uses the actual 24h profile. (2) Ancillary-service premium from real AS clearing data (CAISO/NZEM structures the module already references) rather than a flat 1.5× multiplier. (3) Grid-integration dispatch uses real net-load shapes. (4) Carbon credit intensity varies by plant type.

**Prerequisites.** Hourly wholesale and AS price feeds by region (ENTSO-E/EIA available); the `sr()` merchant/demand series removed. **Acceptance:** merchant revenue and AS premium respond to real market prices for the chosen region; the grid-integration value reflects an actual net-load profile; no `sr()` drives a revenue figure.

### 9.2 Evolution B — Firm-baseload revenue-stack copilot (LLM tier 2)

**What.** A copilot for asset owners and offtake structurers: "value the full revenue stack for a 50 MW geothermal plant on CAISO — energy, capacity, ancillary, and carbon — and compare PPA vs merchant" tool-calls the revenue-stack endpoint and narrates the firm-baseload system-value case against intermittent renewables.

**How.** Tier-2 tool-calling over the revenue-stack and PPA-vs-merchant endpoints; the grounding corpus is §5/§7 (IRENA value-of-VRE system-value framework, GEA production benchmarks, CAISO/NZEM AS structure). Because the revenue maths is already genuine, a tier-1 explainer ships first; the tier-2 upgrade adds real-market what-ifs once Evolution A lands. Every $/MWh figure validated against tool output; the copilot foregrounds the dispatchability premium that distinguishes geothermal.

**Prerequisites.** Evolution A's real market data for credible merchant/AS answers; corpus embedding. **Acceptance:** every revenue-stack figure traces to a tool call; pre-Evolution-A the copilot flags merchant/AS numbers as illustrative synthetic prices; the co-location (desal/H2) revenue is shown as a documented assumption.
