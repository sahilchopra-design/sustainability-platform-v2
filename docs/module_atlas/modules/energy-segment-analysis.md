# Energy Segment Analysis
**Module ID:** `energy-segment-analysis` · **Route:** `/energy-segment-analysis` · **Tier:** B (frontend-computed) · **EP code:** EP-CU2 · **Sprint:** CU

## 1 · Overview
Upstream, midstream, downstream segment decomposition with revenue, EBITDA, CapEx, and transition score per segment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CROSS_SEGMENT`, `DOWNSTREAM_DETAIL`, `MIDSTREAM_DETAIL`, `REVENUE_TREND`, `SEGMENTS`, `SEG_COLORS`, `TABS`, `TRANSITION_RADAR`, `UPSTREAM_DETAIL`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Segment Overview','Upstream (E&P)','Midstream (Transport)','Downstream (Refining+Retail)','Cross-Segment Metrics','Transition Readiness'];` |
| `cost` | `(SEGMENTS[s].emissions_mt * carbonPrice / 1000).toFixed(2);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REVENUE_TREND`, `TABS`, `TRANSITION_RADAR`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Segments | — | Organizational | Upstream, midstream, downstream, renewables, retail |

## 5 · Intermediate Transformation Logic
**Methodology:** Segment P&L decomposition
**Headline formula:** `Transition_score per segment = taxonomy assessment weighted by segment revenue`
**Standards:** ['IEA', 'Company filings']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).