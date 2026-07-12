## 9 · Future Evolution

### 9.1 Evolution A — Gasparrini DLNM backend replacing the seeded scenario multipliers (analytics ladder: rung 1 → 3)

**What.** The §7 mismatch flag is unambiguous: no MMT, no β_heat, no temperature series, no distributed lag — all 60 cities' `mortalityBase` values are `sr()` draws, and RCP/horizon projections are uniform multipliers (`1 + rcp×0.3 + horizon×0.25`) applied identically to every city. Evolution A builds the §8 model as this module's first backend vertical: a distributed-lag exposure-response engine computing annual excess heat mortality from daily temperature above a city-specific minimum-mortality temperature, with UHI offset and elderly-share vulnerability scaling. Targeting rung 3 directly is justified because the calibration targets already exist in the literature (Vicedo-Cabrera 2021 attributable fractions, Lancet Countdown Indicator 1.1.2).

**How.** (1) Ingest ERA5 daily temperature for a pilot set of 15–20 of the 60 named cities via the platform's existing Open-Meteo/NASA-POWER ingestion path (already wired for other modules). (2) New `heat_mortality` engine: published city-specific ERF coefficients and MMTs (London ~18°C, Athens ~25°C) from Gasparrini 2017 rather than fitting from scratch; 21-day cumulative lag; SSP ΔT applied to the ERF, not as a flat multiplier. (3) Validation pin: Europe-2022 backtest against the 61k excess-deaths figure cited in §8.5.

**Prerequisites.** The `genCities(60)` fabrication removed for pilot cities (honest nulls for the rest); daily mortality baselines per city (national statistics or GBD rates). **Acceptance:** two cities under identical scenario settings produce different mortality uplifts driven by their ERFs; pilot-city attributable fractions land within published Vicedo-Cabrera confidence intervals.

### 9.2 Evolution B — Longevity-impact copilot for insurers (LLM tier 1 → 2)

**What.** The module's stated buyer is life insurers/reinsurers quantifying longevity assumptions. Evolution B is a copilot answering "what does an 880-death RCP 8.5/2050 projection mean for an annuity book in this city?", "why is this city tiered Critical?", and "how does the MMT concept work?" — grounded in this Atlas page's §5 methodology and §8 spec, with mandatory candour that current numbers are seeded scenario multipliers (§7.5) until Evolution A ships.

**How.** Tier 1: atlas record into `llm_corpus_chunks`; the page passes current RCP/horizon slider indices and the derived `totalMort`/`avgWBGT` so answers narrate visible state, always attaching the synthetic-data caveat. Tier 2 after Evolution A: what-ifs ("rerun Athens under SSP1-2.6, 2080, elderly share 25%") execute as tool calls against the new engine route; the no-fabrication validator checks each mortality figure against tool output. TCFD/TNFD disclosure-drafting becomes viable only at tier 2, since disclosure text must cite computed, reproducible numbers.

**Prerequisites.** Copilot router + pgvector corpus (Phase 1); tier 2 and any disclosure-drafting gated hard on Evolution A. **Acceptance:** pre-Evolution-A, every quantitative answer carries the seeded-data caveat; post, every figure traces to a logged engine call with its MMT/ERF parameters disclosed.
