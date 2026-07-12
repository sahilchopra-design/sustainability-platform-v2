## 9 · Future Evolution

### 9.1 Evolution A — Published EIOPA shocks, insurer-specific SCR decomposition, LoB granularity (analytics ladder: rung 2 → 3)

**What.** The EIOPA ORSA Climate Stress Test Engine (E7) — a Solvency II Art. 45a tester computing
asset shocks, underwriting shocks, post-stress SCR/MCR via the **regulation-accurate BSCR correlation
square-root formula** (DR 2015/35 Annex IV), an ORSA checklist and resilience verdict. It embeds a
notable documented remediation (the SCR re-aggregation replaced a linear sum that could paradoxically
*lower* SCR under stress). Already rung 2 (four NGFS-mapped scenarios). §7.5 names the deepening
targets: the scenario shock magnitudes are **synthetic calibrations** inspired by but not the published
EIOPA 2022/2023 shock tables; the SCR module decomposition weights (45/25/20/5/5) are an **assumed mix
applied to every insurer** regardless of type (a life insurer's true market share differs); reserve
deterioration is a **flat % of total TP** (dominating the worked example) with no line-of-business
granularity; and two auto-met ORSA items floor completeness at ~17%. Evolution A wires the published
EIOPA shock tables, insurer-type-specific SCR decompositions, and LoB-granular underwriting shocks.

**How.** Scenario shocks are sourced from the published EIOPA stress-test parameter tables; the SCR
module split varies by insurer type (life vs non-life vs composite) rather than a fixed 45/25/20/5/5;
`_calc_underwriting_shock` applies reserve/lapse/mortality shocks per line of business. Rung 3:
validate post-stress solvency ratios against actual EIOPA exercise results; add own-funds tiering and
risk-margin recalculation (currently omitted).

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /assess`, `/assess/batch`,
`/assess/scenario` all **failed** (need input payloads to trace); preserve the regulation-accurate
correlation matrix and the documented SCR-remediation. **Acceptance:** the §7.4 worked example
(hot_house_world composite, €1,807M loss, OF_post −€245.6M, extreme/critical) reproduces at legacy
calibrations; a life insurer's SCR decomposition differs from a non-life's; reserve deterioration
responds to LoB mix; the failing POST endpoints pass the harness.

### 9.2 Evolution B — Insurance climate-stress copilot with tool-called ORSA (LLM tier 2)

**What.** A tool-calling analyst for insurance risk/ORSA teams: "run the EIOPA climate stress test on
our balance sheet" (`/assess/scenario` or the full four-scenario run → asset/underwriting losses,
post-stress solvency ratio, SCR/MCR breach, severity), and "what's our ORSA Art. 45a checklist
completeness?" — narrating the engine's real Solvency II outputs and the resilience verdict
(resilient/vulnerable/at_risk/critical).

**How.** Tool schemas over the assess endpoints + the reference endpoints (scenarios, insurer types,
ORSA checklist, frameworks); the latter are ideal RAG grounding for "what does Art. 45a require?"
questions. The no-fabrication validator checks every loss €, solvency ratio and breach flag against
tool output; the copilot explains *why* a scenario breached SCR (the §7.4 insight: reserve
deterioration as a flat % of TP dominates) and flags that shock magnitudes are synthetic until
Evolution A wires the published tables. Composable with `banking_risk`/`basel3_liquidity` in a
prudential-desk orchestrator.

**Prerequisites.** Evolution A's harness fixes (working assess endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool
call; the post-stress solvency ratio and severity match `/assess/scenario`; the copilot names the
dominant loss driver and flags the shock calibrations as illustrative pending Evolution A; the ORSA
completeness matches the checklist.
