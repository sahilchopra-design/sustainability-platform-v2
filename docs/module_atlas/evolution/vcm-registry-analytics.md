## 9 · Future Evolution

### 9.1 Evolution A — Wire the 819 real Verra projects and derive RIS from the sibling engine (analytics ladder: rung 1 → 2)

**What.** The page's two most actionable documented findings: (1) it imports 819 real
Verra projects (`VERRA_PROJECTS`/`VERRA_STATS` from `verraRegistryData.js` — real names,
proponents, countries, methodologies) and **never uses them**, rendering a fully
synthetic dataset instead; (2) the guide's headline Registry Integrity Score
(`RIS = Additionality × Permanence × Verification`, 0.6 flag threshold) exists nowhere
— `quality` is a flat 55–100 random draw. Evolution A does what §7.5 and §8.2
prescribe: replace the synthetic Verra rows with the real import (projects table,
country/methodology distributions, registry totals reconciled to the sibling
`vcm-cross-registry-tracker`'s curated extract via their shared route), and source the
three RIS sub-scores from the already-built `vcm_integrity_engine`
(`Additionality = C4`, `Permanence = C5`, `Verification = C3`) rather than inventing a
second scoring methodology.

**How.** A thin backend addition to `api/v1/routes/vcm_registry.py` (this module
already consumes its 4 passing GET routes): `POST /ris-batch` calling
`_compute_icvcm_criteria_scores()` per project and returning the multiplicative RIS
plus volume-weighted `RegistryRIS`. Frontend deletes the hardcoded-override synthetic
generation (§7.2's post-generation patches for Verra/GS/REDD+).

**Prerequisites.** The unused-import defect acknowledged; missing-input sub-scores
flagged distinctly from assessed-low scores (§8.6's suppression risk). **Acceptance:**
the Verra project count on the page equals 819 (or the import's current length); a
project scoring 0.75/0.60/0.85 renders RIS 0.38 and a low-integrity flag; registry
totals match the tracker's `/summary` payload.

### 9.2 Evolution B — Procurement screening copilot (LLM tier 2)

**What.** The module's stated workflow ends in "integrity reports for procurement and
claims verification" — a ranked-shortlist-plus-rationale deliverable. Evolution B is a
tool-calling screener: "shortlist Verra cookstove or methane projects, post-2018
vintage, RIS ≥ 0.6, and explain each exclusion" runs `POST /ris-batch` over the real
project table, cross-references `GET /summary`/`/registries` for market context, and
returns a procurement memo where every score decomposes into its C3/C4/C5 drivers —
e.g. "excluded: RIS 0.42, driven by Permanence 0.55 (REDD+ reversal-risk profile),
consistent with the multiplicative weakest-link design."

**How.** Tier-2 stack: tool schemas over `/ris-batch` and the four GET routes;
grounding corpus is this Atlas page plus the sibling `vcm-integrity` page (the engine's
criteria vocabulary lives there). The system prompt carries the §8.5 validation caveat
that RIS is directionally comparable to Sylvera/MSCI ratings, not equivalent — so the
copilot never presents RIS as a market rating.

**Prerequisites (hard).** Evolution A — screening today's synthetic project list would
produce procurement advice about projects whose numbers are random; the sibling
module's POST-route repairs (its `/assess` family currently fails the harness) benefit
this copilot too. **Acceptance:** every RIS and sub-score in a memo traces to the
batch payload; excluded projects cite the specific failing dimension; asked about a
registry with no real project data yet (e.g. Plan Vivo), the copilot says so instead
of extrapolating.
