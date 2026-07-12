## 9 · Future Evolution

### 9.1 Evolution A — Calibrate enforcement probabilities against real case data (analytics ladder: rung 2 → 4)

**What.** The E35 engine converts compliance scores and turnover into expected EU ESG penalty
exposure across five regimes (CSRD, SFDR, EU Taxonomy, EUDR, CSDDD), plus a whistleblower score
and remediation plan. Formulas: `expected_penalty = max_penalty × enforcement_factor × severity`,
`enforcement_factor = intensity × (100−compliance)/100` with a **default intensity of 0.40**, and
a portfolio "no-pile-on" cap at 10% of turnover. The enforcement intensity, severity multipliers,
sector/jurisdiction premiums, and even the imputed `violation_count = ⌊(100−compliance)/10⌋` are
platform assumptions. The persisted-assessment reads (`/assessment/{id}`, `/assessments/{entity}`)
trace **failed**. Evolution A grounds the probabilities and fixes persistence.

**How.** (1) Calibrate the enforcement intensity (0.40) and jurisdiction premiums against actual
EU ESG enforcement data — published fines and case frequencies per regulator — replacing the
uniform default with regime- and jurisdiction-specific base rates plus a model card. (2) Ground
severity multipliers in observed penalty-vs-violation relationships. (3) Add a predictive
enforcement-likelihood model layered on the enforcement-timeline data the module already serves
(rung 4). (4) Fix the assessment persistence path and bench-pin the expected-penalty and
whistleblower formulas.

**Prerequisites.** An EU enforcement-case dataset for calibration (external — may stay
literature/assumption-anchored with honest labelling); assessment persistence repaired.
**Acceptance:** enforcement factors are regime/jurisdiction-calibrated with provenance, not a flat
0.40; `/assessment/{id}` returns `passed`; expected-penalty and whistleblower scores bench-pinned;
the 10% turnover cap retained.

### 9.2 Evolution B — Regulatory-exposure copilot for compliance officers (LLM tier 2)

**What.** A copilot that runs `/assess` and explains exposure — "at 62% CSRD compliance your
expected penalty is €X (capped by the 10%-turnover pile-on limit); enforcement probability is
elevated in [jurisdiction]; here's the remediation priority order" — each figure from a tool call.

**How.** Three POST endpoints (`/assess`, `/regulation-penalty`, `/whistleblower-risk`) plus
reference GETs (regulations with statutory caps, authorities, enforcement-timeline) that ground
every regime's penalty basis and supervisory body. The copilot decomposes exposure per regime and
explains the enforcement-factor logic; what-ifs ("what if we raise SFDR compliance to 90%?") re-run
statelessly. Cross-links to the framework-completeness copilots (`regulatory_reports`, `sfdr_annex`)
that feed the compliance scores.

**Prerequisites.** Evolution A's calibration — narrating expected penalties from an uncalibrated
0.40 intensity as risk figures needs the honest caveat; persistence fix for saved assessments.
**Acceptance:** every penalty, probability, and premium traces to a tool response; the copilot
labels enforcement figures as assumption-calibrated until Evolution A; it cites the statutory cap
and authority per regime from the reference endpoints and refuses to give legal advice, framing
output as model-based exposure estimates.
