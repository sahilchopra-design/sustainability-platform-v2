## 9 · Future Evolution

### 9.1 Evolution A — Disclosed city inventories and a computed alignment gap (analytics ladder: rung 1 → 2)

**What.** §7 shows the tracker fabricates its subject matter: 75 real city names with
PRNG-drawn targets, baselines, and reductions, and an `onTrack` flag that is literally
a coin flip (`sr(i·17) > 0.4`) — while the guide advertises
`NZProgress = Σ w_sector(TargetRed − ActualRed)/TargetRed` and
`AlignmentGap = CityEmissions − Pathway_t`, neither computed. Evolution A rebuilds on
disclosed data: the CDP-ICLEI Unified Reporting System publishes city GHG inventories,
targets, and climate action plans for thousands of cities (public dataset exports),
giving real baselines, target years, and sectoral splits. The alignment gap then
becomes a genuine computation: a linear-to-target (or C40 Deadline-2020-style) pathway
per city, compared against the latest disclosed inventory year.

**How.** (1) `ref_city_inventories(city, year, sector, tco2e, target_year,
target_pct, source)` ingested from the CDP-ICLEI public export — a bounded annual
refresh, consistent with the platform's 19-ingester pattern. (2) `onTrack` redefined as
`AlignmentGap ≤ 0` — a derivation, not a die roll. (3) The sector-weighted NZProgress
score implemented per the guide's formula over the disclosed sectoral splits, with
cities lacking sectoral data honestly reported at city-total granularity
(honest-nulls).

**Prerequisites (hard).** PRNG purge; CDP data-use terms verified (city-level public
disclosures are redistributable with attribution); disclosure vintage displayed per
city since inventories lag 1–3 years. **Acceptance:** a city whose latest inventory
sits below its interpolated pathway shows `onTrack = true` by computation; every
rendered baseline traces to a disclosed inventory row; zero `sr()` calls remain.

### 9.2 Evolution B — City benchmarking copilot (LLM tier 1)

**What.** Post-Evolution A, a copilot for benchmarking questions: "how does
Copenhagen's progress compare to its 2025 milestone?", "which Asian cities with 2040
targets are off-track?", "what does Race to Zero require that city X hasn't
disclosed?". These are filter/compare narrations over the inventory table plus the §5
standards corpus (C40, SBT4C, Race to Zero criteria) — tier-1 shape, since the module's
computations are aggregations the page already renders.

**How.** Atlas record and the inventory reference table embedded per the tier-1
pattern; comparative answers cite city rows with inventory vintages; criteria questions
cite the standards text. The copilot must state disclosure lag explicitly — "latest
inventory 2023" — rather than presenting stale data as current performance.

**Prerequisites (hard).** Evolution A first: today the honest answer to every progress
question is "these numbers are seeded random", which is no copilot at all.
**Acceptance:** every emissions figure cited matches an inventory row with its year;
asked to predict whether a city will hit its 2030 target, the copilot reports the
computed gap and declines to forecast beyond it.
