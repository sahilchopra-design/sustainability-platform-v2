## 9 · Future Evolution

### 9.1 Evolution A — Production-weighted supply shock from real trade data (analytics ladder: rung 1 → 2)

**What.** §7 flags that neither guide formula exists: no
`ClimateRiskPremium = HistVol × ClimateBeta × (1+PhysRisk/100)`, no production-weighted
`PhysicalSupplyShock`, no fossil-fuel demand destruction — the module covers ten
agricultural/soft commodities with hard-coded `climateVaR95` attributes and a fixed
60/40 physical/transition split. Its strongest asset is genuinely useful: the
temperature-yield impact table (coffee −55% at +4°C, wheat −22%) reflecting published
crop studies. Evolution A implements the supply-shock formula on real structure: the
platform already ingests UN Comtrade data, which gives production/export weights by
country per commodity; combining those weights with the yield-sensitivity table and
country-level warming exposure yields
`SupplyShock = Σ ProductionWeight_i × YieldLoss_i(ΔT_i)` as a real computation.

**How.** (1) `ref_commodity_production(commodity, country, share, source, year)` from
Comtrade/FAOSTAT aggregates. (2) Yield-loss curves per crop from the existing
`CLIMATE_SCENARIOS` table, applied per producing country's scenario warming rather
than one global ΔT — concentration matters (cocoa's West-Africa concentration is the
canonical case and will emerge naturally from the weights). (3) The hard-coded
climateVaR95 either derived from the shock distribution or relabelled as an external
estimate with source; the risk-premium formula implemented only if a volatility series
is added — otherwise explicitly deferred, honestly.

**Prerequisites.** Yield-sensitivity values cited to their studies (they currently
carry no sources); scope honesty — fossil/minerals stay out until data exists, and the
guide text is trimmed to match. **Acceptance:** cocoa shows a larger +2°C supply shock
than wheat due to production concentration, decomposable by country; every weight
traces to a trade-data row.

### 9.2 Evolution B — Commodity-desk climate copilot (LLM tier 1 → 2)

**What.** A copilot for trading and procurement questions the module can honestly
answer: "why is coffee's +4°C yield impact so severe and what's the source?", "which
of our commodities has the most concentrated climate exposure?" (post-Evolution A, a
computed answer), "what hedging instruments does the page list for wheat?" (the
`HEDGE_INSTRUMENTS` catalogue — descriptive, not priced). Tier-2 what-ifs re-run the
supply-shock function with scenario/weight parameters as client-side tools.

**How.** Tier 1: atlas record plus the yield-impact and production tables as corpus;
every percentage cited with its study or table row. Tier 2: tool schema over the
Evolution A shock function; validator on all impact numbers. Hard refusal on price
forecasts and trading signals — the module models supply-side fundamentals, not
prices, and the copilot must say so.

**Prerequisites.** Evolution A for concentration questions; source citations on the
yield table regardless. **Acceptance:** a supply-shock explanation decomposes into
country terms matching the function output; asked "should we go long coffee?", the
copilot declines and reports the fundamentals instead.
