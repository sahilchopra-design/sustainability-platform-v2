## 9 · Future Evolution

### 9.1 Evolution A — From MLOps mockup to measured pipeline (analytics ladder: rung 1 → 3)

**What.** §7.6 is explicit: this page is an architecture demonstration — the 5-model comparison (FinBERT/RoBERTa-ESG/VADER/TextBlob/LSTM) is a hand-set table with no training or inference code path, and the deep-dive caught the tell: FinBERT's stated accuracy (0.936) disagrees with the accuracy implied by its own confusion matrix (1,222/1,300 = 0.940). The pipeline stage taxonomy, however, matches the real `sentiment_analysis_engine` docstring verbatim — the page was designed as that backend's UI but never wired. Evolution A makes the monitoring surface report measured numbers: run at least two real classifiers (VADER via NLTK is dependency-light; FinBERT via transformers where the venv allows) on an ingested corpus, evaluate on a labelled held-out set, and render metrics from one computed source of truth.

**How.** (1) Wire the 8 pipeline tabs to the live endpoints (`POST /process-batch`, `GET /ref/sources`, `GET /ref/config`) so throughput, queue depth, and stage counts are real. (2) A small labelled ESG-sentiment eval set (~500 items, curated from public FinBERT benchmark data) stored as `golden_qa`-style fixtures; accuracy/precision/recall/F1 and the confusion matrix all derive from one evaluation run — the §7.2 discrepancy becomes structurally impossible. (3) TF-IDF weights and feature importances computed from the actual corpus, replacing the hand-set descending sequences.

**Prerequisites.** The backend-deps constraint applies (fastapi==0.110.1 pin; transformers may need the dedicated venv noted in platform memory); labelled eval data curation. **Acceptance:** the rendered confusion matrix reproduces the headline accuracy exactly; re-running evaluation updates both together.

### 9.2 Evolution B — LLM as pipeline stage: NER-to-LEI resolution and classification triage (LLM tier 2)

**What.** The overview's stated workflow — "run NER to identify and resolve company mentions to LEI" — is unimplemented, and the platform now has the golden-source asset for it: the GLEIF-populated `entity_lei` table. Evolution B inserts an LLM stage into the pipeline: extract entity mentions from raw text, resolve to LEI candidates via the existing entity-resolution routes, and classify topic against the E/S/G sub-theme taxonomy — with the deterministic engine still doing all scoring math downstream via `POST /process-signal`.

**How.** The LLM emits structured JSON (mention, LEI candidates with confidence, topic tags); low-confidence resolutions route to a human-review queue rather than auto-committing, mirroring the entity-resolution module's pattern. Every processed document logs `(text, extraction, engine score)` to `llm_traces` — training data for the Tier-4 flywheel. The Model Performance tab gains a real row: the LLM extractor's precision/recall on the labelled set, benchmarked against the spaCy baseline the page already names.

**Prerequisites (hard).** Evolution A's eval harness first — an LLM stage without measured precision/recall would recreate the hand-set-metrics problem this page exemplifies. **Acceptance:** on the labelled set, LEI resolution precision is reported from an actual run; unresolvable mentions appear in the review queue, never as silent guesses.
