## 9 · Future Evolution

### 9.1 Evolution A — Real TSC/DNSH comparison replacing the hash-seeded crosswalk (analytics ladder: rung 1 → 3)

**What.** §7 flags a severe mismatch. The guide's formula (`alignment_score = Σ(activity_match × criteria_similarity × DNSH_equivalence)/n_activities`) describes a genuine activity-by-activity TSC and DNSH comparison across taxonomies, but the code fills all 420 crosswalk cells (30 activities × 14 taxonomies) with hash-seeded pseudo-random status and confidence — no TSC text comparison, no DNSH-equivalence check. Worse, the `ML_MODELS` tab displays fabricated accuracy/F1/latency for models that don't exist (the clearest displayed-but-unimplemented case), and the cosine-similarity vectors are `sr()`-seeded. Only the static reference tables (taxonomy metadata, SG amber thresholds, China catalogue, Japan roadmap, `QUANTIFIED_CONFLICTS` thresholds) are real. Evolution A builds the actual comparison: encode each taxonomy's TSC and DNSH provisions per activity as structured criteria, compute criteria similarity and DNSH equivalence from those, and derive the alignment score — deleting the hash-seeded matrix and the fake ML metrics.

**How.** (1) A structured TSC/DNSH table per taxonomy-activity (from legal texts, version-controlled). (2) `criteria_similarity` from threshold/condition comparison; `DNSH_equivalence` from a mapped-outcomes check; alignment computed per the §5 formula. (3) Real embeddings for the cosine-similarity tab (or remove it); the `ML_MODELS` tab either backed by a genuine classifier with honest metrics or deleted — fabricated model stats must not ship.

**Prerequisites.** Digitised TSC/DNSH criteria for the covered taxonomies (major undertaking; start with EU/UK/SG/China/ASEAN); the hash-seeded matrix and fake ML metrics removed as §7-flagged fabrications. **Acceptance:** alignment scores recompute from structured TSC/DNSH data reproducing the §5 formula; no `sr()`/hash-seeded value drives a crosswalk cell; the ML tab shows real metrics or is gone.

### 9.2 Evolution B — Dual-label green-bond structuring copilot (LLM tier 2)

**What.** A copilot for green-bond structurers: "can this solar-plus-storage activity carry both an EU Taxonomy and Singapore-Asia label, and where do the TSC thresholds diverge?" tool-calls the Evolution A crosswalk/conflict endpoints and narrates the divergent conditions and DNSH-equivalence findings, drafting the interoperability report for dual-label issuance.

**How.** Tier-2 tool-calling over the alignment and conflict-resolver endpoints; the grounding corpus is §5/§7 (EU Taxonomy 2020/852, ASEAN v2/v3, MAS Singapore-Asia, CBI Standard v4, China GIGC are cited). The copilot's value is navigating taxonomy fragmentation — mapping where a single activity clears multiple regimes. Guardrail, pre-Evolution-A: because the crosswalk is hash-seeded and the ML metrics fabricated, the copilot must refuse alignment-score and model-performance questions, using only the real static reference tables (amber thresholds, quantified conflicts).

**Prerequisites.** Evolution A (no real alignment computation today); corpus embedding. **Acceptance:** post-Evolution-A, every alignment and conflict figure traces to a tool call over structured TSC data; pre-Evolution-A the copilot declines crosswalk-score questions and never cites the fabricated ML metrics.
