## 9 · Future Evolution

### 9.1 Evolution A — Fix the data-absence-rewards-rating bug and enrich the by-LEI graph (analytics ladder: rung 1 → 2)

**What.** The Entity 360 Engine — a cross-module aggregation/scoring layer: per-module data
availability/quality, a weighted composite risk score, an ESG summary, regulatory-status flags, and a
counterparty-master dedup service. No primary risk math of its own, no PRNG. §7.5 names two real
defects, not just simplifications: the **ESG rating rewards missing data twice** — the default
composite is 50 when nothing is available, and `pai_count_flagged` defaults to 0 which *passes* the
≤2 test, so absence of PAI data *improves* the rating (§7.4 shows this producing a spurious B); and
the `by-lei` path maps only **sparse fields** (ECL total, PCAF outstanding + an `asset_class_code:1.0`
sentinel), so DB-driven profiles score "low" module quality by construction. Also, duplicate detection
is exact-normalised-name only (no fuzzy/LEI merge). Evolution A fixes the data-absence-rewards-rating
logic and enriches the by-LEI graph mapping.

**How.** The ESG rubric penalises (or marks NR for) missing PAI/composite data instead of defaulting
to a passing value, and always reports `data_completeness_pct` beside the rating; `by-lei` maps the
full cross-module graph (not just presence booleans) so DB-driven profiles reflect real module quality;
counterparty-master dedup uses the sibling `entity_resolution_service`'s fuzzy + LEI matching (0.85
threshold) rather than exact-name only. Rung 2: the composite weights and PD→score transform get a
documented rationale, and sensitivity to the weighting is surfaced.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `GET /by-lei/{lei}` **failed** and
`POST /profile`, `/counterparty-master` **skipped**; the missing-data-rewards-rating bug is a
correctness fix. **Acceptance:** the §7.4 worked example (composite 55.75 "high") reproduces, but an
entity with no PAI/ESG data no longer scores B — it scores NR or is penalised with completeness shown;
a by-LEI profile reflects real module quality, not "low" by construction; dedup catches a fuzzy-name
duplicate; the endpoints pass the harness.

### 9.2 Entity-profile copilot orchestrating cross-module data (LLM tier 2 → 3)

**What.** Entity 360 is the platform's cross-module entity aggregator — a natural tier-3 orchestration
surface. A copilot answers "give me the 360 profile for this counterparty by LEI" (`/by-lei` →
composite risk, ESG rating, regulatory status, gaps, recommendations) and "build a counterparty master
from these records" (`/counterparty-master` → dedup, quality scores) — narrating real aggregated
output. At tier 3 it composes the underlying modules: resolve LEI → pull ECL, PCAF, taxonomy, nature
data → synthesise the profile with recommendations.

**How.** Tool schemas over the endpoints plus the shared `entity_resolution_service` graph; the module
registry and rubrics ground "what modules feed a 360 profile?" questions. The no-fabrication validator
checks every score, rating and completeness % against tool output; crucially the copilot must report
`data_completeness_pct` alongside any rating (per the §7.5 caveat) so a high rating on thin data is
never presented as confident. Composable with `entity_resolution`, `data_hub_catalog` and the
financed-emissions engines.

**Prerequisites.** Evolution A's rating-bug fix and enriched by-LEI graph (so narrated ratings are
trustworthy) and harness fixes; Atlas corpus embedded (roadmap D3). **Acceptance:** every figure cited
traces to an engine tool call; a profile answer always pairs the ESG rating with completeness; a
thin-data entity is not presented as a confident B; the composite matches `/profile` output.
