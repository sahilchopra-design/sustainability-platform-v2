## 9 · Future Evolution

### 9.1 Evolution A — Discounted stranded-asset NPV and biomethane IRR (analytics ladder: rung 2 → 3)

**What.** §7 credits this module with real European gas-network data (8 DSOs/TSOs with real RAB, length, connections) and an exactly-implemented HHV-reduction formula (`hhv = h2_pct × 0.37`), but flags that the guide's discounted stranded-asset NPV (`Σ RAB_decline_t × WACC / (1+r)^t`) is simplified to a linear `RAB × declineRate × years × factor` heuristic with no discounting or WACC term, and blending/demand figures carry small `sr()` noise. Evolution A implements the proper discounted models: stranded-asset NPV as a real DCF over the demand-decline trajectory with a WACC input per network's regulatory regime (Ofgem RIIO-GD2 vs continental), and biomethane IRR (`Σ Tariff·GWh_t/(1+r)^t − Capex`) computed rather than stored, so the 2030/2035/2040 horizon comparison reflects time value.

**How.** (1) Replace the linear stranded heuristic with `Σ_t (RAB_decline_t · WACC)/(1+r)^t`, RAB_decline driven by the per-network demand-decline rate. (2) Compute biomethane IRR from the pipeline's tariff/capacity/capex fields via the platform's IRR routine. (3) Remove the `sr()` noise on blending economics — the H2-price/CH4-price spread is deterministic given inputs. (4) H2-blend cost uplift from the guide's `H2_Pct·(H2_Price − CH4_Price)/Gas_LHV_Mix`.

**Prerequisites.** Per-network WACC/regulatory parameters; the small `sr()` noise removed. **Acceptance:** stranded NPV changes with discount rate and horizon reproducing the DCF; two networks with identical RAB but different decline rates show different NPV; biomethane IRR recomputes from pipeline inputs.

### 9.2 Evolution B — Gas-to-hydrogen transition copilot (LLM tier 1 → 2)

**What.** A copilot for infra-debt and transition-advisory users: "what's Gasunie's stranded-RAB exposure at 2040 and how does converting the backbone to pure H2 change it?" Tier-1 narrates the network readiness scorecard, decarbonisation pathways, and H2/biomethane context from the atlas corpus; tier-2 runs the Evolution A NPV/IRR endpoints and the H2-blend model so stranded-asset and blend-cost what-ifs are computed.

**How.** Tier 1 grounds on §5/§7 (Ofgem RIIO-GD2, EU Hydrogen Strategy, European Hydrogen Backbone, the HyWay27 example are documented), and since HHV and readiness scoring are already real, an explainer ships before backend work. Tier 2 tool-calls the stranded-NPV and blend endpoints; the blend-level slider becomes a tool parameter. Every RAB, NPV, and cost-uplift figure validated against tool output.

**Prerequisites.** Evolution A for discounted what-ifs; corpus embedding. **Acceptance:** stranded-asset and blend figures in a copilot answer trace to tool calls; asked for a regulatory-approval probability for H2 capex (not modeled), the copilot refuses and points to the regulatory-status fields as the qualitative view.
