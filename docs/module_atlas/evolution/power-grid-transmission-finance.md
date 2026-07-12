## 9 · Future Evolution

### 9.1 Evolution A — Live regulatory data and real congestion series (analytics ladder: rung 2 → 3)

**What.** §7 rates this well-grounded: it implements real RAB-based regulatory-finance formulas over curated European TSO data — allowed return (`RAB × WACC`), the RIIO-T2 revenue-requirement build-up, RAB-premium equity valuation (`RAB × (1−gearing) × 1.12`), and DSCR/FFO credit metrics — with 12 real TSOs (National Grid £14.8B, RTE €28.4B, Terna €18.2B), real capex programmes with IRRs, and RIIO-style revenue waterfalls. The only synthetic element is the monthly congestion series. Two soft spots: the `·0.15` capex depreciation proxy and `1.12` RAB premium are hand-set heuristics, and the TSO/interconnector data is hand-authored point-in-time. Evolution A grounds the data and refines the proxies.

**How.** (1) Refresh the TSO RAB/allowed-return/credit-metric data from real regulatory filings — Ofgem RIIO-T2 determinations and ACER monitoring reports (both named in §5) publish these; a periodic ingester keeps them current and dated. (2) Replace the synthetic monthly congestion series with real ENTSO-E cross-border flow and price-spread data (the platform already integrates ENTSO-E per project memory) — congestion rent = `Σ(price_A − price_B) × flow × hours` per §5 from actual market data, making the NordLink/IFA/NEMO interconnector economics real. (3) Refine the `0.15` depreciation proxy and `1.12` RAB premium to per-TSO regulatory depreciation rates and observed market-to-RAB ratios. The RAB/DSCR formulas are correct — keep them.

**Prerequisites.** Ofgem/ACER data ingestion; ENTSO-E flow/price data (already integrated) for real congestion; the core formulas are sound — pin them in `bench_quant`. **Acceptance:** TSO RAB/credit data refreshes from regulatory filings; congestion rent computes from real ENTSO-E flows; the depreciation/premium proxies are per-TSO-sourced.

### 9.2 Evolution B — TSO-finance analyst copilot (LLM tier 2)

**What.** A copilot for the infra-debt/equity-analyst users §1 targets: "what's National Grid's allowed vs earned ROE and DSCR?", "value RTE at 6% WACC and 60% gearing", "which capex programmes have the best IRR?", "what's NordLink's congestion rent at current spreads?" — executed against the RAB/valuation/congestion engine, decomposing each answer into the RIIO revenue-requirement components.

**How.** Tool calls to endpoints wrapping the allowed-return, revenue-requirement, equity-valuation, and congestion functions; system prompt from this Atlas page's §5 formulas and the Ofgem RIIO-T2 / ACER / FERC references named in §5 so regulatory mechanics (RAB, allowed return, IQI incentives) are explained correctly. The WACC/gearing valuation sensitivity (§1) is a recomputation; the capex screener ranks by real IRR. Fabrication validator matches every RAB/ROE/DSCR/IRR figure to a tool response; the congestion answers (post-Evolution-A) cite the ENTSO-E data vintage.

**Prerequisites.** Compute endpoints; the formulas work today on curated data, so a tier-2 analyst is viable now with an as-of disclosure; Evolution A grounds the congestion and refreshes TSO data. **Acceptance:** every RAB/ROE/DSCR/valuation figure traces to a tool call; valuation sensitivities recompute; congestion answers (post-Evolution-A) cite real flow data; the copilot discloses data vintage.
