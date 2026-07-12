## 9 · Future Evolution

### 9.1 Evolution A — True disclosure-coverage math and regulator-grade export (analytics ladder: rung 2 → 3)

**What.** The studio already computes real portfolio metrics (WACI, 18 advanced KPIs) and
carries NGFS scenario shock tables — rung 2 — but §7.5 lists the honest gaps: the guide's
`Coverage_score = Disclosed/Required × 100` is **not implemented** (`dataCoverage` measures
emissions-data availability, not disclosure coverage), Scope 3 in narratives is a flat
×3.2 multiplier, implied temperature is a 5-bucket WACI lookup rather than an ITR model,
the PCAF DQ score is a hard-coded 2.3 in text, and exports are HTML/Markdown despite the
guide promising XBRL/JSON. Evolution A implements per-framework disclosure registries
(ESRS Set 1 datapoints, ISSB S2 metric categories, SFDR PAI Annex I items) as reference
tables, computes real disclosed/required coverage with mandatory-item gap flags, and adds
a structured JSON export keyed to those datapoint IDs (XBRL tagging as the stretch goal).

**How.** `report_frameworks` + `framework_datapoints` tables seeded from the cited
standards (ESRS EU 2023/2772 numbering already used in the E1-4/E1-6 slots); a coverage
engine walks the assembled report's populated blocks against required datapoints per
framework. Calibration (rung 3) comes from replacing the WACI-bucket implied temperature
with the platform's benchmark data via the `/api/v1/pcaf/advanced/indices` +
`/nze-pathways` endpoints, and computing PCAF DQ from holdings' actual data tiers instead
of asserting 2.3.

**Prerequisites.** Demo holdings clearly labelled as hand-authored approximations of
Indian large-caps (§7.5); compliance-language templates ("compliant"/"partial") reworded
until coverage math exists — asserting compliance from unimplemented math is the module's
biggest credibility risk. **Acceptance:** removing a mandatory ESRS E1-6 block drops the
CSRD coverage score and raises a gap flag; the JSON export validates against the datapoint
registry; PCAF DQ changes when holdings' data quality changes.

### 9.2 Evolution B — Render layer for LLM-drafted, engine-sourced narratives (LLM tier 3)

**What.** The productization roadmap explicitly names the report studio as the render
layer for desk-orchestrator output. Evolution B makes each disclosure block's narrative
LLM-drafted but engine-sourced: the orchestrator pulls WACI/CVaR/TRI from
`computeAdvancedKPIs`, NGFS stress results from the scenario tables, and financed-
emissions attribution from the PCAF endpoints, then drafts the SFDR PAI-2 or ISSB S2-M1
narrative around those exact values — replacing today's fixed string-interpolation
templates with framework-toned prose that still contains only computed numbers.

**How.** Per-block drafting tool: input = block's framework datapoint ID + the computed
metric payload + the framework's disclosure requirements from Evolution A's registry;
output = narrative with every numeric span annotated to its source metric (the
no-fabrication validator rejects unannotated numerics). Cross-module sourcing uses the
tier-3 routing artifacts (module_tags.json, Atlas interconnection graph) so a physical-
risk paragraph cites the digital-twin engine rather than this page's stylised sector
shocks. Human-in-the-loop: drafts land as suggestions with a diff view; version control
already fits the studio's audit-trail claim.

**Prerequisites (hard).** Evolution A's coverage registry (so the LLM knows what each
block must contain); the no-fabrication validator productionised; ISAE 3000 framing means
LLM drafts must be visibly marked unassured. **Acceptance:** every numeric in a generated
narrative traces to a named engine output or endpoint response; a block whose upstream
metric is unavailable renders an honest data-gap statement, never an invented figure.
