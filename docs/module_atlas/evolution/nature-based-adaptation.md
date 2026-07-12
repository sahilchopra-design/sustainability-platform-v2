## 9 · Future Evolution

### 9.1 Evolution A — Recompute the triple dividend from stated inputs (analytics ladder: rung 1 → 2)

**What.** This is an honest static reference module: §7 confirms all 6 NbS projects are hand-authored (no PRNG), and the page's arithmetic is genuine aggregation (portfolio sums, min-max radar scaling). The structural weakness is that the headline `BCR` is a stored per-project input, not recomputed — the guide's formula `TotalValue = ProtectionValue + CarbonValue + ΣCoBenefits; BCR = TotalValue / Cost` cannot be verified on-page because project `Cost` and the co-benefit monetisation are not decomposed into recomputable terms. Evolution A makes the module's own formula live and parameter-sweepable.

**How.** (1) Extend each `NBS_SOLUTIONS` entry with explicit `cost_m`, per-co-benefit monetised values, and the Costanza/TEEB $/ha/yr rate applied (the `ECOSYSTEM_VALUES` table already carries the rates — connect them: `carbon_value = area_ha × seq_rate × carbon_price × lifetime` per §5, computed not stored). (2) Add interactive levers — carbon price ($/tCO₂), discount rate, protection-effectiveness % — so BCR responds to assumptions; this is the rung-2 scenario capability the module lacks. (3) Cross-link protection value to the digital-twin hazard grids for the coastal projects (mangrove/coral) so avoided-loss claims cite hazard exposure rather than a bare $M assertion.

**Prerequisites.** Source citations per project for cost and protection figures (currently unattributed hand-authoring); recomputed BCRs will differ from the stored ones — reconcile or annotate deltas. **Acceptance:** each project's displayed BCR reproduces from its visible inputs via the §5 formula; moving the carbon-price slider changes carbon value and BCR ranking predictably.

### 9.2 Evolution B — NbS investment-case copilot with assumption transparency (LLM tier 1)

**What.** A copilot answering investor-facing questions from the page's own data: "why does Floodplain Reconnection rank first at BCR 10.16?", "what's the portfolio's total avoided-loss value and which SDGs does it cover?", "how sensitive is the mangrove case to the carbon price?" — grounded in the 6-project table, the `ECOSYSTEM_VALUES` $/ha/yr rates, and the Costanza et al./TEEB/IUCN references named in §5, so ecosystem-service value claims cite their published source ranges rather than free-floating numbers.

**How.** Tier 1: system prompt from this Atlas page (§5 formula, §7.2 project table) plus serialized `NBS_SOLUTIONS` and `ECOSYSTEM_VALUES`; answers decompose any quoted total into the per-project terms the page sums. After Evolution A's levers exist, sensitivity questions become parameter-swept recomputations through the live formula rather than verbal hedging. Refusal path for project-diligence questions the module cannot answer (site-specific permanence risk, implementation counterparty quality) and for projects outside the 6-entry portfolio.

**Prerequisites.** None hard for the tier-1 explainer; sensitivity answers require Evolution A. The copilot must disclose that project figures are curated reference cases, not underwritten deals. **Acceptance:** every $ figure in an answer matches a table cell or a formula recomputation; asking about a 7th project refuses rather than invents.
