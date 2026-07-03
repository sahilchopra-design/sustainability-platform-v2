# Board Climate Competence
**Module ID:** `board-climate-competence` · **Route:** `/board-climate-competence` · **Tier:** B (frontend-computed) · **EP code:** EP-CP5 · **Sprint:** CP

## 1 · Overview
25 companies with director-level climate expertise scoring, climate committee status, and peer benchmarking.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sectors` | `[...new Set(COMPANIES.map(c => c.sector))];` |
| `avgScore` | `filtered.length ? Math.round(filtered.reduce((s, c) => s + c.score, 0) / filtered.length) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Companies | — | Governance data | With board-level climate data |
| Avg Competence Score | — | Assessment | Significant room for improvement |

## 5 · Intermediate Transformation Logic
**Methodology:** Board climate competence scoring
**Headline formula:** `Score = Expertise(30) + Committee(25) + Training(20) + Diversity(15) + Accountability(10)`
**Standards:** ['UK Corporate Governance Code', 'TCFD']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).