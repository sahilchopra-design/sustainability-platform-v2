## 9 · Future Evolution

### 9.1 Evolution A — Word-boundary term detection, PAB-vs-CTB distinction, and portfolio look-through (analytics ladder: rung 1 → 3)

**What.** The ESMA Fund Names ESG Guidelines Engine (E16) — tests fund names against ESMA/2024/249:
detect ESG terms across 6 categories, derive requirements (80% threshold, PAB exclusions, DNSH, PAB
tracking, impact evidence), test caller attributes, emit a compliance score and blocking/non-blocking
gaps. Pure rules engine, no PRNG, with faithfully-reproduced ESMA dates and PAB Art. 12 revenue
thresholds. §7.5 names the deepening targets: term detection is **naive substring matching** ("ESG"
inside another word, multilingual names mis-fire); the engine applies the **stricter PAB exclusion set
to every category** whereas ESMA distinguishes PAB exclusions (environmental/impact/sustainability
terms) from the looser **CTB exclusions** for transition/social/governance terms (which permit some
fossil exposure); and compliance inputs are **self-declared booleans** with no portfolio look-through.
Evolution A adds word-boundary/multilingual detection, the PAB-vs-CTB distinction, and portfolio
verification.

**How.** `detect_terms` uses tokenised word-boundary matching (with a multilingual term list) instead of
substring; the requirement derivation applies CTB exclusions for transition/social/governance-only
names and PAB exclusions for environmental/impact/sustainability names (the actual ESMA regime), rather
than the conservative union; the assessment verifies `esg_investment_pct` and PAB/CTB exclusions against
the fund's actual holdings (via the platform's portfolio and entity-resolution layers) instead of trusting
self-declared booleans. Rung 3: the 80% threshold check validates against look-through holdings data.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /assess` and `/assess/batch`
**failed** and `/detect-terms` **skipped**; the PAB-vs-CTB conservatism is a documented over-strictness
to correct. **Acceptance:** the §7.4 worked example ("Alpha Global Climate Transition Impact Fund",
score 40.0, non-compliant) reproduces under the legacy PAB-union rule, then a transition-only fund gets
CTB (not PAB) exclusions; "ESG" inside another word no longer mis-fires; the 80% check can verify
against real holdings; the failing endpoints pass the harness.

### 9.2 Evolution B — Fund-naming compliance copilot with tool-called assessment (LLM tier 2)

**What.** A copilot for fund-compliance/product teams: "is this fund name ESMA-compliant?" (`/assess` →
compliance score, blocking/non-blocking gaps with guideline paragraph citations, SFDR note,
recommendations), "what ESG terms does this name trigger and what requirements follow?" (`/detect-terms`),
and "screen our whole fund range" (`/assess/batch`) — narrating the engine's real rule output including
the canonical remediation ("raise to ≥80% or rename").

**How.** Tool schemas over the 3 POST + 4 GET operations; the reference endpoints (term categories, PAB
exclusions, SFDR requirements, timeline, cross-framework) are exceptional RAG grounding for "what does
ESMA/2024/249 §27 require?" or "what are the PAB fossil-fuel thresholds?" questions — a tier-1 explainer
over a tier-2 operator. The no-fabrication validator checks every score, threshold and gap against tool
output; the copilot cites the guideline paragraph for each gap and distinguishes blocking (threshold,
PAB) from non-blocking gaps. Composable with `eu_gbs`, `eu_taxonomy_gar` and `cdp_scoring` in a
regulatory-disclosure desk.

**Prerequisites.** Evolution A's harness fixes and PAB-vs-CTB correction (so narrated exclusions are
regime-faithful); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure/citation
traces to an engine tool call; the compliance verdict matches `/assess`; a gap is reported with its
ESMA paragraph; the copilot correctly applies CTB (not PAB) exclusions to a transition-only fund name
post-Evolution A.
