## 9 · Future Evolution

### 9.1 Evolution A — Probabilistic fund adequacy with real fund/liability data (analytics ladder: rung 1 → 4)

**What.** §7 confirms this module matches its guide well: the Fund Adequacy Ratio (`FAR = fundAtDecom / estimatedDecom`) is a real two-function engine — future value of an annuity for fund growth, discounted PV for liability, with reactor-class cost-per-MW ($600–800k/MW) and strategy multipliers (DECON 1.0 / SAFSTOR 0.85 / ENTOMB 0.5). The limitation is that FAR is a single deterministic point estimate off user sliders, and the plant/fund figures are static hand-authored constants. Evolution A adds uncertainty and grounds the data.

**How.** (1) Make cost escalation and fund-return stochastic: the guide itself names 2–4% real cost escalation and the FV depends on `annualFund` growth — run a Monte Carlo over escalation and return distributions to produce a FAR *distribution* and a probability-of-shortfall, not one number (the platform's `monte_carlo_engine` is reusable here). This is the rung-4 predictive step. (2) Replace `GLOBAL_PLANTS`/`NDA_SITES`/`US_DOE_SITES` static constants with a `decom_funds` reference table sourced from NRC decommissioning-funding-status filings and NDA annual accounts (both public, named in §5), so per-site FAR reflects real reported fund NAV vs liability. (3) Cite the strategy multipliers to a specific IAEA/NRC study rather than leaving them directionally-correct-but-unsourced (§7.2 flags this).

**Prerequisites.** NRC/NDA data ingestion; escalation/return distribution parameters documented per Atlas §8. **Acceptance:** FAR reports a confidence band and shortfall probability, not a point; a real site's FAR reconciles to its NRC-filed funding status; multipliers carry citations.

### 9.2 Evolution B — Decommissioning-liability copilot for fund managers (LLM tier 1 → 2)

**What.** A copilot answering "is this plant's fund adequate?", "how does deferring to SAFSTOR change the NPV cost?", "what discount rate makes the fund fully funded?" — grounded in the real FAR engine and (post-Evolution-A) real NRC/NDA fund data. The deterministic engine is transparent enough that explanations decompose cleanly into the FV-annuity and PV-liability terms.

**How.** Tier 1 explains the current computed FAR by walking the two formulas with the user's slider values. Tier 2 executes what-ifs as tool calls: strategy switches (DECON→SAFSTOR recomputes `stratMult` and deferred PV), discount-rate solves ("what WACC gives FAR=100%?" as an inverse solve), and — post-Evolution-A — Monte Carlo shortfall-probability queries. Fabrication validator matches every ratio and cost to a tool response; the copilot must distinguish nominal from PV figures explicitly (a common decommissioning-finance confusion) and refuse regulatory-compliance verdicts ("is this NRC-compliant?") beyond reporting the FAR against the 100% guideline.

**Prerequisites.** Tier 1 works on the current engine; real-data answers and shortfall probabilities need Evolution A. **Acceptance:** every FAR/cost figure traces to a tool call; strategy/discount what-ifs recompute rather than estimate; "is this compliant?" returns the FAR-vs-100% comparison with a scope disclaimer.
