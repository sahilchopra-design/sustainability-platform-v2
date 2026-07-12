## 9 · Future Evolution

### 9.1 Evolution A — Real EDCI company KPIs behind the capital-weighted fund score (analytics ladder: rung 1 → 3)

**What.** §7 shows the fund-level aggregation math is genuinely correct: the Fund ESG Score (`FES = Σ(esgScore × dealSize)/Σ dealSize`) is properly capital-weighted (the PCAF/EDCI-consistent convention), the simple-vs-weighted distinction is handled correctly, impact aggregation has a sensible fallback chain, and HHI sector concentration is correctly implemented. The gap: the 21 deals' per-deal `esgScore`/`carbonIntensity` are constants not derived from underlying E/S/G sub-metrics, and the improvement `target = min(esgScore+15, 100)` is a flat aspiration, not a benchmark-derived target. Evolution A grounds the company KPIs in real EDCI data.

**How.** (1) Structure company ESG scores from the actual EDCI KPI protocol (§1: GHG intensity, board diversity, work-related injuries — the ESG Data Convergence Initiative 2023 protocol named in §5), so each deal's `esgScore` is a documented composite of its collected KPIs rather than a constant. (2) Ground carbon intensity in real reported/PCAF-estimated emissions (shared with the financed-emissions modules). (3) Replace the flat +15 improvement target with sector-benchmark or GRESB-percentile-derived targets (GRESB PE Assessment named in §5), so the improvement plan is calibrated. The correct capital-weighted aggregation stays; only the inputs are grounded.

**Prerequisites.** EDCI KPI data collection (the protocol is standard but requires portfolio-company data entry); GRESB benchmark data; emissions wiring. **Acceptance:** each deal's ESG score decomposes into EDCI KPIs; carbon intensity traces to real emissions; improvement targets derive from a benchmark, not a flat +15; FES reproduces the capital-weighted formula.

### 9.2 Evolution B — LP-reporting copilot for fund managers (LLM tier 2)

**What.** A copilot for the PE/VC fund-manager users §1 targets: "what's my fund ESG score and how does it compare to GRESB?", "which portfolio companies drag the fund score down?", "aggregate CO2 avoided and jobs created across the portfolio", "draft the LP quarterly ESG report" — executed against the FES/impact/HHI engine, decomposing the capital-weighted score into per-company contributions.

**How.** Tool calls to endpoints wrapping FES, impact aggregation, and HHI; system prompt from this Atlas page's §5/§7.1 and the EDCI / GRESB / ILPA references named in §5 so LP-reporting conventions are followed. The LP report drafts the EDCI/GRESB-aligned sections with every figure a tool output; the fabrication validator matches all scores/tonnes/jobs to responses. The copilot correctly uses capital-weighted FES for the headline (not the simple mean) per convention, and cites HHI for concentration risk. Post-Evolution-A, per-company drill-downs decompose into EDCI KPIs.

**Prerequisites.** Compute endpoints; Evolution A for real EDCI-grounded company scores (the fund aggregation works today on demo data). **Acceptance:** every FES/impact/HHI figure traces to a tool call; the LP report uses capital-weighted FES; company drill-downs (post-Evolution-A) cite EDCI KPIs; impact totals sum from real per-deal metrics.
