## 9 · Future Evolution

### 9.1 Evolution A — Real EVIC inputs and a live OWID pull (analytics ladder: rung 1 → 3)

**What.** §7 confirms the PCAF math is exactly right: EVIC (`marketCap + totalDebt + minorityInt − cash`), WACI (`(scope1+scope2)/(EVIC/1000)`), and financed emissions via the equity-share attribution factor (`AFᵢ = Investmentᵢ/EVICᵢ`) all match the PCAF Standard v2 definition. Two data gaps: the EVIC inputs are synthetic demo values (marketCap $80–2,480B, debt 10–70% of cap, etc.), and the "OWID CO₂ Time-Series" tab is styled on OWID structure but uses seed-table `base`/`perCap`/`trend` values, not a live pull — despite the tab label implying otherwise. Evolution A grounds both.

**How.** (1) Wire EVIC inputs to real market data: the platform's OpenFIGI/market-data ingesters resolve tickers, and the PCAF financed-emissions sibling modules already source market cap and debt — reuse that path so EVIC computes from real balance-sheet components, with PCAF's documented proxy hierarchy (§1) filling gaps and flagging data-quality score. (2) Replace the seed CO₂ series with an actual OWID CO₂ dataset pull (the platform already ingests OWID CO₂ data per the refdata layer) so the tab's label is honest. (3) Emissions from real CDP/reported Scope 1/2 rather than the 50–5,050 ktCO₂e seed range.

**Prerequisites.** Market-data resolution for the ticker universe (reuse existing ingesters); OWID CO₂ already in the platform — connect it; honest-null + PCAF DQ score where a company lacks reported emissions or balance-sheet data. **Acceptance:** EVIC reproduces from real market-cap/debt/cash for a listed company; the CO₂ tab pulls actual OWID data; no `sr()` in EVIC or emissions inputs; DQ score reflects proxy usage.

### 9.2 Evolution B — PCAF attribution copilot (LLM tier 1 → 2)

**What.** A copilot for the financed-emissions workflows §1 targets: "what's my attribution factor for a $50M position in this company?", "compute WACI for these 10 holdings", "why did the EVIC change when they issued debt?", "how does the PCAF proxy hierarchy handle a private holding?" — grounded in the exact PCAF formulas and the PCAF v2 / SFDR Annex I references named in §5.

**How.** Tier 1 works on the transparent additive math: system prompt from this Atlas page's §5/§7.1 formulas; the copilot explains EVIC, attribution factor, and WACI by decomposing the formula with the displayed inputs, citing the PCAF standard for definitions. Tier 2, post-Evolution-A: tool calls to the EVIC/AF/WACI functions over real holdings, with the fabrication validator matching every EVIC/AF/WACI figure to outputs and surfacing the PCAF data-quality score per holding (a required PCAF disclosure). The copilot must explain that financed emissions inherit the underlying emissions' data quality, and refuse to report a portfolio total when key holdings lack data (honest-null propagation).

**Prerequisites.** Tier 1 on the current math; real-holding computation needs Evolution A. **Acceptance:** every EVIC/AF/WACI figure traces to a formula recomputation or tool call; the copilot reports PCAF DQ scores; portfolio totals flag missing-data holdings rather than imputing them.
