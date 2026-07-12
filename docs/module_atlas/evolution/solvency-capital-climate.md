## 9 · Future Evolution

### 9.1 Evolution A — Replace the flat climate loading with scenario-derived module shocks (analytics ladder: rung 1 → 3)

**What.** This tier-B module is more sophisticated than its guide claims: §7 shows it implements a genuine Solvency II Basic SCR aggregation (`BSCR = √(Σᵢⱼ ρᵢⱼ·SCRᵢ·SCRⱼ)` across 7 risk modules with a real correlation matrix), loss-absorbing capacity for deferred tax and technical provisions, and an MCR floor/cap corridor — structurally faithful to the standard formula. Its single weak link (§7 flag) is that the `climateLoading` is a flat synthetic 5–45% random draw per entity, not derived from the EIOPA/NGFS scenario shocks the module names or from the entity's own NatCat SCR. Evolution A makes the climate stress real while keeping the correct SCR machinery.

**How.** (1) Derive `climateLoading` per SCR module from the actual EIOPA 2022 climate-stress shock parameters: transition-risk shocks to the market-risk module (equity/spread/property haircuts by NACE sector), physical-risk claims inflation to the non-life underwriting module under RCP 8.5. (2) Recompute stressed BSCR through the existing aggregation formula with the shocked module inputs — so the climate SCR delta flows through the real correlation structure, not a scalar multiplier. (3) Calibrate the correlation matrix and LAC rates to EIOPA-published values (currently illustrative). (4) Bench-pin a known EIOPA reference insurer.

**Prerequisites.** EIOPA 2022 stress-test shock parameters need encoding per module/sector; the 50 synthetic insurers should be seedable from realistic balance-sheet structures. **Acceptance:** the climate SCR delta is reproducible from the scenario shocks applied to specific SCR modules, not a flat loading; changing the scenario changes which modules are stressed and by how much.

### 9.2 Evolution B — ORSA climate-stress copilot (LLM tier 1)

**What.** A copilot for the insurer capital-planning / ORSA use case: "how much does the disorderly scenario add to our SCR?", "which risk module drives the climate capital impact?", "are we above the Solvency II 100% threshold under stress?" — answered from the BSCR aggregation output, the LAC/MCR corridor, and the multi-framework threshold table (Solvency II / NAIC RBC / APRA LAGIC / BMA / IAIS ICS), never inventing capital figures.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solvency-capital-climate/ask`, corpus = this Atlas record (§7.1 BSCR formula, the module structure, EIOPA/NGFS framework notes) plus live page state. Capital-impact answers decompose the SCR delta by risk module; threshold answers cite the correct jurisdiction-specific trigger (NAIC's 200%/150% two-tier vs Solvency II's single 100%). The copilot flags (pre-Evolution-A) that the climate loading is a generic factor rather than scenario-specific.

**Prerequisites.** Evolution A lets the copilot attribute the SCR delta to real scenario shocks rather than caveating a flat loading. **Acceptance:** every SCR/solvency-ratio figure traces to the aggregation output; threshold verdicts cite the entity's actual regulatory framework; a jurisdiction outside the 5-framework table returns a scoped answer.
