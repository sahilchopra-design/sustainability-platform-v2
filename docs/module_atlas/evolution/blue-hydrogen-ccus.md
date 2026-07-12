## 9 · Future Evolution

> **Scope note.** §7 documents this module id as an **empty stub**: `frontend/src/features/blue-hydrogen-ccus/` contains only an empty `pages/` folder — no page component, route registration, MODULE_GUIDES entry, backend engine, or seed data. It is a naming duplicate ("CCUS" vs "CCS") of the fully-implemented `blue-hydrogen-ccs`. Both evolutions below are therefore scoped to *creating* the module, not deepening it; the honest first decision is whether it should exist at all.

### 9.1 Evolution A — Decide the module's fate, then build the utilisation delta (analytics ladder: rung 0 → 2)

**What.** The current state is nothing rendered or computed (rung 0 — no engine). The first task is a disposition decision: (a) delete the stub, (b) redirect `/blue-hydrogen-ccus` to `blue-hydrogen-ccs`, or (c) build the genuine "CCU**S**" extension the sibling lacks. Only (c) is an evolution; (a)/(b) are cleanup that this document flags as the more likely correct call unless the utilisation pathway is a real product need.

**How (option c).** Reuse `blue-hydrogen-ccs`'s LCOH engine (`calcBlueH2Lcoh`, whose §8 model spec applies directly) and add the one conceptual delta: the CO₂-**utilisation** pathway. Where captured CO₂ is sold as feedstock (urea, methanol, synthetic fuels, EOR, food-grade CO₂) rather than geologically stored, the economics change on two axes — a utilisation revenue stream, and the US §45Q **$60/tCO₂ utilisation** rate (vs $85/t geological storage). Critically, the lifecycle carbon balance must **net any CO₂ re-released** from the utilised product (methanol combustion re-emits; urea partially does), so the emissions credit is pathway-dependent — this carbon-balance term is the whole point of a separate CCUS module and must be implemented, not glossed. Rung 2 follows once scenario sweeps over utilisation vs storage mix are added.

**Prerequisites (hard).** The disposition decision first — building a second blue-hydrogen module is only justified if utilisation analysis is genuinely wanted; otherwise redirect. If built, a utilisation-product CO₂ re-release factor table. **Acceptance:** if (c), a utilisation project shows the $60/t rate and a re-release-adjusted lifecycle credit distinct from the geological-storage case; if (a)/(b), the dead route no longer resolves to an empty page.

### 9.2 Evolution B — Copilot deferred until the module exists (LLM tier — N/A)

**What.** There is no endpoint, engine, or data for an LLM to ground on, so no copilot is possible or appropriate for this id in its current state. A copilot query about blue-hydrogen CCUS should be served by the `blue-hydrogen-ccs` module's copilot (see that module's Evolution B), extended with the utilisation-pathway tools only if Evolution A option (c) is chosen.

**How.** If and only if Evolution A builds the utilisation extension: add utilisation-pathway tool schemas (the $60/t rate, the CO₂ re-release carbon balance) to the shared blue-hydrogen tool set, so a single hydrogen copilot answers both storage and utilisation questions rather than spawning a second overlapping assistant. Until then, route intent to the sibling module and do not stand up any LLM surface against an empty scaffold.

**Prerequisites (hard).** Evolution A option (c) — a copilot cannot exist without an engine to call. **Acceptance:** no LLM surface is deployed against this id while it is a stub; if the utilisation module is built, its tools extend the existing blue-hydrogen tool set rather than duplicating it.
