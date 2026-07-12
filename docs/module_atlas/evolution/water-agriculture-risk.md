## 9 · Future Evolution

### 9.1 Evolution A — Real Aqueduct stress data and a single, reconciled drought model (analytics ladder: rung 1 → 2)

**What.** Three documented gaps define the work. First, the 40 regions use real basin
names (Punjab, Murray-Darling, Ogallala) but `waterStress` is `1 + sr()×4` — §7.5
notes WRI Aqueduct is a text-only citation, while the sibling `water-risk-analytics`
module has already wired real Aqueduct data and "could be reused here for the
waterStress field at minimum". Second, the guide's headline
`AWRS = Water Stress × Crop Sensitivity × Sourcing Concentration` doesn't exist —
there isn't even a sourcing-concentration field. Third, §7.3/§7.5 flag two
inconsistent drought-impact formulas (`impactData` vs `scenarioMatrix` use different
coefficients for the same severity/duration inputs) and §7.4 shows slider terms
dominate region-specific vulnerability. Evolution A: (1) join the 40 named basins to
the sibling's Aqueduct lookup so stress scores are real; (2) implement AWRS with a
crop-sensitivity table (FAO yield-response factors, Ky) and a user-supplied sourcing-
weight vector; (3) collapse the two drought formulas into one, rescaled so regional
`yieldRisk` drives at least half the variance.

**How.** Reuse the sibling's data path rather than a new ingester; a small
`GET /api/v1/water-ag-risk/basins` route serving the joined records with provenance;
`historicalDroughts` rows get citations (EM-DAT/USDA) or a "platform-authored" label.

**Prerequisites.** The dual-formula reconciliation bug acknowledged; basin-name →
Aqueduct-geometry mapping table (40 rows, manual curation acceptable). **Acceptance:**
Punjab and Po Valley show their actual Aqueduct stress ratings; the scenario matrix
and per-region simulator agree for identical inputs; AWRS output changes when sourcing
concentration changes.

### 9.2 Evolution B — Sourcing-risk copilot for TNFD/CSRD water disclosures (LLM tier 2)

**What.** The module's stated outputs are TNFD and CSRD water disclosures plus supply-
chain resilience reporting. Evolution B is a tool-calling assistant for a procurement
or sustainability analyst: "we source 40% of our wheat from Punjab and 25% from the
Murray-Darling — score the portfolio and draft the TNFD water section." It calls
Evolution A's `GET /basins` and a `POST /awrs` endpoint with the user's sourcing
weights, then drafts disclosure text where every stress score, AWRS value, and
yield-risk figure is tool-sourced, mapped to the TNFD LEAP vocabulary the framework
expects and honestly separating Aqueduct-sourced fields from platform-modelled ones.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; grounding corpus
is this Atlas page plus the sibling water modules' pages (shared basin vocabulary).
The system prompt carries §7.5's provenance table so pre-Evolution-A questions get
refusals rather than synthetic numbers narrated as WRI data.

**Prerequisites (hard).** Evolution A — a disclosure copilot must never cite `sr()`
draws as Aqueduct scores; that is precisely the fabrication pattern the platform
purged. **Acceptance:** drafted TNFD text contains only tool-sourced figures with
per-field provenance; asked about a basin outside the 40-region set, the copilot says
so and offers the nearest covered basin rather than inventing a score.
