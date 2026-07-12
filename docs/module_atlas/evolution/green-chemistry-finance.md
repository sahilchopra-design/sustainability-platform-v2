## 9 · Future Evolution

### 9.1 Evolution A — Compute the weighted GreenChemScore and cost-parity curves (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's weighted `GreenChemScore = 0.3·BiobContentRatio + 0.3·CostParity + 0.2·RegCompliance + 0.2·MarketGrowth` is not computed — the page shows its ingredients separately over `sr()`-seeded company data, and the §8 spec is marked "not yet implemented." Evolution A builds the composite for real over sourced inputs: each company's bio-based content ratio, cost-parity ratio (`BiobasedCost/FossilBasedCost`, below 1.2× commercially viable), REACH/PFAS regulatory-compliance advantage, and market growth combined into the weighted score — with cost-parity computed from real bio-based vs petrochemical feedstock prices rather than seeded fields.

**How.** (1) A backend route computing `GreenChemScore` from the four weighted components per §5. (2) Cost-parity from bio-based and fossil feedstock prices (sourced or user-entered), so the <1.2× viability threshold is a computed classification. (3) The REACH-compliance term reflects actual restricted-substance status (PFAS restrictions make bio-based automatically compliant — a real value driver). (4) Company data sourced or user-supplied, replacing the seeded panel.

**Prerequisites.** Bio-based/fossil feedstock price data; REACH restricted-substance reference; the seeded company panel replaced (§7-flagged). **Acceptance:** `GreenChemScore` computes as the weighted composite reproducing §5; cost-parity derives from real prices and drives the viability flag; no `sr()` company field feeds the score.

### 9.2 Evolution B — Green-chemistry investment copilot (LLM tier 1 → 2)

**What.** A copilot for chemical-sector investors: "which bio-based materials are at cost parity with their petrochemical equivalents, and where does REACH/PFAS give bio-based an automatic compliance edge?" narrates the market-size and cost-competitiveness framing from the atlas corpus, with tier-2 computing GreenChemScore and cost-parity via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (bio-based market sizing, cost-parity curves, REACH compliance economics). The copilot's value is spotting cost-parity crossovers and regulatory tailwinds (PFAS restrictions). Guardrail, pre-Evolution-A: the composite is unbuilt and data seeded, so it must refuse GreenChemScore and cost-parity figures. Tier 2 tool-calls the score/parity endpoint. Every figure validated against tool output.

**Prerequisites.** Evolution A (no composite today); feedstock price data; corpus embedding. **Acceptance:** post-Evolution-A, every score and cost-parity figure traces to a tool call reproducing the weighted formula; pre-Evolution-A the copilot answers only on regulatory/market facts and declines quantitative scores.
