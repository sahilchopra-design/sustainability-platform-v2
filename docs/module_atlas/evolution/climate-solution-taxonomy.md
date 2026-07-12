## 9 · Future Evolution

### 9.1 Evolution A — Compute the advertised Mitigation Potential Score from curated abatement data (analytics ladder: rung 1 → 2)

**What.** §7 flags a guide↔code mismatch: the promised
`MPS = AnnualAbatement(GtCO₂e) × TRL Weight × CostCurve Position` is never computed —
the page is a taxonomy browser whose company scores (`euAlign`, `ftseGreen`,
`propScore`, `trl`, CBI class) are all `sr()`-seeded. Evolution A implements the MPS
honestly: extend the 13 curated `CATEGORIES` (the only real data on the page) with
per-technology abatement potential, MAC-curve position, and TRL from IPCC AR6 WG3
Ch.12 and IEA NZE tables, then rank solutions by computed mitigation potential under
selectable pathway scenarios (NZE vs APS).

**How.** (1) Curate a `solution_abatement` reference table (technology, GtCO₂e/yr
potential by 2030/2050, MAC $/tCO₂, TRL) — ~60 rows from published IPCC/IEA figures,
loaded via the refdata layer like the ESRS/GRI catalogs. (2) Frontend computes MPS from
that table with a documented TRL weight vector and normalized MAC position, replacing
the seeded `propScore`. (3) Purge the `sr()` company scores or explicitly relabel the
company screen as illustrative; the wizard's revenue-stream scorer keeps its real
`greenPct` summation. (4) Scenario toggle switches the abatement column between IEA
pathways — the rung-2 step.

**Prerequisites.** The seeded-random company scores are a documented defect
(§7.5) and must be removed or quarantined before MPS ships next to them —
`check_no_fabricated_random.py` conventions apply to the JS seed pattern too.
**Acceptance:** MPS ranking reproduces a hand-computed spot check for 3 technologies;
switching NZE→APS changes rankings; zero `sr()` calls feed any displayed score.

### 9.2 Evolution B — Deal-sourcing taxonomy copilot (LLM tier 1)

**What.** The overview promises "filtering by investor type, geography, and ticket size
for deal sourcing" — a classification task LLMs do well when grounded. Evolution B adds
a copilot that maps a described company or deal ("Series B, grid-scale iron-air
storage, EU revenue 70%") onto the module's taxonomy: category, indicative TRL band,
EU-Taxonomy technical-screening criteria that would apply, and — after Evolution A —
its category's computed MPS context, always labelled as a screening aid, not an
alignment determination.

**How.** Tier-1 RAG: corpus is the 13 `CATEGORIES` constants, the Evolution A
`solution_abatement` table, the EU Taxonomy TSC references §5 cites, and this Atlas
record, embedded per the roadmap's `llm_corpus_chunks` design. The system prompt
encodes the module's own honesty flag: current company-level EU-alignment percentages
are synthetic, so the copilot must never quote one as an assessment. Output is a
structured classification card the existing screening table can render.

**Prerequisites.** Evolution A's reference table (otherwise the copilot has only
category names and market sizes to ground on); embedding pipeline (D3).
**Acceptance:** 10 hand-labelled test companies classify to the correct category ≥8/10;
the copilot refuses to state a company's EU-Taxonomy alignment percentage and instead
lists the TSC that would need assessment.
