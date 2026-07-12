# Blue Hydrogen Ccus
**Module ID:** `blue-hydrogen-ccus` · **Route:** `/blue-hydrogen-ccus` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (0 files)

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Unimplemented placeholder.** This module id resolves to an **empty stub**. The
> feature directory `frontend/src/features/blue-hydrogen-ccus/` contains only an empty
> `pages/` folder — there is **no page component, no route registration, no MODULE_GUIDES
> entry, no backend engine and no seed data**. Nothing is rendered or computed. It
> appears to be a naming duplicate of the fully-implemented `blue-hydrogen-ccs`
> ("CCS" vs "CCUS") that was scaffolded but never built out.

### 7.1 What the module computes

Nothing. There is no source file to ground formulas in. A search of the frontend for
`blue-hydrogen-ccus` / `BlueHydrogenCcus` returns no imports, no `React.lazy` entry,
and no `App.js` route. The assignment record carries empty `source_files`, `engines`,
`route_files`, `computed`, `seed_schemas` and a null `guide`.

### 7.2 Relationship to the real module

The intended functionality — blue-hydrogen production with carbon capture,
**utilisation** and storage economics — is delivered by the sibling module
**`blue-hydrogen-ccs`** (route `/blue-hydrogen-ccs`, EP-DS6). That page implements a
real annuitised LCOH model (`calcBlueH2Lcoh`), six production routes (SMR/ATR/POX/
pyrolysis), six geological storage sites, a methane-slip GWP100 lifecycle overlay and
a carbon-tax cost. See `blue-hydrogen-ccs.md` for the full methodology deep dive and
model specification.

The only conceptual delta a genuine "CCU**S**" variant would add over "CCS" is the
**utilisation** pathway: instead of (or alongside) geological storage, captured CO₂ is
sold as feedstock (urea, methanol, synthetic fuels, EOR, food-grade CO₂). Under US
§45Q this is the **$60/tCO₂ utilisation** rate (vs $85/t geological storage), and the
lifecycle credit must net any CO₂ subsequently re-released from the utilised product.
None of this is implemented in code.

### 7.3 Data provenance & limitations

- **No data, no model, no output.** The directory is an empty scaffold.
- Recommended remediation: either delete the stub, or redirect the route to
  `blue-hydrogen-ccs`, or build the utilisation-pathway extension described above and
  register the route. Until then this atlas entry documents the *absence* honestly
  rather than describing behaviour that does not exist.

**Framework alignment:** N/A — nothing is implemented. For the standards that a built
version should follow (IEA CCUS, Global CCS Institute, US §45Q utilisation $60/tCO₂,
IPCC GWP), refer to `blue-hydrogen-ccs.md`, whose §8 model specification applies
directly, extended with a CO₂-utilisation carbon-balance term.

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