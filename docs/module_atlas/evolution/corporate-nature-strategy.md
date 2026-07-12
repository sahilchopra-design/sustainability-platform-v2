## 9 · Future Evolution

### 9.1 Evolution A — Surface the production-grade engine the page ignores (analytics ladder: rung 1 → 2)

**What.** §7 documents a frontend↔engine disconnect: the backend
(`corporate_nature_strategy_engine.py`) faithfully implements the guide — SBTN 5-step
disclosure-boolean scoring, GLOBIO-style MSA.km² footprint
(`Σ (area_ha/100)×(1−MSA_factor)`), ENCORE sector dependency weights, EU NRL
exposure, and the 35/30/15/10/10 composite with maturity tiers — while the page
renders 55 `sr()`-seeded "Nature Strategy N" items whose displayed "TNFD Score" is
literally a random draw. §7.6 names the remediation: wire the table to
`POST /full-assessment` and the six `/ref/*` endpoints (all of which already pass the
harness). Evolution A is that wiring plus a real input path.

**How.** (1) Fix `POST /full-assessment` (harness status `failed`) and fixture
`/encore-dependencies` (skipped). (2) Replace the seeded ITEMS array with an
assessment workflow: the Settings panel's business-activities/sites configuration
becomes the engine's input payload (locations, land-use classes for MSA, disclosure
booleans per SBTN step); scores render from the engine response with the composite's
five components inspectable. (3) LEAP tab drives the four stages against
`/ref/tnfd-metrics` and `/ref/encore-services` reference data instead of decoration.
(4) Scenario step (rung 2): the engine's Step-2 scenario input becomes a real toggle —
GBF-country policy stringency from `/ref/gbf-countries` varying the NRL/GBF
components. (5) Persist assessments so maturity progression is trackable.

**Prerequisites (hard).** Full frontend PRNG purge; the `/full-assessment` fix; a
disclosure-input UX (the engine needs real company disclosures — honest empty states
until entered). **Acceptance:** every displayed score reproduces via
`POST /full-assessment`; the §7.5 composite weights are visible in the drill-down;
entering a third-party-verification boolean moves Step 5 by exactly +25.

### 9.2 Evolution B — TNFD disclosure drafter over LEAP outputs (LLM tier 2)

**What.** The overview's last promise — "Report Builder generates TNFD-aligned nature
disclosure narrative" — is the canonical tier-2 drafting task, and this module is
unusually ready for it: the engine's `tnfd-disclosure` endpoint already scores the
four TNFD pillars from disclosure data. Evolution B drafts the narrative: governance,
strategy, risk-and-impact management, and metrics sections written from the
(post-Evolution A) assessment payload — dependency materiality from the ENCORE
weights, MSA footprint with its land-use decomposition, SBTN target status — each
number quoted from the engine, gaps disclosed as gaps.

**How.** Tool-calling over the module's 11 operations: the drafter runs
`POST /full-assessment` and `POST /tnfd-disclosure`, then writes sections only where
component scores evidence content, using `/ref/tnfd-metrics` as the disclosure-
requirement checklist. The fabrication validator covers hectares, MSA.km², and
percentages. Rendering through the report-studio layer; drafts versioned with the
engine's composite so a re-assessment visibly changes the narrative.

**Prerequisites (hard).** Evolution A — drafting TNFD disclosures from the current
seeded page would fabricate a regulatory document; real company disclosure inputs
entered. **Acceptance:** every numeric in a draft matches the assessment payload;
LEAP stages without data produce explicit "not yet assessed" language; the draft's
metric table enumerates exactly the `/ref/tnfd-metrics` core metrics with values or
honest nulls.
