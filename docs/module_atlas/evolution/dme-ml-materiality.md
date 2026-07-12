## 9 · Future Evolution

### 9.1 Evolution A — Train the pipeline the page narrates (analytics ladder: rung 1 → 4, staged through 3)

**What.** The §7 flag is unambiguous: the page *presents* a full ML stack — LDA topics with coherences, K-means clusters, a 4-model ensemble with fixed AUCs, feature importances, PSI drift, retraining logs — but "none of it is trained or computed in the browser"; every model artifact is an authored constant or `sr()` draw. Evolution A replaces the ML narrative with a minimal *real* pipeline, run server-side, whose displayed metrics come from actual training runs.

**How.** Stage 1 (rung 3): `services/dme_ml_pipeline.py` running scikit-learn (already in the environment) — TF-IDF + LDA over a real filings corpus (public 10-K/sustainability-report set; the `esg-report-parser` ingestion path is the feeder), with *computed* coherence scores replacing the authored 0.69–0.88 values, and K-means with computed silhouettes replacing the seeded ones. Stage 2 (rung 4): train the classification ensemble on labeled materiality outcomes (SASB sector-material topics as weak labels to start), persist `ml_model_runs` (metrics, feature importances, version) and `ml_predictions` tables; the page's Model-Ops tabs (PSI, drift, retraining log) then display genuine run history. Every §8-convention model card ships with the run.

**Prerequisites (hard).** A real document corpus ingested first — no corpus, no model; labeled data strategy agreed (weak labels vs analyst annotations); honest deletion of the authored `MODELS`/`FEATURES` constants the moment real runs exist. **Acceptance:** the accuracy/AUC shown on the page equals the persisted metrics of a reproducible training run (seeded, versioned); retraining with new documents visibly changes coherences and importances.

### 9.2 Evolution B — LLM as the topic-mapping layer, model as the scorer (LLM tier 2)

**What.** The hardest part of the guide's pipeline — mapping discovered clusters to the ESRS/ISSB taxonomy and producing an "audit-ready evidence log" — is better served by an LLM than by the promised BERT mapping: a tool-calling assistant that takes Evolution A's real LDA topics (top words + exemplar passages), assigns each to ESRS sub-topics (the 84-topic list from ESRS 1 Appendix A, already in the refdata layer), and writes the evidence log entry citing the exemplar documents.

**How.** Tools: `get_lda_topics` and `get_cluster_exemplars` from Evolution A's pipeline endpoints, `lookup_esrs_topic` from refdata. The LLM's assignments are stored as *proposals* with confidence and quoted evidence, confirmed by an analyst before entering the materiality heatmap — the deterministic pipeline scores, the LLM labels, the human approves. The disagreement queue (currently a seeded UI mock) becomes real: cases where LLM taxonomy assignment conflicts with the classifier's cluster get flagged for review.

**Prerequisites (hard).** Evolution A stage 1 — mapping authored fake topics to ESRS would produce an evidence log citing documents nobody ingested, indefensible under CSRD assurance. **Acceptance:** every heatmap topic traces to a real cluster with ≥1 verbatim exemplar quote; on a golden corpus, LLM-assigned ESRS codes match a hand-labeled reference ≥90%, with mismatches queued rather than silently accepted.
