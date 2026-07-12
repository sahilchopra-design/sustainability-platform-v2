## 9 · Future Evolution

### 9.1 Evolution A — Fix the broken POST, render the engine, add the missing statements (analytics ladder: rung 2 → 3)

**What.** §7 documents a three-part gap on a strong foundation. The engine (E86) is
real and deterministic — IFRS S2 §29 effect quantification, IAS 36 indicator testing,
IAS 37 carbon provisions, stranded-asset write-downs, scenario-adjusted P&L behind
six POST routes and four passing ref GETs — but (1) the page fires `POST /assess` and
**discards the response**, even sending `entity_name` where the model requires
`entity_id` so the call can 422 silently, rendering seeded demo numbers instead;
(2) the engine has no IFRS 9 ECL overlay and no hazard-based damage provision despite
the guide claiming both; (3) no cash-flow statement exists. Evolution A: fix the
request payload and render engine output (deleting the `seed()` KPIs); then extend
the engine with the cash-flow view (decarbonisation capex schedule from the existing
scenario-adjusted P&L terms); reconcile the guide on the ECL/hazard claims — either
implement or excise.

**How.** (1) Payload fix + response binding is hours, not weeks, and converts a
tier-A module from demo to functional; lineage fixtures move the six POSTs to
`passed`. (2) Cash-flow statement derived from the engine's income/balance-sheet
effects (the `bs_m = income_m × 0.6` capitalisation split already implies the capex
line). (3) The engine's model coefficients (0.12 EBITDA relevance, 3% asset physical
base) documented per §8 model-card convention with sensitivity display.

**Prerequisites (hard).** The silent-422 wiring bug is a documented defect and step
one; guide reconciliation on IFRS 9/hazard claims mandatory. **Acceptance:** every
number in the five tabs matches an engine response field; the 422 path is impossible
(schema-validated client); a fixture entity's assessment is reproducible via direct
POST.

### 9.2 Evolution B — ISSB S2 disclosure-drafting analyst (LLM tier 2)

**What.** The module's end product is disclosure narrative — IFRS S2 requires
quantitative financial-effect disclosure with methodology explanation, and the engine
computes exactly those effects. A tier-2 analyst runs the assessment as tool calls
(`/assess`, `/ifrs-s2-effects`, `/ias36-impairment`, `/carbon-provisions`,
`/stranded-assets`) and drafts the S2 §29 disclosure text around the returned
figures: effect categories from the `/ref/financial-effect-categories` taxonomy,
impairment indicators from the ref list, every monetary amount validator-checked
against tool outputs.

**How.** Tool schemas from the six POSTs + four ref GETs per the atlas endpoint map;
drafting templates structured by the S2 pillar taxonomy the engine already encodes;
the no-fabrication validator in hard-fail mode (this is regulatory disclosure);
model-coefficient caveats from Evolution A surface as methodology notes in the draft
— S2 requires disclosing estimation approaches, and the engine's coefficients are the
estimation approach.

**Prerequisites (hard).** Evolution A's wiring fix first — an LLM narrating the
current page would describe seeded numbers the engine never produced (the exemplar
module's exact failure mode). **Acceptance:** a drafted disclosure contains only
engine-returned amounts with methodology notes; human sign-off gates export;
re-running with identical inputs yields identical draft numbers.
