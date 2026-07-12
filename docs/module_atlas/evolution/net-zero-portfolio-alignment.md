## 9 · Future Evolution

### 9.1 Evolution A — Real holdings behind a correct PTS/WACI engine (analytics ladder: rung 2 → 3)

**What.** §7 is clear that the aggregation math is right: the exposure-weighted Portfolio Temperature Score (`PTS = Σ wᵢ × ITRᵢ`) and Weighted Average Carbon Intensity are implemented essentially verbatim from the guide — the gap is entirely the data layer. The 120 `HOLDINGS` are synthetic (`{SEC}-H001` codes, not real companies), with `temperature`, `scope1/2/3`, `revenueUSD`, and `evic` all `sr()`-seeded. Evolution A feeds the correct engine real portfolio data, elevating it from a demo to a usable alignment tool.

**How.** (1) Read positions from `portfolios_pg` (the populated table) and resolve holdings to real emissions via the platform's PCAF/financed-emissions data and OWID/CDP feeds — the `net-zero-portfolio-builder` and `portfolio-temperature-score` siblings share this exact data need, so build one holdings-to-emissions resolver and reuse it. (2) Compute company-level ITR from the SBTi Temperature Scoring methodology (named in §5) using real sector carbon-budget allocation and each company's decarbonisation trajectory, replacing the seeded 1.5–4.5°C draws. (3) EVIC from real market cap + debt rather than `rev × (sr()·3+0.5)`, so EVIC-weighted attribution (§1) is meaningful. Keep the synthetic set as a labelled demo.

**Prerequisites.** The shared emissions resolver; SBTi temperature-scoring inputs (sector budgets, company targets); honest-null where a holding lacks emissions data rather than seeding it. **Acceptance:** PTS/WACI computed over real `portfolios_pg` holdings; changing a holding's weight moves PTS via the verbatim formula; top-contributor-to-overshoot ranking reflects real ITRs.

### 9.2 Evolution B — Portfolio-alignment copilot with contributor drill-down (LLM tier 2)

**What.** A copilot for asset owners: "what's my portfolio temperature and which 5 holdings push it over 2°C?", "how much does dropping the worst emitter improve PTS?", "show WACI by scope" — executed against the PTS/WACI engine over real holdings, with answers decomposing the weighted sum into per-holding contributions.

**How.** Tool schema over a `POST /nz-alignment/pts` endpoint (Evolution A) taking a portfolio ID; system prompt from this Atlas page's §5 formulas and the TCFD Portfolio Alignment / SBTi Temperature Scoring references named in §5 so the copilot correctly explains what ITR and PTS mean and their known limitations (temperature scores are model-dependent and not directly comparable across providers). The "drop the worst emitter" what-if is a recomputation tool call, not an estimate. Fabrication validator matches every temperature/intensity figure to a tool response; provenance expander shows which holdings had real vs missing emissions data.

**Prerequisites (hard).** Evolution A — the current holdings are synthetic codes, and a copilot reporting a portfolio temperature from seeded ITRs would be presenting noise as a Paris-alignment metric. **Acceptance:** every PTS/WACI figure traces to a tool call over real holdings; the contributor drill-down sums to the reported PTS; holdings with missing data are disclosed, not imputed.
