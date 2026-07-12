## 9 · Future Evolution

### 9.1 Evolution A — Sourced vendor directory with honest MPI scoping (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's Market Penetration Index (`MPI = Adopters/TAM ×
100`) and platform-scoring rubric exist nowhere in code — the page is an operations
dashboard of hard-coded KPI snapshots, a 40-company directory with TRL ratings, a
funding tracker, and an integration-health monitor whose only computations are means
and cumulative sums. TAM/adopter data for a true MPI is not publicly obtainable at
credible quality, so Evolution A scopes honestly: drop the MPI claim from the guide,
and upgrade what is real — the 40-company directory gains per-field sourcing (funding
rounds from public announcements, TRL justifications, segment taxonomy), the funding
tracker re-bases on disclosed deal data, and the integration-health monitor connects
to the platform's *actual* integration inventory (the ingester framework's real
uptime/lag telemetry) instead of hard-coded uptimes.

**How.** (1) `ref_climate_fintech_companies(name, segment, funding_total, last_round,
trl, source_url, as_of)` — curated with citations, refreshed per funding announcement
cycles. (2) The integration monitor rewired to the ingestion framework's run logs
(19 ingesters with real timestamps) — converting decorative uptime numbers into
genuine operational telemetry. (3) Guide rewritten to describe a landscape-intelligence
module, clearing the mismatch flag.

**Prerequisites.** Curation budget for the company table (bounded: 40 rows);
ingester-log access from the frontend or a thin status endpoint. **Acceptance:**
every company field cites a source; the integration tab shows real last-run
timestamps matching ingester logs; the guide no longer promises MPI.

### 9.2 Evolution B — Vendor-landscape copilot (LLM tier 1)

**What.** A copilot for technology-selection questions: "which carbon-accounting
vendors in the directory serve mid-cap European banks?", "what's the funding
trajectory of the ESG-data segment?", "what does our own platform already ingest that
overlaps with vendor X's offering?" — the last question is the differentiated one,
answered from the platform's source inventory (the same knowledge the
climate-data-marketplace copilot uses), preventing duplicate procurement. Tier 1
retrieval over the sourced directory plus segment taxonomy.

**How.** Atlas record + the Evolution A company table + the platform ingestion
inventory as corpus; recommendations cite company rows with as-of dates (fintech
landscapes rot fast — a 2024 funding fact stated as current in 2026 is
misinformation); refusal on vendor-quality judgments beyond sourced facts.

**Prerequisites (hard).** Evolution A's sourcing — advising vendor selection from
hard-coded demo attributes would steer real decisions on fiction. **Acceptance:**
every vendor claim carries source + date; asked "which vendor is best?", the copilot
compares sourced attributes and declines an unsourced ranking.
