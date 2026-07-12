## 9 · Future Evolution

### 9.1 Evolution A — Calibrate the WACI→transition-risk mapping and close the ECL loop (analytics ladder: rung 2 → 3)

**What.** This engine wires PCAF financed-emissions analytics into the IFRS 9 ECL climate
overlay: it maps a `PCAFInvesteeProfile` (WACI, DQS, implied temp, SBTi) to `ECLClimateInputs`
via `transition_risk_score = min(100, 15·log10(WACI+1) + 5)`, DQS→confidence weights
(1→1.00 … 5→0.30), and a temperature-bucket→NGFS scenario-weight vector, aggregating to
exposure-weighted portfolio confidence and transition score. The log10 transition-risk curve
and the confidence weights are platform calibrations without empirical anchoring, and §4.2
shows the `/bridge` POST endpoints trace `skipped`. Evolution A calibrates and closes the loop.

**How.** (1) Calibrate the `15·log10(WACI+1)+5` mapping and carbon-price sensitivity against
observed credit-migration or spread data by sector, rather than an unanchored transform —
this is the load-bearing link between emissions and credit loss. (2) Verify the bridge
actually feeds the downstream ECL engine end-to-end (the `bridge-from-db` path reading
`pcaf_investees`/`pcaf_portfolios`) and confirm the POST endpoints work. (3) Align the
temperature→scenario-weight vector with the platform's canonical NGFS source (the
`ngfs_scenarios_extract` / `dh_ngfs_scenario_data` reconciliation). (4) Bench-pin the
transition-score and portfolio aggregation.

**Prerequisites.** A credit-outcome dataset for calibrating the WACI→risk curve (thin — may
stay literature-anchored with honest labelling); working `/bridge` endpoints; NGFS source of
truth. **Acceptance:** the transition-risk mapping carries calibration provenance; a bridged
investee's climate inputs measurably move the ECL engine's output; bench pins reproduce the
score and portfolio averages.

### 9.2 Evolution B — Financed-emissions-to-credit-risk copilot (LLM tier 2)

**What.** A copilot that explains the bridge: "this investee's WACI of 420 tCO₂e/€M maps to a
transition-risk score of 44 (medium); its DQS-5 data means only 30% confidence; under your
portfolio's 2.4°C implied temperature the ECL overlay weights the disorderly scenario at X%" —
each figure from a tool call, connecting emissions to credit provisioning.

**How.** Three POST bridge endpoints plus three reference GETs (scenario-weights,
transition-risk, dqs-confidence) that ground every mapping. The copilot's value is
*explaining the linkage* auditors question — why a high-emissions investee raises ECL — using
the documented log10 curve and confidence weights. What-ifs ("what if this investee gets
verified emissions data?") re-run statelessly. Bridges the `pcaf_asset_classes` and
credit-risk copilots.

**Prerequisites.** Evolution A's endpoint fix and calibration — narrating an unanchored
mapping as a credit-risk driver needs the honest caveat that it's platform-calibrated.
**Acceptance:** every score, confidence weight, and scenario weight traces to a tool response;
the copilot labels the WACI→risk mapping as calibrated-heuristic until Evolution A anchors it;
it refuses to state an ECL figure the bridge itself doesn't produce (it produces inputs, not
the provision).
