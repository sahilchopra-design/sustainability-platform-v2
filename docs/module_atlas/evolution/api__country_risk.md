## 9 · Future Evolution

### 9.1 Evolution A — ISO-bridged joins, tie handling, and a composite governance score (analytics ladder: rung 1 → 3)

**What.** A read-only data-service over ingested third-party governance indices (TI CPI, Fund for
Peace FSI, Freedom House FIW, UNDP GII, GEM Coal Plant Tracker) — it computes no scores of its own,
just SQL reads with correct per-index sort direction (only the code comment is wrong; the ASC sort
for FH_FIW is right, §7.2). §7.5 names the real limitations: the coal-capacity join is by
case-insensitive **country name** equality (vulnerable to "Korea, South" vs "South Korea"), there's
no ISO-code bridge for GEM rows; `/rankings` re-ranks by score with **no tie handling** (ties get
arbitrary consecutive ranks); and the module never composes the indices into a blended risk score.
Evolution A adds an ISO-code bridge for the GEM join, proper tie handling in rankings, and a
composite governance score.

**How.** A country ISO-code reference table bridges GEM coal rows to the `dh_country_risk_indices`
ISO3 keys so joins are robust; `/rankings` assigns dense ranks with explicit tie resolution; a new
`/composite` endpoint blends the normalised indices (each rescaled to a common 0–100 direction) into
a governance score with documented weights — feeding the sovereign-ESG and Article 6 host-country
screens that currently do this composition elsewhere. Rung 3: the composite is calibrated against a
published sovereign-ESG benchmark, with per-index vintage surfaced.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `GET /compare`,
`/country/{iso3}`, and `/rankings/{index}` all **failed** (db-empty or lookup bugs); the domain has
no hard-coded fallback (§7.5), so ingested tables must be populated (roadmap D0/D1). Fix the stale
code comment about FH_FIW sort direction. **Acceptance:** the §7.4 rankings pagination reproduces
with dense tie ranks; a coal-capacity query resolves via ISO code, not name matching; the detail and
compare endpoints pass the harness; a composite score is reproducible from its component indices.

### 9.2 Evolution B — Country-risk copilot over the governance indices (LLM tier 1 → 2)

**What.** A copilot answering "how does this country rank on corruption and fragility?", "compare
these five countries across all indices", and "which coal-heavy countries have the weakest
governance?" — grounded in the served indices with each figure attributed to its publisher (TI, Fund
for Peace, Freedom House, UNDP, GEM) and vintage. Because the domain is a faithful pass-through, the
copilot's value is navigation and synthesis, never re-scoring; it must state each index's scale and
direction (CPI higher=cleaner, FSI higher=more fragile) so comparisons aren't misread.

**How.** Tier-1 roadmap pattern initially: the `INDEX_META` scales/directions and framework alignment
(§7.6) embedded as the module corpus; served via `POST /api/v1/copilot/country-risk/ask`. Graduate
to tier 2 by tool-calling `/country/{iso3}`, `/rankings`, `/compare`, `/heatmap` and `/coal-capacity`
so answers come from real filtered data, with the no-fabrication validator checking every score and
rank against tool output. Post-Evolution A, it can narrate the composite governance score.
Composable into sovereign-ESG and export-finance workflows.

**Prerequisites.** Evolution A's harness fixes (working detail/compare/rankings endpoints for
tool-calling) and populated tables; Atlas corpus embedded (roadmap D3). **Acceptance:** every index
value cited is attributed to its publisher with scale, direction and vintage; a rank matches the
`/rankings` tool output; the copilot never blends indices into a score before Evolution A's
documented composite exists.
