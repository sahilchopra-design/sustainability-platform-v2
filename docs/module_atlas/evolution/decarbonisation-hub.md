## 9 · Future Evolution

### 9.1 Evolution A — Compute the DR from real inventories; retire the seeded universe (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: every company-level metric across the 60 real-named
firms is `sr()`-seeded — no GHG inventory, no baseline, no computed
`DR = (Baseline − Current)/Baseline`, a pathway that is a fixed linear glide
rather than the SBTi 4.2%/yr absolute-contraction rate the guide cites, and a
static portfolio-agnostic MAC table. The only quasi-real content is the abatement
levers' order-of-magnitude costs. Evolution A gives the hub real programme data
and the promised rate computation.

**How.** (1) Data substrate: for portfolio-company tracking, emissions and SBTi
status from the platform's real sources — the `company-profiles` BRSR dataset
carries reported Scope 1/2/3 and SBTi flags for 80 issuers; for
own-enterprise programme management (the overview's actual pitch), baseline and
project registration persist to a `decarb_programme` vertical. (2) DR computed
per entity from baseline vs latest inventory; pathway alignment against the real
SBTi cross-sector 4.2%/yr line and sector pathways (curated from SBTi's published
tools), replacing the indexed glide. (3) Project registry: registered levers with
expected abatement roll up into the gap-to-target analysis the overview promises
("commission additional projects before deadlines are missed"). (4) MAC detail
defers to the companion `decarbonisation-roadmap` module (§7 itself points
there) — the hub consumes its lever library rather than duplicating a static
table.

**Prerequisites (hard).** Seed purge (real names with fabricated SBTi statuses
are a disclosure risk); the programme-registry schema; SBTi pathway curation.
**Acceptance:** DR for a BRSR company reproduces from its reported figures; the
trajectory chart shows the genuine 4.2%/yr reference; a registered project's
abatement visibly narrows the computed gap.

### 9.2 Evolution B — Board-progress narrator for the decarbonisation programme (LLM tier 1 → 2)

**What.** The hub's audience — "board and sustainability leadership" — reads
narratives, not scatter plots. Evolution B drafts the quarterly programme update
from computed state: DR against the required pathway with the gap quantified,
project-pipeline status (registered abatement vs gap), budget deployment against
abatement delivered, and the off-track business units with their specific
shortfalls — every figure from the (post-Evolution A) programme registry and
inventory data, uncertainty and data-vintage caveats carried from the source
records.

**How.** Tier 1 over programme state plus this Atlas record and the SBTi standard
text; tier 2 when the registry is served, letting "what if we accelerate the
electrification lever by two years?" run as a registry what-if the narrator then
explains. Rendering through the report-studio layer; the fabrication validator on
all MtCO₂e and dollar figures — a board pack is precisely where an invented
number does maximum damage.

**Prerequisites (hard).** Evolution A (narrating seeded progress to a board is
the failure mode this platform's guardrails exist for); registry persistence.
**Acceptance:** every figure in a draft reproduces from registry/inventory
queries; the gap statement matches the computed pathway arithmetic; off-track
claims cite the specific units' data.
