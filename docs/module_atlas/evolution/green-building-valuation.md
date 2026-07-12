## 9 · Future Evolution

### 9.1 Evolution A — Real green premium and year-by-year CRREM stranding (analytics ladder: rung 1 → 2)

**What.** §7 documents real formulae over synthetic inputs: `GreenPremium = (RentGreen − RentBrown)/RentBrown × 100` and `StrandedRisk = max(0, CarbonIntensity − SectorDecarbPath)` are computed, and EUI/embodied-carbon/premium are structured correctly, but all properties are `sr()`-seeded and `CRREM_BUDGET` is a single scalar per building type rather than the CRREM year-by-year declining pathway — so stranding is a static gap, not a stranding-year projection. Evolution A grounds the inputs and upgrades the stranding model: real property EUI/EPC data (from the platform's EPC feed), real rent benchmarks for the green-vs-brown premium, and the full CRREM 1.5°C declining intensity pathway so each asset gets a projected stranding year, not just a current gap.

**How.** (1) Replace seeded properties with a real/user-supplied asset register carrying EUI, EPC, and rent. (2) The green premium computed from matched green-vs-brown rent benchmarks. (3) Replace the scalar `CRREM_BUDGET` with the year-by-year CRREM pathway per property type, computing the crossover year where carbon intensity exceeds the declining budget — the true stranding-year metric.

**Prerequisites.** EPC/EUI data and rent benchmarks (wave-1 EPC source); the CRREM pathway curves by type/region; seeded properties replaced. **Acceptance:** stranding is reported as a projected year from the CRREM pathway crossover, not a static gap; the green premium derives from real rent benchmarks; no `sr()` property drives a headline.

### 9.2 Evolution B — Climate-value and stranding copilot (LLM tier 2)

**What.** A copilot for real-estate investors and valuers: "what green premium does this LEED-certified office command, and when does the brown peer strand under CRREM 1.5°C?" tool-calls the Evolution A valuation and stranding endpoints, narrating climate-adjusted value and the stranding-year projection.

**How.** Tier-2 tool-calling over the valuation/stranding endpoints; the grounding corpus is §5/§7 (GRESB/LEED/BREEAM/NABERS benchmarks, the green-premium and CRREM stranding formulae). The copilot's value is quantifying transition risk in property terms — how many years until an asset breaches its carbon budget and what the green premium is worth. Guardrail, pre-Evolution-A: properties are seeded and CRREM is a scalar, so it must flag stranding as a static gap not a year. Every premium and stranding figure validated against tool output.

**Prerequisites.** Evolution A (seeded inputs and scalar CRREM limit current answers); corpus embedding. **Acceptance:** post-Evolution-A, every green-premium and stranding-year figure traces to a tool call using the real CRREM pathway; pre-Evolution-A the copilot reports stranding as a current gap and flags the limitation.
