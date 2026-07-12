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
