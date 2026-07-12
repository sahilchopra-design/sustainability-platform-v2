## 9 · Future Evolution

### 9.1 Evolution A — One SAF CI fact base and a compliance-obligation calculator (analytics ladder: rung 2 → 3)

**What.** §7 rates this among the batch's most faithful modules: real, correctly cited mandate percentages (EU Regulation 2023/2405, UK DfT, METI GIF, CAAS), a genuine piecewise mandate interpolation, and a correctly capped §40B credit formula. Its flagged gaps: `ciReduction` per pathway is hard-coded and not cross-consistent with the CI values `saf-lcof-engine` and `saf-carbon-credits` use for the same pathway names, and the CORSIA participation ratio (15%→85%) is an illustrative approximation rather than ICAO's published state-participation data. Evolution A makes this module the SAF cluster's policy authority, on shared facts.

**How.** (1) Establish the shared pathway-CI reference table (ICAO CORSIA default values) that all three SAF modules read — resolving the documented cross-module inconsistency at its root, with this module's §40B calculator consuming it. (2) CORSIA participation from ICAO's published state list (public), replacing the approximation with dated coverage data. (3) A compliance-obligation calculator: airline fuel uplift by jurisdiction in, mandated SAF volume and estimated compliance cost out — combining the mandate interpolation with SAF-vs-jet price spreads from `saf-lcof-engine`'s computed costs; served as `POST /api/v1/saf-policy/obligation`. (4) Mandate rows gain version stamps (the UK mandate is consultation-derived and will change; policy content decays).

**Prerequisites.** Shared CI table governance across the SAF cluster; ICAO participation-list transcription. **Acceptance:** the three SAF modules return identical CI values per pathway; an airline's obligation reproduces as uplift × interpolated mandate per jurisdiction-year; every mandate row carries regulation citation and version date.

### 9.2 Evolution B — Mandate-compliance copilot for airlines and policy teams (LLM tier 1 → 2)

**What.** The module's content is regulatory text rendered as numbers — the natural copilot explains and applies it: "what's our 2030 ReFuelEU obligation for 2Mt of EU departures, and how does the sub-mandate for synthetic fuels bite?", "compare UK vs EU mandate trajectories for our network planning", "what changes if the UK consultation lands at the higher band?" — the last a scenario question over stored mandate variants, not speculation.

**How.** Tier 1: RAG over the cited policy table plus the underlying regulation texts (chunked with article anchors — the ReFuelEU synthetic-fuel sub-mandate is exactly the kind of nested provision users misread). Tier 2: obligation questions call `POST /obligation`; trajectory comparisons are computed interpolations. Guardrails: every mandate percentage carries its regulation citation and version date; consultation-stage figures are labelled as such; the copilot refuses to state mandates for jurisdictions outside the 8-row table and flags when a cited regulation has a more recent amendment date than the stored version.

**Prerequisites.** Evolution A's version stamps and obligation calculator; regulation texts chunked. **Acceptance:** obligation answers match endpoint output; every percentage cites regulation and vintage; consultation-derived figures carry the status label in generated text.
