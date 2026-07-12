## 9 · Future Evolution

### 9.1 Evolution A — Hazard-grounded avoided-loss estimation (analytics ladder: rung 2 → 3)

**What.** The module's BCA core is genuine (§7: real present-value-of-annuity math in `calcBcr`/`calcNpv`, matching FEMA's toolkit mechanic), but its inputs are hand-authored: the 8 cities' hazard lists, resilience scores, and BCRs are typed constants, and the city ROI is algebraically pinned to the stored BCR (`roi = bcr − 1` — a re-expression, not an estimate, as §7.1 documents). Evolution A grounds avoided-damage estimates in the platform's own hazard data so the BCR numerator is derived, not asserted.

**How.** (1) Wire city coordinates to the Physical Risk Digital Twin's populated `ref_*_zones` grids (earthquake/cyclone/wildfire/flood/sea-level, real USGS/IBTrACS/GWIS/OpenFEMA sources) to derive per-city hazard exposure instead of the hand-typed hazard arrays. (2) Estimate annual expected damage per asset category from OpenFEMA NFIP claims history (already ingested) scaled by exposure, making `annBenefit` = avoided fraction × expected damage with the avoided fraction sourced from the FEMA BCA Reference Guide effectiveness tables per measure type. (3) Replace the synthetic `fundingTrend` series (§7.2 flags it as `sr()`-seeded) with actual FEMA BRIC/CDBG-DR appropriation history — the `FUNDING_PROGRAMS` catalogue is already real; its trend line should be too.

**Prerequisites.** Flood/sea-level grids are currently thin (48/152 rows, named-city samples) — acceptable for the 8-city set but must be checked per city; claims-to-damage scaling documented per Atlas §8 model-card convention. **Acceptance:** changing a city's coordinates changes its derived hazard exposure and BCR; no `sr()` remains in rendered series.

### 9.2 Evolution B — Grant-application copilot for municipal staff (LLM tier 2)

**What.** The natural user is a city sustainability officer writing FEMA BRIC or CDBG-DR applications. A tool-calling copilot that assembles the quantitative core of an application: runs the module's BCA for a chosen measure ("green stormwater, $12M capex, 25-year life, 4% discount"), compares against the programme's BCR threshold from the real `FUNDING_PROGRAMS` catalogue (match requirements, focus areas), and drafts the benefit-cost narrative with every number sourced from the calculation.

**How.** Expose the BCA as a small backend endpoint (`POST /api/v1/muni-resilience/bca` — the `calcBcr`/`calcNpv` logic ports directly to Python) so the copilot tool-calls it rather than re-deriving PV math; system prompt from this page's §5 formulas and the FEMA BCA Reference Guide v6.0 named in §5. Drafted narrative sections are templated to FEMA BCA submission structure; the no-fabrication validator matches every BCR/NPV/co-benefit figure to a tool response. Programme-fit checks quote the catalogue row (match %, focus) verbatim.

**Prerequisites.** The BCA endpoint (trivial); Evolution A strongly preferred before the copilot quotes avoided-loss magnitudes, since today's per-city `avoided` figures are hand-authored. **Acceptance:** a generated draft's every numeric traces to a BCA tool call or catalogue row; asking "will FEMA approve this?" yields a scoped refusal.
