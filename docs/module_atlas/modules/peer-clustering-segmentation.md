# Peer Clustering Segmentation
**Module ID:** `peer-clustering-segmentation` · **Route:** `/peer-clustering-segmentation` · **Tier:** B (frontend-computed) · **EP code:** EP-CX4 · **Sprint:** CX

## 1 · Overview
K-means clustering (k=2-10) with silhouette analysis, cluster profiles, migration tracking, and engagement prioritization.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CLUSTER_COLORS`, `CLUSTER_NAMES`, `Card`, `ENTITIES`, `KPI`, `SILHOUETTE_DATA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `cluster` | `Math.floor(i/4);` |
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
**Standards:** ['Lloyd (1982)', 'Rousseeuw (1987)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).