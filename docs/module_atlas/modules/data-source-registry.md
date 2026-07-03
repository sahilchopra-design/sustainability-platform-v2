# Data Source Registry
**Module ID:** `data-source-registry` · **Route:** `/data-source-registry` · **Tier:** B (frontend-computed) · **EP code:** EP-CS3 · **Sprint:** CS

## 1 · Overview
24 reference data sources with quality monitoring, coverage gap identification, and new source recommendations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DQ_COLORS`, `DQ_LABELS`, `INTEGRATION_LOG`, `RECOMMENDED_SOURCES`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `status` | `statuses[Math.floor(sr(i * 7) * 5)];` |
| `refreshData` | `useMemo(() => REFERENCE_DATA_SOURCES.map((s, i) => {` |
| `freq` | `freqs[Math.floor(sr(i * 7) * 5)];` |
| `daysAgo` | `Math.floor(sr(i * 11) * 90);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `RECOMMENDED_SOURCES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sources | — | Registry | CDP, SBTi, IEA, WRI GPPD, etc. |
| Avg Quality | — | PCAF scale | 1=best, 5=worst |

## 5 · Intermediate Transformation Logic
**Methodology:** Data quality assessment
**Headline formula:** `DQ_composite = avg(completeness, timeliness, accuracy, coverage)`
**Standards:** ['PCAF DQ 1-5']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).