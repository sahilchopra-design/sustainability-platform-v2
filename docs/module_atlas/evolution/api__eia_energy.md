## 9 · Future Evolution

> Atlas page is thin (no §5/§7 deep-dive): a small live-proxy domain over the US EIA API, exposing
> three endpoints (`/status`, `/grid-mix`, `/gas-price`). Evolutions are scoped to what the page
> documents — the response shape shows a `mode`/`cache`/`upstream_error`/`provenance` proxy pattern.

### 9.1 Evolution A — Persist and cache the EIA series (analytics ladder: rung 1 → 2)

**What.** A thin proxy over the US EIA API: `/grid-mix` (generation mix by region), `/gas-price`
(Henry Hub series), `/status` (API-key/mode check). The response payload's `mode`, `upstream_error`,
`cache` and `provenance` fields reveal the same live-proxy fragility other API-backed modules hit —
it depends on the EIA API being reachable and an API key being configured (`api_key_configured` in
`/status`), and serves a fallback `mode` when unavailable. EIA data (real-time US grid generation
mix, gas prices) is high-value for the platform's energy and financed-emissions modules. Evolution A
ingests the EIA series into a persisted, cached store so grid-mix and gas-price queries are served
reliably with a freshness stamp, rather than a per-request live call.

**How.** An EIA ingester (the API is keyed but free) populating `dh_eia_grid_mix` and
`dh_eia_gas_price` tables on a schedule; the endpoints serve from the store with `retrieved_at`/
`cache` provenance and fall back to live only on cache miss. Rung 2: grid-mix carbon intensity
computed per region (generation mix × fuel emission factors) so the series feeds the platform's
location-based Scope 2 and CBAM grid-EF calculations directly.

**Prerequisites.** The live-proxy pattern (`upstream_error` in the response) means reliability depends
on EIA availability and key config — the ingester removes that; document the ingestion vintage.
**Acceptance:** grid-mix and gas-price queries return persisted data with a freshness stamp regardless
of EIA API availability; a region's grid carbon intensity is computable from the stored mix; `/status`
reflects real ingest freshness, not just key presence.

### 9.2 Evolution B — Energy-data grounding tool for the desk copilots (LLM tier 2)

**What.** EIA's value to the platform's LLM layer is as a **live energy-data grounding tool**: an
energy or financed-emissions copilot answering "what's the current US grid mix?" or "what's the Henry
Hub gas price?" tool-calls `/grid-mix` or `/gas-price` here rather than inventing a figure, and a
CBAM/Scope-2 copilot grounds a grid emission factor in the real regional mix. Rather than a standalone
copilot, this registers as a shared data tool.

**How.** Register the endpoints as tools in the shared registry; the no-fabrication validator ensures
any US grid-mix or gas-price figure in a desk-copilot answer traces to an EIA tool call with its
`retrieved_at`/`source` provenance. Post-Evolution A, the region-level carbon intensity is available
as a derived tool output. The `/status` mode is surfaced so a live-vs-cached figure is always
distinguished.

**Prerequisites.** Evolution A's persisted, cached store (a fragile live proxy can't reliably back
tool-calling); Atlas corpus embedded (roadmap D3). **Acceptance:** a US grid-mix or gas-price figure in
any copilot answer traces to an EIA tool call with its provenance and vintage; a cached figure is
labelled as such, never presented as live; a grid emission factor cites the real regional mix.
