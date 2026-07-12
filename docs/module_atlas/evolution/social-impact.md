## 9 · Future Evolution

### 9.1 Evolution A — Build the IMP 5-dimension and IRIS+ engine the guide promises (analytics ladder: rung 1 → 2)

**What.** The §7 mismatch is comprehensive: the guide advertises the Impact Management Project 5-dimension framework (`What 25 + Who 20 + How Much 30 + Contribution 15 + Risk 10`), IRIS+ metrics, impact-weighted accounts (shadow-price P&L), and an SROI calculator — **none implemented**. What the code actually runs is a 17-SDG sector-relevance scorer with a hand-built 11-sector × 17-SDG relevance matrix plus synthetic per-company signal, and `IMPACT_BENCHMARKS` (jobs/patients/GW per $Bn revenue) is defined but dead. Evolution A builds the promised measurement layer, keeping the genuinely useful `SDG_SECTOR_WEIGHTS` matrix and the real `sbtiBonus`/`diversityBonus` conditionals as the two components that already respond to real data.

**How.** (1) Implement the IMP 5-dimension scorer as the headline engine: structured inputs per holding (outcome type/valence, stakeholder identity, depth/breadth/duration, counterfactual, impact risk) → the weighted 25/20/30/15/10 composite. (2) Wire `IMPACT_BENCHMARKS` into an IRIS+-style metric layer (jobs created, patients served, MWh) computed from real revenue/sector data rather than left dead. (3) Add the SROI calculator (social value ÷ investment) and a minimal impact-weighted-accounts view using published social shadow prices (Harvard IWA / SROI Network references the guide already cites). (4) Make `revAlign` (SDG revenue alignment) sourced from disclosure rather than a separate seed.

**Prerequisites.** IMP inputs require per-holding qualitative data collection (a form or issuer disclosure); shadow-price tables need sourcing. **Acceptance:** an IMP score responds to changing any of the 5 dimensions; the SROI ratio and at least one IRIS+ metric compute from real inputs; no headline tab is a bare `sr()` draw.

### 9.2 Evolution B — IMP-assessment guided-elicitation copilot (LLM tier 1)

**What.** The IMP framework is fundamentally a structured qualitative interview — the ideal LLM elicitation task. Evolution B walks an analyst through the 5 dimensions for a holding ("who is affected, and were they underserved before?", "what would have happened anyway — the counterfactual?"), proposes dimension scores with rationale tied to the IMP rubric, and assembles the composite via the Evolution-A engine. It also answers "which SDGs is this holding most material to?" from the real `SDG_SECTOR_WEIGHTS` matrix.

**How.** Tier-1 structured-elicitation pattern: `POST /api/v1/copilot/social-impact/ask`, corpus = this Atlas record plus the IMP 5-dimension definitions and IRIS+ catalogue references. Each proposed dimension score cites the IMP rubric criterion and requires user-provided evidence; the final composite is computed by the engine, not the LLM. SDG-materiality answers read the sector-relevance matrix directly.

**Prerequisites.** Evolution A's IMP engine so the composite is real; a session store for in-progress assessments. **Acceptance:** every proposed dimension score quotes an IMP rubric criterion and cites user evidence; empty evidence yields "insufficient input," not a default; SDG-materiality claims match the relevance matrix.
