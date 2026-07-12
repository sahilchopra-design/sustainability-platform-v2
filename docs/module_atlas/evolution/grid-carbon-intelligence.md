## 9 · Future Evolution

### 9.1 Evolution A — Multi-region coverage and consumption-based intensity (analytics ladder: rung 3 → 4)

**What.** §7 confirms this is a genuinely honest live module: a thin cached proxy over the UK NESO (National Energy System Operator) carbon-intensity API with no synthetic data anywhere — the frontend renders whatever the proxy returns, and even the "Demo" fallback is a real captured snapshot (2026-07-04T20:50Z), not a seeded generator. Two documented limitations bound it: coverage is UK-only, and intensity is generation-based only (NESO methodology — no embodied or imported-electricity emissions). Evolution A broadens and deepens: add multi-region grid-intensity coverage (ENTSO-E for continental Europe, EIA/WattTime for the US — the ENTSO-E/EIA feeds are already wired platform-wide in wave-1), and add a consumption-based (import-adjusted) intensity alongside the generation-based figure, plus a short-horizon forecast from the historical series (rung-4 predictive).

**How.** (1) Generalise the proxy to multiple grid operators with a region selector, each badged Live/Demo per data availability (extending the honest fallback pattern). (2) A consumption-based intensity that adjusts for interconnector flows, distinct from NESO's generation-based number and clearly labelled. (3) A near-term intensity forecast from the ingested history (the NESO API already provides forward-looking data to anchor it).

**Prerequisites.** Multi-region grid-intensity feeds (ENTSO-E/EIA/WattTime, partly wired); interconnector-flow data for consumption-based intensity. **Acceptance:** the module serves ≥3 regions each with accurate Live/Demo badging; consumption-based intensity is shown alongside generation-based and labelled; a forecast horizon is populated from real data, never padded synthetically.

### 9.2 Evolution B — Grid-timing and carbon-aware-scheduling copilot (LLM tier 2)

**What.** A copilot for operations and demand-flexibility users: "when is the UK grid cleanest in the next 24 hours, and how much carbon would shifting our load to that window save?" tool-calls the NESO proxy (and Evolution A's multi-region/forecast endpoints) and narrates the carbon-optimal timing.

**How.** Tier-2 tool-calling over the grid-intensity proxy; the grounding corpus is §7, which documents the NESO methodology (generation-based, the forward-looking horizon) and the honest Live/Demo behaviour. The copilot's value is carbon-aware scheduling — identifying clean windows and quantifying load-shift savings. Because the data is real, this is a strong tier-2 candidate now. Guardrail: it must respect the Live/Demo badge and state when it's reasoning over the frozen snapshot rather than live data. Every gCO₂/kWh figure validated against the proxy response.

**Prerequisites.** None hard — the proxy is live and PRNG-free; Evolution A broadens coverage. **Acceptance:** every intensity and saving figure traces to a proxy tool call; the copilot flags Demo-snapshot mode when the live proxy is unreachable; carbon-saving estimates use real forward intensity, not assumptions.
