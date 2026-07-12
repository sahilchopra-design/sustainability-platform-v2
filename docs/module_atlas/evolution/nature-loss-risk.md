## 9 · Future Evolution

### 9.1 Evolution A — Compute NLFRS as an actual dependency × degradation × exposure product (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide defines `NLFRSᵢ = Σⱼ (Dependencyᵢⱼ × ServiceDegradationⱼ × RevenueExposureᵢⱼ)` over an ENCORE dependency matrix, IPBES degradation index, and WRI Aqueduct freshwater overlay — but the page has no revenue field, no degradation index, no Aqueduct data, and no cross-field arithmetic; all 16 fields per 50 companies are independent `sr()` draws. Evolution A builds the real score, which is genuinely tractable because the three inputs all have public sources.

**How.** (1) `POST /api/v1/nature-loss-risk/nlfrs` implementing the documented sum: per-company ecosystem-service dependency levels from ENCORE (High=3/Med=2/Low=1 as §5 specifies), service degradation trajectories from IPBES/WWF Living Planet indices, and revenue-exposure fractions from company segment data. (2) Add the WRI Aqueduct freshwater-stress overlay the guide promises — Aqueduct is a free public dataset keyed on lat/long, joinable to the platform's existing geographic layer, replacing the fabricated `waterDep` field with a sourced stress score. (3) Surface the per-service driver ranking (which ecosystem service drives each company's risk) that §1 describes as a workflow step but the code never produces.

**Prerequisites.** Company revenue-segment data (the missing input — sourceable from disclosures or a licensed feed; honest-null where absent); ENCORE attribution; Aqueduct ingestion as a new reference source. The `sr()` fabrication must be fully removed per platform rule. **Acceptance:** NLFRS decomposes into named service-level terms; two companies with identical dependency but different geographic water stress score differently; ESRS E4 export reflects computed, not random, values.

### 9.2 Evolution B — ESRS E4 disclosure-drafting analyst (LLM tier 2)

**What.** A tool-calling analyst supporting the CSRD ESRS E4 workflow §1 describes: "assess this portfolio's nature-loss exposure and draft the E4 impacts/dependencies/risks section" → calls the NLFRS endpoint per holding, identifies the highest-risk companies and their driving ecosystem services, and drafts E4 disclosure paragraphs where every dependency rating and risk figure is a tool output.

**How.** Tool schema over the Evolution-A `/nlfrs` endpoint plus the ENCORE reference; system prompt from this Atlas page and the ESRS E4 / TNFD / IPBES references named in §5. Drafted disclosures map each ESRS E4 datapoint (material impacts, dependencies, transition/physical risks) to a specific computed result, with the no-fabrication validator matching quoted scores to tool responses. The analyst flags companies where revenue-segment data was unavailable (honest-null propagation) rather than inventing exposure fractions.

**Prerequisites (hard).** Evolution A — today's page is pure PRNG, and an ESRS disclosure built on random numbers would be a regulatory liability, not a feature. **Acceptance:** every E4 datapoint in a draft traces to an NLFRS tool call; the analyst refuses to fill exposure fields for companies with missing revenue data, disclosing the gap instead.
