# Assessment Engine Dashboard
**Module ID:** `assessment-engine-dashboard` · **Route:** `/assessment-engine-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CS2 · **Sprint:** CS

## 1 · Overview
Score aggregation dashboard with sunburst visualization, entity heatmap, scenario comparison, and quarterly trend analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `ENTITIES`, `L1_COLORS`, `QUARTERS`, `RATING_COLORS`, `RatingBadge`, `SCENARIOS`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Portfolio Overview', 'Entity Deep-Dive', 'Score Distribution', 'Scenario Comparison', 'Trend Analysis', 'Heatmap'];` |
| `overall` | `Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(1, TAXONOMY_TREE.length));` |
| `portfolioAvg` | `useMemo(() => Math.round(ENTITIES.reduce((s, e) => s + e.overall, 0) / Math.max(1, ENTITIES.length)), []);` |
| `sunburstData` | `useMemo(() => TAXONOMY_TREE.map((l1, i) => ({` |
| `radarData` | `useMemo(() => TAXONOMY_TREE.map(t => ({` |
| `buckets` | `Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0 }));` |
| `scenarioData` | `useMemo(() => SCENARIOS.map((sc, i) => ({` |
| `trendData` | `useMemo(() => QUARTERS.map((q, i) => ({` |
| `heatmapData` | `useMemo(() => ENTITIES.map(e => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `L1_COLORS`, `QUARTERS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Score | `AUM-weighted` | Aggregation | Exposure-weighted average across entities |
| Rating | `scoreToRating()` | Model | Moderate transition position |

## 5 · Intermediate Transformation Logic
**Methodology:** Bottom-up aggregation + scenario sensitivity
**Headline formula:** `CompositeScore = Σ(L1_i × weight_i) / Σ(weight_i)`
**Standards:** ['NGFS Phase 5', 'PCAF']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).