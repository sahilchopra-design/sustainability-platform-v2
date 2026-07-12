## 9 · Future Evolution

### 9.1 Evolution A — Fix entity-id resolution, multi-year history, and real filings (analytics ladder: rung 1 → 2)

**What.** The CSRD Entity Data Bridge — a translation layer exposing 8 seeded CSRD entities (4 banks,
4 energy) in module-ready input formats (carbon, ECL, nature, stranded, sector, portfolio-asset), so
downstream modules pre-fill from real DB values instead of manual entry. No modelling, no PRNG — SQL
SELECTs + field renaming + unit conversion. §7.5 names the deepening targets: the 8 entities are
**seed data modelled on plausible magnitudes, not the companies' actual reported figures** (must not
be quoted as real disclosures); reporting year is **hardcoded to 2024** with no multi-year history;
IFRS 9 stage mix silently falls back to a stylised 70/20/10; and 404 semantics conflate "entity
missing" and "wrong sector". Critically, §4.2 shows **every `/{entity_id}` detail endpoint failing**
(db-empty) — the entity-id lookup is broken while only the list endpoint works. Evolution A fixes the
entity-id resolution, adds multi-year history, and moves toward real filings.

**How.** Fix the `entity_registry_id` UUID resolution so the detail/carbon/ecl/nature/stranded/sector/
portfolio-asset endpoints return data; parameterise the reporting year (surfacing multi-year history);
distinguish 404-missing from 409-wrong-sector; and, as the entities are real companies, ingest their
actual CSRD/Pillar 3 filings to replace the seed rows (with a clear seed-vs-reported provenance flag).
Rung 2: cross-block validation (flag inconsistencies like E1 Scope 3 cat 15 vs FI financed emissions,
currently passed through unflagged).

**Prerequisites (hard).** The harness failures (§4.2 — all 7 detail endpoints **failed**) are the
headline: the bridge is unusable beyond the entity list until entity-id resolution works; the seed-vs-
reported distinction must be explicit before any figure is quoted externally. **Acceptance:** a
`/{entity_id}` profile returns the full cross-module block; a `/{id}/ecl` on an energy entity returns a
clear wrong-sector error (not a generic 404); reporting year is selectable; seed rows are labelled
seed, not reported; the detail endpoints pass the harness.

### 9.2 Entity-data pre-fill tool for the module copilots (LLM tier 2)

**What.** This bridge's LLM role is a **pre-fill/grounding tool**: when a carbon, ECL, nature or
stranded-asset copilot works on one of the 8 CSRD entities, it tool-calls the matching `/{id}/carbon`,
`/{id}/ecl`, `/{id}/nature` or `/{id}/stranded` endpoint to auto-populate real DB inputs instead of
asking the user to type them — exactly the "pre-fill from real database values" purpose the docstring
states. It grounds every module copilot's inputs in one authoritative entity dataset.

**How.** Register the 8 endpoints as tools; a module copilot resolving an entity pulls its pre-filled
inputs and shows the user the source values before computing. The no-fabrication validator ensures any
entity attribute (Scope 1/2/3, EAD, generation mix) a copilot cites traces to a bridge tool call with
its seed-vs-reported provenance and reporting year. Because the bridge feeds carbon/ECL/nature/stranded
modules, it is the shared entity-data leg of those desks' orchestration.

**Prerequisites (hard).** Evolution A's entity-id resolution fix (the detail endpoints must work for
tool-calling) and seed-vs-reported labelling; Atlas corpus embedded (roadmap D3). **Acceptance:** every
pre-filled value a copilot uses traces to a bridge tool call with its provenance and year; a value is
labelled seed (not reported) until real filings are ingested; a wrong-sector pre-fill request returns
the clear error, not a generic 404.
