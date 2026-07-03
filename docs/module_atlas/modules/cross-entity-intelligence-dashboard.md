# Cross-Entity Dashboard
**Module ID:** `cross-entity-intelligence-dashboard` · **Route:** `/cross-entity-intelligence-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CW6 · **Sprint:** CW

## 1 · Overview
Platform KPIs, entity type comparison, 15×8 risk heatmap, alert center, and board pack generator.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `Badge`, `Card`, `ENTITIES`, `ENTITY_TYPES`, `KPI`, `L1_TOPICS`, `TABS`, `TREND_DATA`, `TYPE_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TREND_DATA` | `['Q1-25','Q2-25','Q3-25','Q4-25','Q1-26'].map((q,qi) => ({` |
| `avgByType` | `useMemo(() => ENTITY_TYPES.map(type => {` |
| `avgScores` | `L1_TOPICS.map((_,ti) => Math.round(ents.reduce((a,e)=>a+e.scores[ti],0)/ Math.max(1, ents.length)));` |
| `platformAvg` | `useMemo(() => Math.round(ENTITIES.reduce((a,e)=>a+e.scores.reduce((b,c)=>b+c,0)/8,0)/ Math.max(1, ENTITIES.length)), []);` |
| `heatMapData` | `useMemo(() => ENTITIES.map(e => ({ name:e.name, type:e.type, scores: Object.fromEntries(L1_TOPICS.map((t,i)=>[t,e.scores[i]])) })), []);` |
| `buckets` | `[{ range:'0-25', count:0 },{ range:'26-50', count:0 },{ range:'51-75', count:0 },{ range:'76-100', count:0 }];` |
| `avg` | `Math.round(e.scores.reduce((a,b)=>a+b,0)/8);` |
| `comparisonRadar` | `useMemo(() => L1_TOPICS.map((t,ti) => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERTS`, `ENTITY_TYPES`, `L1_TOPICS`, `TABS`, `TREND_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Entities Assessed | — | Platform | Across 3 entity types |
| Avg Score | — | Aggregation | Platform-wide average |

## 5 · Intermediate Transformation Logic
**Methodology:** Platform-wide KPI aggregation
**Headline formula:** `Aggregates across all assessed entities and all taxonomy topics`
**Standards:** ['All platform modules']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).