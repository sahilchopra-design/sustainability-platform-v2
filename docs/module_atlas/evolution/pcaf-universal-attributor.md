## 9 · Future Evolution

### 9.1 Evolution A — From formula-reference to live per-position calculator (analytics ladder: rung 1 → 3)

**What.** §7 is clear: this is a reference/education dashboard covering all 8 PCAF asset classes with correctly-transcribed attribution formulas (EVIC for Class 1-2, 100% for Class 3, Loan/Value for Class 4-6, GDP-based for Class 7) and correct exposure-weighted DQ aggregation — but each class carries a *static* exposure/emissions/DQ figure, not a per-position calculation. The flagship `pcaf-financed-emissions` sibling already does live 13-instrument attribution. The target-tracking trajectory (`target = 100×0.93^i` vs `actual = 100×0.95^i`) is illustrative, not derived from a real SBTi target. Evolution A makes this either a genuine calculator or a clean reference layer over the flagship.

**How.** (1) The cleanest path: make this module the *reference/benchmark view* over the flagship engine's real per-position outputs — call the flagship's computation and aggregate to the 8-class rollup with the DQ heatmap, rather than duplicating a static table; this avoids two divergent PCAF implementations. (2) Replace the illustrative target trajectory with the portfolio's real SBTi financed-emissions target (the Financial Sector Framework named in §5) computed from actual baseline emissions. (3) The exposure-weighted DQ and WACI-benchmark math are correct — feed them real per-class exposures from the flagship.

**Prerequisites.** Consuming the flagship `pcaf-financed-emissions` engine (avoids a second PCAF implementation drifting from the first); real SBTi target inputs. **Acceptance:** the 8-class rollup reflects real per-position financed emissions from the flagship, not static seeds; target tracking uses a real SBTi target; DQ heatmap reflects actual data quality.

### 9.2 Evolution B — PCAF methodology copilot / class-selection guide (LLM tier 1)

**What.** This module's genuine strength is being a formula reference, which makes it an ideal tier-1 methodology copilot: "which PCAF class does a motor-vehicle loan fall under and what's its attribution factor?", "how is sovereign-debt attribution computed?", "what DQ score does sector-average emissions data earn?" — grounded in the correctly-transcribed 8-class formulas and the PCAF v3 reference named in §5.

**How.** Tier 1 over the reference content: system prompt from this Atlas page's §5/§7 and the serialized `PCAF_CLASSES` formula table; the copilot answers class-selection and formula-interpretation questions with citations to the PCAF chapter, and explains the exposure-weighted DQ convention. Served via the roadmap's shared copilot router with prompt caching (static reference corpus). Refusal path for portfolio-specific calculations (route those to the flagship module's tier-2 analyst) and for questions beyond the 8-class scope. This copilot is the "explain PCAF" front door; the flagship's copilot is the "compute my portfolio" operator.

**Prerequisites.** None hard — the formula reference is accurate today; deeper computation delegates to the flagship (Evolution A wiring). **Acceptance:** every formula answer cites the correct PCAF class and chapter; DQ-scoring explanations match the exposure-weighted convention; portfolio-calculation requests route to the flagship rather than being answered from the static table.
