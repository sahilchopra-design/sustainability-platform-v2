# Document Similarity
**Module ID:** `document-similarity` · **Route:** `/document-similarity` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
NLP-powered similarity analysis of sustainability disclosure documents enabling peer comparison, year-on-year change detection, and boilerplate identification. Uses transformer-based sentence embeddings and cosine similarity to quantify textual overlap. Flags sections with low year-on-year change that may indicate insufficient updating of disclosures.

> **Business value:** Helps disclosure teams and external reviewers identify stale boilerplate language and benchmark disclosure quality against peers. Supports assurance providers and regulators in assessing whether sustainability statements are sufficiently substantive and differentiated.

**How an analyst works this module:**
- Upload the current year disclosure and the prior year document for year-on-year change analysis
- Select a peer cohort to run cross-company similarity benchmarking
- Review sections flagged as boilerplate and prioritise them for substantive updating
- Use the semantic search to find the most similar peer sections for language benchmarking

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLUSTER_COLORS`, `DocumentSimilarityPage`, `ESG_EXCERPTS`, `STOP_WORDS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `dot` | `vec1.reduce((s, v, i) => s + v * (vec2[i] \|\| 0), 0);` |
| `mag1` | `Math.sqrt(vec1.reduce((s, v) => s + v * v, 0));` |
| `mag2` | `Math.sqrt(vec2.reduce((s, v) => s + v * v, 0));` |
| `centroids` | `data.slice(0, Math.min(k, data.length)).map(d => [...d]);` |
| `dist` | `point.reduce((s, v, i) => s + (v - (c[i] \|\| 0)) ** 2, 0);` |
| `centered` | `vectors.map(v => v.map((val, i) => val - mean[i]));` |
| `projected` | `centered.map(v => {` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => {` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `tfidfVectors` | `texts.map(t => textToTFIDF(t, vocabulary, idfMap));` |
| `docTokenSets` | `texts.map(t => new Set(tokenize(t)));` |
| `topicOverlap` | `topicCategories.map(topic => {` |
| `uniqueRatio` | `new Set(words).size / Math.max(words.length, 1);` |
| `dataPoints` | `(d.text.match(/\d+\.?\d*%?/g) \|\| []).length;` |
| `specificity` | `uniquePhrases[i].count / Math.max(words.length, 1);` |
| `score` | `Math.round((uniqueRatio * 40 + Math.min(dataPoints / 15, 1) * 35 + specificity * 100 * 25));` |
| `clusterSummaries` | `Object.entries(clusters).map(([cid, members]) => {` |
| `memberDocs` | `members.map(i => docs[i]);` |
| `avgSim` | `members.length > 1 ? members.reduce((s, mi) => s + members.reduce((s2, mj) => s2 + (mi !== mj ? simMatrix[mi][mj] : 0), 0), 0) / (members.length * (members.length - 1) \|\| 1) : 1;` |
| `freq` | `{}; allWords.forEach(w => { freq[w] = (freq[w] \|\| 0) + 1; });` |
| `topTerms` | `Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);` |
| `boilerplateScore` | `pairList.length ? (boilerplateFlags.length / pairList.length * 100) : 0;` |
| `sectorAvgSim` | `sectorNames.map(s => {` |
| `radarData` | `sectorNames.map(s => {` |
| `gaps` | `analysis.docs.map(d => {` |
| `densityData` | `analysis.docs.map(d => {` |
| `numbers` | `(d.text.match(/\d+\.?\d*/g) \|\| []).length;` |
| `sentences` | `d.text.split(/[.!?]+/).filter(s => s.trim().length > 10).length;` |
| `stats` | `analysis.docs.map(d => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLUSTER_COLORS`, `ESG_EXCERPTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg Year-on-Year Section Similarity | — | NLP similarity engine | Mean cosine similarity between current and prior year sections across all disclosure documents |
| Boilerplate-Flagged Sections | — | Boilerplate detection (CSS > 0.92) | Count of sections flagged as potentially boilerplate due to near-identical year-on-year language |
| Peer Disclosure Similarity (Median) | — | Peer comparison engine | Median cosine similarity between the entity's disclosure and sector peers, indicating differentiation |
| Documents Indexed | — | Document repository | Total sustainability disclosure documents indexed in the similarity search database |
- **Sustainability disclosure documents (PDF, HTML, XBRL narrative)** → Text extraction, section segmentation, and transformer embedding generation → **Per-section embedding vectors stored in vector database**
- **Prior year and peer documents (indexed corpus)** → Cosine similarity calculation between target and reference document embeddings → **Similarity score matrix with section-level granularity**
- **Boilerplate detection rules (CSS > 0.92 threshold)** → Threshold application and year-on-year section comparison → **Boilerplate flag inventory with specific section locations**

## 5 · Intermediate Transformation Logic
**Methodology:** Cosine Similarity Score
**Headline formula:** `CSS = (A · B) / (||A|| × ||B||)`

Document sections are encoded as dense embedding vectors using a fine-tuned ESG language model. Cosine similarity between two section vectors ranges from 0 (orthogonal) to 1 (identical). Sections with CSS above 0.92 versus the prior year are flagged as potentially boilerplate; those below 0.30 versus peers indicate idiosyncratic disclosure language.

**Standards:** ['SEC Staff Comment Letters on Boilerplate', 'ESMA ESG Disclosure Quality Guidance', 'GRI Assurance Practice']
**Reference documents:** SEC (2021) Staff Letter: Observations on Climate-related Disclosures â€” Boilerplate Language Concerns; ESMA (2022) Supervisory Briefing on Sustainability Disclosures â€” Quality Standards; GRI (2021) Assurance of GRI Reports â€” Guidance for Practitioners

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Document Similarity is one of the few DME-family pages that runs a **genuine, in-browser NLP pipeline**:
tokenisation → TF-IDF vectorisation → cosine similarity → K-means clustering → 2-D projection, over 15
**real** ESG-report excerpts (`ESG_EXCERPTS`, Reliance/TCS/Shell/Apple/…). There is no `sr()`-seeded
data behind the core analysis (only chart cosmetics). No guide record supplied, so no mismatch flag.

### 7.1 What the module computes

```js
// Vocabulary: terms appearing in ≥2 docs and <90% of docs (drop rare + ubiquitous)
buildVocabulary(docs) → terms with 2 ≤ df < 0.9·N
// IDF (smoothed)
idf[t] = ln((N+1)/(df_t+1)) + 1
// TF-IDF vector per doc
tfidf[t] = (count_t / len(doc)) · idf[t]
// Similarity
cosine(a,b) = (a·b) / (|a|·|b|)
// Clustering (Lloyd's K-means, ≤100 iterations, first-k seeding)
kMeans(vectors, k): assign to nearest centroid (squared L2), recompute means, stop on convergence
// 2-D layout
simplePCA(vectors): deterministic linear projection to (x,y)
```
Tokenisation lowercases, strips punctuation, drops tokens ≤2 chars and a ~90-word `STOP_WORDS` set.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Min document frequency | df ≥ 2 | vocabulary pruning (drop hapax) |
| Max document frequency | df < 0.9·N | drop near-ubiquitous terms |
| IDF smoothing | +1 numerator/denominator, +1 offset | standard smoothed IDF |
| Min token length | > 2 chars | tokeniser |
| K-means max iterations | 100 | Lloyd's algorithm |
| Cluster palette | 6 colours | display |
| Corpus | 15 ESG excerpts | **real** authored excerpts (named companies) |

The TF-IDF and cosine formulas are textbook-correct. **Caveat:** `simplePCA` is *not* real PCA — it is a
fixed hand-weighted linear projection (`i%3`, `i<n/2` sign patterns), so the scatter layout is a cosmetic
2-D embedding, not variance-maximising principal components.

### 7.3 Calculation walkthrough

1. Build the corpus (15 excerpts + any user-added text).
2. `buildVocabulary` → shared term list; `computeIDF` → IDF map; `textToTFIDF` → one vector per doc.
3. Pairwise `cosineSimilarity` → similarity matrix / heatmap; nearest-neighbour "most similar report".
4. `kMeans(vectors, k)` → cluster assignments (thematic groupings, e.g. energy-transition vs tech-supply-chain).
5. `simplePCA` → 2-D scatter coloured by cluster.

### 7.4 Worked example (cosine on a 2-term slice)

Take vocabulary slice {"renewable", "emissions"}. Doc D03 (Shell) TF-IDF ≈ [0.021, 0.034]; Doc D10 (Enel)
≈ [0.028, 0.019].
```
dot   = 0.021·0.028 + 0.034·0.019 = 0.000588 + 0.000646 = 0.001234
|D03| = √(0.021² + 0.034²) = √(0.000441+0.001156) = √0.001597 = 0.03996
|D10| = √(0.028² + 0.019²) = √(0.000784+0.000361) = √0.001145 = 0.03384
cosine = 0.001234 / (0.03996·0.03384) = 0.001234 / 0.001352 = 0.913
```
The two utilities/energy transition reports score highly similar (0.91) — as expected given shared
renewable/emissions vocabulary. (Full vectors use the entire vocabulary; this 2-term slice illustrates the mechanic.)

### 7.5 Data provenance & limitations

- **Corpus is real** (15 hand-written ESG excerpts for named companies); TF-IDF, cosine and K-means all
  run for real on that text — no `sr()` seeding in the analysis.
- **`simplePCA` is a fake projection** — a fixed linear map, not eigen-decomposition; distances in the
  scatter are not faithful to the high-dimensional TF-IDF space. K-means, however, runs on the true vectors.
- K-means uses **first-k seeding** (not k-means++), so cluster results depend on document order and can be
  unstable for some k.
- Corpus is tiny (15 docs), so IDF and clusters are illustrative, not production-scale.

**Framework alignment:** classic **information-retrieval TF-IDF + cosine similarity** (Salton vector-space
model), **Lloyd's K-means** unsupervised clustering, and a (simplified) **dimensionality-reduction**
scatter. The application — detecting boilerplate/greenwashing overlap and thematic clustering across ESG
disclosures — mirrors SASB/TCFD disclosure-comparison and vendor NLP tools (Truvalue Labs, ClimateBERT
similarity), though those use learned embeddings rather than sparse TF-IDF.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (embedding upgrade + real PCA).**

### 8.1 Purpose & scope
Detect disclosure similarity, boilerplate reuse and thematic clusters across the full ESG-report corpus,
to flag copy-paste greenwashing and benchmark disclosure differentiation. Scope: all covered issuers'
sustainability disclosures.

### 8.2 Conceptual approach
Replace sparse TF-IDF with **sentence-transformer embeddings** (SBERT / ClimateBERT) for semantic
similarity, real **PCA/UMAP** for layout, and **HDBSCAN** for density clustering. Benchmarks: ClimateBERT
disclosure analysis, Truvalue Labs SASB-tagged similarity, standard IR (BM25 + dense retrieval).

### 8.3 Mathematical specification
```
Embed: e_d = MeanPool(SBERT(sentences_d)) ∈ R^384
Sim:   cos(e_a,e_b)
Layout: PCA via SVD of centred embedding matrix (top-2 singular vectors)  OR UMAP
Cluster: HDBSCAN(min_cluster_size) on embeddings; boilerplate flag if max_j cos(e_a,e_j) > 0.95
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Embedding model | — | SBERT/ClimateBERT fine-tuned on ESG text |
| Boilerplate threshold | 0.95 | validated against known copied disclosures |
| min_cluster_size | — | tuned for corpus size |

### 8.4 Data requirements
Full-text ESG/sustainability reports (SEC EDGAR, company sites), sentence segmentation, embedding model.
Free: EDGAR, CDP; the platform holds the excerpt corpus and can expand it via the ETL pipeline.

### 8.5 Validation & benchmarking plan
Human-labelled similarity pairs for precision/recall of the boilerplate flag; cluster coherence (silhouette
on embeddings); compare dense-embedding clusters vs the current TF-IDF clusters; verify real PCA variance
explained.

### 8.6 Limitations & model risk
TF-IDF misses paraphrase; the current fake PCA misleads on distances. Embeddings can over-cluster on
domain boilerplate. Conservative fallback: surface similarity scores with the method used, and require
human review before labelling a disclosure as copied/greenwashed.

## 9 · Future Evolution

### 9.1 Evolution A — From 15 excerpts to an indexed corpus with a calibrated boilerplate threshold (analytics ladder: rung 1 → 3)

**What.** §7 confirms this is one of the few pages with a genuine in-browser NLP pipeline — tokenization → smoothed TF-IDF → cosine similarity → Lloyd's K-means → deterministic PCA — over 15 real ESG-report excerpts, with no seeded data behind the core analysis. The limits are scale and validation: 15 hand-picked excerpts instead of the promised document repository, TF-IDF instead of the guide's transformer embeddings, and the CSS>0.92 boilerplate threshold asserted rather than calibrated. Evolution A builds the backend corpus and validates the threshold.

**How.** (1) Backend vertical `api/v1/routes/document_similarity.py` with pgvector storage (`llm_corpus_chunks`-style table for report sections — the roadmap's D3 stage provides the extension) and real embedding vectors alongside TF-IDF (keep TF-IDF as the cheap fallback; it's already correct). (2) Ingestion via upload + the `esg-report-parser` path: section segmentation, year-tagging, peer-cohort metadata, so year-on-year comparison operates on actual document pairs rather than the current single-corpus view. (3) Calibration to earn rung 3: hand-label ~200 section pairs as boilerplate/substantive and report precision/recall of the 0.92 threshold (and of embedding-based CSS) — SEC/ESMA reviewers will ask where 0.92 comes from; the answer should be a labeled evaluation, not convention.

**Prerequisites.** pgvector enabled on the Supabase instance; a corpus licensing check for redistributed report text (store embeddings + quotes, not full documents, where needed). **Acceptance:** uploading a two-year document pair yields section-level YoY similarity from the API; the boilerplate threshold ships with published precision/recall on the labeled set; the K-means/TF-IDF math is bench-pinned so the port doesn't drift.

### 9.2 Evolution B — Boilerplate remediation assistant (LLM tier 2)

**What.** Flagging stale sections is mechanical; fixing them is where teams stall. A tool-calling assistant takes each flagged section (CSS>threshold vs prior year), retrieves the most-differentiated peer sections on the same topic via the similarity index, and drafts *substantive-update guidance*: which quantitative datapoints are missing (the page already computes numeric-density per section), which peer framings are more specific, and what disclosure-quality reviewers have criticized — grounded in the module's SEC/ESMA reference corpus.

**How.** Tools: `get_flagged_sections`, `find_similar_peer_sections` (vector search), `get_section_stats` (density/specificity scores the page already computes) from Evolution A's API. The assistant's output is guidance plus quoted peer examples — it does not ghost-write disclosure content wholesale, keeping the human disclosure owner in the loop and avoiding the irony of an LLM generating new boilerplate. Similarity scores and density stats in the answer are validator-checked against tool outputs.

**Prerequisites (hard).** Evolution A's indexed corpus — with today's 15 excerpts, peer retrieval would return the same handful of companies for every query and the guidance would overfit to them. **Acceptance:** for a golden flagged section, every quoted peer passage resolves to an indexed document with its similarity score; suggested datapoints correspond to actual gaps in the section's computed numeric density, not generic advice.