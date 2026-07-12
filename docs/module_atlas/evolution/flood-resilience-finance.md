## 9 · Future Evolution

### 9.1 Evolution A — Compute AAL and BCR instead of storing them (analytics ladder: rung 1 → 2)

**What.** §7 flags four unimplemented formulae: the exceedance-probability AAL integral (`AAL = Σ P_exc × Loss_RP × dP`), the benefit-cost ratio (`BCR = PV_LossAvoided/(CapEx + PV_OpEx)`), the NbS BCR with ecosystem+carbon co-benefits, and the adaptation IRR. Today `annualLoss`, `adaptCost`, `bcr` are stored per city, `exampleBCR` is stored per intervention, and the loss-return-period table is a static matrix — the only live maths is summing city AAL and averaging BCR. Evolution A makes the four formulae real: integrate AAL from the RCP-scenario loss-return-period matrix the module already carries, and compute each intervention's BCR from PV of loss avoided over CapEx plus PV of maintenance, with the NbS variant adding ecosystem-service and carbon value.

**How.** (1) `AAL = Σ (1/RP_i − 1/RP_{i+1})·0.5·(Loss_i + Loss_{i+1})` over the existing `LOSS_SCENARIOS` matrix, per city and per RCP. (2) BCR from `protection100yr`-implied loss-avoided against `capexM + PV(annualMaint over lifeYears)`; NbS BCR adds carbon value at a documented shadow price and an ecosystem-service term. (3) Adaptation IRR solves NPV=0 over asset life. The BCR screener then filters on computed, not stored, ratios.

**Prerequisites.** The stored `bcr`/`exampleBCR` constants demoted to validation checks; carbon and ecosystem-service prices as documented assumptions. **Acceptance:** an intervention's BCR recomputes from its CapEx/maintenance/protection fields and matches the §5 formula; changing the discount rate or RCP scenario moves AAL and BCR by hand-verifiable amounts.

### 9.2 Evolution B — Adaptation-finance structuring copilot (LLM tier 1 → 2)

**What.** A copilot for DFI and municipal users: "which interventions clear a 5× BCR under RCP 8.5 for Jakarta within a $500M budget, and which blended-finance structure fits?" Tier-1 narrates the city rankings, intervention screener, and the four finance structures (green bond/parametric/CAT DDO/MDB) from the atlas corpus; tier-2 runs the Evolution A AAL/BCR/IRR endpoints so the screening and prioritisation are computed.

**How.** Tier 1 grounds on §5/§7 (World Bank/GCA benefit-cost methodology, UNEP Adaptation Gap, IPCC RCP scenarios, NbS valuation are all cited), with a guardrail that current BCRs are stored constants pre-Evolution-A. Tier 2 tool-calls the BCR screener and IRR solver, and matches interventions to finance structures using the module's own finance-structure descriptions. Numbers validated against tool output.

**Prerequisites.** Evolution A for computed screening; corpus embedding; per-module tool allowlist. **Acceptance:** a prioritisation answer's BCR and IRR figures each trace to a tool call; the global headline figures ($280Bn loss, $194Bn UNEP gap) are cited as external references, never presented as module computations.
