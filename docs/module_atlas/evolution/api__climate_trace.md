## 9 · Future Evolution

> Atlas page is thin (no §5/§7 deep-dive): this is a small data-serving domain exposing three
> endpoints (`/definitions`, `/facilities`, `/health`) that proxy the public Climate TRACE
> facility-emissions dataset. Evolutions are scoped to what the page documents.

### 9.1 Evolution A — Persist and index the Climate TRACE facility corpus (analytics ladder: rung 1 → 2)

**What.** A thin proxy over the Climate TRACE upstream: `/definitions` serves sectors/countries
metadata (passing, cached), `/health` reports upstream status, but §4.2 shows `GET /facilities`
**failed** — the live facility query is unreliable (dependent on the upstream API being reachable,
the same CORS/availability fragility other proxy modules hit). Climate TRACE is a high-value source:
independent, satellite-derived, asset-level emissions for power/steel/cement/oil-gas facilities
worldwide. Evolution A ingests the Climate TRACE bulk facility dataset into a local PostGIS table
(the platform already runs 19 ingesters and has a physical-risk digital twin using PostGIS grids),
so facility queries are served from a persisted, indexed store rather than a fragile live proxy —
with spatial and sector/country filtering.

**How.** A Climate TRACE ingester (the dataset is free, downloadable) populating a
`climate_trace_facilities` table (facility id, lat/lng, sector, gas, annual tCO₂e, confidence,
vintage); `GET /facilities` queries locally with bbox/sector/country filters and a `source_vintage`
stamp; `/health` reports last-ingest freshness. Rung 2: join facility emissions to the platform's
entity resolution (GLEIF) so facilities roll up to corporate parents — feeding financed-emissions
and CBAM modules with independent asset-level ground truth.

**Prerequisites (hard).** Fix the `/facilities` failure (§4.2) by moving from live proxy to
ingested store; the ingester must stamp vintage so served figures are dated. **Acceptance:** a bbox
facility query returns persisted rows with a vintage stamp regardless of upstream availability;
sector/country filters work; `/health` reflects real ingest freshness.

### 9.2 Evolution B — Independent-emissions grounding tool for the desk copilots (LLM tier 2)

**What.** Climate TRACE's value to the platform's LLM layer is as an **independent ground-truth
tool**: when a financed-emissions or CBAM copilot cites a facility's or company's emissions, it can
cross-check against Climate TRACE's satellite-derived estimate via a tool call here — surfacing
discrepancies between self-reported and independently-observed emissions (a greenwashing/data-quality
signal). Rather than a standalone copilot, this domain registers as a shared verification tool.

**How.** Register `/facilities` (post-Evolution A, with entity roll-up) as a tool in the shared
registry; a desk copilot answering "what are this steel company's Scope 1 emissions?" can call both
the self-reported source and Climate TRACE, and the no-fabrication validator ensures any
"independently estimated" figure traces to a Climate TRACE tool call with its confidence and
vintage. The `/definitions` metadata grounds "which sectors/countries does Climate TRACE cover?"
questions.

**Prerequisites.** Evolution A's ingested, entity-resolved facility store (a fragile live proxy
cannot back reliable tool-calling); Atlas corpus embedded (roadmap D3). **Acceptance:** an
independent-emissions figure in any copilot answer traces to a Climate TRACE tool call with
confidence and vintage; a self-reported-vs-observed discrepancy is surfaced with both sources cited,
never reconciled by invention.
