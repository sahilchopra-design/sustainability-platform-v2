## 9 · Future Evolution

### 9.1 Evolution A — Real positions and emissions behind the 13-instrument engine (analytics ladder: rung 2 → 3)

**What.** §7 flags a *positive* discrepancy: the guide claims 5 asset classes, but the code implements correct PCAF attribution-factor formulas for 13 instrument types (`ASSET_CLASS_DEFS`) — listed equity/bonds (Outstanding/EVIC), project finance (Outstanding/TotalProjectCost), CRE (Outstanding/PropertyValue), sovereign (Outstanding/PPP-GDP), use-of-proceeds, sub-sovereign, undrawn commitments (CCF×min(1,Out/EVIC)), securitisations — every AF correctly capped at min(1.0, ·). This is one of the platform's most methodologically complete engines. The gap: `BASE_POSITIONS` and reported emissions are seed data. Evolution A grounds them and pins the calibration.

**How.** (1) Wire positions to `portfolios_pg` and resolve holdings via GLEIF/OpenFIGI; pull EVIC from real market data (shared with `owid-evic-analytics`) and reported Scope 1/2 from CDP/disclosures, applying PCAF's sector-median EVIC proxy and DQ score (1=audited…5=proxy) where data is missing — honest-null propagation. (2) Sovereign attribution needs real PPP-GDP (World Bank data, joinable); use-of-proceeds needs real bond sizes. (3) Pin the 13 AF formulas in `bench_quant` with hand-computed reference cases per instrument type — this flagship engine is exactly what the roadmap's "every tier-A flagship pinned" target means. This is rung-3 calibration; the engine (rung-1/2) is already excellent.

**Prerequisites.** Market-data + emissions resolution (reuse existing ingesters); World Bank PPP-GDP for sovereign; `CarbonCreditContext` bus already wired for downstream propagation. **Acceptance:** financed emissions compute over real `portfolios_pg` holdings with real EVIC/emissions; each instrument type's AF reproduces a pinned reference; DQ scores reflect real data availability.

### 9.2 Evolution B — Financed-emissions reporting analyst (LLM tier 2)

**What.** A copilot for the TCFD/ISSB/CSRD reporting workflows §1 targets: "what are my total financed emissions by asset class?", "why is the sovereign-debt AF so small?", "which holdings drive my WACI above the SBTi sector target?", "draft the PCAF disclosure with data-quality scores" — executed against the 13-instrument engine, decomposing financed emissions per asset class and holding.

**How.** Tool calls to endpoints wrapping the AF/FE/WACI functions; system prompt from this Atlas page's §5/§7.1 formulas and the PCAF v3 / GHG Protocol Scope 3 Cat 15 references named in §5 so the (nuanced, per-instrument) attribution methodology is explained correctly. The disclosure draft templates the PCAF-required fields — financed emissions, WACI, DQ score distribution, coverage — with every figure a tool output; the fabrication validator matches all tCO2e/AF/WACI to responses. Because financed emissions feed downstream modules via `CarbonCreditContext`, this analyst is a natural tier-3 hub. RBAC-gate any write to the shared context.

**Prerequisites.** Compute endpoints; Evolution A for real positions (the AF math is already correct on demo data). **Acceptance:** every financed-emissions/WACI figure traces to a tool call; the disclosure draft reports DQ scores per PCAF requirement; per-instrument AF explanations cite the correct PCAF chapter.
