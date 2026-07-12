## 9 · Future Evolution

### 9.1 Evolution A — Wire the calculator to the real backend engine and reference EFs (analytics ladder: rung 1 → 2)

**What.** Today this is a tier-B frontend-only page: the Tab-1 calculator implements the genuine WRI gross→attribution→rebound formula chain, but its default EFs come from 120 `sr()`-synthetic companies, and the platform's own honest implementation (`backend/services/scope3_analytics_engine.py::calculate_avoided_emissions`) sits unused. Evolution A gives the module its first backend vertical: persisted product assessments, sourced emission factors, and scenario sweeps over attribution/rebound assumptions.

**How.** (1) New router `POST /api/v1/scope4/assess` delegating to `calculate_avoided_emissions`, with an `avoided_emissions_assessments` table (product, functional unit, baseline scenario, EF pair, attribution, rebound). (2) Replace slider pre-seeds with `GWP_VALUES`/`EMISSION_FACTORS` from `referenceData.js` — already imported by the page but not wired to the default EF values. (3) Add a sensitivity grid (attribution 50–100% × rebound 0–30%) so a single assessment returns a scenario table, not a point estimate. (4) Fix the documented tier/criteria inconsistency: `tier: 'High'` must require all 8 `CRITERIA` at Adequate+, computed from `criteriaScores` instead of the independent `s5` draw.

**Prerequisites.** The §7.6 finding that category-level `additionality`/`doubleCounting` flags are decorative random draws must be resolved (derive from criteria data) before any persisted output. **Acceptance:** an assessment stored via the API round-trips to the UI with identical netAvoided; default EFs traceable to `referenceData.js` entries, not `sr()` draws.

### 9.2 Evolution B — Credibility-checklist copilot (LLM tier 1)

**What.** A chat panel answering "is this avoided-emissions claim credible?" and "why is the ratio 0.027×?" grounded in this Atlas page's §5 formula, the 8-criteria WRI/WBCSD checklist (`CRITERIA`, reproduced verbatim in the module), and the current calculator state — never inventing numbers. It explains the standing rule the page already enforces correctly: avoided emissions are reported as a standalone `avoidedToEmitted` ratio, never netted against Scope 1/2/3 inventory.

**How.** Per the Tier-1 pattern: embed this module's Atlas record into `llm_corpus_chunks`, serve via `POST /api/v1/copilot/scope4-avoided-emissions/ask` with a prompt-cached system prompt assembled from §5/§7. The copilot reads the live calculator inputs (unitsSold, EF pair, attribution, rebound) from page state and narrates the three-step §7.4 walkthrough for the user's actual values. Refusal path required for questions the module doesn't compute (e.g. project-level additionality tests, verified baselines).

**Prerequisites.** Must ship with an explicit synthetic-data disclosure: the 120 companies, tiers, and verifier names are `sr()`-generated, so the copilot must label any company-roster answer as illustrative until Evolution A lands. **Acceptance:** every numeric cited traces to page state or the Atlas §7.4 worked example; asking "what is Company X's verified 2024 avoided total?" yields a refusal, not a number.
