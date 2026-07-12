## 9 · Future Evolution

> Atlas page is thin (no §5/§7 deep-dive): a small live-proxy domain over the ENTSO-E Transparency
> Platform, exposing three endpoints (`/status`, `/day-ahead-prices`, `/generation-mix`). The response
> shape (`mode`/`cache`/`upstream_error`/`provenance`) matches the sibling `eia_energy` proxy pattern.

### 9.1 Evolution A — Persist and cache the ENTSO-E series with carbon intensity (analytics ladder: rung 1 → 2)

**What.** A thin proxy over the ENTSO-E Transparency Platform: `/day-ahead-prices` (per-country hourly
electricity prices), `/generation-mix` (per-country generation by technology), `/status` (API-key/mode
check). The `mode`/`upstream_error`/`cache` fields reveal the same live-proxy fragility other API-backed
modules hit — it depends on ENTSO-E being reachable and a key configured, serving a fallback mode
otherwise. ENTSO-E data (real European grid mix and prices) is high-value for the platform's energy,
CBAM grid-EF, and location-based Scope 2 modules. Evolution A ingests the series into a persisted,
cached store and derives per-country grid carbon intensity from the mix.

**How.** An ENTSO-E ingester (keyed but free) populating `dh_entsoe_prices` and `dh_entsoe_gen_mix`
tables on a schedule; endpoints serve from the store with a freshness stamp, falling back to live only
on cache miss. Rung 2: per-country grid carbon intensity computed as generation mix × technology
emission factors, feeding the platform's location-based Scope 2 and EPC-retrofit grid-factor
calculations (which currently use static per-country grid factors — see `epc_retrofit`).

**Prerequisites.** The live-proxy `upstream_error` pattern means reliability depends on ENTSO-E
availability and key config — the ingester removes that; document the ingestion vintage. **Acceptance:**
day-ahead prices and generation mix are served from the persisted store with a freshness stamp
regardless of ENTSO-E availability; a country's real-time grid carbon intensity is computable from the
stored mix; `/status` reflects real ingest freshness, not just key presence.

### 9.2 Evolution B — European grid-data grounding tool for the desk copilots (LLM tier 2)

**What.** ENTSO-E's value to the LLM layer is as a **live European grid-data tool**: an energy,
Scope-2 or CBAM copilot answering "what's the current German grid mix?" or "what were French
day-ahead prices yesterday?" tool-calls `/generation-mix` or `/day-ahead-prices` here rather than
inventing a figure, and grounds a location-based grid emission factor in the real mix. Rather than a
standalone copilot, this registers as a shared data tool alongside `eia_energy`.

**How.** Register the endpoints as tools; the no-fabrication validator ensures any European grid-mix or
electricity-price figure in a desk-copilot answer traces to an ENTSO-E tool call with its `retrieved_at`/
`source` provenance. Post-Evolution A, per-country carbon intensity is a derived tool output. The
`/status` mode distinguishes a live-vs-cached figure. This grounds the grid-factor inputs that
`epc_retrofit`, `energy_emissions` and CBAM currently take as static constants.

**Prerequisites.** Evolution A's persisted, cached store (a fragile live proxy can't reliably back
tool-calling); Atlas corpus embedded (roadmap D3). **Acceptance:** a European grid-mix or price figure
in any copilot answer traces to an ENTSO-E tool call with its provenance and vintage; a cached figure
is labelled as such; a grid emission factor cites the real country mix rather than a static constant.
