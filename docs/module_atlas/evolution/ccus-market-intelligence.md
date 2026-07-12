## 9 · Future Evolution

### 9.1 Evolution A — First implementation: CCUS facility economics tracker (analytics ladder: rung 0 → 1)

**What.** The §7 deep-dive records **no implementation**: the feature directory is
empty, the route is not wired in App.js, and there are no engines or source files —
though the atlas function map sketches an intended shape (an 11-row `FACILITIES` seed
with capacityMtpa/capex/opex/energy-intensity/T&S-tariff fields and a capital-recovery
-factor levelised-cost calc). Evolution A is therefore not a deepening but a first
build: a routed page computing levelised cost of capture per facility
(`(capex·CRF + opex + energy·fuelPrice) / tonnes`) over a real facility roster seeded
from the public IEA CCUS Projects Database, with jurisdiction-tagged incentive context
(45Q, EU ETS, UK CfD).

**How.** (1) Wire the route in App.js with the platform's local-T theme convention.
(2) Seed `FACILITIES` from the IEA CCUS Projects Database export (public, ~700
projects) filtered to operational/under-construction capture facilities — honest
provenance from day one, no `sr()` synthetic rosters. (3) Deterministic
levelised-cost and incentive-coverage calcs (does $85 45Q cover this facility's cost?)
as pure functions; sibling `blue-hydrogen-ccus` is the nearest implemented pattern to
follow per §7.2.

**Prerequisites.** Acknowledge in the page that this replaces an empty placeholder;
IEA data attribution requirements met. **Acceptance:** the route renders from App.js;
a fixture facility's levelised cost reproduces a hand calculation; zero PRNG usage
(guardrail-clean).

### 9.2 Evolution B — CCUS market explainer copilot (LLM tier 1)

**What.** Once Evolution A gives the page real content, a tier-1 copilot answering
"why does DAC capture cost 5x a natural-gas-processing retrofit?", "which facilities
clear the $85/t 45Q threshold?", and "what does the T&S tariff add?" — grounded in the
new facility table and this atlas record. Tier 1 only: a copilot cannot precede the
module itself, and there are no endpoints to tool-call.

**How.** Standard tier-1 pattern: atlas record plus the facility reference table
embedded in `llm_corpus_chunks`; answers cite facility rows or the levelised-cost
formula; the refusal path covers everything the module does not compute (storage-site
geology, credit prices, project finance — the latter belonging to the also-unbuilt
`ccus-project-finance` sibling).

**Prerequisites (hard).** Evolution A shipped and atlas regenerated — today there is
literally nothing to ground on; any copilot before that would be fabrication by
construction. **Acceptance:** every $/t figure in an answer traces to a facility row or
the levelised-cost computation; a storage-liability question is refused with a pointer
to the module's scope.
