## 9 · Future Evolution

### 9.1 Evolution A — Real holdings behind the descriptive dashboard (analytics ladder: rung 1 → 3)

**What.** §7 notes there is no MODULE_GUIDES entry (guide = null) — the page is a synthetic holdings dashboard generating a random 150-name book and showing descriptive analytics (returns, sector/country allocation, ESG overlay). The correct pieces are the descriptive aggregations (weight/return/ESG means, guarded allocation shares, B/M/K/T formatting) and even `perfHistory` mixes a real trend with `sr()` noise. The tier-A backend PCAF engine (`portfolio_analytics_engine.py` / `_v2`, shared by 9 modules, 48-module blast radius) is not called; all data is frontend `sr()`. Evolution A wires the real portfolio data.

**How.** (1) Replace the 150-name random generator with `GET /portfolios/{id}/holdings` and `/analytics` over `portfolios_pg` — the descriptive aggregation logic (sector/country allocation, weighted returns, ESG means) is correct and carries over unchanged onto real positions. (2) Real returns from market data (the platform's market-data ingesters) rather than centred `sr()` draws, so `perfHistory` and attribution reflect actual performance vs a real benchmark. (3) The `_v2` engine's real portfolio-valuation logic (`adjusted_value = current_value × (1+adjustment)`, ownership-weighted, per §5's extracted lines) drives the valuation view. This is primarily a data-wiring exercise — the aggregation math is sound.

**Prerequisites.** Portfolio-analytics endpoints (exist, auth-gated); real return/market data for performance; the aggregation logic is correct — keep it. Blast radius 48 via shared engine — pin before touching. Remove the `sr()` book. **Acceptance:** the dashboard renders real `portfolios_pg` holdings; allocations and returns compute from real positions and market data; no `sr()` in holdings or returns.

### 9.2 Evolution B — Portfolio-monitoring copilot (LLM tier 2)

**What.** A copilot for a portfolio manager: "what's my YTD return and top contributors?", "show sector allocation and the ESG overlay", "how am I tracking vs benchmark?", "which country exposures are largest?" — executed against the real portfolio-analytics engine over `portfolios_pg`, with every aggregate a computed output.

**How.** Tool calls to the portfolio-analytics GET endpoints (`/holdings`, `/analytics`, `/dashboard`); system prompt from this Atlas page's §7.1 aggregation logic. Allocation, return, and ESG-overlay answers decompose the descriptive aggregates by holding; the fabrication validator matches every weight/return/ESG figure to a tool response. Because this dashboard shares the engine feeding 48 modules, the copilot is a portfolio-level entry point that can hand off to the specialist copilots (climate VaR, temperature score) for deeper analysis. Mutating actions (add/delete holdings via the POST/DELETE endpoints) gate behind confirmation + RBAC.

**Prerequisites (hard).** Evolution A — a monitoring copilot on the current random 150-name book would report fictional returns and allocations as portfolio state; the auth blocker must be resolved. **Acceptance:** every aggregate traces to an endpoint call over real holdings; allocation shares sum correctly; write actions require confirmation and RBAC.
