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
