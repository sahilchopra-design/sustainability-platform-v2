## 9 · Future Evolution

### 9.1 Evolution A — True Jaccard over the full activity universe (analytics ladder: rung 1 → 2)

**What.** §7 documents that the Cross-Taxonomy Alignment Index (`CTAI_ij = |Activities_i ∩ Activities_j|/|Activities_i ∪ Activities_j|`) is computed over a curated 25-activity × 8-taxonomy matrix — a real overlap calculation, but with two flagged limitations: the matrix is an illustrative sample (not the ~1,000-activity EU Taxonomy, so overlap percentages reflect the sample not the actual taxonomies), and the overlap uses a fixed `/25` denominator rather than a true Jaccard union (a pair where both cover few activities is understated). Evolution A fixes the maths and scales the data: implement the true Jaccard union denominator per pair, and expand the activity matrix toward the full taxonomy activity universe (or a materially larger, sourced subset), so the alignment index reflects real cross-taxonomy overlap.

**How.** (1) Replace the fixed `/25` denominator with `|A_i ∪ A_j|` per pair, reproducing the §5 Jaccard formula. (2) Expand the eligibility matrix from 25 illustrative activities toward the full EU Taxonomy activity set (and the other 7 taxonomies), sourced from the taxonomy legal texts and version-controlled. (3) Decompose divergence by TSC threshold stringency where activities overlap but criteria differ, per §5.

**Prerequisites.** The full/expanded activity-eligibility matrix digitised into refdata (major effort — start with high-materiality sectors); the Jaccard denominator corrected. **Acceptance:** overlap uses the true union denominator (a sparse pair is no longer understated); the matrix covers materially more than 25 activities with provenance; TSC-stringency divergence is decomposed.

### 9.2 Evolution B — Cross-taxonomy navigation copilot (LLM tier 1 → 2)

**What.** A copilot for multi-jurisdiction issuers: "does this activity qualify under both EU Taxonomy and the ASEAN Taxonomy, and where do the TSC thresholds diverge?" narrates the eligibility matrix and interoperability overlaps from the atlas corpus, with tier-2 computing the CTAI and threshold divergence via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (the Jaccard alignment index, the taxonomy eligibility matrix, TSC-stringency decomposition). The copilot's value is activity-level cross-taxonomy navigation — where an activity clears multiple regimes and where thresholds differ. Guardrail, pre-Evolution-A: overlaps reflect a 25-activity sample with a non-Jaccard denominator, so it must flag that the percentages are illustrative. Tier 2 tool-calls the CTAI endpoint. Cross-links to the `global-taxonomy-interop-v2` sibling from the atlas graph.

**Prerequisites.** Corpus embedding; Evolution A for corrected/expanded computation. **Acceptance:** every overlap or divergence claim cites the matrix and (post-Evolution-A) the true-Jaccard endpoint; pre-Evolution-A the copilot labels overlap percentages as sample-based illustrative figures.
