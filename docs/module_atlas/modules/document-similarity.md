# Document Similarity
**Module ID:** `document-similarity` · **Route:** `/document-similarity` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
NLP-powered similarity analysis of sustainability disclosure documents enabling peer comparison, year-on-year change detection, and boilerplate identification. Uses transformer-based sentence embeddings and cosine similarity to quantify textual overlap. Flags sections with low year-on-year change that may indicate insufficient updating of disclosures.

> **Business value:** Helps disclosure teams and external reviewers identify stale boilerplate language and benchmark disclosure quality against peers. Supports assurance providers and regulators in assessing whether sustainability statements are sufficiently substantive and differentiated.

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
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `tfidfVectors` | `texts.map(t => textToTFIDF(t, vocabulary, idfMap));` |
| `docTokenSets` | `texts.map(t => new Set(tokenize(t)));` |
| `topicOverlap` | `topicCategories.map(topic => {` |
| `uniqueRatio` | `new Set(words).size / Math.max(words.length, 1);` |
| `dataPoints` | `(d.text.match(/\d+\.?\d*%?/g) \|\| []).length;` |
| `specificity` | `uniquePhrases[i].count / Math.max(words.length, 1);` |
| `score` | `Math.round((uniqueRatio * 40 + Math.min(dataPoints / 15, 1) * 35 + specificity * 100 * 25));` |
| `clusterSummaries` | `Object.entries(clusters).map(([cid, members]) => {` |

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
**Standards:** ['SEC Staff Comment Letters on Boilerplate', 'ESMA ESG Disclosure Quality Guidance', 'GRI Assurance Practice']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).