## 9 · Future Evolution

### 9.1 Evolution A — Build the SASB-weighted materiality score (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide describes an ESG Materiality Score (`EMS = Σ wᵢ × TopicScoreᵢ × SeverityMultiplierᵢ`) using SASB sector-material topic weighting, but `score`/`envScore`/`socScore`/`govScore` are four *statistically independent* `sr()` draws — the overall `score` is not a weighted function of the E/S/G sub-scores, and no SASB topic list, weight, or severity multiplier exists anywhere. The generic `m1`–`m6` fields are unlabelled placeholders. Evolution A builds the SASB-materiality engine the module is named for as its first real vertical.

**How.** (1) Encode the SASB Materiality Map (public — the SASB standards by sector named in §5): for a target's sector, the material ESG topics with their financial-impact weights. (2) Implement `EMS = Σ wᵢ × TopicScoreᵢ × SeverityMultiplierᵢ` where topic scores are analyst-entered (from the management-interview/document-review workflow §1 describes) and severity multipliers reflect controversy findings — so the overall score is a genuine weighted composite of E/S/G, not four unrelated randoms. (3) The 100-day value-creation plan (§1) becomes a structured output keyed to the lowest-scoring material topics, replacing the generic placeholders.

**Prerequisites.** SASB Materiality Map ingestion (public); an analyst-entry UI for topic scores (replacing the seeded generation); severity data from controversy screening. Remove `sr()`. **Acceptance:** EMS reproduces from visible SASB-weighted topic scores; changing a material topic's score moves EMS predictably; the value-creation plan targets the actual low-scoring topics.

### 9.2 Evolution B — ESG-diligence copilot for deal teams (LLM tier 1 → 2)

**What.** A copilot for the PE diligence workflow §1 describes: "what are the SASB-material ESG topics for a food-processing target?", "score this target's governance from the diligence notes", "draft a 100-day ESG value-creation plan for the weakest topics" — grounded in the SASB Materiality Map and the PRI PE DDQ / IFC Performance Standards references named in §5.

**How.** Tier 1 works on the SASB reference immediately: the copilot answers materiality-mapping questions (which topics matter for a sector) with citations, using the PRI DDQ structure to guide the diligence process. Tier 2, post-Evolution-A: the copilot scores topics from analyst-provided diligence notes via the EMS engine (tool call), and drafts the 100-day plan keyed to the lowest-scoring material topics, with the fabrication validator matching every score to a tool response. Critically, the copilot must not present ESG scores until Evolution A — narrating the current independent random `envScore`/`socScore`/`govScore` as a diligence assessment would fabricate risk findings for a live deal.

**Prerequisites.** Tier 1 on SASB reference; scoring needs Evolution A's EMS engine and analyst-entered topic data. **Acceptance:** materiality-map answers cite SASB by sector; EMS scores (post-Evolution-A) trace to tool calls over real diligence inputs; the copilot refuses to score targets from the current seeded data.
