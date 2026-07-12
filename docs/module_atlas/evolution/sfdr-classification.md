## 9 · Future Evolution

### 9.1 Evolution A — Taxonomy-grade screening criteria with persisted audit trail (analytics ladder: rung 1 → 2)

**What.** This is one of the platform's more rigorous tier-B modules: a genuine rule-based Article 6/8/8+/9 classifier whose thresholds match the real SFDR/RTS text, running on real-ish holdings with honestly-scoped deterministic fallbacks (both REM-38 P0/P1 findings fixed). Its documented soft spot (§7.6) is upstream of the cascade: the screens deciding *which* holdings count as "sustainable" or "taxonomy-aligned" are a simplified sector/ESG-score proxy, not the EU Taxonomy technical screening criteria. Evolution A hardens the inputs and gives the module the backend it lacks — the page promises a "full audit trail" and a Reclassification Tracker, but tier-B means nothing persists.

**How.** (1) Encode activity-level technical screening criteria for the highest-volume taxonomy activities (the refdata layer's ESRS/regulatory catalogs are the natural home) and replace the proxy filter where activity data exists, reporting `screen_basis: 'TSC' | 'proxy'` per holding in the GLEIF resolution-tier spirit. (2) A small `sfdr_classifications` table persisting each classification run (inputs, thresholds, verdict, timestamp) so the Reclassification Tracker logs real history instead of session state. (3) What-if reclassification: adjust SI%/taxonomy thresholds or drop holdings and see the article verdict flip — the cascade is already pure-function, so scenario mode is cheap.

**Prerequisites.** TSC encoding effort (start with the 6 environmental objectives' climate-mitigation activities); an org-scoped migration for the new table. **Acceptance:** a holding screened via TSC shows its criterion; re-running a persisted classification reproduces the stored verdict bit-for-bit.

### 9.2 Evolution B — Defensible-classification rationale writer (LLM tier 1)

**What.** The module's stated business value is "defensible, consistent classification with full audit trail" — and defensibility is a writing task. Evolution B drafts the classification rationale memo and the Article 4 PAI consideration statement: for each fund, it takes the deterministic cascade's verdict and per-threshold pass/fail values from page state and produces regulator-ready prose citing the specific RTS provision behind each threshold (the module's §7.2 table already maps them), plus the ESMA Q&A where interpretation matters.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sfdr-classification/ask`, corpus = this Atlas record plus the SFDR/RTS threshold table and the module's own disclosure-text generator output. The memo template is strict: verdict → thresholds met/missed with computed values → regulatory citation → residual risks. The LLM never re-decides a classification — it explains the rule engine's decision; a mismatch between narrative and verdict is a validation failure.

**Prerequisites.** None hard — the rule engine is already trustworthy; Evolution A's persistence makes memos re-generatable against historical runs. **Acceptance:** every threshold value in a memo equals the cascade's computed value; asking the copilot to "justify Article 9" for a fund the engine classified Article 8 yields a refusal explaining the failing criterion.
