## 9 · Future Evolution

### 9.1 Evolution A — Estimate the GPR-to-ESG sensitivity regression and de-duplicate the code (analytics ladder: rung 1 → 2)

**What.** §7 flags a double defect. (1) The guide describes a geopolitical-ESG sensitivity regression — `ΔESG_i = α + β_geo·GPR + β_sanction·Sanction + ε` estimating an ESG-score beta to the Caldara-Iacoviello GPR index, plus resource-nationalism scoring and GPR-shock ESG drawdown — but none is implemented. (2) The page's code body is byte-identical to `geopolitical-ai-gov`: same 14-country `GEO_RISK` table, same seeded AI/cyber/breach scoring, same `portTechGov` composite, so the route renders an AI/tech-governance scorecard under an ESG-sensitivity title. Evolution A splits the modules and builds this one's real method: a panel regression of holding ESG scores on the GPR index with a sanctions dummy, producing a β_geo that quantifies ESG erosion per 100-point GPR increase, driving a scenario-based ESG-impact estimate.

**How.** (1) Fork the shared code so `geopolitical-esg-hub` becomes its own vertical. (2) A backend route estimating `ΔESG = α + β_geo·GPR + β_sanction·Sanction` (statsmodels) over holdings' ESG scores against the GPR series and sanctions flags, reporting β with standard errors. (3) A GPR-shock scenario applying the fitted β to project ESG drawdown; a resource-nationalism score from sovereign resource-dependence data.

**Prerequisites.** Real holding ESG scores (MSCI-style, via the company master) and the live Caldara-Iacoviello GPR series rather than the static `gpr` field; the code de-duplicated from `geopolitical-ai-gov`. **Acceptance:** β_geo is estimated with reported significance; a GPR shock produces an ESG drawdown reproducing the fitted model; the two geopolitical routes no longer present identical numbers.

### 9.2 Evolution B — Geopolitical-ESG scenario copilot (LLM tier 2)

**What.** A copilot for ESG-integration desks: "if the GPR index spikes 150 points on a Taiwan-Strait scenario, how much does our portfolio ESG score erode, and which sanctioned holdings drive it?" tool-calls the Evolution A regression and scenario endpoints, narrating the β_geo-driven drawdown and sanctions-weighted exposure.

**How.** Tier-2 tool-calling over the sensitivity/scenario endpoints; the grounding corpus is §5/§7 (Caldara-Iacoviello GPR, MSCI ESG, UNPRI sovereign-ESG, resource-nationalism framing are cited). The copilot's guardrail, pre-Evolution-A: because §7 shows no regression exists and the page duplicates another module, it must refuse ESG-sensitivity questions and disclose the duplication. Post-Evolution-A, every β, drawdown, and exposure figure is validated against tool output.

**Prerequisites.** Evolution A (no regression today); corpus embedding; per-module tool allowlist. **Acceptance:** post-Evolution-A, every ESG-erosion figure traces to a tool call citing the fitted β; pre-Evolution-A the copilot declines the sensitivity computation and flags that the route currently mirrors `geopolitical-ai-gov`.
