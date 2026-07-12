## 9 · Future Evolution

### 9.1 Evolution A — Real PD/LGD decomposition with a market-value term and a backend vertical (analytics ladder: rung 1 → 3)

**What.** This tier-B module has a genuinely strong reference layer — 80 real-named institutions across 6 real institution types and 8 jurisdictions, and 6 correctly-differentiated regulatory frameworks (ECB 2024, PRA Exploratory, OSFI B-15, Fed DFAST, APRA CPG229, MAS TRM) with plausible per-regulator thresholds and multipliers matching real relative severity. But §7 flags that the guide's `sCVaR = Σ(Exposure × PDΔ × LGD) + MarketΔ` is not implemented: `computeStress()` uses a single-factor `creditDrain = adverseMult × creditLossRate × climateExposurePct × 100` that conflates exposure, loss rate, and severity, with **no market-value term at all**, and the institution-level financials are `sr()`-synthetic. `GRADE_BASE_LOSS/ADVERSE/SEVERE` loan-grade tables are defined but possibly unused (a partially-built feature). Evolution A builds the real credit-risk decomposition and gives the module a backend.

**How.** (1) Decompose the credit loss into a true PD-migration × LGD × EAD structure (the sibling `stress-test-orchestrator` engine already has a PD-migration formula to share) and wire in the defined-but-unused `GRADE_*` loss-rate tables. (2) Add the missing `MarketΔ` term — repricing of climate-exposed holdings under the scenario. (3) Lift `computeStress` into a backend engine so the sCVaR is server-computed, auditable, and consumable, replacing `sr()` institution financials with real balance-sheet inputs where available. (4) Bench-pin against the ECB 2022 exercise structure.

**Prerequisites.** PD-migration engine reuse; LGD/EAD inputs per exposure; the `GRADE_*` tables need wiring. **Acceptance:** the sCVaR decomposes into PDΔ × LGD × EAD plus MarketΔ; the loan-grade tables feed the loss calculation; per-regulator results differ by their real threshold/multiplier parameters.

### 9.2 Evolution B — Supervisory submission-package analyst (LLM tier 2)

**What.** A tool-calling analyst for the central-bank stress-test workflow the module targets: "run the ECB 2024 scenario on this book and report CET1 depletion", "compare capital impact across ECB, PRA, and Fed thresholds", "generate the supervisory submission package" — calling the (Evolution-A) stress engine, narrating the PD/LGD-decomposed sCVaR and the per-regulator threshold breaches, never inventing capital figures.

**How.** Tier-2 pattern once the engine exists: the stress-run and comparison become tools; the copilot narrates CET1 paths, sCVaR decomposition, and which regulator thresholds are breached, citing each framework's real parameters. Submission-package drafts route to the report-studio layer per the Tier-3 composability pattern; the no-fabrication validator checks every capital/PD figure against tool output.

**Prerequisites (hard).** Evolution A — with a single-factor loss proxy, no market term, and synthetic financials, the analyst would narrate capital numbers that aren't submission-grade and lack the PD/LGD structure regulators require. **Acceptance:** every sCVaR/CET1 figure traces to an engine call with its PD/LGD decomposition; threshold-breach findings cite the regulator's real threshold; an institution without balance-sheet inputs returns "insufficient data," not a fabricated capital path.
