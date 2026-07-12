## 9 · Future Evolution

### 9.1 Evolution A — Connect IRR to the revenue stack and discretise the ITC tiers (analytics ladder: rung 1 → 2)

**What.** The §7 mismatch flag identifies the core defect: the guide implies IRR should derive from the computed `revenueStack.energy/capacity/ancillary`, but `irrWithStorage = irrBase + 1.5 + sr(i×29)×2.0` is an **independent random draw** disconnected from the revenue figures on the same row — a project's displayed revenue stack and its IRR uplift cannot be reconciled. A second gap: `totalItcPct = 30 + itcAddedPct` draws the adder as a continuous random value instead of mapping to the discrete `ITC_TIERS` (10/10/20) the module correctly documents. The good news is `ITC_TIERS` itself faithfully encodes the real IRA §48E adder structure. Evolution A wires IRR to the revenue stack and makes the ITC discrete.

**How.** (1) Build a real project-finance calculation: revenue stack (energy arbitrage + capacity + ancillary) net of opex and debt service → project and equity IRR, so `irrWithStorage` is *derived*, and the storage uplift is exactly the ancillary/capacity revenue the battery adds. (2) Replace the continuous `itcAddedPct` draw with discrete tier selection from `ITC_TIERS` (domestic content +10, energy community +10, low-income up to +20), so the ITC stack matches the statutory structure. (3) Scenario the merchant P90/P50 revenue cases the overview promises against real market price bands (PJM/MISO/CAISO). (4) Storage-duration optimisation: sweep battery MWh and show the IRR-maximising duration.

**Prerequisites.** Market price assumptions per ISO (illustrative bands acceptable if cited); the synthetic `PROJECTS` roster should be seedable from real project parameters. **Acceptance:** IRR uplift equals the incremental storage revenue divided through the model, not a random draw; ITC stack takes only discrete tier values; duration sweep produces an optimum.

### 9.2 Evolution B — IRA-stacking and revenue-optimisation copilot (LLM tier 1)

**What.** A copilot for the developer/tax-equity/lender users: "what's my total ITC if this project is in an energy community with domestic-content modules?", "how much does 4-hour storage add to IRR vs 2-hour?", "decompose this project's revenue stack" — answered from the `ITC_TIERS` structure and, post-Evolution-A, the connected revenue/IRR model.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-plus-storage-finance/ask`, corpus = this Atlas record (the §48E adder structure, FERC Order 841, NREL Storage Futures taxonomy) plus live page state. ITC-stacking answers walk the discrete tiers and cite each adder's eligibility rule; revenue and IRR answers narrate the computed model. The copilot flags the honest caveat (pre-Evolution-A) that IRR and revenue don't yet reconcile.

**Prerequisites (hard).** Evolution A — narrating the current disconnected IRR would present a random number as if it followed from the revenue stack, exactly the reconciliation failure the §7 flag warns about. **Acceptance:** every ITC and IRR figure traces to the computed model; ITC answers use only discrete tier values; a location's adder eligibility cites the governing rule.
