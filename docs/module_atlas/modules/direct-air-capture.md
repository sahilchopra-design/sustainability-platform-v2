# Direct Air Capture
**Module ID:** `direct-air-capture` · **Route:** `/direct-air-capture` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **No implementation found.** The assignment record for `direct-air-capture` (route
> `/direct-air-capture`) carries **no `source_files`, no `engines`, no `route_files`, no `computed`
> logic, and a null `guide`.** A repository sweep confirms there is no `frontend/src/features/
> direct-air-capture/` feature directory and no route wiring the `/direct-air-capture` path to a
> component (the only match is the distinct, fully-implemented `direct-air-capture-finance` module).
> There is therefore nothing to ground a methodology deep dive in.

### 7.1 What the module computes

Nothing. This module id appears to be an **orphan / placeholder route** — either a reserved slug, a
renamed-away predecessor of `direct-air-capture-finance`, or a stub that was never built. No
constants, seed datasets, scoring logic, or engine exist to document.

### 7.2 Likely intent

Given the id and the sibling module, the intended scope was almost certainly **Direct Air Capture**
techno-economics / carbon-removal analytics. That scope is **already delivered** by
`direct-air-capture-finance` (EP-EH1, Sprint EH): 5 DAC technologies, an LCOC engine, electricity-price
sensitivity, learning curves, IRA §45Q credit, and offtake/credit analytics. See
`docs/module_atlas/deep/direct-air-capture-finance.md` for the full DAC methodology and the §8 model
specification for a production LCOC/CDR model.

### 7.3 Data provenance & limitations

- **No data, no code, no guide.** Any figure a UI might display under this route would have no backing
  computation. If the route resolves at all in the running app, it likely renders a 404 / fallback,
  not a functional module.

### 7.4 Recommendation

Either (a) remove the `direct-air-capture` id from the module registry as a dead route, or (b) redirect
`/direct-air-capture` → `/direct-air-capture-finance` so the real DAC analytics are reachable from the
shorter slug. No standalone model is warranted, since the DAC domain is fully covered by the finance
module.

**Framework alignment:** n/a — no implementation. The relevant DAC frameworks (IEA DAC 2022, NREL TEA,
IRA §45Q, IPCC CDR targets) are documented in the `direct-air-capture-finance` deep dive.

## 9 · Future Evolution

### 9.1 Evolution A — Resolve the orphan route, then build a DAC operations vertical distinct from finance (analytics ladder: rung 0 → 1)

**What.** The Atlas page is unambiguous: `direct-air-capture` has **no source files, no engines, no route wiring, no guide** — it is an orphan/placeholder slug whose intended scope is already delivered by `direct-air-capture-finance` (EP-EH1: 5 DAC technologies, LCOC engine, §45Q credits). The honest first evolution is registry hygiene, then — only if a distinct scope is wanted — a first deterministic vertical that does *not* duplicate the finance module: DAC **operations & MRV monitoring** (capture-rate telemetry, energy-intensity tracking vs nameplate, sorbent degradation curves, delivered-vs-contracted CDR reconciliation).

**How.** (1) Immediate: redirect `/direct-air-capture` → `/direct-air-capture-finance` in App.js routing and mark the id `merged` in the module registry, per the page's own §7.4 recommendation. (2) If revived: new `api/v1/routes/dac_operations.py` with plant-level tables (`dac_plants`, `dac_capture_readings`) seeded from the IEA DAC project database (public), computing realized capture cost from observed energy draw — deterministic formulas, honest nulls, no fabricated telemetry.

**Prerequisites.** A product decision that an operations scope is wanted at all — otherwise option (a), deletion, is correct and cheaper. **Acceptance:** the dead route no longer renders a fallback 404; either the slug 301s to the finance module, or `GET /api/v1/dac-operations/plants` returns seeded IEA-sourced rows and the page renders them.

### 9.2 Evolution B — Fold into the DAC finance copilot rather than a standalone assistant (LLM tier 1)

**What.** A module with zero computed surface cannot ground a copilot — there are no endpoints to cite and no §5 formulas to explain, so a standalone LLM feature here would violate the platform's no-fabrication contract by construction. The correct tier-1 evolution is **absorption**: the `direct-air-capture-finance` copilot (grounded in that module's Atlas record) becomes the answer surface for any user who lands on the DAC slug, with the router-level redirect from Evolution A delivering them there.

**How.** (1) In the tier-1 copilot corpus build (`llm_corpus_chunks`), register `direct-air-capture` as an alias of `direct-air-capture-finance` so retrieval for "DAC" queries resolves to the real module's §5/§7 chunks. (2) Add one guardrail probe to `bench_llm.py`: a question addressed to this module id must either be answered from the finance module's corpus (with the alias disclosed) or refused — never answered from thin air. (3) If Evolution A's operations vertical ships, split the alias and give the new vertical its own corpus entry.

**Prerequisites.** Evolution A's registry decision executed first; the atlas builder must handle alias records without fabricating a page. **Acceptance:** the bench probe passes — no copilot answer about "direct-air-capture" cites a nonexistent endpoint, and every numeric traces to `direct-air-capture-finance` responses.