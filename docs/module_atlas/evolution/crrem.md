## 9 · Future Evolution

### 9.1 Evolution A — Country×type pathway granularity and real portfolio ingestion (analytics ladder: rung 2 → 3)

**What.** This module is genuinely what it claims: real stranding-crossover logic
(`min{t : intensity > pathway(t)}`) with linear interpolation, real retrofit DCF
(20-yr NPV, abatement cost), no PRNG on any headline figure. §7.6 scopes the honest
gaps: the embedded `CRREM_PATHWAYS` table is a curated *approximation* of CRREM v2 —
type×scenario only, missing the licensed dataset's country×type granularity, and
expressed in carbon intensity rather than EUI; the tariff is a single $0.12/kWh
worldwide; the 30-asset portfolio is a curated demo in `localStorage`. With 46
dependent modules, pathway fidelity here matters platform-wide.

**How.** (1) Pathway upgrade: CRREM publishes downloadable pathway data for many
country×type combinations — ingest into a versioned `crrem_pathways` refdata table
(respecting license terms; where unlicensed, keep the approximation explicitly
badged), and support both intensity and EUI tracks as CRREM v2 does. (2) Tariff
matrix: country-level electricity tariffs (Eurostat/EIA, public) replace the flat
$0.12, making retrofit NPV geography-aware. (3) Portfolio ingestion: the promised
upload path lands assets in a backend table instead of `localStorage`, joining the
UK EPC ingest where applicable (shared with `commercial-re-climate-risk`'s
evolution — one building-data layer, two consumers). (4) Benchmark: validate
stranding years for reference assets against CRREM's own published tool outputs —
the rung-3 test; pin one asset in `bench_quant.py`.

**Prerequisites.** CRREM data licensing review (the approximation stays as fallback
with a badge); coordination with the EPC ingest. **Acceptance:** the same asset
strands in different years in Germany vs Spain via country pathways; retrofit NPV
shifts with the country tariff; the reference-asset stranding year matches CRREM's
published tool within one year.

### 9.2 Evolution B — Retrofit-priority analyst for asset managers (LLM tier 2)

**What.** The module computes stranding years and retrofit NPVs per asset but leaves
the portfolio question — "where do my next €10M of retrofit capex go?" — to the
analyst's eye. Evolution B answers it by tool call: rank assets by
stranding-urgency × NPV via `POST /crrem/assess` and `/retrofit-plan`, explain each
recommendation ("strands 2029 under 1.5°C; the HVAC+envelope stack delays to 2041 at
$46/tCO₂e abatement cost"), and draft the TCFD/SFDR disclosure paragraph the export
tab promises — figures from the engine, pathway caveats (approximation vs licensed)
carried into the prose.

**How.** Tool schemas over the module's 8 operations; `/ref/crrem-pathways` and
`/ref/retrofit-measures` serve as citable grounding. The capex-allocation ranking is
a deterministic sort over engine outputs the copilot orchestrates and explains — the
LLM never invents an NPV. GRESB questions route to `POST /gresb-score`. The
fabrication validator covers years, $/m², and abatement costs.

**Prerequisites.** Evolution A's persistence (recommendations must reference stored
asset IDs, not `localStorage` state); harness fixtures for the POST routes.
**Acceptance:** a capex-allocation answer reproduces as the documented ranking over
tool outputs; every stranding year quoted matches `/assess`; the disclosure draft
discloses the pathway provenance badge.
