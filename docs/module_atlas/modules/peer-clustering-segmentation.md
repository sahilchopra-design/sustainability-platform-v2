# Peer Clustering Segmentation
**Module ID:** `peer-clustering-segmentation` · **Route:** `/peer-clustering-segmentation` · **Tier:** B (frontend-computed) · **EP code:** EP-CX4 · **Sprint:** CX

## 1 · Overview
K-means clustering (k=2-10) with silhouette analysis, cluster profiles, migration tracking, and engagement prioritization.

**How an analyst works this module:**
- Cluster Visualization shows PC1 vs PC2 scatter
- Silhouette Analysis shows optimal k
- Migration Tracker shows entity movement between clusters

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BASE_ENTITIES`, `Badge`, `CLUSTER_COLORS`, `CLUSTER_NAMES`, `Card`, `ENTITIES`, `FEATURES`, `KPI`, `OPTIMAL_K`, `PCA_SCALE`, `RAW_FEATURES`, `SILHOUETTE_DATA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `makeSeededRng` | `(seed) => { let s = seed; return () => { s += 1; return sr(s); }; };` |
| `dot` | `(a, b) => a.reduce((s, v, i) => s + v * b[i], 0);` |
| `meanArr` | `(arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;` |
| `sqDist` | `(a, b) => a.reduce((s, v, i) => s + (v - b[i]) * (v - b[i]), 0);` |
| `euclidean` | `(a, b) => Math.sqrt(sqDist(a, b));` |
| `dists` | `data.map(p => Math.min(...centroids.map(c => sqDist(p, c))));` |
| `total` | `dists.reduce((a, b) => a + b, 0);` |
| `labels` | `new Array(data.length).fill(-1);` |
| `newCentroids` | `sums.map((s, c) => counts[c] ? s.map(v => v / counts[c]) : centroids[c]);` |
| `shift` | `newCentroids.reduce((a, c, ci) => a + euclidean(c, centroids[ci]), 0);` |
| `inertia` | `data.reduce((a, p, i) => a + sqDist(p, centroids[labels[i]]), 0);` |
| `result` | `kmeans(data, k, makeSeededRng(seedBase + r * 733));` |
| `matVec` | `(M, v) => M.map(row => dot(row, v));` |
| `normalizeVec` | `(v) => { const norm = Math.sqrt(dot(v, v)) \|\| 1; return v.map(x => x / norm); };` |
| `order` | `sums.map((s, c) => ({ c, avg: counts[c] ? s / counts[c] : -Infinity })).sort((a, b) => b.avg - a.avg).map(o => o.c);` |
| `clusterName` | `(c) => CLUSTER_NAMES[c] \|\| `Cluster ${c + 1}`;` |
| `tier` | `Math.floor(i/4);` |
| `RAW_FEATURES` | `BASE_ENTITIES.map(e => [e.scores.env, e.scores.soc, e.scores.gov, e.scores.climate]);` |
| `ENTITIES` | `BASE_ENTITIES.map((e, i) => ({` |
| `OPTIMAL_K` | `SILHOUETTE_DATA.reduce((best, d) => d.silhouette > best.silhouette ? d : best, SILHOUETTE_DATA[0]).k;` |
| `clusterAssignment` | `useMemo(() => { const { labels } = kmeansBest(FEATURES, kVal, 10, 4242 + kVal * 911);` |
| `clusteredEntities` | `useMemo(() => ENTITIES.map((e, i) => ({ ...e, cluster: clusterAssignment[i] })), [clusterAssignment]);` |
| `currentSilhouette` | `useMemo(() => Math.round(silhouetteScore(FEATURES, clusterAssignment, kVal) * 100) / 100, [clusterAssignment, kVal]);` |
| `radarData` | `useMemo(() => ['env','soc','gov','climate'].map(key => {` |
| `row` | `{ topic: key.charAt(0).toUpperCase()+key.slice(1) };` |
| `migrationData` | `useMemo(() => ENTITIES.map(e => {` |
| `moved` | `quarters.some((q,i) => i>0 && q !== quarters[i-1]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLUSTER_COLORS`, `CLUSTER_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Optimal k | — | Silhouette | Best cluster count |
| Best Silhouette | — | k=5 | Good clustering quality |

## 5 · Intermediate Transformation Logic
**Methodology:** K-means with silhouette optimization
**Headline formula:** `Silhouette(i) = (b(i) - a(i)) / max(a(i), b(i))`

Optimal k selected by silhouette analysis. PC1 vs PC2 scatter visualization. Cluster profiles show average taxonomy scores. Migration tracker: entity movement between clusters over quarters.

**Standards:** ['Lloyd (1982)', 'Rousseeuw (1987)']
**Reference documents:** Lloyd (1982) K-means; Rousseeuw (1987) Silhouettes

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** MODULE_GUIDES describes **K-means clustering (k=2–10) with
> silhouette-coefficient optimal-k selection**, `Silhouette(i) = (b(i)−a(i))/max(a(i),b(i))`, and a
> PC1-vs-PC2 PCA scatter. **No clustering algorithm, distance metric, or PCA computation exists in
> the code.** Cluster assignment is `cluster = Math.floor(i/4)` — entities are sorted into clusters
> purely by their array index in groups of four, entirely independent of any taxonomy/feature data.
> `pc1`/`pc2` and the silhouette scores are each independently seeded random draws, with the k=5
> silhouette score given a small hard-coded bonus to make it look "optimal." Sections below document
> the code as it behaves; §8 specifies the real k-means + silhouette + PCA pipeline the guide
> describes.

### 7.1 What the module computes

```js
cluster    = Math.floor(i / 4)                                   // sequential grouping by index, not by similarity
pc1        = round((base-50 + (sr(i*21)*2-1)*15) × 10)/10          // independent random draw, offset by an unrelated "base"
pc2        = round(((sr(i*517)*2-1)*20 + cluster*5-10) × 10)/10    // random draw + a linear function of the (fake) cluster id
silhouette(k) = round((0.3 + (sr(i*8)*2-1)*0.15 + (i===3?0.1:0.05)*0.1) × 100)/100   // random, with k=5 nudged higher
```

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| Cluster assignment | `floor(i/4)` | Not a clustering output — a deterministic index-based grouping with no relationship to any feature vector |
| `pc1`/`pc2` | random, `pc2` linearly offset by cluster id | The `cluster*5-10` term in `pc2` artificially separates the fake clusters visually on the scatter plot, manufacturing the *appearance* of cluster separation without any underlying distance-based clustering |
| `SILHOUETTE_DATA` (9 rows, k=2..10) | `0.3 ± 0.15` baseline, k=5 gets `+0.1×0.1=+0.01` bonus (both in the extract and the guide's stated "k=5 optimal, silhouette=0.68" narrative) | Synthetic demo value engineered to make k=5 appear optimal |
| "948-dimensional feature space" (footer text) | descriptive claim only | No 948-feature taxonomy vector, standardisation, or PCA dimensionality-reduction step exists in the extracted formulas |

### 7.3 Calculation walkthrough

1. **"Cluster Visualization" tab**: plots `pc1` vs `pc2` per entity, coloured by the fake
   `cluster` id — visually resembles a k-means scatter but is generated to look clustered by
   construction (`pc2` includes an explicit `cluster*5` offset), not because any clustering
   algorithm grouped similar entities together.
2. **"Silhouette Analysis" tab**: bar chart of `SILHOUETTE_DATA` across k=2..10, highlighting k=5 in
   green — the "optimal k" conclusion is pre-determined by the seed data's hard-coded bonus, not
   computed from actual within/between-cluster distances.
3. **"Cluster Profiles" tab** (`radarData`): averages taxonomy dimensions (`env`, `soc`, `gov`,
   `climate`) per cluster — a legitimate aggregation mechanic, but grouping entities by their fake
   sequential cluster id rather than by genuine similarity means the resulting "profiles" reflect
   whatever entities happened to be adjacent in the source array, not a coherent peer segment.
4. **"Migration Tracker" tab** (`migrationData`): flags whether an entity's cluster changed across
   quarters (`quarters.some((q,i)=>i>0 && q!==quarters[i-1])`) — the *mechanic* (detecting movement
   between segments over time) is sound and would work correctly once fed real cluster assignments;
   currently the migration tracked has no interpretive meaning since underlying clusters are
   arbitrary.

### 7.4 Worked example

Entity index `i=17`: `cluster = floor(17/4) = 4` — this is entirely deterministic from array
position; the entity immediately before it (`i=16`) and immediately after (`i=18, cluster=4`) fall
in the same "cluster" purely by virtue of index adjacency, regardless of their actual ESG/climate
taxonomy scores.

### 7.5 Data provenance & limitations

- **The entire clustering pipeline is fabricated** — no distance metric, no iterative centroid
  update, no convergence criterion, no PCA dimensionality reduction. A user reading "Optimal k=5"
  and "silhouette=0.68" would reasonably believe a real unsupervised-learning analysis was run; it
  was not.
- The "948-dimensional feature space" and "standardized taxonomy features (z-score normalization)"
  claims in the page footer text describe a methodology entirely absent from the code.
- Migration tracking logic is technically sound but operates on meaningless cluster labels.

**Framework alignment:** the guide cites Lloyd (1982) K-means and Rousseeuw (1987) silhouette
analysis — legitimate, standard unsupervised-learning references — but neither is implemented; this
module should be treated as a **UI mockup of a clustering feature**, not a working analytical tool,
until §8 is implemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Segment a peer universe of companies/counterparties into climate-transition peer groups from
multi-dimensional ESG/climate taxonomy features, to support benchmarking, engagement prioritisation,
and portfolio construction — mirrors MSCI ESG's peer-group construction and Bloomberg's
sector-relative ESG percentile ranking, both of which use standardised feature distance for grouping.

### 8.2 Conceptual approach
Standard **k-means clustering with silhouette-based k selection**, following **Lloyd's algorithm**
(1982) and **Rousseeuw's silhouette method** (1987), on z-score-standardised taxonomy features, with
**PCA** for 2D visualisation — the exact pipeline the guide already describes; this benchmarks
against how index providers (MSCI, Sustainalytics) construct ESG peer-comparison groups and how
Aladdin's Climate/ESG factor models reduce high-dimensional risk-factor exposure to 2–3 principal
components for visualisation.

### 8.3 Mathematical specification

```
Standardise:  x'_ij = (x_ij − μ_j) / σ_j                     for each feature j across entities i
PCA:          X' = U Σ Vᵀ;  PC1, PC2 = first two columns of U·Σ   (2D projection for scatter)
K-means:      minimise Σ_k Σ_{i∈Ck} ||x'_i − centroid_k||²      (Lloyd's iterative algorithm)
Silhouette:   s(i) = (b(i) − a(i)) / max(a(i), b(i))
  a(i) = mean distance from i to other points in its own cluster
  b(i) = mean distance from i to points in the nearest other cluster
