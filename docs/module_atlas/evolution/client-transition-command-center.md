## 9 · Future Evolution

### 9.1 Evolution A — Real SBTi pathway-gap engine over linked portfolios (analytics ladder: rung 1 → 2)

**What.** §7 splits this module cleanly: the aggregation machinery is real (AUM-
weighted ITR, 4-quadrant classifier, engagement pipeline, budget-vs-capex table, an
ITR what-if) but it runs over 60 `sr()`-fabricated clients, and the guide's headline
engine — `PathwayGap(t) = ActualCI(t) − SBTiTarget(t)` against sector-specific 1.5°C
pathways — does not exist. Evolution A builds the pathway engine and re-bases the
dashboard: SBTi's published SDA sector pathways (power, steel, cement intensity
trajectories — public technical annexes) encoded as a reference table; per-client
carbon-intensity trajectories computed from linked `portfolios_pg` holdings via the
platform's portfolio-analytics endpoints; the gap series and milestone-completion
ratio computed per the guide's formulas.

**How.** (1) `ref_sbti_sda_pathways(sector, year, intensity, scenario_version)` table
from the SBTi technical annexes with version pinning (pathways get revised).
(2) `pathwayGap(clientPortfolio, sector, year)` joining actual CI to the interpolated
pathway; the existing quadrant classifier re-keyed to computed gap + engagement stage
instead of PRNG attributes. (3) The 60 fabricated clients replaced by real client links
(the `client-portal` Evolution A account table is the natural source) or clearly-
labelled fixtures.

**Prerequisites (hard).** PRNG client purge; portfolio CI data requires holdings
emissions coverage — clients with insufficient coverage must show "insufficient data",
not an imputed gap. **Acceptance:** a fixture portfolio tracking exactly the power-
sector SDA path shows gap ≈ 0 across years; the quadrant assignment changes when and
only when computed inputs change; the mismatch flag clears.

### 9.2 Evolution B — Transition-desk orchestrator (LLM tier 3)

**What.** This command centre is a natural tier-3 surface: its questions span modules.
"Prepare the quarterly transition review for client X" decomposes into pathway-gap
retrieval (this module, post-Evolution A) → engagement-status summary (its pipeline) →
portfolio reallocation analysis (portfolio-analytics module) → milestone/alert roundup,
synthesized into a review memo through the report-studio render layer. Alert triage is
the daily-use slice: "which clients breached pathway thresholds this week and why?"

**How.** Routing per the tier-3 pattern: the atlas interconnection graph and
`module_tags.json` identify the sibling modules; each sub-answer comes from that
module's own tools (the orchestrator never computes); memo numerics validated against
the underlying tool outputs; CA100+ benchmark language cited from the §5 corpus.

**Prerequisites (hard).** Evolution A first, plus tier-2 capability on
portfolio-analytics — an orchestrator is only as honest as its leaf tools; today every
leaf under this module is seeded. **Acceptance:** a generated review memo's every
figure traces to a named module's tool response; a client without a computed pathway
gap appears in the memo as data-gapped, not silently omitted or invented.
