## 9 · Future Evolution

### 9.1 Evolution A — Probabilistic stranding and forward WACI projection (analytics ladder: rung 2 → 4)

**What.** The domain does honest deterministic tracking today: portfolio WACI per
sector-year vs an NZBA/IEA-NZE pathway with a RAG rule (`deviation ≤ 0` GREEN, `≤ +10%`
AMBER, else RED), CRREM real-estate stranding, and linear interpolation between anchor
years. Two limitations are visible in the atlas: several lineage traces run against
empty tables (`dh_crrem_pathways` db-empty; `esrs_e1_ghg_emissions` unpopulated), and
the IEA-NZE reference is a flat `target × 0.90` shortcut. Evolution A adds a forward
projection layer and a probabilistic stranding year.

**How.** (1) Project each asset/sector's own emissions trajectory from its history
(`pcaf_time_series_engine` already builds actual-by-year series) using a decarbonisation
rate fit, then compute stranding year as the crossing of the projected path and the
CRREM pathway — with a confidence band from the fit residuals, not a single
deterministic year. (2) Replace `iea_nze = target × 0.90` with the real IEA-NZE series
per sector. (3) Seed the empty `dh_crrem_pathways` and `esrs_e1_ghg_emissions` tables so
status-grid and DQS endpoints stop returning db-empty. (4) Bench-pin the RAG classifier
and interpolation.

**Prerequisites.** Seed CRREM pathways (A13 ingester) and ESRS E1 emissions
(shared with the platform D0 seeding); real IEA-NZE reference data. **Acceptance:**
`crrem/asset/{id}` returns a stranding year with a confidence interval; no
glidepath endpoint returns db-empty for the demo portfolio; bench pin reproduces
deviation and RAG band.

### 9.2 Evolution B — Decarbonisation-tracking analyst with improvement planning (LLM tier 2)

**What.** A copilot that reads a portfolio's status grid and answers "which sectors are
RED and by how much are we off the NZBA path?" (citing the deviation and RAG from
`/portfolio/{id}/status-grid`), then "what's the cheapest way to improve our data
quality score?" by calling `/dqs/{id}/improve` and narrating the returned improvement
actions.

**How.** Eight read-only GET endpoints filtered per module make the tool set: sector
glidepath, status grid, NZBA/CRREM pathways, DQS and DQS-improvement. The RAG semantics
and the WACI/deviation formulas from this Atlas page's §7.1 are the grounding corpus.
The DQS-improvement endpoint is the natural tier-2 action — it already returns a
prioritised action list, so the copilot orchestrates "show me the plan, then re-score
assuming we close the top three" as sequential tool calls.

**Prerequisites.** The db-empty traces from §4.2 must be resolved first (Evolution A's
seeding) — a copilot narrating a status grid built on empty CRREM tables would report
GREY/no-data for everything and mislead. **Acceptance:** every deviation and RAG label
in an answer matches a status-grid tool response; a DQS-improvement narrative lists only
actions returned by `/dqs/{id}/improve`; the copilot refuses to project stranding years
until Evolution A ships that capability.
