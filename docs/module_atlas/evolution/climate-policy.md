## 9 · Future Evolution

### 9.1 Evolution A — Wire the tracker engine and heal the failing country route (analytics ladder: rung 2 → 3)

**What.** §7 rates this page unusually clean: a hand-curated 30-country policy
database with **zero PRNG** (real facts — Germany's Climate Change Act, coal
phase-out 2038), a 16-jurisdiction carbon-pricing map, and honest derived gaps
(`gap = ndc_reduction_pct − ndc_progress_pct`). Meanwhile the backend carries a
genuine `climate_policy_tracker_engine` (Paris-benchmark NDC scoring with base-year
adjustment, NZE carbon-price gap with GDP-risk scaling, portfolio impact) behind
POST routes the page doesn't call, plus a Climate Policy Radar wrapper whose
`GET /country/{iso3}` is recorded **failed** in the lineage trace. Evolution A:
fix the failing route (the data-sources wave documented that Climate Policy Radar
has no live API — the `/status` endpoint already reports mode honestly, so the
country route must degrade to the seeded corpus rather than 500); wire the page's
Ambition Gap and Carbon Pricing tabs to `score-ndc` and `carbon-price-gap`; and
put refresh discipline on the curated table (policy facts rot — each row gains an
`as_of` and a review cadence).

**How.** (1) Route fix with a lineage regression fixture. (2) The engine's NDC
scores rendered beside the curated CAT-style ratings — model vs assessment,
labelled. (3) `ref_carbon_prices` refreshed annually from the World Bank dashboard
§5 already cites, replacing hand-edits.

**Prerequisites.** Confirm Radar data licensing for the seeded corpus; curation
ownership assigned. **Acceptance:** `/country/{iso3}` passes in the lineage sweep;
the ambition tab's scores reproduce via direct `score-ndc` POST; every curated row
carries `as_of`.

### 9.2 Evolution B — Policy-desk analyst (LLM tier 2)

**What.** This module has the platform's best grounding for a policy copilot: real
curated facts plus a real scoring engine. The analyst answers "score Indonesia's NDC
against the 1.5°C benchmark and explain the base-year adjustment" (a `score-ndc`
tool call narrated with the engine's documented mechanics), "where is the carbon-
price gap largest relative to NZE 2030 needs?" (`carbon-price-gap` per country),
"what does our portfolio's jurisdiction mix imply?" (`portfolio-impact` +
`assess-jurisdiction`), with factual questions ("when is Germany's coal phase-out?")
answered from the curated table with `as_of` cited.

**How.** Tool schemas over the tracker POSTs and Radar GETs; the validator on every
score, gap, and $ figure; the system prompt separates three knowledge classes —
curated fact, engine computation, and CAT third-party assessment — so answers
attribute correctly; refusal on election/policy prediction.

**Prerequisites.** Evolution A's route fix (a copilot calling a failing endpoint
inherits the 500); curation vintages so stale facts are flagged. **Acceptance:**
every scored answer reproduces via direct POST; factual answers cite table rows with
dates; asked "will the EU raise its 2035 target?", the copilot reports the current
curated status and declines to forecast.
