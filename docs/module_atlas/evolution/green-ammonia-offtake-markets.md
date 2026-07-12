## 9 · Future Evolution

### 9.1 Evolution A — Compute willingness-to-pay from live carbon/grey-NH₃ prices (analytics ladder: rung 1 → 2)

**What.** §7 confirms this is a curated demand-intelligence tool: 26 hand-entered demand segments across 5 end-uses (fertiliser, shipping fuel, power, industrial feedstock, hydrogen carrier) and 11 regions, attributed to the IEA Ammonia Technology Roadmap / JERA-KEPCO / IFA outlook. The headline `WTP_premium = avoided_grey_NH3_cost + carbon_price × emission_factor + strategic_value` is a real formula, but its inputs are static. Evolution A makes WTP dynamic: compute the avoided-grey-cost term from live grey-ammonia and natural-gas prices, the carbon term from a live carbon-price feed (EU ETS/CBAM), so each segment's willingness-to-pay premium responds to market conditions rather than being a fixed editorial figure — turning a reference table into a live pricing model.

**How.** (1) A backend route computing WTP per segment from live inputs: grey-NH₃ cost (gas-linked), carbon price × the segment's emission factor, plus a documented strategic-value term. (2) Wire carbon prices from the platform's carbon-market data and gas prices from EIA/market feeds. (3) The CBAM-2026 fertiliser scenario becomes a computed sensitivity (grey NH₃ €50–126/t carbon cost) rather than static text.

**Prerequisites.** Live grey-NH₃/gas and carbon-price feeds; emission factors per end-use segment. **Acceptance:** a segment's WTP premium recomputes from the §5 formula when carbon or gas price changes; the CBAM impact is a computed scenario; static WTP figures are replaced by derived ones.

### 9.2 Evolution B — Offtake-structuring copilot (LLM tier 1 → 2)

**What.** A copilot for offtake buyers and structurers: "what green premium will Japanese co-firing buyers pay in 2030, and how does CBAM change EU fertiliser demand?" narrates the demand segmentation, co-firing programmes, and contract structures from the atlas corpus, with tier-2 computing WTP under live carbon/gas scenarios via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (IEA Ammonia Roadmap, JERA-KEPCO procurement, IFA outlook, CBAM from 2026 are cited) — the copilot cites real demand shares (fertiliser 70–75%, energy <0.5% in 2024) while flagging them as curated estimates. Tier 2 tool-calls the WTP endpoint so premium and CBAM-impact answers are computed. Cross-links to the production-economics sibling (LCOA vs WTP gap) come from the atlas graph.

**Prerequisites.** Corpus embedding; Evolution A for computed WTP. **Acceptance:** every demand share or WTP figure cited traces to the curated table or the endpoint; post-Evolution-A, carbon-price what-ifs return computed premiums, not narrated estimates.
