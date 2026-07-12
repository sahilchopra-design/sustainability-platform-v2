## 9 · Future Evolution

### 9.1 Evolution A — Evidence-linked checklist auto-assessment and quantified uncertainty (analytics ladder: rung 1 → 3)

**What.** The `RICSESGEngine` produces the ESG apparatus a RICS Red Book valuation requires: an
auto-assessed 23-item checklist across six RICS/IVSC standards (PS1, PS2, VPS4, VPGA12, VPG3, IVS),
a weighted materiality assessment, a VPG3 valuation-uncertainty estimate, and a generated narrative.
Scoring is `compliance% = compliant/total × 100` with bands, and uncertainty is
`clamp(10 + data-gap add-ons + adjustments, 5, 30)`. The checklist compliance is caller-asserted
per item, materiality uses fixed weights, and §4.2 shows `POST /compliance` traces **failed**.
Evolution A grounds the assessment in the platform's real property data.

**How.** (1) Auto-assess checklist items from evidence the platform already holds — VPS4's
transition-risk and physical-risk items from `re_clvar`/`real_asset_decarb`, EPC/energy items from
the `uk_epc` module — so items are evidence-backed with a provenance flag, not manual ticks. (2)
Calibrate the VPG3 uncertainty add-ons against observed valuation dispersion for data-sparse
assets, so the ±% band reflects real comparables scarcity. (3) Fix the failing `/compliance`
endpoint. (4) Bench-pin the compliance banding and uncertainty clamp.

**Prerequisites.** Links to `re_clvar`/`real_asset_decarb`/`uk_epc` for evidence; a valuation-
dispersion source for uncertainty calibration; `/compliance` repaired. **Acceptance:** checklist
items auto-populate from platform data with provenance where available; the uncertainty band is
calibrated, not a fixed base+add-on; `/compliance` returns `passed`; banding bench-pinned.

### 9.2 Evolution B — Red Book ESG-compliance copilot for valuers (LLM tier 2)

**What.** A copilot that runs `/compliance` and explains the verdict — "your valuation is
`substantial` (82%) not `full` because two VPS4 items (quantified ESG adjustments, transition-risk
link) are non-compliant; VPG3 uncertainty is ±14%; here's the remediation and draft narrative" —
each figure from a tool call.

**How.** Three endpoints (`/compliance`, `/checklist`, `/materiality`) form a compact tool set; the
23-item checklist and materiality factors are the grounding corpus, so the copilot cites the exact
RICS/IVSC standard behind each item. The generated ESG narrative is a natural tier-2 output the
copilot refines. Cross-links to the real-estate valuation and CLVaR copilots for the underlying
figures. Node for a valuation/real-estate desk.

**Prerequisites.** Evolution A's `/compliance` fix is mandatory — a copilot narrating a
compliance verdict from a failing endpoint would fabricate; auto-assessment strengthens grounding.
**Acceptance:** every checklist item, compliance %, and uncertainty figure traces to a tool
response; the copilot distinguishes auto-assessed (evidence-backed) from caller-asserted items; it
cites the RICS standard per item and refuses to assert Red Book valuation sign-off (a valuer
judgement).
