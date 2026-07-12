## 9 · Future Evolution

### 9.1 Evolution A — Compute SMR LCOE instead of hand-entering it (analytics ladder: rung 1 → 3)

**What.** §7 confirms this is primarily a curated static reference for five real SMR programmes (NuScale VOYGR, BWRX-300, Rolls-Royce SMR, Xe-100, Natrium) with factually accurate vendor/TRL/regulatory detail (NuScale NRC design-certified 2023, RR ONR GDA Step 3), plus one lightweight radar normalisation. Critically, the `lcoe2024/2030/2040` figures are hand-entered per design, not computed — unlike the sibling `nuclear-lcoe-economics`, which has a real annuitized-LCOE engine. Evolution A connects the two so SMR LCOE is derived, and the radar reflects computed economics.

**How.** (1) Feed each SMR design's capex/opex/fuel/capacity-factor into the `nuclear-lcoe-economics` engine (the real annuitized model with IDC compounding already exists — reuse it rather than hand-typing LCOE) so `lcoe2024→2040` becomes computed output, with the 2030/2040 decline driven by a factory-learning curve rather than three hand-set numbers. (2) The radar-chart `Cost` axis (`100 − lcoe2030`) then reflects a real LCOE, and the arbitrary `Capacity: totalMW/5` and `Timeline: 100 − mo×2` scalings get principled 0–100 normalisations. (3) Keep the accurate regulatory-status and TRL data as-is (it is real and valuable) but tag each with its source and date.

**Prerequisites.** Consuming the `nuclear-lcoe-economics` engine (shared dependency — pin both before wiring); per-design capex/opex inputs sourced to vendor disclosures or NEA estimates rather than back-solved from the hand-entered LCOE. **Acceptance:** each SMR's LCOE reproduces from its cost inputs via the shared engine; the 2040 figure derives from a learning curve; the radar Cost axis tracks computed LCOE.

### 9.2 Evolution B — SMR-diligence copilot with bull/bear framing (LLM tier 1 → 2)

**What.** A copilot for the investment-thesis workflow §1 describes: "compare NuScale and BWRX-300 on cost and regulatory maturity", "what's the bear case on Natrium?", "which SMRs are furthest along NRC approval?" — grounded in the five designs' real technical/regulatory data and (post-Evolution-A) their computed LCOE.

**How.** Tier 1 works now on the accurate static data: system prompt from this Atlas page's design table (§7.1) plus the WNA/NRC/ONR references named in §5; the copilot compares designs citing real TRL, regulatory status, and configuration facts, and articulates bull/bear cases from the module's own investment-thesis content. Tier 2, post-Evolution-A: tool calls to the shared LCOE engine for computed cost comparisons and sensitivity, with the fabrication validator matching every $/MWh to a tool response. The copilot must distinguish real regulatory milestones (NuScale certified, RR GDA Step 3) from projected timelines, and refuse to predict approval dates.

**Prerequisites.** Tier 1 on current data; computed cost comparisons need Evolution A. The copilot must not present hand-entered LCOE as modelled until then. **Acceptance:** design comparisons cite real regulatory/TRL facts; LCOE comparisons (post-Evolution-A) trace to engine calls; refusal on speculative approval-date questions.
