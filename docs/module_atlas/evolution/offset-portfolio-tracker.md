## 9 · Future Evolution

### 9.1 Evolution A — Real holdings and mark-to-market prices (analytics ladder: rung 1 → 3)

**What.** §7 confirms the portfolio-accounting math is genuine: MTM (`Σ tonnes_remaining × currentPrice`), P&L (`Σ(currentPrice − costBasis) × tonnes`), retirement coverage, and tonnage-weighted quality are all correct mark-to-market mechanics. The gap is the data layer — all 25 holdings are `sr()`-seeded (vintage, tonnage, cost basis, `priceMove = 1 + (sr−0.4)×0.3`, quality score feeding a BeZero-style bucket), and `currentPrice` is simulated drift rather than a real quote. Real registry names are used but randomly assigned. Evolution A gives the correct engine real positions and prices.

**How.** (1) Persist actual holdings in a `carbon_credit_holdings` table (analyst-entered or imported), replacing the seeded 25-position generator — this also fixes the platform's random-as-data concern. (2) Mark to real prices: pull category-level VCM price indications (CDR.fyi, Xpansiv CBL settlement data, or Verra issuance-weighted medians) into a dated price reference, so `currentPrice` is a sourced quote not `costBasis × priceMove`. (3) Wire `qualityScore` to real BeZero/Sylvera ratings where available (the `BEZERO` bucket structure already exists) rather than a seeded 40–100 draw; keep the SFDR/CSRD offset-disclosure output (§1) but generate it from real holdings.

**Prerequisites.** A holdings-entry/import path; VCM price data (partially public — honest-null where a category has no quote); rating-provider data access (BeZero/Sylvera are subscription-gated — accept sparse coverage, label unrated). **Acceptance:** MTM/P&L compute over real entered holdings; prices trace to a dated market source; no `sr()` in holdings or prices; retirement coverage reflects real retirement schedule.

### 9.2 Evolution B — Carbon-book management copilot (LLM tier 2)

**What.** A copilot for the portfolio workflows §1 describes: "what's my book's mark-to-market and P&L?", "am I on track to retire enough credits for my 2030 target?", "what's my tonnage-weighted quality and which holdings drag it down?", "draft the CSRD E1 offset disclosure" — executed against the MTM engine over real holdings, with every figure a computed output.

**How.** Tool calls to portfolio-accounting endpoints wrapping the real MTM/P&L/coverage/quality functions; system prompt from this Atlas page's §5/§7.1 formulas and the PCAF/SFDR/ESRS E1 references named in §5. Retirement-target alignment is a coverage computation against the user's emission target; the CSRD disclosure draft templates ESRS E1 offset fields from real holdings with per-figure provenance, and the fabrication validator matches every tonne/dollar to a tool response. Mutating actions (recording a retirement) gate behind confirmation + RBAC per the roadmap's Tier-2 pattern.

**Prerequisites (hard).** Evolution A — a copilot reporting MTM/P&L over the current seeded holdings would present fictional portfolio values as real financials; the disclosure-drafting use especially cannot run on synthetic data. **Acceptance:** every MTM/P&L/quality figure traces to a tool call over real holdings; the CSRD draft cites real positions; retirement-coverage answers reflect the actual schedule.
