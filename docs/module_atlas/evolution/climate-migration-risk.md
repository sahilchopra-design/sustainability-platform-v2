## 9 · Future Evolution

### 9.1 Evolution A — Resolve the two-page split; ground corridors in Groundswell (analytics ladder: rung 1 → 2)

**What.** §7 exposes a routing tangle before any methodology gap: the feature folder
holds two distinct pages — `ClimateMigrationRiskPage` (routed here, EP-AV5, 50
PRNG-seeded countries scaled by RCP/year sliders) and `ClimateRiskMigrationPage`
(EP-CG6, 15 hard-coded corridors — the page the guide actually describes) — and the
guide's `Migrants = Population × ExposureFraction × MigrationPropensity` exists in
neither. Evolution A first resolves the split (one canonical page; the corridor view
is the keeper since its 15 corridors and Groundswell framing carry real content),
then grounds it: corridor flows anchored to the World Bank Groundswell 2050
projections (216M internal migrants — already the module's headline), the
optimistic/central/pessimistic `PROJECTIONS` re-based on Groundswell's actual three
scenarios, and the guide's decomposition implemented where its terms are sourceable
(population from WB data, exposure fraction from hazard maps, propensity as the
explicit modelled assumption it is).

**How.** (1) Route cleanup: retire or merge the EP-AV5 seeded-country page; atlas
regenerated so the record documents one page. (2) `ref_groundswell_corridors` with
region-scenario projections cited to report tables; urban-stress indicators for the
8 receiving cities from public city data (population growth, housing) rather than
seeds. (3) The RCP/year sliders retained but scaling sourced projections, not noise.

**Prerequisites (hard).** The dual-page/route confusion is a defect to fix first —
documentation, navigation, and any future copilot all point at the wrong page today.
**Acceptance:** one routed page whose corridor numbers cite Groundswell tables; the
scenario toggle reproduces the report's published ranges; zero seeded country
attributes remain.

### 9.2 Evolution B — Corridor-briefing copilot (LLM tier 1)

**What.** A copilot for the module's real users (real-estate and sovereign
analysts): "what does the Dhaka corridor imply for receiving-city housing demand?",
"which corridors are drought-driven vs sea-level-driven?" (the driver taxonomy per
corridor), "how do the three scenarios differ for Sub-Saharan Africa?" — retrieval
and comparison over the sourced corridor and city tables, with the real-estate
demand-shift framing the page already provides. Tier 1: projections are curated from
a published model, and the copilot's job is faithful narration with scenario caveats.

**How.** Corridor/city tables plus the §5 corpus (Groundswell 2021, IDMC, UNHCR) as
grounding; every flow figure carries scenario + source; the copilot must present
Groundswell numbers as *internal* migration projections (their actual scope) and not
convert them into cross-border claims — a common misreading worth guarding in the
prompt.

**Prerequisites (hard).** Evolution A first, including the page-split fix — a copilot
grounded on this module today could be describing a different page than the user
sees. **Acceptance:** every projection cited carries scenario and source; asked about
international refugee flows, the copilot notes the data covers internal migration and
redirects to the displacement module.
