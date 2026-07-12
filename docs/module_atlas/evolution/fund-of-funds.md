## 9 · Future Evolution

### 9.1 Evolution A — Complete the two-level PCAF look-through (analytics ladder: rung 1 → 2)

**What.** §7 flags one precise gap in an otherwise sound module: the guide specifies a two-level PCAF look-through (`CF_FoF = Σ_f w_f × Σ_i (w_fi × EVIC_fi⁻¹ × Emissions_fi)`), weighting each fund by its FoF allocation and each underlying holding by its sub-fund weight with EVIC normalisation at both levels, but the code implements only the first level — a commitment-weighted average of each fund's stored `carbon_intensity`, with no holding-level roll-up and no EVIC normalisation. The rest (commitment-weighted TVPI/IRR/ESG, SFDR/GRESB analytics, editable localStorage portfolio) is genuine and correctly weighted. Evolution A builds the missing second level: ingest sub-fund holdings and compute financed emissions bottom-up per PCAF, weighting holdings by sub-fund weight and normalising by EVIC, with a documented proxy-with-DQ-penalty path where holdings are unavailable (the guide's own fallback).

**How.** (1) A holdings table per sub-fund; a look-through function computing `Σ_i w_fi·EVIC_fi⁻¹·Emissions_fi` per fund, then the outer commitment weighting. (2) A data-quality dashboard showing per-fund look-through coverage %, applying fund-level intensity proxies with a PCAF DQ penalty where coverage is low. (3) SFDR PAI aggregation reads the bottom-up figures.

**Prerequisites.** Sub-fund holdings data (even a curated demo set); EVIC/emissions for underlying names via the platform company master. **Acceptance:** the FoF carbon footprint recomputes from holding-level positions reproducing the two-level formula; funds with missing holdings show a coverage % and a DQ-penalised proxy, not a silent single-level average.

### 9.2 Evolution B — SFDR look-through disclosure copilot (LLM tier 2)

**What.** A copilot for FoF managers: "which sub-funds are dragging our FoF carbon intensity and transparency, and can we still classify Article 8?" tool-calls the Evolution A look-through and coverage endpoints, ranks sub-funds by contribution and by look-through gap, and drafts the SFDR PAI template with data-quality notes.

**How.** Tier-2 tool-calling over the look-through/PAI endpoints; the grounding corpus is §5/§7, which accurately encode the SFDR Delegated Regulation Annex I, PCAF Part A look-through, and PE performance metrics. The copilot's value is diagnosing which intermediated funds constrain the FoF ESG profile (low transparency or high intensity) and drafting compliant disclosure text with the coverage caveats explicit. Every intensity and coverage figure validated against tool output.

**Prerequisites.** Evolution A (single-level today can't answer holding-level attribution); RBAC-scoped fund data. **Acceptance:** every carbon-intensity, contribution, and coverage figure in a PAI draft traces to a tool call; the copilot flags sub-funds below a look-through threshold rather than presenting a proxy as measured.
