## 9 · Future Evolution

### 9.1 Evolution A — Server-side OWID/WB ingestion with history and MAC sourcing (analytics ladder: rung 2 → 3)

**What.** §7 rates this page a model citizen: it fetches real OWID CO₂ data and two
World Bank indicators at runtime, badges every source LIVE or SEEDED honestly, and
falls back gracefully — plus a static 20-option MAC curve. Its limits are structural:
client-side fetches re-download a multi-megabyte OWID CSV per visit, only 2022 is
kept, the WB calls fetch a single most-recent value, and the MAC options carry no
citations. Evolution A moves ingestion server-side into the platform's ingester
framework: OWID and WB series land in reference tables with full history (1990→),
enabling trend views and country trajectories the current single-year filter cannot
support, with the LIVE/SEEDED badge preserved end-to-end (source + refresh timestamp
served with the data).

**How.** (1) `ref_country_emissions(iso3, year, co2, co2_per_capita, sector_split,
source)` refreshed weekly by a new ingester (the 19-ingester scaffold is the
established pattern); the page's fetch logic becomes one platform API call with the
existing fallback semantics. (2) Time-series tabs: per-country trajectory vs NDC
markers, decoupling view (CO₂/capita vs GDP/capita over time — both series already
fetched). (3) Each MAC option gets a source citation (IEA/McKinsey vintage) and
year-dollars normalisation; the negative-cost options' assumptions documented.

**Prerequisites.** OWID/WB licensing is permissive (CC BY) — attribution strings
required; existing page behaviour regression-pinned (same 2022 values from the new
route). **Acceptance:** the page loads country data in one call with history; badge
shows source + last-refresh; a country trajectory chart renders 30+ years; every MAC
bar cites its source.

### 9.2 Evolution B — Emissions-data explainer (LLM tier 1)

**What.** A copilot for the questions this data invites: "why does Qatar top
per-capita while China tops absolute?", "what does the MAC curve say is the cheapest
next gigatonne?" (sorted-step narration with the sources from Evolution A), "how has
India's decoupling trended?" (post-Evolution A, a real series to describe). Tier 1
retrieval-and-explanation — the module computes aggregations, and the copilot's job
is honest narration with the LIVE/SEEDED status surfaced in prose.

**How.** Atlas record plus the reference tables as corpus; the copilot must state the
data vintage and source per figure (the badge discipline extended to language);
MAC-curve answers distinguish engineering cost estimates from realised project costs
per the option citations. Refusal path for forecasts and policy attribution beyond
the data.

**Prerequisites.** Evolution A preferred for history questions; workable today for
single-year comparisons since the live fetches are real. **Acceptance:** every
figure in an answer carries country-year-source; when the page is in SEEDED fallback
mode, the copilot says so before quoting anything.
