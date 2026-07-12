## 9 · Future Evolution

### 9.1 Evolution A — Correct the low-income adder, label CBAM speculation, and live-refresh AD/CVD orders (analytics ladder: rung 1 → 2)

**What.** This is a well-grounded tier-B policy module: `COUNTRIES` (20 rows, no `sr()`) is hand-curated real trade-policy data with verifiable figures (USA AD/CVD 254% matching the 2024 SE-Asia circumvention tariff; India BCD 40%), and the IRA ITC optimiser correctly captures the 6%-vs-30% prevailing-wage base-rate distinction that many simplified calculators omit. Three §7.6 defects need fixing: the low-income adder is hardcoded at +10% but IRC §48E(h) allows up to +20% for qualified low-income economic-benefit projects; the `cbamRisk` field treats potential future CBAM expansion to solar as if current, when solar is **not** in CBAM's product scope today; and the policy data is a static snapshot of a fast-moving landscape.

**How.** (1) Fix the low-income adder to a discrete tier reaching +20% (align with the sibling `solar-plus-storage-finance`'s correct `ITC_TIERS`). (2) Relabel `cbamRisk` explicitly as speculative/forward-looking, since solar is outside current CBAM scope (cement/steel/aluminium/fertiliser/electricity/hydrogen) — an honesty fix, not a calculation change. (3) A refresh path for AD/CVD determinations: US CBP publishes order data; a light ingester keeps `adCvdTariff` current with cited effective dates rather than a frozen snapshot. (4) Scenario the effective landed cost: module price × (1 + AD/CVD) net of IRA benefit, across sourcing-country options — turning the two static calculators into a comparative sourcing tool.

**Prerequisites.** CBP AD/CVD data cadence; the §48E(h) low-income allocation rules. **Acceptance:** the low-income adder can reach +20%; `cbamRisk` is labelled speculative wherever shown; landed-cost scenarios rank sourcing countries under current tariffs.

### 9.2 Evolution B — Trade-policy navigation copilot (LLM tier 1)

**What.** A copilot for the developer/manufacturer/trade-advisor users: "what's my effective module cost importing from Vietnam under current AD/CVD?", "which IRA adders can this project stack?", "does CBAM affect my EU solar exports?" — answered from the real `COUNTRIES` policy data and the correctly-structured ITC optimiser, with the CBAM answer stating plainly that solar is outside current scope.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-trade-policy-intelligence/ask`, corpus = this Atlas record (the policy dataset, ITC structure, framework notes) plus live calculator state. Effective-cost answers run the tariff/IRA calculators and narrate results; adder-eligibility answers walk the §48E structure. The copilot must assert the CBAM-scope fact (solar not currently covered) rather than repeating the speculative `cbamRisk` as current regulation — the specific honesty guardrail this module needs.

**Prerequisites.** Evolution A's CBAM relabelling and low-income fix — otherwise the copilot would confidently state solar CBAM liability that doesn't exist and understate the low-income credit. **Acceptance:** every tariff/ITC figure traces to the calculators; a CBAM question returns "solar is not in current CBAM scope"; the low-income adder answer reflects the up-to-20% rule.
