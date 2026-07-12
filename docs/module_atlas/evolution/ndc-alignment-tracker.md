## 9 · Future Evolution

### 9.1 Evolution A — Replace anchored-synthetic magnitudes with real UNFCCC/Climate Watch data (analytics ladder: rung 2 → 4)

**What.** §7 characterises this as a hybrid: the per-country Paris-alignment and implementation ratings are genuinely hand-curated CAT-style (Norway/Denmark/Sweden rated 1.5°C-aligned, Saudi/Egypt/Nigeria Critically Insufficient), and the 1.5°C benchmark (`baseline × 0.55`, i.e. 45% cut) is a real IPCC/UNEP figure — but the emissions, targets, and financing magnitudes are `sr()`-seeded off those ratings. So the *ordering* is real and the *numbers* are synthetic. Evolution A replaces the synthetic magnitudes with the real datasets the module already names.

**How.** (1) Ingest WRI Climate Watch NDC data and UNFCCC registry submissions (both free/public and named in §5) into an `ndc_targets` table: actual base years, target years, unconditional/conditional pledges, and gas coverage per country. (2) Replace the seeded `unconditionalTarget`/`projections2030` with parsed pledge values, computing the NDC Ambition Gap (`projections2030 − requiredForParis1p5`) from real trajectories against the retained 0.55 benchmark. (3) Ladder to rung 4: layer the historical target-adherence scoring §1 describes (did past NDCs deliver?) using time-series of national emissions from the OWID CO2 data already in the platform — a genuine predictive signal for whether the current NDC is credible.

**Prerequisites.** Climate Watch ingestion as a new reference source; the hand-curated Paris ratings can stay as an analyst-judgment overlay but should be reconciled against live CAT assessments where available. **Acceptance:** each country's ambition gap derives from its actual NDC pledge, not `sr()`; adding a new NDC submission updates the gap without code changes; historical-adherence score reproduces from OWID emissions history.

### 9.2 Evolution B — Sovereign-transition-risk copilot for NDC analysis (LLM tier 1 → 2)

**What.** A copilot for the investor/negotiator users §1 targets: "how does Brazil's NDC compare to its 1.5°C budget?", "which G20 countries have the widest ambition gap?", "explain Indonesia's implementation grade" — grounded in the per-country ratings, the real 0.55 benchmark, and the UNFCCC/UNEP Emissions Gap/CAT references named in §5.

**How.** Tier 1: system prompt from this Atlas page plus the country ratings and benchmark logic; the copilot explains a country's Paris rating and ambition gap by decomposing the §7.1 formula, citing the CAT-style rating basis. Tier 2, after Evolution A: tool calls against the `ndc_targets` query endpoints for cross-country comparisons and the historical-adherence score, with the fabrication validator matching quoted gaps and percentages to query results. The copilot must distinguish curated analyst ratings (qualitative judgment) from computed gaps (data) in its provenance, and refuse to predict COP negotiation outcomes.

**Prerequisites.** Tier 1 works on current curated ratings but must disclose that magnitudes are illustrative until Evolution A; comparison/ranking answers need the real dataset. **Acceptance:** every ambition-gap figure traces to the benchmark computation or (post-Evolution-A) a real NDC pledge; ratings are labelled as analyst judgment; refusal on speculative geopolitical questions.
