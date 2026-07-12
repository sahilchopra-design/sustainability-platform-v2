## 9 · Future Evolution

### 9.1 Evolution A — Reconcile the loss constants and back the cost model with real data (analytics ladder: rung 2 → 3)

**What.** §7 shows a genuinely correct engineering engine: three-phase current (`I = P/(√3·V)`), AC cable I²R loss, HVDC terminal + linear cable loss, AC-vs-HVDC cost breakeven (~80km at 1GW), and MTBF availability — all matching the guide's physics. Two honest gaps flagged in §7.2: the HVDC cable-loss slope is coded 0.0020%/km while the guide's own text says ~0.003%/km (unreconciled), and the cost inputs (PPA `55 + sr()×30`, install cost `distance×cables×0.8`, HVDC 30% premium) are synthetic demo values. Evolution A reconciles the physics constants and grounds the economics.

**How.** (1) Resolve the loss-slope discrepancy — pick the CIGRÉ/DNV-sourced value and cite it, so the AC-vs-HVDC crossover is defensible (the breakeven distance is sensitive to this). (2) Replace synthetic cost inputs with a real submarine-cable + converter-station cost reference table (WindEurope/DNV cost benchmarks named in §5), dated and sourced. (3) Fault rates already reference CIGRÉ TB 379 (~0.08 faults/100km/yr HVDC) as the benchmark in §7.2 — wire that real figure into the availability model rather than a seed input. Backend-optional; can stay tier-B if inputs move to a sourced reference and the physics is unit-pinned.

**Prerequisites.** Cost-benchmark data (WindEurope/DNV — partially public); a `bench_quant` pin on the I²R loss and breakeven for a known 1GW/220kV case. **Acceptance:** HVDC loss slope matches its cited source; breakeven distance reproduces a published reference case; cost inputs carry provenance, not `sr()`.

### 9.2 Evolution B — Grid-connection design copilot (LLM tier 2)

**What.** A copilot for the offshore-grid-engineer users §1 targets: "AC or HVDC for a 1.2GW farm 90km offshore?", "size the export cable for 1GW at 220kV and give me the annual loss cost", "what platform type at 55m depth?" — executed against the engine's real functions (cable loss, breakeven, availability, platform selection), decomposing each answer into the physics terms.

**How.** Tool calls to endpoints wrapping `cableLoss`, the breakeven calc, and the platform-selection logic; system prompt from this Atlas page's §5 formula set and the ENTSO-E RfG / IEC 60228 / CIGRÉ references named in §5 so grid-code and cable-standard answers cite the right document. The AC/HVDC recommendation is a tool call returning the breakeven comparison, not an LLM judgment; sensitivity questions (distance, voltage, loading) are recomputations. Fabrication validator matches every loss %, breakeven km, and cost to a tool response; the copilot must convey that this is pre-FEED-grade (replacing PSCAD/DIgSILENT screening, not detailed design, per §1).

**Prerequisites.** Compute endpoints; Evolution A for defensible cost/loss figures. **Acceptance:** every engineering figure traces to a tool call; AC/HVDC recommendations cite the breakeven; grid-code answers cite the applicable standard; the copilot flags pre-FEED scope.
