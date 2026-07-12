## 9 · Future Evolution

### 9.1 Evolution A — Computed impact scoring on a maintained change register (analytics ladder: rung 1 → 2)

**What.** The content is real (CSRD Wave 2, SEC stay, CBAM Phase 2, Basel III.1 — genuine developments, correctly described) but §7 flags scale and formula gaps: 10 changes vs the guide's claimed 50, 3 open consultations vs the claimed 12, `IMPACT_BY_CAT` totals (41) irreconcilable with the 10-row register, and the guide's `Impact = Scope × Materiality × Urgency` unimplemented — `impact` is an authored string. Evolution A turns the sample into a maintained register with computed impact and internally consistent aggregates.

**How.** (1) Move `CHANGES`/`CONSULTATIONS` into org-visible tables with an editorial workflow (the platform's `regulatory-calendar` backend obligation model is the adjacent pattern — coordinate rather than duplicate; a change often *becomes* a calendar obligation when finalized, and the two registers should link). (2) Implement the impact formula with explicit sub-scores: Scope (entity breadth, from applicability metadata), Materiality (a banded financial-impact estimate), Urgency (computed live from consultation close/effective dates — reusing the calendar engine's `days_until` tier logic). Authored overrides remain possible but flagged. (3) All aggregates (`IMPACT_BY_CAT`, jurisdiction counts, open-consultation KPIs) derive from the register, fixing the 41-vs-10 inconsistency structurally. (4) Guide corrected to "curated watchlist" until coverage genuinely reaches the claimed scale.

**Prerequisites.** Editorial ownership assigned (a change radar decays in weeks without a maintainer); linkage keys to the calendar's obligation records. **Acceptance:** every dashboard count reproduces from register rows; the impact score recomputes when a consultation deadline passes; a finalized change links to its calendar obligation.

### 9.2 Evolution B — Consultation-response assistant (LLM tier 1 → 2)

**What.** The register's most labor-intensive workflow is responding to open consultations. The copilot assists: "summarize what CBAM Phase 2 changes for a steel importer and which of our modules it touches" (the register already maps affected modules), "draft our consultation response skeleton on the disclosure-threshold question, citing our prior CSRD positions" — document work over real regulatory texts, the module's natural LLM shape.

**How.** Tier 1: RAG over the register rows and linked consultation/regulation documents (public texts chunked with section anchors); affected-module answers use the register's module mapping plus the Atlas interconnection graph. Tier 2: urgency-ranked triage briefs compose from register queries ("everything closing in 30 days, by computed impact"). Drafting guardrails: response skeletons are structure and citation scaffolding — positions come from the user; the copilot never asserts the org's stance unprompted. Every deadline and impact score quoted from the register with its last-reviewed date, given regulatory content's decay rate (the register itself records a rescinded SEC rule).

**Prerequisites.** Evolution A's register and document links; per-row review dates. **Acceptance:** triage briefs match register queries exactly; drafted skeletons cite consultation-document sections; stale rows (past review date) are flagged in any answer that uses them.
