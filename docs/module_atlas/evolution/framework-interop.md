## 9 · Future Evolution

### 9.1 Evolution A — Datapoint-level crosswalk with real Jaccard coverage (analytics ladder: rung 1 → 2)

**What.** §7 credits this as a genuine factual crosswalk: a 24-topic × 8-framework interoperability matrix (ISSB/CSRD/GRI/TCFD/SFDR/EU Taxonomy/TNFD/BRSR) with accurate datapoint references, from which pairwise overlaps and the "minimum data-point set" coverage are computed for real — only two decorative KPIs (`fwCoverage` 68–90%, the convergence-score trend) are `sRand()`-seeded. The §5 methodology names a Jaccard similarity (`|R_i ∩ R_j|/|R_i ∪ R_j|`) but the matrix operates at topic granularity. Evolution A deepens it from topic-level to datapoint-level: replace the 24 topic rows with the actual EFRAG-ISSB and GRI-ESRS datapoint crosswalks (published mappings), compute true Jaccard similarity per framework pair, and remove the two seeded decorative KPIs in favour of a computed coverage figure derived from a company's selected frameworks.

**How.** (1) Expand `INTEROP_MATRIX` into a datapoint table (ESRS datapoint ID ↔ ISSB paragraph ↔ GRI disclosure ↔ TCFD pillar), sourced from the EFRAG-ISSB interoperability guidance the module already cites. (2) Compute Jaccard per pair reproducing §5. (3) `fwCoverage` becomes `satisfied_datapoints/required_datapoints` for the user's framework selection — a real number, deleting the `sRand()` seed.

**Prerequisites.** The published datapoint crosswalk digitised into refdata (the ESRS/GRI catalogs are already in the DB per the roadmap); the two seeded KPIs removed. **Acceptance:** framework-pair Jaccard scores recompute from the datapoint sets; the coverage KPI responds to framework selection and carries no `sRand()`; overlap counts remain exact.

### 9.2 Evolution B — Disclosure-architecture copilot (LLM tier 1 → 2)

**What.** A copilot for sustainability teams: "we report under CSRD and ISSB and list in India — what's the minimum datapoint set, and where do BRSR requirements add unique work?" It narrates the real crosswalk (pairwise overlaps, least-covered topics, the optimised minimum set) and, tier-2, tool-calls the Evolution A coverage endpoint to compute the exact unified datapoint list and framework-specific gaps for the user's jurisdiction mix.

**How.** Tier 1 grounds on this atlas record and the module's factual matrix — a strong corpus because §7 confirms the crosswalk is accurate published reference content, not a model. The copilot's value is turning the matrix into a sequenced data-collection roadmap tied to the regulatory-deadline timeline the module carries. Tier 2 tool-calls the coverage/gap endpoint so "minimum datapoint set" is computed, not narrated. Since this is reference data rather than risk figures, the fabrication guard focuses on citing the specific matrix cell behind each mapping claim.

**Prerequisites.** Evolution A datapoint-level matrix for precise minimum-set computation (topic-level answers work today); corpus embedding. **Acceptance:** every framework-overlap or gap claim cites the matrix row/pair it derives from; the unified-datapoint answer post-Evolution-A matches the coverage endpoint output for the given framework selection.