Optimal k = argmax_k  mean(s(i))  over k = 2..10
```

| Parameter | Calibration source |
|---|---|
| Feature set | Platform taxonomy scores (env/social/gov/climate sub-scores already computed elsewhere) |
| Distance metric | Euclidean on standardised features (k-means standard) |
| k range | 2–10 (guide's stated range, reasonable for typical peer-group sizes) |
| Random init | k-means++ seeding (reduces sensitivity to initialisation vs naive random init) |

### 8.4 Data requirements
Per-entity standardised feature vector (the "948-dimensional" claim needs to be reconciled against
what taxonomy fields actually exist in-platform — likely far fewer than 948 real fields). Existing
taxonomy/ESG scores computed in sibling modules (e.g. `peer-transition-benchmarker`'s 6-pillar
scores) are a natural feature source already in-platform.

### 8.5 Validation & benchmarking plan
Compare resulting clusters against known sector/sub-industry groupings (do clusters recover GICS
sub-industries, or find cross-sector transition-risk cohorts that GICS misses — the latter is the
more interesting use case); stability-test cluster assignment under bootstrap resampling.

### 8.6 Limitations & model risk
K-means assumes roughly spherical, similarly-sized clusters — a Gaussian-mixture or hierarchical
approach may better capture skewed peer-group sizes (e.g. a few climate leaders vs a long tail of
laggards); PCA-2D visualisation necessarily discards variance beyond the first two components and
can mislead on cluster separation that only exists in higher dimensions.

## 9 · Future Evolution

### 9.1 Evolution A — Implement real k-means + silhouette + PCA (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag is severe: the guide describes k-means (k=2–10) with silhouette optimal-k selection and a PC1-vs-PC2 PCA scatter, but *none* of it exists — cluster assignment is `Math.floor(i/4)` (entities grouped by array index in fours, unrelated to any feature), `pc1`/`pc2` are independent random draws with `pc2` artificially offset by the fake cluster id to manufacture visual separation, and the silhouette scores are seeded with a hard-coded bonus at k=5 to make it look optimal. The "948-dimensional feature space" footer is a claim with no backing vector. This is one of the most fabricated modules in the batch — Evolution A is a full greenfield implementation.

**How.** (1) Assemble a real feature vector per entity from the platform's actual data (taxonomy scores, emissions, transition metrics — the module claims 948 features; use whatever real features exist, standardised). (2) Run genuine k-means (`sklearn.cluster.KMeans`, already in the environment) for k=2–10, compute real silhouette coefficients (`Silhouette(i) = (b(i)−a(i))/max(a(i),b(i))` per §5), and select optimal k by the actual maximum — no hard-coded k=5 bonus. (3) Real PCA (`sklearn.decomposition.PCA`) for the PC1/PC2 scatter, so cluster separation reflects true feature-space distance. Backend endpoint since sklearn belongs server-side. (4) Migration tracking becomes real cluster-reassignment over time.

**Prerequisites.** A real feature source (the current page has none — this is the hard part); sklearn in a backend service (the pinned fastapi/starlette venv may need care). Remove all `sr()` and the `floor(i/4)` grouping per platform rule. **Acceptance:** clusters reflect feature-space similarity (verifiable: similar entities co-cluster); optimal k is the genuine silhouette maximum, not nudged; PCA scatter separation is real, not manufactured by a cluster-id offset.

### 9.2 Evolution B — Segmentation-analysis copilot (LLM tier 2, gated on real clustering)

**What.** A copilot for the segmentation workflow §1 describes: "what distinguishes cluster 3 from cluster 1?", "which entities migrated clusters this quarter and why?", "what's the optimal number of segments?" — executed against the (Evolution-A) real k-means/silhouette engine, explaining clusters by their actual feature centroids and the drivers of migration.

**How.** Tool calls to the clustering endpoint returning cluster centroids, silhouette scores, and PCA coordinates; system prompt from this Atlas page's §5 and the Lloyd/Rousseeuw references named in §5 so k-means and silhouette are explained correctly. Cluster interpretation comes from the real feature centroids (which features distinguish each cluster), and migration explanations from actual feature changes over time; the fabrication validator matches every silhouette/coordinate to a tool response. The copilot must convey clustering's interpretive caveats (cluster labels are descriptive, k is a modelling choice).

**Prerequisites (hard).** Evolution A — there is no real clustering, PCA, or silhouette to explain today; a copilot describing "what distinguishes cluster 3" when clusters are `floor(i/4)` index-groups would fabricate insights from noise, and the manufactured k=5-optimal narrative would mislead. **Acceptance:** every cluster explanation references real feature centroids; optimal-k answers cite the genuine silhouette curve; migration explanations trace to actual feature changes; no narration of the current fake clusters.