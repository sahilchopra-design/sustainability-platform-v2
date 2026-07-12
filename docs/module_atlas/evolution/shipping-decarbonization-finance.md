## 9 · Future Evolution

### 9.1 Evolution A — From simple payback to the promised 20-year NPV with fuel-specific abatement (analytics ladder: rung 1 → 2)

**What.** This is the strongest module in the shipping family: `calcCiiScore` implements the real IMO MEPC.354(78) formula (attained AER ÷ reference AER × 100), segment data is hand-curated from real global fleet statistics, and the payback function guards its edge case honestly. But the guide's headline promises "CAPEX NPV … over 20yr ship life" while the code computes simple payback only, and §7.6 lists three quantified gaps: the emissions-reduction assumption is a single fixed 30% constant regardless of fuel (green ammonia ≈ full reduction; LNG ≈ 20% ignoring methane slip), `avgEexiCompliance` is unweighted by fleet size, and `totalFleetCo2` (613 Mt) versus `globalShippingCo2` (1,080 Mt) is unreconciled on-page. Evolution A delivers the promised NPV and fixes all three.

**How.** (1) Discounted cash-flow over vessel life: retrofit CAPEX at t0; annual fuel-cost delta, levy avoidance, and OPEX per year; user-set discount rate; NPV and IRR alongside the existing payback. (2) Per-fuel reduction factors sourced from the `ALT_FUELS` table's own energy-density/GWP data (already physically accurate per §7.6), including a methane-slip toggle for LNG. (3) DWT-weight the compliance average. (4) A one-line footnote reconciling the 467 Mt gap (untracked segments: general cargo, fishing, offshore).

**Prerequisites.** None external — all inputs are already on the page; levy scenarios should reference the FuelEU $100–200/t range the module already carries. **Acceptance:** NPV at discount rate 0 equals undiscounted savings minus CAPEX; switching fuel selection changes the reduction factor and the NPV; the weighted compliance figure differs from the unweighted one on screen.

### 9.2 Evolution B — Poseidon Principles disclosure drafter (LLM tier 1)

**What.** The workflow's final step — "generate lender-ready Poseidon Principles disclosure and fleet transition roadmap" — is a structured drafting task over numbers the module genuinely computes. Evolution B drafts the annual climate-alignment disclosure a signatory bank files: portfolio alignment delta versus the IMO trajectory (the page's declining-to-zero 2050 chart), per-segment CII positioning from `calcCiiScore`, and the financing narrative referencing the real instruments in `FINANCE_INSTRUMENTS` (whose rates/tenors/triggers §7.6 confirms are realistic).

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/shipping-decarbonization-finance/ask`, corpus = this Atlas record (the §7.2 segment table and framework notes are the grounding) plus live calculator state. The disclosure template mirrors Poseidon Principles v3.0 reporting structure; every alignment score in the draft must equal a `calcCiiScore` output, and scenario paragraphs cite which levy assumption produced them. Refusal for segments outside the six covered.

**Prerequisites.** Evolution A's NPV, so financing narratives can cite investment economics rather than payback alone; a decision on whether disclosures persist (suggests a small `pp_disclosures` table). **Acceptance:** a generated disclosure's alignment figures reproduce from the on-page calculators; the draft explicitly labels the 6-segment coverage boundary against the 1,080 Mt global total.
