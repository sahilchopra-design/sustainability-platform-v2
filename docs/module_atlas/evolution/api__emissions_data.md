## 9 · Future Evolution

### 9.1 Evolution A — Replace the LEI proxy with sector/revenue-scaled or reported emissions (analytics ladder: rung 1 → 3)

**What.** A reference-data access domain over two ingested public datasets (Climate TRACE satellite
emissions, OWID CO₂/energy panels) plus one derived endpoint. The read endpoints are honest live
aggregates, no PRNG. The one computation — `GET /by-lei/{lei}` — is a **stated placeholder**: it scales
a counterparty's Scope 1/2/3 as fixed fractions (0.0001/0.00004/0.00006) of its *country's* national
CO₂ total, so **every German counterparty gets identical numbers regardless of size or sector** (§7.4),
with an honest "estimated, DQS 4-5, upgrade to reported data" note. §7.5 also flags a documentation
drift: the code comment says 60/25/15 scope split but the constants give 50/20/30. Evolution A replaces
the country-constant proxy with sector/revenue-scaled estimates and a reported-data path.

**How.** `emissions_by_lei` scales the national total by the entity's sector share and revenue/employee
size (via the entity-resolution layer's SEC EDGAR fundamentals and OWID sector splits), lifting the
estimate from DQS 5 to DQS 3–4; when CDP/SFDR-reported emissions exist for the entity, they override
the proxy (DQS 1–2). Rung 3: calibrate the sector-intensity factors against Climate TRACE's own
facility-to-parent roll-ups (which this domain already serves) for entities with matched facilities.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `GET /by-lei/{lei}` and
`/owid/{iso3}` both **failed** (db-empty / lookup); fix the 60/25/15-vs-50/20/30 comment/constant
mismatch. Preserve the honest DQS labelling. **Acceptance:** two German counterparties of different
size/sector receive different Scope 1/2/3 estimates (the §7.4 country-constant behaviour is gone); a
CDP-reported entity returns reported emissions at DQS 1–2; the scope split matches the documented
fractions; the failing endpoints pass the harness.

### 9.2 Evolution B — Emissions grounding tool for the financed-emissions copilots (LLM tier 2)

**What.** This domain's value to the LLM layer is as an **emissions-data grounding tool**: a PCAF/
financed-emissions copilot answering "what are this counterparty's emissions?" tool-calls `/by-lei`
(with its DQS and source label), or `/climate-trace`/`/owid` for facility/country ground truth. The
DQS labelling is the key discipline — the copilot must never present a DQS-5 country-proxy as reported
data, and can surface the upgrade path (CDP/SFDR reporting) the response note already names.

**How.** Register the 8 endpoints as tools; the no-fabrication validator ensures any emissions figure
in a copilot answer traces to a tool call with its DQS and source (`estimated_owid`/`estimated_
climate_trace`/`reported`). Climate TRACE serves as an independent cross-check against self-reported
emissions (a greenwashing/data-quality signal), and OWID grounds country-level context. This is the
emissions leg of a financed-emissions desk orchestrator alongside `facilitated_emissions` and
`dme_dmi`.

**Prerequisites.** Evolution A's improved `/by-lei` (a country-constant proxy is too coarse to ground
counterparty answers reliably) and harness fixes; Atlas corpus embedded (roadmap D3). **Acceptance:**
every emissions figure in a copilot answer traces to a tool call carrying its DQS and source; a
country-proxy estimate is labelled DQS 4–5 (never reported); a Climate TRACE facility figure is
distinguished from an OWID country total with correct units.
