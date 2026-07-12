## 9 · Future Evolution

### 9.1 Evolution A — VaR-equivalent SRI and full RTS scenario methodology (analytics ladder: rung 2 → 3)

**What.** The E15 `PRIIPSKIDEngine` generates EU PRIIPs Key Information Documents per Reg (EU)
1286/2014 as amended by 2021/2268: it computes the Summary Risk Indicator (`SRI = min(7, max(MRC,
CRC, CRC>1 ? CRC+1 : 0))`), four performance scenarios (`10,000 × (1+r_ann)^RHP`), total cost and
Reduction-in-Yield (`RIY = total_cost × annuity_factor`), and a rules-driven ESG-insert selector.
The §7.2 note is candid: the SRI market-risk classes "approximate the PRIIPs Annex II MRM table
(the real RTS uses VaR-equivalent volatility)", and the performance scenarios use a
simple-return model rather than the RTS bootstrap/Cornish-Fisher methodology. Evolution A closes
the methodology gap.

**How.** (1) Replace the volatility-band MRC approximation with the actual RTS VaR-equivalent
volatility calculation (VEV from historical return moments — Cornish-Fisher for non-linear
products), which is what a regulator recomputes. (2) Implement the RTS-prescribed performance
scenarios (stress/unfavourable/moderate/favourable) from the historical-simulation methodology
rather than the current `expected_return ± fixed offsets` (moderate = `r − 1.5%`, favourable =
`r + 3%`). (3) Keep the cost/RIY annuity math (already RTS-correct) and bench-pin all four
computations against a worked KID example. (4) Source return history from the platform's
market-data tables.

**Prerequisites.** Return-history input per product (via `financial_data`); the RTS VEV and
scenario formulas encoded. **Acceptance:** SRI derives from VaR-equivalent volatility matching a
worked RTS example; the four scenarios follow the RTS historical-simulation method, not fixed
offsets; RIY and SRI bench-pinned.

### 9.2 Evolution B — KID-generation copilot with ESG-insert automation (LLM tier 2)

**What.** A copilot that generates a KID and explains it — "your product is SRI 4; the moderate
scenario returns €X over the 5-year RHP; RIY is 1.8%; because it's SFDR Article 8 you need these
ESG inserts" — each figure from a tool call, plus batch generation across a product range.

**How.** Four POST endpoints (`/generate-kid`, `/calculate-scenarios`, `/esg-inserts`,
`/generate-kid/batch`) plus reference GETs (kid-sections, esg-insert-types, cross-framework) that
ground the KID structure and the SFDR/Taxonomy overlap. The ESG-insert selector is a natural
tier-2 action: given the SFDR classification, it returns the exact text blocks the KID must carry.
The cross-framework endpoint links to MiFID SPT and UCITS KIID. Strong node for a product/
compliance desk.

**Prerequisites.** Evolution A's RTS methodology for defensible risk/scenario figures — a copilot
narrating an approximated SRI as regulatory-final would misstate the KID. **Acceptance:** every
SRI, scenario value, and RIY traces to a tool response; ESG inserts match the SFDR classification
via the selector, not the LLM's own judgement; the copilot labels risk/scenario figures as
RTS-approximate until Evolution A, and refuses to assert KID regulatory sign-off.
