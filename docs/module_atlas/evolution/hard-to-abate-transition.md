## 9 · Future Evolution

### 9.1 Evolution A — MACC-ordered transition-investment engine with real deal cash flows (analytics ladder: rung 2 → 3)

**What.** The live math today is thin but real: a piecewise-linear abatement interpolator over the 6 hard-coded `SECTORS` and a flat `emissions × abatement × carbonPrice` overlay (rung 2, via the carbon-price slider). The 16-deal pipeline is `sr()`-seeded — IRR, DSCR, CAPEX and CI reductions are fabricated, not modelled. Evolution A implements the §8 spec as a backend vertical: a per-sector marginal-abatement-cost curve (`MAC_k = (CAPEX_k·CRF + ΔOPEX_k − carbon_saving)/abatement_k`), levers deployed in ascending MAC to hit each sector's 2030/2050 targets, and deal DSCR/IRR computed from actual CFADS schedules.

**How.** (1) Seed an abatement-lever reference table (steel H2-DRI, cement CCS/clinker substitution, SAF, ammonia shipping…) with CAPEX/OPEX/abatement from IEA ETP sector roadmaps. (2) New engine route returns the MACC, transition-investment total (`Σ CAPEX_k·capacity_k`), and lever sequencing per sector; reconcile the total against IEA's $2.4–3.5tn cumulative estimate as the calibration check. (3) Replace the seeded `DEALS` with a small deterministic deal library whose IRR/DSCR come from the cash-flow model, with SLL ratchet (3–10 bps) and greenium (5–25 bps) applied to debt margin. (4) Carbon value gains a CBAM/free-allocation phase-in instead of the flat product.

**Prerequisites.** The `sr()` deal fabrication removed (guardrail `check_no_fabricated_random.py` should then pass this page); lever library sourced and documented per §8.4. **Acceptance:** sector transition-investment totals land within the IEA range; a worked steel deal's DSCR is reproducible from its CFADS schedule, not a PRNG draw.

### 9.2 Evolution B — Transition-structuring analyst over the MACC engine (LLM tier 2)

**What.** A tool-calling analyst for banks structuring hard-to-abate instruments: "what's the cheapest path to steel's 22% 2030 target?", "at $120/t carbon, which cement levers turn NPV-positive?", "structure an SLL for an aluminium smelter with a 25% intensity KPI — what ratchet is market?" Each answer executes the Evolution A endpoints (MACC, deal cash-flow, carbon-value) and narrates real engine output with the GFANZ/CBI instrument taxonomy from this page's §5 corpus.

**How.** Tool schemas auto-generated from the new module routes via the Atlas endpoint map; per-module system prompt assembled from this page (§7.2 sector table and §8 formulas are the grounding). The no-fabrication validator checks every IRR/DSCR/MAC figure in the answer against tool outputs in the same conversation. First shippable slice is tier 1: explanation of the abatement timeline and radar from existing page state, requiring no backend.

**Prerequisites (hard).** Evolution A must ship first — today the module has no backend endpoints to call, and letting an LLM narrate the seeded deal pipeline would launder fabricated economics. **Acceptance:** every numeric traceable to a tool call; asked for a deal not in the library or a sector beyond the 6 covered, the analyst refuses rather than extrapolates.
