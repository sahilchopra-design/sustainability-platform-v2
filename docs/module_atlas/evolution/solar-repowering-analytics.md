## 9 · Future Evolution

### 9.1 Evolution A — Derive repowering IRR from the AEP-uplift economics it already computes (analytics ladder: rung 1 → 2)

**What.** The §7 mismatch flag is the defining defect: the guide's `Repowering_NPV = ΔAEP × PPA_price × life_remaining − repowering_CAPEX` implies `repowerIrr` should follow from the computed `aepUpliftPct`, `annualRevDeltaM`, and `repowerCapexM` — but `repowerIrr` and `lifeExtIrr` are **independent `sr()` draws** disconnected from those figures. The module coincidentally lands IRRs in a plausible 7–12.5% band, but they cannot be reconciled with the project's own economics. The `AEP_UPLIFT_DRIVERS` decomposition (TOPCon +8%, tracking +5%, bifacial +4%, etc.) and `DECOMMISSION_COSTS` are genuinely useful, cited-plausible reference data. Evolution A makes the IRR real.

**How.** (1) Build the actual repowering cash flow: incremental AEP × PPA price over remaining/extended life, net of repowering CAPEX and decommissioning cost, discounted to NPV and solved for IRR — the guide's formula, implemented, so `repowerIrr` derives from the same-row inputs. (2) Make the AEP uplift additive from the `AEP_UPLIFT_DRIVERS` a user selects (which upgrades are applied) rather than a single `sr()` draw. (3) State- and ISO-specific PPA prices and capacity factors replacing the flat $50/MWh and 0.21 CF applied uniformly. (4) Recommendation logic (`Full Repower`/`Partial`/`Life Extension`) keyed to the *computed* incremental IRR versus a hurdle rate.

**Prerequisites.** PPA price and CF by state/vintage; the decommissioning and uplift tables are already present. **Acceptance:** `repowerIrr` recomputes from ΔAEP, PPA price, life, and CAPEX and matches the NPV/IRR math; selecting different uplift drivers changes both AEP and IRR; the recommendation flips at the hurdle rate.

### 9.2 Evolution B — Fleet-repowering prioritisation copilot (LLM tier 1)

**What.** A copilot for the asset-manager/owner/lender users: "which of my 2010-vintage sites are the top repowering candidates?", "what's the incremental IRR of adding trackers plus TOPCon at this site?", "should this project repower or extend life?" — answered from the computed degradation curves and, post-Evolution-A, the connected repowering economics.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-repowering-analytics/ask`, corpus = this Atlas record (§7.1 degradation and uplift model, the driver decomposition, Jordan et al. / Fraunhofer framework notes) plus live page state. Prioritisation narrates deterministic sorts over the computed IRRs; the repower-vs-life-extension recommendation reads the computed logic and cites the driving economics. The copilot decomposes the AEP uplift by driver from `AEP_UPLIFT_DRIVERS`.

**Prerequisites (hard).** Evolution A — prioritising sites by a random `repowerIrr` would produce a plausible but meaningless ranking; the copilot ships once IRR is derived. **Acceptance:** every IRR/NPV figure in an answer traces to the computed economics; the recommendation matches the computed logic; a site absent from the portfolio returns a refusal.
