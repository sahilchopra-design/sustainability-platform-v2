# ML Feature Engineering
**Module ID:** `ml-feature-engineering` · **Route:** `/ml-feature-engineering` · **Tier:** B (frontend-computed) · **EP code:** EP-CX1 · **Sprint:** CX

## 1 · Overview
948 features (316 current + 316 velocity + 316 acceleration), PCA, mutual information selection, and data quality impact analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CORR_MATRIX`, `Card`, `DQ_IMPACT`, `FEATURE_CATALOG`, `KPI`, `MI_RANKING`, `PCA_DATA`, `PIPELINE_STATUS`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MI_RANKING` | `FEATURE_CATALOG.map(f=>({...f})).sort((a,b)=>b.importance-a.importance).slice(0,20);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DQ_IMPACT`, `PIPELINE_STATUS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Raw Features | — | Pipeline | 316×3 + metadata |
| Selected Features | — | MI ranking | After feature selection |
| PCA Variance (50 PCs) | — | PCA | Explained variance |

## 5 · Intermediate Transformation Logic
**Methodology:** Feature engineering pipeline
**Headline formula:** `Features = CurrentScores(316) + Velocity_3m(316) + Acceleration_12m(316) + Metadata`
**Standards:** ['PCA', 'Mutual Information']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).